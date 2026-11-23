import { useId, useState } from "react";

const MAX = 2 * 1024 * 1024;
const TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

/** Client-side check before upload (the server re-validates). */
export function validateThumbnail(f: File): string | null {
  if (!TYPES.includes(f.type)) return "Upload a PNG, JPEG, WEBP or GIF image.";
  if (f.size > MAX) return "Image must be 2 MB or smaller.";
  return null;
}

export function ThumbnailUpload({ current, onUpload }: { current: string | null; onUpload: (f: File) => Promise<void> | void }) {
  const id = useId();
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const shown = preview ?? current;

  async function onFile(f: File | undefined) {
    if (!f) return;
    const problem = validateThumbnail(f);
    setError(problem);
    if (problem) return;
    setPreview(URL.createObjectURL(f));
    setBusy(true);
    try {
      await onUpload(f);
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-input border border-border bg-background">
        {shown ? <img src={shown} alt="Product thumbnail" className="size-full object-cover" /> : <span className="text-xs text-muted">No image</span>}
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={id} className="text-sm font-medium">Thumbnail image</label>
        <input id={id} type="file" accept={TYPES.join(",")} onChange={(e) => onFile(e.target.files?.[0])} disabled={busy} className="text-sm" />
        <p className="text-xs text-muted">PNG, JPEG, WEBP or GIF · max 2 MB{busy ? " · uploading…" : ""}</p>
        {error && <p role="alert" className="text-xs text-danger">{error}</p>}
      </div>
    </div>
  );
}
