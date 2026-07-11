#!/usr/bin/env node --experimental-strip-types
/**
 * LIVE end-to-end timing harness for the pipeline-v2 bake-off (NOT production).
 *
 * Runs the bedroom fixture through the REAL Cursor Cloud Agents API and
 * measures wall-clock per phase. The "new" variants use the actual production
 * code (`preprocessInput`, `buildPrompt`, `buildAgentPrompt`, `lockToDimensions`)
 * and mirror `stagePhoto`'s loop with instrumentation; the "old" variant
 * replays the pre-2026-07 wrapper (written inventory step + un-gated retry,
 * 5s poll, no dimension lock) as the baseline.
 *
 *   CURSOR_API_KEY=... node --experimental-strip-types \
 *     experiments/pipeline-v2/live-timing.mjs --variant new-stage --runs 3 [--parallel]
 *
 * Variants: new-stage | new-enhance | new-declutter | old-stage | fast-stage
 * Results append to runs-live/timings.json; images in runs-live/.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { preprocessInput, lockToDimensions, buildAgentPrompt } from "../../lib/cursorAgent.ts";
import { buildPrompt } from "../../lib/config.ts";

const API = "https://api.cursor.com";
const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, "runs-live");
const INPUT = path.join(HERE, "input", "bedroom_portrait_original.png");
const REPO = process.env.CURSOR_REPO || "https://github.com/sid-081205/images";
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

/** The pre-2026-07 production wrapper, reconstructed from master. */
function buildOldAgentPrompt(prompt) {
  return [
    "You are an image editing worker for a real estate photo service. Your ONLY task is to produce one edited image from the attached room photo. Do NOT explore the repository, do NOT read files, do NOT run git commands.",
    "",
    "Step 1: Look at the attached room photo carefully and note its fixed features: camera angle, each window (frame style, number of panes, the view through it), doors, radiators, wall colors, flooring, ceiling and light fixtures. These must all survive the edit unchanged.",
    "",
    "Step 2: Call your image generation tool in image-to-image / edit mode. You MUST pass the attached room photo as the reference image (use its file path in the tool's reference image parameter). Give the tool this instruction:",
    "",
    prompt,
    "",
    "Step 3: VERIFY before delivering. Open the generated image and compare it against the original photo. It fails (regenerate) if ANY of these changed: window frames/panes/outdoor view, wall color, floor, ceiling, trim, doors, radiators, vents, built-ins, camera position, perspective, or crop — or if the room was replaced/restyled. If a specifically requested item is missing or wrong, regenerate correcting that. At most 2 generation attempts; deliver the more faithful result.",
    "",
    "Step 4: Save ONLY the final approved image into the artifacts directory at the workspace root (a filename ending in .png or .jpg). Never place a rejected image in artifacts. Keep rejected attempts outside the artifacts directory.",
    "Step 5: Reply DONE and stop immediately. Do not commit, do not push, do not open a PR.",
  ].join("\n");
}

/** The old prod buildPrompt for stage (before aspect + additions-only lines). */
function oldStagePrompt() {
  const hard = [
    "HARD CONSTRAINTS — violating any of these fails the task:",
    "DO NOT change window frames, mullions, pane count, glass reflections, or the outdoor view.",
    "DO NOT change wall color, floor material, ceiling, trim, doors, radiators, vents, outlets, or built-in fixtures.",
    "DO NOT change camera position, focal length, perspective, or crop.",
    "DO NOT rebuild, restyle, or 'improve' the architecture.",
    "DO NOT replace the bedroom with a similar-looking room or any other room type.",
  ].join(" ");
  return [
    "Image-to-image EDIT of the attached real estate photo of a bedroom. Insert furniture only — do not invent or substitute a different room.",
    "Add realistic, correctly scaled Scandinavian furniture: light oak wood, white and oatmeal textiles, airy and minimal, simple pendant or floor lamp, a pale wool rug, one or two green plants.",
    "Arrange the pieces naturally for a bedroom, respecting walkways and the room's real proportions. The finished room MUST be furnished; never return an empty or nearly empty room.",
    hard,
    "Only new pixels should be furniture and soft decor sitting on the EXISTING floor with correct contact shadows.",
    "Match the original photo's lighting direction, shadows, white balance and perspective so every added piece looks genuinely present in the room.",
    "The photo will be used on the MLS and listing sites, so the result must be believable and disclosure safe.",
    "Photorealistic. No people, no text, no watermark.",
  ].join(" ");
}

const VARIANTS = {
  "new-stage": (w, h) => ({
    agentPrompt: buildAgentPrompt(buildPrompt("stage", "scandinavian", "bedroom"), { width: w, height: h, service: "stage" }),
    pollMs: 3000,
    lock: true,
  }),
  "new-declutter": (w, h) => ({
    agentPrompt: buildAgentPrompt(buildPrompt("declutter", null, "bedroom"), { width: w, height: h, service: "declutter" }),
    pollMs: 3000,
    lock: true,
  }),
  "new-enhance": (w, h) => ({
    agentPrompt: buildAgentPrompt(buildPrompt("enhance", null, "bedroom"), { width: w, height: h, service: "enhance" }),
    pollMs: 3000,
    lock: true,
  }),
  "old-stage": () => ({
    agentPrompt: buildOldAgentPrompt(oldStagePrompt()),
    pollMs: 5000,
    lock: false,
  }),
  "fast-stage": (w, h) => ({
    agentPrompt: buildAgentPrompt(buildPrompt("stage", "scandinavian", "bedroom"), { width: w, height: h, service: "stage" }),
    pollMs: 3000,
    lock: true,
    modelParams: [{ id: "fast", value: "true" }],
  }),
  "norepo-stage": (w, h) => ({
    agentPrompt: buildAgentPrompt(buildPrompt("stage", "scandinavian", "bedroom"), { width: w, height: h, service: "stage" }),
    pollMs: 3000,
    lock: true,
    noRepo: true,
  }),
  "norepo-fast-stage": (w, h) => ({
    agentPrompt: buildAgentPrompt(buildPrompt("stage", "scandinavian", "bedroom"), { width: w, height: h, service: "stage" }),
    pollMs: 3000,
    lock: true,
    noRepo: true,
    modelParams: [{ id: "fast", value: "true" }],
  }),
  // v3 wrapper candidate: verify from the tool's returned image (no file
  // re-opening), no written commentary between steps.
  "v3-stage": (w, h) => ({
    agentPrompt: buildV3AgentPrompt(buildPrompt("stage", "scandinavian", "bedroom"), { width: w, height: h, service: "stage" }),
    pollMs: 3000,
    lock: true,
  }),
};

function buildV3AgentPrompt(prompt, { width, height, service }) {
  const orientation = width === height ? "square" : width > height ? "landscape" : "portrait";
  const dimensionLine = `OUTPUT DIMENSIONS: the reference photo is ${width}×${height} pixels (${orientation}). The output image MUST keep this exact aspect ratio and ${orientation} orientation. Do not crop to a different shape, do not letterbox, do not change the framing.`;
  const verifyStep =
    service === "enhance"
      ? "Step 2: The tool's returned image is final unless it changed objects, architecture or orientation. Do NOT regenerate for tonal differences — lighting changes are the point."
      : [
          "Step 2: VERIFY from the image the tool just returned — do NOT re-open, re-read or re-inspect any files. It fails ONLY if one of these clearly changed vs the attached photo: window frames/panes/outdoor view, wall color, floor, ceiling, trim, doors, radiators, built-ins, camera position/perspective/crop, or the orientation (portrait vs landscape) — or if a specifically requested item is missing or wrong.",
          "If it fails, regenerate EXACTLY ONCE: same instruction plus one sentence correcting what drifted. Then deliver the more faithful of the two. Never make a third image. If it passes, deliver immediately.",
        ].join("\n");
  return [
    "You are an image editing worker for a real estate photo service. Produce one edited image from the attached room photo as fast as possible. Do NOT explore the repository, do NOT read files, do NOT run git commands, do NOT write any analysis, plan, inventory or commentary — your only text output is the final DONE.",
    "",
    "Step 1: IMMEDIATELY — as your very first action — call your image generation tool in image-to-image / edit mode with the attached room photo as the reference image (pass its file path in the tool's reference image parameter). Give the tool this instruction:",
    "",
    prompt,
    "",
    dimensionLine,
    "",
    verifyStep,
    "",
    "Step 3: Copy the delivered image into the artifacts directory at the workspace root with ONE shell command (filename ending in .png or .jpg). Never place a rejected image in artifacts.",
    "Step 4: Reply DONE and stop immediately. Do not commit, do not push, do not open a PR.",
  ].join("\n");
}

const MARKER_INSTRUCTION = [
  "",
  "TIMING MARKERS (test instrumentation, do these exactly): the artifacts directory may hold these two extra empty .txt files besides the final image.",
  "Immediately BEFORE your first image tool call, run: touch artifacts/marker-generation-started.txt",
  "Immediately AFTER the image tool returns, run: touch artifacts/marker-generation-done.txt",
].join("\n");

async function runOnce(variantName, runIdx, input, width, height, markers) {
  const v = VARIANTS[variantName](width, height);
  if (markers) v.agentPrompt += MARKER_INSTRUCTION;
  const t0 = Date.now();
  const timeline = [];
  const mark = (label) => {
    timeline.push({ label, atMs: Date.now() - t0 });
    console.log(`  [${variantName}#${runIdx}] ${((Date.now() - t0) / 1000).toFixed(0)}s ${label}`);
  };

  const created = await api("/v1/agents", {
    method: "POST",
    body: JSON.stringify({
      name: `pipeline-v2-live-${variantName}-${runIdx}`,
      prompt: { text: v.agentPrompt, images: [{ data: input.toString("base64"), mimeType: "image/jpeg" }] },
      model: { id: MODEL, ...(v.modelParams ? { params: v.modelParams } : {}) },
      ...(v.noRepo ? {} : { repos: [{ url: REPO, startingRef: "main" }] }),
      autoCreatePR: false,
    }),
  });
  const agentId = created.agent.id;
  const runId = created.run.id;
  mark("agent created");

  let lastStatus = "";
  let image;
  const seenMarkers = new Set();
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
      for (const a of artifacts.items ?? []) {
        const m = /marker-([\w-]+)\.txt$/.exec(a.path);
        if (m && !seenMarkers.has(m[1])) {
          seenMarkers.add(m[1]);
          mark(`marker ${m[1]}`);
        }
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
    mark("downloaded");

    const rawMeta = await sharp(bytes).metadata();
    const delivered = v.lock
      ? await lockToDimensions(bytes, width, height)
      : await sharp(bytes).jpeg({ quality: 95 }).toBuffer();
    const outMeta = await sharp(delivered).metadata();
    mark("delivered");

    const file = path.join(OUT, `${variantName}-run${runIdx}.jpg`);
    fs.writeFileSync(file, delivered);
    return {
      variant: variantName,
      run: runIdx,
      agentId,
      ok: true,
      totalSec: +((Date.now() - t0) / 1000).toFixed(1),
      rawDimensions: `${rawMeta.width}x${rawMeta.height}`,
      deliveredDimensions: `${outMeta.width}x${outMeta.height}`,
      matchesInput: outMeta.width === width && outMeta.height === height,
      dimensionLocked: v.lock,
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
const markers = args.includes("--markers");
const offset = Number(args.includes("--offset") ? args[args.indexOf("--offset") + 1] : 0);
if (!VARIANTS[variant]) {
  console.error(`unknown --variant; pick one of: ${Object.keys(VARIANTS).join(", ")}`);
  process.exit(1);
}

const { buffer: input, width, height } = await preprocessInput(INPUT);
console.log(`input ${width}x${height}; variant=${variant}; runs=${runs}; parallel=${parallel}`);

let results;
if (parallel) {
  results = await Promise.all(
    Array.from({ length: runs }, (_, i) =>
      new Promise((r) => setTimeout(r, i * 4000)).then(() => runOnce(variant, offset + i + 1, input, width, height, markers))
    )
  );
} else {
  results = [];
  for (let i = 1; i <= runs; i++) results.push(await runOnce(variant, offset + i, input, width, height, markers));
}
appendResults(results);
for (const r of results) {
  console.log(
    r.ok
      ? `DONE ${r.variant}#${r.run}: ${r.totalSec}s raw=${r.rawDimensions} delivered=${r.deliveredDimensions} match=${r.matchesInput}`
      : `FAIL ${r.variant}#${r.run}: ${r.totalSec}s ${r.error}`
  );
}
