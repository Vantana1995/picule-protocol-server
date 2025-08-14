const config = require('../config/config');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Log levels
const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

// Current log level from config
const currentLogLevel = LOG_LEVELS[config.logging.level] || LOG_LEVELS.info;

// Get current timestamp
const getTimestamp = () => {
  return new Date().toISOString();
};

// Format log message with color
const formatMessage = (level, message, data = null) => {
  const timestamp = getTimestamp();
  const upperLevel = level.toUpperCase();
  
  // Choose color based on level
  let color = colors.white;
  switch (level) {
    case 'debug':
      color = colors.cyan;
      break;
    case 'info':
      color = colors.green;
      break;
    case 'warn':
      color = colors.yellow;
      break;
    case 'error':
      color = colors.red;
      break;
  }

  let logMessage = `${colors.dim}[${timestamp}]${colors.reset} ${color}${upperLevel}${colors.reset}: ${message}`;
  
  if (data) {
    logMessage += `\n${colors.dim}${JSON.stringify(data, null, 2)}${colors.reset}`;
  }

  return logMessage;
};

// Check if should log based on level
const shouldLog = (level) => {
  return LOG_LEVELS[level] >= currentLogLevel;
};

// Logger functions
const logger = {
  debug: (message, data = null) => {
    if (shouldLog('debug') && config.logging.enableConsole) {
      console.log(formatMessage('debug', message, data));
    }
  },

  info: (message, data = null) => {
    if (shouldLog('info') && config.logging.enableConsole) {
      console.log(formatMessage('info', message, data));
    }
  },

  warn: (message, data = null) => {
    if (shouldLog('warn') && config.logging.enableConsole) {
      console.warn(formatMessage('warn', message, data));
    }
  },

  error: (message, data = null) => {
    if (shouldLog('error') && config.logging.enableConsole) {
      console.error(formatMessage('error', message, data));
    }
  },

  // Special loggers for specific events
  subgraph: {
    request: (query, variables) => {
      logger.debug('Subgraph Request', { query: query.substring(0, 100) + '...', variables });
    },
    
    response: (dataSize) => {
      logger.info(`Subgraph Response: ${dataSize} records received`);
    },
    
    error: (error) => {
      logger.error('Subgraph Error', { 
        message: error.message,
        stack: error.stack 
      });
    }
  },

  cache: {
    update: (entityType, count) => {
      logger.info(`Cache Updated: ${entityType} (${count} records)`);
    },
    
    miss: (key) => {
      logger.warn(`Cache Miss: ${key}`);
    },

    clear: () => {
      logger.info('Cache Cleared');
    }
  },

  server: {
    start: (port) => {
      logger.info(`🚀 Server started on port ${port}`);
    },
    
    request: (method, url, ip) => {
      logger.debug(`${method} ${url} from ${ip}`);
    },
    
    error: (error, req) => {
      logger.error('Server Error', {
        message: error.message,
        url: req?.url,
        method: req?.method,
        ip: req?.ip
      });
    }
  },

  block: {
    update: (oldBlock, newBlock) => {
      logger.info(`Block Updated: ${oldBlock} → ${newBlock}`);
    },
    
    noChange: (currentBlock) => {
      logger.debug(`No new blocks: still at ${currentBlock}`);
    }
  }
};

module.exports = logger;