const mongoose = require("mongoose");

const productImageSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true, trim: true },
    contentType: { type: String, required: true, trim: true },
    size: { type: Number, required: true, min: 1 },
    data: { type: Buffer, required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("ProductImage", productImageSchema);
