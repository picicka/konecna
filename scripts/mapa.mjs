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

// Každé místo zvlášť: Hlavák bez předpony (Z*, M*), další místa s předponou podle prvního písmene (Václavák VZ*, VM*).
// [klíč, popis, a, b]: zastavení místa (kamera na postavu) a pak mřížka přes celou mapu.
const list = [];
// Předpony: Hlavák bez, Václavák V, Nuselák N, Staromák S, most K (Karlův), Malá Strana MS, Hrad H.
const PREFIX = { hlavak: '', vaclavak: 'V', nuselak: 'N', staromak: 'S', most: 'K', malastrana: 'MS', hrad: 'H' };
for (const place of Object.keys(PREFIX)) {
    const prefix = PREFIX[place];
    await run((p) => { const g = window.konecna; g.registry.get('state').place = p; g.scene.stop('hud'); g.scene.start('world'); }, place);
    await page.waitForFunction((p) => { const w = window.konecna.scene.getScene('world'); return window.konecna.scene.isActive('world') && w.map?.place === p && w.player; }, place, { timeout: 60000 });
    await page.waitForTimeout(600);
    await run(() => { const w = window.konecna.scene.getScene('world'); w.cameras.main.stopFollow(); window.konecna.scene.sleep('hud'); });
    const shots = await run(() => {
        const w = window.konecna.scene.getScene('world');
        const items = Object.values(w.stops).map((s, i) => [`Z${i + 1}`, `Zastavení ${s.id}: ${s.npc.key} na ${s.npc.a},${s.npc.b}`, s.npc.a, s.npc.b]);
        [0.2, 0.5, 0.8].forEach((fa, i) => [0.3, 0.7].forEach((fb, j) => items.push([`M${i * 2 + j + 1}`, `Úsek a ${Math.round(fa * w.map.len)}, b ${Math.round(fb * w.map.wid)}`, Math.round(fa * w.map.len), Math.round(fb * w.map.wid)])));
        return items;
    });
    const placeList = [];
    for (const [key, caption, a, b] of shots) {
        await run((a, b) => { const w = window.konecna.scene.getScene('world'); w.cameras.main.setZoom(1); const c = w.center({ a, b }); w.cameras.main.centerOn(c.x, c.y); }, a, b);
        await page.waitForTimeout(300);
        await page.screenshot({ path: `${OUT}/${prefix}${key}.png` });
        placeList.push({ key: `${prefix}${key}`, caption, place });
    }
    await run(() => { const w = window.konecna.scene.getScene('world'); w.cameras.main.setZoom(Math.min(1280 / w.bounds.w, 720 / w.bounds.h) * 0.98); const c = w.center({ a: (w.map.len - 1) / 2, b: (w.map.wid - 1) / 2 }); w.cameras.main.centerOn(c.x, c.y); });
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${OUT}/${prefix}M0.png` });
    list.push({ key: `${prefix}M0`, caption: 'Celé místo z výšky (zmenšeno)', place }, ...placeList);
}
fs.writeFileSync(`${OUT}/list.json`, JSON.stringify(list, null, 2));
await import('./mapa-html.mjs');
console.log('done', list.length);
await browser.close();
server?.kill();
