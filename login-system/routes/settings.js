// ==========================================
//         SETTINGS ROUTES
// ==========================================
// Handles user account settings and password management

const express = require("express");
const router = express.Router();
const User = require("../models/User");

// ==========================================
//      CHANGE PASSWORD ENDPOINT
// ==========================================
// POST /api/settings/change-password
// Updates user password after verifying current password
router.post("/change-password", async (req, res) => {
    const { emp_id, currentPassword, newPassword } = req.body;

    try {
        // Query: Find user by employee ID
        const user = await User.findOne({ emp_id: emp_id });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Validation: Verify current password using bcrypt
        const isPasswordValid = await user.comparePassword(currentPassword);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Incorrect current password" });
        }

        // Update: Set new password (will be automatically hashed by pre-save middleware)
        user.password = newPassword;
        await user.save();

        res.json({ message: "Password updated successfully" });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ==========================================
//           EXPORT ROUTER
// ==========================================
module.exports = router;