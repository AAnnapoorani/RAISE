const mongoose = require("mongoose");

const hardwareSchema = new mongoose.Schema({
  asset_id: String,
  name: String,
  brand: String,
  model: String
});

module.exports = mongoose.model(
  "Hardware",
  hardwareSchema,
  "hardware"  // 👈 EXACT collection name from Compass
);

