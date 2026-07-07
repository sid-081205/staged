import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import sharp from "sharp";
import { getPhoto, getRender } from "@/lib/db";
import { addDisclosureLabel, watermarkPreview } from "@/lib/images";

export const runtime = "nodejs";

/**
 * GET /api/image/:id?kind=original|preview|full&label=1
 * - original: the uploaded photo (id = photoId)
 * - preview:  render preview (id = renderId) — clean if the render was paid
 *             with a credit, watermarked if it was a free preview
 * - full:     clean full-res render, only for credit renders;
 *             label=1 adds a "VIRTUALLY STAGED" disclosure mark
 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const kind = req.nextUrl.searchParams.get("kind") ?? "preview";

  if (kind === "original") {
    const photo = getPhoto(id);
    if (!photo || !fs.existsSync(photo.original_path)) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    return imageResponse(fs.readFileSync(photo.original_path));
  }

  const render = getRender(id);
  if (!render || render.status !== "done" || !render.output_path || !fs.existsSync(render.output_path)) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  const bytes = fs.readFileSync(render.output_path);

  if (kind === "full") {
    if (render.paid !== 1) {
      return NextResponse.json({ error: "Free previews can't be downloaded. Buy a pack for clean full-res files." }, { status: 402 });
    }
    const withLabel = req.nextUrl.searchParams.get("label") === "1";
    const out = withLabel ? await addDisclosureLabel(bytes) : bytes;
    return imageResponse(out, `staged-${render.style}-${render.id}.jpg`);
  }

  // Credit renders get clean (but downsized) previews in the UI.
  if (render.paid === 1) {
    const clean = await sharp(bytes)
      .resize(1280, 1280, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();
    return imageResponse(clean);
  }

  return imageResponse(await watermarkPreview(bytes));
}

function imageResponse(bytes: Buffer, downloadName?: string): NextResponse {
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "private, max-age=3600",
      ...(downloadName ? { "Content-Disposition": `attachment; filename="${downloadName}"` } : {}),
    },
  });
}
