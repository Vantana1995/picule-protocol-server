const fetch = require("node-fetch");
const config = require("../config/config");
const logger = require("../utils/logger");

class GraphQLClient {
  constructor() {
    this.url = config.subgraph.url;
    this.timeout = config.subgraph.requestTimeout;
    this.maxRetries = config.subgraph.maxRetries;
    this.retryDelay = config.subgraph.retryDelay;
  }

  // Main method to execute GraphQL queries
  async query(query, variables = {}) {
    let lastError;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        logger.subgraph.request(query, variables);

        const response = await this.makeRequest(query, variables);
        const data = await this.parseResponse(response);

        // Log successful response
        const recordCount = this.countRecords(data);
        logger.subgraph.response(recordCount);

        return data;
      } catch (error) {
        lastError = error;
        logger.error(
          `GraphQL request attempt ${attempt} failed: ${error.message}`
        );

        // If not the last attempt, wait before retrying
        if (attempt < this.maxRetries) {
          logger.info(`Retrying in ${this.retryDelay}ms...`);
          await this.delay(this.retryDelay);
        }
      }
    }

    // All attempts failed
    logger.subgraph.error(lastError);
    throw new Error(
      `GraphQL request failed after ${this.maxRetries} attempts: ${lastError.message}`
    );
  }

  // Make HTTP request to subgraph
  async makeRequest(query, variables) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(this.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Picule-Server/1.0",
        },
        body: JSON.stringify({
          query,
          variables,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === "AbortError") {
        throw new Error(`Request timeout after ${this.timeout}ms`);
      }

      throw error;
    }
  }

  // Parse and validate response
  async parseResponse(response) {
    if (!response.ok) {
      throw new Error(
        `HTTP error! status: ${response.status} ${response.statusText}`
      );
    }

    const responseData = await response.json();

    // Check for GraphQL errors
    if (responseData.errors && responseData.errors.length > 0) {
      const errorMessage = responseData.errors
        .map((err) => err.message)
        .join(", ");
      throw new Error(`GraphQL error: ${errorMessage}`);
    }

    // Check if data exists
    if (!responseData.data) {
      throw new Error("No data returned from GraphQL query");
    }

    return responseData.data;
  }

  // Count total records in response for logging
  countRecords(data) {
    let count = 0;

    for (const [key, value] of Object.entries(data)) {
      if (Array.isArray(value)) {
        count += value.length;
      } else if (key !== "_meta") {
        count += 1;
      }
    }

    return count;
  }

  // Utility method for delays
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Method to check if subgraph is healthy
  async healthCheck() {
    try {
      const healthQuery = `
        query HealthCheck {
          _meta {
            block {
              number
            }
          }
        }
      `;

      const data = await this.query(healthQuery);

      if (data._meta && data._meta.block && data._meta.block.number) {
        return {
          healthy: true,
          blockNumber: data._meta.block.number,
          timestamp: new Date().toISOString(),
        };
      }

      return {
        healthy: false,
        error: "Invalid response structure",
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
      };
    }
  }

  // Get current block number only
  async getCurrentBlock() {
    try {
      const blockQuery = `
        query GetCurrentBlock {
          _meta {
            block {
              number
            }
          }
        }
      `;

      const data = await this.query(blockQuery);
      return data._meta?.block?.number || 0;
    } catch (error) {
      logger.error("Failed to get current block:", error.message);
      return 0;
    }
  }
}

// Create singleton instance
const graphqlClient = new GraphQLClient();

module.exports = graphqlClient;
