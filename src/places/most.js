// Karlův most a Kampa: ručně určené prvky nad mapou z OSM (data/most.json). Osa a na západ po mostě od Staroměstské
// mostecké věže (a ≈ 9) k Malostranské (a ≈ 70), b na sever. Vltava teče jinudy: koryto je suché bahno (h), most vede
// přes něj, Čertovka (w) má všechnu vodu. Kampa je jižně od mostu (b 0–16). Příběh a postavy: docs/pribeh.md, místo 4.
export const MOST = {
    start: { a: 10, b: 37 },
    arrivals: { staromak: { a: 10, b: 37 }, malastrana: { a: 72, b: 23 } },
    // mostecké věže stojí na mostě, most prochází jejich branou (pass: řádek b, který zůstává průchozí)
    landmark: [
        { atlas: 'landmarks_most', key: 'lm_vez_stare', a0: 9, w: 3, b0: 32, dpt: 3, pass: 33 },
        { atlas: 'landmarks_most', key: 'lm_veze_male', a0: 76, w: 3, b0: 31, dpt: 5, pass: 33 },
    ],
    stops: {
        pilar: { npc: { key: 'pilar', a: 8, b: 37 }, approach: { a: 9, b: 37 }, props: [{ key: 'bedny', a: 8, b: 36 }] },
        netere: { npc: { key: 'netere', a: 27, b: 32 }, approach: { a: 26, b: 32 }, props: [{ key: 'podstavec_a', a: 24, b: 32 }, { key: 'bedny', a: 28, b: 32 }, { key: 'cedule_galerie', a: 28.3, b: 31.7 }, { key: 'podstavec_b', a: 29, b: 33 }] },
        hlidac: { npc: { key: 'hlidac', a: 33, b: 32 }, approach: { a: 32, b: 32 }, props: [{ key: 'podstavec_nepomuk', a: 34, b: 32 }, { key: 'podstavec_c', a: 38, b: 33 }] },
        // kanci ryjí na dvoře mlýna mezi mlynářem a kolem (dřív v parku na Kampě, kde šli minout a nic nehlídali)
        kanci: { npc: { key: 'kanec', a: 66, b: 17 }, approach: { a: 67, b: 17 }, props: [{ key: 'kanec', a: 66, b: 15, anim: true, flip: true }],
            // po boji nebo po šrotu (kanci_ok) odejdou přes lávku pod platany na Kampě a dvůr mlýna je volný
            after: { if: { flag: 'kanci_ok' }, npc: { key: 'kanec', a: 58, b: 8, from: 'npc' }, approach: { a: 57, b: 8 }, props: [{ key: 'kanec', a: 59, b: 9, anim: true, flip: true, from: 0, delay: 400 }] } },
        mlynar: { npc: { key: 'mlynar', a: 67, b: 18 }, approach: { a: 68, b: 18 }, props: [{ key: 'mlynske_kolo', a: 64.4, b: 17, flip: true }, { key: 'zarovka_zhasla', a: 69, b: 19 }, { key: 'zed_lennon_0', a: 70, b: 22 }, { key: 'zed_lennon_1', a: 71, b: 22, say: 'zed_lennon' }, { key: 'zed_lennon_2', a: 72, b: 22 }],
            // přemalovaná Lennonova zeď (tři díly po dlaždici, nápis PROUD) stojí na Velkopřevorském náměstí u mlýna
            // kolo stojí a žárovka nesvítí, dokud ho pošťačka neuvolní (vlajka zarovka); kolo leží po proudu Čertovky (zrcadlený sprite)
            after: { if: { flag: 'zarovka' }, props: [{ key: 'mlynske_kolo', a: 64.4, b: 17, flip: true, anim: true }, { key: 'zarovka', a: 69, b: 19 }, { key: 'zed_lennon_0', a: 70, b: 22 }, { key: 'zed_lennon_1', a: 71, b: 22, say: 'zed_lennon' }, { key: 'zed_lennon_2', a: 72, b: 22 }] } },
        mostecka: { npc: { key: 'lamp', a: 74, b: 23 }, approach: { a: 73, b: 23 }, props: [] },
    },
    // Most nad suchým korytem (WorldScene.buildBridge): mostovka b 32–33, díly od a0 po a1 (za Staroměstskou věží po
    // Čertovku), pilíře podle obrysu mostu v OSM (ledolamy po 30 m, a 51 je břeh Kampy, a 64 v Čertovce), schody na Kampu
    // (skutečné schodiště z mostu na Na Kampě). axis: osa mostu z OSM (mírně do oblouku) pro lampy na zábradlí.
    // noQuay: bez nábřežních zdí kolem výběžku Novotného lávky u Staroměstské věže a zálivu u Čertovky pod Malostranskými
    bridge: { noQuay: [{ a0: 4, a1: 19, b0: 21, b1: 31 }, { a0: 61, a1: 67, b0: 25, b1: 31 }], a0: 12, a1: 66, deck: [32, 33], piers: [10, 14, 18, 22, 27, 31, 35, 39, 43, 47, 51, 64], stairs: [{ a: 56, b: 31 }],
        axis: [[8, 34], [11.3, 34], [22.7, 33.9], [47.5, 32.2], [53.3, 32.1], [57.8, 32.3], [67.9, 32.7], [73.7, 33.3]] },
    // kuriozity v suchém korytě Vltavy (art/kuriozity.px.js, WorldScene.placeOddities)
    oddities: [{ on: 'h', keys: ['mlok', 'stalin_hlava', 'labut', 'kapr_vana', 'mlok_maly_1', 'mlok_maly_2'] },
        // naštvaná labuť plave na Čertovce pod Lennonovou zdí, syčí hlášky (ODDITY_LINES.labut_zla)
        { on: 'w', area: { a0: 65, a1: 66, b0: 23, b1: 24 }, keys: ['labut_zla'] }],
    props: { wreck: 0.005, trees: ['tree_a', 'tree_bare', 'tree_c'], bush: 0.05, bushes: ['bush_a', 'bush_b', 'bush_c'], fire: 0.004, junk: 0.03, junkKeys: ['rubble_pile', 'barrel', 'tires'], shack: 0 },
    // jediná žárovka v Praze svítí, až mlynář rozjede kolo (vlajka zarovka)
    lights: [{ a: 69, b: 19, scale: 1.5, tint: 0xffc070, alpha: 0.9, if: { flag: 'zarovka' } }],
};
