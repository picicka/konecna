// Fantova budova Hlavního nádraží jako landmark z dílů, průčelí (pravá stěna, +b) míří do Sherwoodu. Stejná geometrie
// jako house(): počátek v nejbližším spodním rohu, x = 64·dpt od levého okraje; díly se kladou za sebou podél osy a.
// Secese: světlý pískovec, zlacené detaily, měděné a skleněné kupole věží, velké půlkruhové okno střední haly.
// Po pádu: v arkádách křídel je tržiště (plachty, zboží), jedna kupole je bez skla, přes okno visí plachta FANTA.
// Pomocné funkce mají vlastní jména (F*), aby nekolidovaly s buildings.px.js.
const FT = 64
const FR = (u, v) => [u, -u / 2 - v]
const FL = (u, v) => [-u, -u / 2 - v]
const Fq = (f, u0, u1, v0, v1) => [...f(u0, v0), ...f(u1, v0), ...f(u1, v1), ...f(u0, v1)]
const Fs = (pts, ox, oy) => pts.map((p, i) => p + (i % 2 ? oy : ox))
const FROut = (u, v, p) => [u + p, -u / 2 - v + p / 2]
// Fantova budova stojí o patro výš: její přízemí je ve výšce vozovky magistrály (PODIUM = výška stropní desky haly).
const PODIUM = 142

// Nápis podél pravé stěny písmem do roviny stěny (wallText v buildings.px.js); diakritika se píše rovnou (Á, Ž…),
// staré značky "'" (čárka) a "^" (háček) za písmenem se převedou. Vrací šířku v jednotkách u.
function slant(c, ox, oy, u0, v, str, col, step = 15) {
  const text = str.replace(/(.)'/g, (m, ch) => (ch + "\u0301").normalize("NFC")).replace(/(.)\^/g, (m, ch) => (ch + "\u030c").normalize("NFC"))
  return wallText(c, FR, ox, oy, u0, v - 12, text, col, { sc: Math.max(2, Math.round(step / 5)) })
}

function fanta(name, o) {
  const w = o.w, dpt = o.dpt ?? 4, kind = o.kind
  const gf = 72, H = kind === "tower" ? 330 : kind === "hall" ? 260 : 170
  const crown = kind === "tower" ? 150 : kind === "hall" ? 140 : 36
  const W = FT * (w + dpt), Hc = 32 * (w + dpt) + H + crown + 4 + PODIUM
  const ox = FT * dpt, oy = Hc - 1 - PODIUM
  const lenR = FT * w, lenL = FT * dpt
  const stone = "c", light = "W", shade = "e", dark = "C"
  sprite(name, { w: W, h: Hc }, (c) => {
    const rng = c.rng(o.seed ?? 1)
    const P = (pts, col) => c.poly(Fs(pts, ox, oy), col)
    // podnož: kamenná zeď od země po přízemí (zepředu ji kryje hala, vidět je na konci a ze strany kolejí)
    // jen boční stěna (vidět nad nájezdovou rampou); přední stranu podnože kryje odbavovací hala a kreslit ji nesmí,
    // jinak by díly budovy, které jsou v pořadí před díly haly, ležely přes vozovku magistrály
    P(Fq(FL, 0, lenL, -PODIUM, 0), "x")
    for (let v = -PODIUM + 20; v < 0; v += 20) P(Fq(FL, 0, lenL, v, v + 2), "P")
    // stěny
    P(Fq(FR, 0, lenR, 0, H), stone); P(Fq(FL, 0, lenL, 0, H), dark)
    // kamenné kvádrování parteru
    for (let v = 12; v < gf; v += 12) { P(Fq(FR, 0, lenR, v - 1, v), shade); P(Fq(FL, 0, lenL, v - 1, v), shade) }
    P(Fq(FR, 0, lenR, gf - 4, gf), light); P(Fq(FR, 0, lenR, gf, gf + 2), shade)
    // levá stěna: řada vysokých oken
    for (let u = 20; u + 18 < lenL - 8; u += 48) for (let v = gf + 20; v + 50 < H - 20; v += 80) { P(Fq(FL, u, u + 18, v, v + 50), "k"); P(Fq(FL, u + 2, u + 16, v + 2, v + 48), "n") }

    // špína: stékance od římsy, odstřik u paty, plevel na hraně, rez z kotev
    for (let i = 0; i < lenR / 8; i++) { const u = 3 + Math.floor(rng() * (lenR - 6)), n = 20 + Math.floor(rng() * H * 0.6); const [x, y] = Fs(FR(u, H - 14 - Math.floor(rng() * 20)), ox, oy); c.vline(x, y, n, rng() < 0.3 ? "U" : shade) }
    for (let i = 0; i < lenL / 10; i++) { const u = 3 + Math.floor(rng() * (lenL - 6)), n = 20 + Math.floor(rng() * H * 0.5); const [x, y] = Fs(FL(u, H - 10), ox, oy); c.vline(x, y, n, rng() < 0.3 ? "U" : "e") }
    for (let u = 0; u < lenR; u += 3) if (rng() < 0.5) { const [x, y] = Fs(FR(u, H), ox, oy); c.vline(x, y - 4, 3 + Math.floor(rng() * 4), rng() < 0.5 ? "G" : "Q") }
    if (kind === "wing") {
      // arkády s tržištěm: oblouky po 64 px, uvnitř tma, plachty a zboží
      for (let u = 8; u + 48 <= lenR - 4; u += 64) {
        P(Fq(FR, u, u + 48, 0, 44), "k")
        P([...FR(u, 44), ...FR(u + 48, 44), ...FR(u + 40, 56), ...FR(u + 24, 61), ...FR(u + 8, 56)], "k")
        P([...FR(u - 4, 44), ...FR(u, 44), ...FR(u + 8, 58), ...FR(u + 24, 64), ...FR(u + 40, 58), ...FR(u + 48, 44), ...FR(u + 52, 44), ...FR(u + 42, 62), ...FR(u + 24, 68), ...FR(u + 6, 62)], light)
        const awning = ["V", "Q", "o", "b"][Math.floor(rng() * 4)]
        P(Fq(FR, u + 2, u + 46, 30, 38), awning); for (let s = u + 6; s < u + 46; s += 10) P(Fq(FR, s, s + 4, 30, 38), "W")
        for (let i = 0; i < 4; i++) P(Fq(FR, u + 6 + i * 10, u + 12 + i * 10, 4, 12), ["y", "m", "Y", "l"][Math.floor(rng() * 4)])
        P(Fq(FR, u + 2, u + 46, 0, 4), "H")
      }
      // patro: zdvojená okna s pilastry
      for (let u = 12; u + 40 <= lenR - 4; u += 64) {
        P(Fq(FR, u - 6, u - 2, gf, H - 18), light)
        ;[u + 4, u + 22].forEach((x) => { P(Fq(FR, x - 2, x + 16, gf + 22, gf + 74), shade); P(Fq(FR, x, x + 14, gf + 24, gf + 72), rng() < 0.15 ? "k" : "n"); P(Fq(FR, x - 3, x + 17, gf + 74, gf + 78), light) })
      }
      // plochá střecha se světlíky, pak korunní římsa a balustráda s vázami
      P([...FR(0, H), ...FR(lenR, H), [lenR - lenL, -lenR / 2 - lenL / 2 - H][0], -lenR / 2 - lenL / 2 - H, ...FL(lenL, H)], "x")
      for (let u = 40; u < lenR - 40; u += 96) P([...FR(u - lenL * 0.5, H + lenL * 0.25), ...FR(u + 30 - lenL * 0.5, H + lenL * 0.25), ...FR(u + 30 - lenL * 0.7, H + lenL * 0.35), ...FR(u - lenL * 0.7, H + lenL * 0.35)].map((v, i) => v), "n")
      P(Fq(FR, 0, lenR, H - 18, H), light); P(Fq(FR, 0, lenR, H - 20, H - 18), shade)
      for (let u = 4; u < lenR; u += 10) P(Fq(FR, u, u + 4, H, H + 18), stone)
      P(Fq(FR, 0, lenR, H + 18, H + 22), light)
      for (let u = 24; u < lenR; u += 64) { P(Fq(FR, u, u + 8, H + 22, H + 34), stone); const [x, y] = Fs(FR(u + 4, H + 34), ox, oy); c.circ(x, y - 4, 5, light) }
    }

    if (kind === "tower") {
      // vysoká okna přes dvě patra, nárožní bosáž, kartuše se znakem
      for (let v = gf + 20; v + 90 < H - 60; v += 110) {
        P(Fq(FR, 32, 96, v - 4, v + 96), shade); P(Fq(FR, 36, 92, v, v + 92), "n")
        P(Fq(FR, 62, 66, v, v + 92), stone); P(Fq(FR, 36, 92, v + 44, v + 48), stone)
        if (rng() < 0.5) P(Fq(FR, 40, 58, v + 50, v + 88), "k")
      }
      for (let v = 0; v < H; v += 24) { P(Fq(FR, 0, 10, v, v + 20), light); P(Fq(FR, lenR - 10, lenR, v, v + 20), light) }
      P(Fq(FR, 40, 88, H - 54, H - 26), "Y"); P(Fq(FR, 46, 82, H - 50, H - 30), "V"); const [cx, cy] = Fs(FR(64, H - 40), ox, oy); c.circ(cx, cy, 6, "W")
      P(Fq(FR, 0, lenR, H - 18, H), light)
      P([...FR(0, H), ...FR(lenR, H), lenR - lenL, -lenR / 2 - lenL / 2 - H, ...FL(lenL, H)], "x")
      // buben a kupole: buben menší kvádr, kupole elipsa (měď nebo sklo), lucerna a zlatá špice
      const [tx, ty] = Fs([lenR / 2 - lenL / 2, -lenR / 4 - lenL / 4 - H], ox, oy)
      c.rect(tx - 44, ty - 50, 88, 50, stone); c.rect(tx - 44, ty - 50, 88, 6, light)
      for (let x = -36; x < 36; x += 18) { c.rect(tx + x, ty - 40, 10, 30, "n"); c.rect(tx + x, ty - 40, 10, 2, light) }
      const glass = o.broken
      c.clip([tx - 50, ty - 130, 100, 80], () => c.ellipse(tx, ty - 50, 48, 70, glass ? "k" : "Q"))
      if (glass) { for (let x = -40; x <= 40; x += 10) c.line(tx + x, ty - 50, tx + x / 3, ty - 118, "S", 2); c.line(tx - 46, ty - 80, tx + 46, ty - 80, "S", 2) }
      else { c.line(tx - 20, ty - 110, tx - 26, ty - 52, "j", 2); c.line(tx + 18, ty - 112, tx + 24, ty - 52, "j", 2); c.line(tx, ty - 120, tx, ty - 52, "j") }
      c.rect(tx - 8, ty - 136, 16, 18, stone); c.rect(tx - 2, ty - 150, 4, 16, "Y"); c.circ(tx, ty - 150, 3, "y")
    }

    if (kind === "hall") {
      // velké půlkruhové okno přes celou výšku: rám, paprskové příčle, část skla vybitá; pod ním vchod
      const cu = lenR / 2, R0 = lenR * 0.36, base = gf + 40
      const arc = (r, n = 40) => { const pts = []; for (let i = 0; i <= n; i++) { const t = Math.PI * i / n; pts.push(...FR(cu - Math.cos(t) * r, base + Math.sin(t) * r * 0.9)) } return pts }
      P([...FR(cu - R0 - 14, gf), ...FR(cu + R0 + 14, gf), ...arc(R0 + 14).slice().reverse().reduce((acc, _, i, arr) => (i % 2 ? acc : [...acc, arr[i + 1], arr[i]]), [])], light)
      P([...FR(cu - R0 - 6, base), ...arc(R0 + 6), ...FR(cu + R0 + 6, base)], "Y")
      P([...FR(cu - R0, base), ...arc(R0), ...FR(cu + R0, base)], "n")
      for (let i = 1; i < 8; i++) { const t = Math.PI * i / 8; const [x0, y0] = Fs(FR(cu, base), ox, oy); const [x1, y1] = Fs(FR(cu - Math.cos(t) * R0, base + Math.sin(t) * R0 * 0.9), ox, oy); c.line(x0, y0, x1, y1, "Y", 2) }
      ;[0.45, 0.75].forEach((k) => { const pts = []; for (let i = 0; i <= 30; i++) { const t = Math.PI * i / 30; pts.push(Fs(FR(cu - Math.cos(t) * R0 * k, base + Math.sin(t) * R0 * k * 0.9), ox, oy)) } for (let i = 1; i < pts.length; i++) c.line(...pts[i - 1], ...pts[i], "Y") })
      for (let i = 0; i < 9; i++) { const u = cu - R0 * 0.8 + rng() * R0 * 1.6, v = base + 10 + rng() * R0 * 0.6; P(Fq(FR, u, u + 10, v, v + 14), "k") }
      // plachta FANTA přes spodek okna
      P(Fq(FR, cu - 90, cu + 90, base - 10, base + 30), "V"); P(Fq(FR, cu - 90, cu + 90, base - 10, base - 6), "D")
      wallText(c, FR, ox, oy, cu - 50, base + 4, "FANTA", "W", { sc: 4 })
      // vchod: tři portály
      for (let k = -1; k <= 1; k++) { const u = cu + k * 96 - 18; P(Fq(FR, u - 4, u + 40, 0, 52), light); P(Fq(FR, u, u + 36, 0, 46), "k"); P(Fq(FR, u + 4, u + 32, 2, 40), "H") }
      // valená střecha haly dozadu (sklo a železo)
      const far = [lenR - lenL, -lenR / 2 - lenL / 2 - H]
      P([...FR(0, H), ...FR(lenR, H), far[0], far[1], ...FL(lenL, H)], "S")
      for (let k = 1; k < 6; k++) { const t = k / 6; c.line(...Fs([lenR * 0 - lenL * t, -lenL * t / 2 - H], ox, oy), ...Fs([lenR - lenL * t, -lenR / 2 - lenL * t / 2 - H], ox, oy), "s", 2) }
      // atika: zlacený štít s nápisem PRAHA a dvě sochy
      P(Fq(FR, 0, lenR, H - 18, H), light)
      P([...FR(cu - 150, H), ...FR(cu + 150, H), ...FR(cu + 134, H + 96), ...FR(cu, H + 124), ...FR(cu - 134, H + 96)], stone)
      P([...FR(cu - 134, H + 6), ...FR(cu + 134, H + 6), ...FR(cu + 120, H + 90), ...FR(cu, H + 114), ...FR(cu - 120, H + 90)], "Y")
      // HLAVNÍ přeškrtnuté, nad ním sprejem FANTOVO, pod tím NÁDRAŽÍ
      const w1 = slant(c, ox, oy, cu - 52, H + 44, "HLAVNI'", "D", 17)
      c.line(...Fs(FR(cu - 60, H + 50), ox, oy), ...Fs(FR(cu - 52 + w1 + 6, H + 54), ox, oy), "7", 4)
      slant(c, ox, oy, cu - 66, H + 80, "FANTOVO", "E", 20)
      slant(c, ox, oy, cu - 66, H + 14, "NA'DRAZ^I'", "D", 17)
      ;[cu - 150, cu + 150].forEach((u) => { const [x, y] = Fs(FR(u, H), ox, oy); c.rect(x - 6, y - 40, 12, 40, "Q"); c.circ(x, y - 46, 7, "Q"); c.rect(x - 10, y - 4, 20, 6, light) })
    }
  }, glow("f", { r: 6, strength: 0.4 }))
}

// Díly podél osy a (od a = 9 do 37), hloubka 6 (b 11–16): křídlo 5, křídlo 4, věž, hala, rozbitá věž, křídlo 5, křídlo 4.
// Rozmístění je v src/places/hlavak.js.
fanta("lm_fanta_wing5", { kind: "wing", w: 5, seed: 3 })
fanta("lm_fanta_wing5b", { kind: "wing", w: 5, seed: 7 })
fanta("lm_fanta_wing4", { kind: "wing", w: 4, seed: 11 })
fanta("lm_fanta_tower", { kind: "tower", w: 2, seed: 5 })
fanta("lm_fanta_tower_broken", { kind: "tower", w: 2, seed: 9, broken: true })
fanta("lm_fanta_hall", { kind: "hall", w: 7, seed: 13 })

// Logo pražského metra (Jiří Rathouský): šipka dolů, jejíž horní část tvoří M, bílá kontura na černém čtverci; vedle
// čtverec linky C (červený, černé C). Tvar v jednotkovém čtverci (x doprava, y dolů), podle Wikimedia Commons
// „Metro Prague logo.svg“. METRO_ARROW je vnější obrys, METRO_HOLE vnitřek kontury.
const METRO_ARROW = [[0.27, 0.12], [0.40, 0.12], [0.50, 0.25], [0.60, 0.12], [0.73, 0.12], [0.73, 0.40], [0.87, 0.40], [0.87, 0.48], [0.50, 0.90], [0.13, 0.48], [0.13, 0.40], [0.27, 0.40]]
const METRO_HOLE = [[0.34, 0.20], [0.39, 0.20], [0.50, 0.34], [0.61, 0.20], [0.66, 0.20], [0.66, 0.47], [0.77, 0.47], [0.50, 0.78], [0.23, 0.47], [0.34, 0.47]]
// Značka metra na fasádě (pravá stěna, rovina u, v): černý čtverec s logem a vedle čtverec linky C.
function metroSign(c, ox, oy, u0, v0, size) {
  const P = (pts, col) => c.poly(Fs(pts, ox, oy), col)
  const map = (sq, pts) => pts.flatMap(([x, y]) => FR(sq + x * size, v0 + (1 - y) * size))
  P(Fq(FR, u0 - 2, u0 + size * 2 + 6, v0 - 2, v0 + size + 2), "m")
  P(Fq(FR, u0, u0 + size, v0, v0 + size), "k")
  P(map(u0, METRO_ARROW), "W"); P(map(u0, METRO_HOLE), "k")
  const u1 = u0 + size + 4
  P(Fq(FR, u1, u1 + size, v0, v0 + size), "7")
  // písmeno C: tlustý oblouk z obdélníků
  P(map(u1, [[0.28, 0.22], [0.72, 0.22], [0.72, 0.36], [0.44, 0.36], [0.44, 0.64], [0.72, 0.64], [0.72, 0.78], [0.28, 0.78]]), "k")
}

// Nová odbavovací hala (1972–1979, Bočan, Šrámková, Šrámek, Danda, Trnková) pod magistrálou: nízký brutalistní kvádr
// mezi Fantovou budovou a parkem, na střeše šestiproudá Wilsonova. Fasáda do parku (pravá stěna, +b): prosklená stěna
// s ocelovými sloupky, za sklem výrazně červený strop s odhalenými rozvody, nad ní souvislý pás betonové stropní
// konstrukce (žebrovaný parapet magistrály). Vchody s leštěnými kovovými portály. Po pádu: vraky na vozovce, v jednom
// dílu propadlá vozovka s pohledem do červené haly. Díly hloubky 6 (b 15–20) se kladou podél a za sebou.
const HALL_H = 112      // výška skleněné stěny
const DECK_T = 30       // tloušťka stropní desky (betonový pás na fasádě)
const DECK = HALL_H + DECK_T

const deckPt = (u, d, h = 0) => [u - d, -u / 2 - d / 2 - DECK - h] // bod na vozovce: u podél, d napříč od fasády

function car(c, ox, oy, u, d, col, rng) {
  const L = 44, Wd = 22, h = 14, P = (pts, k) => c.poly(Fs(pts, ox, oy), k)
  const q = (u0, u1, d0, d1, hh) => [...deckPt(u0, d0, hh), ...deckPt(u1, d0, hh), ...deckPt(u1, d1, hh), ...deckPt(u0, d1, hh)]
  P([...deckPt(u, d, 0), ...deckPt(u + L, d, 0), ...deckPt(u + L, d, h), ...deckPt(u, d, h)], col === "k" ? "k" : "S")
  P(q(u, u + L, d, d + Wd, h), col)
  P(q(u + 10, u + 30, d + 2, d + Wd - 2, h + 8), col === "k" ? "A" : "n")
  if (rng() < 0.5) P(q(u + 4, u + 14, d + 4, d + 12, h), "U")
}

function hallSeg(name, o) {
  const w = o.w, dpt = 6
  const W = FT * (w + dpt), Hc = 32 * (w + dpt) + DECK + 90
  const ox = FT * dpt, oy = Hc - 1, lenR = FT * w, lenL = FT * dpt
  sprite(name, { w: W, h: Hc }, (c) => {
    const rng = c.rng(o.seed ?? 1)
    const P = (pts, col) => c.poly(Fs(pts, ox, oy), col)
    // levá stěna (k severu): betonová, vidět jen na začátku řady
    P(Fq(FL, 0, lenL, 0, DECK), "t"); for (let u = 0; u < lenL; u += 16) P(Fq(FL, u, u + 2, 0, DECK), "T")
    if (o.viaduct) {
      // estakáda mimo halu: opěrná zeď z betonových panelů se spárami po 32, odstřik a stékance, žádná okna
      P(Fq(FR, 0, lenR, 0, HALL_H), "t")
      for (let u = 0; u <= lenR; u += 32) P(Fq(FR, u, u + 2, 0, HALL_H), "T")
      for (let v = 36; v < HALL_H; v += 36) P(Fq(FR, 0, lenR, v, v + 2), "T")
      c.clip(Fs(Fq(FR, 0, lenR, 0, 26), ox, oy), () => c.noise(0, 0, W, Hc, "x", 0.3, 85, "*"))
    } else {
    // prosklená stěna: tmavé sklo, ocelové sloupky po 32, horní čtvrtina ukazuje červený strop s trubkami
    P(Fq(FR, 0, lenR, 0, HALL_H), "n")
    P(Fq(FR, 0, lenR, HALL_H - 30, HALL_H), "V"); P(Fq(FR, 0, lenR, HALL_H - 30, HALL_H - 26), "D")
    for (let v = HALL_H - 22; v < HALL_H; v += 7) for (let u = 0; u < lenR; u += 4) if ((u / 4 + v) % 3) c.px(...Fs(FR(u, v), ox, oy), "m")
    P(Fq(FR, 0, lenR, HALL_H - 18, HALL_H - 16), "M")
    for (let u = 0; u <= lenR; u += 32) P(Fq(FR, u, u + 3, 0, HALL_H), "S")
    P(Fq(FR, 0, lenR, 44, 47), "S")
    // odraz a rozbité tabule
    for (let u = 8; u < lenR; u += 64) P(Fq(FR, u, u + 6, 50, HALL_H - 34), "L")
    for (let i = 0; i < 3 + Math.floor(rng() * 3); i++) { const u = Math.floor(rng() * (lenR / 32)) * 32 + 3, v = rng() < 0.5 ? 0 : 47; P(Fq(FR, u, u + 29, v, v + 40), "k"); c.line(...Fs(FR(u + 4, v + 30), ox, oy), ...Fs(FR(u + 20, v + 10), ox, oy), "l") }
    // vchod: leštěný kovový portál se dvěma křídly
    if (o.entrance) {
      const du = Math.floor(lenR / 2) - 48
      P(Fq(FR, du - 8, du + 104, 0, 70), "m"); P(Fq(FR, du - 4, du + 100, 0, 66), "W")
      P(Fq(FR, du, du + 96, 0, 60), "k"); for (let k = 0; k < 4; k++) P(Fq(FR, du + 2 + k * 24, du + 22 + k * 24, 2, 56), k % 2 ? "n" : "L")
      P(Fq(FR, du - 8, du + 104, 62, 66), "y")
      // nad vchodem značení metra (výstup z metra je touto halou)
      metroSign(c, ox, oy, du + 10, 70, 18)
    }
    }
    // stropní deska: souvislý betonový pás se svislým žebrováním, spodní hrana ve stínu
    P(Fq(FR, 0, lenR, HALL_H, DECK), "z"); P(Fq(FR, 0, lenR, HALL_H, HALL_H + 4), "T")
    for (let u = 4; u < lenR; u += 12) P(Fq(FR, u, u + 4, HALL_H + 6, DECK - 4), "t")
    // po pádu: stékance pod deskou přes sklo, graffiti na betonovém pásu a na spodních tabulích, zatlučené tabule
    for (let i = 0; i < lenR / 10; i++) { const u = 2 + Math.floor(rng() * (lenR - 4)), n = 10 + Math.floor(rng() * 50); const [x, y] = Fs(FR(u, HALL_H), ox, oy); c.vline(x, y, n, rng() < 0.4 ? "U" : "x") }
    const tags = ["SHERWOOD", "KANAL", "FANTA", "NEVYSTUPOVAT", "DPP", "ROBIN"]
    for (let i = 0; i < 2; i++) { const u = 16 + Math.floor(rng() * (lenR - 150)); const col = ["E", "7", "y", "l"][Math.floor(rng() * 4)]; const word = tags[Math.floor(rng() * tags.length)]; wallText(c, FR, ox, oy, u, HALL_H + 6, word, col, { sc: 2 }) }
    if (!o.viaduct) for (let i = 0; i < 3; i++) { const u = Math.floor(rng() * (lenR / 32)) * 32 + 3; P(Fq(FR, u, u + 29, 2, 42), "H"); for (let v = 6; v < 42; v += 9) P(Fq(FR, u, u + 29, v, v + 2), "h") }
    c.clip(Fs(Fq(FR, 0, lenR, 0, 16), ox, oy), () => c.noise(0, 0, W, Hc, "x", 0.35, 83, "*"))
    // vozovka magistrály na střeše
    const top = [...FR(0, DECK), ...FR(lenR, DECK), lenR - lenL, -lenR / 2 - lenL / 2 - DECK, ...FL(lenL, DECK)]
    P(top, "a")
    c.clip(Fs(top, ox, oy), () => c.noise(0, 0, W, Hc, "A", 0.05, 7, "*"))
    const line = (d, col, dash) => { for (let u = 0; u < lenR; u += dash ? 32 : lenR) { const u1 = Math.min(lenR, u + (dash ? 18 : lenR)); c.line(...Fs(deckPt(u, d), ox, oy), ...Fs(deckPt(u1, d), ox, oy), col) } }
    ;[64, 128, 256, 320].forEach((d) => line(d, "w", true)); line(188, "y"); line(196, "y")
    // písek a hlína nafoukané k parapetům, plevel z dilatačních spár
    for (let i = 0; i < 5; i++) { const u = 10 + rng() * (lenR - 60), d = rng() < 0.5 ? 14 + rng() * 20 : lenL - 40 - rng() * 20; c.ellipse(...Fs(deckPt(u, d), ox, oy), 26 + Math.floor(rng() * 20), 8, "e") }
    for (let u = 0; u < lenR; u += 4) if (rng() < 0.25) { const [x, y] = Fs(deckPt(u, 6 + rng() * 8), ox, oy); c.vline(x, y - 4, 4, "G") }
    // svodidla uprostřed, betonové parapety po krajích, lampy
    for (let u = 0; u < lenR; u += 16) { const [x, y] = Fs(deckPt(u, 192), ox, oy); c.rect(x - 1, y - 8, 3, 8, "m") }
    c.line(...Fs(deckPt(0, 192, 8), ox, oy), ...Fs(deckPt(lenR, 192, 8), ox, oy), "m", 2)
    P([...deckPt(0, 0), ...deckPt(lenR, 0), ...deckPt(lenR, 0, 14), ...deckPt(0, 0, 14)], "q")
    P([...deckPt(0, lenL - 8), ...deckPt(lenR, lenL - 8), ...deckPt(lenR, lenL - 8, 14), ...deckPt(0, lenL - 8, 14)], "p")
    for (let u = 20; u < lenR; u += 128) { const [x, y] = Fs(deckPt(u, 192), ox, oy); c.rect(x - 2, y - 76, 4, 70, "S"); c.line(x, y - 76, x + 18, y - 82, "S", 2); c.line(x, y - 76, x - 18, y - 70, "S", 2); c.rect(x + 16, y - 84, 6, 3, "n"); c.rect(x - 22, y - 72, 6, 3, "n") }
    // vraky
    const n = o.cars ?? 0 // vraky jsou samostatné rekvizity na vozovce (props.px.js), aby se mezi nimi dalo projít
    for (let i = 0; i < n; i++) car(c, ox, oy, 20 + Math.floor(rng() * (lenR - 80)), [76, 140, 212, 276][Math.floor(rng() * 4)], ["V", "b", "w", "k", "Q", "y"][Math.floor(rng() * 6)], rng)
    // propadlá vozovka: díra do červené haly, ulámané hrany, výztuž
    if (o.broken) {
      // Propadlina: zubatý obrys ve vozovce. Při pohledu shora je vidět řez stropní deskou jen na vzdálené hraně (nahoře),
      // pod ním zbytky červeného stropu haly s rozvody, dole tma a suť. Z hran trčí rezavá výztuž.
      const cu = lenR * 0.46, cd = 170, N = 22
      const ring = Array.from({ length: N }, (_, i) => {
        const t = i / N * Math.PI * 2, r = 0.75 + rng() * 0.45
        return deckPt(cu + Math.cos(t) * lenR * 0.2 * r, cd + Math.sin(t) * 78 * r)
      })
      const hole = Fs(ring.flat(), ox, oy)
      const down = (pts, dy) => pts.map((p, i) => (i % 2 ? p + dy : p))
      c.poly(hole, "T")                                      // řez deskou (zbyde jen nahoře)
      c.clip(hole, () => {
        c.poly(down(hole, DECK_T), "k")                      // pod řezem dutina
        c.poly(down(hole, DECK_T + 2), "V")                  // utržený červený strop hned pod deskou
        c.poly(down(hole, DECK_T + 14), "k")
        for (let i = 0; i < 9; i++) { const p = ring[Math.floor(rng() * N)]; const [x, y] = Fs(p, ox, oy); c.rect(x - 6, y + DECK_T + 4 + Math.floor(rng() * 8), 10 + Math.floor(rng() * 10), 4, rng() < 0.5 ? "D" : "V") }
        for (let i = 0; i < 6; i++) { const [x, y] = Fs(deckPt(cu + (rng() - 0.5) * lenR * 0.3, cd + (rng() - 0.3) * 70), ox, oy); c.line(x - 20, y + DECK_T + 10, x + 16, y + DECK_T + 2, "m") }
        // suť na podlaze haly hluboko dole
        const [bx, by] = Fs(deckPt(cu, cd - 30), ox, oy)
        c.noise(bx - 120, by + 60, 240, 80, "x", 0.18, 91, "k"); c.noise(bx - 100, by + 70, 200, 60, "P", 0.08, 93, "k")
      })
      // vrstvy v řezu desky (asfalt, beton) jako světlejší proužek
      c.clip(hole, () => { c.poly(down(hole, 6), "t"); c.poly(down(hole, 10), "T"); c.poly(down(hole, DECK_T), "k"); c.poly(down(hole, DECK_T + 2), "V"); c.poly(down(hole, DECK_T + 14), "k") })
      // zubatá hrana asfaltu a výztuž trčící do díry
      for (let i = 0; i < N; i++) { const [x0, y0] = Fs(ring[i], ox, oy), [x1, y1] = Fs(ring[(i + 1) % N], ox, oy); c.line(x0, y0, x1, y1, "A", 2) }
      for (let i = 0; i < N; i += 2) { const [x, y] = Fs(ring[i], ox, oy); const [cx, cy] = Fs(deckPt(cu, cd), ox, oy); const dx = Math.sign(cx - x) * (6 + rng() * 10), dy = Math.sign(cy - y) * (3 + rng() * 6); c.line(x, y, Math.round(x + dx), Math.round(y + dy + (rng() < 0.5 ? 8 : 0)), "U") }
    }
  })
}
hallSeg("lm_hall_a", { w: 5, seed: 3 })
hallSeg("lm_hall_entrance", { w: 5, seed: 7, entrance: true })
hallSeg("lm_hall_broken", { w: 5, seed: 11, broken: true })
hallSeg("lm_hall_b", { w: 5, seed: 13 })
hallSeg("lm_hall_c", { w: 4, seed: 17 })

// Estakáda magistrály mimo halu: stejná vozovka ve výšce desky, pod ní opěrná zeď (magistrála je po celé délce
// v jedné úrovni; nahoru se chodí jen točitými schodišti ve věžích).
hallSeg("lm_viaduct_4", { w: 4, seed: 21, viaduct: true })
hallSeg("lm_viaduct_5", { w: 5, seed: 23, viaduct: true })
hallSeg("lm_viaduct_5b", { w: 5, seed: 29, viaduct: true })
hallSeg("lm_viaduct_6", { w: 6, seed: 31, viaduct: true })

// Prosklená schodišťová věž před halou (1 dlaždice): ocelový rám, sklo, uvnitř červená lomená schodiště, nahoře
// skleněná kupole s žebry. Vede z plácku na magistrálu (ve hře přechod mezi úrovněmi). Geometrie jako díly.
const TOWER_H = DECK + 34
sprite("lm_stair_tower", { w: 128, h: 64 + TOWER_H + 70 }, (c) => {
  const ox = 64, oy = 64 + TOWER_H + 69, len = 64, H = TOWER_H
  const P = (pts, col) => c.poly(Fs(pts, ox, oy), col)
  P(Fq(FL, 0, len, 0, H), "n"); P(Fq(FR, 0, len, 0, H), "L")
  // točité schodiště: středový sloup a šroubovice (tři otáčky) se souvislým zábradlím po obvodu. Nejdřív zadní polovina
  // (tmavší), pak sloup, pak přední polovina (výrazně červená), aby šroubovice kroužila kolem sloupu.
  const [cx0, cy0] = Fs([0, -len / 2], ox, oy)
  const turns = 3, steps = 120, R = 28
  const pts = Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps, ang = t * Math.PI * 2 * turns, z = Math.round(t * (H - 12))
    return { x: cx0 + Math.round(Math.cos(ang) * R), y: cy0 + Math.round(Math.sin(ang) * R / 2) - z, cy: cy0 - z, back: Math.sin(ang) < 0, i }
  })
  const draw = (back) => pts.forEach((p, i) => {
    if (p.back !== back || i === 0) return
    if (i % 4 === 0) c.line(cx0, p.cy, p.x, p.y, back ? "D" : "V", 2)
    const q = pts[i - 1]; c.line(q.x, q.y - 4, p.x, p.y - 4, back ? "R" : "7", 2)
  })
  draw(true)
  c.rect(cx0 - 3, cy0 - H, 7, H, "S"); c.rect(cx0 - 3, cy0 - H, 2, H, "m")
  draw(false)
  for (let v = 0; v <= H; v += 28) { P(Fq(FR, 0, len, v, v + 2), "S"); P(Fq(FL, 0, len, v, v + 2), "S") }
  ;[0, 31, 62].forEach((u) => { P(Fq(FR, u, u + 2, 0, H), "S"); P(Fq(FL, u, u + 2, 0, H), "S") })
  P(Fq(FR, 34, 60, 50, 78), "k"); c.line(...Fs(FR(38, 76), ox, oy), ...Fs(FR(50, 54), ox, oy), "l")
  // dveře dole do plácku
  P(Fq(FR, 18, 46, 0, 44), "m"); P(Fq(FR, 21, 43, 0, 41), "n")
  // střecha a kupole: věnec, skleněná polokoule s žebry a odleskem
  const top = [...FR(0, H), ...FR(len, H), 0, -len - H, ...FL(len, H)]
  P(top, "S")
  const [cx, cy] = Fs([0, -len / 2 - H], ox, oy)
  c.clip([cx - 46, cy - 50, 92, 50], () => c.ellipse(cx, cy, 44, 46, "L"))
  for (let k = -36; k <= 36; k += 12) c.line(cx + k, cy, cx + Math.round(k / 4), cy - 44, "S")
  c.line(cx - 44, cy - 2, cx + 44, cy - 2, "S", 2); c.line(cx - 38, cy - 22, cx + 38, cy - 22, "S")
  c.line(cx - 20, cy - 36, cx - 28, cy - 14, "l", 2)
  c.rect(cx - 3, cy - 52, 6, 8, "S")
})

// Nádražní halové lodě (dvě souběžné valené haly za Fantovou budovou, plech a sklo, 1901–1909): díl přes w dlaždic
// podél a a dpt napříč. Valená střecha z pásů (bližší polovina světlejší), světlíkový pás u vrcholu, žebra po 32,
// boční prosklená stěna se sloupy; čelní díl má prosklený oblouk s mřížkou příček. Po pádu: vybité tabule, díry.
// Geometrie jako ostatní díly: počátek v nejbližším spodním rohu, x = 64·dpt; bod P(u, e, z): u podél a, e do hloubky.
const SHED_WALL = 70, SHED_RISE = 150
function shedSeg(name, o) {
  const w = o.w, dpt = o.dpt ?? 6
  const W = FT * (w + dpt), Hc = 32 * (w + dpt) + SHED_WALL + SHED_RISE + 8
  const ox = FT * dpt, oy = Hc - 1, lenR = FT * w, lenL = FT * dpt
  sprite(name, { w: W, h: Hc }, (c) => {
    const rng = c.rng(o.seed ?? 1)
    const Pt = (u, e, z) => [ox + u - e, oy - u / 2 - e / 2 - z]
    const zr = (e) => SHED_WALL + SHED_RISE * Math.sin(Math.PI * e / lenL)
    const poly = (pts, col) => c.poly(pts.flat(), col)
    const N = 24
    // střecha od zadu dopředu
    for (let i = N - 1; i >= 0; i--) {
      const e1 = lenL * i / N, e2 = lenL * (i + 1) / N, z1 = zr(e1), z2 = zr(e2)
      const near = i < N / 2, top = Math.abs(i - N / 2 + 0.5) < 2.5
      const col = top ? (o.broken && rng() < 0.4 ? "k" : "l") : near ? (i % 2 ? "m" : "M") : (i % 2 ? "s" : "S")
      poly([Pt(0, e2, z2), Pt(lenR, e2, z2), Pt(lenR, e1, z1), Pt(0, e1, z1)], col)
      if (top) for (let u = 0; u < lenR; u += 16) if (rng() < (o.broken ? 0.35 : 0.12)) poly([Pt(u, e2, z2), Pt(u + 14, e2, z2), Pt(u + 14, e1, z1), Pt(u, e1, z1)], "k")
    }
    // žebra přes celý oblouk
    for (let u = 0; u <= lenR; u += 32) { let prev = Pt(u, 0, zr(0)); for (let i = 1; i <= N; i++) { const p = Pt(u, lenL * i / N, zr(lenL * i / N)); c.line(...prev, ...p, "S", 2); prev = p } }
    // hřeben a okapy
    let prevR = Pt(0, lenL / 2, zr(lenL / 2)); c.line(...prevR, ...Pt(lenR, lenL / 2, zr(lenL / 2)), "W")
    c.line(...Pt(0, 0, SHED_WALL), ...Pt(lenR, 0, SHED_WALL), "W", 2)
    // boční stěna k +b: sloupy a prosklení, dole průjezd (otevřeno k nástupišti), vybité tabule
    poly([Pt(0, 0, 0), Pt(lenR, 0, 0), Pt(lenR, 0, SHED_WALL), Pt(0, 0, SHED_WALL)], "n")
    poly([Pt(0, 0, 0), Pt(lenR, 0, 0), Pt(lenR, 0, 30), Pt(0, 0, 30)], "k")
    for (let u = 0; u <= lenR; u += 32) poly([Pt(u, 0, 0), Pt(u + 4, 0, 0), Pt(u + 4, 0, SHED_WALL), Pt(u, 0, SHED_WALL)], "S")
    for (let u = 4; u < lenR; u += 32) for (let z = 34; z < SHED_WALL; z += 12) { const b = rng() < 0.35; poly([Pt(u + 2, 0, z), Pt(u + 26, 0, z), Pt(u + 26, 0, z + 10), Pt(u + 2, 0, z + 10)], b ? "k" : "L") }
    // čelo (k −a): prosklený oblouk s mřížkou, rám
    if (o.gable) {
      const arc = []
      for (let i = 0; i <= N; i++) { const e = lenL * i / N; arc.push(Pt(0, e, zr(e))) }
      poly([Pt(0, 0, 0), ...arc, Pt(0, lenL, 0)], "n")
      for (let e = 16; e < lenL; e += 24) { const zt = zr(e); for (let z = 0; z < zt - 6; z += 18) { const b = rng() < 0.3; poly([Pt(0, e, z), Pt(0, e + 20, z), Pt(0, e + 20, Math.min(z + 15, zr(e + 20) - 4)), Pt(0, e, Math.min(z + 15, zt - 4))], b ? "k" : "L") } }
      for (let e = 0; e <= lenL; e += 24) c.line(...Pt(0, e, 0), ...Pt(0, e, zr(e)), "S")
      for (let z = 0; z < SHED_WALL + SHED_RISE; z += 18) { const pts = arc.filter(([, y]) => true); c.line(...Pt(0, 0, Math.min(z, SHED_WALL)), ...Pt(0, lenL, Math.min(z, SHED_WALL)), "S") }
      for (let i = 1; i < arc.length; i++) { c.line(...arc[i - 1], ...arc[i], "S", 4); c.line(arc[i - 1][0], arc[i - 1][1] + 3, arc[i][0], arc[i][1] + 3, "m") }
    }
  })
}
shedSeg("lm_shed_gable", { w: 4, seed: 3, gable: true })
shedSeg("lm_shed_a", { w: 4, seed: 5 })
shedSeg("lm_shed_b", { w: 4, seed: 7, broken: true })

// Nástupištní přístřešek (1 dlaždice podél a): hnědá zaoblená střecha na sloupu uprostřed, kladou se za sebou.
sprite("canopy", { w: 160, h: 150 }, (c) => {
  const B = [80, 146], P = (u, e, z) => [B[0] + u - e, B[1] - u / 2 - e / 2 - z]
  const poly = (pts, col) => c.poly(pts.flat(), col)
  c.rect(B[0] - 3, B[1] - 74, 6, 74, "S"); c.rect(B[0] - 3, B[1] - 74, 2, 74, "s")
  const zr = (e) => 76 + 10 * Math.sin(Math.PI * (e + 40) / 80)
  for (let i = 7; i >= 0; i--) { const e1 = -40 + i * 10, e2 = e1 + 10; poly([P(-32, e2, zr(e2)), P(32, e2, zr(e2)), P(32, e1, zr(e1)), P(-32, e1, zr(e1))], i < 4 ? "h" : "H") }
  c.line(...P(-32, -40, zr(-40)), ...P(32, -40, zr(-40)), "K", 2)
  for (let u = -28; u < 32; u += 16) c.px(...P(u, -40, zr(-40) - 2), "U")
})
// Trakční stožár: příhradový sloup s výložníkem nad kolej.
sprite("catenary", { w: 80, h: 190 }, (c) => {
  const x = 20, base = 186
  c.rect(x - 4, base - 4, 12, 6, "x")
  c.rect(x - 3, base - 170, 2, 170, "S"); c.rect(x + 3, base - 170, 2, 170, "S")
  for (let y = base - 170; y < base; y += 10) { c.line(x - 3, y, x + 4, y + 10, "s"); c.line(x + 4, y, x - 3, y + 10, "s") }
  c.line(x, base - 160, x + 56, base - 132, "S", 2); c.line(x, base - 140, x + 56, base - 132, "s")
  c.line(x + 56, base - 132, x + 56, base - 118, "M"); c.rect(x + 52, base - 118, 8, 2, "m")
})

// Dveře Fantovy budovy (portál ve střední hale, šířka 36 podél fasády, výška 46): animace otevírání, 4 snímky.
// Počátek (2, h − 2) je spodní levý roh dveří na fasádě (FR(0, 0)), ve hře se kotví na bod fasády.
anim("door_fanta", { w: 44, h: 72, frames: 4, fps: 8 }, (c) => {
  const ox = 2, oy = 70
  const P = (pts, col) => c.poly(Fs(pts, ox, oy), col)
  const open = c.frame / 3 // 0 zavřeno → 1 otevřeno
  P(Fq(FR, 0, 36, 0, 46), "k")
  const leaf = Math.round(16 * (1 - open))
  if (leaf > 0) {
    P(Fq(FR, 2, 2 + leaf, 2, 44), "H"); P(Fq(FR, 34 - leaf, 34, 2, 44), "H")
    P(Fq(FR, 4, 2 + leaf - 2, 6, 20), "h"); P(Fq(FR, 4, 2 + leaf - 2, 24, 40), "h")
    P(Fq(FR, 36 - leaf, 32, 6, 20), "h"); P(Fq(FR, 36 - leaf, 32, 24, 40), "h")
  }
  // světlo zevnitř (nástupiště) prosvítá škvírou
  if (open > 0) { P(Fq(FR, 2 + leaf, 34 - leaf, 2, 44), "k"); P(Fq(FR, 2 + leaf, 34 - leaf, 2, 6), "P") } // uvnitř tma, na prahu světlejší dlažba
})
