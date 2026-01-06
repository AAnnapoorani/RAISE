// ==========================================
//      USER DASHBOARD ROUTES
// ==========================================
// Provides user-specific dashboard statistics and activity data

const express = require("express");
const router = express.Router();
const HardwareRequest = require("../models/HardwareRequest");
const Hardware = require("../models/Hardware");

// ==========================================
//      USER STATISTICS ENDPOINT
// ==========================================
// GET /api/user/dashboard/stats?emp_id=...
// Returns: Total, pending, and completed tickets for specific user
router.get("/stats", async (req, res) => {
    try {
        const { emp_id } = req.query;

        // Validation: Check for employee ID
        if (!emp_id) {
            return res.status(400).json({ message: "Employee ID required" });
        }

        // Count: Total tickets for this user
        const totalTickets = await HardwareRequest.countDocuments({ emp_id: emp_id });

        // Count: Pending requests (case insensitive)
        const pendingTickets = await HardwareRequest.countDocuments({ 
            emp_id: emp_id,
            status: { $regex: /^pending$/i }
        });

        // Count: Completed requests (case insensitive)
        const completedTickets = await HardwareRequest.countDocuments({ 
            emp_id: emp_id,
            status: { $regex: /^completed$/i }
        });

        // Response: User dashboard statistics
        res.json({
            total: totalTickets,
            pending: pendingTickets,
            completed: completedTickets
        });

    } catch (err) {
        console.error("User Dashboard Stats Error:", err);
        res.status(500).json({ message: err.message });
    }
});

// ==========================================
//      USER ACTIVITY ENDPOINT
// ==========================================
// GET /api/user/dashboard/activity?emp_id=...
// Returns: Recent 5 requests with hardware details for specific user
router.get("/activity", async (req, res) => {
    try {
        const { emp_id } = req.query;

        // Validation: Check for employee ID
        if (!emp_id) {
            return res.status(400).json({ message: "Employee ID required" });
        }

        // Aggregation: Fetch recent requests with hardware details
        const activities = await HardwareRequest.aggregate([
            { $match: { emp_id: emp_id } },
            { $sort: { order_date: -1 } },
            { $limit: 5 },
            // Join with Hardware collection
            {
                $lookup: {
                    from: "hardware",
                    localField: "asset_id",
                    foreignField: "asset_id",
                    as: "hardware_details"
                }
            },
            { $unwind: { path: "$hardware_details", preserveNullAndEmptyArrays: true } },
            // Project desired fields
            {
                $project: {
                    request_id: 1,
                    order_date: 1,
                    status: 1,
                    model: { $ifNull: ["$hardware_details.name", "General Request"] },
                    issue: { $ifNull: ["$priority", "Maintenance"] } 
                }
            }
        ]);

        res.json(activities);

    } catch (err) {
        console.error("User Dashboard Activity Error:", err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;