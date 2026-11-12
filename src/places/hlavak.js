// Hlavák a Sherwood: ručně určené prvky nad mapou z OSM (data/hlavak.json). Souřadnice jsou dlaždice (a řádek podél
// Wilsonovy k jihu, b sloupec k západu; a 0–17 je pás na sever s tramvají podél Vrchlického sadů). Příběh a postavy:
// docs/pribeh.md, místo 1.
// - landmark: díly Fantovy budovy podél a (b0 = 11, hloubka 6), od a = 27 do 55;
// - halls: zřícené haly, nad nimi železné oblouky každé 4 řádky;
// - stops: zastavení s postavou, přístupovou dlaždicí a rekvizitami (kontroluje se, že přístup je průchozí);
// - props: druhy stromů a rozsev keřů a harampádí; stromy, lampy a lavičky samy stojí podle OSM (data/hlavak.json).
export const HLAVAK = {
    // start před vchodem do odbavovací haly: z metra se vychází dveřmi haly (nad nimi značení metra, linka C)
    start: { a: 34, b: 22 },
    // Fantova budova (b 11–14) za magistrálou, nad kterou vykukují patra a věže; před ní odbavovací hala z let 1972–1979
    // s Wilsonovou na střeše (b 15–20), nájezdové rampy a prosklené schodišťové věže na plácku (b 21).
    landmark: [
        ...[
            ['lm_fanta_wing5', 27, 5], ['lm_fanta_wing4', 32, 4], ['lm_fanta_tower', 36, 2], ['lm_fanta_hall', 38, 7],
            ['lm_fanta_tower_broken', 45, 2], ['lm_fanta_wing5b', 47, 5], ['lm_fanta_wing4', 52, 4],
        // hloubka nad halovými loděmi (b 0–10) a pod odbavovací halou: jako by stála na b 13
        ].map(([key, a0, w]) => ({ atlas: 'landmarks', key, a0, w, b0: 11, dpt: 4, depthAt: { a: a0, b: 13, lift: 8 } })),
        ...[
            ['lm_viaduct_6', 0, 6, 'landmarks4'], ['lm_viaduct_5', 6, 5, 'landmarks4'], ['lm_viaduct_5b', 11, 5, 'landmarks4'],
            ['lm_viaduct_6', 16, 6, 'landmarks4'], ['lm_viaduct_5', 22, 5, 'landmarks4'],
            ['lm_hall_a', 27, 5], ['lm_hall_entrance', 32, 5], ['lm_hall_b', 37, 5],
            ['lm_hall_broken', 42, 5], ['lm_hall_a', 47, 5], ['lm_hall_c', 52, 4],
            ['lm_viaduct_5b', 56, 5, 'landmarks4'], ['lm_viaduct_5', 61, 5, 'landmarks4'], ['lm_viaduct_5b', 66, 5, 'landmarks4'],
            ['lm_viaduct_5', 71, 5, 'landmarks4'], ['lm_viaduct_6', 76, 6, 'landmarks4'],
        ].map(([key, a0, w, atlas]) => ({ atlas: atlas ?? 'landmarks2', key, a0, w, b0: 15, dpt: 6 })),
        ...[30, 40, 50].map((a0) => ({ atlas: 'landmarks2', key: 'lm_stair_tower', a0, w: 1, b0: 21, dpt: 1 })),
    ],
    // Dvě valené halové lodě nad kolejemi (b 0–5 a 5–10), díly po 4 dlaždicích od a = 25: gable = čelo s prosklým obloukem,
    // a/b = celá střecha (b s vybitým světlíkem), x = propadlé (zůstaly jen oblouky). Střecha je nad vším pod ní a zprůhlední.
    sheds: [
        { b0: 0, segs: ['gable', 'a', 'x', 'b', 'x', 'x', 'a', 'b'] },
        { b0: 5, segs: ['gable', 'b', 'a', 'x', 'a', 'x', 'b', 'x'] },
    ].flatMap(({ b0, segs }) => segs.map((k, i) => ({ key: k === 'gable' ? 'lm_shed_gable' : k === 'a' ? 'lm_shed_a' : k === 'b' ? 'lm_shed_b' : null, a0: 25 + i * 4, b0, w: 4, dpt: 6 })).filter((s) => s.key)),
    // Nástupištní přístřešky a trakční stožáry mimo haly (a < 25 a a > 56).
    canopies: { outside: [25, 56], until: 68, mastEvery: 4 },
    ribs: [0, 5].flatMap((b0) => [26, 30, 34, 38, 42, 46, 50, 54].map((a) => ({ key: 'rib_7', a, b0, span: 7 }))),
    stops: {
        metro: { npc: { key: 'strojvedouci', a: 36, b: 21 }, approach: { a: 36, b: 22 }, props: [{ key: 'metro_totem_c', a: 30, b: 22 }] },
        // Fanta stojí nahoře na magistrále před vchodem do své budovy (úroveň 1, k němu se jde po věži nebo po rampě).
        trziste: { npc: { key: 'fanta', a: 39, b: 15, L: 1 }, approach: { a: 39, b: 16, L: 1 }, props: [] },
        trafika: { npc: { key: 'trafikantka', a: 39, b: 29 }, approach: { a: 39, b: 30 }, props: [{ key: 'kiosk', a: 38, b: 29 }] },
        ohniste: { npc: { key: 'robin', a: 48, b: 34 }, approach: { a: 47, b: 34 }, props: [{ key: 'barrel_fire', a: 48, b: 35, anim: true }] },
        // tři psi; když dají pokoj (lahev pro Robina, boj, díra v plotě, řev, obojek), odběhnou k Robinovu ohni
        // a lehnou si tam (after, psi_ok); dialog to ví
        psi: { npc: { key: 'dog', a: 27, b: 31 }, approach: { a: 28, b: 31 }, props: [{ key: 'dog', a: 27, b: 32, anim: true, flip: true }, { key: 'dog', a: 26, b: 31, anim: true }],
            after: { if: { flag: 'psi_ok' }, npc: { key: 'dog_lie', a: 48, b: 36, anim: true, flip: true, from: 'npc' }, approach: { a: 47, b: 36 },
                props: [{ key: 'dog_lie', a: 49, b: 35, anim: true, flip: true, from: 0, delay: 250 }, { key: 'dog_lie', a: 49, b: 33, anim: true, from: 1, delay: 500 }] } },
        nastupiste: { npc: { key: 'vypravci', a: 48, b: 4 }, approach: { a: 49, b: 4 }, props: [{ key: 'station_clock', a: 47, b: 4 }] },
    },
    // Horní úroveň: vozovka magistrály v jedné výšce přes celou mapu (na střeše haly a dál po estakádě). Jediný přístup
    // jsou točitá schodiště ve věžích na plácku (dlaždice věže b 21, vozovka b 20).
    upper: {
        deck: { a0: 0, a1: 81, b0: 15, b1: 20 },
        ramps: [],
        towers: [30, 40, 50].map((a) => ({ tower: { a, b: 21 }, deck: { a, b: 20 } })),
        // propadlina ve vozovce (díl lm_hall_broken, a 42–46) a vraky (autobusy přes tři dlaždice podél a)
        holes: [[43, 16], [43, 17], [43, 18], [44, 16], [44, 17], [44, 18], [45, 17]],
        wrecks: [
            { key: 'bus_wreck', a: 28, b: 18, len: 3 }, { key: 'car_wreck_a', a: 33, b: 16 }, { key: 'car_wreck_flipped', a: 35, b: 19 },
            { key: 'car_wreck_burnt', a: 38, b: 17 }, { key: 'car_wreck_c', a: 39, b: 19 }, { key: 'bus_wreck_burnt', a: 48, b: 16, len: 3 },
            { key: 'car_wreck_crushed', a: 51, b: 19 }, { key: 'car_wreck_b', a: 53, b: 17 }, { key: 'car_wreck_burnt', a: 23, b: 17 },
            { key: 'car_wreck_flipped', a: 25, b: 19 }, { key: 'bus_wreck', a: 58, b: 19, len: 3 }, { key: 'car_wreck_crushed', a: 46, b: 15 },
        ],
    },
    // Vlaky za nádražím na kolejích podél a (b = sloupec koleje): lokomotivy 363, vagony ČSD, nákladní vozy, ohořelý vůz.
    trains: [
        { b: 3, a: 27, cars: [['loco_363', 2], ['coach_csd', 3], ['coach_csd_b', 3], ['coach_burnt', 3]] },
        { b: 8, a: 39, cars: [['wagon_freight', 2], ['wagon_freight', 2], ['wagon_freight', 2], ['loco_363', 2]] },
        { b: 6, a: 47, cars: [['coach_csd_b', 3]] },
        { b: 0, a: 30, cars: [['coach_burnt', 3], ['coach_csd', 3]] },
    ],
    // Podchody na nástupiště (nádraží je průchozí): z plácku vchodem do odbavovací haly a z magistrály dveřmi Fantovy
    // budovy. Hrdinka ve dveřích zmizí a objeví se na nástupišti.
    // Animované dveře: door_fanta v portálu střední haly Fantovy budovy (díl a0 38, u 206 od jeho začátku, fasáda za b 14).
    doors: { fanta: { key: 'door_fanta', a0: 38, b: 14, u: 206, depthAt: { a: 38, b: 13, lift: 9 } } },
    // světlo z otevřené odbavovací haly padá na plácek před vchodem a z pootevřených dveří Fantovy budovy na vozovku
    // magistrály (WorldScene.placeLights), obojí láká na nástupiště
    lights: [{ a: 34, b: 21, scale: 1.3 }, { a: 41, b: 15, L: 1, scale: 1 }],
    tunnels: [
        { from: { a: 34, b: 21, L: 0 }, to: { a: 34, b: 10, L: 0 } },
        { from: { a: 41, b: 15, L: 1 }, to: { a: 41, b: 10, L: 0 }, door: 'fanta' },
    ],
    // Druhy stromů pro stromy z OSM a dosázené v parku (víc holých, rok bez údržby); keře, harampádí a boudy podle pravidel.
    props: { trees: ['tree_bare', 'tree_a', 'tree_bare', 'tree_c', 'tree_bare', 'tree_a'],
        // harampádí: suť, sudy, pneumatiky na chodnících, dvorech a v parku, boudy z plechu na hlíně v parku
        bush: 0.12, bushes: ['bush_a', 'bush_b', 'bush_c'],
        fire: 0.003, junk: 0.05, junkKeys: ['rubble_pile', 'barrel', 'tires', 'rubble_pile', 'barrel'], shack: 0.015 },
};
