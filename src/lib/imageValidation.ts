/**
 * Product images are normalized to WebP and downscaled to fit within a maximum
 * dimension (longest edge), preserving aspect ratio — never upscaled, never
 * cropped. 1200px on the longest edge is a safe default for most WooCommerce
 * themes (they downscale from there); WebP at 0.9 keeps good quality at a small
 * file size. Tune these per install (a planned config option — see PLAN.md).
 */
export const MAX_IMAGE_DIMENSION = 1200
export const WEBP_QUALITY = 0.9
// Only if the encoded WebP still exceeds this do we step quality down.
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024 // 2MB
// Output size when the per-product "square images" option is on (see types.ts).
export const SQUARE_IMAGE_SIZE = 800

function loadImage(file: File): Promise<{ image: HTMLImageElement; width: number; height: number; objectUrl: string }> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => resolve({ image, width: image.naturalWidth, height: image.naturalHeight, objectUrl })
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('No se pudo leer la imagen.'))
    }
    image.src = objectUrl
  })
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('No se pudo comprimir la imagen.'))),
      'image/webp',
      quality,
    )
  })
}

/**
 * Re-encodes an image as WebP. Two modes:
 *  - default: downscales to fit within MAX_IMAGE_DIMENSION, keeping the aspect
 *    ratio; small images are left as-is (never upscaled).
 *  - `square: true`: center-crops (cover-style, no distortion) to an exact
 *    SQUARE_IMAGE_SIZE × SQUARE_IMAGE_SIZE square — smaller images are scaled up
 *    to fill it, so every image on the product ends at the same resolution.
 * Returns a new `.webp` File ready to upload.
 */
export async function processImage(file: File, options: { square?: boolean } = {}): Promise<File> {
  const { image, width, height, objectUrl } = await loadImage(file)

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    URL.revokeObjectURL(objectUrl)
    throw new Error('No se pudo procesar la imagen.')
  }

  if (options.square) {
    canvas.width = SQUARE_IMAGE_SIZE
    canvas.height = SQUARE_IMAGE_SIZE
    const scale = Math.max(SQUARE_IMAGE_SIZE / width, SQUARE_IMAGE_SIZE / height)
    const scaledW = width * scale
    const scaledH = height * scale
    ctx.drawImage(image, (SQUARE_IMAGE_SIZE - scaledW) / 2, (SQUARE_IMAGE_SIZE - scaledH) / 2, scaledW, scaledH)
  } else {
    const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(width, height))
    const targetW = Math.max(1, Math.round(width * scale))
    const targetH = Math.max(1, Math.round(height * scale))
    canvas.width = targetW
    canvas.height = targetH
    ctx.drawImage(image, 0, 0, targetW, targetH)
  }
  URL.revokeObjectURL(objectUrl)

  let quality = WEBP_QUALITY
  let blob = await canvasToBlob(canvas, quality)
  while (blob.size > MAX_IMAGE_BYTES && quality > 0.6) {
    quality -= 0.1
    blob = await canvasToBlob(canvas, quality)
  }

  const newName = file.name.replace(/\.\w+$/, '') + '.webp'
  return new File([blob], newName, { type: 'image/webp' })
}
