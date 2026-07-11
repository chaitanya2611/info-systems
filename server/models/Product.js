const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    mrp: { type: Number, default: 0, min: 0 },
    price: { type: Number, required: true, min: 1 },
    stock: { type: Number, required: true, min: 0 },
    image: { type: String, default: "" },
    imagePublicId: { type: String, default: "" },
    description: { type: String, required: true, trim: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
