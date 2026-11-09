// Kostely jako landmarky: malostranský svatý Mikuláš a bazilika svatého Jiří na Hradě. Geometrie jako katedrala():
// počátek v nejbližším spodním rohu, FR podél osy a (pravá stěna, +b), FL napříč (levá stěna, −a).
// Bod p(a, d, h): a podél osy a od levé stěny (px), d napříč od pravé stěny (px), h výška nad zemí.

// Sada kreslicích pomůcek nad plátnem: stěny jako mapy (u, v) → obrazovka, kvádry, jehlany, okna, stékance.
function kosKit(c, ox, oy, rng, SL, SR, DK) {
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
  const pyramid = (a0, a1, d0, d1, hb, ht, cl = SL, cr = SR) => {
    const apex = [(a0 + a1) / 2, (d0 + d1) / 2, ht]
    poly(cl, [a0, d0, hb], [a0, d1, hb], apex)
    poly(cr, [a0, d0, hb], [a1, d0, hb], apex)
  }
  // valbová střecha podél a: hřeben ve středu d
  const hip = (a0, a1, d0, d1, hb, ht, cl, cr) => {
    const dm = (d0 + d1) / 2, inset = Math.min((d1 - d0) / 2, (a1 - a0) / 2)
    poly(cl, [a0, d0, hb], [a0, d1, hb], [a0 + inset, dm, ht])
    poly(cr, [a0, d0, hb], [a1, d0, hb], [a1 - inset, dm, ht], [a0 + inset, dm, ht])
  }
  // okno s půlkruhovým záklenkem v rovině stěny
  const arch = (F, u0, u1, v0, v1, col, frame) => {
    const r = (u1 - u0) / 2, m = (u0 + u1) / 2
    const ring = (rr, vv) => { const q = []; for (let t = 0; t <= 8; t++) q.push(...F(m + rr * Math.cos(Math.PI * t / 8), vv + rr * Math.sin(Math.PI * t / 8))); return q }
    if (frame) c.poly([...F(u1 + 3, v0 - 3), ...ring(r + 3, v1), ...F(u0 - 3, v0 - 3)], frame)
    c.poly([...F(u1, v0), ...ring(r, v1), ...F(u0, v0)], col)
    if (col === "h") for (let v = v0 + 4; v < v1 + r; v += 7) c.line(...F(u0, v), ...F(u1, v + 2), "H")
  }
  const streaks = (F, u0, u1, v, n, col, maxLen = 50) => {
    for (let i = 0; i < n; i++) { const [x, y] = F(u0 + rng() * (u1 - u0), v); c.vline(Math.round(x), Math.round(y), 5 + Math.floor(rng() * maxLen), col) }
  }
  // těleso z vrstev: profil s(z) = poloviční šířka čtverce v hladině z (helmice, cibule, lucerny)
  const slabs = (ac, dc, h0, h1, prof, cl, cr, step = 2) => {
    for (let h = h0; h < h1; h += step) {
      const s = prof((h - h0) / (h1 - h0))
      if (s <= 0.5) continue
      box(ac - s, ac + s, dc - s, dc + s, h, h + step, cl, cr, cl)
    }
  }
  // rotační těleso (buben, kupole): kruh poloměru r(z) v půdorysu, světlo zleva
  const rot = (ac, dc, h0, h1, prof, col, hi, step = 1) => {
    for (let h = h0; h <= h1; h += step) {
      const r = prof((h - h0) / (h1 - h0)); if (r <= 0.5) continue
      const [x, y] = p(ac, dc, h)
      kosEll(c, Math.round(x), Math.round(y), Math.round(r * Math.SQRT2), Math.max(1, Math.round(r / Math.SQRT2)), col)
      if (hi) kosEll(c, Math.round(x - r * 0.55), Math.round(y), Math.round(r * 0.62), Math.max(1, Math.round(r * 0.6 / Math.SQRT2)), hi)
    }
  }
  // bod na plášti rotačního tělesa pod úhlem th (0 = +a); vidět je, když cos + sin < 0
  const onRot = (ac, dc, r, th, h) => p(ac + r * Math.cos(th), dc + r * Math.sin(th), h)
  return { p, poly, FLa, FRd, quad, box, pyramid, hip, arch, streaks, slabs, rot, onRot }
}

// plná elipsa po řádcích (vestavěná elipsa je na velkém plátně pomalá)
function kosEll(c, cx, cy, rx, ry, col) {
  cx = Math.round(cx); cy = Math.round(cy); rx = Math.max(1, Math.round(rx)); ry = Math.max(1, Math.round(ry))
  for (let y = -ry; y <= ry; y++) { const hw = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y / ry) ** 2))); c.rect(cx - hw, cy + y, hw * 2 + 1, 1, col) }
}

// Pracovní reflektor (Hrad svítí): kužel světla po stěně nahoru, lampa na stojanu
function kosFlood(c, F, u, spread, top, foot = 0) {
  const [x0, y0] = F(u, foot)
  const [xl, yl] = F(u - spread, top), [xr, yr] = F(u + spread, top)
  const outer = [x0 - 4, y0, xl, yl, xr, yr, x0 + 4, y0], inner = [x0 - 2, y0, (x0 + xl) / 2 + 6, (y0 + yl) / 2, (x0 + xr) / 2 - 6, (y0 + yr) / 2, x0 + 2, y0]
  // cihlová omítka "o" nemá v rampě světlejší tón: nasvícená přejde do lososové
  c.recolor({ o: "8" }, outer, 0.5); c.recolor({ o: "8" }, inner, 1)
  c.light(outer, 1, 0.6)
  c.light(inner, 1, 1)
  c.rect(x0 - 6, y0 - 8, 12, 8, "M"); c.rect(x0 - 5, y0 - 12, 10, 4, "f"); c.vline(x0, y0, 6, "k")
}

// --- SVATÝ MIKULÁŠ NA MALÉ STRANĚ (Dientzenhoferové) ---
// Osa a míří na západ: levá stěna je východní závěr (presbytář pod kupolí, zvonice v severovýchodním rohu u nejbližší
// hrany), pravá stěna dlouhý severní bok s kaplemi. Prohnuté hlavní průčelí je na vzdáleném západním konci, nad
// střechou z něj kouká štít se sochami. Po pádu: saze, měděnkové stékance, díra v kupoli pod plachtou, chybějící
// sochy, zatlučená okna. Malá Strana je suchá a nikdo na ni nesáhl, tak jen zchátralá, ne rozbitá.
function kosMikulas(name, o) {
  const w = o.w, dpt = o.dpt
  const lenR = FT * w, lenL = FT * dpt
  const W = FT * (w + dpt), Hc = 32 * (w + dpt) + 320
  const ox = FT * dpt, oy = Hc - 1
  // omítka krémově okrová: levé stěny "c", pravé "C", hrany "W", spáry a saze "e"
  const SL = "c", SR = "C", HL = "W", DK = "e"
  sprite(name, { w: W, h: Hc }, (c) => {
    const rng = c.rng(o.seed ?? 1)
    const K = kosKit(c, ox, oy, rng, SL, SR, DK)
    const { p, poly, FLa, FRd, quad, box, pyramid, hip, arch, streaks, slabs, rot, onRot } = K
    const sootWin = () => { const r = rng(); return r < 0.25 ? "h" : r < 0.45 ? "k" : "n" }
    // socha na římse: podstavec a silueta (některé chybí, z jiných zbyl pahýl)
    const statue = (x, y, ht = 22) => {
      x = Math.round(x); y = Math.round(y)
      c.rect(x - 3, y - 5, 7, 5, "v")
      const r = rng(); if (r < 0.3) return
      if (r < 0.45) { c.rect(x - 2, y - 10, 5, 5, "x"); return }
      c.rect(x - 2, y - ht, 5, ht - 5, "x"); c.rect(x - 1, y - ht - 4, 3, 4, "x"); c.px(x - 3, y - ht + 6, "x"); c.px(x + 3, y - ht + 4, "v")
      c.vline(x - 2, y - ht, ht - 5, "w")
    }

    // --- ZÁPADNÍ PRŮČELÍ (nejdál): prohnutý štít se sochami nad střechou lodi ---
    const fA = lenR - 24
    const Fw = FLa(fA)
    box(fA, lenR, 40, lenL - 40, 0, 300)
    { const Ff = FRd(40); quad(Ff, fA + 4, fA + 10, 0, 300, HL); arch(Ff, fA + 11, fA + 21, 230, 262, "n", HL); streaks(Ff, fA, lenR, 296, 4, DK, 60) }
    // prohnutá atika: střed vystupuje, štít s volutami
    c.poly([...Fw(110, 300), ...Fw(274, 300), ...Fw(250, 340), ...Fw(220, 352), ...Fw(192, 372), ...Fw(164, 352), ...Fw(134, 340)], SL)
    c.line(...Fw(110, 300), ...Fw(134, 340), HL, 2); c.line(...Fw(274, 300), ...Fw(250, 340), DK, 2)
    c.line(...Fw(134, 340), ...Fw(192, 372), HL, 2); c.line(...Fw(192, 372), ...Fw(250, 340), HL, 2)
    ;[[60, 300], [110, 302], [134, 342], [192, 374], [250, 342], [274, 302], [324, 300]].forEach(([u, v]) => statue(...Fw(u, v), 26))

    // --- LOĎ se severními kaplemi, okny a balustrádou ---
    const nA0 = 300, nA1 = fA, nD0 = 40, nD1 = lenL - 40, hN = 210, hNR = 330
    box(nA0, nA1, nD0, nD1, 0, hN)
    const Fn = FRd(nD0)
    // pilastry a římsa
    for (let a = nA0 + 10; a < nA1; a += 56) { quad(Fn, a, a + 10, 0, hN, HL); quad(Fn, a + 10, a + 12, 0, hN, DK) }
    quad(Fn, nA0, nA1, hN - 14, hN - 6, HL); quad(Fn, nA0, nA1, hN - 6, hN, DK)
    // velká okna lodi s oválnými okny nad nimi
    for (let a = nA0 + 26; a < nA1 - 20; a += 56) {
      arch(Fn, a + 2, a + 22, 96, 160, sootWin(), HL)
      const [x, y] = Fn(a + 12, 182); kosEll(c, Math.round(x), Math.round(y), 5, 7, HL); kosEll(c, Math.round(x), Math.round(y), 3, 5, "n")
      // saze nad oknem
      const [sx, sy] = Fn(a + 4, 170); c.line(sx, sy, sx + 14, sy - 7, DK)
    }
    // střecha lodi: červené tašky, vybledlé, s vikýři
    const Rn = (s, t) => p(nA0 + s, nD0 + t * (lenL / 2 - nD0), hN + t * (hNR - hN))
    c.poly([...Rn(0, 0), ...Rn(nA1 - nA0, 0), ...Rn(nA1 - nA0, 1), ...Rn(0, 1)], "d")
    for (let t = 0.12; t < 1; t += 0.12) c.line(...Rn(0, t), ...Rn(nA1 - nA0, t), "D")
    for (let i = 0; i < 26; i++) { const [x, y] = Rn(rng() * (nA1 - nA0), rng()); c.rect(Math.round(x), Math.round(y), 3, 1, rng() < 0.5 ? "D" : "R") }
    c.line(...Rn(0, 1), ...Rn(nA1 - nA0, 1), "D", 2); c.line(...Rn(0, 0), ...Rn(nA1 - nA0, 0), "k")
    // díra ve střeše lodi (propadlé tašky, latě)
    c.poly([...Rn(200, 0.38), ...Rn(214, 0.3), ...Rn(236, 0.33), ...Rn(250, 0.5), ...Rn(240, 0.64), ...Rn(222, 0.6), ...Rn(206, 0.68)], "k")
    for (let i = 0; i < 14; i++) { const [x, y] = Rn(196 + rng() * 60, 0.26 + rng() * 0.46); if (!c.is(Math.round(x), Math.round(y), "k")) c.rect(Math.round(x), Math.round(y), 3, 2, "D") }
    for (let s = 206; s < 240; s += 9) c.line(...Rn(s, 0.33), ...Rn(s + 4, 0.64), "H")
    // balustráda se sochami na severní římse
    for (let a = nA0 + 4; a < nA1; a += 6) quad(Fn, a, a + 3, hN, hN + 12, rng() < 0.08 ? DK : SR)
    quad(Fn, nA0, nA1, hN + 12, hN + 15, HL)
    for (let a = nA0 + 15; a < nA1; a += 56) statue(...Fn(a, hN + 15), 24)
    // kaple: nízké přístavky mezi pilíři
    for (let a = nA0 + 14; a < nA1 - 40; a += 112) {
      box(a, a + 46, 0, nD0, 0, 92)
      arch(FRd(0), a + 14, a + 32, 30, 66, sootWin(), HL)
      hip(a, a + 46, 0, nD0, 92, 112, "D", "d")
      streaks(FRd(0), a, a + 46, 88, 5, DK, 40)
    }
    streaks(Fn, nA0, nA1, hN - 16, 40, DK, 70)
    // odstřik od země
    for (let a = nA0; a < nA1; a += 2) if (rng() < 0.6) c.vline(...Fn(a, 0).map(Math.round).map((v, i) => i ? v - 1 - Math.floor(rng() * 14) : v), 1 + Math.floor(rng() * 8), "e")

    // --- KŘÍŽENÍ A PRESBYTÁŘ: hmota pod bubnem ---
    const xA0 = 70, xA1 = nA0, xD0 = 20, xD1 = lenL - 20, hX = 240
    box(xA0, xA1, xD0, xD1, 0, hX)
    const Fx = FRd(xD0), Fxl = FLa(xA0)
    for (let a = xA0 + 12; a < xA1; a += 72) { quad(Fx, a, a + 12, 0, hX, HL); quad(Fx, a + 12, a + 14, 0, hX, DK) }
    for (let d = xD0 + 40; d < xD1; d += 110) quad(Fxl, d, d + 12, 0, hX, HL)
    quad(Fx, xA0, xA1, hX - 16, hX - 6, HL); quad(Fxl, xD0, xD1, hX - 16, hX - 6, HL)
    for (let a = xA0 + 40; a < xA1 - 20; a += 72) { arch(Fx, a, a + 26, 110, 190, sootWin(), HL); arch(Fx, a + 4, a + 22, 30, 70, sootWin(), HL) }
    // severní portál příčné lodi, zatlučený prkny
    arch(Fx, 168, 206, 0, 56, "h", HL)
    hip(xA0, xA1, xD0, xD1, hX, hX + 24, "D", "d")
    streaks(Fx, xA0, xA1, hX - 18, 30, DK, 80); streaks(Fxl, xD0, xD1, hX - 18, 18, DK, 70)
    // presbytář: nižší závěr na východ s velkým oknem
    const pD0 = 96, pD1 = lenL - 96, hP = 200
    box(0, xA0, pD0, pD1, 0, hP)
    const Fp = FLa(0)
    quad(Fp, pD0, pD0 + 10, 0, hP, HL); quad(Fp, pD1 - 10, pD1, 0, hP, DK)
    arch(Fp, 164, 220, 80, 160, "n", HL); c.line(...Fp(192, 80), ...Fp(192, 188), "e")
    arch(Fp, 176, 208, 14, 54, "h", HL)
    quad(Fp, pD0, pD1, hP - 14, hP - 6, HL)
    hip(0, xA0, pD0, pD1, hP, hP + 36, "D", "d")
    streaks(Fp, pD0, pD1, hP - 16, 14, DK, 70)

    // --- BUBEN, KUPOLE, LUCERNA ---
    const ac = 190, dc = lenL / 2, R = 94
    const hD0 = hX + 30, hD1 = 400, hK = 500
    rot(ac, dc, hX, hD1, () => R, SR, SL)
    // pilastry a okna bubnu (jen přivrácená strana)
    for (let k = 0; k < 16; k++) {
      const th = Math.PI * 2 * k / 16 + 0.1, f = Math.cos(th) + Math.sin(th)
      if (f > -0.15) continue
      const [x0, y0] = onRot(ac, dc, R + 1, th, hD0), [, y1] = onRot(ac, dc, R + 1, th, hD1 - 12)
      const wdt = Math.max(2, Math.round(-f * 3))
      if (k % 2) { c.rect(Math.round(x0) - wdt, Math.round(y1), wdt * 2, Math.round(y0 - y1), x0 < p(ac, dc, 0)[0] ? HL : DK) }
      else {
        const [, ya] = onRot(ac, dc, R, th, hD0 + 26), [, yb] = onRot(ac, dc, R, th, hD1 - 30)
        const ww = Math.max(3, Math.round(-f * 7))
        c.rect(Math.round(x0) - ww - 2, Math.round(yb) - 6, ww * 2 + 4, Math.round(ya - yb) + 8, HL)
        c.rect(Math.round(x0) - ww, Math.round(yb), ww * 2, Math.round(ya - yb), rng() < 0.3 ? "h" : "n")
        kosEll(c, Math.round(x0), Math.round(yb), ww, 4, rng() < 0.5 ? "n" : "k")
      }
    }
    // římsa bubnu
    rot(ac, dc, hD1 - 10, hD1, () => R + 6, HL, null, 2)
    rot(ac, dc, hD1 - 4, hD1, () => R + 6, DK, null, 4)
    // kupole: měděnka, světlo zleva
    rot(ac, dc, hD1, hK, (t) => R * Math.sqrt(Math.max(0, 1 - Math.pow(t, 2.2))), "Q", "j")
    // žebra
    for (let k = 0; k < 12; k++) {
      const th = Math.PI * 2 * k / 12 + 0.26
      if (Math.cos(th) + Math.sin(th) > 0.2) continue
      let prev = null
      for (let i = 0; i <= 20; i++) { const t = i / 20
        const pt = onRot(ac, dc, R * Math.sqrt(1 - Math.pow(t, 2.2)), th, hD1 + t * (hK - hD1))
        if (prev) c.line(...prev, ...pt, "Q"); prev = pt
      }
    }
    // oválné vikýřky v kupoli
    for (let k = 0; k < 8; k++) {
      const th = Math.PI * 2 * k / 8 + 0.4
      if (Math.cos(th) + Math.sin(th) > -0.4) continue
      const [x, y] = onRot(ac, dc, R * 0.86, th, hD1 + 40)
      kosEll(c, Math.round(x), Math.round(y), 6, 7, "j"); kosEll(c, Math.round(x), Math.round(y), 3, 4, "k")
    }
    // měděnkové stékance po bubnu pod kupolí
    for (let k = 0; k < 22; k++) {
      const th = Math.PI * 0.75 + (rng() - 0.5) * Math.PI * 1.3
      const [x, y] = onRot(ac, dc, R + 1, th, hD1 - 10)
      c.vline(Math.round(x), Math.round(y), 8 + Math.floor(rng() * 40), rng() < 0.6 ? "j" : "T")
    }
    // díra v kupoli vpravo a přes ni plachta přivázaná lany
    {
      const th = Math.PI * 0.88
      const [hx, hy] = onRot(ac, dc, R * 0.75, th, hD1 + 56)
      kosEll(c, Math.round(hx) + 6, Math.round(hy), 22, 14, "k")
      c.line(hx - 10, hy - 8, hx + 20, hy + 10, "H", 2); c.line(hx + 2, hy - 14, hx + 26, hy + 2, "H", 2)
      c.poly([hx - 18, hy - 4, hx + 14, hy - 22, hx + 34, hy - 6, hx + 22, hy + 14, hx - 8, hy + 10], "o")
      for (let s = -10; s < 28; s += 8) c.line(hx + s, hy - 14 + s / 3, hx + s + 2, hy + 8, "u")
      c.line(hx - 18, hy - 4, hx - 30, hy + 30, "m"); c.line(hx + 22, hy + 14, hx + 34, hy + 50, "m")
    }
    // ochoz s vázami nad kupolí
    rot(ac, dc, hK - 4, hK, () => 30, DK, null, 2)
    for (let k = 0; k < 8; k++) { const [x, y] = onRot(ac, dc, 30, Math.PI * 2 * k / 8, hK); if (y > p(ac, dc, hK)[1] - 4) c.rect(Math.round(x) - 1, Math.round(y) - 6, 3, 6, "v") }
    // lucerna s okny, cibulka, makovice a kříž
    const hL1 = hK + 44
    rot(ac, dc, hK, hL1, () => 24, SR, SL)
    for (let k = 0; k < 8; k++) {
      const th = Math.PI * 2 * k / 8 + 0.2, f = Math.cos(th) + Math.sin(th)
      if (f > -0.3) continue
      const [x, y] = onRot(ac, dc, 24, th, hL1 - 8)
      c.rect(Math.round(x) - 2, Math.round(y), 4, 24, "k"); c.rect(Math.round(x) - 2, Math.round(y) - 2, 4, 2, "n")
    }
    rot(ac, dc, hL1, hL1 + 6, () => 28, HL, null, 2)
    rot(ac, dc, hL1 + 6, hL1 + 40, (t) => 26 * (1 - t) * (0.4 + 0.6 * Math.cos(t * 1.2)) + 2, "Q", "j")
    const [tx, ty] = p(ac, dc, hL1 + 40)
    c.circ(tx, ty - 6, 4, "Y"); c.rect(tx - 1, ty - 34, 3, 28, "Y"); c.rect(tx - 6, ty - 26, 13, 2, "Y")

    // --- ZVONICE v severovýchodním rohu (nejblíž): dřík, hodiny, měděná helmice s lucernou ---
    const tA0 = 14, tA1 = 84, tD0 = 0, tD1 = 70, hT = 470
    const Tl = FLa(tA0), Tr = FRd(tD0)
    box(tA0, tA1, tD0, tD1, 0, hT)
    // nárožní pilastry a patrové římsy
    ;[[Tl, tD0], [Tl, tD1 - 10], [Tr, tA1 - 10]].forEach(([F, u]) => quad(F, u, u + 10, 0, hT, F === Tr ? SL : HL))
    for (let v = 120; v < hT; v += 120) { quad(Tl, tD0, tD1, v, v + 5, HL); quad(Tr, tA0, tA1, v, v + 5, SL); quad(Tl, tD0, tD1, v + 5, v + 7, DK); quad(Tr, tA0, tA1, v + 5, v + 7, DK) }
    // okna po patrech, nahoře zvonová
    ;[[Tl, (tD0 + tD1) / 2], [Tr, (tA0 + tA1) / 2]].forEach(([F, m]) => {
      arch(F, m - 9, m + 9, 140, 180, sootWin(), HL)
      arch(F, m - 11, m + 11, 270, 340, "k", HL)
      for (let v = 278; v < 340; v += 9) c.line(...F(m - 11, v), ...F(m + 11, v - 2), "H")
      // hodiny ve štítu
      const ring = (rr) => { const q = []; for (let t = 0; t < 20; t++) q.push(...F(m + rr * Math.cos(t / 20 * Math.PI * 2), (hT - 48) + rr * Math.sin(t / 20 * Math.PI * 2))); return q }
      c.poly(ring(17), "Y"); c.poly(ring(14), "k"); c.line(...F(m, hT - 48), ...F(m, hT - 37), "y"); c.line(...F(m, hT - 48), ...F(m + 8, hT - 51), "y")
    })
    streaks(Tl, tD0, tD1, hT - 6, 10, DK, 90); streaks(Tr, tA0, tA1, hT - 6, 10, DK, 90)
    streaks(Tl, tD0, tD1, hT - 70, 6, "j", 40); streaks(Tr, tA0, tA1, hT - 70, 6, "j", 40)
    // nárožní vázy (jedna chybí)
    ;[[tA0 + 4, tD1 - 4], [tA0 + 4, tD0 + 4], [tA1 - 4, tD0 + 4]].forEach(([a, d], i) => { if (i === 2) return; const [x, y] = p(a, d, hT); c.rect(Math.round(x) - 3, Math.round(y) - 12, 7, 12, "v"); c.rect(Math.round(x) - 2, Math.round(y) - 16, 5, 4, "x") })
    // helmice: zvon, krček, lucerna, cibulka, špice
    const tc = [(tA0 + tA1) / 2, (tD0 + tD1) / 2]
    box(tA0 - 4, tA1 + 4, tD0 - 4, tD1 + 4, hT, hT + 8, HL, SL, DK)
    slabs(...tc, hT + 8, hT + 100, (t) => 11 + 27 * Math.pow(Math.sin(Math.PI * (0.5 + 0.5 * t)), 0.55), "j", "Q")
    slabs(...tc, hT + 100, hT + 128, () => 11, SL, SR)
    ;[[FLa(tc[0] - 11), tc[1]], [FRd(tc[1] - 11), tc[0]]].forEach(([F, m]) => quad(F, m - 4, m + 4, hT + 106, hT + 122, "k"))
    slabs(...tc, hT + 128, hT + 160, (t) => 16 * Math.sin(Math.PI * (0.25 + 0.75 * t)) + 1, "j", "Q")
    const [sx, sy] = p(...tc, hT + 160)
    c.circ(sx, sy - 4, 3, "Y"); c.rect(sx - 1, sy - 30, 3, 26, "Y"); c.rect(sx - 5, sy - 22, 11, 2, "Y")

    // --- STOPY PO PÁDU: saze, kulky, plevel na římsách ---
    for (let i = 0; i < 160; i++) {
      const pick = rng()
      const [F, u0, u1] = pick < 0.5 ? [Fn, nA0, nA1] : pick < 0.75 ? [Fx, xA0, xA1] : [Tl, tD0, tD1]
      const [x, y] = F(u0 + rng() * (u1 - u0), 20 + rng() * 180)
      if (c.is(Math.round(x), Math.round(y), "cC")) c.rect(Math.round(x), Math.round(y), 2, 2, rng() < 0.6 ? "e" : "x")
    }
    for (let a = xA0; a < nA1; a += 3) if (rng() < 0.3) { const [x, y] = Fx(a, hX - 16); c.vline(Math.round(x), Math.round(y) - 3, 2 + Math.floor(rng() * 4), rng() < 0.5 ? "G" : "g") }
  })
}
kosMikulas("lm_mikulas_ms", { w: 10, dpt: 6, seed: 5 })

// --- BAZILIKA SVATÉHO JIŘÍ NA HRADĚ ---
// Osa a míří zhruba na východ: levá stěna je cihlově červené barokní západní průčelí s bílými pilastry a sochou,
// pravá stěna dlouhý jižní bok románské lodi, na vzdáleném východním konci dvě štíhlé bílé věže s tmavými stříškami.
// Hrad svítí: pracovní reflektory na průčelí, rozsvícené okno. Po pádu: saze, oprýskaná omítka, chybí socha.
function kosJiri(name, o) {
  const w = o.w, dpt = o.dpt
  const lenR = FT * w, lenL = FT * dpt
  const W = FT * (w + dpt), Hc = 32 * (w + dpt) + 360
  const ox = FT * dpt, oy = Hc - 1
  // románská loď: světlý kámen a omítka, levé "c", pravé "C"
  const SL = "c", SR = "C", HL = "W", DK = "e"
  sprite(name, { w: W, h: Hc }, (c) => {
    const rng = c.rng(o.seed ?? 1)
    const { p, poly, FLa, FRd, quad, box, pyramid, hip, arch, streaks, slabs } = kosKit(c, ox, oy, rng, SL, SR, DK)

    // --- DVĚ VĚŽE na východním konci (severní napřed, je dál) ---
    const tower = (d0) => {
      const a0 = 330, a1 = 380, d1 = d0 + 50, hT = 330
      const Fl = FLa(a0), Fr = FRd(d0)
      box(a0, a1, d0, d1, 0, hT, "w", "v", "x")
      // patra s lizénovými rámci a obloučkovým vlysem
      for (let v = 90; v <= hT; v += 80) { quad(Fl, d0, d1, v - 4, v, "W"); quad(Fr, a0, a1, v - 4, v, "w"); for (let u = 4; u < 50; u += 8) { quad(Fl, d0 + u, d0 + u + 4, v - 8, v - 4, "W"); quad(Fr, a0 + u, a0 + u + 4, v - 8, v - 4, "w") } }
      // sdružená románská okna nahoře, malá níž
      ;[[Fl, d0 + 25], [Fr, a0 + 25]].forEach(([F, m]) => {
        arch(F, m - 14, m - 3, 270, 296, "k", null); arch(F, m + 3, m + 14, 270, 296, "k", null)
        c.line(...F(m, 270), ...F(m, 300), "W", 2)
        arch(F, m - 4, m + 4, 200, 220, "n", null); arch(F, m - 3, m + 3, 120, 136, "n", null)
      })
      streaks(Fl, d0, d1, hT - 4, 6, "x", 60); streaks(Fr, a0, a1, hT - 4, 6, "v", 60)
      // stříška: nízký jehlan s rohovými štítky a tmavá jehla
      box(a0 - 3, a1 + 3, d0 - 3, d1 + 3, hT, hT + 6, "W", "w", "x")
      pyramid(a0 - 2, a1 + 2, d0 - 2, d1 + 2, hT + 6, hT + 74, "s", "S")
      const [x, y] = p((a0 + a1) / 2, d0 + 25, hT + 74); c.rect(x - 1, y - 12, 2, 12, "M"); c.circ(x, y - 13, 2, "Y")
    }
    tower(232); tower(52)

    // --- LOĎ: vyšší střední loď s románskými okny, nižší jižní boční loď ---
    const nA0 = 22, nA1 = 340, hN = 176, hNR = 240
    box(nA0, nA1, 90, 250, 0, hN)
    const Fn = FRd(90)
    for (let a = nA0 + 40; a < nA1 - 20; a += 46) arch(Fn, a, a + 12, 140, 166, rng() < 0.15 ? "f" : "n", "W")
    hip(nA0, nA1 + 20, 90, 250, hN, hNR, "D", "d")
    const Rr = (s, t) => p(nA0 + s, 90 + t * 80, hN + t * (hNR - hN))
    for (let t = 0.15; t < 1; t += 0.15) c.line(...Rr(t * 80, t), ...Rr(nA1 - nA0 + 20 - t * 80, t), "D")
    streaks(Fn, nA0, nA1, hN - 4, 20, DK, 30)
    // boční loď s pultovou střechou a malými okny, renesanční jižní portál
    box(nA0, nA1, 30, 90, 0, 110)
    const Fs2 = FRd(30)
    for (let a = nA0 + 60; a < nA1 - 20; a += 52) arch(Fs2, a, a + 10, 56, 78, rng() < 0.3 ? "h" : "n", "W")
    poly("d", [nA0, 30, 110], [nA1, 30, 110], [nA1, 90, 138], [nA0, 90, 138]); c.line(...p(nA0, 30, 110), ...p(nA1, 30, 110), "k")
    for (let a = nA0 + 6; a < nA1; a += 18) c.line(...p(a, 30, 110), ...p(a, 90, 138), "D")
    // portál se sv. Jiřím a drakem v tympanonu (zčernalý)
    quad(Fs2, 240, 290, 0, 74, "W"); arch(Fs2, 250, 280, 0, 46, "H", null)
    c.poly([...Fs2(244, 74), ...Fs2(286, 74), ...Fs2(265, 92)], "w"); quad(Fs2, 258, 272, 76, 84, "x")
    streaks(Fs2, nA0, nA1, 106, 22, DK, 40)
    for (let a = nA0; a < nA1; a += 2) if (rng() < 0.5) { const [x, y] = Fs2(a, 0); c.vline(Math.round(x), Math.round(y) - 1 - Math.floor(rng() * 10), 1 + Math.floor(rng() * 6), "e") }
    // kaple sv. Ludmily: nízký přístavek u věže
    box(290, 330, 0, 30, 0, 96); hip(290, 330, 0, 30, 96, 116, "D", "d"); arch(FRd(0), 302, 316, 40, 62, "n", "W")

    // --- ZÁPADNÍ PRŮČELÍ: cihlově červené, bílé pilastry, prohnutý štít se sochou ---
    const a0 = 0, d0 = 20, d1 = 300, hF = 196
    const Fw = FLa(a0)
    box(a0, nA0, d0, d1, 0, hF, "o", "U", "x")
    // sokl
    quad(Fw, d0, d1, 0, 18, "v"); quad(FRd(d0), a0, nA0, 0, 18, "x")
    // pilastry: krajní dvojice, středové u portálu
    ;[d0, d0 + 18, 110, 198, d1 - 34, d1 - 16].forEach((u) => { quad(Fw, u, u + 14, 18, hF - 20, "W"); quad(Fw, u + 12, u + 14, 18, hF - 20, "w"); quad(Fw, u - 2, u + 16, hF - 26, hF - 20, "W") })
    // kladí a římsa
    quad(Fw, d0 - 4, d1 + 4, hF - 20, hF - 12, "W"); quad(Fw, d0, d1, hF - 12, hF - 6, "o"); quad(Fw, d0 - 6, d1 + 6, hF - 6, hF, "W")
    // prohnutý štít s volutami
    const gm = (d0 + d1) / 2
    c.poly([...Fw(gm - 92, hF), ...Fw(gm + 92, hF), ...Fw(gm + 70, hF + 18), ...Fw(gm + 50, hF + 22), ...Fw(gm + 36, hF + 42), ...Fw(gm, hF + 56), ...Fw(gm - 36, hF + 42), ...Fw(gm - 50, hF + 22), ...Fw(gm - 70, hF + 18)], "o")
    c.line(...Fw(gm - 92, hF), ...Fw(gm - 70, hF + 18), "W", 2); c.line(...Fw(gm + 92, hF), ...Fw(gm + 70, hF + 18), "W", 2)
    c.line(...Fw(gm - 50, hF + 22), ...Fw(gm - 36, hF + 42), "W", 2); c.line(...Fw(gm + 50, hF + 22), ...Fw(gm + 36, hF + 42), "W", 2)
    c.line(...Fw(gm - 36, hF + 42), ...Fw(gm, hF + 56), "W", 2); c.line(...Fw(gm + 36, hF + 42), ...Fw(gm, hF + 56), "W", 2)
    ;[[gm - 70, 18], [gm + 70, 18]].forEach(([u, v]) => { const [x, y] = Fw(u, hF + v); c.circ(Math.round(x), Math.round(y) - 3, 3, "W") })
    // oválné okno ve štítu, rozsvícené
    { const [x, y] = Fw(gm, hF + 26); kosEll(c, Math.round(x), Math.round(y), 9, 10, "W"); kosEll(c, Math.round(x), Math.round(y), 6, 7, "f") }
    // socha na vrcholu štítu (zbyl jen podstavec a torzo) a vázy na krajích
    { const [x, y] = Fw(gm, hF + 56); c.rect(Math.round(x) - 4, Math.round(y) - 6, 9, 6, "W"); c.rect(Math.round(x) - 3, Math.round(y) - 18, 6, 12, "w"); c.px(Math.round(x) + 3, Math.round(y) - 16, "v") }
    ;[d0 + 8, d1 - 8].forEach((u) => { const [x, y] = Fw(u, hF); c.rect(Math.round(x) - 3, Math.round(y) - 12, 6, 12, "W"); c.rect(Math.round(x) - 2, Math.round(y) - 16, 4, 4, "w") })
    // portál s rámem a frontonem, dveře zatlučené prkny
    quad(Fw, 130, 194, 18, 104, "W")
    arch(Fw, 140, 184, 18, 74, "H", null)
    for (let v = 26; v < 94; v += 10) c.line(...Fw(140, v), ...Fw(184, v + 3), "h")
    c.poly([...Fw(124, 104), ...Fw(200, 104), ...Fw(162, 120)], "W"); c.poly([...Fw(132, 106), ...Fw(192, 106), ...Fw(162, 116)], "o")
    // socha sv. Ludmily v nice nad portálem
    arch(Fw, 150, 174, 130, 156, "R", "W")
    { const [x, y] = Fw(162, 132); c.rect(Math.round(x) - 3, Math.round(y) - 22, 6, 22, "w"); c.rect(Math.round(x) - 2, Math.round(y) - 26, 4, 4, "W"); c.vline(Math.round(x) + 2, Math.round(y) - 20, 18, "v") }
    // boční okna průčelí
    ;[[56, 100], [234, 278]].forEach(([u0, u1]) => { arch(Fw, u0 + 8, u1 - 8, 70, 116, rng() < 0.5 ? "n" : "k", "W"); arch(Fw, u0 + 12, u1 - 12, 30, 52, "h", "W") })
    // saze pod římsou, oprýskaná omítka (pod ní kámen), sprej na soklu
    streaks(Fw, d0, d1, hF - 22, 22, "U", 50)
    for (let i = 0; i < 12; i++) {
      const u = d0 + 20 + rng() * (d1 - d0 - 40), v = 24 + rng() * 120
      if (!c.is(...Fw(u, v).map(Math.round), "o")) continue
      c.poly([...Fw(u, v), ...Fw(u + 8 + rng() * 10, v + 2), ...Fw(u + 10, v + 8 + rng() * 6), ...Fw(u + 2, v + 6)], "q")
    }
    for (let i = 0; i < 70; i++) { const [x, y] = Fw(d0 + rng() * (d1 - d0), 20 + rng() * 140); if (c.is(Math.round(x), Math.round(y), "o")) c.rect(Math.round(x), Math.round(y), 2, 2, rng() < 0.6 ? "U" : "3") }
    c.line(...Fw(60, 6), ...Fw(96, 12), "7", 2); c.line(...Fw(70, 4), ...Fw(80, 15), "7", 2)

    // --- REFLEKTORY KANCELÁŘE: dva na průčelí, jeden na jižním boku ---
    kosFlood(c, Fw, 80, 46, 200)
    kosFlood(c, Fw, 250, 46, 200)
    kosFlood(c, Fs2, 200, 50, 220)
  }, glow("f", { r: 8, strength: 0.5 }))
}
kosJiri("lm_jiri", { w: 7, dpt: 5, seed: 3 })

sheet("landmarks_kostely", ["lm_mikulas_ms", "lm_jiri"], { pad: 1 })
