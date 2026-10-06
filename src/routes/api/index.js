const express = require('express');
const authRouter = require('./auth-router');
const profilesRouter = require('./profiles-router');
const placesRouter = require('./places-router');
const previewRouter = require('./preview-router');
const shareRouter = require('./share-router');

const apiRouter = express.Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/profiles', profilesRouter);
apiRouter.use('/places', placesRouter);
apiRouter.use('/preview', previewRouter);
apiRouter.use('/share', shareRouter);

module.exports = apiRouter;
