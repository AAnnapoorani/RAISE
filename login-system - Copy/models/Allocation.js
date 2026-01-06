// ==========================================
//         ALLOCATION MODEL
// ==========================================
// Schema for tracking hardware/asset allocations to employees

const mongoose = require("mongoose");

// ==========================================
//           SCHEMA DEFINITION
// ==========================================
const allocationSchema = new mongoose.Schema({
  allocated_date: { type: Date, required: true },      // Date of allocation
  allocation_id: { type: String, required: true },     // Unique Allocation ID
  asset_id: { type: String, required: true },          // Asset being allocated
  emp_id: { type: String, required: true },            // Employee receiving asset
  status: { type: String, required: true }             // Allocation status
},{ 
    versionKey: false // Disable __v version key
});

// ==========================================
//           MODEL EXPORT
// ==========================================

module.exports = mongoose.model("allocations", allocationSchema);