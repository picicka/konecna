# Konečná. Nevystupovat.

Postapokalyptické pixel-artové RPG po Praze. Pošťačka nese zásilku z Hlaváku na Hrad městem, kde Vltava teče jinudy,
Staré Město je zatopené po první patro, ve Fantově budově je tržiště a metrem jezdí jediná ručně řízená souprava.
Krátká hra zhruba na hodinu: dojdi, promluv, rozhodni, občas se bij.

Hra běží v prohlížeči (Phaser 3, Vite), je to čistě statický web bez serveru a databáze.

## Co ve hře je

- Šest míst podle skutečné Prahy: Hlavák a Sherwood, Václavák, Staromák, Karlův most a Kampa, Malá Strana, Hrad.
  Ulice, domy, stromy a lampy stojí tam, kde ve skutečnosti (OpenStreetMap), výšky domů jsou z laserového skenování
  a barvy střech z ortofota ČÚZK. Ikonické stavby jsou ručně kreslené.
- Vlastnosti Ruka, Ústa a Oko: každá překážka jde vyřešit silou, řečí, všímavostí, nebo věcí či úkolem. Zkoušky
  vlastností ukazují šanci, nepovedená něco stojí.
- Skupiny Tržiště, Metro, Loďkaři a Kancelář kanálu: důvěra otevírá a zavírá volby a rozhoduje o konci.
- Tahový boj: Udeřit, slovo podle protivníka, Uhnout, Taška; útěk vyjde vždy.
- Výbava ve slotech, zásoby a obchod za jízdenky.
- Tři konce s epilogem podle toho, co hráčka po cestě změnila.

## Ovládání

| Klávesa | Co dělá |
| --- | --- |
| šipky, WASD nebo klik myší | chůze (kurzor ukáže, kam se dojde, s kým jde mluvit a kam ne) |
| Enter, mezerník | další replika, potvrzení volby |
| 1–9, šipky nahoru a dolů | výběr volby v rozhovoru |
| Q | deník (úkoly) |
| T nebo I | taška a výbava |
| M | mapa |
| Esc | zavřít deník |

Postup se ukládá do prohlížeče (`localStorage`) při každém příchodu na místo.

## Spuštění

Potřeba je Node.js 20 nebo novější.

```sh
npm install
npm run dev        # vývojový server na http://localhost:5173
npm run build      # sestavení do public/
npm test           # sestavení a průchod celou hrou v Playwrightu (snímky v tests/shots)
npm test -- --misto most   # jen jedno místo (asi půl minuty); --pomalu hraje skutečnou rychlostí
```

Sestavená grafika je v repu (`static/images`), takže na hraní ani úpravy kódu není potřeba nic dalšího.

### Skoky pro ladění

`?misto=hrad` v adrese spustí hru rovnou na místě se stavem, jaký tam má průchod `npm test` (zapisuje ho do
`src/skoky.json`). Dál jde přidat `&a=43&b=19` (dlaždice), `&jizdenky=99` a `&buh` (nesmrtelnost, zkoušky vždy
vyjdou). Klávesa L otevře panel skoků na místa (zapíná se `?ladeni`, v `npm run dev` je zapnutý sám). Odkazy na
všechna místa jsou v `docs/index.html`.

## Další příkazy

| Příkaz | Co dělá |
| --- | --- |
| `npm run art` | sestaví z `art/*.px.js` přes pxl jen grafiku, které se změnil zdroj; `-- --vse` všechno znovu (kolem 6 minut), `-- <list>` jen vyjmenované |
| `npm run osm` | z exportů OSM v `data/osm` vytvoří mřížky míst, domy a zem, pak spustí `art` |
| `npm run vysky` | stáhne laserové skenování ČÚZK a spočítá výšky domů (Python, `.venv`) |
| `npm run teren` | z laserového skenování spočítá výšku terénu na Hradě (svah pod ostrohem) |
| `npm run strechy` | z ortofota ČÚZK určí krytinu střech |
| `npm run slepe` | dokáže úplným prohledáním stavů, že příběh nemá slepé uličky (asi půl minuty) |
| `npm run tree` | rozhodovací strom dialogů do `docs/rozhodovaci-strom.html` |
| `npm run mapa` | snímky map po úsecích do `docs/mapa` |
| `npm run postavy` | přehled postav do `docs/postavy.html` |

## Struktura

- `src/`: hra. Scény v `src/scenes`, všechny texty a dialogy v `src/script.js`, výklad dialogů v `src/story.js`,
  stav a ukládání v `src/state.js`, ručně určené prvky míst v `src/places`.
- `art/`: pixel art jako kód (pxl), výstup jde do `static/images`.
- `scripts/`: převod dat OSM a ČÚZK, generátory dokumentace.
- `data/`: exporty OSM, mřížky míst, výšky a střechy.
- `docs/`: návrh hry (`konecna.md`), příběh a postavy (`pribeh.md`), rozhodovací strom, mapy a přehled postav.
  Rozcestník je `docs/index.html`.
- `tests/run.mjs`: Playwright průchod hlavní linkou až ke konci.

Pravidla pro práci na projektu jsou v `CLAUDE.md`.

## Zdroje dat

- Mapa: © přispěvatelé [OpenStreetMap](https://www.openstreetmap.org/copyright), licence ODbL.
- Výšky domů a střechy: © [ČÚZK](https://cuzk.gov.cz/), digitální model povrchu DMP 1G a ortofoto, licence CC BY 4.0.

Obojí uvádí i hra na titulní obrazovce a pod minimapou.
