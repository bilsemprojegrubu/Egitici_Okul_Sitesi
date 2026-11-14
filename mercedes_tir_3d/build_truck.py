#!/usr/bin/env python3
"""Mercedes-Benz Actros tarzi tir (cekici + dorse) - cok renkli, parcali 3D model.
Olcek ~1:100 (1 birim = 1 mm).  Her renk ayri STL; ayrica renkli 3MF.
Calistir:  python3 build_truck.py
"""
import math, os, struct, zipfile
import numpy as np

OUT = os.path.dirname(os.path.abspath(__file__))
N = 36  # silindir cozunurlugu


# ---------------------------------------------------------------- mesh araclari
class Mesh:
    def __init__(self, v=None, f=None):
        self.v = np.zeros((0, 3)) if v is None else np.asarray(v, float)
        self.f = np.zeros((0, 3), int) if f is None else np.asarray(f, int)

    def copy(self):
        return Mesh(self.v.copy(), self.f.copy())


def fix(m):
    v = m.v[m.f]
    vol = np.einsum('ij,ij->i', v[:, 0], np.cross(v[:, 1], v[:, 2])).sum() / 6
    if vol < 0:
        m.f = m.f[:, [0, 2, 1]]
    return m


def merge(ms):
    vs, fs, o = [], [], 0
    for m in ms:
        vs.append(m.v); fs.append(m.f + o); o += len(m.v)
    return Mesh(np.vstack(vs), np.vstack(fs))


def rot_x(a): c, s = math.cos(a), math.sin(a); return np.array([[1, 0, 0], [0, c, -s], [0, s, c]])
def rot_y(a): c, s = math.cos(a), math.sin(a); return np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]])
def rot_z(a): c, s = math.cos(a), math.sin(a); return np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]])


def tf(m, R=None, t=(0, 0, 0)):
    v = m.v if R is None else m.v @ R.T
    return Mesh(v + np.array(t, float), m.f.copy())


def prism(poly, w0, w1):
    """Convex CCW poligon (u,v), w ekseninde (z) uzatilir."""
    n = len(poly)
    v = [(u, vv, w0) for u, vv in poly] + [(u, vv, w1) for u, vv in poly]
    f = []
    for i in range(1, n - 1):
        f.append((0, i + 1, i)); f.append((n, n + i, n + i + 1))
    for i in range(n):
        j = (i + 1) % n
        f.append((i, j, n + j)); f.append((i, n + j, n + i))
    return fix(Mesh(v, f))


def box(cx, cy, cz, sx, sy, sz):
    m = prism([(-sx / 2, -sy / 2), (sx / 2, -sy / 2), (sx / 2, sy / 2), (-sx / 2, sy / 2)], -sz / 2, sz / 2)
    return tf(m, None, (cx, cy, cz))


def cyl_z(r, h, n=N):
    poly = [(r * math.cos(2 * math.pi * i / n), r * math.sin(2 * math.pi * i / n)) for i in range(n)]
    return prism(poly, -h / 2, h / 2)


def annulus_z(ro, ri, h, n=N):
    z0, z1 = -h / 2, h / 2
    v, f = [], []
    for z in (z0, z1):
        for r in (ro, ri):
            for i in range(n):
                a = 2 * math.pi * i / n
                v.append((r * math.cos(a), r * math.sin(a), z))
    ob, ib, ot, it = 0, n, 2 * n, 3 * n
    for i in range(n):
        j = (i + 1) % n
        f += [(ob + i, ob + j, ot + j), (ob + i, ot + j, ot + i)]          # dis
        f += [(ib + j, ib + i, it + i), (ib + j, it + i, it + j)]          # ic
        f += [(ot + i, ot + j, it + j), (ot + i, it + j, it + i)]          # ust
        f += [(ob + j, ob + i, ib + i), (ob + j, ib + i, ib + j)]          # alt
    return fix(Mesh(v, f))


def prism_xz(poly, y0, y1):
    """(x,z) profilini y ekseninde uzat."""
    m = prism(poly, y0, y1)
    return fix(Mesh(m.v[:, [0, 2, 1]], m.f))


def cyl_y(cx, cy, cz, r, L, ri=None):
    m = annulus_z(r, ri, L) if ri else cyl_z(r, L)
    return tf(m, rot_x(-math.pi / 2), (cx, cy, cz))


def cyl_x(cx, cy, cz, r, L, ri=None):
    m = annulus_z(r, ri, L) if ri else cyl_z(r, L)
    return tf(m, rot_y(math.pi / 2), (cx, cy, cz))


def cyl_zc(cx, cy, z0, z1, r):
    return tf(cyl_z(r, z1 - z0), None, (cx, cy, (z0 + z1) / 2))


# ---------------------------------------------------------------- olculer
CAB_W = 25.0
CAB_Z = 11.0                       # kabin tabani
HALF = CAB_W / 2
R_TIRE, R_TIRE_IN, W_TIRE = 4.6, 3.3, 3.6
R_RIM, R_HOLE, R_AXLE = 3.2, 1.15, 1.0
Y_WHEEL = 11.0
AXLE_Z = R_TIRE
TRACTOR_AXLES = [22.0, -8.0, -19.0]
TRAILER_FRONT, TRAILER_REAR = -9.5, -145.5
TRAILER_AXLES = [-116.0, -127.0, -138.0]
KINGPIN_X = -13.5
DECK0, DECK1 = 11.7, 13.2
BODY_TOP = 40.2

parts = {}      # isim -> dict(mesh, color, print=<mesh>)


def add(name, color, mesh, print_mesh=None):
    parts[name] = dict(mesh=mesh, color=color, print=print_mesh)


# ---------------------------------------------------------------- KABIN (beyaz)
cab_prof = [(0, 0), (32, 0), (32, 15), (28, 28), (2, 28), (0, 26)]
cab = tf(prism_xz(cab_prof, -HALF, HALF), None, (0, 0, CAB_Z))
spoiler = tf(prism_xz([(2, 27.8), (26, 27.8), (26, 29), (2, 33)], -HALF + 0.5, HALF - 0.5), None, (0, 0, CAB_Z))
# yan hava kanatlari (kabin yanlari)
_unused = [tf(prism_xz([(2, 20), (14, 20), (14, 27.8), (2, 33)], s * HALF - 0.4 if s > 0 else -HALF - 0.4, s * HALF + 0.4 if s > 0 else -HALF + 0.4), None, (0, 0, CAB_Z)) for s in (1, -1)]
add('01_kabin_beyaz', (240, 240, 240), merge([cab, spoiler]))

# ---------------------------------------------------------------- CAM / PENCERELER (siyah)
a_ws = math.atan2(4, 13)
d = np.array([-4, 13]) / math.hypot(4, 13)
n_out = np.array([13, 4]) / math.hypot(4, 13)
ws_c = np.array([32, 15 + 0]) + d * 6.9 + n_out * 0.25      # egimin ortasi
ws_len = 11.2
ws_wind = tf(box(0, 0, 0, 1.0, 21.0, ws_len), rot_y(-a_ws), (ws_c[0], 0, CAB_Z + ws_c[1]))
side_w = [box(20.0, s * (HALF + 0.15), CAB_Z + 18.0, 13.0, 0.8, 11.0) for s in (1, -1)]
add('02_camlar_siyah', (25, 25, 30), merge([ws_wind] + side_w),
    print_mesh=None)  # asagida duz yatik olarak olusturulur

# ---------------------------------------------------------------- IZGARA + YILDIZ (gumus)
bars = [box(32.4, 0, CAB_Z + zz, 0.8, 17.0, 0.7) for zz in (3.2, 4.7, 6.2, 7.7, 9.2)]
frame = [box(32.4, s * 8.5, CAB_Z + 6.2, 0.8, 0.7, 6.7) for s in (1, -1)]
star_ring = tf(annulus_z(2.7, 2.1, 0.8), rot_y(math.pi / 2), (32.7, 0, CAB_Z + 6.2))
spokes = []
for ang in (90, 210, 330):
    a = math.radians(ang)
    L = 2.1
    # z eksenli cubugu x etrafinda dondur, merkezi yariciap/2'ye tasi
    sp = box(0, 0, L / 2, 0.8, 0.6, L)
    R = rot_x(math.radians(ang - 90))          # +z -> ang yonu
    spokes.append(tf(sp, R, (32.7, 0, CAB_Z + 6.2)))
add('03_izgara_yildiz_gumus', (200, 200, 205), merge(bars + frame + [star_ring] + spokes))

# ---------------------------------------------------------------- FARLAR (sari)
heads = [box(32.4, s * 10.9, CAB_Z + 3.5, 0.8, 3.0, 2.6) for s in (1, -1)]
roof_l = [box(25.4, yy, CAB_Z + 29.5, 1.2, 1.4, 0.9) for yy in (-6, -3, 0, 3, 6)]
add('04_farlar_sari', (255, 190, 40), merge(heads + roof_l))

# ---------------------------------------------------------------- TAMPON + AYNALAR (siyah)
bumper = box(33.6, 0, 8.2, 3.6, CAB_W, 3.6)
mirrors = []
for s in (1, -1):
    mirrors.append(box(29.5, s * 14.0, CAB_Z + 20.5, 1.0, 3.0, 1.0))
    mirrors.append(box(29.5, s * 15.6, CAB_Z + 22.0, 1.6, 0.9, 8.0))
add('05_tampon_ayna_siyah', (35, 35, 38), merge([bumper] + mirrors))

# ---------------------------------------------------------------- CEKICI SASE (gri)
ch = []
for s in (1, -1):
    ch.append(box(-4, s * 5.25, 7.0, 76, 2.5, 2.0))                # ana raylar x -42..34
ch += [box(xx, 0, 7.0, 1.6, 12, 2.0) for xx in (-40, -22, 0, 30)]
ch.append(box(15, 0, CAB_Z - 1.5, 30, 16, 3.0))                    # kabin altlik / motor blogu
ch.append(box(-13.5, 0, 9.0, 17, 17, 2.0))                         # besinci teker plakasi
for ax in TRACTOR_AXLES:
    ch.append(cyl_y(ax, 0, AXLE_Z, R_AXLE, 2 * (Y_WHEEL + W_TIRE / 2)))
for s in (1, -1):
    ch.append(cyl_x(9, s * 8.4, 6.6, 2.3, 12))                     # yakit depolari
# besinci teker deligi icin plaka uzerine halka (guide) -> kingpin icin delik yerine kilavuz halka
# (delik mesh'te acilamadigi icin plaka iki parcadan olusturuldu)
plate = []
px0, px1, py = -22.0, -5.0, 8.5
hole_r = 1.5
# plakayi, delik acik kalacak sekilde 4 parcaya bol
plate_parts = [
    box((px0 + (KINGPIN_X - hole_r)) / 2, 0, 9.0, (KINGPIN_X - hole_r) - px0, 2 * py, 2.0),
    box(((KINGPIN_X + hole_r) + px1) / 2, 0, 9.0, px1 - (KINGPIN_X + hole_r), 2 * py, 2.0),
    box(KINGPIN_X, (hole_r + py) / 2, 9.0, 2 * hole_r, py - hole_r, 2.0),
    box(KINGPIN_X, -(hole_r + py) / 2, 9.0, 2 * hole_r, py - hole_r, 2.0),
]
# 5. teker plakasini listeden cikar (yukaridaki tam plaka) ve bolunmus halini ekle
ch = [m for m in ch if not (abs(m.v[:, 0].min() - (-22.0)) < 1e-6 and abs(m.v[:, 0].max() - (-5.0)) < 1e-6)]
ch += plate_parts
add('06_cekici_sase_gri', (110, 112, 118), merge(ch))

# ---------------------------------------------------------------- LASTIKLER (siyah) + JANTLER (gumus)
wheel_pos = []
for ax in TRACTOR_AXLES:
    for s in (1, -1):
        wheel_pos.append((ax, s * Y_WHEEL))
for ax in TRAILER_AXLES:
    for s in (1, -1):
        wheel_pos.append((ax, s * Y_WHEEL))


def tire_z():
    return annulus_z(R_TIRE, R_TIRE_IN, W_TIRE)


def rim_z():
    disc = annulus_z(R_RIM, R_HOLE, W_TIRE)
    hubring = tf(annulus_z(1.9, R_HOLE, 0.5), None, (0, 0, W_TIRE / 2 + 0.25))
    ring = tf(annulus_z(R_RIM, 2.7, 0.4), None, (0, 0, W_TIRE / 2 + 0.2))
    return merge([disc, hubring, ring])


tire_list, rim_list = [], []
for (x, y) in wheel_pos:
    tire_list.append(cyl_y(x, y, AXLE_Z, R_TIRE, W_TIRE, ri=R_TIRE_IN))
    # jant: dis yuzeyi disa baksin (hub halkasi +y icin disa, -y icin ice dogru)
    rm = rim_z()
    R = rot_x(-math.pi / 2) if y > 0 else rot_x(math.pi / 2)
    rim_list.append(tf(rm, R, (x, y, AXLE_Z)))


def grid(items_z, cols, pitch):
    out = []
    for i, m in enumerate(items_z):
        r, c = divmod(i, cols)
        out.append(tf(m, None, (c * pitch, r * pitch, 0)))
    return merge(out)


tire_print = grid([tf(tire_z(), None, (0, 0, W_TIRE / 2)) for _ in wheel_pos], 4, R_TIRE * 2 + 3)
rim_print = grid([tf(rim_z(), None, (0, 0, W_TIRE / 2)) for _ in wheel_pos], 4, R_TIRE * 2 + 3)
add('07_lastikler_siyah', (30, 30, 30), merge(tire_list), tire_print)
add('08_jantlar_gumus', (205, 205, 210), merge(rim_list), rim_print)

# ---------------------------------------------------------------- DORSE SASE (koyu gri)
tb = []
tb.append(box((TRAILER_FRONT + TRAILER_REAR) / 2, 0, (DECK0 + DECK1) / 2, TRAILER_FRONT - TRAILER_REAR, CAB_W, DECK1 - DECK0))
for s in (1, -1):
    tb.append(box((-19 + TRAILER_REAR) / 2, s * 3.5, (10.2 + DECK0) / 2, -19 - TRAILER_REAR, 2.0, DECK0 - 10.2))
tb.append(box(-14.25, 0, (10.2 + DECK0) / 2, 9.5, 17, DECK0 - 10.2))               # on plaka (apron)
tb.append(cyl_zc(KINGPIN_X, 0, 7.8, 10.3, 1.2))                                   # kingpin
for ax in TRAILER_AXLES:
    tb.append(cyl_y(ax, 0, AXLE_Z, R_AXLE, 2 * (Y_WHEEL + W_TIRE / 2)))
for s in (1, -1):
    tb.append(box(-48, s * 9, (1.0 + 10.2) / 2, 1.6, 1.6, 10.2 - 1.0))             # ayaklar
    tb.append(box(-48, s * 9, 0.6, 4, 3, 1.2))
tb.append(box(-48, 0, 10.8, 1.2, 18, 1.2))                                         # ayak traversi
tb.append(box(TRAILER_REAR - 1.2, 0, 10.5, 2.0, 22, 1.4))                          # alt koruma bari
add('09_dorse_sase_gri', (70, 72, 78), merge(tb))

# ---------------------------------------------------------------- DORSE KASA (beyaz, ici bos)
bx0, bx1 = TRAILER_REAR, TRAILER_FRONT
t = 1.2
z0, z1 = DECK1, BODY_TOP
body = [
    box((bx0 + bx1) / 2, HALF - t / 2, (z0 + z1) / 2, bx1 - bx0, t, z1 - z0),
    box((bx0 + bx1) / 2, -HALF + t / 2, (z0 + z1) / 2, bx1 - bx0, t, z1 - z0),
    box((bx0 + bx1) / 2, 0, z1 - t / 2, bx1 - bx0, CAB_W - 2 * t, t),
    box(bx1 - t / 2, 0, (z0 + z1 - t) / 2, t, CAB_W - 2 * t, z1 - z0 - t),
    box(bx0 + t / 2, 0, (z0 + z1 - t) / 2, t, CAB_W - 2 * t, z1 - z0 - t),
]
# yan seritler (sureg kasa gorunumu) -> ayni renk, kabartma
ribs = []
for s in (1, -1):
    for zz in (20.0, 27.5, 35.0):
        ribs.append(box((bx0 + bx1) / 2, s * (HALF + 0.2), zz, bx1 - bx0 - 4, 0.4, 0.6))
body_mesh = merge(body + ribs)
body_print = tf(body_mesh, rot_x(math.pi))      # ters cevir: cati tablaya
body_print = tf(body_print, None, (0, 0, -body_print.v[:, 2].min()))
add('10_dorse_kasa_beyaz', (245, 245, 245), body_mesh, body_print)

# ---------------------------------------------------------------- DORSE ARKA STOP (kirmizi)
tails = [box(TRAILER_REAR - 0.3, s * 10.0, 16.5, 0.8, 3.5, 2.2) for s in (1, -1)]
add('11_arka_stop_kirmizi', (210, 20, 20), merge(tails))

# ---------------------------------------------------------------- BASKI YONELIMLERI
def lay(mesh, R):
    m = tf(mesh, R)
    m.v[:, 2] -= m.v[:, 2].min()
    return m


# camlar: duz yatik plakalar
ws_flat = box(0, 0, 0.5, 21.0, ws_len, 1.0)
sw_flat = [box(0, 0, 0.4, 13.0, 11.0, 0.8) for _ in (0, 1)]
glass_print = merge([ws_flat, tf(sw_flat[0], None, (0, 16, 0)), tf(sw_flat[1], None, (0, -16, 0))])
parts['02_camlar_siyah']['print'] = glass_print
parts['03_izgara_yildiz_gumus']['print'] = lay(parts['03_izgara_yildiz_gumus']['mesh'], rot_y(-math.pi / 2))
parts['04_farlar_sari']['print'] = lay(parts['04_farlar_sari']['mesh'], rot_y(-math.pi / 2))
parts['11_arka_stop_kirmizi']['print'] = lay(parts['11_arka_stop_kirmizi']['mesh'], rot_y(math.pi / 2))
for k in ('01_kabin_beyaz', '05_tampon_ayna_siyah', '06_cekici_sase_gri', '09_dorse_sase_gri'):
    parts[k]['print'] = lay(parts[k]['mesh'], None)


# ---------------------------------------------------------------- DOSYA YAZICILAR
def write_stl(path, mesh):
    tri = mesh.v[mesh.f]
    nrm = np.cross(tri[:, 1] - tri[:, 0], tri[:, 2] - tri[:, 0])
    ln = np.linalg.norm(nrm, axis=1, keepdims=True)
    nrm = np.divide(nrm, ln, out=np.zeros_like(nrm), where=ln > 0)
    with open(path, 'wb') as fh:
        fh.write(b'Mercedes tir model'.ljust(80, b'\0'))
        fh.write(struct.pack('<I', len(tri)))
        for n_, t_ in zip(nrm, tri):
            fh.write(struct.pack('<12fH', *n_, *t_.flatten(), 0))


def write_3mf(path, items):
    mats = ''.join(f'<base name="{n}" displaycolor="#{c[0]:02X}{c[1]:02X}{c[2]:02X}FF"/>' for n, c in [(k, v['color']) for k, v in items])
    objs, build = [], []
    for i, (name, p) in enumerate(items):
        m = p['mesh']
        vs = ''.join(f'<vertex x="{x:.4f}" y="{y:.4f}" z="{z:.4f}"/>' for x, y, z in m.v)
        ts = ''.join(f'<triangle v1="{a}" v2="{b}" v3="{c}"/>' for a, b, c in m.f)
        oid = i + 2
        objs.append(f'<object id="{oid}" name="{name}" type="model" pid="1" pindex="{i}"><mesh><vertices>{vs}</vertices><triangles>{ts}</triangles></mesh></object>')
        build.append(f'<item objectid="{oid}"/>')
    model = ('<?xml version="1.0" encoding="UTF-8"?>'
             '<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">'
             f'<resources><basematerials id="1">{mats}</basematerials>{"".join(objs)}</resources>'
             f'<build>{"".join(build)}</build></model>')
    with zipfile.ZipFile(path, 'w', zipfile.ZIP_DEFLATED) as z:
        z.writestr('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/></Types>')
        z.writestr('_rels/.rels', '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/></Relationships>')
        z.writestr('3D/3dmodel.model', model)


def manifold_ok(m):
    e = {}
    for a, b, c in m.f:
        for u, v in ((a, b), (b, c), (c, a)):
            e[(u, v)] = e.get((u, v), 0) + 1
    # kaynak noktalar farkli vertex oldugundan sadece yon tutarliligi: her (u,v) icin (v,u) olmali
    return all(e.get((v, u), 0) == n for (u, v), n in e.items())


if __name__ == '__main__':
    os.makedirs(f'{OUT}/stl_birlesik_konum', exist_ok=True)
    os.makedirs(f'{OUT}/stl_baski_hazir', exist_ok=True)
    items = sorted(parts.items())
    for name, p in items:
        assert manifold_ok(p['mesh']), name
        write_stl(f'{OUT}/stl_birlesik_konum/{name}.stl', p['mesh'])
        write_stl(f'{OUT}/stl_baski_hazir/{name}.stl', p['print'])
        bb = p['mesh'].v
        print(f'{name:28s} tri={len(p["mesh"].f):6d}  boyut(mm)={np.ptp(bb, axis=0).round(1)}')
    write_3mf(f'{OUT}/mercedes_tir_renkli.3mf', items)
    allv = np.vstack([p['mesh'].v for _, p in items])
    print('Toplam boyut (mm):', np.ptp(allv, axis=0).round(1))
