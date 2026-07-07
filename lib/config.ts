export const PACK_PRICE_CENTS = Number(process.env.PRICE_CENTS ?? 500);
export const PACK_CREDITS = 5;
export const PACK_LABEL = `$${(PACK_PRICE_CENTS / 100).toFixed(0)}`;
export const PER_IMAGE_LABEL = `$${(PACK_PRICE_CENTS / PACK_CREDITS / 100).toFixed(0)}`;

/** Watermarked previews every account gets before buying credits. */
export const FREE_PREVIEWS = 2;

export const MAX_PHOTOS = 10;
export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

export const STYLES = {
  modern: {
    label: "Modern",
    prompt:
      "modern contemporary furniture: clean lines, low-profile sofa and chairs, neutral palette of warm grey, cream and black, one large abstract artwork, a simple area rug",
  },
  scandinavian: {
    label: "Scandinavian",
    prompt:
      "Scandinavian furniture: light oak wood, white and oatmeal textiles, airy and minimal, simple pendant or floor lamp, a pale wool rug, one or two green plants",
  },
  midcentury: {
    label: "Mid-century",
    prompt:
      "mid-century modern furniture: walnut wood with tapered legs, leather or tweed upholstery, muted mustard and teal accents, a low sideboard, a geometric rug",
  },
  farmhouse: {
    label: "Farmhouse",
    prompt:
      "modern farmhouse furniture: rustic reclaimed wood, linen slip-covered seating, warm whites and beiges, woven baskets, a jute rug, simple ceramic decor",
  },
  luxury: {
    label: "Luxury",
    prompt:
      "high-end luxury furniture: designer pieces, marble and brass accents, velvet upholstery in deep neutral tones, statement lighting, large-format art, layered rugs",
  },
  coastal: {
    label: "Coastal",
    prompt:
      "coastal furniture: white and sand tones with soft blue accents, rattan and light wood pieces, linen slipcovers, airy sheer curtains left as-is, natural fiber rug",
  },
  declutter: {
    label: "Declutter (remove furniture)",
    prompt: "",
  },
  enhance: {
    label: "Enhance (fix lighting & sky)",
    prompt: "",
  },
} as const;

export type StyleKey = keyof typeof STYLES;

export const ROOM_TYPES = {
  living: "Living room",
  bedroom: "Bedroom",
  dining: "Dining room",
  kitchen: "Kitchen",
  office: "Home office",
  bathroom: "Bathroom",
  outdoor: "Outdoor / patio",
} as const;

export type RoomKey = keyof typeof ROOM_TYPES;

export function buildPrompt(style: StyleKey, room: RoomKey): string {
  const roomLabel = ROOM_TYPES[room].toLowerCase();
  if (style === "enhance") {
    return [
      `Professionally enhance this real estate photo of a ${roomLabel} the way a listing photo editor would.`,
      "Correct the exposure and white balance, brighten dark areas naturally, recover blown-out windows, and make the light feel bright and inviting.",
      "If sky is visible through windows, make it a pleasant blue sky. Straighten the image if it is slightly tilted.",
      "CRITICAL: do not add, remove or move any furniture or objects. Do not change the room's architecture, contents, or camera angle. Every physical thing in the photo stays exactly as it is — only the photographic quality changes.",
      "The result must look like the same photo shot by a professional real estate photographer with proper HDR technique. Photorealistic, natural, not over-processed.",
    ].join(" ");
  }
  if (style === "declutter") {
    return [
      `Remove all furniture, decor, rugs, curtains hung by occupants, and personal items from this real estate photo of a ${roomLabel}, leaving it completely empty.`,
      "Plausibly reconstruct the flooring, walls and skirting where items were removed.",
      "CRITICAL: do not change the room's architecture, windows, doors, built-in fixtures, flooring material, ceiling, wall color, lighting, or camera angle in any way.",
      "The result must look like a professional real estate photograph of the exact same room, empty.",
    ].join(" ");
  }
  return [
    `Virtually stage this real estate photo of a ${roomLabel}.`,
    `Furnish it with realistic, correctly scaled ${STYLES[style].prompt}.`,
    `Choose pieces appropriate for a ${roomLabel} and arrange them naturally for the space.`,
    "CRITICAL: do not change the room's architecture, walls, windows, doors, flooring, ceiling, built-in fixtures, wall color, or camera angle in any way. Do not add or remove windows, doors or built-ins.",
    "Match the lighting, shadows and white balance of the original photo exactly.",
    "The result must look like a professional real estate photograph of the exact same room, professionally staged. Photorealistic. No people, no text.",
  ].join(" ");
}
