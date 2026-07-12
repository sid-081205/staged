import sharp from "sharp";

const PREVIEW_WIDTH = 1280;

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
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
      <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle"
        transform="rotate(-24 170 110)"
        font-family="Helvetica, Arial, sans-serif" font-size="30" font-weight="700"
        fill="#1c1917" fill-opacity="0.38">${escapeXml("STAGED · PREVIEW")}</text>
    </svg>`
  );

  return base
    .composite([{ input: tile, tile: true }])
    .jpeg({ quality: 82 })
    .toBuffer();
}

/**
 * Optional MLS disclosure label composited into the corner of paid downloads.
 * Most MLSs require virtually staged photos to be identified as such.
 */
export async function addDisclosureLabel(image: Buffer): Promise<Buffer> {
  const meta = await sharp(image).metadata();
  const w = meta.width ?? 1280;
  const fontSize = Math.max(14, Math.round(w * 0.014));
  const padX = Math.round(fontSize * 0.9);
  const boxH = Math.round(fontSize * 2.2);
  const text = "VIRTUALLY STAGED";
  const boxW = Math.round(text.length * fontSize * 0.62) + padX * 2;

  const label = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${boxW}" height="${boxH}">
      <rect width="100%" height="100%" fill="#1c1917" fill-opacity="0.72"/>
      <text x="50%" y="52%" text-anchor="middle" dominant-baseline="middle"
        font-family="Helvetica, Arial, sans-serif" font-size="${fontSize}"
        font-weight="600" letter-spacing="2" fill="#faf7f0">${text}</text>
    </svg>`
  );

  const margin = Math.round(fontSize);
  return sharp(image)
    .composite([{ input: label, left: margin, top: (meta.height ?? boxH + margin) - boxH - margin }])
    .jpeg({ quality: 95 })
    .toBuffer();
}
