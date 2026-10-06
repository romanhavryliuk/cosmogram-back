const axios = require('axios');
const { createTtlCache } = require('../helpers');

const GEOCODING_API_URL = 'https://api.opencagedata.com/geocode/v1/json';

// place names, coordinates and timezones practically never change, so a
// long TTL costs nothing in accuracy and saves the most quota
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// ~5 suggestions of a few hundred bytes each per entry: a few MB at most
const CACHE_MAX_ENTRIES = 5000;

const placesCache = createTtlCache({
  ttlMs: CACHE_TTL_MS,
  maxEntries: CACHE_MAX_ENTRIES,
});

// "Lviv ", "lviv" and "LVIV" are one lookup to the geocoder, so they share
// one cache entry
const normalizeQuery = (query) =>
  query.trim().toLowerCase().replace(/\s+/g, ' ');

// OpenCage annotations carry the IANA timezone the profile schema requires
// alongside each place; results missing it cannot become a valid profile,
// so they are dropped here rather than offered as a pickable suggestion
const fetchPlaces = async (query) => {
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

const searchPlaces = (query) => {
  const key = normalizeQuery(query);

  const cached = placesCache.get(key);
  if (cached) {
    return cached;
  }

  // the promise itself is cached, so identical lookups arriving while the
  // first is still in flight share its single OpenCage request. A failure is
  // dropped from the cache — the next try should reach the geocoder again
  const request = fetchPlaces(key).catch((error) => {
    placesCache.remove(key);
    throw error;
  });
  placesCache.set(key, request);

  return request;
};

module.exports = { searchPlaces };
