const express = require("express");
const { protect, allowRoles } = require("../middlewares/auth.middleware");
const controller = require("../controllers/admin.controller");
const router = express.Router();
router.use(protect, allowRoles("admin"));
router.get("/places", controller.listPlacesForAdmin);
router.patch("/places/:placeId", controller.updatePlace);
router.patch("/districts/:districtId", controller.updateDistrict);
module.exports = router;
