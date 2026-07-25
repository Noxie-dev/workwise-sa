import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

export type OptimizedImage = {
  path: string;
  mimeType: 'image/webp' | string;
  size: number;
  width: number | null;
  height: number | null;
  format: string;
  optimized: boolean;
};

/**
 * Normalize user-facing images to WebP, bounding their dimensions so profile
 * uploads cannot become oversized originals on the primary local-disk runtime.
 */
export async function optimizeUploadedImage(
  inputPath: string,
  outputStem: string,
  limits: { maxWidth: number; maxHeight: number },
): Promise<OptimizedImage> {
  const outputPath = `${outputStem}.webp`;

  try {
    const result = await sharp(inputPath)
      .rotate()
      .resize({
        width: limits.maxWidth,
        height: limits.maxHeight,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 82, effort: 4 })
      .toFile(outputPath);

    await fs.unlink(inputPath).catch(() => undefined);
    return {
      path: outputPath,
      mimeType: 'image/webp',
      size: result.size,
      width: result.width ?? null,
      height: result.height ?? null,
      format: 'webp',
      optimized: true,
    };
  } catch (error) {
    // Keep the upload usable if a legacy/malformed image passes the existing
    // signature check. Valid images always take the optimized path above.
    await fs.unlink(outputPath).catch(() => undefined);
    const extension = path.extname(inputPath) || '.bin';
    const fallbackPath = `${outputStem}${extension}`;
    await fs.copyFile(inputPath, fallbackPath);
    await fs.unlink(inputPath).catch(() => undefined);
    const stat = await fs.stat(fallbackPath);
    return {
      path: fallbackPath,
      mimeType: 'application/octet-stream',
      size: stat.size,
      width: null,
      height: null,
      format: extension.slice(1) || 'bin',
      optimized: false,
    };
  }
}
