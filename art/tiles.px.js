// Isometrické dlaždice 128 × 64 (2:1), čtyřnásobek Václaváku. Směr podél (a) jde v dlaždici zleva dole doprava nahoru,
// směr napříč (b) zleva nahoře doprava dolů. Všechny dlaždice mají stejný kosočtverec, takže na sebe navazují.
// V tomhle detailu jde kreslit jednotlivé dlažební kostky a spáry, ne jen šum; šum zůstává jen u asfaltu a suti.
const TW = 128, TH = 64
// Kosočtverec: řádek y má poloviční šířku 2, 4, … 64, 64, … 4, 2.
const rowHalf = (y) => (y < TH / 2 ? 2 * (y + 1) : 2 * (TH - y))
const inDia = (x, y) => y >= 0 && y < TH && x >= TW / 2 - rowHalf(y) && x < TW / 2 + rowHalf(y)
const dia = (c, col) => { for (let y = 0; y < TH; y++) c.hline(TW / 2 - rowHalf(y), y, 2 * rowHalf(y), col) }
// Čára rovnoběžná se směrem podél (sklon −1/2) nebo napříč (sklon +1/2) bodem (x0, y0), ořezaná na dlaždici.
// sklon izometrie 2:1 je ±1/2: posun o TW vodorovně odpovídá TH/2·2 = TH svisle
const alongLine = (c, x0, y0, col) => c.clip(inDia, () => c.line(x0 - TW, y0 + TH, x0 + TW, y0 - TH, col))
const acrossLine = (c, x0, y0, col) => c.clip(inDia, () => c.line(x0 - TW, y0 - TH, x0 + TW, y0 + TH, col))

const tile = (name, body) => sprite(name, { w: TW, h: TH }, (c) => { body(c) })

// Asfalt: hladký, jen zrno a světlejší prach u okrajů.
tile("t_road", (c) => { dia(c, "a"); c.clip(inDia, () => { c.noise(0, 0, TW, TH, "A", 0.06, 3, "*"); c.noise(0, 0, TW, TH, "B", 0.04, 7, "*") }) })
tile("t_road_crack", (c) => {
  dia(c, "a"); c.clip(inDia, () => {
    c.line(24, 36, 52, 26, "A"); c.line(52, 26, 70, 40, "A"); c.line(70, 40, 100, 30, "A"); c.line(52, 26, 60, 14, "A")
    c.line(25, 37, 52, 27, "k"); c.line(70, 41, 100, 31, "k"); c.noise(0, 0, TW, TH, "A", 0.05, 11, "*")
  })
})
tile("t_road_line", (c) => { dia(c, "a"); alongLine(c, 64, 31, "w"); alongLine(c, 64, 32, "w"); c.clip(inDia, () => c.noise(0, 0, TW, TH, "A", 0.05, 5, "*")) })
// Chodník: velké dlaždice v mřížce podél a napříč, spáry tmavší, dvě kostky vyvrácené.
tile("t_pave", (c) => {
  dia(c, "q")
  for (let i = 0; i < 4; i++) { alongLine(c, 16 + i * 32, 56 - i * 16, "p"); acrossLine(c, 16 + i * 32, 8 + i * 16, "p") }
  c.clip(inDia, () => { c.rect(58, 28, 12, 6, "P"); c.rect(84, 38, 10, 5, "v") })
})
// Pražská mozaika: drobné kostky 4 × 2 ve dvou odstínech, pruh tmavého vzoru napříč.
tile("t_mosaic", (c) => {
  dia(c, "q")
  c.clip(inDia, () => {
    for (let y = 0; y < TH; y += 2) for (let x = (y % 4 ? 2 : 0); x < TW; x += 4) if ((x * 7 + y * 13) % 5 < 2) c.rect(x, y, 3, 1, "p")
    for (let i = -1; i < 3; i++) acrossLine(c, 16 + i * 48, 16 + i * 24, "P")
  })
})
// Zem jako ve Falloutu: souvislá zrnitá hlína (čtyři tóny), kamínky s osvětlenou hranou a stínem, praskliny; tráva je jen
// řídké trsy suché trávy na téže hlíně, aby se dlaždice nelišily jako šachovnice. Varianty se liší jen semínkem.
const dirtBase = (c, seed) => c.clip(inDia, () => {
  c.noise(0, 0, TW, TH, "3", 0.16, seed, "*"); c.noise(0, 0, TW, TH, "C", 0.12, seed + 1, "*"); c.noise(0, 0, TW, TH, "x", 0.04, seed + 2, "*")
  const rng = c.rng(seed)
  for (let i = 0; i < 9; i++) { const x = 4 + Math.floor(rng() * 120), y = 4 + Math.floor(rng() * 56); if (inDia(x, y) && inDia(x + 3, y + 2)) { c.rect(x, y, 3, 2, "v"); c.px(x, y, "w"); c.rect(x + 1, y + 2, 3, 1, "k") } }
  if (rng() < 0.5) { let x = 20 + rng() * 60, y = 20 + rng() * 20; for (let i = 0; i < 5; i++) { const nx = x + 6 + rng() * 8, ny = y + (rng() - 0.5) * 8; c.line(Math.round(x), Math.round(y), Math.round(nx), Math.round(ny), "3"); x = nx; y = ny } }
})
const tufts = (c, seed, n) => c.clip(inDia, () => {
  const rng = c.rng(seed)
  for (let i = 0; i < n; i++) {
    const x = 6 + Math.floor(rng() * 116), y = 8 + Math.floor(rng() * 52)
    if (!inDia(x, y) || !inDia(x, y - 6)) continue
    c.rect(x - 3, y, 7, 1, "3")
    for (let k = -3; k <= 3; k++) { const h = 3 + Math.floor(rng() * 5); c.line(x + k, y, x + k + (k > 0 ? 1 : k < 0 ? -1 : 0), y - h, rng() < 0.5 ? "4" : "g") }
  }
})
;[0, 1, 2].forEach((i) => {
  tile("t_dirt" + (i ? i + 1 : ""), (c) => { dia(c, "e"); dirtBase(c, 51 + i * 7) })
  tile("t_grass" + (i ? i + 1 : ""), (c) => { dia(c, "e"); dirtBase(c, 81 + i * 7); tufts(c, 91 + i * 5, 7 + i * 3) })
})
tile("t_rubble", (c) => { dia(c, "q"); c.clip(inDia, () => { c.noise(0, 0, TW, TH, "x", 0.2, 23, "*"); c.rect(40, 24, 18, 10, "x"); c.rect(44, 22, 10, 4, "v"); c.rect(76, 36, 14, 8, "v"); c.rect(60, 42, 8, 6, "P"); c.rect(30, 38, 6, 4, "r") }) })
// Voda Vltavy tam, kde dřív byla ulice: tmavá hloubka, světlejší pruhy hladiny podél, odraz.
tile("t_water", (c) => { dia(c, "Z"); c.clip(inDia, () => { c.noise(0, 0, TW, TH, "X", 0.1, 31, "*"); alongLine(c, 40, 40, "J"); alongLine(c, 84, 26, "J"); alongLine(c, 62, 46, "J") }) })
group("road", ["t_road", "t_road", "t_road_crack"])
group("pave", ["t_pave", "t_pave", "t_mosaic"])

// Obrubníky: chodník s kamennou hranou na straně, kde sousedí s vozovkou. Hrany kosočtverce: ne (+a), se (+b), sw (−a), nw (−b).
// Generují se všechny kombinace hran, klíč t_pave_<hrany v pořadí ne, se, sw, nw>, např. t_pave_ne_se pro roh.
const EDGE = {
  ne: (x, y) => y - (x / 2 - 32) < 7,
  nw: (x, y) => y - (32 - x / 2) < 7,
  se: (x, y) => (96 - x / 2) - y < 7,
  sw: (x, y) => (x / 2 + 32) - y < 7,
}
const EDGE_OUTER = {
  ne: (x, y) => y - (x / 2 - 32) < 2,
  nw: (x, y) => y - (32 - x / 2) < 2,
  se: (x, y) => (96 - x / 2) - y < 2,
  sw: (x, y) => (x / 2 + 32) - y < 2,
}
const curb = (edges) => tile("t_pave_" + edges.join("_"), (c) => {
  dia(c, "q")
  for (let i = 0; i < 4; i++) { alongLine(c, 16 + i * 32, 56 - i * 16, "p"); acrossLine(c, 16 + i * 32, 8 + i * 16, "p") }
  edges.forEach((e) => {
    c.clip((x, y) => inDia(x, y) && EDGE[e](x, y), () => c.rect(0, 0, TW, TH, "v"))
    c.clip((x, y) => inDia(x, y) && EDGE_OUTER[e](x, y), () => c.rect(0, 0, TW, TH, "P"))
  })
})
// Všechny neprázdné podmnožiny hran v pořadí ne, se, sw, nw (ostrůvek uprostřed vozovky má všechny čtyři).
const EDGES = ["ne", "se", "sw", "nw"]
for (let mask = 1; mask < 16; mask++) curb(EDGES.filter((e, i) => mask & (1 << i)))

// Přechody pro chodce: pruhy kolmo na směr jízdy. t_zebra_a leží na ulici podél (a), t_zebra_b na ulici napříč (b).
tile("t_zebra_a", (c) => { dia(c, "a"); c.clip(inDia, () => { for (let i = 0; i < 8; i++) { const x0 = 8 + i * 16, y0 = 64 - x0 / 2; c.line(x0 - 64, y0 - 32, x0 + 64, y0 + 32, "w", 6) } }) })
tile("t_zebra_b", (c) => { dia(c, "a"); c.clip(inDia, () => { for (let i = 0; i < 8; i++) { const x0 = 8 + i * 16, y0 = x0 / 2; c.line(x0 - 64, y0 + 32, x0 + 64, y0 - 32, "w", 6) } }) })
// Dělicí čára napříč (ulice ve směru b).
tile("t_road_line_b", (c) => { dia(c, "a"); acrossLine(c, 64, 31, "w"); acrossLine(c, 64, 32, "w"); c.clip(inDia, () => c.noise(0, 0, TW, TH, "A", 0.05, 5, "*")) })
// Koleje podél (a): dvě kolejnice se stínem, pražce napříč, štěrk.
// Kolej podél a: rezavohnědý štěrk, tmavé dřevěné pražce napříč (dvojitá čára se stínem), dvě kolejnice se stínem
// a vyleštěnou hranou, aby byly vidět i po barevném ladění. Kolejnice jdou středem dlaždice, takže navazují.
tile("t_rail_a", (c) => {
  dia(c, "3"); c.clip(inDia, () => { c.noise(0, 0, TW, TH, "x", 0.22, 21, "*"); c.noise(0, 0, TW, TH, "U", 0.08, 22, "*"); c.noise(0, 0, TW, TH, "v", 0.06, 23, "*") })
  // pražce: krátké příčky napříč (směr +2, +1) pod oběma kolejnicemi, po 10 bodech podél (směr +2, −1)
  c.clip(inDia, () => { for (let t = -70; t <= 70; t += 10) { const x = 64 + t, y = 32 - t / 2; c.line(x - 18, y - 9, x + 18, y + 9, "K", 2); c.line(x - 18, y - 8, x + 18, y + 10, "k") } })
  // kolejnice v rozchodu napříč od osy: stín, tělo, odlesk
  ;[[-8, -4], [8, 4]].forEach(([dx, dy]) => { const x = 64 + dx, y = 32 + dy; alongLine(c, x, y + 2, "k"); alongLine(c, x, y + 1, "S"); alongLine(c, x, y, "m"); alongLine(c, x, y - 1, "W") })
})
// Štěrk kolejiště bez koleje (za konci peronů) a dřevěný přechod přes kolej: prkna napříč přes celou dlaždici, kolejnice
// vedou skrz (stejná poloha jako v t_rail_a, takže navazují).
const ballast = (c) => { dia(c, "3"); c.clip(inDia, () => { c.noise(0, 0, TW, TH, "x", 0.22, 21, "*"); c.noise(0, 0, TW, TH, "U", 0.08, 22, "*"); c.noise(0, 0, TW, TH, "v", 0.06, 23, "*") }) }
tile("t_ballast", (c) => ballast(c))
tile("t_rail_cross", (c) => {
  ballast(c)
  c.clip(inDia, () => { for (let k = -5; k <= 5; k++) { const x = 64 + k * 8, y = 32 - k * 4; c.line(x - 70, y - 35, x + 70, y + 35, k % 2 ? "h" : "H", 3); c.line(x - 70, y - 33, x + 70, y + 37, "K") } })
  ;[[-8, -4], [8, 4]].forEach(([dx, dy]) => { const x = 64 + dx, y = 32 + dy; alongLine(c, x, y + 1, "S"); alongLine(c, x, y, "m"); alongLine(c, x, y - 1, "W") })
})
// Vnitroblok: udusaná hlína a zbytky dlažby.
tile("t_yard", (c) => { dia(c, "P"); c.clip(inDia, () => { c.noise(0, 0, TW, TH, "e", 0.1, 33, "*"); c.rect(30, 20, 10, 5, "p"); c.rect(70, 36, 12, 6, "p"); c.rect(52, 44, 6, 4, "q") }) })

// Nástupiště: betonové desky se spárami napříč a podél, olejová skvrna. Pod zřícenou halou.
tile("t_platform", (c) => {
  dia(c, "p")
  for (let i = 0; i < 4; i++) { alongLine(c, 16 + i * 32, 56 - i * 16, "P"); acrossLine(c, 16 + i * 32, 8 + i * 16, "P") }
  c.clip(inDia, () => { c.ellipse(70, 30, 9, 4, "P"); c.rect(40, 40, 6, 2, "x") })
})
// Mlatová pěšina v parku: udusaný štěrk, podél okrajů vyšlapaná tráva.
tile("t_path", (c) => {
  dia(c, "C"); c.clip(inDia, () => { c.noise(0, 0, TW, TH, "e", 0.3, 41, "*"); c.noise(0, 0, TW, TH, "c", 0.06, 43, "*"); c.noise(0, 0, TW, TH, "3", 0.04, 47, "*") })
})

// Nafoukaný písek a hlína přes silnici a chodník (jazyk písku se zvlněnými hřbety), prasklina s plevelem.
const drift = (c, seed) => c.clip(inDia, () => {
  const rng = c.rng(seed)
  const cx = 30 + rng() * 60, cy = 20 + rng() * 26
  c.ellipse(cx, cy, 34 + rng() * 14, 12 + rng() * 6, "e"); c.ellipse(cx + 10, cy + 3, 22, 7, "C")
  for (let k = -2; k <= 2; k++) c.line(cx - 20 + k * 6, cy - 4 + k * 3, cx - 4 + k * 6, cy - 8 + k * 3, "4")
})
const weedCrack = (c, seed) => c.clip(inDia, () => { const rng = c.rng(seed); let x = 20 + rng() * 30, y = 30 + rng() * 10; for (let i = 0; i < 6; i++) { const nx = x + 10 + rng() * 6, ny = y - 4 + rng() * 8; c.line(x, y, nx, ny, "k"); if (i % 2) { c.vline(nx, ny - 4, 4, "G"); c.px(nx + 1, ny - 3, "g") } x = nx; y = ny } })
tile("t_road_sand", (c) => { dia(c, "a"); c.clip(inDia, () => c.noise(0, 0, TW, TH, "A", 0.06, 3, "*")); drift(c, 61) })
tile("t_road_sand2", (c) => { dia(c, "a"); c.clip(inDia, () => { c.noise(0, 0, TW, TH, "A", 0.06, 5, "*"); c.noise(0, 0, TW, TH, "e", 0.18, 65, "*") }) })
tile("t_road_weed", (c) => { dia(c, "a"); c.clip(inDia, () => c.noise(0, 0, TW, TH, "A", 0.06, 4, "*")); weedCrack(c, 63) })
// Tři varianty písku na chodníku s různým tvarem a velikostí jazyku, ať se vzor neopakuje.
;[67, 71, 77].forEach((seed, i) => tile("t_pave_sand" + (i ? i + 1 : ""), (c) => {
  dia(c, "q")
  for (let k = 0; k < 4; k++) { alongLine(c, 16 + k * 32, 56 - k * 16, "p"); acrossLine(c, 16 + k * 32, 8 + k * 16, "p") }
  if (i === 2) c.clip(inDia, () => c.noise(0, 0, TW, TH, "e", 0.25, seed, "*"))
  else drift(c, seed)
}))
tile("t_pave_weed", (c) => {
  dia(c, "q")
  for (let i = 0; i < 4; i++) { alongLine(c, 16 + i * 32, 56 - i * 16, "p"); acrossLine(c, 16 + i * 32, 8 + i * 16, "p") }
  weedCrack(c, 69)
})

// Nálepky přes více dlaždic (kreslí se do podlahy po dlaždicích, rozbíjí mřížku): jazyky písku a hlíny přes silnice
// a chodníky, dlouhé praskliny, olejové skvrny. Okraje se rozpadají do zrna.
const blob = (name, w, h, seed, col, edge) => sprite(name, { w, h }, (c) => {
  const rng = c.rng(seed), cx = w / 2, cy = h / 2
  const lobes = Array.from({ length: 6 }, () => [cx + (rng() - 0.5) * w * 0.55, cy + (rng() - 0.5) * h * 0.4, w * (0.12 + rng() * 0.16), h * (0.14 + rng() * 0.18)])
  const inside = (x, y, grow = 1) => lobes.some(([lx, ly, rx, ry]) => ((x - lx) / (rx * grow)) ** 2 + ((y - ly) / (ry * grow)) ** 2 < 1)
  c.clip((x, y) => inside(x, y, 1.35) && !inside(x, y), () => c.noise(0, 0, w, h, col, 0.35, seed + 3))
  c.clip((x, y) => inside(x, y), () => { c.rect(0, 0, w, h, col); c.noise(0, 0, w, h, edge, 0.12, seed + 5); c.noise(0, 0, w, h, "3", 0.06, seed + 7) })
})
blob("decal_sand_a", 300, 130, 11, "e", "C"); blob("decal_sand_b", 220, 100, 23, "e", "C"); blob("decal_sand_c", 360, 150, 37, "e", "3")
blob("decal_oil", 90, 40, 41, "A", "k")
sprite("decal_crack", { w: 240, h: 120 }, (c) => {
  const rng = c.rng(5); let x = 10, y = 100
  for (let i = 0; i < 16; i++) { const nx = x + 12 + rng() * 6, ny = y - 6 + (rng() - 0.5) * 6; c.line(Math.round(x), Math.round(y), Math.round(nx), Math.round(ny), "k"); if (rng() < 0.35) { c.line(Math.round(nx), Math.round(ny), Math.round(nx + 8), Math.round(ny + 6 * (rng() - 0.3)), "k") } if (rng() < 0.3) { c.vline(Math.round(nx), Math.round(ny) - 4, 4, "G") } x = nx; y = ny }
})
