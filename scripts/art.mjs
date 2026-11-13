// Sestavení grafiky po částech (npm run art). Cíl je list (atlas, landmarks_*, houses_<místo>_<n>, ground_<místo>_<n>)
// nebo obrázek filmečku (cs_*). Bez parametrů se sestaví jen cíle, kterým se od posledního sestavení změnil některý
// zdroj v art/; otisky zdrojů každého cíle jsou v art/out/otisky.json (necommituje se, bez něj se sestaví všechno).
//   npm run art                      jen zastaralé cíle
//   npm run art -- atlas 'houses_most_*'   vyjmenované cíle (hvězdička zastupuje cokoli, v shellu do uvozovek)
//   npm run art -- --vse             všechno znovu
//   npm run art -- --co              jen vypíše, co je zastaralé, a nic nesestaví
//   npm run art -- --oznacit         nic nesestaví a označí všechno za aktuální (po ručním zásahu do static/images)
// Na čem cíl závisí: soubor, kde je list založen, soubory jeho spritů (členové podle static/images/<list>.json,
// místo spritu podle pxl list), u listů míst vygenerovaný houses-/ground-<místo>.px.js a k tomu všechny soubory,
// jejichž pojmenované funkce a konstanty tyhle soubory používají. Soubor, který nepatří k žádnému cíli (paleta),
// se počítá ke všem.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const PXL = process.env.PXL ?? join(homedir(), '.claude/skills/pxl-pixel-art/bin/pxl.js');
const ART = 'art', OUT = 'art/out', STATIC = 'static/images', ENTRY = 'art/main.px.js', STAMPS = join(OUT, 'otisky.json');
const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith('--')));
const wanted = args.filter((a) => !a.startsWith('--'));

// Co pxl ve vstupu vidí: sprity, animace, filmečky a listy se souborem, kde vznikají.
const listing = execFileSync('node', [PXL, 'list', ENTRY], { encoding: 'utf8', maxBuffer: 1 << 26 }).split('\n')
    .map((line) => line.match(/^(\w+)\s+(\S+)\s+([^\s:]+):\d+/)).filter(Boolean).map(([, kind, name, file]) => ({ kind, name, file }));
const assetFile = new Map(listing.filter((e) => e.kind === 'sprite' || e.kind === 'anim').map((e) => [e.name, e.file]));
const targets = listing.filter((e) => e.kind === 'sheet' || e.kind === 'scene');

// Zdroje a jejich otisky; kdo používá čí pojmenované funkce a konstanty.
const files = readdirSync(ART).filter((f) => f.endsWith('.px.js'));
const source = Object.fromEntries(files.map((f) => [f, readFileSync(join(ART, f), 'utf8')]));
const digest = Object.fromEntries(files.map((f) => [f, createHash('sha1').update(source[f]).digest('hex')]));
const declared = Object.fromEntries(files.map((f) => [f, [...source[f].matchAll(/^(?:function\s+|const\s+|let\s+)([A-Za-z_$][\w$]{2,})/gm)].map((m) => m[1])]));
const uses = Object.fromEntries(files.map((f) => [f, files.filter((g) => g !== f && declared[g].some((name) => new RegExp(`\\b${name.replace(/\$/g, '\\$')}\\b`).test(source[f])))]));
const closure = (seed) => {
    const all = new Set(seed);
    for (const f of all) (uses[f] ?? []).forEach((g) => all.add(g));
    return all;
};

// Soubory, na kterých cíl přímo stojí.
const members = (name) => {
    const json = join(STATIC, `${name}.json`);
    if (!existsSync(json)) return [];
    return Object.keys(JSON.parse(readFileSync(json, 'utf8')).frames).map((frame) => assetFile.get(frame) ?? assetFile.get(frame.replace(/_\d+$/, ''))).filter(Boolean);
};
const direct = (t) => {
    const own = new Set([t.file]);
    if (t.kind === 'sheet') members(t.name).forEach((f) => own.add(f));
    const place = t.name.match(/^(houses|ground)_([a-z]+)_\d+$/);
    if (place && source[`${place[1]}-${place[2]}.px.js`]) own.add(`${place[1]}-${place[2]}.px.js`);
    return own;
};
const depsOf = () => {
    const deps = Object.fromEntries(targets.map((t) => [t.name, closure(direct(t))]));
    // soubor, ke kterému se nehlásí žádný cíl (paleta, společné pomůcky bez jmen), platí pro všechny
    const claimed = new Set(Object.values(deps).flatMap((set) => [...set]));
    const shared = files.filter((f) => !claimed.has(f) && !f.startsWith('_'));
    return Object.fromEntries(targets.map((t) => [t.name, createHash('sha1').update([...deps[t.name], ...shared].sort().map((f) => f + digest[f]).join('|')).digest('hex')]));
};
const output = (t) => join(STATIC, `${t.name}.png`);

const before = depsOf();
const stamps = existsSync(STAMPS) ? JSON.parse(readFileSync(STAMPS, 'utf8')) : null;
const stale = targets.filter((t) => !stamps || stamps[t.name] !== before[t.name] || !existsSync(output(t)));

if (flags.has('--oznacit')) {
    mkdirSync(OUT, { recursive: true });
    writeFileSync(STAMPS, JSON.stringify(before, null, 1) + '\n');
    console.log(`Označeno za aktuální: ${targets.length} cílů.`);
    process.exit(0);
}

let build;
if (flags.has('--vse')) build = targets;
else if (wanted.length) {
    const patterns = wanted.map((w) => new RegExp(`^${w.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')}$`));
    build = targets.filter((t) => patterns.some((p) => p.test(t.name)));
    const missing = wanted.filter((w, i) => !targets.some((t) => patterns[i].test(t.name)));
    if (missing.length) { console.error(`Neznámý cíl: ${missing.join(', ')}. Cíle: ${targets.map((t) => t.name).join(' ')}`); process.exit(1); }
} else build = stale;

if (!stamps && !flags.has('--vse') && !wanted.length) console.log('Chybí art/out/otisky.json, sestavuji všechno (jednou).');
if (flags.has('--co') || !build.length) {
    console.log(build.length ? `Zastaralé (${build.length} z ${targets.length}): ${build.map((t) => t.name).join(' ')}` : `Grafika je aktuální (${targets.length} cílů). Všechno znovu: npm run art -- --vse`);
    process.exit(0);
}

console.log(`Sestavuji ${build.length} z ${targets.length} cílů: ${build.map((t) => t.name).join(' ')}`);
const started = Date.now();
const whole = build.length === targets.length;
execFileSync('node', [PXL, 'build', ENTRY, ...(whole ? [] : ['--only', build.map((t) => t.name).join(',')]), '--out', OUT, '--no-preview'], { stdio: ['ignore', 'ignore', 'inherit'], maxBuffer: 1 << 26 });
mkdirSync(STATIC, { recursive: true });
build.forEach((t) => {
    if (t.kind === 'scene') copyFileSync(join(OUT, 'scenes', `${t.name}.png`), output(t));
    else ['png', 'json'].forEach((ext) => copyFileSync(join(OUT, `${t.name}.${ext}`), join(STATIC, `${t.name}.${ext}`)));
});
// otisky až po sestavení: členové listu se mohli změnit
const after = depsOf();
const next = { ...(stamps ?? {}) };
build.forEach((t) => { next[t.name] = after[t.name]; });
writeFileSync(STAMPS, JSON.stringify(next, null, 1) + '\n');
// verze do adres obrázků, jinak prohlížeč drží starý atlas
writeFileSync('art/version.json', JSON.stringify({ version: Date.now().toString(36) }) + '\n');
console.log(`Hotovo za ${((Date.now() - started) / 1000).toFixed(1)} s.`);
