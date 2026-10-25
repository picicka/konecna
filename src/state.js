// Stav jedné hry: hrdinka (životy, tři atributy, úroveň), jízdenky, inventář, úkoly, vlajky a místo. Ukládá se při příchodu
// na místo (checkpoint) do localStorage; po smrti nabídne hra návrat na poslední místo nebo začátek.
export const SAVE_KEY = 'konecna.save';
export const SAVE_VERSION = 1;

export const ATTRIBUTES = ['sila', 'huba', 'postreh'];
export const PLACES = ['hlavak', 'vaclavak', 'staromak', 'most', 'malastrana', 'hrad'];

export const createState = () => ({
    version: SAVE_VERSION,
    place: 'hlavak',
    hp: 10,
    hpMax: 10,
    level: 1,
    xp: 0,
    attributes: { sila: 1, huba: 1, postreh: 1 },
    tickets: 0,
    // Předměty jsou klíče (zbraň, jídlo, zásilka); nesený předmět je stav, grafika a pravidlo (poučení ze stromku).
    items: [],
    weapon: null,
    // Úkoly: quests[klíč] = krok; volby, které už hráčka vyčerpala, jsou v asked[postava].
    quests: {},
    asked: {},
    flags: {},
    visited: {},
    // Komu hrdinka věřila: body za rozhodnutí, konec vybere nejvyšší (trziste, metro, lodkari).
    trust: { trziste: 0, metro: 0, lodkari: 0 },
});

export const hasItem = (state, item) => state.items.includes(item);
export const addItem = (state, item) => { if (!hasItem(state, item)) state.items.push(item); };
export const removeItem = (state, item) => { state.items = state.items.filter((i) => i !== item); };

// Volba v dialogu může vyžadovat atribut: podmínka a text pro případ, že neplatí, patří k volbě (poučení z Václaváku).
export const meets = (state, requirement = {}) => ATTRIBUTES.every((attribute) => (requirement[attribute] ?? 0) <= state.attributes[attribute]);

// Zkušenosti: bod do atributu za quest i boj, 2–3 úrovně za hru. Hranice jsou v jednom místě kvůli balancu.
export const XP_LEVELS = [0, 5, 12, 20];
export const gainXp = (state, amount) => {
    state.xp += amount;
    let levelled = 0;
    while (state.level < XP_LEVELS.length && state.xp >= XP_LEVELS[state.level]) { state.level += 1; levelled += 1; }
    return levelled;
};

// Konec podle důvěry; při shodě vyhrává tržiště (obchod je výchozí stav Prahy po pádu).
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
    items: state.items, weapon: state.weapon, quests: state.quests, trust: state.trust, visited: Object.keys(state.visited),
});
