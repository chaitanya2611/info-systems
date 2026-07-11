const express = require("express");
const Product = require("../models/Product");
const Order = require("../models/Order");
const { auth } = require("../middleware/auth");

const router = express.Router();

router.get("/", auth, async (req, res) => {
  const query = req.user.role === "admin" ? {} : { user: req.user._id };
  res.json({ orders: await Order.find(query).sort({ createdAt: -1 }) });
});

router.post("/", auth, async (req, res) => {
  const items = Array.isArray(req.body.items) ? req.body.items : [];
  if (!items.length) return res.status(400).json({ error: "Your cart is empty." });
  const orderItems = [];
  for (const item of items) {
    const quantity = Math.max(1, Math.floor(Number(item.quantity) || 0));
    const product = await Product.findById(item.productId);
    if (!product || product.stock < quantity) return res.status(400).json({ error: "One or more cart items are unavailable." });
    product.stock -= quantity;
    await product.save();
    orderItems.push({ product: product._id, name: product.name, price: product.price, quantity });
  }
  const total = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  res.status(201).json({
    order: await Order.create({
      user: req.user._id,
      customerName: req.user.name,
      customerEmail: req.user.email,
      items: orderItems,
      total: Math.round(total * 100) / 100
    })
  });
});

module.exports = router;
