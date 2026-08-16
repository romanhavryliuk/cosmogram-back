const express = require('express');
const { placesController } = require('../../controllers');
const authenticate = require('../../middlewares/authenticate');

const placesRouter = express.Router();

// gated behind auth: the geocoder key is quota-limited, and only the
// (already logged-in) create-profile form calls this
placesRouter.get('/', authenticate, placesController.search);

module.exports = placesRouter;
