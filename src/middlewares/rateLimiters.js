const { rateLimit } = require('express-rate-limit');
const { HttpError } = require('../helpers');

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;

// a guest tries a few birth dates at most; anything far above that is a script
const PREVIEW_LIMIT = 20;

// autocomplete fires on typing, so one city search costs several requests —
// and every one of them spends the shared daily OpenCage quota
const PLACES_LIMIT = 60;

// counters live in memory: enough for a single instance, and they reset on
// restart. Both limits are per client IP
const createRateLimiter = (limit) =>
  rateLimit({
    windowMs: FIFTEEN_MINUTES_MS,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    // through the app's error handler, so the body keeps the usual
    // `{ message }` shape
    handler: (req, res, next) => next(HttpError(429)),
  });

const previewLimiter = createRateLimiter(PREVIEW_LIMIT);
const placesLimiter = createRateLimiter(PLACES_LIMIT);

module.exports = { previewLimiter, placesLimiter };
