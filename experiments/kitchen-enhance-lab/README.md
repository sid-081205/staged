# Kitchen "fix lighting" pipeline lab

Live benchmark of four pipeline variations of the **enhance** (fix lighting)
service on a real kitchen photo (`experiments/IMG_1201.jpeg`), run against the
real Cursor Cloud Agents API (`composer-2.5`, repo-less). Companion to
`experiments/pipeline-v2/` (bedroom staging lab).

Open **`index.html`** for the full report: side-by-side outputs, timing bars,
objective luminance/color-cast/sharpness measurements, and the reasoning for
what shipped.

## Contents

- `run.mjs` — harness. Runs one variant N times:
  `CURSOR_API_KEY=... node --experimental-strip-types run.mjs --variant tuned --runs 2 --parallel`
  Variants: `old` (pre-July pipeline), `prod` (shipped pipeline), `lean`
  (no verify step), `tuned` (quality-tuned enhance instruction).
- `runs/` — delivered (dimension-locked) outputs + `timings.json`.
- `input_preprocessed.jpg` — the kitchen photo after `preprocessInput`
  (EXIF-rotated, 1170×864).

## Headline results (10 live renders)

| Variant | Faithful | Time (faithful) | Verdict |
| --- | --- | --- | --- |
| old | 1/2 | 296s | slow; un-gated verify approved a fabricated kitchen |
| prod | 2/2 delivered (2 timeouts) | 168–217s | fast + faithful, occasional stalled agent |
| lean | 1/2 | 138s | fastest but no check — shipped a wrong room once |
| **tuned** | **3/3** | **179–309s (median 180s)** | **shipped**: best white balance, zero failures |

**Shipped change:** the enhance instruction in `lib/config.ts buildPrompt()`
now uses the tuned "professional photo editor" wording (color-cast
neutralization, exposure balance, shadow lift, fixture de-glare,
deblur/denoise, texture preservation). The gated verify step stays — removing
it produced a completely different kitchen in 1 of 2 runs.
