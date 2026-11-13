// Nuselák: ručně určené prvky nad mapou z OSM (data/nuselak.json). Osa a na jih po Nuselském mostě od Karlova (a ≈ 0)
// k Pankráci (a ≈ 107), b na západ. Údolí Botiče je zatopené (jezero pod 212 m), mostovka b 17–20 vede nad ním,
// uprostřed prostředního pole je zlom (a 44–49), přes něj lano. Sever: Muzeum Policie, lanař, Kuřačka u mola.
// Jih: souprava metra C v troubě mostu, kotě, kormidelník loďkařů u mola, Palác kultury, hotel Forum, stanice
// Vyšehrad. Příběh a postavy: docs/pribeh.md, místo Nuselák.
export const NUSELAK = {
    start: { a: 21, b: 25 },
    // příchod: Kuřaččinou loďkou od Václaváku k severnímu molu, s flotilou od Kampy k jižnímu molu
    arrivals: { vaclavak: { a: 21, b: 25 }, staromak: { a: 77, b: 24 }, most: { a: 76, b: 24 } },
    landmark: [
        { atlas: 'landmarks_nusle', key: 'lm_muzeum_policie', a0: 2, w: 7, b0: 34, dpt: 9 },
        { atlas: 'landmarks_nusle', key: 'lm_kcp', a0: 94, w: 14, b0: 28, dpt: 18 },
        { atlas: 'landmarks_nusle', key: 'lm_forum', a0: 90, w: 7, b0: 0, dpt: 9 },
    ],
    // most: mostovka, zlom, pilíře (po 15,5 dlaždice jako skutečná pole 115 m), lano v řádku b 19
    nusle: { a0: 15, a1: 79, deck: [17, 20], gap: [44, 49], piers: [23, 38, 55, 70], rope: 19,
        // stanice Vyšehrad pod silnicí za koncem mostu: silnice (b 17–20) je o patro výš než terén u mola. Od hrany
        // edge visí stěna: holý beton (plain), schody dolů k molu (stairs, dvě dlaždice), prosklené čelo haly (glass)
        // a za ním tři díly klínu do terénu; hole je díra ve vozovce, kterou je vidět kolej a nástupiště
        station: { edge: 20, plain: [78, 79], stairs: 80, glass: [82, 88], hole: { a0: 83, b0: 18, w: 5, dpt: 2 } } },
    stops: {
        // Kuřačka stojí v loďce u severního mola (loďka leží pod ní: under)
        kuracka_nusle: { npc: { key: 'kuracka', a: 22, b: 25 }, approach: { a: 21, b: 25 }, props: [{ key: 'lodka', a: 21.55, b: 25.45, block: false, under: true }] },
        // policista bez pravomocí u vchodu do Muzea Policie, před muzeem vrak Tatry VB
        policista: { npc: { key: 'policista', a: 3, b: 43 }, approach: { a: 4, b: 43 }, props: [{ key: 'tatra_vb', a: 10, b: 38 }],
            after: { if: { quest: { kote: 'done' } }, npc: { key: 'policista_kote', a: 3, b: 43 } } },
        // lanař u severního konce zlomu, sloupek lana na 43,19
        lanar: { npc: { key: 'lanar', a: 43, b: 18 }, approach: { a: 42, b: 18 }, props: [] },
        // jižní konec zlomu: racek na sloupku lana (zpátky na sever), souprava v troubě, kotě u ní
        kladka: { npc: { key: 'racek', a: 50, b: 19 }, approach: { a: 51, b: 19 }, props: [] },
        souprava: { npc: { key: 'bedny', a: 52, b: 17 }, approach: { a: 52, b: 18 }, props: [] },
        kote: { npc: { key: 'kote', a: 50, b: 17 }, approach: { a: 51, b: 17 }, props: [], hideIf: { flag: 'kote_mam' } },
        // kormidelník loďkařů v loďce u jižního mola (na Staromák, a s flotilou na Vyšehrad)
        kormidelnik: { npc: { key: 'kormidelnik', a: 67, b: 24 }, approach: { a: 68, b: 24 }, props: [{ key: 'lodka', a: 66.55, b: 24.45, block: false, under: true }] },
        // stanice Vyšehrad: sloupek s céčkem na silnici u díry nad halou (nusle.station)
        vysehrad: { npc: { key: 'metro_totem_c', a: 82, b: 20, flip: false }, approach: { a: 82, b: 19 }, props: [] },
    },
    // lachtani a racci v zatopeném údolí, racci na mostovce, zatopené střechy (art/kuriozity.px.js, nusle-postavy)
    oddities: [
        { on: 'w', keys: ['lachtan', 'lachtan_lezi', 'lachtan', 'lachtan_lezi', 'lachtan', 'racek_let', 'lachtan', 'racek_let', 'mlok_maly_1'] },
        { on: 'p', area: { a0: 16, a1: 78, b0: 17, b1: 20 }, block: false, keys: ['racek', 'racek', 'racek', 'racek'] },
    ],
    props: { wreck: 0.01, trees: ['tree_a', 'tree_bare', 'tree_c'], bush: 0.04, bushes: ['bush_a', 'bush_b', 'bush_c'], fire: 0.01, junk: 0.02, junkKeys: ['rubble_pile', 'barrel', 'tires'], shack: 0 },
};
