const { buildPythagoreanSquare } = require('./pythagorean-square');

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

  const karmic = {
    // the karmic ring sits between each pair of neighbouring personal arcana
    e: toArcana(a + b),
    f: toArcana(b + c),
    g: toArcana(c + d),
    h: toArcana(d + a),
  };

  // the three-level purpose line: personal square, karmic square, and the
  // two folded together — `personal` is `center` by another name, kept as
  // its own field so the line reads as one coherent block
  const personalPurpose = center;
  const socialPurpose = toArcana(karmic.e + karmic.f + karmic.g + karmic.h);
  const purpose = {
    personal: personalPurpose,
    social: socialPurpose,
    spiritual: toArcana(personalPurpose + socialPurpose),
  };

  // the karmic ring has two diagonals — e/g and f/h — read separately as
  // the paternal and maternal ancestral lines
  const ancestralPrograms = {
    paternal: {
      first: karmic.e,
      second: karmic.g,
      total: toArcana(karmic.e + karmic.g),
    },
    maternal: {
      first: karmic.f,
      second: karmic.h,
      total: toArcana(karmic.f + karmic.h),
    },
  };

  // same sum as `purpose.social` — kept as its own field because it means
  // something different (ancestral strength, not social purpose), not
  // because it is computed differently
  const familyPower = socialPurpose;

  return {
    center,
    personal: { a, b, c, d },
    karmic,
    purpose,
    ancestralPrograms,
    familyPower,
    money: toArcana(center + d),
    love: toArcana(center + b),
  };
};

module.exports = { buildPythagoreanSquare, buildDestinyMatrix };
