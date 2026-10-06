const test = require('node:test');
const assert = require('node:assert/strict');
const {
  buildDestinyMatrix,
  buildPythagoreanSquare,
} = require('./numerology-service');

/**
 * Unlike the natal chart, numerology has no external ground truth to check
 * against — these numbers are a *regression pin*, not proof of correctness.
 * They lock in the reference values for 21.12.1996 so a refactor cannot move
 * them silently.
 *
 * Note the reduction method: arcana are folded with a digit sum, so the year
 * 1996 -> 25 -> 7. Some sources subtract 22 instead (25 -> 3); Ukrainian
 * descriptions of Ladini's method use the digit sum, so the project does too.
 * Switching methods would change every derived number here.
 */
const BIRTH_DATE = '1996-12-21';

test('destiny matrix: cardinal points, center and diagonals', () => {
  const { personal, center, karmic } = buildDestinyMatrix(BIRTH_DATE);

  assert.deepStrictEqual(personal, { a: 21, b: 12, c: 7, d: 4 });
  assert.strictEqual(center, 8);
  assert.deepStrictEqual(karmic, { e: 6, f: 19, g: 11, h: 7 });
});

test('destiny matrix: purpose line, ancestral programs and family power', () => {
  const { purpose, ancestralPrograms, familyPower } =
    buildDestinyMatrix(BIRTH_DATE);

  assert.deepStrictEqual(purpose, { personal: 8, social: 7, spiritual: 15 });

  assert.deepStrictEqual(ancestralPrograms.paternal, {
    first: 6,
    second: 11,
    total: 17,
  });
  assert.deepStrictEqual(ancestralPrograms.maternal, {
    first: 19,
    second: 7,
    total: 8,
  });

  assert.strictEqual(familyPower, 7);
});

test('destiny matrix: personal purpose folds sky and earth separately', () => {
  // 20.12.1991: a 20, b 12, c 20, d 7 -> center 59 -> 14, but
  // sky 12 + 7 = 19, earth 20 + 20 = 40 -> 4, personal 23 -> 5
  const { center, purpose } = buildDestinyMatrix('1991-12-20');

  assert.strictEqual(center, 14);
  assert.deepStrictEqual(purpose, { personal: 5, social: 10, spiritual: 15 });
});

test('destiny matrix: every arcana stays within 1-22', () => {
  const matrix = buildDestinyMatrix(BIRTH_DATE);

  const values = [
    matrix.center,
    matrix.money,
    matrix.love,
    matrix.familyPower,
    ...Object.values(matrix.personal),
    ...Object.values(matrix.karmic),
    ...Object.values(matrix.purpose),
    ...Object.values(matrix.ancestralPrograms.paternal),
    ...Object.values(matrix.ancestralPrograms.maternal),
  ];

  for (const value of values) {
    assert.ok(
      Number.isInteger(value) && value >= 1 && value <= 22,
      `arcana out of the 1-22 range: ${value}`
    );
  }
});

test('pythagorean square counts date digits plus the working numbers', () => {
  // pool = "21121996" (DD MM YYYY) + working numbers 31, 4, 27, 9
  assert.deepStrictEqual(buildPythagoreanSquare(BIRTH_DATE), {
    1: '1111',
    2: '222',
    3: '3',
    4: '4',
    5: '',
    6: '6',
    7: '7',
    8: '',
    9: '999',
  });
});

test('pythagorean square uses the first non-zero digit of an early day', () => {
  // 05.03.1990: working numbers 27, 9, 27 - 2 * 5 = 17, 8
  // (with the leading 0 the third number would wrongly stay 27)
  assert.deepStrictEqual(buildPythagoreanSquare('1990-03-05'), {
    1: '11',
    2: '2',
    3: '3',
    4: '',
    5: '5',
    6: '',
    7: '77',
    8: '8',
    9: '999',
  });
});
