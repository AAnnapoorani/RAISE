const express = require("express");
const router = express.Router();

const Hardware = require("../models/Hardware");
const Allocation = require("../models/Allocation");

// GET HARDWARE NAMES
router.get("/names", async (req, res) => {
  try {
    const names = await Hardware.distinct("name");
    res.json(names);
  } catch (err) {
    console.error("NAMES ERROR:", err);
    res.status(500).json([]);
  }
});

// GET MODELS BY NAME
router.get("/models", async (req, res) => {
  try {
    const { name } = req.query;
    if (!name) return res.json([]);

    const models = await Hardware.distinct("model", { name });
    res.json(models);
  } catch (err) {
    console.error("MODELS ERROR:", err);
    res.status(500).json([]);
  }
});

//GET AVAILABLE COUNT
router.get("/count", async (req, res) => {
  try {
    const { name, model } = req.query;
    if (!name || !model) return res.json({ available: 0 });

    const allAssets = await Hardware.find({ name, model });

    const assignedAssets = await Allocation.find(
      { status: "Assigned" },
      { asset_id: 1, _id: 0 }
    );

    const assignedIds = assignedAssets.map(a => a.asset_id);

    const availableAssets = allAssets.filter(
      asset => !assignedIds.includes(asset.asset_id)
    );

    res.json({ available: availableAssets.length });

  } catch (err) {
    console.error("COUNT ERROR:", err);
    res.status(500).json({ available: 0 });
  }
});

module.exports = router;
