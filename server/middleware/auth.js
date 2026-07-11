const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function auth(req, res, next) {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: "Please log in first." });
    const payload = jwt.verify(token, process.env.JWT_SECRET || "change-this-secret-for-production");
    const user = await User.findById(payload.id);
    if (!user) return res.status(401).json({ error: "Session expired." });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: "Session expired." });
  }
}

function adminOnly(req, res, next) {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Admin access required." });
  next();
}

module.exports = { auth, adminOnly };
