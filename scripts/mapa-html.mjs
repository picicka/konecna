import fs from 'node:fs';
import path from 'node:path';

// Stránka se snímky mapy (docs/mapa.html) z docs/mapa/list.json a rozcestník dokumentace pro ladění (docs/index.html).
// Volá ji scripts/mapa.mjs na konci; samostatně: node scripts/mapa-html.mjs.
const ROOT = path.resolve(new URL('.', import.meta.url).pathname, '..');
const list = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/mapa/list.json'), 'utf8'));
const NAMES = { hlavak: 'Hlavák a Sherwood', vaclavak: 'Václavák', staromak: 'Staromák', most: 'Karlův most a Kampa', malastrana: 'Malá Strana', hrad: 'Hrad' };
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
fs.writeFileSync(path.join(ROOT, 'docs/index.html'), `<!doctype html><html lang="cs"><head><meta charset="utf-8"><title>Konečná – dokumentace pro ladění</title><style>${STYLE} li { margin: .6rem 0; font-size: 1.1rem; }</style></head><body>
<h1>Konečná. Nevystupovat. – dokumentace pro ladění</h1>
<ul>
<li><a href="mapa.html">Mapy</a>: snímky všech šesti míst (celek, zastavení s postavami, úseky)</li>
<li><a href="postavy.html">Postavy</a>: každá postava s číslem, spritem, portrétem, rolí a tím, jak má vypadat</li>
<li><a href="rozhodovaci-strom.html">Texty a rozhodovací strom</a>: úvod, dialogy všech míst s volbami a podmínkami, boje, konce a epilog</li>
</ul>
<p>Příběhová bible je v <code>docs/pribeh.md</code>, návrh hry v <code>docs/konecna.md</code>, otevřené věci v <code>docs/todo.md</code>.</p>
</body></html>
`);
console.log(`docs/mapa.html: ${list.length} snímků, docs/index.html`);
