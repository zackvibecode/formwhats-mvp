/**
 * Convert a user-picked image File into a base64 data URL that can be
 * stored directly in `form_fields.image_url` (TEXT column) without
 * needing Supabase Storage / buckets / RLS policies set up.
 *
 * Trade-off:
 *   - Pro: zero infrastructure setup. Works the moment the user picks
 *     an image. Same UX as dropdown / number / other field types --
 *     click and it just works.
 *   - Con: each image bloats the form_fields row. We cap at 1 MB to
 *     keep public-form payload reasonable on mobile 4G.
 *
 * If you outgrow this (lots of images per form, or want CDN delivery),
 * swap the body back to a Supabase Storage upload -- the calling code
 * only sees the same return type (a string URL/data-URL).
 *
 * Function signature stays the same so existing callers don't break.
 *
 * @param file   File chosen via <input type="file"> or drag-and-drop
 * @param _userId Kept for API compat with the previous Storage-based
 *                implementation; unused in this version.
 * @returns      A data URL of the form `data:image/png;base64,...`
 */
export async function uploadFieldImage(
  file: File,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _userId: string,
): Promise<string> {
  // 1. File type validation -- accept the same set as before.
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Only JPG, PNG, and WebP images are allowed.");
  }

  // 2. File size validation. 1 MB keeps the base64-encoded payload
  //    around ~1.4 MB which is still snappy on mobile and well under
  //    PostgreSQL row limits.
  const MAX_BYTES = 1 * 1024 * 1024;
  if (file.size > MAX_BYTES) {
    throw new Error("Image must be less than 1MB.");
  }

  // 3. Read the file as a data URL. FileReader is synchronous-ish via
  //    a callback API so we wrap it in a Promise.
  return new Promise<string>((resolve, reject) => {
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
