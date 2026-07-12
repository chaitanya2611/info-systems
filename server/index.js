require("dotenv").config();

const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const connectDb = require("./config/db");
const seedDatabase = require("./utils/seed");
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const adminRoutes = require("./routes/adminRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const chatRoutes = require("./routes/chatRoutes");
const ProductImage = require("./models/ProductImage");
const { uploadRoot } = require("./utils/localImages");

const app = express();
const PORT = process.env.PORT || 5000;
let dbReady;

app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173", credentials: true }));
app.use("/uploads", express.static(uploadRoot));

function ensureDbReady() {
  if (!dbReady) {
    dbReady = connectDb().then(async (mongoUri) => {
      await seedDatabase();
      return mongoUri;
    });
  }
  return dbReady;
}

app.get("/uploads/products/:id", async (req, res, next) => {
  try {
    await ensureDbReady();
    const image = await ProductImage.findById(req.params.id);
    if (!image) return res.status(404).send("Image not found");
    res.set("Content-Type", image.contentType);
    res.set("Cache-Control", "public, max-age=31536000, immutable");
    res.send(image.data);
  } catch (error) {
    if (error.name === "CastError") return res.status(404).send("Image not found");
    next(error);
  }
});

app.get("/api/health", async (req, res, next) => {
  try {
    await ensureDbReady();
    res.json({ ok: true, database: mongoose.connection.readyState === 1 ? "mongodb" : "disconnected" });
  } catch (error) {
    next(error);
  }
});

app.use("/api", async (req, res, next) => {
  try {
    await ensureDbReady();
    next();
  } catch (error) {
    next(error);
  }
});

app.use("/api", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/chats", chatRoutes);

if (process.env.NODE_ENV === "production") {
  const distPath = path.join(__dirname, "..", "client", "dist");
  app.use(express.static(distPath));
  app.get("/{*splat}", (req, res) => res.sendFile(path.join(distPath, "index.html")));
}

if (require.main === module) {
  ensureDbReady()
    .then((mongoUri) => {
    app.listen(PORT, () => {
      console.log(`MERN API running at http://localhost:${PORT}`);
      console.log(`MongoDB connected: ${mongoUri}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  });
}

module.exports = app;
