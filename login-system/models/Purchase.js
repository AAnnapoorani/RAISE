// ==========================================
//          PURCHASE MODEL
// ==========================================
// Schema for tracking hardware/asset purchases

const mongoose = require("mongoose");

// ==========================================
//           SCHEMA DEFINITION
// ==========================================
const purchaseSchema = new mongoose.Schema({
  arrival_date: { type: Date, required: true },       // Date of purchase arrival
  asset_name: { type: String, required: true },       // Name of purchased asset
  purchase_id: { type: String, required: true },      // Unique Purchase ID
  quantity: { type: Number, required: true },         // Quantity purchased
  seller_id: { type: String, required: true }         // Vendor/Seller ID
},{ 
    versionKey: false // Disable __v version key
});

// ==========================================
//           MODEL EXPORT
// ==========================================

module.exports = mongoose.model("purchases", purchaseSchema);