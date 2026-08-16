const express = require('express');
const authRouter = require('./auth-router');
const profilesRouter = require('./profiles-router');

const apiRouter = express.Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/profiles', profilesRouter);

module.exports = apiRouter;
