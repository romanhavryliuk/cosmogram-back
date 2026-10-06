const { randomBytes } = require('node:crypto');
const { Profile } = require('../models');
const { HttpError } = require('../helpers');
const { buildCosmogram } = require('../services/cosmogram-service');

// changing any of these invalidates every computed block
const BIRTH_DATA_FIELDS = ['birthDate', 'birthTime', 'place'];

// 96 random bits: a share link cannot be guessed, unlike an ObjectId,
// which is mostly a timestamp and a counter
const SHARE_ID_BYTES = 12;

const createShareId = () => randomBytes(SHARE_ID_BYTES).toString('base64url');

// the dashboard list renders cards, so it skips the heavy computed blocks
// and pulls only what a card preview needs: the Sun and the central arcana
const SUMMARY_PROJECTION = {
  name: 1,
  birthDate: 1,
  'place.label': 1,
  createdAt: 1,
  // $elemMatch projection works only on top-level arrays — on chart.planets
  // MongoDB rejects the whole query, so take two small fields per planet
  // and pick the Sun in code
  'chart.planets.planet': 1,
  'chart.planets.sign': 1,
  'destinyMatrix.center': 1,
};

// flattened so the card does not have to dig through the chart shape
const toSummary = (profile) => {
  const { chart, destinyMatrix, ...rest } = profile.toJSON();
  const sun = chart?.planets?.find(({ planet }) => planet === 'sun');

  return {
    ...rest,
    sunSign: sun?.sign ?? null,
    centralArcana: destinyMatrix?.center ?? null,
  };
};

const getAll = async (req, res, next) => {
  try {
    const profiles = await Profile.find(
      { ownerId: req.user._id },
      SUMMARY_PROJECTION
    ).sort({ createdAt: -1 });

    res.json(profiles.map(toSummary));
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // the owner is part of the query, so someone else's id reads as missing
    // instead of telling the caller that it exists
    const profile = await Profile.findOne({ _id: id, ownerId: req.user._id });
    if (!profile) {
      throw HttpError(404);
    }

    res.json(profile);
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const { name, birthDate, birthTime, place } = req.body;

    // the blocks are computed once and stored: they only change together
    // with the birth data, and `update` recomputes them when it does
    const profile = await Profile.create({
      name,
      birthDate,
      birthTime,
      place,
      ownerId: req.user._id,
      ...buildCosmogram({ birthDate, birthTime, place }),
    });

    res.status(201).json(profile);
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;

    const profile = await Profile.findOne({ _id: id, ownerId: req.user._id });
    if (!profile) {
      throw HttpError(404);
    }

    profile.set(req.body);

    // a rename keeps the stored blocks; new birth data makes them all stale
    const isBirthDataChanged = BIRTH_DATA_FIELDS.some((field) =>
      profile.isModified(field)
    );
    if (isBirthDataChanged) {
      profile.set(buildCosmogram(profile));
    }

    await profile.save();

    res.json(profile);
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    const profile = await Profile.findOneAndDelete({
      _id: id,
      ownerId: req.user._id,
    });
    if (!profile) {
      throw HttpError(404);
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

const enableShare = async (req, res, next) => {
  try {
    const owned = { _id: req.params.id, ownerId: req.user._id };

    // only fills an empty shareId, so sharing twice (or two clicks racing)
    // keeps the first link instead of breaking it. Sharing is not an edit,
    // hence no `updatedAt` bump
    await Profile.updateOne(
      { ...owned, shareId: null },
      { shareId: createShareId() },
      { timestamps: false }
    );

    const profile = await Profile.findOne(owned, 'shareId');
    if (!profile) {
      throw HttpError(404);
    }

    res.json({ shareId: profile.shareId });
  } catch (error) {
    next(error);
  }
};

const disableShare = async (req, res, next) => {
  try {
    // the token is dropped, not kept aside: sharing again issues a new one,
    // so a link that was revoked stays dead
    const profile = await Profile.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.user._id },
      { shareId: null },
      { timestamps: false }
    );
    if (!profile) {
      throw HttpError(404);
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  enableShare,
  disableShare,
};
