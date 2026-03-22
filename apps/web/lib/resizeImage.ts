/**
 * Resizes an image file client-side to a maximum dimension while preserving
 * aspect ratio, then re-encodes as JPEG at the given quality.
 * Falls back to the original file if the browser lacks Canvas support or
 * the image is already within the size limit.
 *
 * @param file         Original image File from an <input type="file">
 * @param maxDimension Max pixels on the longest edge (default 1920)
 * @param quality      JPEG quality 0–1 (default 0.82)
 */
export async function resizeImage(
  file: File,
  maxDimension = 1920,
  quality = 0.82
): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const { naturalWidth: w, naturalHeight: h } = img;

      // Already within bounds — return original untouched
      if (w <= maxDimension && h <= maxDimension) {
        resolve(file);
        return;
      }

      const scale = maxDimension / Math.max(w, h);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(w * scale);
      canvas.height = Math.round(h * scale);

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file); // Canvas not available — skip resize
        return;
      }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          // Keep original filename but use .jpg extension
          const newName = file.name.replace(/\.[^.]+$/, ".jpg");
          resolve(new File([blob], newName, { type: "image/jpeg" }));
        },
        "image/jpeg",
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file); // Fallback to original on error
    };

    img.src = objectUrl;
  });
}
