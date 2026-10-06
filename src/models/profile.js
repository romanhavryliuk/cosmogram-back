const { Schema, model } = require('mongoose');
const Joi = require('joi');
const handleMongooseError = require('../helpers/handleMongooseError');

// mirrors src/types/astrology.types.ts on the frontend
const ZODIAC_SIGNS = [
  'aries',
  'taurus',
  'gemini',
  'cancer',
  'leo',
  'virgo',
  'libra',
  'scorpio',
  'sagittarius',
  'capricorn',
  'aquarius',
  'pisces',
];

const PLANETS = [
  'sun',
  'moon',
  'mercury',
  'venus',
  'mars',
  'jupiter',
  'saturn',
  'uranus',
  'neptune',
  'pluto',
];

const ASPECT_TYPES = [
  'conjunction',
  'sextile',
  'square',
  'trine',
  'opposition',
];

const PYTHAGOREAN_DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

// the date and the time stay strings on purpose: they are local calendar
// values the user typed, and a Date would drag a timezone into them
const dateRegexp = /^\d{4}-\d{2}-\d{2}$/;
const timeRegexp = /^([01]\d|2[0-3]):[0-5]\d$/;

const subSchema = (definition) => new Schema(definition, { _id: false });

const placeSchema = subSchema({
  label: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  // IANA timezone of the birth place, e.g. "Europe/Kyiv"
  timezone: { type: String, required: true },
});

const planetPositionSchema = subSchema({
  planet: { type: String, enum: PLANETS, required: true },
  sign: { type: String, enum: ZODIAC_SIGNS, required: true },
  degree: { type: Number, required: true },
  longitude: { type: Number, required: true },
  // the house, the ascendant and the midheaven all depend on the birth time,
  // so a chart without one simply has none of them
  house: { type: Number },
  retrograde: { type: Boolean, default: false },
});

const houseCuspSchema = subSchema({
  house: { type: Number, required: true },
  sign: { type: String, enum: ZODIAC_SIGNS, required: true },
  longitude: { type: Number, required: true },
});

const aspectSchema = subSchema({
  from: { type: String, enum: PLANETS, required: true },
  to: { type: String, enum: PLANETS, required: true },
  type: { type: String, enum: ASPECT_TYPES, required: true },
  orb: { type: Number, required: true },
});

const chartSchema = subSchema({
  planets: [planetPositionSchema],
  houses: [houseCuspSchema],
  aspects: [aspectSchema],
  ascendant: { type: Number },
  midheaven: { type: Number },
});

const arcanaSchema = (keys) =>
  subSchema(
    Object.fromEntries(keys.map((key) => [key, { type: Number, required: true }]))
  );

const ancestralLineSchema = subSchema({
  first: { type: Number, required: true },
  second: { type: Number, required: true },
  total: { type: Number, required: true },
});

const destinyMatrixSchema = subSchema({
  center: { type: Number, required: true },
  personal: { type: arcanaSchema(['a', 'b', 'c', 'd']), required: true },
  karmic: { type: arcanaSchema(['e', 'f', 'g', 'h']), required: true },
  // fields added after the first version of this schema: profiles saved
  // before they existed simply won't have them on read — Mongoose only
  // enforces `required` on save, not on read, so old documents keep loading
  purpose: {
    type: arcanaSchema(['personal', 'social', 'spiritual']),
    required: true,
  },
  ancestralPrograms: {
    type: subSchema({
      paternal: { type: ancestralLineSchema, required: true },
      maternal: { type: ancestralLineSchema, required: true },
    }),
    required: true,
  },
  familyPower: { type: Number, required: true },
  money: { type: Number, required: true },
  love: { type: Number, required: true },
});

// each digit maps to a string of its repetitions, e.g. { '1': '111', '3': '' }
const pythagoreanSquareSchema = subSchema(
  Object.fromEntries(
    PYTHAGOREAN_DIGITS.map((digit) => [digit, { type: String, default: '' }])
  )
);

const profileSchema = new Schema(
  {
    name: { type: String, required: [true, 'Name is required'] },
    birthDate: {
      type: String,
      match: [dateRegexp, 'Birth date must be in yyyy-MM-dd format'],
      required: [true, 'Birth date is required'],
    },
    // null when the user does not know it — see buildNatalChart for what
    // that leaves out of the chart
    birthTime: {
      type: String,
      match: [timeRegexp, 'Birth time must be in HH:mm format'],
      default: null,
    },
    place: { type: placeSchema, required: true },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'user',
      required: true,
    },
    chart: { type: chartSchema, required: true },
    destinyMatrix: { type: destinyMatrixSchema, required: true },
    pythagoreanSquare: { type: pythagoreanSquareSchema, required: true },
    // public link token; null while the owner has not shared the profile
    shareId: { type: String, default: null },
  },
  {
    versionKey: false,
    // profiles saved before editing existed have no `updatedAt` until their
    // first edit
    timestamps: true,
    toJSON: {
      // the frontend `Profile` type expects `id`, not `_id`
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        return ret;
      },
    },
  }
);

// every read is scoped to one owner and sorted newest first
profileSchema.index({ ownerId: 1, createdAt: -1 });

// partial rather than sparse: a sparse index still indexes explicit nulls,
// and every unshared profile has one
profileSchema.index(
  { shareId: 1 },
  { unique: true, partialFilterExpression: { shareId: { $type: 'string' } } }
);

profileSchema.post('save', handleMongooseError);

const profileFields = {
  name: Joi.string().trim().min(1).max(60),
  birthDate: Joi.string().pattern(dateRegexp).messages({
    'string.pattern.base': 'birthDate must be in yyyy-MM-dd format',
  }),
  birthTime: Joi.string().pattern(timeRegexp).allow(null).messages({
    'string.pattern.base': 'birthTime must be in HH:mm format',
  }),
  // always replaced as a whole: a new label with the old coordinates would
  // be a place that does not exist
  place: Joi.object({
    label: Joi.string().required(),
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required(),
    timezone: Joi.string().required(),
  }),
};

const createProfileSchema = Joi.object({
  ...profileFields,
  name: profileFields.name.required(),
  birthDate: profileFields.birthDate.required(),
  place: profileFields.place.required(),
});

const updateProfileSchema = Joi.object(profileFields).min(1).messages({
  'object.min': 'At least one field must be provided',
});

const schemas = { createProfileSchema, updateProfileSchema };

const Profile = model('profile', profileSchema);

module.exports = {
  Profile,
  schemas,
  ZODIAC_SIGNS,
  PLANETS,
  ASPECT_TYPES,
  PYTHAGOREAN_DIGITS,
};
