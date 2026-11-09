// Hrad: ručně určené prvky nad mapou z OSM (data/hrad.json). Osa a na východ od Matyášovy brány (a ≈ 2) přes druhé
// a třetí nádvoří, Jiřské náměstí, ke Zlaté uličce (53,8) a vyhlídce Na Opyši (71,23). Katedrála je landmark
// (půdorys L a 12–28, b 13–19). Jediné osvětlené místo v Praze. Příběh a postavy: docs/pribeh.md, místo 6.
export const HRAD = {
    start: { a: 2, b: 18 },
    landmark: [
        { atlas: 'landmarks_hrad', key: 'lm_katedrala', a0: 12, w: 17, b0: 13, dpt: 7 },
        { atlas: 'landmarks_kostely', key: 'lm_jiri', a0: 37, w: 7, b0: 14, dpt: 5 },
    ],
    stops: {
        pruvodkyne: { npc: { key: 'pruvodkyne', a: 11, b: 17 }, approach: { a: 10, b: 17 }, props: [] },
        ochranka: { npc: { key: 'ochranka', a: 20, b: 20 }, approach: { a: 21, b: 20 }, props: [{ key: 'ochranka_cedule', a: 19, b: 21 }] },
        reditel: { npc: { key: 'reditel', a: 23, b: 22 }, approach: { a: 23, b: 21 }, props: [{ key: 'generator', a: 25, b: 21, anim: true }, { key: 'obelisk', a: 24, b: 19 }] },
        ctecka: { npc: { key: 'ctecka', a: 21, b: 22 }, approach: { a: 22, b: 22 }, props: [{ key: 'bunka', a: 21, b: 24 }, { key: 'reflektor', a: 19, b: 23 }] },
        zlata: { npc: { key: 'podstavec_c', a: 53, b: 9 }, approach: { a: 53, b: 8 }, props: [] },
        vyhlidka: { npc: { key: 'bench', a: 72, b: 23 }, approach: { a: 71, b: 23 }, props: [], hideIf: { noFlag: 'vyhlidka_otevrena' } },
    },
    props: { trees: ['tree_a', 'tree_c'], bush: 0.04, bushes: ['bush_a', 'bush_b'], junk: 0.01, junkKeys: ['barrel'], shack: 0 },
};
