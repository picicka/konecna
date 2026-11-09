// Paleta Konečné ve stylu Falloutu 1 a 2: všechno stažené a ztmavené k prachově hnědé, syté zůstávají jen oheň, neony,
// sprej a CRT (posun dělal skript z původní palety Václaváku: sytost × 0,5, světlé tóny × 0,82, 12 % okrového prachu).
// Původně: pustina (popel, asfalt, prach), pražské
// fasády (okr, šeď, cihla, zlato), střechy, sklo, rez, oheň, voda Vltavy a zelená CRT pro UI. Rampy tmavá → světlá řídí
// shade()/light(). Nové klíče přidávat dolů, číslice 0–9 jsou volné pro slohy (secesní zelená, lososová, travertin…).
pal({
  k: "#0c0b0d",                                   // obrys, nejtmavší
  N: "#111115", n: "#1b1c21",                     // noc, tmavé sklo
  W: "#bcb7a8", w: "#a39e92", v: "#848279", x: "#61605b", // světlý prach → popel
  A: "#2a2a2c", a: "#38383a", B: "#464648",       // asfalt
  P: "#55534f", p: "#6a6761", q: "#7e7a71",       // dlažba, mozaika, kámen
  G: "#3d3c31", g: "#4d4b3e",                     // uschlá tráva
  e: "#5c564b", C: "#867b69", c: "#9e927c",       // okrová omítka
  T: "#585954", t: "#74766f", z: "#8d8f85",       // šedozelená omítka
  R: "#59413a", r: "#6e554d",                     // cihla, růžová omítka
  O: "#564930", Y: "#836e40", y: "#b69749",       // zlato, mosaz
  D: "#462823", d: "#5c403a",                     // střešní tašky
  S: "#343438", s: "#444549",                     // břidlice, plech
  L: "#55616a", l: "#758a94",                     // sklo celé
  H: "#392e25", h: "#574635",                     // dřevo
  U: "#4b3527", u: "#664b38",                     // rez
  M: "#565658", m: "#7b7c7f",                     // kov
  F: "#f26b1f", f: "#ffc33d",                     // oheň
  E: "#2ee86b", I: "#b7f5c9",                     // CRT zelená
  Q: "#3c554b", j: "#5f796b",                     // měděnka (kupole, socha)
  i: "#a18266", K: "#362b24",                     // pleť, vlasy
  b: "#3d4857", V: "#64302f", o: "#885f35",       // kabát modrý, červený, oranžový
  "1": "#9ea78f", "2": "#727b6a",                 // světle zelená secese
  "8": "#a38472", "0": "#b89986",                 // lososová omítka
  "3": "#473b34", "4": "#756655",                 // hnědá, okrové parapetní pásy
  "5": "#85817a", "6": "#615e5a",                 // travertin
  "9": "#453834",                                 // tmavá žula
  "7": "#ff5a48",                                 // červený neon
  X: "#213038", Z: "#314951", J: "#456467",       // voda Vltavy: hloubka → hladina
})
ramps("k21W", "kr80", "k34", "k65", "k9R", "kV7", "kxvwW", "kAaB", "kPpq", "kGg", "keCc", "kTtz", "kRr", "kOYy", "kDd", "kSs", "knLl", "kHh", "kUu", "kMm", "kFf", "kEI", "kQj", "Kib", "kNn", "kV", "ko", "kXZJ")
