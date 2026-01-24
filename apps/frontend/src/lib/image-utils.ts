'use client';

export type ImageQualityWarning = 'OK' | 'LOW_RESOLUTION';

export interface ImageInfo {
  width: number;
  height: number;
  megapixels: number;
  warning: ImageQualityWarning;
}

/**
 * Reads image dimensions without uploading.
 */
export async function readImageInfo(file: File): Promise<ImageInfo> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = 'async';
    const loaded = new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('No se pudo leer la imagen'));
    });
    img.src = url;
    await loaded;

    const width = img.naturalWidth || 0;
    const height = img.naturalHeight || 0;
    const megapixels = Math.round(((width * height) / 1_000_000) * 10) / 10;

    // Heurística: para cards y zoom básico, bajo 900x600 suele verse pixelado.
    const warning: ImageQualityWarning =
      width < 900 || height < 600 ? 'LOW_RESOLUTION' : 'OK';

    return { width, height, megapixels, warning };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export interface OptimizeImageOptions {
  maxDimension?: number; // px
  quality?: number; // 0..1
  preferWebp?: boolean;
}

/**
 * Optimiza imágenes para equilibrar calidad/rendimiento:
 * - reescala manteniendo aspecto (máx maxDimension)
 * - convierte a WebP (si es posible) o JPEG
 */
export async function optimizeImageFile(
  file: File,
  opts: OptimizeImageOptions = {}
): Promise<File> {
  const maxDimension = opts.maxDimension ?? 1600;
  const quality = opts.quality ?? 0.82;
  const preferWebp = opts.preferWebp ?? true;

  // Si no es imagen, devolver tal cual
  if (!file.type.startsWith('image/')) return file;

  // Si ya es razonable (pequeña) y es webp/jpg/png, no tocar.
  // Igual evitamos archivos enormes para móviles.
  if (file.size <= 900_000 && (file.type === 'image/webp' || file.type === 'image/jpeg')) {
    return file;
  }

  const arrayBuffer = await file.arrayBuffer();
  const blob = new Blob([arrayBuffer], { type: file.type });

  // createImageBitmap con orientación (si el browser lo soporta)
  let bitmap: ImageBitmap;
  try {
   
    bitmap = await createImageBitmap(blob, { imageOrientation: 'from-image' });
  } catch {
    bitmap = await createImageBitmap(blob);
  }

  const srcW = bitmap.width;
  const srcH = bitmap.height;

  const scale = Math.min(1, maxDimension / Math.max(srcW, srcH));
  const dstW = Math.max(1, Math.round(srcW * scale));
  const dstH = Math.max(1, Math.round(srcH * scale));

  const canvas = document.createElement('canvas');
  canvas.width = dstW;
  canvas.height = dstH;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    return file;
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, dstW, dstH);
  bitmap.close();

  const supportsWebp = (() => {
    try {
      return canvas.toDataURL('image/webp').startsWith('data:image/webp');
    } catch {
      return false;
    }
  })();

  const outType =
    preferWebp && supportsWebp ? 'image/webp' : 'image/jpeg';

  const outBlob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('No se pudo procesar la imagen'))),
      outType,
      quality
    );
  });

  const baseName = file.name.replace(/\.[^.]+$/, '');
  const ext = outType === 'image/webp' ? 'webp' : 'jpg';
  const outName = `${baseName}.${ext}`;

  return new File([outBlob], outName, { type: outType, lastModified: Date.now() });
}
