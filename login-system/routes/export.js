// ==========================================
//          EXPORT ROUTES
// ==========================================
// Handles data export for reports (CSV, Excel, PDF)

const express = require("express");
const router = express.Router();
const HardwareRequest = require("../models/HardwareRequest");

// ==========================================
//      EXPORT DATA ENDPOINT
// ==========================================
// GET /api/export/data?from=YYYY-MM-DD&to=YYYY-MM-DD
// Returns all tickets within date range for export
router.get("/data", async (req, res) => {
    try {
        const { from, to } = req.query;

        console.log("Export request - From:", from, "To:", to);

        // Build date filter using order_date field
        let dateFilter = {};
        if (from || to) {
            dateFilter.order_date = {};
            if (from) {
                const fromDate = new Date(from);
                dateFilter.order_date.$gte = fromDate;
                console.log("Filter from:", fromDate);
            }
            if (to) {
                const toDate = new Date(to);
                toDate.setHours(23, 59, 59, 999); // Include entire day
                dateFilter.order_date.$lte = toDate;
                console.log("Filter to:", toDate);
            }
        }

        // Fetch all tickets in date range
        const tickets = await HardwareRequest.find(dateFilter).sort({ order_date: -1 });
        console.log("Found tickets:", tickets.length);

        // Format data for export
        const exportData = tickets.map(t => ({
            request_id: t.request_id,
            asset_name: t.asset_name || "N/A",
            emp_id: t.emp_id || "Unassigned",
            status: t.status || "Pending",
            priority: t.priority || "Normal",
            assigned: t.assigned ? "Yes" : "No",
            createdAt: new Date(t.order_date).toLocaleDateString(),
            description: t.description || ""
        }));

        res.json({
            success: true,
            count: exportData.length,
            data: exportData
        });
    } catch (err) {
        console.error("Export Error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
