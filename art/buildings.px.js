// Domy v isometrii 2:1 s dlaždicí 128 × 64, čtyřnásobek Václaváku. Sprite má počátek v nejbližším spodním rohu B
// (dole, x = 64·dpt od levého okraje). Pravá stěna (normála doprava dolů, +b) má délku w dlaždic a je to fasáda do ulice;
// levá stěna (normála doleva dolů, −a) je boční zeď: do ulice jen u rohového domu (corner), jinak slepý štít k sousedovi.
// V tomhle detailu se kreslí rámy oken, parapety, klenáky, dentily, kamenné spáry a tašky po jednotlivých bodech,
// ne po blocích; šum nikde na omítce. Poškození je vrstva: trhliny, saze pod oknem, vypadlý kus římsy, rozbité tabule.
const T = 64 // půl dlaždice: krok podél = (+64, −32), krok do hloubky = (−64, −32)

// Barevné styly omítky: [základ, světlá, tmavá].
const STYLES = {
  ochre: ["C", "c", "e"], grey: ["t", "z", "T"], pink: ["r", "r", "R"], white: ["w", "W", "v"], stone: ["p", "q", "P"],
  green: ["1", "W", "2"], salmon: ["8", "0", "r"], brown: ["3", "4", "k"], travertine: ["5", "W", "6"], cream: ["c", "W", "e"], yellow: ["y", "W", "Y"],
}

// Bod na pravé stěně: u podél (px), v výška (px) → souřadnice od B. Na levé stěně u jde do hloubky.
const R = (u, v) => [u, -u / 2 - v]
const Lp = (u, v) => [-u, -u / 2 - v]
const quadR = (u0, u1, v0, v1) => [...R(u0, v0), ...R(u1, v0), ...R(u1, v1), ...R(u0, v1)]
const quadL = (u0, u1, v0, v1) => [...Lp(u0, v0), ...Lp(u1, v0), ...Lp(u1, v1), ...Lp(u0, v1)]
const shift = (pts, ox, oy) => pts.map((p, i) => p + (i % 2 ? oy : ox))
const Rout = (u, v, p) => [u + p, -u / 2 - v + p / 2]

// Trhlina od bodu dolů po stěně: vlasová, nahoře rozevřená (tmavá), níž jen o tón tmavší než omítka. Drží směr, občas
// ho změní a pustí krátkou větev, takže žádné dvě nejsou stejné (dřív to byl pravidelný cik cak se světlou hranou).
function crack(c, pt, ox, oy, u, v, length, rng, col, len) {
  let cu = u, cv = v, drift = rng() < 0.5 ? -1 : 1
  for (let i = 0; i < length; i++) {
    if (rng() < 0.3) drift = -drift
    const nu = Math.max(2, Math.min(len - 2, cu + drift * (1 + Math.floor(rng() * 4)))), nv = cv - 4 - Math.floor(rng() * 9)
    if (nv < 6) break
    const [x0, y0] = shift(pt(cu, cv), ox, oy), [x1, y1] = shift(pt(nu, nv), ox, oy)
    c.line(x0, y0, x1, y1, i < length / 3 ? "k" : col)
    if (rng() < 0.2) { const [x2, y2] = shift(pt(Math.max(2, Math.min(len - 2, cu - drift * (4 + Math.floor(rng() * 7)))), cv - 3 - Math.floor(rng() * 6)), ox, oy); c.line(x0, y0, x2, y2, col) }
    cu = nu; cv = nv
  }
}

// Text sprejem na stěnu: písmo 3 × 5 (měřítko sc), velká písmena, diakritika z Unicode rozkladu se dokreslí nad písmeno
// (čárka, háček, kroužek). pt(u, v) je bod na stěně, řádky se zalamují podle šířky maxU, první řádek nahoře ve výšce v.
// Písmo do roviny stěny: 3 × 5 bodů, každý bod písmene je čtvereček sc × sc v rovině stěny (u podél, v nahoru), takže
// se celý nápis zkosí se stěnou jako skutečný nápis v izometrii a čte se (dřív stála písmena rovně a jen jejich pozice
// klesala po schodech). Pod písmeny je tmavý obrys o bod do všech stran, aby nápis byl čitelný i přes barevnou korekci
// kamery. F(u, v) mapuje rovinu stěny na plátno (R pro pravou stěnu, Lp pro levou), ox/oy je počátek.
const FONT35 = {
  A: "010101111101101", B: "110101110101110", C: "011100100100011", D: "110101101101110", E: "111100110100111",
  F: "111100110100100", G: "011100101101011", H: "101101111101101", I: "111010010010111", J: "001001001101010",
  K: "101101110101101", L: "100100100100111", M: "101111111101101", N: "110101101101101", O: "010101101101010",
  P: "110101110100100", Q: "010101101110011", R: "110101110101101", S: "011100010001110", T: "111010010010010",
  U: "101101101101111", V: "101101101101010", W: "101101111111101", X: "101101010101101", Y: "101101010010010",
  Z: "111001010100111", 0: "111101101101111", 1: "010110010010111", 2: "110001010100111", 3: "110001010001110",
  4: "101101111001001", 5: "111100110001110", 6: "011100111101111", 7: "111001010010010", 8: "111101111101111",
  9: "111101111001110", ".": "000000000000010", ",": "000000000010100", "!": "010010010000010", "?": "110001010000010",
  "=": "000111000111000", "-": "000000111000000", ":": "000010000010000",
}
// Diakritika nad písmenem: body ve sloupcích 0–2 nad horním řádkem (čárka, háček, kroužek).
// Svítí se v okně? Asi v jednom domě z pěti, v něm jedno až dvě okna (hash ze semínka domu, patra a polohy).
const litHash = (n) => { let x = Math.imul(n ^ 0x9e3779b9, 2654435761); x ^= x >>> 15; x = Math.imul(x, 2246822519); x ^= x >>> 13; return (x >>> 0) / 4294967296 }
const litWindow = (seed, f, u, face) => litHash(seed * 31 + 7) < 0.3 && litHash(seed * 131 + f * 17 + u * 3 + face * 1009) < 0.14
const MARKS = { "\u0301": [[1, 1], [2, 2]], "\u030c": [[0, 2], [1, 1], [2, 2]], "\u030a": [[1, 1]] }
function wallText(c, F, ox, oy, u0, v0, str, col, o = {}) {
  const sc = o.sc ?? 2, outline = o.outline === undefined ? "k" : o.outline, step = 4 * sc
  const cells = []
  let u = u0
  for (const ch of str.toUpperCase()) {
    const d = ch.normalize("NFD"), base = d[0], marks = [...d.slice(1)]
    const g = FONT35[base]
    if (g) for (let gy = 0; gy < 5; gy++) for (let gx = 0; gx < 3; gx++) if (g[gy * 3 + gx] === "1") cells.push([u + gx * sc, v0 + (4 - gy) * sc])
    marks.forEach((m) => (MARKS[m] ?? []).forEach(([gx, up]) => cells.push([u + gx * sc, v0 + (4 + up) * sc + 1])))
    u += step
  }
  const dot = (cu, cv, k, du = 0, dv = 0) => { for (let a = 0; a < sc; a++) for (let b = 0; b < sc; b++) { const [x, y] = F(cu + a + du, cv + b + dv); c.px(Math.floor(x + ox), Math.floor(y + oy), k) } }
  if (outline) cells.forEach(([cu, cv]) => [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1]].forEach(([du, dv]) => dot(cu, cv, outline, du, dv)))
  cells.forEach(([cu, cv]) => dot(cu, cv, col))
  return u - u0
}
const FONT57 = {
  A: "01110100011000111111100011000110001", B: "11110100011000111110100011000111110", C: "01110100011000010000100001000101110", D: "11110100011000110001100011000111110", E: "11111100001000011110100001000011111", F: "11111100001000011110100001000010000", G: "01110100011000010111100011000101111", H: "10001100011000111111100011000110001", I: "01110001000010000100001000010001110", J: "00111000100001000010000101001001100", K: "10001100101010011000101001001010001", L: "10000100001000010000100001000011111", M: "10001110111010110101100011000110001", N: "10001100011100110101100111000110001", O: "01110100011000110001100011000101110", P: "11110100011000111110100001000010000", Q: "01110100011000110001101011001001101", R: "11110100011000111110101001001010001", S: "01111100001000001110000010000111110", T: "11111001000010000100001000010000100", U: "10001100011000110001100011000101110", V: "10001100011000110001100010101000100", W: "10001100011000110101101011010101010", X: "10001100010101000100010101000110001", Y: "10001100010101000100001000010000100", Z: "11111000010001000100010001000011111", 0: "01110100011001110101110011000101110", 1: "00100011000010000100001000010001110", 2: "01110100010000100010001000100011111", 3: "11110000010000101110000010000111110", 4: "00010001100101010010111110001000010", 5: "11111100001111000001000011000101110", 6: "01110100001000011110100011000101110", 7: "11111000010001000100010000100001000", 8: "01110100011000101110100011000101110", 9: "01110100011000101111000010000101110", ".": "00000000000000000000000000110001100", ",": "00000000000000000000011000010001000", "!": "00100001000010000100001000000000100", "?": "01110100010000100010001000000000100", ">": "10000010000010000010001000100010000", "=": "00000000001111100000111110000000000", "-": "00000000000000011111000000000000000", ":": "00000011000110000000011000110000000",
}

// Tag sprejem na fasádu: písmo 5 × 7 v rovině stěny (svislé tahy zůstanou svislé, vodorovné jdou se stěnou), aby se dal
// přečíst i přes barevnou korekci kamery. Ruka sprejera je vidět jen trochu: písmena lehce poskakují, nápis je mírně
// nakřivo a v kurzívě, kolem tahů je řídký rozprašek a ze spodků občas steče barva. Pod písmeny je tmavý obrys do všech
// stran. Nápis se vejde do pásu vMin–vMax (px nad zemí, vMin spočítal scripts/osm.mjs nad tím, co zakrývá dům přes ulici,
// vMax je kam sprejer dosáhne); když se nevejde, smí jít výš, nejvýš do vRoof (pod hlavní římsu), až pak menší písmo.
// Diakritika: čárka, háček a kroužek nad písmenem.
const MARKS57 = { "́": [[2, 1], [3, 2]], "̌": [[1, 2], [2, 1], [3, 2]], "̊": [[2, 1], [1, 2], [3, 2], [2, 3]] }
function sprayText(c, F, ox, oy, len, vMin, vMax, str, col, seed, vRoof = vMax) {
  const rnd = c.rng(seed * 7919 + str.length * 31)
  const words = str.replace(/[„“"]/g, "").toUpperCase().split(/\s+/).filter(Boolean)
  const maxU = len - 12
  const wrap = (step) => {
    const lines = [[]]
    words.forEach((w) => { const cur = lines[lines.length - 1]; const n = cur.join(" ").length + (cur.length ? 1 : 0) + w.length; if (n * step > maxU && cur.length) lines.push([w]); else cur.push(w) })
    return lines.map((l) => l.join(" "))
  }
  // velikost a pás: písmo 2 v základním pásu, písmo 2 výš, písmo 1 (vždy se vejde, jinak se zkrátí na řádky, co se vejdou)
  let sc = 1, lines = wrap(6), lineH = 11, top = vMax
  for (const [s, hi] of [[2, vMax], [2, vRoof]]) {
    const ls = wrap(6 * s), lh = 10 * s + 2
    if (ls.length * lh <= hi - vMin && ls.every((l) => l.length * 6 * s - s <= maxU)) { sc = s; lines = ls; lineH = lh; top = hi; break }
  }
  if (sc === 1) lines = lines.slice(0, Math.max(1, Math.floor((vRoof - vMin) / lineH))), top = Math.min(vRoof, Math.max(vMax, vMin + lines.length * lineH))
  const step = 6 * sc, height = lines.length * lineH
  top = vMin + height + Math.floor(rnd() * Math.min(10, Math.max(0, top - vMin - height)))
  const slope = (rnd() - 0.5) * 0.06, lean = 0.05 + rnd() * 0.08
  const cells = [], drips = []
  lines.forEach((text, li) => {
    const wl = text.length * step - sc
    let u = 4 + Math.floor(rnd() * Math.max(1, maxU - wl))
    const base = top - (li + 1) * lineH + 2
    for (const ch of text) {
      const d = ch.normalize("NFD"), g = FONT57[d[0]]
      const v0 = base + Math.round(slope * u + (rnd() - 0.5) * sc * 0.8)
      if (g) for (let gy = 0; gy < 7; gy++) for (let gx = 0; gx < 5; gx++) if (g[gy * 5 + gx] === "1") {
        const cu = u + gx * sc + Math.round((6 - gy) * lean * sc), cv = v0 + (6 - gy) * sc
        cells.push([cu, cv])
        if (gy === 6 && rnd() < 0.1) drips.push([cu + Math.floor(rnd() * sc), cv - 1, 2 + Math.floor(rnd() * 7)])
      }
      ;[...d.slice(1)].forEach((m) => (MARKS57[m] ?? []).forEach(([gx, up]) => cells.push([u + gx * sc + Math.round(7 * lean * sc), v0 + (6 + up) * sc])))
      u += step
    }
  })
  const put = (u, v, k) => { const [x, y] = F(u, v); c.px(Math.floor(x + ox), Math.floor(y + oy), k) }
  // obrys do všech stran, pak barva (místy vybledlá), řídký rozprašek, stékance
  cells.forEach(([cu, cv]) => { for (let a = -1; a <= sc; a++) for (let b = -1; b <= sc; b++) put(cu + a, cv + b, "k") })
  drips.forEach(([u, v, n]) => { const [x, y] = F(u, v); c.vline(Math.floor(x + ox) - 1, Math.floor(y + oy), n + 1, "k"); c.vline(Math.floor(x + ox) + 1, Math.floor(y + oy), n + 1, "k") })
  cells.forEach(([cu, cv]) => { for (let a = 0; a < sc; a++) for (let b = 0; b < sc; b++) if (rnd() > 0.03) put(cu + a, cv + b, col) })
  cells.forEach(([cu, cv]) => { if (rnd() < 0.08) put(cu + Math.round((rnd() - 0.5) * (sc + 5)), cv + Math.round((rnd() - 0.5) * (sc + 5)), col) })
  drips.forEach(([u, v, n]) => { const [x, y] = F(u, v); c.vline(Math.floor(x + ox), Math.floor(y + oy), n, col) })
  // občas podtržení švihem pod posledním řádkem
  if (rnd() < 0.4) {
    const u0 = 4 + rnd() * 10, u1 = Math.min(maxU, u0 + lines.at(-1).length * step * (0.6 + rnd() * 0.4))
    const vb = top - height - 1
    for (let u = u0; u < u1; u += 0.5) { const t = (u - u0) / (u1 - u0); put(u, vb + slope * u - Math.sin(t * Math.PI) * 2 + t * 2, "k"); put(u, vb + 1 + slope * u - Math.sin(t * Math.PI) * 2 + t * 2, col) }
  }
}

/**
 * house(name, { w, dpt, floors, style, roof: "pitched" | "mansard" | "flat", corner, gable, ornament, pilasters, seed,
 *   back: fasáda odvrácená od ulice (do dvora), tag: text sprejem, tagColor, tagFace: "R" čelo / "L" bok,
 *   tagV–tagTop: pás výšek nad zemí, kde je fasáda vidět (scripts/osm.mjs), damage: 0–1,
 *   cover: krytina z ortofota ČÚZK (scripts/strechy.py): tasky, hneda, med, tmava, plech, svetla })
 */
// Krytina → [světlejší plocha, tmavší plocha a spáry, vršek ploché střechy]. Bez cover: tašky u sedlové, břidlice u mansardy.
// Světlejší a tmavší odstín krytiny pro jednotlivé tašky a pro ploché střechy (spáry lepenky, skvrny).
const COVER_LIGHT = { d: "r", r: "8", j: "2", s: "M", m: "v", w: "W" }
const FLAT_DARK = { x: "P", a: "A", M: "S", v: "x" }
const COVERS = { tasky: ["d", "D", "x"], hneda: ["r", "R", "x"], med: ["j", "Q", "x"], tmava: ["s", "S", "a"], plech: ["m", "M", "M"], svetla: ["w", "v", "v"] }
function house(name, o) {
  const w = o.w, dpt = o.dpt ?? 3, floors = o.floors ?? 5
  const gf = 64, fh = 44, H = gf + floors * fh
  const Rh = o.roof === "flat" ? 0 : o.roof === "mansard" ? 56 : 24 + Math.min(dpt, 4) * 8
  const extra = (o.gable ? 60 : 0) + 30
  const W = T * (w + dpt), Hc = 32 * (w + dpt) + H + Rh + extra + 2
  const ox = T * dpt, oy = Hc - 1
  const st = STYLES[o.style ?? "ochre"]
  const damage = Math.min(1, (o.damage ?? 0.4) + 0.35)
  const cover = COVERS[o.cover]
  const roofA = cover ? cover[0] : o.roof === "mansard" ? "s" : "d", roofB = cover ? cover[1] : o.roof === "mansard" ? "S" : "D"
  sprite(name, { w: W, h: Hc }, (c) => {
    const rng = c.rng(o.seed ?? 1)
    const lenR = T * w, lenL = T * dpt
    const faces = [[quadR, lenR, true, R], [quadL, lenL, Boolean(o.corner), Lp]]
    const blank = (map) => map === quadL && !o.corner
    const P = (map) => (map === quadR ? R : Lp)
    const paneColor = () => { const roll = rng(); return roll < 0.12 * (0.5 + damage) ? "k" : roll < 0.9 ? "n" : "L" }

    // Stěny: omítka pater, kamenný parter se spárami (vodorovné každých 16 px, svislé střídavě).
    faces.forEach(([map, len]) => {
      if (blank(map)) {
        c.poly(shift(map(0, len, 0, H), ox, oy), st[0])
        // dešťové šmouhy pod římsou a odstřik od země: jediné, co na slepém štítu je
        for (let i = 0; i < 4 + dpt; i++) { const u = 8 + Math.floor(rng() * (len - 16)); const [x, y] = shift(Lp(u, H - 14), ox, oy); c.vline(x, y, 30 + Math.floor(rng() * 60), st[2]) }
        c.poly(shift(map(0, len, 0, 6), ox, oy), st[2])
        return
      }
      c.poly(shift(map(0, len, gf, H), ox, oy), st[0])
      c.poly(shift(map(0, len, 0, gf), ox, oy), "p")
      for (let v = 16; v < gf; v += 16) c.poly(shift(map(0, len, v - 1, v), ox, oy), "P")
      for (let v = 0; v < gf; v += 16) for (let u = (v / 16) % 2 ? 16 : 32; u < len; u += 32) c.poly(shift(map(u, u + 1, v, v + 15), ox, oy), "P")
    })

    // Opadaná omítka pod okny a římsami (kreslí se před nimi): skvrna z několika překrytých ploch, v ní cihlové zdivo
    // (řádky se spárami ve společné mřížce, vazba přes půl cihly), nahoře stín od hrany omítky.
    faces.forEach(([map, len]) => {
      const n = Math.round((len / 64) * (0.6 + damage * 1.2))
      for (let i = 0; i < n; i++) {
        const u = 8 + rng() * (len - 50), v = gf + 10 + rng() * (H - gf - 60), w2 = 16 + rng() * 26, h2 = 12 + rng() * 22
        const parts = [[u, v, w2, h2]]
        for (let k = 1 + Math.floor(rng() * 4); k > 0; k--) parts.push([u + (rng() - 0.35) * w2, v + (rng() - 0.35) * h2, w2 * (0.3 + rng() * 0.5), h2 * (0.3 + rng() * 0.6)])
        const boxes = parts.map(([pu, pv, pw, ph]) => { const a0 = Math.max(2, Math.round(pu)), b0 = Math.max(gf + 4, Math.round(pv)); return [a0, Math.min(len - 2, Math.round(pu + pw)), b0, Math.min(H - 22, Math.round(pv + ph))] }).filter(([a0, a1, b0, b1]) => a1 - a0 > 3 && b1 - b0 > 3)
        boxes.forEach(([a0, a1, b0, b1]) => c.poly(shift(map(a0 - 1, a1 + 1, b0 - 1, b1 + 2), ox, oy), st[2]))
        boxes.forEach(([a0, a1, b0, b1]) => {
          const patch = shift(map(a0, a1, b0, b1), ox, oy)
          c.poly(patch, "R")
          c.clip(patch, () => { for (let vv = Math.floor(b0 / 4) * 4; vv < b1; vv += 4) { c.poly(shift(map(a0 - 2, a1 + 2, vv, vv + 1), ox, oy), "D"); for (let uu = Math.floor(a0 / 10) * 10 + ((vv / 4) % 2) * 5; uu < a1; uu += 10) c.poly(shift(map(uu, uu + 1, vv, vv + 4), ox, oy), "D") } })
        })
      }
    })

    const burnt = []
    // Patra: kordonová římsa, okna s rámem, parapetem a klenákem, secesní girlandy, pilastry na krajích.
    faces.forEach(([map, len, street, pt]) => {
      if (blank(map)) return
      const step = map === quadR ? 40 : 48, ww = 20, wh = 28, u0 = map === quadR ? 14 : 18
      for (let f = 0; f < floors; f++) {
        const v = gf + f * fh
        c.poly(shift(map(0, len, v - 3, v), ox, oy), st[2])
        c.poly(shift(map(0, len, v, v + 1), ox, oy), st[1])
        for (let u = u0; u + ww <= len - 8; u += step) {
          const glass = paneColor()
          // špaleta a rám
          c.poly(shift(map(u - 2, u + ww + 2, v + 7, v + wh + 10), ox, oy), st[2])
          c.poly(shift(map(u - 1, u + ww + 1, v + 8, v + wh + 9), ox, oy), st[1])
          c.poly(shift(map(u + 1, u + ww - 1, v + 10, v + wh + 7), ox, oy), glass)
          // dva křídla a poutec
          c.poly(shift(map(u + ww / 2 - 1, u + ww / 2 + 1, v + 10, v + wh + 7), ox, oy), st[1])
          c.poly(shift(map(u + 1, u + ww - 1, v + wh - 2, v + wh), ox, oy), st[1])
          if (glass === "L") c.poly(shift(map(u + 2, u + 5, v + 11, v + wh + 6), ox, oy), "l")
          // svíčka za oknem: v pár domech někdo bydlí (vlastní hash, ať se zbytek domu nezmění)
          if (glass !== "k" && litWindow(o.seed ?? 1, f, u, map === quadR ? 1 : 2)) {
            c.poly(shift(map(u + 1, u + ww - 1, v + 10, v + wh + 7), ox, oy), "O")
            c.poly(shift(map(u + 1, u + ww - 1, v + 10, v + 24), ox, oy), "o"); c.poly(shift(map(u + 5, u + ww - 5, v + 10, v + 18), ox, oy), "y")
            c.poly(shift(map(u + ww / 2 + 3, u + ww / 2 + 5, v + 10, v + 14), ox, oy), "f")
            c.poly(shift(map(u + ww / 2 - 1, u + ww / 2 + 1, v + 10, v + wh + 7), ox, oy), st[1])
            c.poly(shift(map(u + 1, u + ww - 1, v + wh - 2, v + wh), ox, oy), st[1])
          }
          if (glass === "k" && rng() < 0.4) burnt.push([map, u, v])
          else if (glass === "k") {
            if (rng() < 0.6) { // zatlučené prkny
              c.poly(shift(map(u, u + ww, v + 14, v + 19), ox, oy), "h"); c.poly(shift(map(u, u + ww, v + 26, v + 31), ox, oy), "H")
              const [x0, y0] = shift(pt(u + 1, v + 12), ox, oy), [x1, y1] = shift(pt(u + ww - 1, v + 34), ox, oy); c.line(x0, y0, x1, y1, "h", 2)
            } else { const [x, y] = shift(pt(u + 6, v + 24), ox, oy); c.line(x, y, x + 8, y - 10, "w"); c.line(x, y, x - 2, y + 9, "w") }
          }
          // parapet: tmavý s světlou hranou; klenák a nadokenní římsa
          c.poly(shift(map(u - 3, u + ww + 3, v + 4, v + 7), ox, oy), st[2])
          c.poly(shift(map(u - 3, u + ww + 3, v + 7, v + 8), ox, oy), "W")
          c.poly(shift(map(u - 3, u + ww + 3, v + wh + 10, v + wh + 13), ox, oy), st[1])
          c.poly(shift(map(u + ww / 2 - 2, u + ww / 2 + 2, v + wh + 9, v + wh + 16), ox, oy), "W")
          // saze pod oknem po požáru (poškození)
          if (rng() < damage * 0.25) c.poly(shift(map(u - 4, u + ww + 6, v + 1, v + 4), ox, oy), "x")
          // girlanda mezi okny v prvním patře
          if (o.ornament && f === 1 && u + step + ww <= len - 8) {
            c.poly(shift(map(u + ww + 5, u + step - 5, v + 22, v + 25), ox, oy), st[1])
            for (let d = u + ww + 7; d < u + step - 6; d += 6) c.poly(shift(map(d, d + 2, v + 20, v + 22), ox, oy), "W")
          }
        }
        if (o.pilasters) { c.poly(shift(map(2, 8, v, v + fh - 3), ox, oy), st[1]); c.poly(shift(map(len - 8, len - 2, v, v + fh - 3), ox, oy), st[1]) }
      }
    })

    // Saze nad vyhořelými okny: jazyk kouře po fasádě nahoru, dole hustý, výš řídne a zužuje se (přes okno o patro výš).
    burnt.forEach(([map, u, v], i) => {
      ;[[-3, 23, 36, 44, 0.8], [-2, 23, 44, 54, 0.55], [1, 22, 54, 66, 0.3], [5, 19, 66, 78, 0.12]].forEach(([a0, a1, b0, b1, dens], j) => {
        if (v + b0 >= H - 14) return
        c.clip(shift(map(u + a0, u + a1, v + b0, Math.min(H - 14, v + b1)), ox, oy), () => c.noise(0, 0, W, Hc, "A", dens, 311 + i * 7 + j, "*"))
      })
    })

    // Parter do ulice: výlohy s dřevěným rámem a odrazem nebo stažená roleta, vývěsní štít, portál s obloukem a dveřmi.
    const shopfronts = (map, len) => {
      const pt = P(map)
      const du = Math.floor(len / 2) - 20
      for (let u = 12; u + 56 <= len - 12; u += 72) {
        if (u < du + 48 && u + 56 > du - 8) continue
        const roll = rng()
        c.poly(shift(map(u - 3, u + 59, 12, 58), ox, oy), "H")
        if (roll < 0.35) {
          c.poly(shift(map(u, u + 56, 15, 55), ox, oy), "M")
          for (let v = 17; v < 55; v += 4) c.poly(shift(map(u, u + 56, v, v + 1), ox, oy), "S")
        } else {
          c.poly(shift(map(u, u + 56, 15, 55), ox, oy), roll < 0.5 ? "k" : "n")
          c.poly(shift(map(u + 3, u + 9, 18, 52), ox, oy), roll < 0.5 ? "n" : "L")
          if (roll < 0.5) { const [x, y] = shift(pt(u + 30, 40), ox, oy); c.line(x - 10, y + 4, x + 12, y - 14, "W"); c.line(x - 10, y + 4, x - 4, y + 10, "W") }
          // mříž přes výlohu (svislé pruty a dva pásy), u některých vylomená
          else if (roll < 0.72) {
            const gone = rng() < 0.4 ? 8 + Math.floor(rng() * 32) : -99
            for (let g = u + 4; g < u + 56; g += 6) if (Math.abs(g - u - gone) > 9) c.poly(shift(map(g, g + 1, 15, 55), ox, oy), "M")
            c.poly(shift(map(u, u + 56, 26, 27), ox, oy), "M"); c.poly(shift(map(u, u + 56, 44, 45), ox, oy), "M")
          }
        }
        c.poly(shift(map(u - 3, u + 59, 58, 61), ox, oy), "P")
        c.poly(shift(map(u - 3, u + 59, 2, 12), ox, oy), "P")
      }
      // portál: kamenné ostění, půlkruhový oblouk, dvoukřídlé dveře s výplněmi
      c.poly(shift(map(du - 5, du + 45, 0, 50), ox, oy), st[1])
      c.poly(shift([...pt(du - 5, 50), ...pt(du + 45, 50), ...pt(du + 40, 60), ...pt(du + 30, 66), ...pt(du + 20, 67), ...pt(du + 10, 66), ...pt(du, 60)], ox, oy), st[1])
      c.poly(shift(map(du, du + 40, 0, 46), ox, oy), "k")
      c.poly(shift([...pt(du, 46), ...pt(du + 40, 46), ...pt(du + 36, 55), ...pt(du + 28, 61), ...pt(du + 20, 62), ...pt(du + 12, 61), ...pt(du + 4, 55)], ox, oy), "k")
      c.poly(shift(map(du + 2, du + 19, 2, 44), ox, oy), "H"); c.poly(shift(map(du + 21, du + 38, 2, 44), ox, oy), "H")
      ;[du + 4, du + 23].forEach((p) => { c.poly(shift(map(p, p + 13, 6, 20), ox, oy), "h"); c.poly(shift(map(p, p + 13, 24, 40), ox, oy), "h") })
      c.poly(shift(map(du + 17, du + 19, 20, 24), ox, oy), "Y")
      c.poly(shift(map(du + 18, du + 22, 58, 64), ox, oy), "W")
    }
    if (o.back) {
      // zadní trakt do dvora: vrata a malá okna v parteru místo výloh
      c.poly(shift(quadR(16, 56, 0, 46), ox, oy), "H"); c.poly(shift(quadR(20, 34, 4, 40), ox, oy), "h"); c.poly(shift(quadR(38, 52, 4, 40), ox, oy), "h")
      for (let u = 72; u + 16 <= lenR - 12; u += 48) { c.poly(shift(quadR(u - 2, u + 18, 18, 44), ox, oy), st[2]); c.poly(shift(quadR(u, u + 16, 20, 42), ox, oy), paneColor()) }
    } else shopfronts(quadR, lenR)
    if (o.corner && !o.back) shopfronts(quadL, lenL)

    // Špína po pádu (Fallout): odstřik od země, šmouhy pod římsou a parapety, rezavé stékance; plevel na římse.
    faces.forEach(([map, len, street, pt]) => {
      c.clip(shift(map(0, len, 0, 22), ox, oy), () => c.noise(0, 0, W, Hc, "x", 0.3, 71, "*"))
      c.clip(shift(map(0, len, 0, 8), ox, oy), () => c.noise(0, 0, W, Hc, "P", 0.5, 73, "*"))
      for (let i = 0; i < len / 9; i++) {
        const u = 3 + Math.floor(rng() * (len - 6)), from = H - 16 - Math.floor(rng() * 30), n = 16 + Math.floor(rng() * (H * 0.5))
        const [x, y] = shift(pt(u, from), ox, oy); c.vline(x, y, n, rng() < 0.3 ? "U" : st[2])
      }
      if (!blank(map)) for (let u = 0; u < len; u += 3) if (rng() < 0.45) { const [x, y] = shift(pt(u, H), ox, oy); c.vline(x, y - 4, 4 + Math.floor(rng() * 3), rng() < 0.5 ? "G" : "Q") }
    })
    // Tag sprejem na parteru fasády (seznam v docs/todo.md, přiřazuje scripts/osm.mjs).
    if (o.tag && !o.back) {
      // na boku jde u doleva (Lp), nápis se proto čte od vzdáleného konce, jinak by byl zrcadlově
      const [F, len] = o.tagFace === "L" ? [(u, v) => Lp(lenL - u, v), lenL] : [R, lenR]
      sprayText(c, F, ox, oy, len, o.tagV ?? 8, Math.min(o.tagTop ?? 128, H - 20), o.tag, o.tagColor ?? "E", o.seed ?? 1, Math.min(H - 24, 156))
    }
    // Hlavní římsa s dentily; u poškozeného domu chybí kus.
    faces.forEach(([map, len]) => {
      if (blank(map)) { c.poly(shift(map(0, len, H - 2, H), ox, oy), st[2]); return }
      c.poly(shift(map(0, len, H - 14, H), ox, oy), st[1])
      c.poly(shift(map(0, len, H - 14, H - 13), ox, oy), st[2])
      for (let u = 2; u + 6 < len; u += 12) c.poly(shift(map(u, u + 6, H - 20, H - 14), ox, oy), st[2])
      c.poly(shift(map(0, len, H - 2, H), ox, oy), "W")
      if (damage > 0.3 && map === quadR) { const gu = 20 + Math.floor(rng() * (len - 60)); c.poly(shift(map(gu, gu + 24, H - 20, H), ox, oy), st[0]); c.poly(shift(map(gu, gu + 24, H - 20, H - 17), ox, oy), st[2]) }
    })
    // trhliny od římsy dolů
    // trhliny: od římsy dolů a od parapetů, na čele i na boku
    faces.forEach(([map, len, street, pt]) => {
      for (let i = Math.round(damage * (len / 64) * (blank(map) ? 0.6 : 1.1)); i > 0; i--) {
        const fromSill = !blank(map) && rng() < 0.45
        crack(c, pt, ox, oy, 6 + Math.floor(rng() * (len - 12)), fromSill ? gf + Math.floor(rng() * floors) * fh + 4 : H - 20, 4 + Math.floor(rng() * 9), rng, st[2], len)
      }
    })

    // Střecha: mansarda (strmý spodní díl z břidlice s vikýři, mírný horní), sedlová s taškami, nebo plochá.
    const top = (u) => R(u, H), topL = (u) => Lp(u, H)
    const far = [lenR - lenL, -lenR / 2 - lenL / 2 - H]
    const ridge0 = [-lenL / 2, -lenL / 4 - H - Rh], ridge1 = [lenR - lenL / 2, -lenR / 2 - lenL / 4 - H - Rh]
    // Rovina střechy do ulice: u podél okapu, v svisle nad ním; řady krytiny jdou i do levého klínu pod hřebenem (u < 0).
    const uMin = -Math.ceil(lenL / 2 / 12) * 12, vMax = Rh + lenL / 2
    const S = (u, v) => [ox + u, oy - H - u / 2 - v]
    const cell = (u, v, cw, ch) => [...S(u, v), ...S(u + cw, v), ...S(u + cw, v + ch), ...S(u, v + ch)]
    const slopeLines = (poly, col, gap, from = 2) => c.clip(shift(poly, ox, oy), () => { for (let v = from; v < vMax; v += gap) c.line(...S(uMin, v), ...S(lenR, v), col) })
    // Rok bez údržby na šikmé střeše: tašky jiného odstínu, šmouhy od hřebene, mech u okapu a díry po spadlých taškách,
    // ve kterých jsou vidět latě a krokve (u hodně poškozeného domu propadlý kus střechy).
    const weather = (poly, cw, ch, dark, light) => c.clip(shift(poly, ox, oy), () => {
      for (let v = 0; v < vMax; v += ch) for (let u = uMin; u < lenR; u += cw) { const r = rng(); if (r < 0.09) c.poly(cell(u + 1, v + 1, cw - 1, ch - 1), dark); else if (r < 0.15) c.poly(cell(u + 1, v + 1, cw - 1, ch - 1), light) }
      for (let i = 0; i < lenR / 18; i++) { const [x, y] = S(Math.floor(uMin / 2 + rng() * (lenR - uMin / 2)), Math.floor(rng() * vMax)); c.vline(x, y, 5 + Math.floor(rng() * 16), dark) }
      c.clip(cell(uMin, 0, lenR - uMin, 5), () => c.noise(0, 0, W, Hc, "G", 0.45, 91, "*"))
      c.clip(cell(uMin, 5, lenR - uMin, 6), () => c.noise(0, 0, W, Hc, "G", 0.12, 93, "*"))
      const cols = Math.floor(lenR / cw), rows = Math.max(2, Math.floor((Rh + lenL / 4) / ch) - 1)
      for (let i = Math.round(damage * 2 + rng() * 1.6 - 1.2); i > 0; i--) {
        let cu = Math.floor(rng() * cols), cv = 1 + Math.floor(rng() * (rows - 1))
        const cells = new Set()
        for (let k = damage > 0.8 && rng() < 0.5 ? 14 + Math.floor(rng() * 14) : 2 + Math.floor(rng() * 6); k > 0; k--) {
          cells.add(`${cu},${cv}`)
          const r = rng(); cu += r < 0.3 ? 1 : r < 0.6 ? -1 : 0; cv += r >= 0.6 ? (r < 0.8 ? 1 : -1) : 0
          cu = Math.max(0, Math.min(cols - 1, cu)); cv = Math.max(1, Math.min(rows - 1, cv))
        }
        cells.forEach((key) => {
          const [gu, gv] = key.split(",").map(Number), hole = cell(gu * cw, gv * ch, cw, ch)
          c.poly(hole, "k")
          c.clip(hole, () => {
            for (let r0 = -lenL; r0 < lenR + lenL; r0 += 18) c.line(...S(r0, 0), ...S(r0 - lenL / 2, vMax), "H")
            c.line(...S(gu * cw, gv * ch + ch / 2), ...S(gu * cw + cw, gv * ch + ch / 2), "h")
          })
        })
      }
    })
    if (Rh === 0) {
      // plochá střecha: lepenka v pásech se spárami, štěrk, tmavé skvrny po vodě, větrací hlavice, u poničeného domu díra
      const base = cover ? cover[2] : "x", dark = FLAT_DARK[base] ?? "P"
      const flat = shift([...R(0, H), ...R(lenR, H), ...far, ...Lp(lenL, H)], ox, oy)
      const Tp = (u, d) => [ox + u - d, oy - H - u / 2 - d / 2]
      const blob = (u, d, ru, rd, wob = 0.3) => Array.from({ length: 10 }, (_, k) => { const r = 1 - wob + rng() * wob * 2; return Tp(u + Math.cos(k * Math.PI / 5) * ru * r, d + Math.sin(k * Math.PI / 5) * rd * r) }).flat()
      c.poly(flat, base)
      c.clip(flat, () => {
        c.noise(0, 0, W, Hc, dark, 0.07, 57, "*")
        for (let d = 20 + Math.floor(rng() * 16); d < lenL - 6; d += 36) c.line(...Tp(0, d), ...Tp(lenR, d), dark)
        for (let i = Math.round(lenR * lenL / 9000 + rng()); i > 0; i--) {
          const stain = blob(14 + rng() * (lenR - 28), 14 + rng() * (lenL - 28), 10 + rng() * 22, 8 + rng() * 16)
          c.clip(stain, () => c.noise(0, 0, W, Hc, dark, 0.55, 59 + i, "*"))
        }
        if (damage > 0.7 && lenR >= 128 && lenL >= 128 && rng() < 0.6) {
          const hu = 40 + rng() * (lenR - 80), hd = 40 + rng() * (lenL - 80), hole = blob(hu, hd, 18 + rng() * 14, 14 + rng() * 12, 0.4)
          c.poly(blob(hu, hd, 34, 28, 0.2), dark); c.poly(hole, "k")
          c.clip(hole, () => { for (let r0 = -8; r0 < 40; r0 += 9) c.line(...Tp(hu - 40, hd - 30 + r0 * 2), ...Tp(hu + 40, hd - 30 + r0 * 2), "S") })
        }
      })
      for (let i = lenR >= 128 ? 1 + Math.floor(rng() * 2) : 0; i > 0; i--) {
        const [x, y] = Tp(20 + Math.floor(rng() * (lenR - 40)), 16 + Math.floor(rng() * Math.max(1, lenL - 32)))
        c.rect(x - 5, y - 11, 10, 11, "M"); c.rect(x - 5, y - 11, 3, 11, "m"); c.rect(x - 7, y - 14, 14, 3, "S"); c.rect(x - 7, y - 14, 14, 1, "m")
      }
      c.poly(shift([...top(0), ...top(lenR), ...R(lenR, H + 10), ...R(0, H + 10)], ox, oy), st[1])
      c.poly(shift([...topL(0), ...topL(lenL), ...Lp(lenL, H + 10), ...Lp(0, H + 10)], ox, oy), st[2])
    } else if (o.roof === "mansard") {
      const k = 32
      const kink0 = [-k / 2, -k / 4 - H - Rh + 16], kink1 = [lenR - k / 2, -lenR / 2 - k / 4 - H - Rh + 16]
      const lower = [...top(0), ...top(lenR), ...kink1, ...kink0]
      c.poly(shift(lower, ox, oy), roofB)
      c.poly(shift([...kink0, ...kink1, ...ridge1, ...ridge0], ox, oy), roofA)
      c.poly(shift([...ridge0, ...ridge1, ...far, ...topL(lenL)], ox, oy), roofB)
      // břidlice: řady každých 6 px, svislé spáry střídavě
      slopeLines(lower, roofA, 6)
      c.clip(shift(lower, ox, oy), () => { for (let u = -20; u < lenR; u += 10) for (let v = 2; v < Rh; v += 12) { const x = ox + u + ((v / 12) % 2 ? 5 : 0); c.vline(x, oy - H - u / 2 - v - 6, 6, roofA) } })
      slopeLines([...kink0, ...kink1, ...ridge1, ...ridge0], roofB, 10, 6)
      weather([...top(0), ...top(lenR), ...kink1, ...ridge1, ...ridge0, ...kink0], 10, 6, roofB, COVER_LIGHT[roofA] ?? roofA)
      c.poly(shift([...topL(0), ...topL(lenL), ...ridge0, ...kink0], ox, oy), roofB)
      c.line(ox + kink0[0], oy + kink0[1], ox + kink1[0], oy + kink1[1], "M")
      c.line(ox + ridge0[0], oy + ridge0[1], ox + ridge1[0], oy + ridge1[1], "W")
      // vikýře: skříň s oknem a stříškou
      for (let u = 28; u + 24 < lenR - 16; u += 80) {
        c.poly(shift([...R(u, H + 2), ...R(u + 24, H + 2), ...R(u + 24, H + 34), ...R(u, H + 34)], ox, oy), st[0])
        c.poly(shift([...R(u + 3, H + 6), ...R(u + 21, H + 6), ...R(u + 21, H + 30), ...R(u + 3, H + 30)], ox, oy), st[1])
        c.poly(shift([...R(u + 5, H + 8), ...R(u + 19, H + 8), ...R(u + 19, H + 28), ...R(u + 5, H + 28)], ox, oy), paneColor())
        c.poly(shift([...R(u + 11, H + 8), ...R(u + 13, H + 8), ...R(u + 13, H + 28), ...R(u + 11, H + 28)], ox, oy), st[1])
        c.poly(shift([...R(u - 3, H + 34), ...R(u + 27, H + 34), ...R(u + 12, H + 46)], ox, oy), roofA)
        c.poly(shift([...R(u - 3, H + 34), ...R(u + 27, H + 34), ...R(u + 27, H + 36), ...R(u - 3, H + 36)], ox, oy), "W")
      }
    } else {
      const slope = [...top(0), ...top(lenR), ...ridge1, ...ridge0]
      c.poly(shift(slope, ox, oy), roofA)
      c.poly(shift([...ridge0, ...ridge1, ...far, ...topL(lenL)], ox, oy), roofB)
      // tašky: řady každých 8 px, svislé spáry po 12 střídavě
      slopeLines(slope, roofB, 8)
      c.clip(shift(slope, ox, oy), () => { for (let u = uMin; u < lenR; u += 12) for (let v = 2; v < vMax; v += 16) { const x = ox + u + ((v / 16) % 2 ? 6 : 0); c.vline(x, oy - H - u / 2 - v - 8, 8, roofB) } })
      weather(slope, 12, 8, roofB, COVER_LIGHT[roofA] ?? roofA)
      c.line(ox + ridge0[0], oy + ridge0[1], ox + ridge1[0], oy + ridge1[1], "W")
      c.line(ox, oy - H - 1, ox + lenR, oy - H - lenR / 2 - 1, "W")
      c.poly(shift([...topL(0), ...topL(lenL), ...ridge0], ox, oy), st[2])
      // vikýře menší
      for (let u = 40; u + 20 < lenR - 24; u += 96) {
        c.poly(shift([...R(u, H + 4), ...R(u + 20, H + 4), ...R(u + 20, H + 28), ...R(u, H + 28)], ox, oy), st[0])
        c.poly(shift([...R(u + 4, H + 8), ...R(u + 16, H + 8), ...R(u + 16, H + 24), ...R(u + 4, H + 24)], ox, oy), paneColor())
        c.poly(shift([...R(u - 3, H + 28), ...R(u + 23, H + 28), ...R(u + 10, H + 40)], ox, oy), roofB)
      }
    }
    // komíny na hřebeni
    if (Rh > 0) for (let i = 0; i < Math.max(1, Math.floor(w / 2) + 1); i++) {
      const u = 36 + i * 120
      if (u > lenR - 24) break
      const x = ox + ridge0[0] + u, y = oy + ridge0[1] - u / 2
      c.rect(x - 6, y - 26, 14, 28, "R"); c.rect(x - 6, y - 28, 14, 2, "W"); c.rect(x - 4, y - 26, 2, 26, "r"); c.rect(x + 6, y - 26, 2, 26, "D")
    }
    // secesní štít nad středem fasády: oblouk se zlacenou soškou a oválným oknem
    if (o.gable && !o.back) {
      const gu = Math.floor(lenR / 2) - 40
      c.poly(shift([...R(gu, H), ...R(gu + 80, H), ...R(gu + 64, H + 32), ...R(gu + 40, H + 48), ...R(gu + 16, H + 32)], ox, oy), st[0])
      c.poly(shift([...R(gu + 3, H), ...R(gu + 77, H), ...R(gu + 62, H + 29), ...R(gu + 40, H + 44), ...R(gu + 18, H + 29)], ox, oy), st[1])
      c.poly(shift([...R(gu + 30, H + 8), ...R(gu + 50, H + 8), ...R(gu + 52, H + 16), ...R(gu + 50, H + 24), ...R(gu + 30, H + 24), ...R(gu + 28, H + 16)], ox, oy), "n")
      c.poly(shift([...R(gu + 32, H + 10), ...R(gu + 36, H + 10), ...R(gu + 36, H + 22), ...R(gu + 32, H + 22)], ox, oy), "L")
      const [sx, sy] = shift(R(gu + 40, H + 48), ox, oy)
      c.rect(sx - 4, sy - 16, 8, 16, "Y"); c.rect(sx - 2, sy - 20, 4, 4, "y"); c.rect(sx - 6, sy - 2, 12, 2, "O")
    }
  }, glow("f", { r: 6, strength: 0.4 }))
}

// Zkušební domy k ověření rozlišení: rohový secesní činžák s mansardou, sousední dům se slepým štítem a sedlovou střechou.
house("h_test_corner", { w: 3, dpt: 3, floors: 5, style: "ochre", roof: "mansard", corner: true, gable: true, ornament: true, pilasters: true, seed: 3, damage: 0.5 })
house("h_test_next", { w: 2, dpt: 3, floors: 4, style: "green", roof: "pitched", seed: 5, damage: 0.3 })
house("h_test_far", { w: 3, dpt: 3, floors: 4, style: "salmon", roof: "pitched", ornament: true, seed: 8, damage: 0.6 })
house("h_test_front", { w: 3, dpt: 3, floors: 5, style: "grey", roof: "mansard", corner: true, seed: 11, damage: 0.4 })
