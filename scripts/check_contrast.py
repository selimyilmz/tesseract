"""Verify WCAG 2.1 contrast ratios for CSS custom-property color pairs.

Reads `--token: #rrggbb` declarations from a stylesheet and verifies every
`/* contrast-pair: --fg / --bg [min_ratio] */` annotation. Exits non-zero if
any token is missing, no pairs are declared, or any contrast ratio falls below
its threshold (default 4.5:1 for WCAG AA normal text).
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

TOKEN_RE = re.compile(r"(--[a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{6})\b")
PAIR_RE = re.compile(
    r"contrast-pair:\s*(--[a-z0-9-]+)\s*/\s*(--[a-z0-9-]+)(?:\s+([0-9.]+))?"
)


def channel_luminance(hex_pair: str) -> float:
    srgb = int(hex_pair, 16) / 255.0
    return srgb / 12.92 if srgb <= 0.04045 else ((srgb + 0.055) / 1.055) ** 2.4


def relative_luminance(hex_color: str) -> float:
    h = hex_color.lstrip("#")
    r = channel_luminance(h[0:2])
    g = channel_luminance(h[2:4])
    b = channel_luminance(h[4:6])
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast_ratio(c1: str, c2: str) -> float:
    l1 = relative_luminance(c1)
    l2 = relative_luminance(c2)
    hi, lo = max(l1, l2), min(l1, l2)
    return (hi + 0.05) / (lo + 0.05)


def main(argv: list[str]) -> int:
    if len(argv) != 2:
        print("Usage: python check_contrast.py <path-to-css>", file=sys.stderr)
        return 2
    css_path = Path(argv[1])
    text = css_path.read_text(encoding="utf-8")
    tokens = dict(TOKEN_RE.findall(text))
    pairs = PAIR_RE.findall(text)
    if not pairs:
        print("No contrast-pair annotations found in", css_path, file=sys.stderr)
        return 2

    failures = 0
    for fg, bg, min_str in pairs:
        minimum = float(min_str) if min_str else 4.5
        if fg not in tokens or bg not in tokens:
            print(f"MISSING TOKEN: {fg} or {bg}", file=sys.stderr)
            failures += 1
            continue
        ratio = contrast_ratio(tokens[fg], tokens[bg])
        status = "PASS" if ratio >= minimum else "FAIL"
        print(f"[{status}] {fg} ({tokens[fg]}) on {bg} ({tokens[bg]}): {ratio:.2f}:1 (min {minimum:.1f}:1)")
        if ratio < minimum:
            failures += 1

    if failures:
        print(f"\n{failures} contrast check(s) failed.", file=sys.stderr)
        return 1
    print(f"\nAll {len(pairs)} contrast checks passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
