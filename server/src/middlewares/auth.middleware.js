const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    if (!header.startsWith("Bearer ")) return res.status(401).json({ message: "Authentication required" });
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET || "change-this-development-secret");
    const user = await User.findById(payload.id);
    if (!user || !user.isActive) return res.status(401).json({ message: "Account is unavailable" });
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired access token" });
  }
};

const allowRoles = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) return res.status(403).json({ message: "You do not have permission for this action" });
  next();
};

module.exports = { protect, allowRoles };
