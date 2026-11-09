// Lidé C: Malá Strana a Hrad (vymahač, paní z Nerudovky, velvyslanec, hradní stráž, kastelán, průvodkyně, ochranka
// a ředitel Kanceláře kanálu). Kreslí je sada z lide.px.js; co v ní není (baseballka, hůlka, razítko, deštník nad
// hlavou…), přikreslují pomocníci lic* ještě před obrysem, aby to mělo černý lem jako zbytek postavy.

// Stání jako lidIdle, jen s vlastním přikreslením: back(c, g) před postavou, front(c, g) po ní, obojí před obrysem.
function licIdle(name, o, front, back) {
  for (let f = 0; f < 4; f++) sprite(`_${name}_${f}`, { w: 24, h: 64, outline: "k" }, (c) => {
    const pose = { breathe: f === 1 || f === 2, blink: f === 3 }
    const g = licGeo(o, pose)
    if (back) back(c, g, f)
    lidPerson(c, o, pose)
    if (front) front(c, g, f)
  })
  return anim(name, { w: 26, h: 66, fps: 3, frames: 4 }, (c) => c.stamp(`_${name}_${c.frame}`, 0, 0))
}
// Portrét: back před lidFace (za hlavou), front po něm.
const licFace = (key, o, front, back) => sprite("face_" + key, { w: 56, h: 56, outline: "k" }, (c) => {
  if (back) back(c); lidFace(c, o); if (front) front(c)
})
// Rozměry postavy tak, jak je počítá lidPerson (hlava, ramena, boky, ruce).
function licGeo(o, pose) {
  const D = lidDims(o), H = o.height || 46, cx = 12
  const top = 64 - H + (o.age === "old" ? 1 : 0)
  const hy = top - (pose.breathe ? 1 : 0), hipY = 64 - H + Math.round(H * 0.5)
  const fx = cx - D.sw - 1
  return { D, H, cx, hx: cx - 4, hy, sy: hy + 9, hipY, kneeY: Math.round((hipY + 63) / 2), fx, hand: [fx, hipY + 2], bhand: [cx + D.sw - 1, hipY + 2] }
}
// Stavební helma v portrétu sahá kupolí přes pravé oko: pod kšiltem ji vrátit na kůži a dokreslit oči a ucho.
function licHelmetFix(c, o) {
  const skin = LID_SKIN[o.skin] || LID_SKIN.normal, m = lidMat(o.hat.col, "yellow")
  const cx = 27, cy = 25, rx = o.build === "stout" ? 13 : o.build === "thin" ? 10 : 11
  for (let y = cy - 5; y <= cy; y++) for (let x = cx - rx; x <= cx + rx; x++) {
    if (!c.is(x, y, m.d + m.m + m.l + "kK3")) continue
    if (((x - cx) / rx) ** 2 + ((y - cy) / 15) ** 2 > 1) continue
    c.px(x, y, x - cx > 3 - (y - cy) / 5 ? skin.d : skin.m)
  }
  const eye = (x, w) => { c.hline(x, cy - 3, w, "3"); c.hline(x, cy - 2, w, "w"); c.px(x + w - 2, cy - 2, o.eyeCol || "K"); c.px(x + w - 3, cy - 2, "k"); c.hline(x, cy - 1, w, skin.d) }
  eye(cx - 10, 3); eye(cx - 2, 4)
  c.hline(cx - 3, cy - 5, 5, skin.d)
  c.ellipse(cx + rx - 2, cy + 1, 2, 4, skin.m); c.vline(cx + rx - 2, cy, 3, skin.d)
}

// Logo kanálu: modrá vlnka v kroužku.
function licLogo(c, x, y, big) {
  if (big) { c.circ(x, y, 3, "X"); c.hline(x - 2, y, 2, "J"); c.hline(x, y + 1, 2, "J"); c.px(x + 2, y, "J"); c.px(x - 1, y - 2, "Z") }
  else { c.px(x, y, "Z"); c.px(x + 1, y, "J") }
}

// Baseballka od rukojeti (x0, y0) ke konci (x1, y1): rukojeť tenká, palice se rozšiřuje, světlo vlevo.
function licBat(c, x0, y0, x1, y1) {
  const n = y1 - y0
  for (let i = 0; i <= n; i++) {
    const t = i / n, x = Math.round(x0 + (x1 - x0) * t), y = y0 + i, w = t < 0.35 ? 1 : t < 0.65 ? 2 : 3
    c.hline(x, y, w, "h"); c.px(x, y, w > 1 ? "u" : "h"); if (w === 3) c.px(x + 2, y, "H")
  }
  c.hline(x0 - 1, y0, 3, "H"); c.hline(Math.round(x1), y1, 3, "H")
}

// —— Vymahač: teplákovka, koženková bunda, řetěz, baseballka s Fantovou cenovkou ——
const LIC_TEPLAKY = { d: "Q", m: "j", l: "1" }
const LIC_KOZENKA = { d: "k", m: "A", l: "B" }
const LIC_VYMAHAC = {
  build: "stout", height: 47, skin: "normal",
  hair: { style: "bald", col: "dark" }, beard: "stubble",
  top: { kind: "jacket", col: LIC_KOZENKA }, shirtCol: LIC_TEPLAKY,
  legs: { kind: "trousers", col: LIC_TEPLAKY },
  shoes: { kind: "shoes", col: "white" },
  items: ["chain", "scar"],
}
licIdle("vymahac", LIC_VYMAHAC, (c, g) => {
  // bílý pruh po straně tepláků, lesk koženky
  for (let y = g.hipY + 1; y < 61; y++) c.px(g.cx - 1 - g.D.lw, y, "W")
  c.px(g.cx - 4, g.sy + 3, "P"); c.px(g.cx - 4, g.sy + 4, "B"); c.px(g.cx + 3, g.sy + 5, "B")
  c.rect(g.cx - 2, g.sy, 3, 2, "j"); c.px(g.cx - 1, g.sy, "W") // límec teplákovky se zipem
  // baseballka v přední ruce, špička na zemi
  const [x, y] = g.hand
  licBat(c, x + 1, y - 1, x - 5, 62)
  c.rect(x, y, 2, 2, "i"); c.px(x, y, "0")
  // cenovka na provázku
  c.px(x - 1, y + 6, "w"); c.px(x - 2, y + 7, "w"); c.rect(x - 4, y + 8, 3, 3, "W"); c.px(x - 3, y + 9, "V")
})
licFace("vymahac", LIC_VYMAHAC, (c) => {
  // límec teplákovky se zipem a bílými pruhy pod bundou, lesk koženky
  c.poly([22, 40, 31, 40, 29, 50, 24, 50], "j"); c.vline(26, 41, 9, "M"); c.line(22, 40, 23, 48, "W")
  c.line(8, 47, 13, 44, "B"); c.line(42, 46, 46, 49, "B"); c.px(10, 52, "P")
}, (c) => {
  // baseballka opřená o rameno, cenovka
  c.line(46, 56, 54, 6, "h", 5); c.line(45, 56, 53, 6, "u"); c.line(49, 56, 56, 10, "H")
  c.rect(49, 12, 5, 6, "W"); c.px(51, 14, "V"); c.px(52, 14, "V"); c.px(51, 16, "k"); c.line(52, 11, 53, 9, "w")
})

// —— Paní z Nerudovky: drobná stará paní, šátek, zástěra, hůlka, košík, ostrý pohled ——
const LIC_PANI = {
  build: "thin", height: 42, female: true, age: "old", skin: "pale",
  hair: { style: "none", col: "white" },
  hat: { kind: "scarf", col: "olive" },
  top: { kind: "sweater", col: "brown" },
  over: { kind: "apron", col: { d: "x", m: "v", l: "w" } },
  legs: { kind: "skirt", col: "ash" },
  shoes: { kind: "shoes", col: "dark" },
  eyeCol: "k",
}
licIdle("pani", LIC_PANI, (c, g) => {
  // kapsa a tkanice zástěry, tlusté punčochy místo holých nohou
  c.rect(g.cx - 3, g.hipY + 2, 4, 3, "x"); c.hline(g.cx - 3, g.hipY + 2, 4, "w"); c.hline(g.cx - 4, g.hipY - 1, 8, "W")
  for (let y = g.kneeY + 3; y < 61; y++) for (let x = 0; x < 24; x++) { if (c.is(x, y, "80")) c.px(x, y, "4"); else if (c.is(x, y, "4")) c.px(x, y, "3") }
  // puntíky na šátku
  c.px(g.hx + 2, g.hy - 1, "c"); c.px(g.hx + 5, g.hy - 1, "c"); c.px(g.hx + 6, g.hy + 3, "c"); c.px(g.hx + 4, g.hy - 2, "c")
  // hůlka v přední ruce se zahnutou rukojetí
  const [x, y] = g.hand
  c.vline(x - 2, y - 1, 64 - y + 1, "h"); c.vline(x - 2, y + 3, 64 - y - 3, "u"); c.hline(x - 2, y - 2, 3, "u"); c.px(x + 1, y - 1, "h")
  c.rect(x, y, 2, 2, "8")
  // košík v zadní ruce
  const [bx, by] = g.bhand
  c.ring(bx + 2, by + 1, 2, "e"); c.rect(bx - 1, by + 2, 7, 5, "C"); c.hline(bx - 1, by + 2, 7, "c")
  for (let i = 0; i < 7; i += 2) c.vline(bx - 1 + i, by + 3, 4, "e"); c.hline(bx, by + 6, 5, "e"); c.px(bx + 1, by + 1, "j")
})
licFace("pani", LIC_PANI, (c) => {
  // ostrý pohled: přimhouřená víčka, zdvižené obočí, vrásky
  c.hline(16, 22, 4, "3"); c.hline(24, 22, 4, "3")
  c.px(19, 23, "Q"); c.px(26, 23, "Q")
  c.line(13, 26, 14, 31, "4"); c.hline(17, 36, 4, "4")
  c.px(31, 21, "4"); c.px(31, 23, "4"); c.px(32, 22, "4"); c.hline(24, 25, 4, "4"); c.hline(16, 25, 3, "4")
  c.line(25, 28, 26, 33, "4"); c.px(17, 35, "4"); c.px(24, 35, "4"); c.hline(19, 38, 3, "4")
  // puntíky na šátku
  for (let y = 2; y < 46; y += 5) for (let x = 2 + (y % 10); x < 54; x += 7) if (c.is(x, y, "gG")) c.px(x, y, c.is(x, y, "G") ? "e" : "c")
})

// —— Velvyslanec: šedovlasý, vyžehlený oblek, kravata, razítko, vlaječka bez státu ——
const LIC_PERLOVA = { d: "P", m: "p", l: "q" }
const LIC_VELVYSLANEC = {
  build: "thin", height: 48, skin: "pale", age: "old",
  hair: { style: "short", col: "white" }, beard: "moustache", beardCol: "grey",
  top: { kind: "suit", col: LIC_PERLOVA }, shirtCol: "white", tieCol: "V",
  legs: { kind: "trousers", col: LIC_PERLOVA },
  shoes: { kind: "shoes", col: "dark" },
}
licIdle("velvyslanec", LIC_VELVYSLANEC, (c, g) => {
  // puky na kalhotách, lesk bot, kapesníček
  for (let y = g.hipY + 2; y < 61; y++) c.px(g.cx - 2, y, "q")
  c.px(g.cx - 4, 62, "a"); c.px(g.cx + 3, g.sy + 3, "W")
  // razítko v přední ruce
  const [x, y] = g.hand
  c.px(x, y - 2, "h"); c.vline(x, y - 1, 1, "H"); c.rect(x - 1, y + 2, 4, 2, "H"); c.hline(x - 1, y + 4, 4, "V")
  // vlaječka bez státu na tyčce v zadní ruce
  const [bx, by] = g.bhand
  c.vline(bx + 2, by - 12, 14, "O"); c.px(bx + 2, by - 13, "y")
  c.rect(bx + 3, by - 12, 4, 3, "w"); c.px(bx + 6, by - 12, "."); c.px(bx + 6, by - 9, "w"); c.hline(bx + 3, by - 10, 3, "v")
})
licFace("velvyslanec", LIC_VELVYSLANEC, (c) => {
  // vlaječka bez státu v klopě, kapesníček, vyžehlené hrany
  c.vline(12, 44, 6, "Y"); c.rect(13, 44, 4, 3, "w"); c.hline(13, 46, 4, "v")
  c.rect(38, 46, 4, 2, "W"); c.px(41, 47, "v")
}, null)

// —— Hradní stráž: modrá slavnostní uniforma, bílé rukavice, puška s kytkou, unavené oči ——
const LIC_MODRA = { d: "b", m: "L", l: "l" }, LIC_MODRA_T = { d: "N", m: "b", l: "L" }
const LIC_STRAZ = {
  build: "normal", height: 47, skin: "normal", age: "young",
  hair: { style: "short", col: "brown" },
  hat: { kind: "peaked", col: LIC_MODRA },
  top: { kind: "jacket", col: LIC_MODRA }, shirtCol: "white",
  legs: { kind: "trousers", col: LIC_MODRA_T },
  shoes: { kind: "boots", col: "dark" },
  items: ["rifle"],
}
licIdle("straz", LIC_STRAZ, (c, g) => {
  // zlaté knoflíky, nárameník, červený lampas
  for (let y = g.sy + 6; y < g.hipY + 3; y += 3) c.px(g.cx - 2, y, "y")
  c.hline(g.cx - g.D.sw + 1, g.sy, 3, "Y"); c.hline(g.cx - g.D.sw, g.hipY - 1, g.D.sw * 2, "W")
  for (let y = g.hipY + 1; y < 59; y++) c.px(g.cx - 1 - g.D.lw, y, "V")
  // bílé rukavice
  const [x, y] = g.hand; c.rect(x, y, 2, 2, "W"); c.px(x + 1, y + 1, "w")
  const [bx, by] = g.bhand; c.rect(bx, by, 2, 2, "w")
  // kytka v hlavni
  const mx = g.cx + 6, my = g.sy - 7
  c.px(mx, my - 1, "Q"); c.px(mx - 1, my - 2, "d"); c.px(mx + 1, my - 2, "d"); c.px(mx, my - 3, "d"); c.px(mx, my - 2, "y")
  // unavené oči: těžká víčka
  c.px(g.hx + 1, g.hy + 4, "4"); c.px(g.hx + 3, g.hy + 4, "4")
})
licFace("straz", LIC_STRAZ, (c) => {
  // těžká víčka a kruhy pod očima
  c.hline(17, 22, 3, "3"); c.hline(25, 22, 4, "3"); c.hline(17, 25, 4, "4"); c.hline(25, 25, 4, "4")
  // nárameníky a knoflíky, bílý pás
  c.rect(6, 44, 8, 2, "Y"); c.hline(6, 44, 8, "y"); c.rect(40, 44, 8, 2, "O")
  c.px(25, 50, "y"); c.px(25, 54, "y")
  // kytka v hlavni pušky
  c.line(43, 40, 42, 36, "Q"); c.circ(42, 34, 2, "d"); c.px(42, 34, "y"); c.px(41, 33, "8")
})

// —— Kastelán: tmavé sako, svazek obrovských klíčů, taška z Fantova tržiště, lakýrky od bláta ——
const LIC_KASTELAN = {
  build: "normal", height: 46, skin: "normal", age: "old",
  hair: { style: "bald", col: "grey" }, beard: "moustache",
  top: { kind: "jacket", col: { d: "k", m: "3", l: "h" } }, shirtCol: "white",
  legs: { kind: "trousers", col: "ash" },
  shoes: { kind: "shoes", col: { d: "k", m: "k", l: "W" } },
}
licIdle("kastelan", LIC_KASTELAN, (c, g) => {
  // bláto na lakýrkách
  c.px(g.cx - 4, 63, "h"); c.px(g.cx - 2, 62, "3"); c.px(g.cx + 1, 63, "h"); c.px(g.cx + 3, 63, "3")
  // svazek obrovských klíčů v přední ruce
  const [x, y] = g.hand
  c.ring(x + 1, y + 4, 2, "Y"); c.px(x + 1, y + 4, "."); c.rect(x, y, 2, 2, "i"); c.px(x, y, "0")
  c.vline(x - 1, y + 6, 9, "m"); c.hline(x - 3, y + 13, 2, "m"); c.px(x - 3, y + 11, "M"); c.px(x - 2, y + 11, "m")
  c.vline(x + 2, y + 6, 8, "Y"); c.rect(x + 3, y + 11, 1, 3, "y"); c.px(x + 2, y + 13, "O")
  c.vline(x + 1, y + 7, 5, "M"); c.px(x + 1, y + 12, "x")
  // taška z Fantova tržiště v zadní ruce (vybledlý igelit s cenovkou)
  const [bx, by] = g.bhand
  c.hline(bx, by - 1, 3, "v"); c.px(bx + 3, by, "v")
  c.poly([bx - 1, by + 1, bx + 5, by + 1, bx + 6, by + 10, bx - 1, by + 10], "w")
  c.vline(bx + 5, by + 2, 8, "v"); c.hline(bx - 1, by + 10, 7, "v")
  c.rect(bx + 1, by + 4, 3, 2, "V"); c.px(bx + 2, by + 4, "y")
  c.px(bx + 1, by, "j"); c.px(bx + 2, by - 1, "Q") // pórek z tašky
})
licFace("kastelan", LIC_KASTELAN, (c) => {
  // svazek klíčů zdvižený v ruce
  c.rect(2, 46, 8, 10, "i"); c.vline(2, 46, 10, "0"); c.hline(3, 50, 6, "4")
  c.ring(6, 44, 4, "Y"); c.ring(6, 44, 3, "O")
  c.vline(12, 40, 14, "m"); c.rect(11, 36, 3, 4, "m"); c.ring(12, 34, 2, "m"); c.hline(13, 50, 2, "m"); c.hline(13, 52, 2, "M")
  c.vline(15, 44, 10, "Y"); c.ring(15, 41, 2, "Y"); c.hline(16, 51, 2, "Y")
  // kapesník a bílý límec
  c.rect(37, 46, 3, 2, "w")
})

// —— Průvodkyně: tmavomodrý kostýmek, deštník zdvižený nad hlavou, jmenovka, neochvějný úsměv ——
const LIC_PRUVODKYNE = {
  build: "normal", height: 45, female: true, age: "adult", skin: "normal",
  hair: { style: "bob", col: "red" },
  top: { kind: "suit", col: "navy" }, shirtCol: "white", tieCol: "o",
  legs: { kind: "skirt", col: "navy" },
  shoes: { kind: "shoes", col: "dark" },
  mouthCol: "V",
}
licIdle("pruvodkyne", LIC_PRUVODKYNE, (c, g) => {
  const tm = LID_MAT.navy, fx = g.fx
  // spuštěnou přední ruku smazat, ruka jde vzhůru
  for (let y = g.sy + 1; y <= g.hipY + 4; y++) { c.px(fx, y, "_"); c.px(fx - 1, y, "_"); if (c.is(fx + 1, y, "*")) c.px(fx + 1, y, tm.l) }
  c.line(fx + 1, g.sy + 1, fx - 1, g.sy - 5, tm.m, 2); c.px(fx, g.sy - 2, tm.l); c.px(fx - 1, g.sy - 4, tm.l)
  c.rect(fx - 2, g.sy - 8, 2, 3, "i"); c.px(fx - 2, g.sy - 8, "0")
  // zavřený deštník nad hlavou s mašlí
  const ux = fx - 1
  c.vline(ux, 1, g.sy - 9, "A"); c.px(ux, 0, "M")
  c.poly([ux - 1, 4, ux + 1, 4, ux + 2, 12, ux, 16, ux - 1, 12], "V"); c.vline(ux + 1, 6, 6, "D"); c.px(ux - 1, 7, "d")
  c.px(ux + 1, 2, "o"); c.px(ux + 2, 3, "o"); c.px(ux + 2, 1, "U")
  // jmenovka
  c.rect(g.cx + 1, g.sy + 4, 3, 2, "W"); c.px(g.cx + 2, g.sy + 5, "x")
  // úsměv
  c.hline(g.hx + 1, g.hy + 6, 3, "V")
})
licFace("pruvodkyne", LIC_PRUVODKYNE, (c) => {
  // neochvějný úsměv se zuby
  c.hline(18, 33, 6, "D"); c.px(17, 32, "D"); c.px(24, 32, "D"); c.hline(18, 34, 6, "D"); c.hline(19, 34, 4, "W"); c.hline(19, 35, 4, "d")
  c.px(16, 31, "4"); c.px(25, 31, "4"); c.hline(19, 36, 4, "i")
  // jmenovka
  c.rect(36, 47, 9, 5, "W"); c.hline(37, 49, 6, "x"); c.hline(37, 50, 4, "v"); c.px(36, 47, "Y")
  // zdvižená ruka s deštníkem vlevo
  c.line(3, 56, 7, 38, "N", 5); c.line(2, 56, 6, 38, "L"); c.rect(5, 30, 5, 8, "i"); c.vline(5, 30, 7, "0")
  c.vline(7, 0, 30, "A"); c.poly([5, 2, 9, 2, 10, 18, 7, 24, 4, 18], "V"); c.vline(9, 4, 13, "D"); c.vline(5, 4, 12, "d")
  c.rect(8, 0, 3, 2, "o")
})

// —— Ochranka kanálu: ramenatí chlapi, reflexní vesta s logem, vysílačka, obušek, helma ze stavby ——
const LIC_OCHRANKA = {
  build: "stout", height: 48, skin: "tan",
  hair: { style: "short", col: "dark" }, beard: "stubble",
  hat: { kind: "hardhat", col: "orange" },
  top: { kind: "jacket", col: "olive" },
  over: { kind: "reflective", col: "yellow" },
  legs: { kind: "trousers", col: "olive" },
  shoes: { kind: "boots", col: "dark" },
}
licIdle("ochranka", LIC_OCHRANKA, (c, g, f) => {
  // logo kanálu na vestě
  licLogo(c, g.cx - 4, g.sy + 3)
  // vysílačka na rameni s anténou
  c.rect(g.cx + 2, g.sy + 1, 2, 3, "k"); c.px(g.cx + 2, g.sy + 1, "a"); c.vline(g.cx + 3, g.sy - 2, 3, "A"); c.px(g.cx + 2, g.sy + 2, "E")
  // obušek v přední ruce
  const [x, y] = g.hand
  c.line(x + 1, y - 1, x - 4, y + 12, "A", 2); c.line(x, y + 1, x - 4, y + 11, "a"); c.rect(x, y, g.D.aw, 2, "4"); c.px(x, y, "i")
  // oči pod kšiltem helmy
  if (f !== 3) { c.px(g.hx + 1, g.hy + 3, "k"); c.px(g.hx + 3, g.hy + 3, "k") }
})
licFace("ochranka", LIC_OCHRANKA, (c) => {
  licHelmetFix(c, LIC_OCHRANKA)
  // logo kanálu na vestě, vysílačka s anténou na rameni
  licLogo(c, 13, 46, true); c.line(36, 46, 42, 46, "W")
  c.rect(38, 38, 6, 10, "k"); c.rect(39, 39, 4, 3, "a"); c.px(40, 44, "E"); c.vline(43, 29, 9, "A"); c.px(43, 28, "a")
  // logo na helmě
  licLogo(c, 23, 13)
})

// —— Ředitel Kanceláře kanálu: drahý oblek, bílá helma, zlaté brýle, srolované výkresy pod paží, odznak ——
const LIC_REDITEL = {
  build: "normal", height: 48, skin: "normal", age: "adult",
  hair: { style: "short", col: "dark" },
  hat: { kind: "hardhat", col: "white" },
  top: { kind: "suit", col: "dark" }, shirtCol: "white", tieCol: "Y",
  legs: { kind: "trousers", col: "dark" },
  shoes: { kind: "shoes", col: { d: "k", m: "U", l: "u" } },
}
licIdle("reditel", LIC_REDITEL, (c, g) => {
  // zlaté brýle
  c.px(g.hx, g.hy + 3, "Y"); c.px(g.hx + 2, g.hy + 3, "y"); c.px(g.hx + 4, g.hy + 3, "Y")
  // odznak kanálu v klopě
  licLogo(c, g.cx - 4, g.sy + 3)
  // srolované výkresy pod přední paží
  const y0 = g.sy + 12, x0 = g.fx - 3, x1 = g.cx + 3, y1 = g.sy + 7
  c.line(x0, y0, x1, y1, "l", 2); c.line(x0, y0 - 1, x1, y1 - 1, "W"); c.line(x0 + 1, y0 + 1, x1, y1 + 1, "L")
  c.px(x0, y0, "w"); c.px(x0, y0 + 1, "w"); c.px(x0 + 3, y0 - 1, "V")
  for (let y = g.sy + 7; y < g.sy + 13; y++) if (c.is(g.fx, y, "lLWwV")) { c.px(g.fx, y, LID_MAT.dark.l); c.px(g.fx + 1, y, LID_MAT.dark.m) }
})
licFace("reditel", LIC_REDITEL, (c) => {
  licHelmetFix(c, LIC_REDITEL)
  // zlaté brýle
  c.ring(19, 23, 3, "y"); c.ring(28, 23, 3, "y"); c.hline(16, 25, 7, "Y"); c.hline(25, 25, 7, "Y"); c.hline(22, 22, 3, "y"); c.line(31, 22, 37, 23, "Y"); c.px(17, 21, "W"); c.px(26, 21, "W")
  // odznak kanálu v klopě, výkresy pod paží
  licLogo(c, 13, 47, true)
  c.rect(30, 50, 26, 5, "l"); c.hline(30, 50, 26, "W"); c.hline(30, 54, 26, "L"); c.ellipse(31, 52, 1, 2, "w"); c.px(31, 52, "L")
  c.line(40, 50, 40, 54, "L")
})
