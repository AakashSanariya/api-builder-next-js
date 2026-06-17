const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "api-builder-secret-key-change-in-production";

const buildContext = async ({ req }) => {
  const context = { req };

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
