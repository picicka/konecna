// Rozhodovací strom hry jako HTML: každé místo rozhodnutí má číslo (kotvu), aby se o něm dalo mluvit v připomínkách
// („4.1.2 má být drzejší“). Texty bere přímo ze src/script.js. Zatím kostra: úvod a konce; dialogy míst se přidají,
// až vzniknou (krok 2 plánu). Spuštění: npm run tree → docs/rozhodovaci-strom.html
import { CUTSCENES, ENDINGS, TITLE } from '../src/script.js';

const esc = (text) => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const out = [];
const h = (level, id, title) => out.push(`<h${level} id="${id}"><a class="n" href="#${id}">${id}</a> ${esc(title)}</h${level}>`);
const p = (text, cls = '') => out.push(`<p class="${cls}">${esc(text)}</p>`);
const lines = (items, cls = 'say') => out.push(`<ul class="${cls}">${[].concat(items).map((item) => `<li>${esc(item)}</li>`).join('')}</ul>`);
export const choices = (id, items) => {
    out.push('<ol class="choices">');
    items.forEach((item, i) => {
        const cid = `${id}.${i + 1}`;
        out.push(`<li id="${cid}"><a class="n" href="#${cid}">${cid}</a> <b>${esc(item.label)}</b>${item.requires ? ` <span class="req">vyžaduje ${esc(item.requires)}</span>` : ''}${item.effect ? ` <span class="fx">→ ${esc(item.effect)}</span>` : ''}${item.reply ? `<div class="reply">${esc(item.reply)}</div>` : ''}</li>`);
    });
    out.push('</ol>');
};

out.push(`<!DOCTYPE html><html lang="cs"><head><meta charset="utf-8"><title>${esc(TITLE.name)} – rozhodovací strom</title>
<style>
body{font-family:ui-sans-serif,system-ui,sans-serif;max-width:900px;margin:2rem auto;padding:0 1rem;line-height:1.45;color:#1c1917}
h1{font-size:1.6rem}h2{font-size:1.25rem;margin-top:2.5rem;border-top:2px solid #d6d3d1;padding-top:1rem}h3{font-size:1.05rem;margin-top:1.6rem}h4{font-size:.95rem;margin:1rem 0 .3rem}
a.n{font-family:ui-monospace,monospace;background:#1c1917;color:#fff;border-radius:4px;padding:0 .35em;text-decoration:none;font-size:.85em;margin-right:.3em}
ul.say{background:#f5f5f4;border-left:4px solid #a8a29e;padding:.5rem 1rem .5rem 2rem;margin:.4rem 0}ul.say li{margin:.15rem 0}
ol.choices{list-style:none;padding-left:0}ol.choices>li{margin:.5rem 0;padding:.5rem .75rem;border:1px solid #d6d3d1;border-radius:6px}
.fx{color:#b91c1c;font-size:.9em}.req{color:#1d4ed8;font-size:.85em}.reply{color:#44403c;font-style:italic;margin-top:.25rem}
p.rule{background:#fef3c7;border-left:4px solid #f59e0b;padding:.4rem .75rem}p.where{color:#57534e;font-size:.9em}
</style></head><body>`);
out.push(`<h1>${esc(TITLE.name)}. ${esc(TITLE.subtitle)} – rozhodovací strom</h1>`);
p('Každý bod má číslo. Volby jsou X.Y.Z, repliky postav jsou v šedých blocích, účinky červeně, podmínky na atribut modře. Volby, které v dané chvíli nejdou zvolit (chybí věc, úkol nezačal, slabý atribut), se ve hře vůbec nezobrazí.', 'rule');

h(2, '1', 'Úvod (filmeček)');
CUTSCENES.intro.forEach((shot, i) => { h(4, `1.${i + 1}`, `Snímek ${shot.image}`); lines(shot.lines); });

h(2, '2', 'Konce');
choices('2', ['trziste', 'metro', 'lodkari', 'death'].map((key) => ({ label: ENDINGS[key].title, effect: key === 'death' ? 'prohra v boji; nabídka návratu na poslední místo' : `nejvyšší důvěra: ${key}`, reply: ENDINGS[key].text })));
out.push('</body></html>');
process.stdout.write(out.join('\n'));
