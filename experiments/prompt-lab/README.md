# Prompt lab (not production)

Same Cursor Cloud Agents image pipeline as the live app (`lib/cursorAgent.ts`),
but isolated here so you can A/B **prompt wording** (and optionally models)
without touching stagely.org.

## Edit these

| File | What |
| --- | --- |
| `prompts.mjs` | Prompt variants to compare |
| `models.json` | Which Cursor model(s) to run them on |

## Run

From the repo root:

```bash
CURSOR_API_KEY=... \
CURSOR_REPO=https://github.com/sid-081205/images \
  node experiments/prompt-lab/run.mjs
```

Flags:

```bash
node experiments/prompt-lab/run.mjs --list
node experiments/prompt-lab/run.mjs --models composer-2.5,claude-opus-4-8
node experiments/prompt-lab/run.mjs --input path/to/your-photo.jpg
node experiments/prompt-lab/run.mjs --prompts prod-like-modern,aspect-lock
```

Open `experiments/prompt-lab/output/index.html` when it finishes.

## Cost

Default is 1 model × 4 prompts = 4 renders. Each costs Cursor credits and
takes a few minutes. Trim lists first.

## Promoting a winner

If a prompt wins, copy the wording into `lib/config.ts` (`buildPrompt`) on a
branch, test locally, then deploy. Do **not** import this folder from the app.
