/**
 * Prompt lab variants focused on ONE problem: the model alters too much
 * (windows, walls, camera, architecture) instead of only adding what was asked.
 *
 * Same input photo for every variant. Compare outputs in output/index.html.
 * Production (lib/config.ts) is untouched.
 */

const FURNITURE =
  "Add only: a modern low-profile sofa, two chairs, a simple coffee table, one area rug, one floor or table lamp, and one piece of wall art. Neutral warm grey / cream palette. Correct real-world scale. Nothing else.";

export const PROMPTS = [
  {
    slug: "baseline-prod",
    label: "A · Baseline (prod-like)",
    text: [
      "TASK: virtually stage this real estate photo of a living room by ADDING furniture into the attached photo. This is a photo EDIT: start from the attached image and place furniture into it. Do not invent, redraw or substitute a different room.",
      "PRESERVE EXACTLY, PIXEL-FAITHFUL TO THE ORIGINAL PHOTO: the camera position, camera angle and framing; every wall and its color; every window with its exact frame style, number of panes and the exact view through the glass; every door, radiator, vent, outlet and light fixture; the flooring material and plank direction; the ceiling and all trim. Do not add, remove, move or resize any of these.",
      FURNITURE,
      "Arrange pieces naturally for a living room. Match the original lighting and contact shadows on the existing floor.",
      "Photorealistic MLS listing photo of the SAME room. No people, no text, no watermark.",
    ].join(" "),
  },
  {
    slug: "inventory-then-add",
    label: "B · Inventory first, then add only",
    text: [
      "You are editing ONE attached photograph. You are forbidden from generating a new room.",
      "First, silently list what must stay identical: camera angle, framing, every window (count panes, note the outdoor view), wall colors, floor, ceiling, doors, radiators, outlets, existing light fixtures.",
      "Then ADD furniture only into empty floor/wall space. Do not repaint walls, do not replace windows, do not change the view outside, do not move the camera, do not restyle the architecture.",
      FURNITURE,
      "If a change would require altering any listed fixed feature, skip that change. Prefer an emptier room over a distorted one.",
      "Output must be recognizably the same photograph with furniture inserted. Photorealistic. No people, no text, no watermark.",
    ].join(" "),
  },
  {
    slug: "hard-negatives",
    label: "C · Hard negatives (do-not list)",
    text: [
      "Image-to-image EDIT of the attached real estate photo. Insert living-room furniture only.",
      FURNITURE,
      "HARD CONSTRAINTS — violating any of these fails the task:",
      "DO NOT change window frames, mullions, pane count, glass reflections, or the outdoor view.",
      "DO NOT change wall color, floor material, ceiling, trim, doors, radiators, vents, or built-in fixtures.",
      "DO NOT change camera position, focal length, perspective, or crop.",
      "DO NOT rebuild, restyle, or 'improve' the architecture.",
      "DO NOT replace the room with a similar-looking room.",
      "Only new pixels should be furniture and soft decor sitting on the EXISTING floor with correct contact shadows.",
      "Photorealistic. No people, no text, no watermark.",
    ].join(" "),
  },
  {
    slug: "surgical-overlay",
    label: "D · Surgical overlay framing",
    text: [
      "Treat the attached photo as a locked background plate. Your job is a surgical overlay: composite furniture into the empty areas as if placing 3D objects into a fixed photograph.",
      "The background plate (everything already in the photo) is read-only. You may not redraw it.",
      FURNITURE,
      "Match perspective and lighting of the plate exactly. Soft contact shadows on the real floor only.",
      "Success = a viewer can blink between before and after and see ONLY furniture appear; architecture and windows stay pixel-stable.",
      "Photorealistic. No people, no text, no watermark.",
    ].join(" "),
  },
  {
    slug: "minimal-ask",
    label: "E · Minimal ask + same photo",
    text: [
      "Edit the attached photo in place. Keep every architectural pixel the same.",
      "Only change: add a sofa, two chairs, coffee table, rug, lamp, and one artwork (modern, neutral).",
      "Same windows, same view, same walls, same floor, same camera.",
      "If unsure whether something is architecture or furniture, leave it alone.",
      "Photorealistic real estate photo. No people, no text, no watermark.",
    ].join(" "),
  },
];
