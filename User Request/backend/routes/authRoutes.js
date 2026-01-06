const express = require("express");
const router = express.Router();
const User = require("../models/User");

router.post("/login", async (req, res) => {

  const { username, password, role } = req.body;

  // STEP 6.1 — Empty field check
  if (!username || !password) {
    return res.status(400).json({
      message: "Username and password are required"
    });
  }

  // STEP 6.2 — Find user using schema fields
  const user = await User.findOne({
    username: username,
    role: role
  });

  // STEP 6.3 — If user not found
  if (!user) {
    return res.status(401).json({
      message: "Invalid username or role"
    });
  }

  // STEP 6.4 — Password validation
  if (user.password !== password) {
    return res.status(401).json({
      message: "Incorrect password"
    });
  }

  // STEP 6.5 — Success response
  res.json({
    message: "Login successful",
    emp_id: user.emp_id,
    name: user.name,
    dept: user.dept,
    role: user.role
  });
});

module.exports = router;