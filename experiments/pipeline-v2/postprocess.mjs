#!/usr/bin/env node --experimental-strip-types
/**
 * Dimension-lock verification for the pipeline-v2 bake-off (NOT production).
 *
 * Feeds every raw model output in runs/ through the REAL production
 * `lockToDimensions` from lib/cursorAgent.ts, targeting the exact dimensions
 * `preprocessInput` recorded for the fixture — the same two calls
 * `stagePhoto` makes. Writes delivered/*.jpg and results.json with
 * before/after dimensions.
 *
 * Run from the repo root:
 *   node --experimental-strip-types experiments/pipeline-v2/postprocess.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { preprocessInput, lockToDimensions } from "../../lib/cursorAgent.ts";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const RUNS = path.join(HERE, "runs");
const DELIVERED = path.join(HERE, "delivered");
fs.mkdirSync(DELIVERED, { recursive: true });

const { width, height } = await preprocessInput(
  path.join(HERE, "input", "bedroom_portrait_original.png")
);
console.log(`target (preprocessed input): ${width}x${height}`);

const results = [];
for (const file of fs.readdirSync(RUNS).sort()) {
  if (!/\.(png|jpe?g|webp)$/i.test(file)) continue;
  const raw = fs.readFileSync(path.join(RUNS, file));
  const meta = await sharp(raw).metadata();
  const locked = await lockToDimensions(raw, width, height);
  const outMeta = await sharp(locked).metadata();
  const outFile = file.replace(/\.\w+$/, ".jpg");
  fs.writeFileSync(path.join(DELIVERED, outFile), locked);
  const ok = outMeta.width === width && outMeta.height === height;
  results.push({
    file,
    rawDimensions: `${meta.width}x${meta.height}`,
    deliveredDimensions: `${outMeta.width}x${outMeta.height}`,
    matchesInput: ok,
  });
  console.log(
    `${file}: ${meta.width}x${meta.height} -> ${outMeta.width}x${outMeta.height} ${ok ? "OK" : "MISMATCH"}`
  );
}

fs.writeFileSync(
  path.join(HERE, "delivered", "results.json"),
  JSON.stringify({ target: `${width}x${height}`, results }, null, 2)
);
if (results.some((r) => !r.matchesInput)) {
  console.error("FAIL: some delivered images do not match the input dimensions");
  process.exit(1);
}
console.log("PASS: every delivered image matches the input dimensions exactly");
