const mongoose = require("mongoose");

const AllocationSchema = new mongoose.Schema({
  asset_id: {
    type: String,
    required: true
  },
  emp_id: {
    type: String,
    required: true
  },
  request_id: {
    type: Number,
    required: true
  },
  allocated_date: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ["Assigned", "Returned"],
    default: "Assigned"
  }
});

module.exports = mongoose.model("Allocation", AllocationSchema, "allocations");
