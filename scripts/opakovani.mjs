// Hlídá, aby se v textech hry neopakovala stejná nálada: počítá sledované obraty (gagy s limitem) a hledá slovní
// spojení, která se objevují ve třech a více replikách. Bere všechny texty pro hráčku ze src/script.js (repliky, popisy,
// filmečky, konce, boje, úkoly, věci); texty `else` jsou pro strom, ne pro hráčku, a nepočítají se.
// npm run opakovani            přehled, končí chybou, když je některý obrat přes limit nebo chybí pevná mezera
// npm run opakovani -- -v      ke každému nálezu vypíše všechna místa
// npm run opakovani -- --min 4 spojení až od čtyř výskytů (výchozí 3)
// Hlasy postav a pravidla, proti kterým se kontroluje: .claude/skills/hlasy/SKILL.md.
const script = await import('../src/script.js');

const args = process.argv.slice(2);
const verbose = args.includes('-v');
const min = Number(args[args.indexOf('--min') + 1]) || 3;

// Sledované obraty: [název, vzor, kolikrát nejvýš]. Když se nějaký gag začne množit, patří sem.
const WATCH = [
    ['rok (rok nepřišel, poprvé po roce…)', /\b(rok|roce|roku|rokem)\b/gi, 12],
    ['dělá, že…', /\bděl(á|ají|ám|áme), že\b/gi, 2],
    ['uražené zvíře', /\buražen/gi, 2],
    ['napotřetí', /napotřetí/gi, 3],
    ['nic osobního', /\bnic osobního\b/gi, 3],
    ['všechno je na prodej', /\bna prodej\b/gi, 5],
    ['po kusech / po kouskách', /\bpo (kusech|kouskách)\b/gi, 8],
    ['nechci to vědět', /\bnechc\S* (to )?vědět\b/gi, 2],
    ['pointa opravou (Teda…, Tedy…)', /[.…] Ted[ay] /g, 2],
    ['Zeman', /\bZeman/g, 2],
    ['někdo to podepsal', /\bpodeps/gi, 8],
    ['řekneme, že jste byla rychlá', /\bbyla rychlá\b/gi, 1],
    ['neviděli jsme / nic jsme neviděli', /\bnevid(ěli|ěla) (jsme|jste|nás)\b|\bjsme (vás )?nevid/gi, 3],
    ['proslov Admirála', /\bproslov/gi, 2],
    ['dívá se jako na (rohlík, lanýž)', /\bjako na \S+\b/gi, 2],
];

// Klíče, pod kterými nejsou texty pro hráčku (identifikátory, podmínky, účinky, texty do stromu).
const SKIP = new Set(['id', 'if', 'else', 'do', 'win', 'fail', 'next', 'node', 'entry', 'stats', 'face', 'sprite', 'image', 'item', 'slot',
    'flag', 'faction', 'special', 'loot', 'use', 'bonus', 'group', 'ending', 'check', 'members', 'chance', 'cost']);
const texts = [];
const walk = (value, where, key) => {
    if (typeof value === 'string') { if (/\s/.test(value)) texts.push({ where, text: value }); return; }
    if (typeof value === 'function' || value === null || typeof value !== 'object') return;
    if (Array.isArray(value)) { value.forEach((v) => walk(v, where, key)); return; }
    for (const [k, v] of Object.entries(value)) {
        if (SKIP.has(k)) continue;
        // u dialogu stačí vědět, kdo mluví; uzly a volby by místo jen prodlužovaly
        const deeper = where.startsWith('DIALOGS.') && where.split('.').length >= 2 ? where : `${where}.${k}`;
        walk(v, deeper, k);
    }
};
for (const [name, value] of Object.entries(script)) {
    if (name === 'LADENI' || name === 'ATTRIBUTE_ICONS') continue;
    if (name === 'FACTIONS') { walk({ ...value, list: Object.fromEntries(Object.entries(value.list).map(([k, f]) => [k, { name: f.name, want: f.want?.text, perks: (f.perks ?? []).map((p) => p[1]) }])) }, name); continue; }
    walk(value, name);
}

const plain = (s) => s.replace(/ /g, ' ');
const cut = (s, at, len) => plain(s).slice(Math.max(0, at - 30), at + len + 30).trim();
let failed = false;

console.log(`Texty pro hráčku: ${texts.length} řetězců, ${texts.reduce((n, t) => n + t.text.split(/\s+/).length, 0)} slov.\n`);
console.log('Sledované obraty (výskyty / limit):');
for (const [name, pattern, limit] of WATCH) {
    const hits = [];
    for (const t of texts) for (const m of plain(t.text).matchAll(pattern)) hits.push({ where: t.where, text: cut(t.text, m.index, m[0].length) });
    const over = hits.length > limit;
    failed ||= over;
    console.log(`  ${over ? 'PŘES' : ' ok '}  ${String(hits.length).padStart(2)} / ${String(limit).padEnd(2)}  ${name}`);
    if (over || verbose) hits.forEach((h) => console.log(`            ${h.where}: …${h.text}…`));
}

// Spojení tří až šesti slov, která jsou ve třech a více různých řetězcích. Kratší spojení schované v delším se nevypíše.
const STOP = new Set(['a', 'i', 'o', 'u', 'v', 'z', 'k', 's', 'se', 'si', 'je', 'to', 'na', 'do', 'že', 'co', 'ale', 'tak', 'jen', 'už', 'za', 'po', 'od', 've', 'ze', 'ke', 'by', 'vás', 'vám', 'mi', 'mě', 'ho', 'ji', 'tu', 'ten', 'ta', 'ty', 'jste', 'jsem', 'jsou', 'kdo', 'když', 'než', 'pro', 'jako', 'ani', 'nebo', 'má', 'mám', 'máte', 'tam', 'tady', 'pak', 'taky']);
const grams = new Map();
texts.forEach((t, index) => {
    for (const sentence of plain(t.text).toLowerCase().split(/[.!?…:;„“()]+/)) {
        const words = sentence.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
        for (let n = 3; n <= 6; n++) for (let i = 0; i + n <= words.length; i++) {
            const gram = words.slice(i, i + n);
            if (gram.filter((w) => !STOP.has(w)).length < 2) continue;
            const key = gram.join(' ');
            if (!grams.has(key)) grams.set(key, new Set());
            grams.get(key).add(index);
        }
    }
});
const repeated = [...grams].filter(([, set]) => set.size >= min).sort((p, q) => q[0].length - p[0].length);
const shown = [];
for (const [gram, set] of repeated) {
    if (shown.some(([longer, other]) => longer.includes(gram) && other.size >= set.size)) continue;
    shown.push([gram, set]);
}
shown.sort((p, q) => q[1].size - p[1].size || p[0].localeCompare(q[0], 'cs'));
console.log(`\nSpojení ve ${min} a více replikách (${shown.length}):`);
for (const [gram, set] of shown) {
    console.log(`  ${String(set.size).padStart(2)}×  ${gram}`);
    if (verbose) [...set].forEach((i) => console.log(`            ${texts[i].where}`));
}

// Pevné mezery: za jednopísmennou předložkou nebo spojkou nesmí být běžná mezera.
const loose = texts.filter((t) => /(^|[\s „(])[ksvzouaiKSVZOUAI] \S/.test(t.text));
if (loose.length) {
    failed = true;
    console.log(`\nChybí pevná mezera (${loose.length}):`);
    loose.forEach((t) => console.log(`  ${t.where}: ${t.text.slice(0, 80)}`));
}
process.exit(failed ? 1 : 0);
