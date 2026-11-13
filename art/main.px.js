// Konečná. Nevystupovat.: všechny herní sprity. Sestavení: npm run art (pxl), výstupem je atlas pro Phaser
// (public/images/atlas.png + .json) a obrázky filmečků (public/images/cs_*.png). Nové sprity přidat do sheet().
include("palette.px.js")
include("tiles.px.js")
include("buildings.px.js")
include("houses-hlavak.px.js")
include("houses-vaclavak.px.js")
include("houses-staromak.px.js")
include("houses-most.px.js")
include("houses-malastrana.px.js")
include("houses-hrad.px.js")
include("houses-nuselak.px.js")
include("chars.px.js")
include("kurzory.px.js")
include("drobnosti.px.js")
include("lide.px.js")
include("lide-a.px.js")
include("lide-b.px.js")
include("lide-c.px.js")
include("props.px.js")
include("fanta.px.js")
include("scenes.px.js")
include("tram.px.js")
include("vaclavak.px.js")
include("staromak.px.js")
include("hrad.px.js")
include("katedrala.px.js")
include("lm-tyn.px.js")
include("lm-radnice.px.js")
include("lm-namesti.px.js")
include("lm-most.px.js")
include("most-oblouky.px.js")
include("hrad-svah.px.js")
include("kuriozity.px.js")
include("nuselak-most.px.js")
include("lm-nusle.px.js")
include("nusle-postavy.px.js")
include("lm-kostely.px.js")
include("scenes2.px.js")
// Zem míst z vektorů OSM: malíř a vygenerovaná data (díly gr_<místo>_<i>_<j>, listy ground_<místo>_<n> zakládá groundMap).
include("ground.px.js")
include("ground-hlavak.px.js")
include("ground-vaclavak.px.js")
include("ground-staromak.px.js")
include("ground-most.px.js")
include("ground-malastrana.px.js")
include("ground-hrad.px.js")
include("ground-nuselak.px.js")

sheet("atlas", ["t_*", "hero", "fanta", "vypravci", "robin", "strojvedouci", "trafikantka", "face_*", "ico_*", "kurzor_*", "smeti_*", "kour_*", "skvrna_*", "tree_*", "lamp", "bench", "barrel_fire", "metro_entrance", "kiosk", "dog", "dog_lie", "hero_go", "hero_up", "hero_back", "station_clock", "car_wreck_*", "bus_wreck*", "loco_*", "coach_*", "wagon_*", "canopy", "catenary", "metro_totem_*", "door_fanta", "rubble_pile", "barrel", "tires", "shack", "bush_*", "decal_*", "tram_*", "vaclav", "dispecerka", "revizor", "kuracka", "reproduktor", "reproduktor_prazdny", "nutrie_breh", "lodka", "vylez", "nutrie",
    // Staromák až Hrad: postavy (art/postavy.px.js), rekvizity a zvířata do boje (art/staromak.px.js, art/hrad.px.js)
    "admiral", "orlojnik", "potapecka", "lovec", "pilar", "netere", "hlidac", "mlynar", "vymahac", "pani", "velvyslanec", "straz", "kastelan", "pruvodkyne", "ochranka", "reditel",
    "lovec_hak", "vyloha", "ostrov_lodka", "podstavec_*", "bedny", "cedule_galerie", "kun_vaclav", "zed_lennon_*", "mlynske_kolo", "zarovka", "zarovka_zhasla", "kanec",
    "trabant", "budka_straz", "razitko_stul", "holub", "bunka", "generator", "obelisk", "ctecka", "reflektor", "ochranka_cedule", "plot_*",
    // Nuselák (art/nusle-postavy.px.js): postavy, hrdinka na laně, lachtani, racci, kotě, vrak Tatry VB
    "policista", "policista_kote", "lanar", "kormidelnik", "hero_lano", "lachtan", "lachtan_lezi", "racek", "racek_let", "kote", "tatra_vb"], { pad: 1 })
// Velké kusy (oblouky haly, Fantova budova) mají vlastní list.
// Fantova budova a oblouky; hala pod magistrálou s rampami a věžemi má vlastní list (je dlouhá).
sheet("landmarks", ["rib_*", "lm_fanta_*"], { pad: 1 })
sheet("landmarks3", ["lm_shed_*"], { pad: 1 })
sheet("landmarks2", ["lm_hall_*", "lm_stair_tower"], { pad: 1 })
sheet("landmarks4", ["lm_viaduct_*"], { pad: 1 })
sheet("landmarks_vaclavak", ["lm_muzeum"], { pad: 1 })
// Domy míst mají vlastní atlasy (houses_<místo>_0 až _3), zakládá je vygenerovaný houses-<místo>.px.js.
