// ==========================================
//         INVENTORY ROUTES
// ==========================================
// Manages inventory data, purchase records, and stock information
// Includes CRUD operations for inventory items

const express = require("express");
const router = express.Router();
const Purchase = require("../models/Purchase");
const Vendor = require("../models/Vendor");
const Hardware = require("../models/Hardware");
const { getNextSequence } = require("../utils/counters");

// ==========================================
//      GET INVENTORY LIST ENDPOINT
// ==========================================
// GET /api/inventory

router.get("/", async (req, res) => {
    try {
        // Pagination parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const skip = (page - 1) * limit;

        // Filters
        const search = req.query.search || "";
        const category = req.query.category || "All";
        const status = req.query.status || "Any";

        // Aggregation pipeline: Join Purchase, Vendor, and Hardware collections
        const pipeline = [
            // Join with Vendors collection
            {
                $lookup: {
                    from: "vendors",
                    localField: "seller_id",
                    foreignField: "seller_id",
                    as: "vendor_details"
                }
            },
            { $unwind: { path: "$vendor_details", preserveNullAndEmptyArrays: true } },
            // Join with Hardware collection
            {
                $lookup: {
                    from: "hardware",
                    localField: "asset_name",
                    foreignField: "name",
                    as: "hw_details"
                }
            },
            { $unwind: { path: "$hw_details", preserveNullAndEmptyArrays: true } },
            // Project desired fields and compute stock status
            {
                $project: {
                    _id: 1,
                    item_name: "$asset_name",
                    sku: { 
                        $concat: [
                            { $ifNull: ["$hw_details.brand", "Generic"] }, 
                            " - ", 
                            { $ifNull: ["$hw_details.model", "Unknown Model"] }
                        ] 
                    },
                    category: { $ifNull: ["$hw_details.name", "$asset_name"] },
                    stock: "$quantity",
                    seller: { $ifNull: ["$vendor_details.seller_name", "Unknown Supplier"] },
                    arrival_date: 1,
                    stock_status: {
                        $switch: {
                            branches: [
                                { case: { $lte: ["$quantity", 0] }, then: "Out of Stock" },
                                { case: { $lt: ["$quantity", 5] }, then: "Low Stock" }
                            ],
                            default: "In Stock"
                        }
                    }
                }
            },
        ];

        // Filters
        const match = {};
        if (search) {
            match.$or = [
                { item_name: { $regex: search, $options: "i" } },
                { sku: { $regex: search, $options: "i" } },
                { seller: { $regex: search, $options: "i" } }
            ];
        }
        if (category && category !== "All") {
            match.category = { $regex: `^${category}$`, $options: "i" };
        }
        if (status && status !== "Any") {
            match.stock_status = status;
        }

        if (Object.keys(match).length > 0) {
            pipeline.push({ $match: match });
        }

        // Sort newest first
        pipeline.push({ $sort: { arrival_date: -1 } });

        // Pagination with metadata
        pipeline.push({
            $facet: {
                metadata: [{ $count: "total" }],
                data: [{ $skip: skip }, { $limit: limit }]
            }
        });

        const results = await Purchase.aggregate(pipeline);

        const total = results[0].metadata[0] ? results[0].metadata[0].total : 0;
        const items = results[0].data;

        // Returns: Paginated inventory list with vendor and hardware details
        res.json({
            items: items,
            total: total,
            currentPage: page,
            totalPages: Math.ceil(total / limit)
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ==========================================
//      FILTER OPTIONS ENDPOINT
// ==========================================
// GET /api/inventory/filter-options
router.get("/filter-options", async (req, res) => {
    try {
        // Distinct categories from purchases/hardware names
        const categories = await Purchase.distinct("asset_name");
        const categoryList = categories.filter(Boolean).sort();

        // Statuses are derived from stock quantity
        const statuses = ["In Stock", "Low Stock", "Out of Stock"];

        res.json({ categories: categoryList, statuses });
    } catch (err) {
        console.error("Inventory filter options error:", err);
        res.status(500).json({ message: "Failed to fetch filter options" });
    }
});

// ==========================================
//      ADD NEW INVENTORY ITEM ENDPOINT
// ==========================================
// POST /api/inventory/add
// Creates new inventory item with vendor and hardware details
router.post("/add", async (req, res) => {
    // Destructure request body
    const { 
        itemName, brand, model, supplier, 
        phone, gst, 
        purchase_id, seller_id, quantity, arrival_date 
    } = req.body;

    // Validation: Required fields
    if (!itemName || !brand || !model || !supplier) {
        return res.status(400).json({ message: "Item Name, Brand, Model, and Supplier are required." });
    }

    try {
        // ==========================================
        //         VENDOR HANDLING
        // ==========================================
        let finalSellerId = "";
        let vendor = await Vendor.findOne({ seller_name: supplier });

        if (vendor) {
            // Use existing vendor
            finalSellerId = vendor.seller_id;
        } else {
            // Create new vendor with phone and GST
            finalSellerId = seller_id || ("VEN-" + Math.floor(1000 + Math.random() * 9000));
            
            vendor = new Vendor({
                seller_name: supplier,
                seller_id: finalSellerId,
                phone: phone || 9999999999, // Store phone from form
                gst_number: gst || "N/A"    // Store GST from form
            });
            await vendor.save();
        }

        // --- 2. Handle Hardware (Auto-Increment Asset ID via counters) ---
        let hardware = await Hardware.findOne({ name: itemName });
        
        if (!hardware) {
            const newAssetId = await getNextSequence("asset_id", { prefix: "AST-", pad: 5, startAt: 10001 });

            hardware = new Hardware({
                asset_id: newAssetId,
                name: itemName,
                brand: brand,
                model: model
            });
            await hardware.save();
        }

        // --- 3. Create Purchase (Stock with Quantity) ---
        const newPurchase = new Purchase({
            asset_name: itemName,
            purchase_id: purchase_id || ("PUR-" + Date.now()),
            quantity: parseInt(quantity) || 1, // Store quantity from form
            seller_id: finalSellerId,
            arrival_date: arrival_date ? new Date(arrival_date) : new Date()
        });

        await newPurchase.save();

        res.json({ message: "Item added successfully", id: newPurchase._id });

    } catch (err) {
        console.error("Error adding item:", err);
        res.status(500).json({ message: "Failed to add item: " + err.message });
    }
});

module.exports = router;