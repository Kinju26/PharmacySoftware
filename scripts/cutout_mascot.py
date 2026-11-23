from pathlib import Path

import numpy as np
from PIL import Image

src = Path(r"c:\Users\rvm\Desktop\PharmacySoftware\public\mascot.png")
# Prefer original solid webp if present so we always cut from clean source
webp = Path(r"c:\Users\rvm\Desktop\PharmacySoftware\public\images\loading-mascot.webp")
img = Image.open(webp if webp.exists() else src).convert("RGBA")
arr = np.array(img)

corners = np.array(
    [arr[5, 5, :3], arr[5, -5, :3], arr[-5, 5, :3], arr[-5, -5, :3]],
    dtype=np.float32,
)
bg = np.median(corners, axis=0)
print("bg", bg)

rgb = arr[:, :, :3].astype(np.float32)
diff = np.linalg.norm(rgb - bg, axis=2)

alpha = np.full(diff.shape, 255.0, dtype=np.float32)
alpha[diff < 30] = 0
soft = (diff >= 30) & (diff < 58)
alpha[soft] = (diff[soft] - 30) / 28 * 255

r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
is_bright_blue = (b > 90) & (b > r + 12) & (b > g) & (diff > 15)
is_whiteish = (r > 175) & (g > 175) & (b > 175)
is_green = (g > 75) & (g > r + 15) & (g > b - 10)
is_red = (r > 140) & (r > g + 40) & (r > b + 40)
protect = is_bright_blue | is_whiteish | is_green | is_red
alpha[protect] = np.maximum(alpha[protect], 255)

out = arr.copy()
out[:, :, 3] = alpha.astype(np.uint8)

ys, xs = np.where(out[:, :, 3] > 10)
pad = 8
y0, y1 = max(0, int(ys.min()) - pad), min(out.shape[0], int(ys.max()) + pad + 1)
x0, x1 = max(0, int(xs.min()) - pad), min(out.shape[1], int(xs.max()) + pad + 1)
out = out[y0:y1, x0:x1]

Image.fromarray(out).save(src)
print("saved", src, out.shape, "opaque%", float((out[:, :, 3] > 200).mean()))
