#!/usr/bin/env python3
"""Generate the 16 scroll-story frames via Pollinations (free flux endpoint).

Fallback path per frontend-plan.md §8: runcomfy account is out of credits,
so drafts are generated here instead. Prompts follow the plan's locked
style template + per-frame subjects. 1536x864 masters, seeded per frame
for reproducibility. When runcomfy is topped up, re-run its 9B finals with
the previous-frame style reference for tighter drift control.
"""
import json
import pathlib
import time
import urllib.parse
import urllib.request

OUT = pathlib.Path(__file__).resolve().parents[1] / "public" / "story" / "final"
OUT.mkdir(parents=True, exist_ok=True)

STYLE = (
    "Cinematic macro photograph, museum-gallery minimalism, deep charcoal background, "
    "a single source of deep blue light with subtle white rim light, shallow depth of field, "
    "subject centered with safe margins, Apple product photography style, no text, no logos, no watermark."
)

SUBJECTS = [
    "scattered clinical datapoints as small glowing nodes on a dark surface, one node ignites brighter",
    "a single patient record materializing as a translucent card of light",
    "hundreds of light points flowing into one luminous stream",
    "a stream of light funneling through a tall glass prism, many beams in, fewer beams out",
    "eight glowing spheres in a precise horizontal row above a dark reflective surface",
    "eight luminous spheres rising into a wireframe lattice sphere",
    "delicate threads of blue light connecting eight glowing nodes in a network",
    "an intricate glowing lattice circuit with concentric ripple waves of light",
    "vertical bars of blue light condensing out of drifting measurement particles",
    "a stream of light splitting into two parallel glass tracks",
    "two luminous reconstructions side by side, one a grid of medical chart lines, one an interference pattern",
    "two parallel light tracks reconverging into a single bright line",
    "a glowing semicircular gauge arc crystallizing above a dark surface",
    "three pillars of soft light rising from a dark floor",
    "a translucent interface wireframe materializing in dark space",
    "a final beauty shot of a glowing blue arc resting on a dark pedestal",
]


def gen(n: int, subject: str, retries: int = 4) -> pathlib.Path:
    seed = 26090 + n  # stable per-frame seed
    prompt = urllib.parse.quote(f"{STYLE} {subject}")
    url = (
        f"https://image.pollinations.ai/prompt/{prompt}"
        f"?width=1536&height=864&seed={seed}&nologo=true&model=flux&safe=false"
    )
    dest = OUT / f"frame-{n:02d}.jpg"
    for attempt in range(1, retries + 1):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "qml-frontend/1.0"})
            with urllib.request.urlopen(req, timeout=120) as r:
                data = r.read()
            if len(data) < 10_000:
                raise RuntimeError(f"suspiciously small payload ({len(data)}B)")
            dest.write_bytes(data)
            print(f"frame {n:02d} ok  {len(data)//1024} KB")
            return dest
        except Exception as e:  # noqa: BLE001
            print(f"frame {n:02d} attempt {attempt} failed: {e}")
            time.sleep(3 * attempt)
    raise SystemExit(f"frame {n:02d} failed after {retries} attempts")


def main() -> None:
    t0 = time.time()
    for n, subject in enumerate(SUBJECTS, start=1):
        dest = OUT / f"frame-{n:02d}.jpg"
        if dest.exists() and dest.stat().st_size > 10_000:
            print(f"frame {n:02d} exists, skipping")
            continue
        gen(n, subject)
        time.sleep(2)  # be polite to the free endpoint
    manifest = [{"n": n, "subject": s} for n, s in enumerate(SUBJECTS, start=1)]
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2))
    print(f"done in {time.time() - t0:.0f}s -> {OUT}")


if __name__ == "__main__":
    main()