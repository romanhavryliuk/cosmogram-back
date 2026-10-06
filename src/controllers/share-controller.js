const { Profile } = require('../models');
const { HttpError } = require('../helpers');

// a shared link shows the whole reading, but not who owns it, nor the exact
// coordinates of the birth place — the place label is enough to read it by
const PRIVATE_FIELDS =
  '-ownerId -shareId -createdAt -updatedAt -place.latitude -place.longitude -place.timezone';

const getByShareId = async (req, res, next) => {
  try {
    const { shareId } = req.params;

    const profile = await Profile.findOne({ shareId }, PRIVATE_FIELDS);
    if (!profile) {
      throw HttpError(404);
    }

    // the profile id only matters to the owner's own routes
    const publicProfile = profile.toJSON();
    delete publicProfile.id;

    res.json(publicProfile);
  } catch (error) {
    next(error);
  }
};

module.exports = { getByShareId };
