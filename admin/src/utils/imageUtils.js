/**
 * Створює обрізане зображення з canvas
 */
export const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.src = url;
  });

/**
 * Повертає обрізане зображення як base64 або blob
 */
export async function getCroppedImg(imageSrc, pixelCrop, outputFormat = 'image/jpeg', quality = 0.9) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  // Встановлюємо розмір canvas
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // Малюємо обрізане зображення
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  // Конвертуємо в blob
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          console.error('Canvas is empty');
          return;
        }
        resolve(blob);
      },
      outputFormat,
      quality
    );
  });
}

/**
 * Конвертує blob в File
 */
export function blobToFile(blob, fileName) {
  return new File([blob], fileName, { type: blob.type });
}

