// Rozhodovací strom hry jako HTML: každé místo rozhodnutí má číslo (kotvu), aby se o něm dalo mluvit v připomínkách
// („4.1.2 má být drzejší“). Texty bere přímo ze src/script.js: úvod, dialogy zastavení po místech (uzly, volby
// s podmínkami, textem pro případ, že neplatí, účinky a odpověďmi), boje a konce. Spuštění: npm run tree.
import { CUTSCENES, ENDINGS, EPILOG, TITLE, DIALOGS, ITEMS, QUESTS, BATTLES, ATTRIBUTE_NAMES } from '../src/script.js';
import { HLAVAK } from '../src/places/hlavak.js';
import { VACLAVAK } from '../src/places/vaclavak.js';
import { STAROMAK } from '../src/places/staromak.js';
import { MOST } from '../src/places/most.js';
import { MALASTRANA } from '../src/places/malastrana.js';
import { HRAD } from '../src/places/hrad.js';

const esc = (text) => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const out = [];
const h = (level, id, title) => out.push(`<h${level} id="${id}"><a class="n" href="#${id}">${id}</a> ${esc(title)}</h${level}>`);
const p = (text, cls = '') => out.push(`<p class="${cls}">${esc(text)}</p>`);
const lines = (items, cls = 'say') => out.push(`<ul class="${cls}">${[].concat(items).map((item) => `<li>${esc(item)}</li>`).join('')}</ul>`);
export const choices = (id, items) => {
    out.push('<ol class="choices">');
    items.forEach((item, i) => {
        const cid = `${id}.${i + 1}`;
        out.push(`<li id="${cid}"><a class="n" href="#${cid}">${cid}</a> <b>${esc(item.label)}</b>${item.requires ? ` <span class="req">vyžaduje ${esc(item.requires)}</span>` : ''}${item.otherwise ? ` <span class="else">když neplatí: ${esc(item.otherwise)}</span>` : ''}${item.effect ? ` <span class="fx">→ ${esc(item.effect)}</span>` : ''}${item.reply ? `<div class="reply">${esc(item.reply)}</div>` : ''}</li>`);
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
.fx{color:#b91c1c;font-size:.9em}.else{color:#6b21a8;font-size:.85em;display:block}.req{color:#1d4ed8;font-size:.85em}.reply{color:#44403c;font-style:italic;margin-top:.25rem}
p.rule{background:#fef3c7;border-left:4px solid #f59e0b;padding:.4rem .75rem}p.where{color:#57534e;font-size:.9em}
</style></head><body>`);
out.push(`<h1>${esc(TITLE.name)}. ${esc(TITLE.subtitle)} – rozhodovací strom</h1>`);
p('Každý bod má číslo. Volby jsou X.Y.Z, repliky postav jsou v šedých blocích, účinky červeně, podmínky modře. Volby, které v dané chvíli nejdou zvolit (chybí věc, úkol nezačal), se ve hře vůbec nezobrazí. Zkouška vlastnosti se ukáže, i když chybí jeden bod: o bod víc než požadavek vyjde vždy, na požadavek na 70 %, o bod méně na 35 %. Nepovedená stojí Ruka 2 životy, Oko 1 život, Ústa 1 bod důvěry skupiny postavy a znovu jde zkusit až s vyšší vlastností.', 'rule');

h(2, '1', 'Úvod (filmeček)');
CUTSCENES.intro.forEach((shot, i) => { h(4, `1.${i + 1}`, `Snímek ${shot.image}`); lines(shot.lines); });

// Podmínky a účinky lidsky.
const item = (k) => ITEMS[k]?.name ?? k;
const quest = (q, step) => `${QUESTS[q]?.title ?? q}: ${[].concat(step).join(' / ')}`;
const cond = (c) => {
    if (!c) return '';
    const p = [];
    if (c.any) p.push(`aspoň jedno z: ${c.any.map(cond).join('; ')}`);
    [].concat(c.item ?? []).forEach((i) => p.push(`v tašce ${item(i)}`));
    [].concat(c.noItem ?? []).forEach((i) => p.push(`bez ${item(i)}`));
    [].concat(c.flag ?? []).forEach((f) => p.push(`vlajka ${f}`));
    [].concat(c.noFlag ?? []).forEach((f) => p.push(`bez vlajky ${f}`));
    Object.entries(c.quest ?? {}).forEach(([q, s]) => p.push(`úkol ${quest(q, s)}`));
    Object.entries(c.questNot ?? {}).forEach(([q, s]) => p.push(`úkol není ${quest(q, s)}`));
    if (c.tickets !== undefined) p.push(`aspoň ${c.tickets} jízdenek`);
    if (c.poor !== undefined) p.push(`méně než ${c.poor} jízdenek`);
    Object.entries(c.attr ?? {}).forEach(([a, n]) => p.push(`zkouška ${ATTRIBUTE_NAMES[a]} ${n}`));
    Object.entries(c.trust ?? {}).forEach(([f, n]) => p.push(`důvěra ${f} aspoň ${n}`));
    Object.entries(c.distrust ?? {}).forEach(([f, n]) => p.push(`důvěra ${f} pod ${n}`));
    return p.join(', ');
};
const effect = (f, win) => {
    if (!f && !win) return '';
    const p = [];
    f = f ?? {};
    [].concat(f.give ?? []).forEach((i) => p.push(`+ ${item(i)}`));
    [].concat(f.take ?? []).forEach((i) => p.push(`− ${item(i)}`));
    if (f.weapon) p.push(`zbraň ${item(f.weapon)}`);
    Object.entries(f.supply ?? {}).forEach(([k, n]) => p.push(`+ ${item(k)} ×${n}`));
    if (f.hurt) p.push(`−${f.hurt} životů`);
    if (f.tickets) p.push(`${f.tickets > 0 ? '+' : ''}${f.tickets} jízdenek`);
    Object.entries(f.trust ?? {}).forEach(([k, n]) => p.push(`důvěra ${k} ${n > 0 ? '+' : ''}${n}`));
    Object.entries(f.quest ?? {}).forEach(([q, s]) => p.push(`úkol ${quest(q, s)}`));
    [].concat(f.flag ?? []).forEach((x) => p.push(`vlajka ${x}`));
    if (f.xp) p.push(`+${f.xp} zkušeností`);
    if (f.fight) p.push(`boj: ${BATTLES[f.fight].name}${win ? ` (po výhře: ${effect(win)})` : ''}`);
    if (f.travel) p.push(`přestup: ${f.travel}`);
    if (f.hpMax) p.push(`+${f.hpMax} životů navždy`);
    if (f.ending) p.push(`KONEC: ${f.ending === 'hrad' ? 'podle stavu (přehraný a nabitý záznam Řád, vybitý nebo žádný Řád bez důkazu, jinak tržiště)' : ENDINGS[f.ending].title}`);
    return p.join(', ');
};
const places = [['3', 'Hlavák', HLAVAK], ['4', 'Václavák', VACLAVAK], ['5', 'Staromák', STAROMAK], ['6', 'Karlův most a Kampa', MOST], ['7', 'Malá Strana', MALASTRANA], ['8', 'Hrad', HRAD]];
places.forEach(([num, title, def]) => {
    h(2, num, title);
    Object.keys(def.stops).filter((id) => DIALOGS[id]).forEach((id, si) => {
        const d = DIALOGS[id];
        const sid = `${num}.${si + 1}`;
        h(3, sid, `${d.name} (${id})`);
        if (d.shop) p(`Obchod (volba „obchod“, zboží s cenou; na co nejsou jízdenky, je vidět zašedlé): ${d.shop.map((w) => `${item(w.item)} za ${w.price}${w.if ? ` (když ${cond(w.if)})` : ''}`).join('; ')}.`, 'where');
        if (d.stats) p(`Karta: Ruka ${d.stats.ruka}, Ústa ${d.stats.usta}, Oko ${d.stats.oko}. ${d.about ?? ''}`, 'where');
        p(`Začíná uzlem: ${d.entry.map((e) => `${e.node}${e.if ? ` (když ${cond(e.if)})` : ''}`).join(', jinak ')}.${def.stops[id].hideIf ? ` Zmizí, když ${cond(def.stops[id].hideIf)}.` : ''}`, 'where');
        Object.entries(d.nodes).forEach(([nid, node], ni) => {
            const nnum = `${sid}.${ni + 1}`;
            h(4, nnum, `uzel ${nid}${node.do ? ` → ${effect(node.do)}` : ''}${node.next ? ` → dál ${node.next}` : ''}`);
            if (node.say?.length) lines(node.say);
            if (node.choices) choices(nnum, node.choices.map((c) => ({ label: c.label + (c.shop ? ' (otevře obchod)' : ''), requires: [cond(c.if), c.check ? `zkouška ${ATTRIBUTE_NAMES[c.check]} ${d.stats?.[c.check] ?? '?'} (vlastnost postavy)` : '', c.once ? 'jen jednou' : ''].filter(Boolean).join(', '), otherwise: c.else, effect: [effect(c.do, c.win), c.next ? `dál ${c.next}` : '', c.end ? 'konec rozhovoru' : ''].filter(Boolean).join('; '), reply: (c.reply ?? []).join(' ') })));
        });
    });
});
h(2, '9', 'Boje');
Object.entries(BATTLES).forEach(([k, b], i) => { h(3, `9.${i + 1}`, `${b.name} (${k})`); p(`Životy ${b.hp}, vůle ${b.nerve}, útok ${b.attack.join('–')}, zvláštnost ${b.special ?? 'žádná'}, akce Úst: ${b.talk}${b.loot ? `, kořist: ${effect(b.loot)}` : ''}.`, 'where'); lines([b.intro, b.win, b.yield, b.flee]); });

h(2, '2', 'Konce');
choices('2', ['trziste', 'metro', 'metro_bez', 'lodkari', 'death'].map((key) => ({ label: ENDINGS[key].title, effect: { trziste: 'prodej Fantově neteři nebo řediteli, nebo čtečka bez záznamu při důvěře tržiště', metro: 'čtečka přehraje záznam nabitý u mlynáře', metro_bez: 'čtečka přehraje vybitý záznam, nebo bez záznamu při důvěře metra', lodkari: 'loďka z Kampy na Vyšehrad (jen kdo dal Admirálovi krabičku)', death: 'prohra v boji; nabídka návratu na poslední místo' }[key], reply: [ENDINGS[key].text, ...(ENDINGS[key].shots ?? []).flatMap((x) => x.lines)].join(' ') })));
h(3, '2.6', 'Epilog po konci (snímky podle stavu)');
choices('2.6', EPILOG.map((e) => ({ label: e.line, requires: cond(e.if) + (e.ending ? `, jen konec ${e.ending}` : '') })));
out.push('</body></html>');
process.stdout.write(out.join('\n'));
