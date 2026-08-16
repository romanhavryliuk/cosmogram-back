const { ZODIAC_SIGNS, PLANETS } = require('../models/profile');

/**
 * STEP 3 PLACEHOLDER — the planet longitudes are not astronomically true yet.
 *
 * Everything built on top of them is real and stays: signs, degrees, houses,
 * aspects and the ascendant are derived the way they will be once an ephemeris
 * is plugged in. The longitudes themselves come from a deterministic hash of
 * the birth data, so the same input always renders the same chart and the UI
 * can be finished against stable output.
 *
 * Step 6 swaps the `seededAngle()` call for a real ephemeris lookup and leaves
 * the rest of this file untouched.
 */

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

/** Equal-house system: the 1st house starts exactly at the ascendant */
const houseOf = (longitude, ascendant) =>
  Math.floor(normalize(longitude - ascendant) / SIGN_ARC) + 1;

/** Shortest angle between two ecliptic longitudes, 0–180 */
const separation = (a, b) => {
  const diff = normalize(a - b);
  return diff > 180 ? FULL_CIRCLE - diff : diff;
};

/** Deterministic 0–359.99 angle for a seed string */
const seededAngle = (seed) => {
  let value = 7;
  for (let i = 0; i < seed.length; i += 1) {
    value = (value * 31 + seed.charCodeAt(i)) % 36000;
  }
  return value / 100;
};

const ascendantFor = (birthTime, place) => {
  const [hours, minutes] = birthTime.split(':').map(Number);
  // the whole day maps onto the whole circle, shifted by the birth meridian
  return round(normalize((hours * 60 + minutes) / 4 + place.longitude));
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

const buildNatalChart = ({ birthDate, birthTime, place }) => {
  const seed = `${birthDate}T${birthTime}@${place.latitude},${place.longitude}`;
  const ascendant = ascendantFor(birthTime, place);

  const planets = PLANETS.map((planet) => {
    const longitude = seededAngle(`${seed}:${planet}`);

    return {
      planet,
      sign: signOf(longitude),
      degree: degreeInSign(longitude),
      longitude: round(longitude),
      house: houseOf(longitude, ascendant),
      // the luminaries are never retrograde
      retrograde: planet !== 'sun' && planet !== 'moon' && longitude % 5 < 1,
    };
  });

  const houses = Array.from({ length: 12 }, (_, index) => {
    const longitude = normalize(ascendant + index * SIGN_ARC);

    return {
      house: index + 1,
      sign: signOf(longitude),
      longitude: round(longitude),
    };
  });

  return {
    planets,
    houses,
    aspects: findAspects(planets),
    ascendant,
    // the midheaven sits a quadrant ahead of the ascendant
    midheaven: round(normalize(ascendant + 270)),
  };
};

module.exports = { buildNatalChart };
