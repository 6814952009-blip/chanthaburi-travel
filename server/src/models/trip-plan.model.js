const mongoose = require("mongoose");

const tripPlanSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
    startDate: Date,
    endDate: Date,
    notes: { type: String, trim: true, maxlength: 2000, default: "" },
    coverImageUrl: { type: String, trim: true, default: "" },
    isPublic: { type: Boolean, default: false },
    stops: [{
      // A saved stop can reference a managed Place or a catalog item entered by its name.
      place: { type: mongoose.Schema.Types.ObjectId, ref: "Place" },
      placeName: { type: String, trim: true, maxlength: 160 },
      districtName: { type: String, trim: true, maxlength: 100 },
      day: { type: Number, min: 1, default: 1 },
      order: { type: Number, min: 0, required: true },
      note: { type: String, trim: true, maxlength: 500, default: "" },
      stayMinutes: { type: Number, min: 15, max: 1440, default: 60 },
      wantHotel: { type: Boolean, default: false },
      hotel: {
        name: { type: String, trim: true, maxlength: 200 },
        address: { type: String, trim: true, maxlength: 500 },
        googleMapsUrl: { type: String, trim: true },
        distanceMeters: { type: Number, min: 0 },
      },
      travelMinutes: { type: Number, min: 0, default: 0 },
    }],
  },
  { timestamps: true }
);

tripPlanSchema.index({ user: 1, updatedAt: -1 });
module.exports = mongoose.model("TripPlan", tripPlanSchema);
