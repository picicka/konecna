import fs from 'node:fs';
import path from 'node:path';

// Stránka se snímky mapy (docs/mapa.html) z docs/mapa/list.json a rozcestník dokumentace pro ladění (docs/index.html).
// Volá ji scripts/mapa.mjs na konci; samostatně: node scripts/mapa-html.mjs.
const ROOT = path.resolve(new URL('.', import.meta.url).pathname, '..');
const list = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/mapa/list.json'), 'utf8'));
const NAMES = { hlavak: 'Hlavák a Sherwood', vaclavak: 'Václavák', nuselak: 'Nuselák', staromak: 'Staromák', most: 'Karlův most a Kampa', malastrana: 'Malá Strana', hrad: 'Hrad' };
const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const STYLE = `body { background: #0b0f0c; color: #cfd8c4; font: 16px/1.45 system-ui, sans-serif; max-width: 1340px; margin: 2rem auto; padding: 0 1rem; }
h1, h2 { color: #e8b04a; } h2 { border-bottom: 1px solid #2a3a2c; padding-bottom: .3rem; margin-top: 2.5rem; } a { color: #e8b04a; }
figure { margin: 1rem 0 2rem; } img { max-width: 100%; image-rendering: pixelated; border: 1px solid #2a3a2c; }
figcaption { color: #8a9a86; } figcaption b { color: #e8b04a; margin-right: .4rem; } nav a { margin-right: 1rem; }`;
const places = [...new Set(list.map((x) => x.place))];
const body = places.map((p) => `<h2 id="${p}">${esc(NAMES[p] ?? p)}</h2>\n${list.filter((x) => x.place === p).map((x) => `<figure id="${x.key}"><a href="mapa/${x.key}.png"><img src="mapa/${x.key}.png" alt="" loading="lazy"></a><figcaption><b><a href="#${x.key}">${x.key}</a></b>${esc(x.caption)}</figcaption></figure>`).join('\n')}`).join('\n');
fs.writeFileSync(path.join(ROOT, 'docs/mapa.html'), `<!doctype html><html lang="cs"><head><meta charset="utf-8"><title>Konečná – mapy</title><style>${STYLE}</style></head><body>
<h1>Konečná. Nevystupovat. – mapy</h1>
<p><a href="index.html">← rozcestník</a> · Snímky každého místa: celé místo z výšky (M0), zastavení s postavami (Z) a úseky mapy (M). Připomínky ke kódu snímku („VZ3 dům vlevo“). Vygenerováno <code>npm run mapa</code>.</p>
<nav>${places.map((p) => `<a href="#${p}">${esc(NAMES[p] ?? p)}</a>`).join('')}</nav>
${body}
</body></html>
`);
// Rychlé skoky do hry (src/debug.js): odkazy na každé místo lokálně (konecna.test) i na GitHub Pages, pár míst
// u zajímavých zastavení a přepínače adresy.
const HOSTS = [['konecna.test', 'http://konecna.test/'], ['GitHub Pages', 'https://picicka.github.io/konecna/']];
const SPOTS = [
    ['Hlavák, nástupiště u výpravčího', 'hlavak', 49, 4],
    ['Václavák, molo u Kuřačky', 'vaclavak', 19, 12],
    ['Nuselák, lanař u zlomu', 'nuselak', 42, 18],
    ['Nuselák, jižní konec u soupravy', 'nuselak', 51, 19],
];
const link = (base, q) => `<a href="${base}?${q.replace(/&/g, "&amp;")}">${esc(base.replace(/^https?:\/\//, '').replace(/\/$/, ''))}</a>`;
const jumps = Object.keys(NAMES).map((p) => `<tr><td>${esc(NAMES[p])}</td>${HOSTS.map(([, base]) => `<td>${link(base, `misto=${p}`)}</td>`).join('')}<td>${link(HOSTS[0][1], `misto=${p}&buh&jizdenky=50`)}</td></tr>`).join('\n');
const spots = SPOTS.map(([label, p, a, b]) => `<li>${esc(label)}: ${HOSTS.map(([, base]) => link(base, `misto=${p}&a=${a}&b=${b}`)).join(' · ')}</li>`).join('\n');
fs.writeFileSync(path.join(ROOT, 'docs/index.html'), `<!doctype html><html lang="cs"><head><meta charset="utf-8"><title>Konečná – dokumentace pro ladění</title><style>${STYLE} li { margin: .6rem 0; font-size: 1.1rem; }
table { border-collapse: collapse; } td, th { border: 1px solid #2a3a2c; padding: .35rem .7rem; text-align: left; } th { color: #e8b04a; } code { color: #e8b04a; }</style></head><body>
<h1>Konečná. Nevystupovat. – dokumentace pro ladění</h1>
<ul>
<li><a href="mapa.html">Mapy</a>: snímky všech sedmi míst (celek, zastavení s postavami, úseky)</li>
<li><a href="postavy.html">Postavy</a>: každá postava s číslem, spritem, portrétem, rolí a tím, jak má vypadat</li>
<li><a href="rozhodovaci-strom.html">Texty a rozhodovací strom</a>: úvod, dialogy všech míst s volbami a podmínkami, boje, konce a epilog</li>
</ul>
<h2 id="skoky">Rychlé skoky do hry</h2>
<p>Odkaz spustí hru rovnou na místě, bez titulku, úvodu a tvorby postavy. Stav hry (vlajky, předměty, úkoly, důvěra)
je takový, jaký má průchod <code>npm test</code> při příchodu na místo, takže postavy mluví jako při hraní. Zapisuje ho průchod
do <code>src/skoky.json</code>; po změně příběhu stačí <code>npm test</code> a <code>npm run build</code>.</p>
<table><tr><th>Místo</th>${HOSTS.map(([name]) => `<th>${esc(name)}</th>`).join('')}<th>Nesmrtelná, 50 jízdenek</th></tr>
${jumps}
</table>
<p>U zastavení:</p>
<ul>
${spots}
</ul>
<h3>Parametry adresy</h3>
<table>
<tr><td><code>?misto=hrad</code></td><td>místo: ${Object.keys(NAMES).map((p) => `<code>${p}</code>`).join(', ')}</td></tr>
<tr><td><code>&amp;a=43&amp;b=19</code></td><td>dlaždice (souřadnice jako v mapách a v <code>src/places/&lt;místo&gt;.js</code>), jinak dlaždice příchodu</td></tr>
<tr><td><code>&amp;jizdenky=99</code></td><td>přidá jízdenky</td></tr>
<tr><td><code>&amp;buh</code></td><td>v boji neubude poslední život, zkoušky vlastností vždy vyjdou</td></tr>
<tr><td><code>?ladeni</code> / <code>?ladeni=0</code></td><td>zapne / vypne panel skoků na klávese <b>F2</b> (pamatuje se v prohlížeči; se skokem z adresy a v <code>npm run dev</code> je zapnutý sám). Číslo 1–7 nebo klepnutí skočí na místo, Esc zavře.</td></tr>
</table>
<p>Příběhová bible je v <code>docs/pribeh.md</code>, návrh hry v <code>docs/konecna.md</code>, otevřené věci v <code>docs/todo.md</code>.</p>
</body></html>
`);
console.log(`docs/mapa.html: ${list.length} snímků, docs/index.html`);
