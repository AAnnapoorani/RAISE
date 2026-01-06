// ==========================================
//       ACKNOWLEDGEMENT MODEL
// ==========================================
// Schema for tracking employee acknowledgements of asset allocations

const mongoose = require("mongoose");

// ==========================================
//           SCHEMA DEFINITION
// ==========================================
const acknowledgementSchema = new mongoose.Schema({
  ack_date: { type: Date, required: true },           // Date of acknowledgement
  acknowledged: { type: Boolean, required: true },    // Acknowledgement status
  allocation_id: { type: String, required: true },    // Related Allocation ID
  emp_id: { type: String, required: true }            // Employee ID
},
{ 
    versionKey: false // Disable __v version key
});

// ==========================================
//           MODEL EXPORT
// ==========================================

module.exports = mongoose.model("acknowledgements", acknowledgementSchema);