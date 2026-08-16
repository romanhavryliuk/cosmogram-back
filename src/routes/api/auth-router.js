const express = require('express');
const { authController } = require('../../controllers');
const validateBody = require('../../middlewares/validateBody');
const authenticate = require('../../middlewares/authenticate');
const { schemas } = require('../../models');

const authRouter = express.Router();

authRouter.post('/register', validateBody(schemas.registerSchema), authController.register);

authRouter.post(
  '/login',
  validateBody(schemas.loginSchema),
  authController.login
);

authRouter.post(
  '/refresh',
  validateBody(schemas.refreshSchema),
  authController.refresh
);

authRouter.get('/current', authenticate, authController.getCurrent);

authRouter.post('/logout', authenticate, authController.logout);

module.exports = authRouter;
