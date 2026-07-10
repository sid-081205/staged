import Link from "next/link";
import BeforeAfterSlider from "@/components/BeforeAfterSlider";
import Logo from "@/components/Logo";
import SiteHeader from "@/components/SiteHeader";
import StyleGallery from "@/components/StyleGallery";
import Reveal from "@/components/Reveal";
import {
  FREE_PREVIEWS,
  FURNITURE_STYLE_COUNT,
  PACK_CREDITS,
  PACK_LABEL,
  PER_IMAGE_LABEL,
} from "@/lib/config";

const faq: [string, string][] = [
  [
    "How does pricing work?",
    `${PACK_LABEL} buys ${PACK_CREDITS} images, which works out to ${PER_IMAGE_LABEL} per image for any edit. Packs stack and credits never expire. Every new account also gets ${FREE_PREVIEWS} free watermarked preview to try it first.`,
  ],
  [
    "Do I need an account?",
    "Yes. Sign in with just your email (we send a 6 digit code, no password) so your images and credits stay in one place. It takes about 20 seconds.",
  ],
  [
    "Can I stage for Airbnb as well as sale listings?",
    "Yes. The furniture styles are grouped by situation: styles for sale listings, styles for Airbnb and short term rentals, and commercial spaces. Pick the one that matches how the property will be marketed.",
  ],
  [
    "Is virtual staging allowed on the MLS?",
    "Yes. Most MLSs allow it and require disclosure. Every download has an optional \"Virtually staged\" label you can toggle on to stay compliant. Check your local MLS rules, since some also want the empty original alongside.",
  ],
  [
    "What photos work best?",
    "A straight on, well lit photo of the whole room, shot from a corner or doorway at chest height. Phone photos are fine, including iPhone HEIC files. Blurry or very dark photos produce worse furniture.",
  ],
  [
    "Can it remove existing furniture?",
    "Yes. Pick \"Remove furniture and clutter\" and it empties the room instead of furnishing it. For occupied listings: declutter first, then stage the empty result.",
  ],
  [
    "Can it just fix my photos without adding furniture?",
    "Yes. Pick \"Fix lighting and sky\". It corrects exposure and white balance, brightens dark rooms, recovers washed out windows and cleans up the sky, without touching a single object. Photo editors charge $2 to $4 per photo for exactly this.",
  ],
  [
    "Does it change the room itself?",
    "No. Walls, windows, floors, and fixtures stay as photographed. Only furniture and decor are added. Every render is checked against your original photo before it is delivered, and if one still alters the architecture, regenerate it.",
  ],
  [
    "Why is this better than other AI tools?",
    "We use the best intelligent models and give you a fraction of what any business does. If you find another real estate image company with a lower price, we will match them. We also use custom skills and prompting to ensure your image does not get distorted, which is common with AI models of today.",
  ],
  [
    "Who owns the images?",
    "You do. Use them on the MLS, Zillow, Airbnb, brochures, social, anywhere. No attribution, no extra license fees.",
  ],
  [
    "What if the renders are unusable?",
    "Email us within 7 days and we refund the pack. No forms, no arguing.",
  ],
];

const steps: [string, string][] = [
  [
    "Sign in",
    "The simplest onboarding possible. Type your email, enter the 6 digit code we send you, and you're in. Everything (your listings, images and credits) is linked to your email. No passwords, no forms, no card.",
  ],
  [
    "Stage it",
    `Upload your photos and pick one of three edits: stage with furniture (${FURNITURE_STYLE_COUNT} styles for sale listings and Airbnbs), remove furniture and clutter, or fix the lighting and sky. A custom prompt box lets you add anything specific, like a grand piano or warmer tones.`,
  ],
  [
    "Download",
    "Full resolution, no watermark, yours outright. One click adds the MLS \"Virtually staged\" disclosure label. And if you're not happy with the results, just email us and we'll give you a refund.",
  ],
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
    tag: "Stage with furniture",
    title: "Furnish empty rooms.",
    body: `Upload a bare room and get it back professionally furnished in minutes, in any of ${FURNITURE_STYLE_COUNT} styles grouped by situation: selling on the MLS, hosting on Airbnb, or presenting a commercial space. Walls, windows, floors and the camera angle stay exactly as photographed. Only furniture and decor are added.`,
    before: "/demo/before.jpg",
    after: "/demo/stage-after.jpg",
    beforeLabel: "Empty",
    afterLabel: "Staged",
  },
  {
    id: "declutter",
    tag: "Remove furniture and clutter",
    title: "Clear out the clutter.",
    body: "Occupied home full of the seller's furniture, boxes and personal items? Strip it back to a clean, empty room. The floors and walls behind removed objects are reconstructed. It is the essential first step for lived in listings, before you restage them.",
    before: "/demo/bed-after.jpg",
    after: "/demo/bed-before.jpg",
    beforeLabel: "Cluttered",
    afterLabel: "Cleared",
  },
  {
    id: "enhance",
    tag: "Fix lighting and sky",
    title: "Fix the light and sky.",
    body: "Correct exposure and white balance, lift dark rooms, recover washed out windows and drop in a clean blue sky, without moving a single object in the room. It is the low cost edit nearly every listing photo needs.",
    before: "/demo/before.jpg",
    after: "/demo/enhance-after.jpg",
    beforeLabel: "As shot",
    afterLabel: "Enhanced",
  },
];

const comparison: [string, string, string, string][] = [
  [`Cost for ${PACK_CREDITS} photos`, PACK_LABEL, "$300", "$1,500 median per home"],
  ["Turnaround", "Minutes", "Up to 48 hours", "Days, plus a 30 to 90 day furniture rental"],
  ["Revisions", `${PER_IMAGE_LABEL} per render`, "Free within 2 months", "Restage"],
  ["Styles to compare", `${FURNITURE_STYLE_COUNT} per photo`, "9 styles, 1 per order", "1"],
  ["Furniture removal", "Included", "$5 to $10 per image", "Movers"],
  ["Photo enhancement", "Included", "$2 per image", "Not offered"],
];

export default function Home() {
  return (
    <div>
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Hero */}
        <section className="grid gap-10 py-10 md:grid-cols-[1fr_1.1fr] md:items-center md:gap-12 md:py-16">
          <Reveal>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
              Virtual Staging for Homes
            </p>
            <h1 className="mt-4 font-serif text-[2.6rem] leading-[1.04] sm:text-5xl md:text-[4.2rem]">
              Empty rooms
              <br />
              don&rsquo;t sell.
              <br />
              <em className="text-accent">Staged ones do.</em>
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-muted">
              Upload a photo of an empty room. Download it professionally furnished,
              minutes later. Stagely uses the best image models tuned for real estate:
              correct furniture scale, MLS-safe architecture, and lighting true to the
              original photo. Every render looks like a listing shot.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/dashboard"
                className="rounded-xl border border-ink bg-ink px-6 py-3.5 text-paper transition-colors hover:bg-transparent hover:text-ink"
              >
                Start staging, first preview free
              </Link>
              <a href="#styles" className="text-sm text-muted underline-offset-4 hover:text-ink hover:underline">
                See the styles ↓
              </a>
            </div>
            <p className="mt-4 text-sm text-muted">
              Sign in with your email. No password, no card, no subscription.
            </p>
          </Reveal>
          <Reveal delay={150}>
            <BeforeAfterSlider before="/demo/before.jpg" after="/demo/after.jpg" autoplay />
            <p className="mt-2 text-center text-xs uppercase tracking-widest text-muted">
              Drag the divider. Real render, same photo
            </p>
          </Reveal>
        </section>

        {/* Staging stats */}
        <section className="border-t border-line py-12 md:py-16">
          <Reveal>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">Why stage at all</p>
            <h2 className="mt-3 font-serif text-3xl sm:text-4xl">Buyers pay more for rooms they can picture.</h2>
          </Reveal>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {(
              [
                ["83%", "of buyers' agents say staging makes it easier to visualize a property as their future home."],
                ["29%", "of agents reported staging led to a 1% to 10% increase in the dollar value offered."],
                ["49%", "of sellers' agents saw staging reduce time on the market."],
              ] as [string, string][]
            ).map(([stat, body], i) => (
              <Reveal key={stat} delay={i * 120}>
                <div className="rounded-2xl border border-line p-6">
                  <p className="font-serif text-5xl text-accent">{stat}</p>
                  <p className="mt-3 leading-relaxed text-muted">{body}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted">
            Source:{" "}
            <a
              href="https://www.nar.realtor/press-releases/nar-report-reveals-home-staging-boosts-sale-prices-and-reduces-time-on-market"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-ink"
            >
              National Association of Realtors, 2025 Profile of Home Staging
            </a>
          </p>
        </section>

        {/* Core offerings */}
        <section id="offerings" className="border-t border-line py-12 md:py-16">
          <Reveal>
            <div className="max-w-2xl">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">What Stagely does</p>
              <h2 className="mt-3 font-serif text-3xl sm:text-4xl">Stage it. Clear it. Fix the light.</h2>
              <p className="mt-4 leading-relaxed text-muted">
                Three edits, one tool. Furnish empty rooms for a sale listing or an
                Airbnb, remove furniture and clutter from occupied homes, or fix the
                lighting on photos that came out dark. Drag any divider below to
                compare: same room, same angle.
              </p>
            </div>
          </Reveal>
          <div className="mt-10 space-y-12">
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
        <section id="styles" className="border-t border-line py-12 md:py-16">
          <Reveal>
            <div className="max-w-2xl">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">One photo, many directions</p>
              <h2 className="mt-3 font-serif text-3xl sm:text-4xl">Match the furniture to the buyer.</h2>
              <p className="mt-4 leading-relaxed text-muted">
                A starter condo shows better in Scandinavian. A $2M listing needs
                the luxury treatment. An Airbnb needs to look warm and guest ready.
                Render the same room across {FURNITURE_STYLE_COUNT} styles and pick
                what fits. Every style below is the identical photo, staged by
                Stagely.
              </p>
            </div>
          </Reveal>
          <Reveal delay={100} className="mt-10">
            <StyleGallery />
          </Reveal>
        </section>

        {/* How it works */}
        <section className="border-t border-line py-12 md:py-16">
          <Reveal>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">Three steps</p>
            <h2 className="mt-3 font-serif text-3xl sm:text-4xl">Listing ready before your coffee cools.</h2>
          </Reveal>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
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
        <section className="border-t border-line py-12 md:py-16">
          <Reveal>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">The math</p>
            <h2 className="mt-3 font-serif text-3xl sm:text-4xl">Same photos on the MLS. Very different invoice.</h2>
          </Reveal>
          <Reveal delay={100}>
            <div className="mt-10 overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse overflow-hidden rounded-2xl border border-line text-[15px]">
                <thead>
                  <tr className="bg-paper-2">
                    <th className="border-b border-r border-line px-4 py-4 text-left font-medium text-muted" />
                    <th className="border-b border-r border-line px-4 py-4 text-center font-serif text-lg">
                      Stagely
                    </th>
                    <th className="border-b border-r border-line px-4 py-4 text-center font-medium text-muted">
                      BoxBrownie
                      <span className="mt-0.5 block text-xs font-normal leading-snug">(human editors)</span>
                    </th>
                    <th className="border-b border-line px-4 py-4 text-center font-medium text-muted">
                      Physical staging
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.map(([label, us, virtual, physical], i) => {
                    const rowBorder = i < comparison.length - 1 ? "border-b border-line" : "";
                    const priceClass = label.startsWith("Cost") ? "tabular-price tabular-price--nowrap" : "tabular-price";
                    return (
                      <tr key={label}>
                        <td className={`border-r border-line px-4 py-4 text-left text-muted ${rowBorder}`}>
                          {label}
                        </td>
                        <td className={`border-r border-line px-4 py-4 text-center ${rowBorder}`}>
                          <span className={`${priceClass} font-medium`}>{us}</span>
                        </td>
                        <td className={`border-r border-line px-4 py-4 text-center ${rowBorder}`}>
                          <span className={`${priceClass} text-muted`}>{virtual}</span>
                        </td>
                        <td className={`px-4 py-4 text-center ${rowBorder}`}>
                          <span className={`${priceClass} text-muted`}>{physical}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-3 max-w-3xl text-xs leading-relaxed text-muted">
              Sources:{" "}
              <a
                href="https://www.boxbrownie.com/virtual-staging"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-ink"
              >
                BoxBrownie published price list
              </a>{" "}
              (virtual staging $30 per image, image enhancement $2 per image, item removal $5 to $10 per
              image, up to 48 hour turnaround, 9 design styles with free revisions for 2 months);{" "}
              <a
                href="https://www.nar.realtor/press-releases/nar-report-reveals-home-staging-boosts-sale-prices-and-reduces-time-on-market"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-ink"
              >
                National Association of Realtors, 2025 Profile of Home Staging
              </a>{" "}
              (median cost of a professional physical staging service: $1,500 per home).
            </p>
          </Reveal>
        </section>

        {/* Pricing */}
        <section id="pricing" className="border-t border-line py-12 md:py-16">
          <div className="grid gap-10 md:grid-cols-2">
            <Reveal>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">Pricing</p>
              <h2 className="mt-3 font-serif text-3xl sm:text-4xl">
                {PER_IMAGE_LABEL} an image. That&rsquo;s the whole pricing page.
              </h2>
              <p className="mt-4 max-w-md leading-relaxed text-muted">
                Stagers price per photo because their labor scales per photo. Ours
                doesn&rsquo;t, so you shouldn&rsquo;t pay like it does. Buy images
                {" "}{PACK_CREDITS} at a time and spend them on any edit, any listing,
                whenever. They never expire.
              </p>
              <p className="mt-4 max-w-md leading-relaxed text-muted">
                A whole pack costs {PACK_LABEL}, less than a coffee. One extra
                showing pays for years of it.
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
                    `${PER_IMAGE_LABEL} per image: stage, remove clutter, or fix lighting`,
                    "Full resolution downloads, no watermark",
                    "Credits never expire, packs stack",
                    "Up to 10 photos per listing, unlimited listings",
                    "Optional \"Virtually staged\" MLS label",
                    "Full commercial rights: MLS, Zillow, Airbnb, print",
                    "7 day refund if the renders don't work for you",
                  ].map((line) => (
                    <li key={line} className="flex gap-3">
                      <span className="text-accent">·</span>
                      {line}
                    </li>
                  ))}
                </ul>
                <p className="mt-6 border-t border-line pt-4 text-sm text-muted">
                  Try first: every account starts with {FREE_PREVIEWS} free watermarked preview. No card required.
                </p>
                <Link
                  href="/dashboard"
                  className="mt-6 block rounded-xl border border-ink bg-ink px-6 py-3.5 text-center text-paper transition-colors hover:bg-transparent hover:text-ink"
                >
                  Start staging
                </Link>
              </div>
            </Reveal>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="border-t border-line py-12 md:py-16">
          <div className="mx-auto max-w-3xl">
            <Reveal>
              <div className="text-center">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">Questions</p>
                <h2 className="mt-3 font-serif text-3xl sm:text-4xl">Asked and answered.</h2>
                <p className="mt-4 leading-relaxed text-muted">
                  Something else?{" "}
                  <a href="mailto:hello@stagely.org" className="text-ink underline underline-offset-4">
                    Email us
                  </a>
                  . A person replies.
                </p>
              </div>
            </Reveal>
            <Reveal delay={100}>
              <div className="mt-10 divide-y divide-line border-y border-line">
                {faq.map(([q, a]) => (
                  <details key={q} className="group py-5">
                    <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
                      {q}
                      <span className="ml-4 shrink-0 text-muted transition-transform duration-200 group-open:rotate-45">
                        +
                      </span>
                    </summary>
                    <p className="mt-3 leading-relaxed text-muted">{a}</p>
                  </details>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* Final CTA */}
        <section className="border-t border-line py-12 text-center md:py-16">
          <Reveal>
            <h2 className="mx-auto max-w-2xl font-serif text-3xl leading-tight sm:text-4xl md:text-5xl">
              Your next listing has empty rooms.
              <br />
              <em className="text-accent">Fix that for {PER_IMAGE_LABEL} a photo.</em>
            </h2>
            <Link
              href="/dashboard"
              className="mt-10 inline-block rounded-2xl border border-ink bg-ink px-8 py-4 text-lg text-paper transition-colors hover:bg-transparent hover:text-ink"
            >
              Start staging, first preview free
            </Link>
          </Reveal>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-line bg-paper-2">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-8">
            <div>
              <span className="flex items-center gap-2.5 font-serif text-3xl">
                <Logo className="h-8 w-8" />
                Stagely
              </span>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted">
                Virtual staging for real estate listings and Airbnbs. Upload empty
                rooms, download furnished ones.
              </p>
            </div>
            <div className="flex flex-wrap gap-10 text-sm sm:gap-16">
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
                <Link href="/dashboard" className="block text-muted hover:text-ink">Stage a room</Link>
              </div>
              <div className="space-y-2">
                <p className="font-medium">Contact</p>
                <a href="mailto:hello@stagely.org" className="block text-muted hover:text-ink">
                  hello@stagely.org
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
