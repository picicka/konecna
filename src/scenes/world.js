import Phaser from 'phaser';
import * as ISO from '../iso';
import { ensureWalk, CRT, body } from '../ui';
import { save, maxHp } from '../state';
import { PLACES, PLACE_DEFS, groundTile, walkable, startTile, TRAM_ORIGIN } from '../map';
import { runDialog, holds } from '../story';
import { CUTSCENES, ODDITY_LINES, ODDITY_GROUPS } from '../script';
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

const ODDITY_SCALE = { mlok: 2, stalin_hlava: 2, kafka: 2, miminko: 2, kun_lucerna: 2, metronom: 2 };

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
        this.buildBridge();
        this.buildSlope();
        this.buildNusle();
        this.buildUpper();
        this.placeTrains();
        this.placeRoofs();
        this.placeRibs();
        this.talkingOddities = [];
        this.placeStops();
        this.placeProps();
        this.placeOddities();
        this.drawShadows();
        this.refreshGates();
        // Příchod: z jiného místa na jeho přestupní dlaždici (arrivals), jinak na start místa.
        // skok z ladění (src/debug.js) na zadanou dlaždici, jen jednou
        const jumpTile = this.registry.get('jumpTile');
        this.registry.set('jumpTile', null);
        this.spawnPlayer({ L: 0, ...(jumpTile ?? this.def?.arrivals?.[this.state.arrival] ?? this.def?.start ?? startTile(this.map)) });
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
        this.input.on('pointermove', (pointer) => this.hover(pointer));
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

    // Kamenný most nad suchým korytem (Karlův most, def.bridge): přední líc z dílů po dlaždicích (pilíř s ledolamem, výseky
    // oblouků, nad Kampou jen zábradlí), zadní zábradlí a nábřežní zdi všude, kde břeh spadá do koryta k divákovi (+b, −a).
    // Koryto je jen namalované, hloubku dělají stěny visící od hrany dolů (art/most-oblouky.px.js). Z mostovky se mimo
    // koryto nedá sejít bokem, jen po schodech (stairs).
    buildBridge() {
        const br = this.def?.bridge;
        if (!br) return;
        const SHEET = 'landmarks_mostovka';
        const bed = new Set(br.bed ?? ['h']);
        const isBed = (a, b) => this.inside(a, b) && bed.has(this.map.ground[a][b]);
        const [b0, b1] = br.deck;
        const onDeck = (a, b) => a >= br.a0 && a <= br.a1 && b >= b0 && b <= b1;
        const piers = [...br.piers].sort((x, y) => x - y);
        const stairs = new Set((br.stairs ?? []).map(({ a, b }) => ISO.key(a, b)));
        const put = (key, corner, depth, ox, oy) => {
            const f = this.textures.getFrame(SHEET, key);
            return this.add.image(corner.x, corner.y, SHEET, key).setOrigin(ox / f.width, oy / f.height).setDepth(depth);
        };
        this.bridgeBand = { a0: br.a0, a1: br.a1, b0, b1 };
        for (let a = br.a0; a <= br.a1; a++) {
            let key = 'km_par';
            if (isBed(a, b1 + 1)) {
                const prev = piers.filter((p) => p < a).at(-1), next = piers.find((p) => p > a), n = next - prev - 1;
                if (piers.includes(a)) key = 'km_pier';
                else if (prev !== undefined && next !== undefined && (n === 3 || n === 4)) key = `km_arch_${n}_${a - prev}`;
            }
            // přední díl kryje nohy hrdinky na krajní řadě mostovky (zábradlí je před ní)
            put(key, ISO.toScreen(a - 0.5, b1 + 0.5), ISO.depthOf(a, b1, 1), 16, 96);
            if (!stairs.has(ISO.key(a, b0 - 1))) put(piers.includes(a) ? 'km_far_pier' : 'km_far', ISO.toScreen(a - 0.5, b0 - 0.5), ISO.depthOf(a, b0 - 1), 20, 104);
            // bokem z mostovky jen po schodech; nad korytem je bahno neprůchozí samo
            [b0 - 1, b1 + 1].forEach((b) => { if (!isBed(a, b) && !stairs.has(ISO.key(a, b))) this.blocked.add(ISO.key(a, b)); });
        }
        for (let a = 0; a < this.map.len; a++) for (let b = 0; b < this.map.wid; b++) {
            if (isBed(a, b) || onDeck(a, b)) continue;
            const v = ISO.hash(a, b, 61) < 0.5 ? '' : '2';
            if (isBed(a, b + 1)) put(`km_quay_b${v}`, ISO.toScreen(a - 0.5, b + 0.5), ISO.depthOf(a, b) - 1, 8, 40);
            if (isBed(a - 1, b)) put(`km_quay_a${v}`, ISO.toScreen(a - 0.5, b + 0.5), ISO.depthOf(a, b) - 1, 80, 40);
        }
    }

    // Svah pod Hradem (dlaždice k z osm.mjs podle terénu z laseru, art/hrad-svah.px.js): z hrany ostrohu visí
    // k divákovi (+b, −a) rozpadlá opěrná zeď nad skálou, uvnitř svahu terasy tam, kde terén klesne o pás (map.levels),
    // na odvrácených hranách (Jelení příkop) jen nízká rozbitá zídka. Na suti leží balvany, kvádry a kusy balustrády.
    buildSlope() {
        const levels = this.map.levels;
        if (!levels) return;
        const SHEET = 'landmarks_svah';
        const isK = (a, b) => this.inside(a, b) && this.map.ground[a][b] === 'k';
        const lv = (a, b) => Number(levels[a][b]);
        const put = (key, corner, depth, ox, oy) => {
            const f = this.textures.getFrame(SHEET, key);
            return this.add.image(corner.x, corner.y, SHEET, key).setOrigin(ox / f.width, oy / f.height).setDepth(depth);
        };
        const v = (a, b, s, n) => { const i = Math.floor(ISO.hash(a, b, s) * n); return i ? String(i + 1) : ''; };
        // Nuselák: svah je jen úzký pruh suti mezi břehem a jezerem, opěrné zdi a terasy by trčely z vody jako krabice
        const walls = !this.def?.nusle;
        for (let a = 0; a < this.map.len; a++) for (let b = 0; b < this.map.wid; b++) {
            const bottom = ISO.toScreen(a - 0.5, b + 0.5);
            if (!isK(a, b)) {
                if (!walls) continue;
                if (isK(a, b + 1)) put(`sv_edge_b${v(a, b, 71, 3)}`, bottom, ISO.depthOf(a, b) - 1, 8, 40);
                if (isK(a - 1, b)) put(`sv_edge_a${v(a, b, 72, 3)}`, bottom, ISO.depthOf(a, b) - 1, 80, 40);
                if (isK(a, b - 1)) put(`sv_lip_b${v(a, b, 73, 2)}`, ISO.toScreen(a - 0.5, b - 0.5), ISO.depthOf(a, b) - 2, 8, 50);
                if (isK(a + 1, b)) put(`sv_lip_a${v(a, b, 74, 2)}`, ISO.toScreen(a + 0.5, b + 0.5), ISO.depthOf(a, b) - 2, 76, 50);
                continue;
            }
            if (walls && isK(a, b + 1) && lv(a, b) > lv(a, b + 1)) put(`sv_ter_b${v(a, b, 75, 2)}`, bottom, ISO.depthOf(a, b) - 1, 8, 40);
            if (walls && isK(a - 1, b) && lv(a, b) > lv(a - 1, b)) put(`sv_ter_a${v(a, b, 76, 2)}`, bottom, ISO.depthOf(a, b) - 1, 80, 40);
            if (ISO.hash(a, b, 77) < 0.1) {
                const ja = a + (ISO.hash(a, b, 78) - 0.5) * 0.6, jb = b + (ISO.hash(a, b, 79) - 0.5) * 0.6, { x, y } = ISO.foot(ja, jb);
                this.add.image(x, y, SHEET, `sv_sut_${1 + Math.floor(ISO.hash(a, b, 80) * 6)}`).setOrigin(0.5, 40 / 52).setDepth(ISO.depthOf(ja, jb)).setFlipX(ISO.hash(a, b, 81) < 0.5);
            }
        }
    }

    // Nuselský most (def.nusle, art/nuselak-most.px.js, list landmarks_nusle_most): mostovka b deck[0]–deck[1] nad
    // zatopeným údolím, k divákovi (+b) betonová trouba a pilíře visící k hladině, vzadu zábradlí. Uprostřed zlom
    // (gap): severní konec visí do vody, z jižního trčí souprava metra C, přes mezeru lano (ropeCross).
    buildNusle() {
        const ns = this.def?.nusle;
        if (!ns) return;
        const SHEET = 'landmarks_nusle_most';
        const [b0, b1] = ns.deck, [g0, g1] = ns.gap;
        const put = (key, corner, depth, ox, oy) => {
            const f = this.textures.getFrame(SHEET, key);
            return this.add.image(corner.x, corner.y, SHEET, key).setOrigin(ox / f.width, oy / f.height).setDepth(depth);
        };
        const low = (a, b) => this.inside(a, b) && 'wk'.includes(this.map.ground[a][b]);
        this.bridgeBand = { a0: ns.a0, a1: ns.a1, b0, b1 };
        for (let a = ns.a0; a <= ns.a1; a++) {
            if (a >= g0 && a <= g1) continue;
            if (low(a, b1 + 1)) put(ns.piers.includes(a) ? 'ns_pilir' : `ns_predni${ISO.hash(a, b1, 63) < 0.5 ? '' : '2'}`, ISO.toScreen(a - 0.5, b1 + 0.5), ISO.depthOf(a, b1, 1), 16, 64);
            if (low(a, b0 - 1)) put(`ns_zadni${ISO.hash(a, b0, 64) < 0.5 ? '' : '2'}`, ISO.toScreen(a - 0.5, b0 - 0.5), ISO.depthOf(a, b0 - 1), 8, 44);
        }
        put('ns_konec_sever', ISO.toScreen(g0 - 0.5, b1 + 0.5), ISO.depthOf(g0 - 1, b1, 2), 290, 200);
        put('ns_konec_jih', ISO.toScreen(g1 + 0.5, b1 + 0.5), ISO.depthOf(g1 + 1, b0) - 1, 340, 170);
        const f = this.textures.getFrame(SHEET, 'ns_lano');
        const foot = this.pos(g0 - 1, ns.rope);
        this.add.image(foot.x, foot.y, SHEET, 'ns_lano').setOrigin(20 / f.width, ((g1 - g0 + 2) * 32 + 120) / f.height).setDepth(ISO.depthOf(g0 - 1, ns.rope));
        // sloupky lana stojí na krajních dlaždicích u zlomu
        this.blocked.add(ISO.key(g0 - 1, ns.rope)); this.blocked.add(ISO.key(g1 + 1, ns.rope));
    }

    // Přechod po laně přes zlom Nuseláku (účinek `rope: 'jih' | 'sever'`): hrdinka visí na laně a ručkuje
    // (hero_lano, ruce na laně), lano se pod ní prověšuje; na druhém konci stojí na dlaždici vedle sloupku.
    ropeCross(dir) {
        const ns = this.def?.nusle;
        if (!ns) return Promise.resolve();
        const [g0, g1] = ns.gap, rb = ns.rope;
        const north = this.pos(g0 - 1, rb), south = this.pos(g1 + 1, rb);
        const [from, to] = dir === 'jih' ? [north, south] : [south, north];
        const goal = dir === 'jih' ? { a: g1 + 1, b: rb + 1, L: 0 } : { a: g0 - 1, b: rb + 1, L: 0 };
        const SAG = 56, TOP = 76;
        ensureWalk(this, 'hero_lano', 2);
        this.player.setVisible(false); this.shadow.setVisible(false);
        const hang = this.add.sprite(from.x, from.y - TOP, 'atlas', 'hero_lano_0').setOrigin(13 / 26, 3 / 66).setDepth(1e6).setFlipX(dir !== 'jih');
        if (this.anims.exists('hero_lano_walk')) hang.play('hero_lano_walk');
        this.cameras.main.startFollow(hang, true, 0.12, 0.12);
        return new Promise((resolve) => {
            this.tweens.addCounter({ from: 0, to: 1, duration: 4200, ease: 'Sine.easeInOut', onUpdate: (tw) => {
                const t = tw.getValue();
                hang.setPosition(Math.round(from.x + (to.x - from.x) * t), Math.round(from.y - TOP + (to.y - from.y) * t + Math.sin(t * Math.PI) * SAG));
            }, onComplete: () => {
                hang.destroy();
                this.tile = goal;
                const p = this.pos(goal.a, goal.b);
                this.player.setPosition(p.x, p.y).setDepth(this.depthAt(goal.a, goal.b, 0)).setVisible(true);
                this.shadow.setPosition(p.x, p.y).setDepth(this.depthAt(goal.a, goal.b, 0, -1)).setVisible(true);
                this.path = [];
                this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
                resolve();
            } });
        });
    }

    // Pražské kuriozity v prázdných plochách (def.oddities, art/kuriozity.px.js): každá skupina má dlaždice `on` (znaky
    // mřížky: voda, bahno koryta, svah, pustá hlína) a seznam věcí; každá věc stojí jednou na dlaždici vybrané hashem
    // (stejně při každém hraní), aspoň 6 dlaždic od ostatních, 3 od zastavení a startu, celá plocha kolem musí být stejná.
    placeOddities() {
        const groups = this.def?.oddities;
        if (!groups) return;
        const at = (a, b) => (this.inside(a, b) ? this.map.ground[a][b] : ' ');
        const avoid = [...Object.values(this.stops).flatMap((s) => [s.npc, s.approach]), this.def.start].filter(Boolean);
        const placed = [];
        this.oddities = placed;
        groups.forEach((g, gi) => {
            const cands = [];
            const ar = g.area ?? { a0: 1, a1: this.map.len - 2, b0: Math.max(1, g.minB ?? 1), b1: this.map.wid - 2 };
            for (let a = Math.max(1, ar.a0); a <= Math.min(this.map.len - 2, ar.a1); a++) for (let b = Math.max(1, ar.b0); b <= Math.min(this.map.wid - 2, ar.b1); b++) {
                let all = true;
                const r = g.area ? 0 : 1;
                for (let da = -r; da <= r && all; da++) for (let db = -r; db <= r; db++) if (!g.on.includes(at(a + da, b + db))) { all = false; break; }
                if (!all || (walkable(this.map, a, b) && this.blocked.has(ISO.key(a, b)))) continue;
                if (!g.area && this.bridgeBand && a >= this.bridgeBand.a0 - 2 && a <= this.bridgeBand.a1 + 2 && b >= this.bridgeBand.b0 - 3 && b <= this.bridgeBand.b1 + 3) continue;
                if (avoid.some((p) => Math.abs(p.a - a) + Math.abs(p.b - b) < 4)) continue;
                cands.push({ a, b, h: ISO.hash(a, b, 90 + gi) });
            }
            cands.sort((p, q) => p.h - q.h);
            g.keys.forEach((key) => {
                const spot = cands.find((c) => placed.every((p) => Math.max(Math.abs(p.a - c.a), Math.abs(p.b - c.b)) >= (g.area ? 3 : 6)));
                if (!spot) return;
                placed.push({ ...spot, key });
                const thing = this.placeThing(key, spot.a, spot.b, { anim: true, block: g.block !== false, flip: ISO.hash(spot.a, spot.b, 99) < 0.5 });
                // obří věci (mlok, hlavy, socha, ručička metronomu) jsou dvojnásobné, celým násobkem kvůli pixelům
                if (ODDITY_SCALE[key]) thing.setScale(ODDITY_SCALE[key]);
                const said = ODDITY_LINES[key];
                if (said) this.talkingOddities.push({ sprite: thing, lines: [...said.lines, ...(ODDITY_GROUPS[said.group] ?? [])], next: 0 });
                this.props?.push(thing);
            });
        });
    }

    // Bublina s hláškou nad kuriozitou (ODDITY_LINES): každé klepnutí další hláška, po pár vteřinách zmizí.
    oddityBubble(odd) {
        this.bubble?.destroy();
        const text = odd.lines[odd.next % odd.lines.length];
        odd.next++;
        const top = odd.sprite.getBounds();
        const label = body(this, 0, 0, text, { fontSize: '24px', color: CRT.amber, align: 'center', wordWrap: { width: 340 }, lineSpacing: -4 }).setOrigin(0.5, 1);
        const w = label.width + 24, h = label.height + 14;
        const back = this.add.rectangle(0, -h / 2 + 7, w, h, 0x000000, 0.85).setStrokeStyle(2, CRT.lineDim);
        const tail = this.add.triangle(0, 14, -8, 0, 8, 0, 0, 10, 0x000000, 0.85);
        label.setY(0);
        this.bubble = this.add.container(Math.round(top.centerX), Math.round(top.top - 18), [back, tail, label]).setDepth(1e7);
        this.registry.get('sound')?.tick?.();
        this.time.delayedCall(4500, () => { if (this.bubble && this.bubble.list.includes(label)) { this.bubble.destroy(); this.bubble = null; } });
    }

    // Lampy na zábradlí mostu: lampa z OSM v pásu mostu se posadí na hranu mostovky podle toho, na které straně osy stojí.
    bridgeLamp(p) {
        const br = this.def?.bridge, band = this.bridgeBand;
        if (!br || !band || p.a < band.a0 - 0.5 || p.a > band.a1 + 0.5 || p.b < band.b0 - 2 || p.b > band.b1 + 2) return null;
        if (p.k !== 'lamp') return false;
        const line = br.axis, i = Math.max(1, line.findIndex(([a]) => a > p.a));
        const [[a0, bb0], [a1, bb1]] = [line[Math.min(i, line.length - 1) - 1], line[Math.min(i, line.length - 1)]];
        const axis = bb0 + (bb1 - bb0) * Math.max(0, Math.min(1, (p.a - a0) / (a1 - a0)));
        return { a: p.a, b: p.b > axis ? band.b1 + 0.45 : band.b0 - 0.45 };
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
        const atlas = ['atlas', 'landmarks_staromak', 'landmarks_hrad', 'landmarks_kuriozity', 'landmarks_nusle'].find((t) => this.textures.exists(t) && (this.textures.get(t).has(key) || this.textures.get(t).has(`${key}_0`))) ?? 'atlas';
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
        const props = lay.props.map((p) => {
            const thing = this.placeThing(p.key, p.a, p.b, p);
            // rekvizita s hláškami (say: klíč v ODDITY_LINES) se nebere jako zastavení, klepnutí ukáže bublinu (nutrie na břehu)
            const said = p.say && ODDITY_LINES[p.say];
            if (said) this.talkingOddities.push({ sprite: thing, lines: [...said.lines, ...(ODDITY_GROUPS[said.group] ?? [])], next: 0 });
            return thing;
        });
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
        const band = this.bridgeBand;
        const onBridge = (a, b) => band && a >= band.a0 - 1 && a <= band.a1 + 1 && b >= band.b0 - 1 && b <= band.b1 + 1;
        const ok = (a, b) => this.free(a, b) && !this.reserved.has(ISO.key(a, b)) && !nearStart(a, b) && !onBridge(a, b);
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
            const lamp = this.bridgeLamp(p);
            if (lamp === false) return;
            if (lamp) { this.props.push(this.placeAt('lamp', lamp.a, lamp.b)); return; }
            if (this.def?.bridge && (this.def.bridge.bed ?? ['h']).includes(at(ta, tb))) return;
            // na mostovce Nuseláku nic z OSM (stromy a lavičky jsou z parku pod mostem)
            if (this.def?.nusle && band && ta >= band.a0 && ta <= band.a1 && tb >= band.b0 - 1 && tb <= band.b1 + 1) return;
            // na suti svahu zůstanou jen stromy
            if (at(ta, tb) === 'k' && p.k !== 'tree') return;
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
        // přes zlom Nuseláku vede lano: oba jeho konce se počítají jako dosažitelné (když je dosažitelný aspoň jeden)
        const ns = this.def?.nusle, starts = [this.tile];
        if (ns) {
            const ends = [{ a: ns.gap[0] - 1, b: ns.rope + 1, L: 0 }, { a: ns.gap[1] + 1, b: ns.rope + 1, L: 0 }];
            if (ends.some((e) => this.findPath(this.tile, e).length || (e.a === this.tile.a && e.b === this.tile.b))) starts.push(...ends);
        }
        Object.values(this.stops).forEach((stop) => {
            const { a, b, L } = stop.approach;
            const after = stop.after?.approach;
            if (after && !stop.done && (!this.walkable(after.a, after.b, after.L ?? 0) || [stop.after.npc, ...(stop.after.props ?? [])].some((t) => t.a === after.a && t.b === after.b))) this.problems.push(`${stop.id}: přístup po vyřešení ${after.a},${after.b} není průchozí`);
            if (!this.walkable(a, b, L)) this.problems.push(`${stop.id}: přístup ${a},${b} (úroveň ${L}) není průchozí`);
            else if (!(this.tile.a === a && this.tile.b === b && this.tile.L === L) && !starts.some((t) => (t.a === a && t.b === b) || this.findPath(t, stop.approach).length)) this.problems.push(`${stop.id}: přístup ${a},${b} (úroveň ${L}) není dosažitelný ze startu`);
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
        return Object.values(this.stops).find((stop) => (stop.npc.a === a && stop.npc.b === b && stop.npc.L === L) || stop.props.some((p) => !p.say && p.a === a && p.b === b && (p.L ?? 0) === L));
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
        if (this.busy || this.hud?.panel || this.hud?.quests || this.hud?.jumps) return;
        const world = pointer.positionToCamera(this.cameras.main);
        // Klepnutí na postavu (i na její hlavu nad sousední dlaždicí) má přednost před dlaždicí pod prstem.
        const hit = Object.values(this.stops).find((stop) => stop.sprite.getBounds().contains(world.x, world.y));
        if (hit) { this.goToStop(hit.id); return; }
        const odd = (this.talkingOddities ?? []).find((o) => o.sprite.active && o.sprite.getBounds().contains(world.x, world.y));
        if (odd) { this.oddityBubble(odd); return; }
        const through = this.doorAt(world.x, world.y);
        if (through) { this.goTo(through); return; }
        const target = this.pick(world.x, world.y);
        if (!this.inside(target.a, target.b)) return;
        const stop = this.stopAt(target.a, target.b, target.L);
        if (stop) { this.goToStop(stop.id); return; }
        this.goTo(target);
    }

    // Vchod do budovy (podchod z def.tunnels, dveře odbavovací haly na Hlaváku): obdélník na obrazovce kolem portálu ve
    // fasádě za vstupní dlaždicí (fasáda k divákovi, druhý konec podchodu leží za ní, k −b). Klepnutí tam pošle hrdinku
    // ke dveřím a skrz na druhou stranu.
    doorAt(x, y) {
        for (const { from, to } of this.def?.tunnels ?? []) {
            for (const [near, far] of [[from, to], [to, from]]) {
                if ((near.L ?? 0) !== 0 || far.b >= near.b) continue;
                const p = this.pos(near.a, near.b), q = this.pos(near.a, near.b - 1);
                const fx = (p.x + q.x) / 2, fy = (p.y + q.y) / 2;
                if (Math.abs(x - fx) <= 56 && y >= fy - 120 && y <= fy + 6) return { L: 0, ...far };
            }
        }
        return null;
    }

    // Ruka místo šipky nad tím, na co jde klepnout (postava, kuriozita s hláškou, vchod do budovy).
    hover(pointer) {
        if (!this.player) return;
        const world = pointer.positionToCamera(this.cameras.main);
        const t = this.pick(world.x, world.y);
        const on = Object.values(this.stops).some((s) => s.sprite.getBounds().contains(world.x, world.y))
            || (this.talkingOddities ?? []).some((o) => o.sprite.active && o.sprite.getBounds().contains(world.x, world.y))
            || this.doorAt(world.x, world.y) || (this.inside(t.a, t.b) && this.stopAt(t.a, t.b, t.L));
        this.input.setDefaultCursor(on ? 'pointer' : 'default');
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
        if (result.rope) await this.ropeCross(result.rope);
        this.input.keyboard.resetKeys();
        this.busy = false;
        if (result.dead) { this.die(); return; }
        if (result.travel) { this.travel(result.travel); return; }
        if (result.ending) { this.scene.stop('hud'); this.scene.start('ending', { result: result.ending }); return; }
        this.refreshGates();
        this.refreshStops();
    }

    // Filmeček nad světem (CUTSCENES[key], účinek `film` u volby): svět a HUD stojí, po dohrání se pokračuje tam, kde byl.
    film(key) {
        return new Promise((resolve) => {
            this.scene.pause('hud');
            this.scene.pause();
            this.scene.launch('cutscene', { key, onDone: (cutscene) => {
                cutscene.scene.stop();
                this.scene.resume('hud');
                this.scene.resume();
                this.input.keyboard.resetKeys();
                resolve();
            } });
            this.scene.bringToTop('cutscene');
        });
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
        this.hud?.drawMiniStops?.();
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
            if (!this.path.length && !this.busy && !this.hud?.panel && !this.hud?.quests && !this.hud?.jumps) {
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
