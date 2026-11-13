// Hrad: ručně určené prvky nad mapou z OSM (data/hrad.json). Osa a na východ od Matyášovy brány (a ≈ 2) přes druhé
// a třetí nádvoří, Jiřské náměstí, ke Zlaté uličce (53,8) a vyhlídce Na Opyši (73,17) na konci rampy nad svahem. Katedrála je landmark
// (půdorys L a 12–28, b 13–19). Jediné osvětlené místo v Praze. Příběh a postavy: docs/pribeh.md, místo 6.
export const HRAD = {
    start: { a: 2, b: 18 },
    landmark: [
        { atlas: 'landmarks_hrad', key: 'lm_katedrala', a0: 12, w: 17, b0: 13, dpt: 7 },
        { atlas: 'landmarks_kostely', key: 'lm_jiri', a0: 37, w: 7, b0: 14, dpt: 5 },
    ],
    stops: {
        pruvodkyne: { npc: { key: 'pruvodkyne', a: 11, b: 17 }, approach: { a: 10, b: 17 }, props: [] },
        // ochranka stojí v jediném průchodu plotem kolem buňky (fences, gates); když ustoupí (ochranka_pryc), jde si
        // sednout k buňce a cedule z průchodu zmizí ke straně
        ochranka: { npc: { key: 'ochranka', a: 18, b: 22 }, approach: { a: 17, b: 22 }, props: [{ key: 'ochranka_cedule', a: 18, b: 23 }],
            after: { if: { flag: 'ochranka_pryc' }, npc: { key: 'ochranka', a: 19, b: 25, from: 'npc' }, approach: { a: 20, b: 25 }, props: [{ key: 'ochranka_cedule', a: 17, b: 24 }] } },
        reditel: { npc: { key: 'reditel', a: 23, b: 22 }, approach: { a: 23, b: 21 }, props: [{ key: 'generator', a: 25, b: 21, anim: true }, { key: 'obelisk', a: 24, b: 19 }] },
        ctecka: { npc: { key: 'ctecka', a: 21, b: 22 }, approach: { a: 22, b: 22 }, props: [{ key: 'bunka', a: 21, b: 24 }, { key: 'reflektor', a: 19, b: 23 }] },
        // sklad soch, které skoupil Hrad: kůň svatého Václava bez jezdce, bedny se sochami po kusech, prodaný podstavec
        zlata: { npc: { key: 'kun_vaclav', a: 53, b: 9 }, approach: { a: 53, b: 8 }, props: [{ key: 'bedny', a: 52, b: 12 }, { key: 'podstavec_c', a: 52, b: 11 }] },
        vyhlidka: { npc: { key: 'bench', a: 73, b: 17 }, approach: { a: 73, b: 16 }, props: [], hideIf: { noFlag: 'vyhlidka_otevrena' } },
    },
    // stavební plot kolem ředitelovy buňky (a 18–27, b 20–26), průchod jen na západní straně u ochranky (18,22 a 18,23);
    // run: od–do po dlaždicích, podél a nebo b
    fences: [
        { from: [18, 20], to: [27, 20] }, { from: [18, 26], to: [27, 26] },
        { from: [18, 21], to: [18, 21] }, { from: [18, 24], to: [18, 25] }, { from: [27, 21], to: [27, 25] },
    ],
    // průchod plotem je zavřený, dokud ochranka neustoupí
    gates: [{ tiles: [[18, 23]], open: { flag: 'ochranka_pryc' } }],
    // kuriozity na svahu pod Hradem (art/kuriozity.px.js, WorldScene.placeOddities)
    oddities: [{ on: 'k', keys: ['metronom', 'golem'] }],
    props: { trees: ['tree_a', 'tree_c'], bush: 0.04, bushes: ['bush_a', 'bush_b'], fire: 0.003, junk: 0.01, junkKeys: ['barrel'], shack: 0 },
    // pracovní reflektor a světla generátoru u ředitelovy buňky (bílé, studenější než oheň)
    lights: [{ a: 20, b: 23, scale: 1.4, tint: 0xfff0c8, alpha: 0.75 }, { a: 25, b: 22, scale: 1.1, tint: 0xfff0c8, alpha: 0.6 }],
};
