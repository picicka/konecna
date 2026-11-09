// Katedrála svatého Víta na Hradě jako landmark. Geometrie jako muzeum(): počátek v nejbližším spodním rohu,
// FR podél osy a (pravá stěna, +b, jih), FL napříč (levá stěna, −a, západ). Loď leží podél a: západní průčelí se
// dvěma věžemi a růžicí je levá stěna, velká jižní věž s barokní měděnou helmicí a Zlatá brána jsou na pravé stěně
// uprostřed (a ≈ 9–13 dlaždic), za příčnou lodí chór s opěrnými oblouky a fiálami.
// Po pádu: saze, chybějící fiála, lešení s plachtou na severní věži, díra ve střeše pod plachtou; Hrad je jediné
// osvětlené místo v Praze, proto pracovní reflektory na průčelí a věži a pár rozsvícených oken.
// Bod p(a, d, h): a podél osy a od průčelí (px), d napříč od jižní stěny (px), h výška nad zemí.
function katedrala(name, o) {
  const w = o.w, dpt = o.dpt
  const lenR = FT * w, lenL = FT * dpt
  const W = FT * (w + dpt), Hc = 32 * (w + dpt) + 440
  const ox = FT * dpt, oy = Hc - 1
  // výšky: boční loď, koruna zdi hlavní lodi, hřeben střechy, západní věže, velká věž
  const hA = 130, hW = 260, hR = 420, hT = 470, hS = 740, hG = 500
  // světlo zleva: levé stěny "e", pravé "3", hrany "C", spáry "9"
  const SL = "e", SR = "3", HL = "C", DK = "9"
  sprite(name, { w: W, h: Hc }, (c) => {
    const rng = c.rng(o.seed ?? 1)
    const p = (a, d, h) => [ox + a - d, oy - a / 2 - d / 2 - h]
    const poly = (col, ...q) => c.poly(q.flatMap((t) => p(...t)), col)
    // stěny jako mapy (u, v) → obrazovka: levá stěna v rovině a = konst. (u = d), pravá v rovině d = konst. (u = a)
    const FLa = (a) => (u, v) => p(a, u, v)
    const FRd = (d) => (u, v) => p(u, d, v)
    const quad = (F, u0, u1, v0, v1, col) => c.poly([...F(u0, v0), ...F(u1, v0), ...F(u1, v1), ...F(u0, v1)], col)
    const box = (a0, a1, d0, d1, h0, h1, cl = SL, cr = SR, ct = DK) => {
      poly(ct, [a0, d0, h1], [a1, d0, h1], [a1, d1, h1], [a0, d1, h1])
      quad(FLa(a0), d0, d1, h0, h1, cl)
      quad(FRd(d0), a0, a1, h0, h1, cr)
    }
    const pyramid = (a0, a1, d0, d1, hb, ht, cl = SL, cr = SR, crockets = false) => {
      const apex = [(a0 + a1) / 2, (d0 + d1) / 2, ht]
      poly(cl, [a0, d0, hb], [a0, d1, hb], apex)
      poly(cr, [a0, d0, hb], [a1, d0, hb], apex)
      if (!crockets) return
      // kraby po hranách věžní jehly
      ;[[a0, d0], [a0, d1], [a1, d0]].forEach(([a, d]) => {
        for (let t = 0.08; t < 0.92; t += 0.07) {
          const [x, y] = p(a + (apex[0] - a) * t, d + (apex[1] - d) * t, hb + (ht - hb) * t)
          c.rect(Math.round(x) - 2, Math.round(y), 2, 2, a === a1 ? SR : HL)
        }
      })
    }
    // fiála: hranolek a jehlička s kytkou na vrcholu
    const pin = (a, d, h, s, ht, broken = false) => {
      box(a - s, a + s, d - s, d + s, h, h + ht * 0.4)
      if (broken) { const [x, y] = p(a, d, h + ht * 0.4); c.rect(x - s, y - 3, s * 2, 3, DK); c.px(x - 1, y - 5, SL); c.px(x + 2, y - 4, SR); return }
      pyramid(a - s, a + s, d - s, d + s, h + ht * 0.4, h + ht, SL, SR)
      const [x, y] = p(a, d, h + ht); c.rect(x - 1, y - 3, 3, 3, HL)
    }
    // gotické okno s lomeným obloukem; col "f" = rozsvícené (zevnitř generátor)
    const lancet = (F, u0, u1, v0, v1, col, frame) => {
      const peak = (u1 - u0) * 0.9
      c.poly([...F(u0 - 2, v0 - 2), ...F(u1 + 2, v0 - 2), ...F(u1 + 2, v1), ...F((u0 + u1) / 2, v1 + peak + 3), ...F(u0 - 2, v1)], frame)
      c.poly([...F(u0, v0), ...F(u1, v0), ...F(u1, v1), ...F((u0 + u1) / 2, v1 + peak), ...F(u0, v1)], col)
      // kružba: střední prut a příčky
      const mc = col === "f" ? "Y" : frame
      if (u1 - u0 >= 10) c.line(...F((u0 + u1) / 2, v0), ...F((u0 + u1) / 2, v1 + peak * 0.6), mc)
      for (let v = v0 + 18; v < v1; v += 22) c.line(...F(u0, v), ...F(u1, v), mc)
    }
    const winCol = () => { const r = rng(); return r < 0.12 ? "f" : r < 0.3 ? "k" : "n" }
    // saze a stékance pod římsou nebo oknem: svislé čáry dolů od (u, v)
    const streaks = (F, u0, u1, v, n, col, maxLen = 60) => {
      for (let i = 0; i < n; i++) { const [x, y] = F(u0 + rng() * (u1 - u0), v); c.vline(Math.round(x), Math.round(y), 6 + Math.floor(rng() * maxLen), col) }
    }
    // střecha: pás od okapu (e) k hřebeni (r), barevné glazované tašky v kosočtvercích, vybledlé
    const roofSlope = (R, len, depth) => {
      c.poly([...R(0, 0), ...R(len, 0), ...R(len, 1), ...R(0, 1)], "S")
      const cols = ["D", "O", "Q", "d"]
      const nt = Math.max(4, Math.round(depth / 18))
      for (let j = 1; j < nt; j++) for (let s = 12 + (j % 2) * 12; s < len - 8; s += 24) {
        const t = j / nt, dt = 0.5 / nt
        c.poly([...R(s, t - dt), ...R(s + 10, t), ...R(s, t + dt), ...R(s - 10, t)], cols[(j + Math.floor(s / 48)) % 4])
      }
      // hřebenáč a okapní plech
      c.line(...R(0, 1), ...R(len, 1), "s", 2); c.line(...R(0, 0), ...R(len, 0), "k")
    }

    // --- CHÓR (nejdál): hlavní hmota, střecha, věnec kaplí, opěráky s oblouky ---
    const cA0 = 864, cA1 = lenR, cD0 = 110, cD1 = 338
    box(cA0, cA1, cD0, cD1, 0, hW)
    for (let a = cA0 + 18; a < cA1 - 24; a += 64) lancet(FRd(cD0), a, a + 24, 140, 220, winCol(), DK)
    streaks(FRd(cD0), cA0, cA1, hW - 10, 30, DK, 80)
    roofSlope((s, t) => p(cA0 + s * (1 - 0.4 * t), cD0 + t * (224 - cD0), hW + t * (hR - hW)), cA1 - cA0, 224 - cD0)
    // kaple věnce: nízké kvádry se stanovými střechami
    for (let a = cA0 + 8; a < cA1 - 40; a += 74) {
      box(a, a + 66, 50, cD0, 0, hA - 10)
      lancet(FRd(50), a + 22, a + 42, 30, 80, winCol(), DK)
      pyramid(a, a + 66, 50, cD0, hA - 10, hA + 40, "S", "s")
    }
    // opěrné pilíře a dvojité oblouky ke zdi chóru; jedna fiála chybí (ulomená)
    const flyers = (a, dW, hTop, broken) => {
      box(a - 9, a + 9, 14, 48, 0, 150); box(a - 7, a + 7, 18, 44, 150, 240)
      pin(a, 31, 240, 7, 70, broken)
      c.line(...p(a, 40, 228), ...p(a, dW, hTop), SL, 5); c.line(...p(a, 40, 222), ...p(a, dW, hTop - 8), DK)
      c.line(...p(a, 40, 186), ...p(a, dW, hTop - 50), SL, 4); c.line(...p(a, 40, 181), ...p(a, dW, hTop - 56), DK)
      for (let t = 0.2; t < 0.9; t += 0.2) c.line(...p(a, 40 + (dW - 40) * t, 228 + (hTop - 228) * t), ...p(a, 40 + (dW - 40) * t, 186 + (hTop - 50 - 186) * t), SL)
    }
    ;[880, 952, 1024].forEach((a, i) => flyers(a, cD0, 250, i === 1))
    // fiály na koruně zdi chóru
    for (let a = cA0 + 16; a < cA1; a += 72) pin(a, cD0 + 4, hW, 5, 54)

    // --- PŘÍČNÁ LOĎ se Zlatou bránou na jižním štítu ---
    const tA0 = 704, tA1 = 864, tD0 = 10, tD1 = 438
    box(tA0, tA1, tD0, tD1, 0, hW)
    // jižní štít a střecha (svah k −a)
    poly(SR, [tA0, tD0, hW], [tA1, tD0, hW], [(tA0 + tA1) / 2, tD0, hR])
    roofSlope((s, t) => p(tA0 + t * 80, tD0 + s, hW + t * (hR - hW)), tD1 - tD0, 80)
    const Fg = FRd(tD0)
    // Zlatá brána: trojitá arkáda předsíně
    quad(Fg, tA0 + 8, tA1 - 8, 0, 116, HL)
    for (let k = 0; k < 3; k++) { const u = tA0 + 18 + k * 44; c.poly([...Fg(u, 0), ...Fg(u + 36, 0), ...Fg(u + 36, 70), ...Fg(u + 18, 104), ...Fg(u, 70)], "k") }
    // mozaika Posledního soudu: zlaté pole, uprostřed Kristus v mandorle, po stranách řady postav
    quad(Fg, tA0 + 10, tA1 - 10, 122, 200, "Y")
    quad(Fg, tA0 + 14, tA1 - 14, 126, 196, "y")
    c.poly([...Fg(778, 130), ...Fg(790, 130), ...Fg(796, 160), ...Fg(790, 192), ...Fg(778, 192), ...Fg(772, 160)], "b")
    quad(Fg, 781, 787, 144, 178, "V"); quad(Fg, 782, 786, 178, 184, "i")
    for (let u = tA0 + 20; u < tA1 - 20; u += 9) {
      if (u > 766 && u < 802) continue
      const row = rng() < 0.5 ? 0 : 1
      quad(Fg, u, u + 5, 132 + row * 32, 154 + row * 30, ["V", "b", "Q", "o"][Math.floor(rng() * 4)])
      quad(Fg, u + 1, u + 4, 154 + row * 30, 159 + row * 30, "i")
    }
    // mozaika oprýskaná: dole vypadané kostky
    for (let i = 0; i < 40; i++) { const [x, y] = Fg(tA0 + 14 + rng() * 132, 126 + rng() * 20); c.rect(Math.round(x), Math.round(y), 2, 2, "3") }
    // velké okno ve štítu nad bránou, rozsvícené
    lancet(Fg, tA0 + 50, tA1 - 50, 214, 300, "f", HL)
    streaks(Fg, tA0, tA1, hW - 4, 14, DK, 50)
    // sanktusník nad křížením: štíhlá věžička
    box(778, 790, 218, 230, hR - 20, hR + 40, "j", "Q", "Q"); pyramid(778, 790, 218, 230, hR + 40, hR + 110, "j", "Q")

    // --- HLAVNÍ LOĎ s boční lodí, opěráky a díra ve střeše pod plachtou ---
    const nA0 = 120, nA1 = tA0, nD0 = 130, nD1 = 318
    box(nA0, nA1, nD0, nD1, 0, hW)
    for (let a = nA0 + 40; a < nA1 - 30; a += 64) lancet(FRd(nD0), a, a + 22, 178, 236, winCol(), DK)
    roofSlope((s, t) => p(nA0 + s, nD0 + t * (224 - nD0), hW + t * (hR - hW)), nA1 - nA0, 224 - nD0)
    // díra ve střeše a přes ni plachta přivázaná lany
    const Rn = (s, t) => p(nA0 + s, nD0 + t * (224 - nD0), hW + t * (hR - hW))
    c.poly([...Rn(250, 0.25), ...Rn(330, 0.2), ...Rn(350, 0.7), ...Rn(270, 0.8)], "k")
    c.line(...Rn(268, 0.3), ...Rn(290, 0.75), "H", 2); c.line(...Rn(300, 0.25), ...Rn(318, 0.7), "H", 2)
    c.poly([...Rn(240, 0.4), ...Rn(318, 0.3), ...Rn(330, 0.62), ...Rn(250, 0.72)], "o")
    for (let s = 252; s < 320; s += 14) c.line(...Rn(s, 0.36), ...Rn(s + 6, 0.68), "u")
    c.line(...Rn(240, 0.4), ...Rn(200, 0), "m"); c.line(...Rn(318, 0.3), ...Rn(360, 0), "m")
    // boční loď s pultovou střechou
    box(nA0, nA1, 60, nD0, 0, hA)
    poly("S", [nA0, 60, hA], [nA1, 60, hA], [nA1, nD0, hA + 40], [nA0, nD0, hA + 40])
    c.line(...p(nA0, 60, hA), ...p(nA1, 60, hA), "k")
    for (let a = nA0 + 40; a < nA1 - 30; a += 64) lancet(FRd(60), a, a + 20, 26, 96, winCol(), DK)
    streaks(FRd(60), nA0, nA1, hA - 6, 30, DK, 60)
    for (let a = nA0 + 32; a < nA1 - 20; a += 64) { if (a > 540) continue; flyers(a, nD0, 250, false) }

    // --- ZÁPADNÍ VĚŽE: dřík s nárožními opěráky, zvonová okna, ochoz, jehla s kraby a fiálami ---
    const tower = (d0, d1, scaffold) => {
      const a0 = 0, a1 = 120, Fl = FLa(a0), Fr = FRd(d0)
      box(a0, a1, d0, d1, 0, hT)
      // nárožní opěráky po patrech
      ;[[Fl, d0, SL], [Fl, d1 - 12, SL], [Fr, a1 - 12, SR]].forEach(([F, u, col]) => { for (let v = 0; v < hT; v += 90) { quad(F, u, u + 12, v, v + 84, HL); quad(F, u, u + 12, v + 84, v + 90, DK) } })
      quad(Fr, a0, a0 + 12, 0, hT, SL)
      // patra: římsy, okna; nahoře párová zvonová okna
      for (let v = 120; v < hT; v += 120) { quad(Fl, d0, d1, v, v + 4, HL); quad(Fr, a0, a1, v, v + 4, SL) }
      ;[[Fl, d0 + 22, d0 + 58], [Fl, d1 - 58, d1 - 22], [Fr, a0 + 22, a0 + 56], [Fr, a1 - 54, a1 - 20]].forEach(([F, u0, u1]) => {
        lancet(F, u0 + 4, u1 - 4, 340, 420, "k", DK); lancet(F, u0 + 6, u1 - 6, 160, 220, rng() < 0.3 ? "f" : "n", DK)
      })
      // ochoz s kružbovou balustrádou
      box(a0 - 4, a1 + 4, d0 - 4, d1 + 4, hT, hT + 8, HL, SL, DK)
      for (let u = d0; u < d1; u += 8) quad(Fl, u, u + 4, hT + 8, hT + 22, HL)
      for (let u = a0; u < a1; u += 8) quad(Fr, u, u + 4, hT + 8, hT + 22, SL)
      // jehla a čtyři nárožní fiály (zadní dvě napřed)
      pin(a1 - 8, d1 - 8, hT + 8, 8, 110); pin(a0 + 8, d1 - 8, hT + 8, 8, 110); pin(a1 - 8, d0 + 8, hT + 8, 8, 110)
      pyramid(a0 + 24, a1 - 24, d0 + 24, d1 - 24, hT + 8, hS, SL, SR, true)
      // vikýřky ve jehle
      ;[[Fl, a0 + 14], [Fr, d0 + 14]].forEach(([F, k], i) => {
        const FF = i ? FRd(d0 + 38) : FLa(a0 + 38), mid = i ? (a0 + a1) / 2 : (d0 + d1) / 2
        lancet(FF, mid - 6, mid + 6, hT + 70, hT + 100, "k", HL)
      })
      pin(a0 + 8, d0 + 8, hT + 8, 8, 110)
      const [x, y] = p((a0 + a1) / 2, (d0 + d1) / 2, hS); c.rect(x - 1, y - 18, 3, 18, "Y"); c.rect(x - 4, y - 14, 9, 2, "Y")
      streaks(Fl, d0, d1, hT - 4, 12, "3", 90); streaks(Fr, a0, a1, hT - 4, 10, DK, 90)
      if (scaffold) {
        // lešení na levé stěně severní věže a přes něj roztrhaná plachta
        const u0 = d0 - 6, u1 = d1 + 6, v0 = 180, v1 = hT + 30
        for (let u = u0; u <= u1; u += 22) c.line(...Fl(u, 0), ...Fl(u, v1), "m")
        for (let v = 30; v <= v1; v += 40) { c.line(...Fl(u0, v), ...Fl(u1, v), "M", v % 80 ? 1 : 3); if (v < v1 - 40) c.line(...Fl(u0 + ((v / 40) % 2) * 22, v), ...Fl(u0 + 22 + ((v / 40) % 2) * 22, v + 40), "M") }
        c.poly([...Fl(u0 + 30, v1 - 10), ...Fl(u1 - 4, v1 - 10), ...Fl(u1 - 10, v0 + 30), ...Fl(u1 - 36, v0 + 60), ...Fl(u0 + 50, v0 + 10), ...Fl(u0 + 34, v0 + 70)], "b")
        for (let u = u0 + 40; u < u1 - 10; u += 16) c.line(...Fl(u, v1 - 12), ...Fl(u + 4, v0 + 50), "n")
      }
    }
    // severní věž napřed: její pravou stěnu zakryje průčelí
    tower(278, 398, true)
    // --- ZÁPADNÍ PRŮČELÍ mezi věžemi: portál, galerie, růžice, štít ---
    const Fw = FLa(0)
    box(0, nA0, 170, 278, 0, hW + 60)
    c.poly([...Fw(170, hW + 60), ...Fw(278, hW + 60), ...Fw(224, hW + 200)], SL)
    c.line(...Fw(170, hW + 60), ...Fw(224, hW + 200), HL, 2); c.line(...Fw(278, hW + 60), ...Fw(224, hW + 200), HL, 2)
    for (let t = 0.15; t < 0.95; t += 0.12) { const [x, y] = Fw(170 + 54 * t, hW + 60 + 140 * t); c.rect(Math.round(x), Math.round(y) - 3, 2, 3, HL) }
    // hlavní portál se stupňovitým ostěním
    for (let k = 0; k < 4; k++) c.poly([...Fw(196 + k * 4, 0), ...Fw(252 - k * 4, 0), ...Fw(252 - k * 4, 84 - k * 3), ...Fw(224, 128 - k * 8), ...Fw(196 + k * 4, 84 - k * 3)], k % 2 ? DK : HL)
    c.poly([...Fw(212, 0), ...Fw(236, 0), ...Fw(236, 70), ...Fw(224, 92), ...Fw(212, 70)], "H")
    c.line(...Fw(224, 0), ...Fw(224, 80), "3")
    // galerie soch nad portálem (sochy zčernalé, dvě chybí)
    quad(Fw, 174, 274, 140, 146, HL)
    for (let u = 180; u < 270; u += 10) if (u !== 210 && u !== 250) { quad(Fw, u, u + 5, 146, 166, DK); quad(Fw, u + 1, u + 4, 166, 170, "x") }
    // růžice: kruh v rovině stěny, paprsky kružby, napůl rozsvícená
    const rose = (u0, v0, r) => {
      const ring = (rr) => { const pts = []; for (let t = 0; t < 32; t++) pts.push(...Fw(u0 + rr * Math.cos(t / 32 * Math.PI * 2), v0 + rr * Math.sin(t / 32 * Math.PI * 2))); return pts }
      c.poly(ring(r + 5), HL); c.poly(ring(r), "n")
      c.clip((x, y) => x < Fw(u0, 0)[0], () => c.poly(ring(r - 2), "o"))
      for (let t = 0; t < 12; t++) { const an = t / 12 * Math.PI * 2; c.line(...Fw(u0, v0), ...Fw(u0 + r * Math.cos(an), v0 + r * Math.sin(an)), DK) }
      c.poly(ring(r * 0.45), DK); c.poly(ring(r * 0.3), "f")
    }
    rose(224, 228, 40)
    streaks(Fw, 174, 274, hW + 54, 20, "3", 70)

    // boční portál pod severní věží (vidět jen kus) a jižní pod bližší
    tower(50, 170, false)
    ;[[94, 126]].forEach(([u0, u1]) => c.poly([...Fw(u0, 0), ...Fw(u1, 0), ...Fw(u1, 60), ...Fw((u0 + u1) / 2, 84), ...Fw(u0, 60)], "H"))

    // --- VELKÁ JIŽNÍ VĚŽ: gotický dřík, zlatá mříž, renesanční ochoz s hodinami, barokní měděná helmice ---
    const gA0 = 560, gA1 = 690, gD0 = 10, gD1 = 140
    const Gl = FLa(gA0), Gr = FRd(gD0)
    box(gA0, gA1, gD0, gD1, 0, hG)
    ;[[Gl, gD0, SL], [Gr, gA1 - 14, SR]].forEach(([F, u]) => { for (let v = 0; v < 440; v += 110) { quad(F, u, u + 14, v, v + 104, HL); quad(F, u, u + 14, v + 104, v + 110, DK) } })
    quad(Gr, gA0, gA0 + 14, 0, 440, SL)
    for (let v = 110; v < 440; v += 110) { quad(Gl, gD0, gD1, v, v + 4, HL); quad(Gr, gA0, gA1, v, v + 4, SL) }
    lancet(Gl, gD0 + 40, gD1 - 40, 140, 200, winCol(), DK); lancet(Gr, gA0 + 40, gA1 - 40, 140, 200, "n", DK)
    // vysoké okno se zlatou renesanční mříží
    lancet(Gr, gA0 + 36, gA1 - 36, 240, 380, "k", DK)
    for (let u = gA0 + 38; u < gA1 - 36; u += 8) c.line(...Gr(u, 240), ...Gr(u, 400), "Y")
    for (let v = 248; v < 400; v += 12) c.line(...Gr(gA0 + 36, v), ...Gr(gA1 - 36, v), "Y")
    lancet(Gl, gD0 + 36, gD1 - 36, 240, 380, "n", DK)
    // renesanční ochoz s hodinami
    box(gA0 - 4, gA1 + 4, gD0 - 4, gD1 + 4, 440, 446, HL, SL, DK)
    quad(Gl, gD0, gD1, 446, hG, SL); quad(Gr, gA0, gA1, 446, hG, SR)
    for (let u = gD0 + 6; u < gD1; u += 12) quad(Gl, u, u + 6, 452, 470, "k")
    for (let u = gA0 + 6; u < gA1; u += 12) quad(Gr, u, u + 6, 452, 470, "k")
    const clock = (F, u0, v0, r) => {
      const ring = (rr) => { const q = []; for (let t = 0; t < 20; t++) q.push(...F(u0 + rr * Math.cos(t / 20 * Math.PI * 2), v0 + rr * Math.sin(t / 20 * Math.PI * 2))); return q }
      c.poly(ring(r + 3), "Y"); c.poly(ring(r), "k"); c.line(...F(u0, v0), ...F(u0, v0 + r - 3), "y"); c.line(...F(u0, v0), ...F(u0 + r - 6, v0 - 2), "y")
    }
    clock(Gl, (gD0 + gD1) / 2, 410, 18); clock(Gr, (gA0 + gA1) / 2, 412, 18)
    box(gA0 - 6, gA1 + 6, gD0 - 6, gD1 + 6, hG, hG + 8, HL, SL, DK)
    streaks(Gl, gD0, gD1, 436, 10, "3", 80); streaks(Gr, gA0, gA1, 436, 12, DK, 90)
    // helmice: zvon, krček, cibule, lucerna, malá cibule, makovice a špice (světlo zleva)
    const [hx, hy] = p((gA0 + gA1) / 2, (gD0 + gD1) / 2, hG + 8)
    const dome = (cx, cy, rx, ry, top) => {
      c.clip([cx - rx - 2, cy - ry - 2, rx * 2 + 4, ry + 2 + (top ? 0 : ry)], () => c.ellipse(cx, cy, rx, ry, "Q"))
      c.clip([cx - rx - 2, cy - ry - 2, rx + 2 - rx / 3, ry + 2 + (top ? 0 : ry)], () => c.ellipse(cx, cy, rx - 2, ry - 2, "j"))
    }
    c.ellipse(hx, hy, 128, 40, "Q"); c.clip([hx - 130, hy - 42, 90, 84], () => c.ellipse(hx, hy, 126, 38, "j"))
    dome(hx, hy - 4, 112, 62, true)
    for (let k = -3; k <= 3; k++) c.line(hx + k * 34, hy - 6, hx + k * 9, hy - 64, "Q")
    c.rect(hx - 34, hy - 86, 68, 22, "Q"); c.rect(hx - 34, hy - 86, 30, 22, "j")
    for (let x = -26; x < 26; x += 14) c.rect(hx + x, hy - 82, 6, 14, "k")
    dome(hx, hy - 128, 66, 46, false)
    for (let k = -2; k <= 2; k++) c.line(hx + k * 26, hy - 92, hx + k * 8, hy - 170, "Q")
    c.rect(hx - 20, hy - 206, 40, 34, "Q"); c.rect(hx - 20, hy - 206, 18, 34, "j")
    for (let x = -14; x < 14; x += 10) c.rect(hx + x, hy - 200, 5, 22, "f")
    dome(hx, hy - 220, 30, 26, false)
    c.circ(hx, hy - 250, 6, "Y"); c.rect(hx - 1, hy - 290, 3, 38, "Y"); c.rect(hx - 6, hy - 276, 13, 2, "Y")

    // --- STOPY PO PÁDU: saze nad okny, kulky, plevel na římsách ---
    for (let i = 0; i < 200; i++) {
      const pick = rng()
      const [F, u0, u1] = pick < 0.35 ? [FRd(nD0), nA0, nA1] : pick < 0.6 ? [Gr, gA0, gA1] : pick < 0.8 ? [FLa(0), 50, 398] : [FRd(cD0), cA0, cA1]
      const [x, y] = F(u0 + rng() * (u1 - u0), 30 + rng() * 200)
      if (c.is(Math.round(x), Math.round(y), "e3")) c.rect(Math.round(x), Math.round(y), 2, 2, rng() < 0.5 ? "9" : "k")
    }
    for (let a = nA0; a < nA1; a += 3) if (rng() < 0.35) { const [x, y] = p(a, 60, hA); c.vline(Math.round(x), Math.round(y) - 4, 2 + Math.floor(rng() * 4), rng() < 0.5 ? "G" : "g") }

    // --- REFLEKTORY: jediné světlo v Praze. Dva u západního průčelí, jeden u Zlaté brány ---
    const flood = (F, u, spread, top) => {
      const [x0, y0] = F(u, 0)
      const [xl, yl] = F(u - spread, top), [xr, yr] = F(u + spread, top)
      c.light([x0 - 4, y0, xl, yl, xr, yr, x0 + 4, y0], 1, 0.6)
      c.light([x0 - 2, y0, (x0 + xl) / 2 + 6, (y0 + yl) / 2, (x0 + xr) / 2 - 6, (y0 + yr) / 2, x0 + 2, y0], 1, 1)
      c.rect(x0 - 6, y0 - 8, 12, 8, "M"); c.rect(x0 - 5, y0 - 12, 10, 4, "f"); c.vline(x0, y0, 6, "k")
    }
    flood(Fw, 224, 60, 300)
    flood(Fw, 110, 50, 380)
    flood(Fg, 784, 70, 320)
    flood(Gr, 600, 40, 300)
  }, glow("f", { r: 8, strength: 0.5 }))
}
katedrala("lm_katedrala", { w: 17, dpt: 7, seed: 7 })

sheet("landmarks_hrad", ["lm_katedrala"], { pad: 1 })
