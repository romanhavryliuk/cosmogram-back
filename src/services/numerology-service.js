const { buildWorkingNumbers, buildPythagoreanSquare } = require('./pythagorean-square');

/**
 * STEP 4 — `buildDestinyMatrix()` reduces the birth date to arcana with a
 * plain sum-and-fold, which is only one of several traditions. Confirm the
 * intended method against the project brief before treating it as final;
 * the shape it returns already matches the frontend `DestinyMatrix` type.
 */

const MAX_ARCANA = 22;

const sumDigits = (value) =>
  String(value)
    .split('')
    .reduce((sum, char) => sum + Number(char), 0);

/** Folds a number down into the 1–22 major arcana range */
const toArcana = (value) => {
  let result = value;

  while (result > MAX_ARCANA) {
    result = sumDigits(result);
  }

  return result;
};

const buildDestinyMatrix = (birthDate) => {
  const [year, month, day] = birthDate.split('-').map(Number);

  // the four personal arcana: day, month, year, and their sum
  const a = toArcana(day);
  const b = toArcana(month);
  const c = toArcana(sumDigits(year));
  const d = toArcana(a + b + c);

  const center = toArcana(a + b + c + d);

  return {
    center,
    personal: { a, b, c, d },
    // the karmic ring sits between each pair of neighbouring personal arcana
    karmic: {
      e: toArcana(a + b),
      f: toArcana(b + c),
      g: toArcana(c + d),
      h: toArcana(d + a),
    },
    money: toArcana(center + d),
    love: toArcana(center + b),
  };
};

module.exports = { buildPythagoreanSquare, buildWorkingNumbers, buildDestinyMatrix };
