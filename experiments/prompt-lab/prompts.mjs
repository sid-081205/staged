/**
 * Prompt variants for the lab. These mirror production staging language from
 * lib/config.ts (buildPrompt) but are free to edit — production is untouched.
 *
 * Add / remove / rewrite entries freely. Each one is run against every model
 * in models.json (or --models).
 */

const PRESERVE =
  "PRESERVE EXACTLY, PIXEL-FAITHFUL TO THE ORIGINAL PHOTO: the camera position, camera angle and framing; every wall and its color; every window with its exact frame style, number of panes and the exact view through the glass; every door, radiator, vent, outlet and light fixture; the flooring material and plank direction; the ceiling and all trim. Do not add, remove, move or resize any of these. If the original has one window with three panes, the result has that same window with three panes.";

const LIGHTING =
  "Match the original photo's lighting direction, shadows, white balance and perspective so every added piece looks genuinely present in the room, with correct contact shadows on the existing floor.";

const FINISH =
  "The result must look like a professional real estate photograph of the exact same room, now professionally staged. Photorealistic. No people, no text, no watermark.";

/** Closest to current production modern living-room staging. */
const PROD_LIKE_MODERN = [
  "TASK: virtually stage this real estate photo of a living room by ADDING furniture into the attached photo. This is a photo EDIT: start from the attached image and place furniture into it. Do not invent, redraw or substitute a different room.",
  PRESERVE,
  "Into that unchanged space, add realistic, correctly scaled modern contemporary furniture: clean lines, low profile sofa and chairs, neutral palette of warm grey, cream and black, one large abstract artwork, a simple area rug.",
  "Arrange the pieces naturally for a living room, respecting walkways and the room's real proportions. The finished room MUST be furnished; never return an empty or nearly empty room.",
  LIGHTING,
  "The photo will be used on the MLS and listing sites, so the result must be believable and disclosure safe.",
  FINISH,
].join(" ");

export const PROMPTS = [
  {
    slug: "prod-like-modern",
    label: "Prod-like: modern living room",
    text: PROD_LIKE_MODERN,
  },
  {
    slug: "shorter-preserve",
    label: "Shorter preserve block",
    text: [
      "Edit the attached real estate photo in place. Add modern living room furniture (sofa, chairs, coffee table, rug, lamp, one artwork). Neutral warm greys and cream.",
      "Keep the exact same camera angle, windows, walls, doors, floor and ceiling. Do not redraw the room.",
      LIGHTING,
      FINISH,
    ].join(" "),
  },
  {
    slug: "aspect-lock",
    label: "Explicit aspect-ratio lock",
    text: [
      PROD_LIKE_MODERN,
      "CRITICAL: the output image MUST keep the exact same aspect ratio and orientation as the attached reference photo (portrait stays portrait, landscape stays landscape). Do not crop to a different shape.",
    ].join(" "),
  },
  {
    slug: "scandi-airbnb",
    label: "Scandinavian Airbnb cozy",
    text: [
      "TASK: virtually stage this real estate photo as a guest-ready short term rental living room in a Scandinavian style. This is a photo EDIT of the attached image.",
      PRESERVE,
      "Add light oak furniture, oatmeal textiles, warm lamp lighting, a pale wool rug, plants, and inviting touches like folded throws. Photogenic for booking sites.",
      LIGHTING,
      FINISH,
    ].join(" "),
  },
];
