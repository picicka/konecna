---
name: hlasy
description: Hlasy postav a hlídání opakované nálady v textech hry Konečná (src/script.js). Použij při psaní nebo úpravě jakékoli repliky, popisu, filmečku, konce nebo hlášky ve hře, při přidání nové postavy a při kontrole, jestli texty dávají smysl a neopakují se.
---

# Hlasy postav

Hra má jednoho vypravěče se suchým humorem. Když tím hlasem mluví i všechny postavy, hra zní jako jeden člověk
s pětadvaceti kostýmy. Každá postava proto má vlastní hlas (tabulka níž) a suchá pointa je vyhrazená vypravěči
a pár postavám, kterým patří.

## Pravidla

1. **Jedna pointa na rozhovor, ne na repliku.** Stavba „věcná věta, pak věta, která ji shodí“ („Žádný nemám, ale
   zapíšu.“, „Teda někdy.“) smí zaznít nejvýš jednou za celý rozhovor s postavou a jen u postav, které ji mají
   v kartě. Ostatní mluví vážně a vtipná je situace, ne jejich věta.
2. **Každá postava má jednu emoci, která není ironie** (strach, něha, zlost, stesk, nadšení, únava) a aspoň jedna
   její replika ji ukáže naplno.
3. **Gag smí zaznít dvakrát:** poprvé a jednou jako ozvěna jinde. Třetí výskyt se přepíše. Výjimkou je úmyslná
   linka s pointou na konci (motor napotřetí → „tradice“ u Admirála); ta má limit ve skriptu.
4. **„Rok“ není pointa.** Že něco trvá rok, ví hráčka z úvodu. Místo „rok nepřišel“ konkrétní věc: „chodil
   patnáctého“, „automat je skoro prázdný“, „telefon zvedám každé ráno“.
5. **Zvířata se nechovají jako uražení lidé.** „Dělá, že vás nevidí“ a „uraženě“ patří jen nutrii u reproduktoru.
   Ostatní zvířata něco udělají (odletí, odkulhají, zavrtají se).
6. **Postava s tváří mluví přímo.** Uvozovky a „řekne Kuřačka“ jsou jen u zastavení bez tváře (zvířata, věci,
   místa) a ve filmečcích. Popis děje uvnitř repliky postavy jen tam, kde se bez něj neobejde účinek volby.
7. **Příčina se neříká.** Kdo, co a proč zazní celé až na Hradě (průvodkyně, ředitel, čtečka). Dřív jen útržky
   podle `docs/pribeh.md` (sekce Útržky příčiny) a každý útržek řekne jednu věc, ne celý řetěz. Skupiny mluví svým
   slovem: Metro „mimořádná událost“, Loďkaři „velká voda“, Tržiště „krach“.
8. **Uvítací věta (`say` uzlu `hub`) musí platit v každém stavu,** ve kterém se do uzlu dá vrátit. Když úkol mění
   svět (kolo se točí, hodiny jdou), má stav po něm vlastní uzel nebo podmínku u volby.
9. Hrdinka je žena, vyká se jí, texty mají literální pevné mezery (skill `typografie`).

## Karty hlasů

| Postava | Jak mluví | Emoce mimo ironii | Pointy |
|---|---|---|---|
| Strojvedoucí | rozkazy, věty do šesti slov, spisovně | strach ze tmy v tunelu | ne |
| Pan Fanta | obecná čeština, rozmáchlý, prodává každou větou | chamtivá radost | ano, on je komik Hlaváku |
| Výpravčí | doslovně a úředně, hlásí i to, co cítí | smutek, vděčnost | ne |
| Trafikantka | upovídaná, starostlivá, „paní pošťačko“ | starost o druhé | zřídka |
| Robin | chvastoun, obecná čeština | pýcha na psy | ano |
| Dispečerka | řeč rozhlasu, trpný rod; mimo roli unavená a prosí | únava, víra v zápis | ne |
| Václav na směny | brblá, šeptá drby, bolí ho nohy | únava | ano |
| Revizor | suchý úřední, k hrdince rozpačitě něžný | něha po dvaceti letech přes sklo | jedna |
| Bufetářka | řeč od pultu: „Další!“, výčty zboží, věty bez sloves | stesk po frontě, která spěchala | ne |
| Kuřačka | úsečná, obecná čeština, věty o třech slovech | klid, občas závist | ano, krátké |
| Strážmistr Kulhánek | služební fráze, které se mu rozpadají v půlce | samota, něha ke koťatům | ne |
| Lanař | nadšenec, reklamní hesla, vykřičníky | nadšení z výšky | ano |
| Kormidelník | málomluvný, mluví o vodě a lachtanech | klid | ne |
| Admirál | patos, vykřičníky, citáty z paměti | zbožná úcta ke kanálu | patos místo point |
| Orlojník | nervózní, šeptá, počítá minuty, skáče si do řeči | úzkost z času | ne |
| Lovec značek | prodavač z butiku, „originál“ | hrdost na zboží | ano |
| Potápěčka | zadýchaná, věcná, krátké věty | zlost na Kancelář | ne |
| Pilař | hrubý, obecná čeština, mluví o práci | nic mu není svaté, jen pila | ano, suché |
| Fantova neteř | hladká, obchodní, chladná | ctižádost | ano, chladné |
| Hlídač Nepomuckého | prostý, pověrčivý, obecná čeština | opravdu věří | ne |
| Mlynář | o proudu jako o Bohu, o žárovce „ona“ | dojetí | ne |
| Paní z Nerudovky | vřelá, rozvláčná, odbíhá, „holka“ | vřelost, stesk po synovi | ne |
| Velvyslanec | obřadně zdvořilý | stesk po domově | smutné, ne vtipné |
| Hradní stráž | vyděšení kluci, vypadávají z role | strach a hlad | ne |
| Kastelán | spěchá, povýšený, „pan ředitel“ | netrpělivost | ne |
| Průvodkyně | nacvičený výklad, veselost na hraně zhroucení | samota | ano, z výkladu |
| Ochranka | otrávení, mluví jako odboráři | únava | ano |
| Ředitel | hladký jazyk tiskových zpráv, žádný vtip | přesvědčení | nikdy |
| Kočka Šklíba (strom na Václaváku a podruhé na Hradě, kde komentuje rozhodnutí hrdinky; bublina po klepnutí) | tyká, klidně a pobaveně, hádankou; vždycky měří lidi psem | klid toho, kdo může kdykoli zmizet | ano, jedna na hlášku |
| Trabant | řve z výfuku, nadává | vztek | ano |
| Voříšek (ruch, bublina po klepnutí) | obecná čeština, tyká, mluví jako člověk, který má odehrát psa a nejde mu to | strach z bouřky | ano, on je gag; po každé větě odběhne |
| Vypravěč (popisy, filmečky, věci) | suchý, věcný, krátké věty | – | ano, tady je doma |

Nová postava dostane řádek v tabulce dřív, než dostane první repliku. Když se její hlas dá zaměnit s jiným
řádkem, není hotová.

## Postup

1. Před psaním si přečti kartu postavy a její stávající repliky v `DIALOGS`.
2. Piš do `src/script.js`; drž `id`, podmínky a účinky, mění se jen texty. Popisky voleb (`label`) hledá průchod
   `tests/run.mjs` podle textu, takže po změně popisku oprav i průchod.
3. `npm run opakovani` (`scripts/opakovani.mjs`): sledované obraty s limitem, spojení ve třech a více replikách
   a chybějící pevné mezery. `-v` vypíše místa. Nový gag, který se začne množit, přidej do `WATCH` ve skriptu.
   Spojení, která jsou jména, místa a mechanika („loďka u Karlovy“, „výpis z evidence“), jsou v pořádku; hledej
   mezi nimi obraty a pointy.
4. Kontrola smyslu: platí uvítací věta ve všech stavech? Ví postava to, co říká (průvodkyně nezná trafikantku)?
   Má hrdinka věc, o které se mluví? Sedí časy (14:37 odpoledne, 412 dní) a místa s mapou?
5. `npm run tree`, pak nabídnout `npm test -- --misto <místo>` a po změně podmínek i `npm run slepe -- --misto <místo>`.
