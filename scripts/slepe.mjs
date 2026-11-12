// Slepé uličky v příběhu: úplné prohledání grafu stavů, ne vzorkování. `node scripts/slepe.mjs [--vse] [--cesty N] [-v]`.
//
// Všech stavů hry je příliš (nezávislé vlajky, nákupy, jízdenky a důvěra se násobí), proto se prohledává zjednodušený
// stav a zpřesňuje se, dokud je co (abstrakce a zpřesnění podle protipříkladu):
// 1. Stav tvoří jen SLEDOVANÉ proměnné (na začátku žádná, jen místo, strana zlomu na Nuseláku a uzel rozhovoru).
//    Podmínka nad nesledovanou proměnnou je „možná“: dopředu se s takovou volbou počítá (dosažitelných stavů je tak
//    spíš víc než ve hře, nikdy míň), na cestě ke konci se na ni nespoléhá.
// 2. Dopředu se do šířky projdou všechny dosažitelné stavy, zpátky od konců se označí ty, ze kterých se dá JISTĚ dohrát.
// 3. Kde jistá cesta chybí, přidají se mezi sledované proměnné ty, na kterých stojí nejkratší možná cesta ke konci
//    (nebo cesta do toho stavu), a jede se znovu. Skončí to, když je každý stav buď v pořádku, nebo slepý bez „možná“.
// Když nic nezbude, je to důkaz: z každého dosažitelného stavu vede ke konci cesta, na kterou se dá spolehnout.
//
// Na co se spolehnout nedá: vlastnosti (Ruka, Ústa, Oko), úroveň a životy ve stavu nejsou. Zkouška vlastnosti se
// dopředu bere tak, že může vyjít i nevyjít (platí pro každé semínko a každou stavbu postavy), a zpátky se s ní
// nepočítá. Pravidlo hry: nepovedená zkouška ani utracené jízdenky nesmí zavřít cestu dál. Tři stupně:
//   tvrdá slepá ulička   ke konci nevede nic, ani se štěstím
//   jen se štěstím       ke konci vede jen cesta přes zkoušku vlastnosti
//   jen bojem            ke konci vede jen cesta přes vyhraný boj (vypisuje se jen počet, boj se vyhrát dá)
// Zjednodušení: všechna zastavení místa jsou dostupná (kromě bran `gates` a druhé strany zlomu), zásoby (obvazy) jsou
// jen utracené jízdenky, jízdenky nad strop místa se nerozlišují, důvěra se drží v pásmu kolem prahů místa.
// src/ importuje bez přípony (Vite), Node potřebuje .js: malý resolve hook.
import { register } from 'node:module';
register('data:text/javascript,' + encodeURIComponent(`export async function resolve(s, c, next) {
    try { return await next(s, c); } catch (e) { if (s.startsWith('.') && !s.endsWith('.js')) return next(s + '.js', c); throw e; } }`));
const { DIALOGS, BATTLES, CHECK, FACTIONS, ITEMS } = await import('../src/script.js');
const { createState } = await import('../src/state.js');
const PLACE_DEFS = {};
for (const p of ['hlavak', 'vaclavak', 'nuselak', 'staromak', 'most', 'malastrana', 'hrad']) PLACE_DEFS[p] = Object.values(await import(`../src/places/${p}.js`))[0];

const args = process.argv.slice(2);
const ALL = args.includes('--vse');
const VERBOSE = args.includes('-v');
const PATHS = Number(args[args.indexOf('--cesty') + 1]) || 12;
const LIMIT = 6_000_000;
// --bez rozhovor.uzel.volba,… vypne volby na zkoušku („co když tuhle cestu zruším“), hra se nemění
const OFF = new Set(args.includes('--bez') ? args[args.indexOf('--bez') + 1].split(',') : []);
// Vyvracení nálezu (je ten stav vůbec dosažitelný?) se zkouší jen pár kol a v malém grafu; pak se nález vypíše.
const DOUBT_ROUNDS = 6, DOUBT_STATES = 300_000;
const list = (v) => (v === undefined ? [] : [].concat(v));

// —— Prahy jízdenek a důvěry z podmínek a cen ——
// Jízdenky: kolik nejvíc je na místě k něčemu potřeba (podmínka, cena, útrata) a nejvyšší práh „nemám na to“ v celé hře.
const THRESH = { trust: {}, poor: [0], need: {} };
let curTrust = {};
const scan = (cond, need) => {
    if (!cond) return;
    list(cond.any).forEach((c) => scan(c, need));
    [...Object.entries(cond.trust ?? {}), ...Object.entries(cond.distrust ?? {})].forEach(([f, n]) => { ((curTrust[f] ??= [])).push(n); });
    if (cond.tickets !== undefined) need.push(cond.tickets);
    if (cond.poor !== undefined) THRESH.poor.push(cond.poor);
};
for (const [place, def] of Object.entries(PLACE_DEFS)) {
    const need = THRESH.need[place] = [0];
    curTrust = THRESH.trust[place] = {};
    (def.gates ?? []).forEach((g) => scan(g.open, need));
    for (const [id, stop] of Object.entries(def.stops ?? {})) {
        scan(stop.hideIf, need);
        const d = DIALOGS[id];
        if (!d) continue;
        (d.entry ?? []).forEach((e) => scan(e.if, need));
        (d.shop ?? []).forEach((w) => { scan(w.if, need); need.push(w.price); });
        for (const node of Object.values(d.nodes ?? {})) for (const c of node.choices ?? []) {
            scan(c.if, need);
            for (const fx of [c.do, c.win, c.fail]) if (fx?.tickets < 0) need.push(-fx.tickets);
        }
    }
}
// Strop jízdenek pro důkaz jednoho místa: nad jeho nejvyšší cenu (plus nejvyšší práh „nemám na to“, ať po jedné útratě
// z plné kapsy nevyjde chudoba) se jízdenky nerozlišují. Důvěra: pásmo o 2 pod nejnižším a 1 nad nejvyšším prahem.
// Jízdenky se počítají přesně do stropu místa (jeho nejvyšší cena nebo podmínka plus nejvyšší práh „nemám na to“),
// nad ním se nerozlišují. Důvěra přesně v pásmu od 3 pod nejnižším prahem místa (a nulou) po nejvyšší práh.
let STEPS = [0], STROP = 0;
const range = (lo, hi) => Array.from({ length: hi - lo + 1 }, (_, k) => lo + k);
const stepsOf = (place) => range(0, Math.max(...THRESH.need[place]) + Math.max(...THRESH.poor));
const floorT = (v) => Math.min(STEPS.at(-1), Math.max(0, v));
const upperT = (v) => v;
let TSTEPS = {};
const trustSteps = (place) => Object.fromEntries(Object.entries(THRESH.trust[place]).map(([f, ns]) => [f, range(Math.min(0, ...ns) - 3, Math.max(0, ...ns))]));
const lowT = (f) => (TSTEPS[f] ?? [0])[0] - 1;
const floorTr = (f, v) => { const st = TSTEPS[f] ?? [0]; return Math.min(st.at(-1), Math.max(st[0], v)); };
const upperTr = (f, v) => v;
const trustOf = (s, f) => s.trust[f] ?? floorTr(f, 0);
// Horní mez („nejvýš má“): jízdenky s.thi, důvěra s.trustHi; bez záznamu je to horní okraj prahu, na kterém stojí.
// Interval [dolní, horní] vždy obsahuje skutečnou hodnotu: jisté je, co platí pro celý interval, možné, co pro jeho část.
const ticketsHi = (s) => s.thi ?? upperT(s.tickets);
const trustHi = (s, f) => s.trustHi?.[f] ?? upperTr(f, trustOf(s, f));

// —— Sledované proměnné: 'f:vlajka', 'q:úkol', 'i:předmět', 't:skupina', 'a:rozhovor.volba' (vyčerpaná), 'tickets' ——
const known = new Set();

// Skupina vlajek: `any` jen z jednotlivých vlajek. Vlajky se ve hře nemažou, takže „platí aspoň jedna“ jde sledovat
// jako jedna proměnná, která se zapne s první z nich.
const GROUPS = new Map();
const groupOf = (any) => {
    if (!any?.length || !any.every((c) => Object.keys(c).length === 1 && typeof c.flag === 'string')) return null;
    const key = any.map((c) => c.flag).sort().join('+');
    if (!GROUPS.has(key)) GROUPS.set(key, any.map((c) => c.flag));
    return key;
};
const everyCond = (fn) => {
    const walk = (c) => { if (!c) return; fn(c); list(c.any).forEach(walk); };
    for (const d of Object.values(DIALOGS)) {
        (d.entry ?? []).forEach((e) => walk(e.if));
        (d.shop ?? []).forEach((w) => walk(w.if));
        for (const node of Object.values(d.nodes ?? {})) for (const c of node.choices ?? []) walk(c.if);
    }
    for (const def of Object.values(PLACE_DEFS)) { (def.gates ?? []).forEach((g) => walk(g.open)); Object.values(def.stops ?? {}).forEach((st) => walk(st.hideIf)); }
};
everyCond((c) => groupOf(c.any));

// Podmínka nad zjednodušeným stavem: { no } neplatí; jinak platí, pokud vyjdou nesledované proměnné `unk` a případně
// vlastnost (`attr`). Bez `unk` a `attr` platí jistě.
const NO = { no: true };
const sureOf = (r) => !r.no && !r.unk.size && !r.attr && !r.soft;
const evalCond = (s, cond) => {
    const unk = new Set();
    let attr = false, soft = false;
    if (!cond) return { unk, attr, soft };
    const test = (name, fn) => { if (!known.has(name)) { unk.add(name); return true; } return fn(); };
    // „stačí kterákoli z vlajek“ (útržky pro velvyslance) je jedna společná proměnná g:…, ne každá vlajka zvlášť
    const group = groupOf(cond.any);
    if (group) { if (!test(`g:${group}`, () => Boolean(s.flags[`#${group}`]))) return NO; } else if (cond.any) {
        const subs = cond.any.map((c) => evalCond(s, c)).filter((r) => !r.no);
        if (!subs.length) return NO;
        if (!subs.some(sureOf)) {
            // žádná větev neplatí jistě: stojí na první větvi bez vlastnosti (po jedné, ať se „stačí jedno z pěti“
            // nesleduje celé najednou), jinak jen na vlastnosti
            const plain = subs.find((r) => !r.attr && !r.soft);
            if (plain) plain.unk.forEach((v) => unk.add(v)); else if (subs.some((r) => r.soft)) soft = true; else attr = true;
        }
    }
    for (const i of list(cond.item)) if (!test(`i:${i}`, () => s.items.includes(i))) return NO;
    for (const i of list(cond.noItem)) if (!test(`i:${i}`, () => !s.items.includes(i))) return NO;
    for (const f of list(cond.flag)) if (!test(`f:${f}`, () => Boolean(s.flags[f]))) return NO;
    for (const f of list(cond.noFlag)) if (!test(`f:${f}`, () => !s.flags[f])) return NO;
    for (const [q, step] of Object.entries(cond.quest ?? {})) if (!test(`q:${q}`, () => list(step).includes(s.quests[q]))) return NO;
    for (const [q, step] of Object.entries(cond.questNot ?? {})) if (!test(`q:${q}`, () => !list(step).includes(s.quests[q]))) return NO;
    // jízdenky: jistě má (práh ve stavu stačí), možná má (stačil by až další práh), nebo nemá
    if (cond.tickets !== undefined && !test('tickets', () => { if (s.tickets >= cond.tickets) return true; if (ticketsHi(s) < cond.tickets) return false; soft = true; return true; })) return NO;
    if (cond.poor !== undefined && !test('tickets', () => { if (ticketsHi(s) < cond.poor) return true; if (s.tickets >= cond.poor) return false; soft = true; return true; })) return NO;
    for (const [f, n] of Object.entries(cond.trust ?? {})) if (!test(`t:${f}`, () => { if (trustOf(s, f) >= n) return true; if (trustHi(s, f) < n) return false; soft = true; return true; })) return NO;
    for (const [f, n] of Object.entries(cond.distrust ?? {})) if (!test(`t:${f}`, () => { if (trustHi(s, f) < n) return true; if (trustOf(s, f) >= n) return false; soft = true; return true; })) return NO;
    if (cond.attr) attr = true;
    return { unk, attr, soft };
};
const both = (p, q) => (p.no || q.no ? NO : { unk: new Set([...p.unk, ...q.unk]), attr: p.attr || q.attr, soft: p.soft || q.soft });
const YES = () => ({ unk: new Set(), attr: false, soft: false });
// opak podmínky: jistě platí → neplatí; neplatí → platí; jinak stojí na stejných proměnných
const not = (r) => {
    if (r.no) return YES();
    if (sureOf(r)) return NO;
    return { unk: new Set(r.unk), attr: r.attr, soft: r.soft };
};

// —— Stav ——
const start = () => {
    const s = createState();
    return { place: s.place, side: null, tickets: s.tickets, flags: { created: true }, quests: { ...s.quests }, items: [...s.items], trust: {}, trustHi: {}, asked: {} };
};
const clone = (s) => ({ ...s, flags: { ...s.flags }, quests: { ...s.quests }, items: [...s.items], trust: { ...s.trust }, trustHi: { ...s.trustHi }, asked: { ...s.asked } });
// Do stavu se ukládá jen sledované, takže otisk je celý stav. pos je uzel rozhovoru, nebo null (hrdinka stojí ve světě).
const project = (s) => {
    if (!known.has('tickets')) { s.tickets = 0; delete s.thi; }
    s.flags = Object.fromEntries(Object.keys(s.flags).filter((f) => known.has(f[0] === '#' ? `g:${f.slice(1)}` : `f:${f}`)).map((f) => [f, true]));
    s.quests = Object.fromEntries(Object.entries(s.quests).filter(([q]) => known.has(`q:${q}`)));
    s.items = s.items.filter((i) => known.has(`i:${i}`));
    return s;
};
const keyOf = (s, pos) => [
    s.place, s.side ?? '', pos ? `${pos[0]}.${pos[1]}` : '', known.has('tickets') ? String(s.tickets) : '',
    [...new Set([...Object.keys(s.trust), ...Object.keys(s.trustHi ?? {})])].sort().map((f) => `${f} ${trustOf(s, f)}`).join(','),
    Object.keys(s.flags).sort().join(' '),
    Object.entries(s.quests).map(([q, v]) => `${q}:${v}`).sort().join(' '),
    [...s.items].sort().join(' '),
    Object.keys(s.asked).sort().join(' '),
].join('|');

// Účinky jako apply() ve story.js, jen na sledované proměnné; zkušenosti, životy a zásoby se nesledují.
const apply = (s, fx) => {
    if (!fx) return;
    list(fx.take).forEach((i) => { s.items = s.items.filter((x) => x !== i); });
    list(fx.give).forEach((i) => { if (known.has(`i:${i}`) && !s.items.includes(i)) s.items.push(i); });
    if (fx.tickets && known.has('tickets')) {
        const hi = ticketsHi(s);
        s.tickets = floorT(Math.max(0, s.tickets + fx.tickets));
        s.thi = hi === Infinity ? Infinity : upperT(floorT(Math.max(0, hi + fx.tickets)));
    }
    Object.entries(fx.trust ?? {}).forEach(([k, n]) => {
        if (!known.has(`t:${k}`)) return;
        const now = trustOf(s, k), hi = trustHi(s, k);
        s.trust[k] = now <= lowT(k) ? lowT(k) : floorTr(k, now + n);
        (s.trustHi ??= {})[k] = hi === Infinity ? Infinity : upperTr(k, floorTr(k, hi + n));
    });
    Object.entries(fx.quest ?? {}).forEach(([q, step]) => { if (known.has(`q:${q}`)) s.quests[q] = step; });
    list(fx.flag).forEach((f) => {
        if (known.has(`f:${f}`)) s.flags[f] = true;
        for (const [key, members] of GROUPS) if (members.includes(f) && known.has(`g:${key}`)) s.flags[`#${key}`] = true;
    });
    list(fx.unflag).forEach((f) => { delete s.flags[f]; });
};

// Zastavení, ke kterým se teď dá dojít, s podmínkou: bez hideIf, ne za zavřenou bránou (Václavák: molo, a < 49)
// a na Nuseláku jen na té straně zlomu, kde hrdinka stojí (na druhou vede jen lano, účinek `rope`).
const sideOf = (def, a) => (def.nusle ? (a < def.nusle.gap[0] ? 'sever' : 'jih') : null);
const stopsHere = (s) => {
    const def = PLACE_DEFS[s.place];
    const out = [];
    for (const [id, stop] of Object.entries(def.stops)) {
        if (!DIALOGS[id]) continue;
        if (def.nusle && sideOf(def, stop.approach.a) !== s.side) continue;
        let r = stop.hideIf ? not(evalCond(s, stop.hideIf)) : YES();
        if (s.place === 'vaclavak' && stop.approach.a < 49) for (const g of def.gates ?? []) r = both(r, evalCond(s, g.open));
        if (!r.no) out.push([id, r]);
    }
    return out;
};
const arrive = (s, place) => {
    const def = PLACE_DEFS[place], from = s.place;
    s.place = place;
    s.side = def.nusle ? sideOf(def, (def.arrivals?.[from] ?? def.start).a) : null;
};

// Vstupní uzly rozhovoru: první vstup, jehož podmínka platí; nad nesledovanou proměnnou jich může být víc.
const entries = (s, dialog) => {
    const out = [];
    let before = YES();
    for (const e of dialog.entry) {
        const r = evalCond(s, e.if);
        if (r.no) continue;
        out.push([e.node, both(before, r)]);
        if (sureOf(r)) return out;
        before = both(before, not(r));
    }
    if (!out.some(([n]) => n === dialog.entry.at(-1).node)) out.push([dialog.entry.at(-1).node, before]);
    return out;
};
// Vstup do uzlu: jeho účinky a průchod uzly bez voleb. Vrací uzel s volbami, nebo null (rozhovor skončil).
const enter = (s, id, nodeId) => {
    const dialog = DIALOGS[id];
    for (let guard = 0; nodeId && guard < 40; guard++) {
        const node = dialog.nodes[nodeId];
        if (!node) return null;
        apply(s, node.do);
        if (node.choices) return nodeId;
        nodeId = node.next;
    }
    return null;
};

// Následníci stavu: [stav, pozice, druh hrany, popis, proměnné]. Druhy:
//   'jiste'  volba hráčky, na kterou se dá spolehnout            'boj'    vyhraný boj
//   'stesti' povedená zkouška vlastnosti                         'mozna'  stojí na nesledovaných proměnných
//   'smula'  nepovedená zkouška (jen dopředu, na cestě ke konci se s ní nepočítá)
const END = '#konec';
const allChoices = Object.entries(DIALOGS).flatMap(([id, d]) => Object.entries(d.nodes ?? {}).flatMap(([n, node]) => (node.choices ?? []).map((c) => `${id}.${n}.${c.id ?? 'obchod'}`)));
const NONE = new Set();
const taken = new Set();
const kindOf = (r, base = 'jiste') => (r.soft ? 'smula' : r.unk.size ? 'mozna' : r.attr ? 'stesti' : base);
const successors = (s, pos) => {
    const out = [];
    if (!pos) {
        for (const [id, here] of stopsHere(s)) for (const [entry, r0] of entries(s, DIALOGS[id])) {
            const r = both(here, r0), t = clone(s), nodeId = enter(t, id, entry);
            out.push([t, nodeId ? [id, nodeId] : null, kindOf(r), `→ ${id}`, r.unk]);
        }
        return out;
    }
    const [id, nodeId] = pos, dialog = DIALOGS[id], node = dialog.nodes[nodeId];
    out.push([s, null, 'jiste', 'odejít', NONE]);
    for (const c of node.choices ?? []) {
        const label = `${id}.${nodeId}.${c.id ?? 'obchod'}`;
        if (OFF.has(label)) continue;
        if (c.shop) {
            for (const w of dialog.shop ?? []) {
                const supply = Boolean(ITEMS[w.item]?.use);
                const r = both(evalCond(s, w.if), evalCond(s, supply ? { tickets: w.price } : { tickets: w.price, noItem: w.item }));
                if (r.no) continue;
                const t = clone(s);
                apply(t, supply ? { tickets: -w.price } : { tickets: -w.price, give: w.item });
                taken.add(label);
                out.push([t, pos, kindOf(r), `${label}:${w.item}`, r.unk]);
            }
            continue;
        }
        const once = `a:${id}.${c.id}`;
        let r = evalCond(s, c.if);
        if (c.check && !r.no) r = { ...r, attr: true };
        if (c.once && !r.no) { if (!known.has(once)) r = { ...r, unk: new Set([...r.unk, once]) }; else if (s.asked[`${id}.${c.id}`]) r = NO; }
        if (r.no) continue;
        taken.add(label);
        if (r.attr) {
            // nepovedená zkouška: cena (důvěra skupiny u Úst, nebo fail u volby; zranění se nesleduje), rozhovor zůstává v uzlu
            const a = c.check ?? Object.keys(c.if?.attr ?? {})[0];
            const cost = c.fail ?? (a === 'usta' && dialog.faction && FACTIONS.list[dialog.faction]?.perks ? { trust: { [dialog.faction]: -1 } } : CHECK.cost[a]);
            const f = clone(s);
            apply(f, cost);
            out.push([f, pos, 'smula', `${label} ✗`, NONE]);
        }
        const t = clone(s);
        const { fight, travel, ending, film, rope, ...now } = c.do ?? {};
        apply(t, now);
        if (c.once && known.has(once)) t.asked[`${id}.${c.id}`] = true;
        let kind = kindOf(r);
        if (fight) {
            // útěk: rozhovor končí, účinky volby zůstávají; výhra: kořist a účinek výhry
            out.push([clone(t), null, kind, `${label} (útěk)`, r.unk]);
            apply(t, { ...(BATTLES[fight]?.loot ?? {}), ...c.win });
            if (kind === 'jiste') kind = 'boj';
        }
        if (ending) { out.push([t, END, kind, label, r.unk]); continue; }
        if (travel) { arrive(t, travel); out.push([t, null, kind, `${label} ⇒ ${travel}`, r.unk]); continue; }
        if (rope) { t.side = rope; out.push([t, null, kind, `${label} (lano)`, r.unk]); continue; }
        if (c.end) { out.push([t, null, kind, label, r.unk]); continue; }
        const next = c.next && c.next !== nodeId ? enter(t, id, c.next) : nodeId;
        out.push([t, next ? [id, next] : null, kind, label, r.unk]);
    }
    return out;
};

// —— Kde se která proměnná mění: místní (jen na jednom místě) a obecné (jízdenky, důvěra, co se nosí mezi místy) ——
const DIALOG_PLACE = {};
for (const [place, def] of Object.entries(PLACE_DEFS)) for (const id of Object.keys(def.stops ?? {})) DIALOG_PLACE[id] = place;
const WRITERS = new Map();
const wrote = (v, place) => { if (!WRITERS.has(v)) WRITERS.set(v, new Set()); WRITERS.get(v).add(place); };
const scanFx = (fx, place) => {
    if (!fx) return;
    [...list(fx.give), ...list(fx.take)].forEach((i) => wrote(`i:${i}`, place));
    if (fx.tickets) wrote('tickets', place);
    Object.keys(fx.trust ?? {}).forEach((f) => wrote(`t:${f}`, place));
    Object.keys(fx.quest ?? {}).forEach((q) => wrote(`q:${q}`, place));
    [...list(fx.flag), ...list(fx.unflag)].forEach((f) => { wrote(`f:${f}`, place); for (const [key, members] of GROUPS) if (members.includes(f)) wrote(`g:${key}`, place); });
    if (fx.fight) scanFx(BATTLES[fx.fight]?.loot, place);
};
for (const [id, d] of Object.entries(DIALOGS)) {
    const place = DIALOG_PLACE[id] ?? '?';
    (d.shop ?? []).forEach((w) => { wrote(`i:${w.item}`, place); wrote('tickets', place); });
    for (const node of Object.values(d.nodes ?? {})) {
        scanFx(node.do, place);
        for (const c of node.choices ?? []) {
            [c.do, c.win, c.fail].forEach((fx) => scanFx(fx, place));
            if (c.once) wrote(`a:${id}.${c.id}`, place);
            if ((c.check ?? Object.keys(c.if?.attr ?? {})[0]) === 'usta' && d.faction) wrote(`t:${d.faction}`, place);
        }
    }
}
// Proměnná je místní, když ji mění jen rozhovory toho místa; jinak ji hrdinka může přinést změněnou odjinud.
const localTo = (v, place) => { const w = WRITERS.get(v); return !w || (w.size === 1 && w.has(place)); };
const varOfFlag = (f) => (f[0] === '#' ? `g:${f.slice(1)}` : `f:${f}`);
// Rozdělení stavu na místní a obecnou část a jejich složení (přinesené obecné + místní, jak zůstalo).
const part = (s, place, local) => {
    const keep = (v) => localTo(v, place) === local;
    return {
        ...s, tickets: local ? 0 : s.tickets, thi: local ? undefined : s.thi, trust: local ? {} : { ...s.trust }, trustHi: local ? {} : { ...s.trustHi },
        flags: Object.fromEntries(Object.keys(s.flags).filter((f) => keep(varOfFlag(f))).map((f) => [f, true])),
        quests: Object.fromEntries(Object.entries(s.quests).filter(([q]) => keep(`q:${q}`))),
        items: s.items.filter((i) => keep(`i:${i}`)),
        asked: Object.fromEntries(Object.keys(s.asked).filter((a) => keep(`a:${a}`)).map((a) => [a, true])),
    };
};
const merge = (g, l) => ({ ...l, tickets: g.tickets, thi: g.thi, trust: { ...g.trust }, trustHi: { ...g.trustHi }, flags: { ...l.flags, ...g.flags }, quests: { ...l.quests, ...g.quests }, items: [...l.items, ...g.items], asked: { ...l.asked, ...g.asked } });

// —— Jedno kolo: dopředu všechny dosažitelné stavy do šířky (rodič = nejkratší cesta), zpátky od konců ——
// Graf je úsporný (stavů bývají statisíce): po rozvinutí se stav zahodí a zůstane jen místo, pozice a otisk, hrany
// předchůdců jsou dvojice čísel (odkud, druh a číslo sady proměnných).
const KINDS = ['jiste', 'boj', 'mozna', 'stesti', 'smula'];
// Volby: keep = místo, jehož stavy ve světě se vrátí (fáze 1: s čím se tam dá přijít); inside = místo, které se prochází
// samo (fáze 2): seeds jsou jeho výchozí stavy, odchod na pozdější místo je cíl a po odchodu na dřívější místo se
// hrdinka může vrátit s čímkoli z arrivals (obecná část) a s místní částí, jak ji nechala.
const explore = ({ keep = null, inside = null, seeds = null, arrivals = [] } = {}) => {
    taken.clear();
    const kept = [];
    const UP = '#dal';
    const lefts = new Set();
    const index = new Map();
    const nodes = [];      // { place, end, state (jen do rozvinutí), pos, key }
    const parent = [];     // [index rodiče, popis hrany, číslo sady proměnných]
    const preds = [];      // index → [odkud, druh + 8 × sada, …]
    const sets = [NONE], setIndex = new Map([['', 0]]);
    const setId = (vars) => {
        if (!vars.size) return 0;
        const k = [...vars].sort().join(' ');
        let id = setIndex.get(k);
        if (id === undefined) { id = sets.length; sets.push(vars); setIndex.set(k, id); }
        return id;
    };
    const add = (s, pos, from, label, kind, vars) => {
        const key = pos === END ? END : pos === UP ? UP : keyOf(s, pos);
        let i = index.get(key);
        const v = setId(vars);
        if (i === undefined) {
            i = nodes.length;
            index.set(key, i);
            nodes.push({ place: s.place, end: pos === END, up: pos === UP, state: s, pos, key });
            if (keep && pos === null && s.place === keep) kept.push(s);
            parent.push([from, label, v]);
            preds.push([]);
        }
        if (from >= 0 && from !== i) preds[i].push(from, KINDS.indexOf(kind) + 8 * v);
    };
    // Rozhovor se prochází na místě: ze stavu ve světě se projdou všechny uzly a volby rozhovorů a do grafu jdou jen
    // stavy, ve kterých hrdinka z rozhovoru vyjde (nebo konec hry). Hrana nese nejhorší druh po cestě (jiste < boj <
    // mozna < stesti < smula) a ze všech cest rozhovorem tu nejlepší.
    const talks = (s) => {
        const local = new Map(), exits = new Map(), queue = [];
        const push = (t, pos, level, vars, labels) => {
            if (pos === null || pos === END) {
                const key = pos === END ? END : keyOf(t, null), old = exits.get(key);
                if (!old || level < old.level) exits.set(key, { t, pos, level, vars, labels });
                return;
            }
            const key = keyOf(t, pos), old = local.get(key);
            if (old && old.level <= level) return;
            const item = { t, pos, level, vars, labels };
            local.set(key, item);
            queue.push(item);
        };
        const step = (from, [t, pos, kind, label, vars]) => {
            const level = Math.max(from.level, KINDS.indexOf(kind));
            push(t, pos, level, vars.size ? new Set([...from.vars, ...vars]) : from.vars, label === 'odejít' ? from.labels : [...from.labels, label]);
        };
        const root = { level: 0, vars: NONE, labels: [] };
        for (const next of successors(s, null)) step(root, next);
        for (let q = 0; q < queue.length; q++) {
            const item = queue[q];
            if (local.get(keyOf(item.t, item.pos)) !== item) continue;
            for (const next of successors(item.t, item.pos)) step(item, next);
        }
        return exits.values();
    };
    if (seeds) seeds.forEach((seed) => add(seed, null, -1, 'příchod', 'jiste', NONE));
    else {
        const s0 = project(start());
        arrive(s0, s0.place);
        add(s0, null, -1, 'začátek', 'jiste', NONE);
    }
    for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        if (!n.end && !n.up) for (const e of talks(n.state)) {
            const label = e.labels.join('  ');
            if (!inside || e.pos === END || e.t.place === inside) { add(e.t, e.pos, i, label, KINDS[e.level], e.vars); continue; }
            if (ORDER.indexOf(e.t.place) > ORDER.indexOf(inside)) { add(e.t, UP, i, label, KINDS[e.level], e.vars); continue; }
            // odchod na dřívější místo: vrátit se dá s čímkoli, s čím se sem dá přijít, místní část zůstává. Vlajky se
            // ve hře nemažou, takže se vrací jen s tím, co obsahuje všechny vlajky, se kterými odešla.
            const local = part(e.t, inside, true);
            local.place = n.state.place; local.side = n.state.side;
            const had = Object.keys(part(e.t, inside, false).flags);
            const lk = `${keyOf(local, null)}|${had.sort().join(' ')}`;
            if (lefts.has(lk)) continue;
            lefts.add(lk);
            for (const g of arrivals) {
                if (!had.every((f) => g.flags[f])) continue;
                const back = merge(g, local);
                back.place = g.place; back.side = g.side;
                add(back, null, i, `${label}  (a zpět)`, 'smula', e.vars);
            }
        }
        n.state = null; n.pos = null;
        if (nodes.length > LIMIT) return null;
    }
    // Odkud se dá po hranách daných druhů dojít do cíle; next[i] = sada proměnných první hrany na nejlevnější takové
    // cestě. Cena cesty je počet „možná“ hran, které stojí na něčem přineseném odjinud (weight): přednost má cesta,
    // která stojí jen na místních věcech, protože ta platí pro každý příchod a nemusí se kvůli ní nic dalšího sledovat.
    const alive = (kinds, goal, weight = null) => {
        const allowed = KINDS.map((k) => kinds.includes(k));
        const cost = sets.map((vars) => (weight && [...vars].some(weight) ? 1 : 0));
        const dist = new Int32Array(nodes.length).fill(-1), next = new Int32Array(nodes.length);
        const buckets = [[]];
        for (let i = 0; i < nodes.length; i++) if (goal(nodes[i])) { dist[i] = 0; buckets[0].push(i); }
        for (let c = 0; c < buckets.length; c++) {
            const queue = buckets[c];
            for (let q = 0; q < queue.length; q++) {
                const to = queue[q];
                if (dist[to] !== c) continue;
                const ps = preds[to];
                for (let k = 0; k < ps.length; k += 2) {
                    const from = ps[k], code = ps[k + 1];
                    if (!allowed[code & 7]) continue;
                    const d = c + cost[code >> 3];
                    if (dist[from] !== -1 && dist[from] <= d) continue;
                    dist[from] = d; next[from] = code >> 3;
                    (buckets[d] ??= []).push(from);
                }
            }
        }
        const ok = new Uint8Array(nodes.length);
        for (let i = 0; i < nodes.length; i++) ok[i] = dist[i] >= 0 ? 1 : 0;
        return { ok, next };
    };
    return { nodes, parent, alive, sets, kept, index, never: allChoices.filter((c) => !taken.has(c)) };
};

// —— Důkaz po místech ——
// Pro každé místo: z každého stavu, ve kterém tam hrdinka může být (i uprostřed rozhovoru), vede jistá cesta na
// pozdější místo nebo ke konci hry. Platí-li to pro všechna místa, ke konci se dá dojít odkudkoli (místa jdou za
// sebou, takže se cesty řetězí). Každé místo si zpřesňuje vlastní sadu sledovaných proměnných: přidávají se ty, na
// kterých stojí nejkratší „možná“ cesta ven z prvního stavu bez jisté cesty, nebo cesta do něj (je vůbec dosažitelný?).
const ORDER = ['hlavak', 'vaclavak', 'nuselak', 'staromak', 'most', 'malastrana', 'hrad'];
const rank = (place) => ORDER.indexOf(place);
const SURE = ['jiste', 'boj'];
const started = Date.now();
// volby, které se neukázaly v žádném průchodu celou hrou (i v tom nejvolnějším, kde se nesleduje nic)
let neverAll = null;
let bad = 0, total = 0;
const pathOf = (parent, i) => {
    const steps = [];
    for (let k = i; parent[k][0] >= 0; k = parent[k][0]) steps.push(parent[k][1]);
    return steps.reverse().filter((x) => x !== 'odejít');
};
// otisk: místo | strana | rozhovor | jízdenky | důvěra | vlajky | úkoly | předměty | vyčerpané volby
const describe = (n) => {
    const [place, side, pos, tickets, trust, flags, quests, items] = n.key.split('|');
    return [
        `místo ${place}${side ? ` (${side})` : ''}${pos ? `, rozhovor ${pos}` : ''}${tickets ? `, jízdenky ${tickets}${Number(tickets) >= STROP ? '+' : ''}` : ''}${trust ? `, důvěra ${trust}` : ''}`,
        `předměty ${items || '–'}; vlajky ${flags || '–'}; úkoly ${quests || '–'}`,
    ];
};
// Vstupy do slepé oblasti: slepé stavy, jejichž rodič (nejkratší cesta) slepý není. Seskupené podle volby, která tam vede.
const report = (title, graph, dead) => {
    const { nodes, parent } = graph;
    const count = dead.reduce((n, d) => n + (d ? 1 : 0), 0);
    if (!count) return;
    console.log(`  ${title}: ${count} stavů`);
    const groups = new Map();
    for (let i = 0; i < nodes.length; i++) {
        if (!dead[i]) continue;
        const [from, label] = parent[i];
        if (from >= 0 && dead[from]) continue;
        const g = groups.get(label) ?? { n: 0, first: i, len: Infinity };
        const len = pathOf(parent, i).length;
        g.n += 1;
        if (len < g.len) { g.first = i; g.len = len; }
        groups.set(label, g);
    }
    const sorted = [...groups.entries()].sort((p, q) => p[1].len - q[1].len);
    for (const [label, g] of ALL ? sorted : sorted.slice(0, PATHS)) {
        console.log(`    ▸ ${label}  (${g.n}×)`);
        describe(nodes[g.first]).forEach((line) => console.log(`      ${line}`));
        console.log(`      cesta: ${pathOf(parent, g.first).join('  ')}`);
    }
    if (sorted.length > PATHS && !ALL) console.log(`    … a dalších ${sorted.length - PATHS} vstupů (všechny: --vse)`);
};
// Sledované proměnné z minulého běhu (scripts/slepe-sledovane.json): příště se začne rovnou s nimi a zpřesňuje se jen,
// když se příběh změnil. --znovu je zahodí a hledá od nuly.
const CACHE = new URL('./slepe-sledovane.json', import.meta.url);
const fs = await import('node:fs');
const cached = !args.includes('--znovu') && fs.existsSync(CACHE) ? JSON.parse(fs.readFileSync(CACHE, 'utf8')) : {};
const ONLY = args.includes('--misto') ? args[args.indexOf('--misto') + 1] : null;
for (const place of ORDER.filter((p) => !ONLY || p === ONLY)) {
    known.clear();
    (cached[place] ?? []).forEach((v) => known.add(v));
    STEPS = stepsOf(place); STROP = STEPS.at(-1); TSTEPS = trustSteps(place);
    const goal = (n) => n.end || n.up;
    const here = (n) => !n.end && !n.up;
    let graph, sure, doubts = 0, last = null;
    for (let round = 1; ; round++) {
        // fáze 1: celá hra jen s obecnými proměnnými → s čím vším se dá na místo přijít
        const all = new Set(known);
        known.clear();
        all.forEach((v) => { if (!localTo(v, place)) known.add(v); });
        const wide = explore({ keep: place });
        known.clear();
        all.forEach((v) => known.add(v));
        if (!wide) { console.log(`${place}: stavů je víc než ${LIMIT}, prohledávání zastaveno`); process.exit(2); }
        neverAll = new Set(wide.never.filter((c) => !neverAll || neverAll.has(c)));
        // fáze 2: jen toto místo se všemi sledovanými proměnnými
        const first = part(project(start()), place, true);
        graph = explore({ inside: place, arrivals: wide.kept, seeds: wide.kept.map((g) => { const seed = merge(g, first); seed.place = g.place; seed.side = g.side; return seed; }) });
        if (!graph && last) { known.clear(); last.known.forEach((v) => known.add(v)); graph = last.graph; sure = last.sure; console.log(`  ${place}: další zpřesnění by přerostlo ${LIMIT} stavů, zůstávám u posledního`); break; }
        if (!graph) { console.log(`${place}: stavů je víc než ${LIMIT} (sledováno ${known.size} proměnných), prohledávání zastaveno`); process.exit(2); }
        const { nodes, parent, alive, sets } = graph;
        sure = alive(SURE, goal).ok;
        const maybe = alive([...SURE, 'mozna'], goal, (v) => !localTo(v, place));
        const add = new Set();
        const failing = (i) => here(nodes[i]) && !sure[i];
        for (let i = 0; i < nodes.length && !add.size; i++) if (failing(i) && maybe.ok[i]) sets[maybe.next[i]].forEach((v) => add.add(v));
        // jinak: je stav bez cesty vůbec dosažitelný? proměnné „možná“ hran na cestě do něj (tady i cestou sem ve fázi 1)
        const escape = add.size > 0;
        let witness = -1;
        const doubt = doubts < DOUBT_ROUNDS && nodes.length < DOUBT_STATES;
        for (let i = 0; i < nodes.length && !add.size && !escape && doubt; i++) if (failing(i)) {
            witness = i;
            let k = i;
            for (; parent[k][0] >= 0; k = parent[k][0]) sets[parent[k][2]].forEach((v) => add.add(v));
        }
        // cesta do příchozího stavu ve fázi 1: její „možná“ hrany stojí na proměnných, které se tu zatím nesledují
        if (!escape && add.size) doubts += 1;
        if (!escape && doubt && !add.size && witness >= 0) for (let w = 0; w < wide.nodes.length && !add.size; w++) for (let k = w; k >= 0; k = wide.parent[k][0]) wide.sets[wide.parent[k][2]].forEach((v) => { if (!known.has(v)) add.add(v); });
        if (VERBOSE && !escape && witness >= 0) { console.log(`    bez cesty: ${describe(nodes[witness]).join(' / ')}`); console.log(`    cesta: ${pathOf(parent, witness).join('  ')}`); }
        if (VERBOSE) console.log(`  ${place} kolo ${round}: příchodů ${wide.kept.length} (z ${wide.nodes.length} stavů hry), stavů místa ${nodes.length}, bez jisté cesty ${nodes.reduce((n, _, i) => n + (failing(i) ? 1 : 0), 0)}, přidávám ${[...add].join(' ') || '–'}`);
        if (!add.size) break;
        last = { graph, sure, known: new Set(known) };
        add.forEach((v) => known.add(v));
    }
    const { nodes, alive } = graph;
    const lucky = alive([...SURE, 'stesti', 'mozna'], goal).ok;
    const plain = alive(['jiste'], goal).ok;
    const inPlace = nodes.map((n) => here(n));
    const hard = nodes.map((_, i) => inPlace[i] && !lucky[i]);
    const luck = nodes.map((_, i) => inPlace[i] && lucky[i] && !sure[i]);
    const fight = nodes.reduce((n, _, i) => n + (inPlace[i] && sure[i] && !plain[i] ? 1 : 0), 0);
    const states = inPlace.reduce((n, v) => n + (v ? 1 : 0), 0);
    const wrong = hard.some(Boolean) || luck.some(Boolean);
    total += states;
    if (wrong) bad += 1;
    console.log(`${wrong ? '✗' : '✓'} ${place}: ${states} stavů${fight ? `, z toho ${fight} jen přes vyhraný boj` : ''}; sledováno ${known.size}: ${[...known].sort().join(' ') || '–'}${known.has('tickets') ? ` (do ${STROP})` : ''}`);
    cached[place] = [...known].sort();
    report('tvrdé slepé uličky (dál nevede nic)', graph, hard);
    report('jen se štěstím (dál jen přes zkoušku vlastnosti)', graph, luck);
}
if (!OFF.size) fs.writeFileSync(CACHE, `${JSON.stringify(cached, null, 1)}\n`);
console.log(`\n${bad ? `slepé uličky na ${bad} místech` : 'z každého dosažitelného stavu vede ke konci cesta bez zkoušky vlastnosti'} (${total} stavů, ${((Date.now() - started) / 1000).toFixed(1)} s)`);
// Volby, které se neukážou v žádném dosažitelném stavu.
console.log(`\nvolby, které nejdou zvolit nikdy (${neverAll?.size ?? 0}): ${[...(neverAll ?? [])].join(' ') || '–'}`);
process.exit(bad ? 1 : 0);
