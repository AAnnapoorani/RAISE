// ==========================================
//           COUNTER MODEL
// ==========================================
// Tracks auto-increment sequences for various entities

const mongoose = require("mongoose");

const counterSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true }, // counter name/key
    seq: { type: Number, default: 0 },     // current sequence value
  },
  { versionKey: false }
);

module.exports = mongoose.model("counters", counterSchema);
