const express = require("express");
const Product = require("../models/Product");
const Order = require("../models/Order");
const User = require("../models/User");
const { auth, adminOnly } = require("../middleware/auth");
const { cleanProduct } = require("../utils/products");
const { removeProductImage } = require("../utils/localImages");

const router = express.Router();

router.use(auth, adminOnly);

router.get("/summary", async (req, res) => {
  const [orders, products, customers] = await Promise.all([Order.find(), Product.countDocuments(), User.countDocuments({ role: "customer" })]);
  const revenue = orders.reduce((sum, order) => sum + order.total, 0);
  res.json({ summary: { revenue: Math.round(revenue * 100) / 100, orders: orders.length, products, customers } });
});

router.post("/products", async (req, res) => {
  const product = cleanProduct(req.body);
  if (!product) return res.status(400).json({ error: "Enter a valid product name, description, price, and stock." });
  res.status(201).json({ product: await Product.create(product) });
});

router.put("/products/:id", async (req, res) => {
  const product = cleanProduct(req.body);
  if (!product) return res.status(400).json({ error: "Enter a valid product name, description, price, and stock." });
  const updated = await Product.findByIdAndUpdate(req.params.id, product, { new: true });
  if (!updated) return res.status(404).json({ error: "Product not found." });
  res.json({ product: updated });
});

router.delete("/products/:id", async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (product?.imagePublicId) await removeProductImage(product.imagePublicId);
  await Product.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

router.put("/orders/:id", async (req, res) => {
  const status = String(req.body.status || "");
  if (!["Processing", "Ready", "Completed", "Cancelled"].includes(status)) return res.status(400).json({ error: "Invalid order status." });
  const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!order) return res.status(404).json({ error: "Order not found." });
  res.json({ order });
});

module.exports = router;
