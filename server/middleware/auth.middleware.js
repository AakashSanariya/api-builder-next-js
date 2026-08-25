const jwt = require("jsonwebtoken");
const ApiKey = require("../models/apiKey.model");

const JWT_SECRET = process.env.JWT_SECRET || "api-builder-secret-key-change-in-production";

const authenticate = async (req, res, next) => {
  try {
    const apiKeyHeader = req.headers["x-api-key"];
    if (apiKeyHeader) {
      const apiKey = await ApiKey.findOne({ key: apiKeyHeader });
      if (!apiKey) {
        return res.status(401).json({ success: false, message: "Invalid API key." });
      }
      if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
        return res.status(401).json({ success: false, message: "API key has expired." });
      }
      apiKey.lastUsedAt = new Date();
      await apiKey.save();
      req.user = { userId: apiKey.userId };
      return next();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Access denied. No token provided." });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { userId: decoded.userId, email: decoded.email };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid or expired token." });
  }
};

module.exports = authenticate;
