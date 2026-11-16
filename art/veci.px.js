// Věci do tašky (ITEMS ve src/script.js): obrázek 24 × 24 pro každou věc, sprite vec_<klíč věci>. Kreslí se do 22 × 22
// a obrys přidá pxl. Stejný styl jako ikony vlastností: tmavý obrys, dva tři odstíny materiálu, světlo zleva shora.
// Věci jsou použité a ošuntělé (ohnuté rohy, skvrny, rez), nic nového z obchodu.
const vec = (name, draw) => sprite("vec_" + name, { w: 24, h: 24, outline: "k" }, (c) => draw(c))
// obálka: tělo, chlopeň do V, známka
const obalka = (c, paper, shade, stamp) => {
  c.rect(2, 6, 19, 12, paper); c.hline(2, 17, 19, shade); c.vline(20, 6, 12, shade)
  c.line(2, 6, 11, 12, shade); c.line(20, 6, 12, 12, shade)
  c.rect(15, 8, 4, 4, stamp)
}
vec("dopis", (c) => { obalka(c, "c", "C", "V"); c.hline(5, 14, 6, "e"); c.hline(5, 15, 4, "e"); c.px(3, 16, "e"); c.px(4, 17, "e") })
vec("dopis_brno", (c) => { obalka(c, "W", "v", "b"); c.hline(5, 14, 7, "x"); c.hline(5, 15, 5, "x"); c.poly([2, 18, 2, 15, 5, 18], "v") })
// Mourek: mourovatá hlava s ušima, zelené oči
vec("kote", (c) => {
  c.poly([3, 9, 4, 3, 9, 7], "u"); c.poly([19, 9, 18, 3, 13, 7], "u"); c.px(5, 6, "i"); c.px(17, 6, "i")
  c.ellipse(11, 12, 8, 6, "u"); c.ellipse(11, 15, 5, 3, "W")
  for (const x of [8, 11, 14]) c.vline(x, 6, 3, "U"); c.hline(3, 12, 2, "U"); c.hline(18, 12, 2, "U")
  c.rect(7, 10, 2, 2, "E"); c.rect(14, 10, 2, 2, "E"); c.px(8, 11, "k"); c.px(14, 11, "k")
  c.px(11, 14, "i"); c.px(10, 16, "x"); c.px(12, 16, "x"); c.hline(1, 14, 3, "W"); c.hline(19, 14, 3, "W")
})
// krabička od Fanty: tmavá, přelepená páskou, jedna kontrolka
const krabicka = (c, body, top, tape) => {
  c.rect(3, 9, 17, 10, body); c.poly([3, 9, 6, 5, 21, 5, 19, 9], top); c.poly([20, 9, 21, 5, 21, 15, 20, 19], body)
  c.rect(10, 5, 3, 14, tape); c.hline(3, 18, 17, "k")
}
vec("zasilka", (c) => { krabicka(c, "S", "s", "U"); c.rect(16, 12, 2, 2, "f"); c.hline(5, 12, 3, "A"); c.hline(5, 14, 3, "A") })
vec("falesna", (c) => { krabicka(c, "s", "M", "u"); c.rect(15, 12, 4, 3, "y"); c.px(16, 13, "k"); c.line(15, 12, 14, 10, "x") })
// hodinky: kožený řemínek, mosazné pouzdro, ručičky
vec("hodinky", (c) => {
  c.rect(8, 0, 6, 22, "H"); c.rect(8, 0, 2, 22, "h"); c.px(11, 2, "k"); c.px(11, 19, "k")
  c.circ(11, 11, 7, "Y"); c.circ(11, 11, 5, "W"); c.line(11, 11, 11, 7, "k"); c.line(11, 11, 14, 12, "k"); c.rect(18, 10, 2, 2, "y")
  c.px(8, 8, "y"); c.px(9, 7, "y")
})
// lahev slivovice: zelené sklo, korek, zažloutlá viněta
vec("lahev", (c) => {
  c.rect(9, 1, 4, 3, "h"); c.rect(9, 4, 4, 5, "Q"); c.poly([9, 9, 13, 9, 16, 12, 6, 12], "Q"); c.rect(6, 12, 11, 10, "Q")
  c.vline(7, 12, 9, "j"); c.vline(10, 4, 5, "j"); c.rect(7, 14, 9, 5, "c"); c.hline(8, 15, 6, "e"); c.hline(8, 17, 4, "e")
})
// výpis z evidence: list s řádky a kulatým razítkem
vec("vypis", (c) => {
  c.rect(4, 1, 14, 20, "W"); c.poly([14, 1, 18, 1, 18, 5], "v"); c.vline(17, 5, 16, "v")
  for (const [y, w] of [[4, 8], [6, 10], [8, 7], [10, 10]]) c.hline(6, y, w, "x")
  c.ring(12, 16, 4, "V"); c.hline(10, 16, 5, "V")
})
// ozubené kolo z hodinek
vec("kolo", (c) => {
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; c.rect(Math.round(10 + Math.cos(a) * 9), Math.round(10 + Math.sin(a) * 9), 3, 3, "Y") }
  c.circ(11, 11, 8, "Y"); c.ring(11, 11, 8, "O"); c.circ(11, 11, 5, "y"); c.circ(11, 11, 2, "k"); c.px(8, 7, "f"); c.px(7, 8, "f")
})
// kanystr se směsí
vec("smes", (c) => {
  c.rect(4, 6, 15, 15, "V"); c.rect(4, 6, 2, 15, "7"); c.rect(12, 2, 5, 4, "S"); c.rect(6, 3, 5, 2, "V"); c.rect(6, 3, 1, 4, "V")
  c.line(7, 9, 16, 18, "D"); c.line(16, 9, 7, 18, "D"); c.hline(4, 20, 15, "D"); c.rect(13, 1, 3, 1, "M")
})
// bronzová destička, osahaná do lesku
vec("desticka", (c) => {
  c.rect(2, 5, 18, 13, "O"); c.rect(3, 6, 16, 11, "Y"); c.ellipse(11, 12, 5, 4, "y"); c.ellipse(10, 11, 2, 2, "f")
  for (const [x, y] of [[4, 7], [18, 7], [4, 16], [18, 16]]) c.px(x, y, "k")
})
// diplomatická propustka: kartička s pruhem a razítkem
vec("propustka", (c) => {
  c.rect(2, 4, 18, 14, "1"); c.rect(2, 4, 18, 3, "V"); c.rect(4, 9, 5, 6, "i"); c.rect(4, 9, 5, 2, "K")
  c.hline(11, 10, 7, "2"); c.hline(11, 12, 5, "2"); c.ring(15, 15, 3, "b"); c.hline(2, 17, 18, "2")
})
// kanapky z recepce na talířku
vec("jidlo", (c) => {
  c.ellipse(11, 15, 10, 5, "v"); c.ellipse(11, 14, 10, 5, "W"); c.ellipse(11, 14, 7, 3, "v")
  for (const [x, y] of [[3, 9], [9, 7], [14, 10]]) { c.rect(x, y, 6, 5, "c"); c.rect(x, y, 6, 2, "V"); c.rect(x + 2, y - 1, 2, 2, "y"); c.hline(x, y + 4, 6, "C") }
})
// plácačka výpravčího: zelený terč s bílým mezikružím na tyči
vec("placacka", (c) => { c.line(12, 12, 19, 21, "h", 2); c.circ(9, 8, 8, "W"); c.circ(9, 8, 6, "Q"); c.circ(9, 8, 3, "W"); c.px(5, 4, "j"); c.px(6, 3, "j"); c.px(13, 13, "v") })
// olověná trubka s kolenem
vec("trubka", (c) => { c.line(3, 19, 17, 5, "M", 4); c.line(3, 18, 16, 5, "m", 1); c.rect(15, 1, 5, 7, "S"); c.rect(15, 1, 2, 7, "M"); c.rect(1, 17, 5, 4, "S"); c.px(9, 14, "u"); c.px(10, 14, "u") })
// baseballka s Fantovou cenovkou
vec("baseballka", (c) => {
  c.line(3, 20, 8, 15, "H", 2); c.line(8, 15, 17, 5, "h", 4); c.line(9, 13, 17, 4, "o", 1); c.circ(18, 4, 2, "h"); c.rect(2, 19, 3, 3, "H")
  c.line(8, 16, 12, 19, "x"); c.rect(12, 17, 6, 4, "y"); c.px(13, 18, "k"); c.hline(14, 19, 3, "O")
})
// kabát z Pařížské: límec, dvě řady knoflíků
vec("kabat", (c) => {
  c.poly([6, 2, 16, 2, 20, 6, 18, 11, 17, 9, 17, 21, 5, 21, 5, 9, 4, 11, 2, 6], "C"); c.vline(11, 4, 17, "e")
  c.poly([8, 2, 11, 7, 14, 2], "k"); c.poly([7, 2, 11, 8, 9, 9], "c"); c.poly([15, 2, 11, 8, 13, 9], "c")
  for (const y of [11, 14, 17]) { c.px(9, y, "O"); c.px(13, y, "O") } c.hline(5, 20, 12, "e"); c.rect(6, 15, 3, 1, "e")
})
// reflexní vesta: oranžová, dva bílé pruhy
vec("vesta", (c) => {
  c.poly([5, 2, 9, 2, 11, 7, 13, 2, 17, 2, 19, 6, 18, 21, 4, 21, 3, 6], "F"); c.poly([9, 2, 11, 7, 13, 2], "_")
  c.rect(4, 11, 15, 2, "W"); c.rect(4, 16, 15, 2, "W"); c.vline(11, 7, 14, "U"); c.px(5, 20, "U"); c.px(17, 20, "U"); c.rect(13, 5, 3, 3, "o")
})
// neopren: tmavé tělo s modrým pruhem a zipem
vec("neopren", (c) => {
  c.poly([7, 1, 15, 1, 21, 5, 19, 10, 16, 8, 16, 21, 6, 21, 6, 8, 3, 10, 1, 5], "n"); c.poly([9, 1, 11, 4, 13, 1], "k")
  c.vline(11, 4, 12, "M"); c.rect(6, 9, 11, 2, "L"); c.line(2, 5, 6, 3, "L"); c.line(20, 5, 16, 3, "L"); c.rect(6, 19, 11, 2, "S")
})
// brýle bez nožičky
vec("bryle", (c) => {
  c.circ(6, 11, 5, "M"); c.circ(6, 11, 3, "l"); c.circ(16, 11, 5, "M"); c.circ(16, 11, 3, "l"); c.hline(10, 10, 3, "M")
  c.px(5, 9, "W"); c.px(15, 9, "W"); c.line(1, 9, 0, 5, "M"); c.px(21, 9, "u")
})
// pracovní rukavice
vec("rukavice", (c) => {
  c.rect(5, 9, 11, 9, "o"); c.rect(6, 17, 9, 4, "u"); c.hline(6, 18, 9, "U")
  for (const [x, h] of [[5, 5], [8, 7], [11, 7], [14, 5]]) c.rect(x, 9 - h, 2, h, "o")
  c.poly([16, 12, 20, 9, 21, 11, 17, 16], "o"); c.vline(7, 4, 5, "h"); c.vline(10, 3, 6, "h"); c.vline(13, 3, 6, "h"); c.rect(6, 12, 8, 1, "u")
})
// služební odznak: štít s hvězdou
vec("odznak", (c) => {
  c.poly([3, 2, 19, 2, 19, 11, 11, 21, 3, 11], "Y"); c.poly([5, 4, 17, 4, 17, 10, 11, 18, 5, 10], "y")
  c.poly([11, 5, 13, 9, 16, 9, 13, 12, 14, 15, 11, 13, 8, 15, 9, 12, 6, 9, 9, 9], "S"); c.px(6, 5, "f"); c.px(7, 5, "f")
})
// píšťalka na šňůrce
vec("pistalka", (c) => {
  c.circ(8, 13, 6, "M"); c.rect(8, 7, 13, 5, "M"); c.rect(8, 7, 13, 1, "m"); c.rect(13, 9, 3, 2, "k"); c.circ(8, 13, 2, "S")
  c.line(3, 9, 1, 3, "V"); c.line(1, 3, 6, 1, "V"); c.px(6, 10, "m")
})
// obvaz: role s červeným křížem
vec("obvaz", (c) => {
  c.ellipse(9, 12, 7, 8, "W"); c.ellipse(9, 12, 3, 4, "v"); c.px(9, 12, "x"); c.poly([13, 5, 21, 8, 21, 14, 15, 13], "W"); c.line(15, 13, 21, 14, "v")
  c.rect(17, 9, 1, 3, "7"); c.rect(16, 10, 3, 1, "7"); c.px(4, 17, "e"); c.px(5, 18, "e")
})
// konzerva lančmítu: plech, vybledlá etiketa
vec("konzerva", (c) => {
  c.rect(4, 5, 14, 15, "M"); c.ellipse(11, 5, 7, 2, "m"); c.ellipse(11, 20, 7, 2, "S"); c.rect(4, 9, 14, 8, "V"); c.rect(6, 11, 10, 3, "c")
  c.hline(7, 12, 6, "e"); c.vline(5, 6, 13, "m"); c.px(15, 18, "u"); c.px(16, 19, "u")
})
// chlebíček: veka, vlašák, salám, kolečko vejce
vec("chlebicek", (c) => {
  c.ellipse(11, 14, 10, 6, "h"); c.ellipse(11, 12, 10, 6, "c"); c.ellipse(11, 12, 8, 4, "W")
  c.circ(7, 11, 3, "V"); c.px(6, 10, "r"); c.px(8, 12, "r"); c.circ(14, 12, 3, "W"); c.circ(14, 12, 1, "y"); c.ring(14, 12, 3, "v"); c.px(11, 9, "Q"); c.px(17, 9, "Q")
})
// chleba z mlýna: bochník se zářezy
vec("chleba", (c) => {
  c.ellipse(11, 13, 10, 7, "H"); c.ellipse(11, 12, 10, 6, "o"); c.ellipse(9, 10, 6, 3, "y")
  for (const x of [6, 10, 14]) c.line(x, 8, x + 3, 15, "H"); c.hline(4, 18, 14, "U")
})

// Obtížnost (OBTIZNOST, HudScene.chooseDifficulty): pírko pro Lehkou, litinové závaží pro Těžkou, meteorit pro Nemožnou.
const obt = (name, draw) => sprite("obt_" + name, { w: 24, h: 24, outline: "k" }, (c) => draw(c))
obt("lehka", (c) => {
  c.poly([18, 1, 21, 4, 15, 14, 8, 18, 5, 16, 8, 8], "W"); c.poly([18, 1, 8, 8, 5, 16, 11, 11], "v")
  c.line(19, 3, 2, 21, "x"); c.line(12, 6, 14, 9, "x"); c.line(9, 10, 12, 13, "x"); c.line(16, 4, 17, 6, "x"); c.px(7, 15, "x")
})
obt("tezka", (c) => {
  c.ring(11, 5, 4, "M"); c.ring(11, 5, 3, "M"); c.poly([6, 8, 16, 8, 20, 21, 2, 21], "M"); c.poly([6, 8, 8, 8, 5, 21, 2, 21], "m")
  c.hline(2, 20, 19, "S"); c.hline(3, 21, 18, "S"); c.text(7, 12, "kg", "k"); c.px(15, 18, "u"); c.px(16, 19, "u"); c.px(14, 19, "u")
})
obt("nemozna", (c) => {
  c.poly([9, 12, 21, 0, 21, 6, 13, 15], "U"); c.poly([10, 12, 21, 1, 21, 4, 12, 14], "F"); c.line(11, 12, 21, 2, "f")
  c.circ(8, 14, 6, "F"); c.circ(7, 15, 4, "f"); c.poly([5, 14, 8, 12, 10, 15, 7, 18], "K"); c.px(6, 14, "x")
  c.px(15, 17, "f"); c.px(17, 14, "F"); c.px(3, 8, "f")
})
