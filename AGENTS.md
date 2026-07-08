# Staged.

Virtual staging for real estate listings (Next.js 16 App Router + SQLite). See
`README.md` for the product overview and full env-var table.

## Cursor Cloud specific instructions

- **Service**: single Next.js app. Run it with `npm run dev` (Turbopack, port
  3000). `npm run build && npm start` is the production build. Standard scripts
  live in `package.json`.
- **No external services required for local dev.** State is a SQLite file plus
  images under `data/` (gitignored, auto-created by `lib/db.ts` on first run).
- **`.env` is required at the repo root** (copy from `.env.example`). All keys
  are optional for local dev because the app degrades gracefully:
  - Sign-in with no `RESEND_API_KEY`: the 6-digit code is NOT emailed — it is
    logged to the server console and returned in the `/api/auth/login` response
    as `devCode`, and shown on the `/signin` page. This only happens when
    `NODE_ENV !== production`.
  - Set `MOCK_GENERATION=1` to fake renders (a tinted copy via `sharp`, no
    Cursor API key or credits used). Without it, `/api/generate` calls the
    Cursor Cloud Agents API and needs a valid `CURSOR_API_KEY` + `CURSOR_REPO`.
    NOTE: mock mode **ignores the prompt and style entirely** (it only applies a
    fixed tint), so you cannot judge real generation quality in mock mode —
    every style/prompt yields the same tinted image. Real renders take ~2 min
    and the `CURSOR_REPO` must exist, be non-empty, and be connected to Cursor's
    GitHub app. Faithful staging depends on the prompt forcing an in-place image
    edit (see `buildPrompt` in `lib/config.ts`); a weak prompt makes the model
    invent a different/empty room.
  - Stripe checkout (`/api/checkout`) needs `STRIPE_SECRET_KEY` /
    `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`; without them `lib/stripe.ts`
    `getStripe()` returns null and buying credit packs is unavailable. Every
    new account still gets 2 free watermarked previews, so the core sign-in →
    upload → render flow works with zero external keys.
- **Lint is not usable as-is**: `npm run lint` runs `next lint`, which was
  removed in Next.js 16 (it now mis-parses `lint` as a directory and fails).
  There is no ESLint config in the repo. Use `npx tsc --noEmit` as the static
  check instead.
- **Renders are slow with a real Cursor key** (1–8 min per image; the render
  agent verifies its output against the original photo and may retry once);
  `maxDuration` on `/api/generate` is 600s. With `MOCK_GENERATION=1`, `MOCK_DELAY_MS` (default
  6000) simulates that latency so the background-progress UI is visible; set it
  to `0` for instant mock renders.
- **Renders run as fire-and-forget background work.** `/api/generate` reserves a
  credit/free-preview, returns a `processing` render immediately, and finishes
  the render in the Node process after responding (refunding on failure). The
  client tracks it in `localStorage` and polls `/api/renders/status`, and the
  global `components/RenderTracker.tsx` popup shows progress across pages. This
  relies on the persistent server (`next dev` / `next start`) — it would not
  survive a serverless function that halts after the response.
