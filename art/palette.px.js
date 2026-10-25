// Paleta Konečné, převzatá z Václaváku po pádu bez zimy a bez firemních barev: pustina (popel, asfalt, prach), pražské
// fasády (okr, šeď, cihla, zlato), střechy, sklo, rez, oheň, voda Vltavy a zelená CRT pro UI. Rampy tmavá → světlá řídí
// shade()/light(). Nové klíče přidávat dolů, číslice 0–9 jsou volné pro slohy (secesní zelená, lososová, travertin…).
pal({
  k: "#0e0c10",                                   // obrys, nejtmavší
  N: "#10121c", n: "#1b1e2c",                     // noc, tmavé sklo
  W: "#ece9df", w: "#cfccbf", v: "#a9a89d", x: "#7d7d75", // světlý prach → popel
  A: "#2f3036", a: "#3f4047", B: "#4f5058",       // asfalt
  P: "#6f6c64", p: "#8a867c", q: "#a39e92",       // dlažba, mozaika, kámen
  G: "#4e4d34", g: "#6b6948",                     // uschlá tráva
  e: "#7f7257", C: "#b1a083", c: "#cdbd9f",       // okrová omítka
  T: "#6f746c", t: "#929a8f", z: "#b3b9ad",       // šedozelená omítka
  R: "#7a3f33", r: "#a2604f",                     // cihla, růžová omítka
  O: "#7c5c22", Y: "#bd953f", y: "#e0bf68",       // zlato, mosaz
  D: "#5a2822", d: "#7f3b31",                     // střešní tašky
  S: "#383b46", s: "#515664",                     // břidlice, plech
  L: "#5f7f96", l: "#93b2c3",                     // sklo celé
  H: "#4e3420", h: "#86592f",                     // dřevo
  U: "#6e3818", u: "#a2592a",                     // rez
  M: "#696d77", m: "#9a9ea8",                     // kov
  F: "#f26b1f", f: "#ffc33d",                     // oheň
  E: "#2ee86b", I: "#b7f5c9",                     // CRT zelená
  Q: "#3f7a66", j: "#6fa58d",                     // měděnka (kupole, socha)
  i: "#d8a67c", K: "#4a2f20",                     // pleť, vlasy
  b: "#34507a", V: "#8e2f2f", o: "#c97a2a",       // kabát modrý, červený, oranžový
  "1": "#c9d7bb", "2": "#8fa485",                 // světle zelená secese
  "8": "#d6a78e", "0": "#eac4b0",                 // lososová omítka
  "3": "#5e4232", "4": "#a8855c",                 // hnědá, okrové parapetní pásy
  "5": "#aaa69e", "6": "#7e7a73",                 // travertin
  "9": "#5a3a34",                                 // tmavá žula
  "7": "#ff5a48",                                 // červený neon
  X: "#1f3a4a", Z: "#2d5a6b", J: "#4a8a93",       // voda Vltavy: hloubka → hladina
})
ramps("k21W", "kr80", "k34", "k65", "k9R", "kV7", "kxvwW", "kAaB", "kPpq", "kGg", "keCc", "kTtz", "kRr", "kOYy", "kDd", "kSs", "knLl", "kHh", "kUu", "kMm", "kFf", "kEI", "kQj", "Kib", "kNn", "kV", "ko", "kXZJ")
