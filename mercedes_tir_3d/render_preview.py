import sys, math, numpy as np
import matplotlib; matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.collections import PolyCollection
import build_truck as bt

def render(ax, az, el, path):
    az, el = math.radians(az), math.radians(el)
    R = np.array([[math.cos(az), math.sin(az), 0], [-math.sin(az), math.cos(az), 0], [0, 0, 1]])
    Ce = np.array([[1, 0, 0], [0, math.sin(el), math.cos(el)], [0, math.cos(el), -math.sin(el)]])
    polys, cols, depth = [], [], []
    L = np.array([0.4, -0.6, 0.7]); L /= np.linalg.norm(L)
    for name, p in bt.parts.items():
        m = p['mesh']; v = m.v @ R.T @ Ce.T
        tri = v[m.f]; wt = m.v[m.f]
        n = np.cross(wt[:, 1]-wt[:, 0], wt[:, 2]-wt[:, 0]); n /= (np.linalg.norm(n, axis=1, keepdims=True)+1e-9)
        sh = 0.45 + 0.55*np.clip(n @ L, 0, 1)
        base = np.array(p['color'])/255
        for t, s, z in zip(tri, sh, tri[:, :, 2].mean(1)):
            polys.append(t[:, :2]); cols.append(np.clip(base*s, 0, 1)); depth.append(z)
    o = np.argsort(depth)
    fig, a = plt.subplots(figsize=(11, 5), dpi=130)
    a.add_collection(PolyCollection([polys[i] for i in o], facecolors=[cols[i] for i in o], edgecolors='none'))
    a.autoscale(); a.set_aspect('equal'); a.axis('off')
    fig.savefig(path, bbox_inches='tight', facecolor='white'); plt.close(fig)


render(0, 145, 22, 'onizleme_3_4.png')
render(0, 180, 0, 'onizleme_yan.png')
