// Karlův most nad suchým korytem: díly po jedné dlaždici, ze kterých WorldScene skládá přední líc mostu (oblouky, pilíře
// s ledolamy, římsu, zábradlí), zadní zábradlí a nábřežní zdi. Koryto leží KM_D bodů pod mostovkou (asi 13 m): zem hra
// kreslí rovně, hloubku dělají stěny, které od hrany mostovky a nábřeží visí dolů přes bahno.
// Předloha: fotky Karlova mostu (Wikimedia Commons, Category:Charles Bridge); pilíře podle obrysu mostu v OSM, po 30 m.
// Díl má počátek v rohu dlaždice, kde stěna začíná (přední líc a nábřeží k +b: spodní roh; nábřeží k −a: spodní roh;
// zadní zábradlí: levý roh). p(u, d, h): u podél stěny (64 bodů na dlaždici), d kolmo dovnitř, h výška nad mostovkou.
// Po tom, co se stalo: čára staré hladiny, pod ní zaschlé bahno a řasy, saze, plevel na římse, prázdné podstavce soch
// s cenovkou (sochy se rozprodávají).

const KM_D = 220            // hloubka koryta pod mostovkou
const KM_SPRING = -150      // patka oblouků (stará hladina)
const KM_CROWN = -62        // vrchol oblouku
const KM_PAR = 24           // výška zábradlí
const KM_T = 96             // místo nad počátkem (podstavec, zábradlí)

// Kvádrové zdivo po celé stěně: řádky po 9 bodech, spáry po 32 posunuté o 16 v každém druhém řádku. Fáze se počítá
// z polohy na stěně (su), takže díly vedle sebe navazují.
function kmAshlar(c, F, u0, u1, v0, v1, su0, rng, base = "3", joint = "9", patch = "e") {
  c.poly([...F(u0, v0), ...F(u1, v0), ...F(u1, v1), ...F(u0, v1)], base)
  for (let v = Math.ceil(v0 / 9) * 9, row = 0; v < v1; v += 9, row++) {
    const r = Math.round(v / 9)
    c.line(...F(u0, v), ...F(u1, v), joint)
    for (let s = Math.floor((su0 + u0) / 32) * 32 - 32; s < su0 + u1 + 32; s += 32) {
      const u = s - su0 + ((r & 1) ? 16 : 0)
      if (u <= u0 || u >= u1) continue
      c.line(...F(u, v), ...F(u, Math.min(v + 9, v1)), joint)
      // světlejší vyměněný kvádr: deterministicky z polohy, ne z rng (ať navazuje)
      const hsh = Math.abs(Math.sin((s + 7) * 12.9898 + r * 78.233) * 43758.5453) % 1
      if (hsh < 0.08 && u + 31 < u1) c.poly([...F(u + 1, v + 1), ...F(u + 31, v + 1), ...F(u + 31, Math.min(v + 8, v1)), ...F(u + 1, Math.min(v + 8, v1))], patch)
    }
  }
}

// Stará hladina a bahno na stěně: pod KM_SPRING tmavší mokrý pás s řasami, dole zaschlé bahno se zubatým okrajem.
function kmWaterline(c, F, u0, u1, rng) {
  for (let u = u0; u < u1; u++) {
    const [x, y] = F(u, KM_SPRING + 2)
    c.px(Math.round(x), Math.round(y), "x")
    if (rng() < 0.5) { const [x2, y2] = F(u, KM_SPRING - 1); c.px(Math.round(x2), Math.round(y2), "K") }
  }
  for (let i = 0; i < (u1 - u0) / 3; i++) {
    const u = u0 + rng() * (u1 - u0), [x, y] = F(u, KM_SPRING - 2)
    c.vline(Math.round(x), Math.round(y), 4 + Math.floor(rng() * 26), rng() < 0.5 ? "Q" : "K")
  }
  let h = 10 + rng() * 10
  const q = [...F(u1, -KM_D), ...F(u0, -KM_D)]
  for (let u = u0; u <= u1; u += 4) { h = Math.max(6, Math.min(34, h + (rng() - 0.5) * 9)); q.push(...F(u, -KM_D + h)) }
  q.push(...F(u1, -KM_D + h))
  c.poly(q, "H")
  for (let i = 0; i < (u1 - u0) / 8; i++) { const [x, y] = F(u0 + rng() * (u1 - u0), -KM_D + 20 + rng() * 26); c.rect(Math.round(x), Math.round(y), 2, 1, "h") }
}

// Saze a stékance od římsy dolů.
function kmStreaks(c, F, u0, u1, rng, n) {
  for (let i = 0; i < n; i++) { const [x, y] = F(u0 + rng() * (u1 - u0), -9); c.vline(Math.round(x), Math.round(y), 8 + Math.floor(rng() * 70), rng() < 0.3 ? "U" : "k") }
}

// Římsa a zábradlí podél přední hrany (d = 0 je líc mostu, zábradlí sedí na mostovce za ním).
function kmParapet(K, c, u0, u1, rng, pedestal) {
  const { p, poly, quad, FRd, box } = K
  // římsa: předsazený pás, pod ním stín
  quad(FRd(-3), u0, u1, -9, -1, "e"); quad(FRd(-3), u0, u1, -2, -1, "C")
  c.line(...p(u0, -3, -10), ...p(u1, -3, -10), "k")
  poly("C", [u0, -3, -1], [u1, -3, -1], [u1, 0, 0], [u0, 0, 0])
  // zábradlí: plná kamenná zídka s krycí deskou
  box(u0, u1, 0, 10, 0, KM_PAR, "e", "3", "9")
  for (let v = 9; v < KM_PAR - 3; v += 9) c.line(...p(u0, 0, v), ...p(u1, 0, v), "9")
  for (let u = Math.ceil(u0 / 32) * 32; u < u1; u += 32) c.line(...p(u, 0, 0), ...p(u, 0, KM_PAR - 3), "9")
  box(u0, u1, -2, 12, KM_PAR - 3, KM_PAR, "C", "e", "C")
  // plevel na krycí desce a v římse
  for (let i = 0; i < (u1 - u0) / 9; i++) { const u = u0 + rng() * (u1 - u0), [x, y] = p(u, 4, KM_PAR); if (rng() < 0.45) { c.px(Math.round(x), Math.round(y) - 1, "g"); c.px(Math.round(x) + 1, Math.round(y) - 2, "G") } }
  if (pedestal) {
    // prázdný podstavec sochy nad pilířem, s cenovkou
    const m = (u0 + u1) / 2
    box(m - 15, m + 15, -4, 22, KM_PAR, KM_PAR + 8, "C", "e", "C")
    box(m - 12, m + 12, -1, 19, KM_PAR + 8, KM_PAR + 34, "e", "3", "9")
    quad(FRd(-1), m - 8, m + 8, KM_PAR + 14, KM_PAR + 28, "9")
    box(m - 14, m + 14, -3, 21, KM_PAR + 34, KM_PAR + 38, "C", "e", "C")
    // čepy po soše a cedulka s cenou
    const [x, y] = p(m, 9, KM_PAR + 38); c.rect(Math.round(x) - 4, Math.round(y) - 2, 2, 2, "U"); c.rect(Math.round(x) + 3, Math.round(y) - 1, 2, 2, "U")
    quad(FRd(-2), m - 6, m + 6, KM_PAR + 18, KM_PAR + 24, "W"); c.line(...p(m - 4, -2, KM_PAR + 21), ...p(m + 4, -2, KM_PAR + 21), "V")
  }
}

// Přední díl: kind 'pier' (pilíř s ledolamem), 'arch' (výsek oblouku k z n dlaždic), 'par' (jen zábradlí, Kampa).
function kmFront(name, kind, n = 3, k = 1, seed = 1) {
  const W = 104, ox = 16, H = KM_T + KM_D + 40, oy = KM_T
  sprite(name, { w: W, h: H }, (c) => {
    const rng = c.rng(seed)
    const K = mstKit(c, ox, oy, rng)
    const { p, poly, FRd } = K
    const F = FRd(0)
    const su0 = kind === 'arch' ? k * 64 : 0
    if (kind !== 'par') {
      kmAshlar(c, F, 0, 64, -KM_D, -1, su0, rng)
      kmWaterline(c, F, 0, 64, rng)
      kmStreaks(c, F, 0, 64, rng, 5)
      if (kind === 'arch') {
        // výsek oblouku: patka v KM_SPRING u pilířů, vrchol uprostřed rozpětí (n dlaždic), segmentový oblouk
        const half = 32 * n, mid = half
        const hi = (s) => { const t = (s - mid) / half; return KM_SPRING + (KM_CROWN - KM_SPRING) * Math.sqrt(Math.max(0, 1 - t * t)) }
        const s0 = (k - 1) * 64
        // otvor: pod obloukem tma, dole přes ni prosvítá bahno na druhé straně
        const open = [...F(0, -KM_D), ...F(64, -KM_D)]
        for (let u = 64; u >= 0; u -= 2) open.push(...F(u, hi(s0 + u)))
        c.poly(open, "N")
        for (let u = 0; u < 64; u += 1) for (let v = -KM_D; v < -KM_D + 46; v += 1) {
          const [x, y] = F(u, v), t = (v + KM_D) / 46
          if (((x + y * 3) % 4 === 0 && t < 0.9) || ((x + y) % 2 === 0 && t < 0.4)) c.px(Math.round(x), Math.round(y), t < 0.25 ? "h" : "H")
        }
        // stín klenby: horní okraj otvoru ještě tmavší
        for (let u = 0; u <= 64; u += 1) { const [x, y] = F(u, hi(s0 + u)); c.vline(Math.round(x), Math.round(y), 8, "k") }
        // klenáky: věnec kolem otvoru, radiální spáry, větší závěrák ve vrcholu
        for (let u = 0; u < 64; u += 1) {
          const s = s0 + u, h0 = hi(s)
          if (h0 <= KM_SPRING + 0.5) continue
          const [x0, y0] = F(u, h0 + 1), [x1, y1] = F(u, h0 + 13)
          c.line(Math.round(x0), Math.round(y0), Math.round(x1), Math.round(y1), "e")
        }
        for (let s = 6; s < 2 * half; s += 10) {
          if (s < s0 || s > s0 + 64) continue
          // spára míří ze středu oblouku (mid, KM_SPRING)
          const u = s - s0, h0 = hi(s), dx = s - mid, dy = h0 - KM_SPRING, l = Math.hypot(dx, dy) || 1
          const [x0, y0] = F(u, h0 + 1), [x1, y1] = F(u + dx / l * 12, h0 + 1 + dy / l * 12)
          c.line(Math.round(x0), Math.round(y0), Math.round(x1), Math.round(y1), "9")
        }
        if (mid >= s0 && mid < s0 + 64) { const u = mid - s0; c.poly([...F(u - 5, KM_CROWN + 1), ...F(u + 5, KM_CROWN + 1), ...F(u + 6, KM_CROWN + 16), ...F(u - 6, KM_CROWN + 16)], "C"); c.line(...F(u - 6, KM_CROWN + 16), ...F(u + 6, KM_CROWN + 16), "9") }
      }
      if (kind === 'pier') {
        // pilíř: kamenný ledolam (trojboký hranol ke +b) od dna po patku, nahoře jehlancová stříška
        const A = 36, top = KM_SPRING + 34
        const left = (t, h) => p(4 + 28 * t, -A * t, h), right = (t, h) => p(60 - 28 * t, -A * t, h)
        // základ (rozšířená patka) zasypaná bahnem
        poly("9", [0, 0, -KM_D], [32, -A - 8, -KM_D], [64, 0, -KM_D], [64, 0, -KM_D + 14], [32, -A - 8, -KM_D + 14], [0, 0, -KM_D + 14])
        c.poly([...left(0, -KM_D + 12), ...left(1, -KM_D + 12), ...left(1, top), ...left(0, top)], "e")
        c.poly([...right(0, -KM_D + 12), ...right(1, -KM_D + 12), ...right(1, top), ...right(0, top)], "9")
        for (let v = -KM_D + 12; v < top; v += 9) { c.line(...left(0, v), ...left(1, v), "3"); c.line(...right(0, v), ...right(1, v), "k") }
        c.line(...left(1, -KM_D + 12), ...left(1, top), "C")
        // stará hladina a bahno i na ledolamu
        for (let t = 0; t <= 1; t += 0.02) { const [x, y] = left(t, KM_SPRING + 2); c.px(Math.round(x), Math.round(y), "x"); const [x2, y2] = right(t, KM_SPRING + 2); c.px(Math.round(x2), Math.round(y2), "v") }
        c.poly([...left(0, -KM_D + 12), ...left(1, -KM_D + 12), ...left(1, -KM_D + 34), ...left(0.5, -KM_D + 28), ...left(0, -KM_D + 36)], "H")
        c.poly([...right(0, -KM_D + 12), ...right(1, -KM_D + 12), ...right(1, -KM_D + 30), ...right(0, -KM_D + 26)], "H")
        for (let i = 0; i < 8; i++) { const t = rng(), [x, y] = left(t, KM_SPRING - 2); c.vline(Math.round(x), Math.round(y), 4 + Math.floor(rng() * 20), "Q") }
        // stříška: dvě šikmé plochy k líci
        poly("C", [4, 0, top], [32, -A, top], [32, 0, top + 40])
        poly("3", [32, -A, top], [60, 0, top], [32, 0, top + 40])
        c.line(...p(32, -A, top), ...p(32, 0, top + 40), "x")
        // plevel v sparách stříšky
        for (let i = 0; i < 5; i++) { const [x, y] = p(10 + rng() * 40, -rng() * 20, top + 4 + rng() * 20); c.px(Math.round(x), Math.round(y), "g") }
      }
    }
    kmParapet(K, c, 0, 64, rng, kind === 'pier')
  })
}

// Zadní zábradlí (vnitřní líc k +b je vidět přes mostovku), nad pilířem s podstavcem.
function kmFar(name, pedestal, seed = 1) {
  const W = 104, ox = 20, H = 140, oy = 104
  sprite(name, { w: W, h: H }, (c) => {
    const rng = c.rng(seed)
    const K = mstKit(c, ox, oy, rng)
    const { p, quad, FRd, box } = K
    box(0, 64, -10, 0, 0, KM_PAR, "e", "3", "9")
    for (let v = 9; v < KM_PAR - 3; v += 9) c.line(...p(0, -10, v), ...p(64, -10, v), "9")
    for (let u = 16; u < 64; u += 32) c.line(...p(u, -10, 0), ...p(u, -10, KM_PAR - 3), "9")
    box(0, 64, -12, 2, KM_PAR - 3, KM_PAR, "C", "e", "C")
    for (let i = 0; i < 6; i++) { const [x, y] = p(rng() * 64, -5, KM_PAR); if (rng() < 0.5) { c.px(Math.round(x), Math.round(y) - 1, "g"); c.px(Math.round(x) - 1, Math.round(y) - 2, "G") } }
    // mech a saze na vnitřním líci dole
    for (let i = 0; i < 10; i++) { const [x, y] = p(rng() * 64, -10, 2 + rng() * 6); c.px(Math.round(x), Math.round(y), rng() < 0.5 ? "K" : "G") }
    if (pedestal) {
      const m = 32
      box(m - 15, m + 15, -22, 4, KM_PAR, KM_PAR + 8, "C", "e", "C")
      box(m - 12, m + 12, -19, 1, KM_PAR + 8, KM_PAR + 34, "e", "3", "9")
      quad(FRd(-19), m - 8, m + 8, KM_PAR + 14, KM_PAR + 28, "9")
      box(m - 14, m + 14, -21, 3, KM_PAR + 34, KM_PAR + 38, "C", "e", "C")
      quad(FRd(-20), m - 6, m + 6, KM_PAR + 18, KM_PAR + 24, "W"); c.line(...p(m - 4, -20, KM_PAR + 21), ...p(m + 4, -20, KM_PAR + 21), "V")
    }
  })
}

// Nábřežní zeď z kvádrů s krycí deskou: side 'b' líc k +b (podél a), side 'a' líc k −a (podél b).
function kmQuay(name, side, seed = 1) {
  const W = 104, H = 40 + KM_D + 30, oy = 40
  const ox = side === 'b' ? 8 : 80
  sprite(name, { w: W, h: H }, (c) => {
    const rng = c.rng(seed)
    const K = mstKit(c, ox, oy, rng)
    const { p } = K
    const F = side === 'b' ? (u, v) => p(u, 0, v) : (u, v) => p(0, u, v)
    const lit = side === 'b' ? "3" : "e", joint = side === 'b' ? "9" : "3", patch = side === 'b' ? "e" : "C"
    kmAshlar(c, F, 0, 64, -KM_D, -1, 0, rng, lit, joint, patch)
    kmWaterline(c, F, 0, 64, rng)
    for (let i = 0; i < 4; i++) { const [x, y] = F(rng() * 64, -6); c.vline(Math.round(x), Math.round(y), 8 + Math.floor(rng() * 40), "k") }
    // krycí deska nábřeží
    c.poly([...F(0, -6), ...F(64, -6), ...F(64, 0), ...F(0, 0)], "C")
    c.line(...F(0, -7), ...F(64, -7), "k")
    // kruh na uvázání lodi, rezavý, v každé čtvrté desce
    if (seed % 4 === 1) { const [x, y] = F(32, -40); c.circ(Math.round(x), Math.round(y), 3, "U"); c.circ(Math.round(x), Math.round(y), 2, "3") }
  })
}

kmFront("km_pier", "pier", 3, 1, 3)
for (const n of [3, 4]) for (let k = 1; k <= n; k++) kmFront(`km_arch_${n}_${k}`, "arch", n, k, 10 * n + k)
kmFront("km_par", "par", 3, 1, 5)
kmFar("km_far", false, 7)
kmFar("km_far_pier", true, 9)
kmQuay("km_quay_b", "b", 1)
kmQuay("km_quay_b2", "b", 2)
kmQuay("km_quay_a", "a", 1)
kmQuay("km_quay_a2", "a", 2)

sheet("landmarks_mostovka", ["km_*"], { pad: 1 })
