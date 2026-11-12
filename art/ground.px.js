// Zem místa z vektorů OpenStreetMap (scripts/osm.mjs → art/ground-<místo>.px.js volá groundMap). Místo dlaždic po
// 7,5 m se zem kreslí po pixelech: silnice ve skutečné šířce, chodníky, cestičky v parku, přechody, koleje s pražci
// a tramvajové žlábky tam, kde opravdu vedou. Obrázek mapy (obdélník jako RenderTexture ve WorldScene.buildGround) se
// řeže na čtverce `chunk`; každý se kreslí s okrajem M, aby praskliny, písek u obrubníků a hrany navazovaly přes šev.
// Textury se počítají ze souřadnic ve světě (metry na zemi), ne z dílu, takže na švech nic neskočí.
// Materiál: hlína (výchozí), suchá tráva, mlat, dlažba, mozaika, kostky, asfalt, štěrk, nástupiště, prkna, dvůr, schody,
// zebra. Šum jen u zrnitých materiálů (asfalt, štěrk, hlína, mlat), dlažba a mozaika mají kostky a spáry.
const GM = { none: 0, dirt: 1, grass: 2, mlat: 3, paving: 4, mosaic: 5, sett: 6, asphalt: 7, ballast: 8, platform: 9, boards: 10, yard: 11, steps: 12, zebra: 13, water: 14, pier: 15, mud: 16, scree: 17 }
// Pořadí materiálů z dlaždic mřížky (osm.mjs posílá index do 'tznxbLwmhk').
const TILE_MAT = [GM.ballast, GM.ballast, GM.platform, GM.boards, GM.yard, GM.yard, GM.water, GM.pier, GM.mud, GM.scree]
const LOCKED = new Set([GM.ballast, GM.platform, GM.boards, GM.yard, GM.water, GM.pier, GM.mud, GM.scree])
const SOFT = new Set([GM.dirt, GM.grass, GM.mlat])
const HARD = new Set([GM.asphalt, GM.sett, GM.zebra])
const WALK = new Set([GM.paving, GM.mosaic, GM.steps])

// Deterministický hash celých čísel → 0..1 a hladký hodnotový šum (bilineárně, smoothstep) nad metry na zemi.
const ih = (x, y, s) => {
  let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 2147483647)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}
const vn = (x, y, scale, s) => {
  const fx = x / scale, fy = y / scale, x0 = Math.floor(fx), y0 = Math.floor(fy)
  const tx = fx - x0, ty = fy - y0, sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty)
  const a = ih(x0, y0, s), b = ih(x0 + 1, y0, s), c = ih(x0, y0 + 1, s), d = ih(x0 + 1, y0 + 1, s)
  return (a + (b - a) * sx) * (1 - sy) + (c + (d - c) * sx) * sy
}
const pickW = (r, table) => { let acc = 0; for (const [k, w] of table) { acc += w; if (r < acc) return k } return table[table.length - 1][0] }

function groundMap(place, D) {
  const CH = D.chunk, M = 24, BW = CH + 2 * M
  const LEN = D.len, WID = D.wid, TILEM = D.tile
  const gx0 = -64, gy0 = -LEN * 32 - 32
  const sx = (a, b) => (a + b) * 64, sy = (a, b) => (b - a) * 32
  // Plochy seřazené podle vrstvy (stabilně), s obrazovkovými souřadnicemi a ohraničením předem.
  const feats = D.features.map((f, i) => {
    const xs = [], ys = []
    for (let k = 0; k < f.p.length; k += 2) { xs.push(sx(f.p[k], f.p[k + 1])); ys.push(sy(f.p[k], f.p[k + 1])) }
    return { m: GM[f.m], z: f.z ?? 0, i, on: f.on ? new Set(f.on.map((n) => GM[n])) : null, xs, ys, x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) }
  }).sort((p, q) => p.z - q.z || p.i - q.i)
  const lines = D.lines.map((l) => {
    const pts = []
    for (let k = 0; k < l.p.length; k += 2) pts.push([l.p[k], l.p[k + 1]])
    return { k: l.k, pts }
  })
  const tiles = []
  for (let k = 0; k < D.tiles.length; k += 3) tiles.push([D.tiles[k], D.tiles[k + 1], TILE_MAT[D.tiles[k + 2]]])

  const names = []
  D.chunks.forEach(([ci, cj]) => {
    const name = `gr_${place}_${ci}_${cj}`
    names.push(name)
    sprite(name, { w: CH, h: CH }, (c) => paintChunk(c, ci * CH, cj * CH))
  })
  for (let s = 0; s * 8 < names.length; s++) sheet(`ground_${place}_${s}`, names.slice(s * 8, s * 8 + 8), { pad: 1 })

  function paintChunk(c, ox, oy) {
    // Pixel (x, y) bufferu je na obrazovce v bodě (X, Y); X = gx0 + ox + x − M + 0,5.
    const X0 = gx0 + ox - M + 0.5, Y0 = gy0 + oy - M + 0.5
    const mat = new Uint8Array(BW * BW)
    const toA = (X, Y) => (X / 64 - Y / 32) / 2, toB = (X, Y) => (X / 64 + Y / 32) / 2
    for (let y = 0; y < BW; y++) for (let x = 0; x < BW; x++) {
      const X = X0 + x, Y = Y0 + y, a = toA(X, Y), b = toB(X, Y)
      if (a >= -0.5 && a <= LEN - 0.5 && b >= -0.5 && b <= WID - 0.5) mat[y * BW + x] = GM.dirt
    }
    // Vyplnění mnohoúhelníku (sudý-lichý, středy pixelů) v souřadnicích bufferu; `test` rozhodne, jestli smí přepsat.
    const fillPoly = (xs, ys, m, test) => {
      const n = xs.length
      let ymin = Infinity, ymax = -Infinity
      for (let k = 0; k < n; k++) { ymin = Math.min(ymin, ys[k]); ymax = Math.max(ymax, ys[k]) }
      const ya = Math.max(0, Math.floor(ymin - 0.5)), yb = Math.min(BW - 1, Math.ceil(ymax - 0.5))
      const cut = []
      for (let y = ya; y <= yb; y++) {
        const yc = y + 0.5
        cut.length = 0
        for (let k = 0, j = n - 1; k < n; j = k++) {
          const y1 = ys[k], y2 = ys[j]
          if ((y1 > yc) !== (y2 > yc)) cut.push(xs[k] + (yc - y1) * (xs[j] - xs[k]) / (y2 - y1))
        }
        cut.sort((p, q) => p - q)
        for (let k = 0; k + 1 < cut.length; k += 2) {
          const xa = Math.max(0, Math.ceil(cut[k] - 0.5)), xb = Math.min(BW - 1, Math.floor(cut[k + 1] - 0.5))
          for (let x = xa; x <= xb; x++) { const i = y * BW + x; if (mat[i] && test(mat[i])) mat[i] = m }
        }
      }
    }
    const bx = (X) => X - X0, by = (Y) => Y - Y0
    // 1. Dlaždice kolejiště, nástupišť a půdorysů.
    tiles.forEach(([a, b, m]) => {
      const xs = [sx(a - 0.5, b - 0.5), sx(a + 0.5, b - 0.5), sx(a + 0.5, b + 0.5), sx(a - 0.5, b + 0.5)].map(bx)
      const ys = [sy(a - 0.5, b - 0.5), sy(a + 0.5, b - 0.5), sy(a + 0.5, b + 0.5), sy(a - 0.5, b + 0.5)].map(by)
      fillPoly(xs, ys, m, () => true)
    })
    // 2. Vektory podle vrstev; kolejiště a půdorysy z mřížky zůstávají.
    const cx0 = X0, cx1 = X0 + BW, cy0 = Y0, cy1 = Y0 + BW
    feats.forEach((f) => {
      if (f.x1 < cx0 || f.x0 > cx1 || f.y1 < cy0 || f.y0 > cy1) return
      fillPoly(f.xs.map(bx), f.ys.map(by), f.m, (cur) => !LOCKED.has(cur) && (!f.on || f.on.has(cur)))
    })
    // 3. Vzdálenost asfaltu od měkkého okraje (písek a hlína nafoukané z parku), BFS do 7 px.
    const dist = new Uint8Array(BW * BW).fill(255)
    let q = []
    for (let i = 0; i < BW * BW; i++) if (SOFT.has(mat[i])) { dist[i] = 0; q.push(i) }
    for (let d = 1; d <= 7 && q.length; d++) {
      const nq = []
      for (const i of q) {
        const x = i % BW
        for (const j of [i - 1, i + 1, i - BW, i + BW]) {
          if (j < 0 || j >= BW * BW || (j === i - 1 && x === 0) || (j === i + 1 && x === BW - 1)) continue
          if (dist[j] === 255 && HARD.has(mat[j])) { dist[j] = d; nq.push(j) }
        }
      }
      q = nq
    }
    // Vzdálenost vody od břehu (pěna a světlý pás), BFS do 3 px; přepisuje dist jen u vodních pixelů.
    q = []
    for (let i = 0; i < BW * BW; i++) if (mat[i] && mat[i] !== GM.water) for (const j of [i - 1, i + 1, i - BW, i + BW]) if (j >= 0 && j < BW * BW && mat[j] === GM.water && dist[j] === 255) { dist[j] = 1; q.push(j) }
    for (let d = 2; d <= 3 && q.length; d++) { const nq = []; for (const i of q) for (const j of [i - 1, i + 1, i - BW, i + BW]) if (j >= 0 && j < BW * BW && mat[j] === GM.water && dist[j] === 255) { dist[j] = d; nq.push(j) } q = nq }
    // 4. Textury.
    const key = new Array(BW * BW).fill(null)
    const M4 = (i) => [mat[i - 1], mat[i + 1], mat[i - BW], mat[i + BW]]
    for (let y = 1; y < BW - 1; y++) for (let x = 1; x < BW - 1; x++) {
      const i = y * BW + x, m = mat[i]
      if (!m) continue
      const X = X0 + x, Y = Y0 + y
      const am = toA(X, Y) * TILEM, bm = toB(X, Y) * TILEM
      const ix = Math.floor(X), iy = Math.floor(Y)
      // zrno po dvou pixelech vodorovně (izometrický pixel art), posunuté po řádcích, ať netvoří svislé pruhy
      const gx = Math.floor((ix + (iy & 1)) / 2)
      const r = ih(gx, iy, m * 7 + 1), r2 = ih(gx, iy, 991)
      let k
      if (m === GM.dirt || m === GM.yard) {
        const n = vn(am, bm, 4, 3)
        k = r < (n - 0.5) * 1.6 ? "C" : r < (0.42 - n) * 1.6 ? "3" : r < 0.18 ? "4" : "e"
        if (r2 < 0.03) k = "3"; else if (r2 < 0.05) k = "x"
        if (m === GM.yard) k = r < 0.5 ? "P" : r < 0.8 ? "x" : "3"
      } else if (m === GM.grass) {
        const n1 = vn(am, bm, 5, 11), n2 = vn(am, bm, 1.3, 12)
        // holá místa (sešlapaná, vyprahlá) přecházejí do trávy rozptylem, tráva sama je směs dvou olivových tónů
        const bare = (n1 - 0.58) * 6
        if (r2 < bare) { k = r < 0.25 ? "3" : r < 0.35 ? "C" : "e" }
        else { k = r < 0.2 + n2 * 0.4 ? "g" : r < 0.75 ? "4" : r < 0.88 ? "G" : "e"; if (r2 > 0.95) k = "C"; else if (r2 > 0.92) k = "3" }
      } else if (m === GM.mlat) {
        k = r < 0.1 ? "e" : r < 0.3 ? "c" : r < 0.34 ? "v" : "C"
        if (vn(am, bm, 3, 21) > 0.78) k = r < 0.6 ? "e" : "C"
        if (M4(i).some((n) => n !== GM.mlat && SOFT.has(n))) k = r < 0.6 ? "e" : "3"
      } else if (m === GM.paving || m === GM.platform) {
        const s = m === GM.platform ? 1.5 : 1.0, u = am / s, v = bm / s
        const fu = u - Math.floor(u), fv = v - Math.floor(v), cu = Math.floor(u), cv = Math.floor(v)
        const slab = ih(cu, cv, 31)
        if (fu < 0.07 || fv < 0.07) k = ih(ix, iy, 33) < 0.04 ? "g" : "P"
        else k = slab < 0.05 ? (r < 0.5 ? "P" : "e") : m === GM.platform ? (slab < 0.92 ? "q" : "p") : slab < 0.6 ? "q" : slab < 0.92 ? "p" : "5"
        if (vn(am, bm, 4, 34) > 0.7 && r2 < 0.45) k = r < 0.5 ? "C" : "e"
      } else if (m === GM.mosaic) {
        const cu = Math.floor(am / 0.22), cv = Math.floor(bm / 0.22), t = ih(cu, cv, 41)
        k = t < 0.5 ? "q" : t < 0.8 ? "p" : t < 0.9 ? "w" : "P"
        if (vn(am, bm, 3, 42) > 0.72 && r2 < 0.5) k = r < 0.5 ? "C" : "e"
        if (vn(am, bm, 1.6, 43) > 0.86) k = r < 0.5 ? "e" : "3"
      } else if (m === GM.sett) {
        const row = Math.floor(bm / 0.3), u = am / 0.3 + (row % 2) * 0.5
        const fu = u - Math.floor(u), fv = bm / 0.3 - row
        const t = ih(Math.floor(u), row, 51)
        k = fu < 0.14 || fv < 0.14 ? "A" : t < 0.4 ? "x" : t < 0.8 ? "P" : "B"
      } else if (m === GM.asphalt || m === GM.zebra) {
        k = r2 < (vn(am, bm, 7, 61) - 0.6) * 4 ? "A" : "a"
        if (r < 0.07) k = "A"; else if (r < 0.12) k = "B"; else if (r < 0.13) k = "x"
        if (vn(am, bm, 2.2, 62) > 0.92) k = r < 0.7 ? "A" : "k"
        if (m === GM.zebra && ih(Math.floor(am / 0.4), Math.floor(bm / 0.4), 63) > 0.3) k = r < 0.85 ? "W" : "w"
        const d = dist[i]
        if (d !== 255 && r2 < (7 - d) / 7 * 0.85) k = r < 0.55 ? "C" : "e"
      } else if (m === GM.ballast) {
        k = pickW(r, [["x", 0.35], ["v", 0.2], ["P", 0.25], ["3", 0.1], ["q", 0.1]])
        if (vn(am, bm, 3, 71) > 0.72 && r2 < 0.4) k = r < 0.5 ? "G" : "g"
      } else if (m === GM.water) {
        // Voda po pádu: tmavá hloubka, světlejší vlnky podél osy a, světlý pás a pěna u břehu, sem tam plovoucí dřevo
        const n = vn(am, bm, 6, 301)
        const wave = Math.sin((am * 1.7 + bm * 0.4) + vn(am, bm, 3, 302) * 6)
        k = n < 0.35 ? "X" : "Z"
        if (wave > 0.93 && r < 0.7) k = "J"
        if (r2 > 0.995) k = r < 0.5 ? "H" : "x"
        const shore = dist[i]
        if (shore !== 255 && shore <= 3) k = shore <= 1 ? (r < 0.6 ? "w" : "J") : r < 0.5 ? "J" : "Z"
      } else if (m === GM.pier) {
        // molo: prkna napříč (podél b), mezery, hřebíky, krajní trámy
        const u = am / 0.3, fu = u - Math.floor(u)
        k = fu < 0.12 ? "k" : ih(Math.floor(u), Math.floor(bm / 3), 311) < 0.5 ? "h" : "H"
        if (M4(i).some((n) => n === GM.water)) k = "3"
      } else if (m === GM.mud) {
        // suché koryto Vltavy: tmavé bahno s loužemi, vyschlé praskliny, kameny, sem tam rezavý vrak a ryba
        const n = vn(am, bm, 5, 321), n2 = vn(am, bm, 1.4, 322)
        k = n < 0.32 ? "H" : r < 0.5 ? "O" : r < 0.8 ? "h" : "e"
        if (n > 0.7) k = r < 0.4 ? "X" : "Z"
        else if (n2 > 0.84) k = "K"
        if (r2 > 0.992) k = r < 0.5 ? "x" : "U"
      } else if (m === GM.scree) {
        // svah pod Hradem (k): hlína a suť sjetá z kopce. Velké skvrny tmavší hlíny a světlejší sutě, jemné jazyky
        // po spádu (podél b), řídké kameny se světlou horní a tmavou spodní hranou, sem tam cihla a suchý trs.
        const n = vn(am, bm, 6, 332), fall = vn(am * 2, bm * 0.5, 2, 331)
        k = n < 0.38 ? (r < 0.6 ? "3" : "e") : n > 0.66 ? (r < 0.5 ? "x" : r < 0.8 ? "e" : "v") : r < 0.55 ? "e" : r < 0.85 ? "3" : "x"
        if (fall < 0.22 && r2 < 0.6) k = "3"
        const su = am / 1.1, sv = bm / 1.1, cu = Math.floor(su), cv = Math.floor(sv), st = ih(cu, cv, 333)
        if (st < 0.16) {
          const du = su - cu - 0.5, dv = sv - cv - 0.5, rr = 0.14 + ih(cu, cv, 334) * 0.16
          const d = Math.hypot(du, dv)
          if (d < rr) k = dv < -rr * 0.35 ? "v" : dv > rr * 0.4 ? "A" : st < 0.03 ? "r" : "x"
          else if (d < rr + 0.08 && dv > 0) k = "A"
        }
        if (r2 > 0.993) k = r < 0.5 ? "R" : "g"
      } else if (m === GM.boards) {
        const u = am / 0.32, fu = u - Math.floor(u)
        k = fu < 0.15 ? "k" : ih(Math.floor(u), 0, 81) < 0.5 ? "h" : "H"
      } else if (m === GM.steps) {
        const u = am / 0.33, fu = u - Math.floor(u)
        k = fu < 0.25 ? "P" : r < 0.7 ? "q" : "p"
      }
      key[i] = k
    }
    // 5. Hrany: obrubník mezi chodníkem a vozovkou (světlá hrana kamene, tmavý stín na asfaltu), tmavší kraj trávy u cest,
    // hrana nástupiště nad štěrkem (tmavá spára a vybledlá žlutá čára).
    for (let y = 1; y < BW - 1; y++) for (let x = 1; x < BW - 1; x++) {
      const i = y * BW + x, m = mat[i]
      if (!m) continue
      const nb = M4(i)
      if (WALK.has(m) && nb.some((n) => HARD.has(n))) key[i] = ih(x + X0, y + Y0, 91) < 0.15 ? "v" : "W"
      else if (HARD.has(m) && nb.some((n) => WALK.has(n))) key[i] = "A"
      else if (m === GM.grass && nb.some((n) => WALK.has(n) || n === GM.mlat || HARD.has(n))) key[i] = "G"
      else if (m === GM.platform && nb.some((n) => n === GM.ballast)) key[i] = "P"
    }
    // Trsy suché trávy: v buňce 7 × 5 px s pravděpodobností 0,22 pár stébel od paty nahoru (světlá a tmavá stébla).
    for (let y = 6; y < BW - 1; y += 5) for (let x = 2; x < BW - 3; x += 7) {
      const gx = Math.floor(x + X0), gy = Math.floor(y + Y0)
      const ox = Math.floor(ih(gx, gy, 201) * 5), oy = Math.floor(ih(gx, gy, 202) * 4)
      const fx = x + ox, fy = y + oy
      if (fy >= BW || mat[fy * BW + fx] !== GM.grass || ih(gx, gy, 203) > 0.22) continue
      for (let k = -2; k <= 2; k++) {
        const h = 2 + Math.floor(ih(gx + k, gy, 204) * 4)
        for (let t = 0; t < h; t++) { const xx = fx + k + (t > 1 ? Math.sign(k) : 0), yy = fy - t; if (yy > 0 && xx >= 0 && xx < BW && mat[yy * BW + xx]) key[yy * BW + xx] = (k + t) % 3 === 0 ? "C" : k % 2 ? "4" : "G" }
      }
    }
    const toBuf = (a, b) => [sx(a, b) - X0, sy(a, b) - Y0]
    const put = (x, y, k, onSet) => {
      x = Math.round(x); y = Math.round(y)
      if (x < 0 || y < 0 || x >= BW || y >= BW) return
      const i = y * BW + x
      if (mat[i] && (!onSet || onSet.has(mat[i]))) key[i] = k
    }
    const seg = (x0, y0, x1, y1, fn) => {
      const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))))
      for (let s = 0; s <= n; s++) fn(x0 + (x1 - x0) * s / n, y0 + (y1 - y0) * s / n, s / n)
    }
    // 6. Praskliny v asfaltu: v každé buňce 5 × 5 m s pravděpodobností 0,45 náhodná lomená čára, v ní trsy plevele.
    const A0 = toA(X0, Y0 + BW), A1 = toA(X0 + BW, Y0), B0 = toB(X0, Y0), B1 = toB(X0 + BW, Y0 + BW)
    const cell = 5
    for (let ca = Math.floor(A0 * TILEM / cell) - 1; ca <= Math.ceil(A1 * TILEM / cell); ca++) for (let cb = Math.floor(B0 * TILEM / cell) - 1; cb <= Math.ceil(B1 * TILEM / cell); cb++) {
      if (ih(ca, cb, 101) > 0.45) continue
      let am = (ca + ih(ca, cb, 102)) * cell, bm = (cb + ih(ca, cb, 103)) * cell, ang = ih(ca, cb, 104) * Math.PI * 2
      const steps = 4 + Math.floor(ih(ca, cb, 105) * 8)
      for (let s = 0; s < steps; s++) {
        ang += (ih(ca, cb, 110 + s) - 0.5) * 1.4
        const step = 0.5 + ih(ca, cb, 130 + s) * 0.6
        const na = am + Math.cos(ang) * step, nb = bm + Math.sin(ang) * step
        const [x0, y0] = toBuf(am / TILEM, bm / TILEM), [x1, y1] = toBuf(na / TILEM, nb / TILEM)
        seg(x0, y0, x1, y1, (x, y) => put(x, y, "k", HARD))
        if (ih(ca, cb, 150 + s) < 0.18) { put(x1, y1 - 1, "g", HARD); put(x1 + 1, y1 - 2, "4", HARD); put(x1 - 1, y1 - 1, "g", HARD) }
        am = na; bm = nb
      }
    }
    // 7. Čáry: přerušované značení (3 m čára, 6 m mezera, ošoupané), koleje s pražci (na štěrku, hlíně a trávě)
    // a kolejnice: světlá hlava, tmavší bok; v asfaltu a dlažbě tramvajové kolejnice se žlábkem.
    const GAUGE = 0.7175 / TILEM
    lines.forEach(({ k, pts }) => {
      for (let s = 1; s < pts.length; s++) {
        const [a0, b0] = pts[s - 1], [a1, b1] = pts[s]
        const len = Math.hypot(a1 - a0, b1 - b0)
        if (len < 1e-6) continue
        const da = (a1 - a0) / len, db = (b1 - b0) / len, na = -db, nbb = da
        const xs = [sx(a0, b0), sx(a1, b1)], ys = [sy(a0, b0), sy(a1, b1)]
        if (Math.max(...xs) < X0 - 40 || Math.min(...xs) > X0 + BW + 40 || Math.max(...ys) < Y0 - 40 || Math.min(...ys) > Y0 + BW + 40) continue
        if (k === "dash") {
          const [x0, y0] = toBuf(a0, b0), [x1, y1] = toBuf(a1, b1)
          seg(x0, y0, x1, y1, (x, y, t) => {
            const along = (t * len * TILEM) % 9
            if (along < 3 && ih(Math.round(x + X0), Math.round(y + Y0), 171) > 0.25) put(x, y, "w", HARD)
          })
          continue
        }
        // pražce: po 0,6 m, 2,6 m dlouhé, 0,22 m široké, jen mimo zpevněný povrch
        const sleeper = k === "rail" ? "H" : "p"
        for (let t = 0; t < len * TILEM; t += 0.6) {
          const ca = a0 + da * t / TILEM, cb = b0 + db * t / TILEM
          if (ih(Math.round(ca * 100), Math.round(cb * 100), 181) < 0.06) continue
          const hl = 1.3 / TILEM, hw = 0.11 / TILEM
          const corners = [[ca + na * hl - da * hw, cb + nbb * hl - db * hw], [ca + na * hl + da * hw, cb + nbb * hl + db * hw], [ca - na * hl + da * hw, cb - nbb * hl + db * hw], [ca - na * hl - da * hw, cb - nbb * hl - db * hw]]
          const xs4 = corners.map(([a, b]) => sx(a, b) - X0), ys4 = corners.map(([a, b]) => sy(a, b) - Y0)
          const [mx, my] = toBuf(ca, cb), mi = Math.round(my) * BW + Math.round(mx)
          if (mi < 0 || mi >= BW * BW || !(mat[mi] === GM.ballast || SOFT.has(mat[mi]) || mat[mi] === GM.platform && false)) continue
          const ys = Math.max(0, Math.floor(Math.min(...ys4))), ye = Math.min(BW - 1, Math.ceil(Math.max(...ys4)))
          const xsS = Math.max(0, Math.floor(Math.min(...xs4))), xe = Math.min(BW - 1, Math.ceil(Math.max(...xs4)))
          for (let y = ys; y <= ye; y++) for (let x = xsS; x <= xe; x++) {
            let hit = false
            for (let p = 0, o = 3; p < 4; o = p++) if ((ys4[p] > y + 0.5) !== (ys4[o] > y + 0.5) && x + 0.5 < xs4[p] + (y + 0.5 - ys4[p]) * (xs4[o] - xs4[p]) / (ys4[o] - ys4[p])) hit = !hit
            if (hit && mat[y * BW + x] !== GM.boards) key[y * BW + x] = ih(x + Math.floor(X0), y + Math.floor(Y0), 183) < 0.2 ? "U" : sleeper
          }
        }
        // kolejnice
        ;[-1, 1].forEach((side) => {
          const [x0, y0] = toBuf(a0 + na * GAUGE * side, b0 + nbb * GAUGE * side), [x1, y1] = toBuf(a1 + na * GAUGE * side, b1 + nbb * GAUGE * side)
          seg(x0, y0, x1, y1, (x, y) => {
            const xi = Math.round(x), yi = Math.round(y), i = yi * BW + xi
            if (xi < 0 || yi < 0 || xi >= BW || yi + 1 >= BW || !mat[i]) return
            const paved = HARD.has(mat[i]) || WALK.has(mat[i])
            const rust = ih(xi + Math.floor(X0), yi + Math.floor(Y0), 191) < 0.18
            // hlava kolejnice je vyleštěná (světlá), místy rezavá; pod ní stín boku, v dlažbě tmavý žlábek
            key[i] = rust ? "U" : paved ? "v" : "w"
            key[i + BW] = paved ? "k" : "A"
            if (!paved && yi - 1 >= 0 && mat[i - BW] === GM.ballast && ih(xi, yi, 192) < 0.5) key[i - BW] = "M"
          })
        })
      }
    })
    // 8. Vnitřek dílu do sprite.
    for (let y = 0; y < CH; y++) for (let x = 0; x < CH; x++) {
      const k = key[(y + M) * BW + x + M]
      if (k) c.px(x, y, k)
    }
  }
}
