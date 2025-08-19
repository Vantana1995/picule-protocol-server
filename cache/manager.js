const logger = require("../utils/logger");

class CacheManager {
  constructor() {
    this.cache = {
      // ICO data
      icoRequests: [],
      contributions: [],

      // Project data
      projects: [],
      erc20Tokens: [],

      // Marketplace data
      listings: [],
      sales: [],

      // DEX data
      tokens: [],
      pairs: [],

      // Account data
      accounts: [],

      // Stats
      globalStats: null,
      marketplaceStats: null,
      piculeFactory: null,

      // Metadata
      lastUpdated: null,
      totalRecords: 0,
      isInitialized: false,
      lastBlockNumber: 0,
      lastTimestamp: 0,

      // FundsManager data
      checkpoints: [],
      lpTokenLocks: [],
      bonusClaims: [],

      // Historical price data
      tokenDayData: [],
      tokenHourData: [],
      tokenMinuteData: [],
      pairHourData: [],
      pairDayData: [],
    };
  }

  // Initialize cache with data from initial query
  initialize(data) {
    try {
      this.cache.icoRequests = data.icorequests || [];
      this.cache.contributions = data.contributions || [];
      this.cache.projects = data.projects || [];
      this.cache.erc20Tokens = data.erc20Tokens || [];
      this.cache.listings = data.listings || [];
      this.cache.sales = data.sales || [];
      this.cache.tokens = data.tokens || [];
      this.cache.pairs = data.pairs || [];
      this.cache.accounts = data.accounts || [];
      this.cache.transactions = data.transactions || [];

      // Single objects
      this.cache.globalStats = data.globalStats?.[0] || null;
      this.cache.marketplaceStats = data.marketplaceStats?.[0] || null;
      this.cache.piculeFactory = data.piculeFactory || null;

      // Update metadata
      this.cache.lastUpdated = new Date();
      this.cache.totalRecords = this.calculateTotalRecords();
      this.cache.isInitialized = true;

      if (data.tokens?.length > 0) {
        for (const token of data.tokens) {
          if (token.tokenDayData?.length > 0) {
            const formattedDayData = token.tokenDayData.map((data) => ({
              ...data,
              token: { id: token.id, symbol: token.symbol, name: token.name },
            }));
            this.cache.tokenDayData.push(...formattedDayData);
          }

          if (token.tokenHourData?.length > 0) {
            const formattedHourData = token.tokenHourData.map((data) => ({
              ...data,
              token: { id: token.id, symbol: token.symbol, name: token.name },
            }));
            this.cache.tokenHourData.push(...formattedHourData);
          }

          if (token.tokenMinuteData?.length > 0) {
            const formattedMinuteData = token.tokenMinuteData.map((data) => ({
              ...data,
              token: { id: token.id, symbol: token.symbol, name: token.name },
            }));
            this.cache.tokenMinuteData.push(...formattedMinuteData);
          }
        }
      }

      logger.cache.update("INITIAL_LOAD", this.cache.totalRecords);
      logger.info(
        `Cache initialized with ${this.cache.totalRecords} total records`
      );

      return true;
    } catch (error) {
      logger.error("Failed to initialize cache:", error.message);
      return false;
    }
  }

  // Add new data from incremental updates
  addNewData(newData) {
    try {
      let addedCount = 0;

      // Add new ICO requests
      if (newData.icoRequests?.length > 0) {
        const newRequests = this.addUniqueItems(
          this.cache.icoRequests,
          newData.icoRequests
        );
        addedCount += newRequests;
        logger.cache.update("icoRequests", newRequests);
      }

      // Add new contributions
      if (newData.contributions?.length > 0) {
        const newContributions = this.addUniqueItems(
          this.cache.contributions,
          newData.contributions
        );
        addedCount += newContributions;
        logger.cache.update("contributions", newContributions);
      }

      // Add new projects
      if (newData.projects?.length > 0) {
        const newProjects = this.addUniqueItems(
          this.cache.projects,
          newData.projects
        );
        addedCount += newProjects;
        logger.cache.update("projects", newProjects);
      }

      // Add new listings
      if (newData.listings?.length > 0) {
        const newListings = this.addUniqueItems(
          this.cache.listings,
          newData.listings
        );
        addedCount += newListings;
        logger.cache.update("listings", newListings);
      }

      // Add new sales
      if (newData.sales?.length > 0) {
        const newSales = this.addUniqueItems(this.cache.sales, newData.sales);
        addedCount += newSales;
        logger.cache.update("sales", newSales);
      }

      // Add new DEX tokens
      if (newData.tokens?.length > 0) {
        for (const token of newData.tokens) {
          const existingTokenIndex = this.cache.tokens.findIndex(
            (t) => t.id === token.id
          );
          if (existingTokenIndex >= 0) {
            this.cache.tokens[existingTokenIndex] = token;
          } else {
            this.cache.tokens.push(token);
            addedCount += 1;
          }
          if (token.tokenDayData?.length > 0) {
            const newTokenDayData = this.addUniqueItems(
              this.cache.tokenDayData,
              token.tokenDayData.map((data) => ({
                ...data,
                token: { id: token.id, symbol: token.symbol, name: token.name },
              }))
            );
            addedCount += newTokenDayData;
          }
          if (token.tokenHourData?.length > 0) {
            const newTokenHourData = this.addUniqueItems(
              this.cache.tokenHourData,
              token.tokenHourData.map((data) => ({
                ...data,
                token: { id: token.id, symbol: token.symbol, name: token.name },
              }))
            );
            addedCount += newTokenHourData;
          }

          if (token.tokenMinuteData?.length > 0) {
            const newTokenMinuteData = this.addUniqueItems(
              this.cache.tokenMinuteData,
              token.tokenMinuteData.map((data) => ({
                ...data,
                token: { id: token.id, symbol: token.symbol, name: token.name },
              }))
            );
            addedCount += newTokenMinuteData;
          }
        }

        logger.cache.update("tokens", newData.tokens.length);
      }

      // Add new pairs
      if (newData.pairs?.length > 0) {
        const newPairs = this.addUniqueItems(this.cache.pairs, newData.pairs);
        addedCount += newPairs;
        logger.cache.update("pairs", newPairs);
      }

      // Add new accounts
      if (newData.accounts?.length > 0) {
        const newAccounts = this.addUniqueItems(
          this.cache.accounts,
          newData.accounts
        );
        addedCount += newAccounts;
        logger.cache.update("accounts", newAccounts);
      }
      // Add new FundsManager data
      if (newData.checkpoints?.length > 0) {
        const newCheckpoints = this.addUniqueItems(
          this.cache.checkpoints,
          newData.checkpoints
        );
        addedCount += newCheckpoints;
        logger.cache.update("checkpoints", newCheckpoints);
      }

      if (newData.lpTokenLocks?.length > 0) {
        const newLPTokenLocks = this.addUniqueItems(
          this.cache.lpTokenLocks,
          newData.lpTokenLocks
        );
        addedCount += newLPTokenLocks;
        logger.cache.update("lpTokenLocks", newLPTokenLocks);
      }

      if (newData.bonusClaims?.length > 0) {
        const newBonusClaims = this.addUniqueItems(
          this.cache.bonusClaims,
          newData.bonusClaims
        );
        addedCount += newBonusClaims;
        logger.cache.update("bonusClaims", newBonusClaims);
      }

      // Update metadata
      this.cache.lastUpdated = new Date();
      this.cache.totalRecords = this.calculateTotalRecords();

      if (addedCount > 0) {
        logger.info(`Added ${addedCount} new records to cache`);
      } else {
        logger.debug("No new records to add");
      }

      return addedCount;
    } catch (error) {
      logger.error("Failed to add new data to cache:", error.message);
      return 0;
    }
  }

  // Add unique items to array (avoid duplicates)
  addUniqueItems(existingArray, newItems) {
    const existingIds = new Set(existingArray.map((item) => item.id));
    const uniqueNewItems = newItems.filter((item) => !existingIds.has(item.id));

    existingArray.push(...uniqueNewItems);
    return uniqueNewItems.length;
  }

  // Get data by entity type
  get(entityType) {
    const data = this.cache[entityType];

    if (data === undefined) {
      logger.cache.miss(entityType);
      return null;
    }

    return Array.isArray(data) ? [...data] : data; // Return copy
  }

  // Get all cache data
  getAll() {
    return {
      ...this.cache,
      // Return copies of arrays
      icoRequests: [...this.cache.icoRequests],
      contributions: [...this.cache.contributions],
      projects: [...this.cache.projects],
      erc20Tokens: [...this.cache.erc20Tokens],
      listings: [...this.cache.listings],
      sales: [...this.cache.sales],
      tokens: [...this.cache.tokens],
      pairs: [...this.cache.pairs],
      accounts: [...this.cache.accounts],
    };
  }

  // Get cache statistics
  getStats() {
    return {
      isInitialized: this.cache.isInitialized,
      lastUpdated: this.cache.lastUpdated,
      totalRecords: this.cache.totalRecords,
      entities: {
        icoRequests: this.cache.icoRequests.length,
        contributions: this.cache.contributions.length,
        projects: this.cache.projects.length,
        erc20Tokens: this.cache.erc20Tokens.length,
        listings: this.cache.listings.length,
        sales: this.cache.sales.length,
        tokens: this.cache.tokens.length,
        pairs: this.cache.pairs.length,
      },
    };
  }

  // Calculate total number of records
  calculateTotalRecords() {
    return (
      this.cache.icoRequests.length +
      this.cache.contributions.length +
      this.cache.projects.length +
      this.cache.erc20Tokens.length +
      this.cache.listings.length +
      this.cache.sales.length +
      this.cache.tokens.length +
      this.cache.pairs.length +
      this.cache.accounts.length +
      this.cache.tokenDayData.length +
      this.cache.tokenHourData.length +
      this.cache.tokenMinuteData.length +
      this.cache.checkpoints.length +
      this.cache.lpTokenLocks.length +
      this.cache.bonusClaims.length +
      (this.cache.transactions?.length || 0) +
      (this.cache.globalStats ? 1 : 0) +
      (this.cache.marketplaceStats ? 1 : 0) +
      (this.cache.piculeFactory ? 1 : 0)
    );
  }

  // Check if cache is ready
  isReady() {
    return this.cache.isInitialized && this.cache.totalRecords > 0;
  }

  // Clear all cache
  clear() {
    this.cache = {
      icoRequests: [],
      contributions: [],
      projects: [],
      erc20Tokens: [],
      listings: [],
      sales: [],
      tokens: [],
      pairs: [],
      accounts: [],
      globalStats: null,
      marketplaceStats: null,
      piculeFactory: null,
      lastUpdated: null,
      totalRecords: 0,
      isInitialized: false,
    };

    logger.cache.clear();
  }

  // Get filtered data
  getFiltered(entityType, filterFn) {
    const data = this.get(entityType);
    if (!data || !Array.isArray(data)) return [];

    return data.filter(filterFn);
  }

  // Get specific item by ID
  getById(entityType, id) {
    const data = this.get(entityType);
    if (!data || !Array.isArray(data)) return null;

    return data.find((item) => item.id === id) || null;
  }

  // Get recent items (by timestamp or creation date)
  getRecent(entityType, limit = 10) {
    const data = this.get(entityType);
    if (!data || !Array.isArray(data)) return [];

    return data
      .sort((a, b) => {
        const timeA = a.timestamp || a.createdAt || 0;
        const timeB = b.timestamp || b.createdAt || 0;
        return timeB - timeA; // Newest first
      })
      .slice(0, limit);
  }

  // Get latest price for token
  getLatestTokenPrice(tokenAddress) {
    const address = tokenAddress.toLowerCase();

    // Try minute data first
    const minuteData = this.getFiltered(
      "tokenMinuteData",
      (item) => item.token.id.toLowerCase() === address
    ).sort((a, b) => b.periodStartUnix - a.periodStartUnix);

    if (minuteData.length > 0 && minuteData[0].priceUSD) {
      return {
        priceUSD: parseFloat(minuteData[0].priceUSD),
        timestamp: minuteData[0].periodStartUnix,
        source: "minute",
      };
    }

    // Try hour data
    const hourData = this.getFiltered(
      "tokenHourData",
      (item) => item.token.id.toLowerCase() === address
    ).sort((a, b) => b.periodStartUnix - a.periodStartUnix);

    if (hourData.length > 0 && hourData[0].priceUSD) {
      return {
        priceUSD: parseFloat(hourData[0].priceUSD),
        timestamp: hourData[0].periodStartUnix,
        source: "hour",
      };
    }

    return null;
  }

  // Get historical data for specific token
  getTokenHistoricalData(tokenAddress, timeframe = "hour", limit = 168) {
    const entityType = `token${
      timeframe.charAt(0).toUpperCase() + timeframe.slice(1)
    }Data`;
    const address = tokenAddress.toLowerCase();
    const data = this.getFiltered(
      entityType,
      (item) => item.token.id.toLowerCase() === address
    );

    const sorted = data
      .sort((a, b) => {
        const timeA = a.periodStartUnix || a.date || 0;
        const timeB = b.periodStartUnix || b.date || 0;
        return timeB - timeA;
      })
      .slice(0, limit);

    return sorted.map((item) => ({
      timestamp: item.periodStartUnix || item.date,
      priceUSD: parseFloat(item.priceUSD || 0),
      volume: parseFloat(item.volume || item.dailyVolumeToken || 0),
      volumeUSD: parseFloat(item.volumeUSD || item.dailyVolumeUSD || 0),
      open: parseFloat(item.open || item.priceUSD || 0),
      high: parseFloat(item.high || item.priceUSD || 0),
      low: parseFloat(item.low || item.priceUSD || 0),
      close: parseFloat(item.close || item.priceUSD || 0),
      totalValueLocked: parseFloat(
        item.totalValueLocked || item.totalLiquidityToken || 0
      ),
      totalValueLockedUSD: parseFloat(
        item.totalValueLockedUSD || item.totalLiquidityUSD || 0
      ),
    }));
  }

  // Get all trading tokens
  getTradingTokens() {
    const pairs = this.get("pairs") || [];
    const erc20Tokens = this.get("erc20Tokens") || [];

    const tradingTokenAddresses = new Set();
    pairs.forEach((pair) => {
      tradingTokenAddresses.add(pair.token0.id.toLowerCase());
      tradingTokenAddresses.add(pair.token1.id.toLowerCase());
    });

    return erc20Tokens.filter((token) =>
      tradingTokenAddresses.has(token.id.toLowerCase())
    );
  }
}

// Create singleton instance
const cacheManager = new CacheManager();

module.exports = cacheManager;
