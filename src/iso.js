// Isometrie 2:1 s dlaždicí 128 × 64 bodů (čtyřnásobek Václaváku). Rozměr dlaždice je jediná konstanta, všechno ostatní
// se z ní odvozuje; kdyby se po ověření prvních dvou dnů přešlo na 96 × 48, mění se jen tady a v art/tiles.px.js.
// Souřadnice: a = podél (na obrazovce doprava nahoru), b = napříč (doprava dolů), jako na Václaváku.
export const TW = 128;
export const TH = 64;

export const toScreen = (a, b) => ({ x: (a + b) * (TW / 2), y: (b - a) * (TH / 2) });
export const toGrid = (x, y) => {
    const a = (x / (TW / 2) - y / (TH / 2)) / 2;
    const b = (x / (TW / 2) + y / (TH / 2)) / 2;
    return { a: Math.round(a), b: Math.round(b) };
};
export const key = (a, b) => `${a},${b}`;
export const adjacent = (p, q) => Math.abs(p.a - q.a) <= 1 && Math.abs(p.b - q.b) <= 1;

const NEIGHBOURS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]];

// Nejkratší cesta do osmi směrů po mřížce dané mapy (inside říká, co je mapa, blocked co je neprůchozí).
// Vrací kroky bez startu, prázdné pole = nedostupné.
export const findPath = (from, to, { inside, blocked }) => {
    if (from.a === to.a && from.b === to.b) return [];
    const walkable = (a, b) => inside(a, b) && !blocked.has(key(a, b));
    if (!walkable(to.a, to.b)) return [];
    const previous = new Map([[key(from.a, from.b), null]]);
    const queue = [from];
    while (queue.length) {
        const current = queue.shift();
        if (current.a === to.a && current.b === to.b) break;
        for (const [da, db] of NEIGHBOURS) {
            const a = current.a + da;
            const b = current.b + db;
            const k = key(a, b);
            if (!walkable(a, b) || previous.has(k)) continue;
            previous.set(k, current);
            queue.push({ a, b });
        }
    }
    if (!previous.has(key(to.a, to.b))) return [];
    const path = [];
    let step = to;
    while (step && !(step.a === from.a && step.b === from.b)) {
        path.unshift(step);
        step = previous.get(key(step.a, step.b));
    }
    return path;
};

// Deterministický výběr varianty podle polohy (stejná mapa vypadá vždy stejně).
export const hash = (a, b, salt = 0) => {
    let h = (a * 73856093) ^ (b * 19349663) ^ (salt * 83492791);
    h = (h ^ (h >>> 13)) * 1274126177;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
export const pick = (variants, a, b, salt = 0) => variants[Math.floor(hash(a, b, salt) * variants.length)];

// Řazení podle hloubky: jednotné pravidlo od začátku (na Václaváku byly výjimky po jednom nejčastější zdroj chyb).
// Hloubka objektu je y jeho kotvy (spodní roh půdorysu) plus případný posun; vše na jedné dlaždici má stejný základ.
export const depthOf = (a, b, lift = 0) => toScreen(a, b).y + TH / 2 + lift;

// Hloubka kvádru (dům) s půdorysem a0..a0+w−1 × b0..b0+dpt−1: minimum z hloubek předního rohu levé stěny (a0, b0)
// a předního rohu fasády (a1, b1). Pak je všechno před oběma viditelnými stěnami vykreslené před domem a všechno za
// zadními stěnami za ním; dlaždice vedle domu (stejná řada, +a) jsou dvojznačné a řeší je průhlednost domu nad hrdinkou.
export const boxDepth = (a0, b0, w, dpt) => Math.min(depthOf(a0, b0), depthOf(a0 + w - 1, b0 + dpt - 1)) - 1;

// Kde stojí postava nebo rekvizita na dlaždici: kousek pod středem kosočtverce (počátek spritu dole uprostřed).
export const FOOT = 10;
export const foot = (a, b) => { const p = toScreen(a, b); return { x: p.x, y: p.y + FOOT }; };
