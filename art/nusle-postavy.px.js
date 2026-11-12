// Nuselák: postavy, zvířata a drobné rekvizity místa (Nuselský most přes zatopené údolí Botiče). Postavy kreslí sada
// lide.px.js (lidPerson, lidFace) a lide-b.px.js (libIdle), stání má 4 snímky 26 × 66 jako ostatní, počátek dole
// uprostřed. Zvířata a rekvizity jsou vlastní kresby; listy (sheet) zakládá main.px.js.

// —— Policista bez pravomocí: starý strážmistr z Muzea Policie, uniforma po tátovi velká, bloček s pokutami, které nikdo
// nezaplatí; z kapsy saka kouká kotě. Hrdý a trochu k smíchu. Varianta policista_kote drží kotě v náručí. ——
const NUS_UNIFORMA = { d: "G", m: "T", l: "t" }       // vybledlá zelenošedá
const LIB_POLICISTA = {
  build: "stout", height: 47, age: "old", skin: "pale",
  hair: { style: "short", col: "grey" }, beard: "moustache",
  hat: { kind: "peaked", col: NUS_UNIFORMA },
  top: { kind: "jacket", col: NUS_UNIFORMA, long: true }, shirtCol: "khaki",
  legs: { kind: "trousers", col: NUS_UNIFORMA },
  shoes: { kind: "shoes", col: "dark" },
  items: ["clipboard"],
}
// kotě: zrzavá hlavička s ušima, dvě oči
const nusKote = (c, x, y) => {
  c.rect(x, y, 4, 3, "o"); c.px(x, y - 1, "o"); c.px(x + 3, y - 1, "o"); c.px(x + 1, y, "y")
  c.px(x + 1, y + 1, "k"); c.px(x + 3, y + 1, "k"); c.px(x + 2, y + 2, "D")
}
libIdle("policista", LIB_POLICISTA, null, (c, g) => {
  const { cx, sy, hipY, hy, fx } = g
  // odznak na prsou a na čepici, nárameníky, opasek s pouzdrem bez pistole
  c.px(cx + 2, sy + 3, "Y"); c.px(cx + 3, sy + 3, "y"); c.px(9, hy - 1, "y")
  c.hline(cx - 6, sy, 2, "Y"); c.hline(cx + 5, sy, 2, "O")
  c.hline(cx - 6, hipY - 1, 13, "A"); c.rect(cx + 4, hipY - 1, 3, 4, "A"); c.px(cx + 4, hipY, "k")
  // propiska v bločku
  c.line(fx + 6, sy + 8, fx + 8, sy + 11, "b")
  // kotě z kapsy saka (vpravo dole)
  nusKote(c, cx + 2, hipY + 1)
})
sprite("face_policista", { w: 56, h: 56, outline: "k" }, (c) => {
  lidFace(c, LIB_POLICISTA)
  c.rect(36, 48, 3, 3, "Y"); c.px(37, 48, "y")
})
// stejný muž, bloček schovaný, kotě v náručí (po úkolu)
const LIB_POLICISTA_KOTE = { ...LIB_POLICISTA, items: [] }
libIdle("policista_kote", LIB_POLICISTA_KOTE, null, (c, g) => {
  const { cx, sy, hipY, hy } = g
  c.px(cx + 2, sy + 3, "Y"); c.px(cx + 3, sy + 3, "y"); c.px(9, hy - 1, "y")
  c.hline(cx - 6, sy, 2, "Y"); c.hline(cx + 5, sy, 2, "O")
  c.hline(cx - 6, hipY - 1, 13, "A")
  // náruč: předloktí přes břicho, na něm kotě s ocasem dolů
  c.rect(cx - 7, sy + 9, 11, 3, "T"); c.hline(cx - 7, sy + 9, 11, "t"); c.rect(cx + 3, sy + 9, 3, 3, "i")
  c.rect(cx - 5, sy + 5, 6, 4, "o"); c.hline(cx - 5, sy + 5, 6, "y")
  nusKote(c, cx - 7, sy + 3)
  c.vline(cx + 1, sy + 8, 4, "U")
})

// —— Lanař: vybírá za přechod po laně přes zlom mostu. Postroj, stočené lano přes rameno, karabiny, pracovní rukavice,
// na rukávu páska tržiště (Fantova žlutá s černým F). ——
const LIB_LANAR = {
  build: "thin", height: 46, skin: "tan",
  hair: { style: "short", col: "brown" }, beard: "stubble",
  hat: { kind: "helmet", col: "red" },
  top: { kind: "jacket", col: "olive" },
  legs: { kind: "trousers", col: "ash" },
  shoes: { kind: "boots", col: "leather" },
  items: ["rope", "dirt"],
}
libIdle("lanar", LIB_LANAR, null, (c, g) => {
  const { cx, sy, hipY, hand: [x, y], D } = g
  // postroj: popruhy přes ramena a kolem pasu a stehen
  c.vline(cx - 3, sy, hipY - sy, "A"); c.vline(cx + 2, sy, hipY - sy, "A")
  c.hline(cx - D.ww, hipY - 1, D.ww * 2 + 1, "k"); c.hline(cx - 4, hipY + 3, 3, "A"); c.hline(cx + 1, hipY + 3, 3, "A")
  // karabiny na pase
  c.px(cx - 2, hipY, "m"); c.px(cx - 2, hipY + 1, "W"); c.px(cx, hipY, "M"); c.px(cx, hipY + 1, "m"); c.px(cx + 2, hipY, "m")
  // páska tržiště na předním rukávu
  c.rect(cx - D.sw - 1, sy + 4, 2, 2, "y"); c.px(cx - D.sw - 1, sy + 4, "k")
  // rukavice
  c.rect(x, y, 2, 2, "H"); c.px(x, y, "h")
  // kladka na laně v přední ruce
  c.rect(x - 1, y + 2, 3, 3, "M"); c.px(x, y + 3, "k"); c.vline(x + 1, y + 5, 4, "C")
})
sprite("face_lanar", { w: 56, h: 56, outline: "k" }, (c) => {
  lidFace(c, LIB_LANAR)
  c.line(10, 42, 22, 56, "A", 2); c.line(40, 42, 34, 56, "A", 2)
})

// —— Kormidelník: loďkař, který vozí z údolí pod mostem na Staromák. Pláštěnka, kapitánská čepice, záchranná vesta,
// bidlo s hákem. ——
const LIB_KORMIDELNIK = {
  build: "normal", height: 47, age: "adult", skin: "tan",
  hair: { style: "short", col: "black" }, beard: "beard",
  hat: { kind: "captain", col: "grey" },
  top: { kind: "coat", col: "rubber" },
  over: { kind: "lifevest", col: "orange" },
  legs: { kind: "trousers", col: "navy" },
  shoes: { kind: "rubber", col: "rubber" },
  items: ["hook"],
}
libIdle("kormidelnik", LIB_KORMIDELNIK, null, (c, g) => {
  const { cx, sy, hipY } = g
  // mokrá pláštěnka: lesk po švech, kapky
  c.px(cx - 4, sy + 6, "1"); c.px(cx - 5, hipY + 4, "1"); c.px(cx + 3, hipY + 6, "j")
  // píšťalka na šňůrce
  c.px(cx - 1, sy + 2, "W"); c.px(cx - 2, sy + 3, "m")
})
sprite("face_kormidelnik", { w: 56, h: 56, outline: "k" }, (c) => lidFace(c, LIB_KORMIDELNIK))

// —— Hrdinka na laně: visí za ruce (bokem, tvář doleva), přehmatává, nohy se houpou. Ruce jsou nahoře uprostřed:
// lano vede vodorovně řádkem y = 3, úchop je v bodě (12, 3) plátna 26 × 66 (s obrysem). ——
anim("hero_lano", { w: 24, h: 64, outline: "k", fps: 4, frames: 2 }, (c) => {
  const f = c.frame ?? 0
  const sw = f ? 2 : -2                    // houpání nohou
  const coat = { d: "b", m: "L", l: "l" }, skin = { d: "4", m: "i", l: "0" }, hair = { d: "k", m: "K", l: "3" }
  // lano (kreslí se i ve hře, tady jen kus pod rukama)
  c.hline(0, 2, 24, "C"); c.hline(0, 3, 24, "e")
  // ruce: přední dál dopředu podle snímku
  const fhx = f ? 8 : 10, bhx = f ? 14 : 13
  c.rect(fhx, 1, 3, 3, skin.m); c.px(fhx, 1, skin.l); c.rect(bhx, 1, 3, 3, skin.d)
  // paže k ramenům (rukávy kabátu)
  c.line(fhx + 1, 4, 10, 15, coat.m, 2); c.line(bhx + 1, 4, 13, 15, coat.d, 2)
  // hlava mezi pažemi, tvář doleva, vlasy dlouhé dozadu
  const hx = 8, hy = 8
  c.rect(hx, hy, 7, 8, skin.m); c.vline(hx + 6, hy, 8, skin.d); c.px(hx, hy + 2, skin.l)
  c.px(hx + 1, hy + 3, "k"); c.px(hx + 3, hy + 3, "k"); c.hline(hx + 1, hy + 6, 2, skin.d)
  c.hline(hx, hy - 1, 7, hair.m); c.hline(hx + 1, hy - 2, 5, hair.m); c.px(hx + 1, hy - 1, hair.l)
  c.rect(hx + 4, hy, 3, 4, hair.m); c.rect(hx + 5, hy + 4, 3, 7, hair.m); c.vline(hx + 7, hy, 11, hair.d)
  // trup v kabátě, natažený
  c.poly([8, 16, 16, 16, 16, 38, 7, 38], coat.m)
  c.vline(8, 16, 22, coat.l); c.vline(15, 16, 22, coat.d); c.vline(11, 18, 18, coat.d)
  c.hline(8, 28, 8, coat.d)
  // taška na popruhu visí šikmo
  c.line(9, 17, 15, 27, "U"); c.rect(14, 26 + (f ? 1 : 0), 6, 6, "U"); c.hline(14, 26 + (f ? 1 : 0), 6, "u"); c.px(16, 29 + (f ? 1 : 0), "Y")
  // nohy visí a houpou se
  const leg = (x0, dx, k) => { c.line(x0, 38, x0 + dx, 55, k, 3) }
  leg(9, sw, "B"); leg(13, -sw / 2, "a")
  c.rect(8 + sw, 55, 4, 5, "U"); c.px(7 + sw, 59, "U"); c.rect(12 - sw / 2, 55, 4, 5, "H"); c.px(11 - sw / 2, 59, "H")
})

// —— Lachtan v zatopeném údolí: hlava a hřbet nad hladinou, kolem vlnky. 3 snímky: pohoupnutí a otočení hlavy.
// Počátek dole uprostřed = hladina. ——
anim("lachtan", { w: 44, h: 26, fps: 3, frames: 3 }, (c) => {
  const f = c.frame ?? 0, bob = f === 1 ? -1 : 0, Y = 20
  // hřbet
  c.ellipse(26, Y + bob, 12, 4, "K"); c.ellipse(25, Y - 1 + bob, 10, 2, "H"); c.hline(18, Y - 3 + bob, 10, "h")
  // krk a hlava: kulatá hlava s krátkým čenichem, ve 3. snímku otočená k divákovi
  c.poly([13, Y + bob, 16, Y - 9 + bob, 23, Y - 9 + bob, 21, Y + bob], "K"); c.vline(16, Y - 8 + bob, 7, "H")
  const hx = 18, hy = Y - 13 + bob
  c.ellipse(hx, hy, 5, 4, "K"); c.ellipse(hx - 1, hy - 2, 3, 1, "h")
  if (f === 2) { c.px(hx - 2, hy, "k"); c.px(hx + 2, hy, "k"); c.rect(hx - 1, hy + 2, 3, 2, "H"); c.px(hx, hy + 2, "k"); c.px(hx - 3, hy + 3, "v"); c.px(hx + 3, hy + 3, "v") }
  else { c.px(hx - 2, hy - 1, "k"); c.rect(hx - 7, hy, 4, 3, "H"); c.px(hx - 7, hy, "k"); c.px(hx - 8, hy + 2, "v"); c.px(hx - 6, hy + 3, "v") }
  // vlnky kolem
  c.hline(8, Y + 1, 30, "Z"); c.hline(12 + f, Y + 3, 8, "J"); c.hline(28 - f, Y + 3, 9, "J"); c.hline(6, Y + 5, 6, "Z"); c.hline(34, Y + 5, 6, "Z")
  c.hline(14, Y + 1, 3, "J"); c.hline(34, Y + 1, 3, "J")
})

// —— Lachtan na kusu betonu, který plave po hladině: leží, ploutve, hlava nahoře a dole (2 snímky). ——
anim("lachtan_lezi", { w: 60, h: 36, fps: 2, frames: 2 }, (c) => {
  const f = c.frame ?? 0
  // kra betonu v izometrii, kus výztuže, hladina okolo
  c.poly([6, 26, 30, 18, 54, 24, 30, 32], "P"); c.poly([6, 26, 30, 32, 30, 35, 6, 29], "x"); c.poly([30, 32, 54, 24, 54, 27, 30, 35], "A")
  c.line(10, 25, 14, 18, "U"); c.line(47, 23, 50, 16, "U")
  c.hline(2, 31, 12, "J"); c.hline(44, 30, 14, "J"); c.hline(20, 35, 20, "Z")
  // tělo
  c.ellipse(32, 22, 13, 4, "K"); c.ellipse(31, 21, 11, 2, "H"); c.hline(25, 19, 12, "h")
  c.poly([42, 22, 50, 20, 49, 24], "K")             // zadní ploutve
  c.poly([26, 23, 22, 27, 28, 25], "K")             // přední ploutev
  // hlava: zvednutá, nebo položená
  if (f === 0) { c.poly([20, 22, 17, 13, 24, 13, 25, 21], "K"); c.ellipse(19, 10, 5, 4, "K"); c.ellipse(18, 8, 3, 1, "h"); c.rect(12, 10, 4, 3, "H"); c.px(12, 10, "k"); c.px(17, 9, "k"); c.px(11, 12, "v") }
  else { c.ellipse(19, 20, 6, 4, "K"); c.ellipse(18, 18, 3, 1, "h"); c.rect(11, 20, 4, 3, "H"); c.px(11, 20, "k"); c.px(16, 19, "k"); c.px(10, 22, "v") }
})

// —— Racek: sedí na zábradlí nebo na troskách (jen pták), 2 snímky: otočí hlavu. ——
anim("racek", { w: 14, h: 18, outline: "k", fps: 2, frames: 2 }, (c) => {
  const f = c.frame ?? 0
  c.ellipse(7, 10, 5, 4, "W"); c.poly([4, 8, 13, 9, 12, 13, 5, 13], "v"); c.hline(5, 9, 7, "x"); c.px(12, 10, "k"); c.px(13, 11, "k")
  c.circ(4, 6, 3, "W")
  if (f === 0) { c.px(3, 5, "k"); c.hline(0, 6, 2, "y"); c.px(0, 7, "o") }
  else { c.px(5, 5, "k"); c.hline(6, 6, 2, "y"); c.px(7, 7, "o") }
  c.vline(6, 14, 3, "o"); c.vline(8, 14, 3, "o"); c.hline(5, 17, 2, "o"); c.hline(8, 17, 2, "o")
})
// —— Racek v letu: křídla nahoru a dolů. ——
anim("racek_let", { w: 22, h: 12, outline: "k", fps: 4, frames: 2 }, (c) => {
  const f = c.frame ?? 0
  c.ellipse(11, 6, 4, 2, "W"); c.px(6, 6, "W"); c.px(5, 6, "y"); c.hline(14, 6, 2, "w")
  if (f === 0) { c.line(10, 5, 3, 1, "v", 2); c.line(12, 5, 19, 1, "w", 2); c.px(3, 1, "x"); c.px(19, 1, "x") }
  else { c.line(10, 6, 3, 9, "v", 2); c.line(12, 6, 19, 9, "w", 2); c.px(3, 9, "x"); c.px(19, 9, "x") }
})

// —— Kotě: zrzavé, sedí, mrská ocasem (2 snímky). ——
anim("kote", { w: 12, h: 12, outline: "k", fps: 3, frames: 2 }, (c) => {
  const f = c.frame ?? 0
  c.ellipse(6, 8, 3, 3, "o"); c.px(5, 7, "y"); c.hline(4, 11, 5, "U")
  c.circ(4, 4, 2, "o"); c.px(2, 2, "o"); c.px(5, 2, "o"); c.px(3, 4, "k"); c.px(5, 4, "k"); c.px(4, 5, "D")
  c.hline(5, 6, 2, "U")
  if (f === 0) { c.line(9, 10, 11, 6, "o"); c.px(11, 5, "U") } else { c.line(9, 10, 11, 9, "o"); c.px(11, 8, "U") }
})

// —— Vrak policejní Tatry 603 (Veřejná bezpečnost): bílá s modrým pruhem, nápis VB, maják na střeše rozbitý,
// pneumatiky splasklé. Kreslí vehicle() z props.px.js, nápis a maják se přidají přes razítko. ——
vehicle("_tatra_vb_base", { len: 90, wid: 34, h: 15, cab: 13, cabFrom: 0.32, cabTo: 0.74, win: 9, col: ["w", "W", "v"], stripe: "b", rust: 12, seed: 23 })
sprite("tatra_vb", { w: 90 + 34 + 24, h: (90 + 34) / 2 + 15 + 13 + 20 + 6 }, (c) => {
  const L = 90, Wd = 34, w = L + Wd + 24, hh = (L + Wd) / 2 + 15 + 13 + 20
  c.stamp("_tatra_vb_base", 0, 6)
  const cx = w / 2, cy = hh - 6 - (L + Wd) / 4 + 6
  const G = (u, d, z) => [Math.round(cx + u + d), Math.round(cy - u / 2 + d / 2 - z)]
  // nápis VB na boku (modře do bílé)
  const [tx, ty] = G(-8, Wd / 2, 9)
  ;["101", "101", "110", "101", "110"].forEach((row, y) => [...row].forEach((ch, x) => { if (ch === "1") c.px(tx + x, ty + y + Math.round(-x / 2), "n") }))
  ;["110", "101", "110", "101", "110"].forEach((row, y) => [...row].forEach((ch, x) => { if (ch === "1") c.px(tx + 5 + x, ty + y - 2 + Math.round(-x / 2), "n") }))
  // maják na střeše: modrý kryt rozbitý, kus visí
  const [bx, by] = G(4, 0, 15 + 13)
  c.rect(bx - 3, by - 4, 6, 4, "b"); c.px(bx - 2, by - 4, "l"); c.px(bx + 1, by - 3, "k"); c.px(bx + 4, by - 1, "b")
  // rozbitá světla vpředu
  const [lx, ly] = G(-L / 2, Wd / 2 - 6, 8); c.px(lx, ly, "k"); c.px(lx + 1, ly, "x")
})
