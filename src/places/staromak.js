// Staromák: ručně určené prvky nad mapou z OSM (data/staromak.json). Jen náměstí: osa a na východ, b na jih, domy
// tvoří jeho obrys (domy hlouběji v blocích jsou pod vodou). Staré Město je po první patro pod vodou: podél domů vedou
// lávky (m), střed náměstí je voda s ostrovem Husova pomníku (22,11), k němu lávky ze tří stran. Ikonické stavby jsou
// ručně kreslené landmarky na půdorysech z scripts/places.mjs (boxes). Příběh a postavy: docs/pribeh.md, místo 3.
export const STAROMAK = {
    start: { a: 33, b: 16 },
    // příchod: loďkou od Václaváku Celetnou (východ), od mostu Karlovou přes Malé náměstí (jihozápad)
    arrivals: { vaclavak: { a: 33, b: 16 }, most: { a: 9, b: 24 } },
    landmark: [
        { atlas: 'landmarks_sm_tyn', key: 'lm_tyn', a0: 34, w: 7, b0: 7, dpt: 6 },
        { atlas: 'landmarks_sm_radnice', key: 'lm_radnice', a0: 12, w: 9, b0: 20, dpt: 4 },
        { atlas: 'landmarks_sm_namesti', key: 'lm_mikulas', a0: 7, w: 6, b0: 7, dpt: 4 },
        { atlas: 'landmarks_sm_namesti', key: 'lm_kinsky', a0: 27, w: 8, b0: 0, dpt: 5 },
        { atlas: 'landmarks_sm_namesti', key: 'lm_zvon', a0: 29, w: 4, b0: 5, dpt: 4 },
    ],
    stops: {
        tyn: { npc: { key: 'kuracka', a: 32, b: 16 }, approach: { a: 33, b: 16 }, props: [{ key: 'lodka', a: 35, b: 17 }] },
        admiral: { npc: { key: 'admiral', a: 22, b: 13 }, approach: { a: 22, b: 12 }, props: [{ key: 'hus', a: 22, b: 10 }] },
        // Orlojník u Orloje na jižní stěně radniční věže, z loďky
        orlojnik: { npc: { key: 'orlojnik', a: 21, b: 25 }, approach: { a: 21, b: 24 }, props: [{ key: 'ostrov_lodka', a: 20, b: 25 }] },
        vyloha: { npc: { key: 'vyloha', a: 9, b: 3 }, approach: { a: 8, b: 3 }, props: [] },
        lovec: { npc: { key: 'lovec', a: 8, b: 5 }, approach: { a: 9, b: 5 }, props: [{ key: 'lovec_hak', a: 7, b: 5 }] },
        // potápěčka u ústí Kaprovy, odkud se potápí do Staroměstské
        potapecka: { npc: { key: 'potapecka', a: 4, b: 11 }, approach: { a: 5, b: 11 }, props: [{ key: 'metro_totem', a: 4, b: 12 }] },
        karlova: { npc: { key: 'ostrov_lodka', a: 7, b: 24 }, approach: { a: 8, b: 24 }, props: [] },
    },
    props: { trees: ['tree_bare'], bush: 0, bushes: ['bush_a'], junk: 0.02, junkKeys: ['barrel', 'tires'], shack: 0 },
};
