# Staged.

Virtual staging for real estate listings. Agents sign in with their email,
upload photos of empty rooms, pick a furniture style, and download
photorealistic staged versions. $3 buys 10 images (30¢/image); every account
starts with 1 free watermarked preview. Image generation runs through the
Cursor Cloud Agents API. Stripe payments, SQLite storage — everything runs on
one cheap box.

## How it works

- **Landing page** (`/`) — before/after slider, style gallery, pricing, FAQ.
- **Sign in first** (`/signin`) — passwordless: enter an email, get a 6-digit
  code (via Resend), enter the code. Sessions are 90-day httpOnly cookies.
  Uploading and rendering require an account, so every render is attributable
  to a user.
- **Staging workspace** (`/stage`) — upload up to 10 photos per listing, then
  pick from three dropdowns:
  what to do (**Stage with furniture**, **Remove furniture and clutter**, or
  **Fix lighting and sky**), the room type, and — for staging — a furniture
  style grouped by situation (sale listings, Airbnb / short-term rentals,
  commercial). An optional free-text box takes specific requests ("add a grand
  piano"). A render takes a few minutes, with a before/after compare modal on
  every result.
- **Credits** — $3 = 10 images. 1 credit = 1 render (regenerations included),
  spendable on any mode, any listing. Packs stack, credits never expire.
  Credit renders are clean and downloadable at full resolution; the 1 free
  preview per account is watermarked and not downloadable.
- **Dashboard** (`/dashboard`) — credits balance, free previews left, buy
  packs, and every listing on the account.
- **MLS compliance** — downloads have an optional "VIRTUALLY STAGED"
  disclosure label toggle (most MLSs require disclosure).

## Image generation: how the pipeline works

Every render goes through the same five stages in `lib/cursorAgent.ts`
(`stagePhoto()`), built from two prompt layers plus pre/post-processing.
The design was benchmarked with 29 live renders — see
`experiments/pipeline-v2/index.html` (bedroom, staging) and
`experiments/kitchen-enhance-lab/index.html` (kitchen, fix-lighting).

**1. Preprocess** (`preprocessInput`). The upload is EXIF-rotated, resized to
at most 2048px on the long edge (never enlarged), and re-encoded as JPEG. The
resulting exact width x height is recorded — it becomes the contract for the
final output. Any input shape works: portrait, landscape, square.

**2. Build the image instruction** (Layer A, `buildPrompt()` in
`lib/config.ts`). Per-service wording (stage / declutter / enhance) plus the
**hard constraints** block — an explicit DO-NOT list covering windows, walls,
floors, ceilings, doors, fixtures, camera position, aspect ratio/orientation,
and room identity. Staging is "additions only"; enhance ("Fix lighting") uses
a professional-photo-editor wording (color-cast neutralization, exposure
balance, shadow lift, fixture de-glare, deblur/denoise, texture preservation)
that went 3/3 on fidelity in the kitchen lab. Free-text user requests are
appended but can never override the hard constraints.

**3. Wrap it for the agent** (Layer B, `buildAgentPrompt()`). Images attached
via the agents API are visible to the model but are **not files on the
agent's VM**, so the wrapper's Step 1 is a `curl` of a **signed, expiring
URL** (`/api/render-input/:photoId`, HMAC via `lib/renderInputToken.ts`) that
serves the exact preprocessed photo — the image tool always gets the real
pixels as a reference file instead of a text description of them. The agent
then calls its image tool **immediately** in image-to-image mode (no
scene-inventory step — saves 30-60s), with the exact output dimensions
injected. Then a **gated verification**: compare the result against the
original and regenerate **at most once**, only if a hard constraint visibly
drifted; `enhance` never regenerates (tonal change is the point). Don't
remove this step to save time — in the kitchen lab, variants without a
working check shipped a completely fabricated room in 1 of 2 runs. Only the
approved image goes into the agent's `artifacts/` directory. (When `SITE_URL`
isn't public https — local dev — the pipeline falls back to attachment-only.)

**4. Run and poll.** `POST /v1/agents` with the prompt + photo attached,
repo-less by default (no clone overhead; set `CURSOR_REPO` to pin one), on
`CURSOR_MODEL` (default `composer-2.5`). Exactly one agent per render. The
app polls **run status only** every 3s (artifacts only sync when the agent
finishes, and one request per tick stays far inside the key's 300 req/min
limit; transient 429/5xx are skipped, not fatal). As soon as the run turns
FINISHED it lists artifacts, downloads the image via a presigned URL, and
archives the agent.

**5. Dimension lock** (`lockToDimensions`). The model returns its own
resolution (typically 1536x1024), so the artifact is cover-resized to the
**exact dimensions recorded in step 1** — the output always matches the
upload's size and orientation. Free-preview renders get watermarked after
this (`lib/images.ts`).

Renders run as fire-and-forget background work: `/api/generate` reserves the
credit and responds immediately with a `processing` render; the pipeline
finishes in the Node process (refunding on failure), while the client polls
`/api/renders/status`. Live timings on `composer-2.5` with the URL-downloaded
reference: **~1.5–3 min** (96s, 99s, 171s observed end-to-end), worst case
one retry inside the same agent; `/api/generate` caps at 600s and refunds on
timeout.

Requirements: just a Cursor API key. (`CURSOR_REPO` is optional; if set, the
repo must be non-empty and connected to Cursor's GitHub app.)

The model is set by `CURSOR_MODEL` (default `composer-2.5` — the fastest of
the plan-available options in live tests). If your plan has access to
`claude-opus-4-8`, it measured ~2x faster per render with the best
architectural fidelity (`experiments/model-comparison/RESULTS.md`). To compare
models, use the harness in `experiments/model-comparison/` — it renders the
same photo through every model you list and builds a side-by-side gallery.

## Try it right now (sandbox)

1. `npm run build && npm run start` → open `http://localhost:3000`
2. Click **Stage a room** → you're redirected to sign in
3. Enter your email → enter the 6-digit code from your inbox
   (note: with the default `onboarding@resend.dev` sender, Resend only
   delivers to the Resend account owner's email; verify a domain to email
   anyone)
4. Upload a photo and render — your 1 free preview is watermarked
5. Click **Buy 10 images for $3** (on the dashboard or the out-of-images bar) →
   Stripe test checkout opens
6. Pay with card **4242 4242 4242 4242**, any future expiry, any CVC
7. You're back with 10 credits — renders are now clean, full-res, downloadable

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
| `CURSOR_REPO` | Optional. GitHub repo URL the render agents run against; leave empty (or `none`) for repo-less agents. If set, it must have at least one commit and be connected to Cursor's GitHub app. |
| `CURSOR_MODEL` | Agent model, default `composer-2.5`. `claude-opus-4-8` is ~2x faster with best fidelity if your plan has it. `GET https://api.cursor.com/v1/models` lists options. |
| `STRIPE_SECRET_KEY` | From the [Stripe dashboard](https://dashboard.stripe.com/apikeys). Currently a test key — swap for `sk_live_…` at launch. |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Matching publishable key. |
| `STRIPE_WEBHOOK_SECRET` | From `stripe listen` (dev) or a dashboard webhook endpoint pointed at `/api/webhooks/stripe`. Optional — redirect-time verification works without it — but recommended in production. |
| `RESEND_API_KEY` | [Resend](https://resend.com) key for sign-in code emails (free tier: 3,000/month). If unset in dev, the code is shown on the sign-in page instead. |
| `EMAIL_FROM` | Sender, e.g. `Stagely <hello@stagely.org>`. Requires a verified Resend domain. |
| `SITE_URL` | Public URL for Stripe redirects. Production: `https://stagely.org`. Local: `http://localhost:3000`. |
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
  api/checkout              Stripe Checkout session for one $3 pack
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

- A render = one short cloud-agent run on `CURSOR_MODEL` plus one image
  generation — roughly $0.05–0.15 depending on run length.
- A $3 pack (10 renders): ~$0.50–1.50 generation cost + ~$0.39 Stripe fee
  (2.9% + 30¢) → roughly 35–70% gross margin. Watch actual per-render agent
  cost; if it trends toward the high end, raise `PACK_PRICE_CENTS` in
  `lib/config.ts` (hardcoded there so the client and server always agree).
- The 1 free preview per account costs ~$0.05–0.15 in acquisition.

## Production cost (~$3–5/month fixed)

| Item | Provider | Cost |
| --- | --- | --- |
| Hosting | Fly.io shared-cpu-1x 512MB + 3GB volume | ~$3.90/mo |
|  | …or Hetzner CX22 VPS (more headroom) | ~€3.79/mo |
|  | …or Railway Hobby | $5/mo (includes usage credit) |
| Database | SQLite on the volume | $0 |
| Auth emails | Resend free tier (3,000/mo) | $0 |
| Stripe | Per transaction only | 2.9% + 30¢ ≈ $0.39 per $3 pack |
| Renders | Cursor API, pay per use | ~$0.05–0.15/render |

Skip Vercel/serverless: the app wants a persistent disk (SQLite + images) and
1–5 minute render requests — a tiny always-on box is simpler and cheaper.

## Deploying (cheapest: one small VPS)

The app needs a persistent disk (SQLite + images) and a long-running Node
process (renders continue after the HTTP response), so serverless platforms
are out. The cheapest reliable setup is a ~$4/month VPS:

1. **Buy a VPS**: Hetzner CX22 (~€3.79/mo) or any 1GB+ Ubuntu box.
2. **Buy a domain** (~$10/yr) and point an A record at the VPS IP.
3. **On the VPS** (as root):

```bash
apt update && apt install -y curl git caddy
curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && apt install -y nodejs
adduser --disabled-password --gecos "" staged
su - staged -c "git clone https://github.com/YOUR_USER/staged.git app && cd app && npm ci && cp .env.example .env"
# edit /home/staged/app/.env with real keys (see table above), then:
su - staged -c "cd app && npm run build"
```

4. **Run it with systemd** — create `/etc/systemd/system/staged.service`:

```ini
[Unit]
Description=Staged
After=network.target

[Service]
User=staged
WorkingDirectory=/home/staged/app
ExecStart=/usr/bin/npm start
Restart=always

[Install]
WantedBy=multi-user.target
```

Then `systemctl enable --now staged`.

5. **HTTPS with Caddy** — put in `/etc/caddy/Caddyfile` (Caddy gets and renews
   the certificate automatically):

```
stagely.org, www.stagely.org {
    reverse_proxy localhost:3000
}
```

Then `systemctl reload caddy`.

6. **Stripe**: swap to live keys in `.env`, then in the Stripe dashboard add a
   webhook endpoint `https://stagely.org/api/webhooks/stripe` for
   `checkout.session.completed` and set `STRIPE_WEBHOOK_SECRET`.
7. **Resend**: verify `stagely.org` and set `EMAIL_FROM=Stagely <hello@stagely.org>`.
8. **Backups**: everything lives in `/home/staged/app/data`. A nightly
   `tar czf` of that directory to anywhere off the box is enough.

To ship an update: `su - staged -c "cd app && git pull && npm ci && npm run build" && systemctl restart staged`.

## Launch checklist

- [x] Resend: verify `stagely.org` and set `EMAIL_FROM=Stagely <hello@stagely.org>`
- [x] Domain: `stagely.org`, set `SITE_URL=https://stagely.org`
- [ ] Swap Stripe test keys for live keys + make one real purchase
- [ ] Stripe webhook endpoint `https://stagely.org/api/webhooks/stripe` + `STRIPE_WEBHOOK_SECRET`
- [x] Contact email is `stagelyhelp@gmail.com`
- [ ] Keep an eye on Cursor API usage/credits — each render is an agent run
- [ ] Post before/afters in realtor Facebook groups / r/realtors — sell the
      $30/photo vs 30¢/image comparison
