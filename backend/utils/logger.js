const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, '../../logs/error.log');

// Ensure logs directory exists
const logsDir = path.dirname(LOG_FILE);
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logger = {
  error: (err, context = {}) => {
    const timestamp = new Date().toISOString();
    const errorMessage = err.stack || err.message || err;
    const logEntry = JSON.stringify({
      timestamp,
      level: 'ERROR',
      message: errorMessage,
      context
    }) + '\n';

    console.error(`[${timestamp}] ERROR:`, errorMessage, context);

    fs.appendFile(LOG_FILE, logEntry, (fsErr) => {
      if (fsErr) console.error('Failed to write to log file:', fsErr);
    });
  },
  info: (message, context = {}) => {
    const timestamp = new Date().toISOString();
    const logEntry = JSON.stringify({
      timestamp,
      level: 'INFO',
      message,
      context
    }) + '\n';

    console.log(`[${timestamp}] INFO:`, message, context);
    // Info logs could go to a separate file if needed
  }
};

module.exports = logger;
