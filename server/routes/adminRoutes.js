const express = require("express");
const Product = require("../models/Product");
const ProductImage = require("../models/ProductImage");
const CarouselSlide = require("../models/CarouselSlide");
const Order = require("../models/Order");
const User = require("../models/User");
const { auth, adminOnly } = require("../middleware/auth");
const { cleanProduct } = require("../utils/products");

const router = express.Router();

router.use(auth, adminOnly);

function cleanCarouselSlide(input) {
  const slide = {
    eyebrow: String(input.eyebrow || "").trim(),
    title: String(input.title || "").trim(),
    body: String(input.body || "").trim(),
    badge: String(input.badge || "").trim(),
    buttonLabel: String(input.buttonLabel || "Shop now").trim(),
    buttonRoute: String(input.buttonRoute || "#products").trim(),
    image: String(input.image || "").trim(),
    imagePublicId: String(input.imagePublicId || "").trim(),
    sortOrder: Math.floor(Number(input.sortOrder || 0)),
    active: Boolean(input.active)
  };
  if (!slide.title || !slide.body) return null;
  if (!Number.isFinite(slide.sortOrder)) slide.sortOrder = 0;
  return slide;
}

router.get("/summary", async (req, res) => {
  const [orders, products, customers] = await Promise.all([Order.find(), Product.countDocuments(), User.countDocuments({ role: "customer" })]);
  const revenue = orders.reduce((sum, order) => sum + order.total, 0);
  res.json({ summary: { revenue: Math.round(revenue * 100) / 100, orders: orders.length, products, customers } });
});

router.get("/carousel", async (req, res) => {
  const slides = await CarouselSlide.find().sort({ sortOrder: 1, createdAt: 1 });
  res.json({ slides });
});

router.post("/carousel", async (req, res) => {
  const slide = cleanCarouselSlide(req.body);
  if (!slide) return res.status(400).json({ error: "Enter a valid carousel title and description." });
  res.status(201).json({ slide: await CarouselSlide.create(slide) });
});

router.put("/carousel/:id", async (req, res) => {
  const slide = cleanCarouselSlide(req.body);
  if (!slide) return res.status(400).json({ error: "Enter a valid carousel title and description." });
  const updated = await CarouselSlide.findByIdAndUpdate(req.params.id, slide, { new: true });
  if (!updated) return res.status(404).json({ error: "Carousel slide not found." });
  res.json({ slide: updated });
});

router.delete("/carousel/:id", async (req, res) => {
  const slide = await CarouselSlide.findById(req.params.id);
  if (slide?.imagePublicId) {
    await ProductImage.findByIdAndDelete(slide.imagePublicId).catch((error) => {
      if (error.name !== "CastError") throw error;
    });
  }
  await CarouselSlide.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
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
  if (product?.imagePublicId) {
    await ProductImage.findByIdAndDelete(product.imagePublicId).catch((error) => {
      if (error.name !== "CastError") throw error;
    });
  }
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
