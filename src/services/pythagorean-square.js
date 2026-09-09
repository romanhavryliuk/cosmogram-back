const { PYTHAGOREAN_DIGITS } = require('../models/profile');

const sumDigits = (value) =>
  String(value)
    .split('')
    .reduce((sum, char) => sum + Number(char), 0);

/**
 * The four "working numbers" of the classic Pythagorean square method.
 * Derived from the birth date written DD MM YYYY (not the stored
 * yyyy-MM-dd order) — the third number specifically depends on the day's
 * own first digit, so the digit order matters here.
 */
const buildWorkingNumbers = (birthDate) => {
  const [year, month, day] = birthDate.split('-');
  const digits = `${day}${month}${year}`;

  const a = sumDigits(digits);
  const b = sumDigits(a);
  const c = a - 2 * Number(digits[0]);
  const d = sumDigits(c);

  return { a, b, c, d };
};

/**
 * The full square pools the 8 date digits with the digits of the four
 * working numbers and counts each digit 1–9. Counting only the date
 * digits (no working numbers) is the simplified version of this method.
 */
const buildPythagoreanSquare = (birthDate) => {
  const { a, b, c, d } = buildWorkingNumbers(birthDate);
  const [year, month, day] = birthDate.split('-');
  const pool = `${day}${month}${year}${a}${b}${c}${d}`;

  return PYTHAGOREAN_DIGITS.reduce((square, digit) => {
    const count = pool.split('').filter((char) => char === digit).length;
    square[digit] = digit.repeat(count);
    return square;
  }, {});
};

module.exports = { buildPythagoreanSquare };
