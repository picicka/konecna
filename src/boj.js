// Pravidla tahového boje bez Phaseru: počítá z nich BattleScene (src/scenes/battle.js) i simulátor scripts/boje.mjs,
// takže to, co se ladí v číslech, je přesně to, co se hraje. Texty jsou v BATTLES a BATTLE (src/script.js).
//
// Nepřítel má stejné tři vlastnosti jako hrdinka (BATTLES[klíč].stats, u lidí je ukazuje i karta postavy) a v boji
// dělají totéž co u ní:
// - Ruka: jak moc bolí jeho rána (foeDamage) a jak často chystá těžkou ránu;
// - Ústa: jak těžko se dá rozmluvit nebo zastrašit (šance akce Úst) a jak zřídka zaváhá;
// - Oko: jak dobře trefuje a jak špatně se trefuje on (šance úderu a uhnutí jdou z rozdílu Oka obou stran).
// Životy (hp) a vůle (nerve) jsou výdrž; smečka (pack) útočí v běžném tahu dvakrát slabší ranou.
//
// Nepřítel napřed ukáže, co v tahu udělá (intent), a hráčka podle toho volí:
// - 'utok'  běžný útok;
// - 'rana'  těžká rána (jedna, silnější a přesnější): vyplatí se Uhnout, kryt ji aspoň sníží na polovinu;
// - 'vaha'  neútočí: Ústa zaberou jistě a o bod víc, úder se trefí snáz, nebo je čas na Tašku.
// Akce hrdinky: Udeřit (Ruka + zbraň bere životy), Ústa (berou vůli), Uhnout (Oko: uhnutý útok vrací ránu, neuhnutý
// bolí polovinu), Taška (obvaz nebo jídlo místo tahu), Utéct (vždy, ale nepřítel ještě jednou zaútočí).
// Obtížnost (DIFFICULTY ve state.js) násobí výdrž nepřítele a na těžkou stojí útěk dvě rány.
// Náhoda je ze semínka hry, klíče boje a čísla tahu: stejná rozhodnutí dají stejný výsledek (průchod Playwrightem).
import { BATTLES, ITEMS } from './script.js';
import { attr, maxHp, weaponOf, useSupply, difficultyOf } from './state.js';

const mulberry = (seed) => () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const hashKey = (s) => [...s].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 7);
const clamp = (p, lo, hi) => Math.max(lo, Math.min(hi, p));
const half = (n) => Math.ceil(n / 2);

// Čísla pravidel na jednom místě (ladí se podle npm run boje).
export const RULES = {
    hit: { base: 0.7, perOko: 0.08, waver: 0.15, luck: 0.1, min: 0.2, max: 0.95 },
    talk: { base: 0.55, perUsta: 0.1, min: 0.15, max: 0.95, waver: 1 },
    dodge: { base: 0.45, perOko: 0.1, min: 0.15, max: 0.9 },
    foe: { base: 0.65, perOko: 0.05, heavy: 0.15, min: 0.35, max: 0.9 },
    // šance záměru v dalším tahu: těžká rána roste s Rukou, zaváhání klesá s Ústy a roste, když vůle spadne na polovinu
    heavy: { base: 0.1, perRuka: 0.05 },
    waver: { base: 0.3, perUsta: 0.06, min: 0.05, shaken: 0.15 },
};

// Zranění od nepřítele podle jeho Ruky: běžná rána, slabší rány smečky a těžká rána.
export const foeDamage = (def, intent) => {
    const r = def.stats.ruka;
    if (intent === 'rana') return [Math.ceil(half(r) * 1.5), Math.ceil(half(r) * 1.5) + 1];
    return def.pack ? [1, Math.max(1, half(r))] : [half(r), half(r) + 1];
};

// Záměr nepřítele pro tah `turn` (první tah je vždy běžný útok, dvě těžké rány po sobě nejdou).
const intentFor = (f, turn) => {
    if (turn <= 1) return 'utok';
    const { ruka, usta } = f.def.stats;
    const x = mulberry((f.state.seed ?? 1) ^ hashKey(f.key) ^ Math.imul(turn, 0x9e3779b1) ^ 0x51ed270b)();
    const heavy = f.intent === 'rana' ? 0 : RULES.heavy.base + RULES.heavy.perRuka * ruka;
    const waver = Math.max(RULES.waver.min, RULES.waver.base - RULES.waver.perUsta * usta) + (f.nerve <= f.maxNerve / 2 ? RULES.waver.shaken : 0);
    return x < heavy ? 'rana' : x < heavy + waver ? 'vaha' : 'utok';
};

export const newFight = (state, key, options = {}) => {
    // výdrž nepřítele podle obtížnosti (DIFFICULTY.foe); maxHp a maxNerve jsou plné stavy pro ukazatele
    const def = BATTLES[key];
    const tough = difficultyOf(state).foe;
    const f = { state, key, def, hp: Math.round(def.hp * tough), nerve: Math.round(def.nerve * tough), turn: 0, over: null, god: Boolean(options.god) };
    f.maxHp = f.hp; f.maxNerve = f.nerve;
    f.intent = intentFor(f, 1);
    return f;
};

// Šance a rozsahy pro tento tah (tlačítka i výpočet tahu).
export const odds = (f) => {
    const a = { ruka: attr(f.state, 'ruka'), usta: attr(f.state, 'usta'), oko: attr(f.state, 'oko') };
    const s = f.def.stats;
    const weapon = weaponOf(f.state);
    const waver = f.intent === 'vaha';
    const R = RULES;
    return {
        hit: clamp(R.hit.base + R.hit.perOko * (a.oko - s.oko) + (waver ? R.hit.waver : 0) + (f.state.flags?.stesti ? R.hit.luck : 0), R.hit.min, R.hit.max),
        dmg: [a.ruka + weapon, a.ruka + weapon + 1],
        talkP: waver ? R.talk.waver : clamp(R.talk.base + R.talk.perUsta * (a.usta - s.usta), R.talk.min, R.talk.max),
        talk: [a.usta + (waver ? 1 : 0), a.usta + 1 + (waver ? 1 : 0)],
        dodge: clamp(R.dodge.base + R.dodge.perOko * (a.oko - s.oko), R.dodge.min, R.dodge.max),
        foe: clamp(R.foe.base + R.foe.perOko * (s.oko - a.oko) + (f.intent === 'rana' ? R.foe.heavy : 0), R.foe.min, R.foe.max),
        foeDmg: foeDamage(f.def, f.intent),
        attacks: waver ? 0 : f.intent === 'rana' ? 1 : f.def.pack ? 2 : 1,
    };
};

// Zásoba pro Tašku: nejmenší, která doplní chybějící životy, jinak největší.
export const supplyFor = (state) => {
    const missing = maxHp(state) - state.hp;
    const have = Object.entries(state.supplies ?? {}).filter(([k, n]) => n > 0 && ITEMS[k]?.use?.heal).map(([k]) => k)
        .sort((p, q) => ITEMS[p].use.heal - ITEMS[q].use.heal);
    return have.find((k) => ITEMS[k].use.heal >= missing) ?? have.at(-1) ?? null;
};

// Jeden tah: akce hrdinky, pak nepřítel podle ohlášeného záměru. Vrací události v pořadí, jak se staly (scéna z nich
// dělá text, otřes a zvuk); f.over je pak 'win', 'flee', 'dead', nebo null. Taška bez zásoby vrátí null a tah se nepočítá.
export const step = (f, action) => {
    if (f.over) return [];
    if (action === 'bag' && (!supplyFor(f.state) || f.state.hp >= maxHp(f.state))) return null;
    f.turn += 1;
    const rand = mulberry((f.state.seed ?? 1) ^ hashKey(f.key) ^ Math.imul(f.turn, 2654435761));
    const o = odds(f);
    const roll = ([lo, hi]) => lo + Math.floor(rand() * (hi - lo + 1));
    const ev = [];
    const strike = (type) => { const n = Math.max(1, roll(o.dmg)); f.hp = Math.max(0, f.hp - n); ev.push({ type, n }); };
    const end = (over, type) => { f.over = over; ev.push({ type }); return ev; };
    let guarding = false;
    const fleeing = action === 'flee';
    if (action === 'attack') {
        if (rand() < o.hit) strike('hit'); else ev.push({ type: 'miss' });
    } else if (action === 'talk') {
        if (rand() < o.talkP) { const n = roll(o.talk); f.nerve = Math.max(0, f.nerve - n); ev.push({ type: 'talk', n }); } else ev.push({ type: 'deaf' });
    } else if (action === 'defend') {
        guarding = true;
        ev.push({ type: 'guard' });
    } else if (action === 'bag') {
        const item = supplyFor(f.state);
        ev.push({ type: 'bag', item, n: useSupply(f.state, item) });
    } else if (fleeing) ev.push({ type: 'fleeing' });
    if (f.hp <= 0) return end('win', 'win');
    if (f.nerve <= 0) return end('win', 'yield');
    // nepřítel: při útěku běžné útoky bez krytu (jeden, na těžkou obtížnost dva), jinak podle záměru
    const attacks = fleeing ? difficultyOf(f.state).flee : o.attacks;
    const range = fleeing ? foeDamage(f.def, 'utok') : o.foeDmg;
    if (!attacks) ev.push({ type: 'waver' });
    for (let i = 0; i < attacks; i++) {
        if (guarding && rand() < o.dodge) { strike('counter'); if (f.hp <= 0) break; continue; }
        if (rand() < o.foe) {
            const n = guarding ? half(roll(range)) : roll(range);
            f.state.hp = Math.max(f.god ? 1 : 0, f.state.hp - n);
            ev.push({ type: 'foeHit', n, second: i === 1, heavy: f.intent === 'rana' && !fleeing, blocked: guarding });
        } else if (i === 0) ev.push({ type: 'foeMiss' });
        if (f.state.hp <= 0) break;
    }
    if (f.state.hp <= 0) return end('dead', 'dead');
    if (f.hp <= 0) return end('win', 'win');
    if (fleeing) return end('flee', 'flee');
    f.intent = intentFor(f, f.turn + 1);
    return ev;
};
