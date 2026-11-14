// Staromák: ručně určené prvky nad mapou z OSM (data/staromak.json). Jen náměstí: osa a na východ, b na jih, domy
// tvoří jeho obrys (domy hlouběji v blocích jsou pod vodou). Staré Město je po první patro pod vodou: podél domů vedou
// lávky (m), střed náměstí je voda s ostrovem Husova pomníku (22,11), k němu lávky ze tří stran. Ikonické stavby jsou
// ručně kreslené landmarky na půdorysech z scripts/places.mjs (boxes). Příběh a postavy: docs/pribeh.md, místo 3.
// nutrie vyhnané z výlohy sedí na lávce vedle butiku (vyskočí z hnízda obloukem)
const VYLOHA_NUTRIE = [{ key: 'nutrie_breh', a: 8, b: 3, anim: true, block: false, from: 'npc', jump: 62 }, { key: 'nutrie_breh', a: 7.65, b: 2.9, anim: true, flip: true, block: false, from: 'npc', jump: 62 }];
export const STAROMAK = {
    start: { a: 33, b: 16 },
    // příchod: loďkou od Václaváku Celetnou (východ), od mostu Karlovou přes Malé náměstí (jihozápad)
    arrivals: { vaclavak: { a: 33, b: 16 }, most: { a: 9, b: 24 } },
    landmark: [
        { atlas: 'landmarks_sm_tyn', key: 'lm_tyn', a0: 34, w: 7, b0: 7, dpt: 6, say: 'tyn' },
        { atlas: 'landmarks_sm_radnice', key: 'lm_radnice', a0: 12, w: 9, b0: 20, dpt: 4, say: 'radnice' },
        { atlas: 'landmarks_sm_namesti', key: 'lm_mikulas', a0: 7, w: 6, b0: 7, dpt: 4 },
        { atlas: 'landmarks_sm_namesti', key: 'lm_kinsky', a0: 25, w: 8, b0: 2, dpt: 6, say: 'kinsky' },
        { atlas: 'landmarks_sm_namesti', key: 'lm_zvon', a0: 28, w: 4, b0: 8, dpt: 3, say: 'zvon' },
    ],
    stops: {
        tyn: { npc: { key: 'kuracka', a: 32, b: 16 }, approach: { a: 33, b: 16 }, props: [{ key: 'lodka', a: 35, b: 17 }] },
        admiral: { npc: { key: 'admiral', a: 22, b: 13 }, approach: { a: 22, b: 12 }, props: [{ key: 'hus', a: 22, b: 10, say: 'hus' }] },
        // Orlojník u Orloje na jižní stěně radniční věže, z loďky
        orlojnik: { npc: { key: 'orlojnik', a: 21, b: 25 }, approach: { a: 21, b: 24 }, props: [{ key: 'ostrov_lodka', a: 20, b: 25 }] },
        // butik na nároží Pařížské: z levé výlohy trčí bidlo lovcova háku. Podoby (stages, platí první): vyhnané nutrie
        // (nutrie_venku, po boji) vyskočí z hnízda na lávku vedle a zůstanou tam; vytažený hák (hak_venku) zmizí z výlohy.
        // Kdo hák vytáhl potichu (mříž, díra ve stropě), nechal nutrie spát v hnízdě.
        vyloha: { npc: { key: 'vyloha', a: 9, b: 3 }, approach: { a: 9, b: 4 }, props: [],
            stages: [
                { if: { flag: ['hak_venku', 'nutrie_venku'] }, npc: { key: 'vyloha_bez', a: 9, b: 3 }, props: VYLOHA_NUTRIE },
                { if: { flag: 'hak_venku' }, npc: { key: 'vyloha_spi', a: 9, b: 3 }, props: [] },
                { if: { flag: 'nutrie_venku' }, npc: { key: 'vyloha_hak', a: 9, b: 3 }, props: VYLOHA_NUTRIE },
            ] },
        // lovec stojí na lávce před butikem (vlevo od kostela, aby ho nezakryl); hák drží, až ho dostane zpátky
        lovec: { npc: { key: 'lovec', a: 8, b: 4 }, approach: { a: 8, b: 5 }, props: [],
            after: { if: { quest: { hak: 'done' } }, npc: { key: 'lovec_s_hakem', a: 8, b: 4 } } },
        // potápěčka u ústí Kaprovy, odkud se potápí do Staroměstské
        potapecka: { npc: { key: 'potapecka', a: 4, b: 11 }, approach: { a: 5, b: 11 }, props: [{ key: 'metro_totem_a', a: 4, b: 12 }] },
        karlova: { npc: { key: 'ostrov_lodka', a: 7, b: 24 }, approach: { a: 8, b: 24 }, props: [] },
    },
    // kuriozity ve vodě na náměstí (art/kuriozity.px.js, WorldScene.placeOddities)
    oddities: [{ on: 'w', keys: ['mlok_maly_1', 'labut', 'mlok_maly_2'] }],
    props: { trees: ['tree_bare', 'tree_bare_c', 'tree_pahyl_a', 'tree_bare_b', 'tree_pahyl_b'], bush: 0, bushes: ['bush_a'], fire: 0.03, junk: 0.02, junkKeys: ['barrel', 'tires'], shack: 0 },
};
