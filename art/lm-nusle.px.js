// Nuselák: landmarky u konců Nuselského mostu. Palác kultury (Kongresové centrum, 1981) a hotel Forum (dnes Corinthia,
// 1988) na vyšehradském konci, Muzeum Policie v bývalém augustiniánském klášteře u Karlova na severním konci.
// Předloha: fotky z Wikimedia Commons (Category:Prague Congress Centre, Category:Corinthia Hotel Prague,
// Category:Muzeum Policie České republiky), jen jako předloha, neobkreslováno.
// Geometrie jako namKinsky (art/lm-namesti.px.js): plátno FT × (w + dpt) široké, počátek v nejbližším spodním rohu
// (ox = FT × dpt, oy = spodek plátna), bod p(a, d, h): a podél osy a (pravá stěna, +b, k divákovi), d napříč (levá
// stěna, −a, na sever), h výška. Světlo zleva: levé stěny světlejší. Po tom, co se stalo: vybitá skla, saze z oken,
// rez, plevel na římsách, nic čistého.

// Nástroje nad plátnem: body, stěny, kvádry, stékance, písmena v rovině stěny (písmo FONT57 z art/buildings.px.js).
function nusKit(c, ox, oy, rng) {
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
  const streaks = (F, u0, u1, v, n, col, maxLen = 40) => {
    for (let i = 0; i < n; i++) { const [x, y] = F(u0 + rng() * (u1 - u0), v); c.vline(r(x), r(y), 4 + Math.floor(rng() * maxLen), col) }
  }
  // nápis v rovině stěny: u, vTop levý horní roh, s velikost bodu písma
  const letters = (F, u, vTop, text, s, col, edge) => {
    for (const ch of text) {
      const d = ch.normalize("NFD"), g = FONT57[d[0]]
      if (g) for (let gy = 0; gy < 7; gy++) for (let gx = 0; gx < 5; gx++) if (g[gy * 5 + gx] === "1") {
        if (edge) quad(F, u + gx * s - 1, u + (gx + 1) * s + 1, vTop - (gy + 1) * s - 1, vTop - gy * s + 1, edge)
      }
      if (g) for (let gy = 0; gy < 7; gy++) for (let gx = 0; gx < 5; gx++) if (g[gy * 5 + gx] === "1") quad(F, u + gx * s, u + (gx + 1) * s, vTop - (gy + 1) * s, vTop - gy * s, col)
      // čárka nad písmenem
      if (d.length > 1) quad(F, u + 2 * s, u + 4 * s, vTop + s, vTop + 2 * s, col)
      u += 6 * s
    }
  }
  return { r, p, poly, FLa, FRd, quad, box, streaks, letters }
}

// Palác kultury: obří brutalistní blok na podnoži. Podnož s vyvýšenou plošinou, schodiště k divákovi, řada prázdných
// stožárů na vlajky; nad ní ustoupená hlavní hmota s pásy tónovaného bronzového skla mezi betonovými římsami, nahoře
// atika s nápisem PALÁC KULTURY. Rozbité panely, saze z vyhořelých sálů, rez z kotev, plevel na římsách.
function nusKcp(name, o) {
  const w = o.w, dpt = o.dpt
  const lenR = 64 * w, lenL = 64 * dpt
  const W = 64 * (w + dpt), Hc = 32 * (w + dpt) + 400
  const ox = 64 * dpt, oy = Hc - 1
  sprite(name, { w: W, h: Hc }, (c) => {
    const rng = c.rng(o.seed ?? 1)
    const { r, p, poly, FLa, FRd, quad, box, streaks, letters } = nusKit(c, ox, oy, rng)
    const POD = 44                          // podnož
    const A0 = 70, A1 = lenR - 30, D0 = 110, D1 = lenL - 40, TOP = 300
    // podnož a plošina
    box(0, lenR, 0, lenL, 0, POD, "q", "P", "p")
    poly("x", [0, 0, POD], [lenR, 0, POD], [lenR, D0, POD], [0, D0, POD])
    c.noise(0, 0, W, Hc, "v", 0.04, 3, "x")
    // schodiště v podnoži k divákovi (+b) a jeho stupně
    const S0 = 260, S1 = 620
    for (let v = 0; v < POD; v += 5) { quad(FRd(0), S0, S1, v, v + 2, "v"); quad(FRd(0), S0, S1, v + 2, v + 5, "x") }
    quad(FRd(0), S0 - 6, S0, 0, POD, "A"); quad(FRd(0), S1, S1 + 6, 0, POD, "A")
    // hlavní hmota
    const FL = FLa(A0), FR = FRd(D0)
    box(A0, A1, D0, D1, POD, TOP, "p", "P")
    // pásy: betonová římsa 10 px, sklo 36 px; levá stěna světlejší
    const band = (F, u0, u1, lit) => {
      for (let v = POD + 6, row = 0; v < TOP - 40; v += 46, row++) {
        quad(F, u0, u1, v, v + 36, lit ? "O" : "H")
        // příčle a odlesky
        for (let u = u0; u < u1; u += 16) {
          c.line(...F(u, v), ...F(u, v + 36), "k")
          const t = rng()
          if (t < 0.13) quad(F, u + 1, Math.min(u1, u + 15), v + 1, v + 35, "n")          // vypadlý panel, tma uvnitř
          else if (t < 0.22) { quad(F, u + 1, Math.min(u1, u + 15), v + 1, v + 35, "k"); c.line(...F(u + 2, v + 30), ...F(u + 12, v + 6), lit ? "Y" : "O") } // rozbitý
          else if (t < 0.32) c.line(...F(u + 3, v + 33), ...F(u + 9, v + 20), lit ? "Y" : "O")                // odlesk
        }
        quad(F, u0, u1, v + 36, v + 46, lit ? "q" : "P")
        quad(F, u0, u1, v + 36, v + 37, "k")
        // plevel na římse
        for (let i = 0; i < 6; i++) { const [x, y] = F(u0 + rng() * (u1 - u0), v + 46); c.vline(r(x), r(y) - 2, 3, rng() < 0.5 ? "g" : "G") }
      }
    }
    band(FL, D0, D1, true)
    band(FR, A0, A1, false)
    // atika s nápisem
    quad(FL, D0, D1, TOP - 40, TOP, "q"); quad(FR, A0, A1, TOP - 40, TOP, "p")
    quad(FR, A0, A1, TOP - 40, TOP - 38, "k")
    // střecha: tmavý asfaltový pás s loužemi, světlíky, uprostřed vyšší hmota velkého sálu se svým pásem skla
    poly("a", [A0, D0, TOP], [A1, D0, TOP], [A1, D1, TOP], [A0, D1, TOP])
    c.noise(0, 0, W, Hc, "A", 0.18, 5, "a")
    for (let a = A0 + 30; a < A1 - 40; a += 70) for (let d = D0 + 40; d < D1 - 40; d += 120) if (rng() < 0.6) { poly("x", [a, d, TOP], [a + 30, d, TOP], [a + 30, d + 60, TOP], [a, d + 60, TOP]); if (rng() < 0.4) poly("k", [a + 4, d + 6, TOP], [a + 26, d + 6, TOP], [a + 26, d + 54, TOP], [a + 4, d + 54, TOP]) }
    for (let i = 0; i < 8; i++) { const [x, y] = p(A0 + 40 + rng() * (A1 - A0 - 80), D0 + 40 + rng() * (D1 - D0 - 80), TOP); c.ellipse(r(x), r(y), 10 + r(rng() * 18), 3, "A") }
    const HA0 = A0 + 180, HA1 = A1 - 160, HD0 = D0 + 260, HD1 = D1 - 200, HT = TOP + 90
    box(HA0, HA1, HD0, HD1, TOP, HT, "p", "P", "x")
    quad(FLa(HA0), HD0, HD1, TOP + 30, TOP + 70, "O"); quad(FRd(HD0), HA0, HA1, TOP + 30, TOP + 70, "H")
    for (let u = HD0; u < HD1; u += 20) c.line(...FLa(HA0)(u, TOP + 30), ...FLa(HA0)(u, TOP + 70), "k")
    for (let u = HA0; u < HA1; u += 20) { c.line(...FRd(HD0)(u, TOP + 30), ...FRd(HD0)(u, TOP + 70), "k"); if (rng() < 0.3) quad(FRd(HD0), u + 1, u + 19, TOP + 31, TOP + 69, "n") }
    box(HA0 + 60, HA0 + 160, HD0 + 80, HD0 + 220, HT, HT + 26, "v", "x", "p")
    // saze nad vyhořelými sály a rezavé stékance z kotev
    for (let i = 0; i < 5; i++) {
      const u = A0 + 40 + rng() * (A1 - A0 - 100), v = POD + 6 + 46 * Math.floor(rng() * 5)
      quad(FR, u, u + 32, v, v + 36, "n")
      const [x, y] = FR(u + 4, v + 36); for (let k = 0; k < 6; k++) c.vline(r(x) + k * 4, r(y) - 30 - k * 3, 30 + k * 3, "k")
    }
    streaks(FR, A0, A1, TOP - 40, 18, "U", 50); streaks(FL, D0, D1, TOP - 40, 14, "U", 50)
    // nápis na atice až po sazích, ať zůstane čitelný
    letters(FR, A0 + 40, TOP - 6, "PALÁC KULTURY", 5, "w", "A")
    // stožáry na plošině: řada, některé ohnuté, zbytky vlajek
    for (let a = 40, i = 0; a < lenR - 20; a += 56, i++) {
      const [x, y] = p(a, 40, POD)
      if (i % 4 === 2) { c.line(r(x), r(y), r(x) + 22, r(y) - 50, "m"); continue }
      c.vline(r(x), r(y) - 96, 96, "m"); c.px(r(x), r(y) - 97, "W")
      if (i % 3 === 0) c.poly([r(x) + 1, r(y) - 94, r(x) + 14, r(y) - 90, r(x) + 9, r(y) - 84, r(x) + 1, r(y) - 86], i % 2 ? "V" : "b")
    }
    // tmavý vstup pod plošinou vlevo a zábradlí plošiny
    quad(FRd(0), 80, 200, 6, 36, "k"); for (let u = 84; u < 200; u += 12) c.line(...FRd(0)(u, 6), ...FRd(0)(u, 36), "A")
    for (let a = 0; a < lenR; a += 8) c.line(...p(a, 0, POD), ...p(a, 0, POD + 8), "M")
    c.line(...p(0, 0, POD + 8), ...p(lenR, 0, POD + 8), "M")
  })
}

// Hotel Forum: štíhlá deska o 24 patrech na nízké podnoži. Světlý beton, tmavé pásy oken, nahoře strojovna a rám
// s písmeny FORUM (U visí nakřivo), zlomená anténa. Většina oken vybitá, v pár patrech hoří oheň a nad ním saze.
function nusForum(name, o) {
  const w = o.w, dpt = o.dpt
  const lenR = 64 * w, lenL = 64 * dpt
  const W = 64 * (w + dpt), Hc = 32 * (w + dpt) + 780
  const ox = 64 * dpt, oy = Hc - 1
  sprite(name, { w: W, h: Hc }, (c) => {
    const rng = c.rng(o.seed ?? 2)
    const { r, p, poly, FLa, FRd, quad, box, streaks, letters } = nusKit(c, ox, oy, rng)
    const POD = 52, FLOORS = 24, FH = 26
    const A0 = 120, A1 = 320, D0 = 40, D1 = lenL - 40, TOP = POD + FLOORS * FH
    // podnož: tmavé sklo přízemí, betonová deska
    box(0, lenR, 0, lenL, 0, POD, "v", "x", "p")
    quad(FLa(0), 0, lenL, 6, POD - 14, "n"); quad(FRd(0), 0, lenR, 6, POD - 14, "N")
    for (let u = 0; u < lenL; u += 24) c.line(...FLa(0)(u, 6), ...FLa(0)(u, POD - 14), "A")
    for (let u = 0; u < lenR; u += 24) c.line(...FRd(0)(u, 6), ...FRd(0)(u, POD - 14), "k")
    poly("x", [0, 0, POD], [lenR, 0, POD], [lenR, lenL, POD], [0, lenL, POD])
    // věž
    const FL = FLa(A0), FR = FRd(D0)
    box(A0, A1, D0, D1, POD, TOP, "w", "v")
    const floors = (F, u0, u1, lit) => {
      for (let f = 0; f < FLOORS; f++) {
        const v = POD + f * FH + 8
        quad(F, u0 + 6, u1 - 6, v, v + 12, lit ? "x" : "A")
        for (let u = u0 + 6; u < u1 - 6; u += 14) {
          const t = rng()
          if (t < 0.45) quad(F, u + 1, Math.min(u1 - 6, u + 13), v + 1, v + 11, "k")        // vybité okno
          else if (t < 0.475) { quad(F, u + 1, Math.min(u1 - 6, u + 13), v + 2, v + 11, "F"); quad(F, u + 3, Math.min(u1 - 6, u + 10), v + 5, v + 11, "f") } // oheň
          c.line(...F(u, v), ...F(u, v + 12), lit ? "v" : "x")
        }
        quad(F, u0, u1, v + 12, v + 13, lit ? "W" : "w")
      }
    }
    floors(FL, D0, D1, true)
    floors(FR, A0, A1, false)
    // saze nad ohněm a vybitými patry
    for (let i = 0; i < 9; i++) {
      const F = rng() < 0.6 ? FL : FR, u0 = F === FL ? D0 : A0, u1 = F === FL ? D1 : A1
      const u = u0 + 10 + rng() * (u1 - u0 - 40), v = POD + Math.floor(rng() * FLOORS) * FH + 20
      for (let k = 0; k < 5; k++) quad(F, u + k * 3, u + k * 3 + 2, v, v + 18 + k * 4 + rng() * 20, "A")
    }
    streaks(FL, D0, D1, TOP, 22, "x", 120); streaks(FR, A0, A1, TOP, 10, "A", 120)
    // střecha, strojovna
    poly("x", [A0, D0, TOP], [A1, D0, TOP], [A1, D1, TOP], [A0, D1, TOP])
    box(A0 + 40, A1 - 40, D0 + 120, D1 - 160, TOP, TOP + 34, "v", "x", "p")
    // rám s písmeny FORUM na střeše (v rovině +b stěny, ustoupený), U visí nakřivo
    const FS = FRd(D0 + 60), SV = TOP + 34 + 50
    c.line(...FS(A0 + 4, TOP), ...FS(A0 + 4, SV + 4), "M"); c.line(...FS(A1 - 4, TOP), ...FS(A1 - 4, SV + 4), "M")
    c.line(...FS(A0 + 4, SV + 4), ...FS(A1 - 4, SV + 4), "M"); c.line(...FS(A0 + 4, TOP + 10), ...FS(A1 - 4, TOP + 10), "M")
    letters(FS, A0 + 12, SV, "FOR", 6, "W", "k")
    letters(FS, A0 + 12 + 4 * 36, SV, "M", 6, "W", "k")
    // U: utržené z rámu, visí za levý horní roh, pravá strana klesá
    const gU = FONT57.U, uU = A0 + 12 + 3 * 36
    for (let gy = 0; gy < 7; gy++) for (let gx = 0; gx < 5; gx++) if (gU[gy * 5 + gx] === "1") {
      const drop = gx * 6 * 0.9 + 4
      quad(FS, uU + gx * 6 - 1, uU + (gx + 1) * 6 + 1, SV - (gy + 1) * 6 - drop - 1, SV - gy * 6 - drop + 1, "k")
      quad(FS, uU + gx * 6, uU + (gx + 1) * 6, SV - (gy + 1) * 6 - drop, SV - gy * 6 - drop, "W")
    }
    c.line(...FS(uU + 2, SV + 4), ...FS(uU + 2, SV - 4), "M")
    // zlomená anténa
    const [ax, ay] = p(A1 - 60, D1 - 80, TOP + 34)
    c.vline(r(ax), r(ay) - 70, 70, "M"); c.line(r(ax), r(ay) - 70, r(ax) + 34, r(ay) - 52, "M"); c.line(r(ax) + 34, r(ay) - 52, r(ax) + 40, r(ay) - 30, "m")
    for (let k = 1; k < 4; k++) c.hline(r(ax) - 6, r(ay) - k * 18, 12, "m")
  }, glow("fF", { r: 10, strength: 0.6 }))
}

// Muzeum Policie: barokní křídlo kláštera u Karlova, tři patra okrové omítky, která opadává na cihly, valbová střecha
// z tašek. Vchod na +b stěně u severního konce, nad ním cedule MUZEUM POLICIE, u dveří stará modrá policejní lampa
// a modrobílý pruh. Za střechou vykukuje kupole kostela na Karlově.
function nusPolicie(name, o) {
  const w = o.w, dpt = o.dpt
  const lenR = 64 * w, lenL = 64 * dpt
  const W = 64 * (w + dpt), Hc = 32 * (w + dpt) + 380
  const ox = 64 * dpt, oy = Hc - 1
  sprite(name, { w: W, h: Hc }, (c) => {
    const rng = c.rng(o.seed ?? 3)
    const { r, p, poly, FLa, FRd, quad, box, streaks, letters } = nusKit(c, ox, oy, rng)
    const H = 156, eave = H + 10, ridge = H + 96, inset = 100
    // kupole Karlova za střechou (vzadu, kreslí se první; buben jde až k zemi, zakryje ho budova)
    const [kx, ky] = p(lenR - 60, lenL - 60, 0)
    c.rect(r(kx) - 34, r(ky) - 330, 68, 330, "e"); c.rect(r(kx), r(ky) - 330, 34, 330, "3")
    for (let v = 40; v < 330; v += 60) c.hline(r(kx) - 34, r(ky) - v, 68, "4")
    c.ellipse(r(kx), r(ky) - 330, 40, 44, "Q"); c.ellipse(r(kx) - 10, r(ky) - 342, 22, 26, "j")
    c.rect(r(kx) - 8, r(ky) - 392, 16, 22, "e"); c.poly([r(kx) - 12, r(ky) - 390, r(kx), r(ky) - 422, r(kx) + 12, r(ky) - 390], "Q"); c.vline(r(kx), r(ky) - 434, 14, "Y")
    // hlavní hmota
    const FL = FLa(0), FR = FRd(0)
    box(0, lenR, 0, lenL, 0, H, "C", "e")
    // opadaná omítka: cihly
    for (let i = 0; i < 10; i++) {
      const F = rng() < 0.5 ? FL : FR, U = F === FL ? lenL : lenR
      const u = rng() * (U - 50), v = 10 + rng() * (H - 40), uw = 16 + rng() * 36, vh = 10 + rng() * 22
      quad(F, u, u + uw, v, v + vh, F === FL ? "r" : "R")
      for (let vv = v + 3; vv < v + vh; vv += 4) quad(F, u + 1, u + uw - 1, vv, vv + 1, "D")
    }
    // patra: sokl, kordonové římsy, okna se šambránami
    const storey = (F, U, lit) => {
      quad(F, 0, U, 0, 14, lit ? "4" : "3")
      ;[[56, 60], [106, 110]].forEach(([v0, v1]) => quad(F, 0, U, v0, v1, lit ? "c" : "C"))
      quad(F, 0, U, H - 8, H, lit ? "c" : "C"); quad(F, 0, U, H - 9, H - 8, "3")
      for (let u = 30; u < U - 30; u += 54) for (const [v0, v1] of [[22, 48], [68, 98], [118, 146]]) {
        quad(F, u - 2, u + 22, v0 - 2, v1 + 3, lit ? "c" : "C")
        const t = rng()
        quad(F, u, u + 20, v0, v1, t < 0.5 ? "k" : t < 0.8 ? "n" : "H")
        if (t >= 0.5 && t < 0.8) { c.line(...F(u + 10, v0), ...F(u + 10, v1), lit ? "C" : "e"); c.line(...F(u, (v0 + v1) / 2), ...F(u + 20, (v0 + v1) / 2), lit ? "C" : "e") }
        if (t >= 0.8) for (let k = 0; k < 3; k++) c.line(...F(u, v0 + 6 + k * 9), ...F(u + 20, v0 + 4 + k * 9), "h")   // zatlučené prkny
      }
    }
    storey(FL, lenL, true)
    storey(FR, lenR, false)
    // vchod u severního konce +b stěny, portál, cedule, modrobílý pruh, policejní lampa
    const E0 = 40, E1 = 104
    quad(FR, E0 - 8, E1 + 8, 0, 56, "c"); quad(FR, E0, E1, 0, 48, "k"); quad(FR, E0 + 4, (E0 + E1) / 2 - 1, 0, 44, "H"); quad(FR, (E0 + E1) / 2 + 1, E1 - 4, 0, 44, "H")
    quad(FR, E0 - 30, E0 + 152, 56, 76, "b"); quad(FR, E0 - 30, E0 + 152, 56, 57, "k")
    letters(FR, E0 - 25, 73, "MUZEUM POLICIE", 2, "W")
    quad(FR, 0, lenR, 16, 20, "b"); quad(FR, 0, lenR, 20, 22, "w")
    const [lx, ly] = FR(E0 - 18, 50)
    c.vline(r(lx), r(ly), 16, "M"); c.rect(r(lx) - 5, r(ly) - 12, 10, 12, "b"); c.rect(r(lx) - 3, r(ly) - 10, 6, 6, "l"); c.hline(r(lx) - 6, r(ly) - 13, 12, "k")
    streaks(FR, 0, lenR, H - 9, 14, "3", 50); streaks(FL, 0, lenL, H - 9, 12, "e", 50)
    // střecha: čtyři křídla kolem rajského dvora, sedlové střechy z tašek; zadní křídla, dvůr, přední křídla
    const WW = 150, RH = 56
    const wing = (a0, a1, d0, d1, axis) => {
      if (axis === "a") {
        const dm = (d0 + d1) / 2
        poly("R", [a0, dm, H + RH], [a1, dm, H + RH], [a1, d1, H], [a0, d1, H])
        poly("D", [a0, d0, H], [a1, d0, H], [a1, dm, H + RH], [a0, dm, H + RH])
        poly("C", [a0, d0, H], [a0, d1, H], [a0, dm, H + RH])
        for (let a = a0 + 12; a < a1; a += 14) c.line(...p(a, d0, H), ...p(a, dm, H + RH), "R")
      } else {
        const am = (a0 + a1) / 2
        poly("R", [am, d0, H + RH], [am, d1, H + RH], [a1, d1, H], [a1, d0, H])
        poly("d", [a0, d0, H], [a0, d1, H], [am, d1, H + RH], [am, d0, H + RH])
        poly("e", [a0, d0, H], [a1, d0, H], [am, d0, H + RH])
        for (let d = d0 + 12; d < d1; d += 14) c.line(...p(a0, d, H), ...p(am, d, H + RH), "D")
      }
    }
    wing(lenR - WW, lenR, 0, lenL, "d")
    wing(0, lenR, lenL - WW, lenL, "a")
    // rajský dvůr: dno a vnitřní stěny obrácené k divákovi, okna, zarostlé
    poly("x", [WW, WW, 0], [lenR - WW, WW, 0], [lenR - WW, lenL - WW, 0], [WW, lenL - WW, 0])
    quad(FRd(lenL - WW), WW, lenR - WW, 0, H, "e"); quad(FLa(lenR - WW), WW, lenL - WW, 0, H, "C")
    for (let u = WW + 20; u < lenR - WW - 20; u += 40) quad(FRd(lenL - WW), u, u + 16, 70, 96, "k")
    for (let u = WW + 20; u < lenL - WW - 20; u += 40) quad(FLa(lenR - WW), u, u + 16, 70, 96, "n")
    c.noise(0, 0, W, Hc, "G", 0.3, 9, "x")
    wing(0, WW, 0, lenL, "d")
    wing(0, lenR, 0, WW, "a")
    // díra v předním křídle pod plachtou, komíny
    const Rs = (a, t) => p(a, t * WW / 2, H + t * RH)
    c.poly([...Rs(230, 0.15), ...Rs(300, 0.15), ...Rs(296, 0.85), ...Rs(226, 0.8)], "b")
    for (let a = 236; a < 296; a += 10) c.line(...Rs(a, 0.18), ...Rs(a - 2, 0.8), "n")
    ;[[120, 60], [360, 60]].forEach(([a, d]) => box(a, a + 14, d, d + 14, H + 20, H + RH + 14, "r", "R", "k"))
    // okap a plevel
    for (let i = 0; i < 10; i++) { const [x, y] = FR(rng() * lenR, H); c.vline(r(x), r(y) - 3, 3, "g") }
  }, glow("l", { r: 6, strength: 0.5 }))
}

// Stanice Vyšehrad: hala je pod silnicí u jižního konce mostu (čelo ke svahu kreslí art/nuselak-most.px.js, díly
// ns_st_*). Tady je díra ve vozovce nad halou, plochá: propadlým stropem je vidět kolej, nástupiště se žlutým pruhem,
// tabule stanice a vůz, který nedojel. Dno je o H níž než vozovka (h = H je úroveň silnice).
function nusVysehrad(name, o) {
  const w = o.w, dpt = o.dpt
  const lenR = 64 * w, lenL = 64 * dpt
  const W = 64 * (w + dpt), Hc = 32 * (w + dpt) + 4
  const ox = 64 * dpt, oy = Hc - 1
  sprite(name, { w: W, h: Hc }, (c) => {
    const rng = c.rng(o.seed ?? 4)
    const { r, p, poly, FLa, FRd, quad, box, streaks, letters } = // strop haly je v úrovni mostovky a země (h = H), nástupiště a koleje jsou o H níž: počátek je posunutý o H dolů
    nusKit(c, ox, oy + 46, rng)
    const H = 46
    // díra ve stropě: A0–A1 podél, D0–D1 napříč; dno je o H níž, takže je vidět od A0 + H a D0 + H dál
    const A0 = 4, A1 = lenR - 4, D0 = 4, D1 = lenL - 4
    poly("k", [A0, D0, H], [A1, D0, H], [A1, D1, H], [A0, D1, H])
    // dno: štěrk kolejiště
    poly("A", [A0 + H, D0 + H, 0], [A1, D0 + H, 0], [A1, D1, 0], [A0 + H, D1, 0])
    // koleje podél a: pražce a dvě kolejnice
    const R0 = D0 + H + 8, R1 = R0 + 18
    for (let a = A0 + H + 6; a < A1 - 4; a += 10) poly("U", [a, R0 - 4, 0], [a + 3, R0 - 4, 0], [a + 3, R1 + 4, 0], [a, R1 + 4, 0])
    for (const d of [R0, R1]) { c.line(...p(A0 + H, d, 0).map(r), ...p(A1, d, 0).map(r), "m"); c.line(...p(A0 + H + 2, d + 1, 0).map(r), ...p(A1, d + 1, 0).map(r), "M") }
    // přívodní kolejnice
    c.line(...p(A0 + H, R1 + 8, 0).map(r), ...p(A1, R1 + 8, 0).map(r), "u")
    // nástupiště u zadní stěny: čelo, plocha, žlutý pruh
    const PD = R1 + 16, PH = 9
    quad(FRd(PD), A0 + H - PH, A1, 0, PH, "P")
    poly("5", [A0 + H - PH, PD, PH], [A1, PD, PH], [A1, D1, PH], [A0 + H - PH, D1, PH])
    for (let a = A0 + H; a < A1; a += 14) c.line(...p(a, PD + 7, PH).map(r), ...p(a, D1, PH).map(r), "6")
    for (let i = 0; i < 9; i++) { const [x, y] = p(A0 + H + rng() * (A1 - A0 - H - 20), PD + 10 + rng() * (D1 - PD - 14), PH); c.rect(r(x), r(y), 3 + r(rng() * 4), 2, rng() < 0.5 ? "l" : "x") }
    poly("y", [A0 + H - PH, PD + 3, PH], [A1, PD + 3, PH], [A1, PD + 6, PH], [A0 + H - PH, PD + 6, PH])
    // zadní stěna haly (k divákovi) s kachlíky a tabulí stanice, pravá čelní stěna s ústím do tunelu na Pankrác
    poly("e", [A0, D1, H], [A1, D1, H], [A1, D1, PH], [A0 + H - PH, D1, PH])
    for (let a = A0 + 20; a < A1; a += 16) c.line(...p(a, D1, H).map(r), ...p(a, D1, Math.max(PH, H - (a - A0))).map(r), "3")
    quad(FRd(D1), A0 + 70, A0 + 150, H - 22, H - 8, "V"); letters(FRd(D1), A0 + 74, H - 9, "VYSEHRAD", 1.5, "W")
    poly("3", [A1, D0, H], [A1, D1, H], [A1, D1, 0], [A1, D0 + H, 0])
    poly("k", [A1, R0 - 10, 0], [A1, R1 + 12, 0], [A1, R1 + 12, 28], [A1, R0 - 4, 32], [A1, R0 - 10, 24])
    // ohořelý vůz metra, který nedojel: střecha a bok čouhají z tunelu
    const V0 = A1 - 120, VH = 24
    quad(FRd(R0 - 6), V0, A1, 0, VH, "M"); quad(FLa(V0), R0 - 6, R1 + 8, 0, VH, "m")
    poly("x", [V0, R0 - 6, VH], [A1, R0 - 6, VH], [A1, R1 + 8, VH], [V0, R1 + 8, VH])
    quad(FRd(R0 - 6), V0, A1, 8, 11, "V"); for (let a = V0 + 8; a < A1 - 10; a += 22) quad(FRd(R0 - 6), a, a + 14, 13, 21, rng() < 0.4 ? "k" : "n")
    quad(FLa(V0), R0 - 1, R1 + 3, 10, 21, "n"); quad(FLa(V0), R0 + 2, R0 + 5, 2, 5, "f")
    c.noise(...p(V0, R1 + 8, VH).map(r), 130, 60, "k", 0.05, 44, "Mmx")
    // zubatý okraj díry: trčící výztuž a visící kusy lepenky
    for (let i = 0; i < 16; i++) { const a = A0 + rng() * (A1 - A0), [x, y] = p(a, D0, H); c.poly([r(x) - 4, r(y), r(x) + 5, r(y) - 2, r(x) + 1, r(y) - 5 - r(rng() * 6)], "p"); if (rng() < 0.5) c.line(r(x), r(y), r(x) + 3, r(y) - 9, "U") }
    for (let i = 0; i < 8; i++) { const d = D0 + rng() * (D1 - D0), [x, y] = p(A0, d, H); c.line(r(x), r(y), r(x) + 6 + r(rng() * 6), r(y) - 2, "U") }
    // okraj díry: ulámaný asfalt
    c.line(...p(A0, D0, H).map(r), ...p(A1, D0, H).map(r), "A"); c.line(...p(A0, D0, H).map(r), ...p(A0, D1, H).map(r), "A")
  })
}

nusKcp("lm_kcp", { w: 14, dpt: 18, seed: 31 })
nusForum("lm_forum", { w: 7, dpt: 9, seed: 32 })
nusPolicie("lm_muzeum_policie", { w: 7, dpt: 9, seed: 33 })
nusVysehrad("lm_vysehrad", { w: 5, dpt: 2, seed: 34 })

sheet("landmarks_nusle", ["lm_kcp", "lm_forum", "lm_muzeum_policie", "lm_vysehrad"], { pad: 1 })
