"""Generate deterministic vector print proof. pip install qrcode pillow zxing-cpp"""
import argparse
from pathlib import Path
from html import escape
import qrcode
import zxingcpp

parser = argparse.ArgumentParser()
parser.add_argument("--url", default="https://gellert4.github.io/Raceing_webs/")
args = parser.parse_args()
if not args.url.startswith("https://"):
    raise SystemExit("Use an HTTPS destination")
out = Path(__file__).resolve().parents[1] / "public" / "print"
out.mkdir(parents=True, exist_ok=True)
qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_H, box_size=12, border=4)
qr.add_data(args.url)
qr.make(fit=True)
img = qr.make_image(fill_color="black", back_color="white").convert("RGB")
decoded = zxingcpp.read_barcode(img)
assert decoded and decoded.text == args.url, "QR round-trip failed"
img.save(out / "flowstate-qr.png")
matrix = qr.get_matrix()
size = len(matrix)
rects = ''.join(f'<rect x="{x}" y="{y}" width="1" height="1"/>' for y,row in enumerate(matrix) for x,value in enumerate(row) if value)
svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="100mm" height="70mm" viewBox="0 0 1000 700">
<title>FLOWSTATE RACING QR sticker: deployment proof</title><desc>Target: {escape(args.url)}. Verify live URL and physical print before distribution.</desc>
<rect width="1000" height="700" rx="28" fill="#050505"/>
<rect x="26" y="26" width="948" height="648" rx="18" fill="none" stroke="#ed271c" stroke-width="6"/>
<text x="65" y="123" fill="#efefe9" font-family="Arial,sans-serif" font-size="78" font-weight="900" font-style="italic">FLOWSTATE</text>
<text x="68" y="172" fill="#ed271c" font-family="Arial,sans-serif" font-size="30" font-weight="700" letter-spacing="12">RACING</text>
<text x="68" y="315" fill="#efefe9" font-family="Arial,sans-serif" font-size="106" font-weight="900">47°N</text>
<text x="70" y="363" fill="#efefe9" font-family="Arial,sans-serif" font-size="20" letter-spacing="2">EUROPEAN DIVISION</text>
<text x="68" y="475" fill="#efefe9" font-family="Arial,sans-serif" font-size="28" font-weight="700">ENTER THE FLOWSTATE</text>
<text x="68" y="606" fill="#999" font-family="Arial,sans-serif" font-size="17">SCAN / DISCOVER THE DIVISION</text>
<svg x="545" y="213" width="380" height="380" viewBox="0 0 {size} {size}" shape-rendering="crispEdges"><rect width="{size}" height="{size}" fill="white"/><g fill="black">{rects}</g></svg>
</svg>'''
(out / "flowstate-qr-sticker.svg").write_text(svg, encoding="utf-8")
print(f"QR verified: {decoded.text}; matrix {size}×{size}; print proof at {out}")
