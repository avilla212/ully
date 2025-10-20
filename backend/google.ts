/**
 * google.ts — ADC edition (no deprecations, no metadata warning)
 * Uses env: GOOGLE_CLOUD_PROJECT_ID, GOOGLE_CLOUD_PROJECT, GOOGLE_APPLICATION_CREDENTIALS
 */

import vision, { protos } from '@google-cloud/vision';
import { TranslationServiceClient } from '@google-cloud/translate';

const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || '';
if (!projectId) {
  throw new Error('Set GOOGLE_CLOUD_PROJECT_ID or GOOGLE_CLOUD_PROJECT in .env');
}

// Translate v3 requires parent like: projects/{id}/locations/global
export const parent = `projects/${projectId}/locations/global`;

// Construct clients **without** options — they use ADC from env
export const vision_client = new vision.ImageAnnotatorClient();
export const translation_client = new TranslationServiceClient();

type ITextAnnotation = protos.google.cloud.vision.v1.ITextAnnotation;

export async function ocrBuffer(buf: Buffer): Promise<ITextAnnotation | undefined> {
  const [res] = await vision_client.documentTextDetection({ image: { content: buf } });
  return res.fullTextAnnotation ?? undefined;
}

export async function translateBatch(texts: string[], target_language = 'es'): Promise<string[]> {
  if (!texts.length) return [];
  const [result] = await translation_client.translateText({
    parent,
    contents: texts,
    sourceLanguageCode: 'en',
    targetLanguageCode: target_language,
    mimeType: 'text/plain',
  });
  return (result.translations ?? []).map(t => t.translatedText || '');
}
