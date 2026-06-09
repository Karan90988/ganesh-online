/**
 * Client-safe Cloudinary helpers. Uses only the unsigned upload REST endpoint
 * and NEXT_PUBLIC_* env vars — does NOT import the Cloudinary Node SDK, so it
 * is safe to use inside client components.
 */

export const isCloudinaryConfigured = () =>
  Boolean(
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME &&
      process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
  );

/** Unsigned upload of a File to Cloudinary; returns the secure URL. */
export async function uploadToCloudinary(file: File): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  if (!cloudName || !preset) {
    throw new Error("Cloudinary is not configured");
  }
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", preset);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: formData }
  );
  if (!res.ok) {
    throw new Error("Image upload failed");
  }
  const data = await res.json();
  return data.secure_url as string;
}
