// Nastavení míst pro převod z OpenStreetMap (scripts/osm.mjs, scripts/osm-stahnout.mjs). Mapa je mřížka len × wid dlaždic
// po TILE metrech, otočená tak, aby osa a mířila ve směru `bearing` (stupně od severu po směru hodin); b je o 90° po směru
// hodin od a (a = jih → b = západ). `origin` jsou dlaždicové souřadnice bodu `center`.
export const TILE = 7.5; // metrů na dlaždici, jako na Václaváku (dům w = 3 má průčelí 22 m)

export const PLACES = {
    // Václavák: osa a od Můstku (a ≈ 0) k Národnímu muzeu (a ≈ 100), b napříč; spodní polovina náměstí je pod vodou
    // až k Jindřišské (water), od hladiny vede k Můstku dřevěné molo (pier). Rozsah se ladí podle exportu.
    vaclavak: { frame: { streets: ['Václavské náměstí', 'Wilsonova', 'Na Můstku', 'Na Příkopě', '28. října'], width: 3.5 }, center: [50.0818, 14.4262], bearing: 137, len: 132, wid: 32, origin: [56, 18],
        water: { a1: 49 }, pier: { a0: 18, a1: 49, b0: 12, b1: 13 },
        // Národní muzeum je v OSM relace; jeho půdorys je landmark L (ručně kreslený sprite v src/places/vaclavak.js).
        skip: ['Historická budova Národního muzea', 'Národní muzeum'] },
    // Staromák: jen náměstí s prstencem domů kolem (domy tvoří jeho obrys), osa a na východ (95°), b na jih. Ikonické
    // stavby jsou ručně kreslené landmarky (skip): Týnský chrám, Staroměstská radnice s věží a Orlojem, svatý Mikuláš,
    // palác Kinských, dům U Kamenného zvonu. Ulice (Pařížská, Kaprova, Celetná, Železná, Malé náměstí ke Karlově)
    // končí na okraji mapy.
    // flood: Staré Město je po první patro pod vodou; dlaždice do vzdálenosti `boardwalk` od domu jsou lávky (m),
    // ostatní voda (w); islands jsou suché ostrovy (Husův pomník), piers lávky přes vodu.
    staromak: { multipolygons: true, center: [50.0873, 14.4212], bearing: 95, len: 45, wid: 28, origin: [23, 17],
        // půdorysy landmarků jako obdélníky (L), ze kterých staví sprity src/places/staromak.js; budovy pod nimi zmizí
        boxes: [
            { key: 'mikulas', a0: 7, a1: 12, b0: 7, b1: 10 },
            { key: 'radnice', a0: 12, a1: 20, b0: 20, b1: 23 },
            { key: 'tyn', a0: 34, a1: 40, b0: 7, b1: 12 },
            { key: 'kinsky', a0: 27, a1: 34, b0: 0, b1: 4 },
            { key: 'zvon', a0: 29, a1: 32, b0: 5, b1: 8 },
        ],
        flood: { boardwalk: 1, frame: 6, islands: [{ a: 22, b: 11, r: 2.6 }],
            piers: [{ a0: 24, a1: 28, b0: 11, b1: 11 }, { a0: 2, a1: 19, b0: 11, b1: 11 }, { a0: 20, a1: 20, b0: 13, b1: 19 }] } },
    // Karlův most a Kampa: osa a na západ (272°) po mostě od Staroměstské věže (a ≈ 9) k Malostranské (a ≈ 56), b na sever.
    // dry: Vltava teče jinudy, koryto pod mostem je suché bahno (h, neprůchozí), Čertovka má všechnu vodu (wet).
    most: { frame: { streets: ['Karlův most', 'Mostecká', 'Na Kampě', 'U Lužického semináře', 'Křižovnické náměstí', 'Lázeňská', 'Velkopřevorské náměstí', 'Karlova', 'U Sovových mlýnů', 'Dražického náměstí', 'Míšeňská', 'Smetanovo nábřeží'], width: 2.5 },
        skip: ['Staroměstská mostecká věž', 'Malostranská mostecká věž', 'Juditina věž', 'svatý František z Assisi'],
        // půdorysy Malostranských mosteckých věží jsou L (c), průjezdy branami obou věží (řádek b 33) zůstávají dlažbou
        clear: [{ a0: 76, a1: 78, b0: 31, b1: 32, c: 'L' }, { a0: 76, a1: 78, b0: 34, b1: 35, c: 'L' }, { a0: 9, a1: 11, b0: 33, b1: 33 }, { a0: 76, a1: 78, b0: 33, b1: 33 }], multipolygons: true, center: [50.0862, 14.4100], bearing: 284, len: 84, wid: 40, origin: [44, 26], dry: { wet: ['Čertovka'] },
        // most je v OSM čára šířky pěší zóny; tady má skutečnou šířku 10 m (dlažba p přes bahno)
        bridges: [{ name: 'Karlův most', width: 1.6 }] },
    // Malá Strana: osa a na západ (270°) od Malostranského náměstí (a ≈ 9) Nerudovkou k bráně Ke Hradu (a ≈ 64),
    // b na sever; velvyslanectví v Thunovském/Lobkovickém paláci dole (b ≈ 5), Zámecké schody nahoru k 47,57.
    malastrana: { frame: { streets: ['Malostranské náměstí', 'Nerudova', 'Ke Hradu', 'Zámecké schody', 'Vlašská', 'Tržiště', 'Thunovská', 'Sněmovní', 'Jánský vršek', 'Mostecká', 'Hradčanské náměstí'], width: 2.5 },
        skip: ['svatý Mikuláš'], multipolygons: true, center: [50.0886, 14.4005], bearing: 270, len: 70, wid: 60, origin: [38, 30] },
    // Hrad: osa a na východ (75°) od Matyášovy brány (a ≈ 2) přes nádvoří ke katedrále (20,15), Jiřské náměstí,
    // Zlatá ulička (53,8) a vyhlídka Na Opyši (71,23). Katedrála je landmark (skip).
    hrad: { multipolygons: true, center: [50.0908, 14.4010], bearing: 75, len: 76, wid: 36, origin: [24, 18],
        skip: ['Katedrála svatého Víta, Václava a Vojtěcha', 'Katedrála sv. Víta, Václava a Vojtěcha', 'Bazilika svatého Jiří'],
        frame: { streets: ['1. nádvoří', '2. nádvoří', '3. nádvoří', '4. nádvoří', 'náměstí U Svatého Jiří', 'Jiřská', 'Vikářská', 'Zlatá ulička u Daliborky', 'Hradčanské náměstí', 'Na Opyši', 'Pražský hrad'], width: 3 } },
    // osa a podél Wilsonovy (205°), b = 295°: průčelí Fantovy budovy míří do Sherwoodu (+b), bloky jsou srovnané s mřížkou.
    // Mapa sahá na sever až za tramvajovou trať podél severního okraje Vrchlického sadů (zastávka Hlavní nádraží, a 3–6).
    // skip: budovy nahrazené ručně kresleným landmarkem (data.landmarks, půdorys L).
    // lowRows: domy v řadách a < 4 (useknutý okraj bloku severně od tramvajové trati) jsou vybombardované na přízemí,
    // jinak by vysoké fasády zakryly tramvajovou ulici a zastávku (mapa se dívá od jihozápadu, sever je vpředu vlevo).
    hlavak: { center: [50.0829, 14.4341], bearing: 205, len: 82, wid: 44, origin: [50, 22], lowRows: 4, skip: ['Praha hlavní nádraží'],
        // Fantova budova (b 11–14), před ní odbavovací hala s magistrálou na střeše (b 15–20); magistrála pokračuje
        // ve stejné výšce po estakádě přes celou mapu. WorldScene je zastaví díly z src/places/hlavak.js.
        // Kolejiště je navržené, ne z OSM (rastr z OSM dával přerušované koleje a nahodilé perony): napříč b 0–10 se střídá
        // kolej (t) a ostrovní nástupiště (n) podle vzoru, koleje vedou souvisle celou mapou, perony končí za přístřešky
        // (dál štěrk z), na řádcích crossings jsou dřevěné přechody přes koleje (x, průchozí).
        station: { b0: 0, pattern: 'tnttnttnttnn', platformsFrom: 10, platformsTo: 68, crossings: [23, 58] },
        boxes: [
            { key: 'fanta', a0: 27, a1: 55, b0: 11, b1: 14 },
            { key: 'hala', a0: 27, a1: 55, b0: 15, b1: 20 },
            { key: 'estakada_sever', a0: 0, a1: 26, b0: 15, b1: 20 },
            { key: 'estakada_jih', a0: 56, a1: 81, b0: 15, b1: 20 },
        ] },
};

const rad = Math.PI / 180;
// Projekce: metry od středu (x východ, y sever), otočení, aby osa a = bearing; b kolmo po směru hodin. Výsledek v dlaždicích.
export const projector = (place) => {
    const [lat0, lon0] = place.center;
    const theta = (90 - place.bearing) * rad;
    const kx = Math.cos(lat0 * rad) * 111320, ky = 110574;
    const project = (lat, lon) => {
        const x = (lon - lon0) * kx, y = (lat - lat0) * ky;
        const a = x * Math.cos(theta) + y * Math.sin(theta);
        const left = -x * Math.sin(theta) + y * Math.cos(theta); // vlevo od osy a
        return { a: a / TILE + place.origin[0], b: -left / TILE + place.origin[1] };
    };
    const unproject = (a, b) => {
        const am = (a - place.origin[0]) * TILE, left = -(b - place.origin[1]) * TILE;
        const x = am * Math.cos(theta) - left * Math.sin(theta), y = am * Math.sin(theta) + left * Math.cos(theta);
        return [lat0 + y / ky, lon0 + x / kx];
    };
    return { project, unproject };
};

// Zeměpisný obdélník mapy s okrajem `margin` metrů: [jih, západ, sever, východ].
export const bbox = (place, margin = 0) => {
    const { unproject } = projector(place);
    const m = margin / TILE;
    const pts = [[-0.5 - m, -0.5 - m], [place.len - 0.5 + m, -0.5 - m], [-0.5 - m, place.wid - 0.5 + m], [place.len - 0.5 + m, place.wid - 0.5 + m]].map(([a, b]) => unproject(a, b));
    return [Math.min(...pts.map((p) => p[0])), Math.min(...pts.map((p) => p[1])), Math.max(...pts.map((p) => p[0])), Math.max(...pts.map((p) => p[1]))];
};
