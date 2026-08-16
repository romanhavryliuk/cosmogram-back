const { HttpError } = require('../helpers');
const { searchPlaces } = require('../services/geo-service');

const search = async (req, res, next) => {
  try {
    const { query = '' } = req.query;

    if (query.trim().length < 2) {
      throw HttpError(400, 'query must be at least 2 characters');
    }

    const places = await searchPlaces(query.trim());

    res.json(places);
  } catch (error) {
    next(error);
  }
};

module.exports = { search };
