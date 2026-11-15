// Václavák: ručně určené prvky nad mapou z OSM (data/vaclavak.json). Souřadnice jsou dlaždice (a od Můstku k Muzeu,
// b napříč, náměstí je b 10–16). Spodní polovina (a ≤ 49) je pod vodou, středem vede molo (b 12–13) až k domu Na Můstku (a 11).
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
    // Národní muzeum a roh bývalého Federálního shromáždění jsou z 3D modelu budov (real: klíč v data/domy-vaclavak.json
    // extras, kvádry v PLACES.vaclavak.model); muzeum stojí na terase nad náměstím (lift), pod ním je ručně kreslená
    // rampa se schodišti a kašnou (lm_muzeum_rampa, hloubka za muzeem).
    landmark: [{ atlas: 'landmarks_vaclavak', key: 'lm_muzeum_rampa', a0: 110, w: 14, b0: 8, dpt: 13, depthAt: { a: 121, b: 6 } },
        { real: 'muzeum', a0: 112, w: 12, b0: 7, dpt: 15, lift: 44, say: 'muzeum' },
        { real: 'fs', a0: 108, w: 10, b0: -6, dpt: 6, say: 'shromazdeni' }],
    // Dům Na Můstku (dřív ČKD) stojí tam, kde ve skutečnosti: za příčnou ulicí pod náměstím (kvádry a 7–10, b 10–12,
    // tvar z modelu budov). Sídlí v něm Ecomail, na stěně mu bzučí neonová obálka (overlays: sprite na stěně domu).
    // Palác Koruna (kvádry z modelu budov, kámen): na nároží náměstí a Na Příkopě má válcovou věž s korunou z perel.
    overlays: [{ key: 'obalka_neon', house: [8, 11], u: 60, v: 150, say: 'mustek' },
        { key: 'koruna_vez', atlas: 'landmarks_vaclavak', house: [14, 6], u: 55, v: -8, center: true },
        // hlavní kupole muzea na středním pavilonu modelu (landmark: klíč stavby, at: posun od kotvy spritu v bodech)
        { key: 'muzeum_kupole', atlas: 'landmarks_vaclavak', landmark: 'muzeum', at: [-368, -871], center: true }],
    lights: [{ a: 10, b: 13, scale: 1.1, tint: 0x3ff2d6, alpha: 0.4 }],
    stops: {
        vylez: { npc: { key: 'vylez', a: 108, b: 11 }, approach: { a: 107, b: 11 }, props: [] },
        // pokladna u paty pravého schodiště: odsud se vchází do muzea za kostrou plejtváka (filmeček muzeum)
        muzeum: { npc: { key: 'muzeum_pokladna', a: 109, b: 17 }, approach: { a: 108, b: 17 }, props: [] },
        dispecerka: { npc: { key: 'dispecerka', a: 102, b: 10 }, approach: { a: 102, b: 11 }, props: [{ key: 'metro_entrance', a: 103, b: 9 }] },
        vaclav: { npc: { key: 'vaclav', a: 100, b: 13 }, approach: { a: 99, b: 13 }, props: [] },
        // nutrie po boji nebo kamínku seskočí z reproduktoru na kraj vody (after, nutrie_pryc)
        reproduktor: { npc: { key: 'reproduktor', a: 53, b: 8 }, approach: { a: 53, b: 9 }, props: [],
            after: { if: { flag: 'nutrie_pryc' }, npc: { key: 'reproduktor_prazdny', a: 53, b: 8 }, props: [{ key: 'nutrie_breh', a: 50, b: 4, anim: true, flip: true, from: 'npc', jump: 146, say: 'nutrie_breh' }] } },
        revizor: { npc: { key: 'revizor', a: 50, b: 11 }, approach: { a: 51, b: 12 }, props: [] },
        kuracka: { npc: { key: 'kuracka', a: 18, b: 12 }, approach: { a: 19, b: 12 }, props: [{ key: 'lodka', a: 18, b: 11 }] },
    },
    // Na molo pustí revizor jen se zápisem z evidence, jako úřední osobu, za zaplacení nebo když pošťačka zná cestu
    // po střechách (od Václava); do té doby je začátek mola zavřený.
    gates: [{ tiles: [[49, 12], [49, 13]], open: { any: [{ flag: 'molo' }] } }],
    // kuriozity ve vodě dole a na pusté pláni za náměstím (strana k divákovi, b od 19) (art/kuriozity.px.js, WorldScene.placeOddities)
    oddities: [{ on: 'w', keys: ['mlok_maly_2', 'labut'] }, { on: 'p', minB: 19, keys: ['kun_lucerna', 'kafka', 'miminko'] }],
    props: { wreck: 0.012, trees: ['tree_a', 'tree_bare', 'tree_c', 'tree_b', 'tree_bare_c', 'tree_mlady_a', 'tree_pahyl_a', 'tree_a', 'tree_bare_b', 'tree_mlady_b', 'tree_c', 'tree_pahyl_b'],
        bush: 0.06, bushes: ['bush_a', 'bush_b', 'bush_c', 'bush_trni_a', 'bush_trava_a', 'bush_rez_a', 'bush_trava_b', 'bush_trni_b'],
        fire: 0.004, junk: 0.04, junkKeys: ['rubble_pile', 'barrel', 'tires', 'rubble_pile'], shack: 0 },
};
