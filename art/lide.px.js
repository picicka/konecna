// Lidé: společné kreslení postav ve stylu Falloutu 1 a 2. Tříčtvrteční pohled čelem doleva dolů (druhý směr je zrcadlo),
// světlo zleva shora, obrys "k" dělá pxl. Plátno 24 × 64 (s obrysem 26 × 66), zem = dolní střed, chodidla na spodních
// řádcích. Postava je vysoká kolem 46 bodů (patro domu je 44). Portrét 56 × 56 (v dialogu 2×) se kreslí z týchž voleb.
//
// Použití:
//   lidWalk("hero", OPTS)                       chůze, 4 snímky hero_0..3 (nohy se střídají, ruce a taška se houpou)
//   lidIdle("fanta", OPTS, { fps, smoke })      stání, 4 snímky (dech, mrknutí, kouř z cigarety)
//   sprite("face_fanta", { w: 56, h: 56, outline: "k" }, (c) => lidFace(c, OPTS))
//   lidPerson(c, OPTS, pose) / lidFace(c, OPTS) jdou volat i ve vlastní funkci a přikreslit k nim cokoli dalšího.
//
// Volby OPTS (všechny nepovinné):
//   build   "thin" | "normal" | "stout"                     postava (stout = s břichem)
//   height  42–50, výchozí 46                              výška v bodech (hlava zůstává 8 bodů)
//   female  true                                            užší ramena, širší boky, rty v portrétu
//   age     "young" | "adult" | "old"                       old = vrásky v portrétu, shrbení o bod
//   skin    "normal" | "pale" | "tan" | "dark"
//   hair    { style, col }   style: "long" (po ramena) | "short" | "bald" | "bun" | "bob" | "perm" | "ponytail" | "none"
//                            col: "dark" | "black" | "brown" | "grey" | "white" | "bleached" | "red" | "ginger"
//   beard   "stubble" | "moustache" | "beard" | "full"      barva = barva vlasů, nebo beardCol
//   hat     { kind, col }        kind: "cap" (kšiltovka) | "peaked" (služební čepice se štítkem) | "captain" (bílá
//                                kapitánská) | "helmet" | "hardhat" | "beanie" | "scarf" (šátek) | "hood" (kápě) | "beret"
//   top     { kind, col, long }  kind: "coat" (ke kolenům) | "jacket" | "suit" | "vest" (vesta přes košili, shirtCol)
//                                | "overalls" (montérky, i nohavice) | "neoprene" (celé tělo) | "sweater" | "shirt"
//                                | "robe" (k zemi); long: true prodlouží kabát a bundu
//   over    { kind, col }        přes oblečení: "lifevest" | "reflective" | "apron"
//   legs    { kind, col }        kind: "trousers" | "skirt" | "shorts"
//   shoes   { kind, col }        kind: "shoes" | "boots" | "rubber" (gumáky)
//   items   ["bag", "rifle", "hook", "umbrella", "saw", "keys", "chain", "clipboard", "cigarette", "holder", "lantern",
//           "rope", "rings", "glasses", "sunglasses", "goggles", "tie", "scar", "dirt"]
//   bagCol, tieCol, shirtCol, eyeCol, mouthCol             barvy doplňků
// Barvy (col) jsou jména z LID_MAT nebo vlastní trojice { d, m, l } (stín, střed, světlo) z kláves palety.
// Úprava jedné postavy navíc: lidIdle/lidWalk berou ještě extra položky (grid, px…) přes všechny snímky.

const LID_MAT = {
  postal: { d: "b", m: "L", l: "l" },      // vybledlá modrošedá pošta
  navy: { d: "N", m: "b", l: "L" },        // tmavě modrá uniforma
  brown: { d: "H", m: "h", l: "4" },       // hnědý oblek
  leather: { d: "H", m: "U", l: "u" },     // kůže, taška
  orange: { d: "U", m: "o", l: "y" },      // záchranná vesta
  rubber: { d: "G", m: "Q", l: "j" },      // zelené gumáky
  rust: { d: "U", m: "u", l: "o" },
  dark: { d: "k", m: "A", l: "a" },        // černá, tmavá
  grey: { d: "x", m: "v", l: "w" },
  ash: { d: "a", m: "B", l: "P" },         // tmavě šedá
  olive: { d: "G", m: "g", l: "2" },
  khaki: { d: "e", m: "C", l: "c" },
  red: { d: "D", m: "V", l: "d" },
  wine: { d: "D", m: "V", l: "r" },
  white: { d: "v", m: "w", l: "W" },
  denim: { d: "n", m: "S", l: "s" },
  slate: { d: "S", m: "s", l: "P" },
  yellow: { d: "Y", m: "y", l: "W" },
  green: { d: "Q", m: "j", l: "1" },
  gold: { d: "O", m: "Y", l: "y" },
  metal: { d: "M", m: "m", l: "W" },
  wood: { d: "H", m: "h", l: "u" },
  rope: { d: "e", m: "C", l: "c" },
}
const LID_SKIN = {
  normal: { d: "4", m: "i", l: "0" },
  pale: { d: "4", m: "8", l: "0" },
  tan: { d: "u", m: "4", l: "i" },
  dark: { d: "U", m: "u", l: "4" },
}
const LID_HAIR = {
  dark: { d: "k", m: "K", l: "3" },
  black: { d: "k", m: "k", l: "A" },
  brown: { d: "K", m: "H", l: "h" },
  grey: { d: "x", m: "v", l: "w" },
  white: { d: "v", m: "w", l: "W" },
  bleached: { d: "Y", m: "c", l: "W" },
  red: { d: "D", m: "U", l: "u" },
  ginger: { d: "U", m: "o", l: "y" },
}
const lidMat = (col, def) => (typeof col === "object" && col ? col : LID_MAT[col] || LID_MAT[def] || LID_MAT.grey)
const lidHairMat = (col) => (typeof col === "object" && col ? col : LID_HAIR[col] || LID_HAIR.dark)

// Rozměry podle postavy: půlšířka ramen, pasu, boků, šířka nohy a ruky.
function lidDims(o) {
  const b = o.build || "normal"
  const d = b === "thin" ? { sw: 4, ww: 3, hw: 3, lw: 3, aw: 2, belly: 0 }
    : b === "stout" ? { sw: 6, ww: 6, hw: 6, lw: 4, aw: 3, belly: 2 }
      : { sw: 5, ww: 4, hw: 4, lw: 3, aw: 2, belly: 0 }
  if (o.female) { if (b !== "thin") d.sw -= 1; d.hw += b === "stout" ? 0 : 1 }
  return d
}

// Obrys mnohoúhelníku s vrcholy v rozích bodů: pomocné kreslení lichoběžníků (trup, nohy, ruce).
// Řídké tečky jen na zadaných klíčích (strniště, špína), deterministické podle polohy.
function lidSpeckle(c, x0, y0, w, h, on, col, density) {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
    const r = ((x * 73856093) ^ (y * 19349663)) >>> 0
    if (c.is(x, y, on) && (r % 1000) / 1000 < density) c.px(x, y, col)
  }
}
const lidQuad = (c, x0, x1, y0, x2, x3, y1, k) => c.poly([x0, y0, x1, y0, x3, y1, x2, y1], k)

// Stínování kusu oblečení po řádcích: krajní levý sloupec světlo, pravé dva stín (světlo zleva shora).
function lidShadeRows(c, y0, y1, m, mat, left = 1, right = 2) {
  for (let y = y0; y <= y1; y++) {
    let a = -1, b = -1
    for (let x = 0; x < c.w; x++) if (c.is(x, y, m)) { if (a < 0) a = x; b = x }
    if (a < 0) continue
    for (let i = 0; i < left && a + i < b; i++) c.px(a + i, y, mat.l)
    for (let i = 0; i < right && b - i > a + left; i++) c.px(b - i, y, mat.d)
  }
}

// Postava v póze. pose: { fl, bl } posun přední a zadní nohy, { fa, ba } posun přední a zadní ruky, bob (−1 = nahoru),
// blink, smoke (0–3 fáze kouře), breathe (1 = nádech, ramena o bod výš), lean (hlava o bod napřed, do chůze),
// back (zezadu: místo tváře týl a vlasy, popruh tašky přes záda).
function lidPerson(c, o, pose = {}) {
  const D = lidDims(o)
  const H = o.height || 46
  const cx = 12
  const bob = pose.bob || 0
  const top = 64 - H + bob + (o.age === "old" ? 1 : 0)
  const hy = top - (pose.breathe ? 1 : 0) + (pose.lean ? 1 : 0), hx = cx - 4 - (pose.lean || 0)
  const sy0 = top - (pose.breathe ? 1 : 0) + 9
  const sy = sy0
  const hipY = 64 - H + Math.round(H * 0.5) + bob
  const kneeY = Math.round((hipY + 63) / 2)
  const skin = LID_SKIN[o.skin] || LID_SKIN.normal
  const hair = lidHairMat(o.hair && o.hair.col)
  const top_ = o.top || { kind: "jacket", col: "grey" }
  const tm = lidMat(top_.col, "grey")
  const legs = o.legs || { kind: "trousers", col: "ash" }
  const lm = lidMat(legs.col, "ash")
  const shoes = o.shoes || { kind: "shoes", col: "dark" }
  const shm = lidMat(shoes.col, "dark")
  const items = o.items || []
  const has = (k) => items.includes(k)
  const fl = pose.fl || 0, bl = pose.bl || 0, fa = pose.fa || 0, ba = pose.ba || 0
  const full = top_.kind === "neoprene" || top_.kind === "overalls"
  const legMat = full ? tm : lm
  const breathe = 0 // nádech posouvá hlavu a ramena přes hy

  // délka horního dílu
  const hem = top_.kind === "coat" ? kneeY + 1 + (top_.long ? 5 : 0)
    : top_.kind === "robe" ? 60
      : top_.kind === "jacket" ? hipY + (top_.long ? 6 : 3)
        : top_.kind === "suit" ? hipY + 3
          : top_.kind === "sweater" ? hipY + 1
            : hipY
  const LX = cx - 1 - D.lw, RX = cx // levá (přední) a pravá (zadní) noha, levý okraj

  // —— zadní předměty (za tělem) ——
  if (has("rifle")) { c.line(cx + 6, sy - 6, cx + 1, hipY + 5, "M"); c.line(cx + 7, sy - 6, cx + 2, hipY + 5, "A"); c.rect(cx + 1, hipY + 2, 3, 5, "H"); c.px(cx + 6, sy - 7, "m") }
  if (has("hook")) { c.vline(cx - D.sw - 2 + fa, 2, 58, "h"); c.px(cx - D.sw - 2 + fa, 2, "u"); c.hline(cx - D.sw - 2 + fa, 2, 4, "M"); c.vline(cx - D.sw + 2 + fa, 3, 2, "M"); c.px(cx - D.sw + 1 + fa, 5, "M") }

  // —— zadní ruka (vpravo, ve stínu) ——
  const arm = (x, sw, k, kd, hand) => {
    const y1 = hipY + 2
    lidQuad(c, x, x + D.aw, sy + 1 - breathe, x + sw, x + sw + D.aw, y1, k)
    c.vline(x + D.aw - 1, sy + 2, y1 - sy - 2, kd)
    if (hand) c.rect(x + sw, y1, D.aw, 2, hand)
  }
  const sleeve = top_.kind === "vest" || top_.kind === "neoprene" && top_.short ? skin : tm
  arm(cx + D.sw - 1, ba, sleeve.d, sleeve.d, skin.d)

  // —— nohy ——
  const legTop = hipY - 1
  const shoeTop = shoes.kind === "boots" ? 59 : shoes.kind === "rubber" ? 57 : 61
  const leg = (x, dx, k, kl, kd) => {
    lidQuad(c, x, x + D.lw, legTop, x + dx, x + dx + D.lw, 61, k)
    if (kl) for (let y = legTop; y < 61; y++) { const t = (y - legTop) / (61 - legTop); c.px(x + Math.round(dx * t), y, kl) }
    if (kd) for (let y = legTop; y < 61; y++) { const t = (y - legTop) / (61 - legTop); c.px(x + D.lw - 1 + Math.round(dx * t), y, kd) }
  }
  const shoe = (x, dx, m) => {
    const sx = x + dx - 1
    c.rect(sx, shoeTop, D.lw + 1, 64 - shoeTop, m.m)
    c.rect(sx + D.lw, shoeTop, 1, 64 - shoeTop, m.d)
    c.hline(sx, 63, D.lw + 1, m.d)
    c.px(sx, 62, m.l)
    if (shoes.kind === "rubber") c.hline(sx, shoeTop, D.lw + 1, m.l)
  }
  const skirt = legs.kind === "skirt"
  const shorts = legs.kind === "shorts"
  const bare = skirt || shorts ? skin : null
  // zadní noha
  leg(RX, bl, bare ? bare.d : legMat.d, null, null)
  shoe(RX, bl, { d: shm.d, m: shm.d, l: shm.m })
  // přední noha
  leg(LX, fl, bare ? bare.m : legMat.m, bare ? bare.l : legMat.l, bare ? bare.d : legMat.d)
  shoe(LX, fl, shm)
  if (shorts) { lidQuad(c, LX - 1, cx + D.lw + 1, hipY - 1, LX - 1 + Math.min(fl, 0), cx + D.lw + 1 + Math.max(bl, 0), hipY + 5, lm.m); lidShadeRows(c, hipY - 1, hipY + 5, lm.m, lm) }
  if (skirt) { lidQuad(c, cx - D.hw, cx + D.hw, hipY - 1, cx - D.hw - 2, cx + D.hw + 2, kneeY + 2, lm.m); lidShadeRows(c, hipY - 1, kneeY + 2, lm.m, lm) }

  // —— trup ——
  const bodyBottom = Math.max(hem, hipY)
  const ww = D.ww, hw = D.hw
  const pts = [cx - D.sw, sy + 1 - breathe, cx - D.sw + 1, sy - breathe, cx + D.sw - 1, sy - breathe, cx + D.sw, sy + 1 - breathe]
  if (top_.kind === "coat" || top_.kind === "robe") {
    const flare = top_.kind === "robe" ? 3 : 2
    pts.push(cx + hw, hipY, cx + hw + flare, bodyBottom, cx - hw - flare + Math.min(fl, 0), bodyBottom, cx - hw, hipY)
  } else {
    pts.push(cx + ww, hipY - 4, cx + hw, bodyBottom, cx - hw, bodyBottom, cx - ww, hipY - 4)
  }
  c.poly(pts, tm.m)
  if (D.belly) { c.ellipse(cx - 2, hipY - 5, D.sw + 1, 5, tm.m) }
  // rozparek kabátu při chůzi
  if (top_.kind === "coat" && fl !== 0) c.vline(cx - 1, hipY + 2, bodyBottom - hipY - 1, tm.d)
  lidShadeRows(c, sy - breathe, bodyBottom, tm.m, tm, 1, 2)
  // spodní okraj a stín pod pasem
  c.hline(cx - hw - 2, bodyBottom, hw * 2 + 6, ".")
  for (let x = 0; x < c.w; x++) if (c.is(x, bodyBottom - 1, tm.m + tm.l)) c.px(x, bodyBottom - 1, tm.d)
  // detaily podle druhu
  const kind = top_.kind
  if (kind === "coat" || kind === "jacket" || kind === "suit" || kind === "robe") {
    // klopy a zapínání
    c.px(cx - 2, sy + 1 - breathe, tm.d); c.px(cx, sy + 1 - breathe, tm.d); c.vline(cx - 1, sy + 2, 2, o.shirtCol ? lidMat(o.shirtCol).m : tm.l)
    c.vline(cx - 1, sy + 4, bodyBottom - sy - 5, tm.d)
    if (kind !== "robe") for (let y = sy + 6; y < Math.min(bodyBottom - 1, hipY + 8); y += 4) c.px(cx - 2, y, kind === "suit" ? "Y" : "M")
    if (kind === "coat" || kind === "jacket") { c.hline(cx - hw, hipY - 1, hw * 2 + 1, tm.d) } // opasek
    if (kind === "suit") { c.vline(cx - 1, sy + 1 - breathe, 4, o.shirtCol ? lidMat(o.shirtCol).l : "w"); c.vline(cx, sy + 2, 3, o.tieCol || "V") }
  }
  if (kind === "vest") { const sm = lidMat(o.shirtCol || "white"); c.vline(cx - 1, sy, hipY - sy, sm.m); c.px(cx - 1, sy, sm.l) }
  if (kind === "overalls") { const sm = lidMat(o.shirtCol || "grey"); c.rect(cx - D.sw + 1, sy - breathe, D.sw * 2 - 2, 3, sm.m); c.vline(cx - 3, sy - breathe, 4, tm.d); c.vline(cx + 2, sy - breathe, 4, tm.d); c.rect(cx - 2, sy + 4, 4, 3, tm.l) }
  if (kind === "neoprene") { c.vline(cx, sy, hipY - sy, tm.l) }
  if (kind === "sweater") { c.hline(cx - ww, bodyBottom - 2, ww * 2 + 1, tm.d); c.rect(cx - 2, sy - breathe, 4, 1, tm.d) }

  // —— přes oblečení ——
  const ov = o.over
  if (ov) {
    const om = lidMat(ov.col, ov.kind === "lifevest" ? "orange" : ov.kind === "reflective" ? "yellow" : "khaki")
    const y1 = ov.kind === "apron" ? kneeY : hipY - 1
    const y0 = sy + (ov.kind === "apron" ? 3 : 0) - breathe
    const ex = ov.kind === "lifevest" ? 2 : 0
    const k = om.m
    c.poly([cx - D.sw + 1 - ex, y0 + 1, cx - 2, y0 + 1, cx - 1, y0 + 4, cx, y0 + 1, cx + D.sw - 1 + ex, y0 + 1, cx + D.sw + ex - 1, y1, cx - D.sw - ex + 1, y1], k)
    if (ov.kind === "apron") { c.rect(cx - D.hw, y0, D.hw * 2, y1 - y0, k) }
    lidShadeRows(c, y0, y1, k, om, 1, 2)
    if (ov.kind === "lifevest") {
      // límec za krkem, dva polštáře vpředu, mezera se zipem, černé popruhy
      c.rect(cx - 2, y0 - 1, 5, 2, om.m); c.px(cx - 2, y0 - 1, om.l); c.px(cx + 2, y0 - 1, om.d)
      c.vline(cx - 1, y0 + 4, y1 - y0 - 4, "k")
      c.hline(cx - D.sw - ex + 1, y0 + 7, D.sw * 2 + ex * 2 - 2, "k"); c.hline(cx - D.sw - ex + 1, y1 - 2, D.sw * 2 + ex * 2 - 2, "k")
      c.px(cx - 1, y0 + 7, "M"); c.px(cx - 1, y1 - 2, "M"); c.px(cx - 3, y0 + 3, om.l); c.px(cx - 3, y0 + 4, om.l)
    }
    if (ov.kind === "reflective") { c.hline(cx - D.sw + 1, y0 + 6, D.sw * 2 - 2, "W"); c.hline(cx - D.sw + 1, y1 - 3, D.sw * 2 - 2, "W") }
  }

  // —— taška přes rameno: popruh přes hruď, taška na pravém boku ——
  if (has("bag")) {
    const bm = lidMat(o.bagCol || "leather")
    if (pose.back) c.line(cx + D.sw - 1, sy - breathe, cx - D.sw + 1, hipY - 3, bm.d)
    else c.line(cx - D.sw + 1, sy - breathe, cx + D.sw, hipY - 2, bm.d)
    const bx = cx + D.sw - 2, by = hipY - 4 + (pose.bag || 0)
    c.rect(bx, by, 6, 6, bm.m); c.hline(bx, by, 6, bm.l); c.rect(bx, by + 1, 6, 2, bm.d); c.hline(bx, by + 1, 6, bm.l)
    c.vline(bx + 5, by + 1, 5, bm.d); c.px(bx + 2, by + 3, "Y")
  }
  if (has("rope")) {
    // stočené lano přes levé rameno k pravému boku, smyčka visí na boku
    const n = hipY - 3 - sy
    for (let i = 0; i <= n; i++) { const x = cx - D.sw + Math.round(i * (D.sw * 2) / n); c.px(x, sy + i, i % 2 ? "C" : "c"); c.px(x + 1, sy + i, i % 2 ? "e" : "C") }
  }
  if (has("chain")) { [[-3, 2], [-2, 3], [-1, 4], [0, 4], [1, 3], [2, 2]].forEach(([dx, dy], i) => c.px(cx + dx, sy + dy, i % 2 ? "Y" : "y")) }
  if (has("keys")) { c.px(cx - D.ww, hipY, "M"); c.px(cx - D.ww - 1, hipY + 1, "m"); c.px(cx - D.ww, hipY + 2, "y") }

  // —— přední ruka ——
  const fx = cx - D.sw - 1
  if (has("clipboard")) {
    lidQuad(c, fx, fx + D.aw, sy + 1, fx + 1, fx + D.aw + 1, sy + 8, sleeve.m)
    c.rect(fx + 1, sy + 6, 5, 7, "h"); c.rect(fx + 2, sy + 7, 3, 5, "w"); c.hline(fx + 2, sy + 6, 3, "M"); c.rect(fx + 1, sy + 8, D.aw, 2, skin.m)
  } else {
    arm(fx, fa, sleeve.m, sleeve.d, null)
    for (let y = sy + 1; y < hipY + 1; y++) { const t = (y - sy) / (hipY + 2 - sy); c.px(fx + Math.round(fa * t), y, sleeve.l) }
    for (let y = sy + 2; y < hipY + 1; y++) { const t = (y - sy) / (hipY + 2 - sy); const x = fx + D.aw + Math.round(fa * t); if (!c.is(x, y, ".")) c.px(x, y, sleeve === skin ? skin.d : tm.d) }
    c.rect(fx + fa, hipY + 2, D.aw, 2, skin.m); c.px(fx + fa, hipY + 2, skin.l)
    if (has("rings")) c.px(fx + fa + 1, hipY + 3, "y")
  }
  const handX = fx + fa, handY = hipY + 2
  if (has("umbrella")) { c.vline(handX, handY - 2, 64 - handY + 1, "A"); c.rect(handX - 1, handY + 1, 3, 10, "k"); c.px(handX - 1, handY - 2, "A") }
  if (has("saw")) { c.rect(handX - 1, handY, 3, 3, "h"); c.poly([handX - 1, handY + 3, handX + 2, handY + 3, handX + 1, handY + 15, handX - 3, handY + 15], "m"); for (let y = handY + 4; y < handY + 15; y += 2) c.px(handX - 2 - Math.floor((y - handY) / 6), y, "M") }
  if (has("lantern")) { c.vline(handX + 1, handY + 2, 2, "M"); c.rect(handX - 1, handY + 4, 4, 5, "Y"); c.rect(handX, handY + 5, 2, 3, "f"); c.px(handX, handY + 6, "F") }

  // —— hlava ——
  lidHead(c, o, hx, hy, pose, skin, hair)
}

// Hlava 7 × 8 bodů v (hx, hy), tvář doleva. Tváře, oči, vlasy, vousy, pokrývka hlavy, brýle, cigareta.
function lidHead(c, o, hx, hy, pose, skin, hair) {
  const items = o.items || []
  const has = (k) => items.includes(k)
  const style = (o.hair && o.hair.style) || "short"
  const hat = o.hat
  const bald = style === "bald" || style === "none"
  // krk
  c.rect(hx + 2, hy + 7, 3, 2, skin.d)
  // týl a dlouhé vlasy za hlavou (před krkem kreslené až po hlavě)
  const S = { s: skin.m, d: skin.d, l: skin.l }
  const HEAD = [
    "..sss..",
    ".lssss.",
    "lsssssd",
    "lsssssd",
    "ssssssd",
    ".ssssdd",
    ".sssdd.",
    "..sdd..",
  ]
  HEAD.forEach((row, y) => [...row].forEach((ch, x) => { if (ch !== ".") c.px(hx + x, hy + y, S[ch]) }))
  // oči
  const eye = o.eyeCol || "k"
  if (!pose.blink) { c.px(hx + 1, hy + 3, eye); c.px(hx + 3, hy + 3, eye) } else { c.px(hx + 1, hy + 3, skin.d); c.px(hx + 3, hy + 3, skin.d) }
  c.px(hx + 4, hy + 4, skin.d) // ucho
  c.hline(hx + 1, hy + 6, 2, o.mouthCol || (o.female ? "d" : skin.d))
  if (o.female) c.px(hx, hy + 5, skin.m)

  // vlasy
  const hm = hair
  const back = (y0, y1, x0 = 4) => { for (let y = y0; y <= y1; y++) c.hline(hx + x0, y, 7 - x0, hm.m) }
  if (style !== "bald" && style !== "none") {
    c.hline(hx + 1, hy - 1, 5, hm.m); c.hline(hx, hy, 7, hm.m); c.hline(hx, hy + 1, 7, hm.m); c.px(hx + 1, hy - 1, hm.l); c.hline(hx + 1, hy, 2, hm.l)
    back(hy + 2, hy + 4, 5); c.px(hx + 6, hy + 5, hm.d); c.px(hx, hy + 2, hm.m)
  }
  if (style === "bald") { c.px(hx + 5, hy + 3, hm.m); c.px(hx + 6, hy + 3, hm.m); c.px(hx + 6, hy + 4, hm.d); c.px(hx + 2, hy, skin.l) }
  if (style === "long") {
    back(hy + 2, hy + 8, 4); c.rect(hx + 3, hy + 8, 5, 4, hm.m); c.vline(hx + 7, hy + 1, 10, hm.d); c.rect(hx + 5, hy + 10, 3, 2, hm.d)
    c.vline(hx, hy + 2, 3, hm.m); c.px(hx - 1, hy + 1, hm.m); c.px(hx + 4, hy + 4, hm.d)
  }
  if (style === "bob") { back(hy + 2, hy + 6, 4); c.vline(hx + 7, hy + 1, 6, hm.d); c.vline(hx, hy + 2, 4, hm.m); c.px(hx + 4, hy + 4, hm.d) }
  if (style === "bun") { c.circ(hx + 5, hy - 1, 2, hm.m); c.px(hx + 4, hy - 2, hm.l); c.px(hx + 6, hy, hm.d) }
  if (style === "ponytail") { c.vline(hx + 7, hy + 1, 7, hm.m); c.vline(hx + 8, hy + 3, 4, hm.d) }
  if (style === "perm") { c.hline(hx, hy - 2, 6, hm.m); c.hline(hx - 1, hy - 1, 8, hm.m); c.vline(hx - 1, hy, 3, hm.m); c.rect(hx + 5, hy + 1, 3, 5, hm.m); c.px(hx + 1, hy - 2, hm.l); c.px(hx + 3, hy - 1, hm.l); c.px(hx + 7, hy + 5, hm.d) }

  // zezadu: celá hlava je týl, dlouhé vlasy padají přes krk na záda
  if (pose.back) {
    HEAD.forEach((row, y) => [...row].forEach((ch, x) => { if (ch !== ".") c.px(hx + x, hy + y, bald ? (ch === "l" ? skin.l : ch === "d" ? skin.d : skin.m) : x < 2 ? hm.l : x > 4 ? hm.d : hm.m) }))
    if (!bald) { c.hline(hx + 1, hy - 1, 5, hm.m); c.px(hx + 2, hy - 1, hm.l) }
    c.px(hx, hy + 4, skin.d) // ucho
    if (style === "long") { c.rect(hx + 1, hy + 7, 6, 5, hm.m); c.vline(hx + 6, hy + 7, 5, hm.d); c.hline(hx + 2, hy + 12, 4, hm.d) }
    if (style === "ponytail") { c.vline(hx + 3, hy + 7, 6, hm.m); c.vline(hx + 4, hy + 8, 4, hm.d) }
    if (style === "bun") { c.circ(hx + 3, hy, 2, hm.m); c.px(hx + 2, hy - 1, hm.l) }
    return
  }

  // vousy
  const bm = lidHairMat(o.beardCol || (o.hair && o.hair.col))
  if (o.beard === "stubble") { c.px(hx + 2, hy + 7, skin.d); c.px(hx + 4, hy + 5, "4"); c.px(hx + 3, hy + 6, skin.d) }
  if (o.beard === "moustache" || o.beard === "full") { c.hline(hx, hy + 5, 3, bm.m) }
  if (o.beard === "beard" || o.beard === "full") { c.hline(hx + 1, hy + 6, 4, bm.m); c.hline(hx + 2, hy + 7, 3, bm.m); c.hline(hx + 2, hy + 8, 2, bm.d); c.px(hx + 4, hy + 5, bm.m); c.px(hx + 5, hy + 5, bm.d); c.hline(hx + 1, hy + 6, 1, "k") }

  // brýle
  if (has("sunglasses")) { c.hline(hx, hy + 3, 5, "k"); c.px(hx + 1, hy + 3, "a"); c.px(hx + 5, hy + 3, "k") }
  if (has("glasses")) { c.px(hx, hy + 3, "M"); c.px(hx + 2, hy + 3, "M"); c.px(hx + 4, hy + 3, "M") }
  if (has("goggles")) { c.hline(hx, hy + 2, 7, "A"); c.px(hx + 1, hy + 3, "l"); c.px(hx + 3, hy + 3, "l"); c.px(hx + 1, hy + 2, "L"); c.px(hx + 3, hy + 2, "L") }
  if (has("scar")) { c.px(hx + 2, hy + 4, "D"); c.px(hx + 3, hy + 5, "D") }

  // pokrývka hlavy
  if (hat) {
    const k = hat.kind
    const hm2 = lidMat(hat.col, k === "captain" ? "white" : k === "hardhat" ? "yellow" : k === "helmet" ? "olive" : "dark")
    if (k === "cap" || k === "peaked" || k === "captain") {
      c.rect(hx, hy - 2, 7, 3, hm2.m); c.hline(hx + 1, hy - 3, 5, hm2.m); c.px(hx + 1, hy - 2, hm2.l); c.vline(hx + 6, hy - 2, 3, hm2.d)
      if (k === "cap") { c.hline(hx - 2, hy + 1, 4, hm2.d) }
      else { c.hline(hx - 1, hy + 1, 8, "k"); c.hline(hx - 2, hy + 1, 3, "A"); if (k === "captain") c.px(hx + 2, hy - 1, "y"); if (k === "peaked") c.px(hx + 2, hy - 1, "Y") }
    }
    if (k === "beanie") { c.rect(hx, hy - 2, 7, 3, hm2.m); c.hline(hx + 1, hy - 3, 5, hm2.m); c.hline(hx, hy + 1, 7, hm2.d); c.px(hx + 1, hy - 2, hm2.l) }
    if (k === "beret") { c.hline(hx, hy - 2, 7, hm2.m); c.hline(hx - 1, hy - 1, 8, hm2.m); c.hline(hx, hy, 6, hm2.d); c.px(hx + 4, hy - 3, hm2.m) }
    if (k === "helmet" || k === "hardhat") {
      c.ellipse(hx + 3, hy, 4, 3, hm2.m); c.rect(hx - 1, hy, 9, 2, hm2.m); c.px(hx + 1, hy - 2, hm2.l); c.px(hx + 2, hy - 2, hm2.l)
      c.vline(hx + 6, hy - 1, 2, hm2.d); c.hline(hx - 1 - (k === "hardhat" ? 1 : 0), hy + 1, 10 + (k === "hardhat" ? 1 : 0), hm2.d)
      if (k === "helmet") c.hline(hx + 3, hy + 2, 2, "M")
    }
    if (k === "scarf" || k === "hood") {
      c.hline(hx + 1, hy - 2, 5, hm2.m); c.rect(hx, hy - 1, 7, 2, hm2.m); c.rect(hx + 5, hy + 1, 3, 6, hm2.m); c.vline(hx + 7, hy + 1, 6, hm2.d)
      c.px(hx, hy + 1, hm2.m); c.px(hx + 1, hy - 1, hm2.l); c.px(hx + 2, hy - 2, hm2.l)
      if (k === "scarf") { c.rect(hx + 1, hy + 7, 3, 2, hm2.d); c.px(hx + 2, hy + 9, hm2.m) }
      else { c.vline(hx - 1, hy + 1, 5, hm2.m); c.rect(hx + 2, hy + 7, 6, 3, hm2.m); c.vline(hx + 7, hy + 7, 3, hm2.d) }
    }
  }

  // cigareta v koutku, žhavý konec (kouř kreslí lidSmoke po obrysu)
  if (has("cigarette")) { c.hline(hx - 2, hy + 6, 2, "W"); c.px(hx - 3, hy + 6, "F") }
  if (has("holder")) { c.line(hx - 4, hy + 5, hx, hy + 6, "Y"); c.px(hx - 1, hy + 6, "O"); c.hline(hx - 6, hy + 5, 2, "W"); c.px(hx - 7, hy + 5, "F") }

}

// Pózy chůze: přední noha vpřed (doleva), zadní vzad, ruce proti nohám, v míjivých snímcích tělo o bod výš.
const LID_WALK = [
  { fl: -2, bl: 2, fa: 2, ba: -1, bob: 0, bag: 0 },
  { fl: 0, bl: 0, fa: 0, ba: 0, bob: -1, bag: 1 },
  { fl: 2, bl: -2, fa: -2, ba: 1, bob: 0, bag: 0 },
  { fl: 0, bl: 0, fa: 0, ba: 0, bob: -1, bag: -1 },
]
function lidWalk(name, o, ...extra) {
  return anim(name, { w: 24, h: 64, outline: "k", fps: 8, frames: 4 }, (c) => lidPerson(c, o, LID_WALK[c.frame]), ...extra)
}
// Stání: nádech v 1. a 2. snímku, mrknutí ve 3., kouř stoupá po snímcích. ex = { fps, smoke: false, blink: false }.
// Kouř se kreslí až po obrysu (snímky postavy jsou díly _<name>_<n>), aby neměl černý lem; výsledek je 26 × 66 jako
// u chůze, extra položky jsou proto v souřadnicích s obrysem (o bod vpravo a dolů proti lidPerson).
function lidIdle(name, o, ex = {}, ...extra) {
  const items = o.items || []
  const smokes = ex.smoke !== false && (items.includes("cigarette") || items.includes("holder"))
  for (let f = 0; f < 4; f++) sprite(`_${name}_${f}`, { w: 24, h: 64, outline: "k" }, (c) => lidPerson(c, o, {
    breathe: f === 1 || f === 2, blink: ex.blink !== false && f === 3,
  }))
  return anim(name, { w: 26, h: 66, fps: ex.fps || 3, frames: 4 }, (c) => {
    c.stamp(`_${name}_${c.frame}`, 0, 0)
    if (smokes) lidSmoke(c, o, c.frame)
  }, ...extra)
}
// Kouř z cigarety: pramínek stoupá a stáčí se, každý snímek o dva body výš.
function lidSmoke(c, o, f) {
  const H = o.height || 46
  const hx = 8 + 1, hy = 64 - H + (o.age === "old" ? 1 : 0) + 1 - (f === 1 || f === 2 ? 1 : 0)
  const holder = (o.items || []).includes("holder")
  const x0 = holder ? hx - 7 : hx - 3, y0 = hy + (holder ? 5 : 6)
  const path = [[0, -2], [1, -3], [1, -4], [0, -5], [-1, -6], [-1, -7], [0, -8], [1, -9], [1, -10], [0, -11], [-1, -12], [-1, -13]]
  path.forEach(([dx, dy], i) => {
    const k = (i + 12 - f * 2) % 12
    if (k > 7 || y0 + dy - f < 0) return
    c.px(x0 + dx + (i > 6 ? f % 2 : 0), y0 + dy, k < 3 ? "w" : k < 6 ? "v" : "x")
  })
}

// —— portrét 56 × 56: hlava a ramena, tříčtvrteční pohled doleva ——
function lidFace(c, o) {
  const skin = LID_SKIN[o.skin] || LID_SKIN.normal
  const hair = lidHairMat(o.hair && o.hair.col)
  const style = (o.hair && o.hair.style) || "short"
  const items = o.items || []
  const has = (k) => items.includes(k)
  const top_ = o.top || { kind: "jacket", col: "grey" }
  const tm = lidMat(top_.col, "grey")
  const stout = o.build === "stout", thin = o.build === "thin"
  const old = o.age === "old"
  const hat = o.hat
  // střed hlavy, rozměry
  const cx = 27, cy = 25, rx = stout ? 13 : thin ? 10 : 11, ry = 15

  // dlouhé vlasy za hlavou a za rameny
  if (style === "long") { c.ellipse(cx + 3, cy + 4, rx + 3, ry + 3, hair.m); c.rect(cx - 6, cy + 4, rx + 15, 22, hair.m); lidShadeRows(c, cy - 8, 55, hair.m, hair, 0, 3) }
  if (style === "bob") { c.ellipse(cx + 2, cy + 2, rx + 3, ry + 1, hair.m) }
  if (style === "perm") { c.ellipse(cx + 1, cy - 3, rx + 5, ry, hair.m); for (let i = 0; i < 14; i++) c.circ(cx - 12 + (i * 7) % 28, cy - 14 + Math.floor(i / 4) * 5, 2, hair.d) }
  if (style === "ponytail") { c.ellipse(cx + rx + 2, cy + 8, 3, 9, hair.m); c.vline(cx + rx + 4, cy + 2, 14, hair.d) }

  // ramena a oblečení
  const sw = stout ? 27 : thin ? 21 : 24
  c.poly([cx - sw, 56, cx - sw + 4, 44, cx - 8, 40, cx + 8, 40, cx + sw - 2, 44, cx + sw + 2, 56], tm.m)
  if (stout) c.ellipse(cx, 56, sw, 8, tm.m)
  lidShadeRows(c, 40, 55, tm.m, tm, 2, 6)
  // krk
  c.rect(cx - 6, cy + 10, stout ? 15 : 11, 9, skin.d); c.rect(cx - 6, cy + 10, 4, 7, skin.m)
  // límec / výstřih podle oděvu
  const kind = top_.kind
  if (kind === "coat" || kind === "jacket" || kind === "suit" || kind === "robe") {
    const shirt = lidMat(o.shirtCol || (kind === "suit" ? "white" : tm), "white")
    c.poly([cx - 7, 40, cx + 6, 40, cx + 1, 52], kind === "suit" ? shirt.m : skin.d)
    c.poly([cx - 10, 39, cx - 5, 39, cx, 53, cx - 4, 56, cx - 12, 46], tm.l) // levá klopa
    c.poly([cx + 4, 39, cx + 9, 39, cx + 11, 46, cx + 4, 56, cx + 1, 53], tm.d) // pravá klopa
    c.line(cx - 5, 39, cx, 53, tm.d)
    if (kind === "suit") { c.poly([cx - 1, 42, cx + 2, 42, cx + 3, 53, cx, 56, cx - 2, 53], o.tieCol || "V"); c.hline(cx - 1, 42, 3, "D") }
    if (kind === "coat") { c.px(cx - 2, 51, "M"); c.px(cx - 2, 55, "M") }
  }
  if (kind === "vest") { const sm = lidMat(o.shirtCol || "white"); c.poly([cx - 7, 40, cx + 6, 40, cx + 2, 56, cx - 3, 56], sm.m) }
  if (kind === "overalls") { const sm = lidMat(o.shirtCol || "grey"); c.poly([cx - 18, 42, cx + 16, 42, cx + 20, 56, cx - 20, 56], sm.m); c.rect(cx - 9, 48, 18, 8, tm.m); c.rect(cx - 12, 42, 3, 14, tm.m); c.rect(cx + 8, 42, 3, 14, tm.d); c.px(cx - 11, 47, "M"); c.px(cx + 9, 47, "M") }
  if (kind === "neoprene") { c.rect(cx - 7, 38, 13, 4, tm.m); c.vline(cx - 1, 42, 14, tm.l) }
  if (kind === "sweater") { c.ellipse(cx - 1, 41, 9, 3, tm.d); c.ellipse(cx - 1, 40, 7, 2, skin.d) }

  const ov = o.over
  if (ov) {
    const om = lidMat(ov.col, ov.kind === "lifevest" ? "orange" : ov.kind === "reflective" ? "yellow" : "khaki")
    c.poly([cx - sw + 3, 56, cx - sw + 6, 44, cx - 9, 41, cx - 4, 52, cx - 3, 56], om.m)
    c.poly([cx + 3, 56, cx + 4, 52, cx + 8, 41, cx + sw - 3, 44, cx + sw, 56], om.m)
    lidShadeRows(c, 41, 55, om.m, om, 2, 4)
    if (ov.kind === "lifevest") { c.hline(cx - sw + 4, 50, 14, om.d); c.hline(cx + 5, 50, sw - 4, om.d); c.line(cx - 10, 42, cx - 14, 55, om.d); c.rect(cx - 5, 52, 3, 3, "M") }
    if (ov.kind === "reflective") { c.hline(cx - sw + 4, 50, 15, "W"); c.hline(cx + 5, 50, sw - 4, "W") }
  }
  if (has("bag")) { const bm = lidMat(o.bagCol || "leather"); c.line(cx - sw + 6, 44, cx - 2, 56, bm.m, 3); c.line(cx - sw + 6, 43, cx - 3, 55, bm.l); c.line(cx + 10, 40, cx + 14, 56, bm.d, 3); c.px(cx - 8, 50, "Y") }
  if (has("rope")) { for (let i = 0; i < 3; i++) c.line(cx - sw + 6 + i * 2, 42, cx + 2 + i * 2, 56, i % 2 ? "C" : "c", 2); c.line(cx - sw + 7, 43, cx + 3, 56, "e") }
  if (has("chain")) { for (let x = cx - 9; x <= cx + 7; x += 2) { const y = 44 + Math.round(((x - cx) / 9) ** 2 * -4 + 4); c.px(x, y, "y"); c.px(x + 1, y, "Y") } }
  if (has("rifle")) { c.line(cx + 16, 40, cx + 22, 56, "H", 3); c.line(cx + 14, 41, cx + 20, 56, "M") }

  // hlava: vejce, čelist dole vpravo seříznutá, brada vlevo dole
  c.ellipse(cx, cy, rx, ry, skin.m)
  c.poly([cx + rx + 1, cy + 5, cx + rx + 1, cy + ry + 1, cx - 2, cy + ry + 1], "_")
  c.poly([cx - rx - 1, cy + 8, cx - 6, cy + ry + 1, cx - rx - 1, cy + ry + 1], "_")
  // stín: odvrácená strana hlavy a pod čelistí, světlo: čelo a lícní kost vlevo
  for (let y = cy - ry; y <= cy + ry; y++) for (let x = cx - rx; x <= cx + rx; x++) {
    if (!c.is(x, y, skin.m)) continue
    const side = x - cx > 3 - (y - cy) / 5, jaw = y - cy > 11 - (x - cx) / 3
    if (side || jaw) c.px(x, y, skin.d)
    else if (x - cx < -5 + (y - cy) / 4 && y < cy + 3 && y > cy - 12) c.px(x, y, skin.l)
  }
  c.rect(cx - 9, cy + 2, 3, 2, skin.l)
  // ucho vpravo
  c.ellipse(cx + rx - 2, cy + 1, 2, 4, skin.m); c.vline(cx + rx - 2, cy, 3, skin.d); c.px(cx + rx - 1, cy - 2, skin.l)
  // nos doleva: hřbet ve světle, stín vpravo od něj a pod ním
  c.vline(cx - 6, cy - 1, 5, skin.l); c.vline(cx - 5, cy, 5, skin.m); c.vline(cx - 4, cy + 1, 4, skin.d)
  c.hline(cx - 9, cy + 4, 3, skin.m); c.px(cx - 10, cy + 4, skin.m); c.hline(cx - 8, cy + 5, 4, skin.d); c.px(cx - 9, cy + 5, "3")
  // oči: horní víčko, bělmo, duhovka; obočí
  const eyeCol = o.eyeCol || "K"
  const eye = (x, w) => { c.hline(x, cy - 3, w, "3"); c.hline(x, cy - 2, w, "w"); c.px(x + w - 2, cy - 2, eyeCol); c.px(x + w - 3, cy - 2, "k"); c.hline(x, cy - 1, w, skin.d) }
  eye(cx - 10, 3); eye(cx - 2, 4)
  const brow = (o.hair && (o.hair.style === "bald" || o.hair.style === "none")) ? hair.d : hair.m
  c.hline(cx - 11, cy - 5, 4, brow); c.hline(cx - 3, cy - 5, 5, brow); c.px(cx + 2, cy - 4, brow)
  // ústa
  const mouth = o.mouthCol || "3"
  c.hline(cx - 9, cy + 9, 6, mouth); c.px(cx - 3, cy + 8, mouth)
  if (o.female) { c.hline(cx - 8, cy + 10, 4, "d"); c.hline(cx - 8, cy + 8, 3, "8") } else c.hline(cx - 8, cy + 10, 4, skin.d)
  c.hline(cx - 8, cy + 12, 3, skin.d)
  // únava: kruhy pod očima, vrásky, odstřik špíny
  c.hline(cx - 2, cy, 3, skin.d)
  if (old) { c.hline(cx - 2, cy + 1, 4, skin.d); c.line(cx - 3, cy + 5, cx - 1, cy + 10, skin.d); c.hline(cx - 7, cy - 8, 6, skin.d); c.hline(cx - 5, cy - 10, 5, skin.d); c.px(cx + 3, cy - 2, skin.d); c.px(cx + 3, cy, skin.d) }
  if (stout) { c.ellipse(cx - 2, cy + 15, 7, 2, skin.d); c.hline(cx - 8, cy + 14, 8, skin.m) }
  if (has("scar")) { c.line(cx + 2, cy - 4, cx + 5, cy + 6, "D"); c.line(cx + 3, cy - 4, cx + 6, cy + 6, "d") }
  if (has("dirt")) { lidSpeckle(c, cx - 11, cy - 8, 20, 22, skin.m + skin.l, skin.d, 0.06); c.px(cx + 4, cy + 10, "3"); c.px(cx - 9, cy + 6, skin.d) }

  // vousy
  const bm = lidHairMat(o.beardCol || (o.hair && o.hair.col))
  if (o.beard === "stubble") lidSpeckle(c, cx - 10, cy + 6, rx + 9, 11, skin.m + skin.l, skin.d, 0.4)
  if (o.beard === "beard" || o.beard === "full") { c.poly([cx - 9, cy + 8, cx + rx - 1, cy + 3, cx + rx - 3, cy + 12, cx + 2, cy + 18, cx - 6, cy + 17], bm.m); c.hline(cx - 8, cy + 10, 6, "k"); lidShadeRows(c, cy + 3, cy + 18, bm.m, bm, 1, 3) }
  if (o.beard === "moustache" || o.beard === "full") { c.poly([cx - 10, cy + 9, cx - 9, cy + 7, cx - 1, cy + 7, cx, cy + 10, cx - 3, cy + 9, cx - 8, cy + 9], bm.m); c.hline(cx - 8, cy + 7, 5, bm.l) }

  // vlasy: temeno nad čelem, ofina sčesaná doleva, týl vpravo; krátké nechají ucho
  const hm = hair
  const longish = style === "long" || style === "bob"
  if (style !== "bald" && style !== "none") {
    c.ellipse(cx + 1, cy - 12, rx + 1, 6, hm.m)
    c.poly([cx - rx - 1, cy - 12, cx + 2, cy - 14, cx - 3, cy - 8, cx - 8, cy - 7, cx - rx, cy - 5], hm.m)
    c.poly([cx + 3, cy - 12, cx + rx + 2, cy - 11, cx + rx + 1, cy + (longish ? 6 : 0), cx + rx - 2, cy - 2, cx + 4, cy - 6], hm.m)
    lidShadeRows(c, cy - 18, cy + 6, hm.m, hm, 0, 2)
    for (let i = 0; i < 4; i++) c.line(cx - 8 + i * 4, cy - 16, cx - 10 + i * 4, cy - 9, hm.l)
    c.line(cx + 5, cy - 13, cx + rx, cy - 4, hm.d)
  }
  if (longish) {
    c.poly([cx - rx - 1, cy - 10, cx - rx + 2, cy - 10, cx - rx + 1, cy + 6, cx - rx - 1, cy + 4], hm.m)
    c.poly([cx + rx - 4, cy - 6, cx + rx + 3, cy - 6, cx + rx + 3, cy + (style === "long" ? 20 : 12), cx + rx - 3, cy + (style === "long" ? 18 : 12)], hm.m)
    c.line(cx + rx + 2, cy - 4, cx + rx + 2, cy + 18, hm.d); c.line(cx + rx - 1, cy, cx + rx, cy + 16, hm.d); c.line(cx + rx - 3, cy - 4, cx + rx - 2, cy + 10, hm.l)
  }
  if (style === "bald") { c.poly([cx + rx - 4, cy - 5, cx + rx + 1, cy - 6, cx + rx, cy + 3, cx + rx - 3, cy + 1], hm.m); c.ellipse(cx - 3, cy - 11, 4, 2, skin.l) }
  if (style === "bun") { c.circ(cx + 6, cy - 18, 5, hm.m); c.circ(cx + 5, cy - 19, 2, hm.l); c.ellipse(cx + 8, cy - 16, 3, 2, hm.d) }
  if (style === "ponytail") { c.hline(cx + rx - 1, cy - 8, 3, hm.d) }

  // brýle
  if (has("sunglasses")) { c.rect(cx - 11, cy - 4, 6, 4, "k"); c.rect(cx - 2, cy - 4, 7, 4, "k"); c.hline(cx - 5, cy - 3, 3, "k"); c.line(cx + 5, cy - 3, cx + rx - 1, cy - 2, "k"); c.px(cx - 10, cy - 3, "a"); c.hline(cx - 1, cy - 3, 2, "a") }
  if (has("glasses")) { c.ring(cx - 8, cy - 2, 3, "M"); c.ring(cx + 1, cy - 2, 3, "M"); c.hline(cx - 5, cy - 2, 3, "M"); c.line(cx + 4, cy - 2, cx + rx - 1, cy - 2, "M") }
  if (has("goggles")) { c.rect(cx - rx, cy - 5, rx * 2 + 1, 5, "A"); c.rect(cx - 10, cy - 5, 6, 5, "L"); c.rect(cx - 2, cy - 5, 7, 5, "L"); c.px(cx - 9, cy - 4, "l"); c.px(cx - 1, cy - 4, "l") }

  // pokrývka hlavy
  if (hat) {
    const k = hat.kind
    const m = lidMat(hat.col, k === "captain" ? "white" : k === "hardhat" ? "yellow" : k === "helmet" ? "olive" : "dark")
    if (k === "cap" || k === "peaked" || k === "captain") {
      c.ellipse(cx + 1, cy - 12, rx + 2, 7, m.m); c.rect(cx - rx - 1, cy - 12, rx * 2 + 4, 5, m.m)
      lidShadeRows(c, cy - 19, cy - 8, m.m, m, 2, 3)
      if (k === "cap") { c.poly([cx - rx - 8, cy - 6, cx - 2, cy - 8, cx - 2, cy - 6, cx - rx - 6, cy - 4], m.d) }
      else { c.rect(cx - rx - 1, cy - 8, rx * 2 + 4, 2, "k"); c.poly([cx - rx - 6, cy - 5, cx - 3, cy - 7, cx - 3, cy - 5, cx - rx - 4, cy - 3], "A"); c.rect(cx - 4, cy - 15, 4, 3, k === "captain" ? "y" : "Y") }
    }
    if (k === "beanie") { c.ellipse(cx + 1, cy - 11, rx + 2, 8, m.m); c.rect(cx - rx - 1, cy - 9, rx * 2 + 4, 4, m.d); lidShadeRows(c, cy - 19, cy - 10, m.m, m, 1, 3) }
    if (k === "beret") { c.ellipse(cx - 1, cy - 12, rx + 4, 5, m.m); c.hline(cx - rx, cy - 8, rx * 2, m.d); c.px(cx, cy - 18, m.m) }
    if (k === "helmet" || k === "hardhat") {
      c.ellipse(cx + 1, cy - 10, rx + 3, 10, m.m); c.rect(cx - rx - 3, cy - 10, rx * 2 + 8, 4, m.m)
      lidShadeRows(c, cy - 20, cy - 7, m.m, m, 2, 4)
      c.hline(cx - rx - 4 - (k === "hardhat" ? 2 : 0), cy - 6, rx * 2 + 10, m.d)
      if (k === "hardhat") c.vline(cx - 1, cy - 19, 10, m.l)
      else { c.line(cx + rx - 2, cy - 6, cx + rx - 4, cy + 10, "M"); c.circ(cx - 6, cy - 14, 1, m.d) }
    }
    if (k === "scarf" || k === "hood") {
      c.ellipse(cx + 1, cy - 4, rx + 3, ry + 3, m.m)
      c.ellipse(cx - 2, cy + 3, rx - 1, ry - 4, skin.m)
      lidShadeRows(c, cy - 20, cy + 18, m.m, m, 1, 4)
      if (k === "scarf") { c.poly([cx - 4, cy + 14, cx + 6, cy + 14, cx + 4, cy + 20, cx - 2, cy + 20], m.d); c.circ(cx + 1, cy + 15, 2, m.m) }
      else { c.poly([cx - rx - 4, cy + 10, cx + rx + 4, cy + 10, cx + rx + 8, 40, cx - rx - 6, 40], m.m); lidShadeRows(c, cy + 10, 40, m.m, m, 1, 4) }
      // obličej znovu
      eye(cx - 9, 3); eye(cx - 1, 4); c.hline(cx - 8, cy + 10, 6, mouth)
      c.poly([cx - 6, cy - 1, cx - 4, cy - 1, cx - 3, cy + 6, cx - 9, cy + 6], skin.m); c.hline(cx - 8, cy + 6, 4, skin.d); c.vline(cx - 4, cy, 6, skin.d)
    }
  }

  // cigareta a špička
  if (has("cigarette")) { c.line(cx - 8, cy + 9, cx - 16, cy + 12, "W"); c.line(cx - 8, cy + 10, cx - 16, cy + 13, "w"); c.rect(cx - 18, cy + 12, 2, 2, "F"); c.px(cx - 17, cy + 12, "f") }
  if (has("holder")) { c.line(cx - 8, cy + 9, cx - 20, cy + 14, "Y"); c.line(cx - 8, cy + 10, cx - 20, cy + 15, "O"); c.line(cx - 21, cy + 15, cx - 25, cy + 16, "W"); c.px(cx - 26, cy + 16, "F") }
  if (has("rings")) { c.rect(cx - 25, 48, 8, 8, skin.m); c.hline(cx - 25, 51, 5, "y"); c.hline(cx - 25, 54, 5, "Y") }
}

// —— hrdinka: pošťačka v obnošeném stejnokroji České pošty ——
const LID_HERO = {
  build: "normal", height: 46, female: true, skin: "normal",
  hair: { style: "long", col: "dark" },
  // kabát o stupeň světlejší než pošťácká modrá ostatních a brašna v poštovní žluté: ve tmě ulice ji má být vidět
  top: { kind: "coat", col: { d: "L", m: "l", l: "w" } },
  legs: { kind: "trousers", col: "ash" },
  shoes: { kind: "boots", col: "leather" },
  items: ["bag", "dirt"], bagCol: "gold",
}
lidWalk("hero", LID_HERO)
// chůze s hlavou v předklonu (k divákovi) a zezadu (od diváka); stání zezadu
anim("hero_go", { w: 24, h: 64, outline: "k", fps: 8, frames: 4 }, (c) => lidPerson(c, LID_HERO, { ...LID_WALK[c.frame], lean: 1 }))
anim("hero_up", { w: 24, h: 64, outline: "k", fps: 8, frames: 4 }, (c) => lidPerson(c, LID_HERO, { ...LID_WALK[c.frame], lean: 1, back: true }))
sprite("hero_back", { w: 24, h: 64, outline: "k" }, (c) => lidPerson(c, LID_HERO, { back: true }))
sprite("face_hero", { w: 56, h: 56, outline: "k" }, (c) => lidFace(c, LID_HERO))

// —— Fanta: šéf tržiště ——
const LID_FANTA = {
  build: "stout", height: 45, skin: "normal",
  hair: { style: "short", col: "dark" }, beard: "stubble",
  top: { kind: "suit", col: "brown" }, shirtCol: "khaki", tieCol: "V",
  legs: { kind: "trousers", col: "brown" },
  shoes: { kind: "shoes", col: "dark" },
  items: ["chain", "rings", "sunglasses", "holder"],
}
lidIdle("fanta", LID_FANTA)
sprite("face_fanta", { w: 56, h: 56, outline: "k" }, (c) => lidFace(c, LID_FANTA))

// —— Kuřačka: loďkařská hlídka u mola ——
const LID_KURACKA = {
  build: "thin", height: 45, female: true, skin: "tan",
  hair: { style: "ponytail", col: "bleached" },
  top: { kind: "shirt", col: "ash" },
  over: { kind: "lifevest" },
  legs: { kind: "trousers", col: "olive" },
  shoes: { kind: "rubber", col: "rubber" },
  items: ["cigarette", "rope", "dirt"],
}
lidIdle("kuracka", LID_KURACKA)
sprite("face_kuracka", { w: 56, h: 56, outline: "k" }, (c) => lidFace(c, LID_KURACKA))
