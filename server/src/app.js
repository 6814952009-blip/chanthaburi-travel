const express = require("express");
const cors = require("cors");
const trackRoutes = require("./routes/track.routes");
const travelRoutes = require("./routes/travel.routes");
const authRoutes = require("./routes/auth.routes");
const communityRoutes = require("./routes/community.routes");
const adminRoutes = require("./routes/admin.routes");
const { notFound, errorHandler } = require("./middlewares/error.middleware");
const app = express();

// 1. Global middleware
app.use(cors());
app.use(express.json({ limit: "2mb" }));

// 2. Routes
app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/tracks", trackRoutes);
app.use("/api/travel", travelRoutes);
app.use("/api/auth", authRoutes);
app.use("/api", communityRoutes);
app.use("/api/admin", adminRoutes);

// 3. Error handling — must be LAST
app.use(notFound);
app.use(errorHandler);

module.exports = app;
