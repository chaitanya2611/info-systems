const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    customerName: String,
    customerEmail: String,
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        name: String,
        price: Number,
        quantity: Number
      }
    ],
    total: Number,
    status: { type: String, enum: ["Processing", "Ready", "Completed", "Cancelled"], default: "Processing" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
