// ==========================================
//      ADMIN PROFILE ROUTES
// ==========================================
// Handles admin user profile viewing and updates

const express = require("express");
const router = express.Router();
const User = require("../models/User");

// ==========================================
//      GET PROFILE ENDPOINT
// ==========================================
// GET /api/profile?emp_id=123
// Returns: User profile data (excluding password)
router.get("/", async (req, res) => {
    const empId = req.query.emp_id;
    
    // Validation: Check for employee ID
    if (!empId) {
        return res.status(400).json({ message: "Employee ID required" });
    }

    try {
        // Query: Fetch user and exclude password field
        const user = await User.findOne({ emp_id: empId }).select("-password");
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ==========================================
//      UPDATE PROFILE ENDPOINT
// ==========================================
// PUT /api/profile/update
// Updates user name and department
router.put("/update", async (req, res) => {
    const { emp_id, name, department, dept } = req.body;

    try {
        const deptValue = department || dept;
        // Update: Find and update user document
        const updatedUser = await User.findOneAndUpdate(
            { emp_id: emp_id },
            { $set: { name: name, dept: deptValue } },
            { new: true } // Return the updated document
        );

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        // Response: Return updated profile data
        res.json({
            message: "Profile updated successfully",
            user: {
                name: updatedUser.name,
                department: updatedUser.department || updatedUser.dept,
                dept: updatedUser.department || updatedUser.dept, // backward compatibility
                role: updatedUser.role,
                emp_id: updatedUser.emp_id
            }
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ==========================================
//           EXPORT ROUTER
// ==========================================
module.exports = router;