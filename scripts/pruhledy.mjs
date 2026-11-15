import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import path from 'node:path';

// Kontrola průhledů v domech (WorldScene.fadeHouses, markStopHoles): npm run pruhledy [-- --misto <místo>] [-v]
// Po npm run build. Na každém místě postaví hrdinku postupně na vzorek dosažitelných dlaždic a ověří tři věci:
//   A  dům nakreslený ZA hrdinkou nesmí mít otvor kolem ní (chyba: stojí před domem a ten se zprůhlední),
//   B  dům, který hrdinku zakrývá aspoň z 30 %, otvor mít musí (chyba: hrdinka zmizí za domem),
//   C  postava zastavení zakrytá domem aspoň z 30 % musí mít v tom domě vlastní otvor.
// Zakrytí se měří na bodech obrázku (neprůhledné body domu přes body postavy), ne podle pravidel hry, takže skript
// chytí i chybu v pravidlech. Končí kódem 1, když něco najde. Nad dev serverem BASE=http://localhost:5173/.
const ROOT = path.resolve(new URL('.', import.meta.url).pathname, '..');
const PORT = 4176;
const BASE = process.env.BASE ?? `http://localhost:${PORT}/`;
const argv = process.argv.slice(2);
const only = argv.includes('--misto') ? argv[argv.indexOf('--misto') + 1] : null;
const verbose = argv.includes('-v');
const PLACES = ['hlavak', 'vaclavak', 'nuselak', 'staromak', 'most', 'malastrana', 'hrad'].filter((p) => !only || p === only);
let server = null;
if (!process.env.BASE) {
    server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { cwd: ROOT, stdio: 'ignore' });
    const started = Date.now();
    while (Date.now() - started < 15000) { try { await fetch(BASE); break; } catch { await new Promise((r) => setTimeout(r, 200)); } }
}
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
let total = 0;
for (const place of PLACES) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
    await page.goto(`${BASE}?misto=${place}`);
    await page.waitForFunction(() => window.konecna?.scene.isActive('world') && window.konecna.scene.getScene('world').player, null, { timeout: 90000 });
    await page.waitForTimeout(1200);
    const out = await page.evaluate(() => {
        const w = window.konecna.scene.getScene('world');
        // dosažitelné dlaždice ze startu (úroveň 0), vzorek nejvýš 160 rovnoměrně
        const seen = new Map(), queue = [[w.tile.a, w.tile.b]];
        seen.set(`${w.tile.a},${w.tile.b}`, [w.tile.a, w.tile.b]);
        while (queue.length) {
            const [a, b] = queue.shift();
            for (const [da, db] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const k = `${a + da},${b + db}`; if (!seen.has(k) && w.walkable(a + da, b + db, 0)) { seen.set(k, [a + da, b + db]); queue.push([a + da, b + db]); } }
        }
        const all = [...seen.values()], step = Math.max(1, Math.floor(all.length / 160));
        const tiles = all.filter((_, i) => i % step === 0);
        const body = (sp) => { const b = sp.getBounds(), pts = []; for (let x = b.x + 2; x < b.right; x += 3) for (let y = b.y + 2; y < b.bottom; y += 3) if (w.solidAt(sp, x, y)) pts.push([x, y]); return pts; };
        const cover = (house, pts) => (pts.length ? pts.filter(([x, y]) => w.solidAt(house, x, y)).length / pts.length : 0);
        const name = (h) => `${h.lmKey ?? h.frame.name} (a ${h.box.a0}, b ${h.box.b0})`;
        const errors = [];
        for (const [a, b] of tiles) {
            w.tile = { L: 0, a, b }; w.moving = null;
            const q = w.pos(a, b, 0); w.player.setPosition(q.x, q.y); w.player.setDepth(w.playerDepth(w.tile));
            w.markStopHoles();
            const pts = body(w.player);
            for (const h of w.houses) {
                const heroHole = h.mask === w.hole || h.mask === w.holeBoth;
                if (heroHole && h.depth <= w.player.depth) errors.push(`A  ${a},${b}: dům ${name(h)} je za hrdinkou, a má kolem ní otvor`);
                else if (!heroHole && h.depth > w.player.depth && h.alpha > 0.9) { const c = cover(h, pts); if (c >= 0.3) errors.push(`B  ${a},${b}: dům ${name(h)} zakrývá hrdinku z ${Math.round(c * 100)} % a otvor nemá`); }
            }
        }
        // postavy zastavení (hrdinka zpátky na startu, aby její otvor nepomáhal)
        const [sa, sb] = all[0]; w.tile = { L: 0, a: sa, b: sb }; const q = w.pos(sa, sb, 0); w.player.setPosition(q.x, q.y); w.player.setDepth(w.playerDepth(w.tile)); w.markStopHoles();
        for (const [key, stop] of Object.entries(w.stops)) {
            const sp = stop.sprite; if (!sp || !sp.visible || sp.alpha < 0.5 || (stop.npc.L ?? 0) !== 0) continue;
            const pts = body(sp);
            for (const h of w.houses) {
                const stopHole = h.mask === w.holeStops || h.mask === w.holeBoth;
                if (!stopHole && h.depth > sp.depth && h.alpha > 0.9) { const c = cover(h, pts); if (c >= 0.3) errors.push(`C  zastavení ${key} (${stop.npc.a},${stop.npc.b}): dům ${name(h)} zakrývá postavu z ${Math.round(c * 100)} % a otvor nemá`); }
            }
        }
        return { tiles: tiles.length, reachable: all.length, houses: w.houses.length, stops: Object.keys(w.stops).length, errors };
    });
    const kinds = { A: 0, B: 0, C: 0 }; out.errors.forEach((e) => { kinds[e[0]]++; });
    console.log(`${out.errors.length ? '✗' : '✓'} ${place}: ${out.tiles} dlaždic z ${out.reachable} dosažitelných, ${out.houses} domů, ${out.stops} zastavení${out.errors.length ? ` | chyb A ${kinds.A}, B ${kinds.B}, C ${kinds.C}` : ''}`);
    (verbose ? out.errors : out.errors.slice(0, 6)).forEach((e) => console.log(`    ${e}`));
    if (!verbose && out.errors.length > 6) console.log(`    … a dalších ${out.errors.length - 6} (-v vypíše všechny)`);
    total += out.errors.length;
    await page.close();
}
await browser.close();
server?.kill();
console.log(total ? `\nprůhledy: ${total} chyb` : '\nprůhledy v pořádku');
process.exit(total ? 1 : 0);
