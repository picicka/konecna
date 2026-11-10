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
const waitStill = () => page.waitForFunction(() => { const w = window.konecna.scene.getScene('world'); return !w.moving && !w.path.length; }, null, { timeout: 60000 });
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
    // Tvorba postavy: kým byla, než se to stalo, Oko +1 (klávesa 3).
    await page.waitForFunction(() => window.konecna.scene.getScene('hud').panel, null, { timeout: 10000 });
    await page.waitForTimeout(300);
    await shot('02b-tvorba');
    await page.keyboard.press('3');
    await page.waitForTimeout(300);
    const created = await run(() => { const st = window.konecna.registry.get('state'); return st.flags.created && st.attributes.oko === 2; });
    if (!created) throw new Error('tvorba postavy nepřidala Oko');
    await page.waitForTimeout(300);
    await shot('03-world');
    console.log('start', JSON.stringify(await tile()));

    // Cíle se hledají v datech mapy: průchozí dlaždice kousek od startu, voda (neprůchozí) a dům, za který jde zajít.
    const targets = await run(() => {
        const w = window.konecna.scene.getScene('world');
        const ISO = w.iso;
        const free = (a, b) => w.inside(a, b) && !w.blocked.has(`${a},${b}`);
        const reach = (t) => ISO.findPath(w.tile, t, { inside: (a, b) => w.inside(a, b), blocked: w.blocked }).length > 0;
        let walk = null;
        for (let r = 4; r < 12 && !walk; r++) for (let da = -r; da <= r && !walk; da++) for (let db = -r; db <= r && !walk; db++) {
            const t = { a: w.tile.a + da, b: w.tile.b + db };
            if (Math.abs(da) + Math.abs(db) >= r && free(t.a, t.b) && reach(t)) walk = t;
        }
        let water = null;
        for (let a = 0; a < w.map.len && !water; a++) for (let b = 0; b < w.map.wid && !water; b++) if (w.map.ground[a][b] === 'w') water = { a, b };
        let behind = null;
        for (const house of w.houses) {
            const { a0, b0, w: hw, dpt } = house.box;
            const candidates = [];
            for (let a = a0 - 1; a <= a0 + hw && !behind; a++) for (let b = b0 - 2; b < b0 + dpt; b++) candidates.push({ a, b });
            for (const t of candidates) {
                if (!free(t.a, t.b) || !reach(t)) continue;
                const c = ISO.toScreen(t.a, t.b);
                if (ISO.depthOf(t.a, t.b) < house.depth && house.getBounds().contains(c.x, c.y)) { behind = { t, house: w.houses.indexOf(house) }; break; }
            }
            if (behind) break;
        }
        return { walk, water, behind };
    });
    console.log('targets', JSON.stringify(targets));
    if (!targets.walk) throw new Error('nenašla se průchozí dlaždice kousek od startu');

    // Chůze klepnutím: kontrola, že hrdinka došla.
    await run((t) => window.konecna.scene.getScene('world').goTo(t), targets.walk);
    await waitStill();
    const after = await tile();
    console.log('after click', JSON.stringify(after));
    if (after.a !== targets.walk.a || after.b !== targets.walk.b) throw new Error(`chůze klepnutím nedošla: ${JSON.stringify(after)}`);
    await shot('04-walked');

    // Voda a půdorysy jsou neprůchozí: cesta do nich je prázdná.
    if (targets.water) {
        const blocked = await run((t) => { const w = window.konecna.scene.getScene('world'); w.goTo(t); return w.path.length; }, targets.water);
        if (blocked !== 0) throw new Error('cesta do vody nemá být možná');
    }

    // Šipka: držená klávesa posune o dlaždici (když je kam).
    await page.keyboard.down('ArrowRight'); await page.waitForTimeout(500); await page.keyboard.up('ArrowRight');
    await waitStill();
    const keyed = await tile();
    console.log('after key', JSON.stringify(keyed));

    // Dům před hrdinkou dostane otvor kolem ní, když ji zakryje, a zase zmizí, když odejde.
    if (targets.behind) {
        await run((t) => window.konecna.scene.getScene('world').goTo(t), targets.behind.t);
        await waitStill();
        const faded = await run((i) => Boolean(window.konecna.scene.getScene('world').houses[i].mask), targets.behind.house);
        console.log('hole behind', faded);
        if (!faded) throw new Error('dům před hrdinkou nedostal otvor');
        await shot('04b-behind-house');
        await run((t) => window.konecna.scene.getScene('world').goTo(t), targets.walk);
        await waitStill();
        const clear = await run((i) => !window.konecna.scene.getScene('world').houses[i].mask, targets.behind.house);
        if (!clear) throw new Error('dům si nechal otvor, i když hrdinku nezakrývá');
    } else console.log('žádný dům, za který by šlo zajít');

    // Horní úroveň: věží nahoru na magistrálu, po vozovce kolem vraků a po rampě zpátky na zem.
    await run(() => window.konecna.scene.getScene('world').goTo({ a: 40, b: 18, L: 1 }));
    // snímky během jízdy po točitém schodišti uvnitř tubusu
    await page.waitForFunction(() => window.konecna.scene.getScene('world').moving?.climb, null, { timeout: 20000 });
    for (let i = 0; i < 4; i++) { await page.waitForTimeout(520); await shot(`05-climb-${i}`); }
    const climbDepth = await run(() => { const w = window.konecna.scene.getScene('world'); return w.moving?.climb ? w.player.depth < w.moving.climb.sprite.depth : true; });
    await waitStill();
    const up = await tile();
    console.log('on deck', JSON.stringify(up));
    if (up.L !== 1 || up.a !== 40 || up.b !== 18) throw new Error(`nahoru se nedošlo: ${JSON.stringify(up)}`);
    await shot('05a-deck');
    // Magistrála je celá v jedné výšce: z konce estakády nevede cesta na zem, dolů jen věží.
    const edge = await run(() => { const w = window.konecna.scene.getScene('world'); return w.findPath({ a: 20, b: 17, L: 1 }, { a: 20, b: 24, L: 0 }).some((n, i, arr) => i > 0 && arr[i - 1].L === 1 && n.L === 0 && !w.towerAt(n)); });
    if (edge) throw new Error('z estakády se dá sejít jinudy než věží');
    // Dveře Fantovy budovy: z magistrály podchodem na nástupiště, dveře se otevřou.
    await run(() => window.konecna.scene.getScene('world').goTo({ a: 41, b: 15, L: 1 }));
    await waitStill();
    const atDoor = await tile();
    if (atDoor.a !== 41 || atDoor.b !== 15 || atDoor.L !== 1) throw new Error(`ke dveřím se nedošlo: ${JSON.stringify(atDoor)}`);
    await run(() => window.konecna.scene.getScene('world').goTo({ a: 41, b: 10, L: 0 }));
    for (let i = 0; i < 4; i++) { await page.waitForTimeout(160); await shot(`05d-door-${i}`); }
    await waitStill();
    const through = await tile();
    console.log('through door', JSON.stringify(through));
    if (through.b !== 10) throw new Error(`dveřmi se neprošlo: ${JSON.stringify(through)}`);
    await run(() => window.konecna.scene.getScene('world').goTo({ a: 43, b: 25, L: 0 }));
    await waitStill();
    const down = await tile();
    console.log('down the tower', JSON.stringify(down));
    if (down.L !== 0) throw new Error(`dolů se nedošlo: ${JSON.stringify(down)}`);
    const hole = await run(() => { const w = window.konecna.scene.getScene('world'); return w.findPath(w.tile, { a: 44, b: 17, L: 1 }).length; });
    if (hole) throw new Error('do propadliny nemá vést cesta');

    // Nádraží je průchozí: z plácku podchodem na nástupiště a zpátky.
    await run(() => window.konecna.scene.getScene('world').goTo({ a: 38, b: 10, L: 0 }));
    await waitStill();
    const platform = await tile();
    console.log('platform', JSON.stringify(platform));
    if (platform.a !== 38 || platform.b !== 10) throw new Error(`na nástupiště se nedošlo: ${JSON.stringify(platform)}`);
    await shot('05c-platform');

    // Zastavení: žádné problémy s přístupem k žádnému z nich.
    const problems = await run(() => window.konecna.scene.getScene('world').problems);
    if (problems.length) throw new Error(`zastavení: ${problems.join('; ')}`);

    // HUD: portrét a minimapa; klepnutí do minimapy pošle hrdinku na dlaždici.
    const mini = await run(() => { const h = window.konecna.scene.getScene('hud'); return h.minimap ? { ...h.toMini(16, 22) } : null; });
    if (!mini) throw new Error('minimapa chybí');
    const canvasBox = await page.evaluate(() => { const r = window.konecna.canvas.getBoundingClientRect(); return { x: r.left, y: r.top, s: r.width / 1280 }; });
    await page.mouse.click(canvasBox.x + mini.x * canvasBox.s, canvasBox.y + mini.y * canvasBox.s);
    await waitStill();
    const viaMini = await tile();
    console.log('via minimap', JSON.stringify(viaMini));
    if (Math.abs(viaMini.a - 16) > 1 || Math.abs(viaMini.b - 22) > 1) throw new Error(`klepnutí do minimapy nedošlo: ${JSON.stringify(viaMini)}`);
    await shot('05b-hud');
    // Mapa se dá schovat a zase ukázat klávesou M.
    await page.keyboard.press('m'); await page.waitForTimeout(150);
    const hidden = await run(() => !window.konecna.scene.getScene('hud').minimap.visible);
    await page.keyboard.press('m'); await page.waitForTimeout(150);
    const shown = await run(() => window.konecna.scene.getScene('hud').minimap.visible);
    if (!hidden || !shown) throw new Error(`mapa se neschovala a neukázala: ${hidden} ${shown}`);

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

    // Příběh: hlavní linka Hlaváku cestou bez boje (dopis, Fanta, hodinky, lahev pro Robina), odjezd soupravou
    // na Václavák, tam evidence, revizor a molo ke Kuřačce. Volby se vybírají číslem podle textu tlačítka; když volba
    // v seznamu chybí, vybere se poslední (Odejít, u nové úrovně Oko).
    const labels = () => run(() => (window.konecna.scene.getScene('hud').buttons ?? []).map((b) => b.caption.text));
    const panelOpen = () => run(() => Boolean(window.konecna.scene.getScene('hud').panel) || window.konecna.scene.isActive('battle'));
    const cards = {};
    const converse = async (id, picks, shotName) => {
        await run((s) => window.konecna.scene.getScene('world').goToStop(s), id);
        await page.waitForFunction(() => window.konecna.scene.getScene('hud').panel, null, { timeout: 90000 });
        if (shotName) { await page.waitForTimeout(200); await shot(shotName); }
        cards[id] = await run(() => Boolean(window.konecna.scene.getScene('hud').card));
        const queue = [...picks];
        for (let i = 0; i < 80; i++) {
            if (!(await panelOpen())) { await page.waitForTimeout(300); if (!(await panelOpen())) break; continue; }
            const list = await labels();
            if (!list.length) { await page.waitForTimeout(150); continue; }
            if (list.length === 1) await page.keyboard.press('Enter');
            else {
                let idx = queue.length ? list.findIndex((l) => l.replace(/\u00a0/g, ' ').includes(queue[0])) : -1;
                if (idx >= 0) queue.shift(); else idx = list.length - 1;
                await page.keyboard.press(String(idx + 1));
            }
            await page.waitForTimeout(220);
        }
        if (queue.length) throw new Error(`v rozhovoru ${id} chyběla volba: ${queue.join(', ')}`);
        console.log('talked', id, picks.join(' | '));
    };
    const st = async () => JSON.parse(await state());
    // Zkoušky vlastností jsou ze semínka hry; pevné semínko, ať průchod dopadne pokaždé stejně.
    await run(() => { window.konecna.registry.get('state').seed = 7; });
    await converse('nastupiste', ['Nesu vám dopis'], '08-stop-nastupiste');
    if ((await st()).quests.vypoved !== 'done') throw new Error('dopis se nedoručil');
    if (!cards.nastupiste) throw new Error('u rozhovoru chybí karta postavy');
    await converse('trafika', ['Na Hradě se zeptám'], '08-stop-trafika');
    await converse('trziste', ['Beru', 'Co máte na prodej', 'Hodinky', 'Lahev'], '08-stop-trziste');
    let s1 = await st();
    if (!s1.items.includes('zasilka') || !s1.items.includes('hodinky') || !s1.items.includes('lahev')) throw new Error(`od Fanty chybí věci: ${s1.items}`);
    await converse('nastupiste', ['Tady máte hodinky']);
    s1 = await st();
    if (s1.equip.zbran !== 'placacka' || s1.level < 2) throw new Error(`hodiny: zbraň ${s1.equip.zbran}, úroveň ${s1.level}`);
    // Obchod a výbava: brýle od trafikantky se samy nasadí a přidají Oko; taška (T) se otevře a zavře.
    // obchod je okno se zbožím: na co nejsou jízdenky, je zašedlé
    const ticketsBefore = await run(() => { const st = window.konecna.registry.get('state'); const n = st.tickets; st.tickets = 4; return n; });
    await run((s) => window.konecna.scene.getScene('world').goToStop(s), 'trafika');
    await page.waitForFunction(() => window.konecna.scene.getScene('hud').panel, null, { timeout: 60000 });
    for (let i = 0; i < 10; i++) {
        const l = await labels();
        const k = l.findIndex((x) => x.includes('Co prodáváte'));
        if (k >= 0) { await page.keyboard.press(String(k + 1)); break; }
        await page.keyboard.press('Enter'); await page.waitForTimeout(220);
    }
    await page.waitForTimeout(250);
    await shot('09-obchod');
    const wares = await run(() => window.konecna.scene.getScene('hud').buttons.map((b) => ({ t: b.caption.text, off: b.disabled })));
    if (!wares.some((w) => w.t.includes('Brýle') && w.off) || !wares.some((w) => w.t.includes('Obvaz') && !w.off)) throw new Error(`obchod: brýle za 6 mají být zašedlé, obvaz za 3 ne: ${JSON.stringify(wares)}`);
    await page.keyboard.press('Escape');
    await page.keyboard.press(String(wares.length)); await page.waitForTimeout(220);
    for (let i = 0; i < 6 && (await panelOpen()); i++) { const l = await labels(); await page.keyboard.press(l.length === 1 ? 'Enter' : String(l.length)); await page.waitForTimeout(220); }
    await run((n) => { window.konecna.registry.get('state').tickets = n; }, ticketsBefore);
    await converse('trafika', ['Co prodáváte', 'Brýle']);
    s1 = await st();
    const oko = await run(() => { const st = window.konecna.registry.get('state'); return st.attributes.oko + (st.equip.talisman === 'bryle' ? 1 : 0); });
    if (s1.equip.talisman !== 'bryle') throw new Error(`brýle se nenasadily: ${JSON.stringify(s1.equip)}`);
    await page.keyboard.press('t'); await page.waitForTimeout(300); await shot('09a-bag');
    if (!(await run(() => { const h = window.konecna.scene.getScene('hud'); return Boolean(h.quests) && h.tab === 'bag'; }))) throw new Error('taška se neotevřela');
    await page.keyboard.press('ArrowRight'); await page.waitForTimeout(200); await shot('09b-ukoly');
    await page.keyboard.press('ArrowRight'); await page.waitForTimeout(200); await shot('09c-duvera');
    await page.keyboard.press('Escape'); await page.waitForTimeout(200);
    if (await run(() => Boolean(window.konecna.scene.getScene('hud').quests))) throw new Error('deník se nezavřel');
    console.log('oko s brýlemi', oko);
    await converse('ohniste', ['Nesu lahev'], '08-stop-ohniste');
    // psi po lahvi zůstanou ležet u pěšiny (poražení a usmíření nemizí), dialog je v klidu
    // psi po lahvi odběhnou k Robinovu ohni a lehnou si tam (podoba after zastavení)
    await page.waitForTimeout(5000);
    const dogs = await run(() => { const w = window.konecna.scene.getScene('world'); const p = w.stops.psi; return p && { a: p.npc.a, b: p.npc.b, key: p.sprite.frame.name, visible: p.sprite.visible, ok: w.state.flags.psi_ok }; });
    console.log('psi', JSON.stringify(dogs));
    if (!dogs?.ok || dogs.a !== 48 || !dogs.key.startsWith('dog_lie') || !dogs.visible) throw new Error(`psi po lahvi mají ležet u Robina: ${JSON.stringify(dogs)}`);
    await shot('08-psi-u-robina');
    await shot('09-journal-hlavak');
    await converse('metro', ['Chci jet dál', 'Vím, kdy doopravdy', 'Krabičku od pana Fanty'], '08-stop-metro');
    await cutsceneThrough();
    await page.waitForFunction(() => window.konecna.scene.isActive('world') && window.konecna.registry.get('state').place === 'vaclavak' && window.konecna.scene.getScene('world').player, null, { timeout: 60000 });
    await page.waitForTimeout(800);
    await shot('10-vaclavak');
    const vstart = await tile();
    console.log('vaclavak start', JSON.stringify(vstart));
    const vproblems = await run(() => window.konecna.scene.getScene('world').problems);
    if (vproblems.length) throw new Error(`zastavení na Václaváku: ${vproblems.join('; ')}`);
    // Bez povolení revizora na molo cesta nevede.
    const closed = await run(() => { const w = window.konecna.scene.getScene('world'); return w.findPath(w.tile, w.stops.kuracka.approach).length; });
    if (closed) throw new Error('molo má být bez povolení zavřené');
    await converse('dispecerka', ['Zapište mě'], '11-stop-dispecerka');
    await converse('revizor', ['Tady je výpis'], '11-stop-revizor');
    await converse('kuracka', ['Odkud je tolik vody'], '11-stop-kuracka');
    const s2 = await st();
    if (!s2.flags.molo || !s2.flags.utrzek1 || s2.trust.metro < 2) throw new Error(`Václavák: ${JSON.stringify({ flags: s2.flags, trust: s2.trust })}`);
    // Boj: nutrie (deterministický), útočit, dokud neskončí.
    await run(() => { window.__fight = null; window.konecna.scene.getScene('world').fight('nutrie').then((r) => { window.__fight = r; }); });
    await waitScene('battle');
    await page.waitForTimeout(400);
    await shot('12-battle');
    for (let i = 0; i < 30 && await run(() => window.__fight === null); i++) { await page.keyboard.press('1'); await page.waitForTimeout(450); }
    const fightResult = await run(() => window.__fight);
    console.log('fight', fightResult);
    if (!['win', 'dead'].includes(fightResult)) throw new Error(`boj neskončil: ${fightResult}`);
    // Nutrie po výhře seskočí z reproduktoru na kraj vody (podoba after zastavení, přechod se přehraje).
    await run(() => { const w = window.konecna.scene.getScene('world'); w.state.flags.nutrie_pryc = true; w.refreshStops(); w.cameras.main.stopFollow(); w.cameras.main.centerOn(w.stops.reproduktor.sprite.x - 100, w.stops.reproduktor.sprite.y - 60); });
    await page.waitForTimeout(450); await shot('12b-nutrie-skok');
    await page.waitForTimeout(900); await shot('12c-nutrie-breh');
    const nut = await run(() => { const r = window.konecna.scene.getScene('world').stops.reproduktor; return { speaker: r.sprite.frame.name, nutrie: r.propSprites[0]?.frame.name, a: r.props[0]?.a }; });
    console.log('reproduktor', JSON.stringify(nut));
    if (nut.speaker !== 'reproduktor_prazdny' || !nut.nutrie?.startsWith('nutrie_breh')) throw new Error(`nutrie má sedět u vody: ${JSON.stringify(nut)}`);
    await run(() => { const w = window.konecna.scene.getScene('world'); w.cameras.main.startFollow(w.player, true, 0.12, 0.12); });

    // Dál po vodě a pěšky až ke konci Řád: Staromák (Admirála odmítne, po střechách Klementina), most (neteř odmítne,
    // mlynář nabije zásilku), Malá Strana (Kastelán vezme nahoru), Hrad (ochranka pustí s Kastelánem, čtečka přehraje).
    const arrive = async (place, name) => {
        await cutsceneThrough();
        await page.waitForFunction((p) => window.konecna.scene.isActive('world') && window.konecna.registry.get('state').place === p && window.konecna.scene.getScene('world').player, place, { timeout: 90000 });
        await page.waitForTimeout(800);
        await shot(name);
        const problems = await run(() => window.konecna.scene.getScene('world').problems);
        if (problems.length) throw new Error(`zastavení (${place}): ${problems.join('; ')}`);
        console.log(place, 'start', JSON.stringify(await tile()));
    };
    await converse('kuracka', ['Vezmete mě na Staromák']);
    await arrive('staromak', '13-staromak');
    await converse('tyn', [], '14-stop-tyn');
    await converse('potapecka', ['Odkud přišla', 'Dispečerka mi', 'Máte pro mě'], '14-stop-potapecka');
    await converse('admiral', ['Nesu poštu', 'Listovní tajemství'], '14-stop-admiral');
    await converse('orlojnik', ['Jak se dostanu po střechách'], '14-stop-orlojnik');
    await converse('karlova', ['Po střechách']);
    await arrive('most', '15-most');
    await converse('pilar', ['Ne. Nesu', 'Co prodáváte', 'Benzínová směs'], '16-stop-pilar');
    await converse('netere', ['Kolik dáte', 'Nesu to na Hrad'], '16-stop-netere');
    await converse('hlidac', ['Proč tu zůstal'], '16-stop-hlidac');
    await converse('kanci', ['Obejít je'], '16-stop-kanci');
    await converse('mlynar', ['Přehradím', 'Do toho', 'Můžete nabít'], '16-stop-mlynar');
    const s3 = await st();
    if (!s3.flags.nabito || !s3.items.includes('zasilka') || !s3.flags.odmitla_netere) throw new Error(`most: ${JSON.stringify({ flags: s3.flags, items: s3.items })}`);
    await converse('mostecka', ['Jít na Malou Stranu']);
    await arrive('malastrana', '17-malastrana');
    const thugs = await run(() => Boolean(window.konecna.scene.getScene('world').stops.vymahaci));
    if (!thugs) throw new Error('po odmítnutí neteře mají čekat vymahači');
    await converse('pani', ['Co se stalo tu noc'], '18-stop-pani');
    await converse('velvyslanec', ['Nesu zprávy'], '18-stop-velvyslanec');
    await converse('straz', ['Nemáte hlad'], '18-stop-straz');
    await converse('kastelan', ['Vezmete mě nahoru'], '18-stop-kastelan');
    await arrive('hrad', '19-hrad');
    await converse('pruvodkyne', ['Co je v té buňce', 'Kdy přijde důchod'], '20-stop-pruvodkyne');
    await converse('ochranka', ['Jdu s Kastelánem'], '20-stop-ochranka');
    await converse('reditel', ['Podepsal jste'], '20-stop-reditel');
    await converse('ctecka', ['Zapojit krabičku']);
    await waitScene('cutscene');
    await page.waitForTimeout(600);
    await shot('21-konec-film');
    await cutsceneThrough();
    await waitScene('ending');
    await page.waitForTimeout(500);
    const endingResult = await run(() => window.konecna.scene.getScene('ending').result);
    await shot('22-konec');
    console.log('ending', endingResult);
    if (endingResult !== 'metro') throw new Error(`konec má být Řád (metro), je ${endingResult}`);

    // Checkpoint v localStorage a konec smrtí s nabídkou návratu (z checkpointu na Hradě).
    const saved = await run(() => Boolean(localStorage.getItem('konecna.save')));
    if (!saved) throw new Error('checkpoint se neuložil');
    await run(() => { const g = window.konecna; g.registry.set('state', JSON.parse(localStorage.getItem('konecna.save'))); g.scene.stop('ending'); g.scene.start('world'); });
    await page.waitForFunction(() => window.konecna.scene.isActive('world') && window.konecna.scene.getScene('world').player, null, { timeout: 60000 });
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
