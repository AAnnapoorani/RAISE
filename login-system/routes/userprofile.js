// ==========================================
//      USER PROFILE ROUTES
// ==========================================
// Handles user self-service profile viewing and updates

const express = require("express");
const router = express.Router();
const User = require("../models/User");

// ==========================================
//      GET USER PROFILE ENDPOINT
// ==========================================
// GET /api/profile?emp_id=...
// Returns: User profile data (excluding password)
router.get("/", async (req, res) => {
    try {
        const { emp_id } = req.query;
        
        // Validation: Check for employee ID
        if (!emp_id) return res.status(400).json({ message: "Employee ID required" });

        // Query: Fetch user and exclude password
        const user = await User.findOne({ emp_id: emp_id }).select("-password");
        
        if (!user) return res.status(404).json({ message: "User not found" });

        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ==========================================
//      UPDATE USER PROFILE ENDPOINT
// ==========================================
// PUT /api/profile
// Updates user contact and personal information
router.put("/", async (req, res) => {
    try {
        const { emp_id, name, email, phone, location } = req.body;

        // Validation: Check for employee ID
        if (!emp_id) return res.status(400).json({ message: "Employee ID required" });

        // Update: Find and update user document
        const updatedUser = await User.findOneAndUpdate(
            { emp_id: emp_id },
            { 
                name, 
                email, 
                phone, 
                location 
                // NOTE: Dept and Emp ID not updatable via self-service
            },
            { new: true } // Return updated document
        ).select("-password");

        if (!updatedUser) return res.status(404).json({ message: "User not found" });

        res.json({ message: "Profile updated successfully", user: updatedUser });

    } catch (err) {
        console.error("Profile Update Error:", err);
        res.status(500).json({ message: "Failed to update profile" });
    }
});

// ==========================================
//           EXPORT ROUTER
// ==========================================
module.exports = router;