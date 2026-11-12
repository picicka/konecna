// Svah pod Hradem: díly po jedné dlaždici, ze kterých WorldScene.buildSlope skládá hranu hradního ostrohu a stráň
// pod ní (dlaždice k z data/hrad.json, podle terénu z laseru ČÚZK). Zem svahu hra kreslí rovně jako suť, hloubku dělají
// stěny, které visí od hrany dolů: nahoře rozpadlá opěrná zeď hradeb (okrová omítka opadaná na lomový kámen), pod ní
// skála opuky s vrstvami. Uvnitř svahu jsou nižší terasy zahrad (po 6 m spádu), zbořené na půl. Hrany odvrácené od
// diváka (Jelení příkop za Hradem) mají jen nízkou rozbitou zídku. Na sutí leží balvany, kvádry a kusy balustrády.
// Geometrie jako u nábřeží Karlova mostu (art/most-oblouky.px.js): díl má počátek ve spodním rohu dlaždice,
// p(u, d, h) z mstKit, u podél stěny (64 bodů na dlaždici), h výška nad hranou. Světlo zleva: líc k −a je světlý.

const SV_D = 150            // hrana ostrohu: zeď a skála pod ní
const SV_WALL = 74          // z toho opěrná zeď hradeb
const SV_T = 54             // terasa uvnitř svahu

// Lomové zdivo: nepravidelné kameny po řadách, spáry tmavé, sem tam světlejší kámen.
function svRubble(c, F, u0, u1, v0, v1, rng, base, joint, light) {
  c.poly([...F(u0, v0), ...F(u1, v0), ...F(u1, v1), ...F(u0, v1)], base)
  for (let v = v0, row = 0; v < v1; row++) {
    const h = 5 + Math.floor(rng() * 4), vt = Math.min(v1, v + h)
    c.line(...F(u0, vt), ...F(u1, vt), joint)
    for (let u = u0 + rng() * 8; u < u1; u += 7 + rng() * 9) {
      c.line(...F(u, v), ...F(u, vt), joint)
      if (rng() < 0.12) { const w = 4 + rng() * 4; c.poly([...F(u + 1, v + 1), ...F(Math.min(u1, u + w), v + 1), ...F(Math.min(u1, u + w), vt - 1), ...F(u + 1, vt - 1)], light) }
    }
    v = vt
  }
}

// Skála (opuka): tmavé vrstvy mírně ukloněné, světlé hrany lavic, praskliny svisle.
function svRock(c, F, u0, u1, v0, v1, rng, base, dark, light) {
  c.poly([...F(u0, v0), ...F(u1, v0), ...F(u1, v1), ...F(u0, v1)], base)
  const tilt = (rng() - 0.5) * 0.2
  for (let v = v0 + 4 + rng() * 6; v < v1 - 2; v += 6 + rng() * 9) {
    for (let u = u0; u < u1; u += 1) {
      const vv = v + (u - u0) * tilt + Math.sin(u * 0.3 + v) * 0.8
      if (vv <= v0 || vv >= v1) continue
      const [x, y] = F(u, vv)
      c.px(Math.round(x), Math.round(y), dark)
      if (rng() < 0.55) { const [x2, y2] = F(u, vv + 1); c.px(Math.round(x2), Math.round(y2), light) }
    }
  }
  for (let i = 0; i < (u1 - u0) / 9; i++) {
    let u = u0 + rng() * (u1 - u0), v = v1 - rng() * 10
    for (let s = 0; s < 6 + rng() * 14; s++) { const [x, y] = F(u, v); c.px(Math.round(x), Math.round(y), "k"); v -= 1.5; u += (rng() - 0.5) * 1.6 }
  }
}

// Kužel suti pod stěnou: vyčnívá k divákovi pod spodní hranou (v = vb), kameny se světlým vrškem.
// G(u, out, v): bod na stěně posunutý o `out` ven ze stěny (k divákovi).
function svSpill(c, G, u0, u1, vb, rng, n = 8) {
  const q = []
  for (let u = u0; u <= u1; u += 4) q.push(...G(u, 0, vb + 2 + rng() * 6))
  for (let u = u1; u >= u0; u -= 4) q.push(...G(u, 6 + rng() * 10, vb))
  c.poly(q, "x")
  for (let i = 0; i < n; i++) {
    const u = u0 + rng() * (u1 - u0), [x, y] = G(u, rng() * 12, vb + 2), r = 1 + Math.floor(rng() * 3)
    c.rect(Math.round(x) - r, Math.round(y) - r, r * 2 + 1, r + 1, rng() < 0.5 ? "v" : "P")
    c.rect(Math.round(x) - r, Math.round(y) - r - 1, r * 2 + 1, 1, "w")
    c.rect(Math.round(x) - r, Math.round(y) + 1, r * 2 + 1, 1, "k")
  }
}

// Hrana ostrohu (zeď hradeb nad skálou), nebo terasa uvnitř svahu. side 'b' = stěna k +b, 'a' = stěna k −a.
function svWall(name, side, kind, seed = 1) {
  const D = kind === 'edge' ? SV_D : SV_T
  const W = 104, H = 40 + D + 34, oy = 40
  const ox = side === 'b' ? 8 : 80
  sprite(name, { w: W, h: H }, (c) => {
    const rng = c.rng(seed)
    const K = mstKit(c, ox, oy, rng)
    const { p } = K
    const F = side === 'b' ? (u, v) => p(u, 0, v) : (u, v) => p(0, u, v)
    const lit = side === 'a'
    const plaster = lit ? "C" : "e", plasterD = lit ? "e" : "3"
    const stone = lit ? "p" : "P", joint = lit ? "P" : "3", light = lit ? "q" : "p"
    const rockB = lit ? "4" : "3", rockD = lit ? "3" : "9", rockL = lit ? "C" : "4"
    const wallH = kind === 'edge' ? SV_WALL - Math.floor(rng() * 14) : D
    // horní hrana zdi je místy vylomená (zub dolů), u terasy víc
    const top = []
    for (let u = 0; u <= 64; u += 4) top.push(u === 0 || u === 64 ? 0 : -Math.max(0, (rng() - (kind === 'edge' ? 0.75 : 0.45)) * 28))
    const topAt = (u) => { const i = Math.min(top.length - 2, Math.floor(u / 4)), t = u / 4 - i; return top[i] * (1 - t) + top[i + 1] * t }
    if (kind === 'edge') svRock(c, F, 0, 64, -D, -wallH, rng, rockB, rockD, rockL)
    // zeď: lomový kámen, přes něj zbytky omítky
    svRubble(c, F, 0, 64, -wallH, 0, rng, stone, joint, light)
    for (let i = 0; i < 3; i++) {
      const u0 = rng() * 50, u1 = Math.min(64, u0 + 10 + rng() * 26), v0 = -wallH + 6 + rng() * (wallH * 0.4), v1 = Math.min(-3, v0 + 10 + rng() * (wallH * 0.5))
      const q = [...F(u0, v1)]
      for (let u = u0; u <= u1; u += 3) q.push(...F(u, v1 - rng() * 3))
      for (let u = u1; u >= u0; u -= 3) q.push(...F(u, v0 + rng() * 5))
      c.poly(q, plaster)
      for (let u = u0 + 2; u < u1; u += 5) { const [x, y] = F(u, v0 + 1); c.px(Math.round(x), Math.round(y), plasterD) }
    }
    // vylomené zuby nahoře: tmavá díra ve zdi
    for (let u = 0; u < 64; u++) {
      const d = topAt(u)
      if (d < -1) { const [x, y] = F(u, 0); c.vline(Math.round(x), Math.round(y), Math.round(-d), "A"); const [x2, y2] = F(u, d); c.px(Math.round(x2), Math.round(y2), "k") }
    }
    // krycí deska (jen u hrany) a plevel na ní
    if (kind === 'edge') for (let u = 0; u < 64; u += 1) if (topAt(u) > -1) { const [x, y] = F(u, -1); c.px(Math.round(x), Math.round(y), lit ? "q" : "p"); c.px(Math.round(x), Math.round(y) + 1, "k") }
    for (let i = 0; i < 5; i++) { const u = rng() * 64, [x, y] = F(u, topAt(u)); c.vline(Math.round(x), Math.round(y) - 2 - Math.floor(rng() * 3), 3, rng() < 0.5 ? "g" : "G") }
    // stékance a saze
    for (let i = 0; i < 6; i++) { const u = rng() * 64, [x, y] = F(u, topAt(u) - 2); c.vline(Math.round(x), Math.round(y), 6 + Math.floor(rng() * (wallH * 0.7)), rng() < 0.3 ? "U" : "k") }
    // trhlina přes zeď
    let u = 10 + rng() * 44, v = -2
    for (let s = 0; s < wallH; s += 2) { const [x, y] = F(u, v); c.px(Math.round(x), Math.round(y), "k"); v -= 2; u += (rng() - 0.5) * 3; if (u < 1 || u > 63) break }
    // keř uchycený ve skále
    if (kind === 'edge' && rng() < 0.6) { const [x, y] = F(8 + rng() * 48, -wallH - 8 - rng() * 30); c.circ(Math.round(x), Math.round(y), 4, "G"); c.circ(Math.round(x) - 1, Math.round(y) - 1, 2, "g") }
    svSpill(c, side === 'b' ? (u, o, v) => p(u, -o, v) : (u, o, v) => p(-o, u, v), 0, 64, -D, rng, kind === 'edge' ? 10 : 6)
  })
}

// Nízká rozbitá zídka na hraně odvrácené od diváka (−b: za ní Jelení příkop; +a: konec ostrohu).
function svLip(name, side, seed = 1) {
  const W = 84, H = 64, oy = 50
  const ox = side === 'b' ? 8 : 76
  sprite(name, { w: W, h: H }, (c) => {
    const rng = c.rng(seed)
    const K = mstKit(c, ox, oy, rng)
    const { box } = K
    for (let u = 0; u < 64;) {
      const len = 6 + rng() * 14, h = rng() < 0.25 ? 0 : 4 + rng() * 10
      const u1 = Math.min(64, u + len)
      if (h > 0) {
        if (side === 'b') box(u, u1, -6, 0, 0, h, "C", "3", "q")
        else box(-6, 0, 64 - u1, 64 - u, 0, h, "C", "3", "q")
      }
      u = u1 + (rng() < 0.3 ? 2 + rng() * 6 : 0)
    }
  })
}

// Suť na svahu: balvany, kvádry z hradeb, kus balustrády, rozbitá váza ze zahrad.
function svSut(name, kind, seed) {
  sprite(name, { w: 72, h: 52 }, (c) => {
    const rng = c.rng(seed)
    const K = mstKit(c, 36, 40, rng)
    const { box, p } = K
    c.ellipse(36, 42, 26, 5, "A")
    if (kind === 'balvany') {
      for (let i = 0; i < 4; i++) {
        const x = 18 + rng() * 34, y = 26 + rng() * 12, r = 5 + rng() * 7
        c.ellipse(Math.round(x), Math.round(y), Math.round(r), Math.round(r * 0.7), "x")
        c.ellipse(Math.round(x - 1), Math.round(y - 2), Math.round(r - 2), Math.round(r * 0.5), "v")
        c.ellipse(Math.round(x - 2), Math.round(y - 3), Math.max(1, Math.round(r - 5)), Math.max(1, Math.round(r * 0.25)), "w")
      }
    } else if (kind === 'kvadry') {
      box(-14, 4, -10, 6, 0, 10, "q", "P", "p")
      box(6, 20, 2, 14, 0, 8, "q", "P", "p")
      box(-6, 10, -4, 8, 10, 18, "C", "e", "c")
      c.line(...p(-14, -10, 9), ...p(4, -10, 9), "k")
    } else if (kind === 'balustrada') {
      box(-22, 22, -3, 3, 0, 4, "q", "P", "p")
      for (let a = -18; a < 20; a += 7) if (rng() < 0.75) { box(a, a + 3, -2, 2, 4, 14, "w", "p", "q"); c.px(...p(a + 1, 0, 9).map(Math.round), "v") }
      box(-22, 2, -3, 3, 14, 17, "q", "P", "p")
      for (let i = 0; i < 4; i++) { const [x, y] = p(4 + rng() * 18, rng() * 8 - 4, 0); c.rect(Math.round(x), Math.round(y) - 2, 3, 2, "v") }
    } else {
      // rozbitá kamenná váza z terasových zahrad, převrácená
      c.ellipse(32, 34, 12, 6, "P"); c.ellipse(32, 33, 10, 4, "p"); c.ellipse(30, 32, 6, 2, "A")
      c.poly([40, 30, 52, 26, 54, 34, 44, 38], "q"); c.line(40, 30, 52, 26, "w")
      for (let i = 0; i < 5; i++) c.rect(Math.round(18 + rng() * 34), Math.round(36 + rng() * 6), 2, 2, rng() < 0.5 ? "p" : "v")
    }
    for (let i = 0; i < 3; i++) { const x = 16 + rng() * 40, y = 38 + rng() * 4; c.vline(Math.round(x), Math.round(y) - 3, 3, "g") }
  })
}

svWall("sv_edge_b", "b", "edge", 1); svWall("sv_edge_b2", "b", "edge", 2); svWall("sv_edge_b3", "b", "edge", 3)
svWall("sv_edge_a", "a", "edge", 4); svWall("sv_edge_a2", "a", "edge", 5); svWall("sv_edge_a3", "a", "edge", 6)
svWall("sv_ter_b", "b", "ter", 7); svWall("sv_ter_b2", "b", "ter", 8)
svWall("sv_ter_a", "a", "ter", 9); svWall("sv_ter_a2", "a", "ter", 10)
svLip("sv_lip_b", "b", 11); svLip("sv_lip_b2", "b", 12)
svLip("sv_lip_a", "a", 13); svLip("sv_lip_a2", "a", 14)
svSut("sv_sut_1", "balvany", 21); svSut("sv_sut_2", "balvany", 22); svSut("sv_sut_3", "kvadry", 23)
svSut("sv_sut_4", "kvadry", 24); svSut("sv_sut_5", "balustrada", 25); svSut("sv_sut_6", "vaza", 26)

sheet("landmarks_svah", ["sv_*"], { pad: 1 })
