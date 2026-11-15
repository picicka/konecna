// Václavák: rampa a kupole Národního muzea (samotné muzeum je z 3D modelu budov, scripts/ipr.py), věž paláce Koruna,
// neonová obálka, prázdný podstavec svatého Václava s živým Václavem na směny, postavy (dispečerka, revizor, Kuřačka),
// nutrie na reproduktoru, loďka u mola a nouzový výlez z metra.

// Rampa před Národním muzeem (podle fotek z Wikimedia Commons, jen předloha): muzeum stojí na terase 44 px nad
// náměstím, k ní stoupají ze stran dvě rampy s balustrádou, uprostřed je stěna kašny se třemi nikami a suchou nádrží
// a po jejích stranách dvě schodiště podél fasády. Půdorys a 110–124, b 7–21 (14 × 14 dlaždic), počátek ve spodním
// rohu; samotné muzeum je z 3D modelu budov a kreslí se nad terasou (src/places/vaclavak.js, lift 44).
{
  const RW = 14, RD = 14, RH = 44, bx = 64 * RD, hC = 32 * (RW + RD) + 90, by = hC - 1
  sprite("lm_muzeum_rampa", { w: 64 * (RW + RD), h: hC }, (c) => {
    const rng = c.rng(77)
    // bod: ta dlaždic od a 110, tb dlaždic od b 7, v výška v px
    const pt = (ta, tb, v = 0) => [Math.round(bx + 64 * ta - 64 * (RD - tb)), Math.round(by - 32 * ta - 32 * (RD - tb) - v)]
    const poly = (pts, col) => c.poly(pts.flatMap((p) => pt(...p)), col)
    const line = (p, q, col, w = 1) => c.line(...pt(...p), ...pt(...q), col, w)
    // terasa: horní plocha, pravý bok (k +b) a čelo (k −a)
    poly([[1.5, 0, RH], [RW, 0, RH], [RW, RD, RH], [1.5, RD, RH]], "q")
    poly([[1.5, RD, 0], [RW, RD, 0], [RW, RD, RH], [1.5, RD, RH]], "p")
    for (let v = 8; v < RH; v += 9) line([1.5, RD, v], [RW, RD, v], "P")
    for (let t = 1.7; t < RW; t += 0.42) line([t, RD, 0], [t, RD, RH], "P")
    line([1.5, RD, RH], [RW, RD, RH], "W", 2)
    poly([[1.5, 0, 0], [1.5, RD, 0], [1.5, RD, RH], [1.5, 0, RH]], "P")
    for (let v = 8; v < RH; v += 9) line([1.5, 0, v], [1.5, RD, v], "P")
    // rampy: plocha stoupá od krajů ke středu, zeď rampy v rovině ta 0,8
    const ramp = (t0, t1) => {   // t0 pata, t1 vrchol
      poly([[0.8, t0, 0], [1.5, t0, 0], [1.5, t1, RH], [0.8, t1, RH]], "q")
      for (let k = 1; k < 9; k++) { const t = t0 + (t1 - t0) * k / 9; line([0.8, t, RH * k / 9], [1.5, t, RH * k / 9], "p") }
      poly([[0.8, t0, 0], [0.8, t1, 0], [0.8, t1, RH]], "6")
      const n = Math.round(Math.abs(t1 - t0) * 9)
      for (let k = 2; k < n; k++) { const t = t0 + (t1 - t0) * k / n, h = RH * k / n; if (k % 3 === 0) line([0.8, t, 0], [0.8, t, h], "6"); line([0.8, t, h], [0.8, t, h + 7], k % 2 ? "q" : "6") }
      line([0.8, t0, 8], [0.8, t1, RH + 8], "W", 2); line([0.8, t0, 0], [0.8, t1, RH], "6")
    }
    ramp(1, 5.5)
    poly([[0.8, 5.5, RH], [1.5, 5.5, RH], [1.5, 8.6, RH], [0.8, 8.6, RH]], "q")
    poly([[0.8, 5.5, 0], [0.8, 8.6, 0], [0.8, 8.6, RH], [0.8, 5.5, RH]], "6")
    ramp(13, 8.6)
    // schodiště podél fasády: stupně po dvanácti, levé stoupá k +b, pravé k −b
    const stair = (t0, t1) => {
      const N = 12, lo = Math.min(t0, t1)
      const steps = Array.from({ length: N }, (_, i) => ({ t: t0 + (t1 - t0) * i / N, h: RH * (i + 1) / N })).sort((p, q) => Math.min(p.t, p.t + (t1 - t0) / N) - Math.min(q.t, q.t + (t1 - t0) / N))
      steps.forEach(({ t, h }, i) => { const ta = t, tb2 = t + (t1 - t0) / N; poly([[0.1, ta, h], [0.8, ta, h], [0.8, tb2, h], [0.1, tb2, h]], i % 2 ? "q" : "W"); poly([[0.1, Math.min(ta, tb2), 0], [0.1, Math.max(ta, tb2), 0], [0.1, Math.max(ta, tb2), h], [0.1, Math.min(ta, tb2), h]], "6"); line([0.1, Math.min(ta, tb2), h], [0.1, Math.max(ta, tb2), h], "6") })
      void lo
    }
    stair(4.4, 5.8)
    // stěna kašny: tři niky, zelené stékance, římsa a balustráda
    poly([[0.1, 5.8, RH], [0.8, 5.8, RH], [0.8, 7.9, RH], [0.1, 7.9, RH]], "q")
    poly([[0.1, 5.8, 0], [0.1, 7.9, 0], [0.1, 7.9, RH], [0.1, 5.8, RH]], "6")
    for (const t of [6.0, 6.62, 7.24]) {
      poly([[0.1, t, 4], [0.1, t + 0.46, 4], [0.1, t + 0.46, 28], [0.1, t + 0.36, 34], [0.1, t + 0.1, 34], [0.1, t, 28]], "k")
      line([0.1, t + 0.23, 4], [0.1, t + 0.23, 22], "Q"); line([0.1, t + 0.3, 4], [0.1, t + 0.3, 12], "j")
    }
    line([0.1, 5.8, RH - 6], [0.1, 7.9, RH - 6], "6"); line([0.1, 5.8, RH], [0.1, 7.9, RH], "W", 2)
    for (let t = 5.85; t < 7.9; t += 0.07) line([0.1, t, RH + 1], [0.1, t, RH + 7], "q")
    line([0.1, 5.8, RH + 8], [0.1, 7.9, RH + 8], "W", 2)
    stair(9.3, 7.9)
    // suchá nádrž před kašnou: kamenný lem, na dně bahno a měděnka
    poly([[-0.95, 5.9], [-0.95, 7.8], [0.1, 7.8], [0.1, 5.9]], "p")
    poly([[-0.85, 6.0, 5], [-0.85, 7.7, 5], [0.05, 7.7, 5], [0.05, 6.0, 5]], "q")
    poly([[-0.75, 6.1, 5], [-0.75, 7.6, 5], [0.0, 7.6, 5], [0.0, 6.1, 5]], "G")
    poly([[-0.6, 6.4, 5], [-0.6, 7.0, 5], [-0.2, 7.0, 5], [-0.2, 6.4, 5]], "Q")
    poly([[-0.95, 5.9, 0], [-0.95, 7.8, 0], [-0.95, 7.8, 5], [-0.95, 5.9, 5]], "6")
    poly([[-0.95, 7.8, 0], [0.1, 7.8, 0], [0.1, 7.8, 5], [-0.95, 7.8, 5]], "p")
    // dlažba terasy a ramp: spáry desek, vylámané kusy, prach a plevel ve spárách
    for (let t = 0.4; t < RD; t += 0.5) line([1.5, t, RH], [2.6, t, RH], "p")
    for (let i = 0; i < 90; i++) { const ta = 0.85 + rng() * 1.6, tb = 0.3 + rng() * 13.4; const onRamp = ta < 1.5, h = !onRamp ? RH : tb < 5.5 ? RH * Math.max(0, tb - 1) / 4.5 : tb > 8.6 ? RH * Math.max(0, 13 - tb) / 4.4 : RH; if (onRamp && (tb < 1 || tb > 13)) continue; const [x, y] = pt(ta, tb, h); const r = rng(); c.rect(x, y, 2 + Math.floor(rng() * 5), 1 + Math.floor(rng() * 2), r < 0.45 ? "p" : r < 0.7 ? "P" : r < 0.85 ? "G" : "W") }
    for (let i = 0; i < 7; i++) { const tb = 1 + rng() * 12, [x, y] = pt(1.7 + rng() * 0.8, tb, RH); c.line(x, y, x + 8 + Math.floor(rng() * 14), y + 3 + Math.floor(rng() * 5), "P") }
    // špína: šmouhy pod římsami, plevel a suť u paty
    for (let i = 0; i < 46; i++) { const t = 1 + rng() * 12, h = 6 + rng() * 22; if (t > 5.5 && t < 8.6) continue; const top = RH * (t < 5.5 ? (t - 1) / 4.5 : (13 - t) / 4.4); if (top > h + 4) line([0.8, t, top - 2], [0.8, t, top - 2 - h * 0.5], "6") }
    for (let i = 0; i < 30; i++) { const t = 0.2 + rng() * 13.6; const [x, y] = pt(1.5, t, RH - 3); c.vline(x, y, 4 + Math.floor(rng() * 14), "P") }
    for (let i = 0; i < 40; i++) { const t = 1 + rng() * 12; const [x, y] = pt(0.8, t, 0); c.rect(x - 1, y - 2, 2 + Math.floor(rng() * 3), 2, rng() < 0.5 ? "G" : "g") }
  })
}


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

// Neonová obálka Ecomailu (sídlí v domě Na Můstku) jako na titulní obrazovce Václaváku po pádu: tři skleněné trubice
// na tmavém plexiskle, tyrkysová dvojitá klopa, zelený levý a spodní díl, tyrkysový pravý díl. Kreslí se v rovině
// stěny k +b (počátek vlevo dole), každá trubice bzučí a občas zhasne zvlášť. Barvy neonu jsou mimo paletu schválně.
{
  const OW = 84, OH = 56, oHc = OH + OW / 2 + 4, S = 2
  // [plná, ztlumená, zhaslá] pro každou trubici
  const TUBES = { flap: ["#3ff2d6", "#249a8a", "#17302c"], left: ["#39ff6b", "#229a44", "#16301e"], right: ["#22e3a0", "#178a64", "#142e24"] }
  const HALO = { flap: ["#1c6a60", "#143c38", "#10201e"], left: ["#1a6e34", "#143e22", "#102016"], right: ["#146a4c", "#103c2e", "#0e201a"] }
  // stav trubic po snímcích: 0 svítí, 1 ztlumená, 2 zhaslá
  const blik = [[0, 0, 0], [0, 0, 0], [0, 1, 0], [0, 0, 0], [0, 0, 0], [1, 0, 0], [0, 0, 0], [0, 0, 2], [0, 0, 0], [0, 0, 0], [0, 0, 1], [2, 0, 0], [0, 0, 0], [0, 1, 0], [0, 2, 0], [0, 0, 0]]
  anim("obalka_neon", { w: OW + 4, h: oHc, frames: blik.length, fps: 8 }, (c) => {
    const P = (ex, ey) => [Math.round(2 + ex * S), Math.round(oHc - 3 - ex * S / 2 - (OH - ey * S))]
    const path = (pts, col, wdt, closed) => { for (let i = 0; i + 1 < pts.length + (closed ? 1 : 0); i++) c.line(...P(...pts[i]), ...P(...pts[(i + 1) % pts.length]), col, wdt) }
    // plexisklo za neonem
    c.poly([...P(-1, -1), ...P(43, -1), ...P(43, 29), ...P(-1, 29)], "#0d1412")
    const [sf, sl, sr] = blik[c.frame]
    const tubes = [
      ["flap", sf, [[1, 1], [41, 1], [20.9, 18.5]], true], ["flap", sf, [[4, 3], [38, 3], [20.9, 15.5]], true],
      ["left", sl, [[1.5, 4], [1.5, 26.5], [31.5, 26.5], [25, 20.5]], false],
      ["right", sr, [[40.5, 4], [40.5, 26.5], [33.5, 26.5], [22.5, 16.5]], false],
    ]
    tubes.forEach(([k, st, pts, closed]) => path(pts, HALO[k][st], 3, closed))
    tubes.forEach(([k, st, pts, closed]) => path(pts, TUBES[k][st], 1, closed))
  })
}

// Nárožní věž paláce Koruna (1914, Pfeiffer) na rohu náměstí a Na Příkopě, podle fotky z Wikimedia Commons (jen
// předloha): kamenný válec od země až nad římsu, v parteru sklo a nápis KORUNA, čtyři patra úzkých sdružených oken,
// nad římsou buben s okny, prstenec perel a kamenná kupole s korunou. Kreslí se ve skutečné velikosti přes roh domu
// z modelu budov (overlays v src/places/vaclavak.js), počátek dole uprostřed. Výšky sedí s receptem fasády
// (parter 97 px, římsa nároží 343 px, data/fasady-vaclavak.json).
{
  const TW = 92, TH = 508, cx = 46, rx = 40, GY = TH - 8
  sprite("koruna_vez", { w: TW, h: TH }, (c) => {
    const Y = (v) => GY - v
    // plášť válce: pruhy od stínu ke světlu
    const bands = [[-rx, -27, "P"], [-27, -8, "p"], [-8, 22, "q"], [22, rx + 1, "p"]]
    const body = (v0, v1, r = rx) => bands.forEach(([x0, x1, k]) => { const a = Math.max(-r, x0), b = Math.min(r + 1, x1); if (b > a) c.rect(cx + a, Y(v1), b - a, v1 - v0, k) })
    body(0, 428); c.ellipse(cx, Y(0), rx, 7, "P")
    for (let v = 108; v < 428; v += 11) c.hline(cx - rx + 1, Y(v), rx * 2 - 1, "P")
    // parter: tři prosklená pole mezi pilíři, pod hladinou špíny tmavý sokl
    for (const [x0, w] of [[-33, 17], [-11, 22], [16, 17]]) {
      c.rect(cx + x0, Y(90), w, 84, "n")
      for (let x = x0 + 5; x < x0 + w - 1; x += 6) c.vline(cx + x, Y(90), 84, "S")
      c.hline(cx + x0, Y(48), w, "p"); c.hline(cx + x0, Y(47), w, "P")
    }
    c.rect(cx - rx, Y(6), rx * 2 + 1, 6, "P")
    // pás s nápisem
    c.rect(cx - rx, Y(108), rx * 2 + 1, 4, "W"); c.rect(cx - rx, Y(104), rx * 2 + 1, 12, "q"); c.rect(cx - rx, Y(93), rx * 2 + 1, 2, "P")
    c.text(cx - 20, Y(103), "KORUNA", "y")
    // čtyři patra: trojice úzkých oken, světlá nadokenní římsa
    for (let f = 0; f < 4; f++) {
      const v = 120 + f * 60
      for (const dx of [-27, -17, -4, 6, 19, 28]) { const k = (f * 7 + dx) % 9 === 0 ? "k" : "n"; c.rect(cx + dx, Y(v + 30), 6, 30, k); c.hline(cx + dx, Y(v + 20), 6, "S") }
      c.rect(cx - 31, Y(v + 33), 63, 2, "W"); c.hline(cx - 31, Y(v - 2), 63, "P")
    }
    // hlavní římsa a buben nad ní
    c.ellipse(cx, Y(348), rx + 4, 8, "P"); c.ellipse(cx, Y(351), rx + 4, 7, "W"); c.ellipse(cx, Y(353), rx, 6, "q")
    for (const dx of [-24, -8, 8, 22]) { c.rect(cx + dx, Y(408), 7, 40, "n"); c.hline(cx + dx, Y(390), 7, "S"); c.rect(cx + dx - 1, Y(411), 9, 2, "W") }
    c.ellipse(cx, Y(428), rx + 3, 7, "P"); c.ellipse(cx, Y(431), rx + 3, 6, "W")
    // kupole z kamene, žebra, prstenec perel a koruna
    c.clip([cx - rx, Y(476), rx * 2 + 1, 44], () => { c.ellipse(cx, Y(432), rx - 3, 42, "p"); c.clip([cx - 6, Y(476), rx, 44], () => c.ellipse(cx, Y(432), rx - 3, 42, "q")); c.clip([cx - rx, Y(476), 12, 44], () => c.ellipse(cx, Y(432), rx - 3, 42, "P")) })
    for (const dx of [-22, -9, 5, 19]) c.line(cx + dx, Y(434), cx + Math.round(dx * 0.3), Y(472), "P")
    for (let i = 0; i < 11; i++) { const t = Math.PI * (0.04 + 0.092 * i), x = Math.round(cx - Math.cos(t) * 15), y = Math.round(Y(476) + Math.sin(t) * 4); c.circ(x, y, 3, "v"); c.circ(x, y - 1, 2, "W") }
    c.rect(cx - 8, Y(488), 17, 6, "Y"); c.hline(cx - 8, Y(488), 17, "y")
    for (const dx of [-8, -4, 0, 4, 8]) { c.vline(cx + dx, Y(494), 6, "Y"); c.px(cx + dx, Y(495), "W") }
    c.vline(cx, Y(499), 5, "Y")
    // špína: šmouhy pod římsami, odstřik u země
    for (const [dx, v, n] of [[-30, 346, 26], [-12, 346, 14], [14, 346, 34], [31, 346, 18], [-20, 426, 12], [9, 426, 20]]) c.vline(cx + dx, Y(v) + 2, n, "P")
  })
}

// Hlavní kupole Národního muzea s lucernou (podle fotek z Wikimedia Commons, jen předloha): model budov má střední
// pavilon jen jako hranol, kupole se proto kreslí ručně a sedí na něm (overlays v src/places/vaclavak.js). Kamenný
// tambur s okny, měděná kupole se žebry a propadlým kusem pláště, lucerna se sloupky a jehlan. Počátek dole uprostřed.
sprite("muzeum_kupole", { w: 176, h: 330 }, (c) => {
  const cx = 88, GY = 322, Y = (v) => GY - v, rx = 78
  // tambur: válec se sloupky a okny
  c.rect(cx - rx, Y(46), rx * 2 + 1, 46, "C"); c.rect(cx - rx, Y(46), 34, 46, "e"); c.rect(cx + 30, Y(46), rx - 29, 46, "c")
  c.ellipse(cx, Y(0), rx, 20, "e")
  for (let i = 0; i < 12; i++) { const x = cx - rx + 8 + i * 13; c.rect(x, Y(40), 6, 30, i % 5 === 2 ? "k" : "n"); c.rect(x - 3, Y(44), 2, 40, "W") }
  c.ellipse(cx, Y(46), rx + 4, 21, "e"); c.ellipse(cx, Y(50), rx + 4, 20, "W"); c.ellipse(cx, Y(53), rx, 19, "C")
  // kupole: měď, osluněná strana vpravo, žebra, pásy plechu
  c.clip([cx - rx, Y(190), rx * 2 + 1, 137], () => {
    c.ellipse(cx, Y(54), rx - 3, 134, "Q")
    c.clip([cx + 4, Y(190), rx, 137], () => c.ellipse(cx, Y(54), rx - 3, 134, "j"))
    c.clip([cx - rx, Y(190), 26, 137], () => c.ellipse(cx, Y(54), rx - 3, 134, "G"))
  })
  for (const dx of [-58, -36, -12, 14, 40, 62]) c.line(cx + dx, Y(58), cx + Math.round(dx * 0.22), Y(184), "k")
  for (const v of [84, 112, 138, 160]) { const w = Math.round((rx - 3) * Math.sqrt(Math.max(0, 1 - ((v - 54) / 134) ** 2))); c.hline(cx - w + 2, Y(v), w * 2 - 3, "G") }
  // propadlý kus pláště: díra s trámy
  c.poly([cx + 16, Y(150), cx + 44, Y(140), cx + 50, Y(108), cx + 34, Y(96), cx + 18, Y(112)], "k")
  c.line(cx + 20, Y(142), cx + 46, Y(112), "H"); c.line(cx + 22, Y(118), cx + 44, Y(134), "H"); c.line(cx + 30, Y(148), cx + 36, Y(100), "h")
  // lucerna: sloupky, římsa, měděná stříška a jehlan s koulí
  c.ellipse(cx, Y(186), 22, 7, "e")
  c.rect(cx - 18, Y(236), 37, 50, "C"); c.rect(cx - 18, Y(236), 9, 50, "e")
  for (const dx of [-12, -3, 6]) c.rect(cx + dx, Y(230), 6, 38, "n")
  c.ellipse(cx, Y(238), 23, 7, "W"); c.ellipse(cx, Y(241), 20, 6, "C")
  c.clip([cx - 20, Y(276), 41, 35], () => { c.ellipse(cx, Y(242), 19, 34, "Q"); c.clip([cx + 2, Y(276), 20, 35], () => c.ellipse(cx, Y(242), 19, 34, "j")) })
  c.rect(cx - 2, Y(300), 5, 26, "Y"); c.circ(cx, Y(304), 4, "y"); c.vline(cx, Y(318), 12, "Y")
  // měděnka stéká po tamburu
  for (const [dx, n] of [[-60, 16], [-41, 9], [-20, 22], [3, 12], [26, 18], [51, 10], [66, 20]]) c.vline(cx + dx, Y(44), n, "Q")
})

// Pokladna Národního muzea u paty schodiště: dřevěná budka s vybitým okénkem, nad ní cedule se šipkou ke vchodu
// a křídou připsané „vstup volný“. Zastavení muzeum (src/places/vaclavak.js), odsud se chodí dovnitř za plejtvákem.
sprite("muzeum_pokladna", { w: 64, h: 92, outline: "k" }, (c) => {
  c.poly([6, 52, 32, 65, 32, 90, 6, 77], "H"); c.poly([32, 65, 58, 52, 58, 77, 32, 90], "h")
  c.poly([4, 50, 32, 36, 60, 50, 32, 64], "U"); c.line(4, 50, 32, 64, "u"); c.line(32, 64, 60, 50, "u")
  c.poly([38, 66, 54, 58, 54, 70, 38, 78], "k"); c.line(40, 76, 46, 66, "L"); c.line(50, 60, 52, 68, "l")
  c.rect(30, 8, 3, 30, "M")
  c.rect(10, 4, 44, 18, "3"); c.rect(11, 5, 42, 16, "c")
  c.text(14, 7, "MUZEUM", "k"); c.line(16, 17, 40, 17, "V"); c.line(40, 17, 36, 14, "V"); c.line(40, 17, 36, 20, "V")
  c.rect(10, 24, 30, 9, "S"); c.hline(12, 27, 22, "W"); c.hline(12, 30, 15, "W")
  c.rect(8, 80, 5, 3, "x"); c.rect(50, 80, 4, 2, "p")
})

