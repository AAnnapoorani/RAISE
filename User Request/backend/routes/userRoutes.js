const router = require("express").Router();
const User = require("../models/User");

router.get("/:emp_id", async (req, res) => {
  const user = await User.findOne({ emp_id: req.params.emp_id });
  res.json(user);
});

module.exports = router;
