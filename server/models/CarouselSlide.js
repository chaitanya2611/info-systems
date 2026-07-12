const mongoose = require("mongoose");

const carouselSlideSchema = new mongoose.Schema(
  {
    eyebrow: { type: String, default: "", trim: true },
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    badge: { type: String, default: "", trim: true },
    buttonLabel: { type: String, default: "Shop now", trim: true },
    buttonRoute: { type: String, default: "#products", trim: true },
    image: { type: String, default: "", trim: true },
    imagePublicId: { type: String, default: "", trim: true },
    sortOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("CarouselSlide", carouselSlideSchema);
