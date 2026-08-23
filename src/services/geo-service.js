const axios = require('axios');

const GEOCODING_API_URL = 'https://api.opencagedata.com/geocode/v1/json';

// OpenCage annotations carry the IANA timezone the profile schema requires
// alongside each place; results missing it cannot become a valid profile,
// so they are dropped here rather than offered as a pickable suggestion
const searchPlaces = async (query) => {
  const { GEOCODING_API_KEY } = process.env;

  const { data } = await axios.get(GEOCODING_API_URL, {
    params: {
      q: query,
      key: GEOCODING_API_KEY,
      limit: 5,
    },
  });

  return data.results
    .filter((result) => result.annotations?.timezone?.name)
    .map((result) => ({
      // coordinates are unique within a single OpenCage response, which is
      // all a React list key here needs — these suggestions are never stored
      id: `${result.geometry.lat},${result.geometry.lng}`,
      label: result.formatted,
      latitude: result.geometry.lat,
      longitude: result.geometry.lng,
      timezone: result.annotations.timezone.name,
    }));
};

module.exports = { searchPlaces };
