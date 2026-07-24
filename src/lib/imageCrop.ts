// Client-side equivalent of the server-side crop-to-content-bbox pipeline
// used repeatedly on pose images in this project. Instead of requiring a
// re-upload every time a new image has inconsistent internal padding, this
// analyzes the image's real alpha-channel content on the fly (in the
// browser) and returns a tightly-cropped version — so any pose image,
// regardless of how much empty canvas it was generated with, displays at a
// consistent size.
//
// Fetching as a blob (rather than drawing a cross-origin <img> directly)
// avoids canvas tainting entirely — this is the same approach already used
// by ClassPDF.tsx's image preloading, which confirms Supabase's public
// storage is fetchable this way.

const cache = new Map<string, Promise<string>>();

async function computeCrop(url: string, paddingRatio: number): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) return url;
  const blob = await res.blob();
  const bitmap = await createImageBitmap(blob);

  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return url;
  ctx.drawImage(bitmap, 0, 0);

  let imageData: ImageData;
  try {
    imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  } catch {
    // getImageData can throw if the canvas is unexpectedly tainted —
    // fall back to the original image rather than breaking the render.
    return url;
  }

  const { data, width, height } = imageData;
  const alphaThreshold = 30;
  let minX = width, minY = height, maxX = 0, maxY = 0;
  let found = false;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha > alphaThreshold) {
        found = true;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (!found || maxX <= minX || maxY <= minY) return url;

  const contentW = maxX - minX;
  const contentH = maxY - minY;
  const padX = Math.round(contentW * paddingRatio);
  const padY = Math.round(contentH * paddingRatio);

  const cropX = Math.max(0, minX - padX);
  const cropY = Math.max(0, minY - padY);
  const cropW = Math.min(width, maxX + padX) - cropX;
  const cropH = Math.min(height, maxY + padY) - cropY;

  // No real cropping to do (image was already tight) — skip the extra canvas.
  if (cropX === 0 && cropY === 0 && cropW === width && cropH === height) return url;

  const outCanvas = document.createElement("canvas");
  outCanvas.width = cropW;
  outCanvas.height = cropH;
  const outCtx = outCanvas.getContext("2d");
  if (!outCtx) return url;
  outCtx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

  return outCanvas.toDataURL("image/png");
}

/**
 * Returns a promise for a content-cropped version of the given image URL.
 * Results are cached per URL for the lifetime of the page — an image used
 * across multiple pose cards (or re-rendered) is only ever analyzed once.
 * Falls back to the original URL on any failure (network error, decode
 * error, etc.) so a broken crop attempt never breaks the actual image.
 */
export function getCroppedImageUrl(url: string, paddingRatio = 0.06): Promise<string> {
  if (!url) return Promise.resolve(url);
  const cached = cache.get(url);
  if (cached) return cached;
  const promise = computeCrop(url, paddingRatio).catch(() => url);
  cache.set(url, promise);
  return promise;
}
