// Živá voda (WorldScene.updateWater): malé animace, které se rozsvěcejí a hasnou na zapečené hladině z ground.px.js.
// Bez obrysu a jen v barvách vody (Z, J, sklo l, popel w), ať splynou se zemí. Vlnky jsou šikmé čárky ve sklonu 2 : 1. Snímky <jméno>_0… přehraje scéna jednou a sprite vrátí do zásoby.
// čárka vlnky: n dvojbodů od (x, y) šikmo a lehce zvlněná jako namalované vlnky, hřeben barvou top jen na
// prostřední třetině. Scéna sprity zrcadlí, aby běžely stejným směrem jako vlnky v zemi (dolů doprava).
const carka = (c, x, y, n, col, top) => {
  for (let i = 0; i < n; i++) {
    const yy = y - Math.round(i * 0.5 + Math.sin(i * 0.8) * 0.6)
    c.rect(x + i * 2, yy, 2, 1, col)
    if (top && i >= n / 3 && i < n * 2 / 3) c.rect(x + i * 2, yy - 1, 2, 1, top)
  }
}
// vlnka: zvedne se, popojede po hladině a rozpadne se
anim("vlnka", { w: 32, h: 16, frames: 7, fps: 6 }, (c) => {
  const f = c.frame
  if (f === 0) carka(c, 12, 10, 3, "Z")
  if (f === 1) carka(c, 8, 12, 7, "z")
  if (f === 2) carka(c, 5, 14, 11, "z", "W")
  if (f === 3) carka(c, 4, 14, 12, "z", "W")
  if (f === 4) { carka(c, 5, 13, 5, "z", "W"); carka(c, 18, 7, 5, "z") }
  if (f === 5) { carka(c, 7, 12, 2, "J"); carka(c, 20, 6, 3, "Z") }
  if (f === 6) carka(c, 22, 5, 1, "Z")
})
// dvě krátké vlnky za sebou (čeření)
anim("vlnka_b", { w: 32, h: 16, frames: 6, fps: 6 }, (c) => {
  const f = c.frame
  if (f === 0) carka(c, 6, 9, 2, "Z")
  if (f === 1) { carka(c, 4, 10, 5, "J"); carka(c, 18, 12, 2, "Z") }
  if (f === 2) { carka(c, 4, 10, 6, "z", "W"); carka(c, 16, 13, 5, "z") }
  if (f === 3) { carka(c, 6, 9, 4, "J"); carka(c, 15, 13, 6, "z", "W") }
  if (f === 4) { carka(c, 8, 8, 2, "Z"); carka(c, 17, 12, 4, "z") }
  if (f === 5) carka(c, 19, 11, 2, "Z")
})
// odlesk: bod, který blikne do kříže
anim("odlesk", { w: 7, h: 7, frames: 5, fps: 8 }, (c) => {
  const f = c.frame
  if (f === 0 || f === 4) c.px(3, 3, "J")
  if (f === 1 || f === 3) { c.hline(2, 3, 3, "z"); c.px(3, 3, "W") }
  if (f === 2) { c.hline(1, 3, 5, "w"); c.vline(3, 2, 3, "w"); c.px(3, 3, "W") }
})
// kruh na hladině (kapka, ryba): elipsa 2 : 1 se rozbíhá a trhá
anim("kruh", { w: 40, h: 20, frames: 6, fps: 6 }, (c) => {
  const f = c.frame, rx = [2, 5, 9, 13, 16, 18][f]
  const keep = [1, 1, 1, 0.75, 0.5, 0.25][f]
  for (let i = 0; i < 64; i++) {
    const t = i / 64 * Math.PI * 2
    if (((i * 7) % 16) / 16 >= keep) continue
    c.px(Math.round(20 + Math.cos(t) * rx), Math.round(10 + Math.sin(t) * rx / 2), f < 3 ? "z" : "J")
  }
  if (f < 2) c.px(20, 10, "w")
})
// pěna u břehu: pár světlých čárek, které se přisunou a zase odejdou
anim("pena", { w: 28, h: 14, frames: 6, fps: 5 }, (c) => {
  const f = c.frame, n = [1, 2, 3, 3, 2, 1][f], col = f === 2 || f === 3 ? "w" : "z"
  carka(c, 3, 9, n + 1, col); carka(c, 13, 11, n, f > 0 && f < 5 ? "J" : "Z"); if (n > 1) carka(c, 15, 5, n, col)
  if (f === 2 || f === 3) { c.px(9, 8, "W"); c.px(20, 4, "W") }
})
