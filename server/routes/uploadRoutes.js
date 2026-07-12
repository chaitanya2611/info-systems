const express = require("express");
const multer = require("multer");
const { auth, adminOnly } = require("../middleware/auth");
const ProductImage = require("../models/ProductImage");

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) return cb(new Error("Only image files are allowed."));
    cb(null, true);
  }
});

router.post("/product-image", auth, adminOnly, upload.single("image"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Choose an image to upload." });
  const image = await ProductImage.create({
    filename: req.file.originalname || "product-image",
    contentType: req.file.mimetype,
    size: req.file.size,
    data: req.file.buffer
  });

  res.status(201).json({
    imageUrl: `/uploads/products/${image._id}`,
    publicId: String(image._id)
  });
});

router.delete("/product-image", auth, adminOnly, async (req, res) => {
  const publicId = String(req.body.publicId || "").trim();
  if (!publicId) return res.status(400).json({ error: "Image id is required." });
  await ProductImage.findByIdAndDelete(publicId).catch((error) => {
    if (error.name !== "CastError") throw error;
  });
  res.json({ ok: true });
});

module.exports = router;
