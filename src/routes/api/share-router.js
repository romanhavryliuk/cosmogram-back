const express = require('express');
const { shareController } = require('../../controllers');

const shareRouter = express.Router();

// public on purpose: whoever has the link can read the profile, which is
// what the owner opted into by sharing it
shareRouter.get('/:shareId', shareController.getByShareId);

module.exports = shareRouter;
