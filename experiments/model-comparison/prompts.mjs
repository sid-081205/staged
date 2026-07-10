/**
 * The prompts every model is asked to run, against the same input photo
 * (public/demo/before.jpg). Prompt 1 is the required home-gym-with-a-piano in
 * a farmhouse style. Prompt 2 is a second, more typical staging request so you
 * can judge each model on both an unusual ask and the core product use case.
 *
 * Both are phrased as in-place EDITS with the same architecture-preservation
 * rules the production app uses (see lib/config.ts buildPrompt), so the outputs
 * are representative of what real renders would look like.
 */

const PRESERVE =
  "PRESERVE EXACTLY, PIXEL-FAITHFUL TO THE ORIGINAL PHOTO: the camera position, camera angle and framing; every wall and its color; every window with its exact frame style, number of panes and the exact view through the glass; every door, radiator, vent, outlet and light fixture; the flooring material and plank direction; the ceiling and all trim. Do not add, remove, move or resize any of these.";

export const PROMPTS = [
  {
    slug: "gym-piano-farmhouse",
    label: "Home gym with a piano, farmhouse style",
    text: [
      "TASK: virtually stage this real estate photo by turning the empty room into a home gym, in a farmhouse style, that also contains a piano. This is a photo EDIT: start from the attached image and place furniture into it. Do not invent, redraw or substitute a different room.",
      PRESERVE,
      "Into that unchanged space, add realistic, correctly scaled home gym equipment (for example a treadmill or exercise bike, a rack of dumbbells, a weight bench, a yoga mat) AND a real piano (an upright or grand piano at correct real-world scale). Everything should be styled in modern farmhouse decor: rustic reclaimed wood, linen and warm neutral tones, woven baskets, a jute rug, simple ceramic decor.",
      "Arrange the pieces naturally, respecting walkways and the room's real proportions. The finished room MUST be furnished as described; include both the gym equipment and the piano.",
      "Match the original photo's lighting direction, shadows, white balance and perspective so every added piece looks genuinely present, with correct contact shadows on the existing floor.",
      "The result must look like a professional real estate photograph of the exact same room. Photorealistic. No people, no text, no watermark.",
    ].join(" "),
  },
  {
    slug: "scandinavian-living-room",
    label: "Scandinavian living room staging",
    text: [
      "TASK: virtually stage this real estate photo as a Scandinavian living room by ADDING furniture into the attached photo. This is a photo EDIT: start from the attached image and place furniture into it. Do not invent, redraw or substitute a different room.",
      PRESERVE,
      "Into that unchanged space, add realistic, correctly scaled Scandinavian furniture: light oak wood, white and oatmeal textiles, airy and minimal, a simple pendant or floor lamp, a pale wool rug, one or two green plants.",
      "Arrange the pieces naturally for a living room, respecting walkways and the room's real proportions. The finished room MUST be furnished; never return an empty or nearly empty room.",
      "Match the original photo's lighting direction, shadows, white balance and perspective so every added piece looks genuinely present, with correct contact shadows on the existing floor.",
      "The result must look like a professional real estate photograph of the exact same room, now professionally staged. Photorealistic. No people, no text, no watermark.",
    ].join(" "),
  },
];
