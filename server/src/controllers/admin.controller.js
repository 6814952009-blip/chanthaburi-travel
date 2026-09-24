const Place = require("../models/place.model");
const District = require("../models/district.model");
const editablePlaceFields = ["name", "history", "description", "categories", "address", "googleMapsUrl", "openingHours", "imageUrls", "isActive"];
const pick = (source, allowed) => Object.fromEntries(Object.entries(source).filter(([key]) => allowed.includes(key)));
const listPlacesForAdmin = async (req, res, next) => { try { res.json(await Place.find().populate("district", "name code").sort({ updatedAt: -1 })); } catch (error) { next(error); } };
const updatePlace = async (req, res, next) => { try { const updates = pick(req.body, editablePlaceFields); if (!Object.keys(updates).length) return res.status(400).json({ message: "No editable place fields were supplied" }); const place = await Place.findByIdAndUpdate(req.params.placeId, { $set: updates }, { new: true, runValidators: true }).populate("district", "name code"); if (!place) return res.status(404).json({ message: "Place not found" }); res.json(place); } catch (error) { next(error); } };
const updateDistrict = async (req, res, next) => { try { const district = await District.findByIdAndUpdate(req.params.districtId, { $set: pick(req.body, ["name", "introduction", "googleMapsUrl", "displayOrder", "isActive"]) }, { new: true, runValidators: true }); if (!district) return res.status(404).json({ message: "District not found" }); res.json(district); } catch (error) { next(error); } };
module.exports = { listPlacesForAdmin, updatePlace, updateDistrict, pick };
