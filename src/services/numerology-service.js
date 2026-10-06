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

  // the karmic ring has two diagonals — e/g and f/h — read separately as
  // the paternal (top-left to bottom-right) and maternal ancestral lines
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

  // the three-level purpose line. Each half is folded on its own before
  // adding — folding only the grand total (as `center` does) gives a
  // different arcana whenever a half goes above 22:
  // personal = sky (b + d) + earth (a + c), social = paternal + maternal
  // lines, spiritual = personal + social
  const sky = toArcana(b + d);
  const earth = toArcana(a + c);
  const personalPurpose = toArcana(sky + earth);
  const socialPurpose = toArcana(
    ancestralPrograms.paternal.total + ancestralPrograms.maternal.total
  );
  const purpose = {
    personal: personalPurpose,
    social: socialPurpose,
    spiritual: toArcana(personalPurpose + socialPurpose),
  };

  // the four karmic arcana together — ancestral strength
  const familyPower = toArcana(karmic.e + karmic.f + karmic.g + karmic.h);

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
