# Model comparison

A small harness to see which Cursor model produces the best staged images, so
you can pick one for `CURSOR_MODEL`.

It runs every model in `models.json` against every prompt in `prompts.mjs`,
using the same input photo and the exact same Cursor Cloud Agents flow the
production app uses (`lib/cursorAgent.ts`). Results are saved as images plus a
side-by-side HTML gallery.

## Prompts

Every model is asked to do two edits on the same empty-room photo
(`public/demo/before.jpg`):

1. **Home gym with a piano, farmhouse style** — the unusual, specific ask.
2. **Scandinavian living room staging** — the core product use case.

Edit `prompts.mjs` to change these.

## Run it

You need a Cursor API key and a repo (same requirements as the app):

```bash
# from the repo root
CURSOR_API_KEY=your_key \
CURSOR_REPO=https://github.com/your-username/images \
  node experiments/model-comparison/run.mjs
```

Then open `experiments/model-comparison/output/index.html` in a browser to
compare every model side by side.

## Which models to test

```bash
node experiments/model-comparison/run.mjs --list      # models your account can use
```

Copy the ids you want into `models.json`, or pass them inline:

```bash
node experiments/model-comparison/run.mjs --models composer-2.5,composer-2,claude-4.6-sonnet-thinking
```

Other flags:

- `--input path/to/photo.jpg` — use a different input photo.

## Cost warning

Each render is a real cloud-agent run and spends Cursor credits. The default
config is 4 models x 2 prompts = 8 renders. Trim `models.json` first if you
want to keep it cheap. Renders take a few minutes each and run sequentially.

## After you decide

Set the winner in `.env`:

```
CURSOR_MODEL=the-model-id-you-liked
```

The app reads `CURSOR_MODEL` in `lib/cursorAgent.ts` (default `composer-2.5`).

## Note

`output/` is gitignored — fresh runs stay local so they don't bloat the repo.
A committed snapshot of one run (4 models x 2 prompts) lives in `results/` with
a summary in `RESULTS.md`; open `results/index.html` to view it.
