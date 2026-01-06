const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema({
  request_id: Number,
  asset_id: String,
  emp_id: String,
  quantity: Number,
  status: String,
  order_date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("HardwareRequest", requestSchema, "hardware_request");
