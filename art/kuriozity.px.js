// Pražské kuriozity v prázdných plochách (suché koryto Vltavy, voda na Starém Městě a dolním Václaváku, pustá hlína
// za Václavákem, svah pod Hradem): rozbité a zapomenuté věci spojené s Prahou. Rozmisťuje je WorldScene.placeOddities
// podle `oddities` v src/places/<místo>.js. Počátek je dole uprostřed (pata věci na zemi), spodek je mokrý a blátivý,
// aby věc seděla ve vodě i v bahně.
//   mlok          velký mlok z Čapkovy Války s mloky, po pás v bahně, v buřince, kouří (4 snímky: kouř stoupá)
//   mlok_maly_1/2 hlava a hřbet mloka nad hladinou
//   stalin_hlava  žulová hlava ze Stalinova pomníku na Letné, napůl zapadlá, prasklá, na ní kavka
//   metronom      zlomená ručička metronomu z Letné (stojí, kde stál Stalin), rezavý nosník se závažím
//   golem         Golem z pověsti, sedí a rozpadá se, šém z čela vypadl
//   miminko       lezoucí miminko Davida Černého ze Žižkovské věže, spadlé, bez ruky, místo tváře štěrbina
//   kun_lucerna   kůň z Lucerny (Černý) spadlý ze stropu: leží na zádech, nohy nahoru, svatý Václav sedí na břiše
//   kafka         Kafkova hlava (Černý): lesklé ocelové plátky rozsypané po zemi
//   labut         šlapadlo labuť z Vltavy, převrácené na bok, krk zlomený
//   kapr_vana     smaltovaná vana, z ní čouhá ocas obrovského vánočního kapra

// mokrý kruh u paty: tmavá skvrna a pár vlnek, ať věc v bahně i ve vodě „sedí“
function kuWet(c, x, y, rx, ry) {
  c.ellipse(x, y, rx, ry, "K")
  c.ellipse(x, y - 1, rx - 3, Math.max(1, ry - 2), "H")
  for (let i = 0; i < 4; i++) c.hline(x - rx + 4 + i * (rx / 2), y + ry - 1 - (i % 2) * 2, 5, "J")
}

// Mlok: tělo do pasu z bahna, ruka u úst s cigaretou, druhá opřená v bok, buřinka. Kouř po snímcích stoupá a slábne.
anim("mlok", { w: 96, h: 150, frames: 4, fps: 4 }, (c) => {
  const f = c.frame ?? 0
  const X = 48, Y = 146
  kuWet(c, X, Y - 4, 34, 7)
  // trup: hruškovitý, hřbet tmavší, břicho světlé
  c.poly([X - 20, Y - 6, X - 22, Y - 40, X - 16, Y - 64, X - 6, Y - 72, X + 8, Y - 72, X + 16, Y - 62, X + 20, Y - 38, X + 18, Y - 6], "G")
  c.poly([X - 10, Y - 6, X - 12, Y - 40, X - 6, Y - 62, X + 6, Y - 62, X + 10, Y - 40, X + 8, Y - 6], "4")
  for (let y = Y - 56; y < Y - 8; y += 6) c.hline(X - 8, y, 15, "C")   // příčné rýhy na břiše
  for (let i = 0; i < 9; i++) c.px(X - 18 + (i * 5) % 34, Y - 20 - (i * 13) % 44, "k")   // tmavé skvrny na kůži
  // hlava: široká, plochá, bez krku, velká tlama
  c.ellipse(X, Y - 80, 19, 12, "G"); c.ellipse(X + 1, Y - 76, 16, 6, "4")
  c.line(X - 16, Y - 76, X + 17, Y - 75, "k")
  c.circ(X - 9, Y - 86, 3, "k"); c.px(X - 10, Y - 87, "W"); c.circ(X + 9, Y - 86, 3, "k"); c.px(X + 8, Y - 87, "W")
  // buřinka
  c.ellipse(X, Y - 91, 16, 3, "k"); c.ellipse(X, Y - 96, 10, 7, "k"); c.hline(X - 9, Y - 93, 19, "A")
  // levá ruka v bok, pravá k ústům s cigaretou
  c.line(X - 18, Y - 58, X - 28, Y - 44, "G", 5); c.line(X - 28, Y - 44, X - 18, Y - 34, "G", 4)
  c.line(X + 17, Y - 58, X + 28, Y - 64, "G", 5); c.line(X + 28, Y - 64, X + 18, Y - 76, "G", 4)
  c.circ(X + 18, Y - 77, 3, "g")
  c.line(X + 17, Y - 76, X + 27, Y - 79, "W", 1); c.px(X + 28, Y - 80, "F"); c.px(X + 27, Y - 80, "f")
  // kouř: tři obláčky, každý snímek o kus výš
  for (let k = 0; k < 3; k++) {
    const t = (k * 4 + f * 4) % 12, x = X + 30 + Math.round(Math.sin((t + k) * 0.7) * 4), y = Y - 86 - t * 4
    c.circ(x, y, 2 + Math.floor(t / 4), t < 8 ? "v" : "x")
  }
  // hřeben po zádech (vidět na obrysu) a lesk na hlavě
  for (let y = Y - 68; y < Y - 20; y += 5) c.px(X - 21 + Math.round((y - Y + 68) / 16), y, "g")
  c.hline(X - 6, Y - 89, 8, "g")
}, glow("F", { r: 6, strength: 0.8 }))

function mlokMaly(name, flip) {
  sprite(name, { w: 56, h: 40 }, (c) => {
    const s = flip ? -1 : 1, X = 28, Y = 34
    kuWet(c, X, Y, 22, 5)
    // hřbet s hřebenem, hlava nad hladinou, ocas za ní
    c.ellipse(X - 6 * s, Y - 4, 12, 4, "G"); for (let i = -14; i < 4; i += 3) c.px(X + i * s, Y - 8, "g")
    c.ellipse(X + 10 * s, Y - 7, 8, 5, "G"); c.ellipse(X + 11 * s, Y - 5, 6, 2, "4")
    c.px(X + 8 * s, Y - 10, "k"); c.px(X + 14 * s, Y - 10, "k")
    c.line(X - 18 * s, Y - 3, X - 24 * s, Y - 6, "G", 2)
  })
}
mlokMaly("mlok_maly_1", false); mlokMaly("mlok_maly_2", true)

// Stalinova hlava: žula, nakloněná, zapadlá po bradu do bahna. Zčesané vlasy, knír, prasklina přes čelo, mech, kavka.
sprite("stalin_hlava", { w: 150, h: 120 }, (c) => {
  const X = 75, Y = 114
  kuWet(c, X, Y - 4, 60, 9)
  // hlava jako kvádr zaoblený: levá strana světlá, pravá ve stínu
  c.poly([X - 46, Y - 6, X - 52, Y - 50, X - 40, Y - 88, X - 10, Y - 104, X + 24, Y - 100, X + 46, Y - 78, X + 50, Y - 36, X + 42, Y - 6], "p")
  c.poly([X + 10, Y - 102, X + 24, Y - 100, X + 46, Y - 78, X + 50, Y - 36, X + 42, Y - 6, X + 14, Y - 6], "P")
  c.noise(X - 50, Y - 104, 100, 100, "x", 0.06, 11, "pP")
  // vlasy dozadu
  for (let i = 0; i < 7; i++) c.line(X - 34 + i * 9, Y - 92 + Math.abs(i - 3), X - 44 + i * 11, Y - 100 + Math.abs(i - 3) * 2, "x")
  // obočí, oči, nos, knír
  c.line(X - 30, Y - 66, X - 12, Y - 70, "A", 3); c.line(X + 2, Y - 70, X + 22, Y - 66, "A", 3)
  c.hline(X - 28, Y - 60, 14, "x"); c.hline(X + 6, Y - 60, 14, "x"); c.px(X - 22, Y - 60, "k"); c.px(X + 12, Y - 60, "k")
  c.poly([X - 6, Y - 64, X + 2, Y - 64, X + 6, Y - 40, X - 10, Y - 40], "q"); c.line(X + 2, Y - 64, X + 6, Y - 40, "P")
  c.poly([X - 30, Y - 34, X - 14, Y - 40, X + 18, Y - 40, X + 32, Y - 32, X + 22, Y - 28, X - 22, Y - 28], "x")
  for (let x = X - 26; x < X + 28; x += 4) c.vline(x, Y - 36, 6, "A")
  // prasklina a mech
  let x = X - 14, y = Y - 100
  for (let s = 0; s < 40; s++) { c.px(x, y, "k"); y += 2; x += (s % 3) - 1 }
  c.noise(X - 50, Y - 40, 40, 36, "g", 0.18, 12, "pPx"); c.noise(X + 20, Y - 100, 30, 20, "G", 0.12, 13, "pP")
  // kavka na temeni
  c.ellipse(X + 18, Y - 106, 5, 4, "k"); c.circ(X + 23, Y - 110, 3, "k"); c.px(X + 26, Y - 110, "x"); c.px(X + 23, Y - 111, "w"); c.line(X + 13, Y - 105, X + 8, Y - 104, "k")
})

// Metronom z Letné: dlouhý rezavý nosník zlomený vejpůl, kus ještě se závažím, leží šikmo přes suť.
sprite("metronom", { w: 220, h: 96 }, (c) => {
  const X = 110, Y = 88
  c.ellipse(X, Y - 2, 96, 7, "A")
  // delší díl (od paty k zlomu), příhradový nosník: dva pásy a diagonály
  const beam = (x0, y0, x1, y1, w) => {
    c.line(x0, y0, x1, y1, "U", 2); c.line(x0, y0 - w, x1, y1 - w, "u", 2)
    const n = Math.round(Math.hypot(x1 - x0, y1 - y0) / 8)
    for (let i = 0; i < n; i++) {
      const t0 = i / n, t1 = (i + 1) / n
      c.line(Math.round(x0 + (x1 - x0) * t0), Math.round(y0 + (y1 - y0) * t0), Math.round(x0 + (x1 - x0) * t1), Math.round(y0 - w + (y1 - y0) * t1), "U")
    }
  }
  beam(14, Y - 6, 112, Y - 26, 9)
  // zlom: roztřepené konce
  c.line(112, Y - 26, 118, Y - 38, "u"); c.line(110, Y - 34, 116, Y - 44, "U"); c.px(119, Y - 40, "k")
  // kratší díl se závažím, opřený o zem pod úhlem
  beam(128, Y - 44, 200, Y - 8, 9)
  c.poly([176, Y - 30, 198, Y - 20, 196, Y - 2, 172, Y - 12], "M"); c.poly([176, Y - 30, 198, Y - 20, 200, Y - 24, 180, Y - 34], "m")
  c.line(172, Y - 12, 196, Y - 2, "k")
  // čep u paty a nýty
  c.circ(16, Y - 10, 5, "M"); c.circ(16, Y - 10, 2, "k")
  for (let i = 0; i < 8; i++) c.px(26 + i * 11, Y - 9 - Math.round(i * 2.2), "W")
  // rez stéká, plevel
  c.noise(10, Y - 50, 200, 50, "R", 0.05, 21, "Uu")
  for (let i = 0; i < 5; i++) c.vline(30 + i * 37, Y - 6, 4, "g")
})

// Golem: hliněný obr sedí opřený, rozpraskaný, levá ruka upadla vedle, v čele díra po šému, šém (destička) v blátě.
sprite("golem", { w: 100, h: 130 }, (c) => {
  const X = 50, Y = 124
  c.ellipse(X, Y - 2, 40, 6, "K")
  // nohy natažené dopředu
  c.poly([X - 22, Y - 4, X - 6, Y - 4, X - 4, Y - 26, X - 24, Y - 28], "u"); c.poly([X + 4, Y - 4, X + 22, Y - 4, X + 24, Y - 28, X + 4, Y - 26], "U")
  c.rect(X - 26, Y - 8, 22, 6, "U"); c.rect(X + 4, Y - 8, 22, 6, "H")
  // trup: masivní, lehce předkloněný
  c.poly([X - 26, Y - 28, X - 30, Y - 74, X - 16, Y - 86, X + 18, Y - 86, X + 30, Y - 72, X + 26, Y - 28], "u")
  c.poly([X + 6, Y - 86, X + 18, Y - 86, X + 30, Y - 72, X + 26, Y - 28, X + 6, Y - 28], "U")
  // hlava: hrubá, bez krku, prázdné oči, díra v čele
  c.poly([X - 14, Y - 86, X - 16, Y - 108, X - 8, Y - 116, X + 10, Y - 116, X + 16, Y - 106, X + 14, Y - 86], "u")
  c.rect(X - 9, Y - 102, 5, 4, "k"); c.rect(X + 4, Y - 102, 5, 4, "k"); c.hline(X - 6, Y - 92, 12, "H")
  c.rect(X - 3, Y - 113, 6, 4, "K")
  // pravá ruka visí podél těla, levá upadla a leží vedle
  c.poly([X + 26, Y - 74, X + 36, Y - 70, X + 36, Y - 34, X + 28, Y - 32], "U")
  c.poly([X - 30, Y - 72, X - 36, Y - 66, X - 34, Y - 56, X - 28, Y - 60], "u")
  c.poly([X - 48, Y - 6, X - 26, Y - 12, X - 24, Y - 4, X - 46, Y + 0], "u"); c.circ(X - 48, Y - 3, 3, "U")
  // praskliny, odpadlé kusy hlíny
  for (const [x0, y0, n] of [[X - 20, Y - 80, 18], [X + 8, Y - 70, 22], [X - 6, Y - 110, 10], [X + 20, Y - 50, 12]]) {
    let x = x0, y = y0
    for (let s = 0; s < n; s++) { c.px(x, y, "k"); y += 2; x += ((s * 7) % 3) - 1 }
  }
  for (let i = 0; i < 7; i++) c.rect(X - 30 + i * 9, Y - 3 + (i % 2), 3, 2, i % 2 ? "u" : "U")
  // šém: hliněná destička s písmeny v blátě
  c.rect(X + 30, Y - 8, 12, 6, "C"); c.hline(X + 32, Y - 6, 8, "H"); c.hline(X + 32, Y - 4, 6, "H")
})

// Miminko Davida Černého: tmavý bronz, leze po čtyřech, místo tváře štěrbina; spadlé z věže, bez pravé ruky.
sprite("miminko", { w: 80, h: 64 }, (c) => {
  const X = 40, Y = 58
  c.ellipse(X, Y - 2, 30, 5, "A")
  // tělo: dlouhé, hrbaté
  c.poly([X - 26, Y - 10, X - 22, Y - 26, X + 4, Y - 32, X + 22, Y - 26, X + 24, Y - 12, X - 4, Y - 8], "O")
  c.poly([X - 22, Y - 26, X + 4, Y - 32, X + 22, Y - 26, X + 4, Y - 28], "Y")
  // nohy a levá ruka
  c.poly([X - 26, Y - 12, X - 30, Y - 2, X - 22, Y - 2, X - 18, Y - 12], "O"); c.poly([X + 18, Y - 14, X + 20, Y - 2, X + 26, Y - 2, X + 24, Y - 14], "k")
  c.poly([X - 6, Y - 12, X - 8, Y - 2, X - 2, Y - 2, X, Y - 12], "O")
  // hlava a štěrbina místo tváře
  c.ellipse(X + 24, Y - 34, 12, 11, "O"); c.ellipse(X + 21, Y - 38, 7, 5, "Y")
  c.rect(X + 30, Y - 38, 4, 9, "k")
  // ulomené rameno pravé ruky, ruka leží opodál
  c.poly([X + 12, Y - 20, X + 18, Y - 18, X + 16, Y - 12, X + 10, Y - 14], "k"); c.line(X + 12, Y - 18, X + 16, Y - 14, "y")
  c.line(X - 34, Y - 2, X - 24, Y - 6, "O", 3)
  c.noise(X - 26, Y - 46, 62, 44, "Q", 0.08, 31, "OY")   // měděnka
})

// Kůň z Lucerny: spadl ze stropu pasáže, leží na zádech, nohy trčí, jazyk venku; Václav pořád sedí na břiše.
sprite("kun_lucerna", { w: 160, h: 110 }, (c) => {
  const X = 80, Y = 102
  c.ellipse(X, Y - 2, 66, 7, "A")
  // trup naležato (břicho nahoře)
  c.ellipse(X, Y - 22, 44, 18, "O"); c.ellipse(X - 6, Y - 32, 30, 5, "Y"); c.ellipse(X + 2, Y - 10, 40, 4, "k")
  c.line(X - 30, Y - 22, X + 30, Y - 22, "Y")
  // hlava dole vlevo, krk zalomený, jazyk
  c.poly([X - 44, Y - 18, X - 66, Y - 10, X - 72, Y - 2, X - 58, Y, X - 40, Y - 8], "O"); c.circ(X - 60, Y - 8, 2, "k")
  c.line(X - 70, Y - 2, X - 74, Y + 2, "V", 2)
  c.line(X + 46, Y - 22, X + 62, Y - 10, "O", 4)   // ocas
  // čtyři nohy nahoru, zalomené v kolenou, kopyta
  for (const [x, k] of [[X - 30, -1], [X - 20, -0.4], [X + 18, 0.4], [X + 30, 1]]) {
    const kx = Math.round(x + 8 * k), fx = Math.round(x + 4 * k)
    c.line(x, Y - 34, kx, Y - 54, "O", 6); c.line(kx, Y - 54, fx, Y - 74, "O", 4); c.rect(fx - 3, Y - 79, 7, 5, "k")
    c.line(x - 1, Y - 36, kx - 1, Y - 54, "Y")
  }
  // svatý Václav sedí na břiše: plášť, helmice, kopí přes rameno
  c.poly([X - 4, Y - 34, X + 10, Y - 34, X + 12, Y - 60, X - 6, Y - 60], "O"); c.poly([X - 8, Y - 36, X - 4, Y - 64, X + 2, Y - 64, X - 2, Y - 36], "Y")
  c.circ(X + 3, Y - 66, 5, "O"); c.poly([X - 2, Y - 68, X + 3, Y - 76, X + 8, Y - 68], "Y")
  c.line(X - 14, Y - 30, X + 26, Y - 90, "H", 2); c.poly([X + 24, Y - 90, X + 30, Y - 98, X + 28, Y - 88], "M")
  c.noise(X - 72, Y - 98, 140, 98, "Q", 0.03, 41, "O")
  // utržené lano, kterým visel
  c.line(X + 4, Y - 20, X + 30, Y - 4, "x"); c.line(X + 30, Y - 4, X + 50, Y - 2, "x")
})

// Kafkova hlava: lesklé ocelové plátky na sobě nakřivo a rozkutálené po zemi, v jednom kus oka a vousu.
sprite("kafka", { w: 130, h: 90 }, (c) => {
  const X = 65, Y = 84
  c.ellipse(X, Y - 2, 56, 6, "A")
  const slab = (x, y, rx, ry, h, k) => {
    c.ellipse(x, y, rx, ry, "M"); c.rect(x - rx, y - h, rx * 2 + 1, h, "m"); c.ellipse(x, y - h, rx, ry, "W")
    c.hline(x - rx + 2, y - h + 1, rx, "w"); c.vline(x - rx + 2 + k, y - h + 2, h - 2, "W")
  }
  // stoh tří plátků nakřivo
  slab(X - 10, Y - 6, 26, 7, 6, 3); slab(X - 4, Y - 14, 24, 6, 6, 8); slab(X - 12, Y - 22, 20, 6, 6, 5)
  // na horním plátku kus nosu a oka
  c.poly([X - 14, Y - 34, X - 8, Y - 34, X - 6, Y - 28, X - 16, Y - 28], "v"); c.hline(X - 22, Y - 31, 5, "k")
  // rozkutálené plátky
  slab(X + 34, Y - 4, 16, 5, 4, 2); slab(X + 46, Y - 18, 10, 4, 3, 4)
  c.ellipse(X - 46, Y - 6, 14, 4, "M"); c.ellipse(X - 46, Y - 9, 14, 4, "w"); c.line(X - 56, Y - 10, X - 40, Y - 7, "W")
  c.noise(X - 60, Y - 40, 120, 40, "U", 0.04, 51, "Mm")   // rez na hranách
})

// Šlapadlo labuť: bílý laminát oprýskaný, převrácené na bok, krk s hlavou ulomený a ležící vedle.
sprite("labut", { w: 96, h: 72 }, (c) => {
  const X = 48, Y = 66
  kuWet(c, X, Y - 4, 40, 7)
  // trup na boku: dno nahoru ke straně, vidět šlapací kola
  c.poly([X - 34, Y - 8, X - 30, Y - 30, X - 8, Y - 40, X + 26, Y - 34, X + 34, Y - 14, X + 22, Y - 6], "W")
  c.poly([X - 30, Y - 30, X - 8, Y - 40, X + 26, Y - 34, X + 10, Y - 30, X - 20, Y - 26], "w")
  c.noise(X - 34, Y - 40, 70, 34, "x", 0.04, 61, "Ww")
  c.circ(X + 2, Y - 22, 7, "x"); c.circ(X + 2, Y - 22, 4, "k"); for (let i = 0; i < 6; i++) c.line(X + 2, Y - 22, X + 2 + Math.round(Math.cos(i) * 7), Y - 22 + Math.round(Math.sin(i) * 7), "v")
  // pahýl krku, hlava se zobákem v bahně
  c.poly([X - 30, Y - 28, X - 38, Y - 36, X - 34, Y - 40, X - 26, Y - 32], "w"); c.line(X - 37, Y - 38, X - 35, Y - 34, "k")
  c.line(X + 36, Y - 6, X + 44, Y - 18, "W", 4); c.ellipse(X + 44, Y - 20, 5, 4, "W"); c.poly([X + 48, Y - 20, X + 54, Y - 18, X + 48, Y - 17], "o"); c.px(X + 44, Y - 21, "k")
})

// Vana s kaprem: smaltovaná vana na nožkách, oprýskaná na železo, nakloněná; z ní čouhá ocas obřího kapra.
sprite("kapr_vana", { w: 96, h: 64 }, (c) => {
  const X = 48, Y = 58
  c.ellipse(X, Y - 2, 40, 5, "A")
  c.poly([X - 36, Y - 30, X + 34, Y - 34, X + 30, Y - 8, X - 32, Y - 6], "w"); c.poly([X - 36, Y - 30, X + 34, Y - 34, X + 32, Y - 38, X - 34, Y - 34], "W")
  c.ellipse(X - 1, Y - 34, 30, 3, "k")
  c.noise(X - 36, Y - 36, 70, 30, "A", 0.03, 71, "w"); c.noise(X - 36, Y - 36, 70, 30, "U", 0.02, 72, "w")
  for (const x of [X - 28, X + 24]) { c.rect(x, Y - 8, 3, 6, "M"); c.circ(x + 1, Y - 2, 2, "M") }
  // kapr: šupinatý hřbet nad okrajem, ocas vysoko ven
  c.ellipse(X - 4, Y - 36, 22, 5, "Y"); for (let i = 0; i < 8; i++) c.px(X - 20 + i * 5, Y - 38 + (i % 2), "O")
  c.poly([X + 16, Y - 38, X + 30, Y - 56, X + 36, Y - 52, X + 26, Y - 40, X + 38, Y - 44, X + 34, Y - 36], "O")
  c.line(X + 18, Y - 38, X + 32, Y - 54, "Y"); c.px(X - 22, Y - 38, "k")
})

sheet("landmarks_kuriozity", ["mlok", "mlok_maly_*", "stalin_hlava", "metronom", "golem", "miminko", "kun_lucerna", "kafka", "labut", "kapr_vana"], { pad: 1 })
