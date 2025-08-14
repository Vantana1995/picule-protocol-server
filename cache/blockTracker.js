const logger = require('../utils/logger');

class BlockTracker {
  constructor() {
    this.currentBlock = 0;
    this.lastUpdated = null;
    this.updateHistory = [];
    this.maxHistorySize = 100;
  }

  // Get current tracked block number
  getCurrentBlock() {
    return this.currentBlock;
  }

  // Update block number
  updateBlock(newBlock) {
    const oldBlock = this.currentBlock;
    
    // Validate new block number
    if (!this.isValidBlockNumber(newBlock)) {
      logger.warn(`Invalid block number received: ${newBlock}`);
      return false;
    }

    // Check if block actually changed
    if (newBlock === oldBlock) {
      logger.block.noChange(newBlock);
      return false;
    }

    // Check if new block is actually newer
    if (newBlock < oldBlock) {
      logger.warn(`New block ${newBlock} is older than current ${oldBlock}`);
      return false;
    }

    // Update block number
    this.currentBlock = newBlock;
    this.lastUpdated = new Date();

    // Add to history
    this.addToHistory(oldBlock, newBlock);

    // Log the update
    logger.block.update(oldBlock, newBlock);

    return true;
  }

  // Initialize block number (only if not set)
  initializeBlock(blockNumber) {
    if (this.currentBlock === 0) {
      this.currentBlock = blockNumber;
      this.lastUpdated = new Date();
      logger.info(`Block tracker initialized at block ${blockNumber}`);
      return true;
    }
    return false;
  }

  // Check if we need to update (has new blocks)
  hasNewBlocks(latestBlock) {
    return latestBlock > this.currentBlock;
  }

  // Get blocks behind count
  getBlocksBehind(latestBlock) {
    return Math.max(0, latestBlock - this.currentBlock);
  }

  // Get time since last update
  getTimeSinceLastUpdate() {
    if (!this.lastUpdated) return null;
    return Date.now() - this.lastUpdated.getTime();
  }

  // Validate block number
  isValidBlockNumber(blockNumber) {
    return (
      typeof blockNumber === 'number' &&
      blockNumber > 0 &&
      Number.isInteger(blockNumber) &&
      blockNumber < Number.MAX_SAFE_INTEGER
    );
  }

  // Add update to history
  addToHistory(oldBlock, newBlock) {
    const historyEntry = {
      timestamp: new Date(),
      oldBlock,
      newBlock,
      blocksAdvanced: newBlock - oldBlock
    };

    this.updateHistory.push(historyEntry);

    // Keep history size under control
    if (this.updateHistory.length > this.maxHistorySize) {
      this.updateHistory.shift();
    }
  }

  // Get recent update history
  getHistory(count = 10) {
    return this.updateHistory.slice(-count);
  }

  // Get average blocks per update
  getAverageBlocksPerUpdate() {
    if (this.updateHistory.length === 0) return 0;

    const totalBlocks = this.updateHistory.reduce(
      (sum, entry) => sum + entry.blocksAdvanced,
      0
    );

    return Math.round(totalBlocks / this.updateHistory.length);
  }

  // Get update frequency (updates per minute)
  getUpdateFrequency() {
    if (this.updateHistory.length < 2) return 0;

    const recent = this.updateHistory.slice(-10);
    const timeSpan = recent[recent.length - 1].timestamp - recent[0].timestamp;
    const minutes = timeSpan / (1000 * 60);

    return Math.round((recent.length - 1) / minutes);
  }

  // Get status information
  getStatus() {
    return {
      currentBlock: this.currentBlock,
      lastUpdated: this.lastUpdated,
      timeSinceLastUpdate: this.getTimeSinceLastUpdate(),
      totalUpdates: this.updateHistory.length,
      averageBlocksPerUpdate: this.getAverageBlocksPerUpdate(),
      updateFrequency: this.getUpdateFrequency()
    };
  }

  // Reset tracker (for testing or reinitializing)
  reset() {
    this.currentBlock = 0;
    this.lastUpdated = null;
    this.updateHistory = [];
    logger.info('Block tracker reset');
  }

  // Check if tracker is healthy
  isHealthy(maxMinutesBehind = 5) {
    const timeSinceUpdate = this.getTimeSinceLastUpdate();
    
    if (!timeSinceUpdate) return false;
    
    const minutesBehind = timeSinceUpdate / (1000 * 60);
    return minutesBehind <= maxMinutesBehind;
  }

  // Export state for persistence
  exportState() {
    return {
      currentBlock: this.currentBlock,
      lastUpdated: this.lastUpdated,
      updateHistory: this.updateHistory.slice(-20) // Keep last 20 entries
    };
  }

  // Import state from persistence
  importState(state) {
    if (state && typeof state === 'object') {
      this.currentBlock = state.currentBlock || 0;
      this.lastUpdated = state.lastUpdated ? new Date(state.lastUpdated) : null;
      this.updateHistory = Array.isArray(state.updateHistory) ? state.updateHistory : [];
      
      logger.info(`Block tracker state imported: block ${this.currentBlock}`);
    }
  }
}

// Create singleton instance
const blockTracker = new BlockTracker();

module.exports = blockTracker;