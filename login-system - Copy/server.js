// ==========================================
//        DEPENDENCIES & INITIALIZATION
// ==========================================
const express = require("express");
const mongoose = require("mongoose");

const app = express();

// ==========================================
//           MIDDLEWARE SETUP
// ==========================================
app.use(express.json());
app.use(express.static("public"));

// ==========================================
//        DATABASE CONNECTION
// ==========================================
mongoose.connect("mongodb://127.0.0.1:27017/it_resource_management")
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

// ==========================================
//        ADMIN SIDE ROUTES
// ==========================================

// Auth Routes
const authRoutes = require("./routes/auth");
app.use("/api", authRoutes);

// Dashboard Routes
const dashboardRoutes = require("./routes/dashboard");
app.use("/api/dashboard", dashboardRoutes);

// Ticket Routes
const ticketRoutes = require("./routes/tickets");
app.use("/api/tickets", ticketRoutes);

// Inventory Routes
const inventoryRoutes = require("./routes/inventory");
app.use("/api/inventory", inventoryRoutes);

// Settings Routes
const settingsRoutes = require("./routes/settings");
app.use("/api/settings", settingsRoutes);

// Profile Routes
const profileRoutes = require("./routes/profile");
app.use("/api/profile", profileRoutes);

// ==========================================
//         USER SIDE ROUTES
// ==========================================

// User Dashboard Routes
const userDashboardRoutes = require("./routes/user_dashboard");
app.use("/api/user/dashboard", userDashboardRoutes);

// User Profile Routes
const profileRoutes1 = require("./routes/userprofile");
app.use("/api/userprofile", profileRoutes1);

const myRequestRoutes = require("./routes/MyRequest");
app.use("/api/myrequests", myRequestRoutes);

// Export Routes
const exportRoutes = require("./routes/export");
app.use("/api/export", exportRoutes);

// ==========================================
//         SERVER STARTUP
// ==========================================
app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
