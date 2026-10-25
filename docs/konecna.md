# Konečná

Název hry; dřív „Praha po pádu“. Podtitul „Konečná. Nevystupovat.“ (hláška z metra, zní i při startu).

Samostatný projekt vedle Benefit: postapokalyptická pixel‑artová adventura po Praze. Vychází z toho, co vzniklo pro hru Václavák po pádu, ale bez Vánoc, ve větším rozlišení a s větší katastrofou. První verzi světa i obsahu vygeneruje Claude, finální podobu určí připomínky stejně jako u Václaváku.

## Proč

- Pipeline z Václaváku je hotová a přenositelná: pixel art jako kód (pxl), procedurální generátor domů (slohy, arkýře, štíty, neony, slepé štíty u sousedů, rohové domy), isometrická mapa, Phaser scény, Playwright průchody, rozhodovací strom a přehledy pro ladění.
- Pražské reálie a slang fungují. Hráč poznává místa a to ho táhne dál.
- Na Václaváku se ukázalo, kde je hranice: ručně laděných 100 dlaždic a 55 domů stálo asi čtyřicet kol připomínek. Větší svět musí stavět generátor z dat, ručně se kreslí jen to, co má být k poznání.

## Co to je

- Krátké RPG na zhruba hodinu, ne open world. Smyčka „dojdi, promluv, rozhodni“, kterou už umíme, plus inventář, pár mini‑her a tahový boj na vlastní obrazovce (viz Boj).
- Isometrie 2:1, dlaždice 128 × 64 bodů, plátno 1280 × 720 zobrazené 1:1 (čtyřnásobný detail proti Václaváku, postava kolem 64 bodů). Pořád pixel art generovaný kódem, ale generátor musí umět víc: rámy oken, římsy, štuky a materiály po jednotlivých bodech, ne po blocích. Landmarky v tomhle detailu už jsou spíš ručně skládané z částí než jeden skript.
- Na menších displejích se plátno zmenší s vyhlazením vypnutým, na 4K se zdvojnásobí. První dva dny se před psaním generátoru postaví ručně jeden dům a jedna křižovatka v tomhle detailu; když to nevypadá, přepne se na 960 × 540 s dlaždicí 96 × 48 dřív, než vznikne kód závislý na rozměrech. Rozměr dlaždice je všude jedna konstanta.
- Na šířku, počítač i tablet, mobil až druhotně.
- Engine Phaser 3 i s tahovým bojem; boj je další scéna, ukládání stačí v localStorage. Godot zamítnut: celý důvod projektu je přenositelná pipeline z Václaváku.

## Katastrofa

Větší než meteorit do muzea a hlavně konkrétní: každé místo má jednu změnu, kterou Pražák pozná na první pohled. Návrhy:

- Vltava po pádu teče jinudy, Staré Město je zatopené po první patro, po Pařížské se jezdí na loďkách.
- Nuselský most je rozlomený, na Pankrác se chodí po laně.
- Žižkovská věž leží přes Ohradu jako spadlá anténa, miminka utekla.
- Hlavák funguje jako tržiště, ve Fantově budově se obchoduje, Sherwood je skutečný les.
- Karlův most stojí, ale sochy zmizely. Někdo je prodává po kusech.
- Hrad je zavřený, nikdo neví, kdo je uvnitř. Stráž stojí dál.
- Metro je suché a jezdí v něm jediná souprava, řízená ručně.

Příčina je jedna, konkrétní a lidská: něco, co někdo v Praze udělal nebo zanedbal (pracovní představa: projekt pod Hradem, který pohnul podložím, proto voda teče jinudy, proto se zlomil Nuselák, proto je Hrad zavřený). Všechny změny míst mají společného jmenovatele, zásilka s ním souvisí a odhalí se až na Hradě. Hráč ji skládá z útržků po cestě.

## Místa

Ne celá Praha, ale řetěz míst spojených cestou. Mezi nimi generované ulice, které jdou projít, ale nemusí být věrné dům po domu.

1. Hlavák a Sherwood (start, tržiště, první quest).
2. Václavák (převzatý a zvětšený, bez vánočních stánků).
3. Staromák s Orlojem a zatopenými uličkami.
4. Karlův most a Kampa.
5. Malá Strana a Nerudovka.
6. Hrad (cíl). Vyšehrad je jen epilog loďkařského konce: hrdinka nastoupí na Kampě na loďku, z vody vidí zlomený Nuselák, Vyšehrad je obrázek a text, ne procházená mapa. Žižkovská věž leží na horizontu z Hlaváku.

Každé místo: jeden hlavní quest, dva vedlejší, jedna věc k poznání, jedna postava, která se pamatuje.

## Jak se staví svět

- Ulice, půdorysy a výšky domů z OpenStreetMap (export přes Overpass, uložit do repa jako data, ne volat za běhu).
- Generátor z půdorysu postaví blok: výška podle dat, sloh podle čtvrti a roku (secese na Vinohradech a Novém Městě, baroko na Malé Straně, panel na Jižáku), rohové domy s okny v boku, ostatní slepé štíty, střechy podle slohu.
- Landmarky ručně v pxl, podle fotek z Wikimedia Commons jako u Václaváku: Hrad, katedrála, Karlův most, Orloj, Týn, Tančící dům, Žižkovská věž, Nuselák, Hlavák.
- Poškození jako vrstva nad generátorem: zřícené rohy, díry, voda, popel, požáry, úlomky. Parametr „míra zkázy“ podle místa.
- Přehledy pro ladění jako teď: snímky mapy po úsecích, přehled fotka / sprite u landmarků, rozhodovací strom dialogů.

## Boj

- Tahový, na vlastní obrazovce (střet na mapě přepne do bojové scény). Pět až osm střetů za hru, každý v příběhu, většinu lze obejít dialogem.
- Nepřátelé: lidé z frakcí (loďkaři, stráž Hradu, překupníci, lidé z metra) a pražská zvěř (nutrie z Vltavy, holubi, psi ze Sherwoodu, kanci). Nic nadpřirozeného.
- Hrdinka má životy a tři atributy, které platí v boji i v dialozích: Síla (útok, páčení dveří), Huba (útěk z boje, smlouvání, získání útržku), Postřeh (úhyb, nalezení věci, poznání lži). Dialogové volby mají vedle podmínky na stav i podmínku na atribut.
- Levelování: bod do atributu za quest i boj, 2–3 úrovně za hru. Zbraň je předmět v inventáři (hasičák, tyč z tramvaje) a mění sílu útoku. Nepřítel má životy a jednu zvláštnost (pes kouše dvakrát, stráž blokuje). Životy léčí jídlo a checkpoint.
- Smrt je jeden z konců s vlastním epilogem. Autosave při příchodu na každé z šesti míst; po epilogu smrti nabídka „zpátky na poslední místo“ nebo „od začátku“.
- Boj deterministický přes seed, aby jím Playwright prošel.

## Příběh (kostra k rozstřílení)

- Hrdinka je kurýrka (jedna pevná postava, žena, jméno a historka k vymyšlení), která má doručit jednu věc z Hlaváku na Hrad. Co to je, se dozví až cestou, a může se rozhodnout to nedoručit. Rámec zásilky: malá věc, kterou lze nést, ukrást i zničit; dokazuje, kdo katastrofu způsobil; každá frakce ji chce z jiného důvodu. Tři konkrétní kandidáty navrhne první verze textů.
- Tři frakce: tržiště na Hlaváku (obchod), lidé z metra (řád) a loďkaři ze Starého Města (chaos). Každé místo někomu patří.
- Měna: jízdenky na 90 minut. Vydává a označuje je frakce metra, vypršení jen v textech, ne jako mechanika.
- Tón: cynismus na situace, ne na lidi. Slang jako v Sherwoodu. Vykání hráči.
- Čtyři konce: tři podle toho, komu hrdinka věřila (tržiště a metro končí na Hradě, loďkaři na Vyšehradě), a smrt v boji s vlastním krátkým epilogem.

## Co vygeneruje Claude a co ne

- Claude: data z OSM, generátor bloků, landmarky podle fotek, první verzi všech textů, mini‑hry, harness na průchody, dokumentaci pro připomínky.
- Jakub: výběr míst a katastrof, škrty v textech, vkus. Bez té smyčky z toho bude generický postapo svět, který nikdo nepozná.

## Plán

0. Skelet: git init, samostatný Vite + Phaser (phaser, vite, spessasynth_lib, playwright), GitHub Pages. Z Benefitu zkopírovat a upravit pxl paletu, iso.js, ui.js, sound.js, state.js, scény boot/title/hud/cutscene/ending a skripty pro strom a mapu; square.js a texty nebrat. Pravidla z .ai/rules přepsat do CLAUDE.md, harness z ~/tmp/pw-vaclavak přesunout do repa jako tests/.
1. Týdenní prototyp: první dva dny ověření rozlišení (jeden dům, jedna křižovatka ručně), pak OSM pro Nové Město, generátor postaví bloky, procházka z Hlaváku na Václavák a dál na Staromák bez questů. Cíl: aby to vypadalo.
2. Jedno místo kompletně: Hlavák s tržištěm, tři questy, inventář, atributy, autosave, první bojová scéna (např. psi ze Sherwoodu) včetně epilogu smrti. Bojový systém se ladí na jednom místě, než se množí.
3. Řetěz míst a hlavní linka.
4. Testování na kolezích. Zatím interní hra pro radost; jestli půjde dál (partneři, veřejnost), se rozhodne až tady.

## Rozhodnuto 25. 10. 2026

- Publikum: interní hra pro radost. Ema může být.
- Žánr a engine: RPG s tahovým bojem, Phaser 3.
- Hrdinka: jedna pevná postava, žena.
- Konce: tři frakční + smrt, loďkaři na Vyšehradě jen jako epilog.
- Měna: jízdenky na 90 minut. Podtitul: „Konečná. Nevystupovat.“
- Rozlišení: 128 × 64 s ověřením v prvních dvou dnech.
- Hudba: syntetizovaná jako u Václaváku, kompresor od začátku; později případně složitější MIDI (spessasynth_lib už je v Benefitu).
- Hosting: GitHub Pages z repa konecna.
- Skelet: samostatný Vite + Phaser, kód z Václaváku zkopírovat a upravit.

## Otevřené otázky

- Jméno a historka hrdinky.
- Konkrétní příčina katastrofy (co přesně se stalo pod Hradem) a konkrétní zásilka; první verzi navrhnou texty, vybere se v připomínkách.
- Balanc levelování: kolik bodů za quest a za boj, aby 2–3 úrovně vyšly na hodinu.
- Jestli atributy ovlivní i dostupnost mini‑her, nebo jen dialogy a boj.

## Co nás potrápilo u Václaváku (a co z toho plyne)

Pohyb po mapě
- Klepnutí na dlaždici hledá cestu po mřížce, ale zastavení musí mít vlastní přístupovou dlaždici: stánek, který stál na dlaždici s lampou, se nedal navštívit. Pravidlo: každý interaktivní objekt má definované „odkud se k němu přistupuje“ a kontrola při startu, že je ta dlaždice průchozí.
- Klávesy: držená šipka, kombinace dvou směrů, klouzání podél překážky a „nárazem promluvit“ se musely dopsat ručně. Enter z poslední repliky hned znovu spustil rozhovor, protože JustDown zůstal nastavený, pomohlo resetovat klávesy po zavření dialogu.
- Hráč schovaný za domem: domy na jedné straně stojí před ulicí a musí zprůhlednět, když zakryjí postavu. Řazení podle hloubky bylo nejčastější zdroj chyb (muzeum zakrývalo ulici, cedule mizela za fasádou, zvednuté prvky musely dostat vlastní vrstvu). Pro větší svět chce jednotné pravidlo hloubky od začátku, ne výjimky po jednom.
- Postava nesoucí věc (stromek) potřebuje vlastní sprite a vlastní logiku (shořel u tramvaje). Každý nesený předmět je tedy stav, grafika a pravidlo, s tím počítat v návrhu inventáře.

Dialogy a stav
- Uzavřené dialogy: postava, se kterou se jednou mluvilo, musí jít oslovit znovu a nabídnout to, co zbylo (koupit stromek dodatečně, zeptat se podruhé). Z toho plyne: každá volba má stav „už vyčerpaná“ a nedostupné volby se skrývají, ne šednou.
- Volby se musí hlídat proti stavu: Lenka nabízela vzkaz od Standy dřív, než hráč Standu potkal; eskalátor bral šupinu, kterou hráč neměl. Každá volba potřebuje podmínku a text pro případ, že podmínka neplatí.
- Deník úkolů musí jít otevřít i uprostřed rozhovoru.
- Doručení: špatná obálka se zprvu ukazovala jako OK; adresát s cizí obálkou byl „vyřízený“, i když hráč jeho obálku ještě nesl; poledne přebilo i hru, kde už bylo všechno doručeno. Konce počítat z toho, co se skutečně stalo, ne z toho, jaká událost přišla poslední.
- Věci po doručení: dárek koupený po předání obálky nikdo neocenil. Stav předmětu a stav adresáta jsou dvě různé věci a dialog musí reagovat na obě.
- Phaser drží instanci scény mezi restarty: mini‑hra si pamatovala, že je hotová, a druhá hra se zasekla. Všechno herní resetovat v init/create, ne spoléhat na nové instance.

Grafika a reálie
- Věrohodnost přišla až s fotkami: mapa, letecký snímek, Wikimedia Commons dům po domu. Bez toho vznikal generický Václavák. U nového projektu fotky a data dřív než první sprite.
- Procedurální domy zaberou, ale mají hranice: okna v boční stěně mají jen rohové domy, sudá strana ukazuje dvory a střechy, protože průčelí míří od hráče. Isometrie 2:1 navíc neumí zkosené nároží jinak než svislým řezem. Vědět to předem a navrhnout podle toho, co je vidět.
- Sprite oříznutý plátnem (tramvaj), kupole s dírou po mazání místo ořezu, září (glow) jen na vrchní úrovni skriptu: pxl má svá pravidla, zapsat je do pravidel projektu hned.
- Prohlížeč držel starý atlas a sprity ukazovaly na špatná místa; vyřešila to verze v adrese. Mít od prvního dne.
- Dvojí centrování plátna (Phaser i CSS) posunulo hru mimo střed. Jedno místo pro layout.

Texty
- Pevné mezery v textech znamenají, že hledání a nahrazování podle obyčejné mezery selže. Všechny texty na jednom místě a nástroj, který s nimi počítá.
- Texty musely sedět s mapou (kapři „u Ambassadoru“ tam nestáli, Dům módy „na Zlatém kříži“ stojí na opačném konci) a s hrdinou (pošťačka dostávala mužské tvary). Kontrola textů proti mapě a rodu jako pravidelný krok, ne jednorázová oprava.
- Dobrý vtip nesnese opakování: „Nikdo neví jak“ třikrát za sebou. Při generování textů ve velkém to hlídat skriptem.

Proces
- Automatický průchod hrou (Playwright) a snímky mapy po úsecích byly nutnost, bez nich se každá změna ověřovala ručně. V novém projektu první věc po enginu.
- Očíslovaný rozhodovací strom a přehled fotka / sprite udělaly připomínky rychlé („dům 11 má mít…“). Dokumentace pro ladění je součást hry, ne příloha.
- Zvuk: prohlížeč ho pustí až po prvním gestu a syntetizované zvuky byly potichu proti zbytku počítače; kompresor a hlasitost řešit od začátku.
- Čtyřicet kol připomínek na jedno náměstí. Pro větší svět nastavit, co se ladí ručně (landmarky, questy) a co se bere z generátoru bez ladění.

## Co z Benefit vzít s sebou

- `resources/art/vaclavak/*.px.js` (paleta, dlaždice, generátor domů, rekvizity, postavy), `resources/js/vaclavak/` (iso, scény, HUD, zvuk, stav), skripty `scripts/vaclavak-*.mjs`, harness v `~/tmp/pw-vaclavak`, pravidla v `.ai/rules/vaclavak.md` a `.ai/rules/art-vaclavak.md`.
- Nebrat: vazbu na Laravel, evidenci pokusů, PF a Ecomail logo jako povinný prvek.
