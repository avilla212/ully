/**
 * overlay.ts
 * PURPOSE:
 * Draw Spanish translations back onto the image where English text was detected.
 * For each detected block:
 *   - cover the original text area with a white rectangle
 *   - draw the translated text in black (wrapped to fit)
 */

import { createCanvas, loadImage } from 'canvas';
import type { CanvasRenderingContext2D } from 'canvas';

// Simple shapes for clarity
type Point = { x: number; y: number };
type Region = { text: string; translated: string; box: Point[] };

/**
 * overlayTranslations
 * @param imgBuf   Original image buffer (uploaded)
 * @param regions  Array of { text, translated, box[4] } for each text block
 * @returns        PNG image buffer with Spanish text drawn in place
 */
export async function overlayTranslations(imgBuf: Buffer, regions: Region[]) {
  // Load original into a Canvas image
  const img = await loadImage(imgBuf);

  // Make a canvas the same size as the original
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');

  // Draw original image as the background
  ctx.drawImage(img, 0, 0);

  // Process each text block
  for (const r of regions) {
    // Compute a simple axis-aligned rectangle from Vision's 4 vertices
    const xs = r.box.map(p => p.x ?? 0);
    const ys = r.box.map(p => p.y ?? 0);
    const x = Math.max(0, Math.min(...xs)); // left
    const y = Math.max(0, Math.min(...ys)); // top
    const w = Math.min(img.width, Math.max(...xs)) - x;  // width
    const h = Math.min(img.height, Math.max(...ys)) - y; // height

    // Add a bit of padding to keep text away from edges
    const pad = Math.floor(Math.min(w, h) * 0.06);

    // 1) Cover original text
    ctx.fillStyle = 'white';
    ctx.fillRect(x, y, w, h);

    // 2) Choose font size relative to the block height (MVP heuristic)
    const fontSize = Math.max(12, Math.floor((h - 2 * pad) * 0.6));
    ctx.font = `${fontSize}px sans-serif`;
    ctx.fillStyle = 'black';
    ctx.textBaseline = 'top';

    // 3) Draw wrapped Spanish text inside the box with padding
    wrapText(ctx, r.translated, x + pad, y + pad, Math.max(10, w - 2 * pad), Math.floor(fontSize * 1.2));
  }

  // Return final image as PNG
  return canvas.toBuffer('image/png');
}

/**
 * wrapText
 * Very small word-wrapping helper for drawing within a max width.
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(/\s+/);
  let line = '';
  let cy = y;

  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, cy);
      cy += lineHeight;
      line = word;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, cy);
}
