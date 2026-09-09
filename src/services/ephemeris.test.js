const test = require('node:test');
const assert = require('node:assert/strict');
const { localToUtcDate } = require('./ephemeris');

// A birth time is a local wall-clock reading; turning it into the UTC instant
// the ephemeris needs is where charts silently go wrong. These two cover both
// sides of a DST boundary in the same zone.

test('localToUtcDate resolves winter Kyiv time (UTC+2, no DST)', () => {
  const date = localToUtcDate('1996-12-21', '03:30', 'Europe/Kyiv');
  assert.strictEqual(date.toISOString(), '1996-12-21T01:30:00.000Z');
});

test('localToUtcDate resolves summer Kyiv time (UTC+3, DST)', () => {
  const date = localToUtcDate('1996-07-15', '12:00', 'Europe/Kyiv');
  assert.strictEqual(date.toISOString(), '1996-07-15T09:00:00.000Z');
});
