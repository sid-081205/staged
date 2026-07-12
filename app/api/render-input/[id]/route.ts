import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import { getPhoto } from "@/lib/db";
import { preprocessInput } from "@/lib/cursorAgent";
import { verifyRenderInput } from "@/lib/renderInputToken";

export const runtime = "nodejs";

/**
 * GET /api/render-input/:photoId?exp=...&sig=...
 *
 * Serves the preprocessed room photo (EXIF-rotated, long edge capped) to the
 * render agent, which curls it onto its VM disk so the image tool gets the
 * real pixels as a reference file. HMAC-signed and expiring; not linked
 * anywhere user-facing.
 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const exp = Number(req.nextUrl.searchParams.get("exp"));
  const sig = req.nextUrl.searchParams.get("sig") ?? "";

  if (!verifyRenderInput(id, exp, sig)) {
    return NextResponse.json({ error: "Invalid or expired link." }, { status: 403 });
  }

  const photo = getPhoto(id);
  if (!photo || !fs.existsSync(photo.original_path)) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  // Serve exactly what the pipeline attaches to the agent, so the reference
  // file and the in-context attachment are byte-identical.
  const { buffer } = await preprocessInput(photo.original_path);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "image/jpeg",
      "Content-Length": String(buffer.length),
      "Cache-Control": "private, no-store",
    },
  });
}
