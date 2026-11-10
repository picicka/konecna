// Převod dat z OpenStreetMap (Overpass JSON v data/osm/<místo>.json, stahuje scripts/osm-stahnout.mjs) na herní mapu
// data/<místo>.json, na seznam domů pro pxl (art/houses-<místo>.px.js) a na vektory země (art/ground-<místo>.px.js,
// kreslí je art/ground.px.js). Nastavení míst a projekce jsou ve scripts/places.mjs.
// Fasády domů (pravá stěna spritu) míří do +b, takže místo se orientuje tak, aby hlavní průčelí mířila do +b.
// Spuštění: node scripts/osm.mjs hlavak
import fs from 'node:fs';
import path from 'node:path';
import { PLACES, TILE, projector } from './places.mjs';

const ROOT = path.resolve(new URL('.', import.meta.url).pathname, '..');
const STYLES = ['ochre', 'grey', 'green', 'salmon', 'cream', 'yellow'];

const name = process.argv[2] ?? 'hlavak';
// Tagy na domech: řádky „- „text““ ze sekce Tagy na domech v docs/todo.md (až po další nadpis druhé úrovně).
const TAGS = (() => {
    const md = fs.readFileSync(path.join(ROOT, 'docs/todo.md'), 'utf8');
    const start = md.indexOf('## Tagy na domech');
    if (start < 0) return [];
    const end = md.indexOf('\n## ', start + 5);
    return md.slice(start, end < 0 ? undefined : end).split('\n').filter((l) => /^\s*-\s/.test(l)).map((l) => l.replace(/^\s*-\s*/, '').replace(/[„“"]/g, '').trim()).filter(Boolean);
})();
const TAG_COLORS = ['E', '7', 'y', 'l', 'W'];
const place = PLACES[name];
if (!place) { console.error(`neznámé místo ${name}`); process.exit(1); }
// Hlavní export plus volitelné doplňky (data/osm/<místo>-*.json).
const files = fs.readdirSync(path.join(ROOT, 'data/osm')).filter((f) => f === `${name}.json` || (f.startsWith(`${name}-`) && f.endsWith('.json')));
const elements = files.flatMap((f) => JSON.parse(fs.readFileSync(path.join(ROOT, 'data/osm', f), 'utf8')).elements);
const nodes = new Map();
elements.filter((e) => e.type === 'node').forEach((n) => nodes.set(n.id, n));
const waysById = new Map();
elements.filter((e) => e.type === 'way').forEach((w) => waysById.set(w.id, w));
const ways = [...waysById.values()].filter((w) => w.tags);
const relations = elements.filter((e) => e.type === 'relation' && e.tags);

const { project, unproject } = projector(place);
// Výšky z laserového skenování ČÚZK (scripts/vysky.py → data/vysky-<místo>.json), když jsou k dispozici.
const heightsFile = path.join(ROOT, `data/vysky-${name}.json`);
const heights = fs.existsSync(heightsFile) ? JSON.parse(fs.readFileSync(heightsFile, 'utf8')) : null;
// Krytina střech z ortofota ČÚZK (scripts/strechy.py → data/strechy-<místo>.json): { osm id: [r, g, b, krytina] }.
const roofsFile = path.join(ROOT, `data/strechy-${name}.json`);
const roofCovers = fs.existsSync(roofsFile) ? JSON.parse(fs.readFileSync(roofsFile, 'utf8')) : {};
// Výšky střechy (m nad terénem) ve 4 × 4 bodech každé dlaždice kvádru; okraj dlaždice se vynechává kvůli sousedům.
const roofSamples = (a0, b0, w, dpt) => {
    if (!heights) return [];
    const out = [];
    for (let a = a0; a < a0 + w; a++) for (let b = b0; b < b0 + dpt; b++) for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
        const [lat, lon] = unproject(a + 0.125 + i * 0.25, b + 0.125 + j * 0.25);
        const row = heights.grid[Math.floor((lat - heights.lat0) / heights.dlat)];
        const code = row ? row.charCodeAt(Math.floor((lon - heights.lon0) / heights.dlon)) : NaN;
        if (code > 48) out.push((code - 48) / 2);
    }
    return out.sort((x, y) => x - y);
};
const pct = (xs, q) => xs[Math.min(xs.length - 1, Math.floor(q * xs.length))];
// Výška římsy z laseru (medián a 90. percentil střechy). U šikmé střechy jsou body rozložené rovnoměrně mezi římsou
// a hřebenem, takže římsa ≈ medián − (p90 − medián) / 0,8. Patra nad přízemím: činžák má přízemí 4,5 m a patro 3,8 m.
const eaveOf = (med, p90) => med - Math.max(0, p90 - med) / 0.8;
const floorsOf = (eave) => Math.max(1, Math.min(7, Math.round((eave - 4.5) / 3.8)));
// Střecha: podle roof:shape z OSM; bez něj plochá jen u opravdu rovné střechy (rozptyl pod 0,8 m), protože pražské
// mansardy s plochým vrškem by laser jinak skoro všechny ukázal jako ploché. Jinak mansarda od 5 pater, sedlová níž.
const ROOF_SHAPE = { flat: 'flat', gabled: 'pitched', hipped: 'pitched', 'half-hipped': 'pitched', pyramidal: 'pitched', mansard: 'mansard', gambrel: 'mansard' };
const roofOf = (tags, relief, floors) => ROOF_SHAPE[tags['roof:shape']] ?? (relief !== null && relief < 0.8 ? 'flat' : floors >= 5 ? 'mansard' : 'pitched');
const inside = (a, b) => a >= 0 && a < place.len && b >= 0 && b < place.wid;
const grid = Array.from({ length: place.len }, () => Array(place.wid).fill('.'));
const owner = Array.from({ length: place.len }, () => Array(place.wid).fill(null));
const set = (a, b, c, id = null) => { if (!inside(a, b)) return; grid[a][b] = c; if (id !== null) owner[a][b] = id; };

const polygon = (way) => way.nodes.map((id) => nodes.get(id)).filter(Boolean).map((n) => project(n.lat, n.lon));
// Vnější obrysy relace (multipolygon): členské cesty s rolí outer se navážou do uzavřených prstenců.
const ringIds = (relation, inner = false) => {
    const parts = relation.members.filter((m) => m.type === 'way' && (m.role === 'inner') === inner).map((m) => waysById.get(m.ref)).filter(Boolean).map((w) => [...w.nodes]);
    const out = [];
    while (parts.length) {
        const ring = parts.shift();
        let grown = true;
        while (grown && ring[0] !== ring.at(-1)) {
            grown = false;
            for (let i = 0; i < parts.length; i++) {
                const p = parts[i];
                if (p[0] === ring.at(-1)) { ring.push(...p.slice(1)); parts.splice(i, 1); grown = true; break; }
                if (p.at(-1) === ring.at(-1)) { ring.push(...p.reverse().slice(1)); parts.splice(i, 1); grown = true; break; }
            }
        }
        out.push(ring);
    }
    return out;
};
// Vnitřní prstence (nádvoří uvnitř paláce): po vyplnění budovy se vyříznou zpátky jako dlažba.
const innerIds = (relation) => ringIds(relation, true).filter((ring) => ring.length >= 4 && ring[0] === ring.at(-1));
const rings = (relation) => ringIds(relation).map((ring) => ring.map((id) => nodes.get(id)).filter(Boolean).map((n) => project(n.lat, n.lon)));
const pointIn = (pts, a, b) => {
    let hit = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const p = pts[i], q = pts[j];
        if ((p.b > b) !== (q.b > b) && a < ((q.a - p.a) * (b - p.b)) / (q.b - p.b) + p.a) hit = !hit;
    }
    return hit;
};
const fill = (pts, c, id = null) => {
    const a0 = Math.max(0, Math.floor(Math.min(...pts.map((p) => p.a)))), a1 = Math.min(place.len - 1, Math.ceil(Math.max(...pts.map((p) => p.a))));
    const b0 = Math.max(0, Math.floor(Math.min(...pts.map((p) => p.b)))), b1 = Math.min(place.wid - 1, Math.ceil(Math.max(...pts.map((p) => p.b))));
    for (let a = a0; a <= a1; a++) for (let b = b0; b <= b1; b++) if (pointIn(pts, a + 0.5, b + 0.5)) set(a, b, c, id);
};
// Čára šířky `width` dlaždic: vzorkování po půl dlaždici, značí se dlaždice do poloviny šířky od osy.
const stroke = (pts, width, c) => {
    const half = width / 2;
    for (let i = 1; i < pts.length; i++) {
        const p = pts[i - 1], q = pts[i];
        const steps = Math.max(1, Math.ceil(Math.hypot(q.a - p.a, q.b - p.b) * 2));
        for (let s = 0; s <= steps; s++) {
            const a = p.a + ((q.a - p.a) * s) / steps, b = p.b + ((q.b - p.b) * s) / steps;
            for (let da = -Math.ceil(half); da <= Math.ceil(half); da++) for (let db = -Math.ceil(half); db <= Math.ceil(half); db++) {
                if (Math.hypot(da, db) <= half) { const ta = Math.floor(a + da), tb = Math.floor(b + db); if (inside(ta, tb) && grid[ta][tb] !== 'b' && grid[ta][tb] !== 'L' && !(c === 'f' && grid[ta][tb] === 'r')) set(ta, tb, c); }
            }
        }
    }
};

// Pořadí vrstev: parky a voda, koleje, ulice, domy navrch (dům má přednost před vším).
const isGreen = (t) => t.leisure === 'park' || t.leisure === 'garden' || t.landuse === 'grass' || t.landuse === 'village_green';
// Pod zemí (tunely, podchody) a ve výšce (mosty, estakáda magistrály) se nic nekreslí na zem.
const underground = (t) => t.tunnel === 'yes' || t.tunnel === 'building_passage' && false || Number(t.layer) < 0 || t.location === 'underground';
const elevated = (t) => t.bridge === 'yes' || Number(t.layer) > 0;
ways.filter((w) => isGreen(w.tags)).forEach((w) => fill(polygon(w), 'g'));
relations.filter((r) => isGreen(r.tags)).forEach((r) => rings(r).forEach((ring) => fill(ring, 'g')));
// dry (Karlův most): Vltava teče jinudy, její koryto je suché bahno h (neprůchozí); vodu mají jen toky v dry.wet
// (Čertovka), ty se nakreslí jako pás vody podle osy toku, jestli nemají vlastní plochu.
const waterChar = place.dry ? 'h' : 'w';
const isWet = (t) => (place.dry?.wet ?? []).includes(t.name);
ways.filter((w) => w.tags.natural === 'water' && w.tags.water !== 'fountain').forEach((w) => fill(polygon(w), isWet(w.tags) ? 'w' : waterChar));
relations.filter((r) => r.tags.natural === 'water').forEach((r) => rings(r).forEach((ring) => fill(ring, isWet(r.tags) ? 'w' : waterChar)));
if (place.dry) ways.filter((w) => w.tags.waterway && isWet(w.tags) && !underground(w.tags)).forEach((w) => stroke(polygon(w), 2, 'w'));
ways.filter((w) => w.tags.railway === 'rail').forEach((w) => stroke(polygon(w), 1, 't'));
const ROAD_WIDTH = { motorway: 4, trunk: 4, primary: 3, secondary: 2.4, tertiary: 2, residential: 2, unclassified: 2, living_street: 1.5, service: 1, pedestrian: 1.5, footway: 1, path: 1, steps: 1, cycleway: 1 };
// Pěší cesty jsou f: v parku z nich je mlatová pěšina, ve městě dlažba.
// Obslužné silničky (taxi, parkoviště, zásobování) jsou ve hře dlážděná plocha, jinak rozsekají každé náměstí na proužky.
const ROAD_KIND = { footway: 'f', path: 'f', steps: 'f', pedestrian: 'f', cycleway: 'f', service: 'p', living_street: 'p' };
ways.filter((w) => w.tags.highway && ROAD_WIDTH[w.tags.highway] && !underground(w.tags)).forEach((w) => stroke(polygon(w), ROAD_WIDTH[w.tags.highway], ROAD_KIND[w.tags.highway] ?? 'r'));
// Mosty se skutečnou šířkou (Karlův most): pás dlažby přes koryto.
(place.bridges ?? []).forEach((br) => ways.filter((w) => w.tags.name === br.name && w.tags.bridge === 'yes').forEach((w) => stroke(polygon(w), br.width + 1, 'p')));
// Nádražní haly a zastřešení nástupišť: po tom, co se stalo, z nich zbyly jen železné oblouky, takže se negenerují jako domy.
// Pod nimi zůstávají koleje (t), zbytek je nástupiště (n). Oblouky kreslí WorldScene z data.halls.
const isHall = (w) => w.tags.building === 'roof' || (w.tags.building === 'train_station' && !(place.skip ?? []).includes(w.tags.name));
const halls = [];
ways.filter(isHall).forEach((w) => {
    const pts = polygon(w);
    const a0 = Math.max(0, Math.floor(Math.min(...pts.map((p) => p.a)))), a1 = Math.min(place.len - 1, Math.ceil(Math.max(...pts.map((p) => p.a))));
    const b0 = Math.max(0, Math.floor(Math.min(...pts.map((p) => p.b)))), b1 = Math.min(place.wid - 1, Math.ceil(Math.max(...pts.map((p) => p.b))));
    for (let a = a0; a <= a1; a++) for (let b = b0; b <= b1; b++) if (pointIn(pts, a + 0.5, b + 0.5) && grid[a][b] !== 't') set(a, b, 'n');
    if (a1 >= a0 && b1 >= b0) halls.push({ a0, a1, b0, b1, roof: w.tags.building === 'roof' });
});
// Budovy jako multipolygon (Hrad, paláce; jen místa s multipolygons): každý vnější prstenec je samostatná budova s tagy relace.
const relBuildings = !place.multipolygons ? [] : relations.filter((r) => r.tags.building && !(place.skip ?? []).includes(r.tags.name))
    .flatMap((r) => ringIds(r).filter((ring) => ring.length >= 4).map((ring, i) => ({ id: `r${r.id}_${i}`, tags: r.tags, nodes: ring, holes: i === 0 ? innerIds(r) : [] })));
const buildings = [...ways.filter((w) => w.tags.building && !isHall(w) && !(place.skip ?? []).includes(w.tags.name)), ...relBuildings];
// Landmarky: půdorys se označí L (neprůchozí, bez generovaného domu), WorldScene na něj postaví ručně kreslený sprite.
const landmarks = [];
// Hranice půdorysu landmarku v dlaždicích (pro umístění ručně kresleného spritu).
const extent = (pts) => ({ a0: Math.max(0, Math.floor(Math.min(...pts.map((q) => q.a)) + 0.5)), a1: Math.min(place.len - 1, Math.floor(Math.max(...pts.map((q) => q.a)) + 0.5)), b0: Math.max(0, Math.floor(Math.min(...pts.map((q) => q.b)) + 0.5)), b1: Math.min(place.wid - 1, Math.floor(Math.max(...pts.map((q) => q.b)) + 0.5)) });
ways.filter((w) => w.tags.building && (place.skip ?? []).includes(w.tags.name)).forEach((w) => {
    const pts = polygon(w);
    fill(pts, 'L');
    landmarks.push({ name: w.tags.name, osm: w.id, ...extent(pts) });
});
relations.filter((r) => r.tags.building && (place.skip ?? []).includes(r.tags.name)).forEach((r) => {
    const rs = rings(r);
    rs.forEach((ring) => fill(ring, 'L'));
    if (rs.length) landmarks.push({ name: r.tags.name, osm: r.id, relation: true, ...extent(rs.flat()) });
});
buildings.forEach((w) => fill(polygon(w), 'b', w.id));
// Průchody domem (tunnel=building_passage, covered=yes): pěší cesta prořízne budovu, jinak by nádvoří Hradu a dvory
// Malé Strany byly odříznuté.
if (place.multipolygons) ways.filter((w) => w.tags.highway && (w.tags.tunnel === 'building_passage' || w.tags.covered === 'yes') && Number(w.tags.layer ?? 0) >= 0).forEach((w) => {
    const pts = polygon(w);
    for (let i = 1; i < pts.length; i++) {
        const p = pts[i - 1], q = pts[i], steps = Math.max(1, Math.ceil(Math.hypot(q.a - p.a, q.b - p.b) * 3));
        for (let k = 0; k <= steps; k++) { const ta = Math.floor(p.a + ((q.a - p.a) * k) / steps), tb = Math.floor(p.b + ((q.b - p.b) * k) / steps); if (inside(ta, tb) && grid[ta][tb] === 'b') { grid[ta][tb] = 'p'; owner[ta][tb] = null; } }
    }
});
buildings.filter((w) => w.holes?.length).forEach((w) => w.holes.forEach((ring) => {
    const pts = ring.map((id) => nodes.get(id)).filter(Boolean).map((n) => project(n.lat, n.lon));
    for (let a = 0; a < place.len; a++) for (let b = 0; b < place.wid; b++) if (owner[a][b] === w.id && pointIn(pts, a, b)) { grid[a][b] = 'p'; owner[a][b] = null; }
}));
// frame (suchá místa): z domů zůstanou jen ty, které tvoří obrys vyjmenovaných ulic a náměstí (do `width` dlaždic od
// nich); dvorní trakty a domy hlouběji v blocích jsou zbořené na sutí zarostlé vnitrobloky (.). Místo je pak čitelné
// jako náměstí nebo ulice, ne jako moře střech.
if (place.frame) {
    const mask = Array.from({ length: place.len }, () => Array(place.wid).fill(false));
    const names = new Set(place.frame.streets);
    ways.filter((w) => w.tags.highway && names.has(w.tags.name)).forEach((w) => {
        const pts = polygon(w);
        if (pts.length >= 4 && w.nodes[0] === w.nodes.at(-1) && w.tags.area === 'yes') { for (let a = 0; a < place.len; a++) for (let b = 0; b < place.wid; b++) if (pointIn(pts, a + 0.5, b + 0.5)) mask[a][b] = true; }
        for (let k = 1; k < pts.length; k++) {
            const p = pts[k - 1], q = pts[k], steps = Math.max(1, Math.ceil(Math.hypot(q.a - p.a, q.b - p.b) * 2));
            for (let t = 0; t <= steps; t++) { const ta = Math.floor(p.a + ((q.a - p.a) * t) / steps), tb = Math.floor(p.b + ((q.b - p.b) * t) / steps); if (inside(ta, tb)) mask[ta][tb] = true; }
        }
    });
    const W = Math.ceil(place.frame.width);
    const near = (a, b) => { for (let da = -W; da <= W; da++) for (let db = -W; db <= W; db++) if (inside(a + da, b + db) && mask[a + da][b + db] && Math.hypot(da, db) <= place.frame.width) return true; return false; };
    let removed = 0;
    for (let a = 0; a < place.len; a++) for (let b = 0; b < place.wid; b++) if (grid[a][b] === 'b' && !near(a, b)) { grid[a][b] = '.'; owner[a][b] = null; removed++; }
    console.log(`${name}: frame odstranil ${removed} dlaždic domů mimo obrys ulic`);
}
if (place.station) {
    const st = place.station;
    for (let a = 0; a < place.len; a++) for (let i = 0; i < st.pattern.length; i++) {
        const b = st.b0 + i;
        let ch = st.pattern[i];
        if (ch === 'n' && (a < st.platformsFrom || a > st.platformsTo)) ch = 'z';
        if (ch === 't' && st.crossings.includes(a)) ch = 'x';
        grid[a][b] = ch; owner[a][b] = null;
    }
}
// Zatopení (Václavák): všechno kromě domů v řadách a ≤ water.a1 je pod vodou; domy stojí ve vodě po přízemí.
// Molo: dřevěná lávka (m, průchozí) od hladiny k Můstku.
if (place.water) for (let a = 0; a <= Math.min(place.water.a1, place.len - 1); a++) for (let b = 0; b < place.wid; b++) if (grid[a][b] !== 'b') { grid[a][b] = 'w'; owner[a][b] = null; }
// clear: průjezdy branami landmarků (mostecké věže) zůstávají průchozí dlažbou.
(place.clear ?? []).forEach((r) => { for (let a = r.a0; a <= r.a1; a++) for (let b = r.b0; b <= r.b1; b++) if (inside(a, b)) { grid[a][b] = r.c ?? 'p'; owner[a][b] = null; } });
// Landmarky jako obdélníky (Hlavák: Fantova budova a hala; Staromák: Týn, radnice…): půdorys L před zatopením.
(place.boxes ?? []).forEach((box) => {
    for (let a = box.a0; a <= box.a1; a++) for (let b = box.b0; b <= box.b1; b++) { grid[a][b] = 'L'; owner[a][b] = null; }
    landmarks.push(box);
});
// Zatopení (Staromák): dlaždice do vzdálenosti flood.boardwalk od domu jsou lávky podél fasád (m), ostatní voda (w);
// ostrovy (Husův pomník) zůstávají suché jako dlažba, lávky přes vodu (piers) spojují ostrovy s lávkami podél domů.
if (place.flood) {
    // frame: z domů zůstane jen obrys náměstí. Jádro náměstí je volná plocha aspoň 3 dlaždice od domů spojená
    // s prvním ostrovem; domy dál než frame dlaždic od jádra zmizí pod vodou (landmarky L zůstávají).
    if (place.flood.frame) {
        const solid = (a, b) => grid[a][b] === 'b' || grid[a][b] === 'L';
        const far = (a, b) => { for (let da = -2; da <= 2; da++) for (let db = -2; db <= 2; db++) if (inside(a + da, b + db) && solid(a + da, b + db)) return false; return true; };
        const core = new Set();
        const o = place.flood.islands[0];
        const q = [[Math.round(o.a), Math.round(o.b)]];
        while (q.length) { const [a, b] = q.pop(); const k = `${a},${b}`; if (!inside(a, b) || core.has(k) || solid(a, b) || !far(a, b)) continue; core.add(k); q.push([a + 1, b], [a - 1, b], [a, b + 1], [a, b - 1]); }
        const coreList = [...core].map((k) => k.split(',').map(Number));
        for (let a = 0; a < place.len; a++) for (let b = 0; b < place.wid; b++) if (grid[a][b] === 'b' && !coreList.some(([ca, cb]) => Math.max(Math.abs(ca - a), Math.abs(cb - b)) <= place.flood.frame)) { grid[a][b] = 'w'; owner[a][b] = null; }
    }
    const near = (a, b, d) => { for (let da = -d; da <= d; da++) for (let db = -d; db <= d; db++) if (inside(a + da, b + db) && grid[a + da][b + db] === 'b') return true; return false; };
    for (let a = 0; a < place.len; a++) for (let b = 0; b < place.wid; b++) if (grid[a][b] !== 'b' && grid[a][b] !== 'L') { grid[a][b] = near(a, b, place.flood.boardwalk) ? 'm' : 'w'; owner[a][b] = null; }
    (place.flood.islands ?? []).forEach((o) => { for (let a = Math.floor(o.a - o.r); a <= Math.ceil(o.a + o.r); a++) for (let b = Math.floor(o.b - o.r); b <= Math.ceil(o.b + o.r); b++) if (inside(a, b) && grid[a][b] !== 'b' && Math.hypot(a - o.a, b - o.b) <= o.r) grid[a][b] = 'p'; });
    (place.flood.piers ?? []).forEach((q) => { for (let a = q.a0; a <= q.a1; a++) for (let b = q.b0; b <= q.b1; b++) if (inside(a, b) && grid[a][b] !== 'b') grid[a][b] = 'm'; });
}
if (place.pier) for (let a = place.pier.a0; a <= place.pier.a1; a++) for (let b = place.pier.b0; b <= place.pier.b1; b++) { grid[a][b] = 'm'; owner[a][b] = null; }

// Chodníky: nezastavěné dlaždice vedle vozovky.
for (let a = 0; a < place.len; a++) for (let b = 0; b < place.wid; b++) {
    if (grid[a][b] !== '.') continue;
    if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([da, db]) => inside(a + da, b + db) && (grid[a + da][b + db] === 'r' || grid[a + da][b + db] === 'L'))) grid[a][b] = 'p';
}
// Díry v dlažbě (nezastavěná dlaždice obklopená dlažbou ze tří a více stran) jsou taky dlažba.
for (let pass = 0; pass < 4; pass++) for (let a = 0; a < place.len; a++) for (let b = 0; b < place.wid; b++) {
    if (grid[a][b] !== '.') continue;
    if ([[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([da, db]) => inside(a + da, b + db) && 'pL'.includes(grid[a + da][b + db])).length >= (b >= 20 && b <= 27 ? 1 : 2)) grid[a][b] = 'p';
}
// Pěší cesty mimo park jsou chodník.
for (let a = 0; a < place.len; a++) for (let b = 0; b < place.wid; b++) {
    if (grid[a][b] !== 'f') continue;
    const green = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]].filter(([da, db]) => inside(a + da, b + db) && grid[a + da][b + db] === 'g').length;
    if (green < 2) grid[a][b] = 'p';
}

// Domy: dlaždice každé budovy se rozloží na obdélníky (hladově: nejlevější horní volná dlaždice, obdélník roste
// nejdřív podél a, pak do hloubky b), s omezením w ≤ 5 a dpt ≤ 4 kvůli velikosti spritů.
const MAX_W = 4, MAX_D = 3;
const houses = [];
const used = Array.from({ length: place.len }, () => Array(place.wid).fill(false));
const seeds = new Map();
const bodies = new Map();
let seed = 1;
const pending = [];
buildings.forEach((w) => {
    const tiles = [];
    for (let a = 0; a < place.len; a++) for (let b = 0; b < place.wid; b++) if (owner[a][b] === w.id) tiles.push([a, b]);
    if (!tiles.length) return;
    const levels = Number(w.tags['building:levels']) || (w.tags.height ? Math.round(Number.parseFloat(w.tags.height) / 3.5) : 0) || 4;
    const osmFloors = Math.max(3, Math.min(5, levels));
    const measured = heights?.buildings[w.id];
    const style = STYLES[Math.abs(Number(String(w.id).replace(/\D/g, "")) || 0) % STYLES.length];
    const is = (a, b) => inside(a, b) && owner[a][b] === w.id && !used[a][b];
    // Drobné stavby (kiosky, trafostanice, přístřešky) se nekreslí jako domy, zůstane po nich jen dvůr.
    if (tiles.length < 3) { tiles.forEach(([a, b]) => { grid[a][b] = '.'; owner[a][b] = null; }); return; }
    const boxes = [];
    tiles.forEach(([a0, b0]) => {
        if (!is(a0, b0)) return;
        // Obdélník roste buď nejdřív podél a, nebo nejdřív do hloubky b; vezme se větší plocha, aby nevznikaly proužky.
        const grow = (first) => {
            let wdt = 1, dpt = 1;
            if (first === 'a') {
                while (wdt < MAX_W && is(a0 + wdt, b0)) wdt++;
                while (dpt < MAX_D && Array.from({ length: wdt }, (_, i) => is(a0 + i, b0 + dpt)).every(Boolean)) dpt++;
            } else {
                while (dpt < MAX_D && is(a0, b0 + dpt)) dpt++;
                while (wdt < MAX_W && Array.from({ length: dpt }, (_, i) => is(a0 + wdt, b0 + i)).every(Boolean)) wdt++;
            }
            return { wdt, dpt };
        };
        const ga = grow('a'), gb = grow('b');
        const { wdt, dpt } = ga.wdt * ga.dpt >= gb.wdt * gb.dpt ? ga : gb;
        for (let a = a0; a < a0 + wdt; a++) for (let b = b0; b < b0 + dpt; b++) used[a][b] = true;
        const street = (a, b) => inside(a, b) && (grid[a][b] === 'r' || grid[a][b] === 'p' || grid[a][b] === 'g');
        const front = Array.from({ length: wdt }, (_, i) => street(a0 + i, b0 + dpt)).some(Boolean);
        const back = !front && Array.from({ length: wdt }, (_, i) => street(a0 + i, b0 - 1)).some(Boolean);
        const corner = Array.from({ length: dpt }, (_, i) => street(a0 - 1, b0 + i)).some(Boolean);
        // Sprity domů jsou velké, proto se dělí do listů místa houses_<místo>_<n> (klíče hp<n>_<místo>_…, počet listů
        // je v data/<místo>.json houseSheets); WorldScene je nahraje při vstupu na místo.
        // tag: kandidát je každý dům s fasádou do ulice (ne dům uvnitř bloku), výběr deterministicky podle polohy;
        // jestli tag dostane, rozhodne až viditelnost fasády (tagSpot níž)
        const roll = ((a0 * 73856093) ^ (b0 * 19349663)) >>> 0;
        const tagIndex = TAGS.length && ((front && wdt >= 2) || (corner && dpt >= 2)) && roll % 5 < 4 ? (roll >>> 3) % TAGS.length : -1;
        // Římsa kvádru z jeho vlastních vzorků mřížky (aspoň čtvrtina bodů), jinak z měření celé budovy.
        const samples = roofSamples(a0, b0, wdt, dpt);
        const own = samples.length >= wdt * dpt * 4;
        const eave = own ? eaveOf(pct(samples, 0.5), pct(samples, 0.9)) : measured ? eaveOf(measured[3], measured[4]) : null;
        const relief = own ? pct(samples, 0.9) - pct(samples, 0.5) : null;
        boxes.push({ a0, b0, wdt, dpt, corner, back, front, tagIndex, eave, relief });
    });
    // Dům má jednu výšku: převládající počet pater přes plochu kvádrů. Vlastní výšku si nechá jen kvádr, jehož římsa
    // je od převládající o víc než 5 m jinde (jiné křídlo, dvorní přístavek). Bez laseru building:levels z OSM.
    const area = new Map();
    boxes.filter((x) => x.eave !== null).forEach((x) => { const f = floorsOf(x.eave); area.set(f, (area.get(f) ?? 0) + x.wdt * x.dpt); });
    const main = area.size ? [...area].sort((p, q) => q[1] - p[1] || q[0] - p[0])[0][0] : null;
    const mainBoxes = boxes.filter((x) => x.eave !== null && Math.abs(floorsOf(x.eave) - main) <= 1);
    const mainEave = mainBoxes.length ? mainBoxes.map((x) => x.eave).sort((p, q) => p - q)[Math.floor(mainBoxes.length / 2)] : null;
    const mainRelief = measured ? measured[4] - measured[3] : null;
    boxes.forEach(({ a0, b0, wdt, dpt, corner, back, front, tagIndex, eave, relief }) => {
        const wing = eave !== null && mainEave !== null && Math.abs(eave - mainEave) > 5;
        const low = a0 < (place.lowRows ?? 0);
        const floors = low ? 1 : wing ? floorsOf(eave) : main ?? osmFloors;
        const roof = low ? 'flat' : roofOf(w.tags, wing ? relief : mainRelief, floors);
        const cover0 = roofCovers[w.id]?.[3] ?? null;
        // Kvádr uvnitř bloku (bez fasády do ulice ani rohu) je z ulice vidět jen střechou: jednotný šedý styl, ať se sprity
        // sdílejí (Václavák by jinak měl přes 400 různých domů); krytina střechy zůstává podle ortofota.
        const inner = !front && !back && !corner;
        const look = inner ? 'grey' : style;
        const cover = inner && cover0 ? { tasky: 'tasky', hneda: 'tasky', tmava: 'plech', plech: 'plech', svetla: 'svetla', med: 'svetla' }[cover0] : cover0;
        pending.push({ a0, b0, wdt, dpt, floors, roof, cover, look, corner, back, front, tagIndex, style, eave: eave === null ? null : Math.round((wing ? eave : mainEave) * 10) / 10, name: w.tags.name ?? null, osm: w.id });
    });
});

// Po vynechání drobných staveb (kiosky, přístřešky) zbyly díry; zaplní se stejně jako výše.
for (let pass = 0; pass < 3; pass++) for (let a = 0; a < place.len; a++) for (let b = 0; b < place.wid; b++) {
    if (grid[a][b] !== '.') continue;
    if ([[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([da, db]) => inside(a + da, b + db) && 'pL'.includes(grid[a + da][b + db])).length >= 2) grid[a][b] = 'p';
}
// ---------- Vektory země pro art/ground.px.js ----------
// Všechno v dlaždicových souřadnicích (a, b), čáry se rozšiřují na skutečnou šířku v metrech už tady, protože v izometrii
// je kruh na zemi na obrazovce elipsa 2 : 1 (štětec pxl by kreslil kruhy). Pořadí v seznamu je pořadí kreslení.
const r2 = (v) => Math.round(v * 100) / 100;
const near = (pts) => pts.some((q) => q.a > -3 && q.a < place.len + 3 && q.b > -3 && q.b < place.wid + 3);
const features = [];
const flat = (pts) => pts.flatMap((q) => [r2(q.a), r2(q.b)]);
// z: vrstva (0 plochy, 1 pěší, 1.5 lože tramvaje, 2 vozovky, 3 přechody); malíř kreslí podle z a pak podle pořadí.
let Z = 0;
const area = (m, pts, extra = {}) => { if (pts.length >= 3 && near(pts)) features.push({ m, z: Z, p: flat(pts), ...extra }); };
// Pás šířky w metrů podél lomené čáry: čtyřúhelník na úsek a osmiúhelník v každém lomu (kulaté spoje i konce).
const band = (m, pts, w, extra = {}) => {
    if (pts.length < 2 || !near(pts)) return;
    const h = w / 2 / TILE;
    for (let i = 1; i < pts.length; i++) {
        const p = pts[i - 1], q = pts[i];
        const len = Math.hypot(q.a - p.a, q.b - p.b);
        if (len < 1e-6) continue;
        const na = -(q.b - p.b) / len * h, nb = (q.a - p.a) / len * h;
        features.push({ m, z: Z, p: flat([{ a: p.a + na, b: p.b + nb }, { a: q.a + na, b: q.b + nb }, { a: q.a - na, b: q.b - nb }, { a: p.a - na, b: p.b - nb }]), ...extra });
    }
    pts.forEach((c) => features.push({ m, z: Z, p: flat(Array.from({ length: 8 }, (_, k) => ({ a: c.a + Math.cos(k * Math.PI / 4) * h, b: c.b + Math.sin(k * Math.PI / 4) * h }))), ...extra }));
};
const SURFACE = { asphalt: 'asphalt', paved: 'asphalt', concrete: 'paving', 'concrete:plates': 'paving', paving_stones: 'paving', sett: 'sett', cobblestone: 'sett', unhewn_cobblestone: 'sett',
    compacted: 'mlat', fine_gravel: 'mlat', gravel: 'mlat', ground: 'mlat', dirt: 'mlat', unpaved: 'mlat', grass: 'grass', metal: 'paving', wood: 'paving' };
const parks = [...ways.filter((w) => isGreen(w.tags)).map(polygon), ...relations.filter((r) => isGreen(r.tags)).flatMap(rings)];
const inPark = (q) => parks.some((pts) => pointIn(pts, q.a, q.b));
const mid = (pts) => pts[Math.floor(pts.length / 2)] && pts.length > 1 ? { a: (pts[Math.floor((pts.length - 1) / 2)].a + pts[Math.ceil((pts.length - 1) / 2)].a) / 2, b: (pts[Math.floor((pts.length - 1) / 2)].b + pts[Math.ceil((pts.length - 1) / 2)].b) / 2 } : pts[0];

// 1. Plochy: parky a trávníky, náměstí a pěší zóny, parkoviště, nástupiště.
ways.filter((w) => isGreen(w.tags)).forEach((w) => area('grass', polygon(w)));
relations.filter((r) => isGreen(r.tags)).forEach((r) => rings(r).forEach((ring) => area('grass', ring)));
const isPlaza = (t) => t['area:highway'] === 'pedestrian' || t['area:highway'] === 'footway' || (t.highway === 'pedestrian' && t.area === 'yes') || t.place === 'square';
ways.filter((w) => isPlaza(w.tags) && !underground(w.tags) && !elevated(w.tags)).forEach((w) => area(SURFACE[w.tags.surface] ?? 'paving', polygon(w)));
relations.filter((r) => isPlaza(r.tags)).forEach((r) => rings(r).forEach((ring) => area(SURFACE[r.tags.surface] ?? 'paving', ring)));
ways.filter((w) => w.tags['area:highway'] && !isPlaza(w.tags) && !underground(w.tags) && !elevated(w.tags)).forEach((w) => area(SURFACE[w.tags.surface] ?? 'asphalt', polygon(w)));
ways.filter((w) => w.tags.amenity === 'parking' && !['underground', 'multi-storey', 'rooftop'].includes(w.tags.parking) && !underground(w.tags) && !elevated(w.tags)).forEach((w) => area('asphalt', polygon(w)));
ways.filter((w) => w.tags.leisure === 'playground').forEach((w) => area('mlat', polygon(w)));

Z = 2;
// 2. Vozovky: šířka z tagu width, jinak z počtu pruhů, jinak podle typu silnice. Povrch z tagu surface.
const CARRIAGEWAY = { motorway: 11, trunk: 11, primary: 10, primary_link: 5, secondary: 9, secondary_link: 5, tertiary: 8, tertiary_link: 5, residential: 7, unclassified: 6, living_street: 5.5, service: 4, track: 3, busway: 6.5 };
const roads = ways.filter((w) => CARRIAGEWAY[w.tags.highway] && !underground(w.tags) && !elevated(w.tags) && w.tags.area !== 'yes');
const roadWidth = (t) => Number.parseFloat(t.width) || (t.lanes ? Number(t.lanes) * 3.2 : 0) || (t.service === 'parking_aisle' ? 5 : 0) || CARRIAGEWAY[t.highway];
roads.forEach((w) => band(SURFACE[w.tags.surface] ?? 'asphalt', polygon(w), roadWidth(w.tags)));
Z = 1;
// 3. Pěší: chodníky (mozaika, dlažba podle surface), cestičky v parku (mlat), schody, cyklostezky.
const FOOT = ['footway', 'path', 'pedestrian', 'steps', 'cycleway', 'bridleway', 'corridor'];
ways.filter((w) => FOOT.includes(w.tags.highway) && !underground(w.tags) && !elevated(w.tags) && w.tags.area !== 'yes' && w.tags.footway !== 'crossing' && w.tags.indoor !== 'yes').forEach((w) => {
    const pts = polygon(w), t = w.tags;
    const park = t.footway !== 'sidewalk' && inPark(mid(pts));
    const m = t.highway === 'steps' ? 'steps' : SURFACE[t.surface] ?? (t.highway === 'cycleway' ? 'asphalt' : park ? 'mlat' : t.footway === 'sidewalk' ? 'mosaic' : 'paving');
    const width = Number.parseFloat(t.width) || (t.highway === 'pedestrian' ? 6 : t.footway === 'sidewalk' ? 3 : park ? 3.5 : t.highway === 'path' ? 2 : 2.5);
    band(m, pts, width);
});
Z = 3;
// 4. Přechody pro chodce: pruhy zebry kolmo přes vozovku (jen na asfaltu, pxl je jinde nekreslí).
ways.filter((w) => w.tags.footway === 'crossing' && !underground(w.tags) && !elevated(w.tags)).forEach((w) => {
    const pts = polygon(w);
    const marked = !['unmarked', 'no'].includes(w.tags.crossing) && w.tags['crossing:markings'] !== 'no';
    if (!marked) { band('mosaic', pts, 2.5, { on: ['dirt', 'grass'] }); return; }
    for (let i = 1; i < pts.length; i++) {
        const p = pts[i - 1], q = pts[i], len = Math.hypot(q.a - p.a, q.b - p.b);
        if (len < 1e-6) continue;
        const da = (q.a - p.a) / len, db = (q.b - p.b) / len, half = 1.6 / TILE, sw = 0.25 / TILE;
        for (let t = 0.3 / TILE; t < len; t += 1 / TILE) {
            const ca = p.a + da * t, cb = p.b + db * t;
            area('zebra', [{ a: ca - da * sw - db * half, b: cb - db * sw + da * half }, { a: ca + da * sw - db * half, b: cb + db * sw + da * half }, { a: ca + da * sw + db * half, b: cb + db * sw - da * half }, { a: ca - da * sw + db * half, b: cb - db * sw - da * half }], { on: ['asphalt', 'sett'] });
        }
    }
});
// 5. Vodorovné značení: přerušovaná čára mezi pruhy (u jednosměrných mezi pruhy, jinak ve středu), jen hlavní silnice.
const lines = [];
roads.filter((w) => ['primary', 'secondary', 'tertiary', 'primary_link', 'secondary_link'].includes(w.tags.highway)).forEach((w) => {
    const pts = polygon(w);
    if (!near(pts)) return;
    const lanes = Number(w.tags.lanes) || 2, width = roadWidth(w.tags);
    const offsets = w.tags.oneway === 'yes' ? Array.from({ length: lanes - 1 }, (_, i) => -width / 2 + (width / lanes) * (i + 1)) : [0];
    offsets.forEach((o) => lines.push({ k: 'dash', p: flat(offsetLine(pts, o / TILE)) }));
});
function offsetLine(pts, d) {
    if (!d) return pts;
    return pts.map((c, i) => {
        const p = pts[Math.max(0, i - 1)], q = pts[Math.min(pts.length - 1, i + 1)], len = Math.hypot(q.a - p.a, q.b - p.b) || 1;
        return { a: c.a - (q.b - p.b) / len * d, b: c.b + (q.a - p.a) / len * d };
    });
}
// 6. Koleje: tramvajové z OSM (kreslí se pražce na štěrku, v asfaltu jen žlábky), železniční v kolejišti podle vzoru.
const trams = ways.filter((w) => w.tags.railway === 'tram' && !underground(w.tags) && !elevated(w.tags)).map(polygon).filter(near);
Z = 1.5;
// mimo vozovku leží tramvajová trať na betonových panelech (pás 3 m jen přes hlínu, trávu a mlat), kolejnice se žlábkem
trams.forEach((pts) => { lines.push({ k: 'tram', p: flat(pts) }); band('paving', pts, 3, { on: ['dirt', 'grass', 'mlat'] }); });
// nástupní ostrůvky zastávek (railway=platform, public_transport=platform jako čára nebo plocha): betonové desky
Z = 1.6;
ways.filter((w) => (w.tags.railway === 'platform' || w.tags.public_transport === 'platform') && !underground(w.tags) && !elevated(w.tags)).forEach((w) => {
    const pts = polygon(w), closed = w.nodes[0] === w.nodes.at(-1) && pts.length > 3;
    if (closed) area('platform', pts); else band('platform', pts, Number.parseFloat(w.tags.width) || 2.6);
});
if (place.station) {
    const st = place.station;
    [...st.pattern].forEach((ch, i) => { if (ch === 't') lines.push({ k: 'rail', p: flat([{ a: -0.5, b: st.b0 + i }, { a: place.len - 0.5, b: st.b0 + i }]) }); });
}
// Kolejiště, nástupiště, přechody přes koleje, půdorysy domů a landmarků jsou z mřížky (dlaždice), kreslí se jako první.
const tiles = [];
for (let a = 0; a < place.len; a++) for (let b = 0; b < place.wid; b++) { const c = grid[a][b]; if ('tznxbLwmh'.includes(c)) tiles.push(a, b, 'tznxbLwmh'.indexOf(c)); }

// ---------- Rekvizity na skutečných místech ----------
// Stromy, lampy a lavičky z OSM; park se dosází stromy (Vrchlického sady jsou hustě zarostlé), aby rozestup byl aspoň
// 11 m a strom nestál na cestě ani na silnici. Polohy jsou desetinné dlaždice, WorldScene je staví přes ISO.foot.
const hash = (x, y, salt = 0) => { let h = (Math.round(x * 1000) * 73856093) ^ (Math.round(y * 1000) * 19349663) ^ (salt * 83492791); h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const inMap = (q) => q.a >= 0 && q.a <= place.len - 1 && q.b >= 0 && q.b <= place.wid - 1;
const props = [];
const pointNodes = [...nodes.values()].filter((n) => n.tags);
const at = (n) => project(n.lat, n.lon);
// Vzdálenost bodu od nejbližšího okraje cesty nebo silnice (v metrech), aby stromy a lavičky nestály na dlažbě.
const paths = [...roads.map((w) => ({ pts: polygon(w), w: roadWidth(w.tags) })), ...ways.filter((w) => FOOT.includes(w.tags.highway) && !underground(w.tags)).map((w) => ({ pts: polygon(w), w: Number.parseFloat(w.tags.width) || 3 })), ...trams.map((pts) => ({ pts, w: 3 }))]
    .filter((x) => near(x.pts));
const segDist = (q, p0, p1) => { const da = p1.a - p0.a, db = p1.b - p0.b, L = da * da + db * db || 1e-9; const t = Math.max(0, Math.min(1, ((q.a - p0.a) * da + (q.b - p0.b) * db) / L)); return Math.hypot(q.a - p0.a - t * da, q.b - p0.b - t * db) * TILE; };
const clearance = (q) => Math.min(...paths.map(({ pts, w }) => { let d = Infinity; for (let i = 1; i < pts.length; i++) d = Math.min(d, segDist(q, pts[i - 1], pts[i])); return d - w / 2; }));
const blockedTile = (q) => { const a = Math.round(q.a), b = Math.round(q.b); return !inside(a, b) || 'bLtwznxm'.includes(grid[a][b]); };
const trees = [];
pointNodes.filter((n) => n.tags.natural === 'tree').map(at).filter((q) => inMap(q) && !blockedTile(q)).forEach((q) => trees.push(q));
ways.filter((w) => w.tags.natural === 'tree_row').forEach((w) => { const pts = polygon(w); for (let i = 1; i < pts.length; i++) { const p = pts[i - 1], q = pts[i], len = Math.hypot(q.a - p.a, q.b - p.b); for (let t = 0; t < len; t += 8 / TILE) { const c = { a: p.a + (q.a - p.a) * t / len, b: p.b + (q.b - p.b) * t / len }; if (inMap(c) && !blockedTile(c)) trees.push(c); } } });
for (let a = 0; a < place.len; a += 3.5 / TILE) for (let b = 0; b < place.wid; b += 3.5 / TILE) {
    const q = { a: a + (hash(a, b, 1) - 0.5) * 3 / TILE, b: b + (hash(a, b, 2) - 0.5) * 3 / TILE };
    if (!inMap(q) || blockedTile(q) || !inPark(q) || hash(a, b, 3) > 0.5) continue;
    if (trees.some((t) => Math.hypot(t.a - q.a, t.b - q.b) * TILE < 11)) continue;
    if (clearance(q) < 2.5) continue;
    trees.push(q);
}
trees.forEach((q) => props.push({ k: 'tree', a: r2(q.a), b: r2(q.b) }));
pointNodes.filter((n) => n.tags.highway === 'street_lamp').map(at).filter(inMap).forEach((q) => props.push({ k: 'lamp', a: r2(q.a), b: r2(q.b) }));
pointNodes.filter((n) => n.tags.amenity === 'bench').map(at).filter(inMap).forEach((q) => props.push({ k: 'bench', a: r2(q.a), b: r2(q.b) }));
pointNodes.filter((n) => n.tags.amenity === 'waste_basket').map(at).filter(inMap).forEach((q) => props.push({ k: 'barrel', a: r2(q.a), b: r2(q.b) }));

// Tramvaje: vrak soupravy T3 u každé tramvajové zastávky na mapě, natočený podle koleje (sprite pro každý úhel zvlášť).
const tramCars = [];
pointNodes.filter((n) => n.tags.railway === 'tram_stop' || (n.tags.public_transport === 'stop_position' && n.tags.tram === 'yes')).map(at).filter(inMap).forEach((q) => {
    let best = null;
    trams.forEach((pts) => { for (let i = 1; i < pts.length; i++) { const d = segDist(q, pts[i - 1], pts[i]); if (!best || d < best.d) best = { d, p: pts[i - 1], q: pts[i] }; } });
    if (!best || best.d > 6 || blockedTile(q)) return;
    // na koleji: kolmý průmět zastávky na úsek
    const da = best.q.a - best.p.a, db = best.q.b - best.p.b, L = da * da + db * db, t = Math.max(0, Math.min(1, ((q.a - best.p.a) * da + (q.b - best.p.b) * db) / L));
    const c = { a: best.p.a + t * da, b: best.p.b + t * db };
    if (tramCars.some((x) => Math.hypot(x.a - c.a, x.b - c.b) < 3)) return;
    const angle = Math.round(Math.atan2(db, da) * 180 / Math.PI / 5) * 5; // úhel osy soupravy v rovině (a, b), po 5°
    tramCars.push({ key: `tram_${name}_${((angle % 180) + 180) % 180}`, a: r2(c.a), b: r2(c.b), angle: ((angle % 180) + 180) % 180, damage: r2(0.4 + hash(c.a, c.b, 9) * 0.5) });
});
tramCars.forEach((t) => props.push({ k: t.key, a: t.a, b: t.b, tram: true }));

// Viditelnost parteru: dům přes ulici (níž na obrazovce) zakrývá spodek fasády. Z bodů fasády se jde po obrazovce
// svisle dolů (a − t, b + t); budova ve vzdálenosti t s výškou H px zakryje fasádu do výšky H − 64 t. Tag se nastříká
// až nad nejvyšší zakrytí (domy i koruny stromů); když by se nad ním do parteru nevešel, dům tag nedostane.
const heightPx = Array.from({ length: place.len }, () => Array(place.wid).fill(0));
pending.forEach((h) => {
    const rh = h.roof === 'flat' ? 0 : h.roof === 'mansard' ? 28 : 16;
    for (let a = h.a0; a < h.a0 + h.wdt; a++) for (let b = h.b0; b < h.b0 + h.dpt; b++) heightPx[a][b] = 64 + h.floors * 44 + rh;
});
for (let a = 0; a < place.len; a++) for (let b = 0; b < place.wid; b++) if (!heightPx[a][b] && (grid[a][b] === 'b' || grid[a][b] === 'L')) heightPx[a][b] = grid[a][b] === 'L' ? 140 : 260;
const TREE_PX = 150;
const treePts = props.filter((q) => q.k === 'tree');
const TAG_TOP = 76; // nejvýš (px nad zemí), kam tag sahá: parter po okna prvního patra (nad tím se mezi okny nedá číst)
// Fasáda: R je čelo do ulice (+b, podél a), L bok nárožního domu (−a, napříč). Z každého bodu fasády se jde dolů.
const tagSpot = (h, face) => {
    let cover = 0;
    const treesNear = treePts.filter((q) => q.a > h.a0 - 9 && q.a < h.a0 + h.wdt + 1 && q.b > h.b0 && q.b < h.b0 + h.dpt + 9);
    const len = face === 'R' ? h.wdt : h.dpt;
    for (let u = 0.15; u < len; u += 0.2) for (let t = 0.05; t < 8; t += 0.1) {
        const pa = face === 'R' ? h.a0 + u : h.a0, pb = face === 'R' ? h.b0 + h.dpt : h.b0 + h.dpt - u;
        const ta = Math.floor(pa - t), tb = Math.floor(pb + t);
        if (inside(ta, tb) && heightPx[ta][tb]) cover = Math.max(cover, heightPx[ta][tb] - 64 * t);
        // koruna stromu před fasádou (do 40 px vedle svislice) zakryje fasádu do výšky TREE_PX − 64 t
        treesNear.forEach((q) => { const dx = 64 * ((q.a + q.b) - (pa + pb)), tt = ((q.b - q.a) - (pb - pa)) / 2; if (Math.abs(dx) < 40 && tt > 0) cover = Math.max(cover, TREE_PX - 64 * tt); });
    }
    const v0 = Math.ceil(Math.max(6, cover + 6) / 8) * 8;
    return v0 + 26 <= TAG_TOP ? v0 : -1;
};
// Čelo má přednost, bok nárožního domu jen když čelo nejde (nebo dům čelo do ulice nemá).
const pickTag = (h) => {
    if (h.tagIndex < 0) return null;
    const r = h.front && h.wdt >= 2 ? tagSpot(h, 'R') : -1;
    const l = r < 0 && h.corner && h.dpt >= 2 ? tagSpot(h, 'L') : -1;
    if (r < 0 && l < 0) return null;
    const face = r >= 0 ? 'R' : 'L';
    // jen tagy, které se na fasádu vejdou nejvýš do tří řádků písmem 2 (9 px na znak, okraje 16 px)
    const chars = Math.floor((64 * (face === 'R' ? h.wdt : h.dpt) - 16) / 9) * 3 - 4;
    const fit = TAGS.map((t, i) => i).filter((i) => TAGS[i].length <= chars);
    return fit.length ? { v: face === 'R' ? r : l, face, index: fit[h.tagIndex % fit.length] } : null;
};
pending.forEach((h) => {
    const spot = pickTag(h);
    const tagIndex = spot ? spot.index : -1, tagV = spot?.v ?? -1, tagFace = spot?.face ?? 'R';
    const { a0, b0, wdt, dpt, floors, roof, cover, look, corner, back } = h;
    const body = `${wdt}_${dpt}_${floors}${roof[0]}${cover ? cover.slice(0, 2) : ''}_${look}${corner ? 'c' : 'n'}${back ? 'b' : 'f'}${tagIndex >= 0 ? `_t${tagIndex}${tagFace}${tagV}` : ''}`;
    if (!bodies.has(body)) { bodies.set(body, seed); seed++; }
    const key = body; // klíč spritu (hp<list>_<místo>_<tělo>) se doplní po spočítání listů
    if (!seeds.has(key)) seeds.set(key, { seed: bodies.get(body), w: wdt, dpt, floors, roof, cover, style: look, corner, back, tagIndex, tagV, tagFace });
    houses.push({ key, a0, b0, w: wdt, dpt, floors, roof, cover, eave: h.eave, style: h.style, corner, back, name: h.name, osm: h.osm });
});
console.log(`${name}: tagy na ${[...seeds.values()].filter((x) => x.tagIndex >= 0).length} spritech domů`);

// Listy domů: asi 24 spritů na list (největší list pod 4096 px), sprite jde do listu podle pořadí vzniku.
const HOUSE_SHEETS = Math.max(1, Math.ceil(seeds.size / 24));
const spriteKey = (body) => `hp${bodies.get(body) % HOUSE_SHEETS}_${name}_${body}`;
houses.forEach((h) => { h.key = spriteKey(h.key); });
const out = { place: name, houseSheets: HOUSE_SHEETS, tile: TILE, len: place.len, wid: place.wid, center: place.center, bearing: place.bearing, ground: grid.map((row) => row.join('')), houses, landmarks, halls, props };
fs.writeFileSync(path.join(ROOT, `data/${name}.json`), JSON.stringify(out));
const px = [`// Vygenerováno skriptem scripts/osm.mjs ${name}: unikátní kombinace domů pro mapu data/${name}.json. Neupravovat ručně.`];
seeds.forEach(({ seed: s, w, dpt, floors, roof, cover, style, corner, back, tagIndex, tagV, tagFace }, body) => {
    const key = spriteKey(body);
    const tag = tagIndex >= 0 ? `, tag: ${JSON.stringify(TAGS[tagIndex])}, tagColor: "${TAG_COLORS[(s + tagIndex) % TAG_COLORS.length]}", tagV: ${tagV}, tagTop: ${TAG_TOP}, tagFace: "${tagFace}"` : '';
    px.push(`house("${key}", { w: ${w}, dpt: ${dpt}, floors: ${floors}, style: "${style}", roof: "${roof}"${cover ? `, cover: "${cover}"` : ''}, corner: ${corner}, back: ${back}, ornament: ${floors >= 4}, seed: ${s}, damage: ${(0.2 + (s % 5) * 0.15).toFixed(2)}${tag} })`);
});
for (let i = 0; i < HOUSE_SHEETS; i++) px.push(`sheet("houses_${name}_${i}", ["hp${i}_${name}_*"], { pad: 1 })`);
fs.writeFileSync(path.join(ROOT, `art/houses-${name}.px.js`), px.join('\n') + '\n');
// Díly země: obrázek mapy (stejný obdélník jako RenderTexture ve WorldScene.buildGround) rozřezaný na čtverce CHUNK,
// prázdné rohy mimo kosočtverec mapy se vynechají; po osmi do listu ground_<místo>_<n>.
const CHUNK = 1016;
const gw = (place.len + place.wid) * 64 + 128, gh = (place.len + place.wid) * 32 + 64, gx0 = -64, gy0 = -place.len * 32 - 32;
const onMap = (x, y) => { const a = (x / 64 - y / 32) / 2, b = (x / 64 + y / 32) / 2; return a >= -0.5 && a <= place.len - 0.5 && b >= -0.5 && b <= place.wid - 0.5; };
const chunks = [];
for (let j = 0; j * CHUNK < gh; j++) for (let i = 0; i * CHUNK < gw; i++) {
    let hit = false;
    for (let y = 0; y <= CHUNK && !hit; y += 16) for (let x = 0; x <= CHUNK && !hit; x += 16) hit = onMap(gx0 + i * CHUNK + x, gy0 + j * CHUNK + y);
    if (hit) chunks.push([i, j, Math.floor(chunks.length / 8)]);
}
out.groundChunks = { size: CHUNK, sheets: Math.ceil(chunks.length / 8), chunks };
fs.writeFileSync(path.join(ROOT, `data/${name}.json`), JSON.stringify(out));
// Zem a tramvaje: data pro malíře v art/ground.px.js a art/props.px.js (tram()), listy ground_<místo>_<n>.
const gpx = [`// Vygenerováno skriptem scripts/osm.mjs ${name}: vektory země a tramvaje pro mapu data/${name}.json. Neupravovat ručně.`];
[...new Set(tramCars.map((t) => t.angle))].forEach((angle) => gpx.push(`tram("tram_${name}_${angle}", { angle: ${angle}, damage: ${tramCars.find((t) => t.angle === angle).damage} })`));
gpx.push(`groundMap(${JSON.stringify(name)}, ${JSON.stringify({ len: place.len, wid: place.wid, tile: TILE, chunk: CHUNK, chunks, tiles, features, lines })})`);
fs.writeFileSync(path.join(ROOT, `art/ground-${name}.px.js`), gpx.join('\n') + '\n');
const counts = {};
grid.flat().forEach((c) => { counts[c] = (counts[c] ?? 0) + 1; });
console.log(`data/${name}.json: ${place.len} × ${place.wid}, dlaždice ${JSON.stringify(counts)}, budov ${buildings.length}, z laseru ${houses.filter((h) => h.eave !== null).length} z ${houses.length} kvádrů, pater ${JSON.stringify(houses.reduce((m, h) => ({ ...m, [h.floors + h.roof[0]]: (m[h.floors + h.roof[0]] ?? 0) + 1 }), {}))}, kvádrů ${houses.length}, unikátních spritů ${seeds.size}, vektorů ${features.length} ploch a ${lines.length} čar, stromů ${trees.length}, rekvizit ${props.length}, tramvají ${tramCars.length}`);
