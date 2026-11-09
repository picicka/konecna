// Postavy v měřítku 128 × 64 kreslí art/lide.px.js (sada lid*: hrdinka, Fanta, Kuřačka) a art/lide-a/b/c.px.js (ostatní).
// Tady zůstávají ikony lišty a deníku.

// Ikony do lišty a deníku (16 × 16).
sprite("ico_ticket", { w: 16, h: 16 }, (c) => { c.rect(1, 4, 14, 8, "y"); c.rect(3, 6, 10, 4, "Y"); c.vline(8, 4, 8, "k"); c.rect(5, 7, 2, 2, "k") })
sprite("ico_heart", { w: 16, h: 16, mx: true }, (c) => { c.circ(5, 5, 3, "V"); c.poly([2, 7, 8, 14, 8, 7], "V") })


// Vlastnosti hrdinky jako obrázky (16 × 16): Ruka (pěst), Ústa (rty), Oko. Kreslí se z mřížky znaků palety.
const iconGrid = (c, rows) => rows.forEach((row, y) => [...row].forEach((ch, x) => { if (ch !== ".") c.px(x, y, ch) }))
sprite("ico_ruka", { w: 16, h: 16 }, (c) => iconGrid(c, [
  "................",
  "................",
  "...kkkkkkkkk....",
  "..kikikikikik...",
  "..kikikikikik...",
  "..kKkKkKkKkik...",
  "..kkkkkkkkkik...",
  ".kiiiiiiikkik...",
  ".kiiiiiiiiiik...",
  ".kKKKKKkiiiik...",
  ".kkkkkkiiiiik...",
  "..kiiiiiiiiKk...",
  "..kKiiiiiiKk....",
  "...kkbbbbbk.....",
  "....kbbbbbk.....",
  "....kkkkkkk.....",
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
