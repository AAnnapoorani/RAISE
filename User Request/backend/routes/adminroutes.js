const express = require("express");
const router = express.Router();

const Hardware = require("../models/Hardware");
const HardwareRequest = require("../models/HardwareRequest");
const Allocation = require("../models/Allocation");

// APPROVE & ASSIGN REQUEST
router.post("/assign/:request_id", async (req, res) => {
  try {
    const requestId = Number(req.params.request_id);

    // 1️⃣ Get request
    const request = await HardwareRequest.findOne({ request_id: requestId });
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    // 2️⃣ Get all assets of this type
    const allAssets = await Hardware.find({
      asset_id: request.asset_id
    });

    // 3️⃣ Get assigned asset IDs
    const assigned = await Allocation.find(
      { status: "Assigned" },
      { asset_id: 1, _id: 0 }
    );
    const assignedIds = assigned.map(a => a.asset_id);

    // 4️⃣ Pick FIRST free asset
    const freeAsset = allAssets.find(
      asset => !assignedIds.includes(asset.asset_id)
    );

    if (!freeAsset) {
      return res.status(400).json({ message: "No free assets available" });
    }

    // 5️⃣ Allocate asset
    await Allocation.create({
      asset_id: freeAsset.asset_id,
      emp_id: request.emp_id,
      request_id: request.request_id,
      status: "Assigned"
    });

    // 6️⃣ Update request status
    request.status = "Approved";
    await request.save();

    res.json({
      message: "Asset assigned successfully",
      asset_id: freeAsset.asset_id
    });

  } catch (err) {
    console.error("ASSIGN ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
