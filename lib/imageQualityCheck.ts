// Soft quality gate for document uploads. Not a hard block — some
// legitimate scans are small — but a low-res or suspiciously tiny file
// is a common, avoidable reason embassies reject a document, so we warn
// early instead of finding out weeks later.
const MIN_DIMENSION_PX = 800;
const MIN_FILE_SIZE_BYTES = 20 * 1024; // 20KB

export async function checkImageQuality(file: File): Promise<string | null> {
  if (!file.type.startsWith("image/")) return null; // PDFs aren't checked this way

  if (file.size < MIN_FILE_SIZE_BYTES) {
    return "This file looks very small — please make sure it's a clear, readable scan.";
  }

  try {
    const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => { URL.revokeObjectURL(url); resolve({ width: img.naturalWidth, height: img.naturalHeight }); };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Could not read image")); };
      img.src = url;
    });

    if (Math.min(dimensions.width, dimensions.height) < MIN_DIMENSION_PX) {
      return "This image's resolution looks low — a blurry scan is a common reason for embassy rejection. Consider a clearer photo/scan if possible.";
    }
  } catch {
    return null; // couldn't check — don't block on our own tooling failure
  }

  return null;
}
