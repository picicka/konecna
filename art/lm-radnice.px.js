// Staroměstská radnice jako landmark. Geometrie jako katedrala(): počátek v nejbližším spodním rohu, FR podél osy a
// (pravá stěna, +b, jih, do náměstí), FL napříč (levá stěna, −a, západ). Řada domů radnice od západu: dům U Minuty
// (sgrafita, štít do západu), U Kohouta, Mikešův dům, Křížův dům s velkým renesančním oknem; na východním konci
// gotická věž s Orlojem na jižní stěně, nahoře ochoz s nárožními věžičkami a tmavá jehlancová střecha.
// Po pádu: Staré Město pod vodou po první patro, hladina je spodní okraj plátna. Mokrý kámen, bahenní čára, saze,
// vybitá okna, jedno okénko apoštolů otevřené, provazový žebřík k loďce, lucerna u Orloje.
// Bod p(a, d, h): a podél osy a od západu (px), d napříč od jižní stěny (px), h výška nad hladinou.
function radRadnice(name, o) {
  const w = o.w, dpt = o.dpt
  const lenR = FT * w, lenL = FT * dpt
  const W = FT * (w + dpt), Hc = 32 * (w + dpt) + 660
  const ox = FT * dpt, oy = Hc - 1
  // věž: půdorys a výšky (dřík, ochoz, střecha)
  const tA0 = 404, tA1 = 556, tD0 = 0, tD1 = 150
  const hT = 530, hG = 566, hS = 740
  const SL = "c", SR = "C", JT = "e", DK = "3"
  sprite(name, { w: W, h: Hc }, (c) => {
    const rng = c.rng(o.seed ?? 1)
    const rd = Math.round
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
    const pyramid = (a0, a1, d0, d1, hb, ht, cl = "s", cr = "S") => {
      const apex = [(a0 + a1) / 2, (d0 + d1) / 2, ht]
      poly(cl, [a0, d0, hb], [a0, d1, hb], apex)
      poly(cr, [a0, d0, hb], [a1, d0, hb], apex)
      c.line(...p(a0, d0, hb), ...p(...apex), "k")
    }
    // kruh v rovině stěny
    const disc = (F, u0, v0, r, n = 40) => { const q = []; for (let t = 0; t < n; t++) q.push(...F(u0 + r * Math.cos(t / n * Math.PI * 2), v0 + r * Math.sin(t / n * Math.PI * 2))); return q }
    // okno s ostěním; col: k vybité, n tmavé sklo, L celé, H zatlučené, f rozsvícené
    const win = (F, u0, u1, v0, v1, col, frame = "W") => {
      quad(F, u0 - 2, u1 + 2, v0 - 3, v1 + 2, frame)
      quad(F, u0, u1, v0, v1, col === "H" ? "k" : col)
      if (col === "H") for (let v = v0 + 2; v < v1; v += 6) quad(F, u0 - 1, u1 + 1, v, v + 3, (v / 6) % 2 ? "H" : "h")
      else if (col !== "k") { c.line(...F((u0 + u1) / 2, v0), ...F((u0 + u1) / 2, v1), frame); c.line(...F(u0, (v0 + v1) / 2 + 3), ...F(u1, (v0 + v1) / 2 + 3), frame) }
      else { if (rng() < 0.6) c.clip((x, y) => !c.is(x, y, "kWLlnHh"), () => c.shade([...F(u0 - 4, v1 + 2), ...F(u1 + 4, v1 + 2), ...F(u1 + 8, v1 + 34), ...F(u0 - 8, v1 + 34)], 1, 0.5)); c.line(...F(u0, v1 - 1), ...F(u0 + 3, v1 - 6), "l"); c.px(...F(u1 - 2, v0 + 2).map(rd), "L") }
      // šmouha pod parapetem
      for (let u = u0; u < u1; u += 3) if (rng() < 0.5) { const [x, y] = F(u, v0 - 3); c.vline(rd(x), rd(y), 2 + rd(rng() * 10), DK) }
    }
    const winCol = () => { const r = rng(); return r < 0.3 ? "k" : r < 0.45 ? "H" : r < 0.55 ? "L" : "n" }
    const streaks = (F, u0, u1, v, n, col, maxLen = 60) => {
      for (let i = 0; i < n; i++) { const [x, y] = F(u0 + rng() * (u1 - u0), v); c.vline(rd(x), rd(y), 6 + Math.floor(rng() * maxLen), col) }
    }
    // stopa povodně: tmavší mokrý pás u hladiny, nad ním bahenní čára a odstřik
    const flood = (F, u0, u1, cols) => {
      c.clip((x, y) => c.is(x, y, cols), () => {
        c.shade([...F(u0, -2), ...F(u1, -2), ...F(u1, 46), ...F(u0, 46)], 1, 0.5)
        c.shade([...F(u0, -2), ...F(u1, -2), ...F(u1, 22), ...F(u0, 22)], 1, 1)
      })
      c.line(...F(u0, 46), ...F(u1, 46), "U"); c.line(...F(u0, 45), ...F(u1, 45), DK)
      for (let u = u0 + 2; u < u1; u += 4) if (rng() < 0.4) { const [x, y] = F(u, 46); c.vline(rd(x), rd(y) - 1 - rd(rng() * 4), 2, rng() < 0.5 ? "G" : "U") }
      for (let u = u0 + 3; u < u1; u += 5) if (rng() < 0.5) { const [x, y] = F(u, 2); c.vline(rd(x), rd(y) - 2 - rd(rng() * 5), 3, rng() < 0.6 ? "Q" : "G") }
    }

    // --- VĚŽ (nejdál vpravo, kreslí se první, domy ji zleva zakryjí) ---
    const Tl = FLa(tA0), Tr = FRd(tD0)
    box(tA0, tA1, tD0, tD1, 0, hT, SL, SR)
    // kvádrové řádky s vystřídanými spárami
    for (let v = 14; v < hT; v += 14) {
      c.line(...Tl(tD0, v), ...Tl(tD1, v), JT); c.line(...Tr(tA0, v), ...Tr(tA1, v), JT)
      const off = (v / 14) % 2 ? 12 : 30
      for (let u = tD0 + off; u < tD1; u += 36) c.line(...Tl(u, v), ...Tl(u, v + 13), JT)
      for (let u = tA0 + off; u < tA1; u += 36) c.line(...Tr(u, v), ...Tr(u, v + 13), JT)
    }
    // světlejší nárožní kvádry
    for (let v = 0; v < hT; v += 28) { quad(Tr, tA0, tA0 + 10, v, v + 13, "c"); quad(Tr, tA1 - 10, tA1, v + 14, v + 27, "c") }
    // římsa nad hodinovým patrem, hodiny a kulaté okénko pod nimi
    quad(Tl, tD0, tD1, 430, 434, "W"); quad(Tr, tA0, tA1, 430, 434, SL)
    const tm = (tA0 + tA1) / 2, lm = (tD0 + tD1) / 2
    quad(Tr, tm - 30, tm + 30, 442, 510, "c")
    c.poly(disc(Tr, tm, 480, 24), "Y"); c.poly(disc(Tr, tm, 480, 21), "k")
    for (let i = 0; i < 12; i++) { const t = i / 12 * Math.PI * 2; c.px(...Tr(tm + 18 * Math.cos(t), 480 + 18 * Math.sin(t)).map(rd), "Y") }
    c.line(...Tr(tm, 480), ...Tr(tm - 2, 494), "y", 2); c.line(...Tr(tm, 480), ...Tr(tm + 12, 474), "y")
    c.poly(disc(Tr, tm, 450, 6, 16), "W"); c.poly(disc(Tr, tm, 450, 4, 16), "k")
    c.poly(disc(Tl, lm, 480, 22), "O"); c.poly(disc(Tl, lm, 480, 19), "k")
    c.line(...Tl(lm, 480), ...Tl(lm + 10, 490), "Y")
    // úzká okna dříku, jedno vybité
    win(Tr, tm - 8, tm + 8, 300, 336, "k", "e"); win(Tl, lm - 7, lm + 7, 300, 336, "n", "C")
    win(Tl, lm - 6, lm + 6, 200, 230, "H", "C")
    streaks(Tr, tA0, tA1, 428, 16, JT, 90); streaks(Tl, tD0, tD1, 428, 10, "C", 70)
    // ochoz: konzoly, parapet s oblouky
    box(tA0 - 6, tA1 + 6, tD0 - 6, tD1 + 6, hT, hT + 10, "W", SL, DK)
    for (let u = tD0; u < tD1; u += 10) quad(Tl, u + 2, u + 7, hT - 8, hT, "C")
    for (let u = tA0; u < tA1; u += 10) quad(Tr, u + 2, u + 7, hT - 8, hT, JT)
    const Gl = FLa(tA0 - 6), Gr = FRd(tD0 - 6)
    quad(Gl, tD0 - 6, tD1 + 6, hT + 10, hG, SL); quad(Gr, tA0 - 6, tA1 + 6, hT + 10, hG, SR)
    for (let u = tD0 + 8; u < tD1 - 6; u += 14) c.poly([...Gl(u, hT + 16), ...Gl(u + 8, hT + 16), ...Gl(u + 8, hT + 28), ...Gl(u + 4, hT + 32), ...Gl(u, hT + 28)], "k")
    for (let u = tA0 + 10; u < tA1 - 8; u += 14) c.poly([...Gr(u, hT + 16), ...Gr(u + 8, hT + 16), ...Gr(u + 8, hT + 28), ...Gr(u + 4, hT + 32), ...Gr(u, hT + 28)], "k")
    box(tA0 - 8, tA1 + 8, tD0 - 8, tD1 + 8, hG, hG + 5, "W", SL, DK)
    // střecha: jehlan z břidlice s vikýři, nárožní věžičky (zadní před střechou napřed, přední potom)
    const turret = (a, d) => {
      box(a - 11, a + 11, d - 11, d + 11, hT - 14, hG + 26, SL, SR)
      quad(FLa(a - 11), d - 6, d + 6, hT + 4, hT + 24, "k"); quad(FRd(d - 11), a - 5, a + 5, hT + 4, hT + 24, "k")
      box(a - 13, a + 13, d - 13, d + 13, hG + 26, hG + 30, "W", SL, DK)
      pyramid(a - 13, a + 13, d - 13, d + 13, hG + 30, hG + 120)
      const [x, y] = p(a, d, hG + 120); c.rect(x - 1, y - 8, 2, 8, "Y"); c.rect(x - 2, y - 10, 4, 3, "y")
    }
    turret(tA1 - 4, tD1 - 4)
    pyramid(tA0 + 6, tA1 - 6, tD0 + 6, tD1 - 6, hG + 5, hS)
    // břidlicové řady na střeše
    for (let k = 1; k < 9; k++) {
      const t = k / 9, h = hG + 5 + (hS - hG - 5) * t
      const s = 1 - t
      c.line(...p(tA0 + 6 + 70 * t, tD0 + 6 + 69 * t, h), ...p(tA1 - 6 - 70 * t, tD0 + 6 + 69 * t, h), "s")
      c.line(...p(tA0 + 6 + 70 * t, tD0 + 6 + 69 * t, h), ...p(tA0 + 6 + 70 * t, tD1 - 6 - 69 * t, h), "S")
      void s
    }
    // vikýř na jižní ploše střechy
    {
      const va = tm, vd = 30, vh = hG + 40
      box(va - 10, va + 10, vd, vd + 20, vh, vh + 22, "s", "S", "S")
      quad(FRd(vd), va - 6, va + 6, vh + 2, vh + 16, "k")
      poly("s", [va - 12, vd, vh + 22], [va + 12, vd, vh + 22], [va, vd + 10, vh + 38])
    }
    const [sx, sy] = p(tm, lm, hS); c.rect(sx - 1, sy - 26, 3, 26, "Y"); c.circ(sx, sy - 14, 3, "y"); c.rect(sx - 4, sy - 24, 9, 2, "Y")
    turret(tA0 + 4, tD1 - 4); turret(tA1 - 4, tD0 + 4); turret(tA0 + 4, tD0 + 4)

    // --- ORLOJ na jižní stěně věže u hladiny ---
    const TrW = Tr
    {
    const K = 1.16, cu = tA0 + 76, Tr = (u, v) => TrW(cu + (u - cu) * K, v * K)
    // tmavý kamenný rám s lomeným obloukem a fiálami, nad ním měděná stříška a vížka
    c.poly([...Tr(cu - 52, 0), ...Tr(cu + 52, 0), ...Tr(cu + 52, 186), ...Tr(cu, 232), ...Tr(cu - 52, 186)], "9")
    c.poly([...Tr(cu - 46, 0), ...Tr(cu + 46, 0), ...Tr(cu + 46, 180), ...Tr(cu, 222), ...Tr(cu - 46, 180)], "e")
    for (let k = 0; k < 6; k++) { const [x, y] = Tr(cu - 52 + k * 8.6, 188 + k * 7.6); c.rect(rd(x) - 1, rd(y) - 3, 3, 3, "c") }
    for (let k = 0; k < 6; k++) { const [x, y] = Tr(cu + 52 - k * 8.6, 188 + k * 7.6); c.rect(rd(x) - 1, rd(y) - 3, 3, 3, "c") }
    ;[cu - 52, cu + 46].forEach((u) => { quad(Tr, u, u + 6, 0, 196, "C"); c.poly([...Tr(u - 1, 196), ...Tr(u + 7, 196), ...Tr(u + 3, 222)], "C") })
    // stříška nad okénky apoštolů (měděnka) a vížka s kytkou
    c.poly([...Tr(cu - 40, 180), ...Tr(cu + 40, 180), ...Tr(cu + 34, 196), ...Tr(cu - 34, 196)], "Q")
    c.line(...Tr(cu - 40, 180), ...Tr(cu + 40, 180), "j")
    quad(Tr, cu - 5, cu + 5, 222, 250, "C"); c.poly([...Tr(cu - 7, 250), ...Tr(cu + 7, 250), ...Tr(cu, 300)], "Q")
    c.line(...Tr(cu - 7, 250), ...Tr(cu, 300), "j"); { const [x, y] = Tr(cu, 300); c.rect(rd(x) - 1, rd(y) - 5, 3, 5, "Y") }
    // okénka apoštolů: levé otevřené, mokrý apoštol vykukuje, pravé zavřené okenicí
    const ap = (u, open) => {
      c.poly([...Tr(u - 9, 146), ...Tr(u + 9, 146), ...Tr(u + 9, 166), ...Tr(u, 176), ...Tr(u - 9, 166)], "c")
      c.poly([...Tr(u - 7, 148), ...Tr(u + 7, 148), ...Tr(u + 7, 164), ...Tr(u, 172), ...Tr(u - 7, 164)], open ? "k" : "H")
      if (open) {
        const [x, y] = Tr(u, 150)
        c.rect(rd(x) - 4, rd(y) - 9, 8, 9, "V"); c.circ(rd(x), rd(y) - 13, 3, "i"); c.rect(rd(x) - 3, rd(y) - 17, 6, 2, "W")
        c.vline(rd(x) - 3, rd(y), 5, "J"); c.vline(rd(x) + 2, rd(y), 7, "J")
        // vyvrácená okenice
        c.poly([...Tr(u - 9, 148), ...Tr(u - 9, 166), ...Tr(u - 15, 170), ...Tr(u - 15, 152)], "H"); c.line(...Tr(u - 12, 152), ...Tr(u - 12, 166), "h")
      } else { c.line(...Tr(u, 148), ...Tr(u, 170), "h"); c.line(...Tr(u - 7, 158), ...Tr(u + 7, 158), "h") }
    }
    ap(cu - 16, true); ap(cu + 16, false)
    quad(Tr, cu - 30, cu + 30, 140, 146, "c")
    // astronomický ciferník: zlatý prstenec s číslicemi, modrá obloha, nahoře noc, soumrak, zvěrokruh, slunce, měsíc
    const av = 92
    c.poly(disc(Tr, cu, av, 44, 48), "O")
    c.poly(disc(Tr, cu, av, 41, 48), "k")
    for (let i = 0; i < 24; i++) { const t = i / 24 * Math.PI * 2; const [x, y] = Tr(cu + 37 * Math.cos(t), av + 37 * Math.sin(t)); c.rect(rd(x), rd(y), 2, 2, "y") }
    c.poly(disc(Tr, cu, av, 33, 48), "b")
    c.clip([...Tr(cu - 40, av - 40), ...Tr(cu + 40, av - 40), ...Tr(cu + 40, av - 11), ...Tr(cu - 40, av - 11)], () => c.poly(disc(Tr, cu, av, 33, 48), "n"))
    c.clip([...Tr(cu - 40, av - 11), ...Tr(cu + 40, av - 11), ...Tr(cu + 40, av - 5), ...Tr(cu - 40, av - 5)], () => c.poly(disc(Tr, cu, av, 33, 48), "o"))
    c.poly(disc(Tr, cu, av, 13, 32), "L"); c.poly(disc(Tr, cu, av, 10, 32), "b")
    // zemské pásy: tenké kružnice obratníků
    c.line(...Tr(cu - 33, av - 5), ...Tr(cu + 33, av - 5), "Y")
    // zvěrokruh: excentrický zlatý prstenec se znameními
    c.poly(disc(Tr, cu - 5, av + 7, 22, 40), "Y"); c.poly(disc(Tr, cu - 5, av + 7, 18, 40), "b")
    c.clip([...Tr(cu - 40, av - 40), ...Tr(cu + 40, av - 40), ...Tr(cu + 40, av - 11), ...Tr(cu - 40, av - 11)], () => c.poly(disc(Tr, cu - 5, av + 7, 18, 40), "n"))
    c.poly(disc(Tr, cu, av, 10, 32), "b")
    for (let i = 0; i < 12; i++) { const t = i / 12 * Math.PI * 2; c.px(...Tr(cu - 5 + 20 * Math.cos(t), av + 7 + 20 * Math.sin(t)).map(rd), "O") }
    // ručičky: zlatá ruka se sluncem, měsíční koule napůl černá
    const [hx, hy] = Tr(cu, av), [px1, py1] = Tr(cu - 24, av + 22), [mx, my] = Tr(cu + 22, av - 12)
    c.line(hx, hy, px1, py1, "y", 2); c.circ(rd(px1), rd(py1), 4, "y"); c.px(rd(px1), rd(py1), "W")
    c.line(hx, hy, mx, my, "Y"); c.circ(rd(mx), rd(my), 3, "W"); c.rect(rd(mx), rd(my) - 3, 3, 7, "k")
    c.circ(rd(hx), rd(hy), 2, "y")
    // rez stéká z ciferníku
    for (let k = 0; k < 8; k++) { const u = cu - 30 + rd(rng() * 60); const [x, y] = Tr(u, av - 40); c.vline(rd(x), rd(y), 6 + rd(rng() * 14), "U") }
    // sošky: vlevo marnivec a lakomec, vpravo Smrtka se zvonkem a Turek
    const fig = (u, v, col) => { const [x, y] = Tr(u, v); c.rect(rd(x) - 3, rd(y) - 14, 6, 14, col); c.circ(rd(x), rd(y) - 17, 3, col); c.rect(rd(x) - 5, rd(y), 10, 3, "c") }
    fig(cu - 49, 112, DK); fig(cu - 49, 70, DK); fig(cu + 49, 64, "V")
    {
      const [dx, dy] = Tr(cu + 49, 108).map(rd)
      c.rect(dx - 5, dy, 10, 3, "c")
      c.circ(dx, dy - 19, 3, "W"); c.px(dx - 1, dy - 19, "k"); c.px(dx + 1, dy - 19, "k")
      c.vline(dx, dy - 15, 8, "W"); for (let k = 0; k < 3; k++) c.hline(dx - 2, dy - 14 + k * 2, 5, "W")
      c.line(dx, dy - 7, dx - 2, dy - 1, "W"); c.line(dx, dy - 7, dx + 2, dy - 1, "W")
      // ruka vzhůru k provázku zvonku, zvonek pod stříškou
      c.line(dx + 1, dy - 14, dx + 4, dy - 24, "W"); c.vline(dx + 4, dy - 34, 10, "h")
      c.rect(dx + 2, dy - 38, 5, 4, "Y"); c.px(dx + 4, dy - 34, "y")
      c.line(dx - 1, dy - 14, dx - 4, dy - 9, "W"); c.rect(dx - 6, dy - 9, 3, 4, "y")
    }
    // kalendářní deska napůl pod hladinou, porostlá řasou
    const cv = 6
    c.clip((x, y) => y < oy - (x - ox) / 2 - 1, () => {
      c.poly(disc(Tr, cu, cv, 32, 48), "O"); c.poly(disc(Tr, cu, cv, 29, 48), "C")
      c.poly(disc(Tr, cu, cv, 13, 32), "Y"); c.poly(disc(Tr, cu, cv, 7, 24), "O")
      for (let i = 0; i < 12; i++) { const t = i / 12 * Math.PI * 2; c.line(...Tr(cu + 13 * Math.cos(t), cv + 13 * Math.sin(t)), ...Tr(cu + 29 * Math.cos(t), cv + 29 * Math.sin(t)), "O") }
      for (let i = 0; i < 12; i++) { const t = (i + 0.5) / 12 * Math.PI * 2; c.px(...Tr(cu + 22 * Math.cos(t), cv + 22 * Math.sin(t)).map(rd), "y") }
    })
    flood(TrW, tA0, tA1, "cCe93Qjbnk")
    flood(Tl, tD0, tD1, "cCe")
    // lucerna na rameni vpravo od Orloje
    {
      const [lx, ly] = Tr(cu + 36, 214).map(rd)
      c.line(lx, ly, lx + 10, ly - 5, "M"); c.vline(lx + 10, ly - 5, 6, "M")
      c.rect(lx + 7, ly + 1, 7, 9, "k"); c.rect(lx + 8, ly + 2, 5, 7, "f"); c.rect(lx + 9, ly + 4, 3, 3, "F")
      c.rect(lx + 6, ly, 9, 2, "M"); c.rect(lx + 6, ly + 10, 9, 1, "M")
    }
    // provazový žebřík z otevřeného okénka apoštolů dolů k hladině, loďkař k němu váže loďku
    {
      const [x0, y0] = Tr(cu - 24, 148).map(rd), [x1, y1] = Tr(cu - 30, 0).map(rd)
      c.line(x0, y0, x1, y1 - 2, "4"); c.line(x0 + 6, y0 - 3, x1 + 6, y1 - 5, "4")
      for (let t = 0.06; t < 1; t += 0.08) {
        const xa = rd(x0 + (x1 - x0) * t), ya = rd(y0 + (y1 - y0) * t)
        c.line(xa, ya, xa + 6, ya - 3, "h")
      }
    }

    }

    // --- DOMY RADNICE (od východu k západu, bližší přes vzdálenější) ---
    // dům: hmota, střecha se sklonem k jihu, okna dvou pater nad vodou
    const house = (a0, a1, h, fr, fl, roof) => {
      box(a0, a1, 0, lenL, 0, h, fl, fr)
      // sedlová střecha s hřebenem podél a, štít do západu
      poly(roof[0], [a0, 0, h], [a1, 0, h], [a1, lenL / 2, h + 96], [a0, lenL / 2, h + 96])
      poly(fl, [a0, 0, h], [a0, lenL, h], [a0, lenL / 2, h + 96])
      for (let t = 0.15; t < 1; t += 0.15) c.line(...p(a0, lenL / 2 * t, h + 96 * t), ...p(a1, lenL / 2 * t, h + 96 * t), roof[1])
      c.line(...p(a0, 0, h), ...p(a1, 0, h), "k")
      c.line(...p(a0, lenL / 2, h + 96), ...p(a1, lenL / 2, h + 96), "s", 2)
      quad(FRd(0), a0, a1, h - 6, h, "W")
    }
    const Fr = FRd(0), Fw = FLa(0)
    // Křížův dům: šedý kámen, velké renesanční okno s nápisem PRAGA CAPUT REGNI, nad ním znak
    house(250, tA0, 226, "t", "z", ["D", "d"])
    win(Fr, 270, 300, 70, 112, winCol(), "z"); win(Fr, 368, 396, 70, 112, "H", "z")
    win(Fr, 270, 300, 150, 184, winCol(), "z"); win(Fr, 368, 396, 150, 184, winCol(), "z")
    {
      const u0 = 312, u1 = 356
      quad(Fr, u0 - 8, u1 + 8, 62, 196, "W")
      quad(Fr, u0 - 4, u1 + 4, 66, 186, "z")
      quad(Fr, u0, u1, 70, 170, "k")
      // kamenná kružba: dva sloupky, příčle, půlkruhový nadsvětlík; sklo z větší části vypadané
      for (const u of [u0 + 14, u0 + 30]) quad(Fr, u, u + 2, 70, 170, "z")
      for (const v of [104, 138]) quad(Fr, u0, u1, v, v + 2, "z")
      quad(Fr, u0 + 2, u0 + 14, 140, 168, "L"); quad(Fr, u0 + 32, u1 - 2, 72, 102, "n")
      c.line(...Fr(u0 + 3, 150), ...Fr(u0 + 10, 160), "l")
      c.clip([...Fr(u0 - 10, 170), ...Fr(u1 + 10, 170), ...Fr(u1 + 10, 200), ...Fr(u0 - 10, 200)], () => { c.poly(disc(Fr, (u0 + u1) / 2, 170, 22, 24), "z"); c.poly(disc(Fr, (u0 + u1) / 2, 170, 18, 24), "n") })
      quad(Fr, u0 - 4, u1 + 4, 166, 172, "W")
      wallText(c, FR, ox, oy, u0 - 6, 200, "PRAGA CAPUT REGNI", "y", { sc: 1, outline: "3" })
      // znak Starého Města nad nápisem
      quad(Fr, (u0 + u1) / 2 - 7, (u0 + u1) / 2 + 7, 210, 222, "V"); quad(Fr, (u0 + u1) / 2 - 3, (u0 + u1) / 2 + 3, 212, 220, "y")
    }
    streaks(Fr, 250, tA0, 218, 18, "T", 70)
    flood(Fr, 250, tA0, "tzWLnkHh")
    // Mikešův dům: okrový, podloubí z arkád (zbytek oblouků nad vodou), renesanční okna
    house(170, 250, 212, "C", "c", ["D", "d"])
    for (let u = 176; u < 244; u += 24) { c.poly([...Fr(u, 0), ...Fr(u + 18, 0), ...Fr(u + 18, 34), ...Fr(u + 9, 46), ...Fr(u, 34)], "k"); c.line(...Fr(u, 34), ...Fr(u + 9, 46), "c") }
    for (let u = 180; u < 244; u += 22) { win(Fr, u, u + 12, 76, 104, winCol(), "c"); win(Fr, u, u + 12, 140, 166, winCol(), "c") }
    quad(Fr, 170, 250, 118, 122, "c")
    streaks(Fr, 170, 250, 204, 12, "e", 60)
    flood(Fr, 170, 250, "CckWnLHh")
    // U Kohouta: lososový, renesanční štít do náměstí
    house(90, 170, 196, "8", "0", ["D", "d"])
    for (let u = 98; u < 164; u += 24) { win(Fr, u, u + 14, 74, 102, winCol(), "0"); win(Fr, u, u + 14, 132, 160, winCol(), "0") }
    c.poly([...Fr(98, 196), ...Fr(162, 196), ...Fr(162, 220), ...Fr(150, 226), ...Fr(146, 244), ...Fr(114, 244), ...Fr(110, 226), ...Fr(98, 220)], "8")
    c.poly([...Fr(126, 244), ...Fr(134, 244), ...Fr(130, 256)], "8")
    win(Fr, 123, 137, 208, 232, "k", "0")
    c.line(...Fr(98, 220), ...Fr(110, 226), "0"); c.line(...Fr(150, 226), ...Fr(162, 220), "0")
    streaks(Fr, 90, 170, 190, 10, "r", 60)
    flood(Fr, 90, 170, "80kWnLHh")
    // U Minuty: bělavý se sgrafity (kvádry a figury), štít do západu, nároží na náměstí
    house(0, 90, 204, "v", "w", ["d", "D"])
    for (let u = 8; u < 84; u += 26) { win(Fr, u, u + 14, 76, 104, winCol(), "W"); win(Fr, u, u + 14, 138, 164, winCol(), "W") }
    for (let u = 30; u < 230; u += 34) { win(Fw, u, u + 14, 76, 104, winCol(), "W"); win(Fw, u, u + 14, 138, 164, winCol(), "W") }
    // sgrafito: pásy figur mezi patry a kosočtverce pod římsou
    const sgr = (F, u0, u1, v0, v1) => {
      for (let u = u0; u < u1; u += 9) {
        quad(F, u + 2, u + 5, v0 + 2, v0 + 12, "x"); c.px(...F(u + 3.5, v0 + 15).map(rd), "x")
        c.line(...F(u + 1, v0 + 6), ...F(u + 6, v0 + 9), "x")
      }
      c.line(...F(u0, v0), ...F(u1, v0), "x"); c.line(...F(u0, v1), ...F(u1, v1), "x")
    }
    sgr(Fr, 4, 86, 112, 130); sgr(Fw, 6, 250, 112, 130)
    for (let u = 4; u < 86; u += 10) c.poly([...Fr(u, 180), ...Fr(u + 5, 186), ...Fr(u + 10, 180), ...Fr(u + 5, 174)], "x")
    for (let u = 6; u < 250; u += 10) c.poly([...Fw(u, 180), ...Fw(u + 5, 186), ...Fw(u + 10, 180), ...Fw(u + 5, 174)], "x")
    // štít do západu: okénko na půdu a sgrafito
    win(Fw, lenL / 2 - 8, lenL / 2 + 8, 230, 252, "k", "W")
    streaks(Fw, 4, lenL - 4, 200, 20, "x", 50); streaks(Fr, 0, 90, 198, 10, "x", 50)
    flood(Fr, 0, 90, "vwxWnLkHh"); flood(Fw, 0, lenL, "vwxWnLkHh")
    // plevel na římsách, saze z požáru nad oknem Křížova domu
    for (let a = 0; a < tA0; a += 3) if (rng() < 0.3) { const [x, y] = p(a, 0, a < 90 ? 204 : a < 170 ? 196 : a < 250 ? 212 : 226); c.vline(rd(x), rd(y) - 3, 2 + Math.floor(rng() * 4), rng() < 0.5 ? "G" : "g") }
    c.clip((x, y) => c.is(x, y, "tzW"), () => c.shade([...Fr(300, 186), ...Fr(370, 186), ...Fr(380, 226), ...Fr(290, 226)], 1, 0.5))
    // díra ve střeše Mikešova domu
    c.poly([...p(196, 40, 232), ...p(226, 34, 238), ...p(232, 70, 256), ...p(204, 78, 254)], "k")
    c.line(...p(204, 40, 234), ...p(208, 76, 254), "H"); c.line(...p(218, 37, 236), ...p(222, 74, 256), "H")
    // vypadané tašky a záplaty z plechu na střechách
    for (let i = 0; i < 26; i++) { const a = 8 + rng() * (tA0 - 30), t = 0.1 + rng() * 0.75, h = (a < 90 ? 204 : a < 170 ? 196 : a < 250 ? 212 : 226) + 96 * t; const [x, y] = p(a, lenL / 2 * t, h).map(rd); const r = rng(); c.rect(x, y, 4 + rd(rng() * 6), 2, r < 0.5 ? "k" : r < 0.75 ? "H" : "s") }
    for (let a = 0; a < tA0; a += 2) if (rng() < 0.5) { const h = a < 90 ? 204 : a < 170 ? 196 : a < 250 ? 212 : 226; const [x, y] = p(a, 0, h - 6).map(rd); c.vline(x, y, 3 + rd(rng() * 22), rng() < 0.6 ? "3" : "U") }
  }, glow("fF", { r: 10, strength: 0.6 }))
}
radRadnice("lm_radnice", { w: 9, dpt: 4, seed: 5 })

sheet("landmarks_sm_radnice", ["lm_radnice"], { pad: 1 })
