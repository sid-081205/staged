#!/usr/bin/env node --experimental-strip-types
/**
 * Prep for the pipeline-v2 bake-off (NOT production, NOT imported by the app).
 *
 * - Runs the REAL production preprocess (`preprocessInput`) on the portrait
 *   bedroom fixture and stores the exact buffer the model would receive.
 * - Prints the REAL production prompts (`buildPrompt` layer A) and the agent
 *   wrapper (`buildAgentPrompt` layer B) used for each tested variant, so the
 *   experiment renders use byte-identical instructions to production.
 *
 * Run from the repo root:
 *   node --experimental-strip-types experiments/pipeline-v2/prepare.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { preprocessInput, buildAgentPrompt } from "../../lib/cursorAgent.ts";
import { buildPrompt } from "../../lib/config.ts";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const INPUT = path.join(HERE, "input", "bedroom_portrait_original.png");

const { buffer, width, height } = await preprocessInput(INPUT);
fs.writeFileSync(path.join(HERE, "input", "bedroom_portrait_preprocessed.jpg"), buffer);
console.log(`preprocessed: ${width}x${height} (${(buffer.length / 1024).toFixed(0)} KB)`);

const variants = [
  { slug: "stage-scandinavian", service: "stage", style: "scandinavian" },
  { slug: "declutter", service: "declutter", style: null },
  { slug: "enhance", service: "enhance", style: null },
];

const out = {};
for (const v of variants) {
  const layerA = buildPrompt(v.service, v.style, "bedroom");
  out[v.slug] = {
    layerA,
    layerB: buildAgentPrompt(layerA, { width, height, service: v.service }),
  };
}
fs.writeFileSync(path.join(HERE, "input", "prompts.json"), JSON.stringify(out, null, 2));
console.log("wrote input/prompts.json");
