#!/usr/bin/env python3
"""Regenerate every OneRhythm raster asset from svg/1r-mark.svg.

Usage:  python assets/brand/scripts/regenerate.py [--with-wordmark FONT.ttf]

Rasters are derived from the vector source, so edit the SVG (or replace the
master artwork) and re-run this rather than editing PNGs by hand.

--with-wordmark regenerates the social images with "OneRhythm" set beside the
mark. Pass the path to Atkinson Hyperlegible Bold; Brand v3 forbids any other
typeface for the wordmark, so the flag is a no-op without it.
"""
import argparse, os, re, json, sys
import cairosvg
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PULSE = "#E20A17"

src = open(os.path.join(ROOT, "svg", "1r-mark.svg")).read()
vb = re.search(r'viewBox="0 0 ([\d.]+) ([\d.]+)"', src)
W, H = float(vb.group(1)), float(vb.group(2))
paths = re.findall(r'<path d="([^"]+)"', src)
BD, RD = paths[0], paths[1]

def svg(letters, heart, bg, vw, vh, ox, oy, sc):
    bgr = f'<rect width="{vw}" height="{vh}" fill="{bg}"/>' if bg else ""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {vw} {vh}">{bgr}'
            f'<g transform="translate({ox},{oy}) scale({sc})">'
            f'<path d="{BD}" fill="{letters}" fill-rule="evenodd"/>'
            f'<path d="{RD}" fill="{heart}"/></g></svg>')

def render(s, out, w, h=None):
    os.makedirs(os.path.dirname(out), exist_ok=True)
    cairosvg.svg2png(bytestring=s.encode(), write_to=out, output_width=w, output_height=h)

def square(size, cov, bg, out, letters="#000000", heart=PULSE):
    vw = vh = 1000; mw = vw*cov; sc = mw/W; mh = H*sc
    render(svg(letters, heart, bg, vw, vh, (vw-mw)/2, (vh-mh)/2, sc), out, size, size)

def banner(w, h, cov, out, bg="#FFFFFF", letters="#000000", heart=PULSE):
    vw = 1200; vh = int(1200*h/w); mw = vw*cov; sc = mw/W; mh = H*sc
    render(svg(letters, heart, bg, vw, vh, (vw-mw)/2, (vh-mh)/2, sc), out, w, h)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--with-wordmark", metavar="FONT")
    a = ap.parse_args()
    P = lambda *p: os.path.join(ROOT, *p)

    for px in (64,128,256,512,1024,2048):
        render(src, P("png", f"1r-mark-{px}.png"), px, int(px*H/W))

    square(16, 0.95, "#FFFFFF", P("icons","favicon-16x16.png"))
    square(32, 0.95, "#FFFFFF", P("icons","favicon-32x32.png"))
    square(48, 0.92, "#FFFFFF", P("icons","favicon-48x48.png"))
    square(48, 0.92, "#FFFFFF", P("icons","favicon.png"))
    square(180,0.76, "#FFFFFF", P("icons","apple-touch-icon.png"))
    square(192,0.76, "#FFFFFF", P("icons","android-chrome-192x192.png"))
    square(512,0.76, "#FFFFFF", P("icons","android-chrome-512x512.png"))
    square(1024,0.76,"#FFFFFF", P("icons","icon-1024.png"))
    square(512,0.58, "#FFFFFF", P("icons","maskable-512.png"))
    square(1024,0.52, None,     P("icons","adaptive-icon-foreground-1024.png"))
    square(1024,0.40,"#FFFFFF", P("icons","splash-icon-1024.png"))
    Image.open(P("icons","favicon-48x48.png")).convert("RGBA").save(
        P("icons","favicon.ico"), format="ICO", sizes=[(16,16),(32,32),(48,48)])

    banner(1200,630, 0.34, P("social","og-image-1200x630.png"))
    banner(1200,630, 0.34, P("social","og-image-dark-1200x630.png"), bg="#000000", letters="#FFFFFF")
    banner(1200,1200,0.42, P("social","og-square-1200x1200.png"))
    banner(1200,600, 0.34, P("social","twitter-card-1200x600.png"))

    if a.with_wordmark:
        if not os.path.exists(a.with_wordmark):
            sys.exit(f"font not found: {a.with_wordmark}")
        from PIL import ImageDraw, ImageFont
        for name, size, dark in (("og-image-1200x630.png",(1200,630),False),
                                 ("og-image-dark-1200x630.png",(1200,630),True),
                                 ("twitter-card-1200x600.png",(1200,600),False)):
            bg = "#000000" if dark else "#FFFFFF"
            ink = "#FFFFFF" if dark else "#000000"
            canvas = Image.new("RGB", size, bg)
            mw = int(size[0]*0.22); mh = int(mw*H/W)
            tmp = "/tmp/_mark.png"
            render(svg(ink, PULSE, None, W, H, 0, 0, 1), tmp, mw, mh)
            mark = Image.open(tmp).convert("RGBA")
            f = ImageFont.truetype(a.with_wordmark, int(size[1]*0.13))
            d = ImageDraw.Draw(canvas)
            tw = d.textlength("OneRhythm", font=f)
            total = mw + int(size[0]*0.04) + tw
            x = (size[0]-total)/2; y = (size[1]-mh)/2
            canvas.paste(mark, (int(x), int(y)), mark)
            tx = x + mw + size[0]*0.04
            ty = (size[1] - f.size*1.2)/2
            d.text((tx,ty), "One", font=f, fill=ink)
            d.text((tx + d.textlength("One", font=f), ty), "Rhythm", font=f, fill=PULSE)
            canvas.save(os.path.join(ROOT,"social",name))
        print("social images regenerated with wordmark")

    print("assets regenerated from svg/1r-mark.svg")

if __name__ == "__main__":
    main()
