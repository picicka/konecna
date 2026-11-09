// Lidé A: Hlavák a Václavák nakreslení přes art/lide.px.js. Stání (4 snímky 26 × 66) a portrét 56 × 56.
// Detaily, které sada voleb nemá (plácačka, luk z lyže, sluchátka…), kreslí liaIdle před obrysem, takže mají černý lem.

// Rozměry postavy stejně jako v lidPerson: hlava, ramena, pas, ruce.
function liaGeo(o, pose = {}) {
  const D = lidDims(o)
  const H = o.height || 46
  const cx = 12
  const top = 64 - H + (pose.bob || 0) + (o.age === "old" ? 1 : 0)
  const hy = top - (pose.breathe ? 1 : 0), hx = cx - 4
  const sy = hy + 9
  const hipY = 64 - H + Math.round(H * 0.5) + (pose.bob || 0)
  const fx = cx - D.sw - 1
  return { D, H, cx, hx, hy, sy, hipY, kneeY: Math.round((hipY + 63) / 2), fx, hand: [fx, hipY + 2], back: [cx + D.sw - 1, hipY + 2] }
}
// Stání jako lidIdle, ale draw(c, g, f) se kreslí do snímku ještě před obrysem.
function liaIdle(name, o, draw) {
  for (let f = 0; f < 4; f++) sprite(`_${name}_${f}`, { w: 24, h: 64, outline: "k" }, (c) => {
    const pose = { breathe: f === 1 || f === 2, blink: f === 3 }
    lidPerson(c, o, pose)
    if (draw) draw(c, liaGeo(o, pose), f)
  })
  return anim(name, { w: 26, h: 66, fps: 3, frames: 4 }, (c) => c.stamp(`_${name}_${c.frame}`, 0, 0))
}
const liaFace = (key, o, front, back) => sprite(`face_${key}`, { w: 56, h: 56, outline: "k" }, (c) => {
  if (back) back(c)
  lidFace(c, o)
  if (front) front(c)
})

// —— Strojvedoucí: starý chlap z jediné soupravy, montérky DPP, oranžová vesta, baterka, ruce od oleje ——
const LIA_STROJVEDOUCI = {
  build: "stout", height: 46, age: "old", skin: "normal",
  hair: { style: "short", col: "grey" }, beard: "moustache",
  hat: { kind: "cap", col: "navy" },
  top: { kind: "overalls", col: "navy" }, shirtCol: "ash",
  over: { kind: "reflective", col: "orange" },
  shoes: { kind: "boots", col: "dark" },
  items: ["dirt"],
}
liaIdle("strojvedouci", LIA_STROJVEDOUCI, (c, g) => {
  const [hx, hy] = g.hand, [bx, by] = g.back
  // ruce od oleje: prsty černé, mastná šmouha na nohavici
  c.hline(hx, hy + 1, g.D.aw, "3"); c.px(hx + 1, hy, "K"); c.hline(bx, by + 1, g.D.aw, "k")
  c.px(g.cx - 3, g.hipY + 4, "N"); c.px(g.cx - 2, g.hipY + 5, "N"); c.px(g.cx - 3, g.hipY + 6, "N")
  // baterka za opaskem na zadním boku
  c.rect(g.cx + g.D.ww - 1, g.hipY - 3, 2, 5, "M"); c.px(g.cx + g.D.ww - 1, g.hipY - 3, "m"); c.hline(g.cx + g.D.ww - 1, g.hipY + 2, 2, "y")
  // opasek
  c.hline(g.cx - g.D.ww, g.hipY - 1, g.D.ww * 2 - 1, "H")
})
liaFace("strojvedouci", LIA_STROJVEDOUCI, (c) => {
  // olej na tváři a na límci, odznak DPP na čepici
  c.line(17, 33, 20, 31, "3"); c.px(21, 31, "4"); c.px(37, 33, "3")
  c.rect(24, 9, 4, 3, "M"); c.px(25, 10, "V")
  // baterka v kapse na prsou
  c.rect(10, 46, 3, 10, "M"); c.vline(10, 46, 10, "m"); c.hline(10, 46, 3, "y")
})

// —— Výpravčí: hubený stařík v modré uniformě ČD, červená čepice, plácačka; uniforma udržovaná, i když se rozpadá ——
const LIA_VYPRAVCI = {
  build: "thin", height: 48, age: "old", skin: "pale",
  hair: { style: "short", col: "white" },
  hat: { kind: "peaked", col: "red" },
  top: { kind: "suit", col: "navy" }, shirtCol: "grey", tieCol: "V",
  legs: { kind: "trousers", col: "navy" },
  shoes: { kind: "shoes", col: "dark" },
}
liaIdle("vypravci", LIA_VYPRAVCI, (c, g) => {
  const [hx, hy] = g.hand
  // plácačka: držadlo z ruky dolů, kotouč červený s bílým lemem
  c.line(hx, hy + 2, hx - 1, hy + 6, "H")
  c.circ(hx - 2, hy + 9, 3, "W"); c.circ(hx - 2, hy + 9, 2, "V"); c.px(hx - 3, hy + 8, "d")
  // zalátané koleno a záplata na lokti
  c.rect(g.cx - 4, g.kneeY - 1, 2, 2, "L"); c.px(g.cx - 3, g.kneeY - 1, "S")
  c.px(g.fx, g.sy + 7, "L")
  // třepený spodek saka
  c.px(g.cx - 3, g.hipY + 3, "."); c.px(g.cx + 2, g.hipY + 3, ".")
})
liaFace("vypravci", LIA_VYPRAVCI, (c) => {
  // plácačka zvednutá v ruce vlevo dole
  c.line(8, 56, 10, 47, "H"); c.line(9, 56, 11, 47, "h")
  c.circ(10, 41, 7, "W"); c.circ(10, 41, 5, "V"); c.circ(9, 40, 2, "d"); c.ring(10, 41, 5, "D")
  c.rect(5, 50, 6, 6, "8"); c.hline(5, 50, 6, "0")
  // pečlivě sešitá záplata na rameni
  c.rect(42, 46, 6, 5, "L"); for (let x = 42; x < 48; x += 2) { c.px(x, 46, "w"); c.px(x, 50, "w") }
})

// —— Trafikantka: starší paní ve vínovém svetru, šedá trvalá, brýle na řetízku, igelitka s jízdenkami ——
const LIA_TRAFIKANTKA = {
  build: "stout", height: 44, female: true, age: "old", skin: "normal",
  hair: { style: "perm", col: "grey" },
  top: { kind: "sweater", col: "wine" },
  legs: { kind: "skirt", col: "brown" },
  shoes: { kind: "shoes", col: "leather" },
  items: ["glasses"],
}
liaIdle("trafikantka", LIA_TRAFIKANTKA, (c, g) => {
  const [hx, hy] = g.hand
  // řetízek od brýlí za ucho a na krk
  c.px(g.hx + 5, g.hy + 4, "Y"); c.px(g.hx + 5, g.hy + 6, "Y"); c.px(g.hx + 4, g.hy + 8, "Y")
  // pletený vzor: pruh s kosočtverci přes prsa
  for (let x = g.cx - g.D.sw + 1; x < g.cx + g.D.sw - 1; x += 2) c.px(x, g.sy + 4, "r")
  // igelitka v ruce: bílá s vybledlým modrým pruhem, nahoře lístky
  c.vline(hx, hy + 2, 2, "w")
  c.rect(hx - 2, hy + 4, 6, 8, "w"); c.vline(hx + 3, hy + 4, 8, "v"); c.vline(hx - 2, hy + 4, 8, "W")
  c.hline(hx - 2, hy + 8, 5, "b"); c.px(hx - 1, hy + 3, "y"); c.px(hx + 1, hy + 2, "y"); c.px(hx + 1, hy + 3, "Y")
})
liaFace("trafikantka", LIA_TRAFIKANTKA, (c) => {
  // řetízek od obrouček za krk
  for (let i = 0; i <= 8; i++) c.px(38 + Math.round(i / 3), 23 + i * 2, i % 2 ? "Y" : "y")
  for (let i = 0; i <= 5; i++) c.px(17 - Math.round(i / 2), 24 + i * 2, i % 2 ? "Y" : "y")
  // pletený vzor na svetru
  for (let x = 6; x < 52; x += 4) { c.px(x, 49, "r"); c.px(x + 1, 48, "r"); c.px(x + 1, 50, "r"); c.px(x + 2, 49, "r") }
  // igelitka v rohu, z ní koukají jízdenky
  c.rect(42, 44, 12, 12, "w"); c.vline(53, 44, 12, "v"); c.hline(42, 50, 11, "b")
  c.rect(44, 41, 3, 4, "y"); c.rect(48, 40, 3, 5, "Y"); c.px(49, 42, "k")
})

// —— Robin: mladý zarostlý chlap v kápi z celty, luk z lyže, šípy z vařeček, maskáče ——
const LIA_ROBIN = {
  build: "thin", height: 47, age: "young", skin: "tan",
  hair: { style: "short", col: "brown" }, beard: "full",
  hat: { kind: "hood", col: "olive" },
  top: { kind: "jacket", col: "olive", long: true },
  legs: { kind: "trousers", col: { d: "G", m: "e", l: "C" } },
  shoes: { kind: "boots", col: "leather" },
  items: ["dirt"],
}
liaIdle("robin", LIA_ROBIN, (c, g) => {
  const [hx, hy] = g.hand
  // vařečky v toulci za pravým ramenem
  ;[[16, -6], [18, -8], [19, -5]].forEach(([x, dy]) => { c.vline(x, g.sy + dy + 2, 5, "h"); c.rect(x, g.sy + dy, 2, 2, "u") })
  c.line(g.cx - g.D.sw + 1, g.sy, g.cx + g.D.sw, g.hipY - 1, "H")
  // maskáčové fleky na nohavicích
  ;[[0, 8], [2, 11], [-1, 14], [5, 9], [6, 13], [1, 17], [4, 16]].forEach(([dx, dy]) => { const x = g.cx - 3 + dx, y = g.hipY + dy; if (!c.is(x, y, ".")) c.px(x, y, dy % 2 ? "H" : "g") })
  // luk z lyže: prohnutá, zahnutá špička nahoře, tětiva
  const lx = hx - 2
  c.line(lx + 1, hy - 14, lx - 1, hy - 4, "V"); c.line(lx - 1, hy - 4, lx - 1, hy + 6, "V"); c.line(lx - 1, hy + 6, lx + 1, hy + 14, "V")
  c.px(lx + 2, hy - 15, "V"); c.px(lx + 3, hy - 15, "D"); c.px(lx - 1, hy - 1, "y"); c.px(lx - 1, hy + 1, "y")
  c.line(lx + 2, hy - 13, lx + 2, hy + 13, "x")
})
liaFace("robin", LIA_ROBIN, (c) => {
  // plnovous znovu přes obličej v kápi: kápě překreslí tvář
  for (let y = 31; y <= 43; y++) for (let x = 14; x <= 38; x++) {
    if (!c.is(x, y, "4iu") || (y < 33 && x < 29)) continue
    c.px(x, y, x > 30 ? "K" : (x + y) % 5 === 0 ? "h" : "H")
  }
  c.hline(19, 35, 5, "k"); c.hline(18, 33, 6, "H"); c.hline(19, 32, 4, "h")
  // luk z lyže před ramenem vlevo: zahnutá špička, odřená barva, tětiva
  c.line(4, 56, 5, 38, "V", 2); c.line(5, 38, 8, 33, "V", 2); c.px(9, 32, "D"); c.px(10, 32, "D")
  c.line(4, 50, 4, 42, "d"); c.rect(4, 46, 2, 3, "y")
  c.line(10, 34, 10, 56, "x")
  // popruh toulce přes hruď
  c.line(38, 40, 16, 56, "H", 2)
}, (c) => {
  // vařečky z toulce za ramenem
  ;[[44, 22], [48, 18], [51, 24]].forEach(([x, y]) => { c.line(x, y + 4, x - 4, 48, "h", 2); c.ellipse(x, y + 1, 2, 3, "u"); c.px(x - 1, y, "4") })
})

// —— Dispečerka: přísná paní kolem padesáti, šedá uniforma DPP, sluchátka s mikrofonem, desky, drdol ——
const LIA_DISPECERKA = {
  build: "normal", height: 45, female: true, age: "adult", skin: "pale",
  hair: { style: "bun", col: { d: "x", m: "3", l: "v" } },
  top: { kind: "jacket", col: { d: "B", m: "P", l: "p" } }, shirtCol: "white",
  legs: { kind: "skirt", col: "dark" },
  shoes: { kind: "shoes", col: "dark" },
  items: ["clipboard"],
  mouthCol: "R",
}
liaIdle("dispecerka", LIA_DISPECERKA, (c, g) => {
  // sluchátka: oblouk přes hlavu, mušle u ucha, mikrofon k ústům
  c.hline(g.hx + 2, g.hy - 2, 4, "A"); c.vline(g.hx + 5, g.hy - 1, 3, "A")
  c.rect(g.hx + 4, g.hy + 3, 2, 3, "k"); c.px(g.hx + 4, g.hy + 3, "a")
  c.line(g.hx + 4, g.hy + 6, g.hx + 1, g.hy + 7, "A"); c.px(g.hx, g.hy + 7, "M")
  // odznak DPP na klopě, kabel od sluchátek do kapsy
  c.px(g.cx + 2, g.sy + 3, "V"); c.vline(g.cx + 3, g.sy + 1, 6, "A")
})
liaFace("dispecerka", LIA_DISPECERKA, (c) => {
  // sluchátka: oblouk přes temeno, mušle přes ucho, mikrofon k ústům
  c.line(18, 11, 28, 7, "A", 2); c.line(28, 7, 37, 14, "A", 2); c.line(37, 14, 37, 20, "A", 2)
  c.ellipse(37, 26, 3, 5, "k"); c.ellipse(37, 26, 2, 4, "a"); c.px(36, 24, "B")
  c.line(35, 31, 24, 36, "A"); c.line(35, 32, 24, 37, "k"); c.rect(21, 35, 3, 3, "M"); c.px(21, 35, "m")
  // kabel dolů, odznak DPP na klopě
  c.line(38, 31, 41, 40, "A"); c.rect(14, 46, 4, 3, "V"); c.hline(14, 46, 4, "d")
  // desky s evidencí v rohu
  c.rect(42, 42, 12, 14, "H"); c.rect(43, 43, 10, 13, "w"); c.hline(44, 46, 8, "x"); c.hline(44, 49, 7, "x"); c.hline(44, 52, 8, "x"); c.rect(46, 41, 4, 2, "M")
})

// —— Revizor: tmavá uniforma, služební čepice s odznakem, kleštičky na šňůrce, brašna, výraz, že má pravdu ——
const LIA_REVIZOR = {
  build: "normal", height: 47, age: "adult", skin: "normal",
  hair: { style: "short", col: "black" },
  hat: { kind: "peaked", col: "dark" },
  top: { kind: "jacket", col: "dark" }, shirtCol: "grey",
  legs: { kind: "trousers", col: "dark" },
  shoes: { kind: "shoes", col: "dark" },
  items: ["bag"], bagCol: "leather",
}
liaIdle("revizor", LIA_REVIZOR, (c, g) => {
  // odznak na prsou, kleštičky na šňůrce od krku
  c.rect(g.cx - 4, g.sy + 3, 2, 2, "y"); c.px(g.cx - 3, g.sy + 4, "Y")
  c.line(g.cx, g.sy, g.cx + 1, g.sy + 6, "w"); c.rect(g.cx, g.sy + 7, 2, 3, "m"); c.px(g.cx + 1, g.sy + 9, "M")
  // samolibý úšklebek: koutek nahoru
  c.px(g.hx + 3, g.hy + 5, "4")
})
liaFace("revizor", LIA_REVIZOR, (c) => {
  // povytažené obočí a úšklebek
  c.hline(16, 19, 4, "k"); c.hline(16, 20, 4, "i"); c.px(15, 20, "k")
  c.px(24, 33, "3"); c.px(25, 32, "3"); c.px(18, 34, "i")
  // odznak a kleštičky na šňůrce
  c.rect(10, 46, 5, 6, "Y"); c.rect(11, 47, 3, 4, "y"); c.px(12, 48, "O")
  c.line(32, 40, 36, 50, "w"); c.rect(34, 50, 5, 3, "m"); c.line(34, 53, 33, 56, "M"); c.line(38, 53, 39, 56, "M"); c.px(36, 51, "k")
})

// —— Václav na směně: jen portrét. Kartonové brnění natřené na bronz, plechová přilba, rudý plášť ——
const LIA_VACLAV = {
  build: "normal", age: "adult", skin: "normal",
  hair: { style: "short", col: "brown" }, beard: "full",
  hat: { kind: "helmet", col: "metal" },
  top: { kind: "shirt", col: { d: "O", m: "Y", l: "y" } },
  items: ["dirt"],
}
liaFace("vaclav", LIA_VACLAV, (c) => {
  // plášť přes pravé rameno
  c.poly([38, 42, 50, 44, 56, 56, 40, 56], "V"); c.line(40, 43, 44, 56, "D"); c.line(50, 44, 55, 56, "D")
  // pancíř: prolis kartonu, okraj natržený, vylézá hnědý karton a vlnka
  c.line(16, 40, 18, 56, "O"); c.line(34, 40, 32, 56, "O")
  c.hline(4, 48, 10, "O"); c.hline(36, 50, 4, "O")
  c.poly([6, 52, 12, 50, 14, 56, 4, 56], "C"); for (let x = 5; x < 14; x += 2) c.vline(x, 53, 3, "e")
  c.px(26, 46, "C"); c.px(27, 46, "c"); c.px(22, 53, "C")
  // nýty z připínáčků
  ;[[8, 45], [14, 44], [24, 43], [30, 44]].forEach(([x, y]) => c.px(x, y, "m"))
  // přilba: promáčklina, nýty a nánosník
  c.px(17, 10, "M"); c.px(18, 11, "W"); c.hline(14, 19, 3, "m")
  c.rect(20, 19, 3, 10, "m"); c.vline(22, 19, 10, "M")
  // rez po okrajích přilby a šmouhy na pancíři, barva z kartonu oprýskaná
  ;[[12, 18], [13, 19], [40, 17], [39, 18], [33, 9], [34, 10]].forEach(([x, y]) => c.px(x, y, "u"))
  c.px(20, 28, "U"); c.vline(12, 42, 4, "O"); c.vline(28, 49, 4, "O")
})
