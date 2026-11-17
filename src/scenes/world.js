import Phaser from 'phaser';
import * as ISO from '../iso';
import { ensureWalk, CRT, body, MOBILE } from '../ui';
import { save, savePosition, clearPosition, maxHp } from '../state';
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
const WRECKS = ['car_wreck_a', 'car_wreck_b', 'car_wreck_c', 'car_wreck_burnt', 'car_wreck_crushed', 'car_wreck_flipped', 'car_wreck_burnt'];
const UPPER_DEPTH = 60000; // horní úroveň se kreslí nad vším na zemi (hala pod ní, Fantova budova za ní)
const k3 = (a, b, L) => `${a},${b},${L}`;

// Kurzory myši ve světě (art/kurzory.px.js, 16 × 16 v atlasu): zvětšené dvakrát do data URL pro CSS cursor, bod kurzoru
// v bodech zvětšeného obrázku. Vyrobí se jednou za běh hry.
const CURSOR_HOT = { jit: [1, 1], ne: [15, 15], mluvit: [15, 15], oko: [16, 16], dvere: [16, 16] };
const CURSOR_CSS = {};

// Drobnosti na zemi (art/drobnosti.px.js, WorldScene.placeClutter): co leží na kterém povrchu (znak mřížky) a jak
// hustě (podíl dlaždic). Druh vybírá hash dlaždice, takže je rozsev při každém hraní stejný. U zdi domu padá suť a cihly.
const CLUTTER = {
    r: { rate: 0.3, keys: ['sut_1', 'sut_2', 'strepy_1', 'papiry_1', 'papiry_2', 'plechovky_1', 'kaluz_1', 'sut_3', 'hadry_1', 'listi_1'] },
    p: { rate: 0.34, keys: ['papiry_1', 'papiry_2', 'papiry_3', 'sut_1', 'sut_2', 'strepy_1', 'plevel_1', 'plevel_2', 'plechovky_1', 'listi_1', 'listi_2', 'kaluz_2', 'prkna_1', 'hadry_2'] },
    n: { rate: 0.3, keys: ['papiry_1', 'papiry_3', 'strepy_1', 'strepy_2', 'sut_1', 'plechovky_2', 'hadry_1'] },
    f: { rate: 0.28, keys: ['plevel_1', 'plevel_2', 'plevel_3', 'listi_1', 'listi_2', 'sut_1', 'papiry_2'] },
    g: { rate: 0.3, keys: ['plevel_1', 'plevel_2', 'plevel_3', 'listi_1', 'listi_2', 'sut_2', 'prkna_1', 'prkna_2', 'plechovky_2'] },
    '.': { rate: 0.3, keys: ['plevel_1', 'plevel_3', 'sut_1', 'sut_3', 'prkna_2', 'cihly_1', 'plechovky_1', 'listi_2', 'hadry_2'] },
    m: { rate: 0.12, keys: ['prkna_1', 'papiry_1', 'plechovky_1'] },
};
const CLUTTER_WALL = ['sut_1', 'sut_2', 'sut_3', 'cihly_1', 'cihly_2', 'sut_2', 'strepy_1'];
// Velké skvrny přes víc dlaždic na dlažbě a silnici: rozbíjejí opakování vzoru.
const STAINS = ['skvrna_tma_1', 'skvrna_tma_2', 'skvrna_tma_3', 'skvrna_prach_1', 'skvrna_prach_2', 'skvrna_rez_1', 'skvrna_tma_2', 'skvrna_prach_1'];

const ODDITY_SCALE = { kafka: 2, miminko: 2, kun_lucerna: 2, metronom: 2 };

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
        this.talkingOddities = [];
        this.stops = {};
        this.problems = [];
        this.upper = new Map(); // klíč a,b → výška horní úrovně
        this.ringSpots = []; // loďky, od kterých jdou po vodě kruhy
        this.wet = undefined; // živá voda (updateWater) se chystá znovu pro každé místo
        this.upperBlocked = new Set();
        this.links = new Map();
        this.towers = new Map(); // klíč dlaždice věže → { sprite, top }
        this.tunnels = new Set(); // dvojice uzlů spojené podchodem
        this.tunnelDoors = new Map(); // dvojice uzlů → id animovaných dveří
        this.cursorName = null;
        this.reach = null;
    }

    // Grafika místa (díly země ground_<místo>_<n>, domy houses_<místo>_<n>) se nahraje až při vstupu na místo a grafika
    // ostatních míst se uvolní, aby v paměti nebyla celá Praha najednou. Verze z art/version.json v adrese jako v BootScene.
    preload() {
        const options = this.registry.get('options');
        const v = `?v=${art.version}`;
        const keys = [...Array.from({ length: this.map.groundChunks?.sheets ?? 0 }, (_, s) => `ground_${this.map.place}_${s}`), ...Array.from({ length: this.map.real?.sheets ?? 0 }, (_, s) => `domy_${this.map.place}_${s}`),
            // staré listy jen pro kvádry, ke kterým model budov nic nemá (nebo když místo skutečné domy nemá vůbec)
            ...(this.map.real ? [...new Set(this.map.houses.filter((h, i) => !this.map.real.houses[i]).map((h) => `houses_${this.map.place}_${h.key.slice(2, h.key.indexOf('_'))}`))] : Array.from({ length: this.map.houseSheets ?? 0 }, (_, s) => `houses_${this.map.place}_${s}`))];
        Object.keys(PLACES).filter((p) => p !== this.map.place).forEach((p) => this.textures.getTextureKeys().filter((k) => k.startsWith(`ground_${p}_`) || k.startsWith(`houses_${p}_`) || k.startsWith(`domy_${p}_`)).forEach((k) => this.textures.remove(k)));
        keys.filter((k) => !this.textures.exists(k)).forEach((k) => this.load.atlas(k, `${options.images}/${k}.png${v}`, `${options.images}/${k}.json${v}`));
    }

    create() {
        this.cameras.main.setBackgroundColor(CRT.bg);
        this.scene.launch('hud');
        this.hud = this.scene.get('hud');
        this.buildGround();
        this.placeHouses();
        this.placeLandmark();
        this.placeOverlays();
        this.buildBridge();
        this.buildSlope();
        this.buildNusle();
        this.buildUpper();
        this.placeTrains();
        this.placeRoofs();
        this.placeRibs();
        this.placeStops();
        this.placeProps();
        this.placeFences();
        this.placeOddities();
        this.placeClutter();
        this.drawShadows();
        this.placeLights();
        this.placeLife();
        this.placeSwimmers();
        // hudba místa: zatopená místa mají kapky, Hrad temný dron, ostatní ulice
        this.registry.get('sound')?.music({ hrad: 'hrad', staromak: 'voda', nuselak: 'voda', vaclavak: 'voda' }[this.state.place] ?? 'ambient');
        // zvuky místa (vítr, oheň, voda) jedou z update; s koncem scény utichnou
        this.bellState = null;
        this.events.once('shutdown', () => { const s = this.registry.get('sound'); s?.wind(false); s?.fire(9); s?.water(0); s?.hum(0); });
        this.edgeFog();
        this.refreshGates();
        // Příchod: z jiného místa na jeho přestupní dlaždici (arrivals), jinak na start místa.
        // skok z ladění (src/debug.js) na zadanou dlaždici, jen jednou
        const jumpTile = this.registry.get('jumpTile');
        this.registry.set('jumpTile', null);
        // pokračování z průběžného uložení: přesná dlaždice, kde hráčka skončila (state.pos), když je pořád průchozí
        const pos = this.state.pos?.place === this.state.place && this.walkable(this.state.pos.a, this.state.pos.b, this.state.pos.L ?? 0) ? { a: this.state.pos.a, b: this.state.pos.b, L: this.state.pos.L ?? 0 } : null;
        this.spawnPlayer({ L: 0, ...(jumpTile ?? pos ?? this.def?.arrivals?.[this.state.arrival] ?? this.def?.start ?? startTile(this.map)) });
        this.checkStops();
        this.fadeHouses();
        // přepadení: zastavení s ambush, které ještě není vyřešené, osloví hrdinku samo hned po příchodu
        const ambush = Object.entries(this.stops).find(([, stop]) => stop.ambush && !holds(this.state, stop.ambush.until));
        if (ambush) this.time.delayedCall(500, () => this.talk(ambush[0]));
        this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
        // telefon: svět o polovinu blíž, aby postavy a věci šly trefit prstem (je vidět menší kus mapy)
        if (MOBILE) this.cameras.main.setZoom(1.5);
        // Ladění obrazu jako Fallout 1 a 2: méně sytosti, nižší jas, víc kontrastu, tmavé okraje (jen kamera světa, lišta ne).
        if (this.cameras.main.postFX) {
            const grade = this.cameras.main.postFX.addColorMatrix();
            grade.saturate(-0.3);
            grade.brightness(0.68, true);
            grade.contrast(0.28, true);
            // teplý prachový posun: víc červené, méně modré (Fallout je hnědoolivový, ne šedý)
            const warm = this.cameras.main.postFX.addColorMatrix();
            warm.set([1.08, 0.02, 0, 0, 0.015, 0, 1.0, 0, 0, 0.008, 0, 0, 0.8, 0, 0, 0, 0, 0, 1, 0]);
            this.cameras.main.postFX.addVignette(0.5, 0.5, 0.9, 0.5);
        }
        this.input.on('pointerdown', (pointer) => this.onPointer(pointer));
        this.input.on('pointermove', (pointer) => this.hover(pointer));
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys('W,A,S,D');
        this.input.keyboard.addCapture(['UP', 'DOWN', 'LEFT', 'RIGHT']);
        this.makeCursors();
        this.reach = null;
        // značka dlaždice pod myší (art/kurzory.px.js), schovaná, dokud kurzor nestojí nad zemí
        this.tileMark = this.add.image(0, 0, 'atlas', 'kurzor_dlazdice').setVisible(false);
        // Checkpoint: příchod na místo ukládá stav (při pokračování z průběžného uložení ne, checkpoint zůstává z příchodu).
        this.state.visited[this.state.place] = true;
        if (!pos) save(this.state);
        // Průběžné uložení s dlaždicí: po každém rozhovoru a každé dvě vteřiny, když se zrovna nic neděje.
        this.autosave();
        this.time.addEvent({ delay: 2000, loop: true, callback: () => this.autosave() });
    }

    autosave() {
        if (this.busy || this.moving || !this.player || this.state.hp <= 0 || this.hud?.panel) return;
        this.state.pos = { place: this.state.place, a: this.tile.a, b: this.tile.b, L: this.tile.L ?? 0 };
        savePosition(this.state);
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
        // polorovina obrazovky za vzdálenou hranou mostovky (pod zábradlím km_far)
        const e0 = ISO.toScreen(-8, b0 - 0.5), e1 = ISO.toScreen(this.map.len + 8, b0 - 0.5);
        const behind = this.make.graphics().fillStyle(0xffffff).fillPoints([{ x: e0.x, y: e0.y }, { x: e1.x, y: e1.y }, { x: e1.x, y: e1.y - 6000 }, { x: e0.x, y: e0.y - 6000 }], true).createGeometryMask();
        for (let a = 0; a < this.map.len; a++) for (let b = 0; b < this.map.wid; b++) {
            if (isBed(a, b) || onDeck(a, b)) continue;
            // úzké zálivy koryta u věží (br.noQuay): vysoká zeď by tam stála sama jako stěna bez domu, břeh zůstane plochý
            if ((br.noQuay ?? []).some((r) => a >= r.a0 && a <= r.a1 && b >= r.b0 && b <= r.b1)) continue;
            const v = ISO.hash(a, b, 61) < 0.5 ? '' : '2';
            const walls = [];
            if (isBed(a, b + 1)) walls.push(put(`km_quay_b${v}`, ISO.toScreen(a - 0.5, b + 0.5), ISO.depthOf(a, b) - 1, 8, 40));
            if (isBed(a - 1, b)) walls.push(put(`km_quay_a${v}`, ISO.toScreen(a - 0.5, b + 0.5), ISO.depthOf(a, b) - 1, 80, 40));
            // zeď za mostem visí hluboko dolů a na obrazovce by přešla přes mostovku (ta je jen namalovaná zem): ořízne ji
            // maska podél vzdálené hrany mostu
            if (b < b0 && b >= b0 - 6) walls.forEach((w) => w.setMask(behind));
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
            if (low(a, b1 + 1) && a === ns.tagPier) this.lookAt(put('ns_pilir_tag', ISO.toScreen(a - 0.5, b1 + 0.5), ISO.depthOf(a, b1, 1), 16, 64), 'pilir_tag', { a, b: b1 });
            else if (low(a, b1 + 1)) put(ns.piers.includes(a) ? 'ns_pilir' : `ns_predni${ISO.hash(a, b1, 63) < 0.5 ? '' : '2'}`, ISO.toScreen(a - 0.5, b1 + 0.5), ISO.depthOf(a, b1, 1), 16, 64);
            if (low(a, b0 - 1)) put(`ns_zadni${ISO.hash(a, b0, 64) < 0.5 ? '' : '2'}`, ISO.toScreen(a - 0.5, b0 - 0.5), ISO.depthOf(a, b0 - 1), 8, 44);
        }
        // křídlo opěry: dvě dlaždice před první dlaždicí trouby na severním břehu, ať trouba nezačíná uříznutá ve vzduchu
        const first = Array.from({ length: ns.a1 - ns.a0 + 1 }, (_, i) => ns.a0 + i).find((a) => low(a, b1 + 1));
        if (first > ns.a0 + 1 && this.textures.getFrame(SHEET, 'ns_kridlo')) {
            put('ns_kridlo', ISO.toScreen(first - 2.5, b1 + 0.5), ISO.depthOf(first - 1, b1, 1), 16, 128);
            // dlaždice, přes které křídlo visí, jsou bočnice mostu, ne zem: nedá se na ně vstoupit
            this.blocked.add(ISO.key(first - 2, b1 + 1)); this.blocked.add(ISO.key(first - 1, b1 + 1));
        }
        put('ns_konec_sever', ISO.toScreen(g0 - 0.5, b1 + 0.5), ISO.depthOf(g0 - 1, b1, 2), 290, 200);
        this.lookAt(put('ns_konec_jih', ISO.toScreen(g1 + 0.5, b1 + 0.5), ISO.depthOf(g1 + 1, b0) - 1, 340, 170), 'ns_souprava', { a: g1, b: b1 });
        // Stanice Vyšehrad pod silnicí (ns.station): silnice je o patro výš než terén u mola. Od její hrany (řada edge)
        // visí k +b stěna po dílech: holý beton, prosklené čelo haly, klín do terénu; řada pod hranou je neprůchozí
        // kromě schodů. Ve vozovce je díra s kolejemi (plochý sprite na zemi, dlaždice pod ním blokují).
        const st = ns.station;
        if (st) {
            const face = (key, a) => { put(key, ISO.toScreen(a - 0.5, st.edge + 0.5), ISO.depthOf(a, st.edge + 1) - 1, 0, 48); this.blocked.add(ISO.key(a, st.edge + 1)); };
            for (let a = st.plain[0]; a <= st.plain[1]; a++) face('ns_st_zed', a);
            for (let a = st.glass[0]; a <= st.glass[1]; a++) face(ISO.hash(a, st.edge, 65) < 0.4 ? 'ns_st_sklo2' : 'ns_st_sklo', a);
            [1, 2, 3].forEach((n, i) => face(`ns_st_klin_${n}`, st.glass[1] + 1 + i));
            put('ns_st_schody', ISO.toScreen(st.stairs - 0.5, st.edge + 0.5), -88000, 0, 80);
            const h = st.hole, hf = this.textures.getFrame('landmarks_nusle', 'lm_vysehrad');
            const anchor = this.center({ a: h.a0, b: h.b0 + h.dpt - 1 });
            this.add.image(anchor.x, anchor.y + ISO.TH / 2, 'landmarks_nusle', 'lm_vysehrad').setOrigin((ISO.TW / 2) * h.dpt / hf.width, 1).setDepth(-88000);
            for (let a = h.a0; a < h.a0 + h.w; a++) for (let b = h.b0; b < h.b0 + h.dpt; b++) this.blocked.add(ISO.key(a, b));
        }
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
                // obří věci (Kafkova hlava, miminko, kůň, ručička metronomu) jsou dvojnásobné, celým násobkem kvůli pixelům
                if (ODDITY_SCALE[key]) thing.setScale(ODDITY_SCALE[key]);
                const said = ODDITY_LINES[key];
                if (said) this.talkingOddities.push({ sprite: thing, lines: [...said.lines, ...(ODDITY_GROUPS[said.group] ?? [])], next: 0, tile: { a: spot.a, b: spot.b } });
                this.props?.push(thing);
            });
        });
    }

    // Ploty (def.fences): dílce plot_1–3 po dlaždicích od from do to, podél a, nebo podél b (zrcadlený sprite). Dlaždice
    // pod dílcem je neprůchozí; střed dílce u země je střed dlaždice.
    placeFences() {
        (this.def?.fences ?? []).forEach(({ from, to }) => {
            const alongA = from[1] === to[1];
            for (let a = from[0]; a <= to[0]; a++) for (let b = from[1]; b <= to[1]; b++) {
                const h = ISO.hash(a, b, 71), c = this.center({ a, b });
                this.add.image(c.x, c.y, 'atlas', h < 0.5 ? 'plot_1' : h < 0.8 ? 'plot_2' : 'plot_3').setOrigin(33 / 66, 62 / 80).setFlipX(!alongA).setDepth(ISO.depthOf(a, b));
                this.blocked.add(ISO.key(a, b));
            }
        });
    }

    // Věc jen ke koukání (vůz, vrak, tramvaj): klíč v ODDITY_LINES, klepnutí ukáže bublinu. Je velká a stojí mezi domy
    // a pod střechami hal, proto se trefuje přesně (exact): klepnutí musí padnout na její bod, který není průhledný
    // a který nezakrývá dům, střecha haly ani přístřešek před ní.
    lookAt(sprite, say, tile, start = 0) {
        const said = ODDITY_LINES[say];
        if (said) this.talkingOddities.push({ sprite, lines: said.lines, next: start, tile, exact: true });
    }

    // Leží bod světa na neprůhledném bodě obrázku?
    solidAt(sprite, x, y) {
        const b = sprite.getBounds();
        if (!b.contains(x, y)) return false;
        const u = (x - b.x) / b.width, fx = Math.floor((sprite.flipX ? 1 - u : u) * sprite.frame.width), fy = Math.floor((y - b.y) / b.height * sprite.frame.height);
        return this.textures.getPixelAlpha(fx, fy, sprite.texture.key, sprite.frame.name) > 40;
    }

    oddAt(world) {
        const { x, y } = world;
        const cover = () => [...this.houses, ...(this.roofs ?? []), ...(this.canopies ?? [])];
        // malá věc (kuriozita, rekvizita) má přednost před stavbou za ní, ze staveb ta nejvíc vpředu
        const hits = (this.talkingOddities ?? []).filter((o) => o.sprite.active && (o.exact
            ? this.solidAt(o.sprite, x, y) && !(o.sprite.mask && this.inHole(x, y, o.sprite.mask)) && !cover().some((c) => c.depth > o.sprite.depth && c.alpha > 0.9 && this.solidAt(c, x, y))
            : (o.pad ? Phaser.Geom.Rectangle.Inflate(o.sprite.getBounds(), o.pad, o.pad) : o.sprite.getBounds()).contains(x, y)));
        return hits.find((o) => !o.exact) ?? hits.sort((p, q) => q.sprite.depth - p.sprite.depth)[0];
    }

    // Bublina s hláškou nad kuriozitou (ODDITY_LINES): každé klepnutí další hláška, po pár vteřinách zmizí.
    oddityBubble(odd, at = null) {
        this.bubble?.destroy();
        // hláška může mít podmínku (if), vlajku, kterou nastaví (flag), a přednost (first: řekne se hned, jakmile platí)
        const pool = odd.lines.filter((l) => typeof l === 'string' || holds(this.state, l.if));
        const urgent = pool.find((l) => l.first);
        const rest = pool.filter((l) => !l.first);
        const entry = urgent ?? rest[odd.next % Math.max(1, rest.length)] ?? '';
        if (!urgent) odd.next++;
        const text = typeof entry === 'string' ? entry : entry.text;
        if (entry.flag) { this.state.flags[entry.flag] = true; this.autosave?.(); }
        odd.said = text;
        const top = odd.sprite.getBounds();
        const label = body(this, 0, 0, text, { fontSize: '24px', color: CRT.amber, align: 'center', wordWrap: { width: 340 }, lineSpacing: -4 }).setOrigin(0.5, 1);
        const w = label.width + 24, h = label.height + 14;
        const back = this.add.rectangle(0, -h / 2 + 7, w, h, 0x000000, 0.85).setStrokeStyle(2, CRT.lineDim);
        const tail = this.add.triangle(0, 14, -8, 0, 8, 0, 0, 10, 0x000000, 0.85);
        label.setY(0);
        // velká věc (stavba, vůz): bublina nad místem klepnutí, jinak nad věcí
        // bublina zůstane celá v obraze (pod horní lištou a mimo okraje), i když věc stojí u kraje
        const view = this.cameras.main.worldView;
        const bx = Phaser.Math.Clamp(at ? at.x : top.centerX, view.x + w / 2 + 8, view.right - w / 2 - 8);
        const by = Math.max(at ? at.y - 24 : top.top - 18, view.y + 64 + h);
        // otevřená minimapa je nad světem: bublina, která by pod ni zajela, se odsune vlevo od ní
        let mx = bx;
        const mini = this.hud?.minimap?.visible && this.hud.minimapBox, zoom = this.cameras.main.zoom;
        if (mini) {
            const left = view.x + (mini.x - 16) / zoom, bottom = view.y + (mini.y + mini.h + 16) / zoom;
            if (bx + w / 2 > left && by - h < bottom) mx = Math.max(view.x + w / 2 + 8, left - w / 2);
        }
        tail.setX(Phaser.Math.Clamp(bx - mx, -w / 2 + 12, w / 2 - 12));
        this.bubble = this.add.container(Math.round(mx), Math.round(by), [back, tail, label]).setDepth(1e7);
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
        this.lookAt(thing, key, { a: mid, b });
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
        this.canopies = [];
        const rule = this.def?.canopies;
        if (!rule) return;
        for (let a = 0; a < this.map.len; a++) for (let b = 0; b < this.map.wid; b++) {
            if (this.map.ground[a][b] !== 'n' || (a >= rule.outside[0] && a <= rule.outside[1])) continue;
            // přístřešky nad perony mimo haly (až po konec peronů), stožáry na peronech mezi nimi
            if (a <= (rule.until ?? this.map.len)) { const c = this.placeThing('canopy', a, b, { block: false }); c.setDepth(ISO.depthOf(a, b, 6)); c.tile = { a, b }; this.canopies.push(c); }
            const mast = (m) => m % rule.mastEvery === 2 && (m < rule.outside[0] - 1 || m > rule.outside[1] + 3);
            if (!mast(a)) continue;
            const pole = this.placeThing('catenary', a, b);
            // trolej od výložníku k dalšímu stožáru na stejném peronu; každá čtvrtá je utržená a visí k zemi
            const next = a + rule.mastEvery;
            const torn = ISO.hash(b, a, 5) < 0.3;
            if (!torn && !(next < this.map.len && this.map.ground[next][b] === 'n' && mast(next))) continue;
            const key = torn ? 'trolej_utrzena' : 'trolej', f = this.textures.getFrame('atlas', key);
            this.add.image(pole.x + 36, pole.y - 120, 'atlas', key).setOrigin(2 / f.width, torn ? 4 / f.height : 1 - 4 / f.height).setDepth(ISO.depthOf(torn ? a : next, b + (torn ? 0 : 3), 7));   // výš než střechy přístřešků, drát vede nad nimi
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
            const sprite = this.add.sprite(x - 2, y + 2, 'atlas', `${d.key}_1`).setOrigin(0, 1).setDepth(ISO.depthOf(d.depthAt.a, d.depthAt.b, d.depthAt.lift));
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
        // v klidu zůstanou pootevřené (snímek 1), aby prosvítalo světlo zevnitř a lákalo dál
        const close = (at) => [3, 2, 1].forEach((f, i) => this.time.delayedCall(at + i * 90, () => setF(f)));
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
    // real: sprite ze skutečné geometrie (scripts/ipr.py) má kotvu v bodech spritu (ox, oy) a výšku stínu tall.
    placeBox(atlas, key, a0, b0, w, dpt, depthAt = null, pass = null, real = null) {
        const texture = this.textures.getFrame(atlas, key);
        const anchor = this.center({ a: a0, b: b0 + dpt - 1 });
        const sprite = this.add.image(anchor.x, anchor.y + ISO.TH / 2, atlas, key).setOrigin(...(real ? [real.ox / texture.width, real.oy / texture.height] : [(ISO.TW / 2) * dpt / texture.width, 1]));
        if (real) sprite.tall = real.tall;
        sprite.setDepth(depthAt ? ISO.depthOf(depthAt.a, depthAt.b, depthAt.lift ?? 0) : ISO.boxDepth(a0, b0, w, dpt));
        sprite.box = { a0, b0, w, dpt };
        // pass: řádek b brány, kterou se prochází (mostecké věže); ostatní dlaždice půdorysu blokují
        for (let a = a0; a < a0 + w; a++) for (let b = b0; b < b0 + dpt; b++) if (b !== pass) this.blocked.add(ISO.key(a, b));
        this.houses.push(sprite);
        return sprite;
    }

    // Vržené stíny kvádrů na zem (Fallout: světlo zleva shora, stín padá doprava dolů, tedy k +b), délka podle výšky.
    // Kontaktní stín (ambient occlusion) u paty každého kvádru: tři soustředné pásy kolem půdorysu, u zdi nejtmavší, ve
    // schodech, ne plynule. Spodek fasády ztmaví tón po svislici (tint dolních rohů spritu), aby dům nebyl přilepený.
    drawShadows() {
        const g = this.add.graphics().setDepth(-90000);
        const corner = (a, b) => ISO.toScreen(a - 0.5, b - 0.5);
        g.fillStyle(0x000000, 0.16);
        [0.6, 0.35, 0.15].forEach((e) => this.houses.forEach((h) => {
            const { a0, b0, w, dpt } = h.box;
            g.fillPoints([corner(a0 - e, b0 - e), corner(a0 + w + e, b0 - e), corner(a0 + w + e, b0 + dpt + e), corner(a0 - e, b0 + dpt + e)], true);
        }));
        this.houses.forEach((h) => h.setTint(0xffffff, 0xffffff, 0xa89f96, 0xa89f96));
        g.fillStyle(0x000000, 0.32);
        this.houses.forEach((h) => {
            const { a0, b0, w, dpt } = h.box;
            const height = h.tall ?? h.height - 32 * (w + dpt);
            const s = Math.max(0.6, Math.min(4, height / 110));
            const pts = [corner(a0, b0), corner(a0 + w, b0), corner(a0 + w, b0 + dpt + s), corner(a0, b0 + dpt + s)];
            g.fillPoints(pts, true);
        });
    }

    placeHouses() {
        this.map.houses.forEach(({ key, a0, b0, w, dpt }, i) => {
            const real = this.map.real?.houses[i];
            if (real) this.placeBox(`domy_${this.map.place}_${real.sheet}`, real.key, a0, b0, w, dpt, null, null, real);
            else this.placeBox(`houses_${this.map.place}_${key.slice(2, key.indexOf('_'))}`, key, a0, b0, w, dpt);
        });
    }

    // Animovaný sprite na stěně domu z mapy (neon Ecomailu na domě Na Můstku): house je roh kvádru (a0, b0), u podél
    // stěny k +b od spodního rohu, v výška nad zemí; side: 'left' je stěna k −a (sprite se zrcadlí). say dá domu hlášku.
    placeOverlays() {
        this.humSpot = null;
        (this.def?.overlays ?? []).forEach(({ key, atlas: still, house, landmark, at, u = 0, v = 0, side, say, center, scale = 1 }) => {
            const sprite = this.houses.find((h) => (landmark ? h.lmKey === landmark : h.box.a0 === house[0] && h.box.b0 === house[1]));
            if (!sprite) { this.problems.push(`overlay ${key}: dům ${landmark ?? house} na mapě není`); return; }
            const left = side === 'left', x = sprite.x + (at ? at[0] : left ? -u : u), y = sprite.y + (at ? at[1] : -u / 2 - v);
            // atlas: nehybný sprite z daného listu (věž paláce Koruna, center: počátek dole uprostřed, scale: celý násobek), jinak animace z atlasu
            if (still) this.add.image(x, y, still, key).setOrigin(center ? 0.5 : left ? 1 : 0, 1).setFlipX(left).setScale(scale).setDepth(sprite.depth + 0.5);
            else {
                const { atlas, frames } = this.idleAnim(key);
                this.add.sprite(x, y, atlas, frames[0]).setOrigin(left ? 1 : 0, 1).setFlipX(left).setDepth(sprite.depth + 0.5).play(`${key}_idle`);
            }
            if (key === 'obalka_neon') this.humSpot = { x, y: sprite.y };
            if (say) this.lookAt(sprite, say, { a: sprite.box.a0, b: sprite.box.b0 });
        });
    }

    // Ruch (art/ruch.px.js): bezejmenní chodci bloumají po ulicích kolem svého místa, hejna holubů zobou a před hrdinkou
    // odletí, krysy se od zdí rozbíhají a před hrdinkou utíkají. Nic z toho není zastavení: nemluví, neblokuje dlaždice
    // a nejde na to klepnout. Počty má místo v `life` (walkers, flocks, rats), jinak podle velikosti mapy; rozmístění
    // vybírá hash, takže je při každém hraní stejné, pohyb je náhodný.
    placeLife() {
        this.life = { walkers: [], flocks: [], rats: [] };
        if (!this.def) return;
        const area = this.map.len * this.map.wid, cfg = this.def.life ?? {};
        const want = { walkers: cfg.walkers ?? Math.min(7, Math.max(2, Math.round(area / 700))), flocks: cfg.flocks ?? Math.min(5, Math.max(1, Math.round(area / 1100))), rats: cfg.rats ?? Math.min(6, Math.max(2, Math.round(area / 900))) };
        const keep = [this.def.start, ...Object.values(this.def.arrivals ?? {}), ...Object.values(this.def.stops ?? {}).flatMap((s) => [s.approach, s.npc])].filter(Boolean);
        const far = (a, b, list, d) => list.every((t) => Math.abs(t.a - a) + Math.abs(t.b - b) >= d);
        // jen tam, kde se hraje: dlaždice dosažitelná ze startu, dál než 4 dlaždice od okraje mapy (tam je tma)
        // a do 16 dlaždic od některého zastavení nebo příchodu; jinak by ruch bloudil pustinou, kam nikdo nedojde
        const from = this.def.start ?? startTile(this.map), seen = new Set([ISO.key(from.a, from.b)]), queue = [{ L: 0, ...from }];
        while (queue.length) for (const nb of this.neighbors(queue.shift())) { if (nb.L) continue; const k = ISO.key(nb.a, nb.b); if (!seen.has(k)) { seen.add(k); queue.push(nb); } }
        const open = (a, b) => this.free(a, b) && 'prfmg'.includes(this.map.ground[a][b]) && seen.has(ISO.key(a, b))
            && a >= 4 && b >= 4 && a < this.map.len - 4 && b < this.map.wid - 4 && keep.some((t) => Math.abs(t.a - a) + Math.abs(t.b - b) <= 16);
        const pickTiles = (n, salt, ok, gap) => {
            const out = [];
            const all = [];
            for (let a = 1; a < this.map.len - 1; a++) for (let b = 1; b < this.map.wid - 1; b++) if (ok(a, b)) all.push({ a, b, h: ISO.hash(a, b, salt) });
            all.sort((p, q) => p.h - q.h);
            for (const t of all) { if (out.length >= n) break; if (far(t.a, t.b, out, gap) && far(t.a, t.b, keep, 4)) out.push(t); }
            return out;
        };
        const kinds = ['chodec_a', 'chodec_b', 'chodec_c', 'chodec_d'];
        kinds.forEach((k) => { ensureWalk(this, k); ensureWalk(this, `${k}_up`); });
        ensureWalk(this, 'holoubek', 2); ensureWalk(this, 'holoubek_let', 2); ensureWalk(this, 'krysa', 2);
        const around = (a, b) => [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([da, db]) => open(a + da, b + db));
        pickTiles(want.walkers, 301, (a, b) => around(a, b) && this.map.ground[a][b] !== 'g', 9).forEach((t, i) => {
            const key = kinds[Math.floor(ISO.hash(t.a, t.b, 302) * kinds.length)];
            const p = this.pos(t.a, t.b);
            const sprite = this.add.sprite(p.x, p.y, 'atlas', `${key}_1`).setOrigin(0.5, 1).setDepth(ISO.depthOf(t.a, t.b));
            this.life.walkers.push({ sprite, key, tile: { a: t.a, b: t.b }, home: { a: t.a, b: t.b }, dir: [1, 0], wait: 500 + i * 900, move: null, up: false });
        });
        pickTiles(want.flocks, 311, (a, b) => around(a, b) && 'pr'.includes(this.map.ground[a][b]), 12).forEach((t) => {
            const c = this.pos(t.a, t.b), n = 3 + Math.floor(ISO.hash(t.a, t.b, 312) * 3);
            const birds = Array.from({ length: n }, (_, i) => {
                const hx = ISO.hash(t.a + i, t.b, 313), hy = ISO.hash(t.a, t.b + i, 314);
                const x = c.x + (hx - 0.5) * 70, y = c.y + (hy - 0.5) * 30;
                const s = this.add.sprite(x, y, 'atlas', 'holoubek_0').setOrigin(0.5, 1).setDepth(ISO.depthOf(t.a, t.b)).setFlipX(hx < 0.5).play({ key: 'holoubek_walk', startFrame: i % 2 });
                s.anims.timeScale = 0.2 + hy * 0.25;
                return { s, x, y };
            });
            this.life.flocks.push({ tile: { a: t.a, b: t.b }, birds, away: 0 });
        });
        const byWall = (a, b) => open(a, b) && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([da, db]) => this.inside(a + da, b + db) && 'b.L'.includes(this.map.ground[a + da][b + db]));
        pickTiles(want.rats, 321, byWall, 8).forEach((t, i) => {
            const p = this.pos(t.a, t.b);
            const sprite = this.add.sprite(p.x, p.y - 2, 'atlas', 'krysa_0').setOrigin(0.5, 1).setDepth(ISO.depthOf(t.a, t.b));
            this.life.rats.push({ sprite, tile: { a: t.a, b: t.b }, home: { a: t.a, b: t.b }, dir: [1, 0], wait: 2000 + i * 1300, steps: 0, move: null });
        });
        // Voříšek: jeden na místo, 5 až 10 dlaždic od místa, kam hrdinka přišla (proto až s první dlaždicí hrdinky,
        // z updateLife), aby ho hráčka potkala. Na rozdíl od zbytku ruchu na něj jde klepnout (hláška `voricek`
        // v ODDITY_LINES), pak odběhne.
        if (cfg.dog !== false) this.life.dogSpawn = (hero) => {
            const dist = (a, b) => Math.abs(a - hero.a) + Math.abs(b - hero.b);
            const t = pickTiles(1, 331, (a, b) => around(a, b) && dist(a, b) >= 5 && dist(a, b) <= 10, 0)[0]
                ?? pickTiles(400, 331, around, 0).filter((q) => dist(q.a, q.b) >= 5).sort((p, q) => dist(p.a, p.b) - dist(q.a, q.b))[0];
            if (t) {
                ensureWalk(this, 'voricek'); ensureWalk(this, 'voricek_sed', 2);
                const p = this.pos(t.a, t.b);
                const sprite = this.add.sprite(p.x, p.y, 'atlas', 'voricek_sed_0').setOrigin(0.5, 1).setDepth(ISO.depthOf(t.a, t.b));
                this.life.dog = { sprite, tile: { a: t.a, b: t.b }, home: { a: t.a, b: t.b }, dir: [1, 0], wait: 1500, steps: 0, move: null, mode: 'roam', timer: 0, cool: 0 };
                const said = ODDITY_LINES.voricek;
                if (said) this.talkingOddities.push({ sprite, lines: said.lines, next: 0, tile: this.life.dog.tile, dog: true });
            }
        };
    }

    // Jeden krok bloudění: nejraději rovně, občas zatočí, nevzdálí se od domova dál než reach dlaždic.
    lifeStep(e, reach) {
        const opts = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([da, db]) => {
            const a = e.tile.a + da, b = e.tile.b + db;
            return this.free(a, b) && 'prfmg'.includes(this.map.ground[a][b]) && Math.abs(a - e.home.a) + Math.abs(b - e.home.b) <= reach && !(a === this.tile.a && b === this.tile.b);
        });
        if (!opts.length) return null;
        const straight = opts.find(([da, db]) => da === e.dir[0] && db === e.dir[1]);
        const back = (d) => d[0] === -e.dir[0] && d[1] === -e.dir[1];
        const turn = opts.filter((d) => d !== straight && !back(d));
        const d = straight && Math.random() < 0.72 ? straight : turn.length ? turn[Math.floor(Math.random() * turn.length)] : straight ?? opts[Math.floor(Math.random() * opts.length)];
        e.dir = d;
        return { a: e.tile.a + d[0], b: e.tile.b + d[1] };
    }

    // Zvuky místa podle toho, kde hrdinka stojí (jednou za 300 ms): vítr všude, praskání nejbližšího ohně do 600 bodů,
    // šplouchání vody do 5 dlaždic.
    // Krok hrdinky: zvuk podle povrchu dlaždice (prkna lávky, tráva a hlína, dlažba), v halách místa (echo) a v podchodu s ozvěnou.
    stepSound(echo = false) {
        const { a, b, L } = this.tile;
        const g = L === 0 && this.inside(a, b) ? this.map.ground[a][b] : 'p';
        const hall = echo || (this.def?.echo ?? []).some((r) => (r.L ?? 0) === L && a >= r.a[0] && a <= r.a[1] && b >= r.b[0] && b <= r.b[1]);
        this.registry.get('sound')?.step(g === 'm' ? 'wood' : 'gf'.includes(g) ? 'soft' : 'stone', hall);
    }

    // Zvony místa (bells v src/places): if + every = bije, jakmile podmínka začne platit, a pak po every ms; near = jednou,
    // když hrdinka přijde na near dlaždic. Hlasitost podle vzdálenosti.
    updateBells(sound, step) {
        (this.def?.bells ?? []).forEach((bell, i) => {
            const st = (this.bellState ??= [])[i] ??= { was: !bell.if || holds(this.state, bell.if), t: 0, rung: false };
            const dist = Math.abs(bell.a - this.tile.a) + Math.abs(bell.b - this.tile.b);
            const k = Math.max(0.15, 1 - dist / 40);
            const ok = !bell.if || holds(this.state, bell.if);
            st.t += step;
            if (ok && ((bell.if && !st.was) || (bell.every && st.t >= bell.every) || (bell.near && !st.rung && dist <= bell.near))) { sound.toll(k); st.t = 0; st.rung = true; }
            st.was = ok;
        });
    }

    // Živá voda (art/voda.px.js): hladina je zapečená v dílech země, hýbou se na ní malé animace. Několikrát za vteřinu
    // se zkusí pár náhodných bodů ve výřezu kamery; kde je voda, rozsvítí se vlnka, odlesk nebo kruh, těsně u břehu,
    // mola a lávky pěna. Sprite se přehraje jednou a vrátí se do zásoby, takže jich je naráz jen pár desítek, ať je vody
    // na mapě sebevíc. Leží hned nad zemí pod drobnostmi, stíny a vším ostatním; okraje spritu musí být taky nad vodou,
    // aby vlnka nelezla na prkna mola.
    updateWater(delta) {
        if (this.wet === undefined) {
            this.wet = this.map.ground.some((row) => [...row].includes('w')) && Boolean(this.textures.getFrame('atlas', 'vlnka_0'));
            this.waterPool = [];
            this.waterT = 0;
            if (this.wet) for (const key of ['vlnka', 'vlnka_b', 'odlesk', 'kruh', 'pena']) {
                const frames = this.textures.get('atlas').getFrameNames().filter((n) => n.startsWith(`${key}_`) && /^\d+$/.test(n.slice(key.length + 1))).sort((p, q) => Number(p.split('_').pop()) - Number(q.split('_').pop()));
                if (!this.anims.exists(`${key}_voda`)) this.anims.create({ key: `${key}_voda`, frames: frames.map((frame) => ({ key: 'atlas', frame })), frameRate: key === 'odlesk' ? 8 : 6 });
            }
        }
        if (!this.wet || (this.waterT -= delta) > 0) return;
        this.waterT = 45;
        const view = this.cameras.main.worldView;
        const water = (x, y) => { const t = ISO.toGrid(x, y); return this.inside(t.a, t.b) && this.map.ground[t.a][t.b] === 'w' && !this.upper.has(ISO.key(t.a, t.b)); };
        for (let i = 0; i < 10; i++) {
            const x = Math.round(view.x + Math.random() * view.width), y = Math.round(view.y + Math.random() * view.height);
            // místo pro celý sprite: střed i oba konce podél osy a nad vodou
            if (!water(x, y) || !water(x - 18, y + 9) || !water(x + 18, y - 9)) continue;
            // břeh: kousek dál v některém směru dlaždic už voda není
            const shore = [[36, 18], [-36, -18], [36, -18], [-36, 18]].some(([dx, dy]) => !water(x + dx, y + dy));
            const r = Math.random();
            const key = shore ? (r < 0.7 ? 'pena' : 'vlnka_b') : r < 0.5 ? 'vlnka' : r < 0.8 ? 'vlnka_b' : r < 0.93 ? 'odlesk' : 'kruh';
            this.ripple(key, x, y);
        }
        // neonová obálka Na Můstku se zrcadlí: odlesky v její barvě na vodě pod ní
        if (this.humSpot) {
            const x = Math.round(this.humSpot.x + (Math.random() - 0.5) * 420), y = Math.round(this.humSpot.y + Math.random() * 240);
            if (water(x, y)) this.ripple('odlesk', x, y, 0x39ff9a);
        }
        // kruhy od loděk a za plavci
        if ((this.ringT = (this.ringT ?? 0) - 45) <= 0) {
            this.ringT = 1500;
            for (const spot of this.ringSpots ?? []) {
                const x = Math.round(spot.x + (Math.random() - 0.5) * 30), y = Math.round(spot.y + 2 + Math.random() * 8);
                if (view.contains(x, y) && water(x, y)) this.ripple('kruh', x, y);
            }
            for (const w of this.swimmers ?? []) if (!w.rest && view.contains(w.sprite.x, w.sprite.y)) this.ripple('kruh', Math.round(w.sprite.x - w.dir * 30), Math.round(w.sprite.y + w.dir * 15));
        }
    }

    // Jedna animace na hladině ze zásoby (vlnka, odlesk, kruh, pena); tint přibarví odlesk neonu.
    ripple(key, x, y, tint = null) {
        const s = this.waterPool.pop() ?? this.add.sprite(0, 0, 'atlas', 'vlnka_0').setFlipX(true).setDepth(-99000).on('animationcomplete', () => { s.setVisible(false); this.waterPool.push(s); });
        s.setPosition(x, y).setVisible(true).play(`${key}_voda`);
        if (tint) s.setTint(tint); else s.clearTint();
        s.anims.timeScale = 0.7 + Math.random() * 0.6;
    }

    // Plavci (swimmers v src/places/<místo>.js, sprite plavec): každý plave ve své dráze podél osy a tam a zpátky,
    // na obrátce si chvíli odpočine. Klepnutí ukáže hlášku (ODDITY_LINES podle say), za plavcem zůstávají kruhy.
    placeSwimmers() {
        const cfg = this.def?.swimmers;
        this.swimmers = [];
        if (!cfg || !this.textures.getFrame('atlas', 'plavec_0')) return;
        this.idleAnim('plavec');
        const said = ODDITY_LINES[cfg.say];
        cfg.lanes.forEach((lane, i) => {
            const a = lane.a[0] + ISO.hash(i, 7, 91) * (lane.a[1] - lane.a[0]);
            const sprite = this.add.sprite(0, 0, 'atlas', 'plavec_0').setOrigin(0.5, 0.7).play({ key: 'plavec_idle', startFrame: i % 4 });
            sprite.anims.timeScale = 0.6;
            const w = { sprite, lane, a, dir: i % 2 ? -1 : 1, rest: 0, speed: 0.5 + ISO.hash(i, 3, 92) * 0.2, tile: { a: Math.round(a), b: Math.round(lane.b) } };
            this.swimmers.push(w);
            if (said) this.talkingOddities.push({ sprite, lines: said.lines, next: i * 2, tile: w.tile, pad: 14 });
        });
        this.updateSwimmers(0);
    }

    updateSwimmers(delta) {
        for (const w of this.swimmers ?? []) {
            if (w.rest > 0) {
                w.rest -= delta;
                if (w.rest <= 0) { w.dir = -w.dir; w.sprite.anims.resume(); }
            } else {
                w.a += w.dir * w.speed * delta / 1000;
                if ((w.dir > 0 && w.a >= w.lane.a[1]) || (w.dir < 0 && w.a <= w.lane.a[0])) { w.a = Phaser.Math.Clamp(w.a, w.lane.a[0], w.lane.a[1]); w.rest = 1800; w.sprite.anims.pause(); }
            }
            const p = ISO.toScreen(w.a, w.lane.b);
            // tempo je slyšet, když plavec míjí hrdinku (do zhruba šesti dlaždic)
            if (!w.rest && delta && (w.strokeT = (w.strokeT ?? 600) - delta) <= 0) {
                w.strokeT = 850 + Math.random() * 200;
                const near = 1 - Math.hypot(p.x - this.player.x, (p.y - this.player.y) * 2) / 520;
                if (near > 0) this.registry.get('sound')?.splash(near);
            }
            w.tile.a = Math.round(w.a);
            // sprite kouká doleva; k +a (doprava nahoru) se zrcadlí
            w.sprite.setPosition(Math.round(p.x), Math.round(p.y)).setFlipX(w.dir > 0).setDepth(ISO.depthOf(w.a, w.lane.b));
        }
    }

    updateAmbience(delta) {
        if ((this.ambT = (this.ambT ?? 0) - delta) > 0) return;
        this.ambT = 300;
        const sound = this.registry.get('sound');
        if (!sound) return;
        sound.wind(true);
        const fire = Math.min(...(this.fireSpots ?? []).map((f) => Math.hypot(f.x - this.player.x, (f.y - this.player.y) * 2)), Infinity);
        sound.fire(fire / 600);
        let wet = 9;
        for (let da = -5; da <= 5; da++) for (let db = -5; db <= 5; db++) {
            const a = this.tile.a + da, b = this.tile.b + db;
            if (this.inside(a, b) && this.map.ground[a][b] === 'w') wet = Math.min(wet, Math.abs(da) + Math.abs(db));
        }
        sound.water(Math.max(0, 1 - (wet - 1) / 5));
        sound.hum(this.humSpot ? 1 - Math.hypot(this.humSpot.x - this.player.x, (this.humSpot.y - this.player.y) * 2) / 900 : 0);
        this.updateBells(sound, 300);
        this.markStopHoles();
    }

    updateLife(delta) {
        if (!this.life) return;
        if (this.life.dogSpawn && this.tile) { this.life.dogSpawn(this.tile); this.life.dogSpawn = null; }
        const near = (t, d) => this.tile.L === 0 && Math.abs(t.a - this.tile.a) + Math.abs(t.b - this.tile.b) <= d;
        const advance = (e, ms, lift = 0) => {
            const m = e.move; m.t += delta / ms;
            const k = Math.min(1, m.t);
            e.sprite.setPosition(m.from.x + (m.to.x - m.from.x) * k, m.from.y + (m.to.y - m.from.y) * k - lift);
            if (k >= 1) { e.tile = m.tile; e.move = null; e.sprite.setDepth(ISO.depthOf(e.tile.a, e.tile.b)); return true; }
            return false;
        };
        const start = (e, next) => {
            const from = this.pos(e.tile.a, e.tile.b), to = this.pos(next.a, next.b);
            e.move = { from, to, tile: next, t: 0 };
            e.sprite.setDepth(Math.max(ISO.depthOf(e.tile.a, e.tile.b), ISO.depthOf(next.a, next.b)));
            const dx = (next.a + next.b) - (e.tile.a + e.tile.b), dy = (next.b - next.a) - (e.tile.b - e.tile.a);
            return { dx, up: dy < 0 };
        };
        this.life.walkers.forEach((w) => {
            if (w.move) {
                if (advance(w, 640) && (w.steps -= 1) <= 0) { w.wait = 1500 + Math.random() * 6000; w.sprite.stop(); w.sprite.setFrame(`${w.key}${w.up ? '_up' : ''}_1`); }
                return;
            }
            if (near(w.tile, 2)) {   // hrdinka je u něj: zastaví se a otočí se k ní
                if (w.sprite.anims.isPlaying) { w.sprite.stop(); }
                w.sprite.setFrame(`${w.key}_1`).setFlipX(this.player.x > w.sprite.x); w.up = false; w.wait = Math.max(w.wait, 900); return;
            }
            if ((w.wait -= delta) > 0) return;
            if (w.steps <= 0) w.steps = 2 + Math.floor(Math.random() * 7);
            const next = this.lifeStep(w, 9);
            if (!next) { w.wait = 1500; w.steps = 0; return; }
            const { dx, up } = start(w, next);
            if (dx) w.sprite.setFlipX(dx > 0);
            w.up = up; w.sprite.play(`${w.key}${up ? '_up' : ''}_walk`, true);
        });
        this.life.rats.forEach((r) => {
            if (r.move) {
                if (advance(r, 120, 2) && (r.steps -= 1) <= 0) { r.wait = 2500 + Math.random() * 9000; r.sprite.stop(); }
                return;
            }
            const scared = near(r.tile, 2);
            if (!scared && (r.wait -= delta) > 0) return;
            if (r.steps <= 0) { r.steps = scared ? 6 : 2 + Math.floor(Math.random() * 4); if (scared) this.registry.get('sound')?.squeak(); }
            if (scared) { const da = Math.sign(r.tile.a - this.tile.a), db = Math.sign(r.tile.b - this.tile.b); r.dir = da ? [da, 0] : [0, db || 1]; }
            const next = this.lifeStep(r, scared ? 14 : 6);
            if (!next) { r.wait = 1200; r.steps = 0; return; }
            const { dx } = start(r, next);
            if (dx) r.sprite.setFlipX(dx > 0);
            r.sprite.play('krysa_walk', true);
        });
        const d = this.life.dog;
        if (d) {
            const sit = () => { if (d.sprite.anims.currentAnim?.key !== 'voricek_sed_walk' || !d.sprite.anims.isPlaying) { d.sprite.play('voricek_sed_walk'); d.sprite.anims.timeScale = 0.5; } };
            const go = (next) => { const { dx } = start(d, next); if (dx) d.sprite.setFlipX(dx > 0); d.sprite.play('voricek_walk', true); d.sprite.anims.timeScale = 1; };
            const calm = () => { d.mode = 'roam'; d.cool = 30000; d.home = { ...d.tile }; d.steps = 0; d.wait = 2500; };
            const gap = Math.abs(d.tile.a - this.tile.a) + Math.abs(d.tile.b - this.tile.b);
            if (d.move) {
                if (advance(d, d.mode === 'flee' ? 130 : d.mode === 'follow' ? 250 : 420) && (d.steps -= 1) <= 0 && d.mode === 'roam') d.wait = 2000 + Math.random() * 6000;
            } else if (d.mode === 'flee') {   // po klepnutí: chvíli kouká, pak uteče
                if ((d.wait -= delta) > 0) { sit(); d.sprite.setFlipX(this.player.x > d.sprite.x); }
                else {
                if (d.bubble && this.bubble === d.bubble) { this.bubble.destroy(); this.bubble = null; }
                d.bubble = null;
                if (d.steps > 0) {
                    if (!d.run) { d.run = true; const da = Math.sign(d.tile.a - this.tile.a), db = Math.sign(d.tile.b - this.tile.b); d.dir = da ? [da, 0] : [0, db || 1]; d.home = { ...d.tile }; }
                    const next = this.lifeStep(d, 30);
                    if (next) go(next); else d.steps = 0;
                }
                if (d.steps <= 0 && !d.move) { d.run = false; calm(); sit(); }
                }
            } else if (d.mode === 'follow') {   // jde za hrdinkou, drží se dlaždici za ní; za chvíli ho to přejde
                d.timer -= delta;
                if (d.timer <= 0 || gap > 12 || this.tile.L !== 0) { calm(); sit(); }
                else if (gap <= 2) { sit(); d.sprite.setFlipX(this.player.x > d.sprite.x); }
                else {
                    const next = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([da, db]) => ({ a: d.tile.a + da, b: d.tile.b + db, dir: [da, db] }))
                        .filter((t) => this.free(t.a, t.b) && 'prfmg'.includes(this.map.ground[t.a][t.b]) && Math.abs(t.a - this.tile.a) + Math.abs(t.b - this.tile.b) < gap)
                        .sort((p, q) => Math.abs(Math.abs(p.a - this.tile.a) - Math.abs(p.b - this.tile.b)) - Math.abs(Math.abs(q.a - this.tile.a) - Math.abs(q.b - this.tile.b)))[0];
                    if (next) { d.dir = next.dir; go({ a: next.a, b: next.b }); } else sit();
                }
            } else {   // toulá se; když jde hrdinka kolem, přidá se
                d.cool -= delta;
                if (d.cool <= 0 && near(d.tile, 4)) { d.mode = 'follow'; d.timer = 10000 + Math.random() * 8000; }
                else if ((d.wait -= delta) > 0) sit();
                else {
                    if (d.steps <= 0) d.steps = 2 + Math.floor(Math.random() * 5);
                    const next = this.lifeStep(d, 7);
                    if (next) go(next); else { d.steps = 0; d.wait = 1500; }
                }
            }
        }
        this.life.flocks.forEach((f) => {
            if (f.away > 0) {
                f.away -= delta;
                if (f.away <= 0 && near(f.tile, 5)) f.away = 4000;   // dokud je hrdinka poblíž, nevracejí se
                if (f.away <= 0) f.birds.forEach(({ s, x, y }) => { this.tweens.killTweensOf(s); s.setPosition(x, y).setDepth(ISO.depthOf(f.tile.a, f.tile.b)).setAlpha(0).play('holoubek_walk'); s.anims.timeScale = 0.2 + Math.random() * 0.25; this.tweens.add({ targets: s, alpha: 1, duration: 700 }); });
                return;
            }
            if (!near(f.tile, 2)) return;
            f.away = 22000 + Math.random() * 20000;
            this.registry.get('sound')?.flutter();
            f.birds.forEach(({ s }, i) => {
                const side = s.x < this.player.x ? -1 : 1;
                s.play('holoubek_let_walk').setDepth(1e5).setFlipX(side > 0); s.anims.timeScale = 1;
                this.tweens.add({ targets: s, x: s.x + side * (120 + Math.random() * 220), y: s.y - 260 - Math.random() * 200, alpha: 0, delay: i * 70, duration: 1500 + Math.random() * 500, ease: 'Sine.easeIn' });
            });
        });
    }

    placeLandmark() {
        (this.def?.landmark ?? []).forEach(({ atlas, key, real, lift, a0, b0, w, dpt, depthAt, pass, say, overlay }) => {
            // real: stavba z 3D modelu budov (scripts/ipr.py, extras), lift: o kolik bodů stojí nad zemí (terasa)
            const model = real ? this.map.real?.extras?.[real] : null;
            if (real && !model) { this.problems.push(`landmark ${real}: v data/domy-${this.map.place}.json není`); return; }
            const sprite = model ? this.placeBox(`domy_${this.map.place}_${model.sheet}`, model.key, a0, b0, w, dpt, depthAt, pass, model) : this.placeBox(atlas ?? 'landmarks', key, a0, b0, w, dpt, depthAt, pass);
            if (lift) sprite.y -= lift;
            sprite.lmKey = real ?? key;
            // say: stavba jen ke koukání (hlášky v ODDITY_LINES); overlay: animovaný sprite na stěně k +b (neon),
            // u podél stěny od spodního rohu, v výška nad zemí, počátek spritu vlevo dole
            if (say) this.lookAt(sprite, say, { a: a0, b: b0 });
            if (overlay) {
                const { atlas: sheet, frames } = this.idleAnim(overlay.key);
                this.add.sprite(sprite.x + overlay.u, sprite.y - overlay.u / 2 - overlay.v, sheet, frames[0]).setOrigin(0, 1).setDepth(sprite.depth + 0.5).play(`${overlay.key}_idle`);
            }
        });
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
        // after: jedna podoba po vyřešení; stages: víc podob, platí první, jejíž podmínka platí (výloha: hák venku
        // a nutrie venku, hák venku a nutrie spí, nutrie venku a hák ještě vězí). done je číslo podoby (0 = výchozí).
        const base = stop.base ?? stop;
        const stages = base.stages ?? (base.after ? [base.after] : []);
        const done = stages.findIndex((st) => holds(this.state, st.if)) + 1;
        const src = done ? { ...base, ...stages[done - 1] } : base;
        return { done, approach: { L: 0, ...src.approach }, npc: { L: 0, ...src.npc }, props: src.props ?? [] };
    }

    placeStopSprites(lay) {
        const props = lay.props.map((p) => {
            const thing = this.placeThing(p.key, p.a, p.b, p);
            // under: rekvizita leží pod postavou zastavení (loďka, ve které převozník stojí), hloubku má těsně pod ní
            if (p.under) thing.setDepth(this.depthAt(lay.npc.a, lay.npc.b, lay.npc.L ?? 0) - 0.5);
            // loďka na vodě dělá kruhy (WorldScene.updateWater)
            if (/lodka/.test(p.key)) (this.ringSpots ??= []).push({ x: thing.x, y: thing.y - 6 });
            // rekvizita s hláškami (say: klíč v ODDITY_LINES) se nebere jako zastavení, klepnutí ukáže bublinu (nutrie na břehu)
            const said = p.say && ODDITY_LINES[p.say];
            if (said) this.talkingOddities.push({ sprite: thing, lines: [...said.lines, ...(ODDITY_GROUPS[said.group] ?? [])], next: 0, tile: { a: p.a, b: p.b } });
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
            [lay.approach, stop.approach, ...[stop.after, ...(stop.stages ?? [])].filter(Boolean).flatMap((st) => [st.approach, st.npc, ...(st.props ?? [])])].filter((t) => t && !t.L).forEach((t) => this.reserved.add(ISO.key(t.a, t.b)));
            const { npc, props } = this.placeStopSprites(lay);
            this.stops[id] = { ...stop, base: stop, approach: lay.approach, npc: lay.npc, props: lay.props, id, sprite: npc, propSprites: props, done: lay.done };
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
        // co už na svém místě stojí (stejný sprite na stejné dlaždici z minulé podoby), znovu nepřichází ani neskáče
        const stays = (d) => old.some(([, , t]) => t.key === d.key && t.a === d.a && t.b === d.b);
        const covered = new Set(defs.filter(([d]) => d.from === undefined || stays(d)).map(([d]) => ISO.key(d.a, d.b)));
        defs.forEach(([def, sprite]) => {
            const src = old.find(([k]) => k === String(def.from));
            if (!src || stays(def)) return;
            if (def.jump) { this.jumpThing(sprite, { x: src[1].x, y: src[1].y - def.jump }); return; }
            walkers.add(src[0]);
            this.walkThing(src[1], src[2], def, sprite);
        });
        old.forEach(([k, s, t]) => {
            if (walkers.has(k)) return;
            if (covered.has(ISO.key(t.a, t.b))) s.destroy();
            else this.tweens.add({ targets: s, alpha: 0, duration: 400, onComplete: () => s.destroy() });
        });
        Object.assign(stop, { approach: lay.approach, npc: lay.npc, props: lay.props, sprite: npc, propSprites: props, done: lay.done });
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
        // Lavičky: v OSM stojí v řadách po dvou metrech, sprite je delší. Nechá se jen lavička aspoň 1,3 dlaždice od
        // předchozí a natočí se podél řady (směr k nejbližší sousední lavičce), osamělá podél cesty, u které stojí.
        // Sprite běží podél osy a, zrcadlený podél b; náhodné zrcadlení dávalo lavičky křížem přes sebe.
        const benches = (this.map.props ?? []).filter((p) => p.k === 'bench'), benchKept = [];
        const benchFlip = (p, ta, tb) => {
            const other = benches.filter((q) => q !== p && Math.hypot(q.a - p.a, q.b - p.b) < 3).sort((x, y) => Math.hypot(x.a - p.a, x.b - p.b) - Math.hypot(y.a - p.a, y.b - p.b))[0];
            if (other) return Math.abs(other.b - p.b) > Math.abs(other.a - p.a);
            const path = (a, b) => ('fpm'.includes(at(a, b)) ? 1 : 0);
            const alongA = path(ta - 1, tb) + path(ta + 1, tb), alongB = path(ta, tb - 1) + path(ta, tb + 1);
            return alongA === alongB ? ISO.hash(ta, tb, 23) < 0.5 : alongB > alongA;
        };
        // Strom ani keř nesmí zakrýt postavu zastavení: co stojí před ní (větší hloubka) a obrázkem by ji překrylo,
        // se nevysadí. Postavy jsou i podoby zastavení po vyřešení (after).
        const figures = Object.values(this.def?.stops ?? {}).flatMap((st) => [st.npc, st.after?.npc, ...(st.stages ?? []).map((g) => g.npc), ...(st.props ?? []).filter((q) => q.say)]).filter(Boolean).map((n) => ({ ...ISO.foot(n.a, n.b), depth: ISO.depthOf(n.a, n.b) }));
        const hides = (key, a, b) => {
            const frame = this.textures.getFrame('atlas', key);
            if (!frame) return false;
            const { x, y } = ISO.foot(a, b), half = frame.width * 0.4, depth = ISO.depthOf(a, b);
            return figures.some((f) => depth > f.depth && Math.abs(x - f.x) < half + 28 && y > f.y - 96 && y - frame.height < f.y);
        };
        let trams = 0;
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
                // vraky tramvají místa mají společné hlášky (tram_<místo>), každá začíná jinou
                this.lookAt(tram, `tram_${this.map.place}`, { a: ta, b: tb }, trams++);
                this.props.push(tram);
                return;
            }
            const lamp = this.bridgeLamp(p);
            if (lamp === false) return;
            if (lamp) { this.props.push(this.placeAt('lamp', lamp.a, lamp.b)); return; }
            if (this.def?.bridge && (this.def.bridge.bed ?? ['h']).includes(at(ta, tb))) return;
            // na mostovce Nuseláku nic z OSM (stromy a lavičky jsou z parku pod mostem)
            if (this.def?.nusle && band && ta >= band.a0 && ta <= band.a1 && tb >= band.b0 - 1 && tb <= band.b1 + 3) return;
            // na suti svahu zůstanou jen stromy
            if (at(ta, tb) === 'k' && p.k !== 'tree') return;
            if (this.reserved.has(ISO.key(ta, tb)) || nearStart(ta, tb) || this.blocked.has(ISO.key(ta, tb))) return;
            const key = p.k === 'tree' ? ISO.pick(rules.trees ?? ['tree_a'], Math.round(p.a * 100), Math.round(p.b * 100), 22) : p.k;
            const block = p.k === 'tree' && 'g.'.includes(at(ta, tb));
            if (p.k === 'tree' && hides(key, p.a, p.b)) return;
            if (p.k === 'bench') {
                if (benchKept.some((q) => Math.hypot(q.a - p.a, q.b - p.b) < 1.3)) return;
                benchKept.push(p);
                this.props.push(this.placeAt(key, p.a, p.b, { flip: benchFlip(p, ta, tb) }));
                return;
            }
            this.props.push(this.placeAt(key, p.a, p.b, { flip: h < 0.5, block }));
        });
        // vraky aut na silnicích (rules.wreck): jen tam, kde je kolem dokola volno (jedna zablokovaná dlaždice uprostřed
        // volné plochy cestu nezavře), aspoň 6 dlaždic od sebe a od zastavení
        const wrecks = [], stopsAt = Object.values(this.def?.stops ?? {}).flatMap((st) => [st.npc, st.approach]);
        const open = (a, b) => [-1, 0, 1].every((da) => [-1, 0, 1].every((db) => this.free(a + da, b + db)));
        if (rules.wreck) for (let a = 2; a < this.map.len - 2; a++) for (let b = 2; b < this.map.wid - 2; b++) {
            if (at(a, b) !== 'r' || !ok(a, b) || ISO.hash(a, b, 71) >= rules.wreck || !open(a, b)) continue;
            if ([...wrecks, ...stopsAt].some((w) => Math.abs(w.a - a) + Math.abs(w.b - b) < 6)) continue;
            wrecks.push({ a, b });
            this.props.push(this.placeAt(ISO.pick(WRECKS, a, b, 72), a, b, { flip: ISO.hash(a, b, 73) < 0.5, block: true }));
        }
        // sudy s ohněm od sebe a od ohňů zastavení (Robin) aspoň 12 dlaždic
        const fires = Object.values(this.def?.stops ?? {}).flatMap((st) => (st.props ?? []).filter((p) => p.key === 'barrel_fire'));
        for (let a = 0; a < this.map.len; a++) for (let b = 0; b < this.map.wid; b++) {
            const c = at(a, b);
            if (!ok(a, b)) continue;
            const roll = ISO.hash(a, b, 21);
            // keře, harampádí a boudy: posunuté v rámci dlaždice, aby nestály v mřížce
            const ja = a + (ISO.hash(a, b, 41) - 0.5) * 0.6, jb = b + (ISO.hash(a, b, 42) - 0.5) * 0.6;
            if (rules.bush && 'g.'.includes(c) && ISO.hash(a, b, 28) < rules.bush) { if (!hides(ISO.pick(rules.bushes, a, b, 29), ja, jb)) this.props.push(this.placeAt(ISO.pick(rules.bushes, a, b, 29), ja, jb, { flip: ISO.hash(a, b, 30) < 0.5 })); }
            else if (rules.shack && c === 'g' && !near(a, b, 'f') && roll > 1 - rules.shack) this.props.push(this.placeAt('shack', a, b, { flip: ISO.hash(a, b, 24) < 0.5, block: true }));
            else if (rules.fire && 'p.g'.includes(c) && ISO.hash(a, b, 31) < rules.fire && fires.every((f) => Math.abs(f.a - a) + Math.abs(f.b - b) > 12)) { fires.push({ a, b }); this.props.push(this.placeAt('barrel_fire', a, b, { block: true })); }
            else if (rules.junk && 'p.g'.includes(c) && ISO.hash(a, b, 25) < rules.junk) this.props.push(this.placeAt(ISO.pick(rules.junkKeys, a, b, 26), ja, jb, { flip: ISO.hash(a, b, 27) < 0.5, block: true }));
        }
    }

    // Drobnosti a skvrny na zemi: leží naplocho pod stíny domů, nic neblokují. Jeden Blitter místo stovek obrázků.
    // Hustotu místa násobí def.props.clutter (výchozí 1), na horní úrovni a pod střechou haly se nesype.
    placeClutter() {
        const k = this.def?.props?.clutter ?? 1;
        if (!k) return;
        const at = (a, b) => (this.inside(a, b) ? this.map.ground[a][b] : ' ');
        const stains = this.add.blitter(0, 0, 'atlas').setDepth(-96000);
        const litter = this.add.blitter(0, 0, 'atlas').setDepth(-95000);
        const put = (blit, frame, a, b, alpha = 1, flip = false) => {
            const f = this.textures.getFrame('atlas', frame);
            if (!f) return;
            const { x, y } = ISO.toScreen(a, b);
            blit.create(Math.round(x - f.width / 2), Math.round(y - f.height / 2), frame).setAlpha(alpha).setFlipX(flip);
        };
        for (let a = 0; a < this.map.len; a++) for (let b = 0; b < this.map.wid; b++) {
            const c = at(a, b), rule = CLUTTER[c];
            if (!rule || this.upper.has(ISO.key(a, b)) || !this.inside(a - 1, b - 1) || !this.inside(a + 1, b + 1)) continue;
            if ('rpn'.includes(c) && this.inside(a - 2, b - 2) && this.inside(a + 2, b + 2) && ISO.hash(a, b, 51) < 0.07 * k) put(stains, ISO.pick(STAINS, a, b, 52), a, b, 0.55 + ISO.hash(a, b, 53) * 0.35, ISO.hash(a, b, 54) < 0.5);
            const wall = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([da, db]) => at(a + da, b + db) === 'b');
            // dva hody na dlaždici, u zdi hustěji: omítka a cihly padají pod fasádu
            for (let i = 0; i < 2; i++) {
                if (ISO.hash(a, b, 55 + i * 10) >= rule.rate * k * (wall ? 1.6 : 1) * (i ? 0.5 : 1)) continue;
                const key = wall && ISO.hash(a, b, 56 + i * 10) < 0.6 ? ISO.pick(CLUTTER_WALL, a, b, 57 + i * 10) : ISO.pick(rule.keys, a, b, 58 + i * 10);
                put(litter, `smeti_${key}`, a + (ISO.hash(a, b, 59 + i * 10) - 0.5) * 0.8, b + (ISO.hash(a, b, 60 + i * 10) - 0.5) * 0.8, 1, ISO.hash(a, b, 61 + i * 10) < 0.5);
            }
        }
    }

    // Okraj mapy se nekončí ostrou hranou do černa: poslední tři dlaždice se do tmy rozpadnou (Bayer 4 × 4, žádný plynulý
    // přechod). Pásy u okrajů k divákovi leží nad vším (ztratí se v nich i paty domů), u vzdálených okrajů jen na zemi,
    // jinak by děrovaly domy, které před nimi stojí.
    edgeFog() {
        const N = 3, bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
        const [r, g, bl] = [CRT.bg >> 16 & 255, CRT.bg >> 8 & 255, CRT.bg & 255];
        // díl pásu: p dlaždic dovnitř mapy (osa a nebo b, směr sign), q jedna dlaždice podél okraje
        const strip = (axis, sign, near) => {
            const key = `edge_fog_${axis}${sign > 0 ? 'p' : 'm'}`;
            const grid = (p, q) => (axis === 'a' ? [sign * p, q] : [q, sign * p]);
            const corners = [[0, 0], [N, 0], [N, 1], [0, 1]].map(([p, q]) => { const [da, db] = grid(p, q); return [(da + db) * ISO.TW / 2, (db - da) * ISO.TH / 2]; });
            const x0 = Math.min(...corners.map((c) => c[0])), y0 = Math.min(...corners.map((c) => c[1]));
            if (!this.textures.exists(key)) {
                const W = Math.max(...corners.map((c) => c[0])) - x0, H = Math.max(...corners.map((c) => c[1])) - y0;
                const canvas = this.textures.createCanvas(key, W, H), ctx = canvas.getContext(), img = ctx.createImageData(W, H);
                for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
                    const X = (x + 0.5 + x0) / (ISO.TW / 2), Y = (y + 0.5 + y0) / (ISO.TH / 2), da = (X - Y) / 2, db = (X + Y) / 2;
                    const p = sign * (axis === 'a' ? da : db), q = axis === 'a' ? db : da;
                    if (p < 0 || p >= N || q < 0 || q >= 1) continue;
                    if ((1 - p / N) ** 1.6 <= (bayer[(y & 3) * 4 + (x & 3)] + 0.5) / 16) continue;
                    const i = (y * W + x) * 4;
                    img.data[i] = r; img.data[i + 1] = g; img.data[i + 2] = bl; img.data[i + 3] = 255;
                }
                ctx.putImageData(img, 0, 0);
                canvas.refresh();
            }
            const blit = this.add.blitter(0, 0, key).setDepth(near ? 950000 : -88000);
            const count = axis === 'a' ? this.map.wid : this.map.len;
            for (let i = 0; i < count; i++) {
                const edge = sign > 0 ? -0.5 : (axis === 'a' ? this.map.len : this.map.wid) - 0.5;
                const o = axis === 'a' ? ISO.toScreen(edge, i - 0.5) : ISO.toScreen(i - 0.5, edge);
                blit.create(Math.round(o.x + x0), Math.round(o.y + y0));
            }
        };
        // k divákovi jsou okraje a = 0 a b = šířka (dole na obrazovce), vzdálené a = délka a b = 0
        strip('a', 1, true); strip('b', -1, true); strip('a', -1, false); strip('b', 1, false);
    }

    // Světlo ohňů (Fallout: tma a v ní ostrůvky teplého světla). Kaluž je elipsa 2 : 1 v pěti stupních jasu s rozptylem
    // Bayer 4 × 4, žádný plynulý přechod; na zemi velká, nad ohněm menší, aby se rozsvítili i lidé, kteří u něj stojí.
    lightTexture() {
        if (this.textures.exists('light_pool')) return;
        const W = 256, H = 128, canvas = this.textures.createCanvas('light_pool', W, H);
        const ctx = canvas.getContext(), img = ctx.createImageData(W, H);
        const bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
            const d = Math.hypot((x + 0.5 - W / 2) / (W / 2), (y + 0.5 - H / 2) / (H / 2));
            if (d >= 1) continue;
            const v = Math.min(1, Math.floor((1 - d) ** 1.1 * 5 + (bayer[(y % 4) * 4 + (x % 4)] + 0.5) / 16) / 5);
            const i = (y * W + x) * 4;
            img.data[i] = img.data[i + 1] = img.data[i + 2] = 255;
            img.data[i + 3] = Math.round(v * 255);
        }
        ctx.putImageData(img, 0, 0);
        canvas.refresh();
    }

    placeLights() {
        this.lightTexture();
        // vlastní světla místa (def.lights: dlaždice, velikost, barva, podmínka `if`; vchod do haly na Hlaváku, žárovka
        // u mlynáře, reflektor na Hradě), jen na zemi. Světlo s podmínkou se rozsvítí, až platí (refreshStops).
        this.placeLightsOf = (this.def?.lights ?? []).map(({ a, b, L = 0, scale = 1, tint = 0xff9a4a, alpha = 0.8, if: cond }) => {
            const { x, y } = ISO.foot(a, b);
            // na horní úrovni (vozovka magistrály) nad vozovkou, ale pod vším, co na ní stojí
            const pool = this.add.image(x, y - ISO.FOOT - this.height(a, b, L), 'light_pool').setDepth(L === 1 ? UPPER_DEPTH - 1 : -89000).setBlendMode(Phaser.BlendModes.ADD).setTint(tint).setAlpha(alpha).setScale(scale);
            const seed = ISO.hash(a, b, 9);
            this.time.addEvent({ delay: 140, loop: true, callback: () => pool.setAlpha(alpha * (0.9 + 0.1 * Math.sin(this.time.now / 260 + seed * 40))) });
            pool.setVisible(!cond || holds(this.state, cond));
            return { pool, cond };
        });
        const fires = this.children.list.filter((o) => typeof o.frame?.name === 'string' && o.frame.name.startsWith('barrel_fire'));
        this.fireSpots = fires.map((f) => ({ x: f.x, y: f.y }));
        fires.forEach((f) => {
            const ground = this.add.image(f.x, f.y - 4, 'light_pool').setDepth(-89000).setBlendMode(Phaser.BlendModes.ADD).setTint(0xff7a2a).setAlpha(0.85).setScale(1.8);
            const near = this.add.image(f.x, f.y - 30, 'light_pool').setDepth(f.depth + 0.5).setBlendMode(Phaser.BlendModes.ADD).setTint(0xff8a3a).setAlpha(0.28).setScale(0.7, 1.1);
            // kouř nad ohněm: pár pixelových obláčků (kour_1–3), stoupají, řídnou a táhnou po větru k +a
            if (this.textures.getFrame('atlas', 'kour_1')) this.add.particles(f.x, f.y - 46, 'atlas', { frame: ['kour_1', 'kour_2', 'kour_3'], lifespan: 3200, frequency: 520, quantity: 1,
                speedY: { min: -20, max: -11 }, speedX: { min: 2, max: 9 }, x: { min: -3, max: 3 }, scale: { start: 1, end: 2 }, alpha: { start: 0.55, end: 0 } }).setDepth(f.depth + 0.6);
            // plápolání: jas skáče po krocích, ne plynule
            const seed = ISO.hash(Math.round(f.x), Math.round(f.y), 9);
            this.time.addEvent({ delay: 110, loop: true, callback: () => {
                const k = 0.85 + 0.15 * Math.sin(this.time.now / 170 + seed * 40) + (Math.random() - 0.5) * 0.08;
                ground.setAlpha(0.85 * k); near.setAlpha(0.28 * k);
            } });
        });
    }

    // Rekvizita na desetinné poloze (a, b): počátek dole uprostřed, hloubka podle polohy, volitelně blokuje svou dlaždici.
    placeAt(key, a, b, { flip = false, block = false } = {}) {
        const { x, y } = ISO.foot(a, b);
        const { atlas, frames } = this.textures.get('atlas').has(key) ? { atlas: 'atlas', frames: [] } : this.idleAnim(key);
        const thing = frames.length ? this.add.sprite(x, y, atlas, frames[0]).play({ key: `${key}_idle`, startFrame: Math.floor(ISO.hash(Math.round(a), Math.round(b), 7) * frames.length) }) : this.add.image(x, y, 'atlas', key);
        thing.setOrigin(0.5, 1).setDepth(ISO.depthOf(a, b)).setFlipX(flip);
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
        this.holeAt = { x: hx, y: hy, rx, ry };
        (this.roofs ?? []).forEach((r) => {
            const { a0, b0, w, dpt } = r.box;
            const under = t.L === 0 && t.a >= a0 - 1 && t.a < a0 + w + 1 && t.b >= b0 && t.b < b0 + dpt + 1;
            r.setAlpha(under ? 0.28 : 1);
            // hala před hrdinkou (zadní peron za přední halou) dostane stejný otvor jako domy
            const covers = !under && r.depth > this.player.depth && Phaser.Geom.Rectangle.Overlaps(r.getBounds(), this.holeZone);
            if (covers && r.mask !== this.hole) r.setMask(this.hole);
            else if (!covers && r.mask) r.clearMask();
        });
        // Přístřešky nad perony mimo haly: kolem hrdinky zprůhlední, aby bylo vidět ji i to, co pod střechou leží.
        (this.canopies ?? []).forEach((c) => {
            const near = t.L === 0 && Math.abs(c.tile.a - t.a) <= 3 && Math.abs(c.tile.b - t.b) <= 2;
            if (near !== c.faded) { c.faded = near; c.setAlpha(near ? 0.28 : 1); }
        });
        const inTower = this.towerAt(this.moving?.tile ?? this.tile)?.sprite ?? this.towerAt(this.tile)?.sprite;
        this.houses.forEach((house) => {
            if (house === inTower) { house.setAlpha(0.55); return; }
            // Zakrýt ji může jen kvádr, za kterým stojí: před jeho přední hranou (k +b) ani vedle jeho levého boku (k −a)
            // za ním není, i když má dlouhý kvádr hloubku větší než ona a obdélník jeho spritu do otvoru sahá.
            const { a0, b0, dpt } = house.box;
            const behind = t.b < b0 + dpt && t.a >= a0;
            const coversHero = behind && house.depth > this.player.depth && Phaser.Geom.Rectangle.Overlaps(house.getBounds(), this.holeZone);
            const covers = coversHero || house.stopHole;
            // tři masky: otvor jen kolem hrdinky, jen kolem postav zastavení, nebo oba. Dům, který zakrývá jen postavu, nesmí
            // dostat otvor kolem hrdinky, když stojí před ním (jinak by se zprůhlednil dům za ní).
            const mask = coversHero ? (house.stopHole ? this.holeBoth : this.hole) : house.stopHole ? this.holeStops : null;
            if (mask && house.mask !== mask) house.setMask(mask);
            else if (!covers && house.mask) house.clearMask();
            house.setAlpha(1);
        });
    }

    // Otvory v domech před postavami zastavení: které domy postavu zakrývají (stejné pravidlo jako u hrdinky) a kde otvor je.
    markStopHoles() {
        this.houses.forEach((h) => { h.stopHole = false; });
        this.stopHoles = [];
        Object.values(this.stops ?? {}).forEach((stop) => {
            // postava a rekvizity s hláškou (vrak Tatry u Muzea Policie)
            const things = [[stop.sprite, stop.npc], ...(stop.propSprites ?? []).map((sp, i) => [sp, stop.props[i]]).filter(([, q]) => q?.say)];
            things.forEach(([sp, at]) => {
                if (!sp || !sp.visible || sp.alpha < 0.5 || (at.L ?? 0) !== 0) return;
                const zone = new Phaser.Geom.Rectangle(sp.x - 60, sp.y - 130, 120, 150);
                const front = this.houses.filter((h) => at.b < h.box.b0 + h.box.dpt && at.a >= h.box.a0 && h.depth > sp.depth && Phaser.Geom.Rectangle.Overlaps(h.getBounds(), zone));
                if (!front.length) return;
                front.forEach((h) => { h.stopHole = true; });
                this.stopHoles.push({ x: sp.x, y: sp.y - 44 });
            });
        });
        this.fadeHouses();
    }

    // Je bod v otvoru masky daného spritu? (klepnutí otvorem projde na to, co je za domem)
    inHole(x, y, mask = this.holeBoth) {
        const hero = mask !== this.holeStops && this.holeZone?.contains(x, y);
        const stops = mask !== this.hole && (this.stopHoles ?? []).some((h) => Math.abs(x - h.x) < 70 && Math.abs(y - h.y) < 100);
        return Boolean(hero || stops);
    }

    drawHoles() {
        const v = this.cameras.main.worldView, size = 256;
        if (!this.holeRts || !this.holeAt) return;
        const [hero, stops, both] = this.holeRts;
        this.holeRts.forEach((rt) => rt.setPosition(v.x, v.y).clear());
        const at = this.holeAt, cfg = { scaleX: at.rx * 2 / size, scaleY: at.ry * 2 / size };
        [hero, both].forEach((rt) => rt.stamp('hole', undefined, at.x - v.x, at.y - v.y, cfg));
        this.stopHoles.forEach((h) => { if (v.contains(h.x, h.y)) [stops, both].forEach((rt) => rt.stamp('hole', undefined, h.x - v.x, h.y - v.y, { scaleX: 200 / size, scaleY: 280 / size })); });
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
        // Maska je plátno přes celý výřez kamery: do něj se každý snímek otiskne otvor kolem hrdinky a menší otvory kolem
        // postav zastavení, které stojí za domem (drawHoles), aby byly vidět už z dálky a ne až tři dlaždice od hrdinky.
        // tři plátna masek přes výřez kamery: otvor kolem hrdinky (hole), kolem postav zastavení (holeStops), oba (holeBoth)
        this.holeRts = [0, 1, 2].map(() => this.make.renderTexture({ x: 0, y: 0, width: this.scale.width, height: this.scale.height, add: false }).setOrigin(0));
        [this.hole, this.holeStops, this.holeBoth] = this.holeRts.map((rt) => { const m = rt.createBitmapMask(); m.invertAlpha = true; return m; });
        this.stopHoles = [];
        this.tile = { L: 0, ...tile };
        const { x, y } = this.pos(this.tile.a, this.tile.b, this.tile.L);
        ensureWalk(this, 'hero_go');
        ensureWalk(this, 'hero_up');
        this.facingUp = false;
        this.shadow = this.add.ellipse(x, y, 40, 16, 0x000000, 0.35).setDepth(this.depthAt(this.tile.a, this.tile.b, this.tile.L, -1));
        this.player = this.add.sprite(x, y, 'atlas', 'hero_0').setOrigin(0.5, 1).setDepth(this.depthAt(this.tile.a, this.tile.b, this.tile.L));
        // Hrdinka se ve tmě nesmí ztratit: slabá světlá kaluž na zemi pod ní a přísvit na postavě (jdou s ní, update).
        this.lightTexture();
        this.halo = this.add.image(x, y, 'light_pool').setBlendMode(Phaser.BlendModes.ADD).setTint(0xffe6c0).setAlpha(0.24).setScale(0.8);
        this.haloNear = this.add.image(x, y - 30, 'light_pool').setBlendMode(Phaser.BlendModes.ADD).setTint(0xffe6c0).setAlpha(0.16).setScale(0.3, 0.75);
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
        const odd = this.oddAt(world);
        if (odd) {
            this.oddityBubble(odd, odd.exact ? world : null);
            // voříšek po hlášce odběhne (WorldScene.updateLife)
            const d = this.life?.dog;
            if (odd.dog) { const line = odd.said, s = this.registry.get('sound'); if (/Haf/.test(line)) { s?.bark(); if (/Haf\. Haf/.test(line)) this.time.delayedCall(260, () => s?.bark()); } else if (/Vrrr/.test(line)) s?.growl(); }
            if (odd.dog && d && d.mode !== 'flee') { d.mode = 'flee'; d.wait = 900 + 45 * odd.said.length; d.steps = 12; d.run = false; d.bubble = this.bubble; }
            return;
        }
        const through = this.doorAt(world.x, world.y);
        if (through) { this.goTo(through); return; }
        const target = this.pick(world.x, world.y);
        if (!this.inside(target.a, target.b)) return;
        const stop = this.stopAt(target.a, target.b, target.L);
        if (stop) { this.goToStop(stop.id); return; }
        this.goTo(target);
    }

    // Vchod do budovy (podchod z def.tunnels, dveře odbavovací haly na Hlaváku, dveře Fantovy budovy z magistrály podle
    // jejich spritu): obdélník na obrazovce kolem portálu ve
    // fasádě za vstupní dlaždicí (fasáda k divákovi, druhý konec podchodu leží za ní, k −b). Klepnutí tam pošle hrdinku
    // ke dveřím a skrz na druhou stranu.
    doorAt(x, y) {
        for (const { from, to, door } of this.def?.tunnels ?? []) {
            for (const [near, far] of [[from, to], [to, from]]) {
                if (far.b >= near.b) continue;
                // dveře se spritem (Fantova budova z magistrály): klepnutí kamkoli na dveře
                const sprite = door && this.doors?.[door]?.sprite;
                if (sprite) { if (sprite.getBounds().contains(x, y)) return { L: 0, ...far }; continue; }
                if ((near.L ?? 0) !== 0) continue;
                const p = this.pos(near.a, near.b), q = this.pos(near.a, near.b - 1);
                const fx = (p.x + q.x) / 2, fy = (p.y + q.y) / 2;
                if (Math.abs(x - fx) <= 56 && y >= fy - 120 && y <= fy + 6) return { L: 0, ...far };
            }
        }
        return null;
    }

    makeCursors() {
        if (CURSOR_CSS.jit) return;
        Object.entries(CURSOR_HOT).forEach(([name, [hx, hy]]) => {
            const frame = this.textures.getFrame('atlas', `kurzor_${name}`);
            const canvas = document.createElement('canvas');
            canvas.width = frame.cutWidth * 2; canvas.height = frame.cutHeight * 2;
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(frame.source.image, frame.cutX, frame.cutY, frame.cutWidth, frame.cutHeight, 0, 0, canvas.width, canvas.height);
            CURSOR_CSS[name] = `url(${canvas.toDataURL()}) ${hx} ${hy}, ${name === 'ne' ? 'not-allowed' : name === 'jit' ? 'default' : 'pointer'}`;
        });
    }

    setCursor(name) {
        if (this.cursorName === name) return;
        this.cursorName = name;
        this.input.setDefaultCursor(CURSOR_CSS[name] ?? 'default');
    }

    // Kam hrdinka dojde: zaplavení mapy od její dlaždice, jednou za krok nebo změnu bran a zastavení (this.reach = null).
    reachable(t) {
        const from = k3(this.tile.a, this.tile.b, this.tile.L);
        if (!this.reach || this.reach.from !== from) {
            const seen = new Set([from]);
            const queue = [this.tile];
            for (let i = 0; i < queue.length; i++) this.neighbors(queue[i]).forEach((nb) => {
                const key = k3(nb.a, nb.b, nb.L);
                if (!seen.has(key)) { seen.add(key); queue.push(nb); }
            });
            this.reach = { from, seen };
        }
        return this.reach.seen.has(k3(t.a, t.b, t.L ?? 0));
    }

    // Kurzor podle toho, co je pod ním: bublina nad postavou (rozhovor), oko nad věcí s hláškou, dveře nad vchodem,
    // šipka tam, kam hrdinka dojde, červený křížek, kam ne. Nad tlačítky lišty a v rozhovoru obyčejná šipka.
    hover(pointer) {
        if (!this.player) return;
        this.tileMark.setVisible(false);
        if (this.hud?.input?.hitTestPointer(pointer).length) { this.cursorName = null; return; }
        if (this.busy || this.hud?.panel || this.hud?.quests || this.hud?.jumps || pointer.y < 52) { this.setCursor('jit'); return; }
        const world = pointer.positionToCamera(this.cameras.main);
        const t = this.pick(world.x, world.y);
        const inside = this.inside(t.a, t.b);
        if (Object.values(this.stops).some((s) => s.sprite.getBounds().contains(world.x, world.y)) || (inside && this.stopAt(t.a, t.b, t.L))) this.setCursor('mluvit');
        else if (this.oddAt(world)) this.setCursor('oko');
        else if (this.doorAt(world.x, world.y)) this.setCursor('dvere');
        else {
            const ok = inside && this.reachable(t);
            this.setCursor(ok ? 'jit' : 'ne');
            // pod domem se značka nekreslí (byla by přes střechu), křížek ukáže kurzor myši
            const covered = !ok && this.houses.some(({ box: { a0, b0, w, dpt } }) => t.a >= a0 && t.a < a0 + w && t.b >= b0 && t.b < b0 + dpt);
            if (inside && !covered) {
                const p = ISO.toScreen(t.a, t.b);
                this.tileMark.setFrame(ok ? 'kurzor_dlazdice' : 'kurzor_dlazdice_ne').setPosition(p.x, p.y - this.height(t.a, t.b, t.L)).setDepth(this.depthAt(t.a, t.b, t.L) - 2).setVisible(true);
            }
        }
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
        // also: další dlaždice, ze kterých jde promluvit (postava na peronu širokém jednu dlaždici se nedá obejít,
        // mluví se s ní z obou stran); vybere se ta, kam je to nejblíž
        const spots = [stop.approach, ...(stop.also ?? []).map((t) => ({ L: 0, ...t }))];
        if (spots.some((t) => this.tile.a === t.a && this.tile.b === t.b && this.tile.L === t.L)) { this.talk(id); return; }
        const paths = spots.map((t) => this.findPath(this.tile, t)).filter((path) => path.length).sort((x, y) => x.length - y.length);
        if (paths.length) { this.pendingTalk = null; this.path = paths[0]; } else this.goTo(stop.approach);
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
        // přepadení (ambush u zastavení): dokud není vyřešené, jinudy to nejde a odchod i útěk vrací na předchozí místo
        if (stop.ambush && !holds(this.state, stop.ambush.until) && !result.dead && !result.travel && !result.ending) result.travel = stop.ambush.back;
        if (result.rope) await this.ropeCross(result.rope);
        this.input.keyboard.resetKeys();
        this.busy = false;
        if (result.dead) { this.die(); return; }
        if (result.travel) { this.travel(result.travel); return; }
        if (result.ending) { this.scene.stop('hud'); this.scene.start('ending', { result: result.ending }); return; }
        this.refreshGates();
        this.refreshStops();
        this.autosave();
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
        delete this.state.pos;
        save(this.state);
        savePosition(this.state);
        this.scene.stop('hud');
        // filmeček cesty: cesta_<odkud>_<kam> (loďka, pěšky), jinak souprava metro_<kam>
        const key = CUTSCENES[`cesta_${from}_${place}`] ? `cesta_${from}_${place}` : `metro_${place}`;
        this.scene.start('cutscene', { key, onDone: (cutscene) => cutscene.scene.start('world') });
    }

    // Brány: dlaždice zavřené, dokud neplatí podmínka (revizor pouští na molo).
    refreshGates() {
        this.reach = null;
        (this.def?.gates ?? []).forEach((gate) => {
            const open = holds(this.state, gate.open);
            gate.tiles.forEach(([a, b]) => { if (open) this.blocked.delete(ISO.key(a, b)); else this.blocked.add(ISO.key(a, b)); });
        });
    }

    // Zastavení po rozhovoru: co má zmizet (hideIf), vybledne; co se vyřešilo (after), se přehraje na nové místo.
    refreshStops() {
        this.reach = null;
        (this.placeLightsOf ?? []).forEach(({ pool, cond }) => pool.setVisible(!cond || holds(this.state, cond)));
        Object.values(this.stops).forEach((stop) => {
            if (stop.hideIf && holds(this.state, stop.hideIf)) {
                const sprites = [stop.sprite, ...stop.propSprites];
                this.tweens.add({ targets: sprites, alpha: 0, duration: 500, onComplete: () => sprites.forEach((s) => s.destroy()) });
                [stop.npc, ...stop.props].forEach((p) => ((p.L ?? 0) === 1 ? this.upperBlocked : this.blocked).delete(ISO.key(p.a, p.b)));
                delete this.stops[stop.id];
                return;
            }
            if ((stop.after || stop.stages) && this.layoutOf(stop).done !== stop.done) this.changeStop(stop);
        });
        this.hud?.drawMiniStops?.();
    }

    // Klávesy: držená šipka nebo WASD, kombinace dvou směrů; pohyb po jedné dlaždici, klouzání podél překážky; náraz do postavy = rozhovor.
    keyStep() {
        const c = this.cursors, k = this.wasd;
        let da = 0;
        let db = 0;
        if (c.up.isDown || k.W.isDown) { da += 1; db -= 1; }
        if (c.down.isDown || k.S.isDown) { da -= 1; db += 1; }
        if (c.right.isDown || k.D.isDown) { da += 1; db += 1; }
        if (c.left.isDown || k.A.isDown) { da -= 1; db -= 1; }
        da = Math.sign(da); db = Math.sign(db);
        if (!da && !db) return null;
        const bump = this.stopAt(this.tile.a + da, this.tile.b + db, this.tile.L);
        if (bump && [bump.approach, ...(bump.also ?? [])].some((t) => Math.abs(t.a - this.tile.a) + Math.abs(t.b - this.tile.b) <= 2)) { this.talk(bump.id); return null; }
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
        this.updateLife(delta);
        this.updateAmbience(delta);
        this.updateWater(delta);
        this.updateSwimmers(delta);
        this.drawHoles();
        // Výhledy (views v src/places): na vyjmenovaných dlaždicích kamera plynule popojede (dy v bodech), aby byla vidět
        // vysoká stavba nad hrdinkou (nárožní věž paláce Koruna z mola u bufetu).
        const view = (this.def?.views ?? []).find((v) => this.tile.a >= v.a[0] && this.tile.a <= v.a[1] && this.tile.b >= v.b[0] && this.tile.b <= v.b[1]);
        const cam = this.cameras.main, want = view ? -view.dy : 0;
        if (Math.abs(cam.followOffset.y - want) > 0.5) cam.setFollowOffset(0, cam.followOffset.y + (want - cam.followOffset.y) * Math.min(1, delta / 400));
        // světlo jde s hrdinkou: na zemi pod stíny a věcmi, na mostě a na magistrále těsně pod ní
        const lit = this.player.visible && this.shadow.visible, raised = this.tile.L === 1 || this.height(this.tile.a, this.tile.b, this.tile.L) > 0;
        this.halo.setPosition(this.player.x, this.player.y).setDepth(raised ? this.player.depth - 2 : -89000).setVisible(lit);
        this.haloNear.setPosition(this.player.x, this.player.y - 30).setDepth(this.player.depth + 0.5).setVisible(lit);
        if (this.tileMark.visible && (this.busy || this.hud?.panel || this.hud?.quests || this.hud?.jumps)) this.tileMark.setVisible(false);
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
                if (m.t >= 1) { this.tile = { ...m.tile }; this.moving = null; this.player.setAlpha(1); this.shadow.setVisible(true).setAlpha(1); this.stepSound(true); }
                // otvor v domech kolem hrdinky hned, jak se vynoří na druhé straně, ne až po dalším kroku
                if (m.t >= 0.6) this.fadeHouses();
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
                    this.stepSound();
                    this.fadeHouses();
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
                this.stepSound();
            }
            const depth = this.playerDepth(t);
            this.player.setDepth(depth);
            this.shadow.setPosition(this.player.x, this.player.y).setDepth(depth - 1);
            this.fadeHouses();
        }
    }

    // Smrt v boji: epilog smrti; checkpoint z posledního místa zůstává v localStorage.
    die() {
        // po smrti se pokračuje z checkpointu, ne z místa, kde padla
        clearPosition();
        this.scene.stop('hud');
        this.scene.start('ending', { result: 'death' });
    }
}
