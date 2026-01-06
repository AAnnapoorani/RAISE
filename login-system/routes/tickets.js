// ==========================================
//          TICKET ROUTES
// ==========================================
// Handles hardware request/ticket creation, status updates, and availability checks
// Includes both user and admin endpoints

const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const HardwareRequest = require("../models/HardwareRequest");
const Hardware = require("../models/Hardware");
const Purchase = require("../models/Purchase");
const { getNextSequence } = require("../utils/counters");
const { requireRole } = require("./roleMiddleware");
// ==========================================
// Create sub-routers for clearer separation
const userRouter = express.Router();
const adminRouter = express.Router();

// Apply role guards at router level
userRouter.use(requireRole(["Employee", "Admin"]));
adminRouter.use(requireRole(["Admin"]));

// ==========================================
//           USER ROUTES
// ==========================================

// CHECK AVAILABILITY
// GET /api/tickets/check-availability?name=Laptop
userRouter.get("/check-availability", async (req, res) => {
    try {
        const { name } = req.query;
        if (!name) return res.json({ available: 0, model: "" });

        const hardware = await Hardware.findOne({ 
            name: { $regex: new RegExp(`^${name}$`, 'i') } 
        });
        
        if (!hardware) {
            return res.json({ available: 0, model: "Not Found in Catalog" });
        }

        const totalStock = hardware.quantity || 0;

        res.json({ 
            available: totalStock, 
            model: hardware.model,
            asset_id: hardware.asset_id 
        });

    } catch (err) {
        console.error("Availability Check Error:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// ==========================================
//      CREATE NEW REQUEST ENDPOINT
// ==========================================
// POST /api/tickets/create
// Creates a new hardware request/ticket
userRouter.post("/create", async (req, res) => {
    const { 
        emp_id, 
        hardware_name, 
        serial_number,
        department,
        dept,
        location,
        issue_type,
        priority, 
        description,
        quantity 
    } = req.body;

    const departmentValue = department || dept || "General";

    // Validation: Required fields
    if (!emp_id || !hardware_name) {
        return res.status(400).json({ message: "Employee ID and Hardware Name are mandatory." });
    }

    try {
        // Resolve Asset ID from hardware catalog
        const hardware = await Hardware.findOne({ name: hardware_name });
        const assetId = hardware ? hardware.asset_id : "AST-MANUAL";

        // Generate unique Request ID (atomic counter to avoid races)
        const requestId = await getNextSequence("request_id", { prefix: "REQ-", pad: 6 });

        // Create new ticket with all details
        const newTicket = new HardwareRequest({
            request_id: requestId,
            emp_id: emp_id,
            asset_id: assetId,
            asset_name: hardware_name,
            serial_number: serial_number || "N/A",
            department: departmentValue,
            location: location || "Unknown",
            issue_type: issue_type || "General",
            priority: priority || "Medium",
            description: description || "",
            quantity: quantity || 1,
            technician_name: "Unassigned",
            status: "Pending",
            order_date: new Date()
        });

        await newTicket.save();

        res.json({ message: "Request created successfully", request_id: requestId });

    } catch (err) {
        console.error("Create Ticket Error:", err);
        res.status(500).json({ message: "Failed to create ticket: " + err.message });
    }
});

// 3. Fetch User History
// GET /api/tickets/user/:emp_id
userRouter.get("/user/:emp_id", async (req, res) => {
    try {
        const { emp_id } = req.params;
        // Fetch requests matching the employee ID, sorted by newest first
        const requests = await HardwareRequest.find({ emp_id: emp_id })
            .sort({ order_date: -1 });
        
        res.json(requests);
    } catch (err) {
        console.error("Error fetching user requests:", err);
        res.status(500).json({ message: "Server Error" });
    }
});


// ==========================================
//              ADMIN ROUTES
// ==========================================

// GET /api/tickets/filter-options
// Returns distinct departments and statuses from database
adminRouter.get("/filter-options", async (req, res) => {
    try {
        // Get distinct departments from hardware_requests and users collections
        const deptPipeline = [
            {
                $lookup: {
                    from: "users",
                    localField: "emp_id",
                    foreignField: "emp_id",
                    as: "user_details"
                }
            },
            { $unwind: { path: "$user_details", preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    department: { $ifNull: ["$department", "$user_details.dept"] }
                }
            },
            {
                $group: {
                    _id: "$department"
                }
            },
            {
                $match: {
                    _id: { $ne: null, $ne: "" }
                }
            },
            { $sort: { _id: 1 } }
        ];

        const departments = await HardwareRequest.aggregate(deptPipeline);
        const deptList = departments.map(d => d._id);

        // Get distinct statuses but only allow the primary three
        const statuses = await HardwareRequest.distinct("status");
        const allowedStatuses = ["Pending", "Approved", "Completed"];
        const statusList = allowedStatuses.filter(s => statuses.includes(s));

        res.json({
            departments: deptList,
            statuses: statusList
        });
    } catch (err) {
        console.error("Filter Options Error:", err);
        res.status(500).json({ message: "Failed to fetch filter options" });
    }
});

// 4. Fetch All Tickets (With Pagination, Search, Filters)
// GET /api/tickets
adminRouter.get("/", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const skip = (page - 1) * limit;

        const search = req.query.search || "";
        const departmentFilter = req.query.department || req.query.dept || "";
        const status = req.query.status || "";
        
        console.log("Filter params:", { search, department: departmentFilter, status });
        
        // Build match conditions dynamically
        const matchConditions = [];
        
        if (search) {
            matchConditions.push({
                $or: [
                    { request_id: { $regex: search, $options: "i" } },
                    { asset_name: { $regex: search, $options: "i" } }
                ]
            });
        }
        
        if (departmentFilter && departmentFilter !== "All Depts" && departmentFilter !== "") {
            matchConditions.push({ department: { $regex: `^${departmentFilter}$`, $options: "i" } });
        }
        
        if (status && status !== "All Statuses" && status !== "") {
            matchConditions.push({ status: status });
        }
        
        console.log("Match conditions:", JSON.stringify(matchConditions, null, 2));
        
        // Pipeline stages
        const pipeline = [
            // Join Hardware (to get Asset Name if missing)
            {
                $lookup: {
                    from: "hardware",
                    localField: "asset_id",
                    foreignField: "asset_id",
                    as: "hardware_details"
                }
            },
            // Join Users (to get Department)
            {
                $lookup: {
                    from: "users",
                    localField: "emp_id",
                    foreignField: "emp_id",
                    as: "user_details"
                }
            },
            { $unwind: { path: "$hardware_details", preserveNullAndEmptyArrays: true } },
            { $unwind: { path: "$user_details", preserveNullAndEmptyArrays: true } },

            // Project fields
            {
                $project: {
                    request_id: 1,
                    order_date: 1,
                    status: 1,
                    priority: { $ifNull: ["$priority", "Medium"] },
                    assigned: { $ifNull: ["$assigned", false] },
                    // Fallback logic for Asset Name: stored name -> hardware table name -> 'Unknown'
                    asset_name: { $ifNull: ["$asset_name", { $ifNull: ["$hardware_details.name", "Unknown Device"] }] },
                    department: { $ifNull: ["$department", { $ifNull: ["$user_details.dept", "General"] }] },
                    // Keep legacy field for compatibility with existing frontend consumers
                    dept: { $ifNull: ["$department", { $ifNull: ["$user_details.dept", "General"] }] },
                    quantity: { $ifNull: ["$quantity", 1] },
                    asset_id: 1
                }
            },

            // Match Filters
            {
                $match: matchConditions.length > 0 ? { $and: matchConditions } : {}
            },

            // Sort & Paginate
            { $sort: { order_date: -1 } },
            {
                $facet: {
                    metadata: [{ $count: "total" }],
                    data: [{ $skip: skip }, { $limit: limit }]
                }
            }
        ];

        const results = await HardwareRequest.aggregate(pipeline);
        const total = results[0].metadata[0] ? results[0].metadata[0].total : 0;
        const tickets = results[0].data;

        res.json({
            tickets: tickets,
            total: total,
            currentPage: page,
            totalPages: Math.ceil(total / limit)
        });

    } catch (err) {
        console.error("API Error:", err);
        res.status(500).json({ message: err.message });
    }
});

// 5. Update Status & Manage Inventory
// PUT /api/tickets/:id/status
// ==========================================
//              ADMIN ROUTES
// ==========================================

// GET /api/tickets/filter-options
adminRouter.get("/filter-options", async (req, res) => {
    try {
        const deptPipeline = [
            {
                $lookup: {
                    from: "users",
                    localField: "emp_id",
                    foreignField: "emp_id",
                    as: "user_details"
                }
            },
            { $unwind: { path: "$user_details", preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    department: { $ifNull: ["$department", "$user_details.dept"] }
                }
            },
            {
                $group: {
                    _id: "$department"
                }
            },
            {
                $match: {
                    _id: { $ne: null, $ne: "" }
                }
            },
            { $sort: { _id: 1 } }
        ];

        const departments = await HardwareRequest.aggregate(deptPipeline);
        const deptList = departments.map(d => d._id);

        const statuses = await HardwareRequest.distinct("status");
        const allowedStatuses = ["Pending", "Approved", "Completed"];
        const statusList = allowedStatuses.filter(s => statuses.includes(s));

        res.json({
            departments: deptList,
            statuses: statusList
        });
    } catch (err) {
        console.error("Filter Options Error:", err);
        res.status(500).json({ message: "Failed to fetch filter options" });
    }
});

// Fetch all tickets (admin list)
adminRouter.get("/", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const skip = (page - 1) * limit;

        const search = req.query.search || "";
        const departmentFilter = req.query.department || req.query.dept || "";
        const status = req.query.status || "";
        
        console.log("Filter params:", { search, department: departmentFilter, status });
        
        const matchConditions = [];
        
        if (search) {
            matchConditions.push({
                $or: [
                    { request_id: { $regex: search, $options: "i" } },
                    { asset_name: { $regex: search, $options: "i" } }
                ]
            });
        }
        
        if (departmentFilter && departmentFilter !== "All Depts" && departmentFilter !== "") {
            matchConditions.push({ department: { $regex: `^${departmentFilter}$`, $options: "i" } });
        }
        
        if (status && status !== "All Statuses" && status !== "") {
            matchConditions.push({ status: status });
        }
        
        const pipeline = [
            {
                $lookup: {
                    from: "hardware",
                    localField: "asset_id",
                    foreignField: "asset_id",
                    as: "hardware_details"
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "emp_id",
                    foreignField: "emp_id",
                    as: "user_details"
                }
            },
            { $unwind: { path: "$hardware_details", preserveNullAndEmptyArrays: true } },
            { $unwind: { path: "$user_details", preserveNullAndEmptyArrays: true } },

            {
                $project: {
                    request_id: 1,
                    order_date: 1,
                    status: 1,
                    priority: { $ifNull: ["$priority", "Medium"] },
                    assigned: { $ifNull: ["$assigned", false] },
                    asset_name: { $ifNull: ["$asset_name", { $ifNull: ["$hardware_details.name", "Unknown Device"] }] },
                    department: { $ifNull: ["$department", { $ifNull: ["$user_details.dept", "General"] }] },
                    dept: { $ifNull: ["$department", { $ifNull: ["$user_details.dept", "General"] }] },
                    quantity: { $ifNull: ["$quantity", 1] },
                    asset_id: 1
                }
            },

            {
                $match: matchConditions.length > 0 ? { $and: matchConditions } : {}
            },

            { $sort: { order_date: -1 } },
            {
                $facet: {
                    metadata: [{ $count: "total" }],
                    data: [{ $skip: skip }, { $limit: limit }]
                }
            }
        ];

        const results = await HardwareRequest.aggregate(pipeline);
        const total = results[0].metadata[0] ? results[0].metadata[0].total : 0;
        const tickets = results[0].data;

        res.json({
            tickets: tickets,
            total: total,
            currentPage: page,
            totalPages: Math.ceil(total / limit)
        });

    } catch (err) {
        console.error("API Error:", err);
        res.status(500).json({ message: err.message });
    }
});

// Admin: update status with stock transaction (existing logic)
adminRouter.put("/:id/status", async (req, res) => {
    try {
        const { status } = req.body;
        const ticketId = req.params.id;

        // MongoDB transaction to guarantee atomic stock deduction + ticket update
        const session = await mongoose.startSession();
        try {
            await session.withTransaction(async () => {
                // Fetch ticket inside the transaction for a consistent snapshot
                const ticket = await HardwareRequest.findOne({ request_id: ticketId }).session(session);

                if (!ticket) {
                    throw new Error("Ticket not found");
                }

                // Block changes if already completed and a different status is requested
                if (ticket.status === "Completed" && status !== "Completed") {
                    throw new Error("Ticket is completed. Admin cannot change status.");
                }

                // INVENTORY LOGIC: deduct only when moving Pending -> Approved/Completed
                if ((status === "Approved" || status === "Completed") && ticket.status === "Pending") {
                    const qtyToDeduct = ticket.quantity || 1;

                    // Prevent negative stock: require sufficient quantity before decrement
                    const updateResult = await Hardware.updateOne(
                        {
                            asset_id: ticket.asset_id,
                            quantity: { $gte: qtyToDeduct }
                        },
                        { $inc: { quantity: -qtyToDeduct } }
                    ).session(session);

                    if (updateResult.matchedCount === 0) {
                        throw new Error("Insufficient stock or hardware not found for deduction.");
                    }
                }

                // Update ticket status
                ticket.status = status;
                await ticket.save({ session });
            }, {
                // Make transaction strict about write conflicts
                writeConcern: { w: "majority" }
            });

            res.json({ message: "Status updated successfully" });
        } catch (err) {
            // Explicit rollback for clarity and to surface meaningful errors
            await session.abortTransaction().catch(() => {});
            console.error("Status Update Error (tx):", err);
            const message = err?.message || "Failed to update status";
            res.status(message.includes("not found") ? 404 : 400).json({ message });
        } finally {
            session.endSession();
        }
    } catch (err) {
        console.error("Status Update Error:", err);
        res.status(500).json({ message: err.message });
    }
});

// Update Priority
adminRouter.put("/:id/priority", async (req, res) => {
    try {
        const { priority } = req.body;

        // Fetch ticket to enforce locks
        const ticket = await HardwareRequest.findOne({ request_id: req.params.id });
        if (!ticket) return res.status(404).json({ message: "Ticket not found" });

        // If user has completed the ticket, admin cannot change anything
        if (ticket.status === "Completed") {
            return res.status(400).json({ message: "Ticket is completed. Admin cannot change priority." });
        }

        // If technician already assigned, lock priority
        if (ticket.assigned === true) {
            return res.status(400).json({ message: "Technician assigned. Priority is locked." });
        }

        ticket.priority = priority;
        await ticket.save();

        res.json({ message: "Priority updated" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update Assignment
adminRouter.put("/:id/assignment", async (req, res) => {
    try {
        const { assigned, technician_name } = req.body; // assigned is boolean, technician_name optional

        // Fetch ticket to enforce locks
        const ticket = await HardwareRequest.findOne({ request_id: req.params.id });
        if (!ticket) return res.status(404).json({ message: "Ticket not found" });

        // If user has completed the ticket, admin cannot change anything
        if (ticket.status === "Completed") {
            return res.status(400).json({ message: "Ticket is completed. Admin cannot change assignment." });
        }

        // If already assigned, prevent further edits
        if (ticket.assigned === true) {
            return res.status(400).json({ message: "Technician already assigned. Assignment is locked." });
        }

        // If assigned=true, automatically set status to Approved
        ticket.assigned = assigned;
        if (assigned === true) {
            ticket.status = "Approved";
            if (technician_name) {
                ticket.technician_name = technician_name;
            }
        } else {
            ticket.technician_name = "Unassigned";
        }

        await ticket.save();
        res.json({ message: "Assignment updated" + (assigned ? " - Status set to Approved" : "") });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ==========================================
//      USER STATUS UPDATE ENDPOINT
// ==========================================
// PUT /api/tickets/:id/user-status
// Only users can update their own ticket status (not admins)
userRouter.put("/:id/user-status", async (req, res) => {
    try {
        const { emp_id, status } = req.body;
        const ticketId = req.params.id;

        // Validation: emp_id is required
        if (!emp_id) {
            return res.status(400).json({ message: "Employee ID is required" });
        }

        // Validation: status is required
        if (!status) {
            return res.status(400).json({ message: "Status is required" });
        }

        // Find ticket
        const ticket = await HardwareRequest.findOne({ request_id: ticketId });

        if (!ticket) {
            return res.status(404).json({ message: "Ticket not found" });
        }

        // If already completed, block further user edits
        if (ticket.status === "Completed") {
            return res.status(400).json({ message: "Ticket is already completed. Status cannot be changed." });
        }

        // Security: Verify user owns this ticket
        if (ticket.emp_id !== emp_id) {
            return res.status(403).json({ message: "You can only update your own tickets" });
        }

        // Validation: Check allowed statuses based on assignment status
        let allowedStatuses;
        if (ticket.assigned === true) {
            // If technician is assigned, only allow Completed
            allowedStatuses = ["Completed"];
        } else {
            // If technician is NOT assigned, allow Pending or Completed
            allowedStatuses = ["Pending", "Completed"];
        }

        if (!allowedStatuses.includes(status)) {
            const assignmentStatus = ticket.assigned ? "assigned" : "not assigned";
            return res.status(400).json({ 
                message: `Since technician is ${assignmentStatus}, you can only update status to: ${allowedStatuses.join(" or ")}` 
            });
        }

        // Update status
        ticket.status = status;
        await ticket.save();

        res.json({ 
            message: "Ticket status updated successfully",
            status: ticket.status
        });

    } catch (err) {
        console.error("User Status Update Error:", err);
        res.status(500).json({ message: err.message });
    }
});

// ==========================================
//      GET USER'S ALLOCATED HARDWARE
// ==========================================
// GET /api/tickets/user-hardware/:emp_id
// Returns hardware assets allocated to the specific employee
userRouter.get("/user-hardware/:emp_id", async (req, res) => {
    try {
        const { emp_id } = req.params;
        const Allocation = require("../models/Allocation");

        // Find all allocations for this employee with active status
        const allocations = await Allocation.find({ 
            emp_id: emp_id,
            status: { $in: ["Active", "Allocated"] }
        });

        if (!allocations || allocations.length === 0) {
            return res.json({ hardware: [] });
        }

        // Get asset_ids from allocations
        const asset_ids = allocations.map(a => a.asset_id);

        // Fetch hardware details for these assets
        const hardwareList = await Hardware.find({ asset_id: { $in: asset_ids } });

        res.json({ 
            hardware: hardwareList.map(hw => ({
                asset_id: hw.asset_id,
                name: hw.name,
                model: hw.model,
                brand: hw.brand
            }))
        });

    } catch (err) {
        console.error("User Hardware Fetch Error:", err);
        res.status(500).json({ message: "Failed to fetch user hardware", error: err.message });
    }
});

// Mount sub-routers
router.use(userRouter);
router.use(adminRouter);

module.exports = router;