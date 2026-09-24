const mongoose = require("mongoose");
const { localizedTextSchema, pointSchema } = require("./travel.schemas");

const hotelSchema = new mongoose.Schema(
  {
    name: { type: localizedTextSchema, required: true },
    location: { type: pointSchema, required: true },
    address: { type: localizedTextSchema, required: true },
    googleMapsUrl: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    rating: { type: Number, min: 0, max: 5 },
    imageUrls: [{ type: String, trim: true }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

hotelSchema.index({ location: "2dsphere" });
module.exports = mongoose.model("Hotel", hotelSchema);
