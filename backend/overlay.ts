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
export async function overlayTranslations(imgBuf: Buffer, regions: any[]) {
  const img = await loadImage(imgBuf);
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');

  ctx.drawImage(img, 0, 0);

  for (const r of regions) {
    // Compute an axis-aligned rectangle from the 4 vertices
    const xs = r.box.map((p: any) => p?.x ?? 0);
    const ys = r.box.map((p: any) => p?.y ?? 0);
    const x = Math.max(0, Math.min(...xs));
    const y = Math.max(0, Math.min(...ys));
    const w = Math.max(1, Math.min(img.width,  Math.max(...xs)) - x);
    const h = Math.max(1, Math.min(img.height, Math.max(...ys)) - y);

    // Padding & max drawable area
    const pad  = Math.floor(Math.min(w, h) * 0.08);
    const maxW = Math.max(10, w - 2 * pad);
    const maxH = Math.max(10, h - 2 * pad);

    // 1) Clear original paragraph
    ctx.fillStyle = 'white';
    ctx.fillRect(x, y, w, h);

    // 2) Choose a font size that fits (shrink until wrapped height ≤ maxH)
    let fontSize = Math.max(10, Math.floor(maxH * 0.75));
    let lines: string[] = [];
    let lineHeight = 0;

    for (;;) {
      ctx.font = `${fontSize}px sans-serif`;
      ctx.textBaseline = 'top';
      lineHeight = Math.ceil(fontSize * 1.25);
      lines = wrapLines(ctx, r.translated ?? '', maxW);

      const neededH = lines.length * lineHeight;
      if (neededH <= maxH || fontSize <= 10) break;
      fontSize = Math.floor(fontSize * 0.9); // shrink and try again
    }

    // 3) Draw wrapped text (stop if we run out of height)
    ctx.fillStyle = 'black';
    let cy = y + pad;
    for (const line of lines) {
      if (cy > y + h - lineHeight) break;
      ctx.fillText(line, x + pad, cy);
      cy += lineHeight;
    }
  }

  return canvas.toBuffer('image/png');
}

// Simple word-wrap helper for a given width
function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = (text ?? '').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  const out: string[] = [];
  let line = '';

  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      out.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) out.push(line);
  return out;
}