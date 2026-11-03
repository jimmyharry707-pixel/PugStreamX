// Browser-only. Center-crops an image to a square and resizes it, so uploads are small and avatars
// look consistent. Orientation from phone photos (EXIF) is applied by createImageBitmap.

export async function resizeAvatar(file: File, size: number): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available.");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, size, size);
  bitmap.close();

  const encode = (type: string, quality: number) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
  // WebP is smallest. Browsers that can't encode it fall back to PNG silently, so check and use JPEG instead.
  let blob = await encode("image/webp", 0.85);
  if (blob?.type !== "image/webp") blob = await encode("image/jpeg", 0.88);
  if (!blob) throw new Error("Could not encode the image.");

  return new File([blob], blob.type === "image/webp" ? "avatar.webp" : "avatar.jpg", { type: blob.type });
}
