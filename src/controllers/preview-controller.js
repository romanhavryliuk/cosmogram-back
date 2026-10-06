const { buildCosmogram } = require('../services/cosmogram-service');

// a guest's result is computed and handed back, never stored: after signing
// up the frontend sends the same body to POST /api/profiles to keep it
const create = (req, res, next) => {
  try {
    const { name, birthDate, birthTime = null, place } = req.body;

    res.json({
      name,
      birthDate,
      birthTime,
      place,
      ...buildCosmogram({ birthDate, birthTime, place }),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { create };
