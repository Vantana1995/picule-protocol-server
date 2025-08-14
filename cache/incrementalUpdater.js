const graphqlClient = require("../graphql/client");
const cacheManager = require("./manager");
const blockTracker = require("./blockTracker");
const { GET_ALL_INITIAL_DATA } = require("../graphql/initialQueries");
const { GET_UPDATES_FROM_BLOCK } = require("../graphql/updateQueries");
const config = require("../config/config");
const logger = require("../utils/logger");

class IncrementalUpdater {
  constructor() {
    this.isUpdating = false;
    this.updateInterval = null;
    this.stats = {
      totalUpdates: 0,
      successfulUpdates: 0,
      failedUpdates: 0,
      lastUpdateTime: null,
      lastError: null,
    };
  }

  // Initialize cache with full data load
  async initialize() {
    try {
      logger.info("Initializing cache with full data load...");

      const data = await graphqlClient.query(GET_ALL_INITIAL_DATA, {
        first: config.query.defaultFirst,
      });

      if (!data) {
        throw new Error("No data received from initial query");
      }

      // Initialize cache with data
      const success = cacheManager.initialize(data);
      if (!success) {
        throw new Error("Failed to initialize cache");
      }

      // Initialize block tracker
      const blockNumber = data._meta?.block?.number;
      if (blockNumber) {
        blockTracker.initializeBlock(blockNumber);
        logger.info(`Initialized at block ${blockNumber}`);
      } else {
        logger.warn("No block number in initial data");
      }

      logger.info("Cache initialization completed successfully");
      return true;
    } catch (error) {
      logger.error("Failed to initialize cache:", error.message);
      this.stats.lastError = error.message;
      return false;
    }
  }

  // Start automatic updates
  startAutoUpdates() {
    if (this.updateInterval) {
      logger.warn("Auto updates already running");
      return;
    }

    logger.info(
      `Starting auto updates every ${config.subgraph.updateInterval}ms`
    );

    this.updateInterval = setInterval(async () => {
      await this.performUpdate();
    }, config.subgraph.updateInterval);
  }

  // Stop automatic updates
  stopAutoUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
      logger.info("Auto updates stopped");
    }
  }

  // Perform single update
  async performUpdate() {
    if (this.isUpdating) {
      logger.debug("Update already in progress, skipping");
      return false;
    }

    this.isUpdating = true;
    this.stats.totalUpdates++;

    try {
      const currentBlock = blockTracker.getCurrentBlock();

      if (currentBlock === 0) {
        logger.warn(
          "Block tracker not initialized, cannot perform incremental update"
        );
        return false;
      }

      logger.debug(`Checking for updates since block ${currentBlock}`);

      // Get updates since last block
      const newData = await graphqlClient.query(GET_UPDATES_FROM_BLOCK, {
        fromBlock: currentBlock,
      });

      if (!newData) {
        logger.warn("No data received from update query");
        return false;
      }

      // Check if there's a new block
      const latestBlock = newData._meta?.block?.number;
      if (!latestBlock) {
        logger.warn("No block number in update data");
        return false;
      }

      // Update block tracker
      const hasNewBlocks = blockTracker.updateBlock(latestBlock);

      if (!hasNewBlocks) {
        logger.debug("No new blocks, skipping data update");
        return true; // Not an error, just no new data
      }

      // Add new data to cache
      const addedCount = cacheManager.addNewData(newData);

      // Update stats
      this.stats.successfulUpdates++;
      this.stats.lastUpdateTime = new Date();
      this.stats.lastError = null;

      if (addedCount > 0) {
        logger.info(`Update completed: ${addedCount} new records added`);
      } else {
        logger.debug("Update completed: no new records");
      }

      return true;
    } catch (error) {
      this.stats.failedUpdates++;
      this.stats.lastError = error.message;
      logger.error("Update failed:", error.message);
      return false;
    } finally {
      this.isUpdating = false;
    }
  }

  // Force full refresh (reinitialize everything)
  async forceRefresh() {
    logger.info("Performing force refresh...");

    try {
      // Stop auto updates
      this.stopAutoUpdates();

      // Clear cache and reset block tracker
      cacheManager.clear();
      blockTracker.reset();

      // Reinitialize
      const success = await this.initialize();

      if (success) {
        // Restart auto updates
        this.startAutoUpdates();
        logger.info("Force refresh completed successfully");
      }

      return success;
    } catch (error) {
      logger.error("Force refresh failed:", error.message);
      return false;
    }
  }

  // Manual update trigger
  async triggerUpdate() {
    logger.info("Manual update triggered");
    return await this.performUpdate();
  }

  // Get updater status
  getStatus() {
    return {
      isInitialized: cacheManager.isReady(),
      isUpdating: this.isUpdating,
      autoUpdatesEnabled: !!this.updateInterval,
      updateInterval: config.subgraph.updateInterval,
      currentBlock: blockTracker.getCurrentBlock(),
      blockTrackerStatus: blockTracker.getStatus(),
      cacheStats: cacheManager.getStats(),
      updateStats: { ...this.stats },
    };
  }

  // Health check
  isHealthy() {
    const status = this.getStatus();

    return (
      status.isInitialized &&
      !this.isUpdating &&
      status.autoUpdatesEnabled &&
      blockTracker.isHealthy() &&
      cacheManager.isReady()
    );
  }

  // Get detailed health report
  getHealthReport() {
    const status = this.getStatus();
    const issues = [];

    if (!status.isInitialized) {
      issues.push("Cache not initialized");
    }

    if (!status.autoUpdatesEnabled) {
      issues.push("Auto updates disabled");
    }

    if (!blockTracker.isHealthy()) {
      issues.push("Block tracker unhealthy");
    }

    if (!cacheManager.isReady()) {
      issues.push("Cache not ready");
    }

    const timeSinceLastUpdate = status.updateStats.lastUpdateTime
      ? Date.now() - status.updateStats.lastUpdateTime
      : null;

    if (
      timeSinceLastUpdate &&
      timeSinceLastUpdate > config.subgraph.updateInterval * 3
    ) {
      issues.push("Updates are delayed");
    }

    return {
      healthy: issues.length === 0,
      issues,
      status,
      timestamp: new Date(),
    };
  }

  // Cleanup on shutdown
  cleanup() {
    this.stopAutoUpdates();
    logger.info("Incremental updater cleanup completed");
  }
}

// Create singleton instance
const incrementalUpdater = new IncrementalUpdater();

module.exports = incrementalUpdater;
