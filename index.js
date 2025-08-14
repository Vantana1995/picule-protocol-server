const express = require("express");
const config = require("./config/config");
const logger = require("./utils/logger");
const incrementalUpdater = require("./cache/incrementalUpdater");
const apiRoutes = require("./routes/api");

// Import middleware
const {
  corsMiddleware,
  adminCorsMiddleware,
  generalLimiter,
  ddosProtection,
  checkBlacklist,
  checkAdminAccess,
  requestLogger,
  securityHeaders,
} = require("./middleware/cors");

// Create Express app
const app = express();

// Trust proxy (important for getting real IP addresses)
app.set("trust proxy", true);

// Global middleware (applied to all routes)
app.use(requestLogger); // Log all requests
app.use(securityHeaders); // Security headers
app.use(checkBlacklist); // Check IP blacklists
app.use(ddosProtection); // DDoS protection
app.use(express.json({ limit: "10mb" })); // Parse JSON bodies

// Public API routes (read-only, with CORS)
app.use("/api", corsMiddleware, generalLimiter, apiRoutes);

// Admin API routes (full access, restricted CORS)
app.use("/api/admin", adminCorsMiddleware, checkAdminAccess, apiRoutes);

// Health check endpoint (no restrictions)
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || "1.0.0",
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    name: "Picule API Server",
    version: "1.0.0",
    description: "Decentralized protocol data API",
    endpoints: {
      health: "/health",
      api: "/api",
      admin: "/api/admin",
    },
  });
});

// 404 handler
app.use((req, res) => {
  logger.warn(`404 - Route not found: ${req.method} ${req.url} from ${req.ip}`);
  res.status(404).json({
    error: "Not Found",
    message: "The requested endpoint does not exist",
    path: req.url,
    method: req.method,
  });
});

// Global error handler
app.use((error, req, res, next) => {
  logger.server.error(error, req);

  res.status(500).json({
    error: "Internal Server Error",
    message:
      process.env.NODE_ENV === "development"
        ? error.message
        : "Something went wrong",
    timestamp: new Date().toISOString(),
  });
});

// Initialize server
async function startServer() {
  try {
    logger.info("🚀 Starting Picule API Server...");

    // Initialize cache and start auto updates
    logger.info("Initializing cache...");
    const initSuccess = await incrementalUpdater.initialize();

    if (!initSuccess) {
      throw new Error("Failed to initialize cache");
    }

    // Start automatic updates
    logger.info("Starting automatic data updates...");
    incrementalUpdater.startAutoUpdates();

    // Start Express server
    const server = app.listen(config.server.port, "0.0.0.0", () => {
      logger.server.start(config.server.port);
      logger.info(`🌐 Server running on http://0.0.0.0:${config.server.port}`);
      logger.info(`📊 Environment: ${config.server.env}`);
      logger.info(`🔄 Update interval: ${config.subgraph.updateInterval}ms`);
      logger.info("✅ Server ready to accept connections");
    });

    // Graceful shutdown
    const gracefulShutdown = (signal) => {
      logger.info(`🛑 Received ${signal}, starting graceful shutdown...`);

      // Stop accepting new connections
      server.close((err) => {
        if (err) {
          logger.error("Error during server shutdown:", err.message);
        } else {
          logger.info("✅ Server closed");
        }

        // Stop auto updates
        incrementalUpdater.cleanup();

        // Exit process
        process.exit(err ? 1 : 0);
      });

      // Force exit after 30 seconds
      setTimeout(() => {
        logger.error("🔥 Forced shutdown after timeout");
        process.exit(1);
      }, 30000);
    };

    // Handle shutdown signals
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

    // Handle uncaught exceptions
    process.on("uncaughtException", (error) => {
      logger.error("Uncaught Exception:", error);
      gracefulShutdown("uncaughtException");
    });

    process.on("unhandledRejection", (reason, promise) => {
      logger.error("Unhandled Rejection at:", promise, "reason:", reason);
      gracefulShutdown("unhandledRejection");
    });
  } catch (error) {
    logger.error("💥 Failed to start server:", error.message);
    process.exit(1);
  }
}

// Start the server
startServer();
