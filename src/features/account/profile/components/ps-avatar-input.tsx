"use client";

import { useEffect, useRef, useState } from "react";
import type { PsFieldControlProps } from "@/components/ui/ps-field";
import { cn } from "@/lib/utils/cn";
import { AVATAR_SIZE_PX, AVATAR_SOURCE_MAX_BYTES } from "../constants";
import { resizeAvatar } from "../resize-avatar";

export type AvatarValue = { file: File; previewUrl: string } | null;

/**
 * Round avatar preview with an "Upload photo" button. The chosen image is cropped to a square and
 * resized in the browser; the parent keeps the result in state (so it survives form errors) and
 * attaches it to the form data on submit.
 */
export function PsAvatarInput({
  value,
  currentUrl,
  onChange,
  onError,
  ...control
}: PsFieldControlProps & {
  value: AvatarValue;
  /** Already-saved avatar to show until a new image is picked (update mode). */
  currentUrl?: string;
  onChange: (value: AvatarValue) => void;
  /** Problems found in the browser (wrong type, too big, unreadable). Null clears it. */
  onError: (message: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  // Free the preview's memory when it's replaced or the form goes away.
  const previewUrl = value?.previewUrl;
  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return onError("Choose an image file (JPG, PNG or WebP).");
    if (file.size > AVATAR_SOURCE_MAX_BYTES) return onError("That image is too large. Choose one under 15 MB.");

    setBusy(true);
    try {
      const resized = await resizeAvatar(file, AVATAR_SIZE_PX);
      onError(null);
      onChange({ file: resized, previewUrl: URL.createObjectURL(resized) });
    } catch {
      onError("That image couldn't be read. Try a JPG or PNG.");
    } finally {
      setBusy(false);
      // Allow choosing the same file again after an error.
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div
        className={cn(
          "grid size-20 shrink-0 place-items-center overflow-hidden rounded-full border bg-gray-800",
          control["aria-invalid"] ? "border-danger-500" : "border-white/10",
        )}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element -- local blob preview, not an optimizable asset
          <img src={value.previewUrl} alt="Your new profile photo" className="size-full object-cover" />
        ) : currentUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- private, auth-protected image; the optimizer can't fetch it
          <img src={currentUrl} alt="Your current profile photo" className="size-full object-cover" />
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="size-9 text-gray-500" aria-hidden>
            <circle cx="12" cy="8.5" r="3.5" />
            <path d="M5 19.5a7 7 0 0 1 14 0" strokeLinecap="round" />
          </svg>
        )}
      </div>
      <div className="space-y-1">
        <label
          className={cn(
            "inline-flex cursor-pointer items-center justify-center rounded-full bg-gray-800 px-4 py-2 text-sm text-gray-100 transition hover:bg-gray-700 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand-400",
            busy && "pointer-events-none opacity-50",
          )}
        >
          {busy ? "Processing…" : value || currentUrl ? "Change photo" : "Upload photo"}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/*"
            className="sr-only"
            disabled={busy}
            onChange={(e) => handleFile(e.target.files?.[0])}
            {...control}
          />
        </label>
        <p className="text-xs text-gray-500">JPG, PNG or WebP. Cropped to a square.</p>
      </div>
    </div>
  );
}
