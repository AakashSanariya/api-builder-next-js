const jwt = require("jsonwebtoken");
const ApiKey = require("../models/apiKey.model");

const JWT_SECRET = process.env.JWT_SECRET || "api-builder-secret-key-change-in-production";

const buildContext = async ({ req }) => {
  const context = { req };

  const apiKeyHeader = req.headers["x-api-key"];
  if (apiKeyHeader) {
    try {
      const apiKey = await ApiKey.findOne({ key: apiKeyHeader });
      if (apiKey && (!apiKey.expiresAt || apiKey.expiresAt >= new Date())) {
        context.userId = apiKey.userId.toString();
        apiKey.lastUsedAt = new Date();
        await apiKey.save();
      }
    } catch (err) {
      // API key invalid — user remains unauthenticated
    }
    return context;
  }

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      context.userId = decoded.userId;
      context.email = decoded.email;
    } catch (err) {
      // Token invalid — user remains unauthenticated
    }
  }

  return context;
};

module.exports = buildContext;
