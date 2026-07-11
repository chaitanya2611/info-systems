const express = require("express");
const Product = require("../models/Product");

const router = express.Router();

router.get("/", async (req, res) => {
  res.json({ products: await Product.find().sort({ createdAt: 1 }) });
});

module.exports = router;
