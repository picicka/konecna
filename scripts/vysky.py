# Výšky domů z laserového skenování ČÚZK (DMP 1G, CC BY 4.0), postup převzatý z izomapy (dmp_vysky.py).
# Pro každou budovu z data/osm/<místo>*.json vezme body třídy 6 (budova) uvnitř půdorysu a body třídy 2 (terén)
# v pásu 1–14 m kolem něj (v uzavřeném bloku nejbližší body terénu); výška = bod střechy minus medián terénu.
# Výsledek data/vysky-<místo>.json, výšky v metrech nad terénem, jen u spolehlivých měření:
#   buildings: { osm id: [plocha m², bodů, p10, medián, p90] }
#   grid: mřížka po CELL metrech v zeměpisných souřadnicích (lat0/lon0 = jihozápadní roh, dlat/dlon = krok),
#         rows od jihu, buňka = jeden znak, (kód znaku − 48) = medián výšky střechy v půlmetrech („0“ = není dům, max. 39 m). Z ní scripts/osm.mjs bere výšku
#         každého kvádru zvlášť, protože jeden půdorys v OSM mívá části různé výšky.
# Listy (build/dmp/*.laz) stáhne: python scripts/vysky.py <místo> --stahnout
# Spuštění: .venv/bin/python scripts/vysky.py hlavak   (prostředí: python3 -m venv .venv && .venv/bin/pip install "laspy[lazrs]" numpy pyproj)
import glob, json, os, re, subprocess, sys
import numpy as np, laspy
from pyproj import Transformer

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
name = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith('-') else 'hlavak'
T = Transformer.from_crs(4326, 5514, always_xy=True)

elements = []
for f in sorted(glob.glob(os.path.join(ROOT, 'data/osm', f'{name}*.json'))):
    elements += json.load(open(f, encoding='utf8'))['elements']
nodes = {e['id']: e for e in elements if e['type'] == 'node'}
ways = {e['id']: e for e in elements if e['type'] == 'way' and 'building' in e.get('tags', {})}
polys = {}
for wid, w in ways.items():
    pts = [nodes[n] for n in w['nodes'] if n in nodes]
    if len(pts) < 4: continue
    x, y = T.transform([p['lon'] for p in pts], [p['lat'] for p in pts])
    polys[wid] = np.column_stack([x, y])

dmp = os.path.join(ROOT, 'build/dmp')
if '--stahnout' in sys.argv:
    os.makedirs(dmp, exist_ok=True)
    atom = os.path.join(dmp, 'atom.xml')
    if not os.path.exists(atom): subprocess.run(['curl', '-sL', '-m', '300', '-o', atom, 'https://atom.cuzk.gov.cz/DMP1G-SJTSK/DMP1G-SJTSK.xml'], check=True)
    lat = [n['lat'] for n in nodes.values()]; lon = [n['lon'] for n in nodes.values()]
    for e in open(atom, encoding='utf8').read().split('<entry>')[1:]:
        p = re.search(r'<georss:polygon>(.*?)<', e); k = re.search(r'DMP1G-SJTSK_([A-Z0-9]+)\.xml', e)
        if not (p and k): continue
        v = list(map(float, p.group(1).split())); la, lo = v[0::2], v[1::2]
        if min(la) > max(lat) or max(la) < min(lat) or min(lo) > max(lon) or max(lo) < min(lon): continue
        n = k.group(1)
        if os.path.exists(os.path.join(dmp, f'{n}.laz')): continue
        print('stahuji', n, flush=True)
        z = os.path.join(dmp, f'{n}.zip')
        subprocess.run(['curl', '-sL', '-m', '600', '-o', z, f'https://openzu.cuzk.cz/opendata/DMP1G/epsg-5514/{n}.zip'], check=True)
        subprocess.run(['unzip', '-oq', z, '-d', dmp], check=True); os.remove(z)

X, Y, Z, C = [], [], [], []
allp = np.vstack(list(polys.values()))
x0, y0 = allp.min(0) - 20; x1, y1 = allp.max(0) + 20
for f in sorted(glob.glob(os.path.join(dmp, '*.laz'))):
    l = laspy.read(f)
    x, y = np.asarray(l.x), np.asarray(l.y)
    m = (x > x0) & (x < x1) & (y > y0) & (y < y1)
    X.append(x[m]); Y.append(y[m]); Z.append(np.asarray(l.z)[m]); C.append(np.asarray(l.classification)[m])
X, Y, Z, C = map(np.concatenate, (X, Y, Z, C))
print(len(X), 'bodů ve výřezu', flush=True)
G = np.column_stack([X, Y, Z])[C == 2]

def inside(poly, px, py):
    hit = np.zeros(len(px), bool)
    xs, ys = poly[:, 0], poly[:, 1]
    for i in range(len(poly) - 1):
        xa, ya, xb, yb = xs[i], ys[i], xs[i + 1], ys[i + 1]
        cross = (ya > py) != (yb > py)
        with np.errstate(divide='ignore', invalid='ignore'):
            xi = (xb - xa) * (py - ya) / (yb - ya) + xa
        hit ^= cross & (px < xi)
    return hit

def dist_to_poly(poly, px, py):
    d = np.full(len(px), np.inf)
    for i in range(len(poly) - 1):
        a, b = poly[i], poly[i + 1]
        ab = b - a; L = max(ab @ ab, 1e-9)
        t = np.clip(((px - a[0]) * ab[0] + (py - a[1]) * ab[1]) / L, 0, 1)
        d = np.minimum(d, np.hypot(px - a[0] - t * ab[0], py - a[1] - t * ab[1]))
    return d

out, bad = {}, []
RX, RY, RH = [], [], []
for wid, poly in polys.items():
    xa, ya = poly.min(0) - 14; xb, yb = poly.max(0) + 14
    m = (X > xa) & (X < xb) & (Y > ya) & (Y < yb)
    if not m.any(): continue
    px, py, pz, pc = X[m], Y[m], Z[m], C[m]
    inn = inside(poly, px, py)
    roof = pz[inn & (pc == 6)]
    ring = ~inn & (pc == 2)
    ring[ring] = dist_to_poly(poly, px[ring], py[ring]) >= 1
    ground = pz[ring]
    if len(ground) < 8:
        # uzavřený blok bez terénu kolem: nejbližších 40 bodů terénu kdekoli ve výřezu
        gm = (G[:, 0] > xa - 60) & (G[:, 0] < xb + 60) & (G[:, 1] > ya - 60) & (G[:, 1] < yb + 60)
        gg = G[gm]
        if len(gg) >= 8:
            d = dist_to_poly(poly, gg[:, 0], gg[:, 1])
            ground = gg[np.argsort(d)[:40], 2]
    area = 0.5 * abs(np.dot(poly[:-1, 0], poly[1:, 1]) - np.dot(poly[1:, 0], poly[:-1, 1]))
    if area > 50000 or len(roof) < max(3, area * 0.15) or len(ground) < 3:
        bad.append((wid, 'málo bodů', round(area), len(roof), len(ground))); continue
    g = float(np.median(ground))
    p10, med, p90 = (round(float(np.percentile(roof, q)) - g, 1) for q in (10, 50, 90))
    if med < 2 or med > 80:
        bad.append((wid, 'nesmyslná výška', round(area), med)); continue
    out[str(wid)] = [round(area), len(roof), p10, med, p90]
    sel = inn & (pc == 6)
    RX.append(px[sel]); RY.append(py[sel]); RH.append(pz[sel] - g)

CELL = 2.0
lon, lat = Transformer.from_crs(5514, 4326, always_xy=True).transform(np.concatenate(RX), np.concatenate(RY))
RH = np.concatenate(RH)
lat0, lon0 = float(lat.min()), float(lon.min())
dlat = CELL / 110574; dlon = CELL / (111320 * np.cos(np.radians(lat0)))
gi = ((lat - lat0) / dlat).astype(int); gj = ((lon - lon0) / dlon).astype(int)
H, W = gi.max() + 1, gj.max() + 1
grid = np.zeros((H, W), int)
key = gi * W + gj; order = np.argsort(key); key, hs = key[order], RH[order]
u, st = np.unique(key, return_index=True)
for k, part in zip(u, np.split(hs, st[1:])):
    v = float(np.median(part))
    if v >= 2: grid[k // W, k % W] = min(78, round(v * 2))

dst = os.path.join(ROOT, 'data', f'vysky-{name}.json')
with open(dst, 'w', encoding='utf8') as f:
    f.write('{"source":"ČÚZK DMP 1G (CC BY 4.0)","cell":%g,"lat0":%.7f,"lon0":%.7f,"dlat":%.9f,"dlon":%.9f,\n"buildings":{\n' % (CELL, lat0, lon0, dlat, dlon))
    f.write(',\n'.join(f'"{k}":{json.dumps(v)}' for k, v in sorted(out.items(), key=lambda kv: int(kv[0]))))
    f.write('\n},\n"grid":[\n' + ',\n'.join(json.dumps(''.join(chr(48 + int(c)) for c in r)) for r in grid) + '\n]}\n')
print(f'{dst}: změřeno {len(out)} z {len(polys)} budov, bez měření {len(bad)}')
for b in bad[:20]: print('  ', *b)
