// Obrázky k filmečkům 640 × 360 (plátno 1280 × 720 je zobrazí 2×). Noční Praha po pádu a nástupiště metra.
// Silueta: Hradčany s katedrálou vlevo, Petřín, za ním zlomený Nuselák, Národní muzeum, Žižkovská věž vpravo spadlá (leží přes Ohradu).
const skyline = (c) => {
  c.grad(0, 0, 640, 360, "Nn", "v", 0.6)
  c.noise(0, 0, 640, 200, "W", 0.015, 3)
  // Hradčany: dlouhá hmota hradu, katedrála se dvěma věžemi a středovou; na Hradě se svítí (jediné světlo).
  c.rect(0, 184, 220, 60, "k"); c.rect(40, 160, 120, 28, "k"); c.rect(76, 120, 10, 48, "k"); c.rect(104, 120, 10, 48, "k"); c.rect(88, 140, 20, 28, "k")
  c.poly([76, 120, 81, 96, 86, 120], "k"); c.poly([104, 120, 109, 96, 114, 120], "k"); c.poly([88, 140, 98, 116, 108, 140], "k")
  c.rect(60, 172, 4, 4, "f"); c.rect(140, 170, 4, 4, "f")
  // Nuselák v dálce za Petřínem a muzeem: nosník na pilířích, uprostřed zlomený, konce visí dolů
  c.rect(300, 194, 86, 4, "a"); c.poly([386, 194, 392, 198, 388, 204, 386, 198], "a")
  c.rect(410, 196, 120, 4, "a"); c.poly([410, 196, 404, 204, 402, 210, 408, 200], "a")
  for (const x of [322, 362, 440, 500]) c.poly([x - 4, 198, x + 4, 198, x + 2, 244, x - 2, 244], "a")
  // Petřín s rozhlednou
  c.poly([180, 244, 280, 192, 380, 244], "k"); c.rect(276, 140, 4, 56, "k"); c.poly([268, 196, 278, 140, 288, 196], "k")
  // Národní muzeum uprostřed vpředu, kupole
  c.rect(400, 200, 180, 44, "k"); c.rect(472, 168, 36, 36, "k"); c.circ(490, 168, 18, "k"); c.rect(406, 184, 20, 20, "k"); c.rect(554, 184, 20, 20, "k")
  // Žižkovská věž leží: šikmý tubus od pravého okraje k zemi, hlava u země.
  c.line(636, 120, 560, 236, "k", 8); c.rect(548, 226, 24, 18, "k"); c.rect(600, 160, 14, 10, "k")
  // Město: střechy, domy bez světel, dole hladina vody (Vltava teče jinudy).
  c.rect(0, 244, 640, 116, "N")
  for (let x = 0; x < 640; x += 28) c.rect(x, 232 + ((x * 7) % 18), 20, 40, "k")
  c.rect(0, 300, 640, 60, "X"); c.noise(0, 300, 640, 60, "Z", 0.08, 5); for (let x = 0; x < 640; x += 64) c.hline(x + (x % 3) * 5, 310 + (x % 5) * 8, 30, "J")
}
scene("cs_city", { w: 640, h: 360 }, (c) => { skyline(c) }, glow("f", { r: 8, strength: 0.5 }))

// Nástupiště: tmavá klenba, obklad, jediná souprava s rozsvícenými okny, cedule KONEČNÁ.
scene("cs_metro", { w: 640, h: 360 }, (c) => {
  c.rect(0, 0, 640, 360, "N")
  c.ellipse(320, 230, 360, 190, "n"); c.rect(0, 230, 640, 130, "n")
  // obklad stěny: pásy hliníkových panelů s tmavými spárami
  for (let y = 60; y < 230; y += 24) c.hline(0, y, 640, "S")
  for (let x = 0; x < 640; x += 48) c.vline(x, 60, 170, "S")
  // nástupiště a hrana
  c.rect(0, 250, 640, 110, "P"); c.rect(0, 250, 640, 4, "q"); c.rect(0, 248, 640, 2, "y")
  // souprava vlevo: šedý vůz s červeným pruhem a žlutými okny
  c.rect(40, 150, 420, 100, "M"); c.rect(40, 190, 420, 10, "V"); c.rect(40, 236, 420, 14, "S")
  for (let x = 56; x < 440; x += 40) { c.rect(x, 160, 26, 26, "f"); c.rect(x + 2, 162, 22, 22, "y") }
  c.rect(460, 150, 20, 100, "S"); c.rect(464, 160, 12, 24, "f")
  // cedule KONEČNÁ: tmavá tabule, bílý text, červený pruh
  c.rect(500, 90, 120, 36, "k"); c.rect(502, 92, 116, 32, "A"); c.text(508, 100, "KONECNA", "W"); c.rect(502, 118, 116, 4, "V")
  // jediná zářivka svítí
  c.rect(300, 40, 60, 4, "I")
}, glow("fI", { r: 10, strength: 0.6 }))
