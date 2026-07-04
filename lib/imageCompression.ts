"use client";

/**
 * Compresses an image file in the browser before it's uploaded: resizes so
 * the longest side is at most `maxDimension` px and re-encodes as JPEG at
 * `quality`. This runs client-side so we never send a multi-megabyte
 * original to the server — the admin panel's image fields (packages,
 * visas, blogs, flights, insurance logos) all use this before POSTing.
 */
export async function compressImage(
  file: File,
  { maxDimension = 1280, quality = 0.8 }: { maxDimension?: number; quality?: number } = {}
): Promise<File> {
  if (!file.type.startsWith("image/")) return file;

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, width, height);

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality)
  );
  if (!blob) return file;

  const newName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
  return new File([blob], newName, { type: "image/jpeg" });
}
