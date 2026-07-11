function cleanProduct(input) {
  const product = {
    name: String(input.name || "").trim(),
    category: String(input.category || "Accessory").trim(),
    mrp: Number(input.mrp || input.price),
    price: Number(input.price),
    stock: Math.floor(Number(input.stock)),
    image: String(input.image || "").trim(),
    imagePublicId: String(input.imagePublicId || "").trim(),
    description: String(input.description || "").trim()
  };
  if (!product.name || !product.description || !Number.isFinite(product.price) || product.price <= 0) return null;
  if (!Number.isFinite(product.mrp) || product.mrp <= 0) return null;
  if (!Number.isFinite(product.stock) || product.stock < 0) return null;
  return product;
}

module.exports = { cleanProduct };
