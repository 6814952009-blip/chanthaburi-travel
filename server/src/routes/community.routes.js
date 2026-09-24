const express = require("express");
const multer = require("multer");
const { protect } = require("../middlewares/auth.middleware");
const controller = require("../controllers/community.controller");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
router.get("/places/:placeId/reviews", controller.listReviews);
router.put("/places/:placeId/review", protect, controller.upsertReview);
router.post("/uploads", protect, upload.single("file"), controller.uploadFile);
router.get("/plans", protect, controller.listPlans);
router.post("/plans", protect, controller.createPlan);
router.patch("/plans/:planId", protect, controller.updatePlan);
router.delete("/plans/:planId", protect, controller.deletePlan);
module.exports = router;
