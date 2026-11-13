# Konečná. Nevystupovat.

Postapokalyptické pixel‑artové RPG po Praze v Phaseru 3, samostatný statický web (Vite, GitHub Pages). Návrh, rozhodnutí
a poučení z předchůdce (Václavák po pádu v repu `~/Code/benefity`) jsou v `docs/konecna.md`; ten dokument je zdroj pravdy
o tom, co hra je a co ne. Texty pro čtenáře píšeme česky s českou typografií (skill `typografie`).

## Jak se s projektem pracuje

- `npm run dev` dev server, `npm run build` build do `public/` (Herd ho servíruje jako konecna.test, GitHub Pages ho
  nasazuje), `npm test` = build + Playwright průchod (`tests/run.mjs`, snímky v `tests/shots`). Průchod se nepouští
  sám po každé změně: po úpravě se nabídne (jedno místo, nebo celý) a pustí se až na pokyn. Celý trvá asi 4 minuty,
  `npm test -- --misto <místo>` zahraje jen jedno místo (asi půl minuty, začíná skokem se stavem ze `src/skoky.json`
  a končí příchodem na další místo). Čas hry v něm běží zrychleně (`?rychle` v adrese, `src/debug.js`), `--pomalu` hraje
  skutečnou rychlostí. Drobnou změnu stačí ověřit cíleným snímkem (`scripts/snimek.mjs`). Zdroj je ve `src/` včetně `index.html`, `public/` je jen výstup a necommituje se.
- `npm run art` (`scripts/art.mjs`) sestaví přes pxl jen listy a obrázky filmečků, kterým se změnil zdroj v `art/`
  (`art/*.px.js` → `art/out` → `static/images`: `atlas`, `landmarks_*`, `houses_<místo>_<n>`, `ground_<místo>_<n>`,
  `cs_*.png`); otisky zdrojů drží `art/out/otisky.json`. Vyjmenované cíle: `npm run art -- atlas 'houses_most_*'`,
  co je zastaralé: `-- --co`, všechno znovu (asi 6 minut) jen na pokyn: `-- --vse`. Po sestavení zapíše
  `art/version.json`; BootScene ji dává do adres jako `?v=`, jinak prohlížeč drží starý atlas.
  Výstup ve `static/images` se commituje (GitHub Pages pxl nemá). Nový sprite = přidat do `sheet()` v `art/main.px.js`. Do scén se neskládají emoji
  ani Graphics tvary místo spritů.
- `npm run mapa` snímky mapy po úsecích do `docs/mapa` a stránku `docs/mapa.html`, `npm run tree` rozhodovací strom do `docs/rozhodovaci-strom.html`.
  Rozcestník všeho je `docs/index.html` (zapisuje ho `scripts/mapa-html.mjs`).
  `npm run postavy` mapa postav do `docs/postavy.html` (sprity z atlasu hry, seznam a popisy v `scripts/postavy-seznam.mjs`).
  Dokumentace pro ladění je součást hry: připomínky se dávají čísly („dům 11“, „volba 4.1.2“).
- Skripty mapa a test si samy spustí `vite preview`; nad dev serverem `BASE=http://localhost:5173/`.
- Skoky pro ladění (`src/debug.js` přepínače, `src/skok.js` skok): `?misto=<místo>` (a `&a=&b=`, `&jizdenky=`, `&buh`) spustí hru rovnou na místě se
  stavem z průchodu; průchod ho při příchodu na každé místo zapisuje do `src/skoky.json` (po změně příběhu `npm test`
  a `npm run build`). L otevře panel skoků (`?ladeni` / `?ladeni=0`, v dev zapnutý sám). Odkazy jsou v `docs/index.html`.

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
  plech, svetla). `osm.mjs` ji dává `house()` jako `cover`. Každý nový zdroj dat se uvádí v okně O hře (`ABOUT` v `src/script.js`, tlačítko i na titulní obrazovce a na liště).
- Ručně určené prvky místa (díly landmarku, oblouky hal, zastavení s postavami a přístupem, pravidla rozsevu stromů,
  lamp a laviček) jsou v `src/places/<místo>.js`; repliky zastavení v `STOPS` v `src/script.js`. Příběh, postavy
  a zastavení všech míst jsou v `docs/pribeh.md`.
- Místa: Hlavák, Václavák, Nuselák (`nuselak`), Staromák, Karlův most a Kampa (`most`), Malá Strana, Hrad. Volby v `PLACES`: `water`/`pier`
  (Václavák), `flood` (Staromák: lávky `m` podél domů do vzdálenosti `boardwalk`, jinak voda, `islands`, `piers`), `dry`
  (most: koryto Vltavy je bahno `h`, neprůchozí; toky v `dry.wet` zůstávají vodou), `bridges` (most ve skutečné šířce),
  `skip` (landmark místo domu), `frame` (z domů zůstane jen obrys vyjmenovaných ulic a náměstí, zbytek jsou
  zbořené vnitrobloky; místo má být čitelné jako náměstí, ne jako moře střech; na Staromáku `flood.frame`). Budovy bere `osm.mjs` i z multipolygonů (paláce, Hrad) včetně vnitřních nádvoří
  a průchodů domem (`tunnel=building_passage`).
- Ikonické stavby každého místa jsou ručně kreslené landmarky podle fotek z Wikimedia Commons (jen předloha,
  neobkreslovat): `art/lm-*.px.js`, `art/katedrala.px.js`, listy `landmarks_*`. Brána, kterou se prochází (mostecké
  věže), má v `src/places/<místo>.js` `pass: <řádek b>` a v `PLACES` `clear` pro průjezd.
- Karlův most (`bridge` v `src/places/most.js`, `WorldScene.buildBridge`, `art/most-oblouky.px.js`, list `landmarks_mostovka`): mostovka je rovný pás b 32–33 (`deck` v `PLACES.most.bridges`), koryto je jen namalované a hloubku (asi 13 m) dělají stěny visící od hrany dolů. Přední líc se skládá z dílů po dlaždicích (pilíř s ledolamem a prázdným podstavcem sochy, výseky oblouků po 3 nebo 4 dlaždicích, nad Kampou jen zábradlí), pilíře jsou podle obrysu mostu v OSM (ledolamy po 30 m). Nábřežní zdi se staví samy všude, kde břeh spadá do koryta k divákovi (+b, −a). Lampy z OSM se posadí na zábradlí, na Kampu se z mostu sejde jen po schodech (`stairs`).
- Svah pod Hradem (`slope` v `PLACES.hrad`): `scripts/teren.py hrad` (`npm run teren`) spočítá z laseru ČÚZK (body terénu) výšku země po dlaždicích do `data/teren-hrad.json`; `osm.mjs` udělá z dlaždic pod `below` m n. m. suť `k` (neprůchozí), cesty v `keep` a obdélníky `terraces` zůstanou, ostrůvky, kam se ze startu nedojde, se zasypou. `levels` jsou pásy výšky po `step` m. `WorldScene.buildSlope` (`art/hrad-svah.px.js`, list `landmarks_svah`) pověsí z hrany k divákovi (+b, −a) opěrnou zeď nad skálou, uvnitř svahu terasy, kde terén klesne o pás, na odvrácené hrany nízkou zídku a po suti rozhází balvany a kvádry.
- Nuselák (`src/places/nuselak.js`, `WorldScene.buildNusle`, `art/nuselak-most.px.js`, list `landmarks_nusle_most`; landmarky Palác kultury, hotel Forum a Muzeum Policie v `art/lm-nusle.px.js`, list `landmarks_nusle`): údolí je jezero (`slope.lake` v `PLACES.nuselak`: pod `level` m voda, domy hlouběji než `sink` pod hladinou zmizí), `landings` jsou mola k loďce, mostovka `bridges.deck` se zlomem `gap`. K divákovi visí betonová trouba a pilíře až k hladině, ze zlomu trčí souprava metra C. Účinek `rope: 'jih' | 'sever'` u volby převede hrdinku po laně přes zlom s animací (`WorldScene.ropeCross`, sprite `hero_lano`). Postavy, lachtani, racci a kotě jsou v `art/nusle-postavy.px.js`. Stanice Vyšehrad (`nusle.station`) je pod silnicí za jižním koncem mostu: silnice je o patro výš než terén u mola, od její hrany visí prosklené čelo haly (díly `ns_st_*`), k molu se schází po schodech a dírou ve vozovce (`lm_vysehrad`, plochý sprite) je vidět kolej. Rekvizita zastavení s `under: true` leží pod postavou (loďka, ve které převozník stojí).
- Kuriozity v prázdných plochách (`oddities` v `src/places/<místo>.js`, `WorldScene.placeOddities`, `art/kuriozity.px.js`, list `landmarks_kuriozity`): rozbité pražské věci a zvířata (kouřící mlok z Války s mloky, Stalinova hlava, ručička metronomu z Letné, Golem, Černého miminko, kůň z Lucerny, Kafkova hlava, šlapadlo labuť, vana s kaprem). Skupina má znaky mřížky `on` (volitelně `minB`) a seznam věcí; místo vybírá hash (stejné při každém hraní), celé okolí 3 × 3 musí být stejná plocha, rozestup 6 dlaždic, od zastavení a startu 4. Obří věci jsou zvětšené dvakrát (`ODDITY_SCALE`). Klepnutí na věc s hláškami (`ODDITY_LINES` a `ODDITY_GROUPS` v `src/script.js`, u věcí od Davida Černého nadávky na autora) ukáže bublinu, každé další klepnutí další hlášku.
- Velké kusy grafiky mají vlastní listy: `landmarks` (Fantova budova `art/fanta.px.js`, oblouky), `houses0–3`.

## Příběh

- Dialogy jsou data v `DIALOGS` (`src/script.js`): uzly s replikami a volbami, vykládá je `src/story.js`. Volba má
  podmínku `if` (stav, předmět, úkol, jízdenky, atribut), text `else` pro případ, že neplatí (jde do stromu), účinky `do`
  (předměty, jízdenky, důvěra, úkoly, vlajky, zkušenosti, boj, přestup) a odpověď `reply`. Úkoly a předměty pro deník
  jsou v `QUESTS` a `ITEMS`, boje v `BATTLES` (`src/scenes/battle.js`, deterministický přes `state.seed`).
- Životy se ve hře jmenují Srdce (čtvrtá část těla vedle Ruky, Úst a Oka; tvar se nemění: „−2 srdce“). V kódu
  a v komentářích zůstává `hp` a „životy“.
- Vlastnosti hrdinky jsou Ruka, Ústa a Oko (`ruka`, `usta`, `oko`), všude s obrázkem (`ico_ruka/usta/oko`
  v `art/chars.px.js`): na liště, v deníku, při nové úrovni a na volbě, která na vlastnosti stojí (ikona a požadovaná
  úroveň vpravo na tlačítku). Každá překážka má mít cestu přes Ruku, Ústa i Oko, nebo přes věc či úkol.
- Zkoušky vlastností (`checkOf`/`chanceOf` v `src/story.js`, texty `CHECK`): volba s `if.attr`, nebo `check: 'usta'`
  proti vlastnosti postavy z její karty (`stats` u DIALOGS), se ukáže už s bodem pod požadavkem. O bod méně vyjde na 25 %,
  na požadavek na 50 %, o bod víc na 75 %, o dva a víc vždy (`CHECK.chance`, na tlačítku je šance). Hod je ze `state.seed`. Nepovedená zkouška stojí
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
- Uzel rozhovoru s nepřítelem, který už útočí, má `flee: true`: místo „Odejít.“ je v něm „Utéct. (−1 srdce)“ a odchod
  stojí srdce (`hurt`, nezabije). Vlastní volba „Couvnout“ se do dialogů nepíše. Totéž platí pro každou volbu, která rozhovor jen zavře („Ustoupit“, „Nechat být“, „Ještě ne“): odchod je vždy jen jedno tlačítko „Odejít.“
- Nepřítel má stát v cestě: psi ze Sherwoodu lezou do tunelu a strojvedoucí bez `psi_ok` nevyjede.
  Totéž hlídač: ochranka kanálu stojí v jediném průchodu stavebním plotem kolem ředitelovy buňky (`fences`
  a `gates` v `src/places/hrad.js`, `WorldScene.placeFences`, dílce `plot_1–3`); co hlídá, nesmí jít obejít.
  Kde mapa nemá úzké místo, je to přepadení: zastavení s `ambush: { until, back }` (vymahači u Mostecké) osloví
  hrdinku samo hned po příchodu a dokud neplatí `until`, vrátí ji každý odchod i útěk na místo `back`.
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
  po účinku volby (`WorldScene.refreshStops`), takže je vidět, co se stalo (minimapa se překreslí). Brány (`gates`) jsou dlaždice zavřené,
  dokud neplatí podmínka. Rekvizita zastavení se `say` (klíč v `ODDITY_LINES`) není součástí rozhovoru, klepnutí na ni
  ukáže bublinu (odehnaná nutrie). Klepnutí na portál vchodu podchodu (`tunnels`, `WorldScene.doorAt`) pošle hrdinku
  dveřmi skrz; nad tím, na co jde klepnout, je kurzor ruky.
- Účinek `film: '<klíč>'` u volby pustí filmeček `CUTSCENES[klíč]` nad světem (`WorldScene.film`) a rozhovor pak pokračuje odpovědí (vyhlídka Na Opyši: panoráma se zlomeným Nuselákem).
- Přestup hledá filmeček `cesta_<odkud>_<kam>` (loďka, pěšky), jinak `metro_<kam>`; příchod je `arrivals[odkud]` místa.
- Co se stalo, nikdo neví: v textech žádný „pád“, jen opisy („ten den“, „od té doby“, „předtím“, 14:37) a pojmenování skupin (Metro „mimořádná událost“, Loďkaři „velká voda“, Tržiště „krach“). Příčina se skládá z útržků, viz `docs/pribeh.md`.
- Konec spouští účinek `ending` (`trziste`, `lodkari`, nebo `hrad` = spočítat ze stavu v `resolveEnding`, `src/state.js`).
  `EndingScene` pustí snímky konce (`ENDINGS[konec].shots`) a epilog `EPILOG` (snímek za každé místo, kde hráčka
  něco změnila), pak závěrečnou obrazovku. Průchod `npm test` hraje celou hru až ke konci Řád.
- `npm run slepe` (`scripts/slepe.mjs`) hledá slepé uličky úplným prohledáním stavů, ne vzorkováním. Pro každé místo dokáže, že
  z každého stavu, ve kterém tam hrdinka může být, vede na pozdější místo nebo ke konci cesta bez zkoušky vlastnosti
  (vlastnosti ve stavu nejsou: zkouška může vyjít i nevyjít, spoléhat se na ni nedá). Sleduje jen proměnné, na kterých
  cesta stojí, a hledá si je sám zpřesňováním (pamatuje si je ve `scripts/slepe-sledovane.json`, `--znovu` hledá od nuly).
  Nález vypíše s nejkratší cestou, jak se do něj dostat; `--misto <místo>` jedno místo, `-v` kola zpřesňování,
  `--bez rozhovor.uzel.volba` vypne volbu na zkoušku. Vypíše i volby, které nejdou zvolit nikdy.
- Po každé změně dialogů `npm run tree`; průchod `npm test` (hlavní linka cestou bez boje a jeden boj) nabídnout
  a pustit na pokyn, pro změnu na jednom místě stačí `npm test -- --misto <místo>`.
- Grafika místa (díly země a domy) se nahrává až při vstupu na místo (`WorldScene.preload`), grafika ostatních míst se
  uvolní. Listy domů `houses_<místo>_<n>` mají kolem 24 spritů, počet je v `data/<místo>.json` (`houseSheets`).

## Stanice metra (platí pro všechny)

- Značení podle pražského metra (Jiří Rathouský): logo je šipka dolů, jejíž horní část tvoří M, bílá kontura na černém
  čtverci; vedle čtverec linky v její barvě s černým písmenem (A zelená, B žlutá, C červená). Tvar loga je v konstantách
  `METRO_ARROW`/`METRO_HOLE` (`art/fanta.px.js`) a `MA`/`MH` (`art/props.px.js`, sloupek `metro_totem`), podle
  „Metro Prague logo.svg“ na Wikimedia Commons. Typografie metra je Rathouského Metron.
- Linky stanic podle skutečnosti: Hlavní nádraží C, Muzeum A a C, Můstek A a B, Staroměstská A, Malostranská A (Hrad má fiktivní E). Čtverce linek kreslí `metroLine` v `art/props.px.js` (sloupky `metro_totem_<linka>`, vstup na Muzeu), na fasádě `metroSign` v `art/fanta.px.js`.
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
- Světlo: sudy s ohněm (`barrel_fire`, rozsev `fire` v `props` místa) mají pixelovou kaluž světla s ditheringem
  (`WorldScene.placeLights`), další světla jsou v `lights` místa (dlaždice, `scale`, `tint`, `alpha`, podmínka `if`: světlo z otevřené
  odbavovací haly na Hlaváku láká na nástupiště, žárovka u mlynáře svítí až s vlajkou `zarovka`, reflektor na Hradě).
  Elektřina skoro není: svítí oheň, svíčka v okně (`litWindow` v `art/buildings.px.js`, pár oken na ulici), generátor; domy mají kontaktní stín u paty a tmavší spodek fasády (`drawShadows`).
- Drobnosti na zemi (`art/drobnosti.px.js`, `WorldScene.placeClutter`, tabulka `CLUTTER` podle povrchu): suť, cihly
  pod fasádami, papíry, střepy, listí, hadry, kaluže, plevel a velké skvrny přes víc dlaždic. Leží naplocho pod stíny,
  nic neblokují, kreslí je dva Blittery; hustotu místa násobí `props.clutter`. Prázdná čistá dlažba je chyba.
- Střechy a fasády (`house()` v `art/buildings.px.js`): tašky různých odstínů, díry s latěmi a krokvemi, mech u okapu,
  ploché střechy s pásy lepenky, skvrnami a větracími hlavicemi; opadaná omítka je nepravidelná skvrna pod okny,
  trhliny vlasové s větvemi, nad vyhořelým oknem saze, ve výlohách mříže. Jedna barevná plocha střechy je chyba.
- Hrdinka má světlejší kabát žlutou poštovní brašnu a nese si slabé světlo (`halo` ve `WorldScene.spawnPlayer`),
  aby se ve tmě neztratila. Okraj mapy se do tmy rozpadá ditheringem přes tři dlaždice (`WorldScene.edgeFog`).
- Vraky aut na silnicích (`wreck` v `props` místa): jen kde je kolem dokola volno, aby nezavřely cestu. Nad sudy
  s ohněm stoupá kouř (částice `kour_*`).
- Nic čistého a pastelového; když nová grafika vypadá hezky a uklizeně, je špatně.

## Pravidla kódu

- Plátno 1280 × 720 bodů zobrazené 1:1 (`src/ui.js` WIDTH/HEIGHT), pixelArt bez vyhlazení, Phaser FIT bez vlastního
  centrování (centruje CSS v `index.html`, jedno místo pro layout). Písma Press Start 2P (nadpisy) a VT323 (text),
  resolution 1, celé velikosti; text přes `head()`/`body()` z `ui.js`.
- Isometrie 2:1, dlaždice 128 × 64: konstanty jen v `src/iso.js` (TW/TH) a `art/tiles.px.js`. Kdyby se po ověření
  přešlo na 96 × 48, mění se jen tam. Souřadnice a podél (doprava nahoru), b napříč (doprava dolů).
- Hloubka vždy přes `ISO.depthOf(a, b, lift)`, žádné výjimky po jednom. Domy před ulicí zprůhlední, když zakryjí hrdinku.
- Kurzor ve světě podle toho, co je pod ním (`WorldScene.hover`, sprity `kurzor_*` v `art/kurzory.px.js`): šipka a na zemi
  kosočtverec dlaždice (`kurzor_dlazdice`, jako šestiúhelník ve Falloutu) kam hrdinka dojde, křížek a červený kosočtverec
  kam ne, bublina u postavy, oko u věci s hláškou, dveře u vchodu. Chůze klepnutím, šipkami i WASD.
- Každý interaktivní objekt má přístupovou dlaždici (`approach`) a při startu se kontroluje, že je průchozí.
- Všechny texty pro hráčku jsou v `src/script.js` s literálními pevnými mezerami (U+00A0); do scén se texty nepíšou.
  Hrdinka je žena: rod ve všech replikách o ní. Kontrola textů proti mapě a rodu je pravidelný krok.
- Každá volba v dialogu má podmínku (stav, předmět, atribut) a text pro případ, že neplatí; nedostupné volby se skrývají,
  ne šednou. Vyčerpané volby se pamatují v `state.asked`. Když po volbě v uzlu žádná nezbude, rozhovor se zavře
  (otázka by mluvila o tom, co už neplatí). Deník (Q) jde otevřít i uprostřed rozhovoru.
- Po zavření dialogu `this.input.keyboard.resetKeys()`, jinak Enter z poslední repliky hned znovu spustí rozhovor.
- Phaser drží instanci scény mezi restarty: všechno herní resetovat v `init`/`create`.
- Konce se počítají z toho, co se skutečně stalo (stav), ne z poslední události. Stav předmětu a stav postavy jsou dvě věci.
- Stav hry je `src/state.js`; checkpoint při příchodu na místo (`save`), smrt je konec s epilogem a nabídkou návratu na
  checkpoint. Průběžně se ukládá i přesná dlaždice (`savePosition`, `state.pos`, `WorldScene.autosave`: po rozhovoru
  a každé dvě vteřiny v klidu); z toho pokračuje titulní obrazovka.
- Zvuk jen syntetizovaný (`src/sound.js`), kompresor na výstupu, odemyká se prvním gestem. Hudba později MIDI přes
  `spessasynth_lib`, rozhraní `music(on)` zůstává.
- pxl: sprite oříznutý plátnem se nezvětší sám (nastavit w/h), kupole kreslit ořezem, ne mazáním, `glow()` jen na vrchní
  úrovni sprite/scene. Šum jen tam, kde je materiál zrnitý (asfalt, suť), ne na omítce.

## Co nebrat z Václaváku

Vazbu na Laravel, evidenci pokusů, PF, logo a barvy Ecomailu jako povinný prvek, Vánoce.
