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
  - Stripe checkout (`/api/checkout`) needs `STRIPE_SECRET_KEY` /
    `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`; without them `lib/stripe.ts`
    `getStripe()` returns null and buying credit packs is unavailable. Every
    new account still gets 2 free watermarked previews, so the core sign-in →
    upload → render flow works with zero external keys.
- **Lint is not usable as-is**: `npm run lint` runs `next lint`, which was
  removed in Next.js 16 (it now mis-parses `lint` as a directory and fails).
  There is no ESLint config in the repo. Use `npx tsc --noEmit` as the static
  check instead.
- **Renders are slow with a real Cursor key** (1–5 min per image); `maxDuration`
  on `/api/generate` is 300s. `MOCK_GENERATION=1` returns instantly.
