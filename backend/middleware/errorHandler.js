const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  const statusCode = err.status || 500;
  const message = err.message || 'Internal Server Error';

  // Log the error
  logger.error(err, {
    url: req.originalUrl,
    method: req.method,
    user: req.user ? { id: req.user.id, organization_id: req.user.organization_id } : 'anonymous',
    body: req.method !== 'GET' ? req.body : undefined
  });

  res.status(statusCode).json({
    error: message,
    status: statusCode,
    timestamp: new Date().toISOString()
  });
};

module.exports = errorHandler;
