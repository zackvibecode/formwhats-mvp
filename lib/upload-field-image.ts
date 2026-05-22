import { supabase } from "@/lib/supabase";

/**
 * Upload an image file from the builder Field Settings panel to Supabase
 * Storage and return its public URL.
 *
 * Requirements (must be created manually in the Supabase dashboard):
 *   - A PUBLIC storage bucket named `form-images`.
 *
 * Storage layout:
 *   form-field-images/<userId>/<timestamp>-<safe-filename>
 *
 * The userId folder lets us scope policies later (e.g. only owner can
 * delete) without rewriting the path.
 *
 * @param file   File chosen via <input type="file" accept="image/*">
 * @param userId Current authenticated user's id (auth.users.id)
 * @returns      Public URL of the uploaded image
 */
export async function uploadFieldImage(
  file: File,
  userId: string,
): Promise<string> {
  // 1. File type validation
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Only JPG, PNG, and WebP images are allowed.");
  }

  // 2. File size validation: 3 MB max
  const MAX_BYTES = 3 * 1024 * 1024;
  if (file.size > MAX_BYTES) {
    throw new Error("Image must be less than 3MB.");
  }

  // 3. Safe filename: lowercase, hyphenate spaces, drop unsafe chars
  const safeName = file.name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9.\-_]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const finalName = safeName === "" ? "image" : safeName;

  // 4. Storage path. Timestamp prefix avoids collisions when the same file
  //    name is uploaded multiple times.
  const path = `form-field-images/${userId}/${Date.now()}-${finalName}`;

  // 5. Upload
  const { error: uploadError } = await supabase.storage
    .from("form-images")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (uploadError) {
    // 6. Surface a friendly error but keep technical detail in the console
    //    for debugging (RLS denied, bucket missing, quota, etc.)
    console.error("[uploadFieldImage] upload failed", uploadError);
    throw new Error("Failed to upload image.");
  }

  // 7. Resolve public URL
  const { data } = supabase.storage.from("form-images").getPublicUrl(path);

  if (!data?.publicUrl) {
    throw new Error("Failed to upload image.");
  }

  // 8. Done
  return data.publicUrl;
}
