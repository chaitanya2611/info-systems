const express = require("express");
const CarouselSlide = require("../models/CarouselSlide");

const router = express.Router();

router.get("/", async (req, res) => {
  const slides = await CarouselSlide.find({ active: true }).sort({ sortOrder: 1, createdAt: 1 });
  res.json({ slides });
});

module.exports = router;
