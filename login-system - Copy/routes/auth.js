// ==========================================
//        AUTHENTICATION ROUTES
// ==========================================
// Handles user login and authentication

const express = require("express");
const router = express.Router();
const User = require('../models/User');

// ==========================================
//           LOGIN ENDPOINT
// ==========================================

// POST /api/login
router.post("/login", async (req, res) => {

  const { username, password, role } = req.body;

  // Validation: Empty field check
  if (!username || !password) {
    return res.status(400).json({
      message: "Username and password are required"
    });
  }

  // Database Query: Find user by username and role
  const user = await User.findOne({
    username: username,
    role: role
  });

  // Validation: User not found
  if (!user) {
    return res.status(401).json({
      message: "Invalid username or role"
    });
  }

  // Validation: Password verification using bcrypt with plaintext fallback (for legacy records)
  let isPasswordValid = false;

  // Attempt bcrypt comparison first
  try {
    isPasswordValid = await user.comparePassword(password);
  } catch (err) {
    console.error("Password compare error:", err);
    isPasswordValid = false;
  }

  // Fallback: if legacy plaintext matches, re-hash to migrate the record
  if (!isPasswordValid && user.password === password) {
    user.password = password; // pre-save hook will hash
    await user.save();
    isPasswordValid = true;
  }

  if (!isPasswordValid) {
    return res.status(401).json({
      message: "Incorrect password"
    });
  }

  // Success: Return user data
  const department = user.department || user.dept;

  res.json({
    message: "Login successful",
    emp_id: user.emp_id,
    name: user.name,
    department,
    dept: department, // backward compatibility
    role: user.role
  });
});

// ==========================================
//           EXPORT ROUTER
// ==========================================
module.exports = router;
