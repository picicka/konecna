// Mostecké věže Karlova mostu jako landmarky. Geometrie jako katedrala(): počátek v nejbližším spodním rohu,
// FR podél osy a (pravá stěna, +b, sever), FL napříč (levá stěna, −a). Most vede podél a skrz věže: brána je
// otevřený oblouk na levé stěně, hrdinka jí projde. Spodek spritu stojí na mostovce.
// Po pádu: saze, prázdné výklenky s cenovkami místo soch, bahno od suchého koryta, plachta, lucerna v bráně.
// Bod p(a, d, h): a podél osy a (px), d napříč od pravé (severní) stěny (px), h výška nad mostovkou.

// světlo zleva: levé stěny "e", pravé "3", hrany "C", spáry "9"
const MST_SL = "e", MST_SR = "3", MST_HL = "C", MST_DK = "9"

// sada kreslítek nad plátnem c s počátkem ox, oy (jako v katedrale)
function mstKit(c, ox, oy, rng) {
  const SL = MST_SL, SR = MST_SR, HL = MST_HL, DK = MST_DK
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
  const pyramid = (a0, a1, d0, d1, hb, ht, cl, cr) => {
    const apex = [(a0 + a1) / 2, (d0 + d1) / 2, ht]
    poly(cl, [a0, d0, hb], [a0, d1, hb], apex)
    poly(cr, [a0, d0, hb], [a1, d0, hb], apex)
  }
  // kvádrové zdivo: vodorovné spáry po řádcích, svislé střídavě, sem tam světlejší vyměněný kvádr
  const ashlar = (F, u0, u1, v0, v1, base, joint, patch, step = 9) => {
    for (let v = v0, row = 0; v < v1; v += step, row++) {
      for (let u = u0 + (row % 2) * 11; u < u1; u += 22) {
        if (rng() < 0.09) quad(F, u + 1, Math.min(u + 21, u1), v + 1, Math.min(v + step, v1), patch)
        c.line(...F(u, v), ...F(u, Math.min(v + step, v1)), joint)
      }
      c.line(...F(u0, v), ...F(u1, v), joint)
    }
  }
  // lomený oblouk v rovině stěny jako mnohoúhelník (u0–u1 šířka, vs patka oblouku, vt vrchol)
  const archPts = (F, u0, u1, v0, vs, vt) => {
    const q = [...F(u0, v0), ...F(u1, v0), ...F(u1, vs)]
    const r = u1 - u0, n = 8
    // pravý oblouk ze středu u0, levý ze středu u1 (gotický lomený oblouk)
    for (let i = 1; i <= n; i++) { const t = (i / n) * Math.acos(0.5); q.push(...F(u0 + r * Math.cos(t), vs + (vt - vs) * Math.sin(t) / Math.sin(Math.acos(0.5)))) }
    for (let i = n - 1; i >= 0; i--) { const t = (i / n) * Math.acos(0.5); q.push(...F(u1 - r * Math.cos(t), vs + (vt - vs) * Math.sin(t) / Math.sin(Math.acos(0.5)))) }
    return q
  }
  const lancet = (F, u0, u1, v0, v1, col, frame) => {
    const peak = (u1 - u0) * 0.9
    c.poly([...F(u0 - 2, v0 - 2), ...F(u1 + 2, v0 - 2), ...F(u1 + 2, v1), ...F((u0 + u1) / 2, v1 + peak + 3), ...F(u0 - 2, v1)], frame)
    c.poly([...F(u0, v0), ...F(u1, v0), ...F(u1, v1), ...F((u0 + u1) / 2, v1 + peak), ...F(u0, v1)], col)
  }
  // stékance a saze: svislé čáry dolů od výšky v
  const streaks = (F, u0, u1, v, n, col, maxLen = 60) => {
    for (let i = 0; i < n; i++) { const [x, y] = F(u0 + rng() * (u1 - u0), v); c.vline(Math.round(x), Math.round(y), 6 + Math.floor(rng() * maxLen), col) }
  }
  // bahno odstříknuté od mostovky: tahy nahoru od země, nahoře řidší
  const mud = (F, u0, u1, hmax = 30, col = "3") => {
    // souvislý pás se zubatým horním okrajem (vyhlazená náhodná výška), nad ním pár zaschlých cákanců
    const q = [...F(u1, 0), ...F(u0, 0)]
    let h = 6 + rng() * hmax * 0.5
    for (let u = u0; u <= u1; u += 4) { h = Math.max(3, Math.min(hmax, h + (rng() - 0.5) * 10)); q.push(...F(u, h)) }
    q.push(...F(u1, h))
    c.poly(q, col)
    for (let i = 0; i < (u1 - u0) / 10; i++) { const [x, y] = F(u0 + rng() * (u1 - u0), hmax * (0.6 + rng() * 0.6)); c.rect(Math.round(x), Math.round(y), 2, 1 + Math.floor(rng() * 2), col) }
  }
  // zlatá makovice na tyčce
  const ball = (a, d, h, len = 12) => {
    const [x, y] = p(a, d, h)
    c.rect(Math.round(x), Math.round(y) - len, 1, len, "O"); c.circ(Math.round(x), Math.round(y) - len - 2, 2, "Y"); c.px(Math.round(x) - 1, Math.round(y) - len - 3, "y")
  }
  // nárožní věžička na krakorci: hranolek, ochoz, štíhlá břidlicová jehla
  const turret = (a, d, h0, h1, s, ht) => {
    // krakorec: zužující se kužel pod věžičkou
    for (let k = 0; k < 4; k++) box(a - s + 4 - k, a + s - 4 + k, d - s + 4 - k, d + s - 4 + k, h0 - 24 + k * 6, h0 - 18 + k * 6, HL, SR, DK)
    box(a - s, a + s, d - s, d + s, h0, h1)
    for (let v = h0 + 10; v < h1 - 8; v += 18) { quad(FLa(a - s), d - 3, d + 3, v, v + 10, "k"); quad(FRd(d - s), a - 3, a + 3, v, v + 10, "k") }
    box(a - s - 2, a + s + 2, d - s - 2, d + s + 2, h1, h1 + 4, HL, SL, DK)
    pyramid(a - s + 1, a + s - 1, d - s + 1, d + s - 1, h1 + 4, ht, "s", "S")
    ball(a, d, ht, 8)
  }
  // valbová střecha s krátkým hřebenem podél d (štít k −a je lichoběžník, k −d trojúhelník)
  const hipRoof = (a0, a1, d0, d1, hb, ht, r) => {
    const am = (a0 + a1) / 2
    poly("s", [a0, d0, hb], [a0, d1, hb], [am, d1 - r, ht], [am, d0 + r, ht])
    poly("S", [a0, d0, hb], [a1, d0, hb], [am, d0 + r, ht])
    // řady břidlic: vodorovné linky po obou plochách
    for (let t = 0.08; t < 1; t += 0.07) {
      const h = hb + (ht - hb) * t
      c.line(...p(a0 + (am - a0) * t, d0 + r * t, h), ...p(a0 + (am - a0) * t, d1 - r * t, h), "a")
      c.line(...p(a0 + (am - a0) * t, d0 + r * t, h), ...p(a1 - (a1 - am) * t, d0 + r * t, h), "A")
    }
    c.line(...p(a0, d0, hb), ...p(am, d0 + r, ht), "x"); c.line(...p(am, d0 + r, ht), ...p(am, d1 - r, ht), "x")
    c.line(...p(a0, d0, hb), ...p(a0, d1, hb), "k"); c.line(...p(a0, d0, hb), ...p(a1, d0, hb), "k")
    ball(am, d0 + r, ht, 14); ball(am, d1 - r, ht, 14)
  }
  // ochoz: řada krakorců, předsazené cimbuří s kružbovými otvory
  const gallery = (a0, a1, d0, d1, hg, hp = 26) => {
    for (let u = d0 + 4; u < d1; u += 12) c.poly([...FLa(a0)(u, hg - 12), ...FLa(a0)(u + 6, hg - 12), ...FLa(a0 - 5)(u + 6, hg), ...FLa(a0 - 5)(u, hg)], HL)
    for (let u = a0 + 4; u < a1; u += 12) c.poly([...FRd(d0)(u, hg - 12), ...FRd(d0)(u + 6, hg - 12), ...FRd(d0 - 5)(u + 6, hg), ...FRd(d0 - 5)(u, hg)], SL)
    box(a0 - 6, a1 + 6, d0 - 6, d1 + 6, hg, hg + hp, SL, SR, DK)
    quad(FLa(a0 - 6), d0 - 6, d1 + 6, hg, hg + 3, HL); quad(FRd(d0 - 6), a0 - 6, a1 + 6, hg, hg + 3, SL)
    for (let u = d0 + 6; u < d1 - 6; u += 16) c.poly(archPts(FLa(a0 - 6), u, u + 8, hg + 6, hg + 14, hg + 20), "k")
    for (let u = a0 + 6; u < a1 - 6; u += 16) c.poly(archPts(FRd(d0 - 6), u, u + 8, hg + 6, hg + 14, hg + 20), "k")
    quad(FLa(a0 - 6), d0 - 6, d1 + 6, hg + hp - 3, hg + hp, HL); quad(FRd(d0 - 6), a0 - 6, a1 + 6, hg + hp - 3, hg + hp, SL)
  }
  // socha ve výklenku (zčernalá) nebo prázdný výklenek s cenovkou; seated = sedící král
  const niche = (F, u0, u1, v0, v1, statue, seated = false) => {
    const um = (u0 + u1) / 2
    c.poly(archPts(F, u0 - 2, u1 + 2, v0 - 2, v1, v1 + (u1 - u0) * 0.9), HL)
    c.poly(archPts(F, u0, u1, v0, v1, v1 + (u1 - u0) * 0.8), DK)
    // baldachýn: malý vimperk s fiálkami
    c.poly([...F(u0 - 3, v1 + (u1 - u0) * 0.9), ...F(u1 + 3, v1 + (u1 - u0) * 0.9), ...F(um, v1 + (u1 - u0) * 0.9 + 16)], HL)
    c.line(...F(u0 - 3, v1 + (u1 - u0) * 0.9), ...F(um, v1 + (u1 - u0) * 0.9 + 16), DK)
    c.line(...F(u0 - 4, v1), ...F(u0 - 4, v1 + (u1 - u0) * 0.9 + 12), HL); c.line(...F(u1 + 4, v1), ...F(u1 + 4, v1 + (u1 - u0) * 0.9 + 12), HL)
    // konzola
    quad(F, u0 - 1, u1 + 1, v0 - 5, v0, HL)
    if (statue) {
      const top = v1 + (u1 - u0) * 0.5
      if (seated) {
        c.poly([...F(u0 + 1, v0), ...F(u1 - 1, v0), ...F(u1 - 2, v0 + 14), ...F(um + 3, top - 8), ...F(um - 3, top - 8), ...F(u0 + 2, v0 + 14)], "x")
        quad(F, u0 + 1, u1 - 1, v0 + 10, v0 + 14, "v")
      } else c.poly([...F(u0 + 2, v0), ...F(u1 - 2, v0), ...F(um + 3, top - 8), ...F(um - 3, top - 8)], "x")
      quad(F, um - 2, um + 2, top - 8, top - 2, "v")
      quad(F, um - 3, um + 3, top - 2, top, "O")
      c.line(...F(um + 2, v0 + 6), ...F(um + 2, top - 10), "k")
    } else {
      // cenovka na provázku
      const [x, y] = F(um, v0 + 14)
      c.line(Math.round(x), Math.round(y) - 6, Math.round(x), Math.round(y), "v")
      c.rect(Math.round(x) - 3, Math.round(y), 7, 5, "W"); c.hline(Math.round(x) - 2, Math.round(y) + 2, 4, "k"); c.px(Math.round(x), Math.round(y), "k")
    }
  }
  // lucerna visící v bráně na řetězu a teplé světlo kolem
  const lantern = (F, u, v, len) => {
    const [x, y] = F(u, v)
    const X = Math.round(x), Y = Math.round(y)
    c.light([X - 30, Y + len - 10, X + 30, Y + len - 10, X + 40, Y + len + 60, X - 40, Y + len + 60], 1, 0.5)
    c.vline(X, Y, len, "M")
    c.rect(X - 3, Y + len, 7, 2, "M"); c.rect(X - 3, Y + len + 2, 7, 7, "M"); c.rect(X - 2, Y + len + 3, 5, 5, "f"); c.px(X, Y + len + 5, "W"); c.rect(X - 2, Y + len + 9, 5, 1, "M")
  }
  // průjezd brány: tmavý tunel s vnitřní stěnou (d = dIn) a klenbou, lomený oblouk na levé stěně (a = aF)
  const gate = (aF, aB, d0, d1, vs, vt) => {
    const F = FLa(aF)
    // ostění ve dvou stupních
    c.poly(archPts(F, d0 - 8, d1 + 8, 0, vs, vt + 10), HL)
    c.poly(archPts(F, d0 - 4, d1 + 4, 0, vs, vt + 5), DK)
    const hole = archPts(F, d0, d1, 0, vs, vt)
    c.poly(hole, "k")
    c.clip(hole, () => {
      // vnitřní stěna průjezdu, mostovka a klenba ve tmě
      quad(FRd(d1), aF, aB, 0, vs, "3"); ashlar(FRd(d1), aF, aB, 0, vs, "3", "K", "9", 14)
      poly("P", [aF, d0, 0], [aB, d0, 0], [aB, d1, 0], [aF, d1, 0])
      for (let a = aF + 8; a < aB; a += 14) c.line(...p(a, d0, 0), ...p(a, d1, 0), "a")
      c.poly([...FRd(d1)(aF, vs), ...FRd(d1)(aB, vs), ...FRd(d1)(aB, vt + 20), ...FRd(d1)(aF, vt + 20)], "N")
    })
    lantern(F, (d0 + d1) / 2, vt - 4, 22)
  }
  return { p, poly, FLa, FRd, quad, box, pyramid, ashlar, archPts, lancet, streaks, mud, ball, turret, hipRoof, gallery, niche, gate }
}

// Staroměstská mostecká věž (Petr Parléř, po 1373): hranolová věž nad průjezdem, východní průčelí k Starému Městu
// (levá stěna) s pásem znaků, sedícími králi Karlem IV. a Václavem IV. kolem svatého Víta, nad nimi Vojtěch
// a Zikmund, slepé kružby s vimperky; nahoře ochoz na krakorcích, nárožní věžičky, strmá břidlicová valba.
// Průjezd vede podél a středem půdorysu (d 62–130, tedy dlaždice b = 1), oblouk vpředu na levé stěně, vzadu stejný.
function mstVezStare(name, o) {
  const w = o.w, dpt = o.dpt
  const lenR = FT * w, lenL = FT * dpt
  const hB = 330, hG = 340, hRf = 580
  const W = FT * (w + dpt), Hc = 32 * (w + dpt) + 560
  const ox = FT * dpt, oy = Hc - 1
  sprite(name, { w: W, h: Hc }, (c) => {
    const rng = c.rng(o.seed ?? 1)
    const K = mstKit(c, ox, oy, rng)
    const { quad, box, FLa, FRd } = K
    const Fl = FLa(0), Fr = FRd(0)
    // zadní nárožní věžička (za střechou)
    K.turret(lenR - 4, lenL - 4, hG + 26, hG + 76, 10, hG + 190)
    // dřík věže
    box(0, lenR, 0, lenL, 0, hB)
    K.ashlar(Fl, 0, lenL, 0, 150, MST_SL, MST_DK, "4")
    K.ashlar(Fr, 0, lenR, 0, hB, MST_SR, "k", MST_DK)
    K.ashlar(Fl, 0, lenL, 150, hB, MST_SL, MST_DK, "4")
    // nárožní lizény
    quad(Fl, 0, 8, 0, hB, MST_HL); quad(Fl, lenL - 8, lenL, 0, hB, MST_HL); quad(Fr, 0, 6, 0, hB, MST_SL)
    // pravá stěna: střílnová okénka po patrech, plachta přes díru po granátu
    for (let v = 60; v < hB - 30; v += 56) quad(Fr, lenR - 40, lenR - 34, v, v + 16, "k")
    quad(Fr, 70, 76, 210, 230, "k")
    c.poly([...Fr(40, 120), ...Fr(66, 108), ...Fr(96, 124), ...Fr(88, 150), ...Fr(56, 156)], "k")
    c.poly([...Fr(30, 168), ...Fr(104, 172), ...Fr(110, 100), ...Fr(90, 92), ...Fr(70, 104), ...Fr(36, 96)], "o")
    for (let u = 40; u < 104; u += 12) c.line(...Fr(u, 166), ...Fr(u + 3, 102), "u")
    c.line(...Fr(30, 168), ...Fr(18, 200), "m"); c.line(...Fr(104, 172), ...Fr(120, 210), "m"); c.line(...Fr(36, 96), ...Fr(20, 70), "m")
    K.streaks(Fr, 6, lenR, hB - 6, 18, "k", 90)

    // --- VÝCHODNÍ PRŮČELÍ ---
    // průjezd: d 62–130 (dlaždice b = 1)
    K.gate(0, lenR, 62, 130, 84, 140)
    // pás znaků zemí nad branou (některé štíty ulomené)
    quad(Fl, 4, lenL - 4, 158, 162, MST_HL)
    const arms = ["V", "b", "Y", "V", "k", "b", "V", "Y", "k", "V", "b"]
    arms.forEach((col, i) => {
      const u = 12 + i * 16
      if (col === "k") { quad(Fl, u, u + 10, 164, 176, MST_DK); return }
      c.poly([...Fl(u, 176), ...Fl(u + 10, 176), ...Fl(u + 10, 168), ...Fl(u + 5, 163), ...Fl(u, 168)], MST_HL)
      c.poly([...Fl(u + 1, 175), ...Fl(u + 9, 175), ...Fl(u + 9, 168), ...Fl(u + 5, 165), ...Fl(u + 1, 168)], col)
      quad(Fl, u + 4, u + 6, 167, 173, i % 2 ? "W" : "O")
    })
    quad(Fl, 4, lenL - 4, 178, 182, MST_HL)
    // dolní pás soch: sv. Vít uprostřed (pryč, cenovka), vlevo Karel IV. (zůstal, zčernalý), vpravo Václav IV. (pryč)
    // na levé stěně roste u doleva: pravý král (Václav) má malé u, Karel velké
    K.niche(Fl, 34, 56, 190, 228, false, true)
    K.niche(Fl, 86, 106, 190, 236, false)
    K.niche(Fl, 136, 158, 190, 228, true, true)
    // model mostu pod Vítem
    c.line(...Fl(84, 194), ...Fl(108, 194), MST_HL, 2)
    // horní pás: Vojtěch a Zikmund pod vimperky, mezi nimi slepé kružby
    K.niche(Fl, 40, 58, 252, 288, true)
    K.niche(Fl, 134, 152, 252, 288, false)
    for (let u = 70; u < 124; u += 14) K.lancet(Fl, u, u + 8, 250, 296, MST_DK, MST_HL)
    // fiály mezi poli
    ;[22, 70, 124, 172].forEach((u) => { quad(Fl, u, u + 4, 186, 316, MST_HL); c.poly([...Fl(u - 1, 316), ...Fl(u + 5, 316), ...Fl(u + 2, 328)], MST_HL) })
    K.streaks(Fl, 10, lenL - 10, hB - 8, 22, "3", 70)
    K.streaks(Fl, 30, 160, 186, 14, "3", 40)
    // bahno od koryta na obou stěnách
    K.mud(Fl, 0, 62); K.mud(Fl, 130, lenL); K.mud(Fr, 0, lenR, 30, "H")

    // --- OCHOZ, STŘECHA, VĚŽIČKY ---
    K.gallery(0, lenR, 0, lenL, hG)
    K.turret(lenR - 4, 4, hG + 26, hG + 76, 10, hG + 190)
    K.turret(4, lenL - 4, hG + 26, hG + 76, 10, hG + 190)
    K.hipRoof(8, lenR - 8, 8, lenL - 8, hG + 22, hRf, 62)
    // vikýřek ve střeše
    const Fd = FLa(36)
    quad(Fd, 88, 104, hG + 64, hG + 82, MST_SL); c.poly([...Fd(86, hG + 82), ...Fd(106, hG + 82), ...Fd(96, hG + 92)], "s"); quad(Fd, 92, 100, hG + 66, hG + 78, "k")
    K.turret(4, 4, hG + 26, hG + 76, 10, hG + 190)
  }, glow("f", { r: 8, strength: 0.5 }))
}

// Malostranské mostecké věže: vpravo (sever, malé d) vysoká pozdně gotická Malostranská věž se strmou břidlicovou
// valbou a nárožními věžičkami, vlevo (jih) nižší románská Juditina věž s jehlancovou střechou, mezi nimi brána
// s cimbuřím. Průjezd vede podél a dlaždicí b = 2 (d 132–188), oblouk na levé stěně brány.
function mstVezeMale(name, o) {
  const w = o.w, dpt = o.dpt
  const lenR = FT * w, lenL = FT * dpt
  const W = FT * (w + dpt), Hc = 32 * (w + dpt) + 370
  const ox = FT * dpt, oy = Hc - 1
  // vysoká věž: d 0–128, dřík do 290, ochoz, střecha do 430; Juditina: d 196–316, do 210, jehlan do 300
  const tA1 = 128, tD1 = 128, tB = 280, tRf = 460
  const jA0 = 10, jA1 = 150, jD0 = 196, jD1 = 316, jB = 210, jRf = 300
  const gA0 = 16, gH = 150
  sprite(name, { w: W, h: Hc }, (c) => {
    const rng = c.rng(o.seed ?? 1)
    const K = mstKit(c, ox, oy, rng)
    const { quad, box, FLa, FRd } = K

    // --- JUDITINA VĚŽ (nejdál): světlejší opuka, románská sdružená okna, jehlan ---
    const Jl = FLa(jA0), Jr = FRd(jD0)
    box(jA0, jA1, jD0, jD1, 0, jB, "p", "P", MST_DK)
    K.ashlar(Jl, jD0, jD1, 0, jB, "p", "P", "q", 8)
    K.ashlar(Jr, jA0, jA1, 0, jB, "P", "B", "p", 8)
    // sdružená okna s půlkruhem a sloupkem
    const bif = (F, u, v) => {
      quad(F, u - 2, u + 22, v - 2, v + 18, "q")
      ;[u, u + 12].forEach((x) => { quad(F, x, x + 8, v, v + 14, "k"); c.poly([...F(x, v + 14), ...F(x + 8, v + 14), ...F(x + 4, v + 18)], "k") })
    }
    bif(Jl, 236, 150); bif(Jl, 270, 150); bif(Jr, 60, 150)
    quad(Jl, 250, 258, 70, 90, "k")
    // reliéf klečící postavy (vybledlý) a římsa pod střechou
    quad(Jl, 280, 300, 96, 120, "q"); c.poly([...Jl(284, 98), ...Jl(296, 98), ...Jl(290, 116)], "P")
    quad(Jl, jD0, jD1, jB - 6, jB, "q"); quad(Jr, jA0, jA1, jB - 6, jB, "p")
    K.streaks(Jl, jD0, jD1, jB - 8, 14, "x", 60); K.streaks(Jr, jA0, jA1, jB - 8, 10, "B", 60)
    K.mud(Jl, jD0, jD1, 30, "x")
    K.pyramid(jA0 - 2, jA1 + 2, jD0 - 2, jD1 + 2, jB, jRf, "s", "S")
    for (let t = 0.1; t < 1; t += 0.1) {
      const h = jB + (jRf - jB) * t, ac = (jA0 + jA1) / 2, dc = (jD0 + jD1) / 2
      const a0 = jA0 - 4 + (ac - jA0 + 4) * t, d0 = jD0 - 4 + (dc - jD0 + 4) * t, a1 = jA1 + 4 - (jA1 + 4 - ac) * t, d1 = jD1 + 4 - (jD1 + 4 - dc) * t
      c.line(...K.p(a0, d0, h), ...K.p(a0, d1, h), "a"); c.line(...K.p(a0, d0, h), ...K.p(a1, d0, h), "A")
    }
    // renesanční vikýř ve střeše k mostu
    const Jd = FLa(jA0 + 30)
    quad(Jd, 240, 272, jB + 6, jB + 34, "p"); c.poly([...Jd(238, jB + 34), ...Jd(274, jB + 34), ...Jd(256, jB + 50)], "p")
    quad(Jd, 250, 262, jB + 10, jB + 28, "k")
    K.ball((jA0 + jA1) / 2, (jD0 + jD1) / 2, jRf, 14)

    // --- BRÁNA s cimbuřím mezi věžemi ---
    box(gA0, lenR - 10, tD1 - 4, jD0 + 4, 0, gH)
    const Gl = FLa(gA0)
    K.ashlar(Gl, tD1 - 4, jD0 + 4, 0, gH, MST_SL, MST_DK, "4")
    K.gate(gA0, lenR - 10, 134, 186, 70, 118)
    // znaky nad branou (prapory po pádu pryč, zbyly háky) a ochoz s cimbuřím
    ;[[142, "V"], [160, "Y"], [176, "b"]].forEach(([u, col]) => { quad(Gl, u, u + 8, 128, 140, MST_HL); quad(Gl, u + 1, u + 7, 129, 139, col) })
    quad(Gl, tD1 - 4, jD0 + 4, gH - 4, gH, MST_HL)
    for (let u = tD1; u < jD0; u += 14) { quad(Gl, u, u + 8, gH, gH + 14, MST_SL); quad(Gl, u, u + 8, gH + 12, gH + 14, MST_HL) }
    K.mud(Gl, tD1 - 4, 134); K.mud(Gl, 186, jD0 + 4)

    // --- MALOSTRANSKÁ VĚŽ (nejblíž) ---
    const Tl = FLa(0), Tr = FRd(0)
    K.turret(tA1 - 4, tD1 - 4, tB + 26, tB + 70, 9, tB + 140)
    box(0, tA1, 0, tD1, 0, tB)
    K.ashlar(Tl, 0, tD1, 0, tB, MST_SL, MST_DK, "4")
    K.ashlar(Tr, 0, tA1, 0, tB, MST_SR, "k", MST_DK)
    quad(Tl, 0, 6, 0, tB, MST_HL); quad(Tl, tD1 - 6, tD1, 0, tB, MST_HL); quad(Tr, 0, 6, 0, tB, MST_SL)
    // patrová římsa a okna
    quad(Tl, 0, tD1, 140, 144, MST_HL); quad(Tr, 0, tA1, 140, 144, MST_SL)
    quad(Tl, 50, 74, 96, 126, MST_HL); quad(Tl, 52, 72, 98, 124, "n"); c.line(...Tl(62, 98), ...Tl(62, 124), "M"); c.line(...Tl(52, 111), ...Tl(72, 111), "M")
    for (let v = 40; v < 130; v += 46) quad(Tr, 100, 106, v, v + 18, "k")
    quad(Tr, 40, 60, 96, 122, MST_SL); quad(Tr, 42, 58, 98, 120, "k")
    // slepé kružby s vimperky v horním patře průčelí, v jednom poli výklenek s cenovkou
    for (let k = 0; k < 5; k++) {
      const u = 10 + k * 22
      if (k === 2) { K.niche(Tl, u + 2, u + 16, 170, 214, false); continue }
      K.lancet(Tl, u + 4, u + 14, 176, 236, MST_DK, MST_HL)
      c.poly([...Tl(u + 1, 248), ...Tl(u + 17, 248), ...Tl(u + 9, 266)], MST_HL)
      c.line(...Tl(u + 9, 248), ...Tl(u + 9, 262), MST_DK)
    }
    for (let k = 0; k <= 5; k++) { const u = 9 + k * 22; quad(Tl, u - 1, u + 2, 164, 270, MST_HL); c.poly([...Tl(u - 2, 270), ...Tl(u + 3, 270), ...Tl(u + 0.5, 280)], MST_HL) }
    for (let k = 0; k < 3; k++) K.lancet(Tr, 20 + k * 38, 30 + k * 38, 176, 236, MST_DK, MST_SL)
    K.streaks(Tl, 6, tD1 - 6, tB - 6, 14, "3", 80); K.streaks(Tr, 6, tA1, tB - 6, 14, "k", 90)
    K.mud(Tl, 0, tD1); K.mud(Tr, 0, tA1, 30, "H")
    K.gallery(0, tA1, 0, tD1, tB)
    K.turret(tA1 - 4, 4, tB + 26, tB + 70, 9, tB + 140)
    K.turret(4, tD1 - 4, tB + 26, tB + 70, 9, tB + 140)
    K.hipRoof(8, tA1 - 8, 8, tD1 - 8, tB + 22, tRf, 44)
    K.turret(4, 4, tB + 26, tB + 70, 9, tB + 140)
  }, glow("f", { r: 8, strength: 0.5 }))
}

mstVezStare("lm_vez_stare", { w: 3, dpt: 3, seed: 41 })
mstVezeMale("lm_veze_male", { w: 3, dpt: 5, seed: 43 })

sheet("landmarks_most", ["lm_vez_stare", "lm_veze_male"], { pad: 1 })
