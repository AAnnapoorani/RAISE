// ==========================================
//           USER MODEL
// ==========================================
// Schema for user authentication and profile data

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

// ==========================================
//           SCHEMA DEFINITION
// ==========================================
const userSchema = new mongoose.Schema({
  // Store in `dept` field, expose `department` alias for consistent naming
  dept: { type: String, alias: "department" },
  emp_id: String,         // Employee ID
  name: String,           // Full Name
  username: String,       // Login Username
  password: String,       // Password (hashed with bcrypt)
  role: String            // User Role (admin/user)
},{ 
    versionKey: false      // Disable __v version key
});

// ==========================================
//           PASSWORD HASHING MIDDLEWARE
// ==========================================
// Automatically hash password before saving
userSchema.pre('save', async function() {
  // Only hash if password is modified or new
  if (!this.isModified('password')) return;

  // Generate salt and hash password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// ==========================================
//           PASSWORD COMPARISON METHOD
// ==========================================
// Method to compare plain text password with hashed password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// ==========================================
//           MODEL EXPORT
// ==========================================

module.exports = mongoose.model("users", userSchema);
