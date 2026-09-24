const mongoose = require("mongoose");
const { localizedTextSchema, pointSchema } = require("./travel.schemas");

const districtSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: localizedTextSchema, required: true },
    introduction: { type: localizedTextSchema, required: true },
    center: { type: pointSchema, required: true },
    googleMapsUrl: { type: String, required: true, trim: true },
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

districtSchema.index({ center: "2dsphere" });
module.exports = mongoose.model("District", districtSchema);
