// Týnský chrám (kostel Matky Boží před Týnem) na Staroměstském náměstí jako landmark. Geometrie jako katedrala():
// počátek v nejbližším spodním rohu, FR podél osy a (pravá stěna, +b, jih), FL napříč (levá stěna, −a, západ).
// Západní průčelí se dvěma věžemi míří do náměstí (levá stěna), před ním stojí Týnská škola (kreslí ji hra zvlášť),
// takže důležité je všechno nad ~150 px: štít se zlatou Madonou a věže s jehlami, nárožními a arkýřovými věžičkami.
// Po pádu: saze, ulomená nárožní věžička na jižní věži, plachta přes díru ve střeše lodi, hnízda na ochozu, plevel,
// v jednom okně jižní věže svítí ohníček.
// Bod p(a, d, h): a podél osy a od průčelí (px), d napříč od jižní stěny (px), h výška nad zemí.
function tynKostel(name, o) {
  const w = o.w, dpt = o.dpt
  const lenR = FT * w
  const W = FT * (w + dpt), Hc = 32 * (w + dpt) + 600
  const ox = FT * dpt, oy = Hc - 1
  // výšky: boční loď, koruna zdi lodi, hřeben střechy, ochoz věží, špička jehly
  const hA = 190, hW = 260, hR = 450, hT = 420, hS = 770
  // téměř černý kámen: světlo zleva, levé stěny "3", pravé "K", římsy "e", spáry "k"
  const SL = "3", SR = "K", HL = "e", DK = "k"
  sprite(name, { w: W, h: Hc }, (c) => {
    const rng = c.rng(o.seed ?? 1)
    const p = (a, d, h) => [ox + a - d, oy - a / 2 - d / 2 - h]
    const poly = (col, ...q) => c.poly(q.flatMap((t) => p(...t)), col)
    const FLa = (a) => (u, v) => p(a, u, v)
    const FRd = (d) => (u, v) => p(u, d, v)
    const quad = (F, u0, u1, v0, v1, col) => c.poly([...F(u0, v0), ...F(u1, v0), ...F(u1, v1), ...F(u0, v1)], col)
    const box = (a0, a1, d0, d1, h0, h1, cl = SL, cr = SR, ct = DK) => {
      poly(ct, [a0, d0, h1], [a1, d0, h1], [a1, d1, h1], [a0, d1, h1])
      quad(FLa(a0), d0, d1, h0, h1, cl)
      quad(FRd(d0), a0, a1, h0, h1, cr)
    }
    // zlatá makovice s hvězdou na tyčce
    const ball = (a, d, h, len = 14, r = 3) => {
      const [x, y] = p(a, d, h)
      c.vline(Math.round(x), Math.round(y) - len, len, "Y")
      c.circ(Math.round(x), Math.round(y) - len - r, r, "Y"); c.px(Math.round(x) - 1, Math.round(y) - len - r - 1, "y")
      c.vline(Math.round(x), Math.round(y) - len - 2 * r - 6, 5, "Y"); c.hline(Math.round(x) - 2, Math.round(y) - len - 2 * r - 4, 5, "Y")
    }
    // jehlan nad osmibokem (břidlice): stěny odzadu dopředu, barva podle natočení, řady břidlic po vrstevnicích
    const spire8 = (ac, dc, r, hb, ht, rot = 22.5) => {
      const V = []
      for (let k = 0; k < 8; k++) { const f = (rot + 45 * k) * Math.PI / 180; V.push([ac + r * Math.cos(f), dc + r * Math.sin(f), hb]) }
      const apex = [ac, dc, ht]
      const faces = V.map((v, k) => { const v2 = V[(k + 1) % 8]; return { v, v2, th: Math.atan2((v[1] + v2[1]) / 2 - dc, (v[0] + v2[0]) / 2 - ac), depth: v[0] + v[1] + v2[0] + v2[1] } })
      faces.sort((f1, f2) => f2.depth - f1.depth)
      faces.forEach(({ v, v2, th }) => {
        const na = Math.cos(th), nd = Math.sin(th)
        const col = na < -0.8 ? "s" : nd < -0.8 ? "S" : na < -0.3 && nd < -0.3 ? "a" : na < 0 ? "s" : "N"
        const line = col === "s" ? "a" : col === "a" ? "S" : "N"
        poly(col, v, v2, apex)
        for (let h = hb + 9; h < ht - 12; h += 9) {
          const t = (h - hb) / (ht - hb)
          const P1 = v.map((q, i) => q + (apex[i] - q) * t), P2 = v2.map((q, i) => q + (apex[i] - q) * t)
          c.line(...p(...P1), ...p(...P2), line)
        }
      })
      // nároží jehly světlá linka na levé hraně
      const left = V.reduce((m, q) => (q[0] - q[1] < m[0] - m[1] ? q : m))
      c.line(...p(...left), ...p(...apex), "B")
    }
    // čtyřboký jehlan (věžičky) se dvěma viditelnými stěnami
    const pyramid = (a0, a1, d0, d1, hb, ht, cl = "s", cr = "S") => {
      const apex = [(a0 + a1) / 2, (d0 + d1) / 2, ht]
      poly(cl, [a0, d0, hb], [a0, d1, hb], apex)
      poly(cr, [a0, d0, hb], [a1, d0, hb], apex)
      for (let h = hb + 8; h < ht - 8; h += 8) {
        const t = (h - hb) / (ht - hb), m = (q, i) => q + (apex[i] - q) * t
        c.line(...p(...[a0, d1, hb].map(m)), ...p(...[a0, d0, hb].map(m)), "a")
        c.line(...p(...[a0, d0, hb].map(m)), ...p(...[a1, d0, hb].map(m)), "N")
      }
    }
    // gotické okno s lomeným obloukem; col "f" = rozsvícené
    const lancet = (F, u0, u1, v0, v1, col, frame) => {
      const peak = (u1 - u0) * 0.8
      c.poly([...F(u0 - 2, v0 - 2), ...F(u1 + 2, v0 - 2), ...F(u1 + 2, v1), ...F((u0 + u1) / 2, v1 + peak + 3), ...F(u0 - 2, v1)], frame)
      c.poly([...F(u0, v0), ...F(u1, v0), ...F(u1, v1), ...F((u0 + u1) / 2, v1 + peak), ...F(u0, v1)], col)
      const mc = col === "f" ? "O" : frame
      if (u1 - u0 >= 10) c.line(...F((u0 + u1) / 2, v0), ...F((u0 + u1) / 2, v1 + peak * 0.6), mc)
      for (let v = v0 + 20; v < v1; v += 24) c.line(...F(u0, v), ...F(u1, v), mc)
    }
    const streaks = (F, u0, u1, v, n, col, maxLen = 60) => {
      for (let i = 0; i < n; i++) { const [x, y] = F(u0 + rng() * (u1 - u0), v); c.vline(Math.round(x), Math.round(y), 6 + Math.floor(rng() * maxLen), col) }
    }
    // řádkové zdivo: spáry vrstev kvádrů s vystřídanými svislými spárami
    const courses = (F, u0, u1, v0, v1, col, step = 12) => {
      for (let v = v0 + step; v < v1; v += step) {
        c.line(...F(u0, v), ...F(u1, v), col)
        for (let u = u0 + ((v / step) % 2) * 11 + 6; u < u1 - 4; u += 22) c.line(...F(u, v), ...F(u, v - step + 1), col)
      }
    }

    // --- LOĎ: vysoká strmá střecha podél a, jižní boční loď s pultovou střechou a opěráky ---
    const nA0 = 100, nA1 = lenR - 8, nD0 = 90, nD1 = 300, ridgeD = (nD0 + nD1) / 2
    box(nA0, nA1, nD0, nD1, 0, hW)
    // jižní svah střechy (od okapu k hřebeni), na východě valba
    const Rn = (s, t) => p(nA0 + s - t * 60 * (s / (nA1 - nA0)), nD0 + t * (ridgeD - nD0), hW + t * (hR - hW))
    const rl = nA1 - nA0
    c.poly([...Rn(0, 0), ...Rn(rl, 0), ...Rn(rl, 1), ...Rn(0, 1)], "S")
    for (let t = 0.06; t < 1; t += 0.06) c.line(...Rn(0, t), ...Rn(rl, t), "N")
    for (let s = 20; s < rl; s += 46) c.line(...Rn(s, 0), ...Rn(s, 1), "N")
    // vikýřky ve střeše
    for (let s = 60; s < rl - 40; s += 90) { const [x, y] = Rn(s, 0.35); c.rect(Math.round(x) - 4, Math.round(y) - 10, 8, 10, "a"); c.rect(Math.round(x) - 2, Math.round(y) - 7, 4, 6, "k"); c.poly([x - 6, y - 10, x, y - 18, x + 6, y - 10], "s") }
    // díra ve střeše a plachta přes ni
    c.poly([...Rn(170, 0.2), ...Rn(230, 0.18), ...Rn(240, 0.55), ...Rn(180, 0.6)], "k")
    c.line(...Rn(190, 0.24), ...Rn(205, 0.56), "H", 2)
    c.poly([...Rn(150, 0.3), ...Rn(215, 0.24), ...Rn(225, 0.5), ...Rn(160, 0.56)], "o")
    for (let s = 160; s < 215; s += 12) c.line(...Rn(s, 0.3), ...Rn(s + 4, 0.52), "u")
    c.line(...Rn(150, 0.3), ...Rn(120, 0), "m"); c.line(...Rn(215, 0.24), ...Rn(250, 0), "m")
    c.line(...Rn(0, 1), ...Rn(rl, 1), "s", 2); c.line(...Rn(0, 0), ...Rn(rl, 0), "k")
    // sanktusník na hřebeni
    box(300, 310, ridgeD - 5, ridgeD + 5, hR - 20, hR + 30, "s", "S", "S"); pyramid(300, 310, ridgeD - 5, ridgeD + 5, hR + 30, hR + 90); ball(305, ridgeD, hR + 90, 8, 2)
    // horní okna lodi nad pultovou střechou
    for (let a = nA0 + 40; a < nA1 - 30; a += 56) lancet(FRd(nD0), a, a + 16, hA + 26, hW - 30, rng() < 0.3 ? "k" : "n", DK)
    // boční loď
    box(nA0, nA1, 24, nD0, 0, hA)
    poly("S", [nA0, 24, hA], [nA1, 24, hA], [nA1, nD0, hA + 30], [nA0, nD0, hA + 30])
    for (let a = nA0 + 12; a < nA1; a += 28) c.line(...p(a, 24, hA), ...p(a, nD0, hA + 30), "N")
    c.line(...p(nA0, 24, hA), ...p(nA1, 24, hA), "k")
    courses(FRd(24), nA0, nA1, 0, hA, "9", 14)
    for (let a = nA0 + 30; a < nA1 - 30; a += 56) lancet(FRd(24), a, a + 20, 50, 150, rng() < 0.25 ? "k" : "n", DK)
    // opěráky se stříškami
    for (let a = nA0 + 4; a < nA1; a += 56) {
      box(a, a + 12, 4, 24, 0, hA - 30, SL, SR, HL)
      poly(HL, [a, 4, hA - 30], [a + 12, 4, hA - 30], [a + 12, 24, hA - 6], [a, 24, hA - 6])
    }
    streaks(FRd(24), nA0, nA1, hA - 4, 40, DK, 70)
    streaks(FRd(nD0), nA0, nA1, hW - 4, 20, DK, 40)

    // --- VĚŽ: dřík z tmavého kamene, vysoké okno, ochoz na krakorcích, jehla s věžičkami ---
    const TA0 = 0, TA1 = 100
    const tower = (d0, d1, south) => {
      const Fl = FLa(TA0), Fr = FRd(d0), ac = (TA0 + TA1) / 2, dc = (d0 + d1) / 2
      box(TA0, TA1, d0, d1, 0, hT)
      courses(Fl, d0, d1, 0, hT, "9"); courses(Fr, TA0, TA1, 0, hT, "k")
      // patrové římsy
      ;[150, 290].forEach((v) => { quad(Fl, d0, d1, v, v + 4, HL); quad(Fr, TA0, TA1, v, v + 4, "9") })
      // vysoké okno a menší nad ním; na jižní věži jedno svítí
      lancet(Fl, (d0 + d1) / 2 - 12, (d0 + d1) / 2 + 12, 300, 370, south ? "f" : "n", HL)
      // rozsvícené okno je dole zatlučené prkny
      if (south) for (let v = 302; v < 340; v += 7) quad(Fl, (d0 + d1) / 2 - 13, (d0 + d1) / 2 + 13, v, v + 4, "H")
      lancet(Fl, (d0 + d1) / 2 - 8, (d0 + d1) / 2 + 8, 180, 250, "k", HL)
      lancet(Fr, ac - 8, ac + 8, 310, 370, "k", "9")
      // erby pod ochozem
      for (let k = 0; k < 4; k++) { const u = d0 + 14 + k * 20; quad(Fl, u, u + 12, 384, 402, "9"); quad(Fl, u + 2, u + 10, 388, 400, k === 1 ? "O" : "K") }
      streaks(Fl, d0, d1, hT - 6, 14, "k", 120); streaks(Fr, TA0, TA1, hT - 6, 10, "k", 120)
      // krakorce a ochoz s kružbovou balustrádou
      for (let u = d0; u < d1; u += 12) poly(HL, [TA0, u, hT - 14], [TA0 - 6, u, hT], [TA0 - 6, u + 8, hT], [TA0, u + 8, hT - 14])
      for (let u = TA0; u < TA1; u += 12) poly("9", [u, d0, hT - 14], [u, d0 - 6, hT], [u + 8, d0 - 6, hT], [u + 8, d0, hT - 14])
      box(TA0 - 6, TA1 + 6, d0 - 6, d1 + 6, hT, hT + 8, HL, "9", "a")
      const Gl = FLa(TA0 - 6), Gr = FRd(d0 - 6)
      quad(Gl, d0 - 6, d1 + 6, hT + 8, hT + 24, "9"); quad(Gr, TA0 - 6, TA1 + 6, hT + 8, hT + 24, "K")
      for (let u = d0; u < d1; u += 10) { quad(Gl, u, u + 6, hT + 11, hT + 21, "k"); c.px(...Gl(u + 3, hT + 16).map(Math.round), "9") }
      for (let u = TA0; u < TA1; u += 10) { quad(Gr, u, u + 6, hT + 11, hT + 21, "k") }
      quad(Gl, d0 - 6, d1 + 6, hT + 24, hT + 27, HL); quad(Gr, TA0 - 6, TA1 + 6, hT + 24, hT + 27, "9")
      // plevel a hnízdo na ochozu
      for (let u = d0 - 4; u < d1 + 4; u += 3) if (rng() < 0.3) { const [x, y] = Gl(u, hT + 27); c.vline(Math.round(x), Math.round(y) - 4, 2 + Math.floor(rng() * 4), rng() < 0.5 ? "G" : "g") }
      { const [x, y] = Gl(d0 + 30, hT + 27); c.ellipse(Math.round(x), Math.round(y) - 3, 6, 3, "H"); c.hline(Math.round(x) - 5, Math.round(y) - 5, 10, "h"); c.px(Math.round(x) + 7, Math.round(y) - 6, "h") }
      // věžička: hranol s okénky, krakorec dole, jehlan, makovice
      const turret = (a, d, hb, s, hBox, hSp, broken, corbel) => {
        if (corbel) { poly("9", [a - s, d - s, hb], [a - s, d + s, hb], [a, d, hb - 30]); poly("K", [a - s, d - s, hb], [a + s, d - s, hb], [a, d, hb - 30]) }
        box(a - s, a + s, d - s, d + s, hb, hb + hBox, "9", "K", "a")
        lancet(FLa(a - s), d - 3, d + 3, hb + 10, hb + hBox - 12, "k", "9")
        lancet(FRd(d - s), a - 3, a + 3, hb + 10, hb + hBox - 12, "k", "K")
        quad(FLa(a - s), d - s, d + s, hb + hBox - 4, hb + hBox, HL)
        if (broken) {
          // ulomená špička: pahýl jehlanu, trčící latě, suť na ochozu
          pyramid(a - s, a + s, d - s, d + s, hb + hBox, hb + hBox + (hSp - hBox) * 0.5)
          const [x, y] = p(a, d, hb + hBox + (hSp - hBox) * 0.45)
          c.rect(Math.round(x) - 5, Math.round(y) - 1, 10, 3, "k")
          c.line(Math.round(x) - 3, Math.round(y), Math.round(x) - 6, Math.round(y) - 9, "H"); c.line(Math.round(x) + 2, Math.round(y), Math.round(x) + 4, Math.round(y) - 7, "H")
          return
        }
        pyramid(a - s, a + s, d - s, d + s, hb + hBox, hb + hSp)
        ball(a, d, hb + hSp, 10, 2)
      }
      const cs = 11, ci = 4, hb = hT + 8
      const cornerTurret = (a, d, broken) => turret(a, d, hb, cs, 46, 190, broken, false)
      // arkýřové věžičky na jehle (v osách stěn) ve výšce
      const r8 = 46, mid = hT + 130, R = 34
      // zadní nárožní a zadní arkýřové
      cornerTurret(TA1 - ci, d1 - ci, false)
      turret(ac + R, dc, mid, 8, 34, 120, false, true)
      turret(ac, dc + R, mid, 8, 34, 120, false, true)
      cornerTurret(TA0 + ci, d1 - ci, false); cornerTurret(TA1 - ci, d0 + ci, false)
      // hlavní jehla: obruba a osmiboký jehlan
      box(ac - r8, ac + r8, dc - r8, dc + r8, hb, hb + 10, "9", "K", "a")
      spire8(ac, dc, r8 + 2, hb + 10, hS)
      ball(ac, dc, hS, 24, 5)
      turret(ac - R, dc, mid, 8, 34, 120, false, true)
      turret(ac, dc - R, mid, 8, 34, 120, false, true)
      cornerTurret(TA0 + ci, d0 + ci, south)
      // malé fiálky mezi nárožními věžičkami
      ;[[TA0 - 2, dc], [ac, d0 - 2]].forEach(([a, d]) => { box(a - 3, a + 3, d - 3, d + 3, hT + 24, hT + 40, "9", "K", "a"); pyramid(a - 3, a + 3, d - 3, d + 3, hT + 40, hT + 80); ball(a, d, hT + 80, 6, 2) })
    }

    // severní věž napřed (dál), pak štít, pak jižní
    const DS0 = 20, DS1 = 124, DN0 = 260, DN1 = 364
    tower(DN0, DN1, false)

    // --- ŠTÍT mezi věžemi: stupňovaný kružbový štít s fiálami, zlatý medailon s Madonou, kříž ---
    const Fw = FLa(10), gb = hW + 20, gTop = hT + 70, gm = (DS1 + DN0) / 2
    box(10, nA0 + 10, DS1, DN0, 0, gb)
    courses(Fw, DS1, DN0, 0, gb, "9")
    lancet(Fw, gm - 24, gm + 24, 150, 230, "n", HL)
    c.poly([...Fw(DS1, gb), ...Fw(DN0, gb), ...Fw(gm, gTop)], SL)
    // slepé kružbové arkády ve štítu
    for (let u = DS1 + 10; u < DN0 - 14; u += 14) {
      const top = gb + (gTop - gb) * (1 - Math.abs(u + 5 - gm) / (gm - DS1)) - 22
      if (top > gb + 20) lancet(Fw, u + 2, u + 10, gb + 6, top, "K", "9")
    }
    // fiálky po hranách štítu
    for (let t = 0.1; t < 0.95; t += 0.16) [[DS1, 1], [DN0, -1]].forEach(([u0, sg]) => {
      const u = u0 + sg * (gm - DS1) * t, v = gb + (gTop - gb) * t
      const [x, y] = Fw(u, v)
      c.rect(Math.round(x) - 2, Math.round(y) - 22, 4, 22, "9"); c.poly([x - 3, y - 22, x, y - 40, x + 3, y - 22], "s"); c.px(Math.round(x), Math.round(y) - 42, "Y")
    })
    c.line(...Fw(DS1, gb), ...Fw(gm, gTop), HL, 2); c.line(...Fw(DN0, gb), ...Fw(gm, gTop), HL, 2)
    // medailon s Madonou
    {
      const [mx, my] = Fw(gm, gb + 100)
      c.ellipse(Math.round(mx), Math.round(my), 14, 18, "O"); c.ellipse(Math.round(mx), Math.round(my), 12, 16, "Y")
      for (let k = 0; k < 16; k++) { const an = k / 16 * Math.PI * 2; c.px(Math.round(mx + Math.cos(an) * 10), Math.round(my + Math.sin(an) * 14), "y") }
      c.poly([mx - 4, my + 10, mx + 4, my + 10, mx + 3, my - 4, mx - 3, my - 4], "O"); c.circ(Math.round(mx), Math.round(my) - 7, 2, "O"); c.px(Math.round(mx) - 1, Math.round(my) - 8, "y")
      // stékance rzi pod medailonem
      for (let k = -2; k <= 2; k++) c.vline(Math.round(mx) + k * 4, Math.round(my) + 18, 10 + Math.floor(rng() * 30), "U")
    }
    // kříž na vrcholu
    { const [x, y] = Fw(gm, gTop); c.rect(Math.round(x) - 1, Math.round(y) - 40, 3, 40, "Y"); c.rect(Math.round(x) - 9, Math.round(y) - 30, 19, 3, "Y"); c.rect(Math.round(x) - 6, Math.round(y) - 20, 13, 2, "Y") }
    streaks(Fw, DS1, DN0, gb - 4, 16, "k", 80)

    tower(DS0, DS1, true)

    // --- STOPY PO PÁDU: vypadané kvádry a stopy po kulkách na dříku jižní věže ---
    for (let i = 0; i < 120; i++) {
      const left = rng() < 0.6
      const [x, y] = left ? FLa(0)(DS0 + rng() * 344, 150 + rng() * 260) : FRd(DS0)(rng() * 100, 150 + rng() * 260)
      if (c.is(Math.round(x), Math.round(y), "3K")) c.rect(Math.round(x), Math.round(y), 2, 2, rng() < 0.5 ? "9" : "k")
    }
    // ptáci kroužící nad jižní věží
    ;[[-40, 60], [-20, 80], [30, 50]].forEach(([dx, dy]) => { const [x, y] = p(50, 72, hS); c.px(Math.round(x) + dx, Math.round(y) + dy, "k"); c.px(Math.round(x) + dx - 1, Math.round(y) + dy - 1, "k"); c.px(Math.round(x) + dx + 1, Math.round(y) + dy - 1, "k") })
  }, glow("f", { r: 8, strength: 0.5 }))
}
tynKostel("lm_tyn", { w: 7, dpt: 6, seed: 11 })

sheet("landmarks_sm_tyn", ["lm_tyn"], { pad: 1 })
