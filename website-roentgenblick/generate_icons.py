#!/usr/bin/env python3
"""Erzeugt einfache PNG-Icons (Lupe) für die Erweiterung – ohne externe Abhängigkeiten."""
import struct, zlib, math, os

NAVY = (15, 23, 42, 255)        # #0f172a
ACCENT = (56, 189, 248, 255)    # #38bdf8
CLEAR = (15, 23, 42, 255)

def blend(bg, fg, a):
    return tuple(round(bg[i] * (1 - a) + fg[i] * a) for i in range(3)) + (255,)

def make(size):
    cx, cy = size * 0.42, size * 0.42
    r = size * 0.26          # Linsenradius
    ring = max(1.0, size * 0.07)
    # Griff
    hx0, hy0 = cx + r * 0.72, cy + r * 0.72
    hx1, hy1 = size * 0.82, size * 0.82
    hw = max(1.5, size * 0.08)

    px = bytearray()
    for y in range(size):
        px.append(0)  # filter byte
        for x in range(size):
            col = NAVY
            d = math.hypot(x + 0.5 - cx, y + 0.5 - cy)
            # Linsenring
            ring_a = max(0.0, 1.0 - abs(d - r) / ring)
            if ring_a > 0:
                col = blend(col, ACCENT, min(1.0, ring_a))
            # Glas leicht aufhellen
            if d < r - ring * 0.5:
                col = blend(col, ACCENT, 0.12)
            # Griff (Liniensegment)
            dx, dy = hx1 - hx0, hy1 - hy0
            ll = dx * dx + dy * dy
            t = max(0.0, min(1.0, ((x - hx0) * dx + (y - hy0) * dy) / ll)) if ll else 0
            lx, ly = hx0 + t * dx, hy0 + t * dy
            ld = math.hypot(x + 0.5 - lx, y + 0.5 - ly)
            handle_a = max(0.0, 1.0 - max(0.0, ld - hw / 2))
            if handle_a > 0:
                col = blend(col, ACCENT, min(1.0, handle_a))
            px.extend(col)
    raw = bytes(px)

    def chunk(tag, data):
        c = tag + data
        return struct.pack(">I", len(data)) + c + struct.pack(">I", zlib.crc32(c) & 0xffffffff)

    sig = b"\x89PNG\r\n\x1a\n"
    ihdr = struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)  # 8-bit RGBA
    idat = zlib.compress(raw, 9)
    return sig + chunk(b"IHDR", ihdr) + chunk(b"IDAT", idat) + chunk(b"IEND", b"")

here = os.path.join(os.path.dirname(__file__), "icons")
os.makedirs(here, exist_ok=True)
for s in (16, 48, 128):
    with open(os.path.join(here, f"icon{s}.png"), "wb") as f:
        f.write(make(s))
    print(f"icon{s}.png geschrieben")
