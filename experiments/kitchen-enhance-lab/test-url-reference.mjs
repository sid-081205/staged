#!/usr/bin/env node --experimental-strip-types
/**
 * Live test of the URL-downloaded reference flow (fix for agents not having
 * the attached photo on disk). Launches declutter agents whose Step 1 is a
 * curl download of the kitchen photo, then checks timing + delivered dims.
 *
 *   CURSOR_API_KEY=... node --experimental-strip-types test-url-reference.mjs --runs 2
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
// Public URL with the exact same photo — stands in for the signed
// /api/render-input URL that production generates.
const REFERENCE_URL = "https://raw.githubusercontent.com/sid-081205/staged/master/experiments/IMG_1201.jpeg";
const MODEL = process.env.LIVE_MODEL || "composer-2.5";
const TIMEOUT_MS = 10 * 60_000;

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

async function runOnce(runIdx, input, width, height) {
  const agentPrompt = buildAgentPrompt(buildPrompt("declutter", null, "kitchen"), {
    width,
    height,
    service: "declutter",
    referenceUrl: REFERENCE_URL,
  });
  const t0 = Date.now();
  const mark = (label) => console.log(`  [url#${runIdx}] ${((Date.now() - t0) / 1000).toFixed(0)}s ${label}`);

  const created = await api("/v1/agents", {
    method: "POST",
    body: JSON.stringify({
      name: `test-url-reference-declutter-${runIdx}`,
      prompt: { text: agentPrompt, images: [{ data: input.toString("base64"), mimeType: "image/jpeg" }] },
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
      await new Promise((r) => setTimeout(r, 5000));
      let run, artifacts;
      try {
        [run, artifacts] = await Promise.all([
          api(`/v1/agents/${agentId}/runs/${runId}`),
          api(`/v1/agents/${agentId}/artifacts`).catch(() => ({ items: [] })),
        ]);
      } catch {
        continue; // transient 429/5xx — poll again
      }
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
    mark(`artifact ${image.path}`);

    const { url } = await api(`/v1/agents/${agentId}/artifacts/download?path=${encodeURIComponent(image.path)}`);
    const download = await fetch(url);
    const bytes = Buffer.from(await download.arrayBuffer());
    api(`/v1/agents/${agentId}/runs/${runId}/cancel`, { method: "POST" }).catch(() => {});

    const rawMeta = await sharp(bytes).metadata();
    const delivered = await lockToDimensions(bytes, width, height);
    const file = path.join(OUT, `url-declutter-run${runIdx}.jpg`);
    fs.writeFileSync(file, delivered);
    const total = +((Date.now() - t0) / 1000).toFixed(1);
    console.log(`DONE url#${runIdx}: ${total}s raw=${rawMeta.width}x${rawMeta.height} -> ${width}x${height} (${path.basename(file)}) agent=${agentId}`);
    return true;
  } catch (err) {
    api(`/v1/agents/${agentId}/runs/${runId}/cancel`, { method: "POST" }).catch(() => {});
    console.log(`FAIL url#${runIdx}: ${String(err.message ?? err)}`);
    return false;
  } finally {
    api(`/v1/agents/${agentId}/archive`, { method: "POST" }).catch(() => {});
  }
}

const runs = Number(process.argv.includes("--runs") ? process.argv[process.argv.indexOf("--runs") + 1] : 1);
const { buffer: input, width, height } = await preprocessInput(INPUT);
console.log(`input ${width}x${height}; reference URL flow; runs=${runs}`);
await Promise.all(
  Array.from({ length: runs }, (_, i) => new Promise((r) => setTimeout(r, i * 4000)).then(() => runOnce(i + 1, input, width, height)))
);
