const { buildNatalChart } = require('./astrology-service');
const {
  buildPythagoreanSquare,
  buildDestinyMatrix,
} = require('./numerology-service');

/**
 * Every computed block of a cosmogram, from the birth data alone. Saving a
 * profile, editing its birth data and the guest preview all go through here,
 * so they can never drift apart in what they compute.
 */
const buildCosmogram = ({ birthDate, birthTime, place }) => ({
  chart: buildNatalChart({ birthDate, birthTime, place }),
  destinyMatrix: buildDestinyMatrix(birthDate),
  pythagoreanSquare: buildPythagoreanSquare(birthDate),
});

module.exports = { buildCosmogram };
