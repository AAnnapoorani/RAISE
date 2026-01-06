const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/it_resource_management");

    console.log("MongoDB Connected");
    console.log("Connected DB name:", mongoose.connection.name);

  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

module.exports = connectDB;
connectDB();
