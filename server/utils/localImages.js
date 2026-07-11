const fs = require("fs/promises");
const path = require("path");

const uploadRoot = path.join(__dirname, "..", "uploads");
const productImageDir = path.join(uploadRoot, "products");

function getProductImageUrl(filename) {
  return `/uploads/products/${filename}`;
}

function getProductImagePath(filename) {
  const safeName = path.basename(String(filename || ""));
  if (!safeName) return "";
  return path.join(productImageDir, safeName);
}

async function ensureProductImageDir() {
  await fs.mkdir(productImageDir, { recursive: true });
}

async function removeProductImage(filename) {
  const imagePath = getProductImagePath(filename);
  if (!imagePath) return;
  await fs.unlink(imagePath).catch((error) => {
    if (error.code !== "ENOENT") throw error;
  });
}

module.exports = {
  uploadRoot,
  productImageDir,
  getProductImageUrl,
  ensureProductImageDir,
  removeProductImage
};
