// Václavák po pádu: Národní muzeum jako landmark, prázdný podstavec svatého Václava s živým Václavem na směny,
// postavy (dispečerka, revizor, Kuřačka), nutrie na reproduktoru, loďka u mola a nouzový výlez z metra.
// Geometrie landmarku jako fanta(): počátek v nejbližším spodním rohu, FR podél osy a (pravá stěna, +b), FL napříč
// (levá stěna, −a). Hlavní průčelí muzea míří dolů do náměstí (−a), je to tedy levá stěna.

// Národní muzeum (Josef Schulz, 1891): neorenesanční palác z pískovce, střední rizalit se sloupy a atikou, nárožní
// pavilony s kopulkami, uprostřed velká kupole s lucernou. Po pádu: stopy po kulkách (jako po roce 1968), propadlý kus
// kupole, saze z oken, sprej na soklu. Půdorys 12 × 15 dlaždic (a 112–123, b 7–21), viz src/places/vaclavak.js.
function muzeum(name, o) {
  const w = o.w, dpt = o.dpt
  const lenR = FT * w, lenL = FT * dpt
  const H = 280, HP = 320, HR = 360
  const W = FT * (w + dpt), Hc = 32 * (w + dpt) + 540
  const ox = FT * dpt, oy = Hc - 1
  const stone = "c", light = "W", shade = "e", dark = "C"
  sprite(name, { w: W, h: Hc }, (c) => {
    const rng = c.rng(o.seed ?? 1)
    const P = (pts, col) => c.poly(Fs(pts, ox, oy), col)
    const pav = (u) => u < 150 || u > lenL - 150
    const ris = (u) => u > lenL / 2 - 110 && u < lenL / 2 + 110
    // levé průčelí: hmota, pavilony a rizalit vyšší
    P(Fq(FL, 0, lenL, 0, H), stone)
    P(Fq(FL, 0, 150, 0, HP), stone); P(Fq(FL, lenL - 150, lenL, 0, HP), stone)
    P(Fq(FL, lenL / 2 - 110, lenL / 2 + 110, 0, HR), stone)
    // pravá (boční) stěna ve stínu
    P(Fq(FR, 0, lenR, 0, H), dark); P(Fq(FR, 0, 150, 0, HP), dark); P(Fq(FR, lenR - 150, lenR, 0, HP), dark)
    // sokl s kvádrováním
    P(Fq(FL, 0, lenL, 0, 56), dark); P(Fq(FR, 0, lenR, 0, 56), "e")
    for (let v = 12; v < 56; v += 14) { P(Fq(FL, 0, lenL, v, v + 1), shade); P(Fq(FR, 0, lenR, v, v + 1), "3") }
    // schodiště před rizalitem (rampa k hlavnímu vchodu)
    for (let v = 0; v < 48; v += 6) P(Fq(FL, lenL / 2 - 130 + v, lenL / 2 + 130 - v, v, v + 3), v % 12 ? "q" : light)
    // okna: dvě řady na průčelí i boku, s rámem a půlkruhovým nadpražím; některá vybitá, některá zatlučená
    const win = (F, u, v, wd, ht) => {
      P(Fq(F, u - 3, u + wd + 3, v - 3, v + ht + 3), light)
      const roll = rng(), col = roll < 0.18 ? "k" : roll < 0.3 ? "h" : "n"
      P(Fq(F, u, u + wd, v, v + ht), col)
      P([...F(u - 3, v + ht + 3), ...F(u + wd + 3, v + ht + 3), ...F(u + wd / 2, v + ht + 14)], light)
      if (col === "h") for (let k = 4; k < ht; k += 8) P(Fq(F, u, u + wd, v + k, v + k + 2), "H")
      // saze nad vybitým oknem
      if (col === "k") P([...F(u, v + ht + 14), ...F(u + wd, v + ht + 14), ...F(u + wd - 2, v + ht + 40), ...F(u + 2, v + ht + 34)], "x")
    }
    for (let u = 22; u + 22 < lenL - 10; u += 44) {
      if (ris(u)) continue
      win(FL, u, 76, 20, 58)
      win(FL, u, 170, 20, pav(u) ? 70 : 58)
    }
    for (let u = 22; u + 22 < lenR - 10; u += 44) { win(FR, u, 76, 20, 58); win(FR, u, 170, 20, 58) }
    // rizalit: šest sloupů přes dvě patra, mezi nimi vysoká okna, nad nimi atika s nápisem
    const r0 = lenL / 2 - 104
    for (let k = 0; k < 6; k++) {
      const u = r0 + 8 + k * 38
      P(Fq(FL, u, u + 12, 60, HR - 70), light); P(Fq(FL, u + 9, u + 12, 60, HR - 70), shade)
      P(Fq(FL, u - 3, u + 15, HR - 76, HR - 70), light)
      if (k < 5) { P(Fq(FL, u + 17, u + 33, 90, 250), rng() < 0.3 ? "k" : "n"); P([...FL(u + 15, 250), ...FL(u + 35, 250), ...FL(u + 25, 262)], light) }
    }
    P(Fq(FL, r0 - 6, r0 + 214, HR - 70, HR - 58), light)
    P(Fq(FL, r0, r0 + 208, HR - 58, HR), stone)
    // NÁRODNÍ MUZEUM na atice písmem do roviny levé stěny; čte se zleva doprava, tedy od vzdálenějšího konce stěny
    // (velké u) k bližšímu: zrcadlová mapa stěny, aby písmena nebyla obráceně.
    const FLr = (u, v) => FL(r0 + 200 - u, v)
    wallText(c, FLr, ox, oy, 4, HR - 32, "NÁRODNÍ MUZEUM", "3", { sc: 3, outline: light })
    // korunní římsa s balustrádou po celém obvodu
    ;[[FL, lenL], [FR, lenR]].forEach(([F, len]) => {
      P(Fq(F, 0, len, H - 16, H), light); P(Fq(F, 0, len, H - 18, H - 16), shade)
      for (let u = 4; u < len; u += 9) P(Fq(F, u, u + 4, H, H + 14), stone)
      P(Fq(F, 0, len, H + 14, H + 18), light)
    })
    ;[[0, 150], [lenL - 150, lenL]].forEach(([u0, u1]) => { P(Fq(FL, u0, u1, HP - 14, HP), light); for (let u = u0 + 4; u < u1; u += 9) P(Fq(FL, u, u + 4, HP, HP + 12), stone) })
    // střecha: křídla kolem dvou dvorů (šedý plech s hřebeny a měděnými hranami), střední křídlo nese kupoli.
    // Bod na rovině střechy: ur podél pravé stěny, ul podél levé, výška Hh.
    const T = (ur, ul, Hh = H + 18) => [ur - ul, -ur / 2 - ul / 2 - Hh]
    const roofQ = (r0, r1, l0, l1, col, Hh) => P([...T(r0, l0, Hh), ...T(r1, l0, Hh), ...T(r1, l1, Hh), ...T(r0, l1, Hh)], col)
    roofQ(0, lenR, 0, lenL, "S")
    const d = 150, mid0 = lenL / 2 - 90, mid1 = lenL / 2 + 90
    // hřebeny křídel: čára uprostřed pásu kolem obvodu
    ;[[d / 2, d / 2, lenR - d / 2, d / 2], [d / 2, lenL - d / 2, lenR - d / 2, lenL - d / 2], [d / 2, d / 2, d / 2, lenL - d / 2], [lenR - d / 2, d / 2, lenR - d / 2, lenL - d / 2], [d / 2, lenL / 2, lenR - d / 2, lenL / 2]]
      .forEach(([r0, l0, r1, l1]) => c.line(...Fs(T(r0, l0, H + 34), ox, oy), ...Fs(T(r1, l1, H + 34), ox, oy), "m", 2))
    // dva dvory: otvor ve střeše, v něm hluboko dole tmavá dlažba a vidět jsou jen vzdálenější vnitřní stěny
    // (ty míří k divákovi); bližší stěny zakrývá okraj střechy, proto se všechno ořízne otvorem.
    const DEEP = 120
    ;[[d, lenR - d, d, mid0], [d, lenR - d, mid1, lenL - d]].forEach(([r0, r1, l0, l1]) => {
      const hole = Fs([...T(r0, l0), ...T(r1, l0), ...T(r1, l1), ...T(r0, l1)], ox, oy)
      c.clip(hole, () => {
        P([...T(r0, l0, H - DEEP), ...T(r1, l0, H - DEEP), ...T(r1, l1, H - DEEP), ...T(r0, l1, H - DEEP)], "x")
        P([...T(r0, l1), ...T(r1, l1), ...T(r1, l1, H - DEEP), ...T(r0, l1, H - DEEP)], "e")
        P([...T(r1, l0), ...T(r1, l1), ...T(r1, l1, H - DEEP), ...T(r1, l0, H - DEEP)], "C")
        for (let u = r0 + 20; u < r1 - 20; u += 40) P([...T(u, l1, H - 20), ...T(u + 14, l1, H - 20), ...T(u + 14, l1, H - 60), ...T(u, l1, H - 60)], "n")
        for (let u = l0 + 20; u < l1 - 20; u += 40) P([...T(r1, u, H - 20), ...T(r1, u + 14, H - 20), ...T(r1, u + 14, H - 60), ...T(r1, u, H - 60)], "n")
        // stín na dlažbě od bližších stěn
        P([...T(r0, l0, H - DEEP), ...T(r1, l0, H - DEEP), ...T(r1, l0 + 40, H - DEEP), ...T(r0, l0 + 40, H - DEEP)], "A")
      })
    })
    ;[[0, lenR, 0, 4], [0, 4, 0, lenL]].forEach(([r0, r1, l0, l1]) => roofQ(r0, r1, l0, l1, "j"))
    // kopulky nárožních pavilonů (dvě viditelné)
    ;[FL(75, HP + 12), FL(lenL - 75, HP + 12)].forEach((p) => {
      const [x, y] = Fs(p, ox, oy)
      c.rect(x - 30, y - 24, 60, 24, stone); c.rect(x - 30, y - 24, 60, 4, light)
      c.clip([x - 34, y - 80, 68, 56], () => c.ellipse(x, y - 24, 30, 48, "Q"))
      c.line(x - 10, y - 66, x - 14, y - 26, "j"); c.line(x + 10, y - 66, x + 14, y - 26, "j")
      c.rect(x - 3, y - 84, 6, 12, "Y")
    })
    // velká kupole nad středem půdorysu: buben s okny, kupole s žebry, kus propadlý, lucerna a špice
    const [cx, cy] = Fs([lenR / 2 - lenL / 2, -lenR / 4 - lenL / 4 - H - 18], ox, oy)
    const DR = 150, DH = 110
    c.ellipse(cx, cy, DR, DR / 2, shade)
    c.rect(cx - DR, cy - DH, DR * 2, DH, stone); c.ellipse(cx, cy, DR, DR / 2 - 4, stone)
    c.rect(cx - DR, cy - DH, DR * 2, 8, light); c.rect(cx + DR / 2, cy - DH, DR / 2, DH, dark)
    for (let x = -DR + 14; x < DR - 20; x += 30) { c.rect(cx + x, cy - DH + 22, 14, 60, rng() < 0.25 ? "k" : "n"); c.rect(cx + x - 3, cy - DH + 18, 20, 4, light); c.rect(cx + x + 4, cy - DH + 22, 4, 60, light) }
    c.clip([cx - DR - 6, cy - DH - 250, DR * 2 + 12, 250], () => c.ellipse(cx, cy - DH, DR - 4, 240, "j"))
    c.clip([cx + DR / 3, cy - DH - 250, DR, 250], () => c.ellipse(cx, cy - DH, DR - 4, 240, "Q"))
    for (let k = -4; k <= 4; k++) c.line(cx + k * 34, cy - DH - 2, cx + k * 10, cy - DH - 228, "j")
    c.line(cx - DR + 8, cy - DH - 50, cx + DR - 8, cy - DH - 50, "j"); c.line(cx - DR + 30, cy - DH - 130, cx + DR - 30, cy - DH - 130, "j")
    // propadlina v kupoli: tmavá díra s polámanými žebry
    c.poly([cx + 30, cy - DH - 190, cx + 104, cy - DH - 150, cx + 112, cy - DH - 70, cx + 50, cy - DH - 56, cx + 20, cy - DH - 120], "k")
    c.line(cx + 44, cy - DH - 184, cx + 64, cy - DH - 60, "S", 2); c.line(cx + 84, cy - DH - 166, cx + 90, cy - DH - 62, "S", 2)
    c.rect(cx - 26, cy - DH - 290, 52, 56, stone); c.rect(cx - 26, cy - DH - 290, 52, 5, light)
    for (let x = -18; x < 18; x += 10) c.rect(cx + x, cy - DH - 280, 5, 34, "n")
    c.ellipse(cx, cy - DH - 292, 28, 14, "Q"); c.rect(cx - 3, cy - DH - 340, 6, 46, "Y"); c.circ(cx, cy - DH - 342, 4, "y")
    // stopy po kulkách a střepinách, stékance, plevel na římse
    for (let i = 0; i < 260; i++) {
      const left = rng() < 0.6, F = left ? FL : FR, len = left ? lenL : lenR
      const [x, y] = Fs(F(8 + rng() * (len - 16), 60 + rng() * (H - 90)), ox, oy)
      c.rect(x, y, 2, 2, rng() < 0.5 ? "e" : "3")
    }
    for (let i = 0; i < lenL / 7; i++) { const u = 3 + Math.floor(rng() * (lenL - 6)); const [x, y] = Fs(FL(u, H - 16), ox, oy); c.vline(x, y, 20 + Math.floor(rng() * 120), rng() < 0.3 ? "U" : shade) }
    for (let u = 0; u < lenL; u += 3) if (rng() < 0.4) { const [x, y] = Fs(FL(u, H + 18), ox, oy); c.vline(x, y - 4, 3 + Math.floor(rng() * 4), rng() < 0.5 ? "G" : "Q") }
    // sprej lidí z metra na soklu boku: ŘÁD JE ZAPSANÝ
    slant(c, ox, oy, 40, 20, "R^A'D JE ZAPSANY'", "E", 15)
  })
}
muzeum("lm_muzeum", { w: 12, dpt: 15, seed: 21 })

// Prázdný podstavec pomníku svatého Václava (žula, schody) a na něm Václav na směny: přilba, červený plášť, kopí z tyče
// od tramvaje. Jeden sprite: postava je součást podstavce (stojí nahoře, nehýbe se).
sprite("vaclav", { w: 96, h: 200 }, (c) => {
  // podstavec v izometrii: přední dvě stěny a vršek
  c.poly([8, 150, 48, 170, 48, 196, 8, 176], "9"); c.poly([48, 170, 88, 150, 88, 176, 48, 196], "P")
  c.poly([8, 150, 48, 130, 88, 150, 48, 170], "q")
  c.poly([16, 112, 48, 128, 48, 166, 16, 150], "9"); c.poly([48, 128, 80, 112, 80, 150, 48, 166], "P")
  c.poly([16, 112, 48, 96, 80, 112, 48, 128], "5")
  for (let y = 120; y < 160; y += 10) { c.line(16, y, 48, y + 16, "k"); c.line(48, y + 16, 80, y, "x") }
  // cenovka místo sochy a jízdenky naházené kolem
  c.rect(52, 136, 16, 10, "W"); c.text(54, 138, "90", "k")
  ;[[20, 160], [70, 162], [34, 172], [60, 176]].forEach(([x, y]) => { c.rect(x, y, 6, 3, "y"); c.px(x + 3, y + 1, "k") })
  // Václav: vlastní postava z art/lide-a.px.js (vousáč v kartonovém brnění a plechové přilbě), za ním rudý plášť
  c.poly([38, 66, 60, 66, 66, 106, 32, 106], "V"); c.line(32, 106, 66, 106, "D"); c.line(40, 70, 36, 104, "D")
  c.stamp("_vaclav_fig", 36, 44)
  c.line(64, 20, 64, 108, "M", 2); c.poly([60, 20, 64, 8, 68, 20], "m")
}, )

// Postavy: záměny barev hrdinky jako na Hlaváku. Dispečerka: šedá uniforma metra, sluchátka s mikrofonem, rudé vlasy.
// Revizor: tmavomodrá bunda, čepice se žlutým odznakem. Kuřačka: oranžová záchranná vesta, světlé vlasy, cigareta.

// Reproduktor u Jindřišské: sloup s trychtýřem rozhlasu, na něm sedí nutrie (2 snímky: ocas a čenich).
function speakerPole(c) {
  c.rect(26, 40, 4, 136, "M"); c.rect(28, 40, 2, 136, "m"); c.rect(20, 172, 16, 6, "x")
  c.poly([30, 52, 50, 42, 52, 62, 30, 60], "S"); c.ellipse(51, 52, 4, 10, "k")
  c.poly([30, 72, 8, 64, 6, 84, 30, 80], "S"); c.ellipse(7, 74, 3, 10, "k")
}
// Po nutrii zůstal jen sloup, ohryzaný kabel a knoflík hlasitosti.
sprite("reproduktor_prazdny", { w: 56, h: 180 }, (c) => {
  speakerPole(c)
  c.rect(25, 36, 6, 4, "M"); c.px(27, 35, "m"); c.line(30, 86, 34, 96, "k"); c.px(34, 97, "y")
  c.rect(24, 100, 8, 6, "S"); c.circ(28, 103, 2, "k"); c.px(28, 102, "y")
})
anim("reproduktor", { w: 56, h: 180, fps: 3 }, (c) => {
  speakerPole(c)
  // nutrie: hnědé tělo, oranžové zuby, šupinatý ocas
  const t = c.phase ?? 0
  c.ellipse(28, 34, 12, 8, "u"); c.ellipse(19, 30, 6, 5, "U"); c.rect(14, 31, 2, 3, "f"); c.px(17, 28, "k")
  c.line(38, 36, 46, 30 + Math.round(Math.sin(t * Math.PI * 2) * 3), "3", 2)
  c.rect(24, 40, 3, 3, "3"); c.rect(32, 40, 3, 3, "3")
}, frame(), frame((c) => c.px(13, 32, "k")))

// Motorový člun loďkařů u mola: dřevěný trup s rezavým plechem, přívěsný motor, pneumatika jako blatník.
sprite("lodka", { w: 120, h: 64, outline: "k" }, (c) => {
  c.poly([6, 34, 70, 6, 112, 26, 50, 56], "H"); c.poly([10, 34, 70, 10, 106, 27, 50, 52], "h")
  c.poly([18, 34, 70, 14, 98, 28, 50, 46], "3")
  for (let i = 0; i < 4; i++) c.line(26 + i * 16, 32 - i * 7, 54 + i * 12, 44 - i * 4, "H")
  c.rect(98, 18, 12, 14, "k"); c.rect(100, 20, 8, 8, "S"); c.line(104, 32, 108, 46, "M", 2)
  c.ellipse(46, 50, 8, 4, "k"); c.poly([20, 30, 40, 20, 46, 26, 26, 36], "U")
})

// Nouzový výlez ze stanice: betonový kvádr s plechovými dveřmi a malým znakem metra.
sprite("vylez", { w: 80, h: 96 }, (c) => {
  c.poly([4, 44, 40, 62, 40, 94, 4, 76], "P"); c.poly([40, 62, 76, 44, 76, 76, 40, 94], "x")
  c.poly([4, 44, 40, 26, 76, 44, 40, 62], "q")
  c.poly([48, 62, 66, 53, 66, 80, 48, 89], "S"); c.line(48, 62, 66, 53, "m"); c.px(63, 68, "y")
  c.rect(16, 54, 12, 12, "k"); c.poly([18, 56, 26, 56, 22, 64], "W")
  c.line(8, 76, 36, 90, "U")
})

// Nutrie na kraji vody po seskoku z reproduktoru: sedí bokem, uražená, ocas ve vodě (2 snímky: ocas, čenich).
anim("nutrie_breh", { w: 34, h: 22, outline: "k", fps: 2 }, (c) => {
  const t = c.phase ?? 0
  c.ellipse(16, 13, 11, 7, "u"); c.ellipse(17, 15, 9, 4, "U"); c.ellipse(26, 9, 5, 4, "U")
  c.px(28, 8, "k"); c.rect(30, 10, 2, 2, "f")
  c.line(6, 15, 1, 19 + Math.round(Math.sin(t * Math.PI * 2)), "3", 2)
  c.rect(12, 19, 3, 2, "3"); c.rect(20, 19, 3, 2, "3")
}, frame(), frame((c) => c.px(31, 9, "k")))

// Nutrie do boje (zvětší se 4×): hnědé tělo, oranžové zuby, šupinatý ocas; 2 snímky (ocas, čenich).
anim("nutrie", { w: 48, h: 28, outline: "k", fps: 3 }, (c) => {
  c.ellipse(26, 16, 15, 9, "u"); c.ellipse(26, 18, 13, 6, "U"); c.ellipse(11, 12, 7, 6, "u")
  c.rect(4, 13, 3, 4, "f"); c.px(9, 9, "k"); c.px(5, 11, "k"); c.rect(14, 6, 3, 3, "U")
  c.rect(16, 24, 3, 3, "3"); c.rect(30, 24, 3, 3, "3")
  c.line(40, 20, 47, 24, "3", 2)
}, frame(), frame((c) => { c.line(40, 20, 47, 18, "3", 2); c.px(3, 12, "k") }))

// Dům Na Můstku (dřív ČKD, Šrámková a Šrámek, 1983) na spodním konci náměstí, zatopený po mezanin: světlý kamenný
// rastr s velkými čtvercovými okny, prosklené nárožní schodiště, na ploché střeše skleněná valená klenba s kulatými
// hodinami v čele (stojí na 14:37) a figury na atice. Předloha: fotky z Wikimedia Commons, jen předloha. Půdorys
// 3 × 3 dlaždice, počátek ve spodním rohu u hladiny. Na stěně k +b je tmavý rám pro neonovou obálku (obalka_neon).
{
  const MW = 3, MD = 3, MH = 230, mx0 = 64 * MD, mHc = 530, my0 = mHc - 1
  sprite("lm_mustek", { w: 64 * (MW + MD), h: mHc }, (c) => {
    const rng = c.rng(48)
    const rd = Math.round
    const L = (u, v) => [rd(mx0 - u), rd(my0 - u / 2 - v)], R = (u, v) => [rd(mx0 + u), rd(my0 - u / 2 - v)]
    const Q = (F, u0, u1, v0, v1) => [...F(u0, v0), ...F(u1, v0), ...F(u1, v1), ...F(u0, v1)]
    const T = (ua, ub, h = 0) => [rd(mx0 + ua - ub), rd(my0 - MH - ua / 2 - ub / 2 - h)]
    const lenL = 64 * MD, lenR = 64 * MW, mez = 26, fh = 40
    // stěny: světlý kámen, stěna k +b ve stínu
    c.poly(Q(L, 0, lenL, 0, MH), "5"); c.poly(Q(R, 0, lenR, 0, MH), "6")
    // zatopený mezanin: sklo ve světlých rámech, půlka pod hladinou
    const mezanin = (F, len) => { for (let u = 22; u + 26 <= len - 4; u += 32) { c.poly(Q(F, u - 2, u + 28, 0, mez - 2), "x"); c.poly(Q(F, u, u + 26, 0, mez - 4), rng() < 0.3 ? "k" : "N"); c.line(...F(u + 13, 0), ...F(u + 13, mez - 4), "M") } }
    mezanin(L, lenL); mezanin(R, lenR)
    c.poly(Q(L, 0, lenL, mez - 2, mez + 2), "x"); c.poly(Q(R, 0, lenR, mez - 2, mez + 2), "P")
    // patra: velká čtvercová okna se světlým rámem, tmavé sklo s odrazem, některá vybitá, některá zatlučená
    const okna = (F, len, frame) => {
      for (let f = 0; f < 5; f++) {
        const v = mez + 4 + f * fh
        c.line(...F(0, v + fh - 2), ...F(len, v + fh - 2), "x")
        for (let u = 24; u + 24 <= len - 4; u += 32) {
          c.poly(Q(F, u - 2, u + 26, v + 4, v + 34), frame)
          const t = rng(), g = t < 0.16 ? "k" : t < 0.74 ? "n" : t < 0.9 ? "N" : "H"
          c.poly(Q(F, u, u + 24, v + 6, v + 32), g)
          if (g === "n") { c.line(...F(u + 3, v + 28), ...F(u + 10, v + 12), "L"); if (rng() < 0.4) c.line(...F(u + 14, v + 30), ...F(u + 20, v + 18), "L") }
          if (g === "H") for (let k = 0; k < 3; k++) c.line(...F(u, v + 10 + k * 8), ...F(u + 24, v + 12 + k * 8), "U")
          if (g === "k") { c.line(...F(u, v + 6), ...F(u + 7, v + 14), "l"); c.line(...F(u + 24, v + 32), ...F(u + 18, v + 22), "l") }
          // šmouha pod parapetem
          if (rng() < 0.6) c.line(...F(u + 3 + rng() * 18, v + 4), ...F(u + 3 + rng() * 18, v - 4 - rng() * 14), "x")
        }
      }
    }
    okna(L, lenL, "W"); okna(R, lenR, "w")
    // rám pro neon na stěně k +b (obálka je zvlášť, bliká)
    c.poly(Q(R, 84, 176, 112, 176), "k"); c.poly(Q(R, 86, 174, 114, 174), "A")
    c.line(...R(90, 112), ...R(90, 96), "U"); c.line(...R(168, 112), ...R(168, 100), "U")
    // prosklené nárožní schodiště přes všechna patra
    c.poly(Q(L, 0, 18, 0, MH + 4), "n"); c.poly(Q(R, 0, 18, 0, MH + 4), "N")
    for (const u of [5, 11]) { c.line(...L(u, 0), ...L(u, MH + 4), "M"); c.line(...R(u, 0), ...R(u, MH + 4), "S") }
    for (let v = mez; v < MH; v += fh / 2) { c.line(...L(0, v), ...L(18, v), "M"); c.line(...R(0, v), ...R(18, v), "S") }
    c.line(...L(2, 40), ...L(8, 150), "l"); c.line(...L(13, 90), ...L(15, 200), "L")
    c.poly(Q(L, 18, 20, 0, MH + 4), "W"); c.poly(Q(R, 18, 20, 0, MH + 4), "w")
    c.poly(Q(L, 6, 12, 150, 172), "k"); c.poly(Q(R, 6, 12, 60, 84), "k")
    // atika
    c.poly(Q(L, 0, lenL, MH - 5, MH), "W"); c.poly(Q(R, 0, lenR, MH - 5, MH), "w")
    // špína: stékance pod atikou, rez, mokrý pruh a řasy nad hladinou
    for (let i = 0; i < 26; i++) { const u = 22 + rng() * (lenL - 26); c.line(...L(u, MH - 6), ...L(u + (rng() - 0.5) * 2, MH - 12 - rng() * 30), rng() < 0.3 ? "U" : "x") }
    for (let i = 0; i < 18; i++) { const u = 22 + rng() * (lenR - 26); c.line(...R(u, MH - 6), ...R(u + (rng() - 0.5) * 2, MH - 12 - rng() * 30), rng() < 0.3 ? "U" : "P") }
    c.clip((x, y) => c.is(x, y, "56xP"), () => { c.poly(Q(L, 0, lenL, 0, 14), "v"); c.poly(Q(R, 0, lenR, 0, 14), "P") })
    for (let u = 2; u < lenL; u += 3) if (rng() < 0.55) { const [x, y] = L(u, 0); c.vline(x, y - 2 - rd(rng() * 5), 3 + rd(rng() * 4), rng() < 0.5 ? "G" : "Q") }
    for (let u = 2; u < lenR; u += 3) if (rng() < 0.55) { const [x, y] = R(u, 0); c.vline(x, y - 2 - rd(rng() * 5), 3 + rd(rng() * 4), rng() < 0.5 ? "G" : "Q") }
    for (let u = 6; u < lenL; u += 14) { const [x, y] = L(u, 0); c.hline(x - 4, y, 6, rng() < 0.5 ? "J" : "Z") }
    for (let u = 6; u < lenR; u += 14) { const [x, y] = R(u, 0); c.hline(x - 2, y, 6, rng() < 0.5 ? "J" : "Z") }
    // plochá střecha: lepenka v pásech, skvrny, větrací hlavice, plevel u atiky
    c.poly([...T(0, 0), ...T(lenR, 0), ...T(lenR, lenL), ...T(0, lenL)], "c")
    c.poly([...T(5, 5), ...T(lenR - 5, 5), ...T(lenR - 5, lenL - 5), ...T(5, lenL - 5)], "S")
    for (let ub = 30; ub < lenL - 6; ub += 28) c.line(...T(5, ub), ...T(lenR - 5, ub), "A")
    for (let i = 0; i < 7; i++) { const ua = 14 + rng() * 40, ub = 20 + rng() * (lenL - 50), r = 6 + rng() * 10; c.poly([...T(ua, ub), ...T(ua + r, ub), ...T(ua + r, ub + r), ...T(ua, ub + r)], rng() < 0.5 ? "A" : "s") }
    for (const [ua, ub] of [[26, 60], [30, 150], [168, 168]]) { const [vx, vy] = T(ua, ub); c.rect(vx - 3, vy - 10, 6, 10, "M"); c.rect(vx - 3, vy - 10, 2, 10, "m"); c.rect(vx - 5, vy - 13, 10, 3, "x") }
    for (let i = 0; i < 14; i++) { const [x, y] = T(6 + rng() * 3, 8 + rng() * (lenL - 16)); c.vline(x, y - 3, 3, "g") }
    c.line(...T(5, 5), ...T(lenR - 5, 5), "A"); c.line(...T(5, 5), ...T(5, lenL - 5), "A")
    // skleněná valená klenba napříč střechou, v čele k +b kulaté hodiny
    const va = 108, vr = 36, vb0 = 26, vb1 = 156
    const arc = (ub, r = vr) => { const p = []; for (let i = 0; i <= 20; i++) { const t = i / 20 * Math.PI; p.push(...T(va + r * Math.cos(t), ub, r * Math.sin(t))) } return p }
    for (let ub = vb1; ub >= vb0; ub -= 2) c.poly(arc(ub), "L")
    c.poly(arc(vb1), "n")
    for (let ub = vb1; ub >= vb0; ub -= 2) c.poly(arc(ub), "L")
    for (let ub = vb0 + 20; ub < vb1; ub += 22) { const p = arc(ub); for (let i = 0; i + 3 < p.length; i += 2) c.line(p[i], p[i + 1], p[i + 2], p[i + 3], "M") }
    for (const t of [0.3, 0.5, 0.72]) c.line(...T(va + vr * Math.cos(t * Math.PI), vb0, vr * Math.sin(t * Math.PI)), ...T(va + vr * Math.cos(t * Math.PI), vb1, vr * Math.sin(t * Math.PI)), t === 0.72 ? "l" : "M")
    // vybité tabule
    for (const [ub, t] of [[60, 0.6], [104, 0.4], [130, 0.66], [84, 0.8]]) { const a = va + vr * Math.cos(t * Math.PI), h = vr * Math.sin(t * Math.PI); c.poly([...T(a, ub, h), ...T(a, ub + 18, h), ...T(a + 9, ub + 18, h - 5), ...T(a + 9, ub, h - 5)], "N") }
    c.poly(arc(vb0), "S")
    { const p = arc(vb0); for (let i = 0; i + 3 < p.length; i += 2) c.line(p[i], p[i + 1], p[i + 2], p[i + 3], "M") }
    c.line(...T(va - vr, vb0), ...T(va + vr, vb0), "M")
    const disc = (r) => { const p = []; for (let i = 0; i < 28; i++) { const t = i / 28 * Math.PI * 2; p.push(...T(va + r * Math.cos(t), vb0, 17 + r * Math.sin(t))) } return p }
    c.poly(disc(15), "k"); c.poly(disc(13), "W")
    for (let i = 0; i < 12; i++) { const t = i / 12 * Math.PI * 2; c.px(...T(va + 11 * Math.cos(t), vb0, 17 + 11 * Math.sin(t)), "k") }
    // ručičky stojí na 14:37
    const hand = (deg, r) => { const t = (90 - deg) * Math.PI / 180; c.line(...T(va, vb0, 17), ...T(va + r * Math.cos(t), vb0, 17 + r * Math.sin(t)), "k") }
    hand(78.5, 7); hand(222, 11)
    // figury na atice směrem k Příkopům (tmavé siluety), jedna chybí
    for (const u of [108, 132, 180]) { const [sx, sy] = L(u, MH); c.rect(sx - 2, sy - 16, 5, 15, "S"); c.circ(sx, sy - 18, 2, "S"); c.rect(sx + 3, sy - 13, 2, 7, "S") }
    { const [sx, sy] = L(156, MH); c.rect(sx - 2, sy - 4, 5, 3, "S") }
    // hrany kvádru
    c.line(...L(0, 0), ...L(0, MH), "k"); c.line(...L(lenL, 0), ...L(lenL, MH), "3"); c.line(...R(lenR, 0), ...R(lenR, MH), "k")
    c.line(...L(0, MH), ...L(lenL, MH), "x"); c.line(...R(0, MH), ...R(lenR, MH), "k")
  })

  // Neonová obálka z loga Ecomailu (sídlí v domě Na Můstku) v rovině stěny k +b: tři zelené plochy, bliká a bzučí
  // jako neon, občas zhasne. Počátek vlevo dole. Barvy loga jsou mimo paletu schválně (neon smí být sytý).
  const OW = 84, OH = 56, oHc = OH + OW / 2
  const obalka = [["#a6e61f", "#59bc1c", "#3d942f"], ["#7fb01f", "#46901c", "#2f7026"], ["#2b3a20", "#22301c", "#1b2718"]]
  const blik = [0, 0, 0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 1, 2, 1, 0]
  anim("obalka_neon", { w: OW, h: oHc, frames: blik.length, fps: 8 }, (c) => {
    const [cj, cz, cxx] = obalka[blik[c.frame]]
    const P = (ex, ey) => [Math.round(ex), Math.round(oHc - 1 - ex / 2 - (OH - ey))]
    const r = 5
    const base = [...P(r, 0), ...P(OW - r, 0), ...P(OW, r), ...P(OW, OH - r), ...P(OW - r, OH), ...P(r, OH), ...P(0, OH - r), ...P(0, r)]
    const mx = OW * 20.884 / 42, my = OH * 18.541 / 28, bx = OW * 31.569 / 42
    c.poly(base, cj)
    c.clip(base, () => {
      c.poly([...P(mx, my), ...P(OW, 0), ...P(OW, OH), ...P(bx, OH)], cz)
      c.poly([...P(0, 0), ...P(OW, 0), ...P(mx, my)], cxx)
    })
  })
}
