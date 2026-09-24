const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    place: { type: mongoose.Schema.Types.ObjectId, ref: "Place", required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true, minlength: 5, maxlength: 1000 },
    visitDate: { type: Date },
    photos: [{ type: String, trim: true }],
  },
  { timestamps: true }
);

// One editable review per traveller and attraction.
reviewSchema.index({ place: 1, user: 1 }, { unique: true });
module.exports = mongoose.model("Review", reviewSchema);
