const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { HttpError, sanitizeUser } = require('../helpers');

const createTokens = (id) => {
  const {
    ACCESS_SECRET_KEY,
    REFRESH_SECRET_KEY,
    // short by design: the access token is never stored, so logout cannot
    // revoke it directly — this window is how long it outlives a logout
    ACCESS_TOKEN_TTL = '15m',
    REFRESH_TOKEN_TTL = '7d',
  } = process.env;

  const payload = { id };

  return {
    accessToken: jwt.sign(payload, ACCESS_SECRET_KEY, {
      expiresIn: ACCESS_TOKEN_TTL,
    }),
    refreshToken: jwt.sign(payload, REFRESH_SECRET_KEY, {
      expiresIn: REFRESH_TOKEN_TTL,
    }),
  };
};

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw HttpError(409, 'Email in use');
    }

    const hashPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ name, email, password: hashPassword });

    // registration logs the user straight in, so it issues the same token pair
    // as login: the frontend stores it and never asks for the password again
    const tokens = createTokens(newUser._id);
    await User.findByIdAndUpdate(newUser._id, {
      refreshToken: tokens.refreshToken,
    });

    res.status(201).json({
      ...tokens,
      user: sanitizeUser(newUser),
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // the same message for both branches, so the endpoint cannot be used
    // to find out which emails are registered
    const user = await User.findOne({ email });
    if (!user) {
      throw HttpError(401, 'Email or password is wrong');
    }

    const passwordCompare = await bcrypt.compare(password, user.password);
    if (!passwordCompare) {
      throw HttpError(401, 'Email or password is wrong');
    }

    const tokens = createTokens(user._id);
    await User.findByIdAndUpdate(user._id, {
      refreshToken: tokens.refreshToken,
    });

    res.json({
      ...tokens,
      user: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;
    const { REFRESH_SECRET_KEY } = process.env;

    let payload;
    try {
      payload = jwt.verify(token, REFRESH_SECRET_KEY);
    } catch {
      throw HttpError(401, 'Invalid or expired refresh token');
    }

    const user = await User.findById(payload.id);
    // the token must still be the one we issued last: logout revokes it
    if (!user || user.refreshToken !== token) {
      throw HttpError(401, 'Invalid or expired refresh token');
    }

    const tokens = createTokens(user._id);
    await User.findByIdAndUpdate(user._id, {
      refreshToken: tokens.refreshToken,
    });

    res.json(tokens);
  } catch (error) {
    next(error);
  }
};

const getCurrent = async (req, res, next) => {
  try {
    // the frontend reads this response as a bare `User`, without a wrapper
    res.json(sanitizeUser(req.user));
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    // revoking the refresh token ends the session: the access token still in
    // the client's hands expires on its own within ACCESS_TOKEN_TTL
    await User.findByIdAndUpdate(req.user._id, { refreshToken: null });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, refresh, getCurrent, logout };
