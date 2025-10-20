/**
 * app.ts
 * PURPOSE:
 * Express server that:
 *  1) accepts an uploaded image,
 *  2) OCRs English text using Google Vision,
 *  3) translates to Spanish using Google Translation,
 *  4) draws Spanish text back in place,
 *  5) returns the edited image.
 *
 * Notes:
 * - CommonJS build (no import.meta / .js extensions needed).
 * - Uses your env names: GOOGLE_CLOUD_PROJECT_ID, GOOGLE_CLOUD_KEY.
 */

import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import path from 'path';

// Your helpers (must exist in google.ts / overlay.ts)
import { ocrBuffer, translateBatch } from './google';
import { overlayTranslations } from './overlay';

// ----------------------------------------------------------------------------
// Read your custom env vars (useful for logging/sanity checks)
// ----------------------------------------------------------------------------
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID; // e.g., "my-vision-mvp"
const KEY_FILE = process.env.GOOGLE_APPLICATION_CREDENTIALS;          // absolute path to key.json
const PORT = Number(process.env.PORT ?? 3000);

// ----------------------------------------------------------------------------
// Express + Multer setup
// ----------------------------------------------------------------------------
const app = express();

// Keep uploads in memory as Buffer → perfect to pass to Vision/Translate
const upload = multer({ storage: multer.memoryStorage() });

// Serve the tiny frontend (public/index.html)
app.use(express.static(path.join(__dirname, 'public')));

// ----------------------------------------------------------------------------
// Main route: /translate-image
// ----------------------------------------------------------------------------
app.post('/translate-image', upload.single('image'), async (req, res) => {
  try {
    // 0) Validate upload
    const buf = req.file?.buffer;
    if (!buf) return res.status(400).send('No image uploaded');

    // 1) OCR: get detected text + coordinates (pages/blocks/paragraphs/words)
    const anno = await ocrBuffer(buf);

    // 2) Extract "blocks" of text and their bounding boxes
const pages = anno?.pages ?? [];
const blocks = pages.flatMap(p => p.blocks ?? []);
const regions = blocks.map(b => {
  const text = (b.paragraphs ?? [])
    .map(pg => (pg.words ?? [])
      .map(w => (w.symbols ?? []).map(s => s.text ?? '').join(''))
      .join(' ')
    ).join(' ').trim();

  const box = (b.boundingBox?.vertices ?? []).map(v => ({
    x: v?.x ?? 0,
    y: v?.y ?? 0,
  }));

  return { text, box };
}).filter(r => r.text && r.box.length >= 4);

    // 3) Translate (English → Spanish). You can change 'es' to any target code.
    const translated: string[] = await translateBatch(regions.map(r => r.text), 'es');

    // 4) Build draw payload with Spanish text aligned to each block
    const toDraw = regions.map((r, i) => ({   // i inferred as number
      ...r,
      translated: translated[i] ?? '',
  }));

    // 5) Paint Spanish back onto the image and return a PNG buffer
    const out = await overlayTranslations(buf, toDraw);

    res.setHeader('Content-Type', 'image/png');
    res.send(out);
  } catch (err: any) {
    console.error(err);
    res.status(500).send(err?.message ?? 'Internal error');
  }
});

// ----------------------------------------------------------------------------
// Start server
// ----------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(` Server: http://localhost:${PORT}`);
  console.log(` Project: ${PROJECT_ID ?? '(unset)'}  Key: ${KEY_FILE ?? '(unset)'}`);
});
