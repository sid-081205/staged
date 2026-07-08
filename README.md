# Staged.

Virtual staging for real estate listings. Agents sign in with their email,
upload photos of empty rooms, pick a furniture style, and download
photorealistic staged versions. $5 buys 5 images ($1/image); every account
starts with 2 free watermarked previews. Image generation runs through the
Cursor Cloud Agents API. Stripe payments, SQLite storage — everything runs on
one cheap box.

## How it works

- **Landing page** (`/`) — before/after slider, style gallery, pricing, FAQ.
- **Sign in first** (`/signin`) — passwordless: enter an email, get a 6-digit
  code (via Resend), enter the code. Sessions are 90-day httpOnly cookies.
  Uploading and rendering require an account, so every render is attributable
  to a user.
- **Staging workspace** (`/stage`) — upload up to 10 photos per listing (or
  one-click try the built-in sample room), then pick from three dropdowns:
  what to do (**Stage with furniture**, **Remove furniture and clutter**, or
  **Fix lighting and sky**), the room type, and — for staging — a furniture
  style grouped by situation (sale listings, Airbnb / short-term rentals,
  commercial). An optional free-text box takes specific requests ("add a grand
  piano"). A render takes a few minutes, with a before/after compare modal on
  every result.
- **Credits** — $5 = 5 images. 1 credit = 1 render (regenerations included),
  spendable on any mode, any listing. Packs stack, credits never expire.
  Credit renders are clean and downloadable at full resolution; the 2 free
  previews per account are watermarked and not downloadable.
- **Dashboard** (`/dashboard`) — credits balance, free previews left, buy
  packs, and every listing on the account.
- **MLS compliance** — downloads have an optional "VIRTUALLY STAGED"
  disclosure label toggle (most MLSs require disclosure).

## Image generation: Cursor Cloud Agents

Each render spins up a Cursor cloud agent (`lib/cursorAgent.ts`):

1. `POST /v1/agents` with the staging prompt + the room photo attached, on the
   repo in `CURSOR_REPO`, using the model in `CURSOR_MODEL` (default
   `composer-2.5`).
2. The agent studies the photo, calls its image-generation tool with the photo
   as the reference image, then compares the output against the original and
   retries once if the architecture changed. Only the approved image is saved
   into its `artifacts/` directory (it does not commit anything to the repo).
3. The app polls the run, lists artifacts when it finishes, downloads the
   image via a presigned URL, and archives the agent.

Requirements: a Cursor API key, and a GitHub repo (default
`sid-081205/images`) that is non-empty and connected to Cursor's GitHub app.

## Try it right now (sandbox)

1. `npm run build && npm run start` → open `http://localhost:3000`
2. Click **Stage a room** → you're redirected to sign in
3. Enter your email → enter the 6-digit code from your inbox
   (note: with the default `onboarding@resend.dev` sender, Resend only
   delivers to the Resend account owner's email; verify a domain to email
   anyone)
4. Click **"Try our sample room"** (or upload your own photo) and render —
   your 2 free previews are watermarked
5. Click **Buy 5 images for $5** (on the dashboard or the out-of-images bar) →
   Stripe test checkout opens
6. Pay with card **4242 4242 4242 4242**, any future expiry, any CVC
7. You're back with 5 credits — renders are now clean, full-res, downloadable

The workspace shows the test-card hint automatically whenever a `pk_test` key
is configured.

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Fill in `.env`:

| Variable | What |
| --- | --- |
| `CURSOR_API_KEY` | From cursor.com → Settings → API keys. |
| `CURSOR_REPO` | GitHub repo URL the render agents run against. Must have at least one commit and be connected to Cursor's GitHub app. |
| `CURSOR_MODEL` | Agent model, default `composer-2.5` (cheap + fast). `GET https://api.cursor.com/v1/models` lists options. |
| `STRIPE_SECRET_KEY` | From the [Stripe dashboard](https://dashboard.stripe.com/apikeys). Currently a test key — swap for `sk_live_…` at launch. |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Matching publishable key. |
| `STRIPE_WEBHOOK_SECRET` | From `stripe listen` (dev) or a dashboard webhook endpoint pointed at `/api/webhooks/stripe`. Optional — redirect-time verification works without it — but recommended in production. |
| `RESEND_API_KEY` | [Resend](https://resend.com) key for sign-in code emails (free tier: 3,000/month). If unset in dev, the code is shown on the sign-in page instead. |
| `EMAIL_FROM` | Sender, e.g. `Staged <signin@yourdomain.com>`. The default `onboarding@resend.dev` only delivers to the Resend account owner until you verify a domain. |
| `SITE_URL` | Public URL, used for Stripe redirects. |
| `PRICE_CENTS` | Price of one 5-image pack, default `500`. |
| `MOCK_GENERATION` | Set to `1` to fake renders (tinted copy, no agent credits used). |

No other services required. State is a SQLite file plus image files, all under
`data/` (gitignored).

## Architecture

```
app/
  page.tsx                  landing page
  stage/page.tsx            server gate: redirects signed-out users to /signin
  stage/StageClient.tsx     staging workspace (client)
  signin/, dashboard/       email+code auth UI, credits + listings dashboard
  api/auth/*                login (send code), verify (code -> session), logout, me
  api/jobs                  create listing + upload photos (sign-in required)
  api/jobs/[id]             listing state (owner-only)
  api/generate              one render via Cursor agent; charges 1 credit or 1 free preview
  api/image/[id]            original | preview (clean if paid, watermarked if free) | full-res
  api/checkout              Stripe Checkout session for one $5 pack
  api/checkout/verify       verifies session on redirect, grants credits (idempotent)
  api/webhooks/stripe       checkout.session.completed backup path
lib/
  config.ts                 styles, room types, prompts, pack pricing
  db.ts                     better-sqlite3 schema + queries (users, credits, purchases)
  auth.ts                   6-digit login codes + session cookies
  email.ts                  Resend sender (on-screen code fallback in dev)
  cursorAgent.ts            Cursor Cloud Agents render pipeline (+ mock mode)
  images.ts                 sharp watermark + MLS disclosure label
  stripe.ts                 Stripe client helper
```

Credits are charged only after a render succeeds. Purchases are recorded per
Stripe session id, so verify + webhook can both fire without double-granting.

## Unit economics

- A render = one short cloud-agent run on `composer-2.5` plus one image
  generation — roughly $0.05–0.15 depending on run length.
- A $5 pack (5 renders): ~$0.25–0.75 generation cost + $0.45 Stripe fee
  (2.9% + 30¢) → roughly 75–85% gross margin.
- The 2 free previews per account cost ~$0.10–0.30 in acquisition.

## Production cost (~$3–5/month fixed)

| Item | Provider | Cost |
| --- | --- | --- |
| Hosting | Fly.io shared-cpu-1x 512MB + 3GB volume | ~$3.90/mo |
|  | …or Hetzner CX22 VPS (more headroom) | ~€3.79/mo |
|  | …or Railway Hobby | $5/mo (includes usage credit) |
| Database | SQLite on the volume | $0 |
| Auth emails | Resend free tier (3,000/mo) | $0 |
| Stripe | Per transaction only | 2.9% + 30¢ ≈ $0.45 per $5 pack |
| Renders | Cursor API, pay per use | ~$0.05–0.15/render |

Skip Vercel/serverless: the app wants a persistent disk (SQLite + images) and
1–5 minute render requests — a tiny always-on box is simpler and cheaper.

## Deploying (Fly.io example)

```bash
fly launch --no-deploy        # generates fly.toml; pick a 512MB shared VM
fly volumes create data --size 3
# mount the volume at /app/data in fly.toml, then:
fly secrets set CURSOR_API_KEY=... STRIPE_SECRET_KEY=... RESEND_API_KEY=... SITE_URL=https://yourdomain.com
fly deploy
```

Renders take 1–5 minutes, so keep request timeouts ≥ 8 minutes for
`/api/generate`. Point a Stripe dashboard webhook at
`https://yourdomain.com/api/webhooks/stripe` (event:
`checkout.session.completed`) and set `STRIPE_WEBHOOK_SECRET`.

## Launch checklist

- [ ] Resend: verify a domain and set `EMAIL_FROM` — until then sign-in codes
      only deliver to the Resend account owner's inbox
- [ ] Buy a domain, set `SITE_URL`
- [ ] Swap Stripe test keys for live keys + make one real purchase
- [ ] Stripe webhook endpoint + `STRIPE_WEBHOOK_SECRET`
- [ ] Replace `hello@staged.example` in `app/page.tsx` with a real email
- [ ] Keep an eye on Cursor API usage/credits — each render is an agent run
- [ ] Post before/afters in realtor Facebook groups / r/realtors — sell the
      $30/photo vs $1/image comparison
