// Ladění, přepínače z adresy (skoky samotné jsou v src/skok.js): skok na kterékoli místo se stavem hry, jaký tam hráčka opravdu má, a přepínače z adresy.
// Stav při příchodu na každé místo zapisuje průchod npm test do src/skoky.json (vlajky, předměty, úkoly, důvěra),
// takže postavy na místě mluví jako při hraní a soubor se při změně příběhu aktualizuje sám.
//
// Adresa (konecna.test i GitHub Pages):
//   ?misto=hrad           rovnou na místo (bez titulku, úvodu a tvorby postavy), na dlaždici příchodu
//   &a=43&b=19            na konkrétní dlaždici
//   &jizdenky=99          přidá jízdenky
//   &buh                  nesmrtelnost v boji a zkoušky vlastností vždy vyjdou
//   ?rychle / ?rychle=8   čas hry běží rychleji (bez čísla pětkrát): chůze, animace, časovače; logika se nemění.
//                         Používá ho průchod npm test, jde i samostatně bez ?misto.
//   ?ladeni               zapne panel skoků na klávese L, jen dokud je v adrese (nepamatuje se, s ?misto se nezapíná sám)

// V Node (scripts/slepe.mjs, tree.mjs) není okno ani adresa: všechno vypnuté.
const params = new URLSearchParams(typeof window === 'undefined' ? '' : window.location.search);
// dřív se zapnuté ladění pamatovalo v prohlížeči; starý záznam se uklidí, aby L nezůstalo zapnuté napořád
try { localStorage.removeItem('konecna.ladeni'); } catch (error) { /* soukromé okno, Node */ }
const num = (key) => (params.has(key) && Number.isFinite(Number(params.get(key))) ? Number(params.get(key)) : null);

export const DEBUG = {
    // panel skoků na L jen s ?ladeni v adrese: L je snadná klávesa a hráčka by si jím skočila omylem
    on: params.has('ladeni') && params.get('ladeni') !== '0',
    place: params.get('misto'),
    tile: num('a') !== null && num('b') !== null ? { a: num('a'), b: num('b'), L: num('L') ?? 0 } : null,
    tickets: num('jizdenky') ?? 0,
    god: params.has('buh'),
    speed: params.has('rychle') ? Math.max(1, Math.min(20, num('rychle') || 5)) : 1,
};
