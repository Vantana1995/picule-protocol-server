// config/config.js
require("dotenv").config();

const config = {
  // Server settings
  server: {
    port: process.env.PORT || 3001,
    env: process.env.NODE_ENV || "development",
    corsOrigins: process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(",")
      : ["http://localhost:3000", "http://localhost:5173"],
  },

  // The Graph settings
  subgraph: {
    url: process.env.SUBGRAPH_URL,
    updateInterval: 30 * 1000, // 30 seconds
    maxRetries: 3,
    retryDelay: 2000, // 2 seconds
    requestTimeout: 30000, // 30 seconds
  },

  // Cache settings
  cache: {
    defaultTTL: 60 * 1000, // 1 minute
    maxSize: 10000, // Maximum number of cached items
    enablePersistence: true, // Save to file on shutdown
    persistenceFile: "./cache/data.json",
  },

  // GraphQL query limits
  query: {
    defaultFirst: 1000, // Default number of items to fetch
    maxFirst: 5000, // Maximum items in single query
    defaultSkip: 0,
  },

  // Logging settings
  logging: {
    level: process.env.LOG_LEVEL || "info", // debug, info, warn, error
    enableConsole: true,
    enableFile: false,
    logFile: "./logs/server.log",
  },

  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per windowMs
    skipSuccessfulRequests: false,
  },

  // Health check settings
  health: {
    enableHealthEndpoint: true,
    checkInterval: 30 * 1000, // 30 seconds
    maxBlockDelay: 100, // Alert if more than 100 blocks behind
  },
};

module.exports = config;
