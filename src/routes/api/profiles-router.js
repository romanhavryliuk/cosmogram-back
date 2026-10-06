const express = require('express');
const { profilesController } = require('../../controllers');
const authenticate = require('../../middlewares/authenticate');
const isValidId = require('../../middlewares/isValidId');
const validateBody = require('../../middlewares/validateBody');
const { schemas } = require('../../models');

const profilesRouter = express.Router();

// a profile always belongs to someone: no anonymous access to any of these
profilesRouter.use(authenticate);

profilesRouter.get('/', profilesController.getAll);

profilesRouter.get('/:id', isValidId, profilesController.getById);

profilesRouter.post(
  '/',
  validateBody(schemas.createProfileSchema),
  profilesController.create
);

profilesRouter.patch(
  '/:id',
  isValidId,
  validateBody(schemas.updateProfileSchema),
  profilesController.update
);

profilesRouter.delete('/:id', isValidId, profilesController.remove);

profilesRouter.post('/:id/share', isValidId, profilesController.enableShare);

profilesRouter.delete('/:id/share', isValidId, profilesController.disableShare);

module.exports = profilesRouter;
