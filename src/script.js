// Všechny texty pro hráčku na jednom místě, s literálními pevnými mezerami (U+00A0) podle české typografie.
// Do scén se texty nepíšou. Kontrola proti mapě a rodu (hrdinka = žena) je pravidelný krok, ne jednorázová oprava.
// Zatím jen kostra: titulek, lišta, úvodní filmeček a konce; dialogy míst přijdou s krokem 2 plánu (Hlavák).

export const TITLE = {
    name: 'KONEČNÁ',
    subtitle: 'Nevystupovat.',
    loading: 'NAČÍTÁM PRAHU…',
    start: 'Vystoupit',
    resume: 'Pokračovat z posledního místa',
    hint: 'Klepnutím nebo šipkami chodíte, Enter potvrdí, čísla vybírají. Q deník, T taška, M mapa.',
    // Zdroje dat mapy: licence OpenStreetMap (ODbL) i ČÚZK (CC BY 4.0) vyžadují uvedení.
    credits: 'Mapa: © přispěvatelé OpenStreetMap (ODbL) · výšky domů a střechy: © ČÚZK, DMP 1G a ortofoto (CC BY 4.0)',
};

export const HUD = {
    next: 'Dál',
    skip: 'Přeskočit',
    close: 'Zavřít',
    quests: 'Deník',
    bag: 'Taška',
    map: 'Mapa',
    tickets: 'jízdenek',
    hp: 'ŽIVOTY',
    level: 'ÚROVEŇ',
    hero: 'POŠŤAČKA',
    places: { hlavak: 'HLAVÁK', vaclavak: 'VÁCLAVÁK', staromak: 'STAROMÁK', most: 'KARLŮV MOST', malastrana: 'MALÁ STRANA', hrad: 'HRAD' },
    mapCredit: '© OpenStreetMap, ČÚZK',
    leave: 'Odejít.',
    inHand: 'v ruce',
    levelUp: 'ÚROVEŇ',
    levelPrompt: 'Cesta vás něco naučila. Co si z ní vezmete?',
    newItem: 'V tašce:',
    lostItem: 'Z tašky:',
    questUpdate: 'Deník:',
    weapon: 'Zbraň:',
    equipped: 'Na sobě:',
    hurt: (n) => `−${n} ${n === 1 ? 'život' : n <= 4 ? 'životy' : 'životů'}`,
    healed: (n) => `+${n} ${n === 1 ? 'život' : n <= 4 ? 'životy' : 'životů'}`,
    trustUp: 'věří vám víc', trustDown: 'věří vám méně', perkOpen: 'Otevřelo se:', perkClosed: 'Zavřelo se:',
};

export const ATTRIBUTE_NAMES = { ruka: 'Ruka', usta: 'Ústa', oko: 'Oko' };
// Vlastnost má obrázek (art/chars.px.js) a krátké vysvětlení, k čemu je; obojí v deníku, při nové úrovni a v boji.
export const ATTRIBUTE_ICONS = { ruka: 'ico_ruka', usta: 'ico_usta', oko: 'ico_oko' };
export const ATTRIBUTE_INFO = {
    ruka: 'rvačka, páčení, šplhání, nošení těžkého',
    usta: 'přemlouvání, smlouvání, zastrašení',
    oko: 'všímavost, míření, najít cestu, uhnout',
};

// Zkouška vlastnosti: volba, která stojí na vlastnosti, se ukáže, i když hrdince chybí jeden bod, a vyjde jen s šancí
// (src/story.js). Požadavek je u volby (if.attr), nebo u lidí jejich vlastnost z karty (check: 'usta' → stats postavy).
// Nepovedený pokus něco stojí (cost) a znovu to jde zkusit, až má hrdinka tu vlastnost vyšší (nová úroveň, výbava).
export const CHECK = {
    // šance podle rozdílu: vlastnost hrdinky − požadavek
    chance: { '-1': 0.35, 0: 0.7 },
    cost: { ruka: { hurt: 2 }, oko: { hurt: 1 }, usta: {} },
    fail: {
        ruka: 'Nepovedlo se. Přecenila jste se a bolí to.',
        usta: 'Nepovedlo se. Tímhle jste si nepomohla, spíš naopak.',
        oko: 'Nepovedlo se. Přehlédla jste to a zakopla.',
    },
    retry: (name) => `Znovu to půjde zkusit, až budete mít ${name} víc.`,
};
// Karta postavy vedle rozhovoru: celá postava, skupina, vlastnosti (stats u DIALOGS) a kdo to je (about).
export const CARD = {
    hint: 'Volby s obrázkem se měří s těmito čísly. Vy proti nim:',
    use: { ruka: 'přetlačit, přeprat, odstrčit', usta: 'přemluvit, usmlouvat, zastrašit', oko: 'obelstít, proklouznout, ukrást' },
    you: 'vy',
    odds: (diff) => (diff >= 1 ? 'vyjde vždy' : diff === 0 ? 'vyjde na 70 %' : diff === -1 ? 'vyjde na 35 %' : 'nemáte šanci'),
};
// Tvorba postavy na začátku: kým byla pošťačka, než se to stalo; vybraná vlastnost dostane +1.
export const CREATE = {
    title: 'Kdo jste byla, než se to stalo?',
    intro: 'Dvacet let na poště. Něco vám z toho zůstalo. Vyberte, co umíte líp než ostatní: ta vlastnost bude mít o bod víc.',
    options: {
        ruka: 'Balíky do pátého patra bez výtahu. Unesu, vypáčím, vyšplhám, a když musím, i praštím.',
        usta: 'Dvacet let za přepážkou. Ukecám, usmlouvám, a když je třeba, i seřvu.',
        oko: 'Znám každou schránku a každou díru v plotě. Všimnu si, trefím se a uhnu.',
    },
    later: 'Další body přidáte s každou novou úrovní. Čísla postav uvidíte na jejich kartě, když s nimi mluvíte.',
};

// Skupiny Prahy a jak hrdince věří (state.trust). Důvěra otevírá a zavírá cesty: perks jsou výhody od prahu
// důvěry (volby s podmínkou trust v DIALOGS) a konec hry vybírá skupina, která věří nejvíc. V deníku se skupina ukáže,
// až hrdinka někoho z ní potká (members), a co chce, až to zjistí (want.flag, stačí jedna z vlajek).
export const FACTIONS = {
    title: 'Kdo vám věří',
    intro: 'Kdo vám věří, pomůže. Kdo ne, zavře dveře. A komu nakonec dáte krabičku, tak Praha dopadne.',
    unknown: 'Zatím vás nikdo nezná.',
    metLabel: 'Znáte:',
    nextLabel: 'Když vám budou věřit víc:',
    wantUnknown: 'Co chtějí s krabičkou, zatím nevíte.',
    levels: [[-99, 'nevěří vám'], [0, 'zatím vás neznají'], [1, 'trochu vám věří'], [2, 'věří vám'], [4, 'berou vás za svou']],
    list: {
        trziste: { name: 'Tržiště', members: [['pan Fanta', 'fanta_met'], ['Fantova neteř', 'met_netere'], ['vymahači', 'met_vymahaci']],
            want: { flag: ['robin_tajemstvi', 'met_netere'], text: 'Fanta prodal krabičku dvakrát, Hradu a Admirálovi. Dostane ji, kdo dá víc.' },
            perks: [[2, 'Kastelán vás vezme na Hrad jako zboží pana Fanty.'], [3, 'Neteř dá za krabičku čtyři sta a vymahači vás nechají být.']] },
        metro: { name: 'Metro', members: [['strojvedoucí', 'met_strojvedouci'], ['dispečerka', 'met_dispecerka'], ['revizor', 'met_revizor'], ['potápěčka', 'met_potapecka']],
            want: { flag: ['zapsano', 'odmitla', 'utrzek2'], text: 'V krabičce je záznam jejich razicího štítu. Chtějí ho pustit lidem do rozhlasu.' },
            perks: [[2, 'Revizor vás pustí na molo a souprava vás sveze zpátky zadarmo.'], [4, 'Hradní stráž pustí každého, za koho ručí metro.']] },
        lodkari: { name: 'Loďkaři', members: [['Kuřačka', 'met_kuracka'], ['Admirál', 'met_admiral'], ['Pilař', 'met_pilar']],
            want: { flag: 'admiral_videl', text: 'Admirál má na krabičku zálohu. Chce ji hodit do proudu jako oběť kanálu.' },
            perks: [[0, 'Loďky vás vozí (kdo loďkaře naštve, jde pěšky).'], [2, 'Admirál vás pustí na most i bez krabičky a Pilař dá benzín zadarmo.']] },
        hrad: { name: 'Kancelář kanálu', members: [['ředitel', 'met_reditel'], ['Kastelán', 'met_kastelan'], ['ochranka', 'met_ochranka']],
            want: { flag: 'met_reditel', text: 'Kanál podepsali oni. Záznam z krabičky nesmí slyšet nikdo.' } },
    },
};

// Měna: jízdenky na 90 minut. Skloňování podle počtu.
export const tickets = (n) => `${n} ${n === 1 ? 'jízdenka' : n >= 2 && n <= 4 ? 'jízdenky' : 'jízdenek'}`;

export const QUEST = {
    title: 'DENÍK',
    hero: 'HRDINKA',
    itemsTitle: 'V tašce',
    questsTitle: 'Úkoly',
    done: 'Hotovo:',
    empty: 'Zatím nic. Jen vlastní krk.',
    noItems: 'Prázdná taška. Pošťačka bez pošty.',
    bagHint: 'Výbava, zásoby a co dávají: Taška (T).',
};

// Úvodní filmeček: obrázky z art/scenes.px.js (cs_*), repliky se píšou po písmenech. Kostra, texty k rozstřílení.
export const CUTSCENES = {
    intro: [
        { image: 'cs_city', lines: [
            'Praha. Rok po tom, co se stalo.',
            'Pošťačka z Jindřišské roznáší dál. Nikdo jí neřekl, že nemá. V tašce má jediný dopis, nedoručený od toho dne, pro výpravčího z Hlavního nádraží.',
            'Vltava teče jinudy, Nuselák je na dva kusy a na Hradě se svítí. O tom, kdo tam sedí, se mluví jen potichu.',
        ] },
        { image: 'cs_city', lines: [
            'Praha se rozpadla na tři tábory. Pan Fanta a jeho tržiště prodají všechno, i to, co nemají. Metro drží řád, jízdenky a evidenci. Loďkaři vládnou vodě na Starém Městě.',
            'Každý z nich bude chtít to, co ponesete. Kdo vám věří a co z toho máte, uvidíte v deníku.',
        ] },
        { image: 'cs_metro', toll: true, lines: [
            'V metru jezdí jediná souprava. Strojvedoucí ji řídí ručně a staví, kde se mu zachce.',
            '„Konečná. Nevystupovat.“',
            'Vystoupíte.',
        ] },
    ],
    // Přestupy: souprava metra mezi Hlavákem a Václavákem.
    metro_vaclavak: [
        { image: 'cs_metro', toll: true, lines: [
            'Souprava se rozjede. Tma, rachot, pak brzdy.',
            'Zastaví mezi stanicemi. „Konečná. Nevystupovat.“',
            'Strojvedoucí otevře nouzový výlez. Nahoře je Muzeum. Dolní půlka Václaváku je pod vodou.',
        ] },
    ],
    // Přestupy po vodě a pěšky: klíč cesta_<odkud>_<kam> (WorldScene.travel), jinak metro_<kam>.
    cesta_vaclavak_staromak: [
        { image: 'cs_voda', lines: [
            'Kuřačka nastartuje napotřetí. Loďka se protáhne z Můstku do Melantrichovy, mezi zatopenými výlohami a lucernami, které čouhají z vody.',
            'Okna přízemí jsou pod vodou, v prvním patře visí prádlo. Z vody trčí sloup tramvajového vedení.',
            'Kuřačka kormidluje jednou rukou a druhou kouří. Na Rytířské trčí z vody střecha tramvaje.',
        ] },
        { image: 'cs_staromak', lines: ['Staroměstské náměstí. Dvě věže Týna nad hladinou, Hus jako ostrov a na něm muž v záchranné vestě.'] },
    ],
    cesta_staromak_vaclavak: [
        { image: 'cs_voda', lines: ['Loďka pluje zpátky Melantrichovou. Kuřačka mlčí a kouří. Na Můstku čeká molo.'] },
    ],
    cesta_staromak_most: [
        { image: 'cs_most', lines: [
            'Karlova ulice končí u Křižovníků a voda končí s ní. Dál je bahno.',
            'Karlův most stojí nad suchým korytem. Pod oblouky chodí lidi, na podstavcích soch visí cenovky.',
            'Na Hradě se svítí.',
        ] },
    ],
    cesta_most_staromak: [
        { image: 'cs_voda', lines: ['Pilařova loďka, na přídi ruka svaté Luitgardy, pluje Karlovou zpátky ke Klementinu.'] },
    ],
    cesta_most_malastrana: [
        { image: 'cs_malastrana', lines: [
            'Mostecká. Malá Strana je suchá a stojí, jak stála. Po zatopeném Starém Městě je to skoro k pláči.',
            'Nahoře nad Nerudovkou stojí hradní stráž. Někde v uličkách dupe zlatý trabant na nohách a nadává.',
        ] },
    ],
    cesta_malastrana_most: [
        { image: 'cs_most', lines: ['Mosteckou dolů. Pod věží suché koryto, vpravo Kampa a mlýn.'] },
    ],
    cesta_malastrana_hrad: [
        { image: 'cs_hrad', lines: [
            'Hrad. Svítí se tu. Generátor duní přes všechna nádvoří a nafta do něj teče z celé Prahy.',
            'Na třetím nádvoří stojí stavební buňka s nápisem Metro E. Uvnitř nesedí vláda, ale Kancelář kanálu.',
        ] },
    ],
    metro_hlavak: [
        { image: 'cs_metro', lines: [
            'Souprava čeká ve tmě, jako by věděla, že přijdete.',
            'Jede zpátky. Zastaví na Hlavním nádraží, protože to tak chce strojvedoucí, ne jízdní řád.',
        ] },
    ],
};

// Konce: shots jsou snímky filmečku před závěrečnou obrazovkou (title, text). Který konec, se počítá ze stavu
// (resolveEnding v src/state.js), ne z poslední volby. Po konci následují snímky EPILOG podle toho, co hráčka udělala.
export const ENDINGS = {
    trziste: { title: 'Všechno je na prodej', text: 'Zásilka změnila majitele. Hlavák má nový stánek a vy slevu.',
        shots: [{ image: 'cs_hrad', lines: ['Krabička zmizí v šuplíku ředitelova stolu. Šuplík cvakne jako pokladna.', 'Fanta má, co chtěl, ředitel má, co chtěl, a vy máte jízdenky a u Fanty slevu.', 'Záznam zůstane v šuplíku. Kanál se kope dál. Ředitel už plánuje druhou větev.'] }] },
    metro: { title: 'Řád', text: 'Souprava zase staví podle jízdního řádu. Na Hradě se přestalo svítit.',
        shots: [{ image: 'cs_ctecka', lines: ['Zelená obrazovka naskočí. Ze všech reproduktorů metra, které ještě fungují, se ozve hlas: „Štít stojí. Geologové hlásí vodu. Pokyn z Kanceláře kanálu: razit dál. Podepsáno.“', 'Dispečerka to pustí znovu. A znovu. Slyší to celá Praha, tedy od Muzea po Můstek.'] },
            { image: 'cs_hrad', lines: ['Ochranka odejde, zase bez výplaty. Řediteli dojde v generátoru nafta a nikdo mu nepřinese novou.', 'Souprava zase staví podle jízdního řádu. Ve 14:37, každý den.'] }] },
    metro_bez: { title: 'Řád bez důkazu', text: 'Čtečka mlčí, ředitel se usmívá. Metro má řád, ale ne důkaz.',
        shots: [{ image: 'cs_ctecka', lines: ['Obrazovka zabliká a zhasne. Krabička je vybitá, nebo podvržená, nebo v ní nikdy nic nebylo.', 'Ředitel se usmívá. „Vidíte? Nic tam není. Nikdy nic nebylo.“', 'Dispečerka vás zapíše jako úřední osobu, která nic nedovezla. I to je zápis.'] }] },
    lodkari: { title: 'Po vodě', text: 'Z loďky je vidět zlomený Nuselák. Vyšehrad svítí. Praha je najednou docela malá.',
        shots: [{ image: 'cs_vysehrad', lines: ['Pilař vede loďku novým korytem kolem Výtoně až k Vyšehradu.', 'Nuselák visí nad vodou na dva kusy. Pod skálou kotví flotila a Admirál má proslov o díle století.', 'Pak hodí krabičku do proudu. Oběť kanálu. Voda ji vezme bez poděkování.'] }] },
    death: { title: 'Konečná', text: 'Praha si vás nechala. Někdo si vezme boty, někdo zásilku.', shots: [] },
    again: 'Hrát znovu',
    resume: 'Zpátky na poslední místo',
};

// Epilog ve stylu Falloutu: po konci snímek za každé místo, kde hráčka něco změnila (podmínka nad stavem).
export const EPILOG = [
    { if: { flag: 'podstrcila' }, ending: 'lodkari', image: 'cs_vysehrad', line: 'Krabička nejde ke dnu. Je prázdná, a tak plave. Admirál na ni zírá a flotila poprvé mlčí. Od té doby se jí říká bóje Kanceláře kanálu.' },
    { if: { quest: { hodiny: 'done' } }, image: 'cs_metro', line: 'Na Hlaváku jdou hodiny. Výpravčí každý den ve 14:37 zvedne ruku, i když nemá plácačku. Souprava jede.' },
    { if: { flag: 'psi_ok' }, image: 'cs_city', line: 'Robinovi psi chodí s ním na tržiště. Fanta jim dává guláš a tvrdí, že jsou jeho.' },
    { if: { quest: { rozhlas: 'done' } }, image: 'cs_city', line: 'Reproduktor u Jindřišské řve až k vodě. Dispečerka hlásí i počasí. Nikdo neví, odkud ho bere.' },
    { if: { quest: { kun: 'done' } }, image: 'cs_city', line: 'Václav z podstavce slezl dolů a vodí prohlídky po střechách. Jízdenka do přilby.' },
    { if: { flag: 'apostolove' }, image: 'cs_staromak', line: 'Na orloji zase vycházejí apoštolové, mokří, ale celí. Orlojník prodává přesný čas. Turisté nejsou, kupují ho loďkaři.' },
    { if: { flag: 'zarovka' }, image: 'cs_most', line: 'Žárovka na Kampě svítí každou noc. Pod mostem se k ní chodí jako k ohni. Na zdi stojí jediné slovo: PROUD.' },
    { if: { flag: 'trabantem' }, image: 'cs_malastrana', line: 'Trabant na nohách chodí každý den po Nerudovce nahoru a dolů a nadává na Černého. Benzínu má dost.' },
    { if: { flag: 'duchod_zeptala' }, image: 'cs_city', line: 'Trafikantce přišel dopis z Hradu. Důchod ne, jen odpověď. Nosí ji v igelitce s jízdenkami.' },
    { if: { flag: 'vyhlidka' }, image: 'cs_vysehrad', line: 'Z vyhlídky Na Opyši je vidět celé nové koryto. Průvodkyně tam vodí všechny skupiny. Zatím přišla jedna.' },
];


// Předměty v tašce: jméno a popis. Výbava má slot (zbran, odev, talisman) a dává k vlastnostem (bonus), životům (hp)
// nebo úderu (weapon); v každém slotu je nejvýš jedna věc. Zásoby mají use (heal) a počítají se kusy (state.supplies).
// Kde se co sežene, je v DIALOGS (obchody za jízdenky) a v BATTLES (loot po výhře).
export const ITEMS = {
    dopis: { name: 'Dopis pro výpravčího', text: 'Nedoručený od toho dne. Adresát: výpravčí, Hlavní nádraží. Obálka Českých drah.' },
    zasilka: { name: 'Krabička od Fanty', text: 'Velká jako powerbank, těžká jako svědomí. Co je uvnitř, Fanta neřekl.' },
    hodinky: { name: 'Hodinky z tržiště', text: 'Jdou. Na Hlaváku nejvzácnější zboží.' },
    lahev: { name: 'Lahev slivovice', text: 'Z tržiště. Robin ji pozná po zátce.' },
    vypis: { name: 'Výpis z evidence', text: 'S razítkem metra: náklad zapsán, osoba prověřena.' },
    falesna: { name: 'Krabička od lovce značek', text: 'Vypadá přesně jako zásilka. Je prázdná. Prázdné věci jsou nejbezpečnější.' },
    kolo: { name: 'Ozubené kolo', text: 'Malé, švýcarské, z hodinek z butiku. Pro Orlojníka.' },
    smes: { name: 'Benzínová směs', text: 'Jedna ku pětadvaceti, do pily. Nebo do trabantu na nohách.' },
    desticka: { name: 'Destička pro štěstí', text: 'Bronzová, osahaná do lesku. Patří k Nepomuckému.' },
    propustka: { name: 'Diplomatická propustka', text: 'Razítko státu, který se rok neozval. Stráž salutuje.' },
    jidlo: { name: 'Kanapky z recepce', text: 'Rok staré, diplomatické. Nezkazí se, jen ztvrdnou.' },
    // zbraně
    placacka: { name: 'Plácačka výpravčího', text: 'Zelenobílý terč na tyči. V ruce pošťačky překvapivě účinný.', slot: 'zbran', weapon: 1 },
    trubka: { name: 'Olověná trubka', text: 'Z rozkopaného chodníku na Wilsonce. Těžká a poctivá.', slot: 'zbran', weapon: 2 },
    baseballka: { name: 'Baseballka s cenovkou', text: 'Po vymahači. Cenovka pana Fanty na ní pořád visí.', slot: 'zbran', weapon: 3 },
    // oděv
    kabat: { name: 'Kabát z Pařížské', text: 'Značkový originál z výlohy. Nasáklý, ale teplý.', slot: 'odev', hp: 2 },
    vesta: { name: 'Reflexní vesta', text: 'Oranžová, na zádech DOZOR. S tím, kdo ji má na sobě, se lidi nehádají.', slot: 'odev', hp: 1, bonus: { usta: 1 } },
    neopren: { name: 'Neopren', text: 'Potápěččin náhradní. Studí, ale chrání a ve vodě se v něm dá vydržet.', slot: 'odev', hp: 3 },
    // talismany
    bryle: { name: 'Brýle bez nožičky', text: 'Dioptrie sedí skoro přesně. Najednou vidíte i díry v plotech.', slot: 'talisman', bonus: { oko: 1 } },
    rukavice: { name: 'Pracovní rukavice', text: 'Pilařovy záložní. Chytíte s nimi i rezavou mříž.', slot: 'talisman', bonus: { ruka: 1 } },
    pistalka: { name: 'Píšťalka dispečerky', text: 'Když zapískáte, všichni na chvíli zmlknou a poslouchají vás.', slot: 'talisman', bonus: { usta: 1 } },
    // zásoby
    obvaz: { name: 'Obvaz', text: 'Z lékárničky v tramvaji. Sterilní byl předtím.', use: { heal: 3 } },
    konzerva: { name: 'Konzerva', text: 'Lančmít ze státních hmotných rezerv. Datum radši nečíst.', use: { heal: 5 } },
    chleba: { name: 'Chleba z mlýna', text: 'Z mouky z Čertovky, upečený na plotně. Ještě teplý.', use: { heal: 6 } },
};
// Taška (T): výbava ve slotech, zásoby a věci. Řádek výbavy ukazuje, co věc dává.
export const BAG = {
    title: 'Taška', gear: 'Výbava', supplies: 'Zásoby', items: 'Věci', things: 'Výbava v tašce',
    tabs: { bag: 'Taška', quests: 'Úkoly', trust: 'Kdo vám věří' }, tabHint: 'Šipky doleva a doprava přepínají. Q deník, T taška, Esc zavře.', xp: (n) => `Do další úrovně: ${n} zkušeností`,
    slots: { zbran: 'Zbraň', odev: 'Oděv', talisman: 'Talisman' },
    empty: 'nic', noSupplies: 'Žádné zásoby. Obvazy a jídlo prodávají na tržišti a u stánků.', noThings: 'Nic dalšího.',
    use: 'Použít', worn: 'na sobě', wear: 'Vzít si', takeOff: 'Sundat', full: 'Životy máte plné.',
    weapon: (n) => `úder +${n}`, hp: (n) => `životy +${n}`, heal: (n) => `+${n} životů`,
    hint: 'Klepnutím si věc vezmete, nebo ji sundáte. Zásoby se dají použít i v boji.',
};

// Obchod: volba s shop: true otevře zboží postavy (DIALOGS[id].shop). Řádek ukazuje, co věc dělá a kolik stojí;
// na co nejsou jízdenky, je vidět, ale nejde koupit.
export const SHOP = {
    prompt: (n) => `Máte ${tickets(n)}. Co si vezmete?`,
    ware: (name, slot, stats) => `${name}${slot ? ` (${slot})` : ''}: ${stats}`,
    missing: (n) => `chybí ${n}`,
    leave: 'Nic, díky.',
    empty: 'Teď nemám nic, co byste potřebovala.',
};

// Úkoly: název a text kroku do deníku. Krok done je hotovo.
export const QUESTS = {
    vypoved: { title: 'Výpověď', steps: { nest: 'Doručit dopis výpravčímu na ostrovním peronu pod halou.', done: 'Doručeno. Výpravčí je rád, že pošta jede.' } },
    zakazka: { title: 'Zakázka pro Fantu', steps: { nabidka: 'Pan Fanta nahoře na magistrále má pro vás práci.', nest: 'Donést krabičku na Hrad. Dvě stě jízdenek při předání.', ztracena: 'Krabičku má Admirál. Na Hradě nebude co předat.', prodana: 'Krabičku koupila zpátky Fantova neteř.' } },
    odjezd: { title: 'Dál soupravou', steps: { nest: 'Strojvedoucí u vstupu do metra chce jízdenku a pravdu o tom, co vezete.', done: 'Souprava odjela. Kde zastaví, ví jen strojvedoucí.' } },
    hodiny: { title: 'Hodiny na nástupišti', steps: { nest: 'Sehnat něco, co jde (Fanta prodává hodinky), aby výpravčí mohl nařídit hodiny.', done: 'Hodiny jdou. Souprava jede ve 14:37 a kdo to ví, jezdí zadarmo.' } },
    psi: { title: 'Psi ze Sherwoodu', steps: { nest: 'Psi lezou do tunelu a strojvedoucí kvůli nim nevyjede. Porazit je, zahnat, zatarasit jim díru v plotě, nebo donést Robinovi něco dobrého od Fanty.', done: 'Psi dají pokoj a souprava může jet.' } },
    duchod: { title: 'Důchod', steps: { nest: 'Na Hradě se zeptat, kdy přijde důchod. Slíbila jste to trafikantce.' } },
    evidence: { title: 'Evidence', steps: { nest: 'Dispečerka u stanice Muzeum chce zásilku zapsat.', done: 'Zapsáno. Výpis z evidence je v tašce.', odmitnuto: 'Odmítla jste. Revizor u vody o tom ví.' } },
    rozhlas: { title: 'Rozhlas', steps: { nest: 'Zesílit reproduktor u Jindřišské. Sedí na něm nutrie.', hlasite: 'Reproduktor řve. Říct to dispečerce.', done: 'Dispečerka vás ohlásila jako úřední osobu.' } },
    kun: { title: 'Pravý kůň', steps: { nest: 'Zjistit, kam se poděla socha svatého Václava. Zeptat se dole u mola.', stopa: 'Sochy nakládá Kuřačka. Říct to Václavovi na podstavci.', done: 'Václav ukázal cestu po střechách kolem revizora.' } },
    molo: { title: 'K vodě', steps: { nest: 'Revizor u hladiny pouští na molo jen se zápisem z evidence, úřední osobu, nebo za jízdenky.', done: 'Cesta na molo je volná.' } },
    admiral: { title: 'Admirál', steps: { rucitele: 'Loďkaři za vás ručí. Admirál vás pustí na most i bez krabičky.',  nest: 'Admirál sedí na Husově pomníku. Kdo chce po vodě na Karlův most, musí za ním.', dala: 'Admirál má krabičku a chce ji obětovat kanálu. Loďka u Karlovy je vaše.', podstrceno: 'Admirál má prázdnou krabičku od lovce značek. Loďka u Karlovy je vaše.', odmitnuto: 'Admirál vás nepoveze. Na most leda po střechách Klementina, nebo když víte, kdy loďka zůstává bez dozoru.', ukecala: 'Admirál krabičku neviděl, a přesto vás poveze. Tradice.' } },
    apostolove: { title: 'Mokří apoštolové', steps: { nest: 'Orlojník potřebuje vytáhnout soukolí nad hladinu (Ruka), nebo ozubené kolo od lovce značek.', done: 'Apoštolové vycházejí. Admirálova loďka zůstává každou celou hodinu bez dozoru.' } },
    hak: { title: 'Hák v Pařížské', steps: { nest: 'Hák lovce značek uvízl ve výloze, kde hnízdí nutrie.', done: 'Lovec dal kabát a krabičku, která vypadá jako zásilka.' } },
    netere: { title: 'Galerie na mostě', steps: { nest: 'Fantova neteř chce zásilku koupit zpátky za tři sta jízdenek.', done: 'Zásilka je prodaná. Hrad už vás zajímá jen jako turistku.', odmitnuto: 'Odmítla jste. Na Malé Straně čekají kluci z tržiště.' } },
    desticka: { title: 'Destička pro štěstí', steps: { nest: 'Hlídač Nepomuckého přišel o destičku. Je prý v bednách Galerie.', done: 'Destička je zpátky. Máte štěstí v boji a víte, kdy se nikdo nedívá na Zámecké schody.' } },
    proud: { title: 'Proud', steps: { nest: 'Mlýnské kolo na Čertovce se zaseklo. Uvolnit ho (Ruka), nebo přehradit proud (Oko).', done: 'Kolo se točí, žárovka na Kampě svítí. Mlynář nabije, co je potřeba.' } },
    straz: { title: 'Střídání stráže', steps: { nest: 'Stráž u brány rok nejedla nic než z automatu.', done: 'Stráž dostala jídlo. V poledne se nikdo nedívá na Zámecké schody.' } },
    prohlidka: { title: 'Dotazy na závěr', steps: { nest: 'Průvodkyně má na závěr tři otázky o tom, jak to v Praze chodí teď.', done: 'Prohlídka skončila.' } },
    lodka: { title: 'Loďka na Staromák', steps: { nest: 'Kuřačka na konci mola vozí na Staromák za tři jízdenky.', done: 'Kuřačka vás dovezla ke schodům Týna.' } },
};

// Boje: nepřítel má životy (bere je Ruka) a vůli (berou ji Ústa); komu dojde jedno, nebo druhé, prohrál. Útok od–do,
// zvláštnost twice (útočí dvakrát) nebo dodge (uhýbá úderům). talk je popisek akce Úst proti tomuto nepříteli, win text
// po porážce a yield po ztrátě vůle, loot účinek po výhře (věc nebo zásoby); poražení zůstávají na mapě (dialog má uzel pro „po boji“). Mechanika: src/scenes/battle.js.
export const BATTLES = {
    psi: { name: 'Smečka ze Sherwoodu', sprite: 'dog', scale: 4, hp: 8, nerve: 6, attack: [1, 1], special: 'twice', talk: 'Zařvat na ně',
        intro: 'Tři psi vystoupí z křoví. Vůdce smečky má na krku Fantovu stužku.',
        hit: 'Pes chňapne.', twice: 'Druhý pes se přidá.', miss: 'Pes cvakne naprázdno.', hurt: 'Pes zakňučí.', shout: 'Psi stáhnou ocasy.',
        win: 'Vůdce si olízne tlapu a odkulhá k Robinovu ohni. Ostatní dva jdou za ním. Pěšina je volná.', yield: 'Psi couvnou a odklušou k Robinovu ohni. Vůdce se ještě ohlédne, ale už nevrčí.', flee: 'Couvnete. Psi štěkají, ale nejdou za vámi.' },
    nutrie: { name: 'Nutrie z Vltavy', sprite: 'nutrie', scale: 4, hp: 5, nerve: 4, attack: [1, 1], special: 'dodge', talk: 'Zasyčet na ni',
        intro: 'Nutrie se postaví na zadní a cení oranžové zuby. Je větší, než vypadala.',
        hit: 'Nutrie kousne.', miss: 'Nutrie syčí.', hurt: 'Nutrie zapiští.', dodge: 'Nutrie uskočí.', shout: 'Nutrie se přikrčí.',
        win: 'Nutrie sleze z reproduktoru a sedne si na kraj vody, uraženě.', yield: 'Nutrie sleze z reproduktoru a sedne si na kraj vody. Dívá se jinam.', flee: 'Ustoupíte. Nutrie si sedne zpátky na reproduktor.' },
    nutrie2: { name: 'Nutrie z výlohy', sprite: 'nutrie', scale: 4, hp: 8, nerve: 5, attack: [1, 2], special: 'twice', loot: { supply: { obvaz: 1 } }, talk: 'Zasyčet na ně',
        intro: 'Z hnízda kožichů vylezou dvě nutrie. Jedna má na krku hedvábný šátek.',
        hit: 'Nutrie kousne.', twice: 'Druhá nutrie se přidá.', miss: 'Nutrie syčí.', hurt: 'Nutrie zapiští.', shout: 'Nutrie couvnou do kožichů.',
        win: 'Nutrie se stáhnou do rohu výlohy a tváří se, že tam nikdy nebyly.', yield: 'Nutrie se zavrtají hlouběji do kašmíru a nechají hák hákem.', flee: 'Ustoupíte. Nutrie se zavrtají zpátky do kašmíru.' },
    kanci: { name: 'Kanci z Kampy', sprite: 'kanec', scale: 4, hp: 14, nerve: 8, attack: [2, 3], special: null, talk: 'Zařvat na ně',
        intro: 'Vůdce tlupy zafuní a sklopí kly. Za ním další dva, menší a stejně naštvaní.',
        hit: 'Kanec vás nabere.', miss: 'Kanec proletí kolem.', hurt: 'Kanec zakvičí.', shout: 'Kanec zaváhá.',
        win: 'Vůdce si lehne pod platan a funí. Ostatní ryjí dál a vás si nevšímají.', yield: 'Kanci ustoupí pod platany a ryjí dál. Cesta k mlýnu je volná.', flee: 'Utečete za platan. Kanci ryjí dál.' },
    vymahaci: { name: 'Tržištní vymahači', sprite: 'vymahac', scale: 4, hp: 13, nerve: 7, attack: [1, 2], special: 'twice', loot: { give: 'baseballka' }, talk: 'Domluvit jim',
        intro: 'Jeden vytáhne řetěz, druhý baseballku s Fantovou cenovkou. „Nic osobního.“',
        hit: 'Baseballka dopadne.', twice: 'Řetěz švihne.', miss: 'Vymahač se netrefí.', hurt: 'Vymahač zaklení.', shout: 'Vymahač se ohlédne po kolegovi.',
        win: 'Vymahači si sednou na schod morového sloupu a počítají zuby. „Panu Fantovi řekneme, že jste byla rychlá.“', yield: '„Nic osobního,“ řekne ten větší a schová řetěz. Sednou si k morovému sloupu. „Panu Fantovi řekneme, že jste byla rychlá.“', flee: 'Couvnete k mostu. Vymahači zůstávají u sloupu.' },
    holubi: { name: 'Holubi ze Zámeckých schodů', sprite: 'holub', scale: 4, hp: 6, nerve: 3, attack: [1, 1], special: 'dodge', talk: 'Mávnout taškou',
        intro: 'Hejno se zvedne. Kulhavý vůdce letí přímo na vás.',
        hit: 'Holub klovne.', miss: 'Holub mine.', hurt: 'Peří letí.', dodge: 'Holub uhne.', shout: 'Hejno zaváhá.',
        win: 'Holubi usednou na zídku a dělají, že vás nevidí.', yield: 'Hejno se přesune o schod výš a dělá, že vás nevidí.', flee: 'Couvnete. Holubi si sednou zpátky na schody.' },
    ochranka: { name: 'Ochranka kanálu', sprite: 'ochranka', scale: 4, hp: 16, nerve: 5, attack: [2, 3], loot: { supply: { obvaz: 2 } }, special: null, talk: 'Mluvit o výplatě',
        intro: 'Ochranka vytáhne obušky. „Rok bez výplaty a teď tohle.“',
        hit: 'Obušek dopadne.', miss: 'Ochranka mine.', hurt: 'Reflexní vesta se zmuchlá.', shout: 'Ochranka svěsí obušky.',
        win: 'Ochranka si sedne na schody buňky. „Za tohle nás neplatí. Za nic nás neplatí.“', yield: 'Ochranka si sedne na schody buňky a zapálí si. „Rok bez výplaty. Dělejte si, co chcete.“', flee: 'Ustoupíte. Ochranka se vrátí ke dveřím.' },
};
// Souboj: tlačítka s obrázkem vlastnosti a nápovědou, kolik to dává (počítá src/scenes/battle.js).
export const BATTLE = {
    attack: 'Udeřit', defend: 'Uhnout', flee: 'Utéct', bag: 'Taška',
    bagHint: (name, n, heal) => `${name} ×${n}, +${heal} životů`, bagEmpty: 'žádné zásoby', bagUsed: (name, n) => `${name}: +${n} životů.`,
    attackHint: (p, lo, hi) => `zásah ${p} %, zranění ${lo}–${hi}`,
    talkHint: (lo, hi) => `vůle −${lo}–${hi}`,
    defendHint: (p) => `uhnete na ${p} %, pak vrátíte ránu`,
    fleeHint: 'vždy, ale jednou to schytáte',
    you: 'Vy', hp: 'ŽIVOTY', nerve: 'VŮLE',
    help: 'Ruka bere životy, Ústa vůli. Komu dojde jedno, nebo druhé, prohrál. Oko pomáhá trefit se a uhnout. Taška: obvaz nebo jídlo místo tahu.',
    hit: 'Trefa za', miss: 'Vedle.', guard: 'Čekáte na útok.', counter: 'Uhnete a vrátíte to za', dodged: 'Uhnete.',
    shout: 'Vůle', fleeing: 'Otočíte se k útěku.', dead: 'Padáte do prachu.',
};

// Dialogy zastavení. Uzel: say (repliky postavy; poslední je zároveň otázkou nad volbami), again (kratší replika při
// návratu do uzlu), do (účinek při vstupu), choices. Volba: id, label (co řekne pošťačka), if (podmínka, jinak se
// volba nezobrazí), else (proč chybí, do stromu), once (jen jednou), do (účinky), reply (odpověď), next (uzel), end.
// Podmínky: item, noItem, flag, noFlag, quest {klíč: krok | [kroky]}, questNot, tickets (aspoň), poor (méně než),
// attr {atribut: aspoň}, trust/distrust, any [podmínky]; check: 'usta' = zkouška proti vlastnosti postavy (stats), fail a failReply
// = účinek a odpověď nepovedené zkoušky (jinak CHECK). Postava má stats (Ruka, Ústa, Oko) a about pro kartu.
// Účinky: give (výbava se sama nasadí do prázdného slotu), take, supply {zásoba: kusy}, tickets, trust, quest, flag, unflag, xp, heal, hurt,
// fight (klíč z BATTLES, po výhře win), travel (místo, filmeček metro_<místo>).
export const DIALOGS = {
    // —— Hlavák ——
    metro: { stats: { ruka: 2, usta: 2, oko: 2 }, about: 'Strojvedoucí jediné soupravy, co ještě jezdí. Staví, kde chce, a každého se ptá, co veze.', faction: 'metro', name: 'Strojvedoucí', face: 'face_strojvedouci',
        entry: [{ if: { noFlag: 'met_strojvedouci' }, node: 'prvni' }, { node: 'hub' }],
        nodes: {
            prvni: { say: ['Konečná. Nevystupovat.', 'A vy jste vystoupila. To se nedělá. Kdy se jede a kde se staví, určuju já.', 'Až budete chtít dál, ukážete jízdenku a řeknete mi, co vezete. Pravdu.'],
                do: { flag: 'met_strojvedouci', quest: { odjezd: 'nest' } }, next: 'hub' },
            hub: { say: ['Co je? Souprava stojí, dokud neřeknu, že jede.'], choices: [
                { id: 'jet', label: 'Chci jet dál.', if: { item: 'zasilka', flag: 'psi_ok' }, else: 'Bez nákladu strojvedoucí nevozí (zakázku dává Fanta) a dokud lezou psi do tunelu, nejede vůbec.', next: 'jizdenka' },
                { id: 'jet_psi', label: 'Chci jet dál.', if: { item: 'zasilka', noFlag: 'psi_ok' }, else: 'Jen dokud psi ze Sherwoodu lezou do tunelu.', do: { quest: { psi: 'nest' } }, reply: ['Nejede se. Psi ze Sherwoodu mi lezou dírou v plotě do tunelu. Minule prokousali kabel od brzdy a já stál dvě hodiny ve tmě.', 'Dokud je někdo nesrovná, souprava stojí. Robin říká, že jsou jeho. Tak ať si je vezme. Nebo to udělejte vy, jak umíte.'] },
                { id: 'jet_prazdna', label: 'Chci jet dál.', if: { noItem: 'zasilka' }, else: 'Jen když pošťačka nic neveze.', reply: ['Bez nákladu nevozím. Pošťačka, co nic neveze, je jen ženská v uniformě. Sežeňte si zásilku.'] },
                { id: 'kam', label: 'Kam jezdíte?', once: true, reply: ['Na Muzeum. Jedna stanice po céčku. Kde zastavím, tam vystoupíte.'] },
                { id: 'proc', label: 'Proč „Konečná. Nevystupovat“?', once: true, reply: ['Protože je to pravda. Konečná je teď všude. Kdo vystoupí, už nenastoupí. Vy jste výjimka. Zatím.'] },
            ] },
            jizdenka: { say: ['Jízdenku.'], choices: [
                { id: 'platim', label: 'Tady je jízdenka.', if: { tickets: 1 }, else: 'Chce to aspoň jednu jízdenku.', do: { tickets: -1 }, next: 'naklad' },
                { id: 'jizdni_rad', label: 'Vím, kdy doopravdy jedete. Ve 14:37.', if: { flag: 'jizdni_rad' }, else: 'Čas odjezdu zná jen výpravčí, až mu půjdou hodiny.', reply: ['…To vám řekl výpravčí. Dobře. Kdo zná jízdní řád, jezdí zadarmo. Předpisy.'], next: 'naklad' },
                { id: 'nemam', label: 'Nemám.', if: { poor: 1, noFlag: 'jizdni_rad' }, else: 'Jen bez jízdenky.', reply: ['Bez jízdenky nejezdí nikdo. Ani pošta. Trafikantka v parku vám poradí, Fanta zaplatí.'], end: true },
            ] },
            naklad: { say: ['A co vezete? Pravdu.'], choices: [
                { id: 'pravda', label: 'Krabičku od pana Fanty. Na Hrad. Co je uvnitř, nevím.', do: { trust: { metro: 1 }, flag: 'rekla_pravdu', quest: { odjezd: 'done' }, travel: 'vaclavak' }, reply: ['Fanta a Hrad. To nevěstí nic dobrého, ale je to pravda. Nastupte.'] },
                { id: 'lez', label: 'Jen dopisy. Nic, co by vás zajímalo.', do: { trust: { trziste: 1 }, flag: 'lhala', quest: { odjezd: 'done' }, travel: 'vaclavak' }, reply: ['Dopisy. Nikdo nepíše dopisy, ale budiž. Nastupte.'] },
                { id: 'tajemstvi', label: 'Listovní tajemství. Ze zákona.', check: 'usta', else: 'Odbýt strojvedoucího zákonem chce Ústa 2.', do: { quest: { odjezd: 'done' }, travel: 'vaclavak' }, reply: ['Zákon. To slovo jsem rok neslyšel. Nastupte, než si vzpomenu, že žádný není.'] },
            ] },
        } },
    trziste: { stats: { ruka: 2, usta: 3, oko: 2 }, about: 'Šéf tržiště ve Fantově budově. Prodá cokoli, i informaci o tom, kdo co prodal.', faction: 'trziste', name: 'Pan Fanta', face: 'face_fanta',
        shop: [
            { item: 'hodinky', price: 5, if: { noItem: 'hodinky', quest: { hodiny: 'nest' } }, reply: ['Švýcarský. Teda bejvaly. Hlavně že jdou. Kdo má čas, má všechno.'] },
            { item: 'lahev', price: 3, if: { noItem: 'lahev', noFlag: 'psi_ok' }, reply: ['Pro Robina, co? Neříkejte mu, že jste ji koupila. Rád si myslí, že mi ji krade.'] },
            { item: 'trubka', price: 8, if: { noItem: 'trubka' }, reply: ['Z Wilsonky, poctivý olovo. Na psy, na nutrie a na zákazníky, co nechtěj platit.'] },
            { item: 'vesta', price: 12, if: { noItem: 'vesta' }, reply: ['DOZOR. S vestou se s váma nikdo nehádá, každej si myslí, že kontrolujete zrovna jeho.'] },
            { item: 'konzerva', price: 5, reply: ['Lančmít ze státních hmotných rezerv. Stát zkrachoval, rezervy zůstaly. Od krachu je to nejlepší zboží na Hlaváku.'] },
        ],
        entry: [{ if: { noFlag: 'fanta_met' }, node: 'prvni' }, { node: 'hub' }],
        nodes: {
            prvni: { say: ['Pošta! Tak přece. Celej rok tady čekám, až mi někdo přinese složenku, abych ji mohl nezaplatit.', 'Budova je moje, jmenuje se po mně. Tržiště je taky moje. Všechno, co tu vidíte, je na prodej. I to, co nevidíte.', 'A vy jste přesně to, co potřebuju. Uniforma. Pošťačku nikdo nezastaví, každej doufá, že mu nese důchod.'],
                do: { flag: 'fanta_met', quest: { zakazka: 'nabidka' } }, next: 'nabidka' },
            nabidka: { say: ['Malá krabička, velká cesta. Na Hrad. Dvacet jízdenek hned, dvě stě při předání.'], choices: [
                { id: 'beru', label: 'Beru. Co v ní je?', if: { noItem: 'zasilka', questNot: { zakazka: 'nest' } }, else: 'Zakázku jde vzít jen jednou.', do: { give: 'zasilka', tickets: 20, quest: { zakazka: 'nest' }, trust: { trziste: 1 }, xp: 1 },
                    reply: ['Zásilka. Víc vědět nepotřebujete, víc vědět nechcete. Hlavně ji neotvírejte a nikomu neukazujte.', 'Do metra se jde dole na plácku. Strojvedoucí se bude ptát, co vezete. Řekněte mu cokoli, jen ne pravdu.'], next: 'hub' },
                { id: 'vic', label: 'Dvacet je málo. Třicet, nebo si to neste sám.', check: 'usta', if: { noItem: 'zasilka', questNot: { zakazka: 'nest' } }, else: 'Usmlouvat Fantu chce Ústa 3 (jako má on).', do: { give: 'zasilka', tickets: 30, quest: { zakazka: 'nest' }, trust: { trziste: 1 }, xp: 2 },
                    reply: ['Třicet. Vy byste prodala i vlastní uniformu. Beru vás.', 'Krabičku neotvírejte a nikomu neukazujte. Do metra se jde dole na plácku. Strojvedoucímu řekněte cokoli, jen ne pravdu.'], next: 'hub' },
                { id: 'pozdeji', label: 'Rozmyslím si to.', reply: ['Rozmýšlejte rychle. Na Hrad se nejezdí každý den. Vlastně se nejezdí vůbec.'], end: true },
            ] },
            hub: { say: ['Co si dáte? Všechno je na prodej.'], choices: [
                { id: 'zakazka', label: 'Ta zakázka na Hrad…', if: { noItem: 'zasilka', questNot: { zakazka: 'nest' } }, else: 'Jen dokud zakázku nemáte.', next: 'nabidka' },
                { id: 'obchod', label: 'Co máte na prodej?', shop: true },
                { id: 'co_prodavate', label: 'Co doopravdy prodáváte?', once: true, reply: ['Všechno. Víc je obchodní tajemství. A obchodní tajemství je taky na prodej, jen ne vám.'] },
                { id: 'dvakrat', label: 'Robin říká, že jste krabičku prodal dvakrát.', if: { flag: 'robin_tajemstvi' }, else: 'Až to řekne Robin.', once: true, do: { trust: { trziste: -1 } }, reply: ['Robin říká hodně věcí. Prodal jsem ji jednou. Podruhé jsem jen přijal zálohu.'] },
            ] },
        } },
    nastupiste: { stats: { ruka: 1, usta: 1, oko: 2 }, about: 'Hlásí vlaky, které nejedou. Chce jediné: aby nádražní hodiny zase šly.', name: 'Výpravčí', face: 'face_vypravci',
        entry: [{ if: { noFlag: 'met_vypravci' }, node: 'prvni' }, { node: 'hub' }],
        nodes: {
            prvni: { say: ['Rychlík Hungaria má zpoždění čtyři sta dvanáct dní. Cestující prosíme o shovívavost.'], do: { flag: 'met_vypravci' }, next: 'hub' },
            hub: { say: ['Prosím? Vlak nejede. Žádný.'], choices: [
                { id: 'dopis', label: 'Nesu vám dopis. Nedoručený od toho dne.', if: { item: 'dopis' }, else: 'Jen s dopisem v tašce.', do: { take: 'dopis', quest: { vypoved: 'done', hodiny: 'nest' }, xp: 2 },
                    reply: ['Ukažte… České dráhy. Výpověď, datovaná den předtím.', 'No vida. Tak aspoň že pošta jede.', 'Víte co? Hodiny tu stojí na 14:37. Od té chvíle nic nejede podle nich. Dokud nejdou, nemůžu nic vypravit. Sežeňte mi něco, co jde, a řeknu vám, kdy souprava doopravdy jede.'] },
                { id: 'hodinky', label: 'Tady máte hodinky. Jdou.', if: { item: 'hodinky', quest: { hodiny: 'nest' } }, else: 'Jen s hodinkami z tržiště.', do: { take: 'hodinky', quest: { hodiny: 'done' }, flag: 'jizdni_rad', give: 'placacka', xp: 3 },
                    reply: ['Jdou! Opravdu jdou. Hned podle nich nařídím hodiny.', 'Hodiny na nástupišti zase jdou. Poprvé za rok vím, kolik je.', 'Souprava jede každý den ve 14:37, tak to stojí v jízdním řádu. Strojvedoucí ho drží, jen to nepřizná. Řekněte mu to a sveze vás zadarmo. A vezměte si plácačku, já už nemám komu dávat znamení.'] },
                { id: 'natahnout', label: 'Vylezu na sloup a natáhnu je klikou.', if: { attr: { ruka: 2 }, quest: { hodiny: 'nest' } }, else: 'Natáhnout zarezlé hodiny chce Ruku 2.', do: { quest: { hodiny: 'done' }, flag: 'jizdni_rad', give: 'placacka', xp: 3 },
                    reply: ['Kliku rok nikdo neotočil. Povolí až napotřetí, s rachotem jako výhybka.', 'Jdou! Seřídím je podle slunce, to se nezastavilo.', 'Souprava jede každý den ve 14:37, tak to stojí v jízdním řádu. Strojvedoucí ho drží, jen to nepřizná. Řekněte mu to a sveze vás zadarmo. A vezměte si plácačku, já už nemám komu dávat znamení.'] },
                { id: 'hodiny', label: 'Proč stojí hodiny?', once: true, reply: ['Ve 14:37 to přišlo. Voda, ticho, pak tma. Od té doby nikdo nenatáhl ani je, ani mě.'] },
            ] },
        } },
    trafika: { stats: { ruka: 1, usta: 3, oko: 2 }, about: 'Prodávala jízdenky dvacet let, teď je jen počítá. Pořád čeká na důchod.', name: 'Trafikantka', face: 'face_trafikantka',
        shop: [
            { item: 'obvaz', price: 3, reply: ['Z tramvaje. Sterilní byl, když tramvaj ještě jezdila.'] },
            { item: 'bryle', price: 6, if: { noItem: 'bryle' }, reply: ['Po jednom pánovi, co si pro ně nepřišel. Vidí se v nich líp, než by člověk čekal. Hlavně díry v plotech.'] },
        ],
        entry: [{ if: { noFlag: 'met_trafikantka' }, node: 'prvni' }, { node: 'hub' }],
        nodes: {
            prvni: { say: ['Jízdenky na devadesát minut, jiný peníze tady neberou. Označený platí, neoznačený platí víc.', 'Vy jste pošťačka? Tak to mi řekněte, kdy přijde důchod. Rok nepřišel.'], do: { flag: 'met_trafikantka' }, next: 'hub' },
            hub: { say: ['Jízdenky, sirky, zprávy. Zprávy jsou zadarmo, protože jsou staré.'], choices: [
                { id: 'duchod', label: 'Na Hradě se zeptám. Slibuju.', once: true, do: { tickets: 3, quest: { duchod: 'nest' } }, reply: ['Slib od pošty. To je víc, než kdy slíbila vláda. Tady máte tři jízdenky na cestu, ať tam dojedete.'] },
                { id: 'mena', label: 'Jak to s jízdenkami chodí?', once: true, reply: ['Vydává je metro a označuje je metro. Tržiště je bere, protože nic jiného nemá. Za jednu je polívka, za dvacet bezpečná cesta, za dvě stě nový život. Nebo starý, podle toho.'] },
                { id: 'blok', label: 'Pod pultem vám leží neoznačený blok jízdenek.', if: { attr: { oko: 2 } }, else: 'Blok pod pultem uvidí jen Oko 2.', once: true, do: { tickets: 4 }, reply: ['…Vy máte oči jako revizor. Dobře, čtyři. A nikomu ani slovo, to je moje penze.'] },
                { id: 'koupit', label: 'Prodáte mi jízdenku?', once: true, reply: ['Já? Jízdenky jsem prodávala dvacet let. Teď je jen počítám. Kdo je chce, musí si je vydělat. Zkuste Fantu, platí dobře, ale pozdě.'] },
                { id: 'obchod', label: 'Co prodáváte?', shop: true },
            ] },
        } },
    ohniste: { stats: { ruka: 2, usta: 3, oko: 3 }, about: 'Samozvaný přerozdělovač ze Sherwoodu. Bere tržišti a dává parku, hlavně sobě.', name: 'Robin ze Sherwoodu', face: 'face_robin',
        entry: [{ if: { noFlag: 'met_robin' }, node: 'prvni' }, { node: 'hub' }],
        nodes: {
            prvni: { say: ['Beru bohatým a dávám chudým. Chudej jsem teď já, tak to zjednodušuje účetnictví.', 'Psi na pěšině jsou moji. Fanta jim dával guláš, ale já jim dal jména.'], do: { flag: 'met_robin' }, next: 'hub' },
            hub: { say: ['Sherwood vítá. Za vstup se platí, za odchod taky.'], choices: [
                { id: 'lahev', label: 'Nesu lahev. Od Fanty.', if: { item: 'lahev' }, else: 'Jen s lahví z tržiště.', do: { take: 'lahev', flag: ['psi_ok', 'robin_tajemstvi'], quest: { psi: 'done' }, xp: 3 },
                    reply: ['Fantova slivovice! Nejlepší ročník. Budeme říkat, že je kradená.', 'Psi vám dají pokoj. Hej, ke mně! A něco za něco: tu krabičku, co Fanta posílá na Hrad, prodal dvakrát. Jednou Hradu. Podruhý Admirálovi na Staromáku a ten už zaplatil zálohu.'] },
                { id: 'psi', label: 'Co ti psi?', if: { noFlag: 'psi_ok' }, else: 'Dokud psi nedají pokoj.', once: true, do: { quest: { psi: 'nest' } }, reply: ['Hlídají pěšinu a lezou do tunelu, tam je teplo. Strojvedoucí kvůli nim nadává. Doneste mi něco dobrýho od Fanty a odvolám je.'] },
                { id: 'tajemstvi', label: 'Víš, co Fanta prodává?', if: { flag: 'psi_ok', noFlag: 'robin_tajemstvi' }, else: 'Robin to řekne jen tomu, kdo prošel kolem psů.', do: { flag: 'robin_tajemstvi', xp: 1 }, reply: ['Kdo prošel kolem mejch psů, zaslouží si pravdu. Fanta prodal tu krabičku dvakrát. Hradu a Admirálovi na Staromáku. Jeden z nich bude zklamanej.'] },
            ] },
        } },
    psi: { stats: { ruka: 2, usta: 1, oko: 3 }, about: 'Tři zdivočelí psi na pěšině. Vůdce má na krku Fantovu stužku.', name: 'Smečka', face: null,
        entry: [{ if: { flag: 'psi_ok' }, node: 'klid' }, { node: 'stoji' }],
        nodes: {
            klid: { say: ['Tři psi leží u Robinova ohně. Vůdce zvedne hlavu, pozná vás a zase ji položí. Nejmenší pes vrtí ocasem.'], choices: [] },
            stoji: { say: ['První pes vrčí. Druhý vrčí hlasitěji. Třetí kouká na vaši tašku, jako by věděl, co v ní je.'], choices: [
                { id: 'boj', label: 'Probít se.', do: { fight: 'psi' }, win: { flag: 'psi_ok', quest: { psi: 'done' }, xp: 3 } },
                { id: 'plot', label: 'Najít díru, kudy lezou do tunelu, a zatarasit ji.', if: { attr: { oko: 2 } }, else: 'Díru v plotě najde jen Oko 2.', do: { flag: 'psi_ok', quest: { psi: 'done' }, xp: 2 }, reply: ['Za keřem je v plotě díra a za ní šachta do tunelu. Zatarasíte ji plechem z boudy. Psi čuchají, nechápou a nakonec se odloudají k Robinovu ohni.'], end: true },
                { id: 'obojek', label: 'Chytit vůdce za obojek a odtáhnout ho k Robinovi.', check: 'ruka', else: 'Udržet vůdce smečky chce Ruku 2.', do: { flag: 'psi_ok', quest: { psi: 'done' }, xp: 2 }, failReply: ['Vůdce se vysmekne a chňapne vás po ruce. Smečka štěká.'], reply: ['Vůdce se vzpírá, ale obojek drží. Ostatní dva jdou za ním. Robin je uváže u ohně a dělá, že to byl jeho nápad.'], end: true },
                { id: 'zarvat', label: 'Zařvat na ně jako pošťačka na psa.', if: { attr: { usta: 2 } }, else: 'Zahnat psy hlasem chce Ústa 2.', do: { flag: 'psi_ok', quest: { psi: 'done' }, xp: 2 }, reply: ['Každý pes na světě zná pošťačku, která už toho má dost. Psi stáhnou ocasy, odplíží se k Robinovu ohni a dělají, že spí.'], end: true },
                { id: 'zpet', label: 'Couvnout.', end: true },
            ] },
        } },
    // —— Václavák ——
    vylez: { name: 'Nouzový výlez', face: null,
        entry: [{ node: 'dvere' }],
        nodes: {
            dvere: { say: ['Betonová bouda s plechovými dveřmi. Dole ve tmě čeká souprava a z tunelu fouká.'], choices: [
                { id: 'zpet', label: 'Sjet soupravou zpátky na Hlavák. (1 jízdenka)', if: { tickets: 1, noFlag: 'jizdni_rad' }, else: 'Zpátky se jezdí za jízdenku.', do: { tickets: -1, travel: 'hlavak' } },
                { id: 'zpet_rad', label: 'Sjet zpátky na Hlavák. Znám jízdní řád.', if: { flag: 'jizdni_rad' }, else: 'Zadarmo jen se znalostí jízdního řádu.', do: { travel: 'hlavak' } },
                { id: 'zpet_metro', label: 'Sjet zpátky na Hlavák. Strojvedoucí mě zná.', if: { trust: { metro: 2 }, noFlag: 'jizdni_rad' }, else: 'Zadarmo jen tomu, komu metro věří (2).', do: { travel: 'hlavak' } },
                { id: 'zustat', label: 'Zůstat nahoře.', end: true },
            ] },
        } },
    dispecerka: { stats: { ruka: 1, usta: 2, oko: 2 }, about: 'Hlas metra ze stanice Muzeum. Řád pro ni znamená, že je všechno zapsané.', faction: 'metro', name: 'Dispečerka', face: 'face_dispecerka',
        entry: [{ if: { noFlag: 'met_dispecerka' }, node: 'prvni' }, { node: 'hub' }],
        nodes: {
            prvni: { say: ['Pozor, pozor. Z důvodu mimořádné události je provoz na lince stále omezen. Na náměstí se pohybuje osoba v uniformě České pošty. Osobu žádáme, aby se dostavila ke vstupu do stanice Muzeum.', '…To jste vy. Dobře. Řád znamená, že je všechno zapsané. Vy zapsaná nejste. A to, co nesete v tašce, taky ne.'],
                do: { flag: 'met_dispecerka', quest: { evidence: 'nest', molo: 'nest' } }, next: 'hub' },
            hub: { say: ['Stanice Muzeum, dispečink. Mluvte do mikrofonu, slyší vás půl náměstí.'], choices: [
                { id: 'zapis', label: 'Zapište mě. I tu krabičku.', if: { noFlag: 'evidence_hotova', item: 'zasilka' }, else: 'Zapsat se dá jen jednou a jen se zásilkou v tašce.', do: { flag: ['zapsano', 'evidence_hotova'], give: 'vypis', trust: { metro: 1 }, quest: { evidence: 'done' }, xp: 2 },
                    reply: ['Náklad: krabička, černá, velikosti powerbanku. Odesílatel: tržiště. Adresát: Hrad.', '…Počkat. Tohle je datový záznamník razicího štítu. To výrobní číslo znám, je to náš štít z éčka. Kancelář kanálu si ho půjčila a razila s ním pod Hradem.', 'Zapsáno. Výpis si nechte, revizor dole u vody vás s ním pustí. A doneste ten záznamník celý, prosím. Patří lidem, ne do šuplíku na Hradě.'] },
                { id: 'odmitnout', label: 'Listovní tajemství, paní kolegyně. Nic zapisovat nebudeme.', check: 'usta', if: { noFlag: 'evidence_hotova' }, else: 'Odmítnout dispečerku chce Ústa 2.', do: { flag: ['evidence_hotova', 'odmitla'], trust: { trziste: 1 }, quest: { evidence: 'odmitnuto' } }, reply: ['Tajemství. Dobře. Zapíšu si, že jste odmítla. Revizor si to přečte taky.'] },
                { id: 'rozhlas', label: 'Můžu pro vás něco udělat?', if: { questNot: { rozhlas: ['nest', 'hlasite', 'done'] } }, else: 'Jen dokud úkol s rozhlasem nemáte.', do: { quest: { rozhlas: 'nest' } }, reply: ['Reproduktor u Jindřišské je slabý, k vodě nedolehne. Stačí na něm zesílit knoflík. Jenže na reproduktoru sedí nutrie a ta mě neposlouchá.'] },
                { id: 'rozhlas_hotovo', label: 'Reproduktor u Jindřišské řve.', if: { quest: { rozhlas: 'hlasite' } }, else: 'Až bude reproduktor řvát.', do: { give: 'pistalka', quest: { rozhlas: 'done', molo: 'done' }, flag: ['uredni_osoba', 'molo'], xp: 3 }, reply: ['Teď mě slyší i u vody. Pozor, pozor. Osoba v uniformě České pošty je úřední osoba. Revizore, pusťte ji na molo bez placení.', 'A vezměte si moji píšťalku. Kdo ji slyší, zmlkne. Mně už stačí rozhlas.'] },
                { id: 'voda', label: 'Odkud se tu vzala voda?', once: true, reply: ['Kancelář kanálu razila pod Hradem tunel pro kanál Labe–Vltava. Štít prorazil do řeky, voda šla tunelem do metra a ve stanici Můstek vystoupala nahoru.', 'Metro přišlo o půlku sítě a Praha o půlku náměstí. Kdo to podepsal, to není zapsané. Zatím.'] },
            ] },
        } },
    reproduktor: { name: 'Reproduktor u Jindřišské', face: null,
        entry: [{ if: { quest: { rozhlas: ['hlasite', 'done'] } }, node: 'hotovo' }, { if: { flag: 'nutrie_pryc' }, node: 'knoflik' }, { node: 'nutrie' }],
        nodes: {
            hotovo: { say: ['Reproduktor chrčí dispečerčiným hlasem až k vodě.'], choices: [] },
            nutrie: { say: ['Na reproduktoru sedí nutrie a cení oranžové zuby. Knoflík hlasitosti je přesně pod ní.'], choices: [
                { id: 'boj', label: 'Shodit ji.', do: { fight: 'nutrie' }, win: { flag: 'nutrie_pryc', xp: 2 }, next: 'knoflik' },
                { id: 'kaminek', label: 'Vyplašit ji kamínkem.', if: { attr: { oko: 2 } }, else: 'Trefit nutrii kamínkem chce Oko 2.', do: { flag: 'nutrie_pryc', xp: 1 }, reply: ['Kamínek cvakne o trychtýř. Nutrie seskočí a uraženě si sedne na kraj vody, zády k vám.'], next: 'knoflik' },
                { id: 'zpet', label: 'Nechat ji být.', end: true },
            ] },
            knoflik: { say: ['Knoflík jde ztuha, ale jde.'], choices: [
                { id: 'otocit', label: 'Otočit naplno.', do: { quest: { rozhlas: 'hlasite' }, xp: 1 }, reply: ['Reproduktor zachrčí a pak zařve. Někde u Muzea se dispečerka lekne vlastního hlasu.'], end: true },
            ] },
        } },
    vaclav: { stats: { ruka: 2, usta: 2, oko: 3 }, about: 'Stojí na podstavci místo ukradené sochy, protože někdo musí. Vidí celé náměstí.', name: 'Svatý Václav na směny', face: 'face_vaclav',
        entry: [{ if: { noFlag: 'met_vaclav' }, node: 'prvni' }, { node: 'hub' }],
        nodes: {
            prvni: { say: ['Svatý Václav na směny. Dneska sloužím já. Socha zmizela a někdo tu stát musí, jinak by se náměstí rozuteklo.', 'Lidi mi hážou jízdenky. Za to jim povím, co se na náměstí šustne. Po kouskách.'], do: { flag: 'met_vaclav' }, next: 'hub' },
            hub: { say: ['Jízdenku do přilby, informaci do ucha.'], choices: [
                { id: 'socha', label: 'Kam se poděla socha?', if: { questNot: { kun: ['nest', 'stopa', 'done'] } }, else: 'Jen dokud se po soše neptáte.', do: { quest: { kun: 'nest' } }, reply: ['To bych taky rád věděl. Jednou ráno tu nebyla, zůstala jen kopyta. Kdo vozí těžký věci po vodě? Zeptejte se dole u mola.'] },
                { id: 'stopa', label: 'Sochy nakládá Kuřačka. Po kusech.', if: { quest: { kun: 'stopa' } }, else: 'Až to budete vědět od Kuřačky.', do: { quest: { kun: 'done', molo: 'done' }, flag: ['strechy', 'molo'], xp: 3 },
                    reply: ['Loďkaři, jasně. Vozí je na Karlův most a tam je prodávají po kusech. Kdo je kupuje, to zjistíte na místě.', 'Za to vám něco dám: k molu se dá dojít po střechách, kolem revizora. Z Wiehlova domu přes pasáž a dolů po lešení. Revizora pozdravujte ode mě. Shora.'] },
                { id: 'kun', label: 'A ten kůň v Lucerně?', once: true, reply: ['Visí hlavou dolů a lidi z metra se hádají, který kůň je ten pravý. Já to vím: ani jeden.'] },
                { id: 'info', label: 'Co se šustne? (2 jízdenky)', if: { tickets: 2 }, else: 'Informace stojí dvě jízdenky.', once: true, do: { tickets: -2 }, reply: ['Revizor u vody pustí každého, kdo má výpis z evidence. Kdo ho nemá, platí pět. Kdo nemá pět, plave.'] },
            ] },
        } },
    revizor: { stats: { ruka: 2, usta: 3, oko: 3 }, about: 'Kontrola na hranici vody. Dvacet let seděl naproti vám, z druhé strany přepážky.', faction: 'metro', name: 'Revizor', face: 'face_revizor',
        entry: [{ if: { flag: 'molo' }, node: 'volno' }, { node: 'kontrola' }],
        nodes: {
            volno: { say: ['Máte to vyřízené. Molo je vaše. Kontroly zdar.'], choices: [] },
            kontrola: { do: { flag: 'met_revizor' }, say: ['Jízdenky a náklad ke kontrole. Bez zápisu na molo nikdo nejde. Leda za tarif.', '…Pošťačka z Jindřišské. Já seděl naproti v předprodeji. Dvacet let jsme na sebe koukali přes dvě skla.'], choices: [
                { id: 'vypis', label: 'Tady je výpis z evidence.', if: { item: 'vypis' }, else: 'Jen s výpisem od dispečerky.', do: { flag: 'molo', quest: { molo: 'done' } }, reply: ['Razítko sedí. Zapsaná osoba, zapsaný náklad. Projděte.'], end: true },
                { id: 'uredni', label: 'Dispečerka mě ohlásila.', if: { flag: 'uredni_osoba' }, else: 'Až vás dispečerka ohlásí rozhlasem.', do: { flag: 'molo', quest: { molo: 'done' } }, reply: ['Slyšel jsem. Celé náměstí slyšelo. Úřední osoba, projděte.'], end: true },
                { id: 'zaplatit', label: 'Zaplatím. (5 jízdenek)', if: { tickets: 5, noFlag: 'odmitla' }, else: 'Stojí to pět jízdenek.', do: { tickets: -5, flag: 'molo', quest: { molo: 'done' }, trust: { trziste: 1 } }, reply: ['Pět. Označeno. Projděte. A příště s výpisem.'], end: true },
                { id: 'zaplatit_vic', label: 'Zaplatím. (8 jízdenek)', if: { tickets: 8, flag: 'odmitla' }, else: 'Kdo odmítl zápis u dispečerky, platí osm.', do: { tickets: -8, flag: 'molo', quest: { molo: 'done' }, trust: { trziste: 1 } }, reply: ['Dispečerka vás zapsala jako nespolupracující. Pro ty je tarif vyšší. Projděte.'], end: true },
                { id: 'kolega', label: 'Kolego, seděli jsme naproti dvacet let. Pusťte mě.', check: 'usta', else: 'Ukecat revizora chce Ústa 3.', do: { flag: 'molo', quest: { molo: 'done' }, xp: 2 }, reply: ['…Dvacet dva. A ani jednou jste mě nepustila bez fronty.', 'Projděte. Ale zapíšu si to jako služební cestu.'], end: true },
                { id: 'proklouznout', label: 'Proklouznout na molo, až se otočí k vodě.', check: 'oko', else: 'Proklouznout revizorovi chce Oko 3.', do: { flag: 'molo', quest: { molo: 'done' }, xp: 2 }, failReply: ['Kleštičky cvaknou těsně u vašeho ucha. „Kontrola, paní kolegyně. Tudy ne.“'], reply: ['Revizor se otočí k vodě, kde něco šplouchne. Než se otočí zpátky, jste na molu. Dělá, že vás nevidí. Kolegyni se nekontroluje.'] },
                { id: 'metro', label: 'Metro za mě ručí. Zeptejte se dispečerky.', if: { trust: { metro: 2 } }, else: 'Jen když vám metro věří (2).', do: { flag: 'molo', quest: { molo: 'done' } }, reply: ['Dispečerka o vás mluvila. Za koho ručí metro, toho nekontroluju. Projděte.'], end: true },
                { id: 'odejit', label: 'Ještě se vrátím.', end: true },
            ] },
        } },
    kuracka: { stats: { ruka: 2, usta: 2, oko: 3 }, about: 'Loďkařská hlídka. Cigareta, motorový člun a přesvědčení, že suchá země se přeceňuje.', faction: 'lodkari', name: 'Kuřačka', face: 'face_kuracka',
        entry: [{ if: { noFlag: 'met_kuracka' }, node: 'prvni' }, { node: 'hub' }],
        nodes: {
            prvni: { say: ['Kuřačka. Předsunutá hlídka loďkařů, molo Můstek. Cigaretu?', 'Suchá země se přeceňuje. Na vodě se aspoň nepráší. A od velké vody je jí čím dál míň.'], do: { flag: 'met_kuracka', quest: { lodka: 'nest' } }, next: 'hub' },
            hub: { say: ['Převoz na Staromák. Admirál přijímá, když má náladu.'], choices: [
                { id: 'socha', label: 'Prý vozíte sochy.', if: { quest: { kun: 'nest' } }, else: 'Jen když po soše pátráte pro Václava.', do: { quest: { kun: 'stopa' } }, reply: ['Vozím, co je těžký a nikomu to nechybí. Svatý Václav jel po kouskách, kůň zvlášť. Na Karlův most, tam to někdo kupuje. Kdo, nevím. A nechci to vědět.'] },
                { id: 'voda', label: 'Odkud je tolik vody?', once: true, do: { flag: 'utrzek1' }, reply: ['Admirál říká, že je to kanál, o kterém snil už Zeman. Já říkám, že je to hodně vody.', 'Kanál. Kancelář ho razila pod Hradem a voda si našla cestu sama, až sem na Můstek. Prý to někdo podepsal. Admirál by mu za to líbal ruce.'] },
                { id: 'cigareta', label: 'Vezmu si cigaretu.', once: true, do: { trust: { lodkari: 1 } }, reply: ['Kuřačka vám připálí od své. „Na vodě se nekouří sám. To je jediné pravidlo, co máme.“'] },
                { id: 'prevoz', label: 'Vezmete mě na Staromák? (3 jízdenky)', if: { tickets: 3, noFlag: 'staromak_prijezd' }, else: 'Převoz stojí tři jízdenky; kdo už jel, jezdí zadarmo.', do: { tickets: -3, trust: { lodkari: 1 }, travel: 'staromak' }, reply: ['Nasedněte. Motor chytne napotřetí, jako vždycky. Admirál říká, že to je tradice.'] },
                { id: 'prevoz_kamaradka', label: 'Kouřily jsme spolu. Hodíte mě na Staromák?', if: { trust: { lodkari: 1 }, noFlag: 'staromak_prijezd' }, else: 'Zadarmo jen té, komu loďkaři věří (1), třeba po společné cigaretě.', do: { travel: 'staromak' }, reply: ['S kým kouřím, toho vozím. To je druhý pravidlo, co máme. Nasedněte.'] },
                { id: 'prevoz_prace', label: 'Na převoz nemám. Můžu si ho odpracovat?', if: { poor: 3, noFlag: 'staromak_prijezd' }, else: 'Odpracovat se dá jen tomu, kdo nemá tři jízdenky.', do: { travel: 'staromak' }, reply: ['Loďka teče. Tady je plechovka. Cestou ji vylejete celou a nebudete si stěžovat.', 'Stěžovat si stejně nebudete. Budete mít plné ruce.'] },
                { id: 'prevoz_znovu', label: 'Na Staromák, jako minule.', if: { flag: 'staromak_prijezd' }, else: 'Zadarmo jen ten, kdo už jednou jel.', do: { travel: 'staromak' } },
            ] },
        } },
    // —— Staromák ——
    tyn: { stats: { ruka: 2, usta: 2, oko: 3 }, about: 'Loďkařská hlídka. Cigareta, motorový člun a přesvědčení, že suchá země se přeceňuje.', faction: 'lodkari', name: 'Kuřačka', face: 'face_kuracka',
        entry: [{ if: { noFlag: 'staromak_prijezd' }, node: 'prijezd' }, { node: 'hub' }],
        nodes: {
            prijezd: { say: ['Staromák. Dál než k Týnské škole nejezdím. Dál je to Admirálova voda.', 'Admirál sedí na Husovi. Kdo chce po vodě dál, musí za ním. Kdo nechce nic, taky musí, jen to ještě neví.'], do: { flag: 'staromak_prijezd', quest: { lodka: 'done', admiral: 'nest' } }, next: 'hub' },
            hub: { say: ['Loďka stojí. Já taky. Kam?'], choices: [
                { id: 'zpet', label: 'Zpátky na Václavák.', if: { trust: { lodkari: 0 } }, else: 'Kdo naštval loďkaře, toho Kuřačka nesveze.', reply: ['Nasedněte. Cigaretu vám cestou nenabídnu, mám poslední.'], do: { travel: 'vaclavak' } },
                { id: 'admiral', label: 'Co je ten Admirál zač?', once: true, reply: ['Býval kapitánem výletní lodi. Pak přišla voda, sehnal pět loděk a byl z něj admirál. Cituje prezidenty z paměti, většinou špatně, a kanál má za div světa.', 'Na pomník vedou lávky přes náměstí. Klepejte, než vstoupíte. Na co, to je jedno.'] },
            ] },
        } },
    admiral: { stats: { ruka: 3, usta: 3, oko: 1 }, about: 'Vůdce loďkařů na Husově pomníku. Věří, že kanál je dílo století. Vidí už jen na vodu.', faction: 'lodkari', name: 'Admirál', face: 'face_admiral',
        entry: [{ if: { noFlag: 'met_admiral' }, node: 'prvni' }, { if: { flag: 'admiral_hotovo' }, node: 'potom' }, { node: 'hub' }],
        nodes: {
            prvni: { say: ['Pošta! Na mé vodě! Vítejte ve flotile Staroměstské. Jsem Admirál.', 'Kanál, má milá! O tom snil už pan prezident Zeman, a my ho máme. Pán Bůh dal Vltavě koryto, kancelář jí dala lepší. Že vede přes Staré Město? Každé dílo něco stojí.'], do: { flag: 'met_admiral' }, next: 'hub' },
            hub: { say: ['Co vás vede přes moji vodu?'], choices: [
                { id: 'posta', label: 'Nesu poštu na Hrad. Potřebuju na Karlův most.', if: { item: 'zasilka', noFlag: 'admiral_videl' }, else: 'Jen se zásilkou v tašce a jen poprvé.', do: { flag: 'admiral_videl' }, next: 'ukazat' },
                { id: 'prazdna', label: 'Potřebuju na Karlův most.', if: { noItem: 'zasilka', noFlag: 'admiral_hotovo' }, else: 'Jen bez zásilky.', do: { flag: ['admiral_hotovo', 'admiral_prevoz'] }, reply: ['S prázdnou taškou? Pošta, která nic neveze, je turistka. Turisty vozíme zadarmo, z nostalgie. Loďka čeká u Karlovy.'] },
                { id: 'ukazat_znovu', label: 'Ještě k té krabičce…', if: { flag: 'admiral_videl', item: 'zasilka', noFlag: 'admiral_hotovo' }, else: 'Dokud se o zásilce nerozhodlo.', next: 'ukazat' },
                { id: 'kanal', label: 'Kdo kanál podepsal?', once: true, reply: ['Kancelář kanálu! Lidé s vizí. Nastěhovali se na Hrad, odkud je na vodu nejlíp vidět. Já je obdivuju odsud, z Husa. Výhled mám horší, ale jsem blíž vodě.'] },
                { id: 'rucitele', label: 'Loďkaři za mě ručí. Zeptejte se Kuřačky.', if: { trust: { lodkari: 2 }, noFlag: 'admiral_hotovo' }, else: 'Jen když vám loďkaři věří (2).', do: { flag: ['admiral_hotovo', 'admiral_prevoz'], quest: { admiral: 'rucitele' }, xp: 1 }, reply: ['Kuřačka o vás mluvila. Kouříte s ní, tak jste naše. Loďka u Karlovy čeká, krabičku si nechte. Zatím.'], next: 'potom' },
                { id: 'hus', label: 'Proč zrovna Hus?', once: true, reply: ['Protože ještě stojí. Pravda vítězí, říká se. Tady vítězí ten, kdo stojí nejvýš nad hladinou.'] },
            ] },
            ukazat: { say: ['Poštu na Hrad? Krabičku od pana Fanty? Tu jsem si zamluvil já, pan Fanta ode mě dostal zálohu. Ukažte mi ji a loďka vás doveze Karlovou na most. Zadarmo. Z úcty k instituci.'], choices: [
                { id: 'dat', next: 'potom', label: 'Ukážu. (Podat mu krabičku.)', do: { take: 'zasilka', flag: ['admiral_hotovo', 'admiral_prevoz', 'dala_admiralovi'], trust: { lodkari: 2 }, quest: { admiral: 'dala', zakazka: 'ztracena' }, xp: 2 },
                    reply: ['…Záznamník štítu. Já to věděl. Já to cítil v kříži.', 'Tohle se nedoručuje, tohle se obětuje. Až vyjede flotila na Vyšehrad, hodím ho do proudu, ať kanál ví, že ho máme rádi.', 'Loďka u Karlovy je vaše. Pošta posloužila vodě. Zapíšu si vás do lodního deníku. Žádný nemám, ale zapíšu.'] },
                { id: 'podstrcit', next: 'potom', label: 'Ukážu. (Podat mu krabičku od lovce značek.)', if: { item: 'falesna', attr: { usta: 2 } }, else: 'Podstrčit falešnou krabičku chce krabičku od lovce značek a Ústa 2.', do: { take: 'falesna', flag: ['admiral_hotovo', 'admiral_prevoz', 'podstrcila'], trust: { lodkari: 1 }, quest: { admiral: 'podstrceno' }, xp: 3 },
                    reply: ['…Záznamník štítu. Lehčí, než jsem myslel. To z něj asi vyprchala data.', 'Na Vyšehradě ho hodím do proudu, jako oběť kanálu. Loďka u Karlovy je vaše.'] },
                { id: 'odmitnout', next: 'potom', label: 'Listovní tajemství. Neukážu.', do: { flag: ['admiral_hotovo', 'admiral_odmitla'], trust: { trziste: 1, lodkari: -1 }, quest: { admiral: 'odmitnuto' }, xp: 1 },
                    reply: ['Tajemství. Na mé vodě. Dobře, pošto, voda si to zapamatuje a já taky.', 'Loďka vás nepoveze. Na most se dostanete leda po střechách Klementina, a kdo tam nezná cestu, ten plave.'] },
                { id: 'tradice', next: 'potom', label: 'Pošta nic neukazuje, pane admirále. To je tradice, jako váš motor.', check: 'usta', else: 'Ukecat Admirála chce Ústa 3.', do: { flag: ['admiral_hotovo', 'admiral_prevoz', 'admiral_ukecala'], quest: { admiral: 'ukecala' }, xp: 3 },
                    reply: ['Tradice… Motor chytá napotřetí, pošta nic neukazuje. Na tom stojí svět, i ten mokrý.', 'Loďka u Karlovy je vaše. Krabičku si vyřídím s panem Fantou, zálohu mi vrátí.'] },
            ] },
            potom: { say: ['Pošta. Flotila zdraví. Loďka u Karlovy čeká na ty, kdo si ji zasloužili.'], choices: [
                { id: 'kanal', label: 'Kdo kanál podepsal?', once: true, reply: ['Kancelář kanálu! Lidé s vizí. Nastěhovali se na Hrad, odkud je na vodu nejlíp vidět.'] },
            ] },
        } },
    orlojnik: { stats: { ruka: 1, usta: 2, oko: 3 }, about: 'Natahuje Orloj ručně, z loďky, každou hodinu. Prodává přesný čas.', name: 'Orlojník', face: 'face_orlojnik',
        entry: [{ if: { noFlag: 'met_orlojnik' }, node: 'prvni' }, { node: 'hub' }],
        nodes: {
            prvni: { say: ['Pst. Za minutu bude celá. Smrtka zatáhne za zvonec a apoštolové… nevyjdou. Zase.', 'Orloj natahuju ručně, z loďky, každou hodinu. Přesný čas nemá nikdo jiný, tak ho prodávám. Jenže apoštolové od čtrnáct třicet sedm nevyšli ani jednou. Tehdy se zastavilo všechno. Soukolí pod hladinou rezaví.'], do: { flag: 'met_orlojnik', quest: { apostolove: 'nest' } }, next: 'hub' },
            hub: { say: ['Čas? Jedna jízdenka. Pravda o čase zadarmo: všem nám ho ubývá.'], choices: [
                { id: 'vytahnout', label: 'Vytáhnu to soukolí nad hladinu.', if: { attr: { ruka: 2 }, quest: { apostolove: 'nest' } }, else: 'Vytáhnout soukolí z vody chce Ruku 2.', do: { quest: { apostolove: 'done' }, flag: 'apostolove', tickets: 5, xp: 3 },
                    reply: ['Opatrně… ještě… mám ho!', 'Tik. Tak. Smrtka zvoní a apoštolové vycházejí. Mokří, ale celí. Poprvé po roce.', 'Za to vám řeknu, co nikdo neví: Admirál odjíždí na obhlídku každou celou hodinu a jeho loďka u Karlovy zůstává bez dozoru. Kdo zná čas, sveze se. A tady jízdenky. Schovával jsem je pro turisty, ti už nepřijedou.'] },
                { id: 'kolo', label: 'Tady je ozubené kolo z hodinek.', if: { item: 'kolo', quest: { apostolove: 'nest' } }, else: 'Jen s ozubeným kolem od lovce značek.', do: { take: 'kolo', quest: { apostolove: 'done' }, flag: 'apostolove', tickets: 5, xp: 3 },
                    reply: ['Švýcarské. Malé, ale švýcarské. Pasuje!', 'Tik. Tak. Apoštolové vycházejí. Mokří, ale celí.', 'Admirál odjíždí každou celou hodinu na obhlídku a jeho loďka u Karlovy zůstává bez dozoru. Kdo zná čas, sveze se. A tady jízdenky. Schovával jsem je pro turisty, ti už nepřijedou.'] },
                { id: 'cas', label: 'Kolik je hodin? (1 jízdenka)', if: { tickets: 1 }, else: 'Čas stojí jízdenku.', once: true, do: { tickets: -1 }, reply: ['Rok, pár hodin a sedmnáct minut po čtrnácté třicet sedm. Jinak se tu čas nepočítá.'] },
                { id: 'klementinum', label: 'Jak se dostanu po střechách na most?', once: true, reply: ['Přes Klementinum. Z Karlovy po lešení na střechu, kolem hvězdárny a dolů ke Křižovníkům. Kdo nemá dobré oči, spadne do Karlovy. Kdo má, je na mostě.'] },
            ] },
        } },
    lovec: { stats: { ruka: 2, usta: 2, oko: 2 }, about: 'Loví hákem zboží ze zatopených butiků v Pařížské. Tvrdí, že je všechno originál.', name: 'Lovec značek', face: 'face_lovec',
        entry: [{ if: { noFlag: 'met_lovec' }, node: 'prvni' }, { node: 'hub' }],
        nodes: {
            prvni: { say: ['Pařížská, nejdražší vodní cesta v Evropě. Kabáty, kabelky, hodinky, všechno originál. Mokrý originál je pořád originál.', 'Jenže mi támhle ve výloze uvízl hák. A ve výloze hnízdí nutrie, v kožiších. Mají lepší vkus než já.'], do: { flag: 'met_lovec', quest: { hak: 'nest' } }, next: 'hub' },
            hub: { say: ['Kupujete, nebo jen koukáte? Koukání je zadarmo, a taky podle toho vypadá.'], choices: [
                { id: 'hak', label: 'Hák je venku.', if: { flag: 'hak_venku', quest: { hak: 'nest' } }, else: 'Až bude hák z výlohy venku.', do: { quest: { hak: 'done' }, give: ['falesna', 'kabat'], xp: 2 },
                    reply: ['Můj hák! Vy jste poklad. Tady, za odměnu.', 'Kabát, originál. Nepromokavý, mokřejší už nebude. A tahle krabička: vylovil jsem ji v butiku s elektronikou a vypadá jako ta vaše. Kdyby ji po vás někdo chtěl, dejte mu tuhle. Pozná to, až ji otevře.'] },
                { id: 'kolo', label: 'Máte ozubené kolo? Pro Orlojníka. (3 jízdenky)', if: { tickets: 3, noItem: 'kolo', quest: { apostolove: 'nest' } }, else: 'Kolo má smysl kupovat pro Orlojníka a za tři jízdenky.', do: { tickets: -3, give: 'kolo' }, reply: ['Z hodinek z butiku, švýcarské. Hodinky jsou mokré, kolečko suché. Vodotěsné, to je ten luxus.'] },
                { id: 'krabicka', label: 'Ta krabička… vypadá jako moje.', if: { item: 'zasilka' }, else: 'Jen se zásilkou v tašce.', once: true, reply: ['Vidím. Kdo nosí takovou krabičku v poštovní tašce, nenosí ji jen tak. Moje je prázdná. Prázdné věci jsou nejbezpečnější, kvůli nim nikdo nezabíjí.'] },
            ] },
        } },
    vyloha: { name: 'Výloha butiku', face: null,
        entry: [{ if: { flag: 'hak_venku' }, node: 'hotovo' }, { if: { flag: 'nutrie2_pryc' }, node: 'hak' }, { node: 'nutrie' }],
        nodes: {
            hotovo: { say: ['Prázdná výloha. Figuríny bez kabátů koukají do vody.'], choices: [] },
            nutrie: { say: ['Ve výloze mezi figurínami je hnízdo z kožichů. Kouká z něj nutrie. A další. Z hnízda trčí lovcův hák.'], choices: [
                { id: 'boj', label: 'Vyhnat je.', do: { fight: 'nutrie2' }, win: { flag: 'nutrie2_pryc', xp: 2 }, next: 'hak' },
                { id: 'mriz', label: 'Vyrazit mříž a vytrhnout hák, než se proberou.', if: { attr: { ruka: 3 } }, else: 'Vyrazit mříž chce Ruku 3.', do: { flag: ['nutrie2_pryc', 'hak_venku'], xp: 2 }, reply: ['Mříž povolí na první kopnutí. Hák jde ven i s kusem norka. Nutrie se ani nestačí probudit.'], end: true },
                { id: 'jinudy', label: 'Vytáhnout hák zezadu, dírou ve stropě.', if: { attr: { oko: 3 } }, else: 'Díru ve stropě butiku najde jen Oko 3.', do: { flag: ['nutrie2_pryc', 'hak_venku'], xp: 2 }, reply: ['Z patra butiku vede do výlohy díra po lustru. Hák jde ven, nutrie spí dál, zabalené v kašmíru.'], end: true },
                { id: 'zpet', label: 'Nechat je být.', end: true },
            ] },
            hak: { say: ['Nutrie se krčí v rohu výlohy. Hák trčí z kožichů.'], choices: [
                { id: 'vytahnout', label: 'Vytáhnout hák.', do: { flag: 'hak_venku', xp: 1 }, reply: ['Hák jde ven i s norkovým kabátem. Kabát necháte nutriím, ať nemají zimu.'], end: true },
            ] },
        } },
    potapecka: { stats: { ruka: 3, usta: 1, oko: 3 }, about: 'Jediná z metra, kdo leze do zatopené Staroměstské. Vynáší, co se dá.', faction: 'metro', name: 'Potápěčka', face: 'face_potapecka',
        shop: [
            { item: 'neopren', price: 10, if: { noItem: 'neopren' }, reply: ['Je po mně, trochu velký. Studí, ale ochrání líp než uniforma.'] },
            { item: 'obvaz', price: 3, reply: ['Z lékárničky soupravy, co zůstala dole. Je suchý, byl v sáčku.'] },
        ],
        entry: [{ if: { noFlag: 'met_potapecka' }, node: 'prvni' }, { node: 'hub' }],
        nodes: {
            prvni: { say: ['Staroměstská. Dole je stanice, celá pod vodou. Jsem jediná z metra, kdo tam leze.', 'Vynáším, co se dá. Lavičky, cedule, jízdní řády. Hlavně jízdní řády. Dispečerka je chce zpátky do evidence.'], do: { flag: 'met_potapecka' }, next: 'hub' },
            hub: { say: ['Mám čtyři minuty vzduchu a dvě minuty trpělivosti. Co potřebujete?'], choices: [
                { id: 'odkud', label: 'Odkud přišla ta voda?', once: true, do: { flag: 'utrzek2', xp: 1 }, reply: ['Ze západu. Tunelem, který na mapě metra není. Viděla jsem ho za Staroměstskou směrem k Hradu: nový beton a cedule stavby. Kancelář kanálu, razicí štít metra E.', 'Štít si půjčili od nás. Kdo dal pokyn razit dál, to ví jen ten, kdo to podepsal.'] },
                { id: 'vi', label: 'Dispečerka mi zapsala krabičku.', if: { flag: 'zapsano' }, else: 'Jen když jste se nechala zapsat u dispečerky.', once: true, do: { trust: { metro: 1 } }, reply: ['Vím. Metro má svoje spojení. Záznamník našeho štítu.', 'Doneste ho celý, prosím. Ne Admirálovi, ne tržišti. Ten záznam je jediný důkaz, že to nebyla nehoda.'] },
                { id: 'rad', label: 'Máte pro mě něco?', once: true, do: { tickets: 2 }, reply: ['Mokré jízdenky z automatu, dvě. Platí, metro je označí i mokré. Víc jsem dneska nevylovila.'] },
                { id: 'obchod', label: 'Prodáte mi něco?', shop: true },
            ] },
        } },
    karlova: { name: 'Ústí Karlovy ulice', face: null,
        entry: [{ node: 'rozcesti' }],
        nodes: {
            rozcesti: { say: ['Malé náměstí. Odsud teče Karlova ke Klementinu, řeka mezi domy. U lávky kotví Admirálova loďka, na štítu domu nad ní je lešení až na střechu.'], choices: [
                { id: 'lodka', label: 'Loďkou na Karlův most.', if: { flag: 'admiral_prevoz' }, else: 'Loďka jede jen s Admirálovým svolením.', do: { travel: 'most' } },
                { id: 'lodka_hodina', label: 'Loďkou, dokud je Admirál na obhlídce.', if: { flag: 'apostolove', noFlag: 'admiral_prevoz' }, else: 'Kdy loďka zůstává bez dozoru, ví jen Orlojník.', do: { trust: { lodkari: -1 }, travel: 'most' }, reply: ['Celá hodina. Admirál odplouvá na obhlídku, jeho loďka se houpe u lávky. Nikdo se nedívá.'] },
                { id: 'strechy', label: 'Po střechách Klementina.', if: { attr: { oko: 2 } }, else: 'Cestu po střechách najde jen Oko 2.', do: { flag: 'klementinum', xp: 2, travel: 'most' }, reply: ['Po lešení nahoru, po střechách Klementina k hvězdárenské věži s Atlasem. Dole Karlova jako černé zrcadlo. Ke Křižovníkům dolů po hromosvodu.'] },
                { id: 'plavat', label: 'Přeplavat Karlovu ke Křižovníkům.', if: { attr: { ruka: 3 } }, else: 'Přeplavat Karlovu chce Ruku 3.', do: { xp: 2, travel: 'most' }, reply: ['Voda je studená a černá a pod ní jsou výlohy. Plavete kolem Klementina, Atlas na věži se dívá jinam. Ke Křižovníkům dolezete mokrá, ale celá.'] },
                { id: 'zpet', label: 'Ještě ne.', end: true },
            ] },
        } },
    // —— Karlův most a Kampa ——
    pilar: { stats: { ruka: 3, usta: 2, oko: 2 }, about: 'Řeže sochy z mostu na kusy, aby se vešly do loďky. Přes den práce, večer umění.', faction: 'lodkari', name: 'Pilař', face: 'face_pilar',
        shop: [
            { item: 'smes', price: 4, if: { noItem: 'smes', distrust: { lodkari: 2 } }, reply: ['Směs do pily, jedna ku pětadvaceti. Pilu nemáte, tak ji dejte tomu zlatýmu trabantovi na Malý Straně. Ať konečně mlčí.'] },
            { item: 'rukavice', price: 6, if: { noItem: 'rukavice' }, reply: ['Záložní. S nima chytíte rezavou mříž i svatýho za hlavu.'] },
            { item: 'konzerva', price: 5, reply: ['Lančmít. Ryby nejíme, ty se bojej kanálu.'] },
        ],
        entry: [{ if: { noFlag: 'met_pilar' }, node: 'prvni' }, { node: 'hub' }],
        nodes: {
            prvni: { say: ['Pozor, práší se. Svatá Luitgarda, po kouskách. Vcelku se do loďky nevejde, svatí jsou neskladní.', 'Vezete něco pro Admirála?'], do: { flag: 'met_pilar' }, next: 'admiral' },
            admiral: { say: ['Tak co, pošto?'], choices: [
                { id: 'dala', label: 'Už to má.', if: { any: [{ flag: 'dala_admiralovi' }, { flag: 'podstrcila' }] }, else: 'Jen když Admirál krabičku dostal.', do: { trust: { lodkari: 1 } }, reply: ['Tak to jste naše. Mávnu na vás z každé loďky.'], next: 'hub' },
                { id: 'odmitla', label: 'Ne. Nesu to na Hrad.', if: { flag: 'admiral_odmitla' }, else: 'Jen když jste Admirála odmítla.', reply: ['Admirálovi se neodmítá. Zapamatuju si vás. Nejsem zlej, mám jen dobrou paměť a pilu.'], next: 'hub' },
                { id: 'tradice', label: 'Admirál mě veze z tradice.', if: { flag: 'admiral_ukecala' }, else: 'Jen když jste Admirála ukecala.', reply: ['Tradice. To je u Admirála víc než krabička. Tak jo.'], next: 'hub' },
                { id: 'nic', label: 'Nevezu nic.', if: { noFlag: 'admiral_hotovo' }, else: 'Jen když jste u Admirála nebyla.', reply: ['To říká každej, kdo má tašku.'], next: 'hub' },
            ] },
            hub: { say: ['Pila jede, benzínu mám dost. Co chcete?'], choices: [
                { id: 'obchod', label: 'Co prodáváte?', shop: true },
                { id: 'smes_zadarmo', label: 'Dáte mi trochu benzínu?', if: { trust: { lodkari: 2 }, noItem: 'smes' }, else: 'Zadarmo jen tomu, komu loďkaři věří (2).', do: { give: 'smes' }, reply: ['Pro naše zadarmo. Jedna ku pětadvaceti, nepolejte se.'] },
                { id: 'kdo', label: 'Kdo kupuje ty sochy?', check: 'usta', if: { noFlag: 'utrzek3' }, else: 'Pilař to vyklopí jen tomu, kdo má Ústa 2.', do: { flag: 'utrzek3', xp: 1 }, reply: ['Vám se špatně odmítá. Hrad. Kastelán chodí dolů a platí bez smlouvání. Kdo dneska kupuje sochy, má na všechno. Mně je to jedno, já jen řežu.'] },
                { id: 'vysehrad', label: 'Jedu s flotilou na Vyšehrad.', if: { trust: { lodkari: 0 }, any: [{ flag: 'dala_admiralovi' }, { flag: 'podstrcila' }] }, else: 'Na Vyšehrad veze Pilař jen ty, kdo dali Admirálovi, co chtěl.', do: { ending: 'lodkari' }, reply: ['Flotila vyráží. Admirál drží proslov už od Klementina. Nasedněte, svatá Luitgarda se uhne.'] },
                { id: 'zpet', label: 'Svezete mě na Staromák?', if: { trust: { lodkari: 0 } }, else: 'Kdo naštval loďkaře, toho Pilař nesveze.', reply: ['Nasedněte. Svatá Luitgarda pojede s váma, po kouskách.'], do: { travel: 'staromak' } },
            ] },
        } },
    netere: { stats: { ruka: 1, usta: 3, oko: 2 }, about: 'Fantova neteř. Má na mostě galerii a kupuje zpátky, co strýc prodal.', faction: 'trziste', name: 'Fantova neteř', face: 'face_netere',
        entry: [{ if: { noFlag: 'met_netere' }, node: 'prvni' }, { node: 'hub' }],
        nodes: {
            prvni: { say: ['Galerie na mostě, otevřeno nonstop. Sochy vcelku i po kusech, ceny na podstavcích. Strýc Fanta vás pozdravuje.', 'A vím, co nesete. Strýc to prodal dvakrát, Hradu a Admirálovi, a teď počítá, kdo dá víc. Tak to chce zpátky.'], do: { flag: 'met_netere', quest: { netere: 'nest' } }, next: 'hub' },
            hub: { say: ['Obchod je obchod. Co si dáme?'], choices: [
                { id: 'nabidka', label: 'Kolik dáte za krabičku?', if: { item: 'zasilka', noFlag: 'netere_hotovo', trust: { trziste: 0 } }, else: 'Jen se zásilkou v tašce a jen jednou.', next: 'nabidka' },
                { id: 'kdo', label: 'Kdo kupuje sochy? (5 jízdenek)', if: { tickets: 5, noFlag: 'utrzek3' }, else: 'Informace stojí pět jízdenek.', do: { tickets: -5, flag: 'utrzek3', xp: 1 }, reply: ['Hrad. Kastelán platí na místě a na nic se neptá. Kdo si dneska kupuje svaté, má jízdenek na rozdávání. Odkud, to se neptejte.'] },
                { id: 'desticka', label: 'Destička od Nepomuckého. (5 jízdenek)', if: { tickets: 5, noItem: 'desticka', quest: { desticka: 'nest' } }, else: 'Destičku má smysl kupovat pro hlídače a za pět jízdenek.', do: { tickets: -5, give: 'desticka' }, reply: ['Bronz, originál, osahaná do lesku. Štěstí se prodává po kusech jako všechno.'] },
                { id: 'desticka_oko', label: 'Z bedny trčí bronzový roh. Vzít si ho, když se nedívá.', check: 'oko', if: { noItem: 'desticka', quest: { desticka: 'nest' } }, else: 'Destičku v bednách uvidí jen Oko 2.', do: { give: 'desticka', trust: { trziste: -1 }, xp: 1 }, reply: ['Neteř přepisuje cenovky. Destička je teplá od slunce a těžší, než vypadá. Nikdo nic neviděl.'] },
                { id: 'desticka_usta', label: 'Destička patří mostu. Vraťte ji.', check: 'usta', if: { noItem: 'desticka', quest: { desticka: 'nest' } }, else: 'Přemluvit neteř zadarmo chce Ústa 3.', do: { give: 'desticka', xp: 1 }, reply: ['…Vy byste ukecala i svatého. Tady máte. Ale strýcovi ani slovo, že jsem něco dala zadarmo. Vydědil by mě.'] },
            ] },
            nabidka: { say: ['Tři sta jízdenek, na místě. Strýc si to koupí zpátky a prodá tomu, kdo dá víc. Vy budete mít klid a lehčí tašku.'], choices: [
                { id: 'prodat', next: 'hub', label: 'Prodám.', do: { take: 'zasilka', tickets: 300, flag: ['netere_hotovo', 'prodala'], trust: { trziste: 2 }, quest: { netere: 'done', zakazka: 'prodana' }, xp: 2 }, reply: ['Obchod! Strýc bude rád a já budu mít provizi. Hrad už vás nemusí zajímat, pošto. Leda jako turistku.'] },
                { id: 'prodat_vic', next: 'hub', label: 'Pro vás čtyři sta. Strýc mi věří.', if: { trust: { trziste: 3 } }, else: 'Čtyři sta dá neteř jen tomu, komu tržiště věří (3).', do: { take: 'zasilka', tickets: 400, flag: ['netere_hotovo', 'prodala'], trust: { trziste: 1 }, quest: { netere: 'done', zakazka: 'prodana' }, xp: 2 }, reply: ['Strýc o vás mluví hezky, a to on nedělá. Čtyři sta, ani jízdenku navíc.'] },
                { id: 'odmitnout', next: 'hub', label: 'Nesu to na Hrad. Doručím.', do: { flag: ['netere_hotovo', 'odmitla_netere'], quest: { netere: 'odmitnuto' }, trust: { metro: 1 } }, reply: ['Doručit. Jak staromódní. Strýc se to dozví a na Malé Straně vás budou čekat kluci z tržiště. Nic osobního, jen obchod.'] },
            ] },
        } },
    hlidac: { stats: { ruka: 2, usta: 1, oko: 2 }, about: 'Hlídá sochu svatého Jana Nepomuckého, i když už není co hlídat.', name: 'Hlídač Nepomuckého', face: 'face_hlidac',
        entry: [{ if: { noFlag: 'met_hlidac' }, node: 'prvni' }, { node: 'hub' }],
        nodes: {
            prvni: { say: ['Sáhnout si na destičku pro štěstí, jedna jízdenka. Destičku někdo ukrad, tak se sahá na díru. Štěstí je stejný, zatím si nikdo nestěžoval.'], do: { flag: 'met_hlidac', quest: { desticka: 'nest' } }, next: 'hub' },
            hub: { say: ['Sáhnout, nebo jen čumět?'], choices: [
                { id: 'desticka', label: 'Nesu vaši destičku.', if: { item: 'desticka' }, else: 'Jen s destičkou z Galerie.', do: { take: 'desticka', quest: { desticka: 'done' }, flag: ['stesti', 'cesta_schody'], xp: 3 },
                    reply: ['Moje destička! Přišroubuju ji zpátky, šroubovák mám od toho dne v kapse.', 'Sáhněte si první, zadarmo. Štěstí vám vydrží, poznáte to v první rvačce.', 'A rada navíc: hradní stráž si v poledne mění místa. Na minutu se nikdo nedívá na Zámecké schody. Kdo je v tu chvíli na schodech, je nahoře.'] },
                { id: 'sahnout', label: 'Sáhnout na díru. (1 jízdenka)', if: { tickets: 1, noFlag: 'stesti' }, else: 'Za jízdenku a jen bez štěstí z destičky.', once: true, do: { tickets: -1, heal: 3 }, reply: ['Díra je teplá. Všichni na ni sahají. Je vám líp? Mně taky, mám jízdenku.'] },
                { id: 'proc', label: 'Proč tu zůstal jen Nepomucký?', once: true, reply: ['Je přišroubovanej. Loďkaři na něj vytáhli pilu a pila přišla o zub. Svatej Jan drží. Do Vltavy ho už jednou hodili, podruhý nechce.'] },
            ] },
        } },
    kanci: { stats: { ruka: 3, usta: 1, oko: 1 }, about: 'Tlupa divočáků pod platany na Kampě. Vůdce má kly jako bodáky.', name: 'Kanci z Kampy', face: null,
        entry: [{ if: { flag: 'kanci_ok' }, node: 'klid' }, { node: 'ryji' }],
        nodes: {
            klid: { say: ['Kanci ryjí pod platany a vás si nevšímají. Vůdce funí, jako by si stěžoval na počasí.'], choices: [] },
            ryji: { say: ['Pod platany ryjí kanci z Petřína. Vůdce zvedne rypák a dívá se na vás jako na lanýž.'], choices: [
                { id: 'boj', end: true, label: 'Prorazit si cestu.', do: { fight: 'kanci' }, win: { flag: 'kanci_ok', xp: 3 } },
                { id: 'naplavka', label: 'Obejít je po náplavce.', if: { attr: { oko: 2 } }, else: 'Cestu po náplavce uvidí jen Oko 2.', do: { flag: 'kanci_ok', xp: 2 }, reply: ['Po kamenech podél Čertovky. Mokré boty, ale celá kůže. Kanci ryjí dál.'], end: true },
                { id: 'zpet', label: 'Couvnout.', end: true },
            ] },
        } },
    mlynar: { stats: { ruka: 3, usta: 1, oko: 2 }, about: 'Roztočil mlýnské kolo na Čertovce a rozsvítil jedinou žárovku v Praze, která nesvítí Hradu.', name: 'Mlynář z Kampy', face: 'face_mlynar',
        shop: [
            { item: 'chleba', price: 4, if: { quest: { proud: 'done' } }, reply: ['Z mouky z Čertovky. Mlýn mele, plotna hřeje. Kolik let jsem tohle nemohl říct.'] },
        ],
        entry: [{ if: { noFlag: 'kanci_ok' }, node: 'kanci' }, { if: { noFlag: 'met_mlynar' }, node: 'prvni' }, { node: 'hub' }],
        nodes: {
            kanci: { say: ['Mlynář na vás volá přes Čertovku: „Kanci! Pod platany jsou kanci! Dokud tam ryjou, sem nechoďte, kolo počká.“'], choices: [] },
            prvni: { say: ['Slyšíte? Nic neslyšíte. Čertovka má všechnu vodu, co Vltavě zbyla. Kolo se po sto letech zase roztočilo a já k němu připojil generátor a žárovku. Jedinou v Praze, která nesvítí Hradu.', 'Před týdnem se zaseklo. Žárovka zhasla a Kampa je zase potmě.'], do: { flag: 'met_mlynar', quest: { proud: 'nest' } }, next: 'hub' },
            hub: { say: ['Kolo stojí, žárovka nesvítí. Co chcete?'], choices: [
                { id: 'sila', label: 'Uvolním to kolo.', if: { attr: { ruka: 2 }, quest: { proud: 'nest' } }, else: 'Odvalit, co v kole vězí, chce Ruku 2.', next: 'kolo' },
                { id: 'hraz', label: 'Přehradím Čertovku, ať se dá kolo vyprostit.', if: { attr: { oko: 2 }, quest: { proud: 'nest' } }, else: 'Kde přehradit proud, uvidí jen Oko 2.', next: 'kolo' },
                { id: 'nabit', label: 'Můžete nabít tuhle krabičku?', if: { item: 'zasilka', quest: { proud: 'done' }, noFlag: 'nabito' }, else: 'Až kolo zase jede a jen se zásilkou v tašce.', do: { flag: 'nabito', xp: 2 }, reply: ['Ukažte. Má to konektor jako všechno z metra. Vybitá na dřeň, kdo ví jak dlouho.', 'Hotovo. Teď by to promluvilo, kdyby to někdo pustil. Nevím, co to je, a nechci to vědět. Proud se neptá, co pohání.'] },
                { id: 'obchod', label: 'Prodáte něco?', shop: true },
                { id: 'zed', label: 'Proč jste přemaloval Lennonovu zeď?', once: true, reply: ['Potmě ji stejně nikdo neviděl. Teď je na ní jediný nápis: PROUD. Když žárovka svítí, přečte si ho celá Kampa.'] },
            ] },
            kolo: { say: ['Kolo vězí na něčem kamenném.'], choices: [
                { id: 'uvolnit', next: 'hub', label: 'Do toho.', do: { quest: { proud: 'done' }, flag: 'zarovka', xp: 3 },
                    reply: ['V lopatkách vězí kamenná hlava, nějaký svatý, kterého loďkaři nedovezli. Hlava jde ven a kolo se rozjede.', 'Žárovka nad mlýnem se rozsvítí. Lidi pod oblouky mostu zvednou hlavy. Mlynář pláče a tvrdí, že je to prach.', 'Kdybyste měla něco na nabití, proud je zadarmo. Pro vás.'] },
            ] },
        } },
    mostecka: { name: 'Mostecká ulice', face: null,
        entry: [{ node: 'ulice' }],
        nodes: {
            ulice: { say: ['Malostranská mostecká věž. Za ní Mostecká a Malá Strana, suchá a netknutá, jako by se nic nestalo.'], choices: [
                { id: 'jit', label: 'Jít na Malou Stranu.', do: { travel: 'malastrana' } },
                { id: 'zpet', label: 'Ještě ne.', end: true },
            ] },
        } },
    // —— Malá Strana ——
    vymahaci: { stats: { ruka: 3, usta: 2, oko: 1 }, about: 'Fantovi kluci na Malé Straně. Řetěz, baseballka a nic osobního.', faction: 'trziste', name: 'Tržištní vymahači', face: 'face_vymahac',
        entry: [{ if: { flag: 'vymahaci_pryc' }, node: 'sedi' }, { node: 'cekaji' }],
        nodes: {
            sedi: { say: ['Vymahači sedí u morového sloupu a dělají, že vás nevidí. Větší si zapaluje, menší kouká do zdi.'], choices: [] },
            cekaji: { do: { flag: 'met_vymahaci' }, say: ['Dva chlapi v teplákovkách se opírají o morový sloup. „Pošťačka. Pan Fanta vzkazuje, že nespolupracujete. Tak jdeme spolupracovat my.“'], choices: [
                { id: 'boj', end: true, label: 'Tak pojďte.', do: { fight: 'vymahaci' }, win: { flag: 'vymahaci_pryc', xp: 3 } },
                { id: 'zaplatit', label: 'Kolik stojí, abyste mě neviděli? (10 jízdenek)', check: 'usta', if: { tickets: 10 }, else: 'Usmlouvat to chce Ústa 2 a deset jízdenek.', do: { tickets: -10, flag: 'vymahaci_pryc', xp: 1 }, reply: ['Deset. Neviděli jsme vás. Ani tu krabičku. Panu Fantovi řekneme, že jste byla rychlá.'] },
                { id: 'odstrcit', label: 'Odstrčit je a projít.', check: 'ruka', else: 'Odstrčit vymahače chce Ruku 3.', do: { flag: 'vymahaci_pryc', xp: 2 }, failReply: ['Větší z nich se ani nehne. Menší vás strčí zpátky na dlažbu.'], reply: ['Menšího odstrčíte do sloupu, větší couvne. „Dobře, dobře. Panu Fantovi řekneme, že jste byla rychlá.“'] },
                { id: 'fanta', label: 'Pan Fanta mi věří. Zeptejte se ho.', if: { trust: { trziste: 3 } }, else: 'Jen když vám tržiště věří (3).', do: { flag: 'vymahaci_pryc' }, reply: ['…Věří? Vám? To nám neřekl. Dobře, my jsme vás neviděli, vy jste neviděla nás.'] },
                { id: 'utect', label: 'Couvnout k mostu.', end: true },
            ] },
        } },
    pani: { stats: { ruka: 1, usta: 3, oko: 2 }, about: 'Bydlí v Nerudovce odjakživa. Pamatuje si noc, kdy přišla voda.', name: 'Paní z Nerudovky', face: 'face_pani',
        entry: [{ if: { noFlag: 'met_pani' }, node: 'prvni' }, { node: 'hub' }],
        nodes: {
            prvni: { say: ['Osmdesát let bydlím tady, U Dvou slunců. Pamatuju tři povodně, tohle je čtvrtá. Do Nerudovky nedošla ani jedna, tak se dívám z okna.', 'Hrad zavřeli už podruhé za můj život. A u brány pořád stojí ti samí kluci, jen zhubli.'], do: { flag: 'met_pani' }, next: 'hub' },
            hub: { say: ['Sedněte si, holka. Pošta tu nebyla rok.'], choices: [
                { id: 'noc', label: 'Co se stalo tu noc předtím?', once: true, do: { flag: 'utrzek4', xp: 1 }, reply: ['V noci jela nahoru kolona. Černé dodávky, na dveřích znak s vlnou a šipkou a nápis Kancelář kanálu.', 'Ráno se Hrad zavřel. A odpoledne ve 14:37 přišla voda. Já to viděla z okna, mám dobré oči a nic jiného na práci.'] },
                { id: 'dopis', label: 'Nemáte tu pro mě něco k doručení?', once: true, do: { tickets: 3 }, reply: ['Dopis synovi do Brna. Rok ho nosím v zástěře. Brno asi není, ale pošta je, tak ho vemte. A tady máte na poštovné.'] },
                { id: 'straz', label: 'Jak se dostanu na Hrad?', once: true, reply: ['Bránou ne, kluci nikoho nepustí. Kastelán chodí dolů nakupovat, s ním byste prošla. Velvyslanec dole v paláci vydává razítka a kluci salutují všemu, co má razítko. A ten zlatý trabant, co mi kope do popelnic, vyleze nahoru, když má benzín.'] },
            ] },
        } },
    velvyslanec: { stats: { ruka: 1, usta: 3, oko: 3 }, about: 'Velvyslanec státu, který se rok neozval. Razítko má pořád.', name: 'Velvyslanec bez země', face: 'face_velvyslanec',
        entry: [{ if: { noFlag: 'met_velvyslanec' }, node: 'prvni' }, { node: 'hub' }],
        nodes: {
            prvni: { say: ['Dobrý den. Velvyslanectví je otevřeno, úřední hodiny trvají nepřetržitě. Návštěvy nejsou, tak to jde.', 'Z domova se rok nikdo neozval. Nevím, jestli domov ještě je. Ale razítko mám, a dokud je razítko, je i stát.'], do: { flag: 'met_velvyslanec' }, next: 'hub' },
            hub: { say: ['Čím mohu sloužit?'], choices: [
                { id: 'zpravy', label: 'Nesu zprávy. Praha žije, metro jezdí, loďkaři plují.', if: { any: [{ flag: 'utrzek2' }, { flag: 'utrzek3' }, { flag: 'utrzek4' }], noItem: 'propustka' }, else: 'Velvyslanec chce zprávy: stačí jeden útržek o tom, co se stalo.', do: { give: 'propustka', xp: 2 }, reply: ['Zprávy! Skutečné zprávy! Zapíšu si je do depeše, kterou nikam nepošlu.', 'Za to vám vystavím propustku, diplomatickou, s razítkem. Stráž u brány salutuje všemu, co má razítko. To je naučili dřív než ten rozkaz.'] },
                { id: 'koupit', label: 'Vydáte mi propustku za jízdenky? (15 jízdenek)', if: { tickets: 15, noItem: 'propustka' }, else: 'Propustka za jízdenky stojí patnáct.', do: { tickets: -15, give: 'propustka' }, reply: ['Správní poplatek. Stát musí z něčeho žít, i když ho nikdo nevidí.'] },
                { id: 'jidlo', label: 'Nemáte něco k jídlu? Pro stráž.', if: { noItem: 'jidlo', quest: { straz: 'nest' } }, else: 'Jídlo má smysl brát jen pro stráž, když o ně stojí.', do: { give: 'jidlo' }, reply: ['Kanapky z recepce. Rok staré, ale diplomatické, nezkazí se, jen ztvrdnou.'] },
                { id: 'razitko', label: 'Razítko leží na stole. Orazítkovat si propustku sama.', check: 'oko', if: { noItem: 'propustka' }, else: 'Vzít si razítko, když se velvyslanec dívá z okna, chce Oko 3.', do: { give: 'propustka', xp: 2 }, reply: ['Velvyslanec se dívá z okna k domovu, který asi není. Razítko je těžké a voní inkoustem. Stát je chvíli váš.'] },
                { id: 'trabant', label: 'Co je to za zlatý trabant na nohách?', once: true, reply: ['Dar umělce naší zahradě. Když spadla zeď, vylezl ven a od té doby chodí po Malé Straně a nadává. Na autora, na benzín, na mě. Ani dary už nezůstávají, kde mají.'] },
            ] },
        } },
    trabant: { name: 'Trabant na nohách', face: null,
        entry: [{ if: { flag: 'trabant_najedeny' }, node: 'jede' }, { node: 'nadava' }],
        nodes: {
            nadava: { say: ['Zlatý trabant na čtyřech nohách přešlapuje u zdi. Z výfuku: „Černý je idiot. Dal mi nohy a vzal mi kola. Tohle má být umění? Benzín! Dejte mi benzín!“'], choices: [
                { id: 'smes', label: 'Mám směs. Jedna ku pětadvaceti.', if: { item: 'smes' }, else: 'Trabant chce benzín; směs prodává Pilař na mostě.', do: { take: 'smes', flag: 'trabant_najedeny', xp: 2 }, reply: ['Glo glo glo… Dvoutakt! Konečně někdo, kdo rozumí strojům. Nasedněte. Kam? Na Hrad? Mám diplomatickou značku, salutujou mi.'], next: 'jede' },
                { id: 'mluvit', label: 'Proč nadáváte na Černého?', once: true, reply: ['Protože mě udělal symbolem. Symbol nepotřebuje benzín, říkal. Symbol potřebuje pochopení. Já potřebuju benzín, pochopení mám až po krk.'] },
                { id: 'zpet', label: 'Nechat ho nadávat.', end: true },
            ] },
            jede: { say: ['Trabant poskakuje na místě. „Nahoru? Jedu, kam chcete, hlavně ne zpátky do zahrady.“'], choices: [
                { id: 'hrad', label: 'Na Hrad.', do: { flag: 'trabantem', travel: 'hrad' } },
                { id: 'pockat', label: 'Ještě počkej.', end: true },
            ] },
        } },
    straz: { stats: { ruka: 3, usta: 1, oko: 1 }, about: 'Hradní stráž. Rok nejí nic než z automatu, ale stojí dál.', name: 'Hradní stráž', face: 'face_straz',
        entry: [{ if: { noFlag: 'met_straz' }, node: 'prvni' }, { node: 'hub' }],
        nodes: {
            prvni: { say: ['Stůj, kdo jde! …Nikdo nejde. Rozkaz zní: nikoho nepouštět.', 'Kdo ten rozkaz vydal? Nevím. Kdo ho zruší? Nikdo. Takže stojíme.'], do: { flag: 'met_straz', quest: { straz: 'nest' } }, next: 'hub' },
            hub: { say: ['Brána je zavřená. Pro poštu taky.'], choices: [
                { id: 'propustka', label: 'Mám propustku s razítkem.', if: { item: 'propustka' }, else: 'Jen s propustkou od velvyslance.', do: { flag: 'propustkou', travel: 'hrad' }, reply: ['Razítko. Diplomatické. Salutovat! …Projděte. Rozkaz neříká nic o razítkách.'] },
                { id: 'uredni', label: 'Jsem úřední osoba, zapsaná v evidenci metra.', if: { item: 'vypis', flag: 'uredni_osoba' }, else: 'Úřední osobou je jen ta, koho dispečerka ohlásila a zapsala.', do: { flag: 'propustkou', trust: { metro: 1 }, travel: 'hrad' }, reply: ['Výpis z evidence a úřední osoba. Na to rozkaz nemyslel. Projděte, kolegyně.'] },
                { id: 'metro', label: 'Metro za mě ručí. Zavolejte si dispečink.', if: { trust: { metro: 4 } }, else: 'Jen když vás metro bere za svou (4).', do: { flag: 'propustkou', travel: 'hrad' }, reply: ['Dispečink? Ten rozhlas, co je slyšet až sem? …Rozkaz nemyslel na metro. Projděte.'] },
                { id: 'jidlo', label: 'Nesu vám jídlo.', if: { item: 'jidlo' }, else: 'Jen s jídlem od velvyslance.', do: { take: 'jidlo', quest: { straz: 'done' }, flag: ['straz_info', 'cesta_schody'], xp: 2 }, reply: ['Kanapky! Diplomatické! Rok jsme jedli z automatu na nádvoří.', 'Za to vám řekneme: Kastelán chodí dolů každé ráno a nahoru, když nakoupí. A v poledne si měníme místa, na minutu se nikdo nedívá na Zámecké schody. To jsme vám neřekli.'] },
                { id: 'hlad', label: 'Nemáte hlad?', once: true, reply: ['Rok jíme jen bagety z automatu na třetím nádvoří. Datum spotřeby už nikdo nečte.'] },
            ] },
        } },
    kastelan: { stats: { ruka: 2, usta: 3, oko: 2 }, about: 'Správce Hradu. Chodí dolů do města nakupovat a nesmlouvá.', faction: 'hrad', name: 'Kastelán', face: 'face_kastelan',
        entry: [{ if: { noFlag: 'met_kastelan' }, node: 'prvni' }, { node: 'hub' }],
        nodes: {
            prvni: { say: ['Kastelán Pražského hradu. Nakupuji. Sochy, jídlo, umění, dobré zprávy. Platím jízdenkami, nahoře jich máme dost.', 'Vy jste pošťačka s krabičkou. Pan Fanta ji slíbil panu řediteli a pan ředitel nerad čeká.'], do: { flag: 'met_kastelan' }, next: 'hub' },
            hub: { say: ['Mám naspěch, nahoře se svítí a světlo je drahé.'], choices: [
                { id: 'nahoru', label: 'Vezmete mě nahoru?', if: { item: 'zasilka', any: [{ flag: 'met_netere' }, { attr: { usta: 3 } }, { trust: { trziste: 2 } }] }, else: 'Kastelán vezme nahoru jen pošťačku se zásilkou, a to když už potkala Fantovu neteř, nebo když má Ústa 3.', do: { flag: 'kastelanem', trust: { trziste: 1 }, travel: 'hrad' }, reply: ['Vezmu vás jako zásilku. Pan ředitel čeká krabičku, ne pošťačku, tak cestou mlčte. A salutujte, když salutují.'] },
                { id: 'sochy', label: 'Proč Hrad kupuje sochy?', once: true, reply: ['Pan ředitel má rád umění. Hlavně takové, které nikdo jiný nemá. Ve Zlaté uličce máme sochami plné domečky.'] },
            ] },
        } },
    schody: { name: 'Zámecké schody', face: null,
        entry: [{ if: { noFlag: 'holubi_pryc' }, node: 'holubi' }, { node: 'nahore' }],
        nodes: {
            holubi: { say: ['Na schodech sedí holubi. Vypasení, pražští, sebevědomí. Nejtlustší kulhá a dívá se na vás jako na rohlík.'], choices: [
                { id: 'boj', label: 'Rozehnat je.', do: { fight: 'holubi' }, win: { flag: 'holubi_pryc', xp: 2 }, next: 'nahore' },
                { id: 'zed', label: 'Vyšplhat po zídce kolem hejna.', if: { attr: { ruka: 2 } }, else: 'Vyšplhat po zídce chce Ruku 2.', do: { flag: 'holubi_pryc', xp: 1 }, next: 'nahore' },
                { id: 'proklouznout', label: 'Proklouznout, když se dívají jinam.', if: { attr: { oko: 2 } }, else: 'Proklouznout mezi holuby chce Oko 2.', do: { flag: 'holubi_pryc', xp: 1 }, next: 'nahore' },
                { id: 'zpet', label: 'Couvnout.', end: true },
            ] },
            nahore: { say: ['Nahoře na schodech je zídka a za ní Hradčanské náměstí. Stráž stojí u brány, bokem k vám.'], choices: [
                { id: 'poledne', label: 'Počkat na poledne a přelézt.', if: { flag: 'cesta_schody' }, else: 'Kdy se nikdo nedívá, ví hlídač Nepomuckého nebo stráž sama.', do: { flag: 'schody_cesta', xp: 2, travel: 'hrad' }, reply: ['Poledne. Stráž si mění místa a na minutu se nikdo nedívá. Přes zídku, přes náměstí a Matyášovou branou dovnitř.'] },
                { id: 'zpet', label: 'Vrátit se dolů.', end: true },
            ] },
        } },
    mostecka_zpet: { name: 'Mostecká ulice', face: null,
        entry: [{ node: 'ulice' }],
        nodes: {
            ulice: { say: ['Mostecká dolů k mostu. Za věží suché koryto, Kampa a mlýn.'], choices: [
                { id: 'jit', label: 'Vrátit se na most a na Kampu.', do: { travel: 'most' } },
                { id: 'zpet', label: 'Zůstat.', end: true },
            ] },
        } },
    // —— Hrad ——
    pruvodkyne: { stats: { ruka: 1, usta: 3, oko: 2 }, about: 'Provádí po Hradě, i když nikdo nepřišel. Na závěr má vždycky otázky.', name: 'Průvodkyně', face: 'face_pruvodkyne',
        entry: [{ if: { noFlag: 'met_pruvodkyne' }, node: 'prvni' }, { node: 'hub' }],
        nodes: {
            prvni: { say: ['Dobrý den, vítejte na Pražském hradě! Jste první skupina po roce. Prohlídky jsou v jedenáct a ve dvě, a protože tu nejdou hodiny, je pořád obojí.', 'Vlevo katedrála, vpravo konec světa. Dotazy až na závěr.'], do: { flag: 'met_pruvodkyne', quest: { prohlidka: 'nest' } }, next: 'hub' },
            hub: { say: ['Pokračujeme. Držte se deštníku.'], choices: [
                { id: 'stit', label: 'Co je v té buňce na nádvoří?', once: true, do: { flag: 'utrzek5', xp: 1 }, reply: ['Stavební buňka metra E. Odtud se řídila ražba pod Hradem. Kancelář kanálu si ji nechala, je v ní čtečka záznamníku štítu, jediná v Praze.', 'Mezi námi: štít stál dva dny. Geologové psali, že před ním je voda. Pan ředitel podepsal, že není. Pak tam byla.'] },
                { id: 'dotazy', label: 'Mám dotazy na závěr.', if: { quest: { prohlidka: 'nest' } }, else: 'Dotazy jsou jen jednou.', next: 'kviz1' },
                { id: 'duchod', label: 'Kdy přijde důchod?', if: { quest: { duchod: 'nest' } }, else: 'Jen když jste to slíbila trafikantce.', do: { quest: { duchod: 'done' }, flag: 'duchod_zeptala', xp: 1 }, reply: ['Důchod? To se ptejte pana ředitele, ale ten řekne, že až dokončí kanál. Napište paní trafikantce, že se pošta zeptala. Za celý rok se nikdo jiný nezeptal.'] },
            ] },
            kviz1: { say: ['Výborně! Otázka první: co dělají apoštolové na Orloji?'], choices: [
                { id: 'a1', label: 'Vycházejí mokří.', if: { flag: 'apostolove' }, else: 'To ví jen ten, kdo pomohl Orlojníkovi.', next: 'kviz2' },
                { id: 'a1x', label: 'Nevím.', reply: ['Škoda. Prohlídka pokračuje bez vyhlídky.'], do: { quest: { prohlidka: 'done' } }, end: true },
            ] },
            kviz2: { say: ['Otázka druhá: kde je kůň svatého Václava?'], choices: [
                { id: 'a2', label: 'Ve Zlaté uličce, s cenovkou.', if: { any: [{ quest: { kun: ['stopa', 'done'] } }, { flag: 'zlata_videla' }] }, else: 'To ví jen ten, kdo pátral po soše.', next: 'kviz3' },
                { id: 'a2x', label: 'Nevím.', reply: ['Škoda. Prohlídka pokračuje bez vyhlídky.'], do: { quest: { prohlidka: 'done' } }, end: true },
            ] },
            kviz3: { say: ['Otázka třetí: proč na mostě zůstal Nepomucký?'], choices: [
                { id: 'a3', label: 'Je přišroubovaný.', if: { flag: 'met_hlidac' }, else: 'To ví jen ten, kdo mluvil s hlídačem na mostě.', do: { quest: { prohlidka: 'done' }, flag: 'vyhlidka_otevrena', xp: 3 }, reply: ['Výborně! Tři z tří. To se za rok nikomu nepovedlo, protože tu nikdo nebyl.', 'Za odměnu vám odemknu vyhlídku Na Opyši. Je odtamtud vidět celé nové koryto, od Hlaváku po Vyšehrad.'] },
                { id: 'a3x', label: 'Nevím.', reply: ['Škoda. Prohlídka pokračuje bez vyhlídky.'], do: { quest: { prohlidka: 'done' } }, end: true },
            ] },
        } },
    ochranka: { stats: { ruka: 3, usta: 2, oko: 1 }, about: 'Ochranka Kanceláře kanálu v reflexních vestách. Rok bez výplaty.', faction: 'hrad', name: 'Ochranka kanálu', face: 'face_ochranka',
        entry: [{ if: { flag: 'ochranka_pryc' }, node: 'pauza' }, { node: 'stuj' }],
        nodes: {
            pauza: { say: ['Ochranka sedí na schodech buňky a kouří. „My tu nejsme. Máme pauzu.“'], choices: [] },
            stuj: { do: { flag: 'met_ochranka' }, say: ['Dva chlapi v reflexních vestách Kanceláře kanálu se postaví před buňku. „Sem ne. Stavba. Rozkaz pana ředitele.“'], choices: [
                { id: 'kastelan', label: 'Jdu s Kastelánem. Jsem zásilka.', if: { flag: 'kastelanem' }, else: 'Jen když vás nahoru vedl Kastelán.', do: { flag: 'ochranka_pryc' }, reply: ['Zásilka pro pana ředitele. Jasně. Projděte.'], end: true },
                { id: 'vyplata', label: 'Kdy jste naposled dostali výplatu?', check: 'usta', else: 'Rozmluvit ochranku chce Ústa 2.', do: { flag: 'ochranka_pryc', trust: { metro: 1 }, xp: 2 }, reply: ['…Před rokem. Od té doby nás platí jízdenkami, které si pan ředitel tiskne sám. Metro je neuzná.', 'Víte co? Máme pauzu. Dlouhou. Klidně až do konce.'], end: true },
                { id: 'zaplatit', label: 'Tady máte výplatu. (20 jízdenek)', if: { tickets: 20 }, else: 'Výplata pro dva stojí dvacet jízdenek.', do: { tickets: -20, flag: 'ochranka_pryc', xp: 1 }, reply: ['Pravé jízdenky z metra! Neoznačené! Nic jsme neviděli, jdeme na oběd, poprvé po roce.'], end: true },
                { id: 'protlacit', label: 'Protlačit se mezi nimi ke dveřím.', check: 'ruka', else: 'Protlačit se mezi ochrankou chce Ruku 3.', do: { flag: 'ochranka_pryc', xp: 2 }, failReply: ['Narazíte do reflexní vesty jako do zdi. Odrazíte se zpátky na dlažbu.'], reply: ['Prosmýknete se ramenem mezi nimi. Než se otočí, držíte kliku. „Tak jo. Za tohle nás neplatí.“'] },
                { id: 'boj', end: true, label: 'Projít silou.', do: { fight: 'ochranka' }, win: { flag: 'ochranka_pryc', xp: 3 } },
                { id: 'zpet', label: 'Ustoupit.', end: true },
            ] },
        } },
    reditel: { stats: { ruka: 1, usta: 3, oko: 3 }, about: 'Ředitel Kanceláře kanálu. Sedí v buňce na nádvoří a podepisuje.', faction: 'hrad', name: 'Ředitel Kanceláře kanálu', face: 'face_reditel',
        entry: [{ if: { noFlag: 'met_reditel' }, node: 'prvni' }, { node: 'hub' }],
        nodes: {
            prvni: { say: ['Pošta! Na Hradě! Pan prezident by měl radost, kdyby tu byl. Já jsem ředitel Kanceláře kanálu. Posaďte se, máme generátor a kafe.', 'Kanál je dílo století. Voda ve Starém Městě je přechodná fáze. Až dokončíme druhou větev, bude Praha přístav. Lidé to zatím nedocenili. Nedocenili ani metro, dokud jezdilo.'], do: { flag: 'met_reditel' }, next: 'hub' },
            hub: { say: ['Nesete mi něco?'], choices: [
                { id: 'prodat', label: 'Krabičku od pana Fanty. Kolik dáte?', if: { item: 'zasilka' }, else: 'Jen se zásilkou v tašce.', next: 'prodej' },
                { id: 'podepsal', label: 'Podepsal jste, že před štítem není voda.', if: { any: [{ flag: 'utrzek5' }, { flag: 'utrzek2' }] }, else: 'To ví jen ten, kdo slyšel o štítu od potápěčky nebo od průvodkyně.', once: true, reply: ['Podepsal jsem přijatelné riziko. Riziko se naplnilo, to se rizikům stává. Kdybych nepodepsal, stál by štít dodnes a kanál by nebyl. Takhle máme aspoň vodu.'] },
                { id: 'duchod', label: 'Kdy přijde důchod?', if: { quest: { duchod: 'nest' } }, else: 'Jen když jste to slíbila trafikantce.', do: { quest: { duchod: 'done' }, flag: 'duchod_zeptala', xp: 1 }, reply: ['Až dokončíme kanál. Napište to tak. Pošta píše, lidi věří.'] },
            ] },
            prodej: { say: ['Dvě stě, jak slíbil pan Fanta. A k tomu sleva na všechno na Hradě. Záznam zůstane v šuplíku, kam patří.'], choices: [
                { id: 'ano', label: 'Prodám. Všechno je na prodej.', do: { take: 'zasilka', tickets: 200, flag: 'prodala_reditelovi', trust: { trziste: 2 }, ending: 'trziste' } },
                { id: 'ne', label: 'Ještě si to rozmyslím.', end: true, reply: ['Rozmýšlejte. Generátor jede, kafe teče, času máme dost. Vody taky.'] },
            ] },
        } },
    ctecka: { name: 'Čtečka záznamníku štítu', face: null,
        entry: [{ if: { noFlag: 'ochranka_pryc' }, node: 'zavreno' }, { node: 'ctecka' }],
        nodes: {
            zavreno: { say: ['Buňku hlídá ochranka kanálu. Ke čtečce se nedostanete.'], choices: [] },
            ctecka: { say: ['Ve stavební buňce bliká zelená obrazovka. Konektor čtečky je stejný jako na krabičce. Vedle mikrofon: linka do rozhlasu metra, kterou sem kdysi natáhli kvůli stavbě.'], choices: [
                { id: 'pustit', label: 'Zapojit krabičku a pustit záznam do rozhlasu.', if: { item: 'zasilka' }, else: 'Bez zásilky není co přehrát.', do: { flag: 'prehrala', ending: 'hrad' } },
                { id: 'prazdna', label: 'Nemám co zapojit. Zapnout aspoň rozhlas.', if: { noItem: 'zasilka' }, else: 'Jen bez zásilky.', do: { ending: 'hrad' } },
                { id: 'zpet', label: 'Ještě ne.', end: true },
            ] },
        } },
    zlata: { name: 'Zlatá ulička', face: null,
        entry: [{ node: 'sklad' }],
        nodes: {
            sklad: { say: ['V domečcích Zlaté uličky stojí sochy. Svatý Ivo bez hlavy, Bruncvík bez meče, a v posledním domečku kůň. Kůň svatého Václava, s cenovkou, kterou nikdo nezaplatí.'], choices: [
                { id: 'kun', label: 'Prohlédnout si koně.', once: true, do: { flag: 'zlata_videla', xp: 2 }, reply: ['Na cenovce stojí: „Kůň, bronz, Myslbek, 1 ks. Rezervováno pro p. ředitele.“ Na kopytě někdo vyškrábal: VÁCLAV TU NEBYL.'] },
            ] },
        } },
    vyhlidka: { name: 'Vyhlídka Na Opyši', face: null,
        entry: [{ if: { flag: 'vyhlidka_otevrena' }, node: 'otevreno' }, { node: 'zavreno' }],
        nodes: {
            zavreno: { say: ['Branka na vyhlídku je zamčená. Na cedulce: „Prohlídky v 11 a ve 14 h s průvodkyní.“'], choices: [] },
            otevreno: { say: ['Pod vámi celá Praha. Vltava teče jinudy: nové koryto se táhne od Hlaváku přes Staré Město, kolem suchého mostu, až ke zlomenému Nuseláku a Vyšehradu, kde svítí ohně loďkařů.'], choices: [
                { id: 'divat', label: 'Dívat se.', once: true, do: { flag: 'vyhlidka', xp: 2 }, reply: ['Je to hodně vody. A někdo to podepsal.'] },
            ] },
        } },
};
