const express = require("express");
const {
  getDistricts, getPlaces, getNearbyHotels, getNearbyPlaces,
  getCart, addCartItem, removeCartItem, updateCartOptions, updateCartRoute,
} = require("../controllers/travel.controller");

const router = express.Router();

router.get("/districts", getDistricts); // sidebar options
router.get("/places", getPlaces); // ?district=<districtId>
router.get("/hotels/nearby", getNearbyHotels); // ?lng=102.1&lat=12.6&radius=5000
router.get("/places/:placeId/nearby", getNearbyPlaces); // ?radius=5000
router.get("/trip-carts/:sessionId", getCart);
router.post("/trip-carts/:sessionId/items", addCartItem);
router.delete("/trip-carts/:sessionId/items/:placeId", removeCartItem);
router.patch("/trip-carts/:sessionId/items/:placeId/route", updateCartRoute);
router.patch("/trip-carts/:sessionId", updateCartOptions);

module.exports = router;
