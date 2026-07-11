#!/usr/bin/env node --experimental-strip-types
/**
 * Kitchen "fix lighting" (enhance) pipeline lab — NOT production.
 *
 * Runs experiments/IMG_1201.jpeg through the REAL Cursor Cloud Agents API
 * with four pipeline variations and records wall clock + delivered dims:
 *
 *   old   — pre-2026-07 pipeline: inventory step + un-gated verify/retry,
 *           5s poll, old enhance prompt (no aspect hard-no)
 *   prod  — the shipped pipeline exactly: generate-first wrapper, no retry
 *           for enhance, aspect hard-no, 3s poll, dimension lock
 *   lean  — candidate: wrapper stripped further for enhance — no verify step
 *           at all, deliver the tool's first output
 *   tuned — prod wrapper + a quality-tuned enhance instruction (explicit
 *           color-cast neutralization, deblur/denoise, texture preservation)
 *
 * All variants run repo-less on composer-2.5 and are dimension-locked on
 * delivery (raw dims recorded separately so the old pipeline's behavior is
 * still visible).
 *
 *   CURSOR_API_KEY=... node --experimental-strip-types \
 *     experiments/kitchen-enhance-lab/run.mjs --variant prod --runs 2 --parallel
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { preprocessInput, lockToDimensions, buildAgentPrompt } from "../../lib/cursorAgent.ts";
import { buildPrompt } from "../../lib/config.ts";

const API = "https://api.cursor.com";
const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, "runs");
const INPUT = path.join(HERE, "..", "IMG_1201.jpeg");
const MODEL = process.env.LIVE_MODEL || "composer-2.5";
const TIMEOUT_MS = 10 * 60_000;

fs.mkdirSync(OUT, { recursive: true });

function authHeader() {
  const key = process.env.CURSOR_API_KEY;
  if (!key) {
    console.error("CURSOR_API_KEY is not set");
    process.exit(1);
  }
  return `Basic ${Buffer.from(`${key}:`).toString("base64")}`;
}

async function api(endpoint, init) {
  const res = await fetch(`${API}${endpoint}`, {
    ...init,
    headers: { Authorization: authHeader(), "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Cursor API ${endpoint} failed (${res.status}): ${body.slice(0, 300)}`);
  }
  return res.json();
}

/** Old (pre-2026-07) enhance instruction: no aspect/orientation hard-no. */
function oldEnhancePrompt() {
  return [
    "Image-to-image EDIT of the attached real estate photo of a kitchen. Only photographic quality may change — not objects or architecture.",
    "Correct the exposure and white balance, brighten dark areas naturally, recover washed out windows, and make the light feel bright and inviting. If sky is visible through windows, make it a pleasant blue sky. Straighten the image if it is slightly tilted.",
    "DO NOT add, remove or move any furniture or objects. Every physical thing stays exactly where it is.",
    "HARD CONSTRAINTS — violating any of these fails the task: DO NOT change window frames, mullions, pane count, glass reflections, or the outdoor view. DO NOT change wall color, floor material, ceiling, trim, doors, radiators, vents, outlets, or built-in fixtures. DO NOT change camera position, focal length, perspective, or crop. DO NOT rebuild, restyle, or 'improve' the architecture. DO NOT replace the kitchen with a similar-looking room or any other room type.",
    "The result must look like the same photo shot by a professional real estate photographer with proper HDR technique. Photorealistic, natural, not over processed. No people, no text, no watermark.",
  ].join(" ");
}

/** Old (pre-2026-07) agent wrapper: inventory step + un-gated retry. */
function oldWrapper(prompt) {
  return [
    "You are an image editing worker for a real estate photo service. Your ONLY task is to produce one edited image from the attached room photo. Do NOT explore the repository, do NOT read files, do NOT run git commands.",
    "",
    "Step 1: Look at the attached room photo carefully and note its fixed features: camera angle, each window (frame style, number of panes, the view through it), doors, radiators, wall colors, flooring, ceiling and light fixtures. These must all survive the edit unchanged.",
    "",
    "Step 2: Call your image generation tool in image-to-image / edit mode. You MUST pass the attached room photo as the reference image (use its file path in the tool's reference image parameter). Give the tool this instruction:",
    "",
    prompt,
    "",
    "Step 3: VERIFY before delivering. Open the generated image and compare it against the original photo. It fails (regenerate) if ANY of these changed: window frames/panes/outdoor view, wall color, floor, ceiling, trim, doors, radiators, vents, built-ins, camera position, perspective, or crop — or if the room was replaced/restyled. At most 2 generation attempts; deliver the more faithful result.",
    "",
    "Step 4: Save ONLY the final approved image into the artifacts directory at the workspace root (a filename ending in .png or .jpg). Never place a rejected image in artifacts.",
    "Step 5: Reply DONE and stop immediately. Do not commit, do not push, do not open a PR.",
  ].join("\n");
}

/** Candidate: leanest possible wrapper for enhance — no verify step at all. */
function leanWrapper(prompt, width, height) {
  return [
    "You are an image editing worker. Produce one edited image from the attached room photo as fast as possible. Do NOT read files, run git commands, or write any analysis or commentary.",
    "",
    "IMMEDIATELY — as your first and only creative action — call your image generation tool in image-to-image / edit mode with the attached photo as the reference image (pass its file path in the tool's reference image parameter). Give the tool this instruction:",
    "",
    prompt,
    "",
    `OUTPUT DIMENSIONS: the reference photo is ${width}×${height} pixels (landscape). Keep this exact aspect ratio and orientation.`,
    "",
    "The tool's output is final — do not verify, compare or regenerate. Save it into the artifacts directory at the workspace root (filename ending in .png or .jpg), reply DONE and stop. Do not commit, do not push, do not open a PR.",
  ].join("\n");
}

/** Quality-tuned enhance instruction (generic, not image-specific). */
function tunedEnhancePrompt() {
  return [
    "Image-to-image EDIT of the attached real estate photo of a kitchen. Only photographic quality may change — not objects or architecture.",
    "Fix the light like a professional real estate photo editor: neutralize color casts from mixed light sources so whites are truly white, balance the exposure between bright and shadowed areas, gently lift shadows without crushing highlights, and remove the harsh glare of ceiling fixtures while keeping them switched on.",
    "Reduce motion blur and sensor noise so edges and text on labels are crisp. Preserve real surface textures — do not plastic-smooth walls, wood or countertops.",
    "If sky or outdoor view is visible through a window, recover it naturally. Straighten the image if it is slightly tilted.",
    "DO NOT add, remove or move any furniture or objects. Every physical thing stays exactly where it is.",
    "HARD CONSTRAINTS — violating any of these fails the task: DO NOT change window frames, mullions, pane count, glass reflections, or the outdoor view. DO NOT change wall color, floor material, ceiling, trim, doors, radiators, vents, outlets, or built-in fixtures. DO NOT change camera position, focal length, perspective, or crop. DO NOT change the image's aspect ratio or orientation. DO NOT rebuild, restyle, or 'improve' the architecture. DO NOT replace the kitchen with a similar-looking room or any other room type.",
    "The result must look like the same photo shot by a professional real estate photographer with proper HDR technique. Photorealistic, natural, not over processed. No people, no text, no watermark.",
  ].join(" ");
}

const VARIANTS = {
  old: (w, h) => ({ agentPrompt: oldWrapper(oldEnhancePrompt()), pollMs: 5000 }),
  prod: (w, h) => ({
    agentPrompt: buildAgentPrompt(buildPrompt("enhance", null, "kitchen"), { width: w, height: h, service: "enhance" }),
    pollMs: 3000,
  }),
  lean: (w, h) => ({ agentPrompt: leanWrapper(buildPrompt("enhance", null, "kitchen"), w, h), pollMs: 3000 }),
  tuned: (w, h) => ({
    agentPrompt: buildAgentPrompt(tunedEnhancePrompt(), { width: w, height: h, service: "enhance" }),
    pollMs: 3000,
  }),
};

async function runOnce(variantName, runIdx, input, width, height) {
  const v = VARIANTS[variantName](width, height);
  const t0 = Date.now();
  const timeline = [];
  const mark = (label) => {
    timeline.push({ label, atMs: Date.now() - t0 });
    console.log(`  [${variantName}#${runIdx}] ${((Date.now() - t0) / 1000).toFixed(0)}s ${label}`);
  };

  const created = await api("/v1/agents", {
    method: "POST",
    body: JSON.stringify({
      name: `kitchen-enhance-${variantName}-${runIdx}`,
      prompt: { text: v.agentPrompt, images: [{ data: input.toString("base64"), mimeType: "image/jpeg" }] },
      model: { id: MODEL },
      autoCreatePR: false,
    }),
  });
  const agentId = created.agent.id;
  const runId = created.run.id;
  mark("agent created");

  let lastStatus = "";
  let image;
  try {
    const deadline = Date.now() + TIMEOUT_MS;
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, v.pollMs));
      const [run, artifacts] = await Promise.all([
        api(`/v1/agents/${agentId}/runs/${runId}`),
        api(`/v1/agents/${agentId}/artifacts`).catch(() => ({ items: [] })),
      ]);
      if (run.status !== lastStatus) {
        lastStatus = run.status;
        mark(`status ${run.status}`);
      }
      image = (artifacts.items ?? [])
        .filter((a) => /\.(png|jpe?g|webp)$/i.test(a.path) && a.sizeBytes > 10_000)
        .sort((a, b) => b.sizeBytes - a.sizeBytes)[0];
      if (image) break;
      if (["FINISHED", "ERROR", "EXPIRED", "CANCELLED"].includes(run.status)) break;
    }
    if (!image) throw new Error(`no artifact (last status ${lastStatus})`);
    mark("artifact available");

    const { url } = await api(`/v1/agents/${agentId}/artifacts/download?path=${encodeURIComponent(image.path)}`);
    const download = await fetch(url);
    if (!download.ok) throw new Error(`download failed (${download.status})`);
    const bytes = Buffer.from(await download.arrayBuffer());
    api(`/v1/agents/${agentId}/runs/${runId}/cancel`, { method: "POST" }).catch(() => {});

    const rawMeta = await sharp(bytes).metadata();
    const delivered = await lockToDimensions(bytes, width, height);
    const outMeta = await sharp(delivered).metadata();
    const file = path.join(OUT, `${variantName}-run${runIdx}.jpg`);
    fs.writeFileSync(file, delivered);
    mark("delivered");
    return {
      variant: variantName,
      run: runIdx,
      agentId,
      ok: true,
      totalSec: +((Date.now() - t0) / 1000).toFixed(1),
      rawDimensions: `${rawMeta.width}x${rawMeta.height}`,
      deliveredDimensions: `${outMeta.width}x${outMeta.height}`,
      matchesInput: outMeta.width === width && outMeta.height === height,
      timeline,
      file: path.basename(file),
    };
  } catch (err) {
    api(`/v1/agents/${agentId}/runs/${runId}/cancel`, { method: "POST" }).catch(() => {});
    return { variant: variantName, run: runIdx, agentId, ok: false, totalSec: +((Date.now() - t0) / 1000).toFixed(1), error: String(err.message ?? err), timeline };
  } finally {
    api(`/v1/agents/${agentId}/archive`, { method: "POST" }).catch(() => {});
  }
}

function appendResults(entries) {
  const file = path.join(OUT, "timings.json");
  const existing = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : [];
  existing.push(...entries);
  fs.writeFileSync(file, JSON.stringify(existing, null, 2));
}

const args = process.argv.slice(2);
const variant = args[args.indexOf("--variant") + 1];
const runs = Number(args.includes("--runs") ? args[args.indexOf("--runs") + 1] : 1);
const parallel = args.includes("--parallel");
const offset = Number(args.includes("--offset") ? args[args.indexOf("--offset") + 1] : 0);
if (!VARIANTS[variant]) {
  console.error(`unknown --variant; pick one of: ${Object.keys(VARIANTS).join(", ")}`);
  process.exit(1);
}

const { buffer: input, width, height } = await preprocessInput(INPUT);
fs.writeFileSync(path.join(HERE, "input_preprocessed.jpg"), input);
console.log(`input ${width}x${height}; variant=${variant}; runs=${runs}; parallel=${parallel}`);

let results;
if (parallel) {
  results = await Promise.all(
    Array.from({ length: runs }, (_, i) =>
      new Promise((r) => setTimeout(r, i * 4000)).then(() => runOnce(variant, offset + i + 1, input, width, height))
    )
  );
} else {
  results = [];
  for (let i = 1; i <= runs; i++) results.push(await runOnce(variant, offset + i, input, width, height));
}
appendResults(results);
for (const r of results) {
  console.log(
    r.ok
      ? `DONE ${r.variant}#${r.run}: ${r.totalSec}s raw=${r.rawDimensions} delivered=${r.deliveredDimensions} match=${r.matchesInput}`
      : `FAIL ${r.variant}#${r.run}: ${r.totalSec}s ${r.error}`
  );
}
