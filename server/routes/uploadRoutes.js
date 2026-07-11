const express = require("express");
const multer = require("multer");
const { auth, adminOnly } = require("../middleware/auth");
const { ensureProductImageDir, getProductImageUrl, productImageDir, removeProductImage } = require("../utils/localImages");

const router = express.Router();
const imageExtensions = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif"
};

const upload = multer({
  storage: multer.diskStorage({
    destination: async (req, file, cb) => {
      try {
        await ensureProductImageDir();
        cb(null, productImageDir);
      } catch (error) {
        cb(error);
      }
    },
    filename: (req, file, cb) => {
      const extension = imageExtensions[file.mimetype] || ".img";
      cb(null, `product-${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`);
    }
  }),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) return cb(new Error("Only image files are allowed."));
    cb(null, true);
  }
});

router.post("/product-image", auth, adminOnly, upload.single("image"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Choose an image to upload." });

  res.status(201).json({
    imageUrl: getProductImageUrl(req.file.filename),
    publicId: req.file.filename
  });
});

router.delete("/product-image", auth, adminOnly, async (req, res) => {
  const publicId = String(req.body.publicId || "").trim();
  if (!publicId) return res.status(400).json({ error: "Image filename is required." });
  await removeProductImage(publicId);
  res.json({ ok: true });
});

module.exports = router;
