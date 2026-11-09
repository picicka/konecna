// Lidé B: postavy z Karlova mostu, Staromáku a Malé Strany nakreslené sadou lide.px.js (stání + portrét).
// Detaily, které sada nemá (dalekohled, klíč, pila, síťka…), kreslí pomocníci lib*. Kreslí se do snímku před obrysem,
// takže mají černý lem jako zbytek postavy. Vzhled podle pole look v scripts/postavy-seznam.mjs.

// Geometrie postavy stejně jako v lidPerson (stání, ruce volně): hlava, ramena, boky, ruce.
function libGeo(o, f) {
  const D = lidDims(o)
  const H = o.height || 46
  const breathe = f === 1 || f === 2 ? 1 : 0
  const hy = 64 - H + (o.age === "old" ? 1 : 0) - breathe
  const hipY = 64 - H + Math.round(H * 0.5)
  const fx = 12 - D.sw - 1
  return {
    D, cx: 12, hx: 8, hy, sy: hy + 9, hipY, kneeY: Math.round((hipY + 63) / 2),
    hand: [fx, hipY + 2], back: [12 + D.sw - 1, hipY + 2], fx, f,
  }
}
// Stání jako lidIdle (dech v 1. a 2. snímku, mrknutí ve 3.), navíc back(c, g) za postavou a front(c, g) před ní.
function libIdle(name, o, back, front, ex = {}) {
  for (let f = 0; f < 4; f++) sprite(`_${name}_${f}`, { w: 24, h: 64, outline: "k" }, (c) => {
    const g = libGeo(o, f)
    if (back) back(c, g)
    lidPerson(c, o, { breathe: f === 1 || f === 2, blink: f === 3 })
    if (front) front(c, g)
  })
  return anim(name, { w: 26, h: 66, fps: ex.fps || 3, frames: 4 }, (c) => c.stamp(`_${name}_${c.frame}`, 0, 0))
}
// Přebarvení klíčů v obdélníku (mokré rukávy, olej, prach).
function libRecolor(c, x0, y0, w, h, map) {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
    for (const k in map) if (c.is(x, y, k)) { c.px(x, y, map[k]); break }
  }
}
// Řídký prach jen na zadaných klíčích, deterministický.
function libDust(c, x0, y0, w, h, on, col, density, salt = 0) {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
    const r = ((x * 73856093) ^ (y * 19349663) ^ (salt * 83492791)) >>> 0
    if (c.is(x, y, on) && (r % 1000) / 1000 < density) c.px(x, y, col)
  }
}

// —— Admirál: kapitán převozu ——
const LIB_ADMIRAL = {
  build: "stout", height: 48, age: "old", skin: "normal",
  hair: { style: "short", col: "white" }, beard: "full",
  hat: { kind: "captain" },
  top: { kind: "jacket", col: "navy", long: true },
  over: { kind: "lifevest", col: "orange" },
  legs: { kind: "trousers", col: "navy" },
  shoes: { kind: "boots", col: "dark" },
}
// víčko od piva: střed a zoubkovaný okraj
const libCap = (c, x, y, k) => { c.px(x, y, k); c.px(x + 1, y, "W") }
libIdle("admiral", LIB_ADMIRAL, null, (c, g) => {
  const { cx, sy, hipY, hy, hand: [hx, hy2] } = g
  // vyznamenání z víček na vestě, na stužkách
  c.px(cx - 4, sy + 3, "V"); c.px(cx - 3, sy + 3, "b"); libCap(c, cx - 4, sy + 4, "y")
  c.px(cx + 1, sy + 3, "j"); c.px(cx + 2, sy + 3, "V"); libCap(c, cx + 1, sy + 4, "m")
  libCap(c, cx + 3, sy + 5, "V")
  // kotva na čepici místo odznaku
  c.px(10, hy - 1, "O"); c.px(10, hy - 2, "y")
  // dalekohled v přední ruce: mosazný tubus šikmo dolů dopředu
  c.line(hx - 4, hy2 + 7, hx + 1, hy2 + 1, "Y"); c.line(hx - 3, hy2 + 7, hx + 2, hy2 + 1, "O")
  c.line(hx - 4, hy2 + 6, hx - 1, hy2 + 3, "y")
  c.rect(hx - 5, hy2 + 7, 2, 2, "O"); c.px(hx - 5, hy2 + 7, "y")
  c.rect(hx, hy2, 2, 2, "i"); c.px(hx, hy2, "0")
})
sprite("face_admiral", { w: 56, h: 56, outline: "k" }, (c) => {
  lidFace(c, LIB_ADMIRAL)
  // kotva na čepici
  c.rect(23, 9, 4, 4, "W"); c.vline(24, 9, 4, "O"); c.hline(23, 10, 3, "O"); c.px(23, 12, "O"); c.px(25, 12, "O")
  // víčka na vestě: stužka + zoubkované kolečko
  const cap = (x, y, rib, k) => { c.rect(x, y, 4, 2, rib); c.circ(x + 2, y + 4, 2, k); c.px(x + 1, y + 3, "W"); c.px(x + 3, y + 5, "O") }
  cap(8, 44, "V", "y"); cap(13, 46, "b", "m"); cap(36, 45, "j", "y")
  // dalekohled přes rameno
  c.line(36, 56, 52, 44, "Y", 3); c.line(37, 55, 52, 45, "y"); c.rect(50, 42, 4, 5, "O")
})

// —— Orlojník: drobný stařík, natahuje orloj ——
const LIB_ORLOJNIK = {
  build: "thin", height: 43, age: "old", skin: "pale",
  hair: { style: "bald", col: "grey" }, beard: "moustache",
  top: { kind: "coat", col: "khaki" }, shirtCol: "grey",
  legs: { kind: "trousers", col: "ash" },
  shoes: { kind: "shoes", col: "leather" },
}
libIdle("orlojnik", LIB_ORLOJNIK, (c, g) => {
  // velký klíč přes přední rameno: hřídel ze spodu ruky šikmo za hlavu, nahoře kříž s okem
  const { cx, sy, hipY } = g
  c.line(cx - 6, hipY + 4, cx + 6, sy - 10, "M"); c.line(cx - 5, hipY + 4, cx + 7, sy - 10, "m")
  c.ring(cx + 7, sy - 12, 2, "M"); c.px(cx + 6, sy - 13, "m"); c.px(cx + 5, sy - 12, "m")
  c.rect(cx - 7, hipY + 4, 3, 3, "M"); c.px(cx - 7, hipY + 4, "m")
}, (c, g) => {
  const { hx, hy, fx, hipY, hand: [x, y], D } = g
  // lupa na čele: mosazná obruba se sklem
  c.px(hx + 1, hy + 1, "Y"); c.px(hx + 2, hy + 1, "Y"); c.px(hx + 1, hy + 2, "l"); c.px(hx, hy + 1, "O")
  c.hline(hx + 3, hy + 1, 3, "H")
  // mokré rukávy po lokty, kapka pod rukou
  libRecolor(c, fx - 1, hipY - 6, D.aw + 3, 8, { C: "e", c: "C" })
  libRecolor(c, 12 + D.sw - 2, hipY - 6, D.aw + 3, 8, { e: "4" })
  c.px(x, y + 3, "J")
  // ruka drží klíč
  c.rect(x - 1, y - 1, 2, 2, "8")
})
sprite("face_orlojnik", { w: 56, h: 56, outline: "k" }, (c) => {
  lidFace(c, LIB_ORLOJNIK)
  // lupa na čele na pásku
  c.hline(14, 14, 26, "H"); c.hline(14, 15, 26, "3")
  c.circ(22, 13, 5, "Y"); c.circ(22, 13, 3, "L"); c.px(21, 11, "l"); c.px(20, 12, "W"); c.px(25, 16, "O"); c.px(26, 15, "O")
  // klíč přes rameno
  c.line(36, 56, 52, 30, "M", 3); c.line(37, 55, 52, 31, "m")
  c.ring(52, 27, 3, "M"); c.px(51, 25, "m")
})

// —— Potápěčka: hledá ve vodě pod mostem ——
const LIB_POTAPECKA = {
  build: "thin", height: 45, female: true, age: "young", skin: "tan",
  hair: { style: "short", col: "black" },
  top: { kind: "neoprene", col: "dark" },
  shoes: { kind: "boots", col: "ash" },
}
libIdle("potapecka", LIB_POTAPECKA, (c, g) => {
  // síťka s nálezy v zadní ruce (za tělem)
  const [x, y] = g.back
  c.vline(x + 1, y, 3, "C")
  c.poly([x - 1, y + 3, x + 4, y + 3, x + 5, y + 9, x + 2, y + 12, x - 1, y + 9], "e")
  c.px(x, y + 5, "m"); c.px(x + 1, y + 5, "M"); c.px(x + 3, y + 6, "Q"); c.px(x + 3, y + 7, "j"); c.px(x + 1, y + 8, "y")
  for (let i = 0; i < 4; i++) c.px(x + (i % 2) * 2, y + 4 + i * 2, "C")
}, (c, g) => {
  const { cx, sy, hx, hy, hand: [x, y] } = g
  // znak metra namalovaný bílou na hrudi (šipka s M) a žlutý čtvereček linky
  c.px(cx - 3, sy + 3, "W"); c.px(cx - 1, sy + 3, "W"); c.px(cx - 2, sy + 4, "W"); c.px(cx - 3, sy + 4, "w"); c.px(cx - 1, sy + 4, "w"); c.px(cx - 2, sy + 5, "W")
  c.px(cx + 1, sy + 3, "y")
  // potápěčské brýle na čele
  c.hline(hx, hy, 7, "A"); c.px(hx + 1, hy, "l"); c.px(hx + 3, hy, "l"); c.px(hx + 2, hy, "L"); c.px(hx + 4, hy, "L")
  // svítilna v přední ruce, svítí dolů
  c.rect(x, y + 1, 2, 5, "M"); c.px(x, y + 1, "m"); c.hline(x - 1, y + 6, 3, "m"); c.px(x, y + 7, "f"); c.px(x - 1, y + 7, "W")
  // mokrá hladina neoprenu
  c.px(cx - 4, sy + 8, "a")
})
sprite("face_potapecka", { w: 56, h: 56, outline: "k" }, (c) => {
  lidFace(c, LIB_POTAPECKA)
  // brýle posazené na čele, pásek kolem hlavy
  c.rect(14, 8, 29, 3, "A")
  c.rect(15, 5, 11, 7, "a"); c.rect(16, 6, 9, 5, "L"); c.rect(28, 5, 11, 7, "a"); c.rect(29, 6, 9, 5, "L")
  c.px(17, 7, "l"); c.px(18, 7, "W"); c.px(30, 7, "l"); c.px(31, 7, "W"); c.hline(26, 8, 2, "A")
  // znak metra na hrudi: bílá šipka s M na černém čtverci, vedle žlutý čtverec B
  c.rect(11, 44, 11, 11, "k")
  c.vline(12, 45, 5, "W"); c.vline(20, 45, 5, "W"); c.line(12, 45, 16, 49, "W"); c.line(20, 45, 16, 49, "W")
  c.line(12, 50, 16, 54, "W"); c.line(20, 50, 16, 54, "W")
  c.rect(23, 44, 5, 5, "y"); c.vline(25, 45, 3, "k")
  // kapky na tváři
  c.px(17, 33, "l"); c.px(32, 20, "l")
})

// —— Lovec značek: hledá ve vodě značkové zboží ——
const LIB_LOVEC = {
  build: "thin", height: 48, skin: "pale",
  hair: { style: "short", col: "black" }, beard: "stubble",
  top: { kind: "coat", col: { d: "U", m: "o", l: "c" }, long: true },
  legs: { kind: "trousers", col: "dark" },
  shoes: { kind: "shoes", col: "leather" },
  items: ["hook", "sunglasses"],
}
libIdle("lovec", LIB_LOVEC, null, (c, g) => {
  const { cx, sy, hipY, kneeY } = g
  // rozepnutý kožich: holá hruď a břicho s žebry
  c.poly([cx - 2, sy, cx + 1, sy, cx + 1, hipY - 1, cx - 1, hipY - 1], "8")
  c.vline(cx + 1, sy + 1, hipY - sy - 2, "4"); c.px(cx - 1, sy + 4, "4"); c.px(cx - 1, sy + 6, "4")
  // mokrá kožešina: chomáče a stékající pruhy
  for (let y = sy + 3; y < kneeY + 4; y += 3) { c.px(cx - 4 + (y % 2), y, "U"); c.px(cx + 3, y + 1, "c") }
  c.vline(cx + 4, hipY + 2, 5, "U")
  // cenovky na provázku kolem krku
  c.px(cx - 2, sy + 1, "C"); c.px(cx, sy + 2, "C"); c.rect(cx - 2, sy + 3, 2, 2, "W"); c.px(cx + 1, sy + 3, "W"); c.px(cx - 1, sy + 4, "V")
})
sprite("face_lovec", { w: 56, h: 56, outline: "k" }, (c) => {
  lidFace(c, LIB_LOVEC)
  // holá hruď v rozevřeném kožichu
  c.poly([18, 40, 34, 40, 30, 56, 21, 56], "8"); c.vline(29, 42, 14, "4"); c.line(22, 48, 26, 49, "4")
  // kožešinový límec, mokré chomáče
  c.poly([3, 56, 6, 43, 18, 39, 24, 56], "o"); c.poly([34, 39, 46, 42, 51, 56, 30, 56], "U")
  for (let i = 0; i < 9; i++) { c.line(5 + i * 2, 44 + (i % 3), 6 + i * 2, 49 + (i % 3), i % 2 ? "c" : "U") }
  for (let i = 0; i < 6; i++) c.line(36 + i * 2, 44, 37 + i * 2, 50 + (i % 2) * 3, i % 2 ? "o" : "H")
  // cenovky na provázku
  c.line(20, 40, 24, 47, "C"); c.line(32, 40, 28, 47, "C")
  c.poly([22, 47, 27, 46, 28, 52, 23, 53], "W"); c.px(24, 49, "V"); c.hline(24, 51, 3, "x")
  c.poly([28, 47, 32, 48, 31, 53, 27, 52], "w"); c.px(29, 50, "x")
  // hák na tyči vedle hlavy
  c.vline(50, 6, 50, "h"); c.vline(51, 6, 50, "H"); c.hline(46, 5, 6, "M"); c.vline(46, 5, 4, "M"); c.px(47, 9, "M")
})

// —— Kuřák s pilou: řeže sochy z mostu ——
const LIB_PILAR = {
  build: "normal", height: 47, skin: "tan",
  hair: { style: "bald", col: "dark" }, beard: "stubble",
  top: { kind: "vest", col: "grey" }, shirtCol: "white",
  over: { kind: "lifevest", col: "yellow" },
  legs: { kind: "trousers", col: "olive" },
  shoes: { kind: "boots", col: "leather" },
  items: ["cigarette"],
}
libIdle("pilar", LIB_PILAR, null, (c, g) => {
  const { cx, sy, hipY, hx, hy, hand: [x, y], D } = g
  // svaly: světlé biceps a ramena
  c.px(cx - D.sw - 1, sy + 3, "i"); c.px(cx - D.sw - 1, sy + 4, "i"); c.px(cx - D.sw, sy + 1, "i")
  // kus sochy na zadním rameni: hlava světce s kusem svatozáře
  c.ellipse(cx + 5, sy - 3, 3, 3, "5"); c.px(cx + 4, sy - 4, "W"); c.px(cx + 3, sy - 3, "6"); c.px(cx + 4, sy - 2, "6")
  c.vline(cx + 8, sy - 4, 4, "6"); c.hline(cx + 3, sy - 7, 4, "Y")
  // motorová pila v přední ruce: tělo a lišta s řetězem šikmo dolů
  c.rect(x - 2, y, 5, 4, "y"); c.hline(x - 2, y, 5, "W"); c.vline(x + 2, y, 4, "Y"); c.rect(x - 1, y + 1, 2, 2, "A")
  c.line(x - 1, y + 4, x - 5, y + 13, "m"); c.line(x, y + 4, x - 4, y + 13, "M")
  for (let i = 0; i < 9; i += 2) c.px(x - 2 - Math.floor(i / 2), y + 5 + i, "A")
  // ochranné brýle posunuté na čelo
  c.hline(hx, hy, 7, "A"); c.px(hx + 1, hy, "l"); c.px(hx + 2, hy, "L"); c.px(hx + 4, hy, "L")
  // kamenný prach: na ramenou, vestě a nohavicích
  libDust(c, 0, sy - 6, 24, 64 - sy + 6, "iu4GgOYUhxv", "w", 0.06, 3)
})
sprite("face_pilar", { w: 56, h: 56, outline: "k" }, (c) => {
  lidFace(c, LIB_PILAR)
  // ochranné brýle posunuté na čelo
  c.rect(12, 8, 32, 3, "A"); c.rect(14, 5, 24, 7, "M"); c.rect(15, 6, 22, 5, "L"); c.px(16, 7, "W"); c.hline(17, 7, 3, "l")
  // tílko: ramínka a holé paže
  c.poly([2, 56, 6, 45, 12, 42, 14, 56], "i"); c.line(6, 45, 4, 56, "0"); c.poly([42, 42, 48, 45, 53, 56, 44, 56], "4")
  c.rect(15, 40, 3, 4, "w"); c.rect(37, 40, 3, 4, "v")
  // kamenný prach: šedý poprašek na hlavě a ramenou, hustší dole
  libDust(c, 0, 0, 56, 38, "4u3", "x", 0.08, 7)
  libDust(c, 0, 38, 56, 18, "i4yYOu", "w", 0.1, 7)
})

// —— Fantova neteř: obchodnice ve strýcově stylu ——
const LIB_NETERE = {
  build: "normal", height: 45, female: true, age: "young", skin: "normal",
  hair: { style: "bob", col: "red" },
  top: { kind: "suit", col: "wine" }, shirtCol: "white", tieCol: "Y",
  legs: { kind: "skirt", col: "wine" },
  shoes: { kind: "shoes", col: "dark" },
  items: ["clipboard"],
  mouthCol: "V",
}
libIdle("netere", LIB_NETERE, null, (c, g) => {
  const { cx, sy, hx, hy, D } = g
  // ramenní vycpávky: rovná široká ramena
  c.hline(cx - D.sw - 1, sy, 3, "r"); c.hline(cx + D.sw - 1, sy, 3, "D"); c.px(cx - D.sw - 1, sy + 1, "r")
  // zlatá náušnice, brýle na čele
  c.px(hx + 4, hy + 5, "y")
  c.hline(hx + 1, hy, 4, "k"); c.px(hx + 1, hy, "l"); c.px(hx + 3, hy, "l")
  // čísla v bloku
  const bx = g.fx + 2, by = sy + 7
  c.hline(bx, by + 1, 2, "x"); c.hline(bx, by + 3, 3, "x")
})
sprite("face_netere", { w: 56, h: 56, outline: "k" }, (c) => {
  lidFace(c, LIB_NETERE)
  // vycpávky: hranatá ramena
  c.poly([0, 56, 1, 42, 14, 39, 16, 46], "V"); c.hline(1, 42, 13, "r"); c.poly([40, 39, 54, 41, 55, 56, 44, 50], "D")
  // zlaté náušnice
  c.circ(36, 33, 2, "y"); c.px(36, 33, "O"); c.px(35, 32, "W")
  // brýle na čele, zlatá obroučka
  c.ring(19, 9, 3, "Y"); c.ring(28, 9, 3, "Y"); c.hline(22, 9, 3, "Y"); c.line(31, 9, 36, 12, "Y")
  c.px(18, 8, "l"); c.px(27, 8, "l")
  // blok s cenami a tužka
  c.rect(0, 46, 11, 10, "h"); c.rect(1, 47, 9, 9, "W"); c.hline(2, 49, 6, "x"); c.hline(2, 51, 4, "x"); c.hline(2, 53, 5, "x"); c.hline(1, 46, 9, "M")
})

// —— Hlídač Nepomuckého: vybírá za sáhnutí ——
const LIB_HLIDAC = {
  build: "normal", height: 44, age: "old", skin: "normal",
  hair: { style: "short", col: "grey" }, beard: "moustache",
  hat: { kind: "cap", col: "olive" },
  top: { kind: "shirt", col: "green" },
  legs: { kind: "trousers", col: "denim" },
  shoes: { kind: "shoes", col: "dark" },
}
// kostkovaná flanelka: tmavé pruhy po dvou bodech napříč i podél
function libCheck(c, x0, y0, w, h, m, l, d) {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
    if (!c.is(x, y, m + l)) continue
    if (y % 3 === 0 && x % 3 === 0) c.px(x, y, "Q")
    else if (y % 3 === 0 || x % 3 === 0) c.px(x, y, d)
  }
}
libIdle("hlidac", LIB_HLIDAC, null, (c, g) => {
  const { sy, hipY, hand: [x, y] } = g
  libCheck(c, 0, sy, 24, hipY + 4 - sy, "j", "1", "V")
  // plechovka na jízdenky v přední ruce, z ní trčí lístky
  c.rect(x - 1, y + 1, 4, 5, "m"); c.vline(x + 2, y + 1, 5, "M"); c.hline(x - 1, y + 1, 4, "W"); c.px(x - 1, y + 3, "V"); c.px(x, y + 3, "V")
  c.px(x, y, "y"); c.px(x + 1, y - 1, "c")
})
sprite("face_hlidac", { w: 56, h: 56, outline: "k" }, (c) => {
  lidFace(c, LIB_HLIDAC)
  libCheck(c, 0, 40, 56, 16, "j", "1", "V")
  libCheck(c, 0, 40, 56, 16, "Q", "Q", "V")
  // límeček košile
  c.poly([18, 39, 25, 39, 22, 46], "1"); c.poly([30, 39, 36, 39, 33, 45], "j")
  // plechovka s jízdenkami dole vlevo
  c.rect(2, 44, 10, 12, "m"); c.vline(10, 44, 12, "M"); c.vline(11, 44, 12, "M"); c.hline(2, 44, 10, "W"); c.rect(2, 48, 9, 3, "V")
  c.rect(4, 39, 3, 5, "y"); c.rect(7, 40, 3, 4, "c")
})

// —— Mlynář: mlýn na Kampě, mouka a olej ——
const LIB_MLYNAR = {
  build: "stout", height: 50, skin: "normal",
  hair: { style: "short", col: "brown" }, beard: "moustache",
  top: { kind: "overalls", col: "denim" }, shirtCol: "white",
  shoes: { kind: "boots", col: "leather" },
  items: ["dirt"],
}
libIdle("mlynar", LIB_MLYNAR, null, (c, g) => {
  const { cx, sy, hy, hx, hipY } = g
  // žárovka na provázku kolem krku
  c.px(cx - 3, sy + 1, "C"); c.px(cx - 2, sy + 2, "C"); c.px(cx, sy + 2, "C"); c.px(cx + 1, sy + 1, "C")
  c.px(cx - 1, sy + 3, "M"); c.rect(cx - 2, sy + 4, 3, 2, "W"); c.px(cx - 1, sy + 6, "w"); c.px(cx, sy + 4, "y")
  // mouka nahoře (vlasy, ramena, náprsenka), olej dole na nohavicích
  libDust(c, 0, hy - 2, 24, hipY - hy + 2, "SsHhv", "w", 0.1, 5)
  libRecolor(c, cx - 5, hipY + 6, 4, 3, { S: "A", s: "a" }); libRecolor(c, cx + 2, hipY + 12, 3, 4, { S: "A", s: "a", n: "k" })
})
sprite("face_mlynar", { w: 56, h: 56, outline: "k" }, (c) => {
  lidFace(c, LIB_MLYNAR)
  // žárovka na provázku
  c.line(18, 40, 24, 48, "C"); c.line(36, 40, 29, 48, "C")
  c.rect(24, 47, 5, 3, "M"); c.hline(24, 48, 5, "m"); c.circ(26, 52, 3, "W"); c.px(25, 51, "W"); c.px(28, 53, "w"); c.px(26, 52, "y")
  // mouka ve vlasech a na ramenou, šmouha oleje
  libDust(c, 0, 0, 56, 22, "KHh", "w", 0.1, 9)
  libDust(c, 0, 40, 56, 16, "Ssnv", "w", 0.08, 9)
  c.line(40, 50, 46, 54, "A"); c.line(41, 52, 45, 55, "k")
})
