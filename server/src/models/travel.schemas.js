const mongoose = require("mongoose");

// A reusable shape so every visitor-facing string is available in all supported languages.
const localizedTextSchema = new mongoose.Schema(
  {
    th: { type: String, required: true, trim: true },
    en: { type: String, required: true, trim: true },
    zh: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const pointSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["Point"], default: "Point", required: true },
    // GeoJSON always uses [longitude, latitude].
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: (value) =>
          Array.isArray(value) &&
          value.length === 2 &&
          value[0] >= -180 && value[0] <= 180 &&
          value[1] >= -90 && value[1] <= 90,
        message: "coordinates must be [longitude, latitude]",
      },
    },
  },
  { _id: false }
);

module.exports = { localizedTextSchema, pointSchema };
