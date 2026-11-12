// Václavák: ručně určené prvky nad mapou z OSM (data/vaclavak.json). Souřadnice jsou dlaždice (a od Můstku k Muzeu,
// b napříč, náměstí je b 10–16). Spodní polovina (a ≤ 49) je pod vodou, středem vede molo (b 12–13) k Můstku.
// Příběh a postavy: docs/pribeh.md, místo 2.
// - landmark: Národní muzeum (půdorys z OSM a 112–123, b 7–21);
// - stops: zastavení s postavou, přístupem a rekvizitami;
// - gates: dlaždice, které jsou neprůchozí, dokud neplatí podmínka (revizor pouští na molo);
// - props: druhy stromů a rozsev harampádí.
export const VACLAVAK = {
    // Souprava zastavila mezi stanicemi, pošťačka vylezla nouzovým výlezem na magistrálu před Muzeem.
    start: { a: 107, b: 12 },
    // zpátky loďkou s Kuřačkou (z Nuslí, ze Staromáku) se přijede k molu, ne k Muzeu
    arrivals: { nuselak: { a: 19, b: 12 }, staromak: { a: 19, b: 12 } },
    landmark: [{ atlas: 'landmarks_vaclavak', key: 'lm_muzeum', a0: 112, w: 12, b0: 7, dpt: 15 }],
    stops: {
        vylez: { npc: { key: 'vylez', a: 108, b: 11 }, approach: { a: 107, b: 11 }, props: [] },
        dispecerka: { npc: { key: 'dispecerka', a: 102, b: 10 }, approach: { a: 102, b: 11 }, props: [{ key: 'metro_entrance', a: 103, b: 9 }] },
        vaclav: { npc: { key: 'vaclav', a: 100, b: 13 }, approach: { a: 99, b: 13 }, props: [] },
        // nutrie po boji nebo kamínku seskočí z reproduktoru na kraj vody (after, nutrie_pryc)
        reproduktor: { npc: { key: 'reproduktor', a: 53, b: 8 }, approach: { a: 53, b: 9 }, props: [],
            after: { if: { flag: 'nutrie_pryc' }, npc: { key: 'reproduktor_prazdny', a: 53, b: 8 }, props: [{ key: 'nutrie_breh', a: 50, b: 4, anim: true, flip: true, from: 'npc', jump: 146, say: 'nutrie_breh' }] } },
        revizor: { npc: { key: 'revizor', a: 50, b: 11 }, approach: { a: 51, b: 12 }, props: [] },
        kuracka: { npc: { key: 'kuracka', a: 18, b: 12 }, approach: { a: 19, b: 12 }, props: [{ key: 'lodka', a: 17, b: 13 }] },
    },
    // Na molo pustí revizor jen se zápisem z evidence, jako úřední osobu, za zaplacení nebo když pošťačka zná cestu
    // po střechách (od Václava); do té doby je začátek mola zavřený.
    gates: [{ tiles: [[49, 12], [49, 13]], open: { any: [{ flag: 'molo' }] } }],
    // kuriozity ve vodě dole a na pusté pláni za náměstím (strana k divákovi, b od 19) (art/kuriozity.px.js, WorldScene.placeOddities)
    oddities: [{ on: 'w', keys: ['mlok_maly_2', 'labut'] }, { on: 'p', minB: 19, keys: ['kun_lucerna', 'kafka', 'miminko'] }],
    props: { trees: ['tree_a', 'tree_bare', 'tree_c', 'tree_a'],
        bush: 0.06, bushes: ['bush_a', 'bush_b', 'bush_c'],
        junk: 0.04, junkKeys: ['rubble_pile', 'barrel', 'tires', 'rubble_pile'], shack: 0 },
};
