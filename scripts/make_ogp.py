"""シェア用の画像 assets/ogp.png（1200×630）を作る。手元で1回動かすだけ。
フォントは Windows 標準の「BIZ UD明朝」「BIZ UDゴシック」を使う（区のロゴ類は使わない）。"""
import math
import random
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
W, H = 1200, 630
PAPER, CARD, INK, SUB, LINE = "#f7f6f1", "#ffffff", "#1f2937", "#5d6675", "#d6dae1"
GREEN, RED = "#2f8a55", "#c4453a"
MIN = "C:/Windows/Fonts/BIZ-UDMinchoM.ttc"
GOTH = "C:/Windows/Fonts/BIZ-UDGothicR.ttc"
GOTH_B = "C:/Windows/Fonts/BIZ-UDGothicB.ttc"
random.seed(7)

img = Image.new("RGB", (W, H), PAPER)
d = ImageDraw.Draw(img)
# 答案用紙の枠
d.rounded_rectangle([80, 60, W - 80, H - 60], radius=18, fill=CARD, outline=LINE, width=3)


def center(text, font, y, fill=INK):
    w = d.textlength(text, font=font)
    d.text(((W - w) / 2, y), text, font=font, fill=fill)


center("ぶんきょうくみんけんてい", ImageFont.truetype(GOTH, 30), 112, SUB)
center("文京区民検定", ImageFont.truetype(MIN, 120), 150)
# 二重の罫
d.line([(300, 300), (W - 300, 300)], fill=INK, width=3)
d.line([(300, 308), (W - 300, 308)], fill=INK, width=1)
f2 = ImageFont.truetype(GOTH_B, 40)
center("合格しても何ももらえない検定。", f2, 340)
center("1級はまだ誰も受かっていない。", f2, 400)
center("bunkyo-kentei.jp", ImageFont.truetype(GOTH, 28), 488, SUB)


# クレヨンの まる と ばつ（結果画面の楽しさだけ残す）
def crayon_circle(cx, cy, r):
    pts = []
    for i in range(0, 380, 6):
        a = math.radians(i - 100)
        rr = r + random.uniform(-2, 2) + i * 0.02
        pts.append((cx + rr * math.cos(a), cy + rr * math.sin(a)))
    d.line(pts, fill=GREEN, width=10, joint="curve")


crayon_circle(1010, 490, 34)
d.line([(900, 460), (940, 516)], fill=RED, width=9)
d.line([(940, 458), (898, 518)], fill=RED, width=9)

out = ROOT / "assets" / "ogp.png"
img.save(out, optimize=True)
print(out, out.stat().st_size, "bytes")
