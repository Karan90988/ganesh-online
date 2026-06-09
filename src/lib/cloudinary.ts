import "server-only";
import { v2 as cloudinary } from "cloudinary";

// Server-side Cloudinary config (for signed deletes / server-side uploads).
// Client components must use "@/lib/cloudinary-client" instead.
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };
