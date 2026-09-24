const District = require("../models/district.model");
const Place = require("../models/place.model");
const Hotel = require("../models/hotel.model");
const TripCart = require("../models/trip-cart.model");

const getDistricts = async (req, res, next) => {
  try {
    const districts = await District.find({ isActive: true }).sort({ displayOrder: 1, "name.th": 1 });
    res.json(districts);
  } catch (error) {
    next(error);
  }
};

const getPlaces = async (req, res, next) => {
  try {
    const filter = { isActive: true };
    if (req.query.district) filter.district = req.query.district;
    const places = await Place.find(filter).populate("district", "code name").sort({ "name.th": 1 });
    res.json(places);
  } catch (error) {
    next(error);
  }
};

const getNearbyHotels = async (req, res, next) => {
  try {
    const longitude = Number(req.query.lng);
    const latitude = Number(req.query.lat);
    const maxDistance = Math.min(Math.max(Number(req.query.radius) || 5000, 100), 50000);
    if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
      return res.status(400).json({ message: "lng and lat are required numbers" });
    }
    const hotels = await Hotel.aggregate([
      {
        $geoNear: {
          near: { type: "Point", coordinates: [longitude, latitude] },
          key: "location",
          distanceField: "distanceMeters",
          maxDistance,
          query: { isActive: true },
          spherical: true,
        },
      },
      { $sort: { distanceMeters: 1 } },
    ]);
    res.json(hotels);
  } catch (error) {
    next(error);
  }
};

const getNearbyPlaces = async (req, res, next) => {
  try {
    const place = await Place.findOne({ _id: req.params.placeId, isActive: true });
    if (!place) return res.status(404).json({ message: "Place not found" });
    const radius = Math.min(Math.max(Number(req.query.radius) || 5000, 100), 50000);
    const nearby = await Place.aggregate([
      { $geoNear: { near: place.location, key: "location", distanceField: "distanceMeters", maxDistance: radius, query: { _id: { $ne: place._id }, isActive: true }, spherical: true } },
      { $limit: 12 },
    ]);
    res.json(nearby);
  } catch (error) { next(error); }
};

const getCart = async (req, res, next) => {
  try {
    const cart = await TripCart.findOne({ sessionId: req.params.sessionId })
      .populate({ path: "items.place", populate: { path: "district", select: "name code" } });
    res.json(cart || { sessionId: req.params.sessionId, items: [], findNearbyHotels: false });
  } catch (error) {
    next(error);
  }
};

const addCartItem = async (req, res, next) => {
  try {
    const { placeId } = req.body;
    if (!placeId) return res.status(400).json({ message: "placeId is required" });
    const exists = await Place.exists({ _id: placeId, isActive: true });
    if (!exists) return res.status(404).json({ message: "Place not found" });

    let cart = await TripCart.findOne({ sessionId: req.params.sessionId });
    if (!cart) cart = new TripCart({ sessionId: req.params.sessionId, items: [] });
    if (!cart.items.some((item) => item.place.toString() === placeId)) {
      cart.items.push({ place: placeId, order: cart.items.length });
      await cart.save();
    }
    await cart.populate("items.place");
    res.status(201).json(cart);
  } catch (error) {
    next(error);
  }
};

const removeCartItem = async (req, res, next) => {
  try {
    const cart = await TripCart.findOne({ sessionId: req.params.sessionId });
    if (!cart) return res.status(404).json({ message: "Trip cart not found" });
    cart.items = cart.items.filter((item) => item.place.toString() !== req.params.placeId);
    cart.items.forEach((item, index) => { item.order = index; });
    await cart.save();
    await cart.populate("items.place");
    res.json(cart);
  } catch (error) {
    next(error);
  }
};

const updateCartOptions = async (req, res, next) => {
  try {
    const { findNearbyHotels, hotelSearchRadiusMeters } = req.body;
    const updates = {};
    if (typeof findNearbyHotels === "boolean") updates.findNearbyHotels = findNearbyHotels;
    if (hotelSearchRadiusMeters !== undefined) updates.hotelSearchRadiusMeters = hotelSearchRadiusMeters;
    const cart = await TripCart.findOneAndUpdate(
      { sessionId: req.params.sessionId },
      { $set: updates },
      { new: true, runValidators: true, upsert: true }
    ).populate("items.place");
    res.json(cart);
  } catch (error) {
    next(error);
  }
};

const updateCartRoute = async (req, res, next) => {
  try {
    const { distanceKm, durationMinutes } = req.body;
    if (!Number.isFinite(distanceKm) || !Number.isFinite(durationMinutes) || distanceKm < 0 || durationMinutes < 0) {
      return res.status(400).json({ message: "distanceKm and durationMinutes must be non-negative numbers" });
    }
    const cart = await TripCart.findOneAndUpdate(
      { sessionId: req.params.sessionId, "items.place": req.params.placeId },
      { $set: { "items.$.distanceKm": distanceKm, "items.$.durationMinutes": durationMinutes } },
      { new: true, runValidators: true }
    ).populate("items.place");
    if (!cart) return res.status(404).json({ message: "Trip cart item not found" });
    res.json(cart);
  } catch (error) {
    next(error);
  }
};

module.exports = { getDistricts, getPlaces, getNearbyHotels, getNearbyPlaces, getCart, addCartItem, removeCartItem, updateCartOptions, updateCartRoute };
