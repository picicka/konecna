import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { DIALOGS } from '../src/script.js';
import { ROSTER } from './postavy-seznam.mjs';

// Mapa postav: každá postava hry s číslem (připomínky „postava 12 má mít delší kabát“), spritem ve hře zvětšeným 4×
// a ve skutečné velikosti, portrétem z dialogu, místem, frakcí, popisem z docs/pribeh.md a tím, jak má vypadat.
// Sprity bere z načteného atlasu hry (po npm run build), takže ukazuje přesně to, co je ve hře.
// Výstup docs/postavy.html (obrázky vložené jako data URL, otevře se bez serveru). Spuštění: npm run postavy.
const ROOT = path.resolve(new URL('.', import.meta.url).pathname, '..');
const PORT = 4175;
const BASE = process.env.BASE ?? `http://localhost:${PORT}/`;
let server = null;
if (!process.env.BASE) {
    server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { cwd: ROOT, stdio: 'ignore' });
    const started = Date.now();
    while (Date.now() - started < 15000) { try { await fetch(BASE); break; } catch (error) { await new Promise((r) => setTimeout(r, 200)); } }
}
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.goto(BASE);
await page.waitForFunction(() => window.konecna?.scene.isActive('title'), null, { timeout: 30000 });

// Výřez snímku atlasu na plátno, zvětšený bez vyhlazení. Animovaná postava: první snímek (klíč_0).
const keys = [...new Set(ROSTER.flatMap((c) => [c.sprite, c.face]).filter(Boolean))];
const images = await page.evaluate(({ keys }) => {
    const tex = window.konecna.textures;
    const cut = (key, scale) => {
        let frame = null;
        for (const atlas of tex.getTextureKeys()) {
            const t = tex.get(atlas);
            if (t.has(`${key}_0`)) { frame = t.get(`${key}_0`); break; }
            if (t.has(key)) { frame = t.get(key); break; }
        }
        if (!frame) return null;
        const c = document.createElement('canvas');
        c.width = frame.cutWidth * scale; c.height = frame.cutHeight * scale;
        const g = c.getContext('2d');
        g.imageSmoothingEnabled = false;
        g.drawImage(frame.source.image, frame.cutX, frame.cutY, frame.cutWidth, frame.cutHeight, 0, 0, c.width, c.height);
        return c.toDataURL('image/png');
    };
    return Object.fromEntries(keys.map((k) => [k, { big: cut(k, 4), real: cut(k, 1), face: cut(k, 3) }]));
}, { keys });
await browser.close();
server?.kill();

const esc = (text) => String(text ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const PLACE_NAMES = { hlavak: 'Hlavák a Sherwood', vaclavak: 'Václavák', nuselak: 'Nuselák', staromak: 'Staromák', most: 'Karlův most a Kampa', malastrana: 'Malá Strana', hrad: 'Hrad', vsude: 'Celou hru' };
const out = [];
let n = 0;
let place = null;
ROSTER.forEach((c) => {
    if (c.place !== place) { place = c.place; out.push(`<h2>${esc(PLACE_NAMES[place] ?? place)}</h2>`); }
    n += 1;
    const id = `postava-${n}`;
    const img = images[c.sprite];
    const face = c.face ? images[c.face] : null;
    const name = c.name ?? DIALOGS[c.dialog]?.name ?? c.sprite;
    out.push(`<section id="${id}" class="card">
  <div class="pics">${img?.big ? `<img class="big" src="${img.big}" alt=""><img class="real" src="${img.real}" alt="" title="ve hře 1 : 1">` : '<div class="missing">sprite chybí</div>'}${face?.face ? `<img class="face" src="${face.face}" alt="" title="portrét v dialogu">` : ''}</div>
  <div class="text">
    <h3><a href="#${id}">${n}</a> ${esc(name)}</h3>
    <p class="meta">${esc([c.faction, c.role].filter(Boolean).join(' · '))} · sprite <code>${esc(c.sprite)}</code>${c.face ? `, portrét <code>${esc(c.face)}</code>` : ''}${c.dialog ? `, dialog <code>${esc(c.dialog)}</code>` : ''}</p>
    <p>${esc(c.about)}</p>
    <p class="look"><b>Má vypadat:</b> ${esc(c.look)}</p>
    <p class="now"><b>Teď:</b> ${esc(c.now)}</p>
  </div>
</section>`);
});

const html = `<!doctype html>
<html lang="cs"><head><meta charset="utf-8"><title>Konečná – mapa postav</title>
<style>
body { background: #0b0f0c; color: #cfd8c4; font: 16px/1.45 system-ui, sans-serif; max-width: 1100px; margin: 2rem auto; padding: 0 1rem; }
h1 { color: #e8b04a; font-size: 1.6rem; } h2 { color: #e8b04a; border-bottom: 1px solid #2a3a2c; padding-bottom: .3rem; margin-top: 2.5rem; }
.card { display: flex; gap: 1.5rem; padding: 1rem 0; border-bottom: 1px solid #1d2a1f; }
.pics { display: flex; align-items: flex-end; gap: .8rem; min-width: 330px; background: #4a4438; padding: .8rem; border-radius: 4px; }
.pics img { image-rendering: pixelated; } .big { max-height: 280px; } .face { border: 2px solid #2a3a2c; }
.missing { color: #b05a3a; width: 96px; text-align: center; }
h3 { margin: 0 0 .3rem; color: #f0e6c8; } h3 a { color: #e8b04a; text-decoration: none; margin-right: .3rem; }
.meta { color: #8a9a86; font-size: .9rem; margin: 0 0 .5rem; } code { color: #a8c49a; }
.look b { color: #e8b04a; } .now b { color: #b07a5a; } p { margin: .35rem 0; }
</style></head><body>
<h1>Konečná. Nevystupovat. – mapa postav</h1>
<p>Každá postava má číslo; připomínky k vzhledu dávejte k číslu („postava 12: delší kabát, bez čepice“). Sprite je zvětšený 4×, vedle je ve skutečné velikosti, jak stojí ve hře, a portrét z dialogu. Popis role je z <code>docs/pribeh.md</code>, „Má vypadat“ je záměr, „Teď“ je stav kresby. Vygenerováno skriptem <code>scripts/postavy.mjs</code> (<code>npm run postavy</code>), seznam je v <code>scripts/postavy-seznam.mjs</code>.</p>
${out.join('\n')}
</body></html>
`;
fs.writeFileSync(path.join(ROOT, 'docs/postavy.html'), html);
console.log(`docs/postavy.html: ${n} postav, bez spritu ${ROSTER.filter((c) => !images[c.sprite]?.big).map((c) => c.sprite).join(', ') || 'žádná'}`);
