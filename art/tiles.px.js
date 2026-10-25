// Isometrické dlaždice 128 × 64 (2:1), čtyřnásobek Václaváku. Směr podél (a) jde v dlaždici zleva dole doprava nahoru,
// směr napříč (b) zleva nahoře doprava dolů. Všechny dlaždice mají stejný kosočtverec, takže na sebe navazují.
// V tomhle detailu jde kreslit jednotlivé dlažební kostky a spáry, ne jen šum; šum zůstává jen u asfaltu a suti.
const TW = 128, TH = 64
// Kosočtverec: řádek y má poloviční šířku 2, 4, … 64, 64, … 4, 2.
const rowHalf = (y) => (y < TH / 2 ? 2 * (y + 1) : 2 * (TH - y))
const inDia = (x, y) => y >= 0 && y < TH && x >= TW / 2 - rowHalf(y) && x < TW / 2 + rowHalf(y)
const dia = (c, col) => { for (let y = 0; y < TH; y++) c.hline(TW / 2 - rowHalf(y), y, 2 * rowHalf(y), col) }
// Čára rovnoběžná se směrem podél (sklon −1/2) nebo napříč (sklon +1/2) bodem (x0, y0), ořezaná na dlaždici.
const alongLine = (c, x0, y0, col) => c.clip(inDia, () => c.line(x0 - TW, y0 + TH / 2, x0 + TW, y0 - TH / 2, col))
const acrossLine = (c, x0, y0, col) => c.clip(inDia, () => c.line(x0 - TW, y0 - TH / 2, x0 + TW, y0 + TH / 2, col))

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
tile("t_grass", (c) => { dia(c, "g"); c.clip(inDia, () => { c.noise(0, 0, TW, TH, "G", 0.14, 9, "*"); for (let i = 0; i < 18; i++) { const x = 10 + (i * 37) % 108, y = 6 + (i * 23) % 52; if (inDia(x, y) && inDia(x, y - 3)) c.vline(x, y - 3, 3, "G") } }) })
tile("t_rubble", (c) => { dia(c, "q"); c.clip(inDia, () => { c.noise(0, 0, TW, TH, "x", 0.2, 23, "*"); c.rect(40, 24, 18, 10, "x"); c.rect(44, 22, 10, 4, "v"); c.rect(76, 36, 14, 8, "v"); c.rect(60, 42, 8, 6, "P"); c.rect(30, 38, 6, 4, "r") }) })
// Voda Vltavy tam, kde dřív byla ulice: tmavá hloubka, světlejší pruhy hladiny podél, odraz.
tile("t_water", (c) => { dia(c, "Z"); c.clip(inDia, () => { c.noise(0, 0, TW, TH, "X", 0.1, 31, "*"); alongLine(c, 40, 40, "J"); alongLine(c, 84, 26, "J"); alongLine(c, 62, 46, "J") }) })
group("road", ["t_road", "t_road", "t_road_crack"])
group("pave", ["t_pave", "t_pave", "t_mosaic"])
