import sharp from "sharp";
import convert from "heic-convert";

/**
 * iPhones shoot HEIC by default, but sharp's prebuilt binaries cannot decode
 * HEIC (its HEVC codec is patent encumbered), which used to surface as
 * "<file> is not a readable image" for every iPhone upload. Detect the HEIC
 * container and convert it with heic-convert (WASM libheif) before handing
 * the bytes to sharp.
 */
function isHeic(bytes: Buffer): boolean {
  if (bytes.length < 12 || bytes.toString("ascii", 4, 8) !== "ftyp") return false;
  const brand = bytes.toString("ascii", 8, 12).toLowerCase();
  return ["heic", "heix", "hevc", "hevx", "heim", "heis", "hevm", "hevs", "mif1", "msf1"].includes(
    brand
  );
}

/**
 * Normalize any supported upload (JPG, PNG, WEBP, HEIC, ...) to an upright
 * JPEG. Throws if the bytes are not a decodable image.
 */
export async function normalizeToJpeg(bytes: Buffer): Promise<Buffer> {
  let input: Buffer = bytes;
  if (isHeic(bytes)) {
    const converted = await convert({ buffer: new Uint8Array(bytes), format: "JPEG", quality: 0.95 });
    input = Buffer.from(converted);
  }
  return await sharp(input).rotate().jpeg({ quality: 95 }).toBuffer();
}
