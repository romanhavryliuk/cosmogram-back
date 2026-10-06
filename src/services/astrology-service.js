const { ZODIAC_SIGNS } = require('../models/profile');
const { localToUtcDate, calcChart } = require('./ephemeris');

const FULL_CIRCLE = 360;
const SIGN_ARC = 30;

// classic Ptolemaic aspects with the orbs commonly used for natal charts
const ASPECTS = [
  { type: 'conjunction', angle: 0, orb: 8 },
  { type: 'sextile', angle: 60, orb: 4 },
  { type: 'square', angle: 90, orb: 6 },
  { type: 'trine', angle: 120, orb: 6 },
  { type: 'opposition', angle: 180, orb: 8 },
];

const round = (value) => Number(value.toFixed(2));

const normalize = (angle) => ((angle % FULL_CIRCLE) + FULL_CIRCLE) % FULL_CIRCLE;

const signOf = (longitude) =>
  ZODIAC_SIGNS[Math.floor(normalize(longitude) / SIGN_ARC)];

const degreeInSign = (longitude) => round(normalize(longitude) % SIGN_ARC);

/**
 * Which of the 12 houses a longitude falls in. Placidus houses are not
 * equal 30° slices, so this walks the real cusps rather than dividing the
 * circle evenly from the ascendant.
 */
const houseOfLongitude = (longitude, cusps) => {
  const target = normalize(longitude);

  for (let house = 1; house <= 12; house += 1) {
    const start = normalize(cusps[house - 1]);
    const span = normalize(cusps[house % 12] - start);
    if (normalize(target - start) < span) {
      return house;
    }
  }

  return 12;
};

/** Shortest angle between two ecliptic longitudes, 0–180 */
const separation = (a, b) => {
  const diff = normalize(a - b);
  return diff > 180 ? FULL_CIRCLE - diff : diff;
};

const findAspects = (planets) => {
  const aspects = [];

  for (let i = 0; i < planets.length; i += 1) {
    for (let j = i + 1; j < planets.length; j += 1) {
      const angle = separation(planets[i].longitude, planets[j].longitude);
      const match = ASPECTS.find(
        (aspect) => Math.abs(angle - aspect.angle) <= aspect.orb
      );

      if (match) {
        aspects.push({
          from: planets[i].planet,
          to: planets[j].planet,
          type: match.type,
          orb: round(Math.abs(angle - match.angle)),
        });
      }
    }
  }

  return aspects;
};

// with no birth time the chart is cast for local noon, so the planets are off
// by at most half a day of motion (the Moon by ~7°, the rest by far less).
// Houses, the ascendant and the midheaven turn over completely within a day,
// so for such a chart they are left out rather than guessed
const UNKNOWN_BIRTH_TIME = '12:00';

const buildNatalChart = ({ birthDate, birthTime, place }) => {
  const isTimeKnown = Boolean(birthTime);
  const date = localToUtcDate(
    birthDate,
    birthTime || UNKNOWN_BIRTH_TIME,
    place.timezone
  );
  const raw = calcChart({
    date,
    latitude: place.latitude,
    longitude: place.longitude,
  });

  const planets = raw.planets.map(({ planet, longitude, retrograde }) => ({
    planet,
    sign: signOf(longitude),
    degree: degreeInSign(longitude),
    longitude: round(longitude),
    ...(isTimeKnown && { house: houseOfLongitude(longitude, raw.cusps) }),
    retrograde,
  }));

  const aspects = findAspects(planets);

  if (!isTimeKnown) {
    return { planets, houses: [], aspects };
  }

  const houses = raw.cusps.map((longitude, index) => ({
    house: index + 1,
    sign: signOf(longitude),
    longitude: round(longitude),
  }));

  return {
    planets,
    houses,
    aspects,
    ascendant: round(raw.ascendant),
    midheaven: round(raw.midheaven),
  };
};

module.exports = { buildNatalChart };
