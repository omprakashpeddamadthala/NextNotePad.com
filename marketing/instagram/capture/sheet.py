"""Contact sheet of 12 evenly spaced shots of a clip: python3 sheet.py <clip> <out.png>"""
import json, sys, pathlib
from PIL import Image
d = pathlib.Path(__file__).parent / "frames" / sys.argv[1]
shots = json.load(open(d / "clip.json"))["shots"]
pick = [shots[round(i * (len(shots) - 1) / 11)] for i in range(12)] if len(shots) >= 12 else shots
W, H = 500, 450
sheet = Image.new("RGB", (W * 4, H * 3))
for i, s in enumerate(pick):
    sheet.paste(Image.open(d / s["f"]).resize((W, H)), ((i % 4) * W, (i // 4) * H))
sheet.save(sys.argv[2])
