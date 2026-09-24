const Place = require("../models/place.model");
const Review = require("../models/review.model");
const TripPlan = require("../models/trip-plan.model");
const { put } = require("@vercel/blob");

const validStops = (stops) => Array.isArray(stops) && stops.every((stop, index) => (stop.place || (typeof stop.placeName === "string" && stop.placeName.trim())) && Number.isInteger(stop.order) && stop.order >= 0 && (stop.day === undefined || (Number.isInteger(stop.day) && stop.day > 0)) && index >= 0);

const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: "An image file is required" });
    if (!req.file.mimetype.startsWith("image/")) return res.status(400).json({ message: "Only image files are supported" });
    const extension = (req.file.originalname.split(".").pop() || "jpg").replace(/[^a-z0-9]/gi, "").toLowerCase() || "jpg";
    const blob = await put(`trip-covers/${req.user._id}-${Date.now()}.${extension}`, req.file.buffer, {
      access: "public",
      contentType: req.file.mimetype,
      addRandomSuffix: true,
    });
    res.status(201).json({ url: blob.url });
  } catch (error) { next(error); }
};

const listReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ place: req.params.placeId }).populate("user", "name avatarUrl").sort({ createdAt: -1 });
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    res.json({ reviews, averageRating: reviews.length ? total / reviews.length : 0, count: reviews.length });
  } catch (error) { next(error); }
};

const upsertReview = async (req, res, next) => {
  try {
    const { rating, comment, visitDate, photos } = req.body;
    if (!Number.isInteger(rating) || rating < 1 || rating > 5 || typeof comment !== "string" || comment.trim().length < 5) {
      return res.status(400).json({ message: "rating (1-5) and a comment of at least 5 characters are required" });
    }
    if (!await Place.exists({ _id: req.params.placeId, isActive: true })) return res.status(404).json({ message: "Place not found" });
    const review = await Review.findOneAndUpdate(
      { place: req.params.placeId, user: req.user._id },
      { $set: { rating, comment: comment.trim(), visitDate, photos: Array.isArray(photos) ? photos.slice(0, 5) : [] } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    ).populate("user", "name avatarUrl");
    res.status(201).json(review);
  } catch (error) { next(error); }
};

const listPlans = async (req, res, next) => {
  try { res.json(await TripPlan.find({ user: req.user._id }).populate("stops.place", "name slug location").sort({ updatedAt: -1 })); } catch (error) { next(error); }
};

const createPlan = async (req, res, next) => {
  try {
    const { title, startDate, endDate, notes = "", isPublic = false, coverImageUrl = "", stops = [] } = req.body;
    if (typeof title !== "string" || title.trim().length < 2 || !validStops(stops)) return res.status(400).json({ message: "A title and valid ordered stops are required" });
    const plan = await TripPlan.create({ user: req.user._id, title: title.trim(), startDate, endDate, notes, isPublic, coverImageUrl, stops });
    await plan.populate("stops.place", "name slug location");
    res.status(201).json(plan);
  } catch (error) { next(error); }
};

const updatePlan = async (req, res, next) => {
  try {
    const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => ["title", "startDate", "endDate", "notes", "isPublic", "stops"].includes(key)));
    if (updates.stops && !validStops(updates.stops)) return res.status(400).json({ message: "Stops must have a place, day and non-negative order" });
    const plan = await TripPlan.findOneAndUpdate({ _id: req.params.planId, user: req.user._id }, { $set: updates }, { new: true, runValidators: true }).populate("stops.place", "name slug location");
    if (!plan) return res.status(404).json({ message: "Plan not found" });
    res.json(plan);
  } catch (error) { next(error); }
};

const deletePlan = async (req, res, next) => {
  try { const plan = await TripPlan.findOneAndDelete({ _id: req.params.planId, user: req.user._id }); if (!plan) return res.status(404).json({ message: "Plan not found" }); res.status(204).end(); } catch (error) { next(error); }
};

module.exports = { listReviews, upsertReview, listPlans, createPlan, updatePlan, deletePlan, uploadFile, validStops };
