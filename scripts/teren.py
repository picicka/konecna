# Výška terénu po dlaždicích z laserového skenování ČÚZK (DMP 1G, CC BY 4.0, body třídy 2 = terén).
# Pro každou dlaždici mapy vezme medián terénu uvnitř; dlaždice bez bodů (pod domy) dostanou hodnotu nejbližší
# změřené dlaždice. Zápis data/teren-<místo>.json: { base: nejnižší výška m n. m., rows: [[decimetry nad base]] }
# po řádcích a. Z ní scripts/osm.mjs pozná svahy (place.slope), např. Hradčanský kopec nad Malou Stranou.
# Listy build/dmp/*.laz stahuje scripts/vysky.py --stahnout.
# Spuštění: .venv/bin/python scripts/teren.py hrad
import glob, json, math, os, subprocess, sys
import numpy as np, laspy
from pyproj import Transformer

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
name = sys.argv[1] if len(sys.argv) > 1 else 'hrad'
place = json.loads(subprocess.run(['node', '-e', f"import('./scripts/places.mjs').then(m => console.log(JSON.stringify({{...m.PLACES['{name}'], TILE: m.TILE}})))"],
                                  cwd=ROOT, capture_output=True, text=True, check=True).stdout)
TILE = place['TILE']
lat0, lon0 = place['center']
theta = math.radians(90 - place['bearing'])
kx, ky = math.cos(math.radians(lat0)) * 111320, 110574

def project(lat, lon):
    x, y = (lon - lon0) * kx, (lat - lat0) * ky
    a = x * math.cos(theta) + y * math.sin(theta)
    left = -x * math.sin(theta) + y * math.cos(theta)
    return a / TILE + place['origin'][0], -left / TILE + place['origin'][1]

L, W = place['len'], place['wid']
T = Transformer.from_crs(5514, 4326, always_xy=True)
T_INV = Transformer.from_crs(4326, 5514, always_xy=True)
KEYS, ZS = [], []
for f in sorted(glob.glob(os.path.join(ROOT, 'build/dmp', '*.laz'))):
    l = laspy.read(f)
    m = np.asarray(l.classification) == 2
    x, y, z = np.asarray(l.x)[m], np.asarray(l.y)[m], np.asarray(l.z)[m]
    if not len(x): continue
    cx, cy = T_INV.transform(lon0, lat0)
    near = np.hypot(x - cx, y - cy) < (L + W) * TILE
    x, y, z = x[near], y[near], z[near]
    if not len(x): continue
    lon, lat = T.transform(x, y)
    a, b = project(lat, lon)
    ia, ib = np.floor(a).astype(int), np.floor(b).astype(int)
    ok = (ia >= 0) & (ia < L) & (ib >= 0) & (ib < W)
    KEYS.append(ia[ok] * W + ib[ok]); ZS.append(z[ok])

H = np.full((L, W), np.nan)
key, zs = np.concatenate(KEYS), np.concatenate(ZS)
order = np.argsort(key); key, zs = key[order], zs[order]
u, st = np.unique(key, return_index=True)
for k, part in zip(u, np.split(zs, st[1:])):
    if len(part) >= 3: H[k // W, k % W] = float(np.median(part))
known = np.argwhere(~np.isnan(H))
if not len(known): sys.exit('žádné body terénu, stáhni listy: .venv/bin/python scripts/vysky.py ' + name + ' --stahnout')
for i, j in np.argwhere(np.isnan(H)):
    d = np.abs(known[:, 0] - i) + np.abs(known[:, 1] - j)
    near = known[d == d.min()]
    H[i, j] = float(np.median([H[p, q] for p, q in near]))
base = math.floor(float(H.min()))
dst = os.path.join(ROOT, 'data', f'teren-{name}.json')
with open(dst, 'w', encoding='utf8') as f:
    f.write('{"source":"ČÚZK DMP 1G (CC BY 4.0)","base":%d,"rows":[\n' % base)
    f.write(',\n'.join(json.dumps([int(round((h - base) * 10)) for h in row]) for row in H) + '\n]}\n')
print(f'{dst}: {L} × {W} dlaždic, terén {base}–{H.max():.1f} m n. m., bez bodů {int(np.isnan(H).sum())}')
