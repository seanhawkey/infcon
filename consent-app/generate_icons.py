#!/usr/bin/env python3
"""
Generate all required PWA icon sizes from icon.svg
Run this once after setting up the project:
    pip install cairosvg pillow
    python generate_icons.py
"""

import os

SIZES = [72, 96, 128, 144, 152, 192, 384, 512]
INPUT_SVG = "public/icon.svg"
OUTPUT_DIR = "public/icons"

os.makedirs(OUTPUT_DIR, exist_ok=True)

try:
    import cairosvg
    for size in SIZES:
        out = os.path.join(OUTPUT_DIR, f"icon-{size}.png")
        cairosvg.svg2png(url=INPUT_SVG, write_to=out, output_width=size, output_height=size)
        print(f"✓ Generated {out}")

    # Also generate apple-touch-icon (180x180)
    cairosvg.svg2png(url=INPUT_SVG, write_to="public/apple-touch-icon.png", output_width=180, output_height=180)
    print("✓ Generated public/apple-touch-icon.png")
    print("\nAll icons generated successfully!")

except ImportError:
    print("cairosvg not found. Install it with: pip install cairosvg pillow")
    print("Or use an online SVG-to-PNG converter with the sizes above.")
    print(f"Input file: {INPUT_SVG}")
    print(f"Required sizes: {SIZES}")
