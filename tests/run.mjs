import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

// Automatický průchod hrou v headless Chromiu nad sestavenou verzí (vite preview): titulek, filmeček, svět, chůze, deník.
// Spouští npm test (vite build && node tests/run.mjs). Snímky jdou do tests/shots, chyby z konzole se vypíšou na konci.
// Hra je na window.konecna, scény jdou řídit z konzole; průchod neklepe naslepo, čeká na stav scény.
const ROOT = path.resolve(new URL('.', import.meta.url).pathname, '..');
const PORT = 4173;
const BASE = process.env.BASE ?? `http://localhost:${PORT}/`;
const OUT = process.env.OUT ?? path.join(ROOT, 'tests/shots');
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

let server = null;
if (!process.env.BASE) {
    server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { cwd: ROOT, stdio: 'ignore' });
    const started = Date.now();
    while (Date.now() - started < 15000) {
        try { await fetch(BASE); break; } catch (error) { await new Promise((r) => setTimeout(r, 200)); }
    }
}

const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
const page = await context.newPage();
const logs = [];
page.on('console', (m) => { if (m.type() !== 'log') logs.push(`[${m.type()}] ${m.text()}`); });
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));

const run = (fn, ...args) => page.evaluate(([src, a]) => (new Function('args', `return (${src})(...args)`))(a), [fn.toString(), args]);
const shot = (name) => page.screenshot({ path: `${OUT}/${name}.png` });
const waitScene = (key) => page.waitForFunction((k) => window.konecna?.scene.isActive(k), key, { timeout: 15000 });
const state = () => run(() => JSON.stringify(window.konecna.registry.get('state')));
const tile = () => run(() => window.konecna.scene.getScene('world').tile);
const waitStill = () => page.waitForFunction(() => { const w = window.konecna.scene.getScene('world'); return !w.moving && !w.path.length; }, null, { timeout: 20000 });
const cutsceneThrough = async () => { await waitScene('cutscene'); await page.waitForTimeout(500); for (let i = 0; i < 40 && await run(() => window.konecna.scene.isActive('cutscene')); i++) { await page.keyboard.press('Enter'); await page.waitForTimeout(350); } };

let failed = false;
try {
    await page.goto(BASE);
    await waitScene('title');
    await page.waitForFunction(() => window.konecna.scene.getScene('title').ready, null, { timeout: 15000 });
    await page.waitForTimeout(800);
    await shot('01-title');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1200);
    await shot('02-intro');
    await cutsceneThrough();
    await waitScene('world');
    await waitScene('hud');
    await page.waitForTimeout(600);
    await shot('03-world');
    console.log('start', JSON.stringify(await tile()));

    // Chůze klepnutím: cíl o pár dlaždic dál, kontrola, že hrdinka došla.
    await run(() => window.konecna.scene.getScene('world').goTo({ a: 8, b: 7 }));
    await waitStill();
    const after = await tile();
    console.log('after click', JSON.stringify(after));
    if (after.a !== 8 || after.b !== 7) throw new Error(`chůze klepnutím nedošla: ${JSON.stringify(after)}`);
    await shot('04-walked');

    // Voda je neprůchozí: cesta do ní je prázdná.
    const blocked = await run(() => { const w = window.konecna.scene.getScene('world'); w.goTo({ a: 8, b: 12 }); return w.path.length; });
    if (blocked !== 0) throw new Error('cesta do vody nemá být možná');

    // Šipka: držená klávesa posune o dlaždici.
    await page.keyboard.down('ArrowRight'); await page.waitForTimeout(500); await page.keyboard.up('ArrowRight');
    await waitStill();
    const keyed = await tile();
    console.log('after key', JSON.stringify(keyed));
    if (keyed.a === after.a && keyed.b === after.b) throw new Error('šipka nepohnula hrdinkou');

    // Deník otevřít a zavřít klávesou Q.
    await page.keyboard.press('q'); await page.waitForTimeout(300); await shot('05-journal');
    const open = await run(() => Boolean(window.konecna.scene.getScene('hud').quests));
    if (!open) throw new Error('deník se neotevřel');
    await page.keyboard.press('q'); await page.waitForTimeout(200);

    // Dialog přes HUD API: replika a volba, výběr klávesou 2.
    await run(() => { const hud = window.konecna.scene.getScene('hud'); window.__choice = hud.choose('Řidič', 'Konečná. Nevystupovat.', [{ label: 'Vystoupím.' }, { label: 'Zůstanu sedět.' }, { label: 'Skrytá volba', disabled: true }], 'face_hero'); });
    await page.waitForFunction(() => window.konecna.scene.getScene('hud').panel, null, { timeout: 5000 });
    await shot('06-dialog');
    await page.keyboard.press('2'); await page.waitForTimeout(200);
    const choice = await run(() => window.__choice);
    if (choice !== 1) throw new Error(`volba vrátila ${choice}, čekáno 1`);

    // Checkpoint v localStorage a konec smrtí s nabídkou návratu.
    const saved = await run(() => Boolean(localStorage.getItem('konecna.save')));
    if (!saved) throw new Error('checkpoint se neuložil');
    await run(() => window.konecna.scene.getScene('world').die());
    await waitScene('ending');
    await page.waitForTimeout(500);
    await shot('07-death');
    console.log('final', await state());
} catch (e) {
    failed = true;
    console.log('FAILED', e.message);
    await shot('99-failure');
}
console.log(logs.length ? logs.join('\n') : 'no browser errors');
await browser.close();
server?.kill();
process.exit(failed || logs.some((l) => l.startsWith('[pageerror]') || l.startsWith('[error]')) ? 1 : 0);
