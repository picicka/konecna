import { ITEMS } from './script';
// Stav jedné hry: hrdinka (životy, tři atributy, úroveň), jízdenky, inventář, úkoly, vlajky a místo. Ukládá se při příchodu
// na místo (checkpoint) do localStorage; po smrti nabídne hra návrat na poslední místo nebo začátek.
export const SAVE_KEY = 'konecna.save';
// Verze 4: výbava ve slotech (equip), zásoby (supplies) a nepovedené zkoušky (failed); starší uložení se nenačte.
export const SAVE_VERSION = 4;

// Vlastnosti hrdinky: Ruka (rvačka, páčení, nošení), Ústa (přemlouvání, smlouvání, zastrašení), Oko (všímavost,
// mířit, najít cestu, uhnout). V boji má každá svou akci (src/scenes/battle.js).
export const ATTRIBUTES = ['ruka', 'usta', 'oko'];
export const PLACES = ['hlavak', 'vaclavak', 'staromak', 'most', 'malastrana', 'hrad'];

export const createState = () => ({
    version: SAVE_VERSION,
    place: 'hlavak',
    hp: 10,
    hpMax: 10,
    level: 1,
    xp: 0,
    attributes: { ruka: 1, usta: 1, oko: 1 },
    tickets: 0,
    // Předměty jsou klíče (zbraň, jídlo, zásilka); nesený předmět je stav, grafika a pravidlo (poučení ze stromku).
    items: ['dopis'],
    // Výbava: v každém slotu (zbraň, oděv, talisman) nejvýš jedna věc z tašky, přidává k vlastnostem a životům (ITEMS).
    equip: { zbran: null, odev: null, talisman: null },
    // Zásoby (obvazy, konzervy) se počítají kusy a spotřebují se (ITEMS s use).
    supplies: {},
    // Nepovedené zkoušky vlastnosti: klíč postava.volba → hodnota vlastnosti při pokusu; znovu až s vyšší.
    failed: {},
    // Úkoly: quests[klíč] = krok; volby, které už hráčka vyčerpala, jsou v asked[postava].
    quests: { vypoved: 'nest' },
    asked: {},
    flags: {},
    visited: {},
    // Komu hrdinka věřila: body za rozhodnutí, konec vybere nejvyšší (trziste, metro, lodkari).
    trust: { trziste: 0, metro: 0, lodkari: 0 },
    // Semínko boje: boj je deterministický (Playwright jím projde), každá hra má jiné.
    seed: Math.floor(Math.random() * 1e9),
});

export const hasItem = (state, item) => state.items.includes(item) || (state.supplies?.[item] ?? 0) > 0;
export const addItem = (state, item) => { if (!hasItem(state, item)) state.items.push(item); };
export const removeItem = (state, item) => {
    state.items = state.items.filter((i) => i !== item);
    Object.entries(state.equip ?? {}).forEach(([slot, k]) => { if (k === item) state.equip[slot] = null; });
};

// Výbava: bonusy věcí ve slotech. Vlastnost a životy hrdinky jsou základ plus výbava (ITEMS[věc].bonus, .hp).
export const gear = (state) => Object.values(state.equip ?? {}).filter(Boolean).map((k) => ITEMS[k]).filter(Boolean);
export const attr = (state, a) => state.attributes[a] + gear(state).reduce((n, item) => n + (item.bonus?.[a] ?? 0), 0);
export const maxHp = (state) => state.hpMax + gear(state).reduce((n, item) => n + (item.hp ?? 0), 0);
export const weaponOf = (state) => ITEMS[state.equip?.zbran]?.weapon ?? 0;
export const equipItem = (state, key) => {
    const slot = ITEMS[key]?.slot;
    if (!slot || !state.items.includes(key)) return false;
    state.equip[slot] = state.equip[slot] === key ? null : key;
    state.hp = Math.min(state.hp, maxHp(state));
    return true;
};
export const addSupply = (state, key, n = 1) => { state.supplies[key] = Math.max(0, (state.supplies[key] ?? 0) + n); if (!state.supplies[key]) delete state.supplies[key]; };
// Spotřebovat zásobu (obvaz, konzervu): vrací, kolik životů přidala, nebo null, když není co nebo není proč.
export const useSupply = (state, key) => {
    const use = ITEMS[key]?.use;
    if (!use || !(state.supplies[key] > 0) || state.hp >= maxHp(state)) return null;
    const before = state.hp;
    state.hp = Math.min(maxHp(state), state.hp + (use.heal ?? 0));
    addSupply(state, key, -1);
    return state.hp - before;
};

// Zkušenosti: bod do atributu za quest i boj, 4–6 úrovní za celou hru (šest míst). Hranice jsou v jednom místě kvůli balancu.
export const XP_LEVELS = [0, 5, 12, 20, 30, 42, 56];
export const gainXp = (state, amount) => {
    state.xp += amount;
    let levelled = 0;
    while (state.level < XP_LEVELS.length && state.xp >= XP_LEVELS[state.level]) { state.level += 1; levelled += 1; }
    return levelled;
};

// Konec u čtečky na Hradě ze stavu, ne z poslední volby: přehraný a nabitý záznam je Řád, přehraný vybitý nebo žádný
// záznam při důvěře metra je Řád bez důkazu, jinak tržiště. Ostatní konce (trziste, lodkari) přicházejí přímo.
export const resolveEnding = (state, key) => {
    if (key !== 'hrad') return key;
    if (state.flags.prehrala) return state.flags.nabito ? 'metro' : 'metro_bez';
    return trustedFaction(state) === 'metro' ? 'metro_bez' : 'trziste';
};

// Konec podle důvěry; při shodě vyhrává tržiště (obchod je výchozí stav Prahy).
export const trustedFaction = (state) => Object.entries(state.trust).sort((p, q) => q[1] - p[1])[0][0];

export const save = (state) => {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); return true; } catch (error) { return false; }
};
export const load = () => {
    try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (!raw) return null;
        const data = JSON.parse(raw);
        return data?.version === SAVE_VERSION ? data : null;
    } catch (error) { return null; }
};
export const clearSave = () => localStorage.removeItem(SAVE_KEY);

export const snapshot = (state) => ({
    place: state.place, hp: state.hp, level: state.level, xp: state.xp, attributes: state.attributes, tickets: state.tickets,
    items: state.items, equip: state.equip, supplies: state.supplies, quests: state.quests, trust: state.trust, visited: Object.keys(state.visited),
});
