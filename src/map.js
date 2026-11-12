import * as ISO from './iso';
import hlavak from '../data/hlavak.json';
import vaclavak from '../data/vaclavak.json';
import staromak from '../data/staromak.json';
import most from '../data/most.json';
import malastrana from '../data/malastrana.json';
import hrad from '../data/hrad.json';
import nuselak from '../data/nuselak.json';
import { HLAVAK } from './places/hlavak';
import { VACLAVAK } from './places/vaclavak';
import { STAROMAK } from './places/staromak';
import { MOST } from './places/most';
import { MALASTRANA } from './places/malastrana';
import { HRAD } from './places/hrad';
import { NUSELAK } from './places/nuselak';

// Mapy míst z dat (scripts/osm.mjs → data/<místo>.json): mřížka znaků a seznam domů. Tady se znaky překládají na
// dlaždice atlasu: r vozovka, p chodník (obrubník na hranách k vozovce), g tráva, t koleje, w voda, b půdorys domu,
// f pěšina (mlat v parku), n nástupiště, x přechod přes koleje, m molo, z štěrk, L půdorys landmarku, . vnitroblok. Dlaždice vedle domů i voda jsou neprůchozí; půdorysy blokuje WorldScene při umístění domů.
export const PLACES = { hlavak, vaclavak, nuselak, staromak, most, malastrana, hrad };
// Střed soupravy tramvaje na zemi v plátně spritu tram_t3_<úhel> (art/tram.px.js TRAM_OX/TRAM_OY, +1 px obrys).
export const TRAM_ORIGIN = { x: 181, y: 171 };
export const PLACE_DEFS = { hlavak: HLAVAK, vaclavak: VACLAVAK, nuselak: NUSELAK, staromak: STAROMAK, most: MOST, malastrana: MALASTRANA, hrad: HRAD };

export const groundTile = (map, a, b) => {
    const at = (x, y) => (x >= 0 && x < map.len && y >= 0 && y < map.wid ? map.ground[x][y] : ' ');
    const c = at(a, b);
    if (c === 'w') return 't_water';
    if (c === 'g') return ISO.pick(['t_grass', 't_grass2', 't_grass3', 't_dirt', 't_grass2', 't_dirt2'], a, b, 2);
    if (c === 't') return 't_rail_a';
    if (c === 'x' || c === 'm') return 't_rail_cross';
    if (c === 'z') return 't_ballast';
    if (c === 'r') return ISO.pick(['t_road', 't_road', 't_road_crack', 't_road_weed', 't_road_sand2'], a, b, 1);
    if (c === 'p') {
        const edges = [['ne', a + 1, b], ['se', a, b + 1], ['sw', a - 1, b], ['nw', a, b - 1]].filter(([, na, nb]) => at(na, nb) === 'r').map(([e]) => e);
        return edges.length ? `t_pave_${edges.join('_')}` : ISO.pick(['t_pave', 't_pave', 't_pave_weed', 't_pave_sand3', 't_pave'], a, b, 3);
    }
    if (c === 'f') return 't_path';
    if (c === 'n') return 't_platform';
    if (c === 'b' || c === 'L') return 't_yard';
    return ISO.pick(['t_dirt', 't_dirt2', 't_dirt3', 't_rubble'], a, b, 4);
};

export const walkable = (map, a, b) => a >= 0 && a < map.len && b >= 0 && b < map.wid && !'wtbLzhk'.includes(map.ground[a][b]);

// Start: první chodník u středu mapy, aby hrdinka nezačala v domě ani ve vodě.
export const startTile = (map) => {
    const ca = Math.floor(map.len / 2), cb = Math.floor(map.wid / 2);
    let best = null;
    for (let a = 0; a < map.len; a++) for (let b = 0; b < map.wid; b++) {
        if (map.ground[a][b] !== 'p') continue;
        const d = Math.hypot(a - ca, b - cb);
        if (!best || d < best.d) best = { a, b, d };
    }
    return best ? { a: best.a, b: best.b } : { a: ca, b: cb };
};
