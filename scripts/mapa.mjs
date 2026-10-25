import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

// Snímky mapy po úsecích pro ladění vzhledu: kamera se posouvá po světě, lišta spí. Výstup docs/mapa/*.png + list.json.
// Spuštění: npm run build && npm run mapa (nebo BASE=http://localhost:5173/ npm run mapa nad dev serverem).
const ROOT = path.resolve(new URL('.', import.meta.url).pathname, '..');
const PORT = 4174;
const BASE = process.env.BASE ?? `http://localhost:${PORT}/`;
const OUT = path.join(ROOT, 'docs/mapa');
fs.mkdirSync(OUT, { recursive: true });
let server = null;
if (!process.env.BASE) {
    server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { cwd: ROOT, stdio: 'ignore' });
    const started = Date.now();
    while (Date.now() - started < 15000) { try { await fetch(BASE); break; } catch (error) { await new Promise((r) => setTimeout(r, 200)); } }
}
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
const run = (fn, ...args) => page.evaluate(([src, a]) => (new Function('args', `return (${src})(...args)`))(a), [fn.toString(), args]);
await page.goto(BASE);
await page.waitForFunction(() => window.konecna?.scene.isActive('title'), null, { timeout: 30000 });
await run(() => { const t = window.konecna.scene.getScene('title'); t.ready = true; t.start(); });
await page.waitForFunction(() => window.konecna.scene.isActive('cutscene'));
await run(() => window.konecna.scene.getScene('cutscene').finish());
await page.waitForFunction(() => window.konecna.scene.isActive('world') && window.konecna.scene.isActive('hud'));
await page.waitForTimeout(400);
await run(() => { const w = window.konecna.scene.getScene('world'); w.cameras.main.stopFollow(); window.konecna.scene.sleep('hud'); });

// [klíč, popis, a, b] – úseky zkušebního plácku; se skutečnými místy se seznam přepíše.
const shots = [
    ['M1', 'Začátek plácku: tráva, chodník, ulice, hrdinka', 4, 6],
    ['M2', 'Střed: mozaika a voda vpravo dole', 12, 7],
    ['M3', 'Konec plácku', 20, 7],
];
const list = [];
for (const [key, caption, a, b] of shots) {
    await run((a, b) => { const w = window.konecna.scene.getScene('world'); const c = w.center({ a, b }); w.cameras.main.centerOn(c.x, c.y); }, a, b);
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${OUT}/${key}.png` });
    list.push({ key, caption });
}
await run(() => { const w = window.konecna.scene.getScene('world'); w.cameras.main.setZoom(0.5); const c = w.center({ a: 12, b: 7 }); w.cameras.main.centerOn(c.x, c.y); });
await page.waitForTimeout(300);
await page.screenshot({ path: `${OUT}/M0.png` });
list.unshift({ key: 'M0', caption: 'Celý plácek z výšky (zmenšeno)' });
fs.writeFileSync(`${OUT}/list.json`, JSON.stringify(list, null, 2));
console.log('done', list.length);
await browser.close();
server?.kill();
