# Krytina střech z ortofota ČÚZK (WMS ORTOFOTO, CC BY 4.0), postup podle izomapy (nastroje/strechy.py).
# Stáhne ortofoto výřezu po dlaždicích 1024 px (0,25 m/px, build/orto, necommituje se), pro každou budovu z
# data/osm/<místo>.json vezme pixely uvnitř půdorysu zmenšeného o 1,5 m (okraje, okapy, stíny sousedů) bez nejtmavší
# a nejsvětlejší pětiny a určí medián barvy. Podle odstínu a sytosti zařadí krytinu:
#   tasky (pálené tašky, červenohnědé), hneda (staré tašky, hnědý plech), med (měděnka, zelenomodrá),
#   tmava (břidlice, eternit, tmavý plech), plech (šedý plech), svetla (lepenka s kačírkem, světlé fólie).
# Výsledek data/strechy-<místo>.json: { osm id: [r, g, b, krytina] }; scripts/osm.mjs ho předává house() jako cover.
# Spuštění: .venv/bin/python scripts/strechy.py hlavak   (prostředí: viz scripts/vysky.py, navíc pillow)
import colorsys, glob, io, json, os, sys, urllib.request
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from pyproj import Transformer

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
name = sys.argv[1] if len(sys.argv) > 1 else 'hlavak'
T = Transformer.from_crs(4326, 5514, always_xy=True)
WMS = 'https://ags.cuzk.gov.cz/arcgis1/services/ORTOFOTO/MapServer/WMSServer'
RES, TILE = 0.25, 1024  # m/px, px

elements = []
for f in sorted(glob.glob(os.path.join(ROOT, 'data/osm', f'{name}*.json'))):
    elements += json.load(open(f, encoding='utf8'))['elements']
nodes = {e['id']: e for e in elements if e['type'] == 'node'}
polys = {}
for w in (e for e in elements if e['type'] == 'way' and 'building' in e.get('tags', {})):
    pts = [nodes[n] for n in w['nodes'] if n in nodes]
    if len(pts) < 4: continue
    x, y = T.transform([p['lon'] for p in pts], [p['lat'] for p in pts])
    polys[w['id']] = np.column_stack([x, y])
allp = np.vstack(list(polys.values()))
x0, y0 = np.floor(allp.min(0) / 10) * 10 - 10
x1, y1 = np.ceil(allp.max(0) / 10) * 10 + 10
span = TILE * RES
nx, ny = int(np.ceil((x1 - x0) / span)), int(np.ceil((y1 - y0) / span))

# Mozaika ortofota: řádek 0 je nahoře (sever), pixel (i, j) ↔ S-JTSK x = x0 + (i + 0,5)·RES, y = y1top − (j + 0,5)·RES.
cache = os.path.join(ROOT, 'build/orto')
os.makedirs(cache, exist_ok=True)
ytop = y0 + ny * span
mosaic = Image.new('RGB', (nx * TILE, ny * TILE))
for ty in range(ny):
    for tx in range(nx):
        bx0, by1 = x0 + tx * span, ytop - ty * span
        path = os.path.join(cache, f'{name}_{tx}_{ty}.jpg')
        if not os.path.exists(path):
            q = f'{WMS}?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS=0&STYLES=&CRS=EPSG:5514&BBOX={bx0},{by1 - span},{bx0 + span},{by1}&WIDTH={TILE}&HEIGHT={TILE}&FORMAT=image/jpeg'
            req = urllib.request.Request(q, headers={'User-Agent': 'konecna-game-map/1.0'})
            data = urllib.request.urlopen(req, timeout=120).read()
            Image.open(io.BytesIO(data)).convert('RGB').save(path, quality=92)
            print('ortofoto', tx, ty, flush=True)
        mosaic.paste(Image.open(path).convert('RGB'), (tx * TILE, ty * TILE))
pix = np.asarray(mosaic)
print(f'mozaika {mosaic.size[0]} × {mosaic.size[1]} px', flush=True)

def classify(r, g, b):
    # prahy podle letního ortofota Prahy: tašky jsou vybledlé (sytost 0,2–0,35), plech a eternit skoro bez sytosti
    h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
    h *= 360
    red = h < 26 or h > 335
    if s > 0.12 and 70 <= h <= 210 and v > 0.25: return 'med'
    if red and (s >= 0.2 or (s >= 0.14 and v > 0.6)): return 'tasky'
    if s >= 0.14 and h < 50: return 'hneda'
    if v < 0.38: return 'tmava'
    if v > 0.64: return 'svetla'
    return 'plech'

out, counts = {}, {}
for wid, poly in polys.items():
    px = (poly[:, 0] - x0) / RES
    py = (ytop - poly[:, 1]) / RES
    i0, j0 = max(0, int(px.min()) - 2), max(0, int(py.min()) - 2)
    i1, j1 = min(pix.shape[1], int(px.max()) + 3), min(pix.shape[0], int(py.max()) + 3)
    if i1 - i0 < 6 or j1 - j0 < 6: continue
    mask = Image.new('L', (i1 - i0, j1 - j0), 0)
    ImageDraw.Draw(mask).polygon([(float(a - i0), float(b - j0)) for a, b in zip(px, py)], fill=255)
    small = mask.filter(ImageFilter.MinFilter(13))  # o 6 px = 1,5 m dovnitř
    m = np.asarray(small) > 0
    if m.sum() < 40: m = np.asarray(mask) > 0
    if m.sum() < 20: continue
    rgb = pix[j0:j1, i0:i1][m].astype(float)
    lum = rgb @ [0.299, 0.587, 0.114]
    lo, hi = np.percentile(lum, [20, 80])
    keep = rgb[(lum >= lo) & (lum <= hi)]
    if len(keep) < 10: keep = rgb
    r, g, b = (int(v) for v in np.median(keep, axis=0))
    k = classify(r, g, b)
    out[str(wid)] = [r, g, b, k]
    counts[k] = counts.get(k, 0) + 1

dst = os.path.join(ROOT, 'data', f'strechy-{name}.json')
with open(dst, 'w', encoding='utf8') as f:
    f.write('{"source":"ČÚZK ortofoto (CC BY 4.0)",\n' + ',\n'.join(f'"{k}":{json.dumps(v)}' for k, v in sorted(out.items(), key=lambda kv: int(kv[0]))) + '\n}\n')
print(f'{dst}: {len(out)} střech, {counts}')
mosaic.resize((mosaic.size[0] // 4, mosaic.size[1] // 4)).save(os.path.join(cache, f'{name}_nahled.jpg'), quality=85)
