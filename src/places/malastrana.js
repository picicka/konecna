// Malá Strana: ručně určené prvky nad mapou z OSM (data/malastrana.json). Osa a na západ od Malostranského náměstí
// (a ≈ 9) Nerudovkou k bráně Ke Hradu (a ≈ 64), b na sever. Suchá, nikdo ji nepřestavěl. Velvyslanectví dole
// (b ≈ 5), Zámecké schody nahoru k 46,57. Příběh a postavy: docs/pribeh.md, místo 5.
export const MALASTRANA = {
    start: { a: 3, b: 16 },
    arrivals: { most: { a: 3, b: 16 } },
    // chrám svatého Mikuláše uprostřed Malostranského náměstí (půdorys z OSM a 8–17, b 18–23)
    landmark: [{ atlas: 'landmarks_kostely', key: 'lm_mikulas_ms', a0: 8, w: 10, b0: 18, dpt: 6 }],
    stops: {
        mostecka_zpet: { npc: { key: 'lamp', a: 4, b: 15 }, approach: { a: 3, b: 15 }, props: [] },
        // vymahači čekají, jen když pošťačka odmítla Fantovu neteř
        vymahaci: { npc: { key: 'vymahac', a: 8, b: 15 }, approach: { a: 7, b: 15 }, props: [], hideIf: { noFlag: 'odmitla_netere' } },
        pani: { npc: { key: 'pani', a: 56, b: 33 }, approach: { a: 57, b: 33 }, props: [] },
        velvyslanec: { npc: { key: 'velvyslanec', a: 55, b: 6 }, approach: { a: 55, b: 5 }, props: [{ key: 'razitko_stul', a: 54, b: 6 }] },
        trabant: { npc: { key: 'trabant', a: 60, b: 7 }, approach: { a: 59, b: 7 }, props: [] },
        straz: { npc: { key: 'straz', a: 65, b: 39 }, approach: { a: 64, b: 39 }, props: [{ key: 'budka_straz', a: 65, b: 40 }] },
        kastelan: { npc: { key: 'kastelan', a: 62, b: 37 }, approach: { a: 61, b: 37 }, props: [] },
        schody: { npc: { key: 'holub', a: 44, b: 53 }, approach: { a: 44, b: 54 }, props: [] },
    },
    props: { trees: ['tree_a', 'tree_c', 'tree_bare'], bush: 0.05, bushes: ['bush_a', 'bush_b', 'bush_c'], junk: 0.02, junkKeys: ['rubble_pile', 'barrel', 'tires'], shack: 0 },
};
