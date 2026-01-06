const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  dept: String,
  emp_id: String,
  name: String,
  username: String,
  password: String,  
  role: String
});

module.exports = mongoose.model("users", userSchema);
