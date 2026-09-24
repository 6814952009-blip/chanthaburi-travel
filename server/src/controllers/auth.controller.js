const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

const createToken = (user) => jwt.sign(
  { id: user._id, role: user.role },
  process.env.JWT_SECRET || "change-this-development-secret",
  { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
);

const sendAuthResponse = (res, user, status = 200) => res.status(status).json({ token: createToken(user), user });

const register = async (req, res, next) => {
  try {
    const { name, email, password, preferredLanguage } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: "name, email and password are required" });
    const existing = await User.exists({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ message: "This email is already registered" });
    // Public registration cannot choose its own role. Configure ADMIN_EMAIL to bootstrap the first admin.
    const isInitialAdmin = process.env.ADMIN_EMAIL && email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase();
    const user = await User.create({ name, email, password, preferredLanguage, role: isInitialAdmin ? "admin" : "user" });
    return sendAuthResponse(res, user, 201);
  } catch (error) { next(error); }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: String(email).toLowerCase() }).select("+password");
    if (!user || !(await user.comparePassword(password || ""))) {
      return res.status(401).json({ message: "Email or password is incorrect" });
    }
    return sendAuthResponse(res, user);
  } catch (error) { next(error); }
};

const getMe = (req, res) => res.json({ user: req.user });

const updateMe = async (req, res, next) => {
  try {
    const allowed = ["name", "avatarUrl", "preferredLanguage"];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
    const user = await User.findByIdAndUpdate(req.user._id, { $set: updates }, { new: true, runValidators: true });
    res.json({ user });
  } catch (error) { next(error); }
};

module.exports = { register, login, getMe, updateMe };
