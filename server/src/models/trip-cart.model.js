const mongoose = require("mongoose");

const tripCartSchema = new mongoose.Schema(
  {
    // Guest carts use sessionId; signed-in carts can be owned by a User.
    sessionId: { type: String, sparse: true, unique: true, index: true, trim: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    items: [
      {
        place: { type: mongoose.Schema.Types.ObjectId, ref: "Place", required: true },
        order: { type: Number, required: true, min: 0 },
        // Filled from Google Directions API (or another route provider) when the itinerary is calculated.
        distanceKm: { type: Number, min: 0 },
        durationMinutes: { type: Number, min: 0 },
      },
    ],
    findNearbyHotels: { type: Boolean, default: false },
    hotelSearchRadiusMeters: { type: Number, default: 5000, min: 100, max: 50000 },
  },
  { timestamps: true }
);

tripCartSchema.index({ sessionId: 1, "items.place": 1 });
module.exports = mongoose.model("TripCart", tripCartSchema);
