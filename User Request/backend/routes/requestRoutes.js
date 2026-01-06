const express = require("express");
const router = express.Router();

const Hardware = require("../models/Hardware");
const HardwareRequest = require("../models/HardwareRequest");
const Allocation = require("../models/Allocation");

router.post("/", async (req, res) => {
  try {
    const { emp_id, name, model, quantity } = req.body;

    if (!emp_id || !name || !model || !quantity) {
      return res.status(400).json({ message: "Missing fields" });
    }

    if (quantity !== 1) {
      return res.status(400).json({
        message: "Only 1 asset can be allocated per request"
      });
    }

    // 1️⃣ Get all matching hardware
    const allAssets = await Hardware.find({ name, model });

    if (allAssets.length === 0) {
      return res.status(404).json({ message: "No such hardware exists" });
    }

    // 2️⃣ Get assigned asset IDs
    const assignedAssets = await Allocation.find(
      { status: "Assigned" },
      { asset_id: 1, _id: 0 }
    );
    const assignedIds = assignedAssets.map(a => a.asset_id);

    // 3️⃣ Find FIRST free asset
    const freeAsset = allAssets.find(
      asset => !assignedIds.includes(asset.asset_id)
    );

    // 4️⃣ Auto-increment request_id
    const lastRequest = await HardwareRequest
      .findOne()
      .sort({ request_id: -1 });

    const nextRequestId = lastRequest ? lastRequest.request_id + 1 : 1;

    // 5️⃣ If no asset is free → reject request
    if (!freeAsset) {
      await HardwareRequest.create({
        request_id: nextRequestId,
        emp_id,
        asset_id: null,
        quantity,
        status: "Rejected",
        order_date: new Date()
      });

      return res.status(400).json({
        message: "No assets available. Request rejected."
      });
    }

    // 6️⃣ Save request as Allocated
    await HardwareRequest.create({
      request_id: nextRequestId,
      emp_id,
      asset_id: freeAsset.asset_id,
      quantity,
      status: "Allocated",
      order_date: new Date()
    });

    // 7️⃣ Create allocation
    await Allocation.create({
      asset_id: freeAsset.asset_id,
      emp_id,
      request_id: nextRequestId,
      status: "Assigned"
    });

    res.status(201).json({
      message: "Asset allocated successfully",
      request_id: nextRequestId,
      asset_id: freeAsset.asset_id
    });

  } catch (err) {
    console.error("AUTO-ALLOCATION ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
