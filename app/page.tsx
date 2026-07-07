import Link from "next/link";
import BeforeAfterSlider from "@/components/BeforeAfterSlider";
import StyleGallery from "@/components/StyleGallery";
import Reveal from "@/components/Reveal";
import {
  FREE_PREVIEWS,
  FURNITURE_STYLE_KEYS,
  PACK_CREDITS,
  PACK_LABEL,
  PER_IMAGE_LABEL,
  STYLES,
} from "@/lib/config";

const STYLE_COUNT = FURNITURE_STYLE_KEYS.length;

const faq: [string, string][] = [
  [
    "How does pricing work?",
    `${PACK_LABEL} buys ${PACK_CREDITS} images — that's ${PER_IMAGE_LABEL} per image, any mode. Packs stack and credits never expire. Every new account also gets ${FREE_PREVIEWS} free watermarked previews to try it first.`,
  ],
  [
    "Do I need an account?",
    "Yes — sign in with just your email (we send a 6-digit code, no password) so your images and credits stay in one place. It takes about 20 seconds.",
  ],
  [
    "Is virtual staging allowed on the MLS?",
    "Yes. Most MLSs allow it and require disclosure. Every download has an optional \"Virtually staged\" label you can toggle on to stay compliant. Check your local MLS rules — some also want the empty original alongside.",
  ],
  [
    "What photos work best?",
    "A straight-on, well-lit photo of the whole room, shot from a corner or doorway at chest height. Phone photos are fine. Blurry or very dark photos produce worse furniture.",
  ],
  [
    "Can it remove existing furniture?",
    "Yes. Pick \"Declutter\" as the mode and it empties the room instead of furnishing it. For occupied listings: declutter first, then stage the empty result.",
  ],
  [
    "Can it just fix my photos without adding furniture?",
    "Yes — Enhance mode. It corrects exposure and white balance, brightens dark rooms, recovers blown-out windows and blue-skies the view, without touching a single object. Photo editors charge $2–4 per photo for exactly this.",
  ],
  [
    "Does it change the room itself?",
    "No. Walls, windows, floors, and fixtures stay as photographed. Only furniture and decor are added. If a render alters the architecture, regenerate it — each render is one image credit.",
  ],
  [
    "Who owns the images?",
    "You do. Use them on the MLS, Zillow, brochures, social — anywhere. No attribution, no extra license fees.",
  ],
  [
    "What if the renders are unusable?",
    "Email us within 7 days and we refund the pack. No forms, no arguing.",
  ],
];

const steps: [string, string][] = [
  ["Sign in", "Email in, 6-digit code back, you're in. No password to invent. Your images and credits live on your account."],
  ["Upload & pick a mode", `Photos of empty rooms — up to 10 per listing. ${STYLE_COUNT} furniture styles plus declutter, enhance, day-to-dusk and renovate — and a box to add your own request. A render takes a couple of minutes.`],
  ["Download", "Full resolution, no watermark, yours outright. One click adds the MLS \"Virtually staged\" disclosure label."],
];

const offerings: {
  id: string;
  tag: string;
  title: string;
  body: string;
  before: string;
  after: string;
  beforeLabel: string;
  afterLabel: string;
}[] = [
  {
    id: "staging",
    tag: "Virtual staging",
    title: "Furnish empty rooms.",
    body: "Upload a bare room and get it back professionally furnished in minutes, in any of 16 styles. Walls, windows, floors and the camera angle stay exactly as photographed — only furniture and decor are added. It's the highest-impact edit an agent can make: staged listings pull far more buyer attention than empty ones.",
    before: "/demo/before.jpg",
    after: "/demo/stage-after.jpg",
    beforeLabel: "Empty",
    afterLabel: "Staged",
  },
  {
    id: "declutter",
    tag: "Declutter & item removal",
    title: "Clear out the clutter.",
    body: "Occupied home full of the seller's furniture, boxes and personal items? Strip it back to a clean, empty room — the floors and walls behind removed objects are reconstructed. It's the essential first step for lived-in listings, before you restage them.",
    before: "/demo/bed-after.jpg",
    after: "/demo/bed-before.jpg",
    beforeLabel: "Cluttered",
    afterLabel: "Cleared",
  },
  {
    id: "enhance",
    tag: "Photo enhancement",
    title: "Fix the light and sky.",
    body: "Correct exposure and white balance, lift dark rooms, recover blown-out windows and drop in a clean blue sky — without moving a single object in the room. It's the low-cost edit nearly every listing photo needs, plus day-to-dusk twilight conversion for a standout hero shot.",
    before: "/demo/before.jpg",
    after: "/demo/enhance-after.jpg",
    beforeLabel: "As shot",
    afterLabel: "Enhanced",
  },
];

const comparison: [string, string, string, string][] = [
  ["Cost for 8 photos", "$8", "$128–$240", "$2,000–$6,000"],
  ["Turnaround", "Minutes", "24–48 hours", "1–2 weeks"],
  ["Revisions", `${PER_IMAGE_LABEL} per render`, "$5–$15 each", "Reshoot"],
  ["Styles to compare", `${STYLE_COUNT}+ per photo`, "1 per order", "1"],
  ["Modes included", "Stage · declutter · enhance · dusk · renovate", "Separate fees", "—"],
  ["Photo enhancement", "Included mode", "$2–$4/photo", "—"],
];

export default function Home() {
  return (
    <div>
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="font-serif text-2xl">Staged.</span>
          <nav className="flex items-center gap-6 text-sm text-muted">
            <a href="#offerings" className="hidden hover:text-ink sm:block">What it does</a>
            <a href="#styles" className="hidden hover:text-ink sm:block">Styles</a>
            <a href="#pricing" className="hidden hover:text-ink sm:block">Pricing</a>
            <a href="#faq" className="hidden hover:text-ink sm:block">FAQ</a>
            <Link
              href="/stage"
              className="rounded-xl border border-ink bg-ink px-4 py-2 text-paper transition-colors hover:bg-transparent hover:text-ink"
            >
              Stage a room
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6">
        {/* Hero */}
        <section className="grid gap-12 py-16 md:grid-cols-[1fr_1.1fr] md:items-center md:py-24">
          <Reveal>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
              Virtual staging for real estate agents
            </p>
            <h1 className="mt-4 font-serif text-5xl leading-[1.04] md:text-[4.2rem]">
              Empty rooms
              <br />
              don&rsquo;t sell.
              <br />
              <em className="text-accent">Staged ones do.</em>
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-muted">
              Upload a photo of an empty room. Download it professionally
              furnished minutes later. {PER_IMAGE_LABEL} per image — while
              traditional stagers charge $30 a photo and take two days.
            </p>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted">
              <span className="font-medium text-ink">The best AI image models, with custom knowledge of your
              real-estate needs</span>{" "}
              — correct furniture scale, MLS-safe architecture and true-to-photo light — so every render
              looks like a professional listing photo, not a gimmick.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/stage"
                className="rounded-xl border border-ink bg-ink px-6 py-3.5 text-paper transition-colors hover:bg-transparent hover:text-ink"
              >
                Start staging — {FREE_PREVIEWS} previews free
              </Link>
              <a href="#styles" className="text-sm text-muted underline-offset-4 hover:text-ink hover:underline">
                See the styles ↓
              </a>
            </div>
            <p className="mt-4 text-sm text-muted">
              Sign in with your email — no password, no card, no subscription.
            </p>
          </Reveal>
          <Reveal delay={150}>
            <BeforeAfterSlider before="/demo/before.jpg" after="/demo/after.jpg" autoplay />
            <p className="mt-2 text-center text-xs uppercase tracking-widest text-muted">
              Drag the divider — real render, same photo
            </p>
          </Reveal>
        </section>

        {/* Facts strip */}
        <section className="grid overflow-hidden rounded-2xl border border-line text-center sm:grid-cols-4">
          {[
            [PER_IMAGE_LABEL, "per image, flat"],
            [`${PACK_LABEL} / ${PACK_CREDITS}`, "images per pack — credits never expire"],
            [`${STYLE_COUNT}+ looks`, "styles, plus declutter, enhance, day-to-dusk & renovate"],
            ["8 in 10", "buyers' agents say staging helps buyers visualize a home*"],
          ].map(([big, small], i) => (
            <div key={big} className={`px-4 py-8 ${i > 0 ? "border-t border-line sm:border-l sm:border-t-0" : ""}`}>
              <div className="font-serif text-3xl">{big}</div>
              <div className="mx-auto mt-1 max-w-[22ch] text-sm text-muted">{small}</div>
            </div>
          ))}
        </section>
        <p className="pt-3 text-right text-xs text-muted">*National Association of Realtors, Profile of Home Staging</p>
      </main>

      {/* Style marquee */}
      <div className="mt-16 overflow-hidden border-y border-line bg-paper-2 py-3">
        <div className="marquee-track gap-0">
          {[0, 1].map((n) => (
            <div key={n} className="flex shrink-0 items-center">
              {Object.values(STYLES).map((s) => (
                <span key={`${n}-${s.label}`} className="flex items-center whitespace-nowrap px-6 text-sm uppercase tracking-[0.25em] text-muted">
                  {s.label.split(" (")[0]}
                  <span className="ml-12 text-accent">·</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-6">
        {/* Core offerings */}
        <section id="offerings" className="py-20 md:py-28">
          <Reveal>
            <div className="max-w-2xl">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">What Staged does</p>
              <h2 className="mt-3 font-serif text-4xl">Three edits that make a listing sell.</h2>
              <p className="mt-4 leading-relaxed text-muted">
                The jobs agents pay photo editors for most — staging, decluttering and
                enhancement — each powered by the best AI image models tuned with real-estate
                staging know-how. Drag any divider below: it&rsquo;s the same room, same angle,
                professionally transformed.
              </p>
            </div>
          </Reveal>
          <div className="mt-12 space-y-16">
            {offerings.map((o, i) => (
              <Reveal key={o.id} delay={i * 80}>
                <div className="grid items-center gap-8 md:grid-cols-2">
                  <div className={i % 2 === 1 ? "md:order-2" : ""}>
                    <BeforeAfterSlider
                      before={o.before}
                      after={o.after}
                      beforeLabel={o.beforeLabel}
                      afterLabel={o.afterLabel}
                    />
                  </div>
                  <div className={i % 2 === 1 ? "md:order-1" : ""}>
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">{o.tag}</p>
                    <h3 className="mt-2 font-serif text-3xl">{o.title}</h3>
                    <p className="mt-4 max-w-md leading-relaxed text-muted">{o.body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Style gallery */}
        <section id="styles" className="border-t border-line py-20 md:py-28">
          <Reveal>
            <div className="max-w-2xl">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">One photo, many directions</p>
              <h2 className="mt-3 font-serif text-4xl">Match the furniture to the buyer.</h2>
              <p className="mt-4 leading-relaxed text-muted">
                A starter condo shows better in Scandinavian. A $2M listing needs
                the luxury treatment. Render the same room across {STYLE_COUNT}+ styles and
                pick what fits — each backed by the best AI models tuned with real
                estate staging know-how. Every style below is the identical photo,
                staged by Staged.
              </p>
            </div>
          </Reveal>
          <Reveal delay={100} className="mt-10">
            <StyleGallery />
          </Reveal>
        </section>

        {/* How it works */}
        <section className="border-t border-line py-20 md:py-28">
          <Reveal>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">Three steps</p>
            <h2 className="mt-3 font-serif text-4xl">Listing-ready before your coffee cools.</h2>
          </Reveal>
          <div className="mt-12 grid gap-10 md:grid-cols-3">
            {steps.map(([title, body], i) => (
              <Reveal key={title} delay={i * 120}>
                <div className="rounded-2xl border border-line p-6">
                  <div className="font-serif text-lg text-muted">0{i + 1}</div>
                  <h3 className="mt-1 font-serif text-2xl">{title}</h3>
                  <p className="mt-3 leading-relaxed text-muted">{body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Comparison */}
        <section className="border-t border-line py-20 md:py-28">
          <Reveal>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">The math</p>
            <h2 className="mt-3 font-serif text-4xl">Same photos on the MLS. Very different invoice.</h2>
          </Reveal>
          <Reveal delay={100}>
            <div className="mt-10 overflow-x-auto">
              <table className="w-full min-w-[640px] overflow-hidden rounded-2xl border border-line text-left text-[15px]">
                <thead>
                  <tr className="border-b border-line bg-paper-2">
                    <th className="px-4 py-3 font-medium text-muted"> </th>
                    <th className="px-4 py-3 font-serif text-lg">Staged.</th>
                    <th className="px-4 py-3 font-medium text-muted">Human virtual staging</th>
                    <th className="px-4 py-3 font-medium text-muted">Physical staging</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.map(([label, us, virtual, physical]) => (
                    <tr key={label} className="border-b border-line last:border-b-0">
                      <td className="px-4 py-3 text-muted">{label}</td>
                      <td className="px-4 py-3 font-medium">{us}</td>
                      <td className="px-4 py-3 text-muted">{virtual}</td>
                      <td className="px-4 py-3 text-muted">{physical}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-muted">
              Typical published rates: human virtual staging $16–$30/photo (BoxBrownie, Styldod); physical staging $2,000–$6,000 per property.
            </p>
          </Reveal>
        </section>

        {/* Pricing */}
        <section id="pricing" className="border-t border-line py-20 md:py-28">
          <div className="grid gap-12 md:grid-cols-2">
            <Reveal>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">Pricing</p>
              <h2 className="mt-3 font-serif text-4xl">
                {PER_IMAGE_LABEL} an image. That&rsquo;s the whole pricing page.
              </h2>
              <p className="mt-4 max-w-md leading-relaxed text-muted">
                Stagers price per photo because their labor scales per photo. Ours
                doesn&rsquo;t, so you shouldn&rsquo;t pay like it does. Buy images
                {" "}{PACK_CREDITS} at a time, spend them on any mode, any listing,
                whenever — they never expire.
              </p>
              <p className="mt-4 max-w-md leading-relaxed text-muted">
                On a typical 3% commission, a whole pack pays for itself if it
                moves the sale price by <span className="text-ink">0.0005%</span>.
                It only needs to make one browser click through to one showing.
              </p>
            </Reveal>
            <Reveal delay={120}>
              <div className="rounded-3xl border border-ink p-8">
                <div className="flex items-baseline gap-3">
                  <span className="font-serif text-6xl">{PACK_LABEL}</span>
                  <span className="text-muted">for {PACK_CREDITS} images</span>
                </div>
                <ul className="mt-6 space-y-2.5 text-[15px]">
                  {[
                    `${PER_IMAGE_LABEL} per image — stage, declutter, or enhance`,
                    "Full-resolution downloads, no watermark",
                    "Credits never expire, packs stack",
                    "Up to 10 photos per listing, unlimited listings",
                    "Optional \"Virtually staged\" MLS label",
                    "Full commercial rights — MLS, Zillow, print",
                    "7-day refund if the renders don't work for you",
                  ].map((line) => (
                    <li key={line} className="flex gap-3">
                      <span className="text-accent">—</span>
                      {line}
                    </li>
                  ))}
                </ul>
                <p className="mt-6 border-t border-line pt-4 text-sm text-muted">
                  Try first: every account starts with {FREE_PREVIEWS} free watermarked previews. No card required.
                </p>
                <Link
                  href="/stage"
                  className="mt-6 block rounded-xl border border-ink bg-ink px-6 py-3.5 text-center text-paper transition-colors hover:bg-transparent hover:text-ink"
                >
                  Start staging
                </Link>
              </div>
            </Reveal>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="border-t border-line py-20 md:py-28">
          <div className="grid gap-12 md:grid-cols-[1fr_1.6fr]">
            <Reveal>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">Questions</p>
              <h2 className="mt-3 font-serif text-4xl">Asked and answered.</h2>
              <p className="mt-4 leading-relaxed text-muted">
                Something else?{" "}
                <a href="mailto:hello@staged.example" className="text-ink underline underline-offset-4">
                  Email us
                </a>
                . A person replies.
              </p>
            </Reveal>
            <Reveal delay={100}>
              <div className="divide-y divide-line border-y border-line">
                {faq.map(([q, a]) => (
                  <details key={q} className="group py-4">
                    <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
                      {q}
                      <span className="ml-4 shrink-0 text-muted transition-transform duration-200 group-open:rotate-45">
                        +
                      </span>
                    </summary>
                    <p className="mt-3 max-w-xl leading-relaxed text-muted">{a}</p>
                  </details>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* Final CTA */}
        <section className="border-t border-line py-24 text-center md:py-32">
          <Reveal>
            <h2 className="mx-auto max-w-2xl font-serif text-4xl leading-tight md:text-5xl">
              Your next listing has empty rooms.
              <br />
              <em className="text-accent">Fix that for {PER_IMAGE_LABEL} a photo.</em>
            </h2>
            <Link
              href="/stage"
              className="mt-10 inline-block rounded-2xl border border-ink bg-ink px-8 py-4 text-lg text-paper transition-colors hover:bg-transparent hover:text-ink"
            >
              Start staging — {FREE_PREVIEWS} previews free
            </Link>
          </Reveal>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-line bg-paper-2">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="flex flex-wrap items-start justify-between gap-8">
            <div>
              <span className="font-serif text-3xl">Staged.</span>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted">
                Virtual staging for real estate listings. Upload empty rooms,
                download furnished ones.
              </p>
            </div>
            <div className="flex gap-16 text-sm">
              <div className="space-y-2">
                <p className="font-medium">Product</p>
                <a href="#styles" className="block text-muted hover:text-ink">Styles</a>
                <a href="#pricing" className="block text-muted hover:text-ink">Pricing</a>
                <a href="#faq" className="block text-muted hover:text-ink">FAQ</a>
              </div>
              <div className="space-y-2">
                <p className="font-medium">Account</p>
                <Link href="/signin" className="block text-muted hover:text-ink">Sign in</Link>
                <Link href="/dashboard" className="block text-muted hover:text-ink">Dashboard</Link>
                <Link href="/stage" className="block text-muted hover:text-ink">Stage a room</Link>
              </div>
              <div className="space-y-2">
                <p className="font-medium">Contact</p>
                <a href="mailto:hello@staged.example" className="block text-muted hover:text-ink">
                  hello@staged.example
                </a>
              </div>
            </div>
          </div>
          <p className="mt-10 border-t border-line pt-6 text-xs text-muted">
            Virtually staged images are marketing visualizations. Disclose virtual staging where your MLS requires it.
          </p>
        </div>
      </footer>
    </div>
  );
}
