const express = require("express");
const cacheManager = require("../cache/manager");
const incrementalUpdater = require("../cache/incrementalUpdater");
const logger = require("../utils/logger");
const { checkAdminAccess } = require("../middleware/cors");
const router = express.Router();

// Middleware to log all API requests
router.use((req, res, next) => {
  logger.server.request(req.method, req.url, req.ip);
  next();
});

// Middleware to check if cache is ready
const checkCacheReady = (req, res, next) => {
  if (!cacheManager.isReady()) {
    return res.status(503).json({
      error: "Service Unavailable",
      message: "Cache is not ready yet, please try again in a few seconds",
      ready: false,
    });
  }
  next();
};

// Helper function to send successful response
const sendSuccess = (res, data, message = "Success") => {
  res.json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
};

// Helper function to send error response
const sendError = (res, statusCode, message, details = null) => {
  logger.error(`API Error: ${message}`, details);
  res.status(statusCode).json({
    success: false,
    error: message,
    details,
    timestamp: new Date().toISOString(),
  });
};

// ============ ICO ENDPOINTS ============

// Get all ICO requests
router.get("/ico-requests", checkCacheReady, (req, res) => {
  try {
    const { active, recent, limit } = req.query;
    let data = cacheManager.get("icoRequests");

    // Filter by active status
    if (active !== undefined) {
      const isActive = active === "true";
      data = data.filter((ico) => ico.active === isActive);
    }

    // Get recent items
    if (recent === "true") {
      const limitNum = parseInt(limit) || 20;
      data = data
        .sort((a, b) => parseInt(b.createdAt) - parseInt(a.createdAt))
        .slice(0, limitNum);
    }

    sendSuccess(res, data, `Retrieved ${data.length} ICO requests`);
  } catch (error) {
    sendError(res, 500, "Failed to get ICO requests", error.message);
  }
});

// Get specific ICO request
router.get("/ico-requests/:id", checkCacheReady, (req, res) => {
  try {
    const ico = cacheManager.getById("icoRequests", req.params.id);

    if (!ico) {
      return sendError(res, 404, "ICO request not found");
    }

    sendSuccess(res, ico);
  } catch (error) {
    sendError(res, 500, "Failed to get ICO request", error.message);
  }
});

// Get all contributions
router.get("/contributions", checkCacheReady, (req, res) => {
  try {
    const { icoId, recent, limit } = req.query;
    let data = cacheManager.get("contributions");

    // Filter by ICO ID
    if (icoId) {
      data = data.filter(
        (contribution) => contribution.icoRequest.numOfRequest === icoId
      );
    }

    // Get recent contributions
    if (recent === "true") {
      const limitNum = parseInt(limit) || 50;
      data = data
        .sort((a, b) => parseInt(b.timestamp) - parseInt(a.timestamp))
        .slice(0, limitNum);
    }

    sendSuccess(res, data, `Retrieved ${data.length} contributions`);
  } catch (error) {
    sendError(res, 500, "Failed to get contributions", error.message);
  }
});

// ============ PROJECT ENDPOINTS ============

// Get all projects
router.get("/projects", checkCacheReady, (req, res) => {
  try {
    const { recent, limit } = req.query;
    let data = cacheManager.get("projects");

    if (recent === "true") {
      const limitNum = parseInt(limit) || 20;
      data = data
        .sort((a, b) => parseInt(b.createdAt) - parseInt(a.createdAt))
        .slice(0, limitNum);
    }

    sendSuccess(res, data, `Retrieved ${data.length} projects`);
  } catch (error) {
    sendError(res, 500, "Failed to get projects", error.message);
  }
});

// Get specific project
router.get("/projects/:id", checkCacheReady, (req, res) => {
  try {
    const project = cacheManager.getById("projects", req.params.id);

    if (!project) {
      return sendError(res, 404, "Project not found");
    }

    sendSuccess(res, project);
  } catch (error) {
    sendError(res, 500, "Failed to get project", error.message);
  }
});

// ============ MARKETPLACE ENDPOINTS ============

// Get all listings
router.get("/listings", checkCacheReady, (req, res) => {
  try {
    const { active, recent, limit } = req.query;
    let data = cacheManager.get("listings");

    // Filter by active status
    if (active !== undefined) {
      const isActive = active === "true";
      data = data.filter((listing) => listing.active === isActive);
    }

    // Get recent listings
    if (recent === "true") {
      const limitNum = parseInt(limit) || 20;
      data = data
        .sort((a, b) => parseInt(b.createdAt) - parseInt(a.createdAt))
        .slice(0, limitNum);
    }

    sendSuccess(res, data, `Retrieved ${data.length} listings`);
  } catch (error) {
    sendError(res, 500, "Failed to get listings", error.message);
  }
});

// Get all sales
router.get("/sales", checkCacheReady, (req, res) => {
  try {
    const { recent, limit } = req.query;
    let data = cacheManager.get("sales");

    if (recent === "true") {
      const limitNum = parseInt(limit) || 20;
      data = data
        .sort((a, b) => parseInt(b.timestamp) - parseInt(a.timestamp))
        .slice(0, limitNum);
    }

    sendSuccess(res, data, `Retrieved ${data.length} sales`);
  } catch (error) {
    sendError(res, 500, "Failed to get sales", error.message);
  }
});

// ============ DEX ENDPOINTS ============

// Get all tokens
router.get("/tokens", checkCacheReady, (req, res) => {
  try {
    const data = cacheManager.get("tokens");
    sendSuccess(res, data, `Retrieved ${data.length} tokens`);
  } catch (error) {
    sendError(res, 500, "Failed to get tokens", error.message);
  }
});

// Get all pairs
router.get("/pairs", checkCacheReady, (req, res) => {
  try {
    const data = cacheManager.get("pairs");
    sendSuccess(res, data, `Retrieved ${data.length} pairs`);
  } catch (error) {
    sendError(res, 500, "Failed to get pairs", error.message);
  }
});

// ============ ACCOUNT ENDPOINTS ============
router.get("/accounts/:address", checkCacheReady, (req, res) => {
  try {
    const address = req.params.address.toLowerCase();
    const account = cacheManager.getById("accounts", address);

    if (!account) {
      return sendError(res, 404, "Account not found");
    }

    sendSuccess(res, account, `Retrieved account data for ${address}`);
  } catch (error) {
    sendError(res, 500, "Failed to get account data", error.message);
  }
});

// Get all accounts (with pagination)
router.get("/accounts", checkCacheReady, (req, res) => {
  try {
    const { limit = 100, offset = 0 } = req.query;
    let data = cacheManager.get("accounts") || [];

    // Apply pagination
    const startIndex = parseInt(offset);
    const endIndex = startIndex + parseInt(limit);
    const paginatedData = data.slice(startIndex, endIndex);

    sendSuccess(
      res,
      {
        accounts: paginatedData,
        total: data.length,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
      `Retrieved ${paginatedData.length} accounts`
    );
  } catch (error) {
    sendError(res, 500, "Failed to get accounts", error.message);
  }
});

// Get account trading stats
router.get("/accounts/:address/stats", checkCacheReady, (req, res) => {
  try {
    const address = req.params.address.toLowerCase();
    const account = cacheManager.getById("accounts", address);

    if (!account) {
      return sendError(res, 404, "Account not found");
    }

    // Extract trading statistics
    const stats = {
      usdSwapped: account.usdSwapped || "0",
      totalContributions: account.contributions?.length || 0,
      totalICORequests: account.icoRequests?.length || 0,
      totalNFTs: account.ERC721tokens?.length || 0,
      totalListings: account.listings?.length || 0,
      totalSalesAsBuyer: account.salesAsBuyer?.length || 0,
      totalSalesAsSeller: account.salesAsSeller?.length || 0,
      totalProjectsCreated: account.createdProjects?.length || 0,
      liquidityPositions: account.liquidityPositions?.length || 0,
    };

    sendSuccess(res, stats, `Retrieved trading stats for ${address}`);
  } catch (error) {
    sendError(res, 500, "Failed to get account stats", error.message);
  }
});

// ============ STATS ENDPOINTS ============

// Get global stats
router.get("/stats/global", checkCacheReady, (req, res) => {
  try {
    const data = cacheManager.get("globalStats");
    sendSuccess(res, data);
  } catch (error) {
    sendError(res, 500, "Failed to get global stats", error.message);
  }
});

// Get marketplace stats
router.get("/stats/marketplace", checkCacheReady, (req, res) => {
  try {
    const data = cacheManager.get("marketplaceStats");
    sendSuccess(res, data);
  } catch (error) {
    sendError(res, 500, "Failed to get marketplace stats", error.message);
  }
});

// Get cache stats
router.get("/stats/cache", (req, res) => {
  try {
    const data = cacheManager.getStats();
    sendSuccess(res, data);
  } catch (error) {
    sendError(res, 500, "Failed to get cache stats", error.message);
  }
});

// ============ HISTORICAL DATA ENDPOINTS ============

// Get token historical data
router.get("/tokens/:address/history", checkCacheReady, (req, res) => {
  try {
    const { address } = req.params;
    const { timeframe = "hour", limit = 168 } = req.query;

    if (!["minute", "hour", "day"].includes(timeframe)) {
      return sendError(
        res,
        400,
        "Invalid timeframe. Use: minute, hour, or day"
      );
    }

    const data = cacheManager.getTokenHistoricalData(
      address,
      timeframe,
      parseInt(limit)
    );

    sendSuccess(
      res,
      {
        tokenAddress: address,
        timeframe,
        limit: parseInt(limit),
        data,
      },
      `Retrieved ${data.length} ${timeframe} data points for token ${address}`
    );
  } catch (error) {
    sendError(res, 500, "Failed to get token historical data", error.message);
  }
});

// Get token current price
router.get("/tokens/:address/price", checkCacheReady, (req, res) => {
  try {
    const { address } = req.params;
    const priceData = cacheManager.getLatestTokenPrice(address);

    if (!priceData) {
      return sendError(res, 404, "Price data not found for token");
    }

    sendSuccess(res, {
      tokenAddress: address,
      ...priceData,
    });
  } catch (error) {
    sendError(res, 500, "Failed to get token price", error.message);
  }
});

// Get multiple token prices at once
router.get("/tokens/prices", checkCacheReady, (req, res) => {
  try {
    const { addresses } = req.query;

    if (!addresses) {
      return sendError(res, 400, "addresses parameter is required");
    }
    const addressesArray = addresses.split(",").map((addr) => addr.trim());

    const prices = {};
    for (const address of addressesArray) {
      const priceData = cacheManager.getLatestTokenPrice(address);
      if (priceData) {
        prices[address.toLowerCase()] = priceData;
      }
    }

    sendSuccess(
      res,
      {
        prices,
        count: Object.keys(prices).length,
      },
      `Retrieved prices for ${Object.keys(prices).length} tokens`
    );
  } catch (error) {
    sendError(res, 500, "Failed to get token prices", error.message);
  }
});
// Get multiple token historical data at once
router.get("/tokens/history", checkCacheReady, (req, res) => {
  try {
    const { addresses, timeframe = "hour", limit = 168 } = req.query;

    if (!addresses) {
      return sendError(res, 400, "addresses parameter is required");
    }
    const addressesArray = addresses.split(",").map((addr) => addr.trim());

    if (!["minute", "hour", "day"].includes(timeframe)) {
      return sendError(
        res,
        400,
        "Invalid timeframe. Use: minute, hour, or day"
      );
    }

    const historicalData = {};
    for (const address of addressesArray) {
      const data = cacheManager.getTokenHistoricalData(
        address,
        timeframe,
        parseInt(limit)
      );
      if (data.length > 0) {
        historicalData[address.toLowerCase()] = data;
      }
    }

    sendSuccess(
      res,
      {
        timeframe,
        limit: parseInt(limit),
        data: historicalData,
        count: Object.keys(historicalData).length,
      },
      `Retrieved ${timeframe} data for ${
        Object.keys(historicalData).length
      } tokens`
    );
  } catch (error) {
    sendError(res, 500, "Failed to get historical data", error.message);
  }
});
// ============ FUNDS MANAGER ENDPOINTS ============

// Get FundsManager data by address
router.get("/funds-manager/:address", checkCacheReady, (req, res) => {
  try {
    const address = req.params.address.toLowerCase();

    // Get all related data for this FundsManager
    const checkpoints = cacheManager.getFiltered(
      "checkpoints",
      (item) => item.fundsManager.id.toLowerCase() === address
    );

    const lpTokens = cacheManager.getFiltered(
      "lpTokens",
      (item) => item.fundsManager.id.toLowerCase() === address
    );

    const bonusClaims = cacheManager.getFiltered(
      "bonusClaims",
      (item) => item.fundsManager.id.toLowerCase() === address
    );

    const fundsManagerData = {
      address,
      checkpoints,
      lpTokens,
      bonusClaims,
      totalCheckpoints: checkpoints.length,
      totalLPTokens: lpTokens.length,
      totalBonusClaims: bonusClaims.length,
    };

    sendSuccess(
      res,
      fundsManagerData,
      `Retrieved FundsManager data for ${address}`
    );
  } catch (error) {
    sendError(res, 500, "Failed to get FundsManager data", error.message);
  }
});

// Get user's bonus claims
router.get("/bonus-claims/:userAddress", checkCacheReady, (req, res) => {
  try {
    const userAddress = req.params.userAddress.toLowerCase();

    const userBonusClaims = cacheManager.getFiltered(
      "bonusClaims",
      (claim) => claim.claimer.id.toLowerCase() === userAddress
    );

    sendSuccess(
      res,
      userBonusClaims,
      `Retrieved ${userBonusClaims.length} bonus claims for user`
    );
  } catch (error) {
    sendError(res, 500, "Failed to get bonus claims", error.message);
  }
});

// Get all checkpoints
router.get("/checkpoints", checkCacheReady, (req, res) => {
  try {
    const data = cacheManager.get("checkpoints");
    sendSuccess(res, data, `Retrieved ${data.length} checkpoints`);
  } catch (error) {
    sendError(res, 500, "Failed to get checkpoints", error.message);
  }
});
// ============ UTILITY ENDPOINTS ============

// Get all data at once
router.get("/all", checkCacheReady, (req, res) => {
  try {
    const data = cacheManager.getAll();
    sendSuccess(res, data, `Retrieved all cached data`);
  } catch (error) {
    sendError(res, 500, "Failed to get all data", error.message);
  }
});

// Health check endpoint
router.get("/health", (req, res) => {
  try {
    const healthReport = incrementalUpdater.getHealthReport();

    if (healthReport.healthy) {
      res.json({
        status: "healthy",
        ...healthReport,
        uptime: process.uptime(),
      });
    } else {
      res.status(503).json({
        status: "unhealthy",
        ...healthReport,
        uptime: process.uptime(),
      });
    }
  } catch (error) {
    sendError(res, 500, "Health check failed", error.message);
  }
});

// Force refresh endpoint (admin only)
router.post("/admin/refresh", async (req, res) => {
  try {
    logger.info("Force refresh requested via API");
    const success = await incrementalUpdater.forceRefresh();

    if (success) {
      sendSuccess(res, null, "Cache refresh completed successfully");
    } else {
      sendError(res, 500, "Cache refresh failed");
    }
  } catch (error) {
    sendError(res, 500, "Force refresh failed", error.message);
  }
});

// Manual update trigger (admin only)
router.post("/admin/update", async (req, res) => {
  try {
    logger.info("Manual update requested via API");
    const success = await incrementalUpdater.triggerUpdate();

    if (success) {
      sendSuccess(res, null, "Manual update completed successfully");
    } else {
      sendError(res, 500, "Manual update failed");
    }
  } catch (error) {
    sendError(res, 500, "Manual update failed", error.message);
  }
});

// Get updater status
router.get("/status", (req, res) => {
  try {
    const status = incrementalUpdater.getStatus();
    sendSuccess(res, status);
  } catch (error) {
    sendError(res, 500, "Failed to get status", error.message);
  }
});
router.post("/admin/whitelist/add", checkAdminAccess, (req, res) => {
  const { origin } = req.body;

  if (!origin) {
    return sendError(res, 400, "Origin is required");
  }

  allowedOrigins.push(origin);
  logger.info(`Added origin to whitelist: ${origin}`);

  sendSuccess(res, { allowedOrigins }, "Origin added to whitelist");
});
router.get("/admin/whitelist", checkAdminAccess, (req, res) => {
  sendSuccess(res, { allowedOrigins });
});
router.delete("/admin/whitelist/:origin", checkAdminAccess, (req, res) => {
  const origin = decodeURIComponent(req.params.origin);
  const index = allowedOrigins.indexOf(origin);

  if (index > -1) {
    allowedOrigins.splice(index, 1);
    sendSuccess(res, null, "Origin removed from whitelist");
  } else {
    sendError(res, 404, "Origin not found");
  }
});

module.exports = router;
