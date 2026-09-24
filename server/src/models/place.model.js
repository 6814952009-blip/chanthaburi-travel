const mongoose = require("mongoose");
const { localizedTextSchema, pointSchema } = require("./travel.schemas");

const placeSchema = new mongoose.Schema(
  {
    district: { type: mongoose.Schema.Types.ObjectId, ref: "District", required: true, index: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: localizedTextSchema, required: true },
    // A short, understandable history/background for the attraction.
    history: { type: localizedTextSchema, required: true },
    description: { type: localizedTextSchema, required: true },
    categories: [{ type: String, enum: ["nature", "culture", "food", "beach", "waterfall", "community", "cafe", "restaurant"] }],
    location: { type: pointSchema, required: true },
    address: { type: localizedTextSchema, required: true },
    googleMapsUrl: { type: String, required: true, trim: true },
    openingHours: { type: localizedTextSchema },
    imageUrls: [{ type: String, trim: true }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

placeSchema.index({ location: "2dsphere" });
placeSchema.index({ district: 1, isActive: 1 });
module.exports = mongoose.model("Place", placeSchema);
