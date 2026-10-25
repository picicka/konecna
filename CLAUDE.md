# Konečná. Nevystupovat.

Postapokalyptické pixel‑artové RPG po Praze v Phaseru 3, samostatný statický web (Vite, GitHub Pages). Návrh, rozhodnutí
a poučení z předchůdce (Václavák po pádu v repu `~/Code/benefity`) jsou v `docs/konecna.md`; ten dokument je zdroj pravdy
o tom, co hra je a co ne. Texty pro čtenáře píšeme česky s českou typografií (skill `typografie`).

## Jak se s projektem pracuje

- `npm run dev` dev server, `npm run build` build do `dist/`, `npm test` = build + Playwright průchod (`tests/run.mjs`,
  snímky v `tests/shots`). Průchod je první kontrola po každé změně, ne ruční klikání.
- `npm run art` sestaví grafiku přes pxl (`art/*.px.js` → `art/out` → `public/images/atlas.png|json`, `cs_*.png`) a zapíše
  `art/version.json`; BootScene ji dává do adres jako `?v=`, jinak prohlížeč drží starý atlas. Výstup v `public/images`
  se commituje (GitHub Pages pxl nemá). Nový sprite = přidat do `sheet()` v `art/main.px.js`. Do scén se neskládají emoji
  ani Graphics tvary místo spritů.
- `npm run mapa` snímky mapy po úsecích do `docs/mapa`, `npm run tree` rozhodovací strom do `docs/rozhodovaci-strom.html`.
  Dokumentace pro ladění je součást hry: připomínky se dávají čísly („dům 11“, „volba 4.1.2“).
- Skripty mapa a test si samy spustí `vite preview`; nad dev serverem `BASE=http://localhost:5173/`.

## Pravidla kódu

- Plátno 1280 × 720 bodů zobrazené 1:1 (`src/ui.js` WIDTH/HEIGHT), pixelArt bez vyhlazení, Phaser FIT bez vlastního
  centrování (centruje CSS v `index.html`, jedno místo pro layout). Písma Press Start 2P (nadpisy) a VT323 (text),
  resolution 1, celé velikosti; text přes `head()`/`body()` z `ui.js`.
- Isometrie 2:1, dlaždice 128 × 64: konstanty jen v `src/iso.js` (TW/TH) a `art/tiles.px.js`. Kdyby se po ověření
  přešlo na 96 × 48, mění se jen tam. Souřadnice a podél (doprava nahoru), b napříč (doprava dolů).
- Hloubka vždy přes `ISO.depthOf(a, b, lift)`, žádné výjimky po jednom. Domy před ulicí zprůhlední, když zakryjí hrdinku.
- Každý interaktivní objekt má přístupovou dlaždici (`approach`) a při startu se kontroluje, že je průchozí.
- Všechny texty pro hráčku jsou v `src/script.js` s literálními pevnými mezerami (U+00A0); do scén se texty nepíšou.
  Hrdinka je žena: rod ve všech replikách o ní. Kontrola textů proti mapě a rodu je pravidelný krok.
- Každá volba v dialogu má podmínku (stav, předmět, atribut) a text pro případ, že neplatí; nedostupné volby se skrývají,
  ne šednou. Vyčerpané volby se pamatují v `state.asked`. Deník (Q) jde otevřít i uprostřed rozhovoru.
- Po zavření dialogu `this.input.keyboard.resetKeys()`, jinak Enter z poslední repliky hned znovu spustí rozhovor.
- Phaser drží instanci scény mezi restarty: všechno herní resetovat v `init`/`create`.
- Konce se počítají z toho, co se skutečně stalo (stav), ne z poslední události. Stav předmětu a stav postavy jsou dvě věci.
- Stav hry je `src/state.js`; checkpoint při příchodu na místo (`save`), smrt je konec s epilogem a nabídkou návratu.
- Zvuk jen syntetizovaný (`src/sound.js`), kompresor na výstupu, odemyká se prvním gestem. Hudba později MIDI přes
  `spessasynth_lib`, rozhraní `music(on)` zůstává.
- pxl: sprite oříznutý plátnem se nezvětší sám (nastavit w/h), kupole kreslit ořezem, ne mazáním, `glow()` jen na vrchní
  úrovni sprite/scene. Šum jen tam, kde je materiál zrnitý (asfalt, suť), ne na omítce.

## Co nebrat z Václaváku

Vazbu na Laravel, evidenci pokusů, PF, logo a barvy Ecomailu jako povinný prvek, Vánoce.
