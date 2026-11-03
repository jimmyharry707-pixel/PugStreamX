import "server-only";
import type { ObjectId } from "mongodb";
import { getBucket } from "@/lib/db/client";
import { AVATAR_MAX_BYTES } from "./constants";

// Avatar files live in the `ps_avatars` GridFS bucket. The browser resizes images before upload,
// but nothing from the browser is trusted: size and real file type are checked here.

type ImageType = "image/jpeg" | "image/png" | "image/webp";

/** Detects the image type from the file's first bytes, ignoring its name and claimed MIME type. */
function detectImageType(b: Uint8Array): ImageType | null {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((v, i) => b[i] === v)) return "image/png";
  const ascii = (from: number, to: number) => String.fromCharCode(...b.subarray(from, to));
  if (b.length >= 12 && ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  return null;
}

export type AvatarUpload = { ok: true; bytes: Buffer; contentType: ImageType } | { ok: false; error: string };

/** Validates the `avatar` form entry. */
export async function readAvatarUpload(entry: FormDataEntryValue | null): Promise<AvatarUpload> {
  if (!(entry instanceof File) || entry.size === 0) return { ok: false, error: "Upload a profile photo." };
  if (entry.size > AVATAR_MAX_BYTES) return { ok: false, error: "That photo is too large. Try a smaller image." };

  const bytes = Buffer.from(await entry.arrayBuffer());
  const contentType = detectImageType(bytes);
  if (!contentType) return { ok: false, error: "Use a JPG, PNG or WebP image." };
  return { ok: true, bytes, contentType };
}

/** Stores an avatar and returns its file id. */
export async function saveAvatar(userId: ObjectId, bytes: Buffer, contentType: ImageType): Promise<ObjectId> {
  const bucket = await getBucket("avatars");
  const upload = bucket.openUploadStream(`avatar-${userId.toHexString()}`, { metadata: { userId, contentType } });
  await new Promise<void>((resolve, reject) => {
    upload.once("finish", () => resolve());
    upload.once("error", reject);
    upload.end(bytes);
  });
  return upload.id;
}

/** Opens a stored avatar for reading, or null if it doesn't exist. */
export async function openAvatar(id: ObjectId) {
  const bucket = await getBucket("avatars");
  const file = await bucket.find({ _id: id }).next();
  if (!file) return null;
  return {
    contentType: (file.metadata?.contentType as string | undefined) ?? "application/octet-stream",
    length: file.length,
    stream: bucket.openDownloadStream(id),
  };
}

export async function deleteAvatar(id: ObjectId) {
  const bucket = await getBucket("avatars");
  await bucket.delete(id).catch(() => {
    // Already gone: nothing to clean up.
  });
}
