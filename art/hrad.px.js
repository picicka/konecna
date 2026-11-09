// Malá Strana a Hrad: Trabant na nohách (Quo vadis), strážní budka, stůl velvyslance bez země, holubi ze Zámeckých
// schodů; na Hradě (jediné místo, kde se svítí) stavební buňka metra E, generátor se světlem, obelisk, čtečka
// záznamníku štítu, reflektor a cedule Kanceláře kanálu.
// Izometrie jako kiosk: a podél (doprava nahoru), b napříč (doprava dolů), z výška. hrP(ox, oy) vrací bod na plátně
// pro (a, b, z), kde (ox, oy) je obraz bodu a = b = z = 0 (u budek přední roh půdorysu = spodní střed plátna).
const hrP = (ox, oy) => (a, b, z = 0) => [ox + a + b, oy - a / 2 + b / 2 - z]
const hrQ = (P, pts) => pts.flatMap(([a, b, z]) => P(a, b, z))
// stěna kolmá na a (levá, světlejší) a stěna kolmá na b (pravá, ve stínu)
const hrL = (P, a, b0, b1, z0, z1) => hrQ(P, [[a, b0, z0], [a, b1, z0], [a, b1, z1], [a, b0, z1]])
const hrR = (P, b, a0, a1, z0, z1) => hrQ(P, [[a0, b, z0], [a1, b, z0], [a1, b, z1], [a0, b, z1]])
const hrTop = (P, a0, a1, b0, b1, z) => hrQ(P, [[a0, b0, z], [a1, b0, z], [a1, b1, z], [a0, b1, z]])
// Logo metra (Rathouský) v jednotkovém čtverci, opsané z METRO_ARROW/METRO_HOLE (art/fanta.px.js).
const HR_ARROW = [[0.27, 0.12], [0.40, 0.12], [0.50, 0.25], [0.60, 0.12], [0.73, 0.12], [0.73, 0.40], [0.87, 0.40], [0.87, 0.48], [0.50, 0.90], [0.13, 0.48], [0.13, 0.40], [0.27, 0.40]]
const HR_HOLE = [[0.34, 0.20], [0.39, 0.20], [0.50, 0.34], [0.61, 0.20], [0.66, 0.20], [0.66, 0.47], [0.77, 0.47], [0.50, 0.78], [0.23, 0.47], [0.34, 0.47]]
// fialová linky E (v paletě není, jediná barva mimo ni; vybledlá)
const HR_VIOLET = "#6a4f86"

// Quo vadis (David Černý, 1990): zlatý Trabant 601 na čtyřech lidských nohách, vylezl ze zahrady německého
// velvyslanectví. Jde k −a (dolů doleva), 4 snímky chůze. Pozlátko oprýskané na šedý tmel, promáčklý blatník,
// prasklé čelní sklo, diplomatická značka CD. Spodní střed plátna je pod předníma nohama, střed auta je 22 bodů výš.
anim("trabant", { w: 118, h: 112, frames: 4, fps: 6, outline: "k" }, (c) => {
  const k = c.phase * Math.PI * 2
  const bob = Math.round(Math.abs(Math.sin(k)) * 2)
  const P = hrP(52, 86)
  const Pb = (a, b, z) => P(a, b, z - bob)
  // nohy: kyčel ve výřezu kola, koleno vpředu, chodidlo na zemi; úhlopříčné páry jdou spolu
  const leg = (ah, bh, off, col, dark) => {
    const s = Math.sin(k + off), lift = Math.max(0, Math.cos(k + off)) * 5
    const fa = ah - 9 * s
    const hip = Pb(ah, bh, 38), knee = P(ah - 4 * s - 5, bh, 19 + lift / 2), foot = P(fa, bh, lift)
    c.line(hip[0], hip[1], knee[0], knee[1], col, 6)
    c.line(knee[0], knee[1], foot[0], foot[1], col, 5)
    c.line(knee[0] + 1, knee[1], foot[0] + 1, foot[1], dark, 1)
    const toe = P(fa - 6, bh, lift)
    c.line(foot[0], foot[1], toe[0], toe[1] + 1, col, 3)
    c.px(knee[0] - 1, knee[1] - 1, "y")
  }
  const ph = [[20, -8, 0], [-20, -8, Math.PI], [20, 8, Math.PI], [-20, 8, 0]]
  ph.forEach(([a, b, o], i) => leg(a, b, o, i < 2 ? "O" : "Y", i < 2 ? "k" : "O"))
  const R = (b, a0, a1, z0, z1, col) => c.poly(hrR(Pb, b, a0, a1, z0, z1), col)
  // spodní karoserie: předek (levá stěna) zlatý, bok ve stínu
  c.poly(hrL(Pb, -30, -13, 13, 36, 56), "Y")
  R(13, -30, 30, 36, 56, "O")
  c.poly(hrQ(Pb, [[-30, -13, 56], [-30, 13, 56], [-14, 13, 58], [-14, -13, 58]]), "y")   // kapota
  c.poly(hrTop(Pb, -14, 30, 11, 13, 58), "y"); c.poly(hrTop(Pb, 24, 30, -13, 13, 58), "y")
  // lisovaná hrana na boku a na předku (odlesk pozlátka)
  c.line(...Pb(-30, 13, 52), ...Pb(30, 13, 52), "Y"); c.line(...Pb(-30, -13, 55), ...Pb(-30, 13, 55), "y")
  // podběhy kol: tmavé výřezy, z nichž lezou nohy
  ;[-20, 20].forEach((a) => c.poly(hrR(Pb, 13, a - 7, a + 7, 36, 44), "k"))
  // kabina: čelní sklo šikmé, střecha, bok s okny
  c.poly(hrQ(Pb, [[-14, -11, 58], [-14, 11, 58], [-6, 11, 76], [-6, -11, 76]]), "n")
  c.poly(hrQ(Pb, [[-14, 11, 58], [-6, 11, 76], [20, 11, 76], [26, 11, 58]]), "O")
  c.poly(hrQ(Pb, [[-11, 11, 61], [-5, 11, 73], [5, 11, 73], [5, 11, 61]]), "n")
  c.poly(hrQ(Pb, [[8, 11, 61], [8, 11, 73], [18, 11, 73], [23, 11, 61]]), "n")
  c.poly(hrTop(Pb, -6, 20, -11, 11, 76), "y")
  // odlesk a prasklina čelního skla
  const [g0x, g0y] = Pb(-12, -6, 62), [g1x, g1y] = Pb(-8, 4, 72)
  c.line(g0x, g0y, g0x + 3, g0y - 6, "L"); c.line(g1x - 6, g1y + 4, g1x, g1y - 2, "x"); c.line(g1x - 3, g1y + 1, g1x - 1, g1y + 5, "x")
  // světla, mřížka, nárazník, značka CD
  ;[-8, 8].forEach((b) => { const [x, y] = Pb(-30, b, 49); c.circ(x, y, 3, "O"); c.circ(x, y, 2, b < 0 ? "W" : "x") })
  const [nx, ny] = Pb(-30, -13, 39); const [n2x, n2y] = Pb(-30, 13, 39)
  c.line(nx, ny, n2x, n2y, "M", 2)
  c.poly(hrL(Pb, -30, -5, 5, 40, 45), "W"); const [cx, cy] = Pb(-30, -3, 44); c.px(cx, cy + 1, "k"); c.px(cx + 1, cy + 1, "k"); c.px(cx + 3, cy + 2, "k"); c.px(cx + 4, cy + 3, "k")
  // otlučené pozlátko na tmel a rez, promáčklina na boku, klika
  c.poly(hrR(Pb, 13, -4, 6, 44, 50), "x"); c.poly(hrR(Pb, 13, 22, 28, 48, 54), "x")
  c.poly(hrL(Pb, -30, 4, 10, 52, 55), "x")
  ;[[-26, 40], [10, 40], [26, 38]].forEach(([a, z]) => { const [x, y] = Pb(a, 13, z); c.vline(x, y, 3, "U") })
  const [dx, dy] = Pb(12, 13, 46); c.line(dx, dy, dx + 6, dy - 2, "O"); c.line(dx, dy + 1, dx + 6, dy - 1, "y")
  const [hx, hy] = Pb(4, 13, 54); c.hline(hx, hy, 3, "k")
  // anténa a zpětné zrcátko
  const [ax, ay] = Pb(-26, 12, 56); c.line(ax, ay, ax - 4, ay - 18, "M")
  const [mx, my] = Pb(-12, 14, 60); c.rect(mx, my - 2, 3, 3, "O")
})

// Strážní budka Hradu: dřevěná, diagonální pruhy modrá, bílá, červená, vybledlé a oprýskané; stříška z plechu.
// Půdorys 20 × 20 (a 0–20, b −20–0), přední roh = spodní střed. Otvor do ulice (pravá stěna), uvnitř prázdno.
sprite("budka_straz", { w: 48, h: 112 }, (c) => {
  const P = hrP(24, 110), A = 20, H = 78
  const left = hrL(P, 0, -A, 0, 0, H), right = hrR(P, 0, 0, A, 0, H)
  c.poly(left, "w"); c.poly(right, "v")
  // pruhy: pásy u + z = konst. po 7 bodech, barvy dokola
  const cols = [["b", "w", "V"], ["S", "v", "D"]]
  ;[[left, (u, z) => P(0, -u, z), 0], [right, (u, z) => P(u, 0, z), 1]].forEach(([poly, F, side]) => c.clip(poly, () => {
    for (let s = -H, i = 0; s < A + H; s += 7, i++) {
      if (i % 3 === 1) continue
      c.poly([...F(s, 0), ...F(s + 7, 0), ...F(s + 7 - H, H), ...F(s - H, H)].map((p, j) => p), cols[side][i % 3])
    }
  }))
  // otvor a lavička uvnitř
  c.poly(hrR(P, 0, 5, 16, 6, 62), "k"); c.poly(hrR(P, 0, 7, 16, 6, 58), "n"); c.poly(hrR(P, 0, 7, 16, 22, 25), "H")
  // sokl, odstřik od země a oprýskaná barva
  c.poly(hrL(P, 0, -A, 0, 0, 5), "x"); c.poly(hrR(P, 0, 0, A, 0, 5), "P")
  c.clip(left, () => c.dither(0, 96, 48, 16, ".", "C", 0.2))
  ;[[-14, 40], [-6, 26], [-17, 60]].forEach(([b, z]) => { const [x, y] = P(0, b, z); c.rect(x, y, 3, 2, "C") })
  ;[[18, 34], [2, 48]].forEach(([a, z]) => { const [x, y] = P(a, 0, z); c.rect(x, y, 2, 3, "e") })
  // stříška: okap a jehlan
  c.poly(hrL(P, -2, -A - 2, 2, H, H + 4), "S"); c.poly(hrR(P, 2, -2, A + 2, H, H + 4), "A")
  const top = P(A / 2, -A / 2, H + 18)
  c.poly([...P(-2, -A - 2, H + 4), ...P(-2, 2, H + 4), ...top], "s")
  c.poly([...P(-2, 2, H + 4), ...P(A + 2, 2, H + 4), ...top], "S")
  c.rect(top[0] - 1, top[1] - 4, 2, 4, "Y")
  // rezavé stékance z okapu
  ;[[6, 70], [15, 72]].forEach(([a, z]) => { const [x, y] = P(a, 0, z); c.vline(x, y, 8, "U") })
})

// Stůl velvyslance bez země: kancelářský stůl, razítko, poduška, vlaječka bez státu (bílý cár), štos víz a lampa
// bez proudu. Půdorys a 0–40 × b −24–0 (přední roh = spodní střed). Velvyslanec sedí za ním (k +a, −b).
sprite("razitko_stul", { w: 84, h: 80 }, (c) => {
  const P = hrP(42, 78), A = 40, B = 24, H = 28
  // nohy a čelo
  c.poly(hrL(P, 1, -B + 1, -1, 0, H), "H"); c.poly(hrR(P, -1, 1, A - 1, 0, H), "3")
  c.poly(hrR(P, -1, 4, A - 4, 3, H - 6), "k")   // průhled pod deskou
  c.poly(hrR(P, -1, 8, 22, 6, H - 7), "H")       // šuplíky
  c.line(...P(12, -1, 15), ...P(18, -1, 15), "y")
  c.poly(hrL(P, 0, -B, 0, H - 4, H), "h"); c.poly(hrR(P, 0, 0, A, H - 4, H), "H")
  c.poly(hrTop(P, 0, A, -B, 0, H), "u")
  c.poly(hrTop(P, 3, A - 3, -B + 3, -3, H), "h")
  // papíry: štos víz a rozházené listy
  c.poly(hrTop(P, 4, 16, -12, -3, H + 1), "w"); c.poly(hrTop(P, 5, 17, -13, -4, H + 3), "W")
  c.poly(hrTop(P, 20, 30, -8, -2, H + 1), "v")
  ;[3, 5].forEach((d) => { const [x, y] = P(7, -6, H + d); c.hline(x, y, 6, "x") })
  // poduška s razítkem a razítko
  c.poly(hrTop(P, 22, 30, -20, -13, H + 2), "b"); c.poly(hrTop(P, 23, 29, -19, -14, H + 3), "k")
  const [sx, sy] = P(18, -16, H); c.rect(sx - 2, sy - 6, 5, 5, "H"); c.rect(sx - 1, sy - 12, 3, 6, "h"); c.circ(sx, sy - 13, 2, "h")
  const [fx, fy] = P(22, -5, H + 1); c.rect(fx - 1, fy - 3, 5, 2, "V")   // otisk razítka
  // vlaječka bez země: stojánek, tyčka, bílý cár
  const [vx, vy] = P(34, -6, H); c.rect(vx - 2, vy - 1, 5, 2, "M"); c.vline(vx, vy - 26, 25, "m")
  c.poly([vx + 1, vy - 26, vx + 13, vy - 24, vx + 12, vy - 17, vx + 1, vy - 18], "W"); c.poly([vx + 1, vy - 22, vx + 12, vy - 20, vx + 12, vy - 17, vx + 1, vy - 18], "w")
  // stolní lampa bez proudu
  const [lx, ly] = P(36, -20, H); c.ellipse(lx, ly, 4, 2, "S"); c.line(lx, ly, lx - 4, ly - 14, "S"); c.poly([lx - 8, ly - 14, lx, ly - 18, lx + 1, ly - 12, lx - 6, ly - 10], "Q")
  // kroužek od hrnku a odřené hrany
  const [kx, ky] = P(12, -18, H); c.ellipse(kx, ky, 3, 1, "H", true)
  c.line(...P(0, -B, H), ...P(0, 0, H), "C"); c.line(...P(0, 0, H), ...P(A, 0, H), "e")
})

// Holubi ze Zámeckých schodů do boje (zvětší se 4×): tři tlustí pražští holubi, krk do zelena a fialova, oranžové oko;
// 2 snímky (kývání hlavou, jeden zvedá křídlo).
const hrPigeon = (c, x, y, d, wing) => {
  c.poly([x + 7, y - 2, x + 15, y - 5, x + 16, y - 1, x + 8, y + 2], "x")   // ocas
  c.ellipse(x, y, 9, 6, "v"); c.ellipse(x - 1, y + 2, 7, 3, "w")
  c.ellipse(x + 2, y - 2 - wing, 6, 4, "x"); c.hline(x + 1, y - 1 - wing, 5, "P"); c.hline(x + 2, y + 1 - wing, 4, "P")
  c.ellipse(x - 6 + d, y - 4, 3, 3, "j"); c.px(x - 5 + d, y - 3, HR_VIOLET); c.px(x - 6 + d, y - 2, "Q")
  c.circ(x - 7 + d, y - 8, 3, "v"); c.px(x - 8 + d, y - 9, "o"); c.rect(x - 11 + d, y - 8, 2, 1, "W")
  c.vline(x - 2, y + 6, 3, "r"); c.vline(x + 2, y + 6, 3, "r"); c.hline(x - 4, y + 8, 3, "r")
}
anim("holub", { w: 54, h: 34, outline: "k", fps: 3 }, (c) => {
  const f = c.frame ?? 0
  hrPigeon(c, 39, 13, f ? 0 : -2, 0)
  hrPigeon(c, 13, 20, f ? -2 : 0, 0)
  hrPigeon(c, 34, 23, f ? -1 : 1, f ? 2 : 0)
  // trus pod nimi
  c.px(22, 32, "W"); c.px(46, 31, "W")
}, frame(), frame())

// Stavební buňka metra E na třetím nádvoří: šedomodrý vlnitý kontejner, logo metra a fialový čtverec linky E,
// rozsvícené okno (jediné světlo v Praze), dveře se schůdkem, kabely ke generátoru. Půdorys a 0–128 (2 dlaždice) ×
// b −40–0; přední roh je spodní střed plátna, střed půdorysu je 42 bodů nad spodním okrajem a vodorovně uprostřed.
sprite("bunka", { w: 176, h: 186 }, (c) => {
  const P = hrP(48, 184), A = 128, B = 40, H = 86
  const end = hrL(P, 0, -B, 0, 0, H), side = hrR(P, 0, 0, A, 0, H)
  c.poly(end, "l"); c.poly(side, "L")
  // vlnitý plech: svislé žlábky
  for (let u = 3; u < A; u += 4) c.line(...P(u, 0, 2), ...P(u, 0, H - 4), "b")
  for (let u = 3; u < B; u += 4) c.line(...P(0, -u, 2), ...P(0, -u, H - 4), "L")
  // rám a rohové sloupky
  c.poly(hrR(P, 0, 0, A, H - 5, H), "S"); c.poly(hrL(P, 0, -B, 0, H - 5, H), "s")
  c.poly(hrR(P, 0, 0, A, 0, 4), "S"); c.poly(hrL(P, 0, -B, 0, 0, 4), "s")
  c.poly(hrR(P, 0, 0, 4, 0, H), "s"); c.poly(hrR(P, 0, A - 4, A, 0, H), "S")
  c.poly(hrTop(P, 0, A, -B, 0, H), "M"); c.poly(hrTop(P, 3, A - 3, -B + 3, -3, H), "S")
  // rozsvícené okno s žaluzií a mříží
  c.poly(hrR(P, 0, 94, 124, 36, 62), "k"); c.poly(hrR(P, 0, 96, 122, 38, 60), "f")
  for (let z = 41; z < 60; z += 4) c.line(...P(96, 0, z), ...P(122, 0, z), "Y")
  ;[103, 109, 115].forEach((u) => c.line(...P(u, 0, 38), ...P(u, 0, 60), "k"))
  // dveře, klika, schůdek z europalety
  c.poly(hrR(P, 0, 20, 40, 4, 72), "S"); c.poly(hrR(P, 0, 22, 38, 6, 70), "s")
  c.poly(hrR(P, 0, 25, 35, 50, 64), "f"); c.line(...P(30, 0, 50), ...P(30, 0, 64), "k")
  c.rect(...P(35, 0, 36), 2, 2, "m")
  c.poly(hrR(P, 8, 18, 42, 0, 6), "H"); c.poly(hrTop(P, 18, 42, 0, 8, 6), "h")
  ;[0, 4].forEach((d) => c.line(...P(18, d, 6), ...P(42, d, 6), "H"))
  // značka metra: černý čtverec s logem a fialový čtverec s černým E (rovina pravé stěny)
  const S = 22, u0 = 44, v0 = 50
  const map = (u, pts) => pts.flatMap(([x, y]) => P(u + x * S, 0, v0 + (1 - y) * S))
  c.poly(hrR(P, 0, u0 - 2, u0 + S * 2 + 4, v0 - 2, v0 + S + 2), "m")
  c.poly(hrR(P, 0, u0, u0 + S, v0, v0 + S), "k")
  c.poly(map(u0, HR_ARROW), "W"); c.poly(map(u0, HR_HOLE), "k")
  const u1 = u0 + S + 2
  c.poly(hrR(P, 0, u1, u1 + S, v0, v0 + S), HR_VIOLET)
  ;[[[0.30, 0.22], [0.42, 0.22], [0.42, 0.78], [0.30, 0.78]], [[0.30, 0.22], [0.72, 0.22], [0.72, 0.34], [0.30, 0.34]],
    [[0.30, 0.44], [0.66, 0.44], [0.66, 0.56], [0.30, 0.56]], [[0.30, 0.66], [0.72, 0.66], [0.72, 0.78], [0.30, 0.78]]]
    .forEach((pts) => c.poly(map(u1, pts), "k"))
  // šablona na čele: METRO E a číslo buňky
  c.text(...P(0, -24, 30), "07", "W")
  // špína: odstřik od země, rezavé stékance z rohů a pod oknem, sprej
  c.clip(side, () => c.dither(0, 150, 176, 36, ".", "x", 0.25))
  c.clip(end, () => c.dither(0, 166, 60, 24, ".", "v", 0.25))
  ;[[4, H - 6, 30], [92, 36, 18], [120, 36, 22], [126, H - 6, 40]].forEach(([u, z, l]) => { const [x, y] = P(u, 0, z); c.vline(x, y, l, "U") })
  const [sx, sy] = P(64, 0, 22); c.line(sx, sy, sx + 12, sy - 8, "7"); c.line(sx + 2, sy + 4, sx + 14, sy - 4, "7"); c.line(sx + 6, sy - 6, sx + 6, sy + 4, "7")
  // kabely ze střechy dolů k zemi a klimatizace na střeše
  c.poly(hrTop(P, 96, 116, -30, -14, H), "x"); c.poly(hrR(P, -14, 96, 116, H, H + 10), "m"); c.poly(hrTop(P, 96, 116, -30, -14, H + 10), "q")
  const [k0x, k0y] = P(120, 0, H), [k1x, k1y] = P(132, 6, 0)
  c.wire(k0x, k0y, k1x, k1y, 6, "k"); c.wire(k0x - 3, k0y + 1, k1x - 6, k1y + 2, 10, "A")
  const [w0x, w0y] = P(12, 0, H), [w1x, w1y] = P(10, 6, 0); c.line(w0x, w0y, w1x, w1y - 2, "k"); c.line(w1x, w1y - 2, w1x - 14, w1y + 5, "k")
}, glow("f", { r: 10, strength: 0.55 }))

// Dieselový generátor na ližinách se stožárem a dvojicí pracovních světel; kanystr, kabely. 2 snímky: světlo
// pomrkává, z výfuku jde obláček. Půdorys a 0–44 × b −24–0 (přední roh = spodní střed).
anim("generator", { w: 84, h: 156, frames: 2, fps: 4 }, (c) => {
  const f = c.frame ?? 0
  const P = hrP(30, 154), A = 44, B = 24, H = 30
  // ližiny a skříň (vybledlá žlutá s rzí)
  c.poly(hrR(P, 0, -2, A + 2, 0, 4), "k"); c.poly(hrL(P, -2, -B, 0, 0, 4), "k")
  c.poly(hrL(P, 0, -B, 0, 4, H), "Y"); c.poly(hrR(P, 0, 0, A, 4, H), "O")
  c.poly(hrTop(P, 0, A, -B, 0, H), "y")
  c.poly(hrTop(P, 10, 34, -18, -6, H + 1), "Y"); c.rect(...P(22, -12, H + 4), 2, 3, "M")   // víko a závěsné oko
  for (let u = 6; u < 26; u += 3) c.line(...P(u, 0, 10), ...P(u, 0, 24), "U")   // žaluzie chlazení
  c.poly(hrR(P, 0, 30, 40, 12, 22), "S"); c.px(...P(33, 0, 18), "E"); c.px(...P(36, 0, 18), f ? "F" : "U")
  ;[[2, 28, 18], [42, 28, 14], [18, 6, 4]].forEach(([u, z, l]) => { const [x, y] = P(u, 0, z); c.vline(x, y, l, "U") })
  c.clip(hrR(P, 0, 0, A, 4, H), () => c.dither(0, 140, 84, 16, ".", "e", 0.4))
  // výfuk a obláček
  const [ex, ey] = P(36, -18, H); c.rect(ex, ey - 10, 3, 10, "M"); c.rect(ex, ey - 11, 3, 2, "k")
  if (f) { c.circ(ex + 3, ey - 16, 3, "x"); c.circ(ex + 7, ey - 22, 2, "v") } else { c.circ(ex + 2, ey - 15, 2, "v"); c.circ(ex + 5, ey - 24, 3, "x") }
  // stožár se dvěma světly
  const [mx, my] = P(6, -18, H)
  c.rect(mx - 1, my - 84, 3, 84, "M"); c.rect(mx - 1, my - 84, 1, 84, "m")
  c.rect(mx - 13, my - 86, 27, 2, "S")
  ;[-12, 4].forEach((dx) => {
    c.rect(mx + dx - 1, my - 96, 11, 10, "S"); c.rect(mx + dx, my - 95, 9, 8, f && dx > 0 ? "y" : "W")
    c.rect(mx + dx + 1, my - 94, 7, 6, f && dx > 0 ? "Y" : "f")
  })
  // kabel ze stožáru, kabely po zemi a kanystr
  c.wire(mx + 2, my - 80, mx + 6, my - 4, 4, "k")
  const [g0x, g0y] = P(A, -10, 8), [g1x, g1y] = P(A + 20, 4, 0); c.wire(g0x, g0y, g1x, g1y, 4, "k")
  c.line(g1x, g1y, g1x - 10, g1y + 3, "k")
  const [jx, jy] = P(-8, -8, 0); c.rect(jx - 6, jy - 16, 12, 16, "V"); c.rect(jx - 6, jy - 16, 4, 16, "D")
  c.rect(jx - 3, jy - 19, 6, 3, "V"); c.rect(jx + 2, jy - 20, 3, 2, "k"); c.line(jx - 4, jy - 12, jx + 4, jy - 4, "D")
}, glow("fW", { where: [0, 10, 84, 20], r: 12, strength: 0.6 }))

// Žulový obelisk na třetím nádvoří (Plečnik, 1928; při převozu se zlomil a dál stojí kratší). Zúžený hranol, levá
// strana na světle, jehlan nahoře, prasklina přes obě strany, šmouhy od deště. Spodní střed = přední roh podstavce.
sprite("obelisk", { w: 40, h: 262 }, (c) => {
  const P = hrP(20, 260)
  // podstavec ve dvou stupních
  c.poly(hrL(P, 0, -18, 0, 0, 6), "p"); c.poly(hrR(P, 0, 0, 18, 0, 6), "P"); c.poly(hrTop(P, 0, 18, -18, 0, 6), "q")
  c.poly(hrL(P, 3, -15, -3, 6, 12), "p"); c.poly(hrR(P, -3, 3, 15, 6, 12), "P"); c.poly(hrTop(P, 3, 15, -15, -3, 12), "q")
  // dřík: dole 12 × 12, nahoře 7 × 7, výška 220
  const lo = [3, 15], hi = [5.5, 12.5], Z0 = 12, Z1 = 232
  const leftF = hrQ(P, [[lo[0], -lo[1], Z0], [lo[0], -lo[0], Z0], [hi[0], -hi[0], Z1], [hi[0], -hi[1], Z1]])
  const rightF = hrQ(P, [[lo[0], -lo[0], Z0], [lo[1], -lo[0], Z0], [hi[1], -hi[0], Z1], [hi[0], -hi[0], Z1]])
  c.poly(leftF, "q"); c.poly(rightF, "p")
  // jehlan
  const apex = P(9, -9, 248)
  c.poly([...P(hi[0], -hi[1], Z1), ...P(hi[0], -hi[0], Z1), ...apex], "w")
  c.poly([...P(hi[0], -hi[0], Z1), ...P(hi[1], -hi[0], Z1), ...apex], "v")
  // šmouhy od deště a prasklina (zlom v jedné třetině)
  c.clip(leftF, () => { for (let x = 6; x < 20; x += 3) c.vline(x, 30, 40 + (x * 7) % 50, "p") })
  c.clip(rightF, () => { for (let x = 21; x < 34; x += 4) c.vline(x, 36, 30 + (x * 5) % 60, "P") })
  const cr = [[5, 172], [9, 168], [13, 174], [18, 166], [22, 171], [27, 165], [33, 170]]
  for (let i = 1; i < cr.length; i++) c.line(cr[i - 1][0], cr[i - 1][1], cr[i][0], cr[i][1], "k")
  c.line(13, 175, 14, 186, "P"); c.line(22, 172, 24, 180, "P")
  c.clip(leftF, () => c.dither(0, 236, 40, 14, ".", "e", 0.4)); c.clip(rightF, () => c.dither(0, 236, 40, 14, ".", "e", 0.4))
})

// Čtečka záznamníku štítu: odolný průmyslový terminál na trojnožce, malá zelená obrazovka, klávesnice, kabel
// k buňce. Spodní střed = noha trojnožky vpředu.
sprite("ctecka", { w: 40, h: 82 }, (c) => {
  // trojnožka
  c.line(20, 50, 8, 79, "S", 2); c.line(20, 50, 33, 78, "S", 2); c.line(20, 50, 20, 81, "M", 2)
  c.rect(18, 46, 5, 8, "M")
  // skříň terminálu s gumovými rohy
  c.poly([4, 14, 24, 6, 36, 12, 36, 42, 16, 50, 4, 44], "M"); c.poly([24, 6, 36, 12, 36, 42, 24, 36], "S")
  c.poly([4, 14, 24, 6, 24, 36, 4, 44], "m")
  c.rect(3, 12, 3, 4, "k"); c.rect(3, 41, 3, 4, "k"); c.rect(34, 10, 3, 4, "k")
  // obrazovka a klávesnice
  c.poly([7, 17, 21, 11, 21, 27, 7, 33], "k"); c.poly([8, 18, 20, 13, 20, 26, 8, 31], "E")
  for (let i = 0; i < 4; i++) c.line(8, 20 + i * 3, 20, 15 + i * 3, i % 2 ? "I" : "E")
  c.px(10, 28, "I"); c.px(11, 28, "I")
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) c.rect(9 + i * 4, 37 - i * 2 + j * 0, 2, 2, j === 0 ? "x" : "x")
  c.rect(9, 40, 10, 2, "P")
  // anténa, štítek, kabel
  c.vline(30, 0, 10, "k"); c.px(30, 0, "7")
  c.rect(26, 26, 7, 4, "y"); c.px(28, 27, "k")
  c.wire(36, 30, 39, 78, 4, "k")
}, glow("EI", { r: 6, strength: 0.5 }))

// Pracovní reflektor na trojnožce: hranatá lampa svítí dolů doleva, rozžhavené sklo, kabel.
sprite("reflektor", { w: 44, h: 96 }, (c) => {
  c.line(22, 46, 8, 93, "S", 2); c.line(22, 46, 37, 92, "S", 2); c.line(22, 46, 22, 95, "M", 2)
  c.rect(21, 30, 3, 18, "M")
  // třmen a lampa
  c.line(12, 30, 34, 30, "S", 2); c.line(12, 30, 12, 20, "S", 2); c.line(34, 30, 34, 20, "S", 2)
  c.poly([10, 8, 30, 4, 38, 10, 38, 28, 18, 34, 10, 28], "S"); c.poly([30, 4, 38, 10, 38, 28, 30, 22], "A")
  c.poly([11, 10, 29, 6, 29, 22, 11, 27], "W"); c.poly([13, 12, 27, 9, 27, 20, 13, 24], "f")
  c.line(13, 17, 27, 14, "y")
  for (let x = 31; x < 38; x += 2) c.line(x, 8 + (x - 31) / 2, x, 24 + (x - 31) / 2, "k")   // žebra chladiče
  c.wire(22, 46, 42, 90, 6, "k")
}, glow("Wf", { where: [10, 4, 20, 26], r: 14, strength: 0.7 }))

// Cedule Kanceláře kanálu: deska z překližky natřená bílou, ručně psané červené a černé písmo, dva sloupky
// zatlučené do dlažby, rez od hřebíků. Rovně proti hráčce. Spodní střed = mezi sloupky.
sprite("ochranka_cedule", { w: 76, h: 60 }, (c) => {
  c.rect(10, 26, 4, 34, "H"); c.rect(62, 26, 4, 34, "H"); c.rect(10, 26, 1, 34, "h"); c.rect(62, 26, 1, 34, "h")
  c.rect(1, 2, 74, 30, "H"); c.rect(2, 3, 72, 28, "w"); c.rect(2, 3, 72, 1, "W")
  // písmo 3 × 5 s dokreslenou čárkou a háčkem
  c.text(8, 8, "KANCELAR KANALU", "V")
  c.rect(33, 6, 1, 1, "V"); c.rect(34, 5, 1, 1, "V")                // Á
  c.px(36, 5, "V"); c.px(37, 6, "V"); c.px(38, 5, "V")              // Ř
  c.rect(57, 6, 1, 1, "V"); c.rect(58, 5, 1, 1, "V")                // Á
  c.text(10, 18, "VSTUP ZAKAZAN", "k")
  c.px(47, 16, "k"); c.px(48, 15, "k")                              // Á
  c.px(55, 16, "k"); c.px(56, 15, "k")                              // Á
  c.hline(10, 24, 51, "k")
  // hřebíky s rezavými stékanci, šmouhy a ohmatané rohy
  ;[[4, 6], [71, 6], [4, 27], [71, 27]].forEach(([x, y]) => { c.px(x, y, "k"); c.vline(x, y + 1, 3, "U") })
  c.dither(2, 28, 72, 3, ".", "v", 0.3); c.vline(30, 25, 5, "x")
})
