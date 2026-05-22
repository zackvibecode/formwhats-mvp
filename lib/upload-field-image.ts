/**
 * Convert a user-picked image File into a base64 data URL that can be
 * stored directly in `form_fields.image_url` (TEXT column).
 *
 * Strategy:
 *   1. Validate type + cap raw upload at 5 MB so a stray 50 MB DSLR
 *      shot doesn't lock up the browser.
 *   2. Auto-compress: decode the image, draw it on a canvas with a max
 *      long-edge of 1600 px, and re-encode as JPEG quality 0.85. This
 *      typically lands around 100-400 KB regardless of the source size.
 *   3. Return the canvas data URL. The caller persists it as-is.
 *
 * Why client-side compression:
 *   - Storing a base64 image in a TEXT column means every byte hits the
 *     PostgreSQL row. Compression keeps rows small and public-form
 *     loads fast on mobile 4G.
 *   - Customers upload phone photos that are 3-8 MB. We don't want to
 *     reject those -- we want to make them work transparently.
 *
 * Function signature is unchanged so existing callers (Field Library
 * panel, Field Settings panel) keep working.
 */
export async function uploadFieldImage(
  file: File,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _userId: string,
): Promise<string> {
  // 1. File type validation
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Only JPG, PNG, and WebP images are allowed.");
  }

  // 2. Sanity cap on raw upload. 5 MB covers virtually every phone photo
  //    after the user picks from their gallery. Bigger than that is
  //    almost always RAW / DSLR territory and not worth the browser
  //    memory cost of decoding.
  const MAX_BYTES = 5 * 1024 * 1024;
  if (file.size > MAX_BYTES) {
    throw new Error("Image must be less than 5MB.");
  }

  // 3. Compress + return as data URL
  return await compressImageToDataUrl(file);
}

/**
 * Decode the file with the browser's native image decoder, draw it onto
 * a canvas with a long-edge cap, and return the result as a JPEG data
 * URL. Falls back to raw FileReader output on any error so we never
 * leave the user empty-handed.
 */
async function compressImageToDataUrl(file: File): Promise<string> {
  // Long-edge cap. 1600 px is enough for a hero banner on a high-DPI
  // phone yet still keeps the encoded payload small.
  const MAX_LONG_EDGE = 1600;
  const JPEG_QUALITY = 0.85;

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(objectUrl);

    // Compute target dimensions, preserving aspect ratio.
    let { width, height } = img;
    if (width > height && width > MAX_LONG_EDGE) {
      height = Math.round((height * MAX_LONG_EDGE) / width);
      width = MAX_LONG_EDGE;
    } else if (height >= width && height > MAX_LONG_EDGE) {
      width = Math.round((width * MAX_LONG_EDGE) / height);
      height = MAX_LONG_EDGE;
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      // Canvas unsupported -- fall back to raw read.
      return await readAsDataUrl(file);
    }
    ctx.drawImage(img, 0, 0, width, height);

    // Encode as JPEG. PNG with transparency would balloon the size,
    // and forms don't typically need alpha for question images.
    const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
    if (!dataUrl || dataUrl === "data:,") {
      return await readAsDataUrl(file);
    }
    return dataUrl;
  } catch (err) {
    console.warn("[uploadFieldImage] compression failed, using raw", err);
    return await readAsDataUrl(file);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to decode image."));
    img.src = src;
  });
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string" || result === "") {
        reject(new Error("Failed to read image."));
        return;
      }
      resolve(result);
    };
    reader.onerror = () => reject(new Error("Failed to read image."));
    reader.readAsDataURL(file);
  });
}
