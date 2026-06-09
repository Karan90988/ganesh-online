"use client";

import { useState } from "react";
import { Upload, Loader2, Link2 } from "lucide-react";
import { uploadToCloudinary, isCloudinaryConfigured } from "@/lib/cloudinary-client";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

/**
 * Product image input. Uploads to Cloudinary when configured, otherwise falls
 * back to pasting an image URL — so the app works even before Cloudinary setup.
 */
export function ImageUpload({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const toast = useToast();
  const cloudinaryOn = isCloudinaryConfigured();

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      onChange(url);
      toast.success("Image uploaded");
    } catch {
      toast.error("Upload failed", "Check Cloudinary settings or paste a URL.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border bg-muted">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={value}
              src={value}
              alt="Preview"
              className="h-full w-full object-cover"
              onLoad={(e) => {
                (e.currentTarget as HTMLImageElement).style.visibility = "visible";
              }}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
              }}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <Upload className="h-6 w-6" />
            </div>
          )}
        </div>
        <div className="flex-1">
          {cloudinaryOn && (
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed px-3 py-2 text-sm font-medium hover:bg-accent">
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" /> Upload image
                </>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={uploading} />
            </label>
          )}
        </div>
      </div>
      <div className="relative">
        <Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Or paste image URL"
          className="pl-9 text-sm"
        />
      </div>
    </div>
  );
}
