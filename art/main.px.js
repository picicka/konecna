// Konečná. Nevystupovat.: všechny herní sprity. Sestavení: npm run art (pxl), výstupem je atlas pro Phaser
// (public/images/atlas.png + .json) a obrázky filmečků (public/images/cs_*.png). Nové sprity přidat do sheet().
include("palette.px.js")
include("tiles.px.js")
include("chars.px.js")
include("scenes.px.js")

sheet("atlas", ["t_*", "hero", "face_*", "ico_*"], { pad: 1 })
