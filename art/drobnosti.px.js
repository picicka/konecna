// Drobnosti na zemi (WorldScene.placeClutter): smetí, které leží naplocho a nic neblokuje, a velké skvrny, které
// rozbíjejí opakování dlažby. Všechno malé, špinavé a bez obrysu, ať to splyne se zemí; kreslí se pod stíny domů.
// Varianty dělá semínko. Přidat druh = nový sprite smeti_<druh>_<n> a zapsat ho do CLUTTER ve world.js.
const litter = (name, w, h, seed, draw) => sprite(name, { w, h }, (c) => draw(c, c.rng(seed)))
// kousek naplocho v izometrii: kosodélník du × dv od bodu (x, y)
const flat = (c, x, y, du, dv, col) => c.poly([x, y, x + du, y - du / 2, x + du + dv, y - du / 2 + dv / 2, x + dv, y + dv / 2].map(Math.round), col)

// shluk: body rozházené kolem středu, hustší uprostřed (smetí leží v hromádkách, ne rovnoměrně)
const spot = (rng, w, h, spread = 0.36) => [Math.round(w / 2 + (rng() + rng() - 1) * w * spread), Math.round(h / 2 + (rng() + rng() - 1) * h * spread)]
// prach pod hromádkou: zrno v oválu, ať kousky nelétají ve vzduchu
const dust = (c, w, h, col, dens, seed) => c.clip((x, y) => ((x - w / 2) / (w * 0.42)) ** 2 + ((y - h / 2) / (h * 0.4)) ** 2 < 1, () => c.noise(0, 0, w, h, col, dens, seed))

// suť: hromádka kamenů a kusů omítky se stínem, kolem světlý prach
;[1, 2, 3].forEach((n) => litter(`smeti_sut_${n}`, 96, 48, 100 + n, (c, rng) => {
  dust(c, 96, 48, "C", 0.22, 500 + n); dust(c, 96, 48, "x", 0.12, 510 + n)
  for (let i = 0; i < 26 + n * 5; i++) {
    const [x, y] = spot(rng, 96, 48), sw = 2 + Math.floor(rng() * 5), sh = 2 + Math.floor(rng() * 3)
    c.rect(x, y + sh - 1, sw, 2, "k"); c.rect(x, y, sw, sh, ["q", "W", "w", "c", "v"][Math.floor(rng() * 5)]); c.rect(x, y, sw, 1, "W")
  }
}))
// cihly vypadlé ze zdi s cihlovým prachem
;[1, 2].forEach((n) => litter(`smeti_cihly_${n}`, 80, 42, 120 + n, (c, rng) => {
  dust(c, 80, 42, "R", 0.2, 520 + n)
  for (let i = 0; i < 8 + n * 3; i++) {
    const [x, y] = spot(rng, 80, 42)
    c.rect(x, y + 3, 8, 2, "k"); c.rect(x, y, 8, 4, rng() < 0.5 ? "R" : "r"); c.rect(x, y, 8, 1, "8")
  }
}))
// papíry a noviny: světlé listy naplocho, některé zmuchlané
;[1, 2, 3].forEach((n) => litter(`smeti_papiry_${n}`, 80, 42, 140 + n, (c, rng) => {
  for (let i = 0; i < 4 + n * 2; i++) {
    const [x, y] = spot(rng, 80, 42, 0.4)
    if (rng() < 0.3) { c.rect(x, y + 3, 5, 1, "k"); c.rect(x, y, 5, 3, "W"); c.px(x + 1, y + 1, "v") }
    else { const du = 7 + rng() * 5, dv = 5 + rng() * 4; flat(c, x + 1, y + 1, du, dv, "k"); flat(c, x, y, du, dv, rng() < 0.6 ? "W" : "w"); c.line(x + 2, y, x + 5, y - 1, "v") }
  }
}))
// střepy pod vybitými okny
;[1, 2].forEach((n) => litter(`smeti_strepy_${n}`, 64, 32, 160 + n, (c, rng) => {
  for (let i = 0; i < 40 + n * 12; i++) { const [x, y] = spot(rng, 64, 32, 0.4); c.px(x, y, ["l", "L", "W", "l", "I"][Math.floor(rng() * 5)]); if (rng() < 0.25) c.px(x + 1, y, "l") }
}))
// plechovky a lahve
;[1, 2].forEach((n) => litter(`smeti_plechovky_${n}`, 56, 28, 180 + n, (c, rng) => {
  for (let i = 0; i < 3 + n * 2; i++) {
    const [x, y] = spot(rng, 56, 28)
    c.rect(x, y + 3, 6, 1, "k"); c.rect(x, y, 6, 3, ["m", "V", "u", "j", "y"][Math.floor(rng() * 5)]); c.px(x, y, "W")
  }
}))
// prkna a latě
;[1, 2].forEach((n) => litter(`smeti_prkna_${n}`, 96, 50, 200 + n, (c, rng) => {
  for (let i = 0; i < 2 + n; i++) {
    const x = 8 + Math.floor(rng() * 24), y = 20 + Math.floor(rng() * 14), len = 34 + Math.floor(rng() * 24), up = rng() < 0.5
    const x1 = x + len, y1 = up ? y - len / 2 + 6 : y + len / 2 - 14
    c.line(x, y + 2, Math.round(x1), Math.round(y1) + 2, "k", 3); c.line(x, y, Math.round(x1), Math.round(y1), rng() < 0.5 ? "h" : "u", 3)
  }
}))
// trsy suchého plevele ze spár
;[1, 2, 3].forEach((n) => litter(`smeti_plevel_${n}`, 56, 30, 220 + n, (c, rng) => {
  for (let t = 0; t < 2 + n; t++) {
    const [tx, ty] = spot(rng, 56, 14, 0.4)
    c.rect(tx - 4, ty + 15, 9, 1, "3")
    for (let i = 0; i < 7; i++) { const x = tx - 5 + Math.floor(rng() * 10), hgt = 3 + Math.floor(rng() * 8); c.vline(x, ty + 15 - hgt, hgt, ["g", "4", "Y", "g", "C"][Math.floor(rng() * 5)]); if (rng() < 0.4) c.px(x + (rng() < 0.5 ? 1 : -1), ty + 15 - hgt, "y") }
  }
}))
// spadané listí: zrno v teplých hnědých
;[1, 2].forEach((n) => litter(`smeti_listi_${n}`, 112, 56, 260 + n, (c, rng) => {
  dust(c, 112, 56, "U", 0.2, 530 + n); dust(c, 112, 56, "O", 0.14, 540 + n); dust(c, 112, 56, "u", 0.1, 550 + n)
  for (let i = 0; i < 14; i++) { const [x, y] = spot(rng, 112, 56); c.rect(x, y, 2, 1, "Y") }
}))
// hadry a igelity
;[1, 2].forEach((n) => litter(`smeti_hadry_${n}`, 64, 34, 280 + n, (c, rng) => {
  for (let i = 0; i < 1 + n; i++) {
    const [x, y] = spot(rng, 64, 34, 0.25), col = ["V", "b", "Q", "o"][Math.floor(rng() * 4)], du = 9 + rng() * 8, dv = 6 + rng() * 6
    flat(c, x + 1, y + 2, du, dv, "k"); flat(c, x, y, du, dv, col); c.line(x + 2, y + 1, Math.round(x + du), Math.round(y - du / 2 + 3), "k")
  }
}))
// kaluž: hladká tmavá hladina s mokrým okrajem a pár odlesky (žádné zrno, voda má čistý obrys)
;[1, 2].forEach((n) => litter(`smeti_kaluz_${n}`, 96, 46, 240 + n, (c, rng) => {
  const lobes = Array.from({ length: 3 + n }, () => [48 + (rng() - 0.5) * 38, 23 + (rng() - 0.5) * 12, 12 + rng() * 12, 5 + rng() * 5])
  const inside = (x, y, g = 0) => lobes.some(([lx, ly, rx, ry]) => ((x - lx) / (rx + g * 2)) ** 2 + ((y - ly) / (ry + g)) ** 2 < 1)
  c.clip((x, y) => inside(x, y, 1), () => c.rect(0, 0, 96, 46, "a"))     // mokrá dlažba kolem
  c.clip((x, y) => inside(x, y), () => c.rect(0, 0, 96, 46, "b"))        // okraj hladiny ve stínu
  c.clip((x, y) => inside(x, y, -1), () => c.rect(0, 0, 96, 46, "L"))    // hladina zrcadlí šedé nebe
  c.clip((x, y) => inside(x, y, -2), () => { for (let i = 0; i < 3; i++) { const x = 28 + Math.floor(rng() * 34), y = 17 + Math.floor(rng() * 11); c.rect(x, y, 5 + Math.floor(rng() * 7), 1, "l") } })
}))
// velké skvrny: jen zrno bez plné plochy, tmavé (mastnota, saze, vlhko) a světlé (prach, vápno)
const stain = (name, w, h, seed, col, dens) => sprite(name, { w, h }, (c) => {
  const rng = c.rng(seed), cx = w / 2, cy = h / 2
  const lobes = Array.from({ length: 7 }, () => [cx + (rng() - 0.5) * w * 0.6, cy + (rng() - 0.5) * h * 0.5, w * (0.1 + rng() * 0.16), h * (0.12 + rng() * 0.18)])
  const inside = (x, y, g = 1) => lobes.some(([lx, ly, rx, ry]) => ((x - lx) / (rx * g)) ** 2 + ((y - ly) / (ry * g)) ** 2 < 1)
  c.clip((x, y) => inside(x, y, 1.4) && !inside(x, y), () => c.noise(0, 0, w, h, col, dens * 0.4, seed + 3))
  c.clip((x, y) => inside(x, y) && !inside(x, y, 0.6), () => c.noise(0, 0, w, h, col, dens * 0.75, seed + 5))
  c.clip((x, y) => inside(x, y, 0.6), () => c.noise(0, 0, w, h, col, dens, seed + 7))
})
stain("skvrna_tma_1", 320, 150, 301, "k", 0.42); stain("skvrna_tma_2", 240, 110, 302, "k", 0.36); stain("skvrna_tma_3", 400, 180, 303, "A", 0.5)
stain("skvrna_prach_1", 300, 140, 311, "C", 0.3); stain("skvrna_prach_2", 220, 100, 312, "e", 0.4)
stain("skvrna_rez_1", 180, 84, 321, "U", 0.3)

// kouř nad sudem s ohněm (WorldScene.placeLights, částice): řídký obláček ve dvou tónech popela
;[1, 2, 3].forEach((n) => sprite(`kour_${n}`, { w: 12, h: 10 }, (c) => {
  c.clip((x, y) => ((x - 6) / 6) ** 2 + ((y - 5) / 5) ** 2 < 1, () => { c.noise(0, 0, 12, 10, "x", 0.5, 700 + n); c.noise(0, 0, 12, 10, "P", 0.25, 710 + n) })
}))
