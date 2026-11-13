// Staromák pod vodou a Karlův most nad suchým korytem: Husův pomník jako ostrov, Orloj u hladiny, výloha v Pařížské,
// podstavce s cenovkami, Nepomucký, bedny se sochami, kolo Velkopřevorského mlýna, jediná žárovka, mostecká věž, kanec.
// Počátek všech je dole uprostřed (Phaser origin 0.5, 1). Krabicové sprity mají v tom bodě přední (nejnižší) roh
// půdorysu, Hus a lodě střed přední hrany. Stěna L jde od rohu doleva nahoru, stěna R doprava nahoru (u = body v ose x).
{
  const rd = Math.round
  const sL = (x0, y0) => (u, v) => [rd(x0 - u), rd(y0 - u / 2 - v)]
  const sR = (x0, y0) => (u, v) => [rd(x0 + u), rd(y0 - u / 2 - v)]
  const sQ = (F, u0, u1, v0, v1) => [...F(u0, v0), ...F(u1, v0), ...F(u1, v1), ...F(u0, v1)]
  // kruh v rovině stěny (ciferník, kolo)
  const sDisc = (F, cu, cv, r, n = 48) => { const p = []; for (let i = 0; i < n; i++) { const t = i / n * Math.PI * 2; p.push(...F(cu + r * Math.cos(t), cv + r * Math.sin(t))) } return p }
  // kvádr: x0, y0 přední roh na zemi, lp délka stěny L, lq stěny R, z výška spodku, h výška
  const sBox = (c, x0, y0, lp, lq, z, h, cl, cr, ct) => {
    const L = sL(x0, y0), R = sR(x0, y0)
    c.poly(sQ(L, 0, lp, z, z + h), cl); c.poly(sQ(R, 0, lq, z, z + h), cr)
    if (ct) c.poly([...L(0, z + h), ...L(lp, z + h), rd(x0 - lp + lq), rd(y0 - lp / 2 - lq / 2 - z - h), ...R(lq, z + h)], ct)
  }
  // kartonová cenovka s provázkem, text pevným písmem 3 × 5 (á se dokreslí čárkou)
  const sTag = (c, x, y, str, accent = -1) => {
    const w = str.length * 4 + 3
    c.rect(x, y, w, 9, "C"); c.rect(x, y + 7, w, 2, "4"); c.text(x + 2, y + 2, str, "k")
    if (accent >= 0) { c.px(x + 2 + accent * 4 + 2, y, "k"); c.px(x + 2 + accent * 4 + 1, y + 1, "k") }
    c.px(x + 1, y + 1, "3")
  }

  // Husův pomník (Šaloun, 1915) na ostrůvku uprostřed zatopeného náměstí: široký žulový stupeň, bronzová skupina
  // v měděnce, Hus vysoký uprostřed. Po potopě: provazové žebříky, modrá plachta Admirálova tábora, vlajka ze
  // záchranné vesty, ptačí trus. Ostrov je elipsa 2 × 2 dlaždice, spodní bod plátna je přední okraj ostrova.
  sprite("hus", { w: 310, h: 300 }, (c) => {
    const rng = c.rng(7)
    const cx = 155, cy = 228
    // ostrov: mokrý okraj, bahno, kusy dlažby a suť
    c.ellipse(cx, cy + 3, 152, 69, "K"); c.ellipse(cx, cy, 150, 67, "3"); c.ellipse(cx - 6, cy - 5, 134, 56, "e")
    for (let i = 0; i < 70; i++) { const a = rng() * Math.PI * 2, r = 0.5 + rng() * 0.5; const x = rd(cx + Math.cos(a) * r * 130), y = rd(cy + Math.sin(a) * r * 54); c.rect(x, y, 2 + rd(rng() * 3), 2, rng() < 0.5 ? "P" : "x") }
    for (let i = 0; i < 30; i++) { const x = rd(cx - 140 + rng() * 280), y = rd(cy + 40 + rng() * 26); if (c.is(x, y, "3e")) c.rect(x, y, 3, 1, "X") }
    // žulový podstavec ve dvou nízkých stupních
    const x0 = 225, y0 = 291, LP = 200, LQ = 60
    sBox(c, x0, y0, LP, LQ, 0, 10, "9", "A", "P")
    sBox(c, x0, y0 - 8, LP - 16, LQ - 16, 10, 16, "9", "A", "q")
    const L = sL(x0, y0 - 8)
    for (let u = 12; u < LP - 16; u += 23) c.line(...L(u, 10), ...L(u, 26), "A")
    c.poly(sQ(L, 0, LP - 16, 18, 20), "U") // rezavá čára nejvyšší vody
    // bod na vrchní ploše: s podél dlouhé osy (kladné doleva nahoru), w napříč (kladné doprava nahoru), z výška
    const G = [x0 - LP / 2 + LQ / 2, y0 - LP / 4 - LQ / 4]
    const P = (s, w, z = 26) => [rd(G[0] - s + w), rd(G[1] - s / 2 - w / 2 - z)]
    // bronzová skála, ze které skupina roste: k Husovi stoupá
    const lift = (s) => 26 + rd(Math.max(0, 74 - Math.abs(s)) * 0.4)
    const mound = []
    for (let s = -96; s <= 96; s += 8) mound.push(...P(s, 16, 26))
    for (let s = 96; s >= -96; s -= 8) mound.push(...P(s, 2, lift(s) + 4))
    c.poly(mound, "Q")
    c.clip((x) => x > G[0] - 20, () => c.poly(mound, "X"))
    for (let s = -90; s < 90; s += 7) c.line(...P(s, 16, 27), ...P(s + 3, 4, lift(s) + 2), s % 2 ? "X" : "j")
    // postava v plášti: nohy x, y, výška h; kneel klečí, arm zdvižená ruka, lean náklon hlavy
    const fig = (x, y, h, o = {}) => {
      const hw = rd(h * (o.kneel ? 0.24 : 0.16)), sw = rd(h * 0.14), sy = rd(y - h * 0.74), r = Math.max(3, rd(h * 0.075)), lx = o.lean ?? 0
      c.poly([x - hw, y, x + hw, y, x + sw + lx, sy, x - sw + lx, sy], "Q")
      c.ellipse(x + lx, sy, sw, Math.max(2, rd(h * 0.05)), "Q")
      c.clip((px) => px < x + lx * 0.5, () => { c.poly([x - hw, y, x + hw, y, x + sw + lx, sy, x - sw + lx, sy], "j"); c.ellipse(x + lx, sy, sw, Math.max(2, rd(h * 0.05)), "j") })
      c.line(x + rd(hw / 2), y - 1, x + lx + rd(sw / 3), sy + 4, "X"); c.line(x - rd(hw / 3), y - 1, x + lx - 1, sy + 6, "Q")
      const hx = x + lx * 2, hy = sy - r - 1
      c.rect(hx - 1, sy - 2, 3, 3, "Q"); c.circ(hx, hy, r, "Q"); c.rect(hx - r, hy - r + 1, r, r + 1, "j")
      if (o.arm) { c.line(x + lx + sw - 1, sy + 2, x + lx + sw + o.arm[0], sy + o.arm[1], "Q", 3); c.line(x + lx + sw - 2, sy + 2, x + lx + sw + o.arm[0] - 1, sy + o.arm[1], "j") }
      c.line(x - hw, y, x + hw, y, "X")
      c.px(hx, hy - r, "W"); c.vline(hx + 1, hy - r + 1, 2 + rd(rng() * 3), "w") // trus na hlavě
    }
    const crowd = [
      [80, -16, 40, {}], [56, -18, 52, { lean: 1 }], [34, -16, 60, {}], [-30, -16, 58, {}], [-54, -16, 48, { arm: [4, -20] }], [-78, -14, 36, {}],
      [86, 0, 34, { kneel: true, lean: 2 }], [76, -8, 44, { lean: 2 }], [62, 4, 50, { arm: [10, -22] }], [50, -10, 58, { lean: 1 }], [38, 6, 56, {}], [26, -6, 66, { lean: -1 }],
      [-24, -6, 64, {}], [-36, 6, 54, { lean: -2 }], [-48, -8, 50, { kneel: true }], [-60, 4, 42, { lean: -2 }], [-72, -6, 40, { arm: [6, -18] }], [-86, 2, 30, { kneel: true }],
    ]
    crowd.map(([s, w, h, o]) => [P(s, w, lift(s)), h, o]).sort((p, q) => p[0][1] - q[0][1]).forEach(([[x, y], h, o]) => fig(x, y, h, o))
    // Hus na skalním bloku, vyšší než všichni, ruka na prsou
    const [hx, hy] = P(0, -2, lift(0))
    c.poly([hx - 15, hy, hx + 15, hy, hx + 11, hy - 20, hx - 11, hy - 20], "X"); c.poly([hx - 15, hy, hx - 2, hy, hx - 4, hy - 20, hx - 11, hy - 20], "Q")
    fig(hx, hy - 19, 112)
    c.line(hx - 6, hy - 92, hx + 4, hy - 86, "X", 2)
    // provazové žebříky přes podstavec k ostrovu
    ;[[150, 216, 152, 262], [92, 190, 90, 236]].forEach(([xa, ya, xb, yb]) => {
      c.line(xa, ya, xb, yb, "h"); c.line(xa + 7, ya - 3, xb + 7, yb - 3, "h")
      for (let t = 0.05; t <= 1; t += 0.12) c.line(rd(xa + (xb - xa) * t), rd(ya + (yb - ya) * t), rd(xa + 7 + (xb - xa) * t), rd(ya - 3 + (yb - ya) * t), "4")
    })
    // modrá plachta Admirálova tábora: od Husova ramene k tyči vpravo, prověšená
    const [px, py] = P(-96, 14, 26)
    c.line(px, py, px, py - 64, "H", 2)
    c.poly([hx + 10, hy - 88, px, py - 64, px + 2, py - 44, hx + 40, hy - 40, hx + 14, hy - 60], "b")
    c.poly([hx + 40, hy - 40, px + 2, py - 44, px, py - 40, hx + 38, hy - 36], "S")
    c.line(hx + 22, hy - 76, hx + 30, hy - 46, "S")
    c.line(hx + 10, hy - 88, px, py - 64, "k")
    // vlajka ze záchranné vesty na tyči v levé skupině
    const [fx, fy] = P(70, -12, lift(70))
    c.line(fx, fy, fx, fy - 110, "M", 2)
    c.poly([fx + 2, fy - 108, fx + 28, fy - 104, fx + 26, fy - 82, fx + 2, fy - 86], "o")
    c.poly([fx + 2, fy - 100, fx + 27, fy - 96, fx + 27, fy - 94, fx + 2, fy - 98], "W"); c.poly([fx + 13, fy - 106, fx + 17, fy - 105, fx + 16, fy - 84, fx + 12, fy - 85], "V")
    // ptačí trus stékající po bronzu a žule
    for (let i = 0; i < 50; i++) { const x = rd(30 + rng() * 240), y = rd(80 + rng() * 150); if (c.is(x, y, "QjX9")) c.vline(x, y, 1 + rd(rng() * 5), rng() < 0.6 ? "W" : "w") }
    // spací pytel a smotané lano na stupni
    { const [x, y] = P(-6, 24); c.ellipse(x, y + 4, 14, 4, "G"); c.ellipse(x - 2, y + 3, 10, 3, "g"); const [ax, ay] = P(40, 24); c.ellipse(ax, ay + 3, 6, 3, "h", true); c.ellipse(ax, ay + 3, 3, 1, "h", true) }
    // tábor: sud a bedna na ostrově, lano k vodě
    c.rect(258, 228, 14, 18, "U"); c.rect(258, 228, 14, 3, "u"); c.rect(258, 236, 14, 1, "k")
    c.rect(40, 236, 22, 14, "H"); c.rect(40, 236, 22, 3, "h"); c.line(40, 243, 62, 243, "3")
    c.line(272, 240, 304, 256, "4")
  })

  // Orloj na kusu věže Staroměstské radnice u hladiny: gotická stěna z kvádrů, astronomický ciferník (vybledlá modř,
  // zlato), kalendářní deska napůl pod vodou, Smrtka zvoní (2 snímky). Půdorys 2 × 1 dlaždice: stěna L 128 bodů
  // s Orlojem, stěna R 64. Spodní okraj plátna je hladina.
  anim("orloj", { w: 264, h: 304, fps: 2 }, (c) => {
    const rng = c.rng(11)
    const x0 = 132, y0 = 303, L = sL(x0, y0), R = sR(x0, y0)
    const LP = 128, LQ = 64
    // stěny s ulámaným vrškem
    const jag = (len, base, F) => { const p = [...F(0, 0), ...F(len, 0)]; for (let u = len; u >= 0; u -= 8) p.push(...F(u, base + (u === 0 ? 30 : rd(rng() * 22 - (u / len) * 26)))); return p }
    c.poly(jag(LP, 236, L), "p"); c.poly(jag(LQ, 236, R), "P")
    // kvádrové řádky a spáry (jen na zdi), stopa hladiny a řasa u paty
    c.clip((x, y) => c.is(x, y, "pP"), () => {
      for (let v = 14; v < 250; v += 14) {
        c.line(...L(0, v), ...L(LP, v), "P"); c.line(...R(0, v), ...R(LQ, v), "B")
        for (let u = (v / 14) % 2 ? 10 : 22; u < LP; u += 24) c.line(...L(u, v), ...L(u, v + 13), "P")
        for (let u = (v / 14) % 2 ? 10 : 22; u < LQ; u += 24) c.line(...R(u, v), ...R(u, v + 13), "B")
      }
      c.line(x0, y0, x0, y0 - 262, "q")
      c.poly(sQ(L, 0, LP, 0, 22), "x"); c.poly(sQ(R, 0, LQ, 0, 22), "a"); c.poly(sQ(L, 0, LP, 22, 24), "e")
      // saze a stékance z ulámaného vršku
      for (let u = 4; u < LP; u += 7) { const [x, y] = L(u, 200); c.vline(x, y - 20, 14 + rd(rng() * 30), "x") }
      for (let u = 4; u < LQ; u += 7) { const [x, y] = R(u, 200); c.vline(x, y - 20, 14 + rd(rng() * 30), "B") }
    })
    // gotické okno na boční stěně, zatlučené prkny
    c.poly([...R(20, 120), ...R(44, 120), ...R(44, 170), ...R(32, 186), ...R(20, 170)], "k")
    for (let v = 124; v < 176; v += 9) c.poly(sQ(R, 22, 42, v, v + 5), "H")
    // vykrojená špice nad Orlojem (fiála s kraby), rám kolem ciferníku
    const cu = 70
    c.poly([...L(cu - 46, 50), ...L(cu + 46, 50), ...L(cu + 46, 156), ...L(cu, 214), ...L(cu - 46, 156)], "q")
    c.poly([...L(cu - 40, 54), ...L(cu + 40, 54), ...L(cu + 40, 152), ...L(cu, 204), ...L(cu - 40, 152)], "x")
    for (let k = 0; k < 6; k++) { const [x, y] = L(cu - 46 + k * 8, 156 + k * 9.5); c.rect(x - 2, y - 2, 3, 3, "q") }
    for (let k = 0; k < 6; k++) { const [x, y] = L(cu + 46 - k * 8, 156 + k * 9.5); c.rect(x - 1, y - 2, 3, 3, "q") }
    // okénka apoštolů
    ;[cu - 14, cu + 14].forEach((u) => { c.poly([...L(u - 7, 160), ...L(u + 7, 160), ...L(u + 7, 176), ...L(u, 184), ...L(u - 7, 176)], "k") })
    c.poly(sQ(L, cu - 24, cu + 24, 156, 160), "q")
    // astronomický ciferník
    const av = 104
    c.poly(sDisc(L, cu, av, 44), "O")
    for (let i = 0; i < 24; i++) { const t = i / 24 * Math.PI * 2; const [x, y] = L(cu + 41 * Math.cos(t), av + 41 * Math.sin(t)); c.rect(x, y, 2, 2, "y") }
    c.poly(sDisc(L, cu, av, 37), "k")
    c.poly(sDisc(L, cu, av, 36), "n")
    c.clip(sQ(L, cu - 40, cu + 40, av - 6, av + 40), () => c.poly(sDisc(L, cu, av, 36), "b"))
    c.clip(sQ(L, cu - 40, cu + 40, av - 10, av - 6), () => c.poly(sDisc(L, cu, av, 36), "3"))
    c.poly(sDisc(L, cu, av, 18, 32), "L"); c.poly(sDisc(L, cu, av, 15, 32), "b")
    // zvěrokruh: excentrický prstenec
    c.poly(sDisc(L, cu - 6, av + 8, 23, 40), "Y"); c.poly(sDisc(L, cu - 6, av + 8, 20, 40), "b")
    c.clip(sQ(L, cu - 40, cu + 40, av - 40, av - 6), () => { c.poly(sDisc(L, cu - 6, av + 8, 20, 40), "n"); c.poly(sDisc(L, cu, av, 15, 32), "n") })
    // ručičky: zlatá se sluncem, měsíční koule
    const [hx, hy] = L(cu, av), [sx, sy] = L(cu - 28, av + 20), [mx, my] = L(cu + 24, av - 14)
    c.line(hx, hy, sx, sy, "y", 2); c.circ(sx, sy, 4, "y"); c.px(sx, sy, "f")
    c.line(hx, hy, mx, my, "Y"); c.circ(mx, my, 3, "W"); c.rect(mx, my - 3, 3, 7, "k")
    c.circ(hx, hy, 2, "y")
    // kalendářní deska napůl pod hladinou, porostlá řasou
    c.clip((x, y) => y < y0 - 0 && y < L((x0 - x), 0)[1] - 1, () => {
      c.poly(sDisc(L, cu, 4, 30), "O"); c.poly(sDisc(L, cu, 4, 26), "C"); c.poly(sDisc(L, cu, 4, 12, 32), "Y")
      for (let i = 0; i < 12; i++) { const t = i / 12 * Math.PI * 2; c.line(...L(cu + 12 * Math.cos(t), 4 + 12 * Math.sin(t)), ...L(cu + 26 * Math.cos(t), 4 + 26 * Math.sin(t)), "O") }
    })
    // vlnky hladiny u paty, rezavé stékance pod ciferníkem
    for (let u = 4; u < LP; u += 11) c.line(...L(u, -1), ...L(u + 6, -1), "J")
    for (let u = 6; u < LQ; u += 11) c.line(...R(u, -1), ...R(u + 6, -1), "J")
    for (let u = 2; u < LP; u += 3) if (rng() < 0.5) { const [x, y] = L(u, 0); c.vline(x, y - 3 - rd(rng() * 6), 3, rng() < 0.5 ? "G" : "Q") }
    for (let k = 0; k < 9; k++) { const u = cu - 34 + rd(rng() * 68); const [x, y] = L(u, 58); c.vline(x, y, 6 + rd(rng() * 18), "U") }
    // sošky vedle ciferníku: vlevo Turek a lakomec (tmavé), vpravo Smrtka na římse
    ;[[cu + 54, 92], [cu + 54, 128]].forEach(([u, v]) => { const [x, y] = L(u, v); c.rect(x - 3, y - 18, 7, 18, "3"); c.circ(x, y - 21, 3, "3"); c.rect(x - 5, y, 11, 3, "q") })
    const [dx, dy] = L(18, 98)
    c.rect(dx - 6, dy, 13, 3, "q")
    // Smrtka: lebka, žebra, kosti; zvonek nad ní
    c.circ(dx, dy - 22, 3, "W"); c.px(dx - 1, dy - 22, "k"); c.px(dx + 1, dy - 22, "k")
    c.vline(dx, dy - 18, 9, "W"); for (let k = 0; k < 3; k++) c.hline(dx - 2, dy - 17 + k * 2, 5, "W")
    c.line(dx, dy - 9, dx - 2, dy - 1, "W"); c.line(dx, dy - 9, dx + 2, dy - 1, "W")
    c.line(dx - 1, dy - 17, dx - 4, dy - 9, "W") // levá ruka s přesýpacími hodinami
    c.rect(dx - 6, dy - 10, 3, 4, "y")
    c.rect(dx + 2, dy - 46, 7, 3, "M") // držák zvonku
  }, frame((c) => {
    const [dx, dy] = [114, 196]
    c.line(dx + 1, dy - 17, dx + 6, dy - 28, "W"); c.line(dx + 6, dy - 28, dx + 6, dy - 40, "4")
    c.poly([dx + 2, dy - 43, dx + 10, dy - 43, dx + 11, dy - 36, dx + 1, dy - 36], "Y"); c.px(dx + 6, dy - 35, "k")
  }), frame((c) => {
    const [dx, dy] = [114, 196]
    c.line(dx + 1, dy - 17, dx + 5, dy - 22, "W"); c.line(dx + 5, dy - 22, dx + 9, dy - 38, "4")
    c.poly([dx + 4, dy - 44, dx + 11, dy - 41, dx + 9, dy - 34, dx + 1, dy - 37], "Y"); c.px(dx + 9, dy - 34, "k")
    c.px(dx + 15, dy - 44, "W"); c.px(dx + 17, dy - 40, "W"); c.px(dx + 16, dy - 48, "W")
  }))

  // Dlouhý hák lovce značek na tyči zaražené u výlohy: bidlo z hladiny, kovový hák, na něm uvízlý cár kožichu.
  sprite("lovec_hak", { w: 60, h: 120 }, (c) => {
    c.ellipse(30, 116, 12, 3, "J"); c.ellipse(30, 116, 8, 2, "Z")
    c.line(30, 116, 46, 18, "H", 3); c.line(29, 114, 45, 18, "h")
    c.line(42, 30, 50, 24, "M", 2); c.rect(44, 14, 4, 8, "M")
    // hák: oblouk dolů a hrot
    c.line(46, 14, 50, 4, "M", 2); c.line(50, 4, 56, 6, "M", 2); c.line(56, 6, 57, 16, "M", 2); c.line(57, 16, 53, 20, "m")
    c.px(52, 19, "m")
    c.poly([50, 20, 58, 18, 59, 34, 54, 40, 50, 30], "U"); c.line(52, 24, 54, 38, "3"); c.px(57, 22, "u")
    c.line(36, 92, 20, 104, "4"); c.line(20, 104, 14, 116, "4") // provaz k loďce
  })

  // Zatopený butik na nároží v Pařížské (1 dlaždice): dvě výlohy, kovový rám se zlatým nápisem, rozbité sklo.
  // Vlevo hnízdo nutrií z kožichů, vpravo figurína bez hlavy. Spodní okraj plátna je hladina u rohu.
  sprite("vyloha", { w: 132, h: 160 }, (c) => {
    const rng = c.rng(5)
    const x0 = 66, y0 = 159, L = sL(x0, y0), R = sR(x0, y0)
    const H = 124
    // omítka nad výlohou, sokl a rám
    c.poly(sQ(L, 0, 64, 0, H), "C"); c.poly(sQ(R, 0, 64, 0, H), "e")
    c.poly(sQ(L, 0, 64, 0, 96), "S"); c.poly(sQ(R, 0, 64, 0, 96), "A")
    c.poly(sQ(L, 4, 60, 8, 72), "k"); c.poly(sQ(R, 4, 60, 8, 72), "n")
    // nápis ve štítu: zlato oprýskané
    c.poly(sQ(L, 4, 60, 78, 92), "k"); c.poly(sQ(R, 4, 60, 78, 92), "k")
    for (let u = 8; u < 58; u += 7) { c.poly(sQ(L, u, u + 4, 82, 88), rng() < 0.75 ? "Y" : "3"); c.poly(sQ(R, u, u + 4, 82, 88), rng() < 0.6 ? "Y" : "3") }
    // uvnitř výloh voda po kolena figuríně
    c.poly(sQ(L, 4, 60, 8, 24), "X"); c.poly(sQ(R, 4, 60, 8, 24), "X")
    for (let u = 8; u < 56; u += 10) { c.line(...L(u, 23), ...L(u + 5, 23), "Z"); c.line(...R(u + 3, 23), ...R(u + 8, 23), "Z") }
    // vlevo: hnízdo z kožichů (hnědé, černé, světlá liška) a nutrie na plovoucím regálu
    c.poly(sQ(L, 8, 58, 20, 24), "H")
    c.clip(sQ(L, 4, 60, 8, 72), () => {
      ;[[16, 30, 12, "u"], [30, 28, 14, "K"], [46, 30, 11, "w"], [22, 38, 9, "U"], [38, 40, 9, "3"], [52, 38, 7, "u"], [30, 44, 6, "K"]].forEach(([u, v, r, col]) => { const [x, y] = L(u, v); c.ellipse(x, y, r, rd(r * 0.6), col) })
      const [nx, ny] = L(34, 50); c.ellipse(nx, ny, 7, 5, "u"); c.rect(nx - 7, ny, 3, 3, "f"); c.px(nx - 3, ny - 2, "k")
    })
    // vpravo: figurína bez hlavy v kabátě, ruka zlomená
    { const [fx, fy] = R(32, 22); c.poly([fx - 7, fy, fx + 7, fy, fx + 5, fy - 34, fx - 5, fy - 34], "V"); c.rect(fx - 3, fy - 38, 6, 4, "w"); c.line(fx + 5, fy - 30, fx + 12, fy - 18, "w", 2) }
    // rozbité sklo: střepy u rámu, zbytek díra
    ;[[L, 4, 8, 22, 30], [L, 60, 8, 50, 20], [R, 4, 72, 18, 56], [R, 60, 8, 50, 26]].forEach(([F, u, v, u2, v2]) => {
      const [ax, ay] = F(u, v), [bx, by] = F(u2, v), [qx, qy] = F(u, v2)
      c.poly([ax, ay, bx, by, qx, qy], "L"); c.line(ax, ay, qx, qy, "l")
    })
    c.poly(sQ(R, 4, 60, 64, 72), "L"); c.line(...R(10, 66), ...R(54, 68), "l")
    c.line(...R(18, 56), ...R(30, 40), "l"); c.line(...R(30, 40), ...R(26, 28), "l")
    // nárožní pilíř a mokrá stopa hladiny, řasa
    c.poly(sQ(L, 0, 4, 0, H), "S"); c.poly(sQ(R, 0, 4, 0, H), "a")
    c.clip((x, y) => c.is(x, y, "CeSAa"), () => { c.poly(sQ(L, 0, 64, 96, 108), "4"); c.poly(sQ(R, 0, 64, 96, 108), "3") })
    for (let u = 2; u < 64; u += 3) { const [x, y] = L(u, 0); if (rng() < 0.5) c.vline(x, y - 4, 3, "G"); const [x2, y2] = R(u, 0); if (rng() < 0.5) c.vline(x2, y2 - 4, 3, "Q") }
    for (let u = 6; u < 62; u += 9) { const [x, y] = L(u, 108); c.vline(x, y, 4 + rd(rng() * 10), "e") }
  })

  // Druhá loďka: dřevěná pramice s oprýskanou zelenou barvou, dvě vesla, sedačky, plechovka na vylévání.
  // Leží napříč (podél osy b). Spodní okraj plátna je hladina pod přídí.
  sprite("ostrov_lodka", { w: 104, h: 66, outline: "k" }, (c) => {
    // vnější bok s řasou, okraj, vnitřek, dno
    c.poly([2, 10, 18, 24, 82, 56, 98, 46, 98, 52, 82, 63, 16, 31, 3, 15], "T"); c.line(4, 13, 82, 59, "2")
    for (let x = 14; x < 80; x += 9) c.vline(x, rd(18 + (x - 14) * 0.55), 4, "G")
    c.poly([2, 10, 26, 8, 94, 38, 98, 46, 82, 56, 18, 24], "2")
    c.poly([8, 11, 27, 11, 90, 39, 93, 45, 81, 52, 20, 22], "h")
    c.poly([14, 13, 28, 14, 84, 40, 86, 44, 80, 48, 22, 20], "H")
    // oprýskaná barva podle prken na okraji
    for (let i = 0; i < 5; i++) c.line(30 + i * 13, 9 + i * 6, 35 + i * 13, 11 + i * 6, "1")
    // sedačky napříč
    ;[[30, 18], [52, 28], [72, 38]].forEach(([x, y]) => c.line(x - 10, y + 5, x + 8, y - 4, "h", 2))
    // vesla přes loď
    c.line(2, 36, 84, 22, "4", 2); c.poly([0, 33, 10, 31, 10, 39, 0, 41], "4")
    c.line(40, 2, 64, 54, "4"); c.poly([36, 0, 42, 0, 44, 8, 38, 8], "4")
    c.rect(58, 33, 6, 6, "M"); c.rect(58, 33, 6, 2, "m")
    c.line(96, 48, 102, 56, "4")
  })

  // Barokní podstavec na zábradlí Karlova mostu: sokl, dřík s rámovanou deskou, římsa. Pískovec zčernalý od sazí.
  // Socha je pryč, nahoře trčí železné trny, na dříku kartonová cenovka. Půdorys asi půl dlaždice.
  const pedestal = (c, o) => {
    const x0 = o.w / 2, y0 = o.h - 1
    sBox(c, x0, y0, 30, 30, 0, 14, "P", "B", "p")
    sBox(c, x0, y0 - 1, 28, 28, 14, 6, "x", "a", "p") // profilovaný sokl
    sBox(c, x0, y0 - 2, 25, 25, 20, o.die, "x", "a", "p")
    const L = sL(x0, y0 - 2), R = sR(x0, y0 - 2)
    // vpadlá deska s kartuší na čele, na boku jen deska
    c.poly(sQ(L, 4, 21, 26, o.die + 12), "P"); c.poly(sQ(L, 5, 20, 27, o.die + 11), "x")
    c.poly(sQ(R, 4, 21, 26, o.die + 12), "A"); c.poly(sQ(R, 5, 20, 27, o.die + 11), "a")
    if (o.cart !== false) {
      const cv = 20 + o.die / 2 + 4
      c.poly(sDisc(L, 12.5, cv, 7, 20), "p"); c.poly(sDisc(L, 12.5, cv, 5, 20), "P")
      for (let k = -2; k <= 2; k += 2) c.line(...L(9, cv + k), ...L(16, cv + k), "x")
    }
    // volutky na hranách pod římsou
    ;[L(1, o.die + 14), R(25, o.die + 14), L(24, o.die + 14)].forEach(([x, y]) => { c.circ(x, y, 3, "p"); c.px(x, y, "P") })
    sBox(c, x0, y0 + 2, 31, 31, 18 + o.die, 6, "q", "P", "q")
    sBox(c, x0, y0, 28, 28, 24 + o.die, 6, "x", "a", "p")
    // saze pod římsou, stékance, otlučené hrany
    for (let u = 3; u < 28; u += 5) { const [x, y] = L(u, 18 + o.die); c.vline(x, y, 6 + (u * 7) % 14, "a") }
    for (let u = 2; u < 28; u += 6) { const [x, y] = R(u, 18 + o.die); c.vline(x, y, 4 + (u * 5) % 10, "A") }
    ;[[L, 25, 9], [R, 14, 30], [L, 3, o.die + 2]].forEach(([F, u, v]) => { const [x, y] = F(u, v); c.rect(x, y, 2, 2, "q") })
    return [x0, y0 - 14 - 30 - o.die + 1]
  }
  const studs = (c, x, y) => { c.rect(x - 6, y - 8, 2, 8, "U"); c.rect(x + 5, y - 6, 2, 6, "U"); c.rect(x - 1, y - 4, 2, 4, "u") }
  sprite("podstavec_a", { w: 72, h: 122 }, (c) => {
    const [x, y] = pedestal(c, { w: 72, h: 122, die: 46 }); studs(c, x, y)
    c.line(20, 66, 22, 72, "4"); sTag(c, 12, 72, "300")
  })
  sprite("podstavec_b", { w: 72, h: 122 }, (c) => {
    const [x, y] = pedestal(c, { w: 72, h: 122, die: 46 }); studs(c, x - 2, y + 2)
    c.rect(x - 4, y - 14, 8, 14, "P"); c.rect(x - 4, y - 14, 4, 14, "q"); c.line(x - 4, y - 15, x + 3, y - 12, "k"); c.vline(x + 4, y - 13, 13, "k") // ulomená noha sochy
    c.line(46, 66, 46, 72, "4"); sTag(c, 38, 72, "450")
  })
  sprite("podstavec_c", { w: 72, h: 122 }, (c) => {
    const [x, y] = pedestal(c, { w: 72, h: 122, die: 46 }); studs(c, x + 1, y)
    sTag(c, 22, 62, "PRODANO", 4)
  })

  // Svatý Jan Nepomucký (bronz, Brokoff 1683): kleriku a rochetu drží krucifix, kolem hlavy pět zlatých hvězd.
  // Podstavec s reliéfy, z pravého zbyla jen díra po destičce pro štěstí s ohlazeným okrajem.
  sprite("podstavec_nepomuk", { w: 80, h: 192 }, (c) => {
    const [x, y] = pedestal(c, { w: 80, h: 192, die: 56, cart: false })
    const L = sL(40, 189), R = sR(40, 189)
    c.poly(sQ(L, 5, 20, 34, 62), "O"); c.poly(sQ(L, 7, 18, 36, 60), "3")
    ;[[10, 40], [15, 42]].forEach(([u, v]) => { const [px, py] = L(u, v); c.rect(px - 1, py - 12, 3, 12, "O"); c.px(px, py - 14, "O") }) // reliéf: postavy na mostě
    c.poly(sQ(R, 7, 18, 40, 54), "y"); c.poly(sQ(R, 9, 16, 42, 52), "k") // díra po destičce, okraj ohlazený rukama
    // socha na bronzové plintě: klerika, rocheta s krajkou, kožešinová pelerína, biret
    c.ellipse(x, y, 13, 5, "3"); c.ellipse(x, y - 2, 12, 4, "O")
    c.poly([x - 9, y - 2, x + 9, y - 2, x + 7, y - 40, x - 7, y - 40], "3")
    c.poly([x - 9, y - 2, x - 3, y - 2, x - 4, y - 40, x - 7, y - 40], "O")
    c.line(x + 3, y - 3, x + 2, y - 30, "k"); c.line(x - 2, y - 3, x - 2, y - 26, "O")
    c.poly([x - 11, y - 22, x + 11, y - 22, x + 8, y - 50, x - 8, y - 50], "O") // rocheta
    c.poly([x - 11, y - 22, x - 2, y - 22, x - 3, y - 50, x - 8, y - 50], "Y")
    for (let k = -10; k < 11; k += 3) c.px(x + k, y - 21, "Y") // krajka
    c.line(x + 4, y - 23, x + 3, y - 46, "3")
    c.poly([x - 9, y - 50, x + 9, y - 50, x + 6, y - 58, x - 6, y - 58], "3"); c.line(x - 8, y - 51, x - 4, y - 57, "O") // pelerína
    c.rect(x - 2, y - 60, 5, 3, "O")
    c.rect(x - 4, y - 69, 8, 10, "O"); c.rect(x - 4, y - 69, 3, 9, "Y"); c.rect(x - 3, y - 61, 6, 3, "3") // hlava s vousem
    c.px(x - 1, y - 65, "3"); c.px(x + 2, y - 65, "3")
    c.rect(x - 5, y - 73, 10, 4, "3"); c.rect(x - 1, y - 75, 2, 2, "3") // biret
    // krucifix v náručí šikmo přes prsa, palmová ratolest
    c.line(x - 10, y - 26, x + 9, y - 54, "3", 2); c.line(x - 3, y - 44, x + 7, y - 38, "3", 2); c.rect(x, y - 44, 2, 6, "y")
    c.rect(x - 9, y - 36, 4, 4, "O"); c.rect(x + 5, y - 46, 4, 4, "O") // ruce
    c.line(x + 10, y - 6, x + 13, y - 34, "O"); for (let k = 0; k < 4; k++) c.line(x + 12, y - 14 - k * 6, x + 15, y - 18 - k * 6, "O")
    // svatozář: kroužek a pět hvězd
    c.ellipse(x, y - 76, 12, 4, "Y", true)
    ;[-12, -6, 0, 6, 12].forEach((dx) => { const sx = x + dx, sy = y - 80 - (dx === 0 ? 3 : Math.abs(dx) === 6 ? 2 : 0); c.px(sx, sy, "y"); c.px(sx - 1, sy, "y"); c.px(sx + 1, sy, "y"); c.px(sx, sy - 1, "y"); c.px(sx, sy + 1, "y") })
    c.px(x + 3, y - 74, "W"); c.vline(x + 3, y - 69, 3, "w") // trus
  }, glow("y", { where: [0, 0, 80, 100], r: 3, strength: 0.35 }))

  // Kůň svatého Václava (Myslbek) bez jezdce ve Zlaté uličce: bronz v měděnce na paletě, na hřbetě šrouby po jezdci,
  // na krku cenovka. Kouká doleva dolů jako postavy.
  sprite("kun_vaclav", { w: 84, h: 84, outline: "k" }, (c) => {
    // paleta
    c.poly([42, 62, 80, 72, 42, 82, 4, 72], "h"); c.poly([4, 72, 42, 82, 42, 84, 4, 75], "H"); c.poly([42, 82, 80, 72, 80, 75, 42, 84], "3")
    for (let i = 1; i < 4; i++) c.line(4 + i * 9.5, 72 - i * 2.5, 42 + i * 9.5, 82 - i * 2.5, "H")
    // zadní nohy (dál od diváka tmavší), přední zvednutá
    c.rect(52, 44, 5, 24, "X"); c.rect(24, 44, 5, 22, "X")
    c.rect(58, 42, 6, 30, "Q"); c.rect(58, 42, 2, 30, "j"); c.rect(57, 70, 8, 3, "X")
    c.rect(30, 42, 6, 30, "Q"); c.rect(30, 42, 2, 30, "j"); c.rect(29, 70, 8, 3, "X")
    c.poly([22, 44, 27, 44, 22, 56, 18, 62, 15, 60, 19, 54], "Q") // zvednutá přední noha
    // trup, hruď, zadek
    c.ellipse(44, 36, 21, 11, "Q"); c.ellipse(60, 34, 9, 11, "Q"); c.ellipse(29, 36, 9, 12, "Q")
    c.ellipse(42, 31, 16, 4, "j"); c.ellipse(60, 28, 5, 3, "j")
    // krk a hlava (skloněná, jak ji Myslbek udělal)
    c.poly([24, 28, 36, 26, 30, 10, 22, 6, 17, 12], "Q"); c.poly([22, 8, 27, 10, 31, 24, 27, 24], "j")
    c.poly([22, 6, 17, 12, 8, 24, 10, 29, 15, 28, 22, 16], "Q"); c.line(20, 8, 11, 23, "j"); c.px(16, 15, "k"); c.rect(9, 26, 3, 2, "X")
    c.poly([22, 6, 25, 1, 26, 7], "Q") // ucho
    // hříva a ohon
    for (let i = 0; i < 6; i++) c.line(24 + i * 2, 7 + i * 3, 28 + i * 2, 10 + i * 3, "X")
    c.poly([67, 30, 73, 34, 75, 52, 71, 56, 69, 42], "X"); c.line(70, 34, 73, 50, "Q")
    // stékance měděnky a šrouby po jezdci
    ;[36, 44, 51, 61].forEach((x, i) => c.vline(x, 40 + i % 2 * 2, 5 + i * 2 % 5, "X"))
    ;[38, 44, 50].forEach((x) => { c.rect(x, 24, 2, 3, "U"); c.px(x, 24, "u") })
    // cenovka na provázku
    c.line(24, 26, 20, 34, "4"); c.rect(13, 34, 15, 9, "C"); c.rect(13, 41, 15, 2, "4"); c.hline(15, 37, 11, "k"); c.hline(15, 39, 8, "3") // řádky místo písma: sprite se zrcadlí
  })

  // Lennonova zeď na Velkopřevorském náměstí, přemalovaná nabílo, jediný nápis PROUD (mlynář). Tři díly po dlaždici
  // (zed_lennon_0–2), stěna jde podél a a kouká k divákovi; pod nátěrem prosvítají staré barvy.
  for (let seg = 0; seg < 3; seg++) sprite(`zed_lennon_${seg}`, { w: 70, h: 120 }, (c) => {
    const P = (u, v) => [3 + u - seg * 64, 118 - (u - seg * 64) / 2 - v]
    const q = (u0, u1, v0, v1) => [...P(u0, v0), ...P(u1, v0), ...P(u1, v1), ...P(u0, v1)]
    const rng = c.rng(41)
    c.poly(q(0, 192, 0, 70), "w"); c.poly(q(0, 192, 0, 9), "p"); c.poly(q(0, 192, 8, 9), "P")
    // staré nápisy pod nátěrem: bledé skvrny a pár míst, kde barva oprýskala až na ně
    for (let i = 0; i < 22; i++) { const u = 4 + rng() * 176, v = 12 + rng() * 50, w = 8 + rng() * 22, h = 4 + rng() * 12; c.poly(q(u, Math.min(190, u + w), v, Math.min(68, v + h)), "W") }
    for (let i = 0; i < 26; i++) { const u = 4 + rng() * 182, v = 11 + rng() * 54; c.poly(q(u, u + 2 + rng() * 4, v, v + 1 + rng() * 3), ["7", "E", "y", "l", "V", "o"][Math.floor(rng() * 6)]) }
    // Lennon pod nátěrem vpravo od nápisu: vlasy, kulaté brýle, obličej; přes něj bílá, takže jen prosvítá
    const LENNON = ["....hhhhhhhh....", "...hhhhhhhhhh...", "..hhhhhhhhhhhh..", "..hhhffffffhhh..", ".hhhffffffffhhh.", ".hhffffffffffhh.", ".hhffffffffffhh.",
      ".hhggggffgggghh.", ".hhgffggggffghh.", ".hhggggffgggghh.", ".hhffffffffffhh.", ".hhffffmmffffhh.", ".hhffffffffffhh.", ".hhfffmmmmfffhh.", ".hhhffffffffhhh.",
      ".hhhhffffffhhhh.", ".hhhhhffffhhhhh.", "hhhhhh....hhhhhh", "hhhhh......hhhhh", "hhhh........hhhh"]
    LENNON.forEach((row, gy) => [...row].forEach((ch, gx) => { if (ch !== ".") c.poly(q(158 + gx * 2, 160 + gx * 2, 16 + (19 - gy) * 2, 18 + (19 - gy) * 2), { h: "P", f: "c", g: "k", m: "3" }[ch]) }))
    c.clip(q(156, 192, 14, 58), () => c.noise(0, 0, 70, 120, "w", 0.2, 47, "*"))
    // PROUD: písmo 5 × 7 ve čtyřnásobku, černě, s pár stékanci
    ;[..."PROUD"].forEach((ch, i) => { for (let gy = 0; gy < 7; gy++) for (let gx = 0; gx < 5; gx++) if (FONT57[ch][gy * 5 + gx] === "1") {
      const u = 38 + i * 24 + gx * 4, v = 26 + (6 - gy) * 4
      c.poly(q(u, u + 4, v, v + 4), "k")
      if (gy === 6 && rng() < 0.3) { const [x, y] = P(u + 2, v); c.vline(x, y, 4 + Math.floor(rng() * 9), "k") }
    } })
    // špína od země, šmouhy od koruny, koruna zdi
    for (let i = 0; i < 16; i++) { const [x, y] = P(3 + rng() * 186, 68); c.vline(Math.round(x), Math.round(y), 6 + Math.floor(rng() * 22), "v") }
    c.clip(q(0, 192, 9, 20), () => c.noise(0, 0, 70, 120, "v", 0.3, 43, "*"))
    c.poly([...P(0, 70), ...P(192, 70), P(192, 70)[0] - 5, P(192, 70)[1] - 3, P(0, 70)[0] - 5, P(0, 70)[1] - 3], "q"); c.poly(q(0, 192, 68, 70), "P")
    if (seg === 0) c.poly([...P(0, 0), ...P(0, 70), P(0, 70)[0] - 5, P(0, 70)[1] - 3, P(0, 0)[0] - 5, P(0, 0)[1] - 3], "x")
  })

  // Cedule Galerie na mostě: prkenná tabule na dvou tyčích, stojí za bednami, nápis v rovině tabule.
  sprite("cedule_galerie", { w: 84, h: 112 }, (c) => {
    const F = (u, v) => [u, -u / 2 - v], P = (u, v) => [42 + u, 92 - u / 2 - v]
    const q = (u0, u1, v0, v1) => [...P(u0, v0), ...P(u1, v0), ...P(u1, v1), ...P(u0, v1)]
    ;[-34, 33].forEach((u) => { c.poly(q(u, u + 3, 0, 76), "H"); c.poly(q(u, u + 1, 0, 76), "h") })
    c.poly(q(-37, 37, 41, 75), "H"); c.poly(q(-36, 36, 42, 74), "C"); c.poly(q(-36, 36, 42, 44), "4")
    c.poly(q(-36, 36, 57, 58), "4") // spára mezi prkny
    wallText(c, F, 42, 92, -31, 60, "PRODEJNÍ", "k", { sc: 2, outline: null })
    wallText(c, F, 42, 92, -27, 45, "GALERIE", "V", { sc: 2, outline: null })
    ;[[-33, 71], [33, 71], [-33, 45], [33, 45]].forEach(([u, v]) => c.px(...P(u, v), "U"))
    for (let u = -30; u < 34; u += 13) { const [x, y] = P(u, 42); c.vline(x, y, 3 + (u * 5 + 40) % 5, "4") }
  })

  // Bedny Galerie: tři laťové bedny, z jedné kouká kamenná hlava, z druhé paže, sláma, cenovky.
  sprite("bedny", { w: 120, h: 92 }, (c) => {
    const crate = (x0, y0, lp, lq, h, open) => {
      sBox(c, x0, y0, lp, lq, 0, h, "h", "H", open ? "3" : "4")
      const L = sL(x0, y0), R = sR(x0, y0)
      for (let v = 8; v < h; v += 8) { c.line(...L(0, v), ...L(lp, v), "H"); c.line(...R(0, v), ...R(lq, v), "3") }
      c.line(...L(1, 1), ...L(lp - 1, h - 1), "H"); c.line(...R(1, h - 1), ...R(lq - 1, 1), "3")
      c.line(...L(0, 0), ...L(0, h), "4")
      if (open) { const T = (a, b) => [rd(x0 - a + b), rd(y0 - a / 2 - b / 2 - h)]; c.poly([...T(3, 3), ...T(lp - 3, 3), ...T(lp - 3, lq - 3), ...T(3, lq - 3)], "K") }
      return [rd(x0 - lp / 2 + lq / 2), rd(y0 - lp / 4 - lq / 4 - h)]
    }
    crate(38, 72, 28, 28, 26)
    // bedna vpravo vzadu: sláma a kamenná hlava se slepýma očima
    const [bx, by] = crate(90, 66, 24, 26, 24, true)
    for (let i = 0; i < 10; i++) c.line(bx - 12 + i * 3, by + 2, bx - 14 + i * 3 + (i % 3), by - 4 - (i % 2) * 2, i % 2 ? "Y" : "4")
    c.ellipse(bx, by - 10, 9, 11, "p"); c.ellipse(bx - 2, by - 12, 6, 8, "q"); c.rect(bx - 6, by - 13, 3, 2, "x"); c.rect(bx + 1, by - 13, 3, 2, "x")
    c.line(bx - 3, by - 6, bx + 2, by - 6, "x"); c.rect(bx - 1, by - 11, 2, 4, "p"); c.line(bx - 8, by - 20, bx + 7, by - 21, "P", 2)
    c.vline(bx + 4, by - 20, 8, "a") // saze z mostu
    // přední otevřená bedna s paží
    const [ax, ay] = crate(60, 91, 30, 30, 24, true)
    for (let i = 0; i < 8; i++) c.line(ax - 10 + i * 3, ay + 2, ax - 12 + i * 3, ay - 3, i % 2 ? "Y" : "4")
    c.line(ax + 2, ay, ax - 14, ay - 24, "p", 5); c.line(ax + 1, ay - 2, ax - 14, ay - 24, "q", 2)
    c.circ(ax - 15, ay - 26, 4, "p"); c.line(ax - 17, ay - 29, ax - 19, ay - 34, "p", 2); c.line(ax - 14, ay - 30, ax - 14, ay - 35, "p", 2)
    c.line(ax + 2, ay, ax - 2, ay - 6, "x")
    c.line(14, 64, 16, 68, "4"); sTag(c, 6, 68, "120"); sTag(c, 98, 58, "80")
  })

  // Kolo Velkopřevorského mlýna na Čertovce: dva věnce s lopatkami, paprsky, hřídel do kamenného ložiska, točí se
  // (4 snímky), u hladiny pěna. Kolo leží v rovině osy a (stoupá doprava), část pod hladinou se nekreslí, vodu dává
  // zem mapy. Hladina pod hřídelí je bod (100, 140), spodní okraj plátna je hladina u levého (nižšího) konce kola.
  anim("mlynske_kolo", { w: 200, h: 176, frames: 4, fps: 6 }, (c) => {
    const Ox = 100, Oy = 140, r = 62, cv = 50
    const plane = (db) => sR(Ox - 0 + db, Oy + db / 2)
    const F = (u, v) => plane(5)(u, v), Fb = (u, v) => plane(-9)(u, v), Fp = (u, v) => plane(-30)(u, v)
    const above = (db) => (x, y) => y < Oy + db / 2 - (x - Ox - db) / 2
    const rot = c.phase * Math.PI * 2 / 8
    const pt = (G, rr, t) => G(rr * Math.cos(t), cv + rr * Math.sin(t))
    const rim = (G, rr, col, wd) => { for (let i = 0; i < 64; i++) c.line(...pt(G, rr, i / 64 * Math.PI * 2), ...pt(G, rr, (i + 1) / 64 * Math.PI * 2), col, wd) }
    // kamenné ložisko za kolem
    c.clip(above(-30), () => {
      c.poly(sQ(sL(...Fp(14, 0)), 0, 28, -4, cv + 6), "P"); c.poly(sQ(sR(...Fp(14, 0)), 0, 10, -4, cv + 6), "B")
      c.poly(sQ(sL(...Fp(14, cv + 6)), 0, 28, 0, 4), "p")
      c.poly(sQ(sL(...Fp(14, 0)), 0, 28, -4, 12), "Q") // mech u vody
    })
    c.clip(above(-9), () => {
      rim(Fb, r - 3, "H", 6); rim(Fb, r - 7, "3", 1)
      // lopatky mezi věnci
      for (let i = 0; i < 16; i++) {
        const t = rot + i / 16 * Math.PI * 2, a = [r * Math.cos(t), cv + r * Math.sin(t)], b = [(r - 17) * Math.cos(t), cv + (r - 17) * Math.sin(t)]
        c.poly([...F(...a), ...Fb(...a), ...Fb(...b), ...F(...b)], Math.cos(t) > 0 ? "h" : "H")
        c.line(...F(...a), ...Fb(...a), "3")
      }
      // hřídel do ložiska
      c.line(...F(0, cv), ...Fp(0, cv), "M", 4); c.line(...F(0, cv + 1), ...Fp(0, cv + 1), "m")
    })
    c.clip(above(5), () => {
      for (let i = 0; i < 8; i++) { const t = rot + (i + 0.5) / 8 * Math.PI * 2; c.line(...F(0, cv), ...pt(F, r - 4, t), "H", 4); c.line(...F(0, cv), ...pt(F, r - 4, t), "h", 2) }
      rim(F, r - 3, "h", 6); rim(F, r, "H", 1); rim(F, r - 7, "3", 1); rim(F, r - 3, "4", 1)
      c.poly(sDisc(F, 0, cv, 9, 24), "3"); c.poly(sDisc(F, 0, cv, 4, 16), "M")
      for (let i = 0; i < 14; i++) c.px(...pt(F, r - 2, i / 14 * Math.PI * 2 + 0.2 + rot), "Q") // řasa na věnci
    })
    // pěna a stříkance tam, kde lopatky berou vodu
    const k = c.frame
    for (let i = 0; i < 16; i++) { const u = -r + 6 + ((i * 17 + k * 7) % (2 * r - 12)), db = -8 + ((i * 5) % 14); const [x, y] = plane(db)(u, 0); c.rect(x, y, 3, 1, i % 3 ? "w" : "W") }
    for (let i = 0; i < 5; i++) { const t = (i + k) % 4; const [x, y] = F(-r + 4 + i * 3, 4 + t * 4); c.px(x, y, "W"); c.px(x - 2, y + 3, "w") }
    for (let i = 0; i < 5; i++) { const t = (i + k + 2) % 4; const [x, y] = F(r - 6 - i * 3, 3 + t * 3); c.px(x, y, "w") }
    for (let u = -r - 10; u < r + 10; u += 9) { const [x, y] = plane(14)(u, 0); c.line(x, y, x + 4, y - 2, "J") }
  })

  // Jediná žárovka v Praze: dřevěný sloup, rameno, drát, holá žárovka svítí teple, kolem ní můry. Drát od mlýna
  // odchází doleva z plátna.
  sprite("zarovka", { w: 64, h: 156 }, (c) => {
    c.ellipse(24, 152, 8, 2, "A")
    c.rect(22, 10, 5, 144, "H"); c.rect(22, 10, 2, 144, "h"); c.rect(20, 146, 9, 8, "3")
    c.rect(22, 18, 30, 3, "H"); c.line(26, 28, 40, 20, "H", 2)
    c.rect(18, 22, 4, 3, "W"); c.line(0, 30, 20, 23, "k") // izolátor a drát od mlýna
    c.line(48, 21, 48, 38, "k"); c.rect(47, 38, 3, 3, "M")
    c.rect(46, 41, 5, 6, "f"); c.rect(47, 47, 3, 1, "f"); c.px(48, 43, "W")
    ;[[40, 34], [56, 40], [42, 52], [55, 30]].forEach(([x, y]) => c.px(x, y, "k"))
  }, glow("f", { r: 12, strength: 0.7 }))
  // Táž žárovka zhasnutá (než se kolo rozjede): šedé sklo, žádná záře.
  sprite("zarovka_zhasla", { w: 64, h: 156 }, (c) => {
    c.ellipse(24, 152, 8, 2, "A")
    c.rect(22, 10, 5, 144, "H"); c.rect(22, 10, 2, 144, "h"); c.rect(20, 146, 9, 8, "3")
    c.rect(22, 18, 30, 3, "H"); c.line(26, 28, 40, 20, "H", 2)
    c.rect(18, 22, 4, 3, "W"); c.line(0, 30, 20, 23, "k")
    c.line(48, 21, 48, 38, "k"); c.rect(47, 38, 3, 3, "M")
    c.rect(46, 41, 5, 6, "x"); c.rect(47, 47, 3, 1, "x"); c.px(47, 42, "v")
  })

  // Staroměstská mostecká věž (Parléř): tmavý pískovec, průjezd s lomeným obloukem, sochařská výzdoba se znaky,
  // ochoz s kružbami, strmá břidlicová střecha s nárožními věžičkami. Půdorys 2 × 2 dlaždice, spodní bod plátna je
  // přední roh. Průjezd je ve stěně L (most vede napříč, podél b).
  sprite("vez_mostecka", { w: 280, h: 440 }, (c) => {
    const rng = c.rng(3)
    const x0 = 140, y0 = 439, L = sL(x0, y0), R = sR(x0, y0), S = 128, HB = 228, HG = 248
    c.poly(sQ(L, 0, S, 0, HB), "P"); c.poly(sQ(R, 0, S, 0, HB), "B")
    // kvádry
    for (let v = 12; v < HB; v += 12) {
      c.line(...L(0, v), ...L(S, v), "x"); c.line(...R(0, v), ...R(S, v), "a")
      for (let u = (v / 12) % 2 ? 8 : 20; u < S; u += 24) { c.line(...L(u, v), ...L(u, v + 11), "x"); c.line(...R(u, v), ...R(u, v + 11), "a") }
    }
    c.line(x0, y0, x0, y0 - HB, "p")
    // průjezd: lomený oblouk s ostěním, uvnitř tma a protější světlo
    c.poly([...L(36, 0), ...L(92, 0), ...L(92, 64), ...L(64, 100), ...L(36, 64)], "p")
    c.poly([...L(42, 0), ...L(86, 0), ...L(86, 62), ...L(64, 92), ...L(42, 62)], "k")
    c.poly([...L(52, 0), ...L(76, 0), ...L(76, 44), ...L(64, 60), ...L(52, 44)], "e")
    c.poly(sQ(L, 52, 76, 0, 6), "3")
    // trhlina od průjezdu nahoru
    c.line(...L(64, 102), ...L(60, 118), "k"); c.line(...L(60, 118), ...L(66, 132), "k")
    // sochařské pásmo: řada znaků zemí, výklenky se sochami (králové), kružby
    c.poly(sQ(L, 6, S - 6, 108, 112), "p")
    for (let k = 0; k < 8; k++) { const u = 12 + k * 14; c.poly(sQ(L, u, u + 9, 114, 126), k % 3 ? "V" : k % 2 ? "W" : "y"); c.poly(sQ(L, u, u + 9, 114, 116), "k"); c.poly([...L(u, 114), ...L(u + 9, 114), ...L(u + 4.5, 110)], "k") }
    ;[30, 64, 98].forEach((u) => {
      c.poly([...L(u - 11, 132), ...L(u + 11, 132), ...L(u + 11, 172), ...L(u, 184), ...L(u - 11, 172)], "k")
      const [x, y] = L(u, 134); c.rect(x - 4, y - 30, 9, 30, "x"); c.rect(x - 4, y - 30, 3, 30, "p"); c.circ(x, y - 33, 3, "x"); c.rect(x - 3, y - 38, 7, 2, "O")
      c.poly([...L(u - 13, 184), ...L(u + 13, 184), ...L(u, 196)], "p")
    })
    // úzká lomená okna na boční stěně, saze nad nimi
    ;[[40, 80], [88, 80], [40, 150], [88, 150]].forEach(([u, v]) => {
      c.poly([...R(u - 5, v), ...R(u + 5, v), ...R(u + 5, v + 26), ...R(u, v + 32), ...R(u - 5, v + 26)], rng() < 0.5 ? "k" : "n")
      c.poly([...R(u - 5, v + 32), ...R(u + 5, v + 32), ...R(u + 7, v + 54), ...R(u - 3, v + 50)], "a")
    })
    // bahno od suchého koryta, plevel u paty
    c.poly(sQ(L, 0, S, 0, 16), "3"); c.poly(sQ(R, 0, S, 0, 16), "K")
    c.poly(sQ(L, 52, 76, 0, 6), "e")
    for (let u = 2; u < S; u += 3) { if (rng() < 0.4) { const [x, y] = L(u, 16); c.vline(x, y - rd(rng() * 8), 4 + rd(rng() * 6), "e") } if (rng() < 0.4) { const [x, y] = R(u, 16); c.vline(x, y - rd(rng() * 8), 4 + rd(rng() * 6), "3") } }
    // ochoz s kružbami a fiálami
    c.poly(sQ(L, -4, S + 4, HB, HB + 4), "p"); c.poly(sQ(R, -4, S + 4, HB, HB + 4), "x")
    c.poly(sQ(L, 0, S, HB + 4, HG), "x"); c.poly(sQ(R, 0, S, HB + 4, HG), "a")
    for (let u = 4; u < S; u += 12) { c.poly([...L(u, HB + 6), ...L(u + 8, HB + 6), ...L(u + 8, HB + 14), ...L(u + 4, HB + 20), ...L(u, HB + 14)], "k"); c.poly([...R(u, HB + 6), ...R(u + 8, HB + 6), ...R(u + 8, HB + 14), ...R(u + 4, HB + 20), ...R(u, HB + 14)], "k") }
    for (let u = 0; u < S; u += 3) if (rng() < 0.5) { const [x, y] = L(u, HG); c.vline(x, y - 3, 3, rng() < 0.5 ? "G" : "g") }
    // střecha: jehlan z břidlice, řádky šablon, propadlé místo s krokvemi
    const ty = y0 - S / 2 - HG, ap = [x0, ty - 112]
    const lt = L(S, HG), ft = L(0, HG), rt = R(S, HG)
    c.poly([...ft, ...lt, ...ap], "s"); c.poly([...ft, ...rt, ...ap], "S")
    for (let t = 0.08; t < 1; t += 0.07) {
      const m = (p, q) => [rd(p[0] + (q[0] - p[0]) * t), rd(p[1] + (q[1] - p[1]) * t)]
      c.line(...m(ft, ap), ...m(lt, ap), "S"); c.line(...m(ft, ap), ...m(rt, ap), "k")
    }
    c.line(...ft, ...ap, "m")
    c.poly([x0 - 46, ty - 6, x0 - 30, ty - 20, x0 - 22, ty + 6, x0 - 40, ty + 14], "k"); c.line(x0 - 42, ty - 4, x0 - 36, ty + 12, "H"); c.line(x0 - 34, ty - 14, x0 - 28, ty + 6, "H")
    // nárožní věžičky s jehlou a špice na vrcholu
    const turret = ([x, y]) => {
      c.rect(x - 7, y - 30, 14, 30, "x"); c.rect(x - 7, y - 30, 5, 30, "p"); c.rect(x + 3, y - 30, 4, 30, "a")
      c.rect(x - 3, y - 24, 3, 10, "k"); c.rect(x - 9, y - 32, 18, 3, "p")
      c.poly([x - 9, y - 32, x + 9, y - 32, x, y - 74], "S"); c.poly([x - 9, y - 32, x, y - 32, x, y - 74], "s")
      c.line(x - 9, y - 32, x, y - 74, "k"); c.line(x + 9, y - 32, x, y - 74, "k"); c.line(x - 7, y, x - 7, y - 30, "k"); c.line(x + 7, y, x + 7, y - 30, "k")
      c.rect(x, y - 82, 1, 8, "Y")
    }
    const inset = (p) => [p[0] + (p[0] < x0 ? 6 : p[0] > x0 ? -6 : 0), p[1] + 2]
    turret(inset(lt)); turret(inset(rt)); turret(ft)
    c.rect(ap[0] - 1, ap[1] - 12, 3, 14, "Y"); c.circ(ap[0], ap[1] - 14, 2, "y")
  })

  // Kanec z Kampy do boje (zvětší se 4×): štětinatý hřbet, kly, rypák; 2 snímky (hrabe kopytem, hlava nahoru).
  anim("kanec", { w: 56, h: 36, outline: "k", fps: 3 }, (c) => {
    const up = c.frame === 1 ? 2 : 0
    c.ellipse(34, 17, 18, 11, "K"); c.ellipse(36, 21, 15, 6, "3")
    for (let x = 18; x < 46; x += 2) c.vline(x, 5 + (x % 4 ? 0 : 1) - (x < 26 ? 1 : 0), 4, x % 4 ? "x" : "3") // štětiny na hřbetě
    // klínová hlava s rypákem dole vpředu
    c.poly([24, 6, 24, 28, 12, 28 - up, 3, 27 - up, 2, 21 - up, 12, 12], "K")
    c.poly([24, 18, 24, 28, 12, 28 - up, 6, 26 - up], "3")
    c.rect(1, 21 - up, 4, 6, "4"); c.px(2, 23 - up, "k"); c.px(2, 25 - up, "k")
    c.line(6, 25 - up, 8, 20 - up, "W"); c.px(9, 20 - up, "w") // kel
    c.poly([16, 10, 18, 3, 22, 9], "3"); c.px(13, 15 - up, "f") // ucho, oko
    c.line(5, 27 - up, 12, 27 - up, "k")
    // nohy s kopýtky
    c.rect(18, 26, 3, 9, "3"); c.rect(23, 27, 3, 8, "K"); c.rect(40, 26, 3, 9, "3"); c.rect(45, 26, 3, 9, "K")
    c.rect(18, 34, 3, 1, "k"); c.rect(40, 34, 3, 1, "k")
  }, frame((c) => { c.rect(18, 26, 3, 9, "_"); c.line(19, 26, 14, 31, "3", 2); c.rect(12, 31, 3, 2, "k"); c.line(51, 12, 54, 16, "3") }),
  frame((c) => { c.line(51, 12, 55, 8, "3"); c.line(51, 12, 55, 9, "3") }))

  sheet("landmarks_staromak", ["hus", "orloj", "vez_mostecka"], { pad: 1 })
}
