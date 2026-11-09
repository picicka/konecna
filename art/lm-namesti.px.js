// Staroměstské náměstí pod vodou: kostel svatého Mikuláše, palác Kinských a dům U Kamenného zvonu jako landmarky.
// Geometrie jako katedrala(): počátek v nejbližším spodním rohu, bod p(a, d, h) – a podél osy a (pravá stěna FR, +b,
// jih), d napříč od jižní stěny (levá stěna FL, −a, západ), h výška. Náměstí je zatopené po první patro: dole bláto
// a čára hladiny (~70 px), vodu hra kreslí pod sprity. Světlo zleva: levé stěny světlejší.

// Společné nástroje nad plátnem: body, stěny, kvádry, okna, stékance, čára hladiny.
function namKit(c, ox, oy, rng) {
  const r = Math.round
  const p = (a, d, h) => [ox + a - d, oy - a / 2 - d / 2 - h]
  const poly = (col, ...q) => c.poly(q.flatMap((t) => p(...t)), col)
  const FLa = (a) => (u, v) => p(a, u, v)
  const FRd = (d) => (u, v) => p(u, d, v)
  const quad = (F, u0, u1, v0, v1, col) => c.poly([...F(u0, v0), ...F(u1, v0), ...F(u1, v1), ...F(u0, v1)], col)
  const box = (a0, a1, d0, d1, h0, h1, cl, cr, ct) => {
    if (ct) poly(ct, [a0, d0, h1], [a1, d0, h1], [a1, d1, h1], [a0, d1, h1])
    quad(FLa(a0), d0, d1, h0, h1, cl)
    quad(FRd(d0), a0, a1, h0, h1, cr)
  }
  // okno s půlkruhovým záklenkem v rovině stěny
  const arch = (F, u0, u1, v0, v1, col) => {
    const q = [...F(u0, v0), ...F(u1, v0)], rr = (u1 - u0) / 2
    for (let t = 0; t <= 8; t++) q.push(...F(u0 + rr + rr * Math.cos(t / 8 * Math.PI), v1 + rr * 0.8 * Math.sin(t / 8 * Math.PI)))
    c.poly(q, col)
  }
  // gotické okno s lomeným obloukem a kružbou
  const lancet = (F, u0, u1, v0, v1, col, frame, bar) => {
    const peak = (u1 - u0) * 0.8
    c.poly([...F(u0 - 2, v0 - 2), ...F(u1 + 2, v0 - 2), ...F(u1 + 2, v1), ...F((u0 + u1) / 2, v1 + peak + 3), ...F(u0 - 2, v1)], frame)
    c.poly([...F(u0, v0), ...F(u1, v0), ...F(u1, v1), ...F((u0 + u1) / 2, v1 + peak), ...F(u0, v1)], col)
    if (!bar) return
    c.line(...F((u0 + u1) / 2, v0), ...F((u0 + u1) / 2, v1 + peak * 0.5), bar)
    // kružba: dva malé oblouky a kruh v hrotu
    const m = (u0 + u1) / 2, q = (u1 - u0) / 4
    ;[u0 + q, m + q].forEach((cu) => c.line(...F(cu - q, v1), ...F(cu, v1 + q * 1.4), bar) || c.line(...F(cu, v1 + q * 1.4), ...F(cu + q, v1), bar))
    const [x, y] = F(m, v1 + peak * 0.62); c.ring ? c.ring(r(x), r(y), Math.max(2, r(q * 0.8)), bar) : c.circ(r(x), r(y), 2, bar)
    for (let v = v0 + 14; v < v1; v += 14) c.line(...F(u0, v), ...F(u1, v), bar)
  }
  // stékance (saze, měděnka, rez) svisle dolů od výšky v
  const streaks = (F, u0, u1, v, n, col, maxLen = 40) => {
    for (let i = 0; i < n; i++) { const [x, y] = F(u0 + rng() * (u1 - u0), v); c.vline(r(x), r(y), 4 + Math.floor(rng() * maxLen), col) }
  }
  // bláto pod čárou hladiny a roztřepená čára nad ním (jen přes barvy stěny "on")
  const flood = (F, u0, u1, mud, line, on, H = 70) => {
    quad(F, u0, u1, 0, H - 6, mud)
    for (let u = u0; u < u1; u += 1) {
      const [x, y] = F(u, H - 6)
      const k = Math.floor(rng() * 7)
      for (let j = 0; j < k; j++) if (c.is(r(x), r(y) - j, on)) c.px(r(x), r(y) - j, mud)
      if (c.is(r(x), r(y) - k, on)) c.px(r(x), r(y) - k, line)
    }
    quad(F, u0, u1, H - 4, H - 3, line)
  }
  // socha: stojící postava na podstavci, v obrazovkových souřadnicích (x, y = pata podstavce)
  const statue = (x, y, col, dark, broken) => {
    x = r(x); y = r(y)
    c.rect(x - 4, y - 5, 9, 5, dark); c.rect(x - 4, y - 5, 9, 1, col)
    if (broken) { c.rect(x - 2, y - 9, 4, 4, col); c.px(x + 2, y - 7, dark); return }
    c.poly([x - 3, y - 5, x + 3, y - 5, x + 2, y - 18, x - 2, y - 18], col)
    c.rect(x, y - 18, 3, 13, dark)
    c.rect(x - 1, y - 23, 3, 5, col); c.px(x + 1, y - 22, dark)
    c.line(x - 3, y - 17, x - 6, y - 24, col)
  }
  return { p, poly, FLa, FRd, quad, box, arch, lancet, streaks, flood, statue, r }
}

// Měděná helmice ořezem (ne mazáním): elipsa celá v "Q", osvětlená levá část "j" přes clip; top = jen horní polovina.
function namOnion(c, x, y, rx, ry, top) {
  const r = Math.round; x = r(x); y = r(y); rx = r(rx); ry = r(ry)
  const h = top ? ry + 1 : ry * 2 + 2
  c.clip([x - rx - 1, y - ry - 1, rx * 2 + 2, h], () => c.ellipse(x, y, rx, ry, "Q"))
  c.clip([x - rx - 1, y - ry - 1, rx - Math.floor(rx / 3), h], () => c.ellipse(x, y, rx - 2, ry - 2, "j"))
}

// --- 1. KOSTEL SVATÉHO MIKULÁŠE (K. I. Dientzenhofer, 1735) ---
// Jižní průčelí do náměstí je pravá stěna FR: dvě věže na nárožích s měděnými helmicemi a lucernami, uprostřed vstupní
// rizalit se sochami, za ním osmiboký tambur a velká zelená kupole s lucernou. Po pádu: bláto do prvního patra,
// vybitá okna, saze, měděnka stéká po bílé omítce, jedna socha chybí, plachta přes díru v kupoli.
function namMikulas(name, o) {
  const w = o.w, dpt = o.dpt
  const lenR = FT * w, lenL = FT * dpt
  const W = FT * (w + dpt), Hc = 32 * (w + dpt) + 390
  const ox = FT * dpt, oy = Hc - 1
  const hB = 196, hT = 300
  // omítka: levá stěna "w", pravá "v", lizény "W", stín a spáry "x"
  const SL = "w", SR = "v", HL = "W", DK = "x"
  sprite(name, { w: W, h: Hc }, (c) => {
    const rng = c.rng(o.seed ?? 1)
    const K = namKit(c, ox, oy, rng), { p, poly, FLa, FRd, quad, box, arch, streaks, flood, statue, r } = K
    const Fs = FRd(0), Fw = FLa(0)

    // hlavní loď: kvádr a valbová střecha z tašek
    box(0, lenR, 0, lenL, 0, hB, SL, SR)
    // hlavní římsa (bez vršku, ten kryje střecha)
    box(-3, lenR + 3, -3, lenL + 3, hB, hB + 10, HL, SL)
    quad(Fs, -3, lenR + 3, hB, hB + 2, DK); quad(Fw, -3, lenL + 3, hB, hB + 2, "v")
    const eave = hB + 10
    // zadní plochy valby napřed (jen obrys za hřebenem)
    poly("R", [0, lenL, eave], [lenR, lenL, eave], [lenR, 0, eave], [lenR - lenL / 2, lenL / 2, eave + 70], [lenL / 2, lenL / 2, eave + 70])
    poly("d", [0, 0, eave], [0, lenL, eave], [lenL / 2, lenL / 2, eave + 70])
    poly("D", [0, 0, eave], [lenR, 0, eave], [lenR - lenL / 2, lenL / 2, eave + 70], [lenL / 2, lenL / 2, eave + 70])
    for (let a = 30; a < lenR - 20; a += 26) c.line(...p(a, 0, eave), ...p(Math.min(Math.max(a, lenL / 2), lenR - lenL / 2), lenL / 2, eave + 70), "R")

    // kupole nad křížením: tambur s okny, kupole, lucerna, makovice
    const cA = lenR / 2, cD = lenL / 2 + 10
    const tb = 56, hD = hB + 110
    box(cA - tb, cA + tb, cD - tb, cD + tb, hB, hD, SL, SR, DK)
    for (let u = -tb + 14; u < tb - 14; u += 30) { arch(FLa(cA - tb), cD + u, cD + u + 12, hB + 22, hB + 46, "n"); arch(FRd(cD - tb), cA + u, cA + u + 12, hB + 22, hB + 46, rng() < 0.4 ? "k" : "n") }
    box(cA - tb - 3, cA + tb + 3, cD - tb - 3, cD + tb + 3, hD, hD + 6, HL, SL, DK)
    const [dx, dy] = p(cA, cD, hD + 6)
    c.ellipse(r(dx), r(dy), 112, 34, "Q"); c.clip([r(dx) - 114, r(dy) - 36, 74, 72], () => c.ellipse(r(dx), r(dy), 110, 32, "j"))
    namOnion(c, dx, dy - 2, 100, 78, true)
    for (let k = -3; k <= 3; k++) c.line(r(dx + k * 30), r(dy - 6), r(dx + k * 6), r(dy - 78), "Q")
    // díra v kupoli a přes ni plachta
    c.poly([r(dx) + 30, r(dy) - 60, r(dx) + 62, r(dy) - 48, r(dx) + 66, r(dy) - 24, r(dx) + 36, r(dy) - 30], "k")
    c.poly([r(dx) + 22, r(dy) - 56, r(dx) + 52, r(dy) - 52, r(dx) + 50, r(dy) - 30, r(dx) + 24, r(dy) - 34], "b")
    c.line(r(dx) + 22, r(dy) - 56, r(dx) + 4, r(dy) - 78, "m"); c.line(r(dx) + 52, r(dy) - 52, r(dx) + 80, r(dy) - 30, "m")
    // měděnka stéká z kupole po tamburu
    for (let i = 0; i < 14; i++) { const [x, y] = FRd(cD - tb)(cA - tb + rng() * tb * 2, hD); c.vline(r(x), r(y), 4 + Math.floor(rng() * 18), "j") }
    // lucerna kupole
    const ly = r(dy) - 78
    c.rect(r(dx) - 16, ly - 34, 32, 34, "v"); c.rect(r(dx) - 16, ly - 34, 12, 34, "w")
    for (let x = -11; x < 12; x += 9) c.rect(r(dx) + x, ly - 28, 5, 18, "k")
    c.rect(r(dx) - 19, ly - 38, 38, 4, HL)
    namOnion(c, dx, ly - 50, 22, 16, false)
    c.poly([r(dx) - 6, ly - 64, r(dx) + 6, ly - 64, r(dx), ly - 86], "Q"); c.poly([r(dx) - 6, ly - 64, r(dx), ly - 64, r(dx), ly - 86], "j")
    c.circ(r(dx), ly - 88, 3, "Y"); c.rect(r(dx), ly - 110, 2, 20, "Y"); c.rect(r(dx) - 5, ly - 104, 12, 2, "Y")

    // průčelí: lizény, okna ve dvou řadách, kartuše, oválná okna
    for (let a = 96; a < lenR - 96; a += 48) { quad(Fs, a - 4, a + 4, 0, hB, HL); quad(Fs, a + 4, a + 5, 0, hB, DK) }
    const winRow = (F, u0, u1, step, v0, v1, ww) => {
      for (let u = u0; u + ww <= u1; u += step) {
        arch(F, u - 3, u + ww + 3, v0 - 4, v1, HL)
        const roll = rng(), col = roll < 0.25 ? "k" : roll < 0.35 ? "h" : "n"
        arch(F, u, u + ww, v0, v1, col)
        if (col === "h") for (let v = v0 + 4; v < v1; v += 7) quad(F, u, u + ww, v, v + 2, "H")
        if (col === "n") { c.line(...F(u + ww / 2, v0), ...F(u + ww / 2, v1 + ww / 2), "M"); c.line(...F(u, (v0 + v1) / 2), ...F(u + ww, (v0 + v1) / 2), "M") }
        // kartuše nad oknem a saze, když je vybité
        quad(F, u + ww / 2 - 4, u + ww / 2 + 4, v1 + ww / 2 + 4, v1 + ww / 2 + 10, HL)
        if (col === "k") streaks(F, u, u + ww, v1 + ww, 4, "x", 18)
      }
    }
    winRow(Fs, 108, lenR - 104, 48, 92, 140, 22)
    for (let a = 120; a < lenR - 104; a += 48) { const [x, y] = Fs(a, 166); c.ellipse(r(x), r(y), 8, 9, HL); c.ellipse(r(x), r(y), 5, 6, rng() < 0.5 ? "n" : "k") }
    winRow(Fw, 90, lenL - 40, 52, 92, 140, 22)
    for (let u = 100; u < lenL - 40; u += 52) { const [x, y] = Fw(u, 168); c.ellipse(r(x), r(y), 8, 9, HL); c.ellipse(r(x), r(y), 5, 6, "n") }

    // vstupní rizalit uprostřed jižního průčelí: vystupuje, portál, sochy na římse, štít s kartuší
    const rA0 = cA - 52, rA1 = cA + 52
    box(rA0, rA1, -10, 0, 0, hB + 20, SL, "w", DK)
    const Fp = FRd(-10)
    quad(Fp, rA0 + 6, rA0 + 12, 0, hB, HL); quad(Fp, rA1 - 12, rA1 - 6, 0, hB, HL)
    arch(Fp, rA0 + 28, rA1 - 28, 0, 70, HL); arch(Fp, rA0 + 32, rA1 - 32, 0, 66, "k")
    arch(Fp, rA0 + 34, rA1 - 34, 104, 150, HL); arch(Fp, rA0 + 37, rA1 - 37, 106, 148, "n")
    // štít s volutami nad rizalitem
    c.poly([...Fp(rA0, hB + 20), ...Fp(rA1, hB + 20), ...Fp(rA1 - 20, hB + 44), ...Fp(cA, hB + 58), ...Fp(rA0 + 20, hB + 44)], "w")
    c.line(...Fp(rA0, hB + 20), ...Fp(rA0 + 20, hB + 44), HL, 2); c.line(...Fp(rA0 + 20, hB + 44), ...Fp(cA, hB + 58), HL, 2)
    c.line(...Fp(rA1 - 20, hB + 44), ...Fp(rA1, hB + 20), DK, 2); c.line(...Fp(cA, hB + 58), ...Fp(rA1 - 20, hB + 44), DK)
    { const [x, y] = Fp(cA, hB + 34); c.ellipse(r(x), r(y), 9, 8, "Y"); c.ellipse(r(x), r(y), 6, 5, "O") }
    // sochy na římse rizalitu a po stranách portálu; jedna chybí (jen pahýl)
    ;[rA0 + 8, rA0 + 30, rA1 - 30, rA1 - 8].forEach((a, i) => { const [x, y] = Fp(a, hB + 20); statue(x, y, "x", "P", i === 2) })
    ;[rA0 + 18, rA1 - 18].forEach((a) => { const [x, y] = Fp(a, 74); statue(x, y, "x", "P", false) })
    for (let a = 80; a < lenR - 80; a += 48) if (a < rA0 - 10 || a > rA1 + 10) { const [x, y] = Fs(a, hB + 10); statue(x, y, "p", "x", false) }

    // věže na nárožích jižního průčelí; zadní (východní) napřed – obě stojí v d = 0
    const tower = (a0) => {
      const a1 = a0 + 64, d0 = 0, d1 = 64, Fl = FLa(a0), Fr = FRd(d0)
      box(a0, a1, d0, d1, 0, hT, SL, SR, DK)
      // nárožní lizény a římsy pater
      ;[[Fr, a0, a0 + 8, HL], [Fr, a1 - 8, a1, DK], [Fl, d0, d0 + 8, "W"], [Fl, d1 - 8, d1, "v"]].forEach(([F, u0, u1, col]) => quad(F, u0, u1, 0, hT, col))
      ;[hB, hT - 4].forEach((v) => { quad(Fl, d0 - 2, d1 + 2, v, v + 6, HL); quad(Fr, a0 - 2, a1 + 2, v, v + 6, SL); quad(Fr, a0 - 2, a1 + 2, v, v + 1, DK) })
      arch(Fr, a0 + 20, a1 - 20, 96, 144, HL); arch(Fr, a0 + 23, a1 - 23, 98, 142, rng() < 0.5 ? "k" : "n")
      arch(Fl, d0 + 20, d1 - 20, 96, 144, HL); arch(Fl, d0 + 23, d1 - 23, 98, 142, "n")
      // zvonové patro: velká okna s žaluziemi
      arch(Fr, a0 + 16, a1 - 16, hB + 30, hB + 90, HL); arch(Fr, a0 + 19, a1 - 19, hB + 32, hB + 88, "k")
      for (let v = hB + 38; v < hB + 86; v += 7) quad(Fr, a0 + 19, a1 - 19, v, v + 2, "H")
      arch(Fl, d0 + 16, d1 - 16, hB + 30, hB + 90, HL); arch(Fl, d0 + 19, d1 - 19, hB + 32, hB + 88, "k")
      // hodiny pod římsou
      { const [x, y] = Fr((a0 + a1) / 2, hT - 22); c.circ(r(x), r(y), 9, "Y"); c.circ(r(x), r(y), 7, "k"); c.line(r(x), r(y), r(x), r(y) - 5, "y"); c.line(r(x), r(y), r(x) + 4, r(y) + 1, "y") }
      // sochy na nároží pod zvonovým patrem
      { const [x, y] = Fr(a0 + 4, hB + 6); statue(x, y, "x", "P", false) }
      { const [x, y] = Fr(a1 - 4, hB + 6); statue(x, y, "x", "P", false) }
      // měděnka stéká z helmice
      streaks(Fr, a0 + 4, a1 - 4, hT, 8, "j", 26); streaks(Fl, d0 + 4, d1 - 4, hT, 6, "j", 26)
      // helmice: zvon, tmavá lucerna, cibule, špice s křížem
      const [hx, hy] = p((a0 + a1) / 2, (d0 + d1) / 2, hT + 2)
      c.ellipse(r(hx), r(hy), 63, 21, "Q"); c.clip([r(hx) - 64, r(hy) - 24, 42, 48], () => c.ellipse(r(hx), r(hy), 61, 19, "j"))
      namOnion(c, hx, hy - 2, 52, 40, true)
      for (let k = -2; k <= 2; k++) c.line(r(hx + k * 20), r(hy - 4), r(hx + k * 5), r(hy - 40), "Q")
      const y1 = r(hy) - 40
      c.rect(r(hx) - 17, y1 - 46, 34, 46, "S"); c.rect(r(hx) - 17, y1 - 46, 11, 46, "s")
      for (let x = -12; x < 12; x += 9) arch((u, v) => [r(hx) + u, y1 - v], x, x + 5, 8, 32, "k")
      c.rect(r(hx) - 20, y1 - 50, 40, 4, "Q")
      namOnion(c, hx, y1 - 70, 24, 22, false)
      c.rect(r(hx) - 5, y1 - 104, 10, 14, "S"); c.rect(r(hx) - 5, y1 - 104, 4, 14, "s")
      namOnion(c, hx, y1 - 110, 9, 8, false)
      c.poly([r(hx) - 3, y1 - 116, r(hx) + 3, y1 - 116, r(hx), y1 - 132], "Q")
      c.circ(r(hx), y1 - 133, 2, "Y"); c.rect(r(hx), y1 - 154, 2, 20, "Y"); c.rect(r(hx) - 4, y1 - 148, 10, 2, "Y")
      return Fr
    }
    tower(lenR - 64)
    const Ft = tower(0)

    // bláto po první patro a čára hladiny, pak dveře pod vodou
    flood(Fw, -6, lenL, "e", "3", "wWv")
    flood(Fs, 0, lenR, "e", "3", "wWvx")
    flood(Fp, rA0, rA1, "e", "3", "wWv")
    flood(Ft, 0, 64, "e", "3", "wWv")
    arch(Fp, rA0 + 32, rA1 - 32, 0, 66, "k")
    // saze z vybitých oken a kulky
    for (let i = 0; i < 140; i++) {
      const F = rng() < 0.7 ? Fs : Fw, [x, y] = F(rng() * (F === Fs ? lenR : lenL), 76 + rng() * 110)
      if (c.is(r(x), r(y), "vw")) c.rect(r(x), r(y), 2, 2, rng() < 0.6 ? "x" : "C")
    }
    // šmouhy pod římsou
    streaks(Fs, 0, lenR, hB - 2, 26, "x", 30); streaks(Fw, 0, lenL, hB - 2, 12, "v", 30)
    // plevel na římse
    for (let a = 0; a < lenR; a += 3) if (rng() < 0.2) { const [x, y] = Fs(a, hB + 10); c.vline(r(x), r(y) - 3, 2 + Math.floor(rng() * 3), rng() < 0.5 ? "G" : "g") }
  }, glow("f", { r: 6, strength: 0.4 }))
}

// --- 2. PALÁC KINSKÝCH (K. I. Dientzenhofer, A. Lurago, 1765) ---
// Rokokový palác, růžová a bílá štuková fasáda; hlavní průčelí na levé stěně FL do náměstí: dva rizality s trojúhelnými
// štíty a štukem, mezi nimi balkon v prvním patře a atika se sochami, vysoká valbová střecha s vikýři. Po pádu: bláto
// do prvního patra, zatlučená okna, oprýskaný štuk, chybějící socha, plachta přes střechu, saze.
function namKinsky(name, o) {
  const w = o.w, dpt = o.dpt
  const lenR = FT * w, lenL = FT * dpt
  const W = FT * (w + dpt), Hc = 32 * (w + dpt) + 300
  const ox = FT * dpt, oy = Hc - 1
  const hC = 200, back = 10
  // růžová omítka: levá "0", pravá "8", štuk "w"/"W", stín "r"
  const SL = "0", SR = "8", ST = "w", DK = "r"
  sprite(name, { w: W, h: Hc }, (c) => {
    const rng = c.rng(o.seed ?? 1)
    const K = namKit(c, ox, oy, rng), { p, poly, FLa, FRd, quad, box, arch, streaks, flood, statue, r } = K
    const Fw = FLa(back), Fs = FRd(0)
    const ris = [[22, 108], [212, 298]]

    // hlavní hmota (bez vršku, ten kryje střecha)
    box(back, lenR, 0, lenL, 0, hC, SL, SR)
    // střecha (za atikou): valba z tašek, vikýře, plachta
    const eave = hC + 12, ridge = hC + 96, inset = 110
    poly("d", [back, 0, eave], [back, lenL, eave], [back + inset, lenL / 2, ridge], [back + inset, lenL / 2, ridge])
    poly("D", [back, 0, eave], [lenR, 0, eave], [lenR - inset, lenL / 2, ridge], [back + inset, lenL / 2, ridge])
    for (let a = back + 24; a < lenR - 10; a += 22) c.line(...p(a, 0, eave), ...p(Math.min(Math.max(a, back + inset), lenR - inset), lenL / 2, ridge), "R")
    c.line(...p(back + inset, lenL / 2, ridge), ...p(lenR - inset, lenL / 2, ridge), "R", 2)
    // komíny
    ;[[180, 120], [400, 200]].forEach(([a, d]) => box(a, a + 14, d, d + 14, ridge - 50, ridge + 14, "r", "R", "k"))
    // vikýře na jižní ploše a na valbě
    const Rs = (a, t) => p(a, t * lenL / 2, eave + t * (ridge - eave))
    for (let a = 150; a < lenR - 80; a += 90) {
      const [x, y] = Rs(a, 0.35)
      c.rect(r(x) - 9, r(y) - 22, 18, 20, "w"); c.rect(r(x) - 9, r(y) - 22, 18, 3, "W"); c.rect(r(x) - 5, r(y) - 17, 10, 12, rng() < 0.4 ? "k" : "n")
      c.poly([r(x) - 12, r(y) - 22, r(x) + 12, r(y) - 22, r(x), r(y) - 32], "d")
    }
    // plachta přes díru ve střeše přivázaná lany
    c.poly([...Rs(300, 0.1), ...Rs(380, 0.12), ...Rs(370, 0.62), ...Rs(296, 0.55)], "b")
    for (let a = 306; a < 372; a += 12) c.line(...Rs(a, 0.14), ...Rs(a - 2, 0.55), "n")
    c.line(...Rs(296, 0.55), ...Rs(270, 0.95), "m"); c.line(...Rs(380, 0.12), ...Rs(410, 0), "m")

    // patra: sokl, kordonové římsy, hlavní římsa
    const bands = (F, u0, u1, light) => {
      ;[[76, 82], [148, 152]].forEach(([v0, v1]) => { quad(F, u0, u1, v0, v1, light); quad(F, u0, u1, v0, v0 + 1, DK) })
      quad(F, u0, u1, hC - 2, hC + 12, light); quad(F, u0, u1, hC - 2, hC, DK)
    }
    bands(Fw, 0, lenL, ST); bands(Fs, back, lenR, "v")
    // rokokové okno: bílé šambrány, nad oknem štuková mušle, pod oknem parapetní výplň
    const win = (F, u, v0, v1, ww, dark) => {
      quad(F, u - 3, u + ww + 3, v0 - 3, v1 + 3, dark ? "v" : ST)
      const roll = rng(), col = roll < 0.2 ? "k" : roll < 0.42 ? "h" : "n"
      quad(F, u, u + ww, v0, v1, col)
      if (col === "h") for (let v = v0 + 3; v < v1; v += 7) quad(F, u - 1, u + ww + 1, v, v + 2, rng() < 0.3 ? "H" : "h") || quad(F, u - 1, u + ww + 1, v + 2, v + 3, "H")
      if (col === "n") { quad(F, u + ww / 2, u + ww / 2 + 1, v0, v1, ST); quad(F, u, u + ww, (v0 + v1) / 2 + 4, (v0 + v1) / 2 + 5, ST) }
      // štuková mušle s ušima nad oknem
      const top = dark ? "v" : ST
      c.poly([...F(u - 6, v1 + 3), ...F(u + ww + 6, v1 + 3), ...F(u + ww + 2, v1 + 9), ...F(u + ww / 2, v1 + 15), ...F(u - 2, v1 + 9)], top)
      const [mx, my] = F(u + ww / 2, v1 + 8); c.px(r(mx), r(my), DK); c.px(r(mx) - 2, r(my) + 1, DK); c.px(r(mx) + 2, r(my) - 1, DK)
      quad(F, u - 2, u + ww + 2, v0 - 9, v0 - 4, dark ? "8" : "W")
      if (col === "k") streaks(F, u, u + ww, v1 + 16, 3, "R", 16)
    }
    const isRis = (u) => ris.some(([a, b]) => u > a - 4 && u < b + 4)
    // okna průčelí mezi rizality a v nárožích (ve vlastní rovině back)
    for (const u of [128, 168, 302]) if (u + 14 < lenL) { win(Fw, u, 96, 138, 14); win(Fw, u, 164, 192, 14) }
    // boční stěna FR: řada oken
    for (let a = back + 22; a < lenR - 20; a += 40) { win(Fs, a, 96, 138, 14, true); win(Fs, a, 164, 192, 14, true) }

    // rizality: vystupují k −a, vlastní okna, trojúhelný štít se štukovou výplní
    ris.forEach(([u0, u1], ri) => {
      box(0, back, u0, u1, 0, hC + 12, SL, SR, "k")
      const Fr = FLa(0)
      // lizény na hranách rizalitu
      quad(Fr, u0, u0 + 6, 0, hC, ST); quad(Fr, u1 - 6, u1, 0, hC, ST)
      bands(Fr, u0, u1, ST)
      for (const u of [u0 + 16, u1 - 30]) { win(Fr, u, 96, 138, 14); win(Fr, u, 164, 192, 14) }
      // štít
      c.poly([...Fr(u0 - 3, hC + 12), ...Fr(u1 + 3, hC + 12), ...Fr((u0 + u1) / 2, hC + 50)], ST)
      c.poly([...Fr(u0 + 8, hC + 16), ...Fr(u1 - 8, hC + 16), ...Fr((u0 + u1) / 2, hC + 42)], SL)
      // štuková kartuše ve štítu, jedna polovina opadaná
      const m = (u0 + u1) / 2
      c.poly([...Fr(m - 18, hC + 18), ...Fr(m + 18, hC + 18), ...Fr(m + 10, hC + 30), ...Fr(m, hC + 36), ...Fr(m - 10, hC + 30)], ri ? "W" : "w")
      if (ri) c.poly([...Fr(m + 2, hC + 18), ...Fr(m + 18, hC + 18), ...Fr(m + 10, hC + 30)], "R")
      else { const [x, y] = Fr(m, hC + 26); c.circ(r(x), r(y), 3, "Y") }
      // portál v přízemí rizalitu (pod vodou) se sloupy
      arch(Fr, m - 18, m + 18, 0, 50, ST); arch(Fr, m - 13, m + 13, 0, 46, "k")
      quad(Fr, m - 26, m - 20, 0, 70, "W"); quad(Fr, m + 20, m + 26, 0, 70, "w")
      // sochy na rozích štítu
      ;[[u0 + 2, 0], [u1 - 2, 1]].forEach(([u, k]) => { const [x, y] = Fr(u, hC + 12); statue(x, y, "x", "P", ri === 1 && k === 0) })
      { const [x, y] = Fr(m, hC + 50); statue(x, y, "x", "P", false) }
    })

    // balkon v prvním patře mezi rizality (na sloupech) a atika se sochami
    const Fb = FLa(back - 8)
    quad(Fb, 108, 212, 76, 82, ST)
    for (let u = 110; u < 210; u += 5) quad(Fb, u, u + 2, 82, 94, "W")
    quad(Fb, 108, 212, 94, 97, ST)
    ;[116, 160, 204].forEach((u) => quad(FLa(back - 4), u, u + 5, 0, 76, "W"))
    quad(Fw, 108, 212, hC + 12, hC + 16, ST)
    for (let u = 110; u < 210; u += 6) quad(Fw, u, u + 3, hC + 16, hC + 26, "W")
    quad(Fw, 108, 212, hC + 26, hC + 30, ST)
    ;[116, 140, 160, 182, 204].forEach((u, i) => { const [x, y] = Fw(u, hC + 30); statue(x, y, "x", "P", i === 3) })

    // bláto po první patro a čára hladiny, pak dveře
    flood(Fw, 0, lenL, "3", "4", "0wW8")
    ris.forEach(([u0, u1]) => { flood(FLa(0), u0, u1, "3", "4", "0wWr8"); flood(FRd(u0), 0, back, "3", "4", "0wWr8") })
    flood(Fs, back, lenR, "3", "4", "8vrwW")
    ris.forEach(([u0, u1]) => { const m = (u0 + u1) / 2; arch(FLa(0), m - 13, m + 13, 0, 46, "k") })
    // oprýskaný štuk: opadané kusy odhalují cihlu, pod římsou šmouhy
    for (let i = 0; i < 26; i++) {
      const F = rng() < 0.7 ? Fw : Fs, u = F === Fw ? rng() * lenL : back + rng() * (lenR - back), v = 84 + rng() * 100
      const [x, y] = F(u, v); if (!c.is(r(x), r(y), "08")) continue
      const s = 2 + Math.floor(rng() * 4)
      c.poly([...F(u, v), ...F(u + s * 2, v), ...F(u + s, v - s)], "R"); c.px(r(x) + 1, r(y) - 1, "r")
    }
    streaks(Fw, 0, lenL, hC - 3, 18, "8", 26); streaks(Fs, back, lenR, hC - 3, 24, "r", 30)
    for (let i = 0; i < 80; i++) { const F = rng() < 0.6 ? Fw : Fs, [x, y] = F(rng() * lenR, 80 + rng() * 110); if (c.is(r(x), r(y), "08")) c.rect(r(x), r(y), 2, 2, rng() < 0.5 ? "r" : "3") }
    for (let u = 0; u < lenL; u += 3) if (rng() < 0.2) { const [x, y] = Fw(u, hC + 12); c.vline(r(x), r(y) - 3, 2 + Math.floor(rng() * 3), rng() < 0.5 ? "G" : "g") }
  })
}

// --- 3. DŮM U KAMENNÉHO ZVONU (gotický věžový dům, 14. stol.) ---
// Šedý kámen v kvádrech, dvě patra gotických oken s kružbou mezi slepými nikami s baldachýny, lomený portál, kamenný
// zvon na nároží, nahoře cimbuří a za ním nízká valbová střecha z břidlice. Hlavní průčelí levá stěna FL.
// Po pádu: bláto po první patro, vybitá okna, saze, plevel v cimbuří, prapor z hadru, sprej na kamenech.
function namZvon(name, o) {
  const w = o.w, dpt = o.dpt
  const lenR = FT * w, lenL = FT * dpt
  const W = FT * (w + dpt), Hc = 32 * (w + dpt) + 320
  const ox = FT * dpt, oy = Hc - 1
  const hC = 222
  const SL = "q", SR = "P", HL = "z", DK = "x"
  sprite(name, { w: W, h: Hc }, (c) => {
    const rng = c.rng(o.seed ?? 1)
    const K = namKit(c, ox, oy, rng), { p, poly, FLa, FRd, quad, box, lancet, streaks, flood, r } = K
    const Fw = FLa(0), Fs = FRd(0)

    box(0, lenR, 0, lenL, 0, hC, SL, SR)
    // střecha z břidlice za cimbuřím (jen špička vykukuje) a komín
    const ridge = hC + 70
    // ochoz za cimbuřím a vnitřní líc zadního cimbuří
    poly("a", [0, 0, hC + 6], [lenR, 0, hC + 6], [lenR, lenL, hC + 6], [0, lenL, hC + 6])
    quad(FLa(lenR - 4), 0, lenL, hC + 6, hC + 26, "x"); quad(FRd(lenL - 4), 0, lenR, hC + 6, hC + 26, "P")
    poly("s", [14, 14, hC + 10], [14, lenL - 14, hC + 10], [lenR / 2, lenL / 2, ridge])
    poly("S", [14, 14, hC + 10], [lenR - 14, 14, hC + 10], [lenR / 2, lenL / 2, ridge])
        box(150, 166, 170, 186, hC, ridge - 10, "p", "P", "k")

    // kamenné řádky s vystřídanými spárami
    const courses = (F, u0, u1, col) => {
      for (let v = 10, k = 0; v < hC; v += 10, k++) {
        quad(F, u0, u1, v, v + 1, col)
        for (let u = u0 + (k % 2) * 14; u < u1; u += 28) quad(F, u, u + 1, v - 9, v, col)
      }
    }
    courses(Fw, 0, lenL, "p"); courses(Fs, 0, lenR, DK)
    // kordonové římsy pater
    ;[[92, 96], [160, 164]].forEach(([v0, v1]) => { quad(Fw, 0, lenL, v0, v1, HL); quad(Fw, 0, lenL, v0, v0 + 1, DK); quad(Fs, 0, lenR, v0, v1, "q"); quad(Fs, 0, lenR, v0, v0 + 1, "k") })

    // patro: tři gotická okna s kružbou, mezi nimi slepé niky s baldachýnem a fiálkou
    const floorRow = (F, u0, u1, v0, v1, frame, nicheCol) => {
      const n = 3, step = (u1 - u0) / n
      for (let i = 0; i <= n; i++) {
        const nu = u0 + i * step - 6
        lancet(F, nu, nu + 12, v0 + 6, v1 - 8, nicheCol, frame)
        // fiálka nad nikou
        c.line(...F(nu + 6, v1 + 2), ...F(nu + 6, v1 + 12), frame, 2)
        if (i === n) continue
        const wu = u0 + i * step + step / 2 - 14
        const roll = rng(), col = roll < 0.3 ? "k" : "n"
        lancet(F, wu, wu + 28, v0, v1 - 12, col, frame, F === Fw ? "p" : "x")
      }
      // obrubník nad patrem: řada slepých obloučků
      for (let u = u0; u < u1 - 10; u += 12) c.line(...F(u, v1 + 4), ...F(u + 6, v1 + 9), frame) || c.line(...F(u + 6, v1 + 9), ...F(u + 12, v1 + 4), frame)
    }
    floorRow(Fw, 30, lenL - 30, 104, 152, HL, "P")
    floorRow(Fw, 30, lenL - 30, 172, 214, HL, "P")
    floorRow(Fs, 30, lenR - 30, 104, 152, "q", "x")
    floorRow(Fs, 30, lenR - 30, 172, 214, "q", "x")
    // ozdobné kamenné závoje kolem oken (vertikální pruty)
    for (let u = 22; u < lenL - 16; u += 16) quad(Fw, u, u + 1, 100, 156, rng() < 0.5 ? "p" : HL)

    // lomený portál s ostěním uprostřed přízemí
    const m = lenL / 2
    for (let k = 0; k < 3; k++) c.poly([...Fw(m - 24 + k * 4, 0), ...Fw(m + 24 - k * 4, 0), ...Fw(m + 24 - k * 4, 52), ...Fw(m, 84 - k * 6), ...Fw(m - 24 + k * 4, 52)], k % 2 ? "p" : HL)
    c.poly([...Fw(m - 12, 0), ...Fw(m + 12, 0), ...Fw(m + 12, 50), ...Fw(m, 66), ...Fw(m - 12, 50)], "k")
    // malá okna přízemí
    ;[44, lenL - 64].forEach((u) => { quad(Fw, u - 2, u + 20, 38, 76, HL); quad(Fw, u, u + 18, 40, 74, "n"); for (let x = u + 4; x < u + 18; x += 5) quad(Fw, x, x + 1, 40, 74, "M") })

    // cimbuří s kružbovou balustrádou nahoře
    box(-3, lenR + 3, -3, lenL + 3, hC, hC + 6, HL, "q")
    const battl = (F, u0, u1, col, dk) => {
      for (let u = u0; u < u1; u += 20) { quad(F, u, u + 14, hC + 6, hC + 26, col); quad(F, u + 12, u + 14, hC + 6, hC + 26, dk) }
      quad(F, u0, u1, hC + 6, hC + 10, col)
    }
    battl(FRd(-3), -3, lenR + 3, "q", DK); battl(FLa(-3), -3, lenL + 3, HL, "p")

    // kamenný zvon na nároží (jihozápad), výška prvního patra
    {
      // konzola z nároží a zvon (dvojnásobná velikost, aby byl vidět)
      const [x, y] = p(-4, -4, 128), X = r(x), Y = r(y)
      c.rect(X - 3, Y - 8, 7, 4, HL); c.rect(X - 1, Y - 4, 3, 4, DK)
      c.poly([X - 7, Y, X + 7, Y, X + 10, Y + 14, X + 14, Y + 22, X - 14, Y + 22, X - 10, Y + 14], "P")
      c.poly([X - 7, Y, X - 1, Y, X - 3, Y + 14, X - 5, Y + 22, X - 14, Y + 22, X - 10, Y + 14], HL)
      c.hline(X - 14, Y + 22, 29, DK); c.hline(X - 12, Y + 18, 25, "x"); c.rect(X - 1, Y + 23, 3, 3, DK)
      // obrys, ať se zvon neztratí na kameni
      c.line(X - 7, Y, X - 10, Y + 14, "k"); c.line(X - 10, Y + 14, X - 14, Y + 22, "k"); c.line(X + 7, Y, X + 10, Y + 14, "k"); c.line(X + 10, Y + 14, X + 14, Y + 22, "k"); c.hline(X - 14, Y + 23, 29, "k")
    }
    // prapor z hadru na tyči z cimbuří
    { const [x, y] = Fw(40, hC + 26); c.vline(r(x), r(y) - 40, 40, "H"); c.poly([r(x) + 1, r(y) - 40, r(x) + 20, r(y) - 36, r(x) + 16, r(y) - 30, r(x) + 22, r(y) - 24, r(x) + 1, r(y) - 26], "V") }

    // bláto po první patro, čára hladiny, portál znovu otevřený
    flood(Fw, 0, lenL, "3", "9", "qpzPx")
    flood(Fs, 0, lenR, "9", "3", "Pxq")
    c.poly([...Fw(m - 12, 0), ...Fw(m + 12, 0), ...Fw(m + 12, 50), ...Fw(m, 66), ...Fw(m - 12, 50)], "k")
    // saze z vybitých oken, plevel v cimbuří, sprej
    streaks(Fw, 30, lenL - 30, 150, 10, "x", 18); streaks(Fw, 30, lenL - 30, hC, 14, "p", 30); streaks(Fs, 0, lenR, hC, 16, "k", 30)
    for (let u = 0; u < lenL; u += 3) if (rng() < 0.25) { const [x, y] = Fw(u, hC + 6); c.vline(r(x), r(y) - 4, 2 + Math.floor(rng() * 4), rng() < 0.5 ? "G" : "g") }
    for (let u = 0; u < lenR; u += 3) if (rng() < 0.18) { const [x, y] = Fs(u, hC + 6); c.vline(r(x), r(y) - 4, 2 + Math.floor(rng() * 4), "G") }
    for (let i = 0; i < 30; i++) { const [x, y] = Fs(rng() * lenR, 70 + rng() * 140); if (c.is(r(x), r(y), "P")) c.rect(r(x), r(y), 2, 2, "k") }
    // sprej nad čárou hladiny: šipka a znak
    c.line(...Fs(60, 80), ...Fs(110, 84), "7", 2); c.line(...Fs(100, 90), ...Fs(110, 84), "7", 2); c.line(...Fs(100, 78), ...Fs(110, 84), "7", 2)
  })
}

namMikulas("lm_mikulas", { w: 6, dpt: 4, seed: 11 })
namKinsky("lm_kinsky", { w: 8, dpt: 5, seed: 12 })
namZvon("lm_zvon", { w: 4, dpt: 4, seed: 13 })

sheet("landmarks_sm_namesti", ["lm_mikulas", "lm_kinsky", "lm_zvon"], { pad: 1 })
