import fs from "node:fs";
import sharp from "sharp";

/**
 * Image generation backed by the Cursor Cloud Agents API.
 *
 * Each render spins up a cloud agent (repo-less by default; linked to
 * CURSOR_REPO if set), sends it the room photo + staging prompt, and asks it
 * to save the generated image into the agent's artifacts directory. We poll
 * the run until it finishes, then download the artifact via a presigned URL.
 *
 * Latency design (live-measured ~4 min avg on composer-2.5, was 5–7 min;
 * ~2.5 min if CURSOR_MODEL is set to a plan-available faster model):
 * - The agent is told to call the image tool as its FIRST action — no
 *   written scene inventory before generating (saved ~30–60s).
 * - The verify-against-original step is kept (it is the product's fidelity
 *   moat) but capped at ONE regeneration, and `enhance` never regenerates
 *   (global tonal edits don't drift architecture; a retry just doubles time).
 * - Artifacts are polled every 3s instead of 5s.
 *
 * Dimension lock: the output always matches the preprocessed input's exact
 * width×height. The agent is told the required aspect/orientation up front,
 * and after download we cover-resize to the recorded target size, so a
 * portrait upload can never come back as a landscape crop.
 *
 * With MOCK_GENERATION=1, returns a tinted copy of the input instead (for
 * local development without burning agent credits).
 */

const API = "https://api.cursor.com";
// Repo the render agents are linked to. Optional: leave CURSOR_REPO unset (or
// set it to "none") to run repo-less agents — live tests show identical speed
// and fidelity, and it removes the connected-GitHub-repo requirement. Set a
// repo URL to keep the old behavior.
const REPO_RAW = (process.env.CURSOR_REPO || "").trim();
const REPO = REPO_RAW && REPO_RAW.toLowerCase() !== "none" ? REPO_RAW : null;
// Which Cursor model runs the render. Default composer-2.5 (cheap, and the
// fastest of the plan-available options in live tests: stage renders avg
// ~236s with the current wrapper vs ~305s+ on Auto). claude-opus-4-8 measured
// ~2x faster with the best fidelity in model-comparison, but is not available
// on all plans — set CURSOR_MODEL to it if your account has access. Run
// `node experiments/model-comparison/run.mjs --list` to see valid ids.
const MODEL = (process.env.CURSOR_MODEL || "composer-2.5").trim();

const POLL_INTERVAL_MS = 3_000;
// Safety net only — live-measured typical renders are ~3–4.5 min on
// composer-2.5 now that the agent generates immediately and retries at most
// once (worst case with the one retry ~6 min).
const TIMEOUT_MS = 8 * 60_000;

/** Long-edge cap for the image sent to the model. */
const INPUT_LONG_EDGE = 2048;

function authHeader(): string {
  const key = process.env.CURSOR_API_KEY;
  if (!key) {
    throw new Error("CURSOR_API_KEY is not set. Add it to .env (or set MOCK_GENERATION=1 for local testing).");
  }
  return `Basic ${Buffer.from(`${key}:`).toString("base64")}`;
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Cursor API ${path} failed (${res.status}): ${body.slice(0, 300)}`);
  }
  return (await res.json()) as T;
}

/**
 * EXIF-rotate and cap the upload at INPUT_LONG_EDGE on its long edge, keeping
 * the aspect ratio. The returned width/height are the contract for the final
 * output: whatever the model does, we deliver exactly this size back.
 */
export async function preprocessInput(
  inputPath: string
): Promise<{ buffer: Buffer; width: number; height: number }> {
  const { data, info } = await sharp(fs.readFileSync(inputPath))
    .rotate() // apply EXIF orientation
    .resize(INPUT_LONG_EDGE, INPUT_LONG_EDGE, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 92 })
    .toBuffer({ resolveWithObject: true });
  return { buffer: data, width: info.width, height: info.height };
}

/**
 * Force the generated image to the exact dimensions of the preprocessed
 * input. Models often return a fixed size (e.g. 1536×1024); the prompt pushes
 * them to the right aspect, and this cover-resize guarantees the delivered
 * file matches the upload's orientation and pixel size.
 */
export async function lockToDimensions(bytes: Buffer, width: number, height: number): Promise<Buffer> {
  return sharp(bytes).resize(width, height, { fit: "cover" }).jpeg({ quality: 95 }).toBuffer();
}

function orientationWord(width: number, height: number): string {
  if (width === height) return "square";
  return width > height ? "landscape" : "portrait";
}

/**
 * The wrapper around the image-tool instruction. Tuned for speed: the agent
 * must generate first (no written analysis), verify once, and regenerate at
 * most once — never for `enhance`.
 */
export function buildAgentPrompt(
  prompt: string,
  opts: { width: number; height: number; service?: string }
): string {
  const { width, height, service } = opts;
  const orientation = orientationWord(width, height);
  const dimensionLine = `OUTPUT DIMENSIONS: the reference photo is ${width}×${height} pixels (${orientation}). The output image MUST keep this exact aspect ratio and ${orientation} orientation. Do not crop to a different shape, do not letterbox, do not change the framing.`;

  const verifyStep =
    service === "enhance"
      ? "Step 2: Confirm the generated image kept the same objects, architecture and orientation as the original photo. Do NOT regenerate for tonal differences — lighting changes are the point. Deliver it."
      : [
          "Step 2: VERIFY quickly — open the generated image next to the original photo. It fails ONLY if one of these clearly changed: window frames/panes/outdoor view, wall color, floor, ceiling, trim, doors, radiators, built-ins, camera position/perspective/crop, or the orientation (portrait vs landscape) — or if a specifically requested item is missing or wrong.",
          "If it fails, regenerate EXACTLY ONCE: same instruction plus one sentence correcting what drifted. Then deliver the more faithful of the two images. Never make a third image. If it passes, deliver it immediately.",
        ].join("\n");

  return [
    "You are an image editing worker for a real estate photo service. Your ONLY task is to produce one edited image from the attached room photo, fast. Do NOT explore the repository, do NOT read files, do NOT run git commands, and do NOT write any scene analysis or inventory.",
    "",
    "Step 1: IMMEDIATELY — as your first action — call your image generation tool in image-to-image / edit mode. You MUST pass the attached room photo as the reference image (use its file path in the tool's reference image parameter). Give the tool this instruction:",
    "",
    prompt,
    "",
    dimensionLine,
    "",
    verifyStep,
    "",
    "Step 3: Save ONLY the delivered image into the artifacts directory at the workspace root (a filename ending in .png or .jpg). Never place a rejected image in artifacts; keep rejected attempts outside it.",
    "Step 4: Reply DONE and stop immediately. Do not commit, do not push, do not open a PR.",
  ].join("\n");
}

export async function stagePhoto(inputPath: string, prompt: string, styleKey?: string): Promise<Buffer> {
  if (process.env.MOCK_GENERATION === "1") {
    // Emulate real generation latency (real renders take 1–5 min) so the
    // background-progress flow is observable locally. Tunable / zero-able.
    const delay = Number(process.env.MOCK_DELAY_MS ?? 6000);
    if (delay > 0) await new Promise((r) => setTimeout(r, delay));
    // Mirror the production contract: output dimensions == preprocessed input.
    const { buffer, width, height } = await preprocessInput(inputPath);
    const base = sharp(buffer);
    const tinted =
      styleKey === "enhance"
        ? base.modulate({ brightness: 1.18, saturation: 1.12 })
        : styleKey === "declutter"
          ? base.modulate({ brightness: 1.06, saturation: 0.9 })
          : base.modulate({ brightness: 1.05, saturation: 1.25, hue: 15 });
    return lockToDimensions(await tinted.toBuffer(), width, height);
  }

  const { buffer: input, width, height } = await preprocessInput(inputPath);

  // Renders store a furniture style key for staging or the service key for
  // declutter/enhance; only "enhance"/"declutter" matter to the wrapper.
  const service = styleKey === "enhance" || styleKey === "declutter" ? styleKey : "stage";
  const agentPrompt = buildAgentPrompt(prompt, { width, height, service });

  const created = await api<{ agent: { id: string }; run: { id: string } }>("/v1/agents", {
    method: "POST",
    body: JSON.stringify({
      name: `staged-render-${styleKey ?? "stage"}`,
      prompt: {
        text: agentPrompt,
        images: [{ data: input.toString("base64"), mimeType: "image/jpeg" }],
      },
      model: { id: MODEL },
      ...(REPO ? { repos: [{ url: REPO, startingRef: "main" }] } : {}),
      autoCreatePR: false,
    }),
  });

  const agentId = created.agent.id;
  const runId = created.run.id;

  try {
    // Poll artifacts alongside run status: the image usually exists well
    // before the agent formally finishes, so grab it as soon as it appears.
    const deadline = Date.now() + TIMEOUT_MS;
    let status = "CREATING";
    let image: { path: string; sizeBytes: number } | undefined;
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
      const [run, artifacts] = await Promise.all([
        api<{ status: string }>(`/v1/agents/${agentId}/runs/${runId}`),
        api<{ items: { path: string; sizeBytes: number }[] }>(`/v1/agents/${agentId}/artifacts`).catch(
          () => ({ items: [] as { path: string; sizeBytes: number }[] })
        ),
      ]);
      status = run.status;
      image = artifacts.items
        .filter((a) => /\.(png|jpe?g|webp)$/i.test(a.path) && a.sizeBytes > 10_000)
        .sort((a, b) => b.sizeBytes - a.sizeBytes)[0];
      if (image) break;
      if (["FINISHED", "ERROR", "EXPIRED", "CANCELLED"].includes(status)) break;
    }

    if (!image) {
      if (status === "FINISHED") throw new Error("The agent finished but produced no image. Try again.");
      if (["ERROR", "EXPIRED", "CANCELLED"].includes(status)) {
        throw new Error(`The render agent ended with status ${status}. Try again.`);
      }
      // Timed out with the agent still running — stop it so it can't bill on.
      await api(`/v1/agents/${agentId}/runs/${runId}/cancel`, { method: "POST" }).catch(() => {});
      throw new Error("The render took too long. Try again.");
    }

    const { url } = await api<{ url: string }>(
      `/v1/agents/${agentId}/artifacts/download?path=${encodeURIComponent(image.path)}`
    );
    const download = await fetch(url);
    if (!download.ok) throw new Error(`Artifact download failed (${download.status}).`);
    const bytes = Buffer.from(await download.arrayBuffer());

    // The agent has served its purpose once the image is out; stop it early
    // if it is still running so it doesn't keep spending.
    api(`/v1/agents/${agentId}/runs/${runId}/cancel`, { method: "POST" }).catch(() => {});

    // Deliver at exactly the preprocessed input's dimensions.
    return await lockToDimensions(bytes, width, height);
  } finally {
    // Best-effort cleanup so render agents don't pile up in the dashboard.
    api(`/v1/agents/${agentId}/archive`, { method: "POST" }).catch(() => {});
  }
}
