require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const formRoutes = require("./routes/form.routes");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Single dedicated mount point for management and dynamic routes
app.use("/", formRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ success: true, message: "API Builder Engine is Running" });
});

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/api-builder")
  .then(() => {
    console.log("🚀 Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`📡 Server running on port ${PORT}`);
      console.log(`🔗 Dynamic API accessible at: http://localhost:${PORT}/api/:slug`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
  });
