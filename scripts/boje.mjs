// Simulátor bojů: odehraje každý boj z BATTLES tisíckrát (různá semínka) pravidly ze src/boj.js, tedy přesně tím, co
// běží ve hře, a vypíše, jak dopadne postava, jakou hráčka na tom místě zhruba má. Slouží k ladění čísel v BATTLES
// a RULES podle výsledků, ne podle pocitu. Spuštění: npm run boje (-- <klíč boje> jen jeden boj, -- -n 5000 víc her,
// -- tezka těžká obtížnost).
//
// Postavy (BUILDS): bojovnice (body do Ruky), mluvka (Ústa), pozorovatelka (Oko) a vyrovnaná. Kolik bodů, jakou zbraň,
// kolik srdcí a zásob na kterém místě mají, je v STAGE (odhad z průchodu: bod za úroveň, výbava z obchodů a úkolů).
// Strategie: „jen Ruka“ a „jen Ústa“ mačkají jedno tlačítko, „chytře“ čte záměr nepřítele (před těžkou ranou uhne,
// při zaváhání mluví nebo se léčí, jinak dělá to, co ubírá rychleji) a uteče, když by další rána byla poslední.
// Cíl ladění: chytrá hra postavy, které boj sedí, vyhrává zhruba v 80–95 % a stojí pár srdcí, jedno tlačítko je
// znatelně horší a postava, které boj nesedí, má utíkat nebo hledat jinou cestu.
import { BATTLES, ITEMS } from '../src/script.js';
import { createState, maxHp, difficultyOf } from '../src/state.js';
import { newFight, odds, step, supplyFor } from '../src/boj.js';

const args = process.argv.slice(2);
const N = args.includes('-n') ? Number(args[args.indexOf('-n') + 1]) : 1000;
const only = args.find((a) => BATTLES[a]);
// tezka: těžká obtížnost (DIFFICULTY ve state.js: výdrž nepřátel × 1,5, útěk za dvě rány)
const difficulty = args.includes('tezka') ? 'tezka' : 'lehka';

// Na kterém místě boj je a co tam hrdinka zhruba má: body vlastností celkem (tři základní, jeden z tvorby postavy,
// jeden za úroveň), zbraň, oděv, talisman pro hlavní vlastnost a zásoby.
export const STAGE = {
    psi: { place: 'Hlavák', points: 5, equip: {}, supplies: {} },
    nutrie: { place: 'Václavák', points: 5, equip: { zbran: 'placacka' }, supplies: {} },
    nutrie2: { place: 'Staromák', points: 6, equip: { zbran: 'placacka' }, supplies: { obvaz: 1 } },
    kanci: { place: 'Karlův most', points: 7, equip: { zbran: 'placacka', odev: 'kabat' }, talisman: true, supplies: { obvaz: 1 } },
    vymahaci: { place: 'Malá Strana', points: 8, equip: { zbran: 'trubka', odev: 'kabat' }, talisman: true, supplies: { obvaz: 1, chleba: 1 } },
    holubi: { place: 'Malá Strana', points: 8, equip: { zbran: 'trubka', odev: 'kabat' }, talisman: true, supplies: { obvaz: 1, chleba: 1 } },
    ochranka: { place: 'Hrad', points: 9, equip: { zbran: 'trubka', odev: 'kabat' }, talisman: true, supplies: { obvaz: 2, chleba: 1 } },
};
const TALISMAN = { ruka: 'rukavice', usta: 'pistalka', oko: 'bryle' };
const BUILDS = { bojovnice: 'ruka', mluvka: 'usta', pozorovatelka: 'oko', 'vyrovnaná': null };

// Rozdělení bodů: specialistka dává dva ze tří volných bodů do své vlastnosti, zbytek střídavě do ostatních.
const hero = (key, main, seed) => {
    const stage = STAGE[key];
    const state = { ...createState(), seed, flags: {}, difficulty };
    const others = ['ruka', 'usta', 'oko'].filter((a) => a !== main);
    for (let i = 0; i < stage.points - 3; i++) {
        const a = main ? (i % 3 === 2 ? others[Math.floor(i / 3) % 2] : main) : ['ruka', 'oko', 'usta'][i % 3];
        state.attributes[a] += 1;
    }
    state.equip = { zbran: null, odev: null, talisman: null, ...stage.equip };
    if (stage.talisman && main) state.equip.talisman = TALISMAN[main];
    state.items = Object.values(state.equip).filter(Boolean);
    state.supplies = { ...stage.supplies };
    state.hp = maxHp(state);
    return state;
};

const mean = ([lo, hi]) => (lo + hi) / 2;
const POLICIES = {
    'jen Ruka': () => 'attack',
    'jen Ústa': () => 'talk',
    'chytře': (f) => {
        const o = odds(f);
        const canHeal = Boolean(supplyFor(f.state)) && f.state.hp < maxHp(f.state);
        const worst = o.attacks * o.foeDmg[1];
        // dorazit, když to skoro jistě vyjde
        if (f.hp <= o.dmg[0] && o.hit >= 0.8) return 'attack';
        if (f.nerve <= o.talk[0] && o.talkP >= 0.8) return 'talk';
        if (f.state.hp <= worst) {
            if (canHeal) return 'bag';
            if (f.intent === 'rana') return f.state.hp <= Math.ceil(o.foeDmg[1] / 2) ? 'flee' : 'defend';
            if (f.intent === 'utok') return 'flee';
        }
        if (f.intent === 'rana') return 'defend';
        if (f.intent === 'vaha' && canHeal && maxHp(f.state) - f.state.hp >= ITEMS[supplyFor(f.state)].use.heal) return 'bag';
        return o.hit * mean(o.dmg) / f.hp >= o.talkP * mean(o.talk) / f.nerve ? 'attack' : 'talk';
    },
};

const play = (key, main, policy, seed) => {
    const state = hero(key, main, seed);
    const start = state.hp;
    const f = newFight(state, key);
    while (!f.over && f.turn < 200) step(f, policy(f)) ?? step(f, 'attack');
    return { over: f.over ?? 'flee', lost: start - state.hp, turns: f.turn };
};

const pct = (n) => `${Math.round(n * 100)} %`.padStart(5);
for (const key of Object.keys(BATTLES).filter((k) => !only || k === only)) {
    const b = BATTLES[key];
    const sample = hero(key, null, 1);
    const tough = difficultyOf({ difficulty }).foe;
    console.log(`\n${b.name} (${key}, ${STAGE[key].place}, ${difficulty}): srdce ${Math.round(b.hp * tough)}, vůle ${Math.round(b.nerve * tough)}, Ruka ${b.stats.ruka}, Ústa ${b.stats.usta}, Oko ${b.stats.oko}${b.pack ? ', smečka' : ''}; hrdinka ${STAGE[key].points} bodů, ${maxHp(sample)} srdcí`);
    console.log('  postava          strategie   výhra  útěk  smrt   ztráta srdcí při výhře   tahů');
    for (const [name, main] of Object.entries(BUILDS)) {
        const a = hero(key, main, 1).attributes;
        for (const [pname, policy] of Object.entries(POLICIES)) {
            const runs = Array.from({ length: N }, (_, i) => play(key, main, policy, 1000 + i * 7919));
            const wins = runs.filter((r) => r.over === 'win');
            const avg = (list, f) => (list.length ? (list.reduce((n, r) => n + f(r), 0) / list.length).toFixed(1) : '–');
            console.log(`  ${`${name} ${a.ruka}/${a.usta}/${a.oko}`.padEnd(20)} ${pname.padEnd(9)} ${pct(wins.length / N)} ${pct(runs.filter((r) => r.over === 'flee').length / N)} ${pct(runs.filter((r) => r.over === 'dead').length / N)}   ${String(avg(wins, (r) => r.lost)).padStart(6)}                  ${String(avg(runs, (r) => r.turns)).padStart(5)}`);
        }
    }
}
