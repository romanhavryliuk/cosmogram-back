const { Profile } = require('../models');
const { HttpError } = require('../helpers');
const { buildNatalChart } = require('../services/astrology-service');
const {
  buildPythagoreanSquare,
  buildDestinyMatrix,
} = require('../services/numerology-service');

// the dashboard list renders cards, so it skips the heavy computed blocks
const SUMMARY_FIELDS = 'name birthDate place.label createdAt';

const getAll = async (req, res, next) => {
  try {
    const profiles = await Profile.find(
      { ownerId: req.user._id },
      SUMMARY_FIELDS
    ).sort({ createdAt: -1 });

    res.json(profiles);
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

    // the chart is computed once and stored: the birth data never changes,
    // so there is nothing to recalculate on later reads
    const profile = await Profile.create({
      name,
      birthDate,
      birthTime,
      place,
      ownerId: req.user._id,
      chart: buildNatalChart({ birthDate, birthTime, place }),
      destinyMatrix: buildDestinyMatrix(birthDate),
      pythagoreanSquare: buildPythagoreanSquare(birthDate),
    });

    res.status(201).json(profile);
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

module.exports = { getAll, getById, create, remove };
