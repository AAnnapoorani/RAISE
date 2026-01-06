// ==========================================
//           VENDOR MODEL
// ==========================================
// Schema for supplier/vendor information

const mongoose = require("mongoose");

// ==========================================
//           SCHEMA DEFINITION
// ==========================================
const vendorSchema = new mongoose.Schema({
  gst_number: { type: String },                       // GST Registration Number
  phone: { type: Number, required: true },            // Contact Phone Number
  seller_id: { type: String, required: true },        // Unique Seller/Vendor ID
  seller_name: { type: String, required: true }       // Vendor/Company Name
},{ 
    versionKey: false // Disable __v version key
});

// ==========================================
//           MODEL EXPORT
// ==========================================

module.exports = mongoose.model("vendors", vendorSchema);