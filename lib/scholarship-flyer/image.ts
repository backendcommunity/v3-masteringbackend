/**
 * Photo intake. The file is read, validated and downscaled entirely in the
 * browser — it is never uploaded. Downscaling matters as much as validation:
 * a 12MP camera photo pushed straight into a 1080×1350 rasterise can exhaust
 * memory on older phones.
 */

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
export const MAX_EDGE_PX = 1200;

export class PhotoError extends Error {}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new PhotoError("That image couldn't be opened. Try another one."));
    img.src = src;
  });
}

/** Returns a data URL ready to drop into the flyer's photo slot. */
export async function readPhoto(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new PhotoError("Choose an image file — JPG, PNG or HEIC.");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new PhotoError("That image is over 8MB. Try a smaller one.");
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(objectUrl);
    const longest = Math.max(img.naturalWidth, img.naturalHeight);
    const scale = longest > MAX_EDGE_PX ? MAX_EDGE_PX / longest : 1;

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new PhotoError("Your browser couldn't process that image.");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL("image/jpeg", 0.92);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
