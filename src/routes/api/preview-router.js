const express = require('express');
const { previewController } = require('../../controllers');
const validateBody = require('../../middlewares/validateBody');
const { previewLimiter } = require('../../middlewares/rateLimiters');
const { schemas } = require('../../models');

const previewRouter = express.Router();

// open to guests, so it is the one compute route without authenticate —
// the rate limit stands in for it
previewRouter.post(
  '/',
  previewLimiter,
  validateBody(schemas.createProfileSchema),
  previewController.create
);

module.exports = previewRouter;
