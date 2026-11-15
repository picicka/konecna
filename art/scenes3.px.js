// Obrázky epilogu (EPILOG v src/script.js): ke každé větě snímek toho, co se v ní popisuje. Je to bližší záběr než
// ostatní filmečky: plátno 320 × 180 (CutsceneScene ho zvětší na celou šířku, tedy čtyřikrát), pozadí je výřez
// filmečku místa a vpředu stojí postavy a věci ze hry ve své velikosti, takže postava zabere třetinu výšky obrazu.
const epZem = (c, y = 134, col = "A", edge = "a") => { c.rect(0, y, 320, 180 - y, col); c.rect(0, y, 320, 2, edge); c.noise(0, y + 2, 320, 180 - y - 2, "k", 0.08, 7); c.noise(0, y + 2, 320, 180 - y - 2, "B", 0.03, 9) }
const epVoda = (c, y) => { c.rect(0, y, 320, 180 - y, "X"); for (let v = y + 5; v < 180; v += 7) for (let x = (v * 5) % 34; x < 320; x += 40) c.hline(x, v, 13, v % 14 ? "Z" : "J") }
const epStin = (c, x, y = 167, w = 14) => c.ellipse(x, y, w, 3, "k")
const epKdo = (c, name, x, y = 104) => { epStin(c, x + 12, y + 63); c.stamp(name, x, y) }
const epGlow = (c, x, y, r) => { c.circ(x, y, r, "F"); c.noise(x - r, y - r, r * 2, r * 2, "A", 0.55, 31, "F"); c.circ(x, y, Math.round(r * 0.55), "F"); c.noise(x - r, y - r, r * 2, r * 2, "f", 0.25, 33, "F"); c.circ(x, y, 4, "f"); c.circ(x, y, 2, "W") }

// Mourek je doma: strážmistr hlídá Muzeum Policie, kotě spí ve vitríně s pouty, před muzeem Tatra.
sprite("_ep_mourek", { w: 320, h: 180 }, (c) => {
  c.stamp("cs_nusle", -40, -80); epZem(c)
  c.stamp("tatra_vb", -4, 92)
  c.rect(196, 148, 96, 26, "H"); c.rect(196, 148, 96, 3, "h"); c.rect(192, 82, 104, 68, "S"); c.rect(196, 86, 96, 60, "n")
  c.line(204, 90, 222, 140, "L"); c.line(210, 90, 228, 140, "L")
  c.circ(214, 106, 7, "m"); c.circ(214, 106, 5, "n"); c.circ(230, 110, 7, "m"); c.circ(230, 110, 5, "n"); c.hline(220, 107, 6, "M")
  c.ellipse(264, 132, 17, 9, "x"); for (let x = 251; x < 279; x += 5) c.vline(x, 125, 11, "P")
  c.circ(249, 130, 7, "x"); c.poly([243, 125, 245, 119, 248, 124], "x"); c.poly([250, 124, 253, 119, 255, 125], "x"); c.hline(245, 131, 4, "k"); c.px(251, 131, "k"); c.line(279, 137, 271, 142, "x", 2)
  c.rect(222, 154, 44, 11, "W"); c.text(226, 157, "MOUREK", "k", { scale: 1, gap: 2 })
  epKdo(c, "_policista_0", 150)
  c.rect(176, 128, 8, 10, "W"); c.hline(177, 131, 6, "k"); c.hline(177, 134, 5, "k")
})

// Hodiny na Hlaváku jdou: výpravčí zvedá ruku, souprava jede.
sprite("_ep_hodiny", { w: 320, h: 180 }, (c) => {
  c.stamp("cs_metro", -150, -90); epZem(c, 138, "P", "q")
  c.stamp("station_clock", 196, 50)
  epKdo(c, "_vypravci_0", 120, 106)
  c.line(138, 128, 148, 108, "b", 3); c.rect(146, 102, 5, 6, "i")
})

// Robinovi psi chodí na tržiště: Fanta jim dává guláš.
sprite("_ep_psi", { w: 320, h: 180 }, (c) => {
  c.stamp("cs_city", -160, -96); epZem(c)
  epKdo(c, "_robin_0", 40); epKdo(c, "_fanta_0", 250)
  c.stamp("dog", 78, 140); c.stamp("dog", 118, 146, { flip: "x" }); c.stamp("dog_lie", 150, 154)
  c.ellipse(216, 166, 22, 5, "k"); c.rect(198, 138, 38, 28, "S"); c.rect(198, 138, 8, 28, "s"); c.ellipse(217, 138, 19, 5, "V"); c.ellipse(217, 138, 15, 3, "o")
  c.line(228, 136, 246, 120, "m", 2)
  for (const [x, y] of [[208, 124], [218, 112], [212, 98]]) { c.circ(x, y, 5, "x"); c.px(x + 3, y - 3, "v") }
})

// Reproduktor u Jindřišské řve až k vodě.
sprite("_ep_rozhlas", { w: 320, h: 180 }, (c) => {
  c.stamp("cs_city", -100, -96); epZem(c)
  c.stamp("reproduktor_prazdny", 170, 58)
  for (let r = 22; r < 100; r += 16) for (let t = -0.7; t <= 0.7; t += 0.03) { const x = Math.round(214 + Math.cos(t) * r), y = Math.round(80 + Math.sin(t) * r + r * 0.25); c.px(x, y, "f"); c.px(x + 1, y, "F") }
  epKdo(c, "_dispecerka_0", 90)
  c.rect(116, 130, 4, 10, "S"); c.circ(118, 128, 3, "m")
})

// Václav slezl z podstavce a vodí prohlídky po střechách.
sprite("_ep_vaclav", { w: 320, h: 180 }, (c) => {
  c.stamp("cs_city", -220, -110)
  c.poly([0, 150, 90, 118, 220, 126, 320, 112, 320, 180, 0, 180], "D"); c.poly([0, 150, 90, 118, 112, 180, 0, 180], "d")
  for (let y = 132; y < 180; y += 8) c.line(112, y, 320, y - 12, "k")
  for (let x = 124; x < 320; x += 13) c.line(x, 124, x + 14, 180, "k")
  c.noise(0, 112, 320, 68, "r", 0.05, 21, "D"); c.rect(276, 74, 24, 44, "R"); c.rect(272, 70, 32, 6, "r")
  c.stamp("_vaclav_fig", 110, 56)
  c.stamp("_pani_0", 176, 62); c.stamp("_velvyslanec_0", 204, 60); c.stamp("_trafikantka_0", 234, 58)
  c.ellipse(158, 122, 10, 4, "k"); c.rect(150, 110, 17, 11, "M"); c.ellipse(158, 110, 8, 3, "y"); c.px(156, 109, "W")
})

// Apoštolové zase chodí, Orlojník prodává přesný čas loďkařům.
sprite("_ep_orloj", { w: 320, h: 180 }, (c) => {
  c.stamp("cs_staromak", 0, -70); epVoda(c, 138)
  c.stamp("ostrov_lodka", 150, 128); c.stamp("_orlojnik_0", 186, 88)
  c.stamp("_kuracka_0", 270, 106)
  c.rect(108, 96, 62, 24, "H"); c.rect(110, 98, 58, 20, "W"); c.text(113, 101, "PRESNY CAS", "k"); c.text(121, 110, "1 JIZDENKA", "V"); c.vline(138, 120, 30, "H")
})

// Žárovka na Kampě svítí každou noc, na zdi jediné slovo.
sprite("_ep_zarovka", { w: 320, h: 180 }, (c) => {
  c.stamp("cs_most", -160, -120); epZem(c, 140)
  c.rect(20, 44, 280, 96, "P"); c.noise(20, 44, 280, 96, "p", 0.2, 5, "P"); c.rect(20, 44, 280, 3, "q")
  for (let y = 60; y < 140; y += 14) c.hline(20, y, 280, "A")
  c.text(74, 84, "PROUD", "W", { scale: 8, gap: 2 })
  c.line(160, 0, 160, 40, "k"); epGlow(c, 160, 50, 30)
  epKdo(c, "_mlynar_0", 36, 108)
  for (const x of [222, 244, 268]) { c.rect(x, 136, 13, 38, "k"); c.circ(x + 6, 130, 7, "k") }
})

// Trabant na nohách chodí po Nerudovce a nadává.
sprite("_ep_trabant", { w: 320, h: 180 }, (c) => {
  c.stamp("cs_malastrana", 0, -60); epZem(c, 140, "P", "q")
  c.stamp("trabant", 214, 92)
  for (const [x, y, r] of [[202, 152, 7], [186, 142, 9], [168, 128, 11], [148, 114, 8]]) { c.circ(x, y, r, "x"); c.noise(x - r, y - r, r * 2, r * 2, "v", 0.3, x, "x") }
  for (let i = 0; i < 4; i++) c.text(60 + i * 20, 96 - i * 12, ["!", "#", "?", "!"][i], "W", { scale: 3 })
})

// Trafikantce přišla z Hradu odpověď.
sprite("_ep_duchod", { w: 320, h: 180 }, (c) => {
  c.stamp("cs_city", -160, -96); epZem(c)
  c.stamp("kiosk", 150, 46)
  epKdo(c, "_trafikantka_0", 100)
  c.rect(126, 124, 18, 12, "W"); c.line(126, 124, 135, 131, "v"); c.line(144, 124, 135, 131, "v"); c.rect(138, 126, 4, 4, "V")
})

// Vyhlídka Na Opyši: průvodkyně vodí skupiny, zatím přišla jedna.
sprite("_ep_vyhlidka", { w: 320, h: 180 }, (c) => {
  c.stamp("cs_opys", -160, -130)
  c.rect(0, 146, 320, 34, "P"); c.rect(0, 142, 320, 5, "q"); for (let x = 8; x < 320; x += 30) c.rect(x, 124, 6, 20, "p"); c.rect(0, 120, 320, 5, "q")
  c.stamp("_pruvodkyne_0", 110, 100); c.line(130, 122, 152, 100, "i", 2)
  c.stamp("_pani_0", 196, 102)
})

// Dopis do Brna: kde je Brno, neví nikdo.
sprite("_ep_brno", { w: 320, h: 180 }, (c) => {
  c.stamp("cs_city", -40, -96); epZem(c, 140, "P", "q")
  c.rect(196, 62, 5, 108, "M"); c.rect(190, 168, 17, 4, "A")
  const sipka = (y, text, left, col) => { const x = left ? 112 : 201; c.poly(left ? [x + 84, y, x + 10, y, x, y + 9, x + 10, y + 18, x + 84, y + 18] : [x, y, x + 74, y, x + 84, y + 9, x + 74, y + 18, x, y + 18], col); c.text(x + (left ? 14 : 5), y + 6, text, "k", { gap: 2 }) }
  sipka(66, "HRAD 0.4 KM", false, "W"); sipka(88, "KAMPA 0.6 KM", true, "W"); sipka(110, "BRNO ? ? ?", false, "y")
  epStin(c, 142, 169); c.stamp("hero", 130, 106)
  c.rect(156, 128, 15, 10, "W"); c.rect(166, 129, 4, 4, "V")
})

// Prázdná krabička nejde ke dnu: bóje Kanceláře kanálu.
sprite("_ep_boje", { w: 320, h: 180 }, (c) => {
  c.stamp("cs_vysehrad", -260, -90); epVoda(c, 112)
  c.rect(120, 122, 46, 26, "k"); c.rect(122, 124, 42, 7, "S"); c.rect(154, 134, 6, 3, "E")
  for (const r of [34, 50, 68]) for (let t = 0; t < Math.PI * 2; t += 0.05) if (Math.sin(t) > -0.2) c.px(Math.round(143 + Math.cos(t) * r), Math.round(150 + Math.sin(t) * r * 0.25), "J")
  c.vline(143, 96, 26, "H"); c.poly([144, 96, 164, 102, 144, 108], "V")
  c.stamp("lodka", 226, 132); c.stamp("_admiral_0", 262, 86)
})

// Spodní třetinu obrazu ve hře zakrývá okno s textem, proto se celý záběr posouvá o 42 bodů nahoru a pod ním zůstává
// jen tmavá zem (kreslí se jako sprite _ep_* a do scény se otiskne výš).
for (const name of ["ep_mourek", "ep_hodiny", "ep_psi", "ep_rozhlas", "ep_vaclav", "ep_orloj", "ep_zarovka", "ep_trabant", "ep_duchod", "ep_vyhlidka", "ep_brno", "ep_boje"]) scene(name, { w: 320, h: 180 }, (c) => { c.rect(0, 0, 320, 180, "k"); c.stamp(`_${name}`, 0, -42); c.rect(0, 138, 320, 42, "k") })
