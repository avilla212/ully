/**
 * middlewar/limiters.ts
 * PURPOSE:
 * - Defines rate limiters for Express server to prevent abuse.
 * - Exports limiters for use in app.ts.
 * 
 * Exports:
 * - translateLimiter: Limits overall requests per IP.
 * - burstLimiter: Limits rapid requests in a short time frame.
 * - upload: Limits size of uploaded files.
 */

import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import multer from 'multer';

// ----------------------------------------------------------------------------
// Rate Limiter: Overall request limiting (per IP)
// ----------------------------------------------------------------------------
export const translateLimiter = rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: Number(process.env.RATE_LIMIT_MAX) || 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: 'Too many requests from this IP, please try again later.',
})

// ----------------------------------------------------------------------------
// Block rapid fire spam
// ----------------------------------------------------------------------------
export const burstLimiter = rateLimit({
    windowMs: 10 * 1000, // 10 seconds
    max: Number(process.env.BURST_LIMIT_MAX) || 20, // limit each IP to 20 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: 'Too many requests from this IP in a short time, please try again later.',
})

// ----------------------------------------------------------------------------
// Upload Size Limiter: Limits size of uploaded files
// ----------------------------------------------------------------------------
const maxUploadMB = Number(process.env.MAX_UPLOAD_MB) || 5; // Default to 5 MB
export const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxUploadMB * 1024 * 1024 }, // Convert MB to bytes
})