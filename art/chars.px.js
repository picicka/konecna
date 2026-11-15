// Postavy v měřítku 128 × 64 kreslí art/lide.px.js (sada lid*: hrdinka, Fanta, Kuřačka) a art/lide-a/b/c.px.js (ostatní).
// Tady zůstávají ikony lišty a deníku.

// Ikony do lišty a deníku (16 × 16).
sprite("ico_ticket", { w: 16, h: 16 }, (c) => { c.rect(1, 4, 14, 8, "y"); c.rect(3, 6, 10, 4, "Y"); c.vline(8, 4, 8, "k"); c.rect(5, 7, 2, 2, "k") })


// Vlastnosti hrdinky jako obrázky (16 × 16): Ruka (pěst), Ústa (rty), Oko. Kreslí se z mřížky znaků palety.
const iconGrid = (c, rows) => rows.forEach((row, y) => [...row].forEach((ch, x) => { if (ch !== ".") c.px(x, y, ch) }))
// Srdce (životy) ve stejném stylu jako vlastnosti: obrys, světlý odlesk vlevo nahoře, stín vpravo dole.
sprite("ico_heart", { w: 16, h: 16 }, (c) => iconGrid(c, [
  "................",
  "................",
  "..kkkk...kkkk...",
  ".k7777k.k7777k..",
  "k7WW777k77777Vk.",
  "k7W7777777777Vk.",
  "k777777777777Vk.",
  "k77777777777VVk.",
  ".k7777777777VVk.",
  "..k7777777VVk...",
  "...k77777VVk....",
  "....k777VVk.....",
  ".....k7VVk......",
  "......kVk.......",
  ".......k........",
  "................",
]))
// Pěst: čtyři prsty po dvou bodech (pět úzkých vypadalo jako šest prstů i s palcem), palec přes ně zleva, modrá manžeta.
sprite("ico_ruka", { w: 16, h: 16 }, (c) => iconGrid(c, [
  "................",
  "................",
  "..kkkkkkkkkkkkk.",
  "..kiikiikiikiik.",
  "..kiikiikiikiik.",
  "..kiKkiKkiKkiKk.",
  "..kkkkkkkkkkiik.",
  ".kiiiiiiiikiiik.",
  ".kiiiiiiiiiiiik.",
  ".kKKKKKKkiiiiik.",
  ".kkkkkkkkiiiiik.",
  "..kiiiiiiiiiiKk.",
  "..kKiiiiiiiiKk..",
  "...kkbbbbbbbk...",
  "....kbbbbbbbk...",
  "....kkkkkkkkk...",
]))
sprite("ico_usta", { w: 16, h: 16 }, (c) => iconGrid(c, [
  "................",
  "................",
  "................",
  "................",
  "....kk....kk....",
  "...kVVk..kVVk...",
  "..kVrVVkkVVrVk..",
  ".kVVVVVVVVVVVVk.",
  "kkkkkkkkkkkkkkkk",
  ".kVVVVVVVVVVVVk.",
  "..kVVrrrrrrVVk..",
  "...kVVVVVVVVk...",
  "....kkkkkkkk....",
  "................",
  "................",
  "................",
]))
sprite("ico_oko", { w: 16, h: 16 }, (c) => iconGrid(c, [
  "................",
  "................",
  "................",
  "................",
  ".....kkkkkk.....",
  "...kkWWWWWWkk...",
  "..kWWWbbbbWWWk..",
  ".kWWWbbkkWbWWWk.",
  "kWWWWbkkkkbWWWWk",
  ".kWWWbbkkbbWWWk.",
  "..kWWWbbbbWWWk..",
  "...kkWWWWWWkk...",
  ".....kkkkkk.....",
  "................",
  "................",
  "................",
]))
