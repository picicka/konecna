// Obrázky k filmečkům druhé půlky cesty, 640 × 360 (plátno 1280 × 720 je zobrazí 2×, dole 85 bodů zakryje titulek).
// Voda na Jindřišské, zatopený Staromák, suchý Karlův most, Nerudovka, nádvoří Hradu, epilog z loďky, čtečka v buňce.

// Perspektiva ulice: úběžník (vx, vy), ohnisko f; X napříč, Y dolů (0 = oko), z do hloubky.
const s2Cam = (vx, vy, f) => (X, Y, z) => [Math.round(vx + (X * f) / z), Math.round(vy + (Y * f) / z)]
// Čtyřúhelník ve stěně ulice (stálé X) mezi hloubkami z1–z2, horní hrana Y1, dolní Y2 (číslo nebo funkce hloubky)
const s2Quad = (c, P, X, Y1, Y2, z1, z2, col) => {
  const y1 = (z) => (typeof Y1 === "function" ? Y1(z) : Y1), y2 = (z) => (typeof Y2 === "function" ? Y2(z) : Y2)
  c.poly([...P(X, y1(z1), z1), ...P(X, y1(z2), z2), ...P(X, y2(z2), z2), ...P(X, y2(z1), z1)], col)
}
// Světlejší odstín omítky pro římsy a šambrány
const s2Lite = { e: "C", T: "t", R: "r", 2: "1", 3: "4", 9: "R", 6: "5", d: "8", O: "Y", P: "p", S: "s", s: "x", U: "u", H: "h" }
// Činžák ve stěně ulice: omítka, římsa, okna po patrech, mokrá čára u vody; lit = indexy rozsvícených oken
const s2House = (c, P, X, z1, z2, base, top, col, f, lit = [], wet = true) => {
  const b = typeof base === "function" ? base((z1 + z2) / 2) : base
  s2Quad(c, P, X, top, base, z1, z2, col)
  s2Quad(c, P, X, top, top + 0.7, z1, z2, s2Lite[col] || "q")
  s2Quad(c, P, X, top + 0.7, top + 1, z1, z2, "k")
  let n = 0
  for (let fl = 0; b - 1.2 - fl * 3.6 - 1.9 > top + 1.4; fl++) {
    const yb = b - 1.2 - fl * 3.6, yt = yb - 1.9
    for (let z = z1 + 1.1; z + 1.3 < z2 - 0.6; z += 3, n++) {
      if ((1.3 * f) / z < 1.6) continue
      s2Quad(c, P, X, yt - 0.35, yt - 0.1, z - 0.15, z + 1.45, s2Lite[col] || "q")
      s2Quad(c, P, X, yt, yb, z, z + 1.3, lit.includes(n) ? "f" : "N")
      if (!lit.includes(n) && (n * 7) % 5 === 0) s2Quad(c, P, X, yt + 0.2, yb - 0.2, z + 0.2, z + 1.1, "H")
      s2Quad(c, P, X, yb, yb + 0.2, z - 0.1, z + 1.4, "k")
    }
  }
  if (wet) { s2Quad(c, P, X, b - 0.9, b, z1, z2, "k"); s2Quad(c, P, X, b - 1.3, b - 0.9, z1, z2, "G") }
}
// Vlnky: krátké vodorovné čárky hustší dole
const s2Ripples = (c, y0, y1, keys, step = 7) => {
  for (let y = y0, i = 0; y < y1; y += Math.max(2, Math.round(((y - y0) / (y1 - y0)) * step)), i++)
    for (let x = (i * 37) % 53; x < 640; x += 40 + ((i * 13) % 30)) c.hline(x, y, 4 + Math.round(((y - y0) / (y1 - y0)) * 14) + (i % 3), keys[i % keys.length])
}
// Postava v záchranné vestě (stojí, pohled zpředu), výška ~h, x je střed, y nohy
const s2Vest = (c, x, y, s, cap) => {
  c.rect(x - 2 * s, y - 9 * s, 2 * s, 9 * s, "A"); c.rect(x, y - 9 * s, 2 * s, 9 * s, "a")
  c.rect(x - 4 * s, y - 19 * s, 8 * s, 10 * s, "o"); c.rect(x - 1 * s, y - 19 * s, 2 * s, 10 * s, "U"); c.rect(x - 4 * s, y - 14 * s, 8 * s, 1 * s, "W")
  c.rect(x - 6 * s, y - 18 * s, 2 * s, 7 * s, "b"); c.rect(x + 4 * s, y - 18 * s, 2 * s, 7 * s, "b")
  c.rect(x - 2 * s, y - 24 * s, 4 * s, 5 * s, "i"); c.rect(x - 2 * s, y - 20 * s, 4 * s, 1 * s, "x")
  if (cap) { c.rect(x - 3 * s, y - 27 * s, 6 * s, 3 * s, "W"); c.rect(x - 3 * s, y - 25 * s, 7 * s, 1 * s, "k"); c.rect(x - 1 * s, y - 26 * s, 2 * s, 1 * s, "y") }
  else c.rect(x - 2 * s, y - 25 * s, 4 * s, 2 * s, "K")
}
// Loďka z boku s lucernou: x levý konec, y hladina, délka l
const s2Boat = (c, x, y, l, lamp = true) => {
  c.poly([x, y - 6, x + l, y - 7, x + l - 6, y + 2, x + 6, y + 2], "H"); c.hline(x + 1, y - 6, l - 2, "h"); c.hline(x + 6, y + 1, l - 12, "k")
  if (lamp) { c.vline(x + l - 8, y - 16, 10, "k"); c.rect(x + l - 10, y - 19, 4, 4, "f") }
  c.hline(x + 4, y + 3, l - 8, "J")
}

// 1. Loďkou z Václaváku zatopenou Jindřišskou a Panskou ke Starému Městu za soumraku.
scene("cs_voda", { w: 640, h: 360 }, (c) => {
  const P = s2Cam(300, 150, 300), W = 1.5
  // obloha: noc nahoře, rezavý soumrak nad koncem ulice
  c.grad(0, 0, 640, 156, "NnSUuo", "v", 0.6)
  // na konci ulice Prašná brána: hranolová věž se strmou střechou a vížkami
  c.rect(286, 106, 26, 46, "k"); c.poly([284, 106, 299, 72, 314, 106], "k"); c.vline(299, 64, 8, "k")
  c.poly([284, 106, 287, 96, 290, 106], "k"); c.poly([308, 106, 311, 96, 314, 106], "k"); c.rect(260, 128, 76, 24, "N")
  // voda: hloubka, odraz soumraku ve středu ulice
  c.rect(0, 152, 640, 208, "X")
  c.recolor({ X: "Z" }, [288, 152, 312, 152, 520, 360, 80, 360], 0.35); c.recolor({ X: "Z" }, [294, 152, 306, 152, 400, 360, 200, 360]); c.recolor({ Z: "u" }, [294, 152, 306, 152, 324, 180, 276, 180], 0.2)
  // činžáky vlevo a vpravo: od nejvzdálenějších
  const L = [[160, 230, -18, "e"], [118, 160, -20, "T"], [88, 118, -17, "R"], [64, 88, -21, "2"], [44, 64, -18, "3"], [30, 44, -22, "e"], [19, 30, -19, "T"], [11, 19, -21, "9"], [3, 11, -18, "3"]]
  const R = [[150, 230, -19, "T"], [110, 150, -17, "d"], [80, 110, -21, "e"], [58, 80, -19, "6"], [40, 58, -17, "R"], [26, 40, -21, "2"], [16, 26, -18, "e"], [9, 16, -20, "T"], [3, 9, -19, "6"]]
  L.forEach(([z1, z2, top, col], i) => s2House(c, P, -11, z1, z2, W, top, col, 300, i === 3 ? [4] : []))
  R.forEach(([z1, z2, top, col], i) => s2House(c, P, 11, z1, z2, W, top, col, 300, i === 6 ? [7] : []))
  // odrazy fasád ve vodě: tmavé zrcadlo pod každou stěnou
  for (const [X, list] of [[-11, L], [11, R]]) for (const [z1, z2] of list) s2Quad(c, P, X, W, W + 3.5, z1, z2, "N")
  s2Ripples(c, 156, 360, ["Z", "J", "X", "Z"])
  // tramvajové trolejové vedení napříč ulicí, jeden sloup trčí šikmo z vody
  for (const z of [14, 34, 70]) { const a = P(-11, -6, z), b = P(11, -6, z); c.line(a[0], a[1], b[0], b[1], "k") }
  { const a = P(-11, -6.3, 14), b = P(11, -6.3, 70); c.line(a[0], a[1], b[0], b[1], "k") }
  c.line(206, 252, 222, 92, "k", 4); c.line(222, 96, 262, 100, "k", 2); c.line(262, 100, 268, 170, "x"); c.rect(203, 250, 8, 3, "J")
  c.line(207, 240, 216, 150, "U")
  // plovoucí bordel: sud, pneumatika, prkno, kanystr
  c.rect(130, 222, 16, 10, "u"); c.hline(130, 225, 16, "U"); c.hline(130, 229, 16, "U"); c.hline(128, 233, 20, "J")
  c.ellipse(560, 244, 13, 4, "k"); c.ellipse(560, 244, 6, 2, "X"); c.hline(546, 249, 28, "J")
  c.poly([360, 205, 402, 202, 403, 205, 361, 208], "h"); c.hline(360, 209, 44, "J")
  c.rect(250, 196, 7, 6, "V"); c.hline(248, 203, 11, "Z")
  // loďka Kuřačky: motorový člun bokem, příď vlevo k úběžníku
  c.poly([336, 214, 540, 206, 528, 238, 366, 242], "H"); c.poly([336, 214, 540, 206, 540, 212, 342, 220], "h")
  c.hline(368, 241, 158, "k"); c.poly([336, 214, 352, 214, 372, 242, 364, 242], "U"); c.line(400, 230, 476, 228, "U")
  for (let x = 382; x < 520; x += 24) c.vline(x, 218 - Math.round(((x - 336) * 8) / 204), 20, "3")
  // přívěsný motor s kormidlem
  c.rect(524, 186, 22, 22, "S"); c.rect(527, 189, 16, 6, "M"); c.rect(533, 208, 5, 32, "s")
  // brázda: rozbíhavé pěnové čáry za člunem
  c.line(540, 238, 640, 262, "J", 2); c.line(532, 242, 640, 316, "J"); c.line(366, 244, 220, 270, "J"); c.line(420, 244, 300, 300, "Z")
  for (const [x, y] of [[548, 236], [562, 241], [576, 236], [556, 247], [590, 244]]) c.hline(x, y, 6, "w")
  // Kuřačka: sedí u motoru, oranžová vesta s reflexními pruhy, ruka s cigaretou u pusy, kouř stoupá
  c.rect(446, 202, 26, 7, "A"); c.rect(444, 202, 6, 14, "A"); c.rect(441, 214, 9, 3, "k")
  c.rect(468, 178, 26, 30, "o"); c.rect(479, 178, 4, 30, "U"); c.hline(468, 190, 26, "W"); c.hline(468, 198, 26, "W")
  c.rect(473, 160, 15, 17, "i"); c.rect(471, 156, 19, 7, "K"); c.rect(486, 160, 6, 16, "K"); c.rect(490, 172, 4, 8, "K"); c.px(476, 166, "k"); c.hline(474, 172, 3, "x")
  c.rect(462, 180, 7, 14, "b"); c.line(465, 192, 467, 174, "b", 4); c.rect(465, 168, 5, 5, "i"); c.hline(460, 170, 6, "W"); c.px(459, 170, "F")
  c.rect(494, 186, 22, 5, "b"); c.rect(514, 184, 5, 6, "i"); c.line(516, 188, 528, 196, "k", 2)
  c.line(459, 168, 454, 156, "v"); c.line(454, 156, 460, 144, "x"); c.line(460, 144, 452, 130, "x"); c.line(452, 130, 456, 118, "x")
}, glow("fF", { r: 10, strength: 0.6 }))

// 2. Zatopený Staromák: Týn v pozadí, Husův pomník jako ostrov s Admirálem, loďky, věž radnice s orlojem u hladiny.
scene("cs_staromak", { w: 640, h: 360 }, (c) => {
  c.grad(0, 0, 640, 200, "NnnS", "v", 0.6)
  // Týnský chrám: dvě věže s jehlancem a čtyřmi vížkami, mezi nimi strmá střecha lodi
  c.poly([420, 120, 450, 40, 480, 120], "N")
  for (const [x, w, top] of [[396, 26, 70], [470, 30, 62]]) {
    c.rect(x, top, w, 150, "k")
    c.poly([x - 2, top, x + w / 2, top - 58, x + w + 2, top], "k")
    for (const dx of [-3, w / 2 - 3, w - 3]) c.poly([x + dx, top + 2, x + dx + 3, top - 18, x + dx + 6, top + 2], "k")
    c.rect(x + w / 2 - 2, top + 20, 4, 10, "n"); c.rect(x + w / 2 - 2, top + 40, 4, 10, "n")
  }
  c.px(483, 90, "f")
  // domy na protější straně náměstí a Týnská škola s arkádou u vody, štíty
  const fr = [[0, 34, 140, "3"], [150, 40, 140, "e"], [190, 34, 132, "T"], [224, 40, 146, "R"], [264, 46, 138, "2"], [310, 50, 150, "6"], [360, 70, 128, "e"], [430, 60, 144, "T"], [490, 46, 136, "R"], [536, 48, 130, "3"], [584, 56, 142, "e"]]
  for (const [x, w, top, col] of fr) {
    c.rect(x, top, w, 212 - top, col); c.poly([x, top, x + w / 2, top - 22, x + w, top], col); c.hline(x, top, w, s2Lite[col])
    for (let wy = top + 10; wy < 196; wy += 16) for (let wx = x + 5; wx < x + w - 6; wx += 10) c.rect(wx, wy, 5, 8, "N")
    c.rect(x + w / 2 - 2, top - 14, 4, 6, "N")
  }
  c.rect(372, 176, 6, 8, "f"); c.rect(546, 160, 5, 8, "f")
  // voda
  c.rect(0, 206, 640, 154, "X"); c.hline(0, 206, 640, "k"); c.dither(0, 207, 640, 30, "X", "Z", 0.3)
  s2Ripples(c, 210, 360, ["Z", "J", "X"], 9)
  for (const [x, w] of [[372, 6], [546, 5]]) for (let y = 212; y < 250; y += 4) c.hline(x - 1, y, w + 2, "u")
  // Staroměstská radnice: věž vlevo s ochozem, střecha s vížkami; nároží s orlojem u hladiny
  c.rect(30, 30, 64, 230, "x"); c.rect(30, 30, 10, 230, "v"); c.rect(84, 30, 10, 230, "P")
  c.poly([28, 32, 62, -10, 96, 32], "k"); for (const dx of [26, 56, 88]) c.poly([dx, 32, dx + 4, 6, dx + 8, 32], "k")
  c.rect(24, 30, 76, 6, "P"); for (let x = 26; x < 98; x += 6) c.rect(x, 26, 2, 4, "P")
  for (let y = 60; y < 240; y += 40) { c.poly([54, y + 16, 54, y, 62, y - 6, 70, y, 70, y + 16], "N") }
  c.rect(94, 110, 80, 150, "e"); c.rect(94, 110, 80, 6, "C"); c.poly([94, 110, 134, 84, 174, 110], "D")
  c.poly([150, 116, 166, 116, 166, 150, 158, 158, 150, 150], "P"); c.rect(154, 124, 8, 18, "N")
  // orloj: zlatý prstenec, modrý ciferník, zvěrokruh, ručička; kalendářní deska napůl pod vodou
  c.rect(100, 146, 48, 62, "P"); c.poly([100, 146, 124, 128, 148, 146], "P")
  c.circ(124, 176, 20, "y"); c.circ(124, 176, 18, "b"); c.circ(124, 182, 10, "N"); c.ring(124, 170, 9, "y"); c.circ(124, 176, 3, "y")
  c.line(124, 176, 136, 164, "y"); c.line(124, 176, 116, 162, "f"); c.rect(110, 136, 28, 6, "N"); c.rect(112, 137, 3, 4, "i"); c.rect(133, 137, 3, 4, "i")
  c.rect(30, 246, 144, 120, "X"); c.circ(124, 254, 14, "Y"); c.circ(124, 254, 11, "O"); c.rect(104, 252, 44, 30, "X"); c.hline(104, 252, 44, "J")
  // odrazy radnice
  for (let y = 256; y < 330; y += 3) { c.hline(30 + (y % 5), y, 60, "Z"); c.hline(100 + (y % 7), y, 50, y % 2 ? "N" : "Z") }
  // Husův pomník: žulový ostrov, skála uprostřed s Husem v dlouhém plášti, po stranách skupiny postav
  c.poly([226, 254, 250, 236, 404, 234, 432, 252], "P"); c.poly([226, 254, 432, 252, 422, 262, 236, 262], "9"); c.hline(238, 263, 182, "J")
  c.poly([306, 238, 316, 204, 324, 196, 338, 196, 346, 206, 356, 238], "Q"); c.line(316, 204, 306, 238, "j")
  const fig = (x, y, h, lean = 0) => {
    const r = Math.max(2, Math.round(h / 9)), s = Math.round(h / 5)
    c.poly([x - s + lean, y - h + 2 * r, x + s + lean, y - h + 2 * r, x + s + 2, y, x - s - 2, y], "Q")
    c.line(x - s + lean, y - h + 2 * r, x - s - 2, y, "j"); c.line(x + s + lean, y - h + 2 * r, x + s + 2, y, "k"); c.circ(x + lean, y - h + r, r, "Q"); c.px(x + lean - r + 1, y - h + r - 1, "j")
  }
  for (const [x, y, h, l] of [[258, 240, 22, 2], [270, 240, 32, 1], [284, 238, 28, -2], [296, 226, 24, 3], [306, 214, 20, 0]]) fig(x, y, h, l)
  for (const [x, y, h, l] of [[402, 240, 22, -2], [390, 240, 34, -1], [376, 238, 28, 2], [364, 226, 26, -3], [354, 214, 18, 0]]) fig(x, y, h, l)
  c.poly([318, 196, 324, 150, 338, 150, 344, 196], "j"); c.poly([331, 150, 338, 150, 344, 196, 333, 196], "Q"); c.line(344, 196, 338, 150, "k"); c.circ(331, 142, 6, "j"); c.circ(333, 143, 4, "Q")
  c.poly([326, 156, 338, 156, 336, 166, 328, 166], "j"); c.line(331, 166, 333, 192, "k")
  // Admirál: vesta a kapitánská čepice, stojí na přední hraně ostrova a ukazuje rukou
  s2Vest(c, 246, 252, 1, true); c.rect(252, 234, 7, 2, "b"); c.rect(259, 232, 2, 3, "i")
  // loďky kolem s lucernami a jejich odrazy
  s2Boat(c, 176, 284, 56); s2Boat(c, 446, 266, 44); s2Boat(c, 520, 296, 70)
  s2Vest(c, 196, 278, 0.8); s2Vest(c, 548, 289, 1)
  for (const [x, y] of [[222, 268], [482, 250], [582, 280]]) for (let k = 0; k < 6; k++) c.hline(x - 1 + (k % 2), y + 22 + k * 4, 4, "u")
}, glow("f", { r: 9, strength: 0.6 }))

// 3. Karlův most nad suchým bahnitým korytem: oblouky v popraskaném bahně, louže, rezavá loďka, prázdné podstavce
//    s cenovkami, za ním Hrad s několika rozsvícenými okny.
scene("cs_most", { w: 640, h: 360 }, (c) => {
  c.grad(0, 0, 640, 200, "NNnS", "v", 0.6)
  c.noise(0, 0, 640, 110, "x", 0.008, 7)
  // Hradčany na kopci: dlouhá hmota hradu, katedrála s věží a dvěma západními věžemi, svítí pár oken
  c.poly([0, 150, 0, 92, 120, 86, 300, 82, 420, 100, 520, 140, 640, 150], "N")
  c.rect(60, 64, 300, 30, "k"); c.rect(160, 40, 120, 26, "k"); c.poly([156, 42, 220, 22, 284, 42], "k")
  c.rect(186, 8, 10, 34, "k"); c.poly([184, 10, 191, -8, 198, 10], "k"); c.rect(256, 14, 8, 28, "k"); c.rect(270, 14, 8, 28, "k")
  c.poly([254, 14, 260, -2, 266, 14], "k"); c.poly([268, 14, 274, -2, 280, 14], "k")
  c.rect(208, 22, 22, 22, "k"); c.circ(219, 22, 8, "k"); c.vline(219, 6, 8, "k")
  for (let x = 70; x < 350; x += 14) c.rect(x, 74, 3, 4, "n")
  for (const [x, y] of [[98, 74], [154, 74], [238, 52], [322, 74], [140, 82]]) c.rect(x, y, 3, 4, "f")
  // Malostranské střechy pod Hradem
  for (let x = 0; x < 460; x += 22) c.poly([x, 150, x, 112 + ((x * 7) % 16), x + 11, 104 + ((x * 7) % 16), x + 22, 112 + ((x * 7) % 16), x + 22, 150], "k")
  // protější nábřeží Starého Města: zeď a tmavé domy, vidět skrz oblouky
  c.rect(0, 172, 640, 36, "N"); for (let x = 0; x < 640; x += 26) c.poly([x, 180, x, 164 + ((x * 11) % 12), x + 11, 156 + ((x * 11) % 12), x + 22, 164 + ((x * 11) % 12), x + 22, 180], "k")
  c.rect(0, 196, 640, 10, "n"); c.hline(0, 196, 640, "x"); c.rect(330, 184, 2, 3, "f")
  // bahno: suchá hnědá pláň, u oka tmavší
  c.grad(0, 206, 640, 154, "3hhH", "v", 0.5)
  c.noise(0, 206, 640, 154, "4K", 0.015, 11)
  // praskliny: klikaté trhliny, u oka delší, s nadzvednutou světlejší hranou
  let sd = 7; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647
  for (let i = 0; i < 170; i++) {
    let x = rnd() * 640, y = 208 + Math.pow(rnd(), 0.8) * 152
    for (let k = 0; k < 5; k++) {
      const sc = (y - 196) / 160, nx = x + (rnd() * 2 - 1) * 46 * sc, ny = y + (rnd() * 2 - 1) * 9 * sc
      if (sc > 0.55) c.line(Math.round(x), Math.round(y) + 1, Math.round(nx), Math.round(ny) + 1, "4")
      c.line(Math.round(x), Math.round(y), Math.round(nx), Math.round(ny), "K")
      x = nx; y = ny
    }
  }
  // louže s odrazem nebe a rozsvíceného okna
  for (const [x, y, rx, ry] of [[96, 262, 34, 5], [300, 236, 22, 3], [540, 254, 40, 6], [210, 300, 50, 7]]) { c.ellipse(x, y, rx, ry, "X"); c.ellipse(x - rx / 3, y - 1, rx / 2, 1, "Z") }
  c.rect(96, 260, 2, 3, "f")
  // most: mostovka z pískovcových kvádrů, římsa, zábradlí
  c.rect(0, 120, 640, 28, "P"); c.rect(0, 116, 640, 6, "p"); c.hline(0, 116, 640, "q"); c.hline(0, 147, 640, "9")
  for (let r = 0; r < 3; r++) for (let x = (r % 2) * 9; x < 640; x += 18) c.vline(x, 123 + r * 8, 7, "9")
  c.hline(0, 130, 640, "9"); c.hline(0, 138, 640, "9")
  // oblouky: cviklíky kolem segmentových oblouků, prstenec klenáků
  const arc = (cx, rx, ry, base, n = 18) => Array.from({ length: n + 1 }, (_, t) => { const x = cx + rx - (t * 2 * rx) / n; return [Math.round(x), Math.round(base - ry * Math.sqrt(Math.max(0, 1 - ((x - cx) / rx) ** 2)))] })
  for (let i = -1; i < 5; i++) {
    const x0 = 50 + i * 120, cx = x0 + 45
    c.poly([x0, 148, x0 + 90, 148, ...arc(cx, 45, 62, 222).flat(), x0, 222], "P")
    const o = arc(cx, 49, 67, 222), n = arc(cx, 45, 62, 222)
    for (let t = 0; t < o.length - 1; t++) { c.line(o[t][0], o[t][1], o[t + 1][0], o[t + 1][1], "9"); if (t % 2) c.line(o[t][0], o[t][1], n[t][0], n[t][1], "9") }
    for (let t = 0; t < n.length - 1; t++) c.line(n[t][0], n[t][1], n[t + 1][0], n[t + 1][1], "p")
    c.ellipse(cx, 224, 40, 3, "K")
  }
  // pilíře s ledolamy, patky zabořené v bahně
  for (let i = -1; i < 6; i++) {
    const x = 20 + i * 120
    c.rect(x, 148, 30, 74, "P"); c.rect(x, 148, 5, 74, "p"); for (let y = 156; y < 220; y += 9) c.hline(x, y, 30, "9")
    c.poly([x - 3, 226, x + 15, 172, x + 33, 226], "9"); c.poly([x + 15, 172, x + 33, 226, x + 15, 226], "P"); c.line(x + 15, 172, x + 15, 226, "p")
    c.rect(x - 6, 222, 42, 6, "9"); c.hline(x - 6, 222, 42, "P"); c.ellipse(x + 15, 229, 26, 2, "K")
  }
  // Staroměstská mostecká věž vpravo
  c.rect(560, 34, 74, 112, "P"); c.rect(560, 34, 8, 112, "p"); c.poly([556, 36, 597, -4, 638, 36], "k")
  for (const dx of [556, 590, 626]) c.poly([dx, 38, dx + 4, 16, dx + 8, 38], "k")
  c.poly([580, 146, 580, 104, 597, 90, 614, 104, 614, 146], "N"); c.rect(572, 50, 50, 4, "9"); c.rect(586, 62, 22, 18, "9")
  // podstavce soch na zábradlí: prázdné, na každém visí cenovka; jedna socha zbyla
  for (let x = 30; x < 556; x += 60) {
    c.rect(x, 96, 14, 20, "p"); c.rect(x - 2, 94, 18, 3, "q"); c.rect(x, 112, 14, 4, "P")
    if (x === 270) { c.poly([x + 2, 94, x + 4, 70, x + 7, 64, x + 10, 70, x + 12, 94], "k"); c.vline(x + 7, 52, 14, "k"); c.hline(x + 3, 56, 9, "k"); continue }
    c.line(x + 7, 94, x + 12, 100, "w"); c.rect(x + 10, 100, 6, 4, "W"); c.px(x + 11, 101, "k"); c.px(x + 13, 102, "k")
  }
  // mrtvé lampy na mostě
  for (let x = 60; x < 556; x += 120) { c.vline(x, 88, 28, "k"); c.rect(x - 2, 84, 5, 5, "k") }
  // rezavá loďka na boku v bahně
  c.poly([386, 232, 496, 222, 506, 236, 490, 254, 404, 258], "U"); c.poly([386, 232, 496, 222, 500, 228, 392, 238], "u")
  c.poly([400, 240, 480, 234, 470, 250, 410, 252], "H"); c.rect(430, 244, 8, 5, "k"); c.rect(458, 240, 6, 4, "k")
  for (let x = 400; x < 490; x += 9) c.vline(x, 238 - ((x - 386) * 10) / 110, 6, "U")
  c.ellipse(446, 260, 62, 4, "K")
  // nákupní vozík a pneumatika v bahně
  c.box(140, 230, 18, 10, "m"); c.line(140, 230, 136, 226, "m"); c.ellipse(310, 278, 12, 4, "k"); c.ellipse(310, 278, 5, 2, "H")
}, glow("f", { r: 7, strength: 0.6 }))

// 4. Nerudovka v noci do kopce k hradní bráně: stráž v modrém u brány, zlatý Trabant na lidských nohách v ulici.
scene("cs_malastrana", { w: 640, h: 360 }, (c) => {
  const P = s2Cam(320, 250, 300), G = (z) => 1.6 - 0.28 * z, ZG = 26
  const gx = (X) => P(X, 0, ZG)[0], gy = (Y) => P(0, Y, ZG)[1], g0 = gy(G(ZG))
  c.grad(0, 0, 640, 250, "NNnS", "v", 0.6); c.noise(0, 0, 640, 120, "x", 0.008, 3)
  // Hrad nad branou: věže katedrály, dlouhá fasáda s rozsvícenými okny (na Hradě se svítí)
  c.rect(300, 8, 9, 50, "k"); c.poly([298, 10, 304, -12, 311, 10], "k"); c.rect(326, 20, 8, 40, "k"); c.rect(340, 20, 8, 40, "k")
  c.poly([324, 20, 330, 2, 336, 20], "k"); c.poly([338, 20, 344, 2, 350, 20], "k"); c.rect(220, 52, 200, 10, "k")
  c.rect(226, 58, 188, 50, "P"); c.hline(226, 58, 188, "p"); c.hline(226, 82, 188, "p")
  for (let x = 232; x < 410; x += 12) { c.rect(x, 64, 5, 10, (x * 3) % 7 === 2 ? "f" : "N"); c.rect(x, 88, 5, 10, (x * 5) % 9 === 1 ? "f" : "N") }
  // brána: pilíře s Giganty, tmavý průjezd s pohledem do nádvoří, budky stráže s pruhy trikolóry
  c.rect(gx(-6), gy(G(ZG) - 7), gx(6) - gx(-6), g0 - gy(G(ZG) - 7), "p"); c.rect(gx(-6), gy(G(ZG) - 7), gx(6) - gx(-6), 4, "q")
  c.poly([gx(-1.6), g0, gx(-1.6), gy(G(ZG) - 4), gx(0), gy(G(ZG) - 5.2), gx(1.6), gy(G(ZG) - 4), gx(1.6), g0], "k")
  c.rect(gx(-1.2), gy(G(ZG) - 2.4), gx(1.2) - gx(-1.2), g0 - gy(G(ZG) - 2.4), "u"); c.rect(gx(-0.4), gy(G(ZG) - 2), 6, 8, "f")
  for (const X of [-4.6, 3.6]) { const x = gx(X), w = gx(X + 1) - x, t = gy(G(ZG) - 7); c.rect(x - 2, t - 4, w + 4, 4, "q"); c.poly([x + 1, t - 4, x + 2, t - 20, x + w / 2, t - 26, x + w - 2, t - 20, x + w - 1, t - 4], "k"); c.circ(x + w / 2, t - 29, 4, "k"); c.line(x + w - 2, t - 22, x + w + 6, t - 34, "k", 2) }
  for (const X of [-4.2, 3.0]) {
    const x = gx(X), w = gx(X + 1.2) - x, t = gy(G(ZG) - 2.6)
    c.rect(x, t, w, g0 - t, "w"); c.poly([x - 1, t, x + w / 2, t - 7, x + w + 1, t], "V")
    for (let y = t + 2; y < g0 - 2; y += 7) { c.line(x, y + 4, x + w - 1, y, "V"); c.line(x, y + 6, x + w - 1, y + 2, "b") }
  }
  c.rect(gx(-5.6), gy(G(ZG) - 6.2), 4, 5, "f"); c.rect(gx(5.2), gy(G(ZG) - 6.2), 4, 5, "f")
  // dva strážní v modré slavnostní uniformě, bílý řemen, puška k noze
  for (const X of [-2.6, 2.2]) {
    const x = gx(X), y = g0
    c.rect(x - 3, y - 9, 3, 9, "b"); c.rect(x + 1, y - 9, 3, 9, "b"); c.hline(x - 3, y - 1, 7, "k"); c.vline(x + 1, y - 9, 8, "V")
    c.rect(x - 4, y - 20, 9, 11, "b"); c.hline(x - 4, y - 11, 9, "W"); c.line(x - 4, y - 20, x + 3, y - 11, "W"); c.rect(x - 5, y - 19, 2, 9, "b"); c.rect(x + 5, y - 19, 2, 9, "b")
    c.rect(x - 1, y - 24, 4, 4, "i"); c.rect(x - 2, y - 28, 6, 4, "b"); c.hline(x - 3, y - 25, 8, "k"); c.hline(x - 2, y - 27, 6, "y"); c.vline(x + 7, y - 31, 30, "k"); c.px(x + 7, y - 32, "m")
  }
  // dlažba ulice do kopce: kočičí hlavy v řadách
  c.poly([...P(-6, G(2), 2), ...P(-6, G(ZG), ZG), ...P(6, G(ZG), ZG), ...P(6, G(2), 2)], "a")
  for (let z = 3; z < ZG; z += z < 10 ? 0.5 : 1) { const a = P(-6, G(z), z), b = P(6, G(z), z); c.line(a[0], a[1], b[0], b[1], "A") }
  for (let X = -5.25; X < 6; X += 0.75) { const a = P(X, G(2), 2), b = P(X, G(ZG), ZG); c.line(a[0], a[1], b[0], b[1], "A") }
  c.noise(0, 180, 640, 180, "B", 0.03, 5, "a")
  // domy po obou stranách, schodovitě do kopce: přízemí s vraty, vývěsní znamení na konzolách
  const L = [[19, ZG, -15, "e"], [14, 19, -14, "3"], [9, 14, -16, "s"], [5, 9, -14, "U"], [1.5, 5, -15, "9"]]
  const R = [[20, ZG, -14, "T"], [15, 20, -16, "3"], [10, 15, -14, "R"], [6, 10, -15, "S"], [1.5, 6, -16, "9"]]
  for (const [X, list] of [[-6, L], [6, R]]) list.forEach(([z1, z2, h, col], i) => {
    const b = G(z2)
    s2House(c, P, X, z1, z2, (z) => G(z), b + h, col, 300, i === 1 && X > 0 ? [2] : i === 3 && X < 0 ? [5] : [], false)
    s2Quad(c, P, X, (z) => G(z) - 0.5, (z) => G(z), z1, z2, "k")
    s2Quad(c, P, X, (z) => G(z) - 3, (z) => G(z), z1 + 0.6, z1 + 2, "H"); s2Quad(c, P, X, (z) => G(z) - 3, (z) => G(z) - 2.8, z1 + 0.6, z1 + 2, "k")
    const [sx, sy] = P(X, b - 4.6, z1 + 2.6), [ex] = P(X * 0.8, b - 4.6, z1 + 2.6), s = Math.max(4, Math.round(80 / z1)), l = Math.min(sx, ex) + (X > 0 ? 0 : Math.abs(ex - sx) - s)
    c.line(sx, sy, ex, sy, "k"); c.rect(l, sy + 1, s, s, "O"); c.circ(l + s / 2, sy + 1 + s / 2, Math.max(1, Math.round(s / 4)), "y")
  })
  // zlatý Trabant na lidských nohách kráčí přes ulici: stehna, kolena, lýtka, boty
  const tb = P(0, G(10), 10)[1], tx = 284
  for (const [hx, kx, fx, dark] of [[tx + 10, tx + 2, tx - 10, 1], [tx + 22, tx + 34, tx + 30, 0], [tx + 66, tx + 58, tx + 48, 1], [tx + 80, tx + 94, tx + 90, 0]]) {
    const k = dark ? "O" : "Y"
    c.line(hx, tb - 40, kx, tb - 22, k, 6); c.line(kx, tb - 22, fx, tb - 4, k, 4); c.poly([fx - 3, tb - 5, fx + 3, tb - 5, fx + 8, tb, fx - 3, tb], dark ? "Y" : "O")
  }
  c.poly([tx - 8, tb - 38, tx - 8, tb - 50, tx + 14, tb - 54, tx + 26, tb - 72, tx + 66, tb - 72, tx + 80, tb - 54, tx + 102, tb - 52, tx + 102, tb - 38], "Y")
  c.poly([tx - 8, tb - 50, tx + 14, tb - 54, tx + 26, tb - 72, tx + 66, tb - 72, tx + 66, tb - 68, tx + 30, tb - 68, tx + 18, tb - 51, tx - 8, tb - 47], "y")
  c.poly([tx + 30, tb - 68, tx + 46, tb - 68, tx + 46, tb - 55, tx + 21, tb - 55], "N"); c.poly([tx + 50, tb - 68, tx + 64, tb - 68, tx + 76, tb - 55, tx + 50, tb - 55], "N")
  c.hline(tx - 8, tb - 44, 110, "O"); c.rect(tx + 98, tb - 50, 4, 4, "W"); c.rect(tx - 8, tb - 48, 3, 3, "V"); c.vline(tx + 48, tb - 54, 14, "O"); c.line(tx + 22, tb - 60, tx + 28, tb - 66, "O")
  c.rect(tx + 34, tb - 44, 30, 6, "W"); c.text(tx + 37, tb - 43, "CD 7", "k")
  c.ellipse(tx + 44, tb + 1, 60, 3, "A")
}, glow("f", { r: 8, strength: 0.6 }))

// 5. Třetí nádvoří Hradu v noci pod pracovními světly: průčelí svatého Víta, buňka s cedulí metra E, agregát, dva v reflexních vestách.
scene("cs_hrad", { w: 640, h: 360 }, (c) => {
  c.rect(0, 0, 640, 360, "N"); c.noise(0, 0, 640, 60, "x", 0.01, 9)
  // katedrála: dvě západní věže s jehlami, štít s rozetou, portály, fiály
  for (const x of [80, 300]) {
    c.rect(x, 40, 90, 220, "s"); c.rect(x, 40, 10, 220, "S"); c.rect(x + 80, 40, 10, 220, "S")
    c.poly([x + 6, 40, x + 45, -40, x + 84, 40], "S"); for (const dx of [0, 80]) c.poly([x + dx, 40, x + dx + 5, 8, x + dx + 10, 40], "S")
    for (let y = 60; y < 240; y += 54) { c.poly([x + 30, y + 40, x + 30, y + 8, x + 45, y - 4, x + 60, y + 8, x + 60, y + 40], "N"); c.vline(x + 45, y, 40, "S") }
  }
  c.rect(170, 70, 130, 190, "s"); c.poly([170, 70, 235, 18, 300, 70], "S"); c.poly([226, 40, 235, 30, 244, 40, 244, 54, 226, 54], "N")
  c.circ(235, 110, 30, "S"); c.circ(235, 110, 26, "n"); for (let a = 0; a < 12; a++) c.line(235, 110, 235 + Math.round(Math.cos((a * Math.PI) / 6) * 26), 110 + Math.round(Math.sin((a * Math.PI) / 6) * 26), "S"); c.circ(235, 110, 6, "S")
  for (const [x, w] of [[106, 38], [210, 50], [326, 38]]) { c.poly([x, 260, x, 200, x + w / 2, 170, x + w, 200, x + w, 260], "S"); c.poly([x + 5, 260, x + 5, 204, x + w / 2, 180, x + w - 5, 204, x + w - 5, 260], "k") }
  for (let x = 172; x < 300; x += 16) c.poly([x, 160, x + 4, 146, x + 8, 160], "S")
  // dlažba nádvoří
  c.rect(0, 258, 640, 102, "A"); c.hline(0, 258, 640, "k")
  for (let r = 0, y = 262; y < 360; r++, y += 4 + r * 2) { c.hline(0, y, 640, "k"); for (let x = (r % 2) * (6 + r * 3); x < 640; x += 12 + r * 6) c.vline(x, y, 4 + r * 2, "k") }
  // světlo reflektorů: kužel na průčelí a louže na dlažbě (vrstva light)
  // buňka: plechový kontejner, žebrování, dveře, rozsvícené okno, cedule metra s E
  c.rect(440, 170, 180, 92, "s"); for (let x = 444; x < 620; x += 6) c.vline(x, 172, 88, "S"); c.rect(436, 164, 188, 8, "M"); c.rect(436, 258, 188, 6, "k")
  c.rect(456, 196, 32, 62, "M"); c.rect(458, 198, 28, 58, "S"); c.rect(482, 226, 3, 4, "y")
  c.rect(510, 196, 48, 28, "k"); c.rect(512, 198, 44, 24, "f"); c.vline(534, 198, 24, "y")
  c.rect(570, 184, 22, 22, "k"); c.poly([573, 187, 589, 187, 589, 191, 586, 191, 586, 196, 581, 203, 576, 196, 576, 191, 573, 191], "W"); c.poly([578, 190, 581, 196, 584, 190], "k")
  c.rect(594, 184, 22, 22, "W"); c.text(601, 190, "E", "k", { scale: 2 })
  for (let y = 210; y < 256; y += 9) c.line(560, y, 566, y + 9, "U")
  // agregát: žlutá skříň s mřížkou, výfuk s kouřem, kabely po dlažbě
  c.rect(366, 226, 60, 34, "Y"); c.rect(366, 226, 60, 4, "y"); c.rect(372, 236, 24, 16, "k"); for (let y = 238; y < 252; y += 3) c.hline(373, y, 22, "O"); c.rect(404, 236, 14, 8, "S"); c.px(408, 239, "E")
  c.rect(416, 214, 4, 12, "M"); c.line(418, 210, 410, 196, "x"); c.line(410, 196, 420, 180, "v")
  c.line(366, 256, 290, 266, "k"); c.line(290, 266, 268, 236, "k"); c.line(426, 258, 456, 262, "k")
  // reflektor na stativu a druhý na střeše buňky
  c.line(268, 238, 256, 262, "k"); c.line(268, 238, 280, 262, "k"); c.vline(268, 196, 42, "k"); c.rect(256, 186, 26, 14, "S"); c.rect(258, 188, 22, 10, "f"); c.rect(262, 190, 14, 6, "W")
  c.rect(452, 150, 20, 12, "S"); c.rect(454, 152, 16, 8, "f"); c.rect(457, 154, 10, 4, "W"); c.vline(462, 160, 4, "k")
  // dva chlapi v reflexních vestách a přilbách
  for (const [x, cap] of [[318, "W"], [342, "y"]]) {
    c.rect(x - 4, 236, 4, 22, "A"); c.rect(x + 1, 236, 4, 22, "a"); c.rect(x - 6, 212, 12, 26, "o"); c.hline(x - 6, 222, 12, "W"); c.hline(x - 6, 230, 12, "W"); c.vline(x, 212, 26, "U")
    c.rect(x - 9, 214, 3, 18, "b"); c.rect(x + 6, 214, 3, 18, "b"); c.rect(x - 3, 202, 7, 10, "i"); c.rect(x - 5, 198, 11, 5, cap); c.hline(x - 6, 202, 13, cap)
  }
}, layer("svetlo", { light: true, density: 0.5 }, poly([268, 192, 60, 0, 420, 0], "W"), ellipse(276, 290, 130, 36, "W"), poly([462, 156, 380, 0, 560, 0], "W")),
   layer("svetlo2", { light: true }, poly([268, 192, 140, 40, 330, 30], "W"), ellipse(276, 280, 70, 18, "W")),
   glow("f", { r: 14, strength: 0.7 }), glow("W", { where: [250, 180, 230, 30], r: 6, strength: 0.4 }))

// 6. Epilog: loďka na novém korytě za svítání, zlomený Nuselák v pozadí, Vyšehradská skála s věžemi a světla loděk pod ní.
scene("cs_vysehrad", { w: 640, h: 360 }, (c) => {
  c.grad(0, 0, 640, 204, "nNbxuo", "v", 0.6)
  c.circ(250, 204, 18, "f"); c.circ(250, 204, 14, "F")
  // Nuselák: dlouhý betonový nosník na lichoběžníkových pilířích, uprostřed zlomený, jedna půle visí do vody
  c.rect(0, 112, 176, 12, "v"); c.hline(0, 112, 176, "w"); c.hline(0, 123, 176, "x")
  c.poly([176, 112, 186, 116, 180, 126, 176, 124], "v")
  c.poly([226, 150, 236, 136, 410, 114, 410, 126, 240, 148, 232, 162], "v"); c.line(236, 136, 410, 114, "w")
  for (const x of [30, 110, 300]) { const top = x === 300 ? 128 : 124; c.poly([x - 8, top, x + 8, top, x + 4, 204, x - 4, 204], "x") }
  c.line(176, 124, 190, 140, "x"); c.line(186, 120, 196, 132, "x"); c.line(226, 150, 218, 162, "x"); c.line(232, 156, 222, 170, "x")
  // Vyšehradská skála: útes, hradby, bazilika svatého Petra a Pavla se dvěma prolamovanými věžemi
  c.poly([380, 204, 400, 150, 420, 126, 640, 116, 640, 204], "N"); c.poly([400, 150, 420, 126, 440, 132, 430, 204, 380, 204], "n")
  for (let x = 420; x < 640; x += 18) c.line(x, 132, x - 6 + ((x * 7) % 9), 204, "k")
  c.rect(420, 110, 220, 18, "k"); for (let x = 420; x < 640; x += 10) c.rect(x, 106, 6, 4, "k")
  c.rect(500, 70, 90, 42, "k"); c.poly([496, 72, 545, 48, 594, 72], "k")
  for (const x of [484, 590]) { c.rect(x, 30, 16, 82, "k"); c.poly([x - 1, 32, x + 8, -14, x + 17, 32], "k"); c.rect(x + 6, 40, 4, 10, "n") }
  c.rect(560, 120, 4, 4, "f")
  // světla loděk pod skálou a jejich odrazy
  for (const [x, y] of [[412, 200], [436, 202], [470, 199], [498, 203], [530, 200], [566, 202], [600, 199], [624, 203]]) { c.rect(x, y - 3, 3, 3, "f"); c.hline(x - 3, y, 9, "k"); for (let k = 1; k < 5; k++) c.hline(x - 1 + (k % 2), y + 2 + k * 4, 4, "u") }
  // voda: tmavá, svítání se odráží pruhem pod sluncem
  c.rect(0, 204, 640, 156, "X"); c.hline(0, 204, 640, "Z")
  for (let y = 208, i = 0; y < 360; y += 3 + (i >> 2), i++) c.hline(250 - 10 - i - ((i * 7) % 9), y, 20 + i * 2 + ((i * 5) % 11), i % 4 ? "u" : "o")
  for (const [x, y, w] of [[0, 140, 180], [230, 150, 180]]) for (let k = 0; k < 8; k++) c.hline(x + ((k * 13) % 20), 214 + k * 5, w - ((k * 17) % 40), "Z")
  s2Ripples(c, 210, 360, ["Z", "J", "X"], 10)
  // naše loďka: silueta s Kuřačkou u motoru (žhavá cigareta) a hrdinkou na přídi
  c.poly([70, 244, 236, 236, 222, 260, 96, 262], "k"); c.poly([70, 244, 236, 236, 236, 240, 74, 248], "H")
  c.rect(222, 222, 14, 16, "k"); c.vline(232, 236, 30, "k")
  c.rect(190, 214, 16, 24, "k"); c.rect(193, 204, 10, 10, "k"); c.px(188, 210, "F"); c.line(188, 208, 184, 196, "x"); c.line(184, 196, 190, 184, "x")
  c.poly([106, 242, 126, 242, 123, 212, 109, 212], "k"); c.circ(116, 204, 6, "k"); c.circ(121, 199, 3, "k"); c.line(110, 215, 94, 207, "k", 3)
  c.rect(122, 216, 11, 13, "k"); c.line(110, 212, 128, 226, "x"); c.rect(124, 219, 7, 3, "o")
  c.hline(80, 264, 150, "J"); c.line(236, 252, 360, 274, "J"); c.line(222, 260, 330, 300, "Z")
}, glow("fF", { r: 10, strength: 0.6 }))

// 6b. Vyhlídka Na Opyši v noci: dole hradní zídka a střechy Malé Strany, suché koryto s Karlovým mostem, nové koryto
// Vltavy přes Staré Město, Týn, vlevo na obzoru ležící Žižkovská věž, vpravo zlomený Nuselák s lanem přes mezeru
// (na Pankrác se chodí po laně) a pod ním Vyšehrad s ohni loďkařů.
scene("cs_opys", { w: 640, h: 360 }, (c) => {
  c.rect(0, 0, 640, 360, "N")
  c.grad(0, 0, 640, 170, "Nnb", "v", 0.5)
  c.noise(0, 0, 640, 120, "W", 0.01, 7)
  // obzor: Žižkov vlevo, pláň Pankráce vpravo
  c.poly([0, 150, 90, 136, 200, 142, 260, 150, 260, 170, 0, 170], "n")
  c.poly([360, 150, 420, 144, 640, 140, 640, 176, 360, 176], "n")
  c.line(70, 112, 140, 146, "k", 5); c.rect(132, 140, 16, 8, "k"); c.rect(84, 120, 10, 6, "k")
  // Nuselák: betonový nosník na lichoběžníkových pilířích přes údolí, uprostřed zlomený; konce visí dolů, přes mezeru lano
  c.poly([300, 176, 640, 176, 640, 196, 300, 196], "N")
  c.rect(330, 146, 132, 5, "v"); c.hline(330, 146, 132, "w"); c.hline(330, 150, 132, "x")
  c.poly([462, 146, 474, 152, 470, 158, 462, 151], "v")
  c.poly([508, 160, 516, 150, 640, 146, 640, 151, 518, 155, 512, 166], "v"); c.line(516, 150, 640, 146, "w")
  for (const x of [348, 396, 444, 560, 612]) c.poly([x - 6, 151, x + 6, 151, x + 3, 196, x - 3, 196], "x")
  c.line(462, 151, 470, 166, "x"); c.line(508, 160, 502, 172, "x"); c.line(512, 164, 506, 178, "x")
  for (let x = 468; x <= 512; x += 2) { const t = (x - 468) / 44; c.px(x, Math.round(152 + Math.sin(t * Math.PI) * 9 + t * 4), "w") }
  // Vyšehrad pod koncem mostu: skála, hradby, dvě věže baziliky, ohně loďkařů dole
  c.poly([540, 196, 556, 172, 600, 166, 640, 168, 640, 196], "k")
  c.rect(588, 140, 6, 28, "k"); c.poly([587, 142, 591, 124, 595, 142], "k"); c.rect(606, 140, 6, 28, "k"); c.poly([605, 142, 609, 124, 613, 142], "k")
  for (const x of [548, 566, 584, 604, 626]) { c.rect(x, 192, 2, 2, "f"); c.px(x, 195, "F") }
  // Staré Město: střechy a věže, Týn se dvěma věžemi, nové koryto Vltavy mezi domy
  c.rect(0, 176, 300, 30, "N")
  for (let x = 0; x < 640; x += 22) c.rect(x, 188 + ((x * 11) % 14), 18, 30, "k")
  for (const x of [196, 214]) { c.rect(x, 150, 8, 40, "k"); c.poly([x - 2, 152, x + 4, 128, x + 10, 152], "k"); c.px(x + 4, 140, "n") }
  c.rect(140, 162, 12, 30, "k"); c.poly([138, 164, 146, 146, 154, 164], "k")
  c.poly([0, 214, 120, 206, 260, 212, 400, 204, 520, 200, 640, 198, 640, 206, 520, 208, 400, 214, 260, 222, 120, 216, 0, 222], "X")
  for (let i = 0; i < 18; i++) c.hline(20 + i * 34 + ((i * 7) % 11), 207 + ((i * 5) % 9), 6 + (i % 4) * 2, i % 3 ? "Z" : "J")
  // suché koryto: hnědý pás bahna, přes něj Karlův most na obloucích, pod nimi tma
  c.rect(0, 226, 640, 30, "H"); c.noise(0, 226, 640, 30, "K", 0.25, 9); for (let x = 0; x < 640; x += 46) c.hline(x + ((x * 3) % 17), 236 + ((x * 7) % 14), 18, "h")
  c.rect(80, 228, 460, 6, "x"); c.hline(80, 227, 460, "v")
  for (let k = 0; k < 9; k++) { const x0 = 84 + k * 51; c.rect(x0, 234, 8, 22, "x"); c.poly([x0 + 8, 256, x0 + 8, 240, x0 + 18, 234, x0 + 33, 234, x0 + 43, 240, x0 + 43, 256], "N") }
  c.rect(60, 210, 20, 46, "k"); c.poly([58, 212, 70, 194, 82, 212], "k"); c.rect(540, 214, 16, 42, "k"); c.poly([538, 216, 548, 200, 558, 216], "k")
  for (let x = 96; x < 540; x += 34) c.rect(x, 222, 3, 6, "k")
  // Malá Strana: tmavé střechy pod Hradem, kupole svatého Mikuláše
  c.rect(0, 256, 640, 60, "k")
  for (let x = 0; x < 640; x += 30) c.poly([x, 270 - ((x * 7) % 12), x + 15, 256 - ((x * 7) % 12), x + 30, 270 - ((x * 7) % 12), x + 30, 300, x, 300], (x / 30) % 2 ? "N" : "k")
  c.circ(400, 252, 16, "k"); c.rect(396, 222, 8, 16, "k"); c.rect(430, 236, 10, 30, "k"); c.poly([428, 238, 435, 214, 442, 238], "k")
  // hradní zídka vpředu, světlo z Hradu na ní, lavička, na zídce plechový hrnek
  c.rect(0, 316, 640, 44, "P"); c.hline(0, 316, 640, "q"); c.hline(0, 317, 640, "p"); c.hline(0, 322, 640, "k")
  for (let y = 330; y < 360; y += 10) for (let x = ((y / 10) % 2) * 18; x < 640; x += 36) c.vline(x, y - 8, 8, "3")
  c.rect(460, 300, 70, 6, "H"); c.rect(464, 306, 4, 12, "H"); c.rect(522, 306, 4, 12, "H"); c.hline(460, 300, 70, "h")
  c.rect(120, 308, 8, 9, "x"); c.hline(120, 308, 8, "w"); c.rect(128, 310, 3, 4, "x")
}, layer("hrad", { light: true, density: 0.4 }, ellipse(320, 360, 420, 60, "o")), glow("fF", { r: 10, strength: 0.7 }), glow("J", { r: 3, strength: 0.3 }))

// 6c. Nusle: zatopené údolí Botiče za šera, nad ním Nuselský most zlomený uprostřed, oba konce visí k vodě, přes
// mezeru lano. Vpravo na kopci Palác kultury a vysoký hotel Forum s hořícími okny, vlevo Karlov s kopulí. Na vodě
// lachtani a z hladiny čouhají střechy nuselských domů, na troskách racci; vpředu příď loďky.
scene("cs_nusle", { w: 640, h: 360 }, (c) => {
  c.rect(0, 0, 640, 360, "N")
  c.grad(0, 0, 640, 190, "nNbxu", "v", 0.55)
  c.noise(0, 0, 640, 90, "W", 0.008, 17)
  // svahy údolí: vlevo Karlov, vpravo Pankrác
  c.poly([0, 120, 70, 112, 150, 130, 190, 200, 0, 200], "n"); c.poly([450, 200, 500, 120, 560, 104, 640, 100, 640, 200], "n")
  c.rect(40, 92, 18, 26, "k"); c.poly([36, 94, 49, 76, 62, 94], "k"); c.rect(46, 70, 6, 8, "k"); c.rect(70, 104, 50, 16, "k")
  // Palác kultury: nízký dlouhý blok, Forum: vysoká deska s okny, pár hoří
  c.rect(480, 80, 130, 34, "k"); c.rect(500, 70, 70, 12, "k"); for (let x = 484; x < 606; x += 6) c.vline(x, 84, 26, "n")
  c.rect(600, 10, 34, 94, "k"); for (let y = 14; y < 100; y += 4) for (let x = 603; x < 632; x += 4) if ((x * 7 + y * 3) % 11 === 0) c.px(x, y, "f"); else if ((x + y) % 3 === 0) c.px(x, y, "n")
  c.rect(604, 4, 26, 6, "k")
  // most: nosník na pilířích, uprostřed zlom; severní konec visí dolů, z jižního trčí souprava metra
  c.rect(0, 92, 260, 10, "v"); c.hline(0, 92, 260, "w"); c.hline(0, 101, 260, "x")
  c.poly([260, 92, 268, 96, 290, 176, 278, 180, 256, 102], "v"); c.line(262, 98, 284, 172, "x")
  c.rect(360, 88, 280, 10, "v"); c.hline(360, 88, 280, "w"); c.hline(360, 97, 280, "x")
  c.poly([340, 100, 364, 92, 364, 100, 346, 108], "V"); c.rect(342, 99, 6, 3, "W"); c.px(343, 103, "f")
  for (const x of [70, 190, 450, 570]) c.poly([x - 9, x < 300 ? 102 : 98, x + 9, x < 300 ? 102 : 98, x + 5, 200, x - 5, 200], "x")
  for (let x = 266; x <= 360; x += 2) { const t = (x - 266) / 94; c.px(x, Math.round(96 + Math.sin(t * Math.PI) * 16 - t * 6), "w") }
  // voda: tmavé jezero, odlesky, střechy domů čouhají nad hladinu
  c.rect(0, 200, 640, 160, "X"); c.hline(0, 200, 640, "Z")
  for (let i = 0; i < 40; i++) c.hline((i * 97) % 620, 206 + (i * 13) % 150, 8 + (i % 5) * 4, i % 3 ? "Z" : "J")
  for (const [x, w] of [[30, 60], [120, 46], [400, 70], [520, 50]]) { c.poly([x, 214, x + w / 2, 196, x + w, 214], "D"); c.line(x, 214, x + w / 2, 196, "d"); c.rect(x + w / 2 + 8, 192, 5, 10, "R"); c.hline(x - 4, 215, w + 8, "J") }
  // lachtani: hlava a hřbet nad vodou
  for (const [x, y] of [[220, 236], [300, 262], [470, 244]]) { c.ellipse(x, y, 12, 4, "H"); c.circ(x + 10, y - 6, 4, "H"); c.px(x + 12, y - 7, "k"); c.hline(x - 14, y + 4, 30, "J") }
  // racci na střeše a ve vzduchu
  for (const [x, y] of [[148, 192], [430, 194]]) { c.rect(x, y, 4, 3, "W"); c.px(x + 4, y, "o") }
  for (const [x, y] of [[300, 60], [330, 48], [180, 70]]) { c.line(x - 5, y + 2, x, y, "W"); c.line(x, y, x + 5, y + 2, "W") }
  // příď loďky vpředu, lucerna
  c.poly([180, 360, 230, 300, 300, 290, 360, 300, 420, 360], "k"); c.poly([230, 300, 300, 290, 360, 300, 350, 306, 240, 306], "H")
  c.rect(296, 270, 3, 22, "M"); c.rect(292, 262, 11, 9, "U"); c.rect(295, 264, 5, 5, "f")
}, glow("fF", { r: 10, strength: 0.7 }), glow("J", { r: 3, strength: 0.3 }))

// 7. Detail v buňce: čtečka s malou CRT obrazovkou a zelenými řádky, kabelem k ní připojený záznamník štítu.
scene("cs_ctecka", { w: 640, h: 360 }, (c) => {
  // stěna buňky: plech se žebry, nástěnka s papíry
  c.rect(0, 0, 640, 236, "N"); for (let x = 0; x < 640; x += 16) { c.vline(x, 0, 236, "n"); c.vline(x + 1, 0, 236, "n") }
  c.rect(420, 30, 120, 80, "H"); c.rect(426, 36, 40, 52, "x"); c.rect(474, 40, 56, 34, "v"); c.rect(436, 92, 30, 14, "w")
  for (let y = 44; y < 84; y += 6) c.hline(430, y, 30, "A"); for (let y = 48; y < 70; y += 5) c.hline(478, y, 46, "a"); c.px(446, 37, "7"); c.px(502, 41, "7")
  // stůl: dřevěná deska s léty
  c.rect(0, 236, 640, 124, "H"); c.hline(0, 236, 640, "h"); c.hline(0, 237, 640, "h")
  for (let i = 0; i < 12; i++) c.hline((i * 97) % 500, 244 + i * 9, 80 + ((i * 53) % 140), "K")
  // čtečka: hranatá skříň, šikmé čelo, CRT, knoflíky a vypínače
  c.rect(110, 90, 260, 150, "x"); c.rect(110, 90, 260, 6, "v"); c.rect(110, 234, 260, 6, "A"); c.rect(364, 96, 6, 138, "P")
  c.rect(128, 104, 168, 118, "a"); c.rect(134, 110, 156, 106, "k"); c.rect(138, 114, 148, 98, "N")
  const lines = ["ZAZNAMNIK STITU", "TBM 04  KANAL", "", "SEKTOR 7  -32 M", "TLAK  ODCHYLKA", "POKYN: ZASTAVIT", "PODPIS KANCELAR", "> _"]
  lines.forEach((t, i) => c.text(144, 120 + i * 11, t, i === 7 ? "I" : "E"))
  c.rect(144, 197, 4, 6, "I")
  for (const [y, k] of [[116, "7"], [150, "E"]]) { c.circ(330, y + 6, 9, "A"); c.circ(330, y + 6, 6, "M"); c.line(330, y + 6, 334, y + 1, "k"); c.px(350, y, k) }
  for (let x = 312; x < 356; x += 11) { c.rect(x, 186, 6, 14, "A"); c.rect(x + 1, 187, 4, 6, "m") }
  c.rect(312, 210, 40, 8, "A"); c.text(314, 211, "NAP", "w")
  c.rect(128, 226, 24, 4, "A"); c.text(160, 226, "CTECKA K2", "A")
  // kabel z boku čtečky k záznamníku, smyčka po stole
  c.line(370, 210, 392, 250, "k", 5); c.line(392, 250, 430, 262, "k", 5); c.line(430, 262, 470, 250, "k", 5); c.line(470, 250, 486, 230, "k", 5)
  c.rect(364, 206, 8, 8, "M")
  // záznamník: černá krabička v perspektivě, žlutočerné šrafy, štítek, zelená kontrolka
  c.poly([450, 196, 590, 190, 610, 200, 470, 208], "a"); c.poly([470, 208, 610, 200, 610, 240, 470, 250], "A"); c.poly([450, 196, 470, 208, 470, 250, 450, 236], "k")
  for (let x = 480; x < 600; x += 10) c.poly([x, 242, x + 5, 242, x + 9, 236, x + 4, 236], "y")
  c.poly([500, 214, 570, 210, 570, 226, 500, 230], "w"); c.text(504, 216, "TBM 04", "k")
  c.rect(588, 210, 4, 4, "E"); c.rect(482, 228, 8, 6, "M")
  c.ellipse(530, 252, 74, 4, "K")
  // hrnek a nedopalek
  c.rect(40, 206, 34, 40, "x"); c.rect(40, 206, 34, 4, "v"); c.ellipse(57, 207, 16, 3, "k"); c.box(74, 216, 10, 16, "x"); c.hline(30, 248, 54, "K")
  c.rect(594, 280, 14, 3, "W"); c.px(608, 281, "F")
}, glow("E", { r: 22, strength: 0.45 }), glow("I", { r: 6, strength: 0.5 }))
