// Ruch na mapě (WorldScene.placeLife): bezejmenní chodci, holubi a krysy. Nejsou to zastavení, nemluví a nic neblokují,
// jen dělají z kulisy město. Chodci jsou z lidPerson (art/lide.px.js): chůze k divákovi <jméno>_0–3 a od diváka
// <jméno>_up_0–3 (sprite kouká doleva, doprava se zrcadlí, stejně jako hrdinka).
const RUCH_CHODCI = {
  chodec_a: { build: "stout", age: "old", hair: { style: "short", col: "grey" }, beard: "stubble", hat: { kind: "beanie", col: "ash" }, top: { kind: "coat", col: "brown", long: true }, legs: { kind: "trousers", col: "ash" }, shoes: { kind: "boots", col: "dark" }, items: ["bag", "dirt"], bagCol: "leather" },
  chodec_b: { female: true, build: "thin", hair: { style: "bun", col: "brown" }, hat: { kind: "scarf", col: "wine" }, top: { kind: "coat", col: "grey", long: true }, legs: { kind: "skirt", col: "ash" }, shoes: { kind: "rubber", col: "rubber" }, items: ["dirt"] },
  chodec_c: { build: "thin", age: "young", skin: "pale", hair: { style: "none" }, hat: { kind: "hood", col: "olive" }, top: { kind: "jacket", col: "olive" }, legs: { kind: "trousers", col: "denim" }, shoes: { kind: "boots", col: "dark" }, items: ["dirt"] },
  chodec_d: { build: "normal", skin: "tan", hair: { style: "short", col: "black" }, beard: "full", hat: { kind: "cap", col: "rust" }, top: { kind: "vest", col: "khaki" }, shirtCol: "ash", legs: { kind: "trousers", col: "khaki" }, shoes: { kind: "boots", col: "dark" }, items: ["bag"], bagCol: "rust" },
}
for (const [key, o] of Object.entries(RUCH_CHODCI)) {
  lidWalk(key, o)
  anim(`${key}_up`, { w: 24, h: 64, outline: "k", fps: 8, frames: 4 }, (c) => lidPerson(c, o, { ...LID_WALK[c.frame], back: true }))
}

// Holub: zobe (hlava nahoře, hlava u země), šedý se zeleným leskem na krku.
anim("holoubek", { w: 12, h: 10, outline: "k", fps: 2, frames: 2 }, (c) => {
  const f = c.frame ?? 0
  c.ellipse(7, 5, 4, 3, "M"); c.hline(5, 4, 5, "m"); c.px(10, 5, "S"); c.px(11, 4, "S")
  if (f === 0) { c.rect(2, 1, 3, 3, "S"); c.px(3, 4, "Q"); c.px(1, 2, "y"); c.px(3, 2, "k") }
  else { c.rect(1, 5, 3, 3, "S"); c.px(3, 4, "Q"); c.px(0, 7, "y"); c.px(2, 6, "k") }
  c.px(6, 9, "V"); c.px(8, 9, "V")
})
// Holub v letu: křídla nahoru a dolů.
anim("holoubek_let", { w: 18, h: 12, outline: "k", fps: 6, frames: 2 }, (c) => {
  const f = c.frame ?? 0
  c.ellipse(9, 6, 4, 2, "M"); c.px(4, 6, "S"); c.px(3, 6, "y"); c.hline(12, 6, 3, "S")
  if (f === 0) { c.line(8, 5, 3, 1, "m", 2); c.line(10, 5, 15, 1, "M", 2) }
  else { c.line(8, 6, 3, 10, "m", 2); c.line(10, 6, 15, 10, "M", 2) }
})
// Krysa: běží přitisknutá k zemi, dlouhý ocas (2 snímky: nohy).
anim("krysa", { w: 16, h: 8, outline: "k", fps: 8, frames: 2 }, (c) => {
  const f = c.frame ?? 0
  c.ellipse(6, 4, 4, 2, "h"); c.hline(3, 3, 5, "4"); c.rect(1, 3, 2, 2, "h"); c.px(0, 4, "i"); c.px(1, 3, "k")
  c.line(10, 5, 15, f ? 4 : 6, "i")
  c.px(f ? 4 : 5, 7, "H"); c.px(f ? 8 : 7, 7, "H")
})
// Voříšek: toulavý pes, který se k hrdince na chvíli přidá. Kouká doleva (doprava se zrcadlí), 4 snímky běhu
// (nohy se střídají, ocas a ucho poskakují) a sed se zvednutou hlavou (2 snímky: vrtí ocasem).
function voriHead(c, x, y) {
  c.rect(x, y, 8, 7, "u"); c.rect(x - 4, y + 3, 5, 4, "i"); c.px(x - 4, y + 3, "k"); c.rect(x + 1, y, 6, 2, "h")
  c.px(x + 1, y + 2, "k"); c.px(x - 2, y + 6, "V")
  c.rect(x + 5, y - 2, 3, 4, "H"); c.px(x + 2, y - 1, "u")   // jedno ucho stojí, druhé je klopené
}
anim("voricek", { w: 32, h: 22, outline: "k", fps: 8, frames: 4 }, (c) => {
  const f = c.frame ?? 0, bob = f % 2
  c.rect(9, 9 + bob, 16, 7, "u"); c.rect(9, 9 + bob, 16, 2, "h"); c.rect(11, 14 + bob, 10, 2, "i"); c.rect(15, 9 + bob, 5, 4, "H")
  voriHead(c, 5, 4 + bob)
  c.line(25, 10 + bob, 29, 5 + (f < 2 ? 0 : 2), "u", 2); c.px(29, 4 + (f < 2 ? 0 : 2), "W")
  const legs = [[10, 13, 20, 23], [8, 14, 19, 25], [11, 12, 21, 22], [12, 9, 24, 19]][f]
  legs.forEach((x, i) => { c.line(i < 2 ? 11 + i : 21 + i - 2, 16, x, 21, i % 2 ? "H" : "u", 2) })
})
anim("voricek_sed", { w: 26, h: 26, outline: "k", fps: 4, frames: 2 }, (c) => {
  const f = c.frame ?? 0
  c.poly([8, 10, 15, 9, 21, 16, 22, 25, 9, 25], "u"); c.poly([8, 12, 12, 12, 13, 25, 9, 25], "i"); c.rect(15, 20, 7, 5, "h")
  c.rect(8, 18, 2, 7, "u"); c.rect(11, 19, 2, 6, "H"); c.hline(7, 25, 16, "H")
  voriHead(c, 6, 2)
  c.line(22, 23, f ? 25 : 24, f ? 21 : 17, "u", 2)
})
