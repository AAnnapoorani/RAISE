const express = require("express");
const cors = require("cors");
require("./db");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/hardware", require("./routes/hardwareRoutes"));
app.use("/api/requests", require("./routes/requestRoutes"));
app.use("/api/admin", require("./routes/adminroutes"));


app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});
