# Comparison results (run July 10, 2026)

Four models, two prompts each, same input photo (`results/input.jpg`, the
preloaded empty room). Open `results/index.html` for the side-by-side gallery,
or browse `results/<model>/`.

Judged on two things that matter for real estate: **fidelity** (does it keep
the real room's architecture, window, view, radiator, floor, camera angle and
aspect ratio) and **staging quality** (realistic, well scaled, professional).

| Model | Fidelity | Staging | Speed | Notes |
| --- | --- | --- | --- | --- |
| **claude-opus-4-8** (Opus 4.8) | Excellent | Excellent | ~174s / 142s | Best overall. Both renders kept the exact 3-pane window + brick view, radiator, floor, camera angle and landscape framing. Clean, photorealistic staging. |
| **gemini-3.1-pro** (Gemini 3.1 Pro) | Good | Excellent | ~157s / 252s | Gym render very faithful. Living-room render drifted (invented a door, crown molding, a vent and changed the window). |
| **composer-2.5** (current default) | Good | Good | ~314s / 378s | Faithful living room; gym window drifted a little. Slowest of the four. |
| **gpt-5.6-sol** (GPT-5.6 Sol) | Poor | Good | ~63s / 78s | Fastest, but changed the output to a **portrait** aspect ratio and invented architecture (an extra doorway). Not suitable for listing photos as-is. |

## Recommendation

**`claude-opus-4-8`** gave the best combination of architectural fidelity and
staging quality across both prompts, at a reasonable speed. `gemini-3.1-pro` is
a strong, slightly cheaper/faster second choice if its occasional architectural
drift is acceptable.

To use it, set in `.env`:

```
CURSOR_MODEL=claude-opus-4-8
```

(Not changed automatically — waiting on your call.)
