// Stažení exportu OpenStreetMap pro místo (Overpass) a ořez na mapu: data/osm/<místo>.json (v repu, © přispěvatelé
// OpenStreetMap, ODbL). Bere všechno v obdélníku mapy s okrajem 60 m, nechá cesty s tagy, multipolygony ploch
// (parky, trávníky, náměstí, budovy) a body s tagy, které mapa používá (stromy, lampy, lavičky, zastávky…).
// Spuštění: node scripts/osm-stahnout.mjs hlavak   (pak npm run osm)
import fs from 'node:fs';
import path from 'node:path';
import { PLACES, bbox } from './places.mjs';

const ROOT = path.resolve(new URL('.', import.meta.url).pathname, '..');
const name = process.argv[2] ?? 'hlavak';
const place = PLACES[name];
if (!place) { console.error(`neznámé místo ${name}`); process.exit(1); }
const [s, w, n, e] = bbox(place, 60);
const query = `[out:json][timeout:180];(nwr(${s},${w},${n},${e}););out body;>;out skel qt;`;
// Hlavní server bývá přetížený; zrcadla se zkoušejí po řadě.
const ENDPOINTS = ['https://overpass-api.de/api/interpreter', 'https://maps.mail.ru/osm/tools/overpass/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];
let data = null;
for (const url of ENDPOINTS) {
    try {
        console.log('stahuji z', url);
        const res = await fetch(url, { method: 'POST', body: new URLSearchParams({ data: query }), headers: { 'User-Agent': 'konecna-game-map/1.0' } });
        if (!res.ok) { console.log('  ', res.status); continue; }
        data = await res.json();
        break;
    } catch (err) { console.log('  ', err.message); }
}
if (!data) { console.error('žádný server Overpass neodpověděl'); process.exit(1); }

// Prvky přicházejí dvakrát (out body a pak bez tagů z rekurze): sloučit, tagy mají přednost.
const merge = (m, x) => { const o = m.get(x.id); m.set(x.id, o ? { ...o, ...x, tags: o.tags ?? x.tags, nodes: o.nodes?.length >= (x.nodes?.length ?? 0) ? o.nodes : x.nodes } : x); };
const nodes = new Map(), ways = new Map(), rels = new Map();
data.elements.forEach((x) => merge(x.type === 'node' ? nodes : x.type === 'way' ? ways : rels, x));
const inb = (nd) => nd && nd.lat >= s && nd.lat <= n && nd.lon >= w && nd.lon <= e;
const AREA = /^(leisure|landuse|building|area:highway|natural|amenity|highway|railway|man_made|place)$/;
const POINT = /^(natural|highway|amenity|railway|public_transport|leisure|historic|tourism|man_made|barrier|entrance)$/;
const keepW = new Set([...ways.values()].filter((x) => x.tags && x.nodes.some((id) => inb(nodes.get(id)))).map((x) => x.id));
// Multipolygony do 200 členů (velké relace jako hranice čtvrtí nebo linky sem nepatří).
const keepR = [...rels.values()].filter((r) => r.tags?.type === 'multipolygon' && Object.keys(r.tags).some((k) => AREA.test(k)) && r.members.length < 200
    && r.members.some((m) => m.type === 'way' && ways.get(m.ref)?.nodes.some((id) => inb(nodes.get(id)))));
keepR.forEach((r) => r.members.forEach((m) => { if (m.type === 'way' && ways.has(m.ref)) keepW.add(m.ref); }));
const keepN = new Set();
keepW.forEach((id) => ways.get(id).nodes.forEach((x) => keepN.add(x)));
nodes.forEach((x) => { if (x.tags && inb(x) && Object.keys(x.tags).some((k) => POINT.test(k))) keepN.add(x.id); });
const r7 = (v) => Math.round(v * 1e7) / 1e7;
const out = {
    version: data.version, generator: data.generator, osm3s: data.osm3s,
    elements: [
        ...[...keepN].map((id) => nodes.get(id)).filter(Boolean).map((x) => ({ type: 'node', id: x.id, lat: r7(x.lat), lon: r7(x.lon), ...(x.tags ? { tags: x.tags } : {}) })),
        ...[...keepW].map((id) => ways.get(id)).map((x) => ({ type: 'way', id: x.id, nodes: x.nodes, ...(x.tags ? { tags: x.tags } : {}) })),
        ...keepR.map((r) => ({ type: 'relation', id: r.id, members: r.members.filter((m) => m.type === 'way').map((m) => ({ type: 'way', ref: m.ref, role: m.role })), tags: r.tags })),
    ],
};
const dst = path.join(ROOT, 'data/osm', `${name}.json`);
fs.writeFileSync(dst, JSON.stringify(out));
console.log(`${dst}: ${keepN.size} bodů, ${keepW.size} cest, ${keepR.length} relací, ${(fs.statSync(dst).size / 1e6).toFixed(1)} MB, stav OSM ${data.osm3s?.timestamp_osm_base}`);
