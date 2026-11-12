# Konečná. Nevystupovat. – příběh, postavy, zastavení

Příběhová bible. Co je tady, platí; texty v `src/script.js` z toho vycházejí a připomínky se dávají k číslům
v rozhodovacím stromu. Tón: cynismus na situace, ne na lidi. Vykání hráčce. Film v zádech: Costnerův Pošťák
(uniforma znamená, že stát existuje, i když neexistuje) a Vodní svět (loďkaři, Kuřáci, suchá země jako mýtus).

## Páteř

**Co se stalo, nikdo neví.** Ve hře se neříká „pád“ ani nic jiného s názvem. Lidi to obcházejí: „ten den“, „tenkrát“, „od té doby“, „předtím“, „než se to stalo“. Pevný bod jsou hodiny: všechno se zastavilo ve 14:37. Každá skupina tomu říká po svém: Metro „mimořádná událost“, Loďkaři „velká voda“, Tržiště „krach“. Příčinu skládá hráčka z útržků a celá se řekne až na Hradě.

- **Příčina.** Kanál Dunaj–Odra–Labe se po letech řečí opravdu začal kopat a dostal „pražskou větev“: splavnění Vltavy
  a nový kanál přes Letnou. Zároveň se pod Hradem razilo metro E (Hrad – Letná). Štít narazil na čerstvě napuštěný kanál,
  který na výkresech metra nebyl, protože byl na jiném ministerstvu. Voda šla do tunelu, tunel pod Staré Město, Vltava
  si našla novou cestu, podloží kleslo a Nuselák praskl. Žižkovská věž spadla z jiného důvodu a nikdo neví z jakého.
  Hláška: „Kanál konečně propojil Labe s Vltavou. Ve stanici Můstek.“ Hráčka příčinu skládá z útržků, celá se řekne
  až na Hradě.
- **Zásilka.** Datový záznamník razicího štítu, krabička jako velký powerbank. Uvnitř záznam, kdo a kdy nařídil razit
  dál: pokyn přišel z Kanceláře kanálu. Jde přečíst jen čtečkou na Hradě. Jde nést, ukrást, zničit. Tržiště ho chce
  prodat, metro zveřejnit jako důkaz pro řád, loďkaři zničit, protože voda je živí. Hráčka ho nese celou cestu
  a neví, co nese.
- **Konce.** Tržiště a metro na Hradě, loďkaři na Vyšehradě (epilog z loďky, zlomený Nuselák z vody), smrt v boji
  s vlastním epilogem. Důvěru sbírají rozhodnutí po cestě (`state.trust`).

## Hrdinka

Pošťačka. Bez jména, všichni jí říkají podle uniformy. Předtím roznášela na Jindřišské a roznáší dál,
protože jí nikdo neřekl, že nemá. Uniforma projde všude: lidi věří poště víc než státu, hlavně teď, když není ani jedno,
a všichni se jí ptají, kdy přijde důchod. Taška přes rameno, v ní zásilka a dopisy, které nikdo nečeká. Tři atributy:
Ruka, Ústa, Oko.

## Frakce

- **Tržiště** (obchod): Hlavák, Fantova budova. Pan Fanta. Kanálu jsou vděční, lodě vozí zboží.
- **Lidé z metra** (řád): jediná souprava, stanice jako útočiště, evidence, jízdenky jako měna, kterou vydávají
  a označují. Kanál nenávidí, vzal jim síť. Václavák je jejich povrch.
- **Loďkaři** (chaos): zatopené Staré Město, loďky po Pařížské. Říkají si Kuřáci, vede je Admirál, který cituje
  exprezidenta z paměti a kanál zbožňuje. Suchá země je pro ně mýtus, i když na ní stojí.

## Měna

Jízdenky na 90 minut. Metro je označuje, trafikantky je prodávají, tržiště je bere. Vypršení jen v textech.

## Místo 1: Hlavák a Sherwood

Mapa `data/hlavak.json` (64 × 44, a = jih, b = západ). Nádraží vlevo (sloupce 0–17), Wilsonova před ním, Sherwood
uprostřed (sloupce 18–38), koleje dole, Jubilejní synagoga a bloky Nového Města vpravo. Věc k poznání: Fantova budova
a nádražní hodiny, které stojí na 14:37.

### Postavy

- **Pan Fanta**, šéf tržiště ve Fantově budově. Tvrdí, že budova je jeho, protože se tak jmenuje. Prodá cokoli včetně
  informace, kdo co prodal. Tržiště.
- **Výpravčí**, postava, která se pamatuje. Stojí na nástupišti s plácačkou a hlásí vlaky, které nejedou: „Rychlík
  Hungaria má zpoždění 412 dní, cestující prosíme o shovívavost.“ Chce, aby nádražní hodiny šly dál.
- **Robin ze Sherwoodu**, samozvaný přerozdělovač. Bere tržišti a dává parku, hlavně sobě. Jeho psi zdivočeli, co jim
  dal Fantův guláš.
- **Strojvedoucí** jediné soupravy, u vstupu do metra. Metro. Staví, kde chce, každého se ptá, co veze. „Konečná.
  Nevystupovat.“ Myslí to vážně.
- **Trafikantka** u stánku s jízdenkami. Učí hráčku měnu a ptá se, jestli když jede pošta, dostane důchod.

### Hlavní linka

1. Pošťačka vystoupí z metra se starým dopisem v tašce, nedoručeným od toho dne. Adresát: výpravčí, Hlavní nádraží. Je to
   jeho výpověď z ČD, datovaná den předtím. „Výpověď. Tak to jsem rád, že pošta jede.“ Tutoriál doručení.
2. Fanta se doslechne, že v Sherwoodu chodí uniforma, a pozve ji na tržiště. Nabídka: donést krabičku na Hrad,
   20 jízdenek hned, 200 při předání. „Pošťačku nikdo nezastaví. Všichni čekají na důchod.“ Co je v krabičce, neřekne.
3. Odjezd metrem: potřebuje jízdenku (koupit, nebo z vedlejšího úkolu) a projít otázkou strojvedoucího „Co vezete?“
   Pravda: důvěra metra. Lež: důvěra tržiště. První rozhodnutí, které se počítá do konce.

### Vedlejší úkoly

- **Hodiny** (výpravčí): sehnat něco, co jde (hodinky z tržiště), a nařídit nádražní hodiny. Odměna: plácačka
  výpravčího jako první zbraň a vědomost, kdy souprava doopravdy jede.
- **Psi ze Sherwoodu** (Robin): smečka hlídá pěšinu k ohništi. Ruka: první boj. Ústa: přemluvit Robina, ať je odvolá,
  když mu donesete lahev od Fanty. Oko: najít díru v plotě a obejít je. Odměna: Robin prozradí, co Fanta
  ve skutečnosti prodává.

### Zastavení (a řádek, b sloupec)

Mřížka je natočená podél Wilsonovy (osa a 205°, b 295°). Hlavák je vícepatrový: nádraží s kolejemi vlevo (b 0–10),
Fantova budova b 11–14 na podnoži o patro výš (přízemí ve výšce magistrály, na štítu přeškrtnuté HLAVNÍ a sprejem FANTOVO NÁDRAŽÍ), před ní brutalistní odbavovací hala z let 1972–1979 s magistrálou na střeše (b 15–20, magistrála pokračuje ve stejné výšce po estakádě přes celou mapu), plácek před halou se třemi prosklenými schodišťovými věžemi s kupolí, kterými se vyjde na magistrálu (b 21–27); na magistrále jsou vraky aut a autobusů a propadlina, Sherwood b 28–38. Na severu (a 0–17) mapa sahá přes tramvajovou trať podél severního okraje Vrchlického sadů se zastávkou Hlavní nádraží (dva vraky T3 na zastávce, třetí na kusé koleji u východního okraje parku); blok za tratí je vybombardovaný na přízemí. Hala: prosklená
stěna, za ní červené stropy s odhalenými rozvody, souvislý betonový pás stropní desky, kovové portály; teď jsou
na magistrále vraky a v jednom místě je vozovka propadlá do haly. Zdroj pravdy je `src/places/hlavak.js`, snímky
`docs/mapa/Z*.png`.

| Zastavení | Postava | Přístup | Rekvizity |
|---|---|---|---|
| Výstup z metra dveřmi odbavovací haly (nad nimi logo metra a linka C), start 34,22 | strojvedoucí 36,21 | 36,22 | sloupek se značením metra 32,22 |
| Fanta nahoře na magistrále před vchodem do Fantovy budovy (úroveň 1) | pan Fanta 39,15 | 39,16 | – |
| Trafika | trafikantka 39,29 | 39,30 | kiosek 38,29 |
| Ohniště v Sherwoodu | Robin 48,34 | 47,34 | sud s ohněm 48,35 |
| Psi na severní pěšině | smečka 27,31 a 27,32 | 28,31 | – |
| Ostrovní peron pod halou | výpravčí 48,4 | 49,4 | nádražní hodiny 47,4 |

Přestup dál: souprava z Hlavního nádraží na Muzeum, jedna stanice po trase C. Strojvedoucí stejně zastaví jinde.

## Místo 2: Václavák

Mapa `data/vaclavak.json` (132 × 32, osa a od Můstku k Národnímu muzeu, azimut 137°, b napříč; náměstí je b 10–16).
Věc k poznání: spodní polovina náměstí je pod vodou (a ≤ 49, kanál propojil Labe s Vltavou ve stanici Můstek
a hladina sahá k Jindřišské), středem vede dřevěné molo (b 12–13) až k Můstku. Horní polovina je povrch lidí z metra,
na konci mola kotví loďkaři. Socha svatého Václava zmizela, na prázdném podstavci stojí za jízdenky živý člověk. Národní
muzeum je ručně kreslený landmark s propadlou kupolí a nápisem ŘÁD JE ZAPSANÝ na soklu. V Lucerně visí obrácený kůň
a nikdo z metra neví, který je pravý.

### Postavy

- **Dispečerka**, hlas lidí z metra. Sedí ve stanici Muzeum a mluví k náměstí rozhlasem, který ještě funguje. Řád
  znamená, že všechno je zapsané. Chce zásilku zaevidovat, ne vzít. Metro.
- **Svatý Václav na směny**, postava, která se pamatuje. Stojí na podstavci místo ukradené sochy, protože někdo musí,
  a lidi mu za to hází jízdenky. Vidí všechno, co se na náměstí šustne, a prodává to po kusech. Ví, že sochy z Karlova
  mostu a z Václaváku odvážejí loďkaři.
- **Revizor**, kontrola na hranici vody. Bývalý kolega hrdinky z druhé strany přepážky. Označuje jízdenky a lidi. Metro.
- **Kuřačka**, loďkařská předsunutá hlídka u mola na Můstku. Cigareta, motorový člun, přesvědčení, že suchá země
  se přeceňuje. Prodává převoz na Staromák. Loďkaři.

### Hlavní linka

1. Souprava zastaví, jak slíbeno, jinde: ne v Muzeu, ale mezi stanicemi. Pošťačka vylézá na magistrálu nouzovým
   východem. První pohled na vodu dole.
2. Dispečerka ji rozhlasem pozve do stanice. Chce zásilku zapsat do evidence. Nechat zapsat: metro se dozví, co to je,
   důvěra metra. Odmítnout (Ústa): důvěra tržiště, ale revizor dole ji hlídá víc.
3. K vodě. Revizor pouští na molo jen s označenou jízdenkou a zapsaným nákladem. Buď má zápis z evidence, nebo mu
   zaplatí, nebo proklouzne (Oko), nebo ho ukecá (Ústa).
4. Kuřačka ji vezme do Nuslí, odkud ji na Staromák doveze kormidelník po Vltavě. Rovnou to nejde: na Můstku je
   stavidlo, které drží Admirálova posádka a pouští jen loďkaře (rovnou až po setkání s Admirálem). Cestou přes zatopenou Jindřišskou první útržek o kanálu: „Admirál říká, že to je
   největší vodní dílo od Zemana. Já říkám, že to je hodně vody.“

### Vedlejší úkoly

- **Pravý kůň** (Václav na směny): zjistit, kam se poděla socha. Stopa vede ke Kuřačce, která sochy nakládá po kusech.
  Odměna: tři jízdenky z přilby a rada, že kdo kupuje bronz po kusech, bydlí vysoko (Zlatá ulička na Hradě,
  odpověď na otázku průvodkyně).
- **Rozhlas** (dispečerka): vyměnit hlasitost ve zbývajícím reproduktoru u Jindřišské, aby bylo slyšet až k vodě. Boj
  nebo Ruka: na reproduktoru sedí nutrie. Odměna: dispečerka pošťačku ohlásí jako úřední osobu a revizor ji pustí
  bez placení.

### Zastavení

Zdroj pravdy je `src/places/vaclavak.js`, dialogy v `DIALOGS` v `src/script.js`.

| Zastavení | Postava | Přístup | Rekvizity |
|---|---|---|---|
| Nouzový výlez na magistrále před Muzeem, start 107,12 (zpátky soupravou na Hlavák) | výlez 108,11 | 107,11 | – |
| Vstup do stanice Muzeum, rozhlas | dispečerka 102,10 | 102,11 | vstup do metra 103,9 |
| Prázdný podstavec pomníku | Václav na směny 100,13 | 99,13 | – |
| Reproduktor u Jindřišské | nutrie 53,8 | 53,9 | – |
| Hranice vody, začátek mola | revizor 50,11 | 51,12 | molo je zavřené (49,12 a 49,13), dokud nepustí |
| Konec mola u Můstku | Kuřačka 18,12 | 19,12 | loďka 17,13 |

Přestup dál: loďka ze zatopeného Václaváku Jindřišskou a Panskou na Staromák, scéna s prvním útržkem o kanálu.

## Místo 2½: Nuselák (mezi Václavákem a Staromákem)

Kuřačka veze z Václaváku Ječnou ke Karlovu a dál nejede: Nuselské údolí je jezero a pod zlomeným mostem visí beton.
Na Staromák se jede od jižního mola s kormidelníkem loďkařů, takže hrdinka musí přes Nuselák, a ten je uprostřed
prostředního pole zlomený. Přes mezeru vede lano (Lanovka Fanta). Mapa z OSM a laseru ČÚZK: údolí Botiče pod 212 m
je voda, svahy suť, mostovka b 17–20, zlom a 44–49 (`src/places/nuselak.js`, `scripts/places.mjs`).

### Postavy

- **Kuřačka** (loďkaři): vysadí u mola pod Karlovem, poví, že most praskl ve 14:37 a uvnitř zůstala souprava céčka.
- **Strážmistr Kulhánek** (Muzeum Policie): poslední policista v Praze bez pravomocí. Dává pokuty, které nikdo
  neplatí, v kapse nosí koťata. Útržek: tři dny předtím sepsal protokol o praskající troubě mostu, Kancelář kanálu
  ho vrátila s razítkem VYŘÍZENO.
- **Lanař** (tržiště): Lanovka Fanta, přes zlom dvě jízdenky, zpátky zadarmo.
- **Kormidelník** (loďkaři): vozí z jižního mola na Staromák kolem Vyšehradu; u něj se nalodí flotila loďkařského konce.
- **Mourek**: strážmistrovo kotě, utekl za racky až za zlom k uvízlé soupravě.

### Hlavní linka

1. Kuřačka vysadí u Karlova (úkol Loďka na Staromák: další krok Nusle, Přes zlom).
2. Lanař: přes lano za dvě jízdenky, Rukou bez postroje, Okem (druhý postroj pod bednou), Ústy (pošta má přednost),
   nebo odpracovat (bez dvou jízdenek). Přechod je animace: hrdinka ručkuje po laně nad vodou (`rope` u volby).
3. Kormidelník na jižním molu: Na Staromák.

### Vedlejší úkoly a útržky

- **Mourek**: strážmistr pošle pro kotě za zlom; za kotě dá služební odznak (talisman, Ústa +1).
- **Souprava metra C** v troubě mostu: služební kniha, poslední zápis „Dispečink hlásí, že trouba mostu pracuje. Pokyn
  Kanceláře kanálu: provoz nezastavovat. 14.37 —“ (útržek).
- Stanice Vyšehrad: eskalátor jede jen jedním směrem, dolů.

### Loďkařský konec

Pilař na Kampě veze flotilu do Nuslí (ne rovnou na Vyšehrad). Pod zlomeným mostem se hrdinka u kormidelníka nalodí
a flotila odjíždí kolem skály na Vyšehrad (snímky konce a epilog jako dřív).

### Zastavení

| Zastavení | Poloha | Postava |
|---|---|---|
| Severní molo | pod Karlovem | Kuřačka |
| Muzeum Policie | Karlov, vchod | strážmistr Kulhánek, vrak Tatry VB |
| Zlom, sever | mostovka u lana | lanař |
| Zlom, jih | sloupek lana, trouba se soupravou | racek (lano zpátky), souprava, Mourek |
| Jižní molo | pod Palácem kultury | kormidelník |
| Stanice Vyšehrad | jižní konec mostu | sloupek C |

Ve vodě plavou lachtani (ze zatopené zoo), na mostovce a troskách sedí racci. Nad jižním koncem stojí Palác kultury
a hotel Forum, nejvyšší budova ve hře.

## Místo 3: Staromák

Mapa z OSM přijde; polohy podle skutečného náměstí. Věc k poznání: Staré Město po první patro pod vodou. Husův pomník
je ostrov a Admirál na něm drží dvůr, ke schodům Týna se jezdí na loďce, Pařížská je nejdražší vodní cesta v Evropě.
Orloj je na úrovni hladiny: každou hodinu odbíjí, Smrtka tahá za zvonek nad vodou a apoštolové vycházejí mokří.

### Postavy

- **Admirál**, vůdce loďkařů. Na Husově pomníku v záchranné vestě, cituje exprezidenta z paměti a věří, že kanál je
  dílo století, které jen ještě nikdo nedocenil. Loďkaři.
- **Orlojník**, postava, která se pamatuje. Natahuje Orloj ručně, z loďky, každou hodinu. Prodává přesný čas, protože
  nikdo jiný ho nemá. Mechanismus pod vodou rezaví a on potřebuje pomoc, aby apoštolové vyšli aspoň jednou celí.
- **Potápěčka z metra**, jediná z lidí z metra, kdo se odváží do zatopené Staroměstské. Vynáší, co se dá, a viděla,
  odkud voda přišla. Metro.
- **Lovec značek**, chytá na hák zboží ze zatopených butiků v Pařížské. Prodává mokré kabáty a tvrdí, že jsou původní.
  Má krabičku, která vypadá přesně jako zásilka.

### Hlavní linka

1. Kuřačka přiveze pošťačku k Husovu pomníku. Admirál si poslechne, že nese „poštu na Hrad“, a nabídne převoz přes
   Klementinum na Karlův most zadarmo, když mu ukáže, co nese. Admirál pozná záznamník štítu a chce ho hodit do vody,
   jako obětinu kanálu.
2. Tři cesty: dát mu ho (důvěra loďkařů, zásilka je pryč, hra jde dál, ale Hrad bude jiný). Odmítnout a projít
   po střechách Klementina (Oko, důvěra tržiště). Podstrčit mu krabičku od lovce značek (Ústa, Admirál to pozná
   až na Vyšehradě).
3. Potápěčka u Staroměstské dá druhý útržek: voda přišla ze západu, tunelem, který na mapě metra není. Pokud hráčka
   zásilku nechala zapsat na Václaváku, potápěčka už ví, co nese, a prosí ji, ať ji doveze celou.
4. Odjezd na Karlův most: loďkou přes Karlovu ulici, nebo po střechách přes Klementinum.

### Vedlejší úkoly

- **Mokří apoštolové** (Orlojník): Ruka, vytáhnout mechanismus nad hladinu, nebo sehnat od lovce značek ozubené kolo
  z hodinek z butiku. Odměna: Orlojník odbije hodinu, kdy odjíždí Admirál, a hráčka se dostane na loďku bez něj; plus
  jízdenky od turistů, kteří tu nejsou.
- **Hák v Pařížské** (lovec značek): jeho hák uvízl ve výloze, kde hnízdí nutrie. Boj s nutriemi, nebo Oko
  a vytáhnout hák jinudy. Odměna: krabička, která vypadá jako zásilka, a kabát, který v boji přidá život.

### Zastavení

Zdroj pravdy (polohy postav, přístupy, rekvizity) je `src/places/staromak.js`, dialogy v `DIALOGS` v `src/script.js`, mapa `data/staromak.json`.

| Zastavení | Poloha | Postava |
|---|---|---|
| Přístaviště u Týna, start | východní strana, schody Týnského chrámu | Kuřačka |
| Husův pomník | střed náměstí, ostrov | Admirál |
| Orloj | jižní strana, radnice, u hladiny | Orlojník |
| Výloha v Pařížské | severozápad, první butik | nutrie, lovec značek |
| Stanice Staroměstská | západ, u Rudolfina | potápěčka |
| Ústí Karlovy ulice | jihozápad, u Klementina | odjezd |

Přestup dál: loďkou zatopenou Karlovou ulicí k Staroměstské mostecké věži, nebo po střechách Klementina, podle toho,
jak dopadl Admirál.

## Místo 4: Karlův most a Kampa

Mapa z OSM přijde. Věc k poznání: Vltava teče jinudy, pod Karlovým mostem je suché koryto. Most stojí nad bahnem, lidi
chodí pod oblouky a loďky končí u Staroměstské mostecké věže. Sochy zmizely, na podstavcích jsou cenovky. Jediný, kdo
zůstal, je Nepomucký, protože je přišroubovaný. Na Kampě naopak: Čertovka má všechnu vodu, kolo Velkopřevorského mlýna
se točí poprvé za sto let a Kampa je jediné místo v Praze, kde svítí žárovka.

### Postavy

- **Fantova neteř**, vede Galerii na mostě: podstavce s cenovkami, sochy po kusech v bednách. Má od strýce pokyn
  koupit zásilku zpátky, Fanta ji prodal dvakrát. Tržiště.
- **Mlynář z Kampy**, postava, která se pamatuje. Hlídá mlýnské kolo a jediný generátor v Praze. Mluví o proudu jako
  jiní o Bohu a Lennonovu zeď nechal přemalovat, protože ji stejně nikdo neviděl potmě. Neutrální, spíš metro.
- **Pilař**, loďkař, co u věže řeže sochy na kusy, aby se vešly do loďky. Přes den práce, večer umění. Loďkaři.
- **Hlídač Nepomuckého**, bere jízdenky za sáhnutí na destičku pro štěstí. Destičku mu ukradli, tak lidi sahají
  na díru. Nikdo si nestěžuje.

### Hlavní linka

1. Přístup z vody u Staroměstské věže. Pilař se zeptá, jestli pošťačka veze něco pro Admirála, a podle toho,
   co se stalo na Staromáku, buď mávne, nebo si ji zapamatuje.
2. Na mostě Fantova neteř nabídne 300 jízdenek za zásilku na místě. „Strýc to prodal dvakrát a vy jste ta druhá.“
   Prodat: důvěra tržiště, zásilka pryč, hra jde dál a Hrad bude jiný (neteř i Kastelán poradí, že na Hrad se dá
   jako turistka s propustkou od velvyslance). Odmítnout: neteř pošle vzkaz, že pošťačka
   nespolupracuje, a na Malé Straně ji bude někdo čekat.
3. Třetí útržek: sochy kupuje Hrad. Někdo nahoře má na umění, takže někdo nahoře má na všechno. Od neteře za jízdenky,
   nebo od Pilaře za Ústa.
4. Z mostu dolů na Kampu po schodech, od mlynáře dál Mosteckou na Malou Stranu.

### Vedlejší úkoly

- **Proud** (mlynář): kolo se zaseklo o hlavu sochy, kterou tudy splavili loďkaři. Ruka, nebo Oko a přehradit
  Čertovku. Odměna: žárovka na mostě svítí a mlynář nabije zásilku. Záznamník má vybitou baterii a bez nabití ho čtečka
  na Hradě nepřečte; hráčka to neví, dozví se to až tam. Jediný vedlejší úkol, který mění konec.
- **Destička pro štěstí** (hlídač Nepomuckého): destička je v bednách Galerie. Ústa na neteř, nebo koupit. Odměna:
  hlídač prozradí, kudy se chodí na Malou Stranu kolem stráže, a jedno sáhnutí zadarmo: do konce hry jeden hod v boji
  navíc.
- **Kanci z Kampy**: v parku ryjí kanci z Petřína a hlídají cestu k mlýnu. Boj, nebo Oko a obejít je po náplavce.

### Zastavení

Zdroj pravdy (polohy postav, přístupy, rekvizity) je `src/places/most.js`, dialogy v `DIALOGS` v `src/script.js`, mapa `data/most.json`.

| Zastavení | Poloha | Postava |
|---|---|---|
| Staroměstská mostecká věž, start | východní konec mostu, molo v suchu | Pilař |
| Galerie na mostě | střed mostu, podstavce | Fantova neteř |
| Nepomucký | most, osmý podstavec vpravo | hlídač |
| Schody na Kampu | západní konec mostu | – |
| Park na Kampě | pod mostem, u Sovových mlýnů | kanci |
| Velkopřevorský mlýn | Čertovka, kolo | mlynář |
| Mostecká, odchod | u Malostranské věže | – |

Přestup dál: žádný, Mosteckou se jde pěšky na Malou Stranu. Jediné místo, kde mapa navazuje: Malá Strana je suchá
a nikdo tam nic nepřestavěl.

## Místo 5: Malá Strana a Nerudovka

Mapa z OSM přijde. Věc k poznání: Malá Strana je suchá a nikdo ji nepřestavěl, což je po třech zatopených místech samo
o sobě k poznání. Nad Nerudovkou stojí Hradní stráž v plné parádě a nikoho nepouští, celý rok bez střídání: v poledne
si vymění místa mezi sebou. Ze zahrady německého velvyslanectví vylezl Trabant na nohách, Černého Quo vadis, a od té
doby bloudí Malou Stranou, hledá, kdo mu dá benzín, a nadává na svého autora. Černý je podle Trabanta idiot: postavil
ho na nohy a nedal mu volant, a tohle má být umění.

### Postavy

- **Stráž**, dva kluci v uniformě u brány Ke Hradu. Rozkaz zní nikoho nepouštět a nikdo ho neodvolal, protože není
  kdo. Salutují čemukoli s diplomatickou značkou.
- **Paní z Nerudovky**, postava, která se pamatuje. Osmdesát let v domě U Dvou slunců, pamatuje tři povodně a říká,
  že Hrad je zavřený podruhé a stráž jsou ti samí kluci. Viděla, co jelo nahoru tu noc předtím.
- **Kastelán**, chodí z Hradu dolů nakupovat: sochy, jídlo, umění. Jediný, kdo bránou projde oběma směry. Tržiště
  s ním obchoduje, ví o něm Fantova neteř.
- **Velvyslanec bez země**, sedí na velvyslanectví, odkud se nikdo neozývá, a dál vydává víza. Za jízdenky nebo
  za zprávy z domova vydá propustku, kterou stráž uzná, protože má razítko.
- **Trabant na nohách**, mluví, když dostane benzín, a hlavně nadává na Černého. Není postava, ale chová se tak.
- **Tržištní vymahači**, čekají na Malostranském náměstí, pokud pošťačka odmítla neteř. Jediný lidský boj, kterému
  se nejde vyhnout jinak než Ústy.

### Hlavní linka

1. Z Mostecké na Malostranské náměstí. Pokud odmítla neteř, čekají vymahači: boj, nebo Ústa a zaplatit jim z toho,
   co ušetřila.
2. Nerudovkou nahoru k bráně. Stráž odmítne. Čtvrtý útržek od paní z Nerudovky: tu noc předtím jela nahoru kolona
   aut Kanceláře kanálu a ráno se Hrad zavřel. Hráčka ví, kdo je uvnitř, i když ne jménem.
3. Tři cesty dovnitř, podle toho, komu věřila. Metro: propustka úřední osoby, pokud se nechala zapsat u dispečerky.
   Tržiště: Kastelán ji vezme nahoru jako zásilku, pokud zásilku ještě má a neteř o ní poslala zprávu. Nikomu: Trabant.
   Sehnat mu směs od Pilaře (návrat na most), nasednout, stráž salutuje diplomatické značce a Trabant ji
   po nohách vynese Nerudovkou až na nádvoří, celou cestu nadává na Černého.
4. Rozhodnutí: jít nahoru a doručit, nebo se vrátit na Kampu, kde čeká Kuřačka s loďkou na Vyšehrad. Loďka jede jen
   s důvěrou loďkařů, jinak Kuřačka pokrčí rameny a odjede.

### Vedlejší úkoly

- **Střídání stráže** (stráž): celý rok nejedli nic, co by nebylo z automatu. Donést jídlo od velvyslance nebo
  z tržiště. Odměna: řeknou, kdy chodí Kastelán, a jeden z nich na minutu nevidí, což je cesta pro Oko
  po Zámeckých schodech.
- **Quo vadis** (Trabant): najít ho (je slyšet, nevidět), sehnat směs, nenechat se kopnout. Odměna je přestup sám,
  plus jediná scéna ve hře, kde pošťačka řídí, a monolog o Černém.
- **Holubi ze Zámeckých schodů**: hlídají alternativní cestu k bráně. Boj, nebo Oko ve správnou chvíli, když je
  stráž krmí.

### Zastavení

Zdroj pravdy (polohy postav, přístupy, rekvizity) je `src/places/malastrana.js`, dialogy v `DIALOGS` v `src/script.js`, mapa `data/malastrana.json`.

| Zastavení | Poloha | Postava |
|---|---|---|
| Malostranské náměstí, start | pod chrámem sv. Mikuláše | vymahači |
| Dům U Dvou slunců | Nerudovka, horní část | paní z Nerudovky |
| Německé velvyslanectví | Vlašská, zahrada | Trabant, velvyslanec |
| Zámecké schody | mezi Nerudovkou a Hradem | holubi |
| Brána Ke Hradu | horní konec Nerudovky | stráž, Kastelán |
| Kampa, loďka | zpět dole, Čertovka | Kuřačka |

Přestup dál: Trabant na nohách nahoru na nádvoří, nebo Kastelán, nebo propustka; dolů loďka na Vyšehrad jako epilog.

## Nelinearita a návraty

Příběh není lineární. Přestupy jedou oběma směry (souprava metra tam i zpět, loďky po vodě, most a Mostecká pěšky)
a některé úkoly se bez návratu nedají dokončit:

- Hodinky pro výpravčího jsou na tržišti u Fanty; kdo odjede dřív, vrací se soupravou.
- Ozubené kolo pro Orlojníka má lovec značek; směs pro Trabant má Pilař na mostě; jídlo pro stráž je
  na tržišti nebo u velvyslance.
- Nabití zásilky na Kampě jde udělat i po návratu z Malé Strany, dokud hráčka nevstoupí na Hrad.
- Každé místo si pamatuje stav (vyčerpané volby, hotové úkoly, kdo co ví) a postavy na návrat reagují: Fanta ví,
  že pošťačka odmítla neteř, dispečerka ví, že byla u Admirála.
- Checkpoint se ukládá při každém příchodu na místo, i opakovaném.

## Místo 6: Hrad

Mapa: spíš ručně skládaný landmark než generátor. Věc k poznání: na Hradě se svítí, jediné světlo v Praze kromě
žárovky na Kampě. Uvnitř není vláda, je tam Kancelář kanálu: nastěhovala se na Hrad tu noc předtím, protože odtamtud
je na vodu nejlíp vidět. Na třetím nádvoří stojí stavební buňka metra E s jedinou čtečkou záznamníku štítu. Ve Zlaté
uličce jsou v domečcích uskladněné sochy z Karlova mostu, každá s cenovkou, kterou nikdo nezaplatí.

### Postavy

- **Ředitel Kanceláře kanálu**, ten, kdo nařídil razit dál. Ne zlý, jen přesvědčený. Kanál je dílo století a voda
  ve Starém Městě je přechodná fáze. Exprezidenta cituje líp než Admirál, protože ho znal osobně. Má generátor,
  ochranku a plán na druhou větev.
- **Průvodkyně**, postava, která se pamatuje. Celý rok provází zavřeným Hradem nikoho, v jedenáct a ve dvě. Pošťačku
  vezme jako první skupinu po roce: „Vlevo katedrála, vpravo konec světa, dotazy až na závěr.“
- **Ochranka kanálu**, dva muži v reflexních vestách Kanceláře. Poslední lidský boj, nebo Ústa: jsou placení
  v jízdenkách a rok nedostali výplatu.
- **Kastelán**, pokud přivedl pošťačku nahoru, vyjednává za tržiště.

### Hlavní linka a konce

1. Vstup na nádvoří: Trabantem, s Kastelánem, nebo s propustkou. Průvodkyně se ujme skupiny a provede ji ke stavební
   buňce. Cestou pátý útržek, ten poslední: štít stál dva dny, geologové psali, ředitel podepsal.
2. U čtečky se rozhodne, co se stane se zásilkou. Konec se počítá z toho, co se skutečně stalo (`state.trust`
   a stav zásilky), ne z poslední volby:
   - **Tržiště** (nejvyšší důvěra tržiště, nebo zásilku prodala na mostě): Kastelán a ředitel zaplatí, záznam zůstane
     v šuplíku, Hlavák má nový stánek a pošťačka 200 jízdenek a slevu. „Všechno je na prodej.“
   - **Metro** (nejvyšší důvěra metra a zásilka nabitá): čtečka záznam přehraje, dispečerčin rozhlas ho pustí na celou
     Prahu, ochranka si vezme výplatu a odejde, ředitelovi zhasne generátor. Souprava zase staví podle jízdního řádu.
     „Řád.“
   - **Metro bez důkazu** (důvěra metra, zásilka vybitá nebo pryč): čtečka mlčí, ředitel se usmívá, dispečerka
     pošťačku zapíše jako úřední osobu, která nic nedovezla. Varianta textu, ne čtvrtý konec.
   - **Loďkaři**: nedojde na Hrad vůbec. Z Malé Strany zpátky na Kampu, Kuřačka a loďka novým korytem kolem
     zlomeného Nuseláku na Vyšehrad. Admirál na skále, flotila pod ní, zásilku hodí do vody jako obětinu, nebo ji nechá
     jako bóji, když mu na Staromáku podstrčila falešnou a on to teprve teď zjistí. „Po vodě.“
   - **Smrt** kdekoli, s návratem na poslední místo.
3. Boj s ochrankou je jen tehdy, když hráčka jde za metrem a ředitel pochopí, co čtečka udělá. Ústa: nabídnout jim
   výplatu z vlastních jízdenek.

### Vedlejší úkol, jediný

- **Dotazy na závěr** (průvodkyně): odpovědět na tři otázky o tom, jak to v Praze chodí teď, na které hráčka zná odpověď jen z toho,
  co cestou viděla (Orloj, kůň, Nepomucký). Odměna: průvodkyně otevře vyhlídku a hra ukáže nové koryto celé,
  od Hlaváku po Vyšehrad, jako poslední obrázek před koncem. Volba „Dívat se“ pustí panoráma `cs_opys`: suché koryto
  s Karlovým mostem, nové koryto přes Staré Město, zlomený Nuselák s lanem přes mezeru (na Pankrác se chodí po laně),
  Vyšehrad s ohni loďkařů a ležící Žižkovská věž.

### Svah

Hrad stojí na ostrohu. Jelení příkop za ním i zahrady k Malé Straně před ním jsou svah se sutí, kam se nedá chodit:
z hrany visí rozpadlá opěrná zeď hradeb nad skálou, níž jsou zbořené terasy zahrad, balvany, kvádry a kusy
balustrády. Dolů vede jen Jiřská a Na Opyši k vyhlídce na konci rampy.

### Zastavení

Zdroj pravdy (polohy postav, přístupy, rekvizity) je `src/places/hrad.js`, dialogy v `DIALOGS` v `src/script.js`, mapa `data/hrad.json`.

| Zastavení | Poloha | Postava |
|---|---|---|
| První nádvoří, start | Matyášova brána | Trabant / Kastelán / stráž |
| Katedrála | třetí nádvoří, průčelí | průvodkyně |
| Stavební buňka metra E | třetí nádvoří, u Obelisku | čtečka, ředitel, ochranka |
| Zlatá ulička | sklad soch | Kastelán |
| Vyhlídka | Na Opyši, konec rampy nad svahem | průvodkyně, panoráma se zlomeným Nuselákem |

## Epilog: Vyšehrad

Flotila se nalodí v Nuslích (místo Nuselák) a odjíždí kolem skály: Vyšehradská skála se světly loďkařů, Admirálův
proslov a titulek „Po vodě“. Vyšehrad sám je obrázek a text, ne mapa.

## Útržky příčiny (pořadí, v jakém je hráčka může posbírat)

1. Kuřačka na vodě: „největší vodní dílo od Zemana“.
2. Potápěčka: voda přišla ze západu tunelem, který na mapě metra není.
3. Most: sochy kupuje Hrad, někdo nahoře má na všechno.
4. Paní z Nerudovky: kolona Kanceláře kanálu tu noc předtím, ráno zavřený Hrad.
5. Průvodkyně: štít stál dva dny, geologové psali, ředitel podepsal.
6. Strážmistr v Nuslích: protokol o praskající troubě mostu, Kancelář kanálu: VYŘÍZENO.
7. Souprava metra C v Nuseláku: pokyn Kanceláře kanálu provoz nezastavovat, 14.37.

## Boje (5–8 za hru, většinu jde obejít)

Psi ze Sherwoodu (Hlavák), nutrie na reproduktoru (Václavák), nutrie ve výloze (Staromák), kanci z Kampy, vymahači
na Malostranském náměstí (jen po odmítnutí neteře), holubi ze Zámeckých schodů, ochranka kanálu (jen v metro konci).
Zbraně: plácačka výpravčího, hák lovce značek, kabát z Pařížské jako brnění, sáhnutí na Nepomuckého jako hod navíc.
