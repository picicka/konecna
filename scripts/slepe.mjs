// Hledání slepých uliček v dialozích bez průchodu hrou: `node scripts/slepe.mjs [běhů] [semínko]`.
// Hráčka hraje náhodně (utrácí jízdenky, nakupuje, prohrává zkoušky podle skutečného hodu ze semínka, odchází
// z rozhovorů). Po každém rozhovoru zkusí řešitel z kopie stavu dohrát ke konci (hledá volby, které ještě nepadly).
// Když se to ani na mnoho pokusů nepovede, stav se vypíše jako podezřelý: místo, otevřené úkoly a poslední kroky.
// Zjednodušení: všechna zastavení místa jsou dostupná (kromě bran `gates`), boj se vyhrát dá (řešitel vyhraje,
// náhodná hráčka i uteče), smrt mimo boj není.
// src/ importuje bez přípony (Vite), Node potřebuje .js: malý resolve hook.
import { register } from 'node:module';
register('data:text/javascript,' + encodeURIComponent(`export async function resolve(s, c, next) {
    try { return await next(s, c); } catch (e) { if (s.startsWith('.') && !s.endsWith('.js')) return next(s + '.js', c); throw e; } }`));
const { DIALOGS, BATTLES, CHECK, FACTIONS, ITEMS } = await import('../src/script.js');
const { holds, visibleChoices, checkOf, chanceOf, entryNode, wares } = await import('../src/story.js');
const { createState, hasItem, addItem, removeItem, addSupply, gainXp, attr, maxHp, ATTRIBUTES } = await import('../src/state.js');
const P = await import('../src/places/hlavak.js');
const V = await import('../src/places/vaclavak.js');
const S = await import('../src/places/staromak.js');
const M = await import('../src/places/most.js');
const MS = await import('../src/places/malastrana.js');
const H = await import('../src/places/hrad.js');

const PLACE_DEFS = Object.fromEntries([['hlavak', P], ['vaclavak', V], ['staromak', S], ['most', M], ['malastrana', MS], ['hrad', H]].map(([k, m]) => [k, Object.values(m)[0]]));
const RUNS = Number(process.argv[2] ?? 300);
let rngState = Number(process.argv[3] ?? 12345) >>> 0;
const rand = () => { rngState = (Math.imul(rngState, 1664525) + 1013904223) >>> 0; return rngState / 4294967296; };
const pick = (xs) => xs[Math.floor(rand() * xs.length)];
const list = (v) => (v === undefined ? [] : [].concat(v));
const clone = (s) => structuredClone(s);

// Hod zkoušky jako ve story.js (deterministický ze semínka, klíče volby a hodnoty vlastnosti).
const rollFor = (state, key, value) => {
    let h = (state.seed ?? 1) ^ Math.imul(value + 1, 2654435761);
    for (const ch of key) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
    h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15;
    return (h >>> 0) / 4294967296;
};

// Účinky jako apply() ve story.js, bez hlášek. Nové úrovně dají bod do náhodné vlastnosti.
const apply = (state, fx) => {
    if (!fx) return;
    list(fx.take).forEach((i) => { if (!hasItem(state, i)) return; if (state.supplies[i]) addSupply(state, i, -1); else removeItem(state, i); });
    list(fx.give).forEach((i) => {
        if (hasItem(state, i)) return;
        addItem(state, i);
        const slot = ITEMS[i]?.slot;
        if (slot && !state.equip[slot]) state.equip[slot] = i;
    });
    Object.entries(fx.supply ?? {}).forEach(([k, n]) => addSupply(state, k, n));
    if (fx.tickets) state.tickets = Math.max(0, state.tickets + fx.tickets);
    Object.entries(fx.trust ?? {}).forEach(([k, n]) => { state.trust[k] = (state.trust[k] ?? 0) + n; });
    Object.entries(fx.quest ?? {}).forEach(([q, step]) => { state.quests[q] = step; });
    list(fx.flag).forEach((f) => { state.flags[f] = true; });
    list(fx.unflag).forEach((f) => { delete state.flags[f]; });
    if (fx.hpMax) { state.hpMax += fx.hpMax; state.hp += fx.hpMax; }
    if (fx.heal) state.hp = Math.min(maxHp(state), state.hp + fx.heal);
    if (fx.hurt) state.hp = Math.max(1, state.hp - fx.hurt);
    if (fx.xp) for (let n = gainXp(state, fx.xp); n > 0; n--) state.attributes[pick(ATTRIBUTES)] += 1;
};

// Zastavení, ke kterým se teď dá dojít: bez hideIf a ne za zavřenou bránou (Václavák: molo, a < 49).
const stopsHere = (state) => {
    const def = PLACE_DEFS[state.place];
    const closed = (def.gates ?? []).filter((g) => !holds(state, g.open));
    return Object.entries(def.stops).filter(([id, stop]) => {
        if (!DIALOGS[id]) return false;
        if (stop.hideIf && holds(state, stop.hideIf)) return false;
        if (state.place === 'vaclavak' && closed.length && stop.approach.a < 49) return false;
        return true;
    }).map(([id]) => id);
};

// Volby, které náhodná hráčka aspoň jednou vybrala (na konci se vypíšou ty, které nepadly nikdy).
const seen = new Set();

// Jeden rozhovor. policy(state, id, nodeId, choices, seen) vrátí volbu, nebo null (odejít). Vrací 'ending', 'travel', nebo nic.
const talk = (state, id, policy, opts = {}) => {
    const dialog = DIALOGS[id];
    let nodeId = entryNode(state, dialog), last = null;
    for (let guard = 0; nodeId && guard < 40; guard++) {
        const node = dialog.nodes[nodeId];
        if (!node) break;
        if (nodeId !== last && node.do) apply(state, node.do);
        last = nodeId;
        if (!node.choices) { if (!node.next) break; nodeId = node.next; continue; }
        const choices = visibleChoices(state, id, node);
        const choice = policy(state, id, nodeId, choices);
        if (!choice) break;
        opts.log?.push(`${id}.${choice.id ?? 'obchod'}`);
        if (opts.log) seen.add(`${id}.${nodeId}.${choice.id}`);
        if (choice.shop) {
            const ware = opts.buy?.(state, wares(state, id).filter((w) => state.tickets >= w.price));
            if (ware) { apply(state, { tickets: -ware.price, ...(ITEMS[ware.item]?.use ? { supply: { [ware.item]: 1 } } : { give: ware.item }) }); }
            continue;
        }
        const check = checkOf(id, choice);
        if (check) {
            const ok = opts.lucky ? chanceOf(state, id, choice) > 0 : rollFor(state, `${id}.${choice.id}`, attr(state, check.a)) < chanceOf(state, id, choice);
            if (!ok) {
                state.failed = { ...state.failed, [`${id}.${choice.id}`]: attr(state, check.a) };
                const cost = choice.fail ?? (check.a === 'usta' && dialog.faction && FACTIONS.list[dialog.faction]?.perks ? { trust: { [dialog.faction]: -1 } } : CHECK.cost[check.a]);
                apply(state, cost);
                continue;
            }
        }
        if (choice.once) state.asked[id] = [...(state.asked[id] ?? []), choice.id];
        const { fight, travel, ending, ...now } = choice.do ?? {};
        apply(state, now);
        if (fight) {
            if (opts.flee?.()) break;
            apply(state, { ...(BATTLES[fight]?.loot ?? {}), ...choice.win });
        }
        if (travel) { state.arrival = state.place; state.place = travel; state.hp = Math.min(maxHp(state), state.hp + Math.ceil(maxHp(state) / 2)); return 'travel'; }
        if (ending) return 'ending';
        if (choice.end) break;
        if (choice.next && choice.next !== nodeId) nodeId = choice.next;
    }
    return null;
};

// Otisk stavu, podle kterého řešitel pozná, že se něco změnilo (pokrok).
const mark = (s) => JSON.stringify([s.place, s.flags, s.quests, s.items, s.supplies, s.tickets, s.trust, s.asked, s.failed, s.attributes]);

// Řešitel: jde po volbách, které v tomto běhu ještě nepadly; zkoušky vyjdou, jen když opravdu vyjdou (hod), boj vyhraje.
// Nakupuje jen to, co ještě nemá. Vrátí true, když dojde ke konci.
const solve = (start, tries = 25) => {
    for (let t = 0; t < tries; t++) {
        const state = clone(start);
        const used = new Set();
        let idle = 0;
        for (let step = 0; step < 400 && idle < 60; step++) {
            const before = mark(state);
            const id = pick(stopsHere(state));
            const r = talk(state, id, (s, d, n, choices) => {
                const fresh = choices.filter((c) => !used.has(`${d}.${n}.${c.id}`));
                const c = fresh.length ? pick(fresh) : (rand() < 0.3 ? pick(choices) : null);
                if (c) used.add(`${d}.${n}.${c.id}`);
                return c ?? null;
            }, { buy: (s, ws) => (ws.length ? pick(ws) : null) });
            if (r === 'ending') return true;
            if (r === 'travel') used.clear();
            idle = mark(state) === before ? idle + 1 : 0;
        }
    }
    return false;
};


// Náhodná hráčka: kterékoli zastavení, kterákoli volba, nákupy, útěky z boje.
const suspects = new Map();
let finished = 0;
for (let run = 0; run < RUNS; run++) {
    const state = createState();
    state.seed = Math.floor(rand() * 1e9);
    state.attributes[pick(ATTRIBUTES)] += 1;
    state.flags.created = true;
    const log = [];
    for (let step = 0; step < 300; step++) {
        const id = pick(stopsHere(state));
        const r = talk(state, id, (s, d, n, choices) => (rand() < 0.15 || !choices.length ? null : pick(choices)),
            { log, buy: (s, ws) => (ws.length && rand() < 0.7 ? pick(ws) : null), flee: () => rand() < 0.3 });
        if (r === 'ending') { finished++; break; }
        if (step % 5 === 0 && !solve(state)) {
            // potvrdit víc pokusy, ať to není smůla řešitele
            if (solve(state, 150)) continue;
            const open = Object.entries(state.quests).filter(([, v]) => v !== 'done').map(([k, v]) => `${k}:${v}`).join(' ');
            const rich = clone(state); rich.tickets += 10;
            const cause = solve(rich, 150) ? 'chybí jízdenky' : 'jiná příčina';
            const key = `${cause} | ${state.place} | ${open}`;
            if (!suspects.has(key)) suspects.set(key, { state: clone(state), log: log.slice(-25), run });
            break;
        }
    }
}

console.log(`běhů ${RUNS}, náhodně dohráno ${finished}, podezřelých stavů ${suspects.size}`);
for (const [key, { state, log, run }] of suspects) {
    console.log(`\n=== ${key}  (běh ${run})`);
    console.log(`jízdenky ${state.tickets}, vlastnosti ${JSON.stringify(state.attributes)}, úroveň ${state.level}, xp ${state.xp}, důvěra ${JSON.stringify(state.trust)}`);
    console.log(`předměty ${[...state.items, ...Object.keys(state.supplies)].join(', ')}`);
    console.log(`vlajky ${Object.keys(state.flags).join(' ')}`);
    console.log(`nepovedené ${Object.entries(state.failed).map(([k, v]) => `${k}@${v}`).join(' ')}`);
    console.log(`poslední kroky ${log.join(' → ')}`);
}

// Volby, které nepadly ani jednou: mrtvé větve (podmínka nikdy neplatí), nebo jen hodně vzácné.
const never = [];
for (const [id, d] of Object.entries(DIALOGS)) for (const [n, node] of Object.entries(d.nodes ?? {})) for (const c of node.choices ?? []) {
    if (!seen.has(`${id}.${n}.${c.id}`)) never.push(`${id}.${n}.${c.id}`);
}
console.log(`\nvolby, které nepadly ani jednou (${never.length}): ${never.join(' ')}`);
