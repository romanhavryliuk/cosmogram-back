const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { HttpError } = require('../helpers');

const createTokens = (id) => {
  const {
    ACCESS_SECRET_KEY,
    REFRESH_SECRET_KEY,
    ACCESS_TOKEN_TTL = '1h',
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

    res.status(201).json({
      user: {
        name: newUser.name,
        email: newUser.email,
      },
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
    await User.findByIdAndUpdate(user._id, tokens);

    res.json({
      ...tokens,
      user: {
        name: user.name,
        email: user.email,
      },
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
    await User.findByIdAndUpdate(user._id, tokens);

    res.json(tokens);
  } catch (error) {
    next(error);
  }
};

const getCurrent = async (req, res, next) => {
  try {
    const { name, email } = req.user;

    res.json({ user: { name, email } });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      accessToken: null,
      refreshToken: null,
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, refresh, getCurrent, logout };
