#!/usr/bin/env node
/**
 * Model comparison harness for Staged image generation.
 *
 * For every model in models.json, runs each prompt in prompts.mjs against the
 * same input photo (public/demo/before.jpg) through the Cursor Cloud Agents
 * API — the exact same flow the production app uses in lib/cursorAgent.ts —
 * and saves the resulting image to:
 *
 *   experiments/model-comparison/output/<model-id>/<prompt-slug>.jpg
 *
 * It also writes output/index.html (a side-by-side gallery) and
 * output/manifest.json (raw results + timings + errors) so you can eyeball
 * every model and tell me which one to set as CURSOR_MODEL.
 *
 * Usage:
 *   CURSOR_API_KEY=... CURSOR_REPO=https://github.com/you/images \
 *     node experiments/model-comparison/run.mjs
 *
 *   node run.mjs --list                 # print the models your account can use
 *   node run.mjs --models a,b,c         # override models.json for this run
 *   node run.mjs --input path/to.jpg    # use a different input photo
 *
 * Requirements: CURSOR_API_KEY, and CURSOR_REPO (a GitHub repo with >=1 commit,
 * connected to Cursor's GitHub app). Same requirements as the app itself.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { PROMPTS } from "./prompts.mjs";

const API = "https://api.cursor.com";
const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, "..", "..");
const OUTPUT_DIR = path.join(HERE, "output");

const POLL_INTERVAL_MS = 5_000;
const TIMEOUT_MS = 8 * 60_000;

function parseArgs(argv) {
  const args = { list: false, models: null, input: path.join(REPO_ROOT, "public/demo/before.jpg") };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--list") args.list = true;
    else if (a === "--models") args.models = argv[++i]?.split(",").map((s) => ({ id: s.trim() }));
    else if (a === "--input") args.input = path.resolve(argv[++i]);
  }
  return args;
}

function authHeader() {
  const key = process.env.CURSOR_API_KEY;
  if (!key) {
    console.error(
      "\nCURSOR_API_KEY is not set. Add it to your environment and re-run:\n" +
        "  CURSOR_API_KEY=... CURSOR_REPO=https://github.com/you/images node experiments/model-comparison/run.mjs\n"
    );
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

async function listModels() {
  const data = await api("/v1/models");
  const items = data.items ?? data.models ?? [];
  console.log(`\n${items.length} models available to your account:\n`);
  for (const m of items) {
    const id = typeof m === "string" ? m : m.id;
    const name = typeof m === "string" ? "" : m.displayName ? ` (${m.displayName})` : "";
    console.log(`  ${id}${name}`);
  }
  console.log("\nEdit models.json to pick which ones to compare.\n");
}

function modelName(model) {
  return typeof model === "string" ? model : model.id;
}

async function renderOne(model, prompt, inputBase64) {
  const modelId = modelName(model);
  const repo = process.env.CURSOR_REPO || "https://github.com/sid-081205/images";

  const agentPrompt = [
    "You are an image editing worker for a real estate photo service. Your ONLY task is to produce one edited image from the attached room photo. Do NOT explore the repository, do NOT read files, do NOT run git commands.",
    "",
    "Step 1: Look at the attached room photo carefully and note its fixed features: camera angle, each window (frame style, number of panes, the view through it), doors, radiators, wall colors, flooring, ceiling and light fixtures. These must all survive the edit unchanged.",
    "",
    "Step 2: Call your image generation tool in image-to-image / edit mode. You MUST pass the attached room photo as the reference image. Give the tool this instruction:",
    "",
    prompt.text,
    "",
    "Step 3: Save the generated image into the artifacts directory at the workspace root (a filename ending in .png or .jpg).",
    "Step 4: Reply DONE and stop immediately. Do not commit, do not push, do not open a PR.",
  ].join("\n");

  const created = await api("/v1/agents", {
    method: "POST",
    body: JSON.stringify({
      name: `staged-compare-${modelId}-${prompt.slug}`,
      prompt: { text: agentPrompt, images: [{ data: inputBase64, mimeType: "image/jpeg" }] },
      model: typeof model === "string" ? { id: model } : { id: model.id, ...(model.params ? { params: model.params } : {}) },
      repos: [{ url: repo, startingRef: "main" }],
      autoCreatePR: false,
    }),
  });

  const agentId = created.agent.id;
  const runId = created.run.id;

  try {
    const deadline = Date.now() + TIMEOUT_MS;
    let status = "CREATING";
    let image;
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
      const [run, artifacts] = await Promise.all([
        api(`/v1/agents/${agentId}/runs/${runId}`),
        api(`/v1/agents/${agentId}/artifacts`).catch(() => ({ items: [] })),
      ]);
      status = run.status;
      image = (artifacts.items ?? [])
        .filter((a) => /\.(png|jpe?g|webp)$/i.test(a.path) && a.sizeBytes > 10_000)
        .sort((a, b) => b.sizeBytes - a.sizeBytes)[0];
      if (image) break;
      if (["FINISHED", "ERROR", "EXPIRED", "CANCELLED"].includes(status)) break;
    }

    if (!image) {
      throw new Error(status === "FINISHED" ? "agent finished but produced no image" : `ended with status ${status}`);
    }

    const { url } = await api(`/v1/agents/${agentId}/artifacts/download?path=${encodeURIComponent(image.path)}`);
    const download = await fetch(url);
    if (!download.ok) throw new Error(`artifact download failed (${download.status})`);
    const bytes = Buffer.from(await download.arrayBuffer());
    return await sharp(bytes).jpeg({ quality: 95 }).toBuffer();
  } finally {
    api(`/v1/agents/${agentId}/runs/${runId}/cancel`, { method: "POST" }).catch(() => {});
    api(`/v1/agents/${agentId}/archive`, { method: "POST" }).catch(() => {});
  }
}

function loadModels(override) {
  if (override) return override;
  const cfg = JSON.parse(fs.readFileSync(path.join(HERE, "models.json"), "utf8"));
  return cfg.models;
}

function writeGallery(results, inputRelForHtml) {
  const rows = results
    .map((r) => {
      const cells = PROMPTS.map((p) => {
        const hit = r.prompts.find((x) => x.slug === p.slug);
        if (hit?.file) {
          return `<td><a href="${r.model}/${path.basename(hit.file)}" target="_blank"><img src="${r.model}/${path.basename(hit.file)}"></a></td>`;
        }
        return `<td class="fail">failed<br><small>${(hit?.error ?? "").replace(/</g, "&lt;")}</small></td>`;
      }).join("");
      return `<tr><th>${r.model}<br><small>${r.totalMs ? (r.totalMs / 1000).toFixed(0) + "s total" : ""}</small></th>${cells}</tr>`;
    })
    .join("\n");

  const header = PROMPTS.map((p) => `<th>${p.label}</th>`).join("");
  const html = `<!doctype html><meta charset="utf-8"><title>Staged model comparison</title>
<style>
  body{font-family:system-ui,sans-serif;margin:24px;background:#faf7f0;color:#1c1917}
  h1{font-size:22px} p{color:#57534e}
  table{border-collapse:collapse;margin-top:16px}
  th,td{border:1px solid #e7e5e4;padding:8px;vertical-align:top;text-align:center}
  th{background:#fff;font-size:13px}
  img{width:340px;height:auto;display:block;border-radius:8px}
  .input img{width:340px}
  td.fail{color:#b91c1c;font-size:12px;max-width:340px}
  small{color:#78716c;font-weight:400}
</style>
<h1>Staged model comparison</h1>
<p>Input photo: <code>${inputRelForHtml}</code>. Each row is one model; each column is one prompt. Click an image to open full size.</p>
<div class="input"><strong>Input</strong><br><img src="input.jpg"></div>
<table>
  <tr><th>model \\ prompt</th>${header}</tr>
  ${rows}
</table>`;
  fs.writeFileSync(path.join(OUTPUT_DIR, "index.html"), html);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.list) {
    await listModels();
    return;
  }

  if (!fs.existsSync(args.input)) {
    console.error(`Input photo not found: ${args.input}`);
    process.exit(1);
  }

  const models = loadModels(args.models);
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Normalize the input once, save a copy into output/ for the gallery.
  const inputBuf = await sharp(fs.readFileSync(args.input))
    .rotate()
    .resize(2048, 2048, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 92 })
    .toBuffer();
  fs.writeFileSync(path.join(OUTPUT_DIR, "input.jpg"), inputBuf);
  const inputBase64 = inputBuf.toString("base64");

  console.log(`\nComparing ${models.length} model(s) x ${PROMPTS.length} prompt(s) = ${models.length * PROMPTS.length} render(s).`);
  console.log(`Input: ${path.relative(REPO_ROOT, args.input)}`);
  console.log("Each render is a real cloud-agent run and costs Cursor credits. This takes a while.\n");

  const results = [];
  for (const model of models) {
    const id = modelName(model);
    const modelDir = path.join(OUTPUT_DIR, id.replace(/[^a-z0-9._-]/gi, "_"));
    fs.mkdirSync(modelDir, { recursive: true });
    const entry = { model: id.replace(/[^a-z0-9._-]/gi, "_"), prompts: [], totalMs: 0 };

    for (const prompt of PROMPTS) {
      const started = Date.now();
      process.stdout.write(`  [${id}] ${prompt.slug} ... `);
      try {
        const out = await renderOne(model, prompt, inputBase64);
        const file = path.join(modelDir, `${prompt.slug}.jpg`);
        fs.writeFileSync(file, out);
        const ms = Date.now() - started;
        entry.prompts.push({ slug: prompt.slug, file, ms });
        entry.totalMs += ms;
        console.log(`ok (${(ms / 1000).toFixed(0)}s)`);
      } catch (err) {
        const ms = Date.now() - started;
        entry.prompts.push({ slug: prompt.slug, error: String(err.message ?? err), ms });
        entry.totalMs += ms;
        console.log(`FAILED: ${err.message ?? err}`);
      }
    }
    results.push(entry);
  }

  fs.writeFileSync(
    path.join(OUTPUT_DIR, "manifest.json"),
    JSON.stringify({ input: path.relative(REPO_ROOT, args.input), generatedAt: new Date().toISOString(), results }, null, 2)
  );
  writeGallery(results, path.relative(REPO_ROOT, args.input));

  console.log(`\nDone. Open experiments/model-comparison/output/index.html to compare.`);
  console.log("Pick the best model, then set CURSOR_MODEL=<that-id> in your .env.\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
