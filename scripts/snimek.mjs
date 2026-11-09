import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import path from 'node:path';

// Snímek libovolného místa mapy pro ladění: node scripts/snimek.mjs <výstup.png> a b [zoom] [a b zoom výstup …]
// Po npm run build; kamera se postaví na dlaždici (a, b), lišta spí. Nad dev serverem BASE=http://localhost:5173/.
// Jiné místo než Hlavák: PLACE=vaclavak node scripts/snimek.mjs …
const ROOT = path.resolve(new URL('.', import.meta.url).pathname, '..');
const PORT = 4175;
const BASE = process.env.BASE ?? `http://localhost:${PORT}/`;
const args = process.argv.slice(2);
const shots = [];
for (let i = 0; i + 2 < args.length; i += 4) shots.push({ out: args[i], a: Number(args[i + 1]), b: Number(args[i + 2]), zoom: Number(args[i + 3] ?? 1) || 1 });
let server = null;
if (!process.env.BASE) {
    server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { cwd: ROOT, stdio: 'ignore' });
    const started = Date.now();
    while (Date.now() - started < 15000) { try { await fetch(BASE); break; } catch { await new Promise((r) => setTimeout(r, 200)); } }
}
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
const run = (fn, ...a) => page.evaluate(([src, x]) => (new Function('args', `return (${src})(...args)`))(x), [fn.toString(), a]);
await page.goto(BASE);
await page.waitForFunction(() => window.konecna?.scene.isActive('title'), null, { timeout: 30000 });
await run(() => { const t = window.konecna.scene.getScene('title'); t.ready = true; t.start(); });
await page.waitForFunction(() => window.konecna.scene.isActive('cutscene'));
await run(() => window.konecna.scene.getScene('cutscene').finish());
await page.waitForFunction(() => window.konecna.scene.isActive('world') && window.konecna.scene.isActive('hud'));
await page.waitForTimeout(400);
if (process.env.PLACE) {
    await run((p) => { const g = window.konecna; g.registry.get('state').place = p; g.scene.stop('hud'); g.scene.start('world'); }, process.env.PLACE);
    await page.waitForFunction((p) => { const w = window.konecna.scene.getScene('world'); return window.konecna.scene.isActive('world') && w.map?.place === p && w.player; }, process.env.PLACE, { timeout: 60000 });
    await page.waitForTimeout(600);
}
await run(() => { const w = window.konecna.scene.getScene('world'); w.cameras.main.stopFollow(); window.konecna.scene.sleep('hud'); });
for (const s of shots) {
    await run((a, b, z) => { const w = window.konecna.scene.getScene('world'); w.cameras.main.setZoom(z); const c = w.center({ a, b }); w.cameras.main.centerOn(c.x, c.y); }, s.a, s.b, s.zoom);
    await page.waitForTimeout(300);
    await page.screenshot({ path: s.out });
    console.log(s.out);
}
await browser.close();
server?.kill();
