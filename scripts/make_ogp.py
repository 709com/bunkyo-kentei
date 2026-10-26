"""シェア用の画像 assets/ogp.png（1200×630）を作る。手元で1回動かすだけ。
フォントは Windows 標準の「UDデジタル教科書体」を使う（区のロゴ類は使わない）。"""
import math
import random
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
W, H = 1200, 630
PAPER, INK, LINE, PENCIL = "#fffdf6", "#2b2a28", "#cfd6e2", "#6f7d93"
GREEN, RED, YELLOW = "#3f9e60", "#d9584b", "#f4d35e"
FONT = "C:/Windows/Fonts/UDDigiKyokashoN-R.ttc"
FONT_B = "C:/Windows/Fonts/UDDigiKyokashoN-B.ttc"
random.seed(7)

img = Image.new("RGB", (W, H), PAPER)
d = ImageDraw.Draw(img)
for y in range(40, H, 40):
    d.line([(0, y), (W, y)], fill=LINE, width=2)
d.line([(110, 0), (110, H)], fill="#efb3ac", width=3)


def wobbly_rect(x0, y0, x1, y1, width=6):
    pts = []
    for (ax, ay, bx, by) in [(x0, y0, x1, y0), (x1, y0, x1, y1), (x1, y1, x0, y1), (x0, y1, x0, y0)]:
        for i in range(21):
            t = i / 20
            pts.append((ax + (bx - ax) * t + random.uniform(-2.5, 2.5), ay + (by - ay) * t + random.uniform(-2.5, 2.5)))
    d.line(pts + [pts[0]], fill=INK, width=width, joint="curve")


wobbly_rect(150, 70, 1110, 560)
d.polygon([(190, 48), (330, 40), (334, 74), (194, 82)], fill=YELLOW)

# タイトル（すこし かたむける）
title = Image.new("RGBA", (980, 170), (0, 0, 0, 0))
td = ImageDraw.Draw(title)
td.text((10, 10), "ぶんきょうくみんけんてい", font=ImageFont.truetype(FONT_B, 74), fill=INK)
title = title.rotate(2, resample=Image.BICUBIC, expand=True)
img.paste(title, (180, 130), title)

f2 = ImageFont.truetype(FONT, 38)
d.text((215, 290), "ごうかくしても なにも もらえない けんてい。", font=f2, fill=INK)
d.text((215, 352), "1きゅうは まだ だれも うかっていない。", font=f2, fill=INK)
d.text((215, 470), "bunkyo-kentei.jp", font=ImageFont.truetype(FONT, 34), fill=PENCIL)

# クレヨンの まる と ばつ
def crayon_circle(cx, cy, r):
    pts = []
    for i in range(0, 380, 6):
        a = math.radians(i - 100)
        rr = r + random.uniform(-3, 3) + i * 0.02
        pts.append((cx + rr * math.cos(a), cy + rr * math.sin(a)))
    d.line(pts, fill=GREEN, width=14, joint="curve")


crayon_circle(1010, 470, 48)
d.line([(870, 430), (920, 500)], fill=RED, width=12)
d.line([(920, 428), (868, 502)], fill=RED, width=12)

out = ROOT / "assets" / "ogp.png"
img.save(out, optimize=True)
print(out, out.stat().st_size, "bytes")
