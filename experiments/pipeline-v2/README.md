# pipeline-v2 bake-off — NOT production

Speed / fidelity / dimension experiments behind the 2026-07 pipeline changes
(generate-first agent wrapper, gated one-retry verify, dimension lock, FAQ).

**Open `index.html` for the full report and conclusions.**

Contents:

- `input/` — portrait (1024×1536), blurry, occupied bedroom fixture; a faithful
  recreation of the task brief's attached photo (chat attachments are not
  persisted to agent VMs). `prompts.json` holds the byte-identical production
  prompts exported from `lib/config.ts` + `lib/cursorAgent.ts`.
- `prepare.mjs` — runs the real `preprocessInput` and exports the real prompts.
- `runs/` — raw image-edit-tool outputs per prompt variant (timed).
- `postprocess.mjs` — pushes every raw output through the real production
  `lockToDimensions`; fails if any delivered image mismatches the input size.
- `delivered/` — final images + `results.json` dimension audit.
- `live-timing.mjs` — LIVE end-to-end harness against the real Cloud Agents
  API (needs `CURSOR_API_KEY`): old vs new wrapper, repo-less, `fast` param,
  model override via `LIVE_MODEL`. Per-run wall clock + status timeline.
- `runs-live/` — the 19 live renders + `timings.json` (2026-07-11 sessions;
  runs 11–13 of `norepo-stage` are the Auto-model tests).

As with the other experiment folders: never import this from the Next app;
promote winners into `lib/config.ts` / `lib/cursorAgent.ts` only.
