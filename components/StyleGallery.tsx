"use client";

import { useState } from "react";

const LOOKS = [
  { key: "modern", label: "Modern", src: "/demo/after.jpg", note: "Clean lines, neutral palette. The safe default for most listings." },
  { key: "scandinavian", label: "Scandinavian", src: "/demo/scandinavian.jpg", note: "Light oak and oatmeal textiles. Makes small rooms feel airy." },
  { key: "midcentury", label: "Mid-century", src: "/demo/midcentury.jpg", note: "Walnut, tapered legs, warm accents. Character without clutter." },
  { key: "luxury", label: "Luxury", src: "/demo/luxury.jpg", note: "Velvet, marble, brass. For listings priced to impress." },
];

export default function StyleGallery() {
  const [active, setActive] = useState(0);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {LOOKS.map((look, i) => (
          <button
            key={look.key}
            onClick={() => setActive(i)}
            className={`rounded-xl border px-4 py-2 text-sm transition-colors ${
              i === active
                ? "border-ink bg-ink text-paper"
                : "border-line bg-transparent text-muted hover:border-ink hover:text-ink"
            }`}
          >
            {look.label}
          </button>
        ))}
      </div>

      <div className="relative mt-6 aspect-[4/3] w-full overflow-hidden rounded-2xl border border-line md:aspect-[16/10]">
        {LOOKS.map((look, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={look.key}
            src={look.src}
            alt={`${look.label} staging`}
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500"
            style={{ opacity: i === active ? 1 : 0 }}
            loading={i === 0 ? "eager" : "lazy"}
          />
        ))}
        <span className="absolute left-3 top-3 rounded-full bg-ink px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-widest text-paper">
          Same photo, same room
        </span>
      </div>

      <p className="mt-4 text-sm text-muted">{LOOKS[active].note}</p>
    </div>
  );
}
