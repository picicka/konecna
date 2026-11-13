// Rekvizity Hlaváku v měřítku 128 × 64 (hrdinka 64 bodů). Počátek všech je dole uprostřed (Phaser origin 0.5, 1),
// ve hře se kotví na spodní vrchol dlaždice, stejně jako postavy.

// Lípa na podzim po pádu: kmen, větve rekurzivně, na koncích větví shluky listí (olivová, okrová), pod ní stín.
const linden = (name, seed, leaves = true) => sprite(name, { w: 132, h: 200 }, (c) => {
  const rng = c.rng(seed)
  c.ellipse(66, 194, 30, 6, "A")
  c.rect(62, 120, 8, 76, "H"); c.rect(62, 120, 3, 76, "K"); c.rect(58, 186, 16, 10, "H")
  const tips = []
  const branch = (x0, y0, len, dir, depth) => {
    const x1 = Math.round(x0 + Math.cos(dir) * len), y1 = Math.round(y0 - Math.sin(dir) * len)
    c.line(x0, y0, x1, y1, depth < 2 ? "H" : "K", Math.max(1, 4 - depth))
    if (depth < 4) for (let i = 0; i < 2; i++) branch(x1, y1, len * 0.68, dir + (rng() - 0.5) * 1.3, depth + 1)
    else tips.push([x1, y1])
  }
  branch(66, 124, 40, Math.PI / 2, 0); branch(66, 140, 30, Math.PI / 2 + 0.8, 1); branch(66, 136, 30, Math.PI / 2 - 0.8, 1)
  if (leaves) tips.forEach(([x, y], i) => {
    const r = 6 + Math.floor(rng() * 6)
    c.circ(x, y + 2, r, "G"); c.circ(x - 1, y, r - 2, i % 3 ? "g" : "e"); c.circ(x - 2, y - 2, Math.max(2, r - 5), i % 4 ? "g" : "C")
  })
})
linden("tree_a", 5); linden("tree_b", 9); linden("tree_c", 13); linden("tree_bare", 17, false)

// Pražská litinová lampa, zhaslá; dřík s prstenci, lucerna se stříškou.
sprite("lamp", { w: 24, h: 128 }, (c) => {
  c.rect(6, 118, 12, 10, "S"); c.rect(9, 30, 6, 90, "S"); c.rect(10, 30, 2, 90, "s")
  ;[50, 80, 110].forEach((y) => c.rect(7, y, 10, 3, "s"))
  c.rect(4, 10, 16, 22, "S"); c.rect(6, 12, 12, 18, "n"); c.rect(7, 13, 3, 14, "L")
  c.poly([2, 10, 12, 0, 22, 10], "S"); c.rect(11, 0, 2, 3, "s")
})

// Lavička podél osy a (na obrazovce stoupá doprava nahoru): litinové nohy, tři latě sedáku, opěradlo.
sprite("bench", { w: 72, h: 52 }, (c) => {
  const L = (x0, y0, col, w = 2) => c.line(x0, y0, x0 + 56, y0 - 28, col, w)
  c.line(10, 50, 10, 38, "k", 3); c.line(62, 24, 62, 12, "k", 3); c.line(14, 46, 14, 34, "k", 2); c.line(58, 26, 58, 14, "k", 2)
  L(8, 38, "h", 3); L(10, 42, "H", 3); L(12, 46, "h", 2)
  L(6, 26, "h", 3); L(6, 30, "H", 2)
  c.line(8, 38, 6, 26, "k", 2); c.line(64, 10, 62, 0, "k", 2)
})

// Sud s ohněm: rezavý sud s obručemi, plameny tři snímky, záře.
anim("barrel_fire", { w: 40, h: 72, frames: 4, fps: 8 }, (c) => {
  const k = c.phase * Math.PI * 2
  c.ellipse(20, 68, 16, 4, "A")
  c.rect(6, 34, 28, 34, "U"); c.rect(6, 34, 6, 34, "u"); c.rect(28, 34, 6, 34, "R")
  ;[38, 50, 62].forEach((y) => c.rect(6, y, 28, 2, "k"))
  c.ellipse(20, 34, 14, 4, "k")
  const h = 22 + Math.round(Math.sin(k) * 4), h2 = 16 + Math.round(Math.cos(k * 2) * 4)
  c.poly([8, 34, 14, 34 - h2, 20, 34 - h, 26, 34 - h2 + 4, 32, 34], "F")
  c.poly([12, 34, 17, 34 - h2 + 4, 21, 34 - h + 6, 26, 34], "f")
  c.px(18 + Math.round(Math.sin(k) * 3), 34 - h - 4, "f")
}, glow("fF", { r: 10, strength: 0.6 }))


// Trafika: zelený kiosek (1 dlaždice), okénko s jízdenkami, cedule PNS (Poštovní novinová služba) v rovině stěny, stříška.
sprite("kiosk", { w: 132, h: 150 }, (c) => {
  const B = [66, 146]
  const R = (u, v) => [B[0] + u, B[1] - u / 2 - v], L = (u, v) => [B[0] - u, B[1] - u / 2 - v]
  const q = (f, u0, u1, v0, v1) => [...f(u0, v0), ...f(u1, v0), ...f(u1, v1), ...f(u0, v1)]
  c.poly(q(R, 0, 56, 0, 80), "Q"); c.poly(q(L, 0, 56, 0, 80), "2")
  c.poly(q(R, 0, 56, 0, 6), "S"); c.poly(q(L, 0, 56, 0, 6), "S")
  // okénko s jízdenkami a pultem
  c.poly(q(R, 10, 46, 30, 62), "k"); c.poly(q(R, 12, 44, 32, 60), "n")
  for (let i = 0; i < 5; i++) c.poly(q(R, 14 + i * 6, 18 + i * 6, 34, 42), i % 2 ? "y" : "Y")
  c.poly(q(R, 8, 48, 26, 30), "h")
  // cedule
  c.poly(q(R, 4, 52, 60, 79), "W"); // písmo 5 × 7 (FONT57 z buildings.px.js) ve dvojnásobku: ve 3 × 5 se N nedalo přečíst
  ;[..."PNS"].forEach((ch, i) => { for (let gy = 0; gy < 7; gy++) for (let gx = 0; gx < 5; gx++) if (FONT57[ch][gy * 5 + gx] === "1") c.poly(q(R, 11 + i * 12 + gx * 2, 13 + i * 12 + gx * 2, 62 + (6 - gy) * 2, 64 + (6 - gy) * 2), "k") })
  // stříška
  const top = (u, w) => [B[0] + u - w, B[1] - u / 2 - w / 2 - 80]
  c.poly([...top(-6, -6), ...top(62, -6), ...top(62, 62), ...top(-6, 62)], "j")
  c.poly([...top(-6, -6), ...top(62, -6), ...R(62, 84), ...R(-6, 84)], "Q")
})

// Pes ze Sherwoodu: hubený, šedohnědý, dva snímky (vrčí, vyje).
anim("dog", { w: 48, h: 36, outline: "k", fps: 4 }, (c) => {
  c.rect(10, 12, 26, 10, "x"); c.rect(10, 12, 26, 3, "v")
  c.rect(34, 6, 10, 9, "x"); c.rect(42, 10, 5, 4, "v"); c.px(38, 8, "k"); c.rect(35, 3, 3, 4, "x")
  c.rect(12, 22, 3, 10, "x"); c.rect(18, 22, 3, 10, "P"); c.rect(28, 22, 3, 10, "x"); c.rect(33, 22, 3, 10, "P")
  c.line(10, 14, 3, 6, "x", 2)
}, frame(), frame(rect(43, 13, 4, 2, "W"), rect(34, 3, 3, 3, "x")))

// Pes, který dal pokoj: leží s hlavou na tlapách, ocas občas plácne o zem (2 snímky).
anim("dog_lie", { w: 48, h: 22, outline: "k", fps: 1 }, (c) => {
  c.rect(10, 9, 26, 9, "x"); c.rect(10, 9, 26, 3, "v")
  c.rect(34, 10, 10, 7, "x"); c.rect(42, 13, 5, 4, "v"); c.px(38, 12, "k"); c.rect(35, 7, 3, 3, "x")
  c.rect(36, 18, 10, 2, "P"); c.rect(14, 18, 8, 2, "P")
}, frame(line(10, 14, 2, 18, "x", 2)), frame(line(10, 14, 3, 10, "x", 2)))

// Nádražní hodiny na sloupu: dvojitý ciferník, stojí na 14:37.
sprite("station_clock", { w: 40, h: 150 }, (c) => {
  c.rect(17, 40, 6, 110, "S"); c.rect(18, 40, 2, 110, "s"); c.rect(12, 142, 16, 8, "S")
  c.rect(6, 26, 28, 4, "S")
  c.circ(20, 16, 15, "S"); c.circ(20, 16, 13, "W")
  for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; c.px(20 + Math.round(Math.sin(a) * 11), 16 - Math.round(Math.cos(a) * 11), "k") }
  const hour = (14.62 % 12) / 12 * Math.PI * 2, minute = 37 / 60 * Math.PI * 2
  c.line(20, 16, 20 + Math.round(Math.sin(hour) * 6), 16 - Math.round(Math.cos(hour) * 6), "k", 2)
  c.line(20, 16, 20 + Math.round(Math.sin(minute) * 10), 16 - Math.round(Math.cos(minute) * 10), "k")
  c.px(20, 16, "V")
})

// Stánek tržiště: dřevěný pult s plachtou, zboží v bednách (konzervy, hodinky, láhve).
sprite("stall", { w: 132, h: 130 }, (c) => {
  const B = [66, 126]
  const R = (u, v) => [B[0] + u, B[1] - u / 2 - v], L = (u, v) => [B[0] - u, B[1] - u / 2 - v]
  const q = (f, u0, u1, v0, v1) => [...f(u0, v0), ...f(u1, v0), ...f(u1, v1), ...f(u0, v1)]
  c.poly(q(R, 0, 60, 0, 34), "h"); c.poly(q(L, 0, 30, 0, 34), "H")
  for (let v = 8; v < 34; v += 8) c.poly(q(R, 0, 60, v, v + 1), "H")
  for (let i = 0; i < 6; i++) { const [x, y] = R(4 + i * 9, 40); c.rect(x, y - 4, 6, 8, ["m", "y", "Q", "V", "l", "Y"][i]) }
  c.line(...R(0, 34), ...R(0, 84), "k", 2); c.line(...R(60, 34), ...R(60, 84), "k", 2); c.line(...L(30, 34), ...L(30, 84), "k", 2)
  const top = (u, w) => [B[0] + u - w, B[1] - u / 2 - w / 2 - 84]
  c.poly([...top(-4, -4), ...top(64, -4), ...top(64, 34), ...top(-4, 34)], "V")
  for (let u = 4; u < 64; u += 16) c.poly([...top(u, -4), ...top(u + 8, -4), ...top(u + 8, 34), ...top(u, 34)], "W")
  c.poly([...top(-4, -4), ...top(64, -4), ...R(64, 78), ...R(-4, 78)], "D")
})

// Oblouk zřícené nádražní haly napříč osou b přes n dlaždic: dvě nohy na středech krajních dlaždic, nýtovaný oblouk.
// Počátek ve hře: levá noha (ripLeft v atlasu se počítá z rozměrů, viz WorldScene.placeHalls).
const RIB_H = 300
const rib = (n) => sprite("rib_" + n, { w: 64 * (n - 1) + 24, h: 32 * (n - 1) + RIB_H + 12 }, (c) => {
  const x0 = 12, y0 = 32 * (n - 1) + RIB_H + 10 - 32 * (n - 1), dx = 64 * (n - 1), dy = 32 * (n - 1)
  const pt = (t) => { const h = RIB_H * Math.pow(Math.sin(Math.PI * t), 0.55); return [Math.round(x0 + dx * t), Math.round(y0 + dy * t - h)] }
  let prev = pt(0)
  for (let i = 1; i <= 60; i++) { const p = pt(i / 60); c.line(prev[0], prev[1], p[0], p[1], "S", 6); c.line(prev[0], prev[1] - 2, p[0], p[1] - 2, "s", 2); prev = p }
  // příčky mezi pásy oblouku
  for (let i = 3; i < 60; i += 4) { const p = pt(i / 60); c.px(p[0], p[1] + 1, "m") }
  // patky
  c.rect(x0 - 8, y0 - 6, 16, 8, "P"); c.rect(x0 + dx - 8, y0 + dy - 6, 16, 8, "P")
  // utržený kus skla visí z oblouku
  const g = pt(0.3); c.poly([g[0], g[1] + 3, g[0] + 10, g[1] + 6, g[0] + 4, g[1] + 26], "l"); c.line(g[0], g[1] + 3, g[0] + 4, g[1] + 26, "L")
})
rib(7)

// Vozidla podél osy a s objemem: osvětlená střecha, střední bok k +b, tmavé čelo k −a, rez, stín. Měřítko: dlaždice
// 7,5 m je 64 jednotek podél a, auto ~4,5 m se vejde do jízdního pruhu na magistrále (pruhy po 64 napříč).
// G(u, d, z): u podél, d napříč, z výška; počátek dole uprostřed = střed stopy.
function vehicle(name, o) {
  const L = o.len, Wd = o.wid, w = L + Wd + 24, hh = (L + Wd) / 2 + o.h + (o.cab ?? 0) + (o.extraTop ?? 0) + 20
  const [base, light, dark] = o.col
  sprite(name, { w, h: hh }, (c) => {
    const rng = c.rng(o.seed ?? 1)
    const cx = w / 2, cy = hh - 6 - (L + Wd) / 4
    const G = (u, d, z) => [cx + u + d, cy - u / 2 + d / 2 - z]
    const poly = (pts, col) => c.poly(pts.flat(), col)
    const box = (u0, u1, d0, d1, z0, z1, top, side, front) => {
      poly([G(u0, d1, z0), G(u1, d1, z0), G(u1, d1, z1), G(u0, d1, z1)], side)
      poly([G(u0, d0, z0), G(u0, d1, z0), G(u0, d1, z1), G(u0, d0, z1)], front)
      poly([G(u0, d0, z1), G(u1, d0, z1), G(u1, d1, z1), G(u0, d1, z1)], top)
    }
    const u0 = -L / 2, u1 = L / 2, d0 = -Wd / 2, d1 = Wd / 2, H = o.h
    poly([G(u0 - 4, d0, 0), G(u1 + 4, d0, 0), G(u1 + 8, d1 + 8, 0), G(u0, d1 + 8, 0)], "k")
    if (o.flipped) {
      // převrácené: podvozek nahoře (nápravy, výfuk, kola), střecha zmačkaná dole
      box(u0, u1, d0, d1, 0, H, "A", dark, "k")
      c.line(...G(u0 + 6, 0, H), ...G(u1 - 6, 0, H), "x", 2)
      ;[0.2, 0.8].forEach((k) => { c.line(...G(u0 + L * k, d0 + 3, H), ...G(u0 + L * k, d1 - 3, H), "x", 2); [d0 + 4, d1 - 4].forEach((d) => { const [x, y] = G(u0 + L * k, d, H + 4); c.ellipse(x, y, 6, 4, "k"); c.ellipse(x, y - 1, 3, 2, "x") }) })
      for (let i = 0; i < 6; i++) { const [x, y] = G(u0 + rng() * L, d1, rng() * H); c.rect(x, y, 4, 2, "U") }
      return
    }
    box(u0, u1, d0, d1, 4, H, light, base, dark)
    const cab = o.crushed ? Math.round((o.cab ?? 0) * 0.35) : (o.cab ?? 0)
    if (cab) {
      const c0 = u0 + L * o.cabFrom, c1 = u0 + L * o.cabTo
      box(c0, c1, d0 + 3, d1 - 3, H, H + cab, light, base, dark)
      for (let u = c0 + 3; u + o.win <= c1 - 2; u += o.win + 3) {
        const broken = o.burnt || rng() < 0.6
        poly([G(u, d1 - 3, H + 2), G(u + o.win, d1 - 3, H + 2), G(u + o.win, d1 - 3, H + cab - 2), G(u, d1 - 3, H + cab - 2)], broken ? "k" : "n")
        if (!broken) c.line(...G(u + 1, d1 - 3, H + cab - 3), ...G(u + 3, d1 - 3, H + 3), "l")
      }
      poly([G(c0, d0 + 5, H + 2), G(c0, d1 - 5, H + 2), G(c0, d1 - 5, H + cab - 2), G(c0, d0 + 5, H + cab - 2)], "k")
      if (o.crushed) for (let i = 0; i < 4; i++) c.line(...G(c0 + rng() * (c1 - c0), d0 + 3, H + cab), ...G(c0 + rng() * (c1 - c0), d1 - 3, H + cab), dark)
    }
    if (o.stripe) poly([G(u0, d1, H * 0.45), G(u1, d1, H * 0.45), G(u1, d1, H * 0.6), G(u0, d1, H * 0.6)], o.stripe)
    // rez nebo spáleniny
    for (let i = 0; i < (o.rust ?? 8); i++) {
      const u = u0 + 4 + rng() * (L - 12), z = 6 + rng() * (H - 8)
      poly([G(u, d1, z), G(u + 4 + rng() * 6, d1, z), G(u + 3, d1, z - 4), G(u - 1, d1, z - 3)], o.burnt ? (rng() < 0.5 ? "x" : "U") : (rng() < 0.5 ? "U" : "u"))
    }
    if (o.crushed) { c.line(...G(u0 + L * 0.4, d1, 6), ...G(u0 + L * 0.55, d1, H), "k", 2); c.line(...G(u0 + L * 0.55, d1, H), ...G(u0 + L * 0.7, d1, 8), "k") }
    ;(o.wheels ?? [0.18, 0.8]).forEach((k) => { const [x, y] = G(u0 + L * k, d1, 3); c.ellipse(x, y, o.wheelR ?? 6, (o.wheelR ?? 6) - 2, "k"); if (!o.burnt) c.ellipse(x, y, 2, 1, "x") })
    c.line(...G(u0, d1, 4), ...G(u1, d1, 4), "k")
    if (o.burnt) { const [x, y] = G(0, 0, H + cab); c.line(x - 10, y, x + 8, y - 6, "x"); c.rect(x - 4, y - 3, 8, 3, "A") }
    if (o.extra) o.extra(c, G, rng)
  })
}
// Auta (~4,5 m, vejdou se do pruhu): celé rezavé, ohořelé, zmačkané, převrácené.
vehicle("car_wreck_a", { len: 84, wid: 34, h: 16, cab: 14, cabFrom: 0.3, cabTo: 0.72, win: 9, col: ["x", "v", "P"], rust: 10, seed: 3 })
vehicle("car_wreck_b", { len: 80, wid: 34, h: 16, cab: 13, cabFrom: 0.28, cabTo: 0.7, win: 9, col: ["R", "r", "D"], rust: 12, seed: 5 })
vehicle("car_wreck_c", { len: 76, wid: 32, h: 15, cab: 13, cabFrom: 0.25, cabTo: 0.75, win: 8, col: ["T", "t", "S"], rust: 8, seed: 7 })
vehicle("car_wreck_burnt", { len: 82, wid: 34, h: 15, cab: 12, cabFrom: 0.3, cabTo: 0.72, win: 9, col: ["k", "A", "k"], rust: 14, burnt: true, seed: 9 })
vehicle("car_wreck_crushed", { len: 84, wid: 34, h: 13, cab: 14, cabFrom: 0.3, cabTo: 0.72, win: 9, col: ["e", "C", "3"], rust: 12, crushed: true, seed: 11 })
vehicle("car_wreck_flipped", { len: 82, wid: 34, h: 18, col: ["x", "v", "P"], flipped: true, seed: 13 })
// Autobus (bílý s červeným pruhem) a ohořelý.
vehicle("bus_wreck", { len: 190, wid: 42, h: 14, cab: 28, cabFrom: 0, cabTo: 1, win: 14, col: ["w", "W", "v"], stripe: "V", rust: 18, wheels: [0.12, 0.3, 0.82], seed: 15 })
vehicle("bus_wreck_burnt", { len: 190, wid: 42, h: 14, cab: 26, cabFrom: 0, cabTo: 1, win: 14, col: ["k", "A", "k"], stripe: "U", rust: 26, burnt: true, wheels: [0.12, 0.3, 0.82], seed: 17 })

// Vlaky na kolejích za nádražím (osa podél a, šířka ~3 m). Lokomotiva řady 363 „Eso“ v klasickém modrém nátěru ČSD
// se žlutým pruhem: skříň se dvěma stanovišti, na střeše dva polopantografy, na boku žaluzie a kulatá okénka.
const pantograph = (c, G, u, H) => { const p = [G(u, 0, H + 4), G(u + 10, 0, H + 18), G(u + 2, 0, H + 26), G(u + 14, 0, H + 26)]; c.line(...p[0], ...p[1], "S", 2); c.line(...p[1], ...p[2], "S", 2); c.line(...p[2], ...p[3], "m", 2) }
vehicle("loco_363", { len: 144, wid: 30, h: 40, col: ["b", "l", "n"], stripe: "y", rust: 6, wheels: [0.15, 0.32, 0.68, 0.85], wheelR: 5, seed: 21,
  extra: (c, G, rng) => {
    const L = 144, d1 = 15, u0 = -72
    // čelní okna stanoviště na obou koncích (čelo k −a), střecha šedá
    c.poly([...G(u0, -12, 26), ...G(u0, 12, 26), ...G(u0, 12, 36), ...G(u0, -12, 36)].flat ? [G(u0, -12, 26), G(u0, 12, 26), G(u0, 12, 36), G(u0, -12, 36)].flat() : [], "k")
    c.poly([G(u0, -15, 40), G(u0 + L, -15, 40), G(u0 + L, 15, 40), G(u0, 15, 40)].flat(), "s")
    // boční okna stanovišť, žaluzie a kulatá okénka
    ;[u0 + 4, u0 + L - 18].forEach((u) => c.poly([G(u, d1, 24), G(u + 14, d1, 24), G(u + 14, d1, 35), G(u, d1, 35)].flat(), "n"))
    for (let u = u0 + 30; u < u0 + 70; u += 5) c.line(...G(u, d1, 14), ...G(u, d1, 32), "n")
    ;[u0 + 82, u0 + 96, u0 + 110].forEach((u) => { const [x, y] = G(u, d1, 26); c.circ(x, y, 3, "n") })
    pantograph(c, G, u0 + 22, 40); pantograph(c, G, u0 + L - 40, 40)
  } })
// Osobní vůz ČSD: tmavě zelený, řada oken, šedá střecha; vagon ohořelý; nákladní vůz hnědý; vykolejený vůz nakřivo (níž).
const coach = (name, col, burnt, seed) => vehicle(name, { len: 206, wid: 30, h: 38, col, rust: burnt ? 20 : 10, burnt, wheels: [0.1, 0.2, 0.8, 0.9], wheelR: 5, seed,
  extra: (c, G, rng) => {
    const L = 206, u0 = -103, d1 = 15
    c.poly([G(u0, -15, 38), G(u0 + L, -15, 38), G(u0 + L, 15, 38), G(u0, 15, 38)].flat(), burnt ? "A" : "s")
    for (let u = u0 + 14; u + 12 <= u0 + L - 14; u += 17) { const broken = burnt || rng() < 0.5; c.poly([G(u, d1, 20), G(u + 12, d1, 20), G(u + 12, d1, 32), G(u, d1, 32)].flat(), broken ? "k" : "n") }
    ;[u0 + 4, u0 + L - 10].forEach((u) => c.poly([G(u, d1, 8), G(u + 6, d1, 8), G(u + 6, d1, 32), G(u, d1, 32)].flat(), "k"))
  } })
coach("coach_csd", ["Q", "j", "2"], false, 23); coach("coach_csd_b", ["Q", "j", "2"], false, 27); coach("coach_burnt", ["k", "A", "k"], true, 29)
vehicle("wagon_freight", { len: 150, wid: 30, h: 36, col: ["H", "h", "K"], rust: 16, wheels: [0.15, 0.3, 0.7, 0.85], wheelR: 5, seed: 31,
  extra: (c, G) => { for (let u = -70; u < 75; u += 12) c.line(...G(u, 15, 4), ...G(u, 15, 36), "K"); c.poly([G(-20, 15, 6), G(20, 15, 6), G(20, 15, 32), G(-20, 15, 32)].flat(), "k") } })

// Tmavé keře jako ve Falloutu: shluk černozelených koulí s olivovým horním světlem, pár suchých větviček.
const bush = (name, seed, n) => sprite(name, { w: 72, h: 48 }, (c) => {
  const rng = c.rng(seed)
  c.ellipse(36, 44, 28, 5, "k")
  for (let i = 0; i < n; i++) { const x = 14 + rng() * 44, y = 18 + rng() * 20, r = 7 + rng() * 7; c.circ(Math.round(x), Math.round(y), Math.round(r), "A"); c.circ(Math.round(x - 1), Math.round(y - 2), Math.round(r - 3), "G"); c.circ(Math.round(x - 3), Math.round(y - 4), Math.max(1, Math.round(r - 7)), rng() < 0.5 ? "g" : "4") }
  c.noise(0, 0, 72, 40, "k", 0.12, seed + 1, "AG")
  for (let i = 0; i < 4; i++) { const x = 20 + rng() * 32; c.line(Math.round(x), 30, Math.round(x + (rng() - 0.5) * 14), Math.round(6 + rng() * 10), "H") }
})
bush("bush_a", 3, 6); bush("bush_b", 7, 8); bush("bush_c", 11, 5)

// Harampádí po Falloutu: hromada suti s cihlami a prutem výztuže, rezavý sud, pneumatiky, bouda z vlnitého plechu.
sprite("rubble_pile", { w: 96, h: 56 }, (c) => {
  c.poly([6, 50, 30, 30, 52, 22, 78, 32, 92, 50], "x"); c.poly([20, 50, 40, 34, 60, 30, 80, 44, 86, 50], "v")
  ;[[30, 36, "r"], [48, 28, "R"], [62, 38, "r"], [40, 44, "P"], [70, 30, "p"]].forEach(([x, y, col]) => c.rect(x, y, 8, 4, col))
  c.line(52, 26, 64, 4, "U", 2); c.line(56, 28, 44, 8, "U")
  c.ellipse(48, 52, 44, 4, "A")
})
sprite("barrel", { w: 24, h: 36 }, (c) => { c.ellipse(12, 33, 10, 3, "A"); c.rect(3, 6, 18, 28, "U"); c.rect(3, 6, 5, 28, "u"); c.rect(16, 6, 5, 28, "R"); ;[10, 20, 30].forEach((y) => c.rect(3, y, 18, 2, "k")); c.ellipse(12, 6, 9, 3, "k") })
sprite("tires", { w: 40, h: 30 }, (c) => { c.ellipse(20, 27, 18, 3, "A"); ;[22, 15, 8].forEach((y, i) => { c.ellipse(20 + (i % 2) * 2, y, 15, 5, "k"); c.ellipse(20 + (i % 2) * 2, y, 6, 2, "A") }) })
sprite("shack", { w: 136, h: 120 }, (c) => {
  const B = [68, 116]
  const R = (u, v) => [B[0] + u, B[1] - u / 2 - v], L = (u, v) => [B[0] - u, B[1] - u / 2 - v]
  const q = (f, u0, u1, v0, v1) => [...f(u0, v0), ...f(u1, v0), ...f(u1, v1), ...f(u0, v1)]
  c.poly(q(R, 0, 60, 0, 52), "M"); c.poly(q(L, 0, 56, 0, 52), "S")
  for (let u = 0; u < 60; u += 5) c.poly(q(R, u, u + 2, 0, 52), "m")
  for (let u = 0; u < 56; u += 5) c.poly(q(L, u, u + 2, 0, 52), "s")
  c.poly(q(R, 8, 30, 8, 30), "U"); c.poly(q(R, 36, 52, 0, 40), "k"); c.poly(q(L, 20, 40, 20, 36), "U")
  for (let i = 0; i < 6; i++) { const [x, y] = R(4 + i * 10, 52); c.vline(x, y, 10 + (i * 7) % 18, "U") }
  const top = (u, w) => [B[0] + u - w, B[1] - u / 2 - w / 2 - 52]
  c.poly([...top(-6, -6), ...top(64, -6), ...top(64, 60), ...top(-6, 60)], "u")
  for (let u = -4; u < 64; u += 6) c.line(...top(u, -6), ...top(u, 60), "U")
  c.poly([...top(10, 10), ...top(30, 10), ...top(30, 26), ...top(10, 26)], "M")
})

// Čtverec linky metra: barva linky (A zelená, B žlutá, C červená), černé bezpatkové písmeno. x, y levý horní roh, S strana.
const METRO_LINES = { A: "E", B: "f", C: "7" }
function metroLine(c, x, y, S, line) {
  const bg = METRO_LINES[line]
  c.rect(x, y, S, S, bg)
  const P = (pts) => pts.flatMap(([u, v]) => [x + u * S, y + v * S])
  if (line === "A") {
    c.poly(P([[0.5, 0.14], [0.84, 0.86], [0.66, 0.86], [0.59, 0.68], [0.41, 0.68], [0.34, 0.86], [0.16, 0.86]]), "k")
    c.poly(P([[0.5, 0.38], [0.56, 0.54], [0.44, 0.54]]), bg)
  } else if (line === "B") {
    c.poly(P([[0.28, 0.16], [0.62, 0.16], [0.74, 0.28], [0.74, 0.42], [0.66, 0.5], [0.76, 0.6], [0.76, 0.74], [0.64, 0.86], [0.28, 0.86]]), "k")
    c.rect(x + Math.round(0.44 * S), y + Math.round(0.3 * S), Math.round(0.16 * S), Math.round(0.12 * S), bg)
    c.rect(x + Math.round(0.44 * S), y + Math.round(0.58 * S), Math.round(0.18 * S), Math.round(0.14 * S), bg)
  } else {
    // C jako tlustý kruhový oblouk otevřený doprava
    const cx = x + S / 2, cy = y + S / 2, R = Math.round(S * 0.37)
    c.circ(cx, cy, R, "k"); c.circ(cx, cy, Math.round(R * 0.55), bg); c.rect(cx + Math.round(R * 0.27), cy - Math.round(R * 0.36), R, Math.round(R * 0.82), bg)
  }
}

// Sloupek se značením metra před vchodem (pohled zepředu): černý čtverec s logem M (šipka dolů), pod ním čtverce linek
// stanice (Hlavní nádraží C, Staroměstská A).
const MA = [[0.27, 0.12], [0.40, 0.12], [0.50, 0.25], [0.60, 0.12], [0.73, 0.12], [0.73, 0.40], [0.87, 0.40], [0.87, 0.48], [0.50, 0.90], [0.13, 0.48], [0.13, 0.40], [0.27, 0.40]]
const MH = [[0.34, 0.20], [0.39, 0.20], [0.50, 0.34], [0.61, 0.20], [0.66, 0.20], [0.66, 0.47], [0.77, 0.47], [0.50, 0.78], [0.23, 0.47], [0.34, 0.47]]
function metroLogo(c, x, y, S) {
  c.rect(x, y, S, S, "k")
  c.poly(MA.flatMap(([u, v]) => [x + u * S, y + v * S]), "W"); c.poly(MH.flatMap(([u, v]) => [x + u * S, y + v * S]), "k")
}
function metroTotem(name, lines) {
  sprite(name, { w: 40, h: 150 }, (c) => {
    const S = 30, x0 = 5, y0 = 4
    c.ellipse(20, 146, 10, 3, "A"); c.rect(18, 70, 4, 78, "S"); c.rect(18, 70, 1, 78, "s")
    c.rect(x0 - 1, y0 - 1, S + 2, S * 2 + 4, "m")
    metroLogo(c, x0, y0, S)
    metroLine(c, x0, y0 + S + 2, S, lines[0])
    // rez a nálepky
    c.rect(x0 + 2, y0 + S * 2, 8, 2, "U"); c.rect(x0 + 20, y0 + 6, 4, 3, "U")
  })
}
metroTotem("metro_totem_c", ["C"])
metroTotem("metro_totem_a", ["A"])

// Vstup do stanice Muzeum: zábradlí kolem otvoru se schody (otvor podél osy a), sloupek s logem metra a linkami A a C.
sprite("metro_entrance", { w: 148, h: 150 }, (c) => {
  // otvor: kosodélník podél a, schody jako čáry napříč, světlejší u vrchu
  const P = (u, w) => [20 + u + w, 120 - u / 2 + w / 2]
  c.poly([...P(0, 0), ...P(96, 0), ...P(96, 24), ...P(0, 24)], "k")
  for (let u = 8; u < 96; u += 8) { const [x0, y0] = P(u, 0), [x1, y1] = P(u, 24); c.line(x0, y0, x1, y1, u < 40 ? "a" : "A") }
  // betonové obrubníky
  c.poly([...P(0, -4), ...P(96, -4), ...P(96, 0), ...P(0, 0)], "q"); c.poly([...P(0, 24), ...P(96, 24), ...P(96, 28), ...P(0, 28)], "p")
  // zábradlí: trubka a sloupky po obou stranách
  ;[-4, 26].forEach((w) => {
    const [x0, y0] = P(0, w), [x1, y1] = P(96, w)
    c.line(x0, y0 - 22, x1, y1 - 22, "m", 2)
    for (let u = 0; u <= 96; u += 24) { const [x, y] = P(u, w); c.line(x, y, x, y - 22, "M", 2) }
  })
  // sloupek s cedulí: logo metra a pod ním čtverce linek A a C (Muzeum je přestupní stanice)
  c.rect(14, 60, 4, 72, "S")
  c.rect(3, 1, 26, 62, "m")
  metroLogo(c, 4, 2, 24)
  metroLine(c, 4, 27, 11, "A"); metroLine(c, 17, 27, 11, "C")
  c.rect(4, 40, 24, 22, "k"); c.rect(6, 43, 20, 2, "W"); c.rect(6, 48, 14, 2, "w"); c.rect(6, 53, 17, 2, "w")
})
