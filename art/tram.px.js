// Vrak tramvaje T3 natočený podle koleje: tram(name, { angle, damage }). angle je úhel osy soupravy v rovině mapy
// (stupně od osy a k ose b, jako atan2(db, da) v scripts/osm.mjs), sprite se pro každý úhel kreslí zvlášť jako
// promítnutý kvádr (14,7 × 2,5 × 3,1 m), takže sedí přesně na koleji. Střed soupravy na zemi je v bodě (OX, OY)
// plátna bez obrysu; WorldScene ho staví přes TRAM_ORIGIN v src/map.js (s obrysem +1 px).
// Barvy pražské T3: červená skříň, krémový pás pod okny a nad nimi, šedá střecha; po pádu rez, saze, vybitá okna.
const TRAM_W = 360, TRAM_H = 240, TRAM_OX = 180, TRAM_OY = 170
function tram(name, o) {
  const th = (o.angle ?? 0) * Math.PI / 180
  const dA = Math.cos(th), dB = Math.sin(th), nA = -Math.sin(th), nB = Math.cos(th)
  const L = 14.7, W = 2.5, H = 3.1, VS = 11.6, TILEM = 7.5
  const P = (am, bm, z) => [TRAM_OX + (am + bm) / TILEM * 64, TRAM_OY + (bm - am) / TILEM * 32 - z * VS]
  const at = (s, v, z) => P(s * dA + v * nA, s * dB + v * nB, z)
  const damage = o.damage ?? 0.6
  sprite(name, { w: TRAM_W, h: TRAM_H, outline: "k" }, (c) => {
    const rng = c.rng(Math.round((o.angle ?? 0) * 7 + damage * 100))
    const quad = (F, s0, s1, z0, z1, col) => c.poly([...F(s0, z0), ...F(s1, z0), ...F(s1, z1), ...F(s0, z1)], col)
    // stín pod vozem
    c.poly([...at(-L / 2 - 0.3, -W / 2 - 0.3, 0), ...at(L / 2 + 0.3, -W / 2 - 0.3, 0), ...at(L / 2 + 0.3, W / 2 + 0.6, 0), ...at(-L / 2 - 0.3, W / 2 + 0.6, 0)], "#0c0b0d80")
    // viditelné svislé stěny: vnější normála míří k divákovi (na obrazovce dolů)
    const visible = (na, nb) => (nb - na) > 1e-6
    const faces = []
    ;[-1, 1].forEach((sg) => { if (visible(nA * sg, nB * sg)) faces.push({ kind: "side", F: (s, z) => at(s, (W / 2) * sg, z), len: L }) })
    ;[-1, 1].forEach((sg) => { if (visible(dA * sg, dB * sg)) faces.push({ kind: "end", F: (v, z) => at((L / 2) * sg, v * sg * -1, z), len: W }) })
    faces.forEach(({ kind, F, len }) => {
      const s0 = -len / 2, s1 = len / 2
      // podvozek a sukně
      quad(F, s0, s1, 0.05, 0.4, "A")
      quad(F, s0, s1, 0.35, 1.2, "V")
      quad(F, s0, s1, 1.15, 1.28, "c")
      quad(F, s0, s1, 1.28, 2.45, "c")
      quad(F, s0, s1, 2.45, 2.85, "V")
      quad(F, s0, s1, 2.85, H, "B")
      if (kind === "side") {
        // podvozky (dva), mezi nimi tma
        ;[-4.6, 4.6].forEach((b) => quad(F, b - 1.2, b + 1.2, 0, 0.42, "k"))
        // okna mezi sloupky; troje dveře (dvoudílné, tmavé, s madlem)
        const doors = [-5.6, 0.2, 5.6]
        for (let s = s0 + 0.45; s < s1 - 0.6; s += 1.38) {
          const w0 = s, w1 = s + 1.1
          if (doors.some((d) => w1 > d - 0.7 && w0 < d + 0.7)) continue
          const roll = rng()
          quad(F, w0, w1, 1.36, 2.38, roll < 0.25 * (0.5 + damage) ? "k" : "n")
          if (roll >= 0.25 * (0.5 + damage)) { quad(F, w0 + 0.1, w0 + 0.3, 1.9, 2.3, "L"); if (roll > 0.85) c.line(...F(w0 + 0.2, 1.5), ...F(w1 - 0.2, 2.2), "W") }
        }
        doors.forEach((d) => {
          quad(F, d - 0.62, d + 0.62, 0.38, 2.42, "c")
          quad(F, d - 0.55, d - 0.03, 0.42, 2.36, rng() < damage * 0.5 ? "k" : "n")
          quad(F, d + 0.03, d + 0.55, 0.42, 2.36, rng() < damage * 0.4 ? "k" : "n")
        })
      } else {
        // čelo: velké okno, nad ním tabule linky, světla a nárazník
        quad(F, -1.0, 1.0, 1.35, 2.4, rng() < damage * 0.6 ? "k" : "n")
        quad(F, -0.6, 0.6, 2.5, 2.78, "k")
        quad(F, -1.0, -0.7, 0.85, 1.0, "y")
        quad(F, 0.7, 1.0, 0.85, 1.0, "y")
        quad(F, -1.2, 1.2, 0.3, 0.45, "k")
      }
      // rez a saze: skvrny po spodku i pod okny
      for (let i = 0; i < Math.round(len * 1.5 * damage); i++) {
        const s = s0 + rng() * (len - 0.6), z = 0.4 + rng() * 0.8, w = 0.2 + rng() * 0.6, h = 0.1 + rng() * 0.35
        quad(F, s, s + w, z, z + h, rng() < 0.6 ? "U" : "u")
      }
      for (let i = 0; i < Math.round(len * damage); i++) { const s = s0 + rng() * len; c.line(...F(s, 2.85), ...F(s + 0.05, 2.0 + rng() * 0.6), "U") }
      quad(F, s0, s1, 0.35, 0.55, "3")
      // sprej na skříni
      if (kind === "side" && damage > 0.5) { const s = -2 + rng() * 3; for (let k = 0; k < 5; k++) c.line(...F(s + k * 0.35, 0.55 + rng() * 0.3), ...F(s + k * 0.35 + 0.25, 0.95 + rng() * 0.15), rng() < 0.5 ? "7" : "E") }
      // hrany stěny
      c.line(...F(s0, 0.35), ...F(s0, H), "D")
    })
    // střecha a pantograf (kosodélník z tyčí nad středem vozu)
    c.poly([...at(-L / 2, -W / 2, H), ...at(L / 2, -W / 2, H), ...at(L / 2, W / 2, H), ...at(-L / 2, W / 2, H)], "M")
    c.poly([...at(-L / 2 + 0.3, -W / 2 + 0.25, H), ...at(L / 2 - 0.3, -W / 2 + 0.25, H), ...at(L / 2 - 0.3, W / 2 - 0.25, H), ...at(-L / 2 + 0.3, W / 2 - 0.25, H)], "B")
    for (let i = 0; i < 6; i++) { const s = -L / 2 + 1 + rng() * (L - 2), v = (rng() - 0.5) * (W - 0.8); c.poly([...at(s, v, H), ...at(s + 0.8, v, H), ...at(s + 0.8, v + 0.4, H), ...at(s, v + 0.4, H)], "U") }
    const base = [at(-0.9, 0, H + 0.15), at(0.9, 0, H + 0.15)], top = at(0.2, 0, H + 1.3)
    base.forEach((b) => c.line(...b, ...top, "m"))
    c.line(...at(-0.3, -0.9, H + 1.3), ...at(0.7, 0.9, H + 1.3), "m")
    c.line(...at(-0.9, -0.4, H + 0.12), ...at(0.9, -0.4, H + 0.12), "k")
  })
}
