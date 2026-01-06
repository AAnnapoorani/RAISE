// ==========================================
//      HARDWARE REQUEST MODEL
// ==========================================
// Schema for user hardware/asset requests and tickets

const mongoose = require("mongoose");

// ==========================================
//           SCHEMA DEFINITION
// ==========================================

const hardwareRequestSchema = new mongoose.Schema(
  {
    asset_id: {
      type: String,
      required: true,
    },

    asset_name: {
      type: String,
      required: true,
    },

    emp_id: {
      type: String,
      required: true,
    },

    // Primary field `department`; alias `dept` for backward compatibility
    department: {
      type: String,
      required: true,
      default: "General",
      alias: "dept"
    },

    order_date: {
      type: Date,
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
    },

    request_id: {
      type: String,
      required: true,
      unique: true,
    },

    status: {
      type: String,
      required: true,
      enum: ["Pending", "Approved", "Completed","Rejected"],
      default: "Pending",
    },

    assigned: {
      type: Boolean,
      required: true,
      default: false,
    },

    allocated: {
      type: Boolean,
      required: true,
      default: false,
    },

    priority: {
      type: String,
      required: true,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },

    description: {
      type: String,
      required: true,
    },

    technician_name: {
      type: String,
      required: true,
      default: "Unassigned",
    },
  },
  {
    versionKey: false,
    timestamps: {
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    },
  }
);

// ==========================================
//           MODEL EXPORT
// ==========================================

module.exports = mongoose.model("hardware_request", hardwareRequestSchema, "hardware_request");