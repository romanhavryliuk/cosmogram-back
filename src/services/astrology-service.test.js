const test = require('node:test');
const assert = require('node:assert/strict');
const { buildNatalChart } = require('./astrology-service');

// Busk, Ukraine — 1996-12-21 03:30 local. Placidus, tropical, verified against
// astro.com. This is the one test in the project with real external ground
// truth: it catches a missing ephemeris, a wrong UT conversion, or coordinates
// that never reached the calculation — each throws planets off by whole
// degrees, so the tolerance stays tight.
const TOLERANCE_DEG = 0.5;

const dms = (deg, min, sec) => deg + min / 60 + sec / 3600;

const FIXTURE_INPUT = {
  birthDate: '1996-12-21',
  birthTime: '03:30',
  place: {
    label: 'Busk, Ukraine',
    latitude: 49.9656,
    longitude: 24.6125,
    timezone: 'Europe/Kyiv',
  },
};

const EXPECTED_PLANETS = {
  sun: { sign: 'sagittarius', degree: dms(29, 27, 56), house: 2 },
  moon: { sign: 'taurus', degree: dms(15, 0, 4), house: 7 },
  mercury: { sign: 'capricorn', degree: dms(18, 34, 7), house: 3 },
  venus: { sign: 'sagittarius', degree: dms(4, 46, 45), house: 2 },
  mars: { sign: 'virgo', degree: dms(25, 14, 39), house: 11 },
  jupiter: { sign: 'capricorn', degree: dms(22, 40, 24), house: 3 },
  saturn: { sign: 'aries', degree: dms(0, 53, 16), house: 5 },
  uranus: { sign: 'aquarius', degree: dms(2, 41, 7), house: 3 },
  neptune: { sign: 'capricorn', degree: dms(26, 26, 14), house: 3 },
  pluto: { sign: 'sagittarius', degree: dms(4, 0, 5), house: 2 },
};

const SIGN_INDEX = {
  aries: 0,
  taurus: 1,
  gemini: 2,
  cancer: 3,
  leo: 4,
  virgo: 5,
  libra: 6,
  scorpio: 7,
  sagittarius: 8,
  capricorn: 9,
  aquarius: 10,
  pisces: 11,
};

const toLongitude = (sign, degree) => SIGN_INDEX[sign] * 30 + degree;

test('buildNatalChart matches the astro.com fixture (Busk, 1996-12-21 03:30)', () => {
  const chart = buildNatalChart(FIXTURE_INPUT);

  for (const [planet, expected] of Object.entries(EXPECTED_PLANETS)) {
    const actual = chart.planets.find((p) => p.planet === planet);
    assert.ok(actual, `${planet} is missing from the chart`);

    // a wrong sign means the instant or the coordinates are off by far more
    // than the degree tolerance below could absorb
    assert.strictEqual(
      actual.sign,
      expected.sign,
      `${planet}: expected ${expected.sign}, got ${actual.sign}`
    );

    const diff = Math.abs(actual.degree - expected.degree);
    assert.ok(
      diff <= TOLERANCE_DEG,
      `${planet}: degree off by ${diff.toFixed(3)}° (got ${actual.degree}°, expected ~${expected.degree.toFixed(2)}°)`
    );

    assert.strictEqual(
      actual.house,
      expected.house,
      `${planet}: expected house ${expected.house}, got ${actual.house}`
    );
  }

  const expectedAscendant = toLongitude('scorpio', dms(3, 39, 0));
  assert.ok(
    Math.abs(chart.ascendant - expectedAscendant) <= TOLERANCE_DEG,
    `ascendant off: got ${chart.ascendant}, expected ~${expectedAscendant}`
  );

  const expectedMidheaven = toLongitude('leo', dms(14, 33, 0));
  assert.ok(
    Math.abs(chart.midheaven - expectedMidheaven) <= TOLERANCE_DEG,
    `midheaven off: got ${chart.midheaven}, expected ~${expectedMidheaven}`
  );
});
