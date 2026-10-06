const express = require('express');
const { placesController } = require('../../controllers');
const { placesLimiter } = require('../../middlewares/rateLimiters');

const placesRouter = express.Router();

// open to guests too — the birth data form works without an account. The
// geocoder key is quota-limited, so a per-IP rate limit guards it instead
placesRouter.get('/', placesLimiter, placesController.search);

module.exports = placesRouter;
