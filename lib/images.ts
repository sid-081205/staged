import sharp from "sharp";
import { LABEL_TEXT, WATERMARK_TEXT, TextPath } from "./textPaths";

const PREVIEW_WIDTH = 1280;

/**
 * Watermark / label text is composited as pre-traced SVG path outlines
 * (lib/textPaths.ts) rather than SVG <text>: librsvg resolves <text> through
 * the system's fontconfig, and on a server with no fonts installed every
 * glyph renders as a tofu box (which is exactly what happened in production).
 * Outlines need no fonts and render identically everywhere.
 */

/** <g> wrapping the traced text, scaled to `fontSize` and centered on (cx, cy). */
function textPathGroup(
  text: TextPath,
  opts: { fontSize: number; cx: number; cy: number; fill: string; opacity?: number; rotate?: number }
): string {
  const s = opts.fontSize / 100; // paths were traced at font size 100
  const midX = (text.x1 + text.x2) / 2;
  const midY = (text.y1 + text.y2) / 2;
  const rotate = opts.rotate ? ` rotate(${opts.rotate})` : "";
  return `<g transform="translate(${opts.cx} ${opts.cy})${rotate} scale(${s}) translate(${-midX} ${-midY})">
    <path d="${text.d}" fill="${opts.fill}"${opts.opacity !== undefined ? ` fill-opacity="${opts.opacity}"` : ""}/>
  </g>`;
}

/** Traced text width in pixels at a given font size. */
function textPathWidth(text: TextPath, fontSize: number): number {
  return ((text.x2 - text.x1) * fontSize) / 100;
}

/** Diagonal repeating watermark for unpaid previews. */
export async function watermarkPreview(image: Buffer): Promise<Buffer> {
  const base = sharp(image).resize(PREVIEW_WIDTH, PREVIEW_WIDTH, {
    fit: "inside",
    withoutEnlargement: true,
  });
  const { width = PREVIEW_WIDTH, height = PREVIEW_WIDTH } = await base
    .clone()
    .jpeg()
    .toBuffer({ resolveWithObject: true })
    .then((r) => r.info);

  const tile = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="340" height="220">
      ${textPathGroup(WATERMARK_TEXT, { fontSize: 30, cx: 170, cy: 110, fill: "#1c1917", opacity: 0.38, rotate: -24 })}
    </svg>`
  );

  return base
    .composite([{ input: tile, tile: true }])
    .jpeg({ quality: 82 })
    .toBuffer();
}

/**
 * Optional MLS disclosure label ("VIRTUALLY STAGED") composited into the
 * corner of paid downloads. Most MLSs require virtually staged photos to be
 * identified as such.
 */
export async function addDisclosureLabel(image: Buffer): Promise<Buffer> {
  const meta = await sharp(image).metadata();
  const w = meta.width ?? 1280;
  const fontSize = Math.max(14, Math.round(w * 0.014));
  const padX = Math.round(fontSize * 0.9);
  const boxH = Math.round(fontSize * 2.2);
  const boxW = Math.round(textPathWidth(LABEL_TEXT, fontSize)) + padX * 2;

  const label = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${boxW}" height="${boxH}">
      <rect width="100%" height="100%" fill="#1c1917" fill-opacity="0.72"/>
      ${textPathGroup(LABEL_TEXT, { fontSize, cx: boxW / 2, cy: boxH / 2, fill: "#faf7f0" })}
    </svg>`
  );

  const margin = Math.round(fontSize);
  return sharp(image)
    .composite([{ input: label, left: margin, top: (meta.height ?? boxH + margin) - boxH - margin }])
    .jpeg({ quality: 95 })
    .toBuffer();
}
