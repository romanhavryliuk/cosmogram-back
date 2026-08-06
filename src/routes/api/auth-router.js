const express = require('express');
const { authController } = require('../../controllers');
const validateBody = require('../../middlewares/validateBody');
const { schemas } = require('../../models');

const authRouter = express.Router();

authRouter.post('/register', validateBody(schemas.registerSchema), authController.register);

module.exports = authRouter;
