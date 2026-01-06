// ==========================================
//           HARDWARE MODEL
// ==========================================
// Schema for hardware/asset inventory catalog

const mongoose = require("mongoose");

// ==========================================
//           SCHEMA DEFINITION
// ==========================================
const hardwareSchema = new mongoose.Schema({
  asset_id: { type: String, required: true },   // Unique Asset ID
  brand: { type: String, required: true },      // Manufacturer Brand
  model: { type: String, required: true },      // Model Number/Name
  name: { type: String, required: true },       // Hardware Type/Name
  quantity: { type: Number, default: 0 }        // Available stock quantity
},{ 
    versionKey: false // Disable __v version key
});

// ==========================================
//           MODEL EXPORT
// ==========================================

// Explicitly set collection name to match existing database collection
module.exports = mongoose.model("hardware", hardwareSchema, "hardware");