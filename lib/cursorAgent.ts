import fs from "node:fs";
import sharp from "sharp";

/**
 * Image generation backed by the Cursor Cloud Agents API.
 *
 * Each render spins up a cloud agent linked to the workspace repo
 * (CURSOR_REPO), sends it the room photo + staging prompt, and asks it to
 * save the generated image into the agent's artifacts directory. We poll the
 * run until it finishes, then download the artifact via a presigned URL.
 *
 * With MOCK_GENERATION=1, returns a tinted copy of the input instead (for
 * local development without burning agent credits).
 */

const API = "https://api.cursor.com";
const REPO = process.env.CURSOR_REPO || "https://github.com/sid-081205/images";
const MODEL = process.env.CURSOR_MODEL || "composer-2.5";

const POLL_INTERVAL_MS = 5_000;
// Generous: the agent may need a second generation attempt if the first one
// altered the room's architecture.
const TIMEOUT_MS = 8 * 60_000;

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

export async function stagePhoto(inputPath: string, prompt: string, styleKey?: string): Promise<Buffer> {
  if (process.env.MOCK_GENERATION === "1") {
    // Emulate real generation latency (real renders take 1–5 min) so the
    // background-progress flow is observable locally. Tunable / zero-able.
    const delay = Number(process.env.MOCK_DELAY_MS ?? 6000);
    if (delay > 0) await new Promise((r) => setTimeout(r, delay));
    const base = sharp(inputPath).rotate();
    if (styleKey === "enhance") {
      return base.modulate({ brightness: 1.18, saturation: 1.12 }).jpeg({ quality: 92 }).toBuffer();
    }
    if (styleKey === "declutter") {
      return base.modulate({ brightness: 1.06, saturation: 0.9 }).jpeg({ quality: 92 }).toBuffer();
    }
    return base.modulate({ brightness: 1.05, saturation: 1.25, hue: 15 }).jpeg({ quality: 92 }).toBuffer();
  }

  // Cap input at 2048px on the long edge to keep the upload small.
  const input = await sharp(fs.readFileSync(inputPath))
    .rotate() // apply EXIF orientation
    .resize(2048, 2048, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 92 })
    .toBuffer();

  const agentPrompt = [
    "You are an image editing worker for a real estate photo service. Your ONLY task is to produce one edited image from the attached room photo. Do NOT explore the repository, do NOT read files, do NOT run git commands.",
    "",
    "Step 1: Look at the attached room photo carefully and note its fixed features: camera angle, each window (frame style, number of panes, the view through it), doors, radiators, wall colors, flooring, ceiling and light fixtures. These must all survive the edit unchanged.",
    "",
    "Step 2: Call your image generation tool in image-to-image / edit mode. You MUST pass the attached room photo as the reference image (use its file path in the tool's reference image parameter). Give the tool this instruction:",
    "",
    prompt,
    "",
    "Step 3: VERIFY before delivering. Open the generated image and compare it against the original photo. It passes only if the camera angle, windows (same frames, same panes, same view), walls, doors, radiators, flooring and ceiling are the same as the original. If anything structural changed, or a specifically requested item is missing or wrong, DO NOT deliver it: generate again (repeating that the output must be a faithful edit of the reference photo and correcting what went wrong). At most 2 generation attempts; deliver the more faithful result.",
    "",
    "Step 4: Save ONLY the final approved image into the artifacts directory at the workspace root (a filename ending in .png or .jpg). Never place a rejected image in artifacts. Keep rejected attempts outside the artifacts directory.",
    "Step 5: Reply DONE and stop immediately. Do not commit, do not push, do not open a PR.",
  ].join("\n");

  const created = await api<{ agent: { id: string }; run: { id: string } }>("/v1/agents", {
    method: "POST",
    body: JSON.stringify({
      name: `staged-render-${styleKey ?? "stage"}`,
      prompt: {
        text: agentPrompt,
        images: [{ data: input.toString("base64"), mimeType: "image/jpeg" }],
      },
      model: { id: MODEL },
      repos: [{ url: REPO, startingRef: "main" }],
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

    // Normalize to JPEG regardless of what the agent saved.
    return await sharp(bytes).jpeg({ quality: 95 }).toBuffer();
  } finally {
    // Best-effort cleanup so render agents don't pile up in the dashboard.
    api(`/v1/agents/${agentId}/archive`, { method: "POST" }).catch(() => {});
  }
}
