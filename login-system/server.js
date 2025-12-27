const express = require("express");
const mongoose = require("mongoose");

const app = express();

app.use(express.json());
app.use(express.static("public"));

mongoose.connect("mongodb://127.0.0.1:27017/it_resource_management")
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

const authRoutes = require("./routes/auth");
app.use("/api", authRoutes);

app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
