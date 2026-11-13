// Nuselský most nad zatopeným údolím Botiče: díly po dlaždicích, ze kterých WorldScene.buildNusle skládá mostovku
// (src/places/nuselak.js, `nusle`). Mostovka je rovný pás b 17–20, pod ní betonová trouba (komorový nosník, uvnitř
// jezdí metro C), pod ní volný prostor až k hladině a jen pilíře. Hladina leží NS_D bodů pod mostovkou (asi 23 m),
// zem hra kreslí rovně, hloubku dělají pilíře visící od trouby dolů. Uprostřed prostředního pole je most zlomený:
// severní konec visí do vody, z jižního trčí uvízlá souprava metra C. Přes mezeru je natažené lano s kladkou.
// Předloha: fotky Nuselského mostu (Wikimedia Commons, Category:Nusle Bridge), jen předloha, neobkreslovat.
// Geometrie jako u Karlova mostu (art/most-oblouky.px.js): p(u, d, h) z mstKit, u podél +a (64 bodů na dlaždici),
// d kolmo dovnitř (k −b), h výška nad mostovkou. Líc k +b je tmavší, líc k −a světlý.

const NS_T = 64             // místo nad počátkem (zábradlí, sloupy lana)
const NS_G = 92             // výška trouby pod mostovkou (s deskou)
const NS_D = 380            // hladina pod mostovkou
const NS_GAP = 6            // délka zlomu v dlaždicích (src/places/nuselak.js nusle.gap)
const NS_W = 4              // šířka mostovky v dlaždicích (b 17–20)

// Beton: šedý podklad, svislé spáry bednění po 16, mapy vlhka a rzi, saze pod římsou, místy holá výztuž.
function nsConcrete(c, F, u0, u1, v0, v1, rng, base, joint, stain) {
  c.poly([...F(u0, v0), ...F(u1, v0), ...F(u1, v1), ...F(u0, v1)], base)
  for (let u = Math.ceil(u0 / 16) * 16; u < u1; u += 16) c.line(...F(u, v0), ...F(u, v1), joint)
  for (let i = 0; i < (u1 - u0) / 6; i++) {
    const u = u0 + rng() * (u1 - u0), v = v1 - 2 - rng() * 6
    c.line(...F(u, v), ...F(u + (rng() - 0.5) * 2, v - 6 - rng() * (v1 - v0) * 0.6), rng() < 0.3 ? "U" : stain)
  }
  if (rng() < 0.7) {
    const u = u0 + 6 + rng() * (u1 - u0 - 16), v = v0 + 10 + rng() * (v1 - v0 - 24)
    c.poly([...F(u, v), ...F(u + 10, v), ...F(u + 9, v + 7), ...F(u + 1, v + 8)], "A")
    for (let k = 0; k < 3; k++) c.line(...F(u + 2 + k * 3, v + 1), ...F(u + 2 + k * 3, v + 7), "U")
  }
}

// Zábradlí na hraně mostovky: sloupky po 16, dvě madla, místy vylomené a ohnuté.
function nsRailing(c, F, u0, u1, rng) {
  const bent = rng() < 0.3 ? u0 + rng() * (u1 - u0 - 16) : -99
  for (let u = u0 + 4; u < u1; u += 16) { if (u > bent && u < bent + 16) continue; c.line(...F(u, 0), ...F(u, 20), "M") }
  for (const v of [12, 20]) {
    let last = null
    for (let u = u0; u <= u1; u += 2) {
      const off = u > bent && u < bent + 16 ? -6 - (u - bent) * 0.5 : 0
      const pt = F(u, v + off)
      if (last) c.line(...last, ...pt, v === 20 ? "m" : "M")
      last = pt
    }
  }
}

// Přední líc mostovky (k +b): zábradlí, římsa, trouba. pier: pod troubou pilíř až k hladině (lichoběžník, nahoře
// široký, dole užší), s mokrým pruhem u hladiny.
function nsFront(name, pier, seed) {
  const W = 112, H = NS_T + (pier ? NS_D + 40 : NS_G + 16)
  sprite(name, { w: W, h: H }, (c) => {
    const rng = c.rng(seed)
    const K = mstKit(c, 16, NS_T, rng)
    const { p } = K
    const F = (u, v) => p(u, 0, v)
    if (pier) {
      // pilíř: líc k +b (tmavší) a bok k −a (světlý), od spodku trouby k hladině
      const top = -NS_G, bot = -NS_D
      const L = (h) => 6 + (h - top) / (bot - top) * 14, R = (h) => 58 - (h - top) / (bot - top) * 14
      c.poly([...p(L(top), 0, top), ...p(R(top), 0, top), ...p(R(bot), 0, bot), ...p(L(bot), 0, bot)], "P")
      c.poly([...p(L(top), 0, top), ...p(L(top), 26, top), ...p(L(bot), 26, bot), ...p(L(bot), 0, bot)], "q")
      for (let h = top - 24; h > bot + 10; h -= 24) c.line(...p(L(h), 0, h), ...p(R(h), 0, h), "x")
      for (let i = 0; i < 9; i++) { const h = top - rng() * (top - bot), u = L(h) + 2 + rng() * (R(h) - L(h) - 4); c.line(...p(u, 0, h), ...p(u, 0, h - 10 - rng() * 40), rng() < 0.4 ? "U" : "A") }
      // mokrý pruh, řasy a pěna u hladiny
      c.poly([...p(L(bot + 30), 0, bot + 30), ...p(R(bot + 30), 0, bot + 30), ...p(R(bot), 0, bot), ...p(L(bot), 0, bot)], "x")
      for (let u = L(bot); u < R(bot); u += 3) c.line(...p(u, 0, bot + 4), ...p(u, 0, bot + 10 + rng() * 14), rng() < 0.5 ? "Q" : "K")
      c.line(...p(L(bot) - 6, -4, bot), ...p(R(bot) + 6, -4, bot), "J"); c.line(...p(L(bot) - 3, -8, bot), ...p(R(bot) + 2, -8, bot), "Z")
    }
    // trouba: dolní hrana stínem, nahoře římsa (deska mostovky přečnívá)
    nsConcrete(c, F, 0, 64, -NS_G, -10, rng, "P", "x", "A")
    c.line(...F(0, -NS_G), ...F(64, -NS_G), "k")
    c.poly([...F(0, -10), ...F(64, -10), ...F(64, 0), ...F(0, 0)], "q")
    c.line(...F(0, -10), ...F(64, -10), "A")
    nsRailing(c, F, 0, 64, rng)
    // plevel na římse
    for (let i = 0; i < 3; i++) { const u = rng() * 60; c.vline(...F(u, 2).map(Math.round), 3, "g") }
  })
}

// Zadní zábradlí (hrana mostovky k −b): jen zábradlí na hraně, trouba je za mostovkou schovaná.
function nsFar(name, seed) {
  sprite(name, { w: 84, h: 48 }, (c) => {
    const rng = c.rng(seed)
    const K = mstKit(c, 8, 44, rng)
    const { p } = K
    nsRailing(c, (u, v) => p(u, 0, v), 0, 64, rng)
  })
}

// Severní konec zlomu: deska mostovky utržená na hraně se zalomila do mezery (k +a) a visí šikmo k hladině, z ní trčí
// výztuž. Divák stojí na straně −a, takže desku vidí jen v mezeře a pod troubou: kreslí se jen tam (ořez), přes
// mostovku před ní ne (jinak by zakryla lanaře a sloupek lana). Počátek v pravém rohu hrany (konec dlaždice
// a = g0 − 1 na straně +b), hrana jde k −b (d 0–256).
sprite("ns_konec_sever", { w: 600, h: 480 }, (c) => {
  const rng = c.rng(71)
  const ox = 290, oy = 200
  const K = mstKit(c, ox, oy, rng)
  const { p } = K
  const Wd = NS_W * 64
  // viditelná část: vpravo od rohu hrany a pod spodkem trouby (NS_G) na straně k divákovi
  const seen = [ox, 0, 600, 0, 600, 480, 0, 480, 0, oy + NS_G + ox / 2, ox, oy + NS_G]
  // zalomená deska: horní hrana na zlomu, spodní okraj daleko v mezeře (u 200–270) a dole u hladiny, zubatý
  const foot = []
  for (let d = 0; d <= Wd; d += 16) foot.push([230 + rng() * 40 - d * 0.1, d, -210 - rng() * 30])
  c.clip(seen, () => {
    const q = []
    for (let d = 0; d <= Wd; d += 16) q.push(...p(0, d, 0))
    for (let k = foot.length - 1; k >= 0; k--) q.push(...p(...foot[k]))
    c.poly(q, "P")
    // podhled trouby: podélné spáry rovnoběžně se zlomem a praskliny
    for (const t of [0.3, 0.55, 0.8]) c.line(...p(230 * t, 0, -210 * t), ...p(230 * t - 26 * t, Wd, -210 * t), "x")
    for (let i = 0; i < 6; i++) { const t = 0.2 + rng() * 0.6, d = rng() * Wd; c.line(...p(230 * t, d, -210 * t), ...p(230 * t + 30, d + (rng() - 0.5) * 30, -210 * t - 30), "N") }
    // tloušťka desky na straně +b (k divákovi)
    c.poly([...p(0, 0, 0), ...p(...foot[0]), ...p(foot[0][0], 0, foot[0][2] - 14), ...p(0, 0, -NS_G)], "p")
    // výztuž: rezavé pruty trčící ze spodní hrany
    for (let i = 0; i < 26; i++) { const k = Math.floor(rng() * foot.length), [u, d, h] = foot[k]; c.line(...p(u, d, h), ...p(u + 4 + rng() * 14, d + (rng() - 0.5) * 8, h - 8 - rng() * 22), "U") }
    // zábradlí ohnuté přes hranu dolů po desce
    c.line(...p(0, 2, 20), ...p(40, 2, -40), "M"); c.line(...p(40, 2, -40), ...p(110, 2, -150), "M")
    // voda u spodku: pěna kolem desky
    for (let k = 0; k < foot.length; k += 2) { const [u, d, h] = foot[k]; c.line(...p(u - 6, d, h - 6), ...p(u + 10, d - 10, h - 6), k % 4 ? "J" : "Z") }
  })
})

// Jižní konec zlomu: průřez mostem k −a (světlý líc), deska nahoře, pod ní komorová trouba s tmavou dutinou,
// z ní trčí červené čelo soupravy metra C nakloněné dolů. Počátek ve spodním rohu průřezu (a = g1 + 0,5, strana +b),
// průřez jde k −b (d 0–256).
sprite("ns_konec_jih", { w: 380, h: 320 }, (c) => {
  const rng = c.rng(73)
  const K = mstKit(c, 340, 170, rng)
  const { p } = K
  const Wd = NS_W * 64
  const F = (u, v) => p(0, u, v)
  // deska mostovky (lomená hrana)
  const top = [...F(0, 0)]
  for (let d = 0; d <= Wd; d += 12) top.push(...F(d, -2 - rng() * 6))
  top.push(...F(Wd, -14), ...F(0, -14))
  c.poly(top, "q")
  // trouba: obvodové stěny a dutina (metro uvnitř)
  const g0 = 40, g1 = Wd - 40
  c.poly([...F(g0, -14), ...F(g1, -14), ...F(g1 - 10, -NS_G), ...F(g0 + 10, -NS_G)], "p")
  c.poly([...F(g0 + 10, -24), ...F(g1 - 10, -24), ...F(g1 - 18, -NS_G + 10), ...F(g0 + 18, -NS_G + 10)], "N")
  for (let i = 0; i < 16; i++) { const d = g0 + rng() * (g1 - g0), h = -14 - rng() * 6; c.line(...F(d, h), ...F(d + (rng() - 0.5) * 6, h - 4 - rng() * 10), "U") }
  // kolejnice v dutině a kabely
  c.line(...F(g0 + 24, -NS_G + 14), ...F(g1 - 24, -NS_G + 14), "M")
  c.line(...F(g0 + 30, -30), ...F(g0 + 60, -44), "k"); c.line(...F(g1 - 40, -32), ...F(g1 - 70, -48), "k")
  // souprava 81-71: čelo trčí z dutiny ven (k −a) a dolů, nakloněné
  const tx = (a, d, h) => p(-a, d, h - a * 0.35)
  const d0 = Wd / 2 - 46, d1 = Wd / 2 + 46
  c.poly([...tx(0, d0, -30), ...tx(0, d1, -30), ...tx(60, d1, -36), ...tx(60, d0, -36)], "V")       // střecha
  c.poly([...tx(60, d0, -36), ...tx(60, d1, -36), ...tx(60, d1, -86), ...tx(60, d0, -86)], "V")      // čelo
  c.poly([...tx(0, d1, -30), ...tx(60, d1, -36), ...tx(60, d1, -86), ...tx(0, d1, -80)], "R")      // bok k +b
  c.poly([...tx(60, d0 + 10, -42), ...tx(60, d1 - 10, -42), ...tx(60, d1 - 10, -60), ...tx(60, d0 + 10, -60)], "n")  // okno
  c.line(...tx(60, d0 + 14, -46), ...tx(60, d0 + 40, -58), "l"); c.line(...tx(60, d0 + 50, -44), ...tx(60, d1 - 16, -56), "l")
  c.poly([...tx(60, d0, -66), ...tx(60, d1, -66), ...tx(60, d1, -72), ...tx(60, d0, -72)], "W")    // bílý pruh
  for (const d of [d0 + 14, d1 - 14]) { const [x, y] = tx(60, d, -78); c.circ(Math.round(x), Math.round(y), 3, "x"); c.px(Math.round(x), Math.round(y), "w") }
  for (let k = 0; k < 4; k++) c.line(...tx(14 + k * 12, d1, -34), ...tx(14 + k * 12, d1, -78), "D")
  // nápis linky na čele: červený čtverec C
  const [cx, cy] = tx(60, d0 + 6, -40); c.rect(Math.round(cx) - 4, Math.round(cy) - 2, 8, 8, "7"); c.text(Math.round(cx) - 2, Math.round(cy) - 1, "C", "k")
  // pod průřezem utržené konce trouby a výztuž visící dolů
  for (let i = 0; i < 18; i++) { const d = g0 + rng() * (g1 - g0); c.line(...F(d, -NS_G), ...F(d + (rng() - 0.5) * 6, -NS_G - 8 - rng() * 30), "U") }
  c.poly([...F(g0 + 10, -NS_G), ...F(g0 + 60, -NS_G), ...F(g0 + 40, -NS_G - 40)], "P")
})

// Lano přes mezeru: ocelový sloupek na každém konci (mezi nimi NS_GAP + 1 dlaždic podél a), lano se prověšuje,
// u severního sloupku kladka a rezavý buben s klikou. Počátek u paty severního sloupku.
sprite("ns_lano", { w: (NS_GAP + 1) * 64 + 60, h: (NS_GAP + 1) * 32 + 170 }, (c) => {
  const L = NS_GAP + 1, ox = 20, oy = L * 32 + 120
  const P = (a, h) => [ox + a * 64, oy - a * 32 - h]
  const post = (a) => { const [x, y] = P(a, 0); c.rect(x - 2, y - 78, 4, 78, "M"); c.rect(x - 2, y - 78, 1, 78, "m"); c.rect(x - 5, y - 80, 10, 4, "A"); c.rect(x - 6, y - 2, 12, 3, "A") }
  post(0); post(L)
  const [x0, y0] = P(0, 76), [x1, y1] = P(L, 76)
  let last = null
  for (let t = 0; t <= 1.0001; t += 0.01) {
    const x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * 56
    if (last) c.line(...last, Math.round(x), Math.round(y), "x")
    last = [Math.round(x), Math.round(y)]
  }
  // druhé, nosné lano o kus níž (hrdinka visí na horním, nohama šmátrá po spodním)
  last = null
  for (let t = 0; t <= 1.0001; t += 0.01) {
    const x = x0 + (x1 - x0) * t, y = y0 + 22 + (y1 - y0) * t + Math.sin(t * Math.PI) * 60
    if (last) c.line(...last, Math.round(x), Math.round(y), "A")
    last = [Math.round(x), Math.round(y)]
  }
  // kladka a buben
  c.circ(x0 + 6, y0 + 2, 4, "M"); c.circ(x0 + 6, y0 + 2, 1, "k")
  const [bx, by] = P(0.3, 0); c.rect(bx - 10, by - 18, 20, 14, "U"); c.ellipse(bx, by - 18, 10, 3, "u"); c.line(bx + 10, by - 12, bx + 18, by - 20, "M")
  // cedulka na sloupku: cena za přechod
  const [sx, sy] = P(0, 40); c.rect(sx + 3, sy - 6, 22, 12, "W"); c.text(sx + 5, sy - 4, "2 J", "k")
})

nsFront("ns_predni", false, 1); nsFront("ns_predni2", false, 2)
nsFront("ns_pilir", true, 3)
nsFar("ns_zadni", 4); nsFar("ns_zadni2", 5)

// —— Stanice Vyšehrad pod silnicí u jižního konce mostu (src/places/nuselak.js nusle.station) ——
// Silnice je o patro (NS_ST) výš než terén u mola: od její hrany k +b visí stěna po dílech na dlaždici. Počátek dílu
// je levý konec hrany (0, NS_SM + 32), hrana stoupá doprava o 32. Díly: holý beton, prosklené čelo haly (pás skel
// mezi pilíři, vybitá a zatlučená), klín (stěna se ke konci snižuje do terénu) a schody přes dvě dlaždice.
const NS_ST = 64, NS_SM = 16
function nsStFace(name, seed, h0, h1, paint) {
  sprite(name, { w: 64, h: NS_SM + 32 + NS_ST + 2 }, (c) => {
    const rng = c.rng(seed)
    const F = (u, v) => [u, NS_SM + 32 - u / 2 + v]          // u podél hrany, v dolů od hrany
    const hAt = (u) => h0 + (h1 - h0) * u / 64
    const quad = (u0, u1, v0, v1, col) => c.poly([...F(u0, Math.min(v0, hAt(u0))), ...F(u1, Math.min(v0, hAt(u1))), ...F(u1, Math.min(v1, hAt(u1))), ...F(u0, Math.min(v1, hAt(u0)))], col)
    c.poly([...F(0, 0), ...F(64, 0), ...F(64, h1), ...F(0, h0)], "P")
    quad(0, 64, 0, 9, "q"); quad(0, 64, 9, 10, "A")
    if (paint) paint(c, F, quad, rng)
    for (let i = 0; i < 5; i++) { const u = rng() * 62, [x, y] = F(u, 10); c.vline(Math.round(x), Math.round(y), Math.min(hAt(u) - 10, 6 + Math.floor(rng() * 26)), rng() < 0.3 ? "U" : "A") }
    if (h0 > 20) { c.line(...F(0, h0 - 1), ...F(64, h1 - 1), "9"); for (let i = 0; i < 3; i++) { const [x, y] = F(rng() * 60, hAt(32) - 2); c.vline(Math.round(x), Math.round(y) - 3, 3, "g") } }
    // zábradlí na hraně silnice
    for (const u of [2, 34]) { const [x, y] = F(u, 0); c.vline(Math.round(x), Math.round(y) - 12, 12, "M") }
    c.line(...F(0, -12), ...F(64, -12), "m"); c.line(...F(0, -6), ...F(64, -6), "M")
  })
}
const nsStGlass = (broken) => (c, F, quad, rng) => {
  for (const u of [3, 34]) {
    const t = rng()
    quad(u, u + 27, 14, NS_ST - 8, broken && t < 0.5 ? "k" : t < 0.15 ? "H" : "n")
    quad(u, u + 27, 14, 17, "L")
    quad(u + 13, u + 14, 14, NS_ST - 8, "S"); quad(u, u + 27, 36, 37, "S")
    if (broken && t < 0.5) { const [x, y] = F(u + 5, NS_ST - 9); c.poly([x, y, x + 6, y - 14, x + 10, y - 3], "L") }
    else if (t > 0.7) c.line(...F(u + 3, 20), ...F(u + 22, NS_ST - 12), "L")
  }
  quad(0, 64, NS_ST - 8, NS_ST, "9")
}
nsStFace("ns_st_zed", 201, NS_ST, NS_ST, (c, F, quad) => { quad(31, 32, 10, NS_ST, "x") })
nsStFace("ns_st_sklo", 202, NS_ST, NS_ST, nsStGlass(false))
nsStFace("ns_st_sklo2", 203, NS_ST, NS_ST, nsStGlass(true))
nsStFace("ns_st_klin_1", 204, NS_ST, 43)
nsStFace("ns_st_klin_2", 205, 43, 21)
nsStFace("ns_st_klin_3", 206, 21, 0)
// Schody ze silnice dolů k molu: dvě dlaždice hrany, stupně v rovině dlaždic (hrdinka po nich jde), vlevo bok schodiště.
sprite("ns_st_schody", { w: 194, h: NS_SM + 64 + NS_ST + 2 }, (c) => {
  const F = (u, t) => [u + t * 64, NS_SM + 64 - u / 2 + t * 32]   // u podél hrany 0–128, t 0–1 dolů po schodech
  c.poly([...F(0, 0), 0, NS_SM + 64 + NS_ST, ...F(0, 1)], "P"); c.line(...F(0, 0), 0, NS_SM + 64 + NS_ST, "9")
  const N = 8
  for (let i = 0; i < N; i++) {
    const t0 = i / N, t1 = (i + 1) / N
    c.poly([...F(0, t0), ...F(128, t0), ...F(128, t1), ...F(0, t1)], i % 2 ? "x" : "v")
    c.line(...F(0, t1), ...F(128, t1), "A")
  }
  c.line(...F(64, 0), ...F(64, 1), "M"); c.line(...F(0, 0), ...F(0, 1), "9"); c.line(...F(128, 0), ...F(128, 1), "9")
  c.noise(0, 0, 194, NS_SM + 64 + NS_ST + 2, "A", 0.03, 207, "xv")
})

sheet("landmarks_nusle_most", ["ns_*"], { pad: 1 })
