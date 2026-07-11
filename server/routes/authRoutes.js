const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { publicUser } = require("../utils/users");

const router = express.Router();

function sendUser(res, user) {
  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || "change-this-secret-for-production", { expiresIn: "1d" });
  res.cookie("token", token, { httpOnly: true, sameSite: "lax", secure: false, maxAge: 86400000 });
  res.json({ user: publicUser(user) });
}

router.get("/me", async (req, res) => {
  try {
    if (!req.cookies.token) return res.json({ user: null });
    const payload = jwt.verify(req.cookies.token, process.env.JWT_SECRET || "change-this-secret-for-production");
    res.json({ user: publicUser(await User.findById(payload.id)) });
  } catch {
    res.json({ user: null });
  }
});

router.post("/register", async (req, res) => {
  const name = String(req.body.name || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  if (!name || !email.includes("@") || password.length < 6) {
    return res.status(400).json({ error: "Use a name, valid email, and password with at least 6 characters." });
  }
  if (await User.exists({ email })) return res.status(409).json({ error: "An account already exists for that email." });
  const user = await User.create({ name, email, password: await bcrypt.hash(password, 12), role: "customer" });
  sendUser(res, user);
});

router.post("/login", async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(String(req.body.password || ""), user.password))) {
    return res.status(401).json({ error: "Incorrect email or password." });
  }
  sendUser(res, user);
});

router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ ok: true });
});

module.exports = router;
