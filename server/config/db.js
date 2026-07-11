const mongoose = require("mongoose");

async function connectDb() {
  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/infosystems";
  await mongoose.connect(mongoUri);
  return mongoUri;
}

module.exports = connectDb;
