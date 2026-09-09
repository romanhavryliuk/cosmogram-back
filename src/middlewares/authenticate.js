const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { HttpError } = require('../helpers');

const authenticate = async (req, res, next) => {
  const { authorization = '' } = req.headers;
  const [bearer, token] = authorization.split(' ');

  if (bearer !== 'Bearer' || !token) {
    return next(HttpError(401, 'Missing or invalid Authorization header'));
  }

  try {
    const { ACCESS_SECRET_KEY } = process.env;
    const { id } = jwt.verify(token, ACCESS_SECRET_KEY);

    // the access token is trusted on its signature alone — it is short-lived,
    // and logout revokes the refresh token so the session cannot be extended
    const user = await User.findById(id);
    if (!user) {
      return next(HttpError(401));
    }

    req.user = user;
    next();
  } catch {
    next(HttpError(401));
  }
};

module.exports = authenticate;
