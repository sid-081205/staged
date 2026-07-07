export const PACK_PRICE_CENTS = Number(process.env.PRICE_CENTS ?? 500);
export const PACK_CREDITS = 5;
export const PACK_LABEL = `$${(PACK_PRICE_CENTS / 100).toFixed(0)}`;
export const PER_IMAGE_LABEL = `$${(PACK_PRICE_CENTS / PACK_CREDITS / 100).toFixed(0)}`;

/** Watermarked previews every account gets before buying credits. */
export const FREE_PREVIEWS = 2;

export const MAX_PHOTOS = 10;
export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

/** Max characters accepted from the optional free-text request box. */
export const MAX_EXTRA_PROMPT = 600;

/**
 * Every image mode Staged offers. Furniture styles furnish an empty room;
 * "utility" modes (declutter, enhance, dusk, renovate) transform the photo
 * without adding a furniture look. The single list keeps the render pipeline
 * simple — `buildPrompt` special-cases the utility keys.
 */
export const STYLES = {
  // ── Furniture styles (virtual staging) ──────────────────────────────
  modern: {
    label: "Modern",
    kind: "stage",
    prompt:
      "modern contemporary furniture: clean lines, low-profile sofa and chairs, neutral palette of warm grey, cream and black, one large abstract artwork, a simple area rug",
  },
  contemporary: {
    label: "Contemporary",
    kind: "stage",
    prompt:
      "contemporary furniture: current on-trend pieces, soft curves mixed with clean lines, layered neutral tones with one muted accent color, a statement light fixture, textured throw and cushions",
  },
  scandinavian: {
    label: "Scandinavian",
    kind: "stage",
    prompt:
      "Scandinavian furniture: light oak wood, white and oatmeal textiles, airy and minimal, simple pendant or floor lamp, a pale wool rug, one or two green plants",
  },
  japandi: {
    label: "Japandi",
    kind: "stage",
    prompt:
      "Japandi furniture: warm minimalism blending Japanese and Scandinavian design, low natural-wood pieces, muted earthy palette, handmade ceramics, linen textiles, uncluttered and serene",
  },
  minimalist: {
    label: "Minimalist",
    kind: "stage",
    prompt:
      "minimalist furniture: only the essential pieces, monochrome neutral palette, clean uninterrupted surfaces, hidden storage, a single sculptural accent, generous negative space",
  },
  midcentury: {
    label: "Mid-century modern",
    kind: "stage",
    prompt:
      "mid-century modern furniture: walnut wood with tapered legs, leather or tweed upholstery, muted mustard and teal accents, a low sideboard, a geometric rug",
  },
  industrial: {
    label: "Urban / industrial",
    kind: "stage",
    prompt:
      "urban industrial furniture: raw materials, matte black metal and reclaimed wood, leather seating, Edison-bulb lighting, concrete-toned palette, a worn leather or kilim rug",
  },
  farmhouse: {
    label: "Farmhouse",
    kind: "stage",
    prompt:
      "modern farmhouse furniture: rustic reclaimed wood, linen slip-covered seating, warm whites and beiges, woven baskets, a jute rug, simple ceramic decor",
  },
  rustic: {
    label: "Rustic",
    kind: "stage",
    prompt:
      "rustic furniture: chunky solid timber, natural leather and wool, earthy warm tones, stone and iron accents, a cozy cabin feel with a wool or hide rug",
  },
  traditional: {
    label: "Traditional",
    kind: "stage",
    prompt:
      "traditional furniture: classic tailored sofas, rich wood case goods, symmetrical arrangement, warm palette with deep accents, framed art, an ornate patterned area rug",
  },
  transitional: {
    label: "Transitional",
    kind: "stage",
    prompt:
      "transitional furniture: a balanced blend of traditional comfort and modern simplicity, neutral tones, tailored upholstery, subtle textures, understated elegant accents",
  },
  hamptons: {
    label: "Hamptons",
    kind: "stage",
    prompt:
      "Hamptons coastal-luxury furniture: crisp whites and soft blues, elegant slip-covered seating, natural woven textures, navy accents, refined casual beach-house elegance",
  },
  coastal: {
    label: "Coastal",
    kind: "stage",
    prompt:
      "coastal furniture: white and sand tones with soft blue accents, rattan and light wood pieces, linen slipcovers, airy sheer curtains left as-is, natural fiber rug",
  },
  bohemian: {
    label: "Bohemian",
    kind: "stage",
    prompt:
      "bohemian furniture: eclectic layered textiles, warm terracotta and jewel tones, rattan and low seating, plenty of plants, patterned rugs and macrame, relaxed and collected",
  },
  luxury: {
    label: "Luxury",
    kind: "stage",
    prompt:
      "high-end luxury furniture: designer pieces, marble and brass accents, velvet upholstery in deep neutral tones, statement lighting, large-format art, layered rugs",
  },
  commercial: {
    label: "Commercial / office",
    kind: "stage",
    prompt:
      "professional commercial office furniture: sleek desks and ergonomic chairs, a meeting or breakout area, neutral corporate palette with a brand-neutral accent, clean cable-free surfaces, subtle greenery",
  },

  // ── Utility modes (transform the photo, no furniture style) ──────────
  declutter: {
    label: "Declutter — remove furniture",
    kind: "utility",
    prompt: "",
  },
  enhance: {
    label: "Enhance — fix lighting & sky",
    kind: "utility",
    prompt: "",
  },
  dusk: {
    label: "Day to dusk — golden-hour twilight",
    kind: "utility",
    prompt: "",
  },
  renovate: {
    label: "Renovate — refresh finishes",
    kind: "utility",
    prompt: "",
  },
} as const;

export type StyleKey = keyof typeof STYLES;

/** Utility modes don't furnish — they transform the existing photo. */
export function isUtilityStyle(style: string): boolean {
  return (STYLES as Record<string, { kind: string }>)[style]?.kind === "utility";
}

export const FURNITURE_STYLE_KEYS = (Object.keys(STYLES) as StyleKey[]).filter(
  (k) => STYLES[k].kind === "stage"
);
export const UTILITY_STYLE_KEYS = (Object.keys(STYLES) as StyleKey[]).filter(
  (k) => STYLES[k].kind === "utility"
);

export const ROOM_TYPES = {
  living: "Living room",
  family: "Family / great room",
  bedroom: "Bedroom",
  primary: "Primary bedroom",
  kids: "Kids' room",
  nursery: "Nursery",
  dining: "Dining room",
  kitchen: "Kitchen",
  office: "Home office",
  study: "Study / library",
  bathroom: "Bathroom",
  entryway: "Entryway / foyer",
  hallway: "Hallway / landing",
  basement: "Basement / rec room",
  loft: "Loft / studio",
  sunroom: "Sunroom",
  gym: "Home gym",
  laundry: "Laundry / mudroom",
  outdoor: "Outdoor / patio",
  balcony: "Balcony / deck",
  exterior: "Exterior / facade",
  commercial: "Commercial space",
} as const;

export type RoomKey = keyof typeof ROOM_TYPES;

/** Trim and cap the optional free-text request so prompts stay bounded. */
export function sanitizeExtraPrompt(extra?: string | null): string {
  return (extra ?? "").replace(/\s+/g, " ").trim().slice(0, MAX_EXTRA_PROMPT);
}

export function buildPrompt(style: StyleKey, room: RoomKey, extra?: string | null): string {
  const roomLabel = (ROOM_TYPES[room] ?? "room").toLowerCase();
  const extraClean = sanitizeExtraPrompt(extra);
  const extraLine = extraClean
    ? ` Additional request from the agent — honor it as long as it does not alter the room's architecture, structure, walls, windows, doors or camera angle: ${extraClean}.`
    : "";

  if (style === "enhance") {
    return (
      [
        `Professionally enhance this real estate photo of a ${roomLabel} the way a listing photo editor would.`,
        "Correct the exposure and white balance, brighten dark areas naturally, recover blown-out windows, and make the light feel bright and inviting.",
        "If sky is visible through windows, make it a pleasant blue sky. Straighten the image if it is slightly tilted.",
        "CRITICAL: do not add, remove or move any furniture or objects. Do not change the room's architecture, contents, or camera angle. Every physical thing in the photo stays exactly as it is — only the photographic quality changes.",
        "The result must look like the same photo shot by a professional real estate photographer with proper HDR technique. Photorealistic, natural, not over-processed.",
      ].join(" ") + extraLine
    );
  }
  if (style === "declutter") {
    return (
      [
        `Remove all furniture, decor, rugs, curtains hung by occupants, and personal items from this real estate photo of a ${roomLabel}, leaving it completely empty.`,
        "Plausibly reconstruct the flooring, walls and skirting where items were removed.",
        "CRITICAL: do not change the room's architecture, windows, doors, built-in fixtures, flooring material, ceiling, wall color, lighting, or camera angle in any way.",
        "The result must look like a professional real estate photograph of the exact same room, empty.",
      ].join(" ") + extraLine
    );
  }
  if (style === "dusk") {
    return (
      [
        `Convert this real estate photo of a ${roomLabel} from daytime to a beautiful golden-hour dusk / twilight scene, the way a professional "day to dusk" real estate edit would.`,
        "Warm the interior and exterior lighting so windows, lamps and fixtures glow invitingly. Deepen any visible sky into rich dusk tones — soft warm orange near the horizon fading up into deep blue — and balance the overall exposure so the property still reads clearly.",
        "CRITICAL: do not add, remove or move any furniture, objects, landscaping or architecture. Do not change the building, layout or camera angle. Only the time of day, sky and lighting change.",
        "Photorealistic, natural, magazine-quality. No people, no text.",
      ].join(" ") + extraLine
    );
  }
  if (style === "renovate") {
    return (
      [
        `Show a realistic virtual renovation of this real estate photo of a ${roomLabel}, the way a renovation render previews an upgraded space to buyers.`,
        "Refresh the finishes to a clean, current, broadly appealing standard: fresh neutral paint, updated flooring, and refreshed cabinetry, countertops, fixtures and lighting where appropriate for the space.",
        "CRITICAL: keep the exact same room layout and footprint, the same window and door positions, ceiling height, and camera angle. Renovate finishes and fixtures only — do not move or remove walls or change the structure.",
        "Photorealistic and professionally finished. No people, no text.",
      ].join(" ") + extraLine
    );
  }

  return (
    [
      `Virtually stage this real estate photo of a ${roomLabel}.`,
      `Furnish it with realistic, correctly scaled ${STYLES[style].prompt}.`,
      `Choose pieces appropriate for a ${roomLabel} and arrange them naturally for the space.`,
      "CRITICAL: do not change the room's architecture, walls, windows, doors, flooring, ceiling, built-in fixtures, wall color, or camera angle in any way. Do not add or remove windows, doors or built-ins.",
      "Match the lighting, shadows and white balance of the original photo exactly.",
      "The result must look like a professional real estate photograph of the exact same room, professionally staged. Photorealistic. No people, no text.",
    ].join(" ") + extraLine
  );
}
