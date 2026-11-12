// Kurzory myši ve světě (16 × 16, hra je zvětší dvakrát a dá do CSS cursor, WorldScene.cursorFor): šipka na chůzi,
// červený křížek tam, kam se nedá dojít, bublina nad postavou (rozhovor), oko nad věcí s hláškou, dveře nad vchodem.
// Kreslí se z mřížky znaků palety jako ikony vlastností (iconGrid v art/chars.px.js); bod kurzoru je v CURSOR_HOT
// (src/scenes/world.js).
// Šipka v barvě kostí a rzi (ne zelená CRT, ta patří liště).
sprite("kurzor_jit", { w: 16, h: 16 }, (c) => iconGrid(c, [
  "kk..............",
  "kWk.............",
  "kWck............",
  "kWcck...........",
  "kWccck..........",
  "kWcccck.........",
  "kWccccck........",
  "kWcccccck.......",
  "kWccccccck......",
  "kWcccckkkkk.....",
  "kWcckck.........",
  "kWck.kck........",
  "kWk..kck........",
  "kk....kck.......",
  "......kck.......",
  ".......kk.......",
]))
sprite("kurzor_ne", { w: 16, h: 16 }, (c) => iconGrid(c, [
  "................",
  ".kkk.......kkk..",
  ".k77k.....k77k..",
  ".k777k...k777k..",
  "..k777k.k777k...",
  "...k777k777k....",
  "....k77777k.....",
  ".....k777k......",
  "....k77777k.....",
  "...k777k777k....",
  "..k777k.k777k...",
  ".k777k...k777k..",
  ".k77k.....k77k..",
  ".kkk.......kkk..",
  "................",
  "................",
]))
sprite("kurzor_mluvit", { w: 16, h: 16 }, (c) => iconGrid(c, [
  "................",
  "..kkkkkkkkkkk...",
  ".kWWWWWWWWWWWk..",
  "kWWWWWWWWWWWWWk.",
  "kWWkkWWkkWWkkWk.",
  "kWWkkWWkkWWkkWk.",
  "kWWWWWWWWWWWWWk.",
  "kwWWWWWWWWWWWwk.",
  ".kwwWWWWWWWwwk..",
  "..kkkwWWkkkkk...",
  "....kwWk........",
  "....kwk.........",
  "....kk..........",
  "................",
  "................",
  "................",
]))
sprite("kurzor_oko", { w: 16, h: 16 }, (c) => iconGrid(c, [
  "................",
  "................",
  "................",
  ".....kkkkkk.....",
  "...kkWWWWWWkk...",
  "..kWWWkkkkWWWk..",
  ".kWWWkyyyykWWWk.",
  "kWWWkyykkyykWWWk",
  "kWWWkyykkyykWWWk",
  ".kWWWkyyyykWWWk.",
  "..kWWWkkkkWWWk..",
  "...kkWWWWWWkk...",
  ".....kkkkkk.....",
  "................",
  "................",
  "................",
]))
sprite("kurzor_dvere", { w: 16, h: 16 }, (c) => iconGrid(c, [
  "...kkkkkkkkkk...",
  "...kHHHHHHHHk...",
  "...kHhhhhhhHk...",
  "...kHhkkkkhHk...",
  "...kHhkNNkhHk...",
  "...kHhkNNkhHk...",
  "...kHhkNNkhHk...",
  "...kHhkNNkhHk...",
  "...kHhkNNkhHk...",
  "...kHhkNNkfHk...",
  "...kHhkNNkhHk...",
  "...kHhkNNkhHk...",
  "...kHhkNNkhHk...",
  "...kHhkkkkhHk...",
  "...kHHHHHHHHk...",
  "...kkkkkkkkkk...",
]))

// Značka dlaždice pod myší (jako šestiúhelník ve Falloutu): rohy kosočtverce 128 × 64 na zemi. Kam hrdinka dojde,
// oheň; kam ne, červená (křížek ukáže kurzor myši). Kreslí se ve světě na dlaždici pod kurzorem (WorldScene.hover).
const tileMark = (c, col, cross) => {
  const V = [[64, 3], [123, 32], [64, 61], [5, 32]]
  for (let i = 0; i < 4; i++) {
    const [x0, y0] = V[i], [x1, y1] = V[(i + 1) % 4]
    const seg = (t0, t1, k, dy) => c.line(Math.round(x0 + (x1 - x0) * t0), Math.round(y0 + (y1 - y0) * t0) + dy, Math.round(x0 + (x1 - x0) * t1), Math.round(y0 + (y1 - y0) * t1) + dy, k, 2)
    seg(0, 0.3, "k", 1); seg(0.7, 1, "k", 1); seg(0, 0.3, col, 0); seg(0.7, 1, col, 0)
  }
  if (cross) { c.line(56, 28, 72, 36, "k", 3); c.line(56, 36, 72, 28, "k", 3); c.line(56, 28, 72, 36, col, 2); c.line(56, 36, 72, 28, col, 2) }
}
sprite("kurzor_dlazdice", { w: 128, h: 64 }, (c) => tileMark(c, "f", false))
sprite("kurzor_dlazdice_ne", { w: 128, h: 64 }, (c) => tileMark(c, "7", false))
