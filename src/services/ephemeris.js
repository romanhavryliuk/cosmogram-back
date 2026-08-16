const {
  dateToJulianDay,
  calculatePosition,
  calculateHouses,
  Planet,
  HouseSystem,
} = require('@swisseph/node');

// order matches models/profile.js PLANETS — kept as a literal map (not an
// import from the model) so this module stays a pure ephemeris wrapper with
// no Mongoose dependency
const PLANET_CODES = {
  sun: Planet.Sun,
  moon: Planet.Moon,
  mercury: Planet.Mercury,
  venus: Planet.Venus,
  mars: Planet.Mars,
  jupiter: Planet.Jupiter,
  saturn: Planet.Saturn,
  uranus: Planet.Uranus,
  neptune: Planet.Neptune,
  pluto: Planet.Pluto,
};

/**
 * A local birth date + time only becomes a real instant once it is anchored
 * to UTC through the place's actual IANA zone — a fixed offset is not
 * enough because zones change their DST rules across history. This solves
 * for the UTC instant whose wall-clock reading in that zone matches the
 * birth time, using the zone's own (historically correct) offset.
 */
const localToUtcDate = (dateStr, timeStr, timeZone) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute] = timeStr.split(':').map(Number);
  const wallClockAsUtc = Date.UTC(year, month - 1, day, hour, minute);

  // two passes: the first settles the offset, the second confirms the
  // first guess did not land on the wrong side of a DST transition
  let utc = wallClockAsUtc;
  for (let i = 0; i < 2; i += 1) {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
      .formatToParts(new Date(utc))
      .reduce((acc, part) => ({ ...acc, [part.type]: part.value }), {});

    const zonedReadingAsUtc = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
      Number(parts.second)
    );

    utc = wallClockAsUtc - (zonedReadingAsUtc - utc);
  }

  return new Date(utc);
};

/**
 * Pure Swiss Ephemeris lookup: a UTC instant and a place go in, raw
 * planetary longitudes and Placidus house cusps come out. Signs, which
 * house a planet falls in, and aspects are derived from this in
 * astrology-service.js — this module knows nothing about that shape.
 */
const calcChart = ({ date, latitude, longitude }) => {
  const jd = dateToJulianDay(date);

  const planets = Object.entries(PLANET_CODES).map(([name, code]) => {
    const position = calculatePosition(jd, code);
    return {
      planet: name,
      longitude: position.longitude,
      retrograde: position.longitudeSpeed < 0,
    };
  });

  const houses = calculateHouses(jd, latitude, longitude, HouseSystem.Placidus);

  return {
    planets,
    // cusps[0] is unused by this library; house N starts at cusps[N]
    cusps: houses.cusps.slice(1, 13),
    ascendant: houses.ascendant,
    midheaven: houses.mc,
  };
};

module.exports = { localToUtcDate, calcChart };
