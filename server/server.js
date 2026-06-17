require("dotenv").config();
const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const { ApolloServer } = require("@apollo/server");
const { expressMiddleware } = require("@apollo/server/express4");
const { ApolloServerPluginDrainHttpServer } = require("@apollo/server/plugin/drainHttpServer");

const { typeDefs, resolvers, buildContext } = require("./graphql");

const app = express();
const httpServer = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Basic middleware (sync, safe to mount early)
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Health check
app.get("/health", (req, res) => {
  res.json({ success: true, message: "API Builder Engine is Running" });
});

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/api-builder")
  .then(async () => {
    console.log("Connected to MongoDB");

    // graphql-upload is ESM-only, import it dynamically via subpath exports
    let graphqlUploadExpress;
    try {
      const expressMod = await import("graphql-upload/graphqlUploadExpress.mjs");
      const scalarMod = await import("graphql-upload/GraphQLUpload.mjs");
      graphqlUploadExpress = expressMod.default;
      resolvers.Upload = scalarMod.default;
    } catch (err) {
      console.warn("graphql-upload not available, file uploads in GraphQL disabled:", err.message);
    }

    const server = new ApolloServer({
      typeDefs,
      resolvers,
      introspection: true,
      plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    });

    await server.start();
    console.log("Apollo Server started");

    // Mount GraphQL FIRST so it catches /graphql before any other routes
    const graphqlMiddleware = [cors(), express.json()];

    if (graphqlUploadExpress) {
      graphqlMiddleware.push(
        graphqlUploadExpress({ maxFileSize: 5 * 1024 * 1024, maxFiles: 10 })
      );
    }

    graphqlMiddleware.push(
      expressMiddleware(server, {
        context: buildContext,
      })
    );

    app.use("/graphql", ...graphqlMiddleware);

    // Mount REST routes AFTER GraphQL to prevent /:id from catching /graphql
    const formRoutes = require("./routes/form.routes");
    const authRoutes = require("./routes/auth.routes");

    app.use("/auth", authRoutes);
    app.use("/", formRoutes);

    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`REST API: http://localhost:${PORT}/api/:slug`);
      console.log(`GraphQL: http://localhost:${PORT}/graphql`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });
