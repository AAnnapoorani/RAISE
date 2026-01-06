// ==========================================
//         DASHBOARD ROUTES
// ==========================================
// Provides admin dashboard statistics and data

const express = require("express");
const router = express.Router();
const HardwareRequest = require("../models/HardwareRequest");
const Hardware = require("../models/Hardware");

// ==========================================
//      DASHBOARD STATISTICS ENDPOINT
// ==========================================
// GET /api/dashboard/stats
router.get("/stats", async (req, res) => {
    try {
        // Debug: Get all distinct statuses
        const allStatuses = await HardwareRequest.distinct("status");

        // Count: Total Requests
        const totalRequests = await HardwareRequest.countDocuments();

        // Count: Pending Requests (case insensitive)
        const pendingRequests = await HardwareRequest.countDocuments({ 
            status: { $regex: /^pending$/i } 
        });

        // Count: Completed Requests (case insensitive)
        const completedRequests = await HardwareRequest.countDocuments({ 
            status: { $regex: /^completed$/i } 
        });

        // Query: Recent Activity (last 5 requests)
        const recentRequests = await HardwareRequest.find()
            .sort({ order_date: -1 })
            .limit(5);


        // Returns: total requests, pending, completed, and recent activity
        // Response: Dashboard statistics
        res.json({
            total: totalRequests,
            pending: pendingRequests,
            completed: completedRequests,
            recent_activity: recentRequests
        });

    } catch (err) {
        console.error("❌ Dashboard API Error:", err);
        res.status(500).json({ message: err.message });
    }
});

// ==========================================
//      HARDWARE NAME LOOKUP ENDPOINT
// ==========================================
// GET /api/dashboard/hardware-name/:assetId

router.get("/hardware-name/:assetId", async (req, res) => {
    try {
        const item = await Hardware.findOne({ asset_id: req.params.assetId });
        // Returns: Hardware name for given asset ID
        res.json({ name: item ? item.name : "Unknown Asset" });
    } catch (err) {
        res.json({ name: "Error" });
    }
});



module.exports = router;