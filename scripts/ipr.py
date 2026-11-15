# Domy ze skutečné geometrie: 3D model budov IPR Praha (otevřená data, CC BY 4.0, „data base © IPR Praha“),
# fotogrammetrický model se střechami, vikýři a komíny po mapových listech 1:5000 (3D shapefile, S-JTSK).
# Skript vezme kvádry domů z data/<místo>.json (scripts/osm.mjs: půdorys, průchodnost, hloubka a stíny zůstávají)
# a pro každý kvádr vykreslí sprite ze skutečných ploch modelu v isometrii hry (dlaždice 128 × 64, patro 44 px):
#   - dům modelu se bere, když jeho půdorys leží na dlaždicích domů; kreslí se jen část nad dlaždicemi kvádru a pruh
#     do půl dlaždice kolem, kde půdorys končí (skutečná fasáda nestojí přesně na hraně dlaždice). Kde dům pokračuje
#     dál do zbořeného vnitrobloku, uřízne se na hraně dlaždice a řez zakryje slepá cihlová zeď (štít),
#   - barvy jen z palety hry (art/palette.px.js): omítka podle stylu domu (STYLES z art/buildings.px.js), krytina
#     z ortofota (data/strechy-<místo>.json přes půdorysy OSM), každý dům má vlastní členění fasády a míru sešlosti,
#   - fasáda je pixelová kresba v rovině stěny (sloupec textury = sloupec obrazovky): parter, římsy, okna po patrech,
#     okenice, zatlučená a vybitá okna, saze, šmouhy pod římsou, opadaná omítka s cihlou, tagy sprejem z docs/todo.md,
#   - výstup: listy static/images/domy_<místo>_<n>.png/.json a data/domy-<místo>.json (klíč, list, kotva a výška
#     spritu ke každému kvádru). Hra je použije místo houses_<místo>_<n>, když soubor existuje (src/map.js).
# Listy modelu (build/ipr, necommituje se) stáhne: .venv/bin/python scripts/ipr.py <místo> --stahnout
# Spuštění: .venv/bin/python scripts/ipr.py staromak   (prostředí jako scripts/vysky.py: numpy, pyproj, pillow)
import glob, json, math, os, re, struct, subprocess, sys, unicodedata, zipfile
import numpy as np
from pyproj import Transformer
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
name = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith('-') else 'staromak'
IPR = os.path.join(ROOT, 'build/ipr')
place = json.loads(subprocess.run(['node', '-e', f"import('./scripts/places.mjs').then(m => console.log(JSON.stringify({{...m.PLACES['{name}'], tile: m.TILE}})))"], cwd=ROOT, capture_output=True, text=True, check=True).stdout)
data = json.load(open(os.path.join(ROOT, f'data/{name}.json'), encoding='utf8'))
TILE = place['tile']; LEN, WID = place['len'], place['wid']
lat0, lon0 = place['center']; OA, OB = place['origin']
rad = math.pi / 180; th = (90 - place['bearing']) * rad
kx = math.cos(lat0 * rad) * 111320; ky = 110574
T = Transformer.from_crs(5514, 4326, always_xy=True)
Ti = Transformer.from_crs(4326, 5514, always_xy=True)


def ll2m(lon, lat):
    """Zeměpisné souřadnice → metry v osách mapy (a podél, b napříč), počátek v rohu dlaždice (0, 0)."""
    X = (np.asarray(lon) - lon0) * kx; Y = (np.asarray(lat) - lat0) * ky
    a = X * math.cos(th) + Y * math.sin(th); left = -X * math.sin(th) + Y * math.cos(th)
    return a + OA * TILE, -left + OB * TILE


def m2ll(a, b):
    am = a - OA * TILE; left = -(b - OB * TILE)
    x = am * math.cos(th) - left * math.sin(th); y = am * math.sin(th) + left * math.cos(th)
    return lon0 + x / kx, lat0 + y / ky


# ---------------------------------------------------------------- stažení listů
def sheets():
    """Mapové listy 1:5000, které protínají mapu místa (klad IPR), jako názvy souborů BD3_<list>."""
    cache = os.path.join(IPR, f'listy-{name}.json')
    if os.path.exists(cache): return json.load(open(cache))
    pts = [m2ll(a * TILE, b * TILE) for a in (-2, LEN + 2) for b in (-2, WID + 2)]
    lon = [p[0] for p in pts]; lat = [p[1] for p in pts]
    q = f'geometry={min(lon)},{min(lat)},{max(lon)},{max(lat)}&geometryType=esriGeometryEnvelope&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=nml&returnGeometry=false&f=json'
    out = subprocess.run(['curl', '-sL', '--compressed', '-m', '60', f'https://mp.iprpraha.cz/arcgis/rest/services/Hosted/MAP_CUR_MAP_ML_5000_P/FeatureServer/0/query?{q}'], capture_output=True, text=True, check=True).stdout
    names = sorted(f['attributes']['nml'] for f in json.loads(out)['features'])
    os.makedirs(IPR, exist_ok=True); json.dump(names, open(cache, 'w'))
    return names


def download():
    os.makedirs(IPR, exist_ok=True)
    feed = os.path.join(IPR, 'dcat.json')
    if not os.path.exists(feed): subprocess.run(['curl', '-sL', '--compressed', '-m', '300', '-o', feed, 'https://opendata.geoportalpraha.cz/api/feed/dcat-ap/2.1.1.json'], check=True)
    ds = next(x for x in json.load(open(feed, encoding='utf8'))['dcat:dataset'] if isinstance(x.get('dct:title'), str) and x['dct:title'].startswith('Budovy 3D'))
    urls = {d['dct:title']: d['dcat:accessURL']['@id'] for d in ds['dcat:distribution'] if isinstance(d.get('dct:title'), str)}
    for nml in sheets():
        word, num = nml.split(' ')
        key = f'BD3_{word[:4]}_{num}_shp'; dst = os.path.join(IPR, key)
        if glob.glob(os.path.join(dst, '*.shp')): continue
        if key not in urls: print('list', nml, 'v katalogu není'); continue
        print('stahuji', key, flush=True)
        z = dst + '.zip'
        subprocess.run(['curl', '-sL', '-m', '900', '-o', z, urls[key]], check=True)
        os.makedirs(dst, exist_ok=True)
        with zipfile.ZipFile(z) as f: f.extractall(dst)
        os.remove(z)


if '--stahnout' in sys.argv: download()

# ---------------------------------------------------------------- paleta a styly hry
PAL = {k: tuple(int(v[i:i + 2], 16) for i in (1, 3, 5)) for k, v in re.findall(r'"?(\w)"?: "(#[0-9a-f]{6})"', open(os.path.join(ROOT, 'art/palette.px.js'), encoding='utf8').read())}
LUT = np.zeros((256, 4), np.uint8)
for k, c in PAL.items(): LUT[ord(k)] = (*c, 255)
src_b = open(os.path.join(ROOT, 'art/buildings.px.js'), encoding='utf8').read()
STYLES = {k: v.replace('"', '').replace(',', '').replace(' ', '') for k, v in re.findall(r'(\w+): \[("\w", "\w", "\w")\]', src_b[src_b.index('const STYLES'):src_b.index('// Bod na pravé stěně')])}
FONT57 = dict(re.findall(r'(?:"(.)"|(\w)): "([01]{35})"', src_b[src_b.index('const FONT57'):src_b.index('// Tag sprejem')]) and [(a or b, g) for a, b, g in re.findall(r'(?:"(.)"|(\w)): "([01]{35})"', src_b[src_b.index('const FONT57'):src_b.index('// Tag sprejem')])])
MARKS57 = {'́': [(2, 1), (3, 2)], '̌': [(1, 2), (2, 1), (3, 2)], '̊': [(2, 1), (1, 2), (3, 2), (2, 3)]}
PICK = ['ochre', 'ochre', 'cream', 'cream', 'yellow', 'grey', 'green', 'salmon', 'salmon', 'pink', 'white', 'travertine', 'ochre', 'cream', 'brown', 'grey']
COVERS = {'tasky': 'dDx', 'hneda': 'rRx', 'med': 'jQx', 'tmava': 'sSa', 'plech': 'mMM', 'svetla': 'wvv'}
COVER_LIGHT = {'d': 'r', 'r': '8', 'j': '2', 's': 'M', 'm': 'v', 'w': 'W'}
FLAT_DARK = {'x': 'P', 'a': 'A', 'M': 'S', 'v': 'x'}
TAG_COLORS = ['E', '7', 'y', 'l', 'W']
TAG_TOP = 76


def tags_list():
    md = open(os.path.join(ROOT, 'docs/todo.md'), encoding='utf8').read()
    s = md.find('## Tagy na domech')
    if s < 0: return []
    e = md.find('\n## ', s + 5)
    out = []
    for l in md[s:e if e >= 0 else None].split('\n'):
        if not re.match(r'^\s*-\s', l): continue
        t = re.sub(r'[„“"]', '', re.sub(r'^\s*-\s*', '', l)).strip()
        if t: out.append(t)
    return out


TAGS = tags_list()

# ---------------------------------------------------------------- plochy modelu
PXM = 44 / 3.8          # px na metr výšky (patro 44 px jako house())
SP = 64 / TILE          # px na metr půdorysu ve směru x obrazovky na jednotku (a + b)
CAM = 2 * (SP / 2) / PXM  # o kolik metrů výšky se posune bod o metr k divákovi: hloubka = b − a + CAM·z


def read_faces():
    cx, cy = Ti.transform(*m2ll(LEN * TILE / 2, WID * TILE / 2)); R = (LEN + WID) * TILE
    faces = []
    for shp in sorted(glob.glob(os.path.join(IPR, 'BD3_*_shp', '*.shp'))):
        dbf = open(shp[:-4] + '.dbf', 'rb')
        h = dbf.read(32); n, hl, rl = struct.unpack('<IHH', h[4:12])
        fields = []; off = 1
        while True:
            f = dbf.read(32)
            if f[0] == 0x0d: break
            fields.append((f[:11].split(b'\0')[0].decode(), off, f[16])); off += f[16]
        fo = {k: (o, l) for k, o, l in fields}
        dbf.seek(hl); rows = dbf.read(n * rl)
        d = open(shp, 'rb').read(); pos = 100; i = 0
        while pos < len(d):
            _, clen = struct.unpack('>ii', d[pos:pos + 8]); body = d[pos + 8:pos + 8 + clen * 2]; pos += 8 + clen * 2
            row = rows[i * rl:(i + 1) * rl]; i += 1
            if struct.unpack('<i', body[:4])[0] != 15: continue
            bx0, by0, bx1, by1 = struct.unpack('<4d', body[4:36])
            if bx1 < cx - R or bx0 > cx + R or by1 < cy - R or by0 > cy + R: continue
            npart, npt = struct.unpack('<ii', body[36:44])
            parts = list(struct.unpack(f'<{npart}i', body[44:44 + 4 * npart])) + [npt]
            o = 44 + 4 * npart
            xy = np.frombuffer(body, '<f8', npt * 2, o).reshape(-1, 2); o += npt * 16 + 16
            z = np.frombuffer(body, '<f8', npt, o)
            lon, lat = T.transform(xy[:, 0], xy[:, 1]); a, b = ll2m(lon, lat)
            typ = row[fo['TYP'][0]:fo['TYP'][0] + fo['TYP'][1]].decode('cp1250', 'replace').strip()
            bid = int(row[fo['ID_BUD'][0]:fo['ID_BUD'][0] + fo['ID_BUD'][1]].decode().strip() or 0)
            for p in range(npart):
                s, e = parts[p], parts[p + 1]
                if e - s < 3: continue
                P = np.column_stack([a[s:e], b[s:e], z[s:e]])
                if np.allclose(P[0], P[-1]): P = P[:-1]
                if len(P) >= 3 and -40 < P[:, 0].mean() < LEN * TILE + 40 and -40 < P[:, 1].mean() < WID * TILE + 40: faces.append([typ, bid, P])
    return faces


def normal(P):
    n = np.zeros(3)
    for k in range(1, len(P) - 1): n += np.cross(P[k] - P[0], P[k + 1] - P[0])
    L = np.linalg.norm(n)
    return n / L if L > 1e-7 else None


faces = read_faces()
if not faces: sys.exit(f'{name}: v build/ipr nejsou listy modelu, spusť se --stahnout')
print(f'{name}: {len(faces)} ploch modelu', flush=True)

# pata domu a posun výšek na zem mapy (z = 0 u paty)
B = {}
for typ, bid, P in faces:
    q = B.setdefault(bid, {'deska': [], 'zmin': 1e9, 'zmax': -1e9})
    q['zmin'] = min(q['zmin'], P[:, 2].min()); q['zmax'] = max(q['zmax'], P[:, 2].max())
    if typ == 'Zakladova deska': q['deska'].append(P)
for q in B.values():
    q['base'] = min(p[:, 2].min() for p in q['deska']) if q['deska'] else q['zmin']
for f in faces: f[2] = f[2] - [0, 0, B[f[1]]['base']]

# ---------------------------------------------------------------- půdorysný rastr
EXTRAS = place.get('model', [])   # stavby z modelu jako landmarky: kvádry navíc, i za okrajem mapy
CELL = 0.25; MARG = 30.0 + TILE * max([0] + [max(-e['a0'], -e['b0'], e['a0'] + e['w'] - LEN, e['b0'] + e['dpt'] - WID) for e in EXTRAS])
NA = int((LEN * TILE + 2 * MARG) / CELL); NB = int((WID * TILE + 2 * MARG) / CELL)
ca = lambda a: (np.asarray(a) + MARG) / CELL
ids = sorted(B); idx = {bid: i for i, bid in enumerate(ids)}
fimg = Image.new('I', (NB, NA), 0); fd = ImageDraw.Draw(fimg)
for bid in ids:
    for P in B[bid]['deska']: fd.polygon([(float(ca(p[1])), float(ca(p[0]))) for p in P], fill=idx[bid] + 1)
Fb = np.array(fimg, np.int32) - 1                       # index domu v buňce půdorysu, −1 nic
Hroof = np.full((NA, NB), -1.0, np.float32)             # výška střechy nad patou domu
for typ, bid, P in faces:
    if typ == 'Zakladova deska': continue
    n = normal(P)
    if n is None or abs(n[2]) < 0.25: continue
    a0, a1 = int(math.floor(ca(P[:, 0].min()))), int(math.ceil(ca(P[:, 0].max()))) + 1
    b0, b1 = int(math.floor(ca(P[:, 1].min()))), int(math.ceil(ca(P[:, 1].max()))) + 1
    if a0 < 0 or b0 < 0 or a1 > NA or b1 > NB: continue
    m = Image.new('L', (b1 - b0, a1 - a0), 0); ImageDraw.Draw(m).polygon([(float(ca(p[1])) - b0, float(ca(p[0])) - a0) for p in P], fill=1)
    m = np.array(m, bool)
    if not m.any(): continue
    aa, bb = np.mgrid[a0:a1, b0:b1]
    zz = P[0, 2] - (n[0] * ((aa + 0.5) * CELL - MARG - P[0, 0]) + n[1] * ((bb + 0.5) * CELL - MARG - P[0, 1])) / n[2]
    sub = Hroof[a0:a1, b0:b1]; sub[m] = np.maximum(sub[m], zz[m])
Fany = Fb >= 0

# kvádry hry: přesné dlaždice a pruh kolem
NH = len(data['houses'])
boxes = data['houses'] + [{**e, 'floors': 5, 'osm': e['key'], 'key': 'model_' + e['key']} for e in EXTRAS]
TC = int(round(TILE / CELL)); M0 = int(MARG / CELL)
Tbox = np.full((NA, NB), -1, np.int32)
for i, h in enumerate(boxes): Tbox[M0 + h['a0'] * TC:M0 + (h['a0'] + h['w']) * TC, M0 + h['b0'] * TC:M0 + (h['b0'] + h['dpt']) * TC] = i
Lmask = np.zeros((NA, NB), bool)
for a in range(LEN):
    for b in range(WID):
        if data['ground'][a][b] == 'L': Lmask[M0 + a * TC:M0 + (a + 1) * TC, M0 + b * TC:M0 + (b + 1) * TC] = True
for e in EXTRAS: Lmask[M0 + e['a0'] * TC:M0 + (e['a0'] + e['w']) * TC, M0 + e['b0'] * TC:M0 + (e['b0'] + e['dpt']) * TC] = False
# dům modelu patří do hry, když leží aspoň 12 m² na dlaždicích domů a víc než na půdorysech landmarků
cnt = np.bincount(Fb[(Tbox >= 0) & Fany], minlength=len(ids))
cntL = np.bincount(Fb[Lmask & Fany], minlength=len(ids))
selected = (cnt * CELL * CELL >= 12) & (cnt > cntL)   # dům pod ručně kresleným landmarkem (L) se nebere
DC = TC // 2  # pruh půl dlaždice
deep = Fany.copy()
for _ in range(DC):  # buňky dál než pruh od okraje zástavby (čtvercová eroze)
    e = deep.copy(); e[1:] &= deep[:-1]; e[:-1] &= deep[1:]; e[:, 1:] &= deep[:, :-1]; e[:, :-1] &= deep[:, 1:]
    e[1:, 1:] &= deep[:-1, :-1]; e[:-1, :-1] &= deep[1:, 1:]; e[1:, :-1] &= deep[:-1, 1:]; e[:-1, 1:] &= deep[1:, :-1]; deep = e
K = Tbox.copy()
for i, h in enumerate(boxes):
    A0, A1 = M0 + h['a0'] * TC, M0 + (h['a0'] + h['w']) * TC; B0, B1 = M0 + h['b0'] * TC, M0 + (h['b0'] + h['dpt']) * TC

    def band(sl, axis, rev):
        """Pruh za hranou kvádru: sloupec půdorysu se nechá, jen když zástavba v pruhu skončí (jinak řez na hraně)."""
        S = Fany[sl]
        if rev: S = np.flip(S, axis)
        S = np.moveaxis(S, axis, 1)
        ends = ~S.all(axis=1)
        keep = np.cumprod(S[:, :DC], axis=1).astype(bool) & ends[:, None]
        keep = np.moveaxis(keep, 1, axis)
        if rev: keep = np.flip(keep, axis)
        return keep

    for sl, sl2, axis, rev in [
        ((slice(A0, A1), slice(B1, B1 + DC + 1)), (slice(A0, A1), slice(B1, B1 + DC)), 1, False),
        ((slice(A0, A1), slice(B0 - DC - 1, B0)), (slice(A0, A1), slice(B0 - DC, B0)), 1, True),
        ((slice(A1, A1 + DC + 1), slice(B0, B1)), (slice(A1, A1 + DC), slice(B0, B1)), 0, False),
        ((slice(A0 - DC - 1, A0), slice(B0, B1)), (slice(A0 - DC, A0), slice(B0, B1)), 0, True),
    ]:
        keep = band(sl, axis, rev)
        sub = K[sl2]; free = (sub < 0) & ~Lmask[sl2] & keep
        sub[free] = i
    for sl in [(slice(A0 - DC, A0), slice(B0 - DC, B0)), (slice(A0 - DC, A0), slice(B1, B1 + DC)), (slice(A1, A1 + DC), slice(B0 - DC, B0)), (slice(A1, A1 + DC), slice(B1, B1 + DC))]:
        sub = K[sl]; free = (sub < 0) & ~Lmask[sl] & Fany[sl] & ~deep[sl]
        sub[free] = i
K[Lmask] = -1
sel_cell = Fany & selected[np.clip(Fb, 0, None)]
# dům ve svahu: model má patu u nejnižšího bodu základů, takže z ulice nad ním by byl o patra vyšší než ve skutečnosti.
# Výška kvádru (eave z laseru ČÚZK nad terénem u domu, jinak z pater) říká, kolik má být vidět; o zbytek se dům zapustí do země
# a co je pod zemí, se nekreslí.
SINK = {}
if name in ('hrad', 'malastrana'):  # jen místa ve svahu; na rovině by to zkracovalo vysoké střechy kostelů
    Ebox = np.array([h.get('eave') or h['floors'] * 3.8 + 4.5 for h in boxes], np.float32)
    for bi in np.nonzero(selected)[0]:
        m = (Fb == bi) & (Tbox >= 0) & (Hroof > 0)
        if m.sum() < 48: continue
        e = Ebox[Tbox[m]]; e = e[e > 0]
        if not len(e): continue
        over = float(np.median(Hroof[m])) - (float(np.median(e)) + 3.0)
        if over > 4.0: SINK[ids[bi]] = over
    for f in faces:
        if f[1] in SINK: f[2] = f[2] - [0, 0, SINK[f[1]]]
    for bid, d in SINK.items():
        m = Fb == idx[bid]; Hroof[m] = np.where(Hroof[m] > 0, np.maximum(Hroof[m] - d, 0.5), Hroof[m])
        B[bid]['base'] += d
    print('domů zapuštěných do svahu', len(SINK), sorted(round(v) for v in SINK.values()), flush=True)
Rr = (K >= 0) & sel_cell                                 # co se z půdorysů kreslí
print(f'domů modelu {len(ids)}, z toho ve hře {int(selected.sum())}; kvádrů {len(boxes)}', flush=True)

# slepé zdi na řezech: hrana vykreslené buňky, za kterou zástavba pokračuje, směrem k divákovi (+b a −a)
Hfill = Hroof.copy()
for _ in range(3):
    e = Hfill.copy()
    e[1:] = np.maximum(e[1:], Hfill[:-1]); e[:-1] = np.maximum(e[:-1], Hfill[1:]); e[:, 1:] = np.maximum(e[:, 1:], Hfill[:, :-1]); e[:, :-1] = np.maximum(e[:, :-1], Hfill[:, 1:])
    Hfill = np.where(Hfill < 0, e, Hfill)
caps = 0


def cap_runs(edge, along, make):
    """Souvislé úseky hrany řezu → jedna svislá plocha s horní hranou podle výšky střechy."""
    global caps
    for j in np.unique(np.nonzero(edge)[1 - along]):
        line = edge[j] if along == 1 else edge[:, j]
        hs = Hfill[j] if along == 1 else Hfill[:, j]
        bd = Fb[j] if along == 1 else Fb[:, j]
        kk = K[j] if along == 1 else K[:, j]
        i = 0; n = len(line)
        while i < n:
            if not line[i]: i += 1; continue
            s = i
            while i < n and line[i] and bd[i] == bd[s] and kk[i] == kk[s]: i += 1
            top = [max(1.0, float(hs[t])) for t in range(s, i)]
            if i - s < 2: continue
            faces.append(['Rez', ids[bd[s]], make(j, s, i, top)]); caps += 1


eb = np.zeros_like(Rr); eb[:, :-1] = Rr[:, :-1] & Fany[:, 1:] & ~Rr[:, 1:]
ea = np.zeros_like(Rr); ea[1:] = Rr[1:] & Fany[:-1] & ~Rr[:-1]
mm = lambda c: c * CELL - MARG


def cap_b(j, s, e, top):  # řez k +b v řádku a = j..: běží podél a? ne: hrana b = (sloupec + 1), úsek podél a
    raise NotImplementedError


# hrana k +b: buňky (a = s..e, b = j), stěna v rovině b = (j + 1)·CELL, běží podél a
def make_b(j, s, e, top):
    b = mm(j + 1)
    pts = [(mm(s), b, 0.0), (mm(e), b, 0.0)]
    for t in range(e - 1, s - 1, -1): pts += [(mm(t + 1), b, top[t - s]), (mm(t), b, top[t - s])]
    return np.array(pts)


# hrana k −a: buňky (a = j, b = s..e), stěna v rovině a = j·CELL, běží podél b
def make_a(j, s, e, top):
    a = mm(j)
    pts = [(a, mm(s), 0.0), (a, mm(e), 0.0)]
    for t in range(e - 1, s - 1, -1): pts += [(a, mm(t + 1), top[t - s]), (a, mm(t), top[t - s])]
    return np.array(pts)


cap_runs(eb, 0, make_b)   # pro každý sloupec b = j úseky podél a
cap_runs(ea, 1, make_a)   # pro každý řádek a = j úseky podél b
print('slepých zdí na řezech', caps, flush=True)

# ---------------------------------------------------------------- krytina a vlastnosti domů
roofs_file = os.path.join(ROOT, f'data/strechy-{name}.json')
roofs = json.load(open(roofs_file, encoding='utf8')) if os.path.exists(roofs_file) else {}
polys = []
for f in sorted(glob.glob(os.path.join(ROOT, 'data/osm', f'{name}*.json'))):
    el = json.load(open(f, encoding='utf8'))['elements']
    nodes = {e['id']: e for e in el if e['type'] == 'node'}
    for e in el:
        if e['type'] == 'way' and 'building' in e.get('tags', {}) and str(e['id']) in roofs:
            pts = [nodes[n] for n in e['nodes'] if n in nodes]
            if len(pts) >= 4:
                a, b = ll2m([p['lon'] for p in pts], [p['lat'] for p in pts])
                polys.append((np.column_stack([a, b]), roofs[str(e['id'])][3]))


def inside(pt, poly):
    x, y = pt; c = False; n = len(poly)
    for k in range(n):
        x1, y1 = poly[k]; x2, y2 = poly[(k + 1) % n]
        if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1: c = not c
    return c


def rng_of(*seed):
    return np.random.RandomState(abs(hash(tuple(int(s) for s in seed))) % (2 ** 31))


for bid, q in B.items():
    q['sel'] = bool(selected[idx[bid]])
    if not q['sel']: continue
    c = np.vstack([p[:, :2] for p in q['deska']]).mean(0) if q['deska'] else None
    q['cover'] = None
    if c is not None:
        for poly, cov in polys:
            if poly[:, 0].min() <= c[0] <= poly[:, 0].max() and poly[:, 1].min() <= c[1] <= poly[:, 1].max() and inside(c, poly): q['cover'] = cov if cov in COVERS else None; break
    r = rng_of(bid, 1)
    q['style'] = PICK[r.randint(len(PICK))]
    q['age'] = float(r.rand())                      # sešlost 0–1
    q['cw'] = 2.5 + 0.9 * r.rand()                  # osová vzdálenost oken v metrech
    q['win'] = r.choice(['plain', 'lintel', 'lintel', 'arch', 'frame'])
    q['cordon'] = r.rand() < 0.45
    q['parter'] = r.choice(['stone', 'stone', 'plain', 'arcade'])
    q['shutters'] = r.rand() < 0.3
    q['quoins'] = r.rand() < 0.35
    q['seed'] = int(r.randint(1 << 30))

# ---------------------------------------------------------------- stěny do skupin (jedna rovina fasády = jedna kresba)
VIEW = np.array([-1.0, 1.0]) / math.sqrt(2)
groups = {}
for fi, (typ, bid, P) in enumerate(faces):
    if typ not in ('Stena', 'Rez') or not B[bid].get('sel'): continue
    n = normal(P)
    if n is None or abs(n[2]) > 0.25: continue
    nh = n[:2] / np.linalg.norm(n[:2])
    if nh @ VIEW < 0: nh = -nh
    if nh @ VIEW < 0.04: continue
    ang = math.atan2(nh[1], nh[0]); off = float(P[:, :2].mean(0) @ nh)
    key = (bid, typ == 'Rez', round(ang / 0.07), round(off / 0.3))
    groups.setdefault(key, []).append(fi)

GROUPS = []
face_group = {}
for key in sorted(groups):
    fl = groups[key]; bid, cap = key[0], key[1]
    nh = np.zeros(2)
    for fi in fl:
        n = normal(faces[fi][2]); v = n[:2] / np.linalg.norm(n[:2])
        nh += v if v @ VIEW > 0 else -v
    nh /= np.linalg.norm(nh)
    hd = np.array([-nh[1], nh[0]])
    if hd[0] + hd[1] < 0: hd = -hd
    su = (hd[0] + hd[1]) * SP                        # sloupců obrazovky na metr podél stěny
    if su < 0.6: continue
    us = np.concatenate([faces[fi][2][:, :2] @ hd for fi in fl]); zs = np.concatenate([faces[fi][2][:, 2] for fi in fl])
    off = float(np.mean([faces[fi][2][:, :2].mean(0) @ nh for fi in fl]))
    g = {'bid': bid, 'cap': cap, 'nh': nh, 'hd': hd, 'su': su, 'umin': float(us.min()), 'off': off, 'faces': fl,
         'W': int(math.ceil((us.max() - us.min()) * su)) + 1, 'H': int(math.ceil(max(0.5, zs.max()) * PXM)) + 2, 'left': bool(-nh[0] > nh[1]), 'i': len(GROUPS)}
    for fi in fl: face_group[fi] = g
    GROUPS.append(g)

# výška hlavní římsy domu: vážený medián nižšího horního rohu stěn, které stojí na zemi
for bid, q in B.items():
    if not q.get('sel'): continue
    ws, hs = [], []
    for g in GROUPS:
        if g['bid'] != bid or g['cap']: continue
        for fi in g['faces']:
            P = faces[fi][2]; u = P[:, :2] @ g['hd']
            if P[:, 2].min() > 1.0 or u.max() - u.min() < 1.0: continue
            lo = P[u < u.min() + 0.3][:, 2].max(); hi = P[u > u.max() - 0.3][:, 2].max()
            ws.append(u.max() - u.min()); hs.append(min(lo, hi))
    if ws:
        o = np.argsort(hs); cw = np.cumsum(np.array(ws)[o]); q['eave'] = float(np.array(hs)[o][np.searchsorted(cw, cw[-1] / 2)])
    else: q['eave'] = float(q['zmax'] - q['base']) * 0.7
    # stěny domu ve vnitrobloku nebo za sousedem nestojí na zemi a medián pak vyjde u země: fasáda by měla
    # trpasličí patra (26 px) až po střechu. Římsa proto nesmí být níž než 0,8 mediánu výšky střechy.
    hr = Hroof[(Fb == idx[bid]) & (Hroof > 0)]
    if len(hr): q['eave'] = max(q['eave'], 0.8 * float(np.median(hr)))
    q['tall'] = q['eave'] > 30

def cell_of(a, b):
    return np.clip(((a + MARG) / CELL).astype(np.int64), 0, NA - 1), np.clip(((b + MARG) / CELL).astype(np.int64), 0, NB - 1)


# Řez na straně do ulice: kvádr hry končí dřív než skutečný dům (hra má ulici širší), takže místo uliční fasády je
# vidět řez. Ten není dvorní zeď až po hřeben střechy, ale čelo domu: kreslí se jako uliční fasáda po hlavní římsu
# a nad ní jako mansarda. Pozná se tak, že za řezem směrem k divákovi půdorys domu do 12 m skončí a dál je volno.
for g in GROUPS:
    if not g['cap']: continue
    us = np.concatenate([faces[fi][2][:, :2] @ g['hd'] for fi in g['faces']]); votes = 0
    for uq in np.percentile(us, [25, 50, 75]):
        p0 = g['hd'] * uq + g['nh'] * g['off']; ts = np.arange(0.5, 18.01, 0.5)
        ia, ib = cell_of(p0[0] + g['nh'][0] * ts, p0[1] + g['nh'][1] * ts); f = Fany[ia, ib]
        out = np.nonzero(~f)[0]
        if len(out) and ts[out[0]] <= 12 and (~f[out[0]:out[0] + 10]).mean() >= 0.8: votes += 1
    g['front'] = votes >= 2
print('řezů na straně do ulice', sum(1 for g in GROUPS if g.get('front')), 'z', sum(1 for g in GROUPS if g['cap']), flush=True)

# ---------------------------------------------------------------- měření fasád z fotorealistické sítě
# Fotorealistický 3D model Prahy (IPR, léto 2023, CC BY): texturovaná trojúhelníková síť z šikmých leteckých snímků,
# veřejná služba I3S (IntegratedMesh, Web Mercator, výšky Bpv). Do hry se z ní nekreslí (ztmavená fotka není pixel art),
# jen se z ní měří: každá stěna modelu budov dostane narovnaný snímek své fasády (trojúhelníky sítě do 2 m před rovinou
# stěny) a z něj barvu omítky (→ styl z palety hry), výšku patra (perioda řad oken) a osovou vzdálenost oken (perioda
# sloupců). Kreslená fasáda pak má barvu, počet pater a rytmus oken skutečného domu. Uzly sítě se ukládají do
# build/mesh (necommituje se), narovnané fasády pro kontrolu do build/mesh/fasady-<místo>.png. Bez sítě: --bez-site.
MESH_URL = 'https://tiles.arcgis.com/tiles/SBTXIEUGWbqzUecw/arcgis/rest/services/praha2023_merged_WM/SceneServer/layers/0'
MESH_DIR = os.path.join(ROOT, 'build/mesh'); MESH_DEPTH = 15
MERC = 20037508.342789244


def mesh_get(path, binary=False):
    f = os.path.join(MESH_DIR, path.replace('/', '_'))
    if not os.path.exists(f) or os.path.getsize(f) == 0:
        os.makedirs(MESH_DIR, exist_ok=True)
        for _ in range(3):
            r = subprocess.run(['curl', '-sfL', '--compressed', '-m', '120', '-o', f, f'{MESH_URL}/{path}'])
            if r.returncode == 0 and os.path.getsize(f) > 0: break
        else: sys.exit(f'síť: {path} se nepodařilo stáhnout')
    d = open(f, 'rb').read()
    return d if binary else json.loads(d)


_pages = {}


def mesh_node(i):
    p = i // 64
    if p not in _pages: _pages[p] = mesh_get(f'nodepages/{p}')['nodes']
    return _pages[p][i % 64]


def mesh_nodes():
    pts = [m2ll(a * TILE, b * TILE) for a in (-1, LEN + 1) for b in (-1, WID + 1)]
    xs = [p[0] * MERC / 180 for p in pts]; ys = [math.log(math.tan((90 + p[1]) * math.pi / 360)) * MERC / math.pi for p in pts]
    x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
    out = []; lvl = [0]; d = 0
    while lvl:
        nxt = []
        for i in lvl:
            n = mesh_node(i); c = n['obb']['center']; r = max(n['obb']['halfSize']) * 1.5
            if c[0] + r < x0 or c[0] - r > x1 or c[1] + r < y0 or c[1] - r > y1: continue
            ch = n.get('children', [])
            if (d == MESH_DEPTH or not ch) and 'mesh' in n: out.append(n)
            elif d < MESH_DEPTH: nxt += ch
        lvl = nxt; d += 1
    return out




def measure_mesh():
    import io
    gs = [g for g in GROUPS if not g['cap'] and g['W'] >= 40 and g['H'] >= 80]
    if not gs: return
    for g in gs:
        P = np.vstack([faces[fi][2] for fi in g['faces']])
        g['bb'] = (P[:, 0].min() - 2.5, P[:, 0].max() + 2.5, P[:, 1].min() - 2.5, P[:, 1].max() + 2.5)
        g['ph'] = np.zeros((g['H'], g['W'], 3), np.uint8); g['pd'] = np.full((g['H'], g['W']), -1e9, np.float32)
    BB = np.array([g['bb'] for g in gs])
    nodes = mesh_nodes(); print(f'síť: {len(nodes)} uzlů', flush=True)
    for ni, n in enumerate(nodes):
        gbuf = mesh_get(f"nodes/{n['mesh']['geometry']['resource']}/geometries/0", True)
        vc = struct.unpack('<I', gbuf[:4])[0]; nt = vc // 3
        if not nt: continue
        pos = np.frombuffer(gbuf, '<f4', vc * 3, 8).reshape(-1, 3).astype(np.float64); uv = np.frombuffer(gbuf, '<f4', vc * 2, 8 + vc * 12).reshape(-1, 2).astype(np.float64)
        c0 = n['obb']['center']
        lon = (pos[:, 0] + c0[0]) * 180 / MERC; lat = np.degrees(2 * np.arctan(np.exp((pos[:, 1] + c0[1]) * math.pi / MERC)) - math.pi / 2)
        va, vb = ll2m(lon, lat); vz = pos[:, 2] + c0[2]
        ta = va[:nt * 3].reshape(-1, 3); tb = vb[:nt * 3].reshape(-1, 3); tz = vz[:nt * 3].reshape(-1, 3); tuv = uv[:nt * 3].reshape(-1, 3, 2)
        near = np.nonzero((BB[:, 0] < ta.max()) & (BB[:, 1] > ta.min()) & (BB[:, 2] < tb.max()) & (BB[:, 3] > tb.min()))[0]
        if not len(near): continue
        e1 = np.stack([ta[:, 1] - ta[:, 0], tb[:, 1] - tb[:, 0], tz[:, 1] - tz[:, 0]], 1); e2 = np.stack([ta[:, 2] - ta[:, 0], tb[:, 2] - tb[:, 0], tz[:, 2] - tz[:, 0]], 1)
        nrm = np.cross(e1, e2); ln = np.linalg.norm(nrm, axis=1) + 1e-12; flat = np.abs(nrm[:, 2]) > 0.8 * ln
        if flat.any() and np.median(nrm[flat, 2]) < 0: nrm = -nrm   # vnější normála střech míří nahoru
        nrm /= ln[:, None]
        ca_, cb_ = ta.mean(1), tb.mean(1); tex = None
        for gi in near:
            g = gs[gi]; nh, hd = g['nh'], g['hd']
            dist = ca_ * nh[0] + cb_ * nh[1] - g['off']; uc = ca_ * hd[0] + cb_ * hd[1]
            ok = (dist > -6.0) & (dist < 2.0) & (uc > g['umin'] - 0.2) & (uc < g['umin'] + g['W'] / g['su'] + 0.2) & (nrm[:, 0] * nh[0] + nrm[:, 1] * nh[1] > 0.45)
            if not ok.any(): continue
            if tex is None: tex = np.array(Image.open(io.BytesIO(mesh_get(f"nodes/{n['mesh']['material']['resource']}/textures/0", True))).convert('RGB')); th_, tw_ = tex.shape[:2]
            base = B[g['bid']]['base']; Hc, Wc = g['pd'].shape
            for t in np.nonzero(ok)[0]:
                X = ((ta[t] * hd[0] + tb[t] * hd[1]) - g['umin']) * g['su']; Y = (tz[t] - base) * PXM; Dn = ta[t] * nh[0] + tb[t] * nh[1]
                X0, X1 = max(0, int(X.min())), min(Wc, int(X.max()) + 2); Y0, Y1 = max(0, int(Y.min())), min(Hc, int(Y.max()) + 2)
                if X1 <= X0 or Y1 <= Y0: continue
                den = (Y[1] - Y[2]) * (X[0] - X[2]) + (X[2] - X[1]) * (Y[0] - Y[2])
                if abs(den) < 1e-9: continue
                yy, xx = np.mgrid[Y0:Y1, X0:X1]; px = xx + 0.5; py = yy + 0.5
                l0 = ((Y[1] - Y[2]) * (px - X[2]) + (X[2] - X[1]) * (py - Y[2])) / den; l1 = ((Y[2] - Y[0]) * (px - X[2]) + (X[0] - X[2]) * (py - Y[2])) / den; l2 = 1 - l0 - l1
                m = (l0 >= -0.02) & (l1 >= -0.02) & (l2 >= -0.02)
                D = l0 * Dn[0] + l1 * Dn[1] + l2 * Dn[2]; sub = g['pd'][Y0:Y1, X0:X1]; m &= D > sub
                if not m.any(): continue
                u = l0 * tuv[t, 0, 0] + l1 * tuv[t, 1, 0] + l2 * tuv[t, 2, 0]; v = l0 * tuv[t, 0, 1] + l1 * tuv[t, 1, 1] + l2 * tuv[t, 2, 1]
                sub[m] = D[m]; g['ph'][Y0:Y1, X0:X1][m] = tex[np.clip((v[m] * th_).astype(int), 0, th_ - 1), np.clip((u[m] * tw_).astype(int), 0, tw_ - 1)]
        if ni % 100 == 99: print(f'  síť {ni + 1}/{len(nodes)}', flush=True)

    def period(prof, lo, hi):
        """Nejsilnější perioda profilu v rozsahu lo–hi px (autokorelace po odečtení klouzavého průměru)."""
        n = len(prof)
        if n < hi * 2.2: return None, 0
        k = int(hi) | 1; p = prof - np.convolve(np.pad(prof, k // 2, mode='edge'), np.ones(k) / k, 'valid')
        v0 = float(p @ p)
        if v0 < 1e-6: return None, 0
        ac = np.array([float(p[:-l] @ p[l:]) / v0 * n / (n - l) for l in range(int(lo), int(hi) + 1)])
        i = int(ac.argmax())
        if i in (0, len(ac) - 1): return None, 0      # maximum na kraji rozsahu není perioda
        return int(lo) + i, float(ac[i])

    LW = np.array([0.3, 0.59, 0.11]); meas = {}
    for g in gs:
        q = B[g['bid']]; eave_px = int(q['eave'] * PXM)
        # skutečná hlavní římsa: výška, od které plocha sítě ustoupí za rovinu stěny (mansarda, ustupující patro, střecha).
        # Model budov má takové domy jako rovnou zeď až nahoru a fasáda by měla o dvě tři patra víc.
        cov = g['pd'] > -1e8; rec = np.where(cov, g['pd'] - g['off'], np.nan)
        with np.errstate(all='ignore'):
            r = np.where(cov.sum(1) > 0.3 * g['W'], np.nanmedian(rec, axis=1), np.nan)
        g['cor'] = None
        for v in range(int(9 * PXM), g['H'] - 14):
            w = r[v:v + 14]
            if np.isnan(w).all() or np.nanmedian(w) < -0.9: g['cor'] = v; break
        if g['cor'] and g['cor'] < eave_px: eave_px = g['cor']
        v0, v1 = 58, min(g['H'], eave_px) - 4
        if v1 - v0 < 60: continue
        got = (g['pd'][v0:v1] > -1e8) & (rec[v0:v1] > -0.9)
        cols = got.mean(0) > 0.8
        if cols.sum() < 40: continue
        img = g['ph'][v0:v1][:, cols].astype(np.float64); lum = img @ LW
        g['ok'] = True
        bright = lum > np.percentile(lum, 55)
        col = np.median(img[bright], axis=0); wgt = float(bright.sum())
        fh, fs = period(lum.mean(1), 40, 62)   # patro 3,5–5,3 m; kratší perioda bývá parapet nebo balkon, ne patro
        cw, cs = period(lum.mean(0), 1.9 * g['su'], 4.8 * g['su']) if cols.all() or cols.sum() > 0.9 * len(cols) else (None, 0)
        g['fh'], g['fs'], g['cwp'], g['cs'] = fh, fs, cw, cs
        m = meas.setdefault(g['bid'], {'col': [], 'fh': [], 'cw': [], 'cor': []})
        if g['cor']: m['cor'].append((g['cor'] / PXM, g['W']))
        m['col'].append((col, wgt, g['left']))
        if fh and fs > 0.3: m['fh'].append((fh, fs * lum.shape[1]))
        if cw and cs > 0.3: m['cw'].append((cw / g['su'], cs * lum.shape[1] / g['su']))
    if not meas: print('síť: žádná fasáda se nezměřila'); return
    # světlo fotky: stěny ve stínu jsou tmavé a do modra. Každá strana (levá, pravá stěna) se proto po kanálech
    # srovná na střední omítku palety (šedý svět), takže zbyde jen to, čím se dům liší od ostatních; ten rozdíl se
    # zesílí, protože stín barvy stlačuje.
    side = {}
    for m in meas.values():
        for col, wgt, left in m['col']: side.setdefault(left, []).append(col)
    sl = {k: np.median(np.array(v), axis=0) for k, v in side.items()}
    names = ['ochre', 'grey', 'pink', 'white', 'stone', 'green', 'salmon', 'brown', 'travertine', 'cream', 'yellow']
    SC = np.array([PAL[STYLES[k][0]] for k in names], np.float64); target = np.median(SC, axis=0)
    feat = lambda c: np.stack([(c @ LW) * 0.7, (c[..., 0] - c[..., 1]) * 2.0, (c[..., 2] - c[..., 1]) * 2.0], -1)
    SF = feat(SC); hist = {}; nfh = ncw = nco = 0
    for bid, m in meas.items():
        q = B[bid]
        c = sum(col / sl[left] * wgt for col, wgt, left in m['col']) / sum(w for _, w, _ in m['col'])
        c = target * (1 + (c - 1) * 1.6)
        q['style'] = names[int(((feat(c) - SF) ** 2).sum(-1).argmin())]; hist[q['style']] = hist.get(q['style'], 0) + 1
        if m['cor']:
            cs_ = sorted(m['cor']); cw_ = np.cumsum([w for _, w in cs_]); cor = cs_[int(np.searchsorted(cw_, cw_[-1] / 2))][0]
            q['cor'] = float(cor)   # skutečná hlavní římsa: nad ní se nekreslí patra, ani když zeď modelu pokračuje výš
            if cor < q['eave'] - 2.0: q['eave'] = float(cor); q['tall'] = False; nco += 1
        if m['fh']: q['fh'] = float(sum(f * w for f, w in m['fh']) / sum(w for _, w in m['fh'])); nfh += 1
        if m['cw']: q['cw'] = float(sum(f * w for f, w in m['cw']) / sum(w for _, w in m['cw'])); ncw += 1
    print(f'síť: změřeno domů {len(meas)} (barva), výška patra {nfh}, osy oken {ncw}, snížená římsa {nco}; styly {dict(sorted(hist.items(), key=lambda x: -x[1]))}', flush=True)
    global MEASURED
    MEASURED = [g for g in gs if g.get('ok')]


MEASURED = []
if '--bez-site' not in sys.argv: measure_mesh()

# Recepty fasád (data/fasady-<místo>.json): dům, který se má poznat, se nekreslí obecnou fasádou z měření, ale podle
# receptu sepsaného z fotek (typ fasády, počet pater, šířka pole, parter, nápis). Klíč je id budovy v OSM (kvádr).
RECIPES = {}
rp = os.path.join(ROOT, f'data/fasady-{name}.json')
if os.path.exists(rp): RECIPES = {k: v for k, v in json.load(open(rp, encoding='utf8')).items() if k != '_'}
# Každý dům bez vlastního receptu dostane recept typu house z pravidel: druh domu (variant) podle místa, jména a druhu
# budovy v OSM, barva z building:colour, jinak z měření fotomodelu. Stará města mají měšťanské domy (burgher, na
# Staromáku s loubím) a paláce (palais: jméno „palác“, úřady, školy, kláštery), kostely plné stěny s vysokými okny
# (church), Václavák, Hlavák a Nusle činžáky (tenement).
OLD = name in ('staromak', 'most', 'malastrana', 'hrad')
osm_tags = {}
op = os.path.join(ROOT, f'data/osm/{name}.json')
if os.path.exists(op):
    od = json.load(open(op, encoding='utf8')); od = od.get('elements', od) if isinstance(od, dict) else od
    for e in od:
        if e.get('tags', {}).get('building'): osm_tags[e['id'] if e['type'] != 'relation' else f"r{e['id']}"] = e['tags']
CSS = {'white': '#ffffff', 'gray': '#808080', 'grey': '#808080', 'beige': '#f5f5dc', 'bisque': '#ffe4c4', 'sand': '#c2b280', 'firebrick': '#b22222', 'azure': '#e8eef0', 'yellow': '#e8d27a', 'brown': '#7a5a3a', 'darkgray': '#555555', 'darkgrey': '#555555', 'pink': '#e8b8b0', 'red': '#b04030', 'green': '#9db58f', 'cream': '#f3e5c0'}
STYLE_OF_CSS = {'firebrick': 'pink', 'red': 'pink', 'darkgray': 'brown', 'darkgrey': 'brown', 'azure': 'white', 'sand': 'ochre', 'beige': 'cream', 'bisque': 'cream'}


def style_of_colour(col):
    col = col.strip().lower()
    if col in STYLE_OF_CSS: return STYLE_OF_CSS[col]
    hx = CSS.get(col, col)
    if not re.match(r'^#[0-9a-f]{6}$', hx): return None
    c = np.array([int(hx[i:i + 2], 16) for i in (1, 3, 5)], np.float64); g_ = c.mean(); sat = c.max() - c.min()
    if sat < 26: return 'white' if g_ > 200 else 'grey' if g_ > 110 else 'brown'
    if c[1] >= c[0] and c[1] >= c[2]: return 'green'
    if c[0] > c[1] > c[2]: return 'yellow' if sat > 90 and c[1] > 190 else 'cream' if g_ > 215 else 'ochre' if c[1] - c[2] > 30 else 'salmon'
    return 'pink'


def auto_recipe(tags):
    nm = (tags.get('name') or '').lower(); kind = tags.get('building', 'yes')
    if kind in ('church', 'chapel', 'cathedral', 'synagogue') or nm.startswith(('kostel', 'svatý', 'svatá', 'panna marie', 'chrám')): var = 'church'
    elif 'věž' in nm or 'zvonice' in nm: var = 'tower'
    elif 'palác' in nm or 'klášter' in nm or 'gymnázium' in nm or 'špitál' in nm or 'fakulta' in nm or kind in ('government', 'university', 'public', 'civic') and OLD: var = 'palais'
    else: var = 'burgher' if OLD else 'tenement'
    r = {'type': 'house', 'variant': var, 'auto': True}
    st_ = style_of_colour(tags['building:colour']) if tags.get('building:colour') else None
    if st_: r['style'] = st_
    return r


used = set(); auto = {}
for bi in np.nonzero(selected)[0]:
    m = (Fb == bi) & (Tbox >= 0)
    if m.sum() < 48: continue
    tb = np.bincount(Tbox[m]); order = np.argsort(-tb)
    for t in order[:1]:   # největší kvádr pod domem určí pravidla
        if tb[t] and 'recipe' not in B[ids[bi]]:
            r = auto_recipe(osm_tags.get(boxes[t].get('osm'), {'name': boxes[t].get('name')}))
            q = B[ids[bi]]; q['recipe'] = r; auto[r['variant']] = auto.get(r['variant'], 0) + 1
            if r.get('style'): q['style'] = r['style']
            elif r['variant'] == 'church': q['style'] = 'cream'
            elif r['variant'] == 'tower': q['style'] = 'stone'
    for t in np.unique(Tbox[m]):
        r = RECIPES.get(str(boxes[t].get('osm')))
        if r:
            q = B[ids[bi]]; q['recipe'] = r; q['tall'] = False; used.add(str(boxes[t]['osm']))
            if r.get('cover'): q['cover'] = r['cover']
            for k in ('style', 'win', 'parter', 'cordon', 'quoins', 'shutters', 'cw'):
                if k in r and k != 'parter' or (k == 'parter' and isinstance(r.get(k), str)): q[k] = r[k]
print('recepty fasád: vlastní', len(used), 'z', len(RECIPES), '| z pravidel', auto, flush=True)


def text57(tex, mask, u, v, text, col):
    """Nápis písmem 5 × 7 v rovině stěny, levý dolní roh (u, v)."""
    for ch in text:
        bits = FONT57.get(ch)
        if bits:
            for i, bit in enumerate(bits):
                uu, vv = u + i % 5, v + 6 - i // 5
                if bit == '1' and 0 <= uu < tex.shape[1] and 0 <= vv < tex.shape[0] and mask[vv, uu]: tex[vv, uu] = K_(col)
        u += 6


def hsh(i, j, s):
    h = (i.astype(np.int64) * 73856093) ^ (j.astype(np.int64) * 19349663) ^ (int(s) * 83492791)
    h = (h ^ (h >> 13)) * 1274126177; h = h ^ (h >> 16)
    return (h & 0xffff) / 65536.0


def facade_house(g, q, tex, mask, cols, topv, rnd, full):
    """Fasáda domu podle receptu typu house (variant burgher, tenement, palais, church, tower): pevný rytmus polí,
    okna s šambránami přes window(), parter podle druhu domu, římsy, pilastry, nárožní bosáž a špína s příčinou."""
    r = q['recipe']; var = r.get('variant', 'burgher'); W, H = g['W'], g['H']; su = g['su']; left = g['left']; age = q['age']
    st = STYLES[q['style']]
    base, light, dark = (st[2], st[0], {'P': 'a', '6': 'P', 'e': 'O', 'T': 'S', 'R': 'D', 'v': 'x', '2': 'G', 'r': 'R', 'Y': 'O'}.get(st[2], 'P')) if left else (st[0], st[1], st[2])
    if st[2] == 'k': base, light, dark = ('9', '3', 'k') if left else ('3', '4', '9')
    deep = 'k' if left else dark
    vv, uu = np.mgrid[0:H, 0:W]
    P = lambda u0, u1, v0, v1, c: tex.__setitem__((slice(max(0, v0), max(0, v1)), slice(max(0, u0), max(0, u1))), np.where(mask[max(0, v0):max(0, v1), max(0, u0):max(0, u1)], K_(c), tex[max(0, v0):max(0, v1), max(0, u0):max(0, u1)]))
    wall_top = int(np.median(topv[cols])) - 1
    top = int(q['eave'] * PXM)
    if r.get('full') or top < 0.62 * wall_top or top > wall_top: top = wall_top
    tex[mask] = K_(base)
    runs = []; s0 = cols[0]
    for a, b2 in zip(cols[:-1], cols[1:]):
        if b2 != a + 1: runs.append((s0, a + 1)); s0 = b2
    runs.append((s0, cols[-1] + 1))
    wide = max(runs, key=lambda x: x[1] - x[0])

    def state():
        roll = rnd()
        return 'broken' if roll < 0.08 + 0.2 * age else 'boards' if roll < 0.16 + 0.32 * age else 'candle' if roll > 0.99 else 'glass' if roll > 0.9 else 'dark'

    def arch(u0, u1, v0, v1, col, edge=None):
        """Otvor s půlkruhovým záklenkem."""
        w = u1 - u0; rr = max(1, w // 2)
        P(u0, u1, v0, v1 - rr, col)
        for k in range(rr):
            d = int(round(rr - math.sqrt(max(0, rr * rr - (k + 0.5) ** 2))))
            P(u0 + d, u1 - d, v1 - rr + k, v1 - rr + k + 1, col)
            if edge: P(u0 + d - 1, u0 + d, v1 - rr + k, v1 - rr + k + 1, edge); P(u1 - d, u1 - d + 1, v1 - rr + k, v1 - rr + k + 1, edge)
        if edge: P(u0 - 1, u0, v0, v1 - rr, edge); P(u1, u1 + 1, v0, v1 - rr, edge)

    if var in ('church', 'tower'):
        # kostel a věž: plná stěna, sokl, vysoká oblouková okna daleko od sebe (věž jen střílny), lizény na nárožích
        bay = max(16.0, 5.5 * su)
        for r0, r1 in runs:
            n = int((r1 - r0) // bay)
            for c in range(n):
                uc = int(r0 + (r1 - r0 - n * bay) / 2 + (c + 0.5) * bay)
                if var == 'tower':
                    for v in range(int(top * 0.3), top - 20, 46): P(uc - 1, uc + 1, v, v + 9, 'k')
                else:
                    ww = max(4, int(1.5 * su)); v0 = int(top * 0.34); v1 = int(top * 0.8)
                    if full(uc - ww // 2 - 2, uc + ww // 2 + 3, v0 - 2, v1 + 2):
                        arch(uc - ww // 2, uc + ww // 2 + 1, v0, v1, 'k' if rnd() < 0.3 + 0.3 * age else 'n', light)
                        for v in range(v0 + 5, v1 - 4, 6): P(uc - ww // 2, uc + ww // 2 + 1, v, v + 1, 'S')
                        P(uc, uc + 1, v0, v1 - 2, 'S'); P(uc - ww // 2 - 1, uc + ww // 2 + 2, v0 - 2, v0, light)
                        for d in range(int(3 + rnd() * 16)): P(uc - 1, uc, v0 - 3 - d, v0 - 2 - d, dark)
            if r1 - r0 > 30: P(r0, r0 + 3, 8, top - 4, light); P(r1 - 3, r1, 8, top - 4, light if not left else dark)
        if var == 'tower': tex[mask & ((vv % 13 == 0) | ((uu + (vv // 13 % 2) * 8) % 16 == 0)) & (hsh(uu // 5, vv // 5, q['seed']) < 0.55)] = K_(dark)
        P(0, W, 0, 9, dark); P(0, W, 9, 11, light)
    else:
        old_ = var in ('burgher', 'palais')
        gf = int(r.get('parter', 4.3 if old_ else 5.0) * PXM)
        if top < gf + 34: gf = 0 if top < 62 else int(top * 0.46)
        fl = (r.get('fh') and r['fh'] * PXM) or q.get('fh') or (41 if old_ else 46)
        nf = r.get('floors') or max(1, int(round((top - gf - 6) / fl))); fh = (top - gf - 6) / nf
        if fh < 28 and nf > 1 and not r.get('floors'): nf -= 1; fh = (top - gf - 6) / nf
        bay = max(9.0, (r.get('bay') or q['cw']) * su)
        arcade = r.get('arcade', var == 'burgher' and name == 'staromak' and q['seed'] % 3 > 0)
        kinds = {'burgher': ('frame', 'frame'), 'tenement': ('lintel', 'frame'), 'palais': (r.get('win', 'lintel' if q['seed'] % 2 else 'arch'), 'frame')}[var]
        for r0, r1 in runs:
            if r1 - r0 < 9: continue
            n = max(1, int(round((r1 - r0) / bay))); bw = (r1 - r0) / n
            portal = (n // 2 if var == 'palais' else int(rnd() * n)) if (r0, r1) == wide and gf and not arcade else -1
            ww = int(max(3, min(1.2 * su, bw * 0.5)))
            for c in range(n):
                b0 = int(r0 + c * bw); b1 = int(r0 + (c + 1) * bw); uc = (b0 + b1) // 2; u0 = uc - ww // 2; u1 = u0 + ww
                if gf > 30:
                    if arcade:   # loubí: oblouk přes celé pole, uvnitř tma a kousek zadní stěny
                        if full(b0 + 2, b1 - 2, 2, gf - 6): arch(b0 + 3, b1 - 3, 0, gf - 7, 'k', light if not left else dark); P(b0 + 5, b1 - 5, 0, int(gf * 0.3), 'N')
                    elif c == portal:
                        pw = int(max(ww + 3, min(bw - 4, 1.9 * su)))
                        if full(uc - pw // 2 - 2, uc + pw // 2 + 2, 2, int(gf * 0.86)):
                            arch(uc - pw // 2, uc + pw // 2, 0, int(gf * 0.84), 'k' if rnd() < 0.5 else 'H', light)
                            P(uc, uc + 1, 0, int(gf * 0.6), 'K'); P(uc - pw // 2, uc + pw // 2, int(gf * 0.6), int(gf * 0.6) + 1, 'K')
                    elif var == 'tenement':   # výloha: mříž, desky, nebo vybité sklo
                        s0_, s1_ = b0 + max(2, int(bw * 0.14)), b1 - max(2, int(bw * 0.14)); roll = rnd()
                        if s1_ - s0_ >= 5 and full(s0_ - 1, s1_ + 1, 6, gf - 9):
                            P(s0_ - 1, s1_ + 1, 7, gf - 9, light); P(s0_, s1_, 8, gf - 10, 'k' if roll < 0.3 else 'n')
                            if roll > 0.7:
                                for u in range(s0_, s1_, 3): P(u, u + 1, 8, gf - 10, 'S')
                                for v in range(11, gf - 10, 5): P(s0_, s1_, v, v + 1, 'S')
                            elif roll > 0.45:
                                P(s0_, s1_, 8, gf - 10, 'H')
                                for v in range(10, gf - 10, 5): P(s0_, s1_, v, v + 1, 'K')
                            else: P(s0_, s1_, gf - 20, gf - 19, 'S')
                    else:
                        wh = int(min(1.5 * PXM, gf * 0.4)); v0 = int(gf * 0.4)
                        if full(u0 - 3, u1 + 3, v0 - 3, v0 + wh + 3):
                            window(tex, rnd, u0, u1, v0, v0 + wh, 'plain', light, dark, base, state(), False)
                            if var == 'burgher' and rnd() < 0.5: tex[v0:v0 + wh:3, u0:u1] = K_('S')   # mříž
                for f in range(nf):
                    f0 = gf + 3 + f * fh; small = var == 'palais' and nf >= 3 and f == nf - 1
                    wh = int(min((1.5 if small else 2.5 if var == 'palais' and f == 0 else 2.1) * PXM, fh * (0.5 if small else 0.62)))
                    v0 = int(f0 + (fh - wh) * 0.42); v1 = v0 + wh
                    if not full(u0 - 3, u1 + 3, v0 - 4, v1 + 6): continue
                    sta = state(); window(tex, rnd, u0, u1, v0, v1, kinds[0] if f == 0 else 'plain' if small else kinds[1], light, dark, base, sta, var == 'burgher' and q['seed'] % 4 == 0)
                    if f == 0 and var in ('palais', 'tenement') and ww >= 5 and full(u0 - 2, u1 + 2, v1 + 2, v1 + 7):   # frontonek nad oknem
                        for k in range(3): P(u0 - 1 + k * (ww // 6 + 1), u1 + 1 - k * (ww // 6 + 1), v1 + 3 + k, v1 + 4 + k, light)
                    if sta == 'broken' and rnd() < 0.4:   # saze nad vyhořelým oknem
                        for k in range(int(6 + rnd() * 10)): P(u0 + int(rnd() * 2), u1 - int(rnd() * 2), v1 + 2 + k, v1 + 3 + k, 'k' if k < 3 else dark)
                    elif rnd() < 0.3 + 0.3 * age:
                        d0 = u0 + int(rnd() * ww)
                        for d in range(int(3 + rnd() * 11)):
                            if tex[max(0, v0 - 3 - d), d0] == K_(base): P(d0, d0 + 1, v0 - 3 - d, v0 - 2 - d, dark)
                if var == 'palais' and bw >= 13 and c > 0: P(b0 - 1, b0 + 1, gf + 2, top - 7, light); P(b0 + 1, b0 + 2, gf + 2, top - 7, dark); P(b0 - 2, b0 + 3, top - 10, top - 7, light)
            if var != 'palais' and r1 - r0 > 44 and (var == 'tenement' or q['seed'] % 5 < 2):   # nárožní bosáž
                for v in range(gf + 4, top - 8, 8):
                    o = 0 if (v // 8) % 2 else 2
                    P(r0, r0 + 3 + o, v, v + 6, light); P(r1 - 3 - o, r1, v, v + 6, light)
        if gf > 30:
            stone = mask & (tex == K_(base)) & (vv < gf - 3)
            if var in ('tenement', 'palais'): tex[stone & ((vv % 9 == 0) | ((uu + (vv // 9 % 2) * 7) % 14 == 0))] = K_(dark)   # bosáž parteru
            else: P(0, W, 0, 7, dark)                                                                                           # sokl
            P(0, W, gf - 3, gf - 1, light); P(0, W, gf - 4, gf - 3, dark)
            if var == 'tenement' and nf >= 3: v = int(gf + 3 + (nf - 1) * fh); P(0, W, v - 2, v, light); P(0, W, v - 3, v - 2, dark)
        if r.get('sign') and not left and gf > 30:
            tw = len(r['sign']) * 6
            if wide[1] - wide[0] > tw + 16:
                u0 = wide[0] + (wide[1] - wide[0] - tw) // 2
                P(u0 - 3, u0 + tw + 2, gf + 2, gf + 13, dark); text57(tex, mask, u0, gf + 4, r['sign'], r.get('signColor', 'y'))
    # hlavní římsa se zubořezem; nad ní štít nebo atika: holá omítka s okénkem
    P(0, W, top - 2, top + 1, light); tex[mask & (vv >= top - 5) & (vv < top - 2) & (uu % 3 != 0)] = K_(light); tex[mask & (vv == top - 6)] = K_(dark)
    for r0, r1 in runs:
        hi = int(topv[r0:r1].max())
        if hi - top > 22 and r1 - r0 > 14:
            uc = int(r0 + np.argmax(topv[r0:r1])); v = top + int((hi - top) * 0.35)
            if full(uc - 3, uc + 4, v - 2, v + 9): P(uc - 2, uc + 3, v, v + 7, 'k'); P(uc - 3, uc + 4, v - 1, v, light)
    # špína: opadaná omítka s cihlou, šmouhy pod římsou, odstřik u země
    for _ in range(int(round(W / 64 * (0.3 + age * 1.3)))): brick(tex, mask, rnd, 6 + rnd() * max(1, W - 36), 10 + rnd() * max(1, top - 40), 10 + rnd() * 20, 8 + rnd() * 16, dark)
    for u in cols:
        if rnd() < 0.1 + 0.16 * age:
            n = int(4 + rnd() * (10 + 34 * age)); sl = tex[max(0, top - 7 - n):top - 6, u]; sl[sl == K_(base)] = K_(dark)
        tex[topv[u], u] = K_(light)
    P(0, W, 0, 4, deep)
    return tex, mask


def facade_recipe(g, q, tex, mask, cols, topv, rnd):
    """Fasáda podle receptu. tex[v, u], v od země nahoru; šířky v metrech × su, výšky v metrech × PXM."""
    r = q['recipe']; W, H = g['W'], g['H']; su = g['su']; left = g['left']
    st = STYLES[q['style']]
    base, light, dark = (st[2], st[0], {'P': 'a', '6': 'P', 'e': 'O'}.get(st[2], 'P')) if left else (st[0], st[1], st[2])
    if st[2] == 'k': base, light, dark = ('9', '3', 'k') if left else ('3', '4', '9')
    glass, glint, bar = ('N', 'n', 'k') if left else ('n', 'L', 'S')
    vv, uu = np.mgrid[0:H, 0:W]
    top = int(min(q['eave'] * PXM, topv[cols].max()))
    if r.get('full'): top = max(top, int(np.median(topv[cols])) - 2)   # fasáda až po horní hranu zdi (muzeum: římsa je vrch stěny modelu)
    if not q.get('said'): q['said'] = True; print(f"  recept {r['name']}: římsa {q['eave']:.1f} m = {int(q['eave'] * PXM)} px", flush=True)
    gf = int(r['parter'] * PXM); nf = r['floors']; fh = (top - gf - 4) / nf
    bay = max(12.0, r['bay'] * su)
    runs = []; s0 = cols[0]
    for a, b2 in zip(cols[:-1], cols[1:]):
        if b2 != a + 1: runs.append((s0, a + 1)); s0 = b2
    runs.append((s0, cols[-1] + 1))
    P = lambda u0, u1, v0, v1, c: tex.__setitem__((slice(max(0, v0), max(0, v1)), slice(max(0, u0), max(0, u1))), np.where(mask[max(0, v0):max(0, v1), max(0, u0):max(0, u1)], K_(c), tex[max(0, v0):max(0, v1), max(0, u0):max(0, u1)]))
    tex[mask] = K_(base)
    for r0, r1 in runs:
        n = max(1, int(round((r1 - r0) / bay))); bw = (r1 - r0) / n
        pier = 2 if r['type'] in ('curtain', 'ribbon') else max(3, int(bw * (0.16 if r['type'] == 'grid' else 0.2)))
        for c in range(n):
            b0 = int(r0 + c * bw); b1 = int(r0 + (c + 1) * bw)
            # prosklený parter mezi pilíři: tmavé sklo, svislé příčky po 1,2 m, vodorovné po patře výlohy
            g0, g1 = b0 + pier // 2 + 1, b1 - pier // 2 - 1
            if r['type'] == 'museum':
                # bosovaný parter: malé obloukové okno v každém poli
                ww = max(4, int(1.4 * su)); wh = int(3.0 * PXM); u0 = (b0 + b1 - ww) // 2; v0 = int(gf * 0.3)
                P(u0, u0 + ww, v0, v0 + wh, 'k' if rnd() < 0.3 else glass)
                for k in range(3): P(u0, u0 + 1 + k // 2, v0 + wh - 1 - k, v0 + wh - k, base); P(u0 + ww - 1 - k // 2, u0 + ww, v0 + wh - 1 - k, v0 + wh - k, base)
                P(u0 - 1, u0 + ww + 1, v0 - 2, v0, light)
            elif g1 - g0 >= 6:
                P(g0, g1, 3, gf - 6, glass)
                step = max(4, int(1.2 * su))
                for u in range(g0 + step, g1 - 1, step): P(u, u + 1, 3, gf - 6, bar)
                for v in (int(gf * 0.5), ) + ((int(gf * 0.25), int(gf * 0.75)) if r['type'] == 'grid' else ()): P(g0, g1, v, v + (2 if v == int(gf * 0.5) else 1), base if v == int(gf * 0.5) else bar)
                if r['type'] == 'palace':   # arkáda: zaoblené horní rohy výlohy
                    for k in range(4): P(g0, g0 + 4 - k, gf - 10 + k, gf - 9 + k, base); P(g1 - 4 + k, g1, gf - 10 + k, gf - 9 + k, base)
                for k in range(int(3 + rnd() * 4)):  # odlesky a vybité tabule
                    u = g0 + 1 + int(rnd() * max(1, g1 - g0 - 4)); v = 6 + int(rnd() * max(1, gf - 22))
                    if rnd() < 0.35: P(u, u + min(step - 1, 5), v, v + 9, 'k')
                    else:
                        for d in range(6): P(u + d // 2, u + d // 2 + 1, v + d, v + d + 1, glint)
            for f in range(nf):
                f0 = int(gf + 2 + f * fh)
                if r['type'] == 'museum':
                    span = top - gf - 12; f0 = int(gf + 4 + (0 if f == 0 else span * 0.6)); fhh = span * (0.6 if f == 0 else 0.4)
                    if f == 0:   # hlavní patro: vysoké obloukové okno mezi pilastry
                        ww = max(5, int(1.9 * su)); wh = int(min(5.4 * PXM, fhh - 12)); u0 = (b0 + b1 - ww) // 2; v0 = f0 + 6
                        P(u0 - 1, u0 + ww + 1, v0 - 1, v0 + wh + 1, light); P(u0, u0 + ww, v0, v0 + wh, 'k' if rnd() < 0.25 else glass)
                        for k in range(max(2, ww // 2)): P(u0, u0 + max(0, ww // 2 - k - 1), v0 + wh - 1 - k // 2, v0 + wh - k // 2, light); P(u0 + ww - max(0, ww // 2 - k - 1), u0 + ww, v0 + wh - 1 - k // 2, v0 + wh - k // 2, light)
                        P(u0, u0 + ww, v0 + wh * 2 // 3, v0 + wh * 2 // 3 + 1, bar); P(u0 + ww // 2, u0 + ww // 2 + 1, v0, v0 + wh, bar)
                        P(u0 - 2, u0 + ww + 2, v0 - 4, v0 - 1, light)   # parapet s balustrádou
                    else:        # horní patro: nižší okno s římsou
                        ww = max(4, int(1.5 * su)); wh = int(min(2.6 * PXM, fhh - 10)); u0 = (b0 + b1 - ww) // 2; v0 = f0 + 4
                        P(u0, u0 + ww, v0, v0 + wh, 'k' if rnd() < 0.25 else glass); P(u0 - 1, u0 + ww + 1, v0 + wh, v0 + wh + 2, light); P(u0 + ww // 2, u0 + ww // 2 + 1, v0, v0 + wh, bar)
                    if f == 0:   # pilastr přes obě patra, hlavice nahoře
                        P(b0, b0 + 3, gf + 2, top - 10, light); P(b0 + 3, b0 + 4, gf + 2, top - 10, dark); P(b0 - 1, b0 + 5, top - 13, top - 10, light)
                        P(0, 0, 0, 0, base)
                    for d in range(int(rnd() * 14)): P(u0 + 1, u0 + 2, v0 - 6 - d, v0 - 5 - d, dark)
                elif r['type'] == 'curtain':
                    # skleněná stěna: tabule mezi tenkými příčkami, v úrovni stropu světlejší pás
                    P(b0, b1, f0, int(f0 + fh), glass); P(b0, b1, f0, f0 + 3, bar); P(b0, b1, f0 + 3, f0 + 4, glint)
                    step = max(4, int(r.get('pane', 1.4) * su))
                    for u in range(b0, b1, step):
                        P(u, u + 1, f0, int(f0 + fh), bar)
                        roll = rnd()
                        if roll < 0.1: P(u + 1, u + step, f0 + 5, int(f0 + fh) - 1, 'k')
                        elif roll < 0.16: P(u + 1, u + step, f0 + 5, int(f0 + fh) - 1, 'H' if left else 'h')
                        elif roll < 0.5:
                            for d in range(int(fh) - 10): P(u + 1 + d * (step - 2) // max(1, int(fh)), u + 2 + d * (step - 2) // max(1, int(fh)), f0 + 6 + d, f0 + 7 + d, glint)
                elif r['type'] == 'ribbon':
                    # pásové okno přes celé pole nad plným parapetem
                    v0 = f0 + int(fh * 0.42); v1 = f0 + int(fh * 0.92)
                    P(b0, b1, v0, v1, glass); P(b0, b1, v1, v1 + 1, light); P(b0, b1, v0 - 1, v0, dark)
                    step = max(4, int(1.5 * su))
                    for u in range(b0, b1, step):
                        P(u, u + 1, v0, v1, bar)
                        roll = rnd()
                        if roll < 0.12: P(u + 1, u + step, v0, v1, 'k')
                        elif roll < 0.2: P(u + 1, u + step, v0, v1, 'H' if left else 'h')
                    for d in range(int(2 + rnd() * 10)): P(b0 + 3, b0 + 4, v0 - 2 - d, v0 - 1 - d, dark)
                elif r['type'] == 'grid':
                    # velké čtvercové okno bez dělení ve světlém rámu, tmavé sklo s šikmým odleskem
                    ww = int(min(r['win'] * su, bw - pier - 2)); wh = int(min(r['win'] * PXM, fh - 9))
                    u0 = (b0 + b1 - ww) // 2; v0 = f0 + int((fh - wh) / 2)
                    P(u0 - 1, u0 + ww + 1, v0 - 1, v0 + wh + 1, light); P(u0, u0 + ww, v0, v0 + wh, glass)
                    roll = rnd()
                    if roll < 0.12:   # vybité: černá díra se střepy u rámu
                        P(u0, u0 + ww, v0, v0 + wh, 'k')
                        for k in range(ww): 
                            if rnd() < 0.5: P(u0 + k, u0 + k + 1, v0, v0 + 1 + int(rnd() * 5), glass)
                    elif roll < 0.2:  # zatlučené deskami
                        P(u0, u0 + ww, v0, v0 + wh, 'H')
                        for v in range(v0 + 4, v0 + wh, 6): P(u0, u0 + ww, v, v + 1, 'k')
                    else:
                        o = int(rnd() * 6)
                        for d in range(wh - 4): P(u0 + 1 + (d + o) * ww // (wh + 8), u0 + 3 + (d + o) * ww // (wh + 8), v0 + 2 + d, v0 + 3 + d, glint)
                    for d in range(int(2 + rnd() * 9)): P(u0 + 2, u0 + 3, v0 - 3 - d, v0 - 2 - d, dark)   # stékanec pod rámem
                else:
                    # sdružené okno: dvě úzká okna vedle sebe, světlá nadokenní římsa, parapet
                    ww = max(3, int(0.95 * su)); wh = int(min(2.2 * PXM, fh - 12)); gap = max(2, int(0.35 * su))
                    v0 = f0 + int((fh - wh) / 2) - 1; uc = (b0 + b1) // 2
                    for u0 in (uc - gap // 2 - ww, uc + (gap + 1) // 2):
                        roll = rnd()
                        P(u0, u0 + ww, v0, v0 + wh, 'k' if roll < 0.15 else glass)
                        if roll >= 0.15: P(u0, u0 + ww, v0 + wh * 2 // 3, v0 + wh * 2 // 3 + 1, bar); P(u0 + ww // 2, u0 + ww // 2 + 1, v0, v0 + wh * 2 // 3, bar)
                        if 0.15 <= roll < 0.3: P(u0, u0 + ww, v0, v0 + wh, 'h' if not left else 'H')
                    P(uc - gap // 2 - ww - 1, uc + (gap + 1) // 2 + ww + 1, v0 + wh, v0 + wh + 2, light)
                    P(uc - gap // 2 - ww - 1, uc + (gap + 1) // 2 + ww + 1, v0 - 2, v0 - 1, dark)
            if r['type'] == 'palace':   # lizéna mezi poli přes všechna patra
                P(b0, b0 + 2, gf, top - 6, light if not left else dark)
    # spáry kamenného obkladu, pásy nad parterem a pod římsou
    stone = mask & (tex == K_(base))
    if r['type'] == 'palace': tex[stone & (vv % 11 == 0) & (vv > gf)] = K_(dark)
    elif r['type'] == 'museum':
        tex[stone & (vv < gf - 5) & ((vv % 8 == 0) | ((uu + (vv // 8 % 2) * 6) % 12 == 0))] = K_(dark)   # bosáž parteru
        tex[mask & (vv >= top - 8) & (vv < top - 4) & (uu % 3 == 0)] = K_(dark)                             # balustráda atiky
        span = top - gf - 12; vm = int(gf + 4 + span * 0.6)
        tex[mask & (vv >= vm - 2) & (vv < vm)] = K_(light); tex[mask & (vv == vm - 3)] = K_(dark)          # kordonová římsa
    elif r['type'] == 'grid': tex[stone & (((vv - gf) % max(8, int(fh)) == 0) | (uu % max(10, int(bay / 2)) == 0)) & (vv > gf)] = K_(dark)
    P(0, W, gf - 5, gf - 2, light); P(0, W, gf - 2, gf, dark); P(0, W, top - 4, top - 1, light); P(0, W, top - 6, top - 4, dark)
    if r.get('sign') and not left:
        wide = max(runs, key=lambda x: x[1] - x[0]); tw = len(r['sign']) * 6
        if wide[1] - wide[0] > tw + 20: P(wide[0] + 11, wide[0] + 17 + tw, gf + 1, gf + 12, dark); text57(tex, mask, wide[0] + 14, gf + 3, r['sign'], r.get('signColor', 'y'))
    # nad římsou (ustupující patro, mansarda): tmavší kámen s řadou nízkých oken
    over = mask & (vv > top)
    if over.any():
        tex[over] = K_(dark)
        for u in range(cols[0] + 6, cols[-1] - 6, max(8, int(bay / 2))): P(u, u + max(3, int(0.9 * su)), top + 7, top + 7 + 14, glass)
    # špína: odstřik u země, šmouhy pod římsou
    P(0, W, 0, 4, 'k' if left else dark)
    for u in cols:
        if rnd() < 0.12: P(u, u + 1, top - 7 - int(4 + rnd() * 26), top - 6, dark)
        t = topv[u]; tex[t, u] = K_(light)
    return tex, mask


# ---------------------------------------------------------------- kresba fasády
K_ = lambda ch: ord(ch)


def spray(tex, mask, u0, u1, v_min, v_max, text, col, seed):
    """Tag sprejem do roviny stěny (podle sprayText v art/buildings.px.js): písmo 5 × 7, obrys, rozprašek, stékance."""
    rnd = rng_of(seed, len(text)).rand
    words = [w for w in re.sub(r'[„“"]', '', text).upper().split() if w]
    max_u = (u1 - u0) - 8

    def wrap(step):
        lines = [[]]
        for w in words:
            cur = lines[-1]; n = len(' '.join(cur)) + (1 if cur else 0) + len(w)
            if n * step > max_u and cur: lines.append([w])
            else: cur.append(w)
        return [' '.join(l) for l in lines]

    sc, lines, line_h = 1, wrap(6), 11
    ls = wrap(12)
    if len(ls) * 22 <= v_max - v_min and all(len(l) * 12 - 2 <= max_u for l in ls): sc, lines, line_h = 2, ls, 22
    lines = [l for l in lines[:max(1, (v_max - v_min) // line_h)]]
    if any(len(l) * 6 * sc - sc > max_u for l in lines): return False
    step = 6 * sc; height = len(lines) * line_h
    top = v_min + height + int(rnd() * min(10, max(0, v_max - v_min - height)))
    slope = (rnd() - 0.5) * 0.06; lean = 0.05 + rnd() * 0.08
    cells, drips = [], []
    for li, t in enumerate(lines):
        wl = len(t) * step - sc
        u = 4 + int(rnd() * max(1, max_u - wl)); base = top - (li + 1) * line_h + 2
        for ch in t:
            d = unicodedata.normalize('NFD', ch); g = FONT57.get(d[0])
            v0 = base + round(slope * u + (rnd() - 0.5) * sc * 0.8)
            if g:
                for gy in range(7):
                    for gx in range(5):
                        if g[gy * 5 + gx] == '1':
                            cu, cv = u + gx * sc + round((6 - gy) * lean * sc), v0 + (6 - gy) * sc
                            cells.append((cu, cv))
                            if gy == 6 and rnd() < 0.1: drips.append((cu + int(rnd() * sc), cv - 1, 2 + int(rnd() * 7)))
            for m in d[1:]:
                for gx, up in MARKS57.get(m, []): cells.append((u + gx * sc + round(7 * lean * sc), v0 + (6 + up) * sc))
            u += step
    H, W = tex.shape

    def put(u, v, k):
        x, y = int(u0 + u), int(v)
        if 0 <= x < W and 0 <= y < H and mask[y, x]: tex[y, x] = K_(k)

    for cu, cv in cells:
        for a in range(-1, sc + 1):
            for b in range(-1, sc + 1): put(cu + a, cv + b, 'k')
    for u, v, n in drips:
        for t in range(n + 1): put(u - 1, v - t, 'k'); put(u + 1, v - t, 'k')
    for cu, cv in cells:
        for a in range(sc):
            for b in range(sc):
                if rnd() > 0.03: put(cu + a, cv + b, col)
    for cu, cv in cells:
        if rnd() < 0.08: put(cu + round((rnd() - 0.5) * (sc + 5)), cv + round((rnd() - 0.5) * (sc + 5)), col)
    for u, v, n in drips:
        for t in range(n): put(u, v - t, col)
    return True


def brick(tex, mask, rnd, u, v, w, h, edge):
    """Opadaná omítka: skvrna z překrytých ploch, v ní cihly ve vazbě, kolem stín hrany omítky."""
    H, W = tex.shape
    parts = [(u, v, w, h)] + [(u + (rnd() - 0.35) * w, v + (rnd() - 0.35) * h, w * (0.3 + rnd() * 0.5), h * (0.3 + rnd() * 0.6)) for _ in range(1 + int(rnd() * 4))]
    bx = []
    for pu, pv, pw, ph in parts:
        a0, a1, b0, b1 = max(1, round(pu)), min(W - 1, round(pu + pw)), max(1, round(pv)), min(H - 1, round(pv + ph))
        if a1 - a0 > 2 and b1 - b0 > 2: bx.append((a0, a1, b0, b1))
    for a0, a1, b0, b1 in bx:
        s = tex[max(0, b0 - 1):b1 + 1, max(0, a0 - 1):a1 + 1]; s[mask[max(0, b0 - 1):b1 + 1, max(0, a0 - 1):a1 + 1]] = K_(edge)
    for a0, a1, b0, b1 in bx:
        vv, uu = np.mgrid[b0:b1, a0:a1]
        row = vv // 4; joint = (vv % 4 == 0) | ((uu + (row % 2) * 5) % 10 == 0)
        s = tex[b0:b1, a0:a1]; m = mask[b0:b1, a0:a1]
        s[m] = np.where(joint, K_('D'), K_('R'))[m]


def window(tex, rnd, u0, u1, v0, v1, kind, light, dark, base, state, shutters):
    """Jedno okno: rám, tabule s křížem, parapet; stav okna: sklo, vybité, zatlučené, okenice, svíčka."""
    w, h = u1 - u0, v1 - v0
    tex[v0 - 1:v1 + 1, u0 - 1:u1 + 1] = K_(light)
    tex[v0 - 2, u0 - 2:u1 + 2] = K_(dark); tex[v0 - 1, u0 - 2:u1 + 2] = K_(light)          # parapet a stín pod ním
    if kind in ('lintel', 'arch'): tex[v1 + 1, u0 - 2:u1 + 2] = K_(light); tex[v1 + 2, u0 - 2:u1 + 2] = K_(dark) if kind == 'lintel' else K_(light)
    if kind == 'arch' and w >= 5: tex[v1 + 3, u0:u1] = K_(light)
    if kind == 'frame': tex[v0 - 1:v1 + 2, u0 - 2] = K_(dark); tex[v0 - 1:v1 + 2, u1 + 1] = K_(light)
    pane = tex[v0:v1, u0:u1]
    if state == 'boards':
        pane[:] = K_('H'); pane[::3] = K_('h'); pane[:, ::max(3, w // 2)] = K_('K')
    elif state == 'shut':
        pane[:] = K_('H'); pane[::2] = K_('3')
        if w >= 6: pane[:, w // 2] = K_('k')
    else:
        pane[:] = K_('n') if state != 'candle' else K_('f')
        if state == 'candle': pane[:h // 3] = K_('F'); pane[h - 1:] = K_('y')
        if state == 'glass': pane[h // 2:, :max(1, w // 3)] = K_('L')
        if w >= 6: pane[:, w // 2] = K_(light)
        if h >= 12: pane[int(h * 0.62)] = K_(light)
        if state == 'broken':
            pane[:] = K_('k')
            for _ in range(2 + int(rnd() * 3)): pane[int(rnd() * h), int(rnd() * w)] = K_('L')
            if w >= 6 and rnd() < 0.5: pane[: h // 2, w // 2] = K_(light)
        if shutters and state == 'dark' and rnd() < 0.5 and w >= 6:
            pane[:, :w // 2][::2] = K_('H'); pane[:, :w // 2][1::2] = K_('3')


def facade(g, valid):
    """Kresba jedné roviny fasády. tex[v, u]: klíč palety, 0 = průhledné; valid = sloupce, které se kreslí."""
    q = B[g['bid']]; W, H = g['W'], g['H']; su = g['su']
    st = STYLES[q['style']]
    if q['tall']: st = STYLES['stone']
    base, light, dark = (st[2], st[0], st[2]) if g['left'] else (st[0], st[1], st[2])
    if st[2] == 'k': base, light, dark = ('9', '3', 'k') if g['left'] else ('3', '4', '9')
    deep_dark = 'k' if g['left'] else dark
    m = Image.new('L', (W, H), 0); md = ImageDraw.Draw(m)
    for fi in g['faces']:
        P = faces[fi][2]; u = (P[:, :2] @ g['hd'] - g['umin']) * su; v = P[:, 2] * PXM
        md.polygon(list(zip(u.tolist(), v.tolist())), fill=1, outline=1)
    mask = np.array(m, bool) & valid[None, :]
    tex = np.where(mask, K_(base), 0).astype(np.uint8)
    if not mask.any(): return tex, mask
    rs = rng_of(q['seed'], g['i']); rnd = rs.rand
    cols = np.nonzero(mask.any(0))[0]
    topv = np.where(mask.any(0), H - 1 - np.argmax(mask[::-1], axis=0), -1); botv = np.where(mask.any(0), np.argmax(mask, axis=0), H)
    grounded = botv[cols].min() <= 14
    age = q['age']
    integ = np.zeros((H + 1, W + 1), np.int32); integ[1:, 1:] = np.cumsum(np.cumsum(mask, 0), 1)
    full = lambda u0, u1, v0, v1: u0 >= 0 and v0 >= 0 and u1 <= W and v1 <= H and integ[v1, u1] - integ[v0, u1] - integ[v1, u0] + integ[v0, u0] == (u1 - u0) * (v1 - v0)

    rear = g['cap'] and not g.get('front')   # řez uříznutým domem: dvorní fasáda bez parteru a ozdob, víc opadané omítky
    if q.get('recipe', {}).get('type') in ('house', 'classic') and not rear and grounded and not q['tall']: return facade_house(g, q, tex, mask, cols, topv, rnd, full)
    if q.get('recipe', {}).get('type') in ('grid', 'palace', 'curtain', 'ribbon', 'museum') and not rear and grounded: return facade_recipe(g, q, tex, mask, cols, topv, rnd)
    # holá zeď jen u věže a u nízkého štítu nad sousední střechou; vyšší zeď, která začíná nad zemí (za nižším domem),
    # i dvorní zeď na řezu mají okna jako každá jiná, jinak z ulice vypadají jako prázdné plochy
    wall_h = float(topv[cols].max() - botv[cols].min())
    if q['tall'] or (not grounded and wall_h < 2.2 * 44):
        # štít nad sousední střechou, věž: holá zeď se šmouhami (u kamene spáry kvádrů)
        if q['tall']:
            vv, uu = np.mgrid[0:H, 0:W]
            j = ((vv % 14 == 0) | ((uu + ((vv // 14) % 2) * 9) % 18 == 0)) & (rs.rand(H, W) < 0.6)
            tex[mask & j] = K_(dark)
        for u in cols:
            if rnd() < 0.14 + 0.2 * age: n = int(4 + rnd() * (20 + 60 * age)); t = topv[u]; tex[max(0, t - n):t + 1, u][mask[max(0, t - n):t + 1, u]] = K_(dark)
        for _ in range(int(W * H / 2500 * (0.3 + age))): brick(tex, mask, rnd, rnd() * W, rnd() * H, 8 + rnd() * 16, 6 + rnd() * 14, dark)
        for u in cols: tex[topv[u], u] = K_(light)
        if grounded: tex[:5][mask[:5]] = K_(deep_dark)
        return tex, mask

    eave = min(q['eave'], float(topv[cols].max()) / PXM)
    eave_px = int(q['eave'] * PXM)
    gf = 58 if eave_px >= 100 and H > 70 and not rear and grounded else 0
    # činžák a palác s římsou nad 20 m má patra kolem 4,2 m (48 px), nižší staré domy 3,5 m (40 px)
    fl = q.get('fh') or (48 if q['eave'] >= 20 else 40)   # změřená výška patra ze sítě, jinak odhad
    nf = max(1, round((eave_px - gf - 6) / fl)); fh = (eave_px - gf - 6) / nf
    if fh > fl + 10: nf += 1; fh = (eave_px - gf - 6) / nf
    if fh < 30 and nf > 1: nf -= 1; fh = (eave_px - gf - 6) / nf
    if q.get('recipe', {}).get('floors') and not rear and grounded: nf = q['recipe']['floors']; fh = (eave_px - gf - 6) / nf
    fh = max(26, fh)

    # parter: kámen se spárami, hladká omítka, nebo loubí
    if gf:
        pm = mask.copy(); pm[gf:] = False
        if q['parter'] == 'plain':
            tex[pm] = K_(dark)
        else:
            stone, joint = ('P', 'k') if g['left'] else ('p', 'P')
            tex[pm] = K_(stone)
            vv, uu = np.mgrid[0:H, 0:W]
            jw = max(8, int(3.3 * su))
            j = (vv % 15 == 14) | (((uu + ((vv // 15) % 2) * (jw // 2)) % jw == 0))
            tex[pm & j] = K_(joint)
        tex[gf:gf + 2][mask[gf:gf + 2]] = K_(light); tex[gf - 1][mask[gf - 1]] = K_(deep_dark)
    # kordonové římsy
    if q['cordon'] and not rear:
        for f in range(1, 12):
            v = int(gf + 2 + f * fh)
            if v + 2 >= H: break
            tex[v][mask[v]] = K_(light); tex[v - 1][mask[v - 1]] = K_(dark)
    # nárožní bosáž
    if q['quoins'] and W > 40 and not rear:
        for side in (cols[0], cols[-1] - 3):
            for v in range(gf + 4, H - 6, 8):
                o = 0 if (v // 8) % 2 else 2
                s = tex[v:v + 6, max(0, side - o):side + 4 + o]; s[mask[v:v + 6, max(0, side - o):side + 4 + o]] = K_(light)

    # opadaná omítka (před okny, aby okna zůstala celá)
    for _ in range(int(round(W / 64 * (0.5 + age * 1.6) * (2.2 if rear else 1)))):
        brick(tex, mask, rnd, 6 + rnd() * max(1, W - 40), gf + 8 + rnd() * max(1, eave_px - gf - 40), 12 + rnd() * 24, 9 + rnd() * 20, dark)

    # okna: osy po q['cw'] metrech vystředěné v souvislém úseku stěny
    cellw = max(9.0, q['cw'] * su); ww = int(max(3, round(min(1.25 * su, cellw * 0.48)))); wh = int(round(fh * 0.5))
    runs = []; s = cols[0]
    for a, b2 in zip(cols[:-1], cols[1:]):
        if b2 != a + 1: runs.append((s, a + 1)); s = b2
    runs.append((s, cols[-1] + 1))
    burnt = []
    for r0, r1 in runs:
        n = int((r1 - r0 - 4) // cellw)
        if n < 1:
            if r1 - r0 >= ww + 8: n = 1; cw_ = r1 - r0 - 4
            else: continue
        else: cw_ = cellw
        off = r0 + (r1 - r0 - n * cw_) / 2
        door = int(rnd() * n) if gf else -1
        for c in range(n):
            uc = off + (c + 0.5) * cw_; u0 = int(round(uc - ww / 2)); u1 = u0 + ww
            for f in range(0, 14):
                v0 = int(gf + 2 + f * fh + fh * 0.27); v1 = v0 + wh
                if v1 + 6 > H: break
                if not full(u0 - 3, u1 + 3, v0 - 4, v1 + 5): continue
                roll = rnd()
                state = 'broken' if roll < 0.10 + 0.22 * age else 'boards' if roll < 0.20 + 0.36 * age else 'shut' if roll < 0.28 + 0.36 * age and q['shutters'] else 'candle' if roll > 0.988 else 'glass' if roll > 0.9 else 'dark'
                attic = v0 > eave_px - 4
                if attic and (ww < 4 or not full(u0 - 2, u1 + 2, v0 - 3, v0 + wh * 2 // 3 + 3)): continue
                if rear and rnd() < 0.08: continue
                window(tex, rnd, u0, u1, v0, v1 if not attic else v0 + wh * 2 // 3, 'plain' if attic or rear else q['win'], light, dark, base, state, q['shutters'])
                if state == 'broken' and rnd() < 0.45: burnt.append((u0, u1, v1))
                elif rnd() < 0.25 + 0.3 * age:  # stékanec pod parapetem
                    n2 = int(3 + rnd() * 12); uu = u0 + int(rnd() * ww); s2 = tex[max(0, v0 - 2 - n2):v0 - 2, uu]; s2[(s2 == K_(base))] = K_(dark)
            # parter: dveře, výloha, oblouk loubí
            if gf:
                pw = int(min(cw_ - 4, max(ww + 2, cw_ * 0.62))); p0 = int(round(uc - pw / 2)); p1 = p0 + pw; ph = 40
                if not full(p0 - 1, p1 + 1, 0, ph + 4): continue
                if q['parter'] == 'arcade' or c == door:
                    # oblouk: tmavý otvor s půlkruhem nahoře
                    for x in range(p0, p1):
                        t = (x - p0 + 0.5) / pw * 2 - 1; top = int(ph - 9 + 9 * math.sqrt(max(0, 1 - t * t)))
                        tex[3:top, x] = K_('k' if q['parter'] == 'arcade' else 'N'); tex[top, x] = K_(light)
                    if c == door and q['parter'] != 'arcade':
                        tex[3:ph - 12, p0 + 1:p1 - 1] = K_('H'); tex[3:ph - 12, p0 + 1:p1 - 1:3] = K_('K')
                        if rnd() < 0.4: tex[3:ph - 12, p0 + 1:(p0 + p1) // 2] = K_('k')   # vyražené křídlo
                else:
                    roll = rnd()
                    tex[6:ph - 4, p0:p1] = K_('n'); tex[ph - 4, p0 - 1:p1 + 1] = K_(light); tex[5, p0 - 1:p1 + 1] = K_(deep_dark)
                    if roll < 0.4 + 0.3 * age:
                        tex[6:ph - 4, p0:p1] = K_('H'); tex[6:ph - 4:4, p0:p1] = K_('h'); tex[6:ph - 4, p0:p1:5] = K_('K')
                    elif roll < 0.6 + 0.3 * age:
                        tex[6:ph - 4, p0:p1] = K_('k')
                        for _ in range(3): tex[6 + int(rnd() * (ph - 12)), p0 + int(rnd() * pw)] = K_('L')
                    else:
                        tex[6:ph - 4:5, p0:p1] = K_('M'); tex[6:ph - 4, p0:p1:4] = K_('M')   # mříž
    # saze nad vybitým oknem
    for u0, u1, v1 in burnt:
        for v in range(v1 + 1, min(H, v1 + 22)):
            wdt = (1 - (v - v1) / 22)
            for u in range(u0 - 2, u1 + 2):
                if 0 <= u < W and mask[v, u] and rnd() < wdt * 0.85 and tex[v, u] in (K_(base), K_(dark)): tex[v, u] = K_('k')
    # nad skutečnou římsou (změřenou ze sítě) není fasáda, ale mansarda nebo ustupující patro: krytina a vikýře
    # Totéž bez měření: zeď, která pokračuje víc než patro nad římsu domu, je štít, ustupující patro nebo řez střechou.
    roof_px = int(q['cor'] * PXM) if q.get('cor') else eave_px + (0 if g.get('front') else int(fh * 0.9))
    # jen když je to nástavba nad fasádou; zeď, která římsu domu přerůstá skoro dvojnásob, je věž nebo vyšší křídlo
    if not rear and roof_px + 6 < H and roof_px > 0.55 * float(topv[cols].max()):
        eave_px = roof_px
        vv, uu = np.mgrid[0:H, 0:W]
        mz = mask & (vv > eave_px + 2)
        if mz.any():
            cv = COVERS.get(q['cover']) or 'sSa'
            ra, rb = (cv[1], 'k') if g['left'] else (cv[0], cv[1])
            tex[mz] = K_(ra)
            tex[mz & (vv % 5 == 0) & ((uu % 2 == 0) | (not g['left']))] = K_(rb)
            tex[mz & (vv % 5 != 0) & ((uu + (vv // 5) * 3) % 7 == 0)] = K_(rb)
            for dv, colr in ((0, dark), (1, light), (2, light)):
                tex[eave_px + dv][mask[eave_px + dv]] = K_(colr)
            dh = int(min(24, max(12, fh * 0.45)))
            for r0, r1 in runs:
                n = int((r1 - r0 - 4) // cellw)
                if n < 1: continue
                off = r0 + (r1 - r0 - n * cellw) / 2
                for c in range(n):
                    if (c + q['seed']) % 2: continue
                    u0 = int(round(off + (c + 0.5) * cellw - ww / 2)); u1 = u0 + ww; v0 = eave_px + 8
                    if not full(u0 - 2, u1 + 2, v0 - 1, v0 + dh + 3): continue
                    tex[v0 - 1:v0 + dh + 2, u0 - 1:u1 + 1] = K_(light if not g['left'] else dark); tex[v0:v0 + dh, u0:u1] = K_('n')
                    tex[v0 + dh + 1, u0 - 2:u1 + 2] = K_(rb)
    rc = q.get('recipe')
    if rc and rc.get('sign') and not rear and not g['left'] and gf:
        wide = max(runs, key=lambda x: x[1] - x[0]); tw = len(rc['sign']) * 6
        if wide[1] - wide[0] > tw + 16:
            u0 = wide[0] + (wide[1] - wide[0] - tw) // 2
            tex[gf + 3:gf + 14, u0 - 3:u0 + tw + 2][mask[gf + 3:gf + 14, u0 - 3:u0 + tw + 2]] = K_(dark)
            text57(tex, mask, u0, gf + 5, rc['sign'], rc.get('signColor', 'y'))
    # hlavní římsa a šmouhy pod ní, odstřik u země
    for u in cols:
        t = topv[u]
        tex[t, u] = K_(light)
        if t - 1 >= 0 and mask[t - 1, u]: tex[t - 1, u] = K_(light)
        if t - 2 >= 0 and mask[t - 2, u]: tex[t - 2, u] = K_(dark)
        if not rear and t - 3 >= 0 and mask[t - 3, u] and u % 4 < 2: tex[t - 3, u] = K_(light)   # zubořez
        if rnd() < 0.16 + 0.22 * age:
            n = int(4 + rnd() * (14 + 46 * age))
            s = tex[max(0, t - 3 - n):t - 3, u]; s[s == K_(base)] = K_(dark)
        b = botv[u]
        if b < 6:
            n = 4 + int(rnd() * 4); s = tex[b:b + n, u]; s[(s == K_(base)) | (s == K_('p')) | (s == K_('P')) | (s == K_(dark))] = K_(deep_dark)
    # trhliny
    for _ in range(int(W / 90 * (0.4 + age * 1.6) + rnd())):
        cu, cv, drift = int(cols[0] + rnd() * len(cols)), int(gf + rnd() * max(1, eave_px - gf)), 1 if rnd() < 0.5 else -1
        for i in range(int(6 + rnd() * 14)):
            if rnd() < 0.3: drift = -drift
            nu, nv = cu + drift * int(rnd() * 3), cv - 1 - int(rnd() * 3)
            for t in range(cv, max(0, nv), -1):
                uu = int(cu + (nu - cu) * (cv - t) / max(1, cv - nv))
                if 0 <= uu < W and 0 <= t < H and mask[t, uu] and tex[t, uu] == K_(base): tex[t, uu] = K_('k' if i < 5 else dark)
            cu, cv = nu, nv
            if cv < 4: break
    return tex, mask


# ---------------------------------------------------------------- vykreslení
for g in GROUPS:
    # platné sloupce: bod stěny posunutý dovnitř domu leží v kresleném půdorysu
    U = g['umin'] + (np.arange(g['W']) + 0.5) / g['su']
    inset = 0.12 if g['cap'] else 0.35
    pa = g['nh'][0] * (g['off'] - inset) + g['hd'][0] * U; pb = g['nh'][1] * (g['off'] - inset) + g['hd'][1] * U
    ia, ib = cell_of(pa, pb)
    g['kcol'] = K[ia, ib]
    g['tex'], g['mask'] = facade(g, g['kcol'] >= 0)

# tagy: klíč kvádru z osm.mjs nese index tagu, stěnu (R čelo k +b, L bok k −a) a výšku
tagged = 0
for bi, h in enumerate(boxes):
    mt = re.search(r'_t(\d+)([RL])(\d+)$', h['key'])
    if not mt or int(mt.group(1)) >= len(TAGS): continue
    best = None
    for g in GROUPS:
        if g['cap'] or g['left'] != (mt.group(2) == 'L') or B[g['bid']]['tall']: continue
        c = np.nonzero((g['kcol'] == bi) & g['mask'][:60].all(0) if g['H'] > 60 else np.zeros(g['W'], bool))[0]
        if len(c) < 40: continue
        # nejdelší souvislý úsek sloupců
        sp = np.split(c, np.nonzero(np.diff(c) != 1)[0] + 1); run = max(sp, key=len)
        if best is None or len(run) > best[1]: best = (g, len(run), int(run[0]), int(run[-1]) + 1)
    if not best or best[1] < 44: continue
    g = best[0]; s = int(mt.group(1))
    if spray(g['tex'], g['mask'], best[2], best[3], max(6, int(mt.group(3))), TAG_TOP, TAGS[s], TAG_COLORS[(B[g['bid']]['seed'] + s) % len(TAG_COLORS)], B[g['bid']]['seed'] + bi): tagged += 1
print('tagů na fasádách', tagged, flush=True)


# kontrolní list: největší změřené fasády, vlevo narovnaná fotka ze sítě, vpravo co se kreslí (stejné měřítko)
if MEASURED:
    big = sorted([g for g in MEASURED if g.get('tex') is not None and (g['tex'] > 0).sum() > 0.5 * g['W'] * g['H']], key=lambda g: (-g['H'] if '--vysoke' in sys.argv else -g['W'] * g['H']))[:30]
    Wt = 2400; x = y = rowh = 0; place_ = []
    for g in big:
        if x + 2 * g['W'] + 12 > Wt: x = 0; y += rowh + 8; rowh = 0
        place_.append((g, x, y)); x += 2 * g['W'] + 12; rowh = max(rowh, g['H'])
    sheet = Image.new('RGB', (Wt, y + rowh + 8), (20, 20, 24)); dr = ImageDraw.Draw(sheet)
    for g, x, y in place_:
        q = B[g['bid']]; hh = min(g['H'], g['tex'].shape[0])
        sheet.paste(Image.fromarray(g['ph'][::-1]), (x, y)); sheet.paste(Image.fromarray(LUT[g['tex'][:hh]][::-1, :, :3]), (x + g['W'] + 4, y + g['H'] - hh))
        ev = y + g['H'] - int(q['eave'] * PXM); dr.line([(x, ev), (x + 2 * g['W'] + 4, ev)], fill=(255, 0, 0))
        if g.get('cor'): dr.line([(x, y + g['H'] - g['cor']), (x + 2 * g['W'] + 4, y + g['H'] - g['cor'])], fill=(0, 255, 255))
        dr.text((x + 2, y + 2), f"{g['bid']} {q['style']} patro {g['fh']} ({g['fs']:.2f}) → {q.get('fh', 0):.0f} px, římsa {q['eave']:.0f} m", fill=(255, 255, 0))
    sheet.save(os.path.join(MESH_DIR, f'fasady-{name}.png'))


HMAX = max(q['zmax'] - q['base'] for q in B.values() if q.get('sel')) + 2
canv = []
for h in boxes:
    a0, a1, b0, b1 = h['a0'] - 0.5, h['a0'] + h['w'] + 0.5, h['b0'] - 0.5, h['b0'] + h['dpt'] + 0.5
    x0 = int((a0 + b0 - 1) * 64) - 24; x1 = int((a1 + b1 - 1) * 64) + 24
    y0 = int((b0 - a1) * 32 - HMAX * PXM) - 8; y1 = int((b1 - a0) * 32) + 8
    canv.append({'x0': x0, 'y0': y0, 'img': np.zeros((y1 - y0, x1 - x0), np.uint8), 'z': np.full((y1 - y0, x1 - x0), -1e9, np.float32)})
sun = np.array([-0.45, -0.5, 0.74]); sun /= np.linalg.norm(sun)
drawn = 0
for fi, (typ, bid, P) in enumerate(faces):
    q = B[bid]
    if typ == 'Zakladova deska' or not q.get('sel'): continue
    n = normal(P)
    if n is None: continue
    wall = abs(n[2]) < 0.25
    g = face_group.get(fi)
    if typ in ('Stena', 'Rez'):
        if g is None: continue
    elif wall:
        if n[1] - n[0] < 0: n = -n
        if n[1] - n[0] < 0.06: continue
    elif n[2] < 0: n = -n
    x = (P[:, 0] + P[:, 1]) * SP - 64; y = (P[:, 1] - P[:, 0]) * SP / 2 - P[:, 2] * PXM
    X0, X1, Y0, Y1 = int(math.floor(x.min())), int(math.ceil(x.max())) + 1, int(math.floor(y.min())), int(math.ceil(y.max())) + 1
    if X1 - X0 < 1 or Y1 - Y0 < 1: continue
    m = Image.new('L', (X1 - X0, Y1 - Y0), 0); ImageDraw.Draw(m).polygon(list(zip((x - X0).tolist(), (y - Y0).tolist())), fill=1, outline=1)
    mask = np.array(m, bool)
    hd = g['hd'] if g else (np.array([-n[1], n[0]]) / max(1e-6, math.hypot(n[0], n[1])) if math.hypot(n[0], n[1]) > 1e-6 else np.array([1.0, 0.0]))
    u = P[:, :2] @ hd; depth = P[:, 1] - P[:, 0] + CAM * P[:, 2]
    A = np.column_stack([x, y, np.ones(len(x))])
    if np.linalg.matrix_rank(A, tol=1e-3) < 3: continue
    coef, *_ = np.linalg.lstsq(A, np.column_stack([depth, P[:, 2], u, P[:, 0], P[:, 1]]), rcond=None)
    yy, xx = np.mgrid[Y0:Y1, X0:X1]
    val = np.stack([xx + 0.5, yy + 0.5, np.ones_like(xx)], -1).astype(np.float64) @ coef
    D, Z, U, PA, PB = (val[..., k] for k in range(5))
    if bid in SINK: mask &= Z > -0.05
    if g:
        ui = np.clip(((U - g['umin']) * g['su']).astype(np.int64), 0, g['W'] - 1); vi = np.clip((Z * PXM).astype(np.int64), 0, g['H'] - 1)
        key = g['tex'][vi, ui]
        mask &= key > 0
        boxid = g['kcol'][ui]
    else:
        ins = 0.3 if wall else 0.0
        ia, ib = cell_of(PA - n[0] * ins, PB - n[1] * ins)
        boxid = K[ia, ib]
        st = STYLES['stone' if q['tall'] else q['style']]
        if wall:
            # vikýře a komíny: čelo vikýře má okno, komín je z cihel
            wd = u.max() - u.min(); ht = P[:, 2].max() - P[:, 2].min()
            left = -n[0] > n[1]
            key = np.full(mask.shape, K_(st[2] if left else st[0]) if st[2] != 'k' else K_('3'), np.uint8)
            if wd < 1.3 or (ht > 1.6 * wd and wd < 2.2):
                key[:] = K_('D' if left else 'R'); key[(np.floor(Z / 0.3).astype(int) % 2 == 0) & (hsh(np.floor(U * 4).astype(int), np.floor(Z * 4).astype(int), bid) < 0.5)] = K_('D' if not left else 'k')
            elif 0.9 <= wd <= 3.6 and ht >= 0.9 and not left:
                uu = (U - u.min()) / wd; zz = (Z - P[:, 2].min()) / ht
                key[(uu > 0.22) & (uu < 0.78) & (zz > 0.2) & (zz < 0.8)] = K_('n')
                key[(uu > 0.22) & (uu < 0.78) & (np.abs(zz - 0.82) < 0.04)] = K_(st[1])
        else:
            cov = COVERS.get(q['cover']); age = q['age']
            lit = float(n @ sun)
            if n[2] > 0.985:
                top_ = cov[2] if cov else 'x'; dk = FLAT_DARK.get(top_, 'P')
                key = np.full(mask.shape, K_(top_), np.uint8)
                key[(PA % 1.0) < 0.12] = K_(dk)
                key[hsh(np.floor(PA / 1.7).astype(int), np.floor(PB / 1.3).astype(int), bid) < 0.14 + 0.25 * age] = K_(dk)
                key[hsh(np.floor(PA * 3).astype(int), np.floor(PB * 3).astype(int), bid + 9) < 0.02 + 0.03 * age] = K_('G')
            else:
                ca_, cb_ = (cov[0], cov[1]) if cov else ('d', 'D')
                if typ == 'Detail' and not cov: ca_, cb_ = 's', 'S'
                if q['tall']: ca_, cb_ = 's', 'S'
                cl = COVER_LIGHT.get(ca_, ca_)
                row = np.floor(Z / 0.32).astype(int); col = np.floor((U + (row % 2) * 0.22) / 0.44).astype(int)
                r = hsh(row, col, bid)
                if lit > 0.72: pl, pd, basec = 0.14, 0.08 + 0.22 * age, ca_
                elif lit > 0.5: pl, pd, basec = 0.04, 0.24 + 0.22 * age, ca_
                else: pl, pd, basec = 0.0, 0.0, cb_
                key = np.full(mask.shape, K_(basec), np.uint8)
                key[r < pl] = K_(cl); key[r > 1 - pd] = K_(cb_)
                if basec != cb_: key[(Z / 0.32 - row) < 0.2] = K_(cb_)
                else: key[r < 0.12] = K_(ca_); key[((Z / 0.32 - row) < 0.2) & (r > 0.7)] = K_('k')
                zl = Z - P[:, 2].min()
                key[(zl < 0.45) & (hsh(col, row * 0, bid + 3) < 0.2 + 0.4 * age)] = K_('G')
                hole = (hsh(np.floor(U / 2.4).astype(int), np.floor(Z / 1.7).astype(int), bid + 17) < 0.012 + 0.05 * age) & (zl > 0.6) & (typ == 'Strecha')
                key[hole] = K_('k'); key[hole & (row % 3 == 0)] = K_('H')
                # obrys plochy: hřeben a nároží světlejší, úžlabí a okap tmavší
                er = mask.copy(); er[1:] &= mask[:-1]; er[:-1] &= mask[1:]; er[:, 1:] &= mask[:, :-1]; er[:, :-1] &= mask[:, 1:]
                edge = mask & ~er
                key[edge & (Z > P[:, 2].max() - 0.25)] = K_(cl if basec != cb_ else ca_)
                key[edge & (zl < 0.2)] = K_('k' if basec == cb_ else cb_)
    for bi in np.unique(boxid[mask]):
        if bi < 0: continue
        c = canv[bi]; sel = mask & (boxid == bi)
        ys, xs = np.nonzero(sel)
        cy, cx = ys + Y0 - c['y0'], xs + X0 - c['x0']
        ok = (cy >= 0) & (cx >= 0) & (cy < c['img'].shape[0]) & (cx < c['img'].shape[1])
        ys, xs, cy, cx = ys[ok], xs[ok], cy[ok], cx[ok]
        dd = D[ys, xs]; near = dd > c['z'][cy, cx] + 1e-4
        c['img'][cy[near], cx[near]] = key[ys[near], xs[near]]; c['z'][cy[near], cx[near]] = dd[near]
    drawn += 1
print('vykresleno ploch', drawn, flush=True)

# ---------------------------------------------------------------- listy a data pro hru
sprites = []
empty = []
for bi, (h, c) in enumerate(zip(boxes, canv)):
    ys, xs = np.nonzero(c['img'])
    if len(ys) < 200: empty.append(bi); continue
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    img = LUT[c['img'][y0:y1, x0:x1]]
    ax = (h['a0'] + h['b0'] + h['dpt'] - 1) * 64; ay = (h['b0'] + h['dpt'] - h['a0']) * 32
    foot = ay - (c['y0'] + y0)   # výška spritu nad kotvou
    sprites.append({'bi': bi, 'img': img, 'ox': int(ax - (c['x0'] + x0)), 'oy': int(ay - (c['y0'] + y0)), 'tall': int(max(40, foot - 32 * (h['w'] + h['dpt']) / 2))})
for f in glob.glob(os.path.join(ROOT, f'static/images/domy_{name}_*')): os.remove(f)
SHEET = 2048
order = sorted(sprites, key=lambda s: -s['img'].shape[0])
sheets_out = []; cur = None
for s in order:
    hh, ww = s['img'].shape[:2]
    if ww + 2 > SHEET or hh + 2 > SHEET: sys.exit(f'sprite kvádru {s["bi"]} je větší než list ({ww} × {hh})')
    placed = False
    for sh in sheets_out:
        for shelf in sh['shelves']:
            if shelf['h'] >= hh and shelf['x'] + ww + 1 <= SHEET: s['sheet'], s['x'], s['y'] = sh['i'], shelf['x'], shelf['y']; shelf['x'] += ww + 1; placed = True; break
        if placed: break
        if sh['y'] + hh + 1 <= SHEET:
            shelf = {'y': sh['y'], 'h': hh, 'x': ww + 1}; sh['shelves'].append(shelf); s['sheet'], s['x'], s['y'] = sh['i'], 0, sh['y']; sh['y'] += hh + 1; placed = True; break
    if not placed:
        sh = {'i': len(sheets_out), 'shelves': [{'y': 0, 'h': hh, 'x': ww + 1}], 'y': hh + 1}; sheets_out.append(sh); s['sheet'], s['x'], s['y'] = sh['i'], 0, 0
out_houses = [None] * len(boxes)
for sh in sheets_out:
    mine = [s for s in sprites if s['sheet'] == sh['i']]
    Wd = max(s['x'] + s['img'].shape[1] for s in mine); Hd = max(s['y'] + s['img'].shape[0] for s in mine)
    sheet = np.zeros((Hd, Wd, 4), np.uint8); frames = {}
    for s in mine:
        hh, ww = s['img'].shape[:2]; sheet[s['y']:s['y'] + hh, s['x']:s['x'] + ww] = s['img']
        key = f'dm{s["bi"]}'
        frames[key] = {'frame': {'x': s['x'], 'y': s['y'], 'w': ww, 'h': hh}, 'rotated': False, 'trimmed': False, 'spriteSourceSize': {'x': 0, 'y': 0, 'w': ww, 'h': hh}, 'sourceSize': {'w': ww, 'h': hh}}
        out_houses[s['bi']] = {'key': key, 'sheet': sh['i'], 'ox': s['ox'], 'oy': s['oy'], 'tall': s['tall']}
    base = os.path.join(ROOT, f'static/images/domy_{name}_{sh["i"]}')
    Image.fromarray(sheet).save(base + '.png', optimize=True)
    json.dump({'frames': frames, 'meta': {'image': f'domy_{name}_{sh["i"]}.png', 'size': {'w': Wd, 'h': Hd}, 'scale': 1}}, open(base + '.json', 'w'))
json.dump({'source': 'IPR Praha, 3D model budov a fotorealistický 3D model (CC BY 4.0)', 'sheets': len(sheets_out), 'houses': out_houses[:NH], 'extras': {e['key']: out_houses[NH + i] for i, e in enumerate(EXTRAS)}}, open(os.path.join(ROOT, f'data/domy-{name}.json'), 'w'), separators=(',', ':'))
print(f'data/domy-{name}.json: {len(sprites)} spritů na {len(sheets_out)} listech, kvádrů bez geometrie (zůstává starý sprite) {len(empty)}: {[(boxes[i]["a0"], boxes[i]["b0"]) for i in empty]}')
