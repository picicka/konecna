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
        netere: { npc: { key: 'netere', a: 27, b: 32 }, approach: { a: 26, b: 32 }, props: [{ key: 'podstavec_a', a: 24, b: 31 }, { key: 'bedny', a: 28, b: 31 }, { key: 'podstavec_b', a: 29, b: 33 }] },
        hlidac: { npc: { key: 'hlidac', a: 33, b: 32 }, approach: { a: 32, b: 32 }, props: [{ key: 'podstavec_nepomuk', a: 34, b: 31 }, { key: 'podstavec_c', a: 38, b: 33 }] },
        kanci: { npc: { key: 'kanec', a: 58, b: 8 }, approach: { a: 57, b: 8 }, props: [] },
        mlynar: { npc: { key: 'mlynar', a: 67, b: 18 }, approach: { a: 68, b: 18 }, props: [{ key: 'mlynske_kolo', a: 66, b: 17, anim: true }, { key: 'zarovka', a: 69, b: 19 }] },
        mostecka: { npc: { key: 'lamp', a: 74, b: 23 }, approach: { a: 73, b: 23 }, props: [] },
    },
    props: { trees: ['tree_a', 'tree_bare', 'tree_c'], bush: 0.05, bushes: ['bush_a', 'bush_b', 'bush_c'], junk: 0.03, junkKeys: ['rubble_pile', 'barrel', 'tires'], shack: 0 },
};
