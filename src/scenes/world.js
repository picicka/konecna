import Phaser from 'phaser';
import * as ISO from '../iso';
import { ensureWalk, CRT } from '../ui';
import { save, maxHp } from '../state';
import { PLACES, PLACE_DEFS, groundTile, walkable, startTile, TRAM_ORIGIN } from '../map';
import { runDialog, holds } from '../story';
import { CUTSCENES } from '../script';
import art from '../../art/version.json';

// Svět: mapa místa z dat (src/map.js, data/<místo>.json z OpenStreetMap), domy z generátoru (atlasy houses_<místo>_0–3),
// ručně kreslený landmark a oblouky hal (atlas landmarks), rekvizity a zastavení s postavami (src/places/<místo>.js),
// hrdinka, chůze klepnutím a šipkami, kamera. Dvě výškové úrovně: L 0 země, L 1 horní (vozovka magistrály na střeše haly
// a nájezdové rampy); přechody jsou prosklené věže a konce ramp. Uzel cesty je { a, b, L }. Pravidla, která platí od začátku:
// - každé zastavení má přístupovou dlaždici; při startu se kontroluje, že je průchozí a dosažitelná ze startu;
// - hloubka je vždy ISO.depthOf / ISO.boxDepth, žádné výjimky po jednom; kvádr, který zakryje hrdinku, zprůhlední;
// - postavy a rekvizity stojí na ISO.foot(a, b) s počátkem dole uprostřed;
// - po zavření dialogu this.input.keyboard.resetKeys(), jinak Enter z poslední repliky hned znovu spustí rozhovor;
// - všechno herní se resetuje v init/create, Phaser drží instanci scény mezi restarty.
const SPEED = 180; // bodů za vteřinu
const UPPER_DEPTH = 60000; // horní úroveň se kreslí nad vším na zemi (hala pod ní, Fantova budova za ní)
const k3 = (a, b, L) => `${a},${b},${L}`;

export class WorldScene extends Phaser.Scene {
    constructor() {
        super('world');
    }

    init() {
        this.state = this.registry.get('state');
        this.map = PLACES[this.state.place] ?? PLACES.hlavak;
        this.def = PLACE_DEFS[this.state.place] ?? PLACE_DEFS.hlavak;
        // Pro průchody a ladění z konzole.
        this.iso = ISO;
        this.busy = false;
        this.path = [];
        this.moving = null;
        this.pendingTalk = null;
        this.blocked = new Set();
        this.reserved = new Set();
        this.houses = [];
        this.stops = {};
        this.problems = [];
        this.upper = new Map(); // klíč a,b → výška horní úrovně
        this.upperBlocked = new Set();
        this.links = new Map();
        this.towers = new Map(); // klíč dlaždice věže → { sprite, top }
        this.tunnels = new Set(); // dvojice uzlů spojené podchodem
        this.tunnelDoors = new Map(); // dvojice uzlů → id animovaných dveří
    }

    // Grafika místa (díly země ground_<místo>_<n>, domy houses_<místo>_<n>) se nahraje až při vstupu na místo a grafika
    // ostatních míst se uvolní, aby v paměti nebyla celá Praha najednou. Verze z art/version.json v adrese jako v BootScene.
    preload() {
        const options = this.registry.get('options');
        const v = `?v=${art.version}`;
        const keys = [...Array.from({ length: this.map.groundChunks?.sheets ?? 0 }, (_, s) => `ground_${this.map.place}_${s}`), ...Array.from({ length: this.map.houseSheets ?? 0 }, (_, s) => `houses_${this.map.place}_${s}`)];
        Object.keys(PLACES).filter((p) => p !== this.map.place).forEach((p) => this.textures.getTextureKeys().filter((k) => k.startsWith(`ground_${p}_`) || k.startsWith(`houses_${p}_`)).forEach((k) => this.textures.remove(k)));
        keys.filter((k) => !this.textures.exists(k)).forEach((k) => this.load.atlas(k, `${options.images}/${k}.png${v}`, `${options.images}/${k}.json${v}`));
    }

    create() {
        this.cameras.main.setBackgroundColor(CRT.bg);
        this.scene.launch('hud');
        this.hud = this.scene.get('hud');
        this.buildGround();
        this.placeHouses();
        this.placeLandmark();
        this.buildUpper();
        this.placeTrains();
        this.placeRoofs();
        this.placeRibs();
        this.placeStops();
        this.placeProps();
        this.drawShadows();
        this.refreshGates();
        // Příchod: z jiného místa na jeho přestupní dlaždici (arrivals), jinak na start místa.
        this.spawnPlayer({ L: 0, ...(this.def?.arrivals?.[this.state.arrival] ?? this.def?.start ?? startTile(this.map)) });
        this.checkStops();
        this.fadeHouses();
        this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
        // Ladění obrazu jako Fallout 1 a 2: méně sytosti, nižší jas, víc kontrastu, tmavé okraje (jen kamera světa, lišta ne).
        if (this.cameras.main.postFX) {
            const grade = this.cameras.main.postFX.addColorMatrix();
            grade.saturate(-0.3);
            grade.brightness(0.78, true);
            grade.contrast(0.18, true);
            // teplý prachový posun: víc červené, méně modré (Fallout je hnědoolivový, ne šedý)
            const warm = this.cameras.main.postFX.addColorMatrix();
            warm.set([1.08, 0.02, 0, 0, 0.015, 0, 1.0, 0, 0, 0.008, 0, 0, 0.8, 0, 0, 0, 0, 0, 1, 0]);
            this.cameras.main.postFX.addVignette(0.5, 0.5, 0.95, 0.4);
        }
        this.input.on('pointerdown', (pointer) => this.onPointer(pointer));
        this.cursors = this.input.keyboard.createCursorKeys();
        this.input.keyboard.addCapture(['UP', 'DOWN', 'LEFT', 'RIGHT']);
        // Checkpoint: příchod na místo ukládá stav.
        this.state.visited[this.state.place] = true;
        save(this.state);
    }

    inside(a, b) {
        return a >= 0 && a < this.map.len && b >= 0 && b < this.map.wid;
    }

    center(tile) {
        return ISO.toScreen(tile.a, tile.b);
    }

    free(a, b) {
        return this.inside(a, b) && !this.blocked.has(ISO.key(a, b));
    }

    walkable(a, b, L = 0) {
        if (L === 0) return this.free(a, b);
        return this.upper.has(ISO.key(a, b)) && !this.upperBlocked.has(ISO.key(a, b));
    }

    height(a, b, L = 0) {
        return L === 1 ? this.upper.get(ISO.key(a, b)) ?? 0 : 0;
    }

    pos(a, b, L = 0) {
        const p = ISO.foot(a, b);
        return { x: p.x, y: p.y - this.height(a, b, L) };
    }

    depthAt(a, b, L = 0, lift = 0) {
        return ISO.depthOf(a, b, lift) + (L === 1 ? UPPER_DEPTH : 0);
    }

    link(p, q) {
        [[p, q], [q, p]].forEach(([x, y]) => {
            const key = k3(x.a, x.b, x.L);
            if (!this.links.has(key)) this.links.set(key, []);
            this.links.get(key).push(y);
        });
    }

    // Horní úroveň: vozovka (pevná výška), rampy (výška roste podél a), propadliny, vraky; přechody věžemi a konci ramp.
    buildUpper() {
        const up = this.def?.upper;
        if (!up) return;
        const H = up.height ?? 142;
        const { deck } = up;
        for (let a = deck.a0; a <= deck.a1; a++) for (let b = deck.b0; b <= deck.b1; b++) this.upper.set(ISO.key(a, b), H);
        up.ramps.forEach((r) => {
            const n = r.a1 - r.a0 + 1;
            for (let a = r.a0; a <= r.a1; a++) for (let b = r.b0; b <= r.b1; b++) {
                const t = r.rise > 0 ? (a - r.a0 + 0.5) / n : (r.a1 - a + 0.5) / n;
                this.upper.set(ISO.key(a, b), Math.round(H * t));
            }
            const low = r.rise > 0 ? r.a0 : r.a1, ground = r.rise > 0 ? r.a0 - 1 : r.a1 + 1;
            for (let b = r.b0; b <= r.b1; b++) if (this.free(ground, b)) this.link({ a: low, b, L: 1 }, { a: ground, b, L: 0 });
        });
        (up.holes ?? []).forEach(([a, b]) => this.upperBlocked.add(ISO.key(a, b)));
        (up.towers ?? []).forEach(({ tower, deck: top }) => {
            // dlaždice věže je průchozí na zemi (hrdinka vejde dovnitř a vyjede nahoru)
            this.blocked.delete(ISO.key(tower.a, tower.b));
            this.link({ ...tower, L: 0 }, { ...top, L: 1 });
            const sprite = this.houses.find((h) => h.box.a0 === tower.a && h.box.b0 === tower.b && h.box.w === 1);
            this.towers.set(ISO.key(tower.a, tower.b), { sprite, tower, top, height: H });
        });
        (up.wrecks ?? []).forEach((wk) => this.placeVehicle(wk.key, wk.a, wk.b, wk.len ?? 1, 1));
    }

    towerAt(n) {
        return n && n.L === 0 ? this.towers.get(ISO.key(n.a, n.b)) : null;
    }

    // Krok mezi dlaždicí věže (země) a vozovkou je jízda po točitém schodišti uvnitř tubusu.
    climbOf(from, to) {
        const t = this.towerAt(from) ?? this.towerAt(to);
        if (!t || from.L === to.L) return null;
        return { ...t, up: to.L === 1 };
    }

    // Hloubka hrdinky: ve věži za skleněnou stěnou (věž se kreslí před ní a zprůhlední), jinak podle dlaždice a úrovně.
    playerDepth(n) {
        const t = this.towerAt(n);
        return t?.sprite ? t.sprite.depth - 1 : this.depthAt(n.a, n.b, n.L);
    }

    // Poloha na točitém schodišti: dvě otáčky kolem osy věže (elipsa v izometrii), výška lineárně se stoupáním.
    spiral(t, climb) {
        const c = ISO.foot(climb.tower.a, climb.tower.b);
        const turns = 2;
        const angle = Math.PI / 2 + t * Math.PI * 2 * turns;
        return { x: c.x + Math.cos(angle) * 16, y: c.y - 6 + Math.sin(angle) * 8 - t * climb.height, back: Math.sin(angle) < 0 };
    }

    // Vozidlo podél osy a přes len dlaždic (vraky, vlaky): sprite na středu stopy, dlaždice neprůchozí, hloubka podle
    // nejvzdálenější dlaždice (věci před ním i vedle něj se kreslí přes něj).
    placeVehicle(key, a0, b, len, L = 0) {
        const mid = a0 + Math.floor((len - 1) / 2);
        const thing = this.placeThing(key, mid, b, { L, block: false });
        if (len % 2 === 0) { thing.x += ISO.TW / 4; thing.y -= ISO.TH / 4; }
        for (let a = a0; a < a0 + len; a++) (L === 1 ? this.upperBlocked : this.blocked).add(ISO.key(a, b));
        thing.setDepth(this.depthAt(a0 + len - 1, b, L));
        return thing;
    }

    // Střechy halových lodí: nad vším, co je pod nimi (hloubka nejbližší dlaždice půdorysu + 1), neblokují.
    // Přístřešky nad nástupišti mimo haly a trakční stožáry.
    placeRoofs() {
        this.roofs = (this.def?.sheds ?? []).map(({ key, a0, b0, w, dpt }) => {
            const texture = this.textures.getFrame('landmarks3', key);
            const anchor = this.center({ a: a0, b: b0 + dpt - 1 });
            const sprite = this.add.image(anchor.x, anchor.y + ISO.TH / 2, 'landmarks3', key).setOrigin((ISO.TW / 2) * dpt / texture.width, 1);
            sprite.setDepth(ISO.depthOf(a0, b0 + dpt - 1, 1));
            sprite.box = { a0, b0, w, dpt };
            return sprite;
        });
        const rule = this.def?.canopies;
        if (!rule) return;
        for (let a = 0; a < this.map.len; a++) for (let b = 0; b < this.map.wid; b++) {
            if (this.map.ground[a][b] !== 'n' || (a >= rule.outside[0] && a <= rule.outside[1])) continue;
            // přístřešky nad perony mimo haly (až po konec peronů), stožáry na peronech mezi nimi
            if (a <= (rule.until ?? this.map.len)) { const c = this.placeThing('canopy', a, b, { block: false }); c.setDepth(ISO.depthOf(a, b, 6)); }
            if (a % rule.mastEvery === 2 && (a < rule.outside[0] - 1 || a > rule.outside[1] + 3)) this.placeThing('catenary', a, b);
        }
    }

    // Vlaky na kolejích a podchody na nástupiště.
    placeTrains() {
        (this.def?.trains ?? []).forEach(({ a, b, cars }) => {
            let at = a;
            cars.forEach(([key, len]) => { this.placeVehicle(key, at, b, len, 0); at += len; });
        });
        // Animované dveře: sprite přes portál na fasádě, bod FR(0, 0) dveří je na fasádě ve výšce přízemí (PODIUM).
        this.doors = {};
        Object.entries(this.def?.doors ?? {}).forEach(([id, d]) => {
            const c = this.center({ a: d.a0, b: d.b });
            const x = c.x + d.u, y = c.y + ISO.TH / 2 - 1 - (this.def.upper?.height ?? 142) - d.u / 2;
            const sprite = this.add.sprite(x - 2, y + 2, 'atlas', `${d.key}_0`).setOrigin(0, 1).setDepth(ISO.depthOf(d.depthAt.a, d.depthAt.b, d.depthAt.lift));
            this.doors[id] = { ...d, sprite };
        });
        (this.def?.tunnels ?? []).forEach(({ from, to, door }) => {
            if (door) this.tunnelDoors.set(`${k3(from.a, from.b, from.L)}>${k3(to.a, to.b, to.L)}`, door).set(`${k3(to.a, to.b, to.L)}>${k3(from.a, from.b, from.L)}`, door);
            this.link(from, to);
            this.tunnels.add(`${k3(from.a, from.b, from.L)}>${k3(to.a, to.b, to.L)}`);
            this.tunnels.add(`${k3(to.a, to.b, to.L)}>${k3(from.a, from.b, from.L)}`);
        });
    }

    // Dveře se otevřou (4 snímky), hrdinka projde a zavřou se. Když jde ven (z nástupiště), otevřou se až v půlce průchodu.
    animateDoor(door, entering) {
        const frames = [0, 1, 2, 3];
        const setF = (i) => door.sprite.setFrame(`${door.key}_${i}`);
        const open = () => frames.forEach((f, i) => this.time.delayedCall(i * 90, () => setF(f)));
        const close = (at) => frames.slice().reverse().forEach((f, i) => this.time.delayedCall(at + i * 90, () => setF(f)));
        this.registry.get('sound')?.open();
        if (entering) { open(); close(900); } else { this.time.delayedCall(550, open); close(1300); }
    }

    tunnelOf(from, to) {
        return this.tunnels.has(`${k3(from.a, from.b, from.L ?? 0)}>${k3(to.a, to.b, to.L ?? 0)}`);
    }

    neighbors(n) {
        const out = [];
        for (const [da, db] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
            if (this.walkable(n.a + da, n.b + db, n.L)) out.push({ a: n.a + da, b: n.b + db, L: n.L });
        }
        (this.links.get(k3(n.a, n.b, n.L)) ?? []).forEach((m) => { if (this.walkable(m.a, m.b, m.L)) out.push(m); });
        return out;
    }

    // Nejkratší cesta přes obě úrovně (BFS). Vrací kroky bez startu, prázdné pole = nedostupné nebo už tam.
    findPath(from, to) {
        const start = { L: 0, ...from }, goal = { L: 0, ...to };
        if (start.a === goal.a && start.b === goal.b && start.L === goal.L) return [];
        if (!this.walkable(goal.a, goal.b, goal.L)) return [];
        const prev = new Map([[k3(start.a, start.b, start.L), null]]);
        const queue = [start];
        const gk = k3(goal.a, goal.b, goal.L);
        while (queue.length) {
            const cur = queue.shift();
            if (k3(cur.a, cur.b, cur.L) === gk) break;
            for (const nb of this.neighbors(cur)) {
                const key = k3(nb.a, nb.b, nb.L);
                if (prev.has(key)) continue;
                prev.set(key, cur);
                queue.push(nb);
            }
        }
        if (!prev.has(gk)) return [];
        const path = [];
        let step = goal;
        while (step && k3(step.a, step.b, step.L) !== k3(start.a, start.b, start.L)) { path.unshift(step); step = prev.get(k3(step.a, step.b, step.L)); }
        return path;
    }

    // Podlaha do jedné textury: dlaždice se kreslí od zadní řady dopředu; voda, koleje a půdorysy jsou neprůchozí.
    buildGround() {
        const LEN = this.map.len, WID = this.map.wid;
        const corners = [this.center({ a: 0, b: 0 }), this.center({ a: LEN, b: 0 }), this.center({ a: 0, b: WID }), this.center({ a: LEN, b: WID })];
        const minX = Math.min(...corners.map((c) => c.x)) - ISO.TW / 2;
        const maxX = Math.max(...corners.map((c) => c.x)) + ISO.TW / 2;
        const minY = Math.min(...corners.map((c) => c.y)) - ISO.TH / 2;
        const maxY = Math.max(...corners.map((c) => c.y)) + ISO.TH / 2;
        this.bounds = { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
        for (let a = 0; a < LEN; a++) for (let b = 0; b < WID; b++) if (!walkable(this.map, a, b)) this.blocked.add(ISO.key(a, b));
        this.cameras.main.setBounds(minX - 200, minY - 600, this.bounds.w + 400, this.bounds.h + 800);
        // Zem z vektorů OSM (art/ground.px.js): díly po chunk bodech v obdélníku mapy, každý jako samostatný obrázek
        // (jedna textura přes celou mapu by u Václaváku přesáhla největší povolenou velikost textury).
        const chunks = this.map.groundChunks;
        if (chunks && this.textures.exists(`ground_${this.map.place}_0`)) {
            chunks.chunks.forEach(([i, j, s]) => this.add.image(minX + i * chunks.size, minY + j * chunks.size, `ground_${this.map.place}_${s}`, `gr_${this.map.place}_${i}_${j}`).setOrigin(0, 0).setDepth(-100000));
            return;
        }
        const rt = this.add.renderTexture(minX, minY, this.bounds.w, this.bounds.h).setOrigin(0, 0).setDepth(-100000);
        rt.beginDraw();
        for (let a = LEN - 1; a >= 0; a--) {
            for (let b = 0; b < WID; b++) {
                const { x, y } = this.center({ a, b });
                rt.batchDrawFrame('atlas', groundTile(this.map, a, b), x - minX - ISO.TW / 2, y - minY - ISO.TH / 2);
            }
        }
        // Nálepky přes víc dlaždic: písek a hlína nafoukané z parku a dvorů na dlažbu a silnice, praskliny, olej.
        const at = (a, b) => (this.inside(a, b) ? this.map.ground[a][b] : ' ');
        const decal = (frame, a, b) => { const f = this.textures.getFrame('atlas', frame); const { x, y } = this.center({ a, b }); rt.batchDrawFrame('atlas', frame, x - minX - f.width / 2, y - minY - f.height / 2); };
        for (let a = 0; a < LEN; a++) for (let b = 0; b < WID; b++) {
            const c = at(a, b);
            if (!'rpn'.includes(c)) continue;
            const dusty = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([da, db]) => 'g.f'.includes(at(a + da, b + db)));
            const roll = ISO.hash(a, b, 31);
            if ((dusty && roll < 0.45) || roll < 0.06) decal(ISO.pick(['decal_sand_a', 'decal_sand_b', 'decal_sand_c'], a, b, 32), a, b);
            else if (c === 'r' && roll < 0.12) decal('decal_crack', a, b);
            else if (c === 'r' && roll < 0.16) decal('decal_oil', a, b);
        }
        rt.endDraw();
    }

    // Kvádr (dům nebo díl landmarku): kotva je spodní roh půdorysu nejblíž divákovi, hloubka přes ISO.boxDepth.
    placeBox(atlas, key, a0, b0, w, dpt, depthAt = null, pass = null) {
        const texture = this.textures.getFrame(atlas, key);
        const anchor = this.center({ a: a0, b: b0 + dpt - 1 });
        const sprite = this.add.image(anchor.x, anchor.y + ISO.TH / 2, atlas, key).setOrigin((ISO.TW / 2) * dpt / texture.width, 1);
        sprite.setDepth(depthAt ? ISO.depthOf(depthAt.a, depthAt.b, depthAt.lift ?? 0) : ISO.boxDepth(a0, b0, w, dpt));
        sprite.box = { a0, b0, w, dpt };
        // pass: řádek b brány, kterou se prochází (mostecké věže); ostatní dlaždice půdorysu blokují
        for (let a = a0; a < a0 + w; a++) for (let b = b0; b < b0 + dpt; b++) if (b !== pass) this.blocked.add(ISO.key(a, b));
        this.houses.push(sprite);
        return sprite;
    }

    // Vržené stíny kvádrů na zem (Fallout: světlo zleva shora, stín padá doprava dolů, tedy k +b), délka podle výšky.
    drawShadows() {
        const g = this.add.graphics().setDepth(-90000);
        g.fillStyle(0x000000, 0.32);
        const corner = (a, b) => ISO.toScreen(a - 0.5, b - 0.5);
        this.houses.forEach((h) => {
            const { a0, b0, w, dpt } = h.box;
            const height = h.height - 32 * (w + dpt);
            const s = Math.max(0.6, Math.min(4, height / 110));
            const pts = [corner(a0, b0), corner(a0 + w, b0), corner(a0 + w, b0 + dpt + s), corner(a0, b0 + dpt + s)];
            g.fillPoints(pts, true);
        });
    }

    placeHouses() {
        this.map.houses.forEach(({ key, a0, b0, w, dpt }) => this.placeBox(`houses_${this.map.place}_${key.slice(2, key.indexOf('_'))}`, key, a0, b0, w, dpt));
    }

    placeLandmark() {
        (this.def?.landmark ?? []).forEach(({ atlas, key, a0, b0, w, dpt, depthAt, pass }) => this.placeBox(atlas ?? 'landmarks', key, a0, b0, w, dpt, depthAt, pass));
    }

    // Oblouky zřícené haly: levá noha na středu dlaždice (a, b0), oblouk přes span dlaždic napříč. Hloubka podle levé
    // nohy, protože oblouk je vysoko a hrdinka pod ním projde.
    placeRibs() {
        (this.def?.ribs ?? []).forEach(({ key, a, b0 }) => {
            const frame = this.textures.getFrame('landmarks', key);
            const { x, y } = this.center({ a, b: b0 });
            this.add.image(x, y, 'landmarks', key).setOrigin(12 / frame.width, (frame.height - 2 - 32 * 6) / frame.height).setDepth(ISO.depthOf(a, b0, 2));
        });
    }

    // Animace stání rekvizity nebo postavy z jejích snímků (<key>_0, _1, …); vrací list a snímky.
    idleAnim(key) {
        // velké rekvizity (pomník, Orloj, věž) jsou ve vlastních listech landmarks_<místo>
        const atlas = ['atlas', 'landmarks_staromak', 'landmarks_hrad'].find((t) => this.textures.exists(t) && (this.textures.get(t).has(key) || this.textures.get(t).has(`${key}_0`))) ?? 'atlas';
        const frames = this.textures.get(atlas).getFrameNames().filter((n) => n.startsWith(`${key}_`) && /^\d+$/.test(n.slice(key.length + 1))).sort((p, q) => Number(p.split('_').pop()) - Number(q.split('_').pop()));
        if (frames.length && !this.anims.exists(`${key}_idle`)) this.anims.create({ key: `${key}_idle`, frames: frames.map((frame) => ({ key: atlas, frame })), frameRate: frames.length > 2 ? 8 : 2, repeat: -1 });
        return { atlas, frames };
    }

    // Rekvizita nebo postava na dlaždici: počátek dole uprostřed, dlaždice je neprůchozí.
    placeThing(key, a, b, { anim = false, flip = false, block = true, L = 0 } = {}) {
        const { x, y } = this.pos(a, b, L);
        let thing;
        const { atlas, frames } = this.idleAnim(key);
        if (frames.length) {
            thing = this.add.sprite(x, y, atlas, frames[0]);
            if (anim) thing.play({ key: `${key}_idle`, startFrame: Math.floor(ISO.hash(a, b, 7) * frames.length) });
        } else {
            thing = this.add.image(x, y, atlas, key);
        }
        thing.setOrigin(0.5, 1).setDepth(this.depthAt(a, b, L)).setFlipX(flip);
        if (block) (L === 1 ? this.upperBlocked : this.blocked).add(ISO.key(a, b));
        return thing;
    }

    // Podoba zastavení: když platí after.if (psi dají pokoj, nutrie sleze), stojí postava a rekvizity podle after.
    layoutOf(stop) {
        const done = Boolean(stop.after && holds(this.state, stop.after.if));
        const src = done ? { ...stop, ...stop.after } : stop;
        return { done, approach: { L: 0, ...src.approach }, npc: { L: 0, ...src.npc }, props: src.props ?? [] };
    }

    placeStopSprites(lay) {
        const props = lay.props.map((p) => this.placeThing(p.key, p.a, p.b, p));
        const npc = this.placeThing(lay.npc.key, lay.npc.a, lay.npc.b, { L: lay.npc.L, anim: lay.npc.anim, flip: lay.npc.flip ?? (lay.npc.b > lay.approach.b || lay.npc.a < lay.approach.a) });
        return { npc, props };
    }

    // Zastavení: postava (stojí, nehýbe se, dokud se s ní nemluví) a rekvizity. Přístup se rezervuje, aby ho nezarostl strom,
    // i místa podoby after, aby tam postavy po vyřešení měly kam dojít.
    placeStops() {
        Object.entries(this.def?.stops ?? {}).forEach(([id, stop]) => {
            if (stop.hideIf && holds(this.state, stop.hideIf)) return;
            const lay = this.layoutOf(stop);
            [lay.approach, stop.approach, stop.after?.approach, stop.after?.npc, ...(stop.after?.props ?? [])].filter((t) => t && !t.L).forEach((t) => this.reserved.add(ISO.key(t.a, t.b)));
            const { npc, props } = this.placeStopSprites(lay);
            this.stops[id] = { ...stop, approach: lay.approach, npc: lay.npc, props: lay.props, id, sprite: npc, propSprites: props, done: lay.done };
        });
    }

    // Přechod zastavení do podoby after, aby bylo vidět, co se stalo. Nový sprite s from ('npc' nebo index rekvizity)
    // vznikne ze starého: ten dojde po dlaždicích na nové místo a na konci se vymění; s jump (výška v bodech) nový sprite
    // seskočí obloukem z místa starého. Ostatní nové se objeví na místě, staré pod nimi zmizí, zbytek vybledne.
    changeStop(stop) {
        const lay = this.layoutOf(stop);
        const old = [['npc', stop.sprite, stop.npc], ...stop.propSprites.map((s, i) => [String(i), s, stop.props[i]])];
        old.forEach(([, , t]) => ((t.L ?? 0) === 1 ? this.upperBlocked : this.blocked).delete(ISO.key(t.a, t.b)));
        const { npc, props } = this.placeStopSprites(lay);
        const defs = [[lay.npc, npc], ...lay.props.map((p, i) => [p, props[i]])];
        const walkers = new Set();
        const covered = new Set(defs.filter(([d]) => d.from === undefined).map(([d]) => ISO.key(d.a, d.b)));
        defs.forEach(([def, sprite]) => {
            const src = old.find(([k]) => k === String(def.from));
            if (!src) return;
            if (def.jump) { this.jumpThing(sprite, { x: src[1].x, y: src[1].y - def.jump }); return; }
            walkers.add(src[0]);
            this.walkThing(src[1], src[2], def, sprite);
        });
        old.forEach(([k, s, t]) => {
            if (walkers.has(k)) return;
            if (covered.has(ISO.key(t.a, t.b))) s.destroy();
            else this.tweens.add({ targets: s, alpha: 0, duration: 400, onComplete: () => s.destroy() });
        });
        Object.assign(stop, { approach: lay.approach, npc: lay.npc, props: lay.props, sprite: npc, propSprites: props, done: true });
    }

    // Postava dojde po dlaždicích na místo cílového spritu (ten se do té doby schová), pak se vymění.
    walkThing(walker, from, to, target) {
        target.setVisible(false);
        const goal = { a: to.a, b: to.b, L: to.L ?? 0 };
        const set = goal.L === 1 ? this.upperBlocked : this.blocked;
        const key = ISO.key(goal.a, goal.b);
        set.delete(key);
        const path = this.findPath({ a: from.a, b: from.b, L: from.L ?? 0 }, goal);
        set.add(key);
        const done = () => { walker.destroy(); target.setVisible(true); };
        if (!path.length) { done(); return; }
        if (walker.anims) walker.anims.timeScale = 2;
        const step = (i) => {
            if (i >= path.length) { done(); return; }
            const n = path[i], p = this.pos(n.a, n.b, n.L);
            // zvířata koukají doprava, lidé doleva (facesLeft)
            if (Math.abs(p.x - walker.x) > 0.5) walker.setFlipX(to.facesLeft ? p.x > walker.x : p.x < walker.x);
            this.tweens.add({ targets: walker, x: p.x, y: p.y, duration: 150, delay: i === 0 ? (to.delay ?? 0) : 0, onStart: () => walker.setDepth(this.depthAt(n.a, n.b, n.L)), onComplete: () => step(i + 1) });
        };
        step(0);
    }

    // Seskok obloukem z bodu start na místo spritu (nutrie z reproduktoru na kraj vody).
    jumpThing(sprite, start) {
        const end = { x: sprite.x, y: sprite.y }, depth = sprite.depth;
        sprite.setPosition(start.x, start.y).setDepth(depth + 1000);
        this.tweens.addCounter({ from: 0, to: 1, duration: 900, ease: 'Sine.easeInOut', onUpdate: (tw) => {
            const t = tw.getValue();
            sprite.setPosition(Math.round(start.x + (end.x - start.x) * t), Math.round(start.y + (end.y - start.y) * t - Math.sin(t * Math.PI) * 60));
        }, onComplete: () => sprite.setPosition(end.x, end.y).setDepth(depth) });
    }

    // Rekvizity: stromy, lampy, lavičky a koše na skutečných místech z OSM (data/<místo>.json props, desetinné dlaždice),
    // vraky tramvají na kolejích; navíc rozsev keřů, harampádí a bud podle pravidel místa. Deterministicky z ISO.hash.
    // Neprůchozí jsou jen stromy mimo cesty a tramvaje; lampy a lavičky stojí na kraji cest a hrdinka kolem nich projde.
    placeProps() {
        const rules = this.def?.props ?? {};
        const at = (a, b) => (this.inside(a, b) ? this.map.ground[a][b] : ' ');
        const near = (a, b, c) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([da, db]) => at(a + da, b + db) === c);
        const nearStart = (a, b) => this.def.start && Math.abs(this.def.start.a - a) + Math.abs(this.def.start.b - b) < 2;
        const ok = (a, b) => this.free(a, b) && !this.reserved.has(ISO.key(a, b)) && !nearStart(a, b);
        this.props = [];
        (this.map.props ?? []).forEach((p) => {
            const ta = Math.round(p.a), tb = Math.round(p.b);
            if (!this.inside(ta, tb)) return;
            const h = ISO.hash(Math.round(p.a * 100), Math.round(p.b * 100), 22);
            if (p.tram) {
                const frame = this.textures.getFrame('atlas', p.k);
                if (!frame) return;
                const { x, y } = ISO.foot(p.a, p.b);
                const tram = this.add.image(x, y - ISO.FOOT, 'atlas', p.k).setOrigin(TRAM_ORIGIN.x / frame.width, TRAM_ORIGIN.y / frame.height).setDepth(ISO.depthOf(p.a, p.b, 4));
                // souprava 14,7 m blokuje dlaždice pod sebou
                const ang = Number(p.k.split('_').pop()) * Math.PI / 180;
                for (let t = -7; t <= 7; t += 1) this.blocked.add(ISO.key(Math.round(p.a + Math.cos(ang) * t / this.map.tile), Math.round(p.b + Math.sin(ang) * t / this.map.tile)));
                this.props.push(tram);
                return;
            }
            if (this.reserved.has(ISO.key(ta, tb)) || nearStart(ta, tb) || this.blocked.has(ISO.key(ta, tb))) return;
            const key = p.k === 'tree' ? ISO.pick(rules.trees ?? ['tree_a'], Math.round(p.a * 100), Math.round(p.b * 100), 22) : p.k;
            const block = p.k === 'tree' && 'g.'.includes(at(ta, tb));
            this.props.push(this.placeAt(key, p.a, p.b, { flip: h < 0.5, block }));
        });
        for (let a = 0; a < this.map.len; a++) for (let b = 0; b < this.map.wid; b++) {
            const c = at(a, b);
            if (!ok(a, b)) continue;
            const roll = ISO.hash(a, b, 21);
            // keře, harampádí a boudy: posunuté v rámci dlaždice, aby nestály v mřížce
            const ja = a + (ISO.hash(a, b, 41) - 0.5) * 0.6, jb = b + (ISO.hash(a, b, 42) - 0.5) * 0.6;
            if (rules.bush && 'g.'.includes(c) && ISO.hash(a, b, 28) < rules.bush) this.props.push(this.placeAt(ISO.pick(rules.bushes, a, b, 29), ja, jb, { flip: ISO.hash(a, b, 30) < 0.5 }));
            else if (rules.shack && c === 'g' && !near(a, b, 'f') && roll > 1 - rules.shack) this.props.push(this.placeAt('shack', a, b, { flip: ISO.hash(a, b, 24) < 0.5, block: true }));
            else if (rules.junk && 'p.g'.includes(c) && ISO.hash(a, b, 25) < rules.junk) this.props.push(this.placeAt(ISO.pick(rules.junkKeys, a, b, 26), ja, jb, { flip: ISO.hash(a, b, 27) < 0.5, block: true }));
        }
    }

    // Rekvizita na desetinné poloze (a, b): počátek dole uprostřed, hloubka podle polohy, volitelně blokuje svou dlaždici.
    placeAt(key, a, b, { flip = false, block = false } = {}) {
        const { x, y } = ISO.foot(a, b);
        const thing = this.add.image(x, y, 'atlas', key).setOrigin(0.5, 1).setDepth(ISO.depthOf(a, b)).setFlipX(flip);
        if (block) this.blocked.add(ISO.key(Math.round(a), Math.round(b)));
        return thing;
    }

    // Kontrola zastavení: přístup musí být průchozí a dosažitelný ze startu, jinak chyba do konzole (průchod ji chytí).
    // Brány se při kontrole berou jako otevřené: zavřené jsou záměrně, dokud hráčka nesplní podmínku.
    checkStops() {
        (this.def?.gates ?? []).forEach((gate) => gate.tiles.forEach(([a, b]) => this.blocked.delete(ISO.key(a, b))));
        Object.values(this.stops).forEach((stop) => {
            const { a, b, L } = stop.approach;
            const after = stop.after?.approach;
            if (after && !stop.done && (!this.walkable(after.a, after.b, after.L ?? 0) || [stop.after.npc, ...(stop.after.props ?? [])].some((t) => t.a === after.a && t.b === after.b))) this.problems.push(`${stop.id}: přístup po vyřešení ${after.a},${after.b} není průchozí`);
            if (!this.walkable(a, b, L)) this.problems.push(`${stop.id}: přístup ${a},${b} (úroveň ${L}) není průchozí`);
            else if (!(this.tile.a === a && this.tile.b === b && this.tile.L === L) && !this.findPath(this.tile, stop.approach).length) this.problems.push(`${stop.id}: přístup ${a},${b} (úroveň ${L}) není dosažitelný ze startu`);
        });
        this.refreshGates();
        this.problems.forEach((p) => console.error(`[zastavení] ${p}`));
    }

    // Kvádr, který stojí před hrdinkou, dostane v masce otvor kolem ní (jediné pravidlo pro domy i landmark).
    fadeHouses() {
        const t = this.tile;
        // Otvor kolem hrdinky: elipsa v maskách domů, které stojí před ní (hloubka větší než její) a do otvoru zasahují.
        // Zbytek domu zůstává plný, takže je vidět jen hrdinka a její okolí, ne půl ulice. Okraj otvoru je měkký
        // (přechod v textuře masky), elipsa vznikne protažením kruhové textury.
        const hx = this.player.x, hy = this.player.y - 40, rx = 220, ry = 250;
        this.holeZone = new Phaser.Geom.Rectangle(hx - rx, hy - ry, rx * 2, ry * 2);
        this.holeImage.setPosition(hx, hy).setDisplaySize(rx * 2, ry * 2);
        (this.roofs ?? []).forEach((r) => {
            const { a0, b0, w, dpt } = r.box;
            const under = t.L === 0 && t.a >= a0 - 1 && t.a < a0 + w + 1 && t.b >= b0 && t.b < b0 + dpt + 1;
            r.setAlpha(under ? 0.28 : 1);
        });
        const inTower = this.towerAt(this.moving?.tile ?? this.tile)?.sprite ?? this.towerAt(this.tile)?.sprite;
        this.houses.forEach((house) => {
            if (house === inTower) { house.setAlpha(0.55); return; }
            const covers = house.depth > this.player.depth && Phaser.Geom.Rectangle.Overlaps(house.getBounds(), this.holeZone);
            if (covers && house.mask !== this.hole) house.setMask(this.hole);
            else if (!covers && house.mask) house.clearMask();
            house.setAlpha(1);
        });
    }

    spawnPlayer(tile) {
        // maska otvoru pro domy před hrdinkou (inverzní: kreslí se všude kromě elipsy, k okraji plynule přibývá)
        if (!this.textures.exists('hole')) {
            const size = 256, tex = this.textures.createCanvas('hole', size, size), ctx = tex.getContext();
            const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
            g.addColorStop(0, 'rgba(255,255,255,1)');
            g.addColorStop(0.55, 'rgba(255,255,255,1)');
            g.addColorStop(0.8, 'rgba(255,255,255,0.45)');
            g.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, size, size);
            tex.refresh();
        }
        this.holeImage = this.make.image({ key: 'hole', add: false });
        this.hole = this.holeImage.createBitmapMask();
        this.hole.invertAlpha = true;
        this.tile = { L: 0, ...tile };
        const { x, y } = this.pos(this.tile.a, this.tile.b, this.tile.L);
        ensureWalk(this, 'hero_go');
        ensureWalk(this, 'hero_up');
        this.facingUp = false;
        this.shadow = this.add.ellipse(x, y, 40, 16, 0x000000, 0.35).setDepth(this.depthAt(this.tile.a, this.tile.b, this.tile.L, -1));
        this.player = this.add.sprite(x, y, 'atlas', 'hero_0').setOrigin(0.5, 1).setDepth(this.depthAt(this.tile.a, this.tile.b, this.tile.L));
    }

    stopAt(a, b, L = 0) {
        return Object.values(this.stops).find((stop) => (stop.npc.a === a && stop.npc.b === b && stop.npc.L === L) || stop.props.some((p) => p.a === a && p.b === b && (p.L ?? 0) === L));
    }

    // Dlaždice pod prstem: nejdřív horní úroveň (zkouší výšky od desky dolů), pak země.
    pick(x, y) {
        for (let h = 142; h >= 0; h -= 12) {
            const t = ISO.toGrid(x, y - ISO.FOOT + h);
            if (this.upper.has(ISO.key(t.a, t.b)) && Math.abs(this.height(t.a, t.b, 1) - h) <= 14) return { ...t, L: 1 };
        }
        return { ...ISO.toGrid(x, y - ISO.FOOT), L: 0 };
    }

    onPointer(pointer) {
        if (this.busy || this.hud?.panel || this.hud?.quests) return;
        const world = pointer.positionToCamera(this.cameras.main);
        // Klepnutí na postavu (i na její hlavu nad sousední dlaždicí) má přednost před dlaždicí pod prstem.
        const hit = Object.values(this.stops).find((stop) => stop.sprite.getBounds().contains(world.x, world.y));
        if (hit) { this.goToStop(hit.id); return; }
        const target = this.pick(world.x, world.y);
        if (!this.inside(target.a, target.b)) return;
        const stop = this.stopAt(target.a, target.b, target.L);
        if (stop) { this.goToStop(stop.id); return; }
        this.goTo(target);
    }

    goTo(target) {
        this.pendingTalk = null;
        const goal = { L: 0, ...target };
        this.path = this.findPath(this.tile, goal);
        if (!this.path.length && !(this.tile.a === goal.a && this.tile.b === goal.b && this.tile.L === goal.L)) this.registry.get('sound')?.wrong();
    }

    // Dojít k zastavení a promluvit (i z konzole a z průchodu).
    goToStop(id) {
        const stop = this.stops[id];
        if (!stop) return;
        if (this.tile.a === stop.approach.a && this.tile.b === stop.approach.b && this.tile.L === stop.approach.L) { this.talk(id); return; }
        this.goTo(stop.approach);
        this.pendingTalk = this.path.length ? id : null;
    }

    // Rozhovor podle DIALOGS (src/story.js). Po zavření: brány a zastavení podle nového stavu, případně přestup nebo smrt.
    async talk(id) {
        const stop = this.stops[id];
        if (!stop || this.busy) return;
        this.busy = true;
        this.player.setFlipX(stop.sprite.x > this.player.x);
        this.facingUp = false;
        this.player.stop(); this.player.setFrame('hero_0');
        const result = await runDialog(this, id);
        this.input.keyboard.resetKeys();
        this.busy = false;
        if (result.dead) { this.die(); return; }
        if (result.travel) { this.travel(result.travel); return; }
        if (result.ending) { this.scene.stop('hud'); this.scene.start('ending', { result: result.ending }); return; }
        this.refreshGates();
        this.refreshStops();
    }

    // Boj nad světem (BattleScene); vrací 'win', 'flee' nebo 'dead'.
    fight(enemy) {
        return new Promise((resolve) => this.scene.launch('battle', { enemy, onDone: (result) => { this.hud.refresh(); resolve(result); } }));
    }

    // Přestup na jiné místo: filmeček cesty, checkpoint, svět se postaví znovu. Cestou se hrdinka zotaví o polovinu
    // životů, ne úplně: zbytek je na obvazech a jídle (taška), aby boje a nepovedené zkoušky něco stály.
    travel(place) {
        const from = this.state.place;
        this.state.place = place;
        this.state.arrival = from;
        this.state.hp = Math.min(maxHp(this.state), this.state.hp + Math.ceil(maxHp(this.state) / 2));
        save(this.state);
        this.scene.stop('hud');
        // filmeček cesty: cesta_<odkud>_<kam> (loďka, pěšky), jinak souprava metro_<kam>
        const key = CUTSCENES[`cesta_${from}_${place}`] ? `cesta_${from}_${place}` : `metro_${place}`;
        this.scene.start('cutscene', { key, onDone: (cutscene) => cutscene.scene.start('world') });
    }

    // Brány: dlaždice zavřené, dokud neplatí podmínka (revizor pouští na molo).
    refreshGates() {
        (this.def?.gates ?? []).forEach((gate) => {
            const open = holds(this.state, gate.open);
            gate.tiles.forEach(([a, b]) => { if (open) this.blocked.delete(ISO.key(a, b)); else this.blocked.add(ISO.key(a, b)); });
        });
    }

    // Zastavení po rozhovoru: co má zmizet (hideIf), vybledne; co se vyřešilo (after), se přehraje na nové místo.
    refreshStops() {
        Object.values(this.stops).forEach((stop) => {
            if (stop.hideIf && holds(this.state, stop.hideIf)) {
                const sprites = [stop.sprite, ...stop.propSprites];
                this.tweens.add({ targets: sprites, alpha: 0, duration: 500, onComplete: () => sprites.forEach((s) => s.destroy()) });
                [stop.npc, ...stop.props].forEach((p) => ((p.L ?? 0) === 1 ? this.upperBlocked : this.blocked).delete(ISO.key(p.a, p.b)));
                delete this.stops[stop.id];
                return;
            }
            if (stop.after && !stop.done && holds(this.state, stop.after.if)) this.changeStop(stop);
        });
    }

    // Klávesy: držená šipka, kombinace dvou směrů; pohyb po jedné dlaždici, klouzání podél překážky; náraz do postavy = rozhovor.
    keyStep() {
        const c = this.cursors;
        let da = 0;
        let db = 0;
        if (c.up.isDown) { da += 1; db -= 1; }
        if (c.down.isDown) { da -= 1; db += 1; }
        if (c.right.isDown) { da += 1; db += 1; }
        if (c.left.isDown) { da -= 1; db -= 1; }
        da = Math.sign(da); db = Math.sign(db);
        if (!da && !db) return null;
        const bump = this.stopAt(this.tile.a + da, this.tile.b + db, this.tile.L);
        if (bump && Math.abs(bump.approach.a - this.tile.a) + Math.abs(bump.approach.b - this.tile.b) <= 2) { this.talk(bump.id); return null; }
        // sousedé včetně přechodů mezi úrovněmi (věž, konec rampy), vybere se ten ve směru šipky, jinak klouzání
        const near = this.neighbors(this.tile);
        for (const [x, y] of [[da, db], [da, 0], [0, db]]) {
            if (!x && !y) continue;
            const hit = near.find((n) => n.a - this.tile.a === x && n.b - this.tile.b === y);
            if (hit) return hit;
        }
        return null;
    }

    update(time, delta) {
        if (!this.player) return;
        if (!this.moving) {
            if (!this.path.length && !this.busy && !this.hud?.panel && !this.hud?.quests) {
                if (this.pendingTalk) { const id = this.pendingTalk; this.pendingTalk = null; this.talk(id); return; }
                const step = this.keyStep();
                if (step) this.path = [step];
            }
            if (this.path.length) {
                const next = this.path.shift();
                const target = this.pos(next.a, next.b, next.L);
                const climb = this.climbOf(this.tile, next);
                const tunnel = !climb && this.tunnelOf(this.tile, next);
                const door = tunnel ? this.doors?.[this.tunnelDoors.get(`${k3(this.tile.a, this.tile.b, this.tile.L)}>${k3(next.a, next.b, next.L)}`)] : null;
                this.moving = { from: { x: this.player.x, y: this.player.y }, to: target, tile: next, t: 0, climb, tunnel, door };
                if (door) this.animateDoor(door, this.tile.L === 1);
                if (climb?.sprite) climb.sprite.setAlpha(0.55);
                // Sprite hrdinky kouká doleva: doprava se zrcadlí. Od diváka (nahoru po obrazovce) jde zády, hlavou napřed.
                const dx = (next.a + next.b) - (this.tile.a + this.tile.b), dy = (next.b - next.a) - (this.tile.b - this.tile.a);
                if (dx) this.player.setFlipX(dx > 0);
                this.facingUp = dy < 0;
                this.player.play(this.facingUp ? 'hero_up_walk' : 'hero_go_walk', true);
            } else if (this.player.anims.isPlaying) {
                this.player.stop();
                this.player.setFrame(this.facingUp ? 'hero_back' : 'hero_0');
            }
        }
        if (this.moving) {
            const m = this.moving;
            if (m.tunnel) {
                // Podchod: hrdinka vejde do dveří (zmizí), chvíli je pod zemí a vynoří se na druhé straně.
                m.t = Math.min(1, m.t + delta / 1400);
                const out = m.t < 0.4, hidden = m.t >= 0.4 && m.t < 0.6;
                if (out) this.player.setPosition(Math.round(m.from.x - 12 * (m.t / 0.4)), Math.round(m.from.y - 6 * (m.t / 0.4)));
                else if (!hidden) this.player.setPosition(Math.round(m.to.x), Math.round(m.to.y));
                this.player.setAlpha(out ? 1 - m.t / 0.4 : hidden ? 0 : (m.t - 0.6) / 0.4);
                this.shadow.setVisible(!hidden).setPosition(this.player.x, this.player.y).setAlpha(this.player.alpha);
                const depth = this.playerDepth(m.t >= 0.6 ? m.tile : this.tile);
                this.player.setDepth(depth); this.shadow.setDepth(depth - 1);
                if (m.t >= 1) { this.tile = { ...m.tile }; this.moving = null; this.player.setAlpha(1); this.shadow.setVisible(true).setAlpha(1); this.registry.get('sound')?.step(); }
                return;
            }
            if (m.climb) {
                // Točité schodiště: 85 % času spirála uvnitř tubusu, zbytek krok ven na vozovku (nahoru) nebo ze dveří (dolů).
                m.t = Math.min(1, m.t + delta / 2600);
                const k = 0.85;
                const up = m.climb.up;
                const s = up ? m.t : 1 - m.t; // 0 = dole, 1 = nahoře
                const edge = up ? m.to : m.from; // bod na vozovce
                let p;
                if ((up && m.t <= k) || (!up && m.t >= 1 - k)) {
                    const q = Math.min(1, up ? m.t / k : (1 - m.t) / k);
                    p = this.spiral(q, m.climb);
                } else {
                    const top = this.spiral(1, m.climb);
                    const r = up ? (m.t - k) / (1 - k) : 1 - m.t / (1 - k);
                    p = { x: top.x + (edge.x - top.x) * r, y: top.y + (edge.y - top.y) * r, back: false };
                }
                if (Math.abs(p.x - this.player.x) > 0.5) this.player.setFlipX(p.x > this.player.x);
                this.player.setPosition(Math.round(p.x), Math.round(p.y));
                this.player.setTint(p.back ? 0x9a9aa8 : 0xffffff);
                // uvnitř tubusu za sklem, venku na vozovce podle horní úrovně
                const inside = s < 0.97 && !((up && m.t > k + 0.08) || (!up && m.t < 1 - k - 0.08));
                const depth = inside ? m.climb.sprite.depth - 1 : this.depthAt(m.climb.top.a, m.climb.top.b, 1);
                this.player.setDepth(depth);
                this.shadow.setVisible(!inside).setPosition(this.player.x, this.player.y).setDepth(depth - 1);
                if (m.t >= 1) {
                    this.tile = { ...m.tile };
                    this.moving = null;
                    this.player.clearTint();
                    if (this.tile.L === 1) m.climb.sprite.setAlpha(1);
                    this.shadow.setVisible(true);
                    this.registry.get('sound')?.step();
                }
                return;
            }
            const length = Math.hypot(m.to.x - m.from.x, m.to.y - m.from.y) || 1;
            m.t = Math.min(1, m.t + (SPEED * delta / 1000) / length);
            this.player.setPosition(Math.round(m.from.x + (m.to.x - m.from.x) * m.t), Math.round(m.from.y + (m.to.y - m.from.y) * m.t));
            // Hloubka podle dlaždice, na které je hrdinka víc: v půlce kroku se přepne na cílovou.
            const t = m.t >= 0.5 ? m.tile : this.tile;
            if (m.t >= 1) {
                this.tile = { ...m.tile };
                this.moving = null;
                this.registry.get('sound')?.step();
            }
            const depth = this.playerDepth(t);
            this.player.setDepth(depth);
            this.shadow.setPosition(this.player.x, this.player.y).setDepth(depth - 1);
            this.fadeHouses();
        }
    }

    // Smrt v boji: epilog smrti; checkpoint z posledního místa zůstává v localStorage.
    die() {
        this.scene.stop('hud');
        this.scene.start('ending', { result: 'death' });
    }
}
