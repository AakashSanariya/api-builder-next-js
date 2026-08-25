const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const User = require("../models/user.model");
const ApiKey = require("../models/apiKey.model");
const Form = require("../models/form.model");
const Relationship = require("../models/relationship.model");
const RelationLink = require("../models/relationLink.model");
const { getDynamicDataModel } = require("../utils/dynamicData.model");
const authenticate = require("../middleware/auth.middleware");

const JWT_SECRET = process.env.JWT_SECRET || "api-builder-secret-key-change-in-production";

const validatePassword = (password) => {
  if (password.length < 8) return "Password must be at least 8 characters";
  if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter";
  if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter";
  if (!/[0-9]/.test(password)) return "Password must contain at least one number";
  return null;
};

// ─── Public Routes ───────────────────────────────────

router.post("/signup", async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ success: false, message: passwordError });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "An account with this email already exists" });
    }

    const user = await User.create({ firstName, lastName, email, password });

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      data: { firstName: user.firstName, lastName: user.lastName, email: user.email },
    });
  } catch (err) {
    console.error("Signup Error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });

    res.json({
      success: true,
      message: "Login successful",
      token,
      data: { firstName: user.firstName, lastName: user.lastName, email: user.email },
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ─── Authenticated Routes ────────────────────────────

router.get("/me", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({
      success: true,
      data: { firstName: user.firstName, lastName: user.lastName, email: user.email },
    });
  } catch (err) {
    console.error("Get Me Error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ─── Profile ─────────────────────────────────────────

router.put("/profile", authenticate, async (req, res) => {
  try {
    const { firstName, lastName, email } = req.body;

    if (!firstName || !lastName || !email) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (normalizedEmail !== req.user.email) {
      const existing = await User.findOne({ email: normalizedEmail });
      if (existing) {
        return res.status(400).json({ success: false, message: "This email is already in use" });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { firstName: firstName.trim(), lastName: lastName.trim(), email: normalizedEmail },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: { firstName: user.firstName, lastName: user.lastName, email: user.email },
    });
  } catch (err) {
    console.error("Update Profile Error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ─── Password ────────────────────────────────────────

router.put("/password", authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Both current and new password are required" });
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      return res.status(400).json({ success: false, message: passwordError });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Current password is incorrect" });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: "Password changed successfully" });
  } catch (err) {
    console.error("Change Password Error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ─── Account Deletion ────────────────────────────────

router.delete("/account", authenticate, async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (email !== user.email) {
      return res.status(400).json({ success: false, message: "Email does not match" });
    }

    const userId = user._id;

    const forms = await Form.find({ userId });
    for (const form of forms) {
      try {
        const DynamicModel = getDynamicDataModel(form.slug);
        await DynamicModel.deleteMany({ formId: form._id });
      } catch (e) {
        // Collection may not exist, continue
      }
    }

    await Form.deleteMany({ userId });
    await RelationLink.deleteMany({ userId });
    await Relationship.deleteMany({ userId });
    await ApiKey.deleteMany({ userId });

    const uploadsDir = path.join(__dirname, "../uploads");
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      for (const file of files) {
        try {
          fs.unlinkSync(path.join(uploadsDir, file));
        } catch (e) {
          // Skip files that can't be deleted
        }
      }
    }

    await User.findByIdAndDelete(userId);

    res.json({ success: true, message: "Account deleted successfully" });
  } catch (err) {
    console.error("Delete Account Error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ─── API Keys ────────────────────────────────────────

router.get("/api-keys", authenticate, async (req, res) => {
  try {
    const keys = await ApiKey.find({ userId: req.user.userId }).sort({ createdAt: -1 });
    res.json({ success: true, data: keys });
  } catch (err) {
    console.error("List API Keys Error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

router.post("/api-keys", authenticate, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "API key name is required" });
    }

    const key = ApiKey.generateKey();

    const apiKey = await ApiKey.create({
      name: name.trim(),
      key,
      userId: req.user.userId,
    });

    res.status(201).json({
      success: true,
      message: "API key created successfully. Copy it now — it won't be shown again.",
      data: { _id: apiKey._id, name: apiKey.name, key, createdAt: apiKey.createdAt },
    });
  } catch (err) {
    console.error("Create API Key Error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

router.delete("/api-keys/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({ success: false, message: "Invalid API key ID" });
    }

    const apiKey = await ApiKey.findOneAndDelete({ _id: id, userId: req.user.userId });
    if (!apiKey) {
      return res.status(404).json({ success: false, message: "API key not found" });
    }

    res.json({ success: true, message: "API key revoked successfully" });
  } catch (err) {
    console.error("Revoke API Key Error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

module.exports = router;
