# Konečná. Nevystupovat.

Postapokalyptické pixel‑artové RPG po Praze v Phaseru 3, samostatný statický web (Vite, GitHub Pages). Návrh, rozhodnutí
a poučení z předchůdce (Václavák po pádu v repu `~/Code/benefity`) jsou v `docs/konecna.md`; ten dokument je zdroj pravdy
o tom, co hra je a co ne. Texty pro čtenáře píšeme česky s českou typografií (skill `typografie`).

## Jak se s projektem pracuje

- `npm run dev` dev server, `npm run build` build do `public/` (Herd ho servíruje jako konecna.test, GitHub Pages ho
  nasazuje), `npm test` = build + Playwright průchod (`tests/run.mjs`, snímky v `tests/shots`). Průchod je první kontrola
  po každé změně, ne ruční klikání. Zdroj je ve `src/` včetně `index.html`, `public/` je jen výstup a necommituje se.
- `npm run art` sestaví grafiku přes pxl (`art/*.px.js` → `art/out` → `static/images/atlas.png|json`, `houses0–3`,
  `cs_*.png`) a zapíše `art/version.json`; BootScene ji dává do adres jako `?v=`, jinak prohlížeč drží starý atlas.
  Výstup ve `static/images` se commituje (GitHub Pages pxl nemá). Nový sprite = přidat do `sheet()` v `art/main.px.js`. Do scén se neskládají emoji
  ani Graphics tvary místo spritů.
- `npm run mapa` snímky mapy po úsecích do `docs/mapa` a stránku `docs/mapa.html`, `npm run tree` rozhodovací strom do `docs/rozhodovaci-strom.html`.
  Rozcestník všeho je `docs/index.html` (zapisuje ho `scripts/mapa-html.mjs`).
  `npm run postavy` mapa postav do `docs/postavy.html` (sprity z atlasu hry, seznam a popisy v `scripts/postavy-seznam.mjs`).
  Dokumentace pro ladění je součást hry: připomínky se dávají čísly („dům 11“, „volba 4.1.2“).
- Skripty mapa a test si samy spustí `vite preview`; nad dev serverem `BASE=http://localhost:5173/`.

## Místa a mapy

- `node scripts/osm-stahnout.mjs <místo>` stáhne z Overpass export OSM ořezaný na mapu do `data/osm/<místo>.json` (v repu).
  `npm run osm` z něj udělá `data/<místo>.json` (mřížka, domy, rekvizity na skutečných místech, díly země),
  `art/houses-<místo>.px.js` a `art/ground-<místo>.px.js` a hned spustí `npm run art`. Nastavení místa (střed, natočení
  osy, rozměr, landmarky, kolejiště) je v `PLACES` ve `scripts/places.mjs`.
- Zem se nekreslí z dlaždic, ale z vektorů OSM (`art/ground.px.js`): silnice ve skutečné šířce, chodníky, cestičky
  v parku, přechody, tramvajové a železniční koleje, po dílech 1016 × 1016 do listů `ground_<místo>_<n>`. Mřížka
  dlaždic zůstává pro průchodnost a minimapu. Stromy, lampy, lavičky a koše stojí podle OSM, park se dosází stromy,
  vraky tramvají T3 (`art/tram.px.js`) stojí na zastávkách natočené podle koleje.
- `node scripts/snimek.mjs <výstup.png> a b [zoom] …` udělá snímek libovolného místa mapy (po `npm run build`).
- Výšky domů jsou z laserového skenování ČÚZK (DMP 1G, CC BY 4.0, postup převzatý z izomapy): `npm run vysky` stáhne
  listy do `build/dmp` (necommituje se) a `scripts/vysky.py` zapíše `data/vysky-<místo>.json` (výšky budov a mřížka
  střech po 2 m, commituje se). `osm.mjs` z ní bere patra a ploché střechy; bez souboru jede podle pater z OSM.
- Krytina střech je z ortofota ČÚZK (WMS ORTOFOTO, CC BY 4.0): `npm run strechy` stáhne snímek výřezu do `build/orto`
  a `scripts/strechy.py` zapíše `data/strechy-<místo>.json` (barva a krytina každé budovy: tasky, hneda, med, tmava,
  plech, svetla). `osm.mjs` ji dává `house()` jako `cover`. Každý nový zdroj dat se uvádí v `TITLE.credits`
  a `HUD.mapCredit` (`src/script.js`).
- Ručně určené prvky místa (díly landmarku, oblouky hal, zastavení s postavami a přístupem, pravidla rozsevu stromů,
  lamp a laviček) jsou v `src/places/<místo>.js`; repliky zastavení v `STOPS` v `src/script.js`. Příběh, postavy
  a zastavení všech míst jsou v `docs/pribeh.md`.
- Místa: Hlavák, Václavák, Staromák, Karlův most a Kampa (`most`), Malá Strana, Hrad. Volby v `PLACES`: `water`/`pier`
  (Václavák), `flood` (Staromák: lávky `m` podél domů do vzdálenosti `boardwalk`, jinak voda, `islands`, `piers`), `dry`
  (most: koryto Vltavy je bahno `h`, neprůchozí; toky v `dry.wet` zůstávají vodou), `bridges` (most ve skutečné šířce),
  `skip` (landmark místo domu), `frame` (z domů zůstane jen obrys vyjmenovaných ulic a náměstí, zbytek jsou
  zbořené vnitrobloky; místo má být čitelné jako náměstí, ne jako moře střech; na Staromáku `flood.frame`). Budovy bere `osm.mjs` i z multipolygonů (paláce, Hrad) včetně vnitřních nádvoří
  a průchodů domem (`tunnel=building_passage`).
- Ikonické stavby každého místa jsou ručně kreslené landmarky podle fotek z Wikimedia Commons (jen předloha,
  neobkreslovat): `art/lm-*.px.js`, `art/katedrala.px.js`, listy `landmarks_*`. Brána, kterou se prochází (mostecké
  věže), má v `src/places/<místo>.js` `pass: <řádek b>` a v `PLACES` `clear` pro průjezd.
- Velké kusy grafiky mají vlastní listy: `landmarks` (Fantova budova `art/fanta.px.js`, oblouky), `houses0–3`.

## Příběh

- Dialogy jsou data v `DIALOGS` (`src/script.js`): uzly s replikami a volbami, vykládá je `src/story.js`. Volba má
  podmínku `if` (stav, předmět, úkol, jízdenky, atribut), text `else` pro případ, že neplatí (jde do stromu), účinky `do`
  (předměty, jízdenky, důvěra, úkoly, vlajky, zkušenosti, boj, přestup) a odpověď `reply`. Úkoly a předměty pro deník
  jsou v `QUESTS` a `ITEMS`, boje v `BATTLES` (`src/scenes/battle.js`, deterministický přes `state.seed`).
- Vlastnosti hrdinky jsou Ruka, Ústa a Oko (`ruka`, `usta`, `oko`), všude s obrázkem (`ico_ruka/usta/oko`
  v `art/chars.px.js`): na liště, v deníku, při nové úrovni a na volbě, která na vlastnosti stojí (ikona a požadovaná
  úroveň vpravo na tlačítku). Každá překážka má mít cestu přes Ruku, Ústa i Oko, nebo přes věc či úkol.
- Zkoušky vlastností (`checkOf`/`chanceOf` v `src/story.js`, texty `CHECK`): volba s `if.attr`, nebo `check: 'usta'`
  proti vlastnosti postavy z její karty (`stats` u DIALOGS), se ukáže už s bodem pod požadavkem. O bod víc vyjde vždy,
  na požadavek na 70 %, o bod méně na 35 % (na tlačítku je šance). Hod je ze `state.seed`. Nepovedená zkouška stojí
  (Ruka 2 životy, Oko 1, Ústa bod důvěry skupiny postavy, nebo `fail` u volby) a znovu jde až s vyšší vlastností (`state.failed`).
- Výbava a zásoby (`ITEMS`): sloty zbraň, oděv, talisman (`state.equip`), věc dává `weapon`, `hp`, `bonus`. Nová věc
  se sama nasadí do prázdného slotu. Vlastnosti a životy se všude počítají i s výbavou (`attr`, `maxHp` v `src/state.js`).
  Zásoby (`use.heal`, `state.supplies`, účinek `supply`) se spotřebují v tašce (T) i v boji. Obchod je okno se
  zbožím: `shop` u DIALOGS (věc, cena, podmínka, odpověď) a volba s `shop: true` (trafikantka, Fanta, potápěčka, Pilař,
  mlynář). Zboží ukazuje, co dělá, a cenu; na co nejsou jízdenky, je zašedlé. Kořist je `loot` v `BATTLES`. Přestup doléčí jen půlku životů.
- Karta postavy: při rozhovoru je vpravo celá postava (sprite zastavení zvětšený celým násobkem), skupina s důvěrou,
  její Ruka, Ústa a Oko proti vašim (co vlastnost umí a jak by dopadla zkouška, `CARD`) a `about`. Každá vlastnost
  postavy má být k něčemu: u lidí, kterým se dá postavit, jsou zkoušky Rukou, Ústy i Okem. Mapa (minimapa) se schová
  a ukáže tlačítkem Mapa nebo klávesou M.
- Tvorba postavy (`CREATE`, `HudScene.createHero`): na začátku hry, než se dá chodit, si hráčka vybere, kým pošťačka
  byla, a ta vlastnost dostane +1 (vlajka `created`).
- Deník je jedna obrazovka (Q úkoly, T taška): vlevo velká pošťačka s výbavou ve slotech, životy, úrovní a vlastnostmi,
  vpravo záložky Taška, Úkoly a Kdo vám věří (šipky doleva a doprava).
- Nepovedená zkouška ani utracené jízdenky nesmí zavřít cestu dál: překážka na hlavní lince má i cestu bez zkoušky
  a bez jízdenek (Kuřačka sveze po společné cigaretě, nebo si převoz hrdinka odpracuje).
- Hrdinka (sprite kouká doleva, doprava se zrcadlí) jde k divákovi `hero_go` (hlava v předklonu), od diváka zády
  `hero_up` a stojí zády `hero_back` (`art/lide.px.js`, póza `lean` a `back`).
- Nepřítel má stát v cestě: psi ze Sherwoodu lezou do tunelu a strojvedoucí bez `psi_ok` nevyjede.
- Boj (`src/scenes/battle.js`): nepřítel má životy a vůli. Ruka (Udeřit) bere životy, Ústa (`talk` v `BATTLES`) vůli,
  Oko (Uhnout) uhne a vrátí ránu, Taška použije obvaz nebo jídlo; útěk vyjde vždy za jednu ránu. Tlačítka ukazují šanci a rozsah. Poražení i usmíření
  nemizí z mapy, dialog má uzel pro „po boji“ (`psi_ok`, `kanci_ok`, `vymahaci_pryc`, `ochranka_pryc`).
- Skupiny (`FACTIONS` v `src/script.js`): Tržiště, Metro, Loďkaři a Kancelář kanálu. Dialog s `faction` ukazuje skupinu
  u jména. Deník („Kdo vám věří“) ukáže skupinu, až hrdinka někoho z ní potká, jmenuje jen potkané lidi
  a co skupina chce, až to hrdinka zjistí. Důvěra mění hru: volby s podmínkou `trust` / `distrust` (výhody `perks`
  v `FACTIONS`, při změně důvěry se ohlásí, co se otevřelo nebo zavřelo). Jedna postava stojí jen na jednom
  místě (výjimkou je Kuřačka, která hrdinku veze, takže je u obou konců cesty).
- Nová úroveň (zkušenosti z `XP_LEVELS`) dá bod do vlastnosti podle volby hráčky. Přestup (`travel`) pustí filmeček
  `metro_<místo>`, uloží checkpoint (životy doléčí o polovinu) a postaví svět místa znovu.
- Zastavení může zmizet (`hideIf` v `src/places/<místo>.js`, vybledne), nebo po vyřešení změnit podobu (`after`: `if`,
  `npc`, `approach`, `props`). Nový sprite s `from` (`'npc'` nebo index rekvizity) dojde ze starého místa po dlaždicích,
  s `jump` seskočí obloukem (psi odběhnou k Robinovu ohni, nutrie seskočí z reproduktoru). Přechod se přehraje hned
  po účinku volby (`WorldScene.refreshStops`), takže je vidět, co se stalo. Brány (`gates`) jsou dlaždice zavřené,
  dokud neplatí podmínka.
- Přestup hledá filmeček `cesta_<odkud>_<kam>` (loďka, pěšky), jinak `metro_<kam>`; příchod je `arrivals[odkud]` místa.
- Co se stalo, nikdo neví: v textech žádný „pád“, jen opisy („ten den“, „od té doby“, „předtím“, 14:37) a pojmenování skupin (Metro „mimořádná událost“, Loďkaři „velká voda“, Tržiště „krach“). Příčina se skládá z útržků, viz `docs/pribeh.md`.
- Konec spouští účinek `ending` (`trziste`, `lodkari`, nebo `hrad` = spočítat ze stavu v `resolveEnding`, `src/state.js`).
  `EndingScene` pustí snímky konce (`ENDINGS[konec].shots`) a epilog `EPILOG` (snímek za každé místo, kde hráčka
  něco změnila), pak závěrečnou obrazovku. Průchod `npm test` hraje celou hru až ke konci Řád.
- Po každé změně dialogů `npm run tree` a průchod `npm test`, který hraje hlavní linku cestou bez boje a jeden boj.
- Grafika místa (díly země a domy) se nahrává až při vstupu na místo (`WorldScene.preload`), grafika ostatních míst se
  uvolní. Listy domů `houses_<místo>_<n>` mají kolem 24 spritů, počet je v `data/<místo>.json` (`houseSheets`).

## Stanice metra (platí pro všechny)

- Značení podle pražského metra (Jiří Rathouský): logo je šipka dolů, jejíž horní část tvoří M, bílá kontura na černém
  čtverci; vedle čtverec linky v její barvě s černým písmenem (A zelená, B žlutá, C červená). Tvar loga je v konstantách
  `METRO_ARROW`/`METRO_HOLE` (`art/fanta.px.js`) a `MA`/`MH` (`art/props.px.js`, sloupek `metro_totem`), podle
  „Metro Prague logo.svg“ na Wikimedia Commons. Typografie metra je Rathouského Metron.
- Výstup z metra je tam, kde je ve skutečnosti (na Hlaváku dveřmi odbavovací haly), ne vymyšlené schodiště do parku.

## Tagy na domech

- Seznam je v `docs/todo.md` (sekce Tagy na domech). `npm run osm` ho načte a přiřadí tagy domům s fasádou do ulice
  nebo bokem nárožního domu (deterministicky podle polohy), ale jen tam, kde parter nezakrývá dům přes ulici ani koruna
  stromu (`tagSpot` v `scripts/osm.mjs` počítá zakrytí po svislici obrazovky) a kde se tag vejde do tří řádků.
  `sprayText()` v `art/buildings.px.js` ho nastříká jako sprej písmem 5 × 7 (`FONT57`) v rovině stěny s tmavým obrysem
  do všech stran. Čitelnost má přednost: kurzíva, poskakování, rozprašek a stékance jsou jen lehké. Nápis sedí nízko
  v pásu `tagV`–`tagTop`, když se nevejde, smí do prvního patra, až pak menší písmo.

## Vizuální styl (Fallout 1 a 2, ne vlastní představa)

- Referencí jsou snímky Falloutu 1 a 2 (Hub, Junktown, Klamath, New Reno, Necropolis). Tmavé, vybledlé, teplé hnědoolivové
  tóny; syté jsou jen oheň, neony, cedule a sprej. Paleta v `art/palette.px.js` je už stažená, nad tím ladí kameru světa
  barevná matice a vinětace ve `WorldScene.create`.
- Zem: asfalt skoro černý, silnice a chodníky zasypané pískem a hlínou, praskliny s plevelem, suchá tráva a holá hlína
  místo trávníků, suť, sudy, pneumatiky, plechové boudy.
- Domy: špína s příčinou (odstřik od země, šmouhy pod římsou a parapety, rezavé stékance), plevel na římsách, zatlučená
  a vybitá okna, graffiti na betonu. Domy vrhají stín k +b (`WorldScene.drawShadows`).
- Nic čistého a pastelového; když nová grafika vypadá hezky a uklizeně, je špatně.

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
