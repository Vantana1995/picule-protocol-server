// middleware/cors.js
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const config = require("../config/config");
const logger = require("../utils/logger");

// Permanent blacklist for repeat offenders
const permanentBlacklist = new Set();
const ddosWarnings = new Map(); // IP -> warning count

// Allowed origins for CORS
const allowedOrigins = [
  "https://picule.xyz",
  // Development origins
  "http://localhost:3000",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173",
  "http://192.168.0.186:3000",
  "http://192.168.0.186:5173",
];

// CORS configuration for public API (read-only)
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      logger.warn(`Blocked CORS request from origin: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: false, // No credentials needed for read-only
  optionsSuccessStatus: 200,
  methods: ["GET", "OPTIONS"], // Only GET requests for public
  allowedHeaders: ["Content-Type", "X-Requested-With"],
};

// CORS configuration for admin API (full access)
const adminCorsOptions = {
  origin: function (origin, callback) {
    // More restrictive for admin - only localhost and your IP
    const adminOrigins = [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:5173",
      "http://192.168.0.186:3000",
      "http://192.168.0.186:5173",
    ];

    if (!origin || adminOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      logger.warn(`Blocked admin CORS request from origin: ${origin}`);
      callback(new Error("Admin access denied by CORS"));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // All methods for admin
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

// Rate limiting - normal users
const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute per IP
  message: {
    error: "Too many requests",
    message: "Rate limit exceeded. Maximum 30 requests per minute.",
    retryAfter: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip} on ${req.url}`);
    res.status(429).json({
      error: "Too many requests",
      message: "Rate limit exceeded. Maximum 30 requests per minute.",
      retryAfter: 60,
    });
  },
});

// Strict rate limiting for potential DDoS detection
const ddosProtection = rateLimit({
  windowMs: 30 * 1000, // 30 seconds window
  max: 20, // 20 requests per 30 seconds (aggressive)
  message: {
    error: "DDoS Protection",
    message: "Suspicious activity detected. IP blocked for 15 minutes.",
    retryAfter: 15 * 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.url === "/api/health";
  },
  handler: (req, res) => {
    const ip = req.ip;

    // Increment warning count
    const warnings = ddosWarnings.get(ip) || 0;
    ddosWarnings.set(ip, warnings + 1);

    logger.error(
      `DDoS protection triggered for IP: ${ip} (Warning ${warnings + 1}/5)`
    );

    if (warnings + 1 >= 5) {
      // 5th warning = permanent ban
      permanentBlacklist.add(ip);
      ddosWarnings.delete(ip); // Clean up warnings
      logger.error(`IP ${ip} PERMANENTLY BLACKLISTED after 5 DDoS attempts`);

      return res.status(403).json({
        error: "Permanently Banned",
        message:
          "Your IP has been permanently banned due to repeated DDoS attempts.",
      });
    }

    // Temporary block for warnings 1-4
    blacklistIP(ip);

    res.status(429).json({
      error: "DDoS Protection",
      message: `Suspicious activity detected. Warning ${
        warnings + 1
      }/5. IP blocked for 15 minutes.`,
      retryAfter: 15 * 60,
    });
  },
});

// IP blacklist for DDoS protection
const blacklistedIPs = new Map();

function blacklistIP(ip) {
  const blockUntil = Date.now() + 15 * 60 * 1000; // 15 minutes
  blacklistedIPs.set(ip, blockUntil);

  logger.error(
    `IP ${ip} blacklisted until ${new Date(blockUntil).toISOString()}`
  );
}

function cleanupBlacklist() {
  const now = Date.now();
  for (const [ip, blockUntil] of blacklistedIPs.entries()) {
    if (now > blockUntil) {
      blacklistedIPs.delete(ip);
      logger.info(`IP ${ip} removed from blacklist`);
    }
  }
}

// Blacklist checker middleware
const checkBlacklist = (req, res, next) => {
  const clientIP = req.ip;

  // Check permanent blacklist first
  if (permanentBlacklist.has(clientIP)) {
    logger.warn(`Blocked request from permanently banned IP: ${clientIP}`);
    return res.status(403).json({
      error: "Permanently Banned",
      message:
        "Your IP has been permanently banned due to repeated violations.",
    });
  }

  // Check temporary blacklist
  const blockUntil = blacklistedIPs.get(clientIP);
  if (blockUntil && Date.now() < blockUntil) {
    const remainingTime = Math.ceil((blockUntil - Date.now()) / 1000 / 60);

    logger.warn(`Blocked request from temporarily blacklisted IP: ${clientIP}`);

    return res.status(403).json({
      error: "IP Blocked",
      message: `Your IP is temporarily blocked due to suspicious activity. Try again in ${remainingTime} minutes.`,
      retryAfter: remainingTime * 60,
    });
  }

  next();
};

// Admin IP whitelist (for admin endpoints)
const adminIPs = ["127.0.0.1", "::1", "localhost", "192.168.0.186"];

// Admin access checker
const checkAdminAccess = (req, res, next) => {
  const clientIP = req.ip;

  // Extract real IP from behind proxy if needed
  const realIP =
    req.headers["x-forwarded-for"] ||
    req.headers["x-real-ip"] ||
    req.connection.remoteAddress ||
    clientIP;

  const isLocalhost =
    clientIP === "127.0.0.1" ||
    clientIP === "::1" ||
    clientIP.includes("127.0.0.1");

  const isAdminIP = adminIPs.some(
    (adminIP) => clientIP.includes(adminIP) || realIP.includes(adminIP)
  );

  if (isLocalhost || isAdminIP) {
    logger.info(`Admin access granted for IP: ${clientIP}`);
    next();
  } else {
    logger.warn(`Admin access denied for IP: ${clientIP}`);
    res.status(403).json({
      error: "Access Denied",
      message: "Admin access restricted to authorized IPs only",
    });
  }
};

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    };

    if (res.statusCode >= 400) {
      logger.warn("HTTP Request Error", logData);
    } else {
      logger.debug("HTTP Request", logData);
    }
  });

  next();
};

// Security headers middleware
const securityHeaders = (req, res, next) => {
  // Prevent clickjacking
  res.setHeader("X-Frame-Options", "DENY");

  // Prevent MIME type sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");

  // XSS protection
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // Referrer policy
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // Content Security Policy for API
  res.setHeader("Content-Security-Policy", "default-src 'none'");

  next();
};

module.exports = {
  corsMiddleware: cors(corsOptions), // Public read-only CORS
  adminCorsMiddleware: cors(adminCorsOptions), // Admin full access CORS
  generalLimiter,
  ddosProtection,
  checkBlacklist,
  checkAdminAccess,
  requestLogger,
  securityHeaders,
  // Utility functions
  blacklistIP,
  cleanupBlacklist,
};
