const { isValidObjectId } = require('mongoose');
const { HttpError } = require('../helpers');

const isValidId = (req, res, next) => {
  const { id } = req.params;

  // 404 rather than 400: to the client a malformed id is just a missing one
  if (!isValidObjectId(id)) {
    return next(HttpError(404));
  }

  next();
};

module.exports = isValidId;
