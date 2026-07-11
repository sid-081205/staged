// Hardcoded (not an env var) on purpose: this file is imported by client
// components, and a server-only env var would be undefined in the browser,
// making the server and client render different prices (hydration error).
export const PACK_PRICE_CENTS = 300;
export const PACK_CREDITS = 10;
export const PACK_LABEL = `$${(PACK_PRICE_CENTS / 100).toFixed(0)}`;

const PER_IMAGE_CENTS = PACK_PRICE_CENTS / PACK_CREDITS;
/** "30¢" below a dollar, "$1" at or above, so the label reads naturally. */
export const PER_IMAGE_LABEL =
  PER_IMAGE_CENTS >= 100 && PER_IMAGE_CENTS % 100 === 0
    ? `$${PER_IMAGE_CENTS / 100}`
    : `${Math.round(PER_IMAGE_CENTS)}¢`;

/** Watermarked previews every account gets before buying credits. */
export const FREE_PREVIEWS = 1;

export const MAX_PHOTOS = 10;
export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

/** Max characters accepted from the optional free-text request box. */
export const MAX_EXTRA_PROMPT = 600;

/**
 * The three things Staged does to a photo. The user picks one of these first,
 * then (for staging) a room type and a furniture style.
 */
export const SERVICES = {
  stage: {
    label: "Stage with furniture",
    description: "Furnish an empty room for a sale listing or an Airbnb.",
  },
  declutter: {
    label: "Remove furniture and clutter",
    description: "Empty the room so you can restage it or show the space.",
  },
  enhance: {
    label: "Fix lighting and sky",
    description: "Brighten the photo and clean up the window views.",
  },
} as const;

export type ServiceKey = keyof typeof SERVICES;

export function isService(value: string): value is ServiceKey {
  return value in SERVICES;
}

/**
 * Furniture styles for the staging service, grouped by situation. The point of
 * Staged is staging for every situation: selling on the MLS, hosting on
 * Airbnb, or presenting a commercial space.
 */
export const STYLES = {
  // ── For sale listings ────────────────────────────────────────────────
  modern: {
    label: "Modern",
    group: "sale",
    prompt:
      "modern contemporary furniture: clean lines, low profile sofa and chairs, neutral palette of warm grey, cream and black, one large abstract artwork, a simple area rug",
  },
  contemporary: {
    label: "Contemporary",
    group: "sale",
    prompt:
      "contemporary furniture: current on trend pieces, soft curves mixed with clean lines, layered neutral tones with one muted accent color, a statement light fixture, textured throw and cushions",
  },
  scandinavian: {
    label: "Scandinavian",
    group: "sale",
    prompt:
      "Scandinavian furniture: light oak wood, white and oatmeal textiles, airy and minimal, simple pendant or floor lamp, a pale wool rug, one or two green plants",
  },
  japandi: {
    label: "Japandi",
    group: "sale",
    prompt:
      "Japandi furniture: warm minimalism blending Japanese and Scandinavian design, low natural wood pieces, muted earthy palette, handmade ceramics, linen textiles, uncluttered and serene",
  },
  minimalist: {
    label: "Minimalist",
    group: "sale",
    prompt:
      "minimalist furniture: only the essential pieces, monochrome neutral palette, clean uninterrupted surfaces, hidden storage, a single sculptural accent, generous negative space",
  },
  midcentury: {
    label: "Midcentury modern",
    group: "sale",
    prompt:
      "mid century modern furniture: walnut wood with tapered legs, leather or tweed upholstery, muted mustard and teal accents, a low sideboard, a geometric rug",
  },
  industrial: {
    label: "Urban industrial",
    group: "sale",
    prompt:
      "urban industrial furniture: raw materials, matte black metal and reclaimed wood, leather seating, Edison bulb lighting, concrete toned palette, a worn leather or kilim rug",
  },
  farmhouse: {
    label: "Farmhouse",
    group: "sale",
    prompt:
      "modern farmhouse furniture: rustic reclaimed wood, linen slipcovered seating, warm whites and beiges, woven baskets, a jute rug, simple ceramic decor",
  },
  rustic: {
    label: "Rustic",
    group: "sale",
    prompt:
      "rustic furniture: chunky solid timber, natural leather and wool, earthy warm tones, stone and iron accents, a cozy cabin feel with a wool or hide rug",
  },
  traditional: {
    label: "Traditional",
    group: "sale",
    prompt:
      "traditional furniture: classic tailored sofas, rich wood case goods, symmetrical arrangement, warm palette with deep accents, framed art, an ornate patterned area rug",
  },
  transitional: {
    label: "Transitional",
    group: "sale",
    prompt:
      "transitional furniture: a balanced blend of traditional comfort and modern simplicity, neutral tones, tailored upholstery, subtle textures, understated elegant accents",
  },
  hamptons: {
    label: "Hamptons",
    group: "sale",
    prompt:
      "Hamptons coastal luxury furniture: crisp whites and soft blues, elegant slipcovered seating, natural woven textures, navy accents, refined casual beach house elegance",
  },
  coastal: {
    label: "Coastal",
    group: "sale",
    prompt:
      "coastal furniture: white and sand tones with soft blue accents, rattan and light wood pieces, linen slipcovers, airy sheer curtains left as is, natural fiber rug",
  },
  bohemian: {
    label: "Bohemian",
    group: "sale",
    prompt:
      "bohemian furniture: eclectic layered textiles, warm terracotta and jewel tones, rattan and low seating, plenty of plants, patterned rugs and macrame, relaxed and collected",
  },
  luxury: {
    label: "Luxury",
    group: "sale",
    prompt:
      "high end luxury furniture: designer pieces, marble and brass accents, velvet upholstery in deep neutral tones, statement lighting, large format art, layered rugs",
  },

  // ── For Airbnb and short term rentals ────────────────────────────────
  airbnb_cozy: {
    label: "Airbnb cozy",
    group: "airbnb",
    prompt:
      "warm, guest ready short term rental furnishings: comfortable quality seating or bedding, layered soft textiles, warm lamp lighting, tasteful wall art and plants, welcoming touches like folded throws and a coffee corner where appropriate, inviting and photogenic for booking sites",
  },
  airbnb_modern: {
    label: "Airbnb modern",
    group: "airbnb",
    prompt:
      "clean modern short term rental furnishings: durable contemporary pieces, crisp white linens, simple tasteful decor, uncluttered surfaces, bright and fresh, the polished look that performs well in booking photos",
  },
  airbnb_family: {
    label: "Airbnb family friendly",
    group: "airbnb",
    prompt:
      "family friendly short term rental furnishings: comfortable seating for a group, a sturdy dining table, generous practical sleeping arrangements where appropriate, warm durable decor, welcoming and spacious",
  },
  airbnb_premium: {
    label: "Airbnb premium",
    group: "airbnb",
    prompt:
      "premium boutique hotel style furnishings: designer inspired pieces, plush bedding or seating, statement lighting, refined decor, the elevated look of a high end short term rental",
  },

  // ── Other spaces ─────────────────────────────────────────────────────
  commercial: {
    label: "Commercial office",
    group: "other",
    prompt:
      "professional commercial office furniture: sleek desks and ergonomic chairs, a meeting or breakout area, neutral corporate palette, clean cable free surfaces, subtle greenery",
  },
} as const;

export type StyleKey = keyof typeof STYLES;

export function isStyle(value: string): value is StyleKey {
  return value in STYLES;
}

export const STYLE_GROUPS: { label: string; keys: StyleKey[] }[] = [
  {
    label: "For sale listings",
    keys: (Object.keys(STYLES) as StyleKey[]).filter((k) => STYLES[k].group === "sale"),
  },
  {
    label: "For Airbnb and short term rentals",
    keys: (Object.keys(STYLES) as StyleKey[]).filter((k) => STYLES[k].group === "airbnb"),
  },
  {
    label: "Other spaces",
    keys: (Object.keys(STYLES) as StyleKey[]).filter((k) => STYLES[k].group === "other"),
  },
];

export const FURNITURE_STYLE_COUNT = Object.keys(STYLES).length;

/**
 * Renders store either a furniture style key (staging) or a service key
 * (declutter / enhance) in their `style` column. This resolves either to a
 * display label, including keys from removed modes so old renders still show.
 */
export function modeLabel(key: string): string {
  if (isStyle(key)) return STYLES[key].label;
  if (isService(key)) return SERVICES[key].label;
  const legacy: Record<string, string> = {
    declutter: "Declutter",
    enhance: "Enhance",
    dusk: "Day to dusk",
    renovate: "Renovate",
  };
  return legacy[key] ?? key;
}

export const ROOM_TYPES = {
  living: "Living room",
  family: "Family room",
  bedroom: "Bedroom",
  primary: "Primary bedroom",
  kids: "Kids' room",
  nursery: "Nursery",
  dining: "Dining room",
  kitchen: "Kitchen",
  office: "Home office",
  study: "Study or library",
  bathroom: "Bathroom",
  entryway: "Entryway",
  hallway: "Hallway",
  basement: "Basement",
  loft: "Loft or studio",
  sunroom: "Sunroom",
  gym: "Home gym",
  laundry: "Laundry or mudroom",
  outdoor: "Outdoor patio",
  balcony: "Balcony or deck",
  exterior: "Exterior",
  commercial: "Commercial space",
} as const;

export type RoomKey = keyof typeof ROOM_TYPES;

/** Trim and cap the optional free-text request so prompts stay bounded. */
export function sanitizeExtraPrompt(extra?: string | null): string {
  return (extra ?? "").replace(/\s+/g, " ").trim().slice(0, MAX_EXTRA_PROMPT);
}

/**
 * The instruction handed to the image model. Hard-negatives framing (from
 * prompt-lab variant C): explicit DO NOT list for architecture, plus a narrow
 * allow-list of what may change per service. Free-text requests are honored
 * literally but can never override the architecture rules.
 */
export function buildPrompt(
  service: ServiceKey,
  style: StyleKey | null,
  room: RoomKey,
  extra?: string | null
): string {
  const roomLabel = (ROOM_TYPES[room] ?? "room").toLowerCase();
  const extraClean = sanitizeExtraPrompt(extra);
  const extraLine = extraClean
    ? ` The client added a specific request: "${extraClean}". Follow it literally. If it names a specific item (for example a grand piano), include exactly that item at the correct real-world scale; never substitute a similar item. The request never permits changing the room's architecture, walls, windows, doors or camera angle.`
    : "";

  const hardConstraints = [
    "HARD CONSTRAINTS — violating any of these fails the task:",
    "DO NOT change window frames, mullions, pane count, glass reflections, or the outdoor view.",
    "DO NOT change wall color, floor material, ceiling, trim, doors, radiators, vents, outlets, or built-in fixtures.",
    "DO NOT change camera position, focal length, perspective, or crop.",
    "DO NOT rebuild, restyle, or 'improve' the architecture.",
    `DO NOT replace the ${roomLabel} with a similar-looking room or any other room type.`,
  ].join(" ");

  if (service === "enhance") {
    return (
      [
        `Image-to-image EDIT of the attached real estate photo of a ${roomLabel}. Only photographic quality may change — not objects or architecture.`,
        "Correct the exposure and white balance, brighten dark areas naturally, recover washed out windows, and make the light feel bright and inviting. If sky is visible through windows, make it a pleasant blue sky. Straighten the image if it is slightly tilted.",
        "DO NOT add, remove or move any furniture or objects. Every physical thing stays exactly where it is.",
        hardConstraints,
        "The result must look like the same photo shot by a professional real estate photographer with proper HDR technique. Photorealistic, natural, not over processed. No people, no text, no watermark.",
      ].join(" ") + extraLine
    );
  }

  if (service === "declutter") {
    return (
      [
        `Image-to-image EDIT of the attached real estate photo of a ${roomLabel}. Remove furniture, decor, rugs, occupant curtains and personal items, leaving the room empty.`,
        "Plausibly reconstruct the flooring, walls and skirting where items were removed, matching the surrounding surfaces.",
        hardConstraints,
        "Only pixels that change should be removed clutter and the reconstructed surfaces behind them.",
        "The result must look like a professional real estate photograph of the exact same room, now empty. Photorealistic. No people, no text, no watermark.",
      ].join(" ") + extraLine
    );
  }

  const styleKey: StyleKey = style ?? "modern";
  const situation =
    STYLES[styleKey].group === "airbnb"
      ? "The photo will be used on Airbnb and other booking sites, so the room should look inviting and guest ready."
      : "The photo will be used on the MLS and listing sites, so the result must be believable and disclosure safe.";

  return (
    [
      `Image-to-image EDIT of the attached real estate photo of a ${roomLabel}. Insert furniture only — do not invent or substitute a different room.`,
      `Add realistic, correctly scaled ${STYLES[styleKey].prompt}.`,
      `Arrange the pieces naturally for a ${roomLabel}, respecting walkways and the room's real proportions. The finished room MUST be furnished; never return an empty or nearly empty room.`,
      hardConstraints,
      "Only new pixels should be furniture and soft decor sitting on the EXISTING floor with correct contact shadows.",
      "Match the original photo's lighting direction, shadows, white balance and perspective so every added piece looks genuinely present in the room.",
      situation,
      "Photorealistic. No people, no text, no watermark.",
    ].join(" ") + extraLine
  );
}
