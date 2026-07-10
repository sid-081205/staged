# Experiments (not production)

Local-only harnesses for trying **models** and **prompts** before changing
what runs on stagely.org. Nothing in this folder is imported by the Next.js
app. Deploying to the VPS does not expose these pages.

| Folder | Purpose |
| --- | --- |
| `model-comparison/` | Same Cursor Agents flow as prod. Compare several models on fixed prompts. |
| `prompt-lab/` | Same flow. Compare several **prompt variants** (and optional models) on one photo. |

Both write to their own `output/` (gitignored). Edit the JSON / `.mjs` config
files, run from the repo root, open the generated `output/index.html`.

```bash
# list models your Cursor key can use
node experiments/model-comparison/run.mjs --list

# compare models
CURSOR_API_KEY=... CURSOR_REPO=https://github.com/sid-081205/images \
  node experiments/model-comparison/run.mjs

# compare prompt variants
CURSOR_API_KEY=... CURSOR_REPO=https://github.com/sid-081205/images \
  node experiments/prompt-lab/run.mjs
```

Each render burns real Cursor credits and takes a few minutes. Trim the
model/prompt lists before a big run.
