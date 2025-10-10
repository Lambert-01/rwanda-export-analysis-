/**
 * CORS Middleware Configuration
 * Enables Cross-Origin Resource Sharing for the Rwanda trade analysis systemAPI
 */

const cors = require('cors');

// Configure CORS options
const corsOptions = {
  origin: '*', // Allow all origins in development (restrict in production)
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400 // Cache preflight request results for 24 hours (in seconds)
};

// Export configured CORS middleware
module.exports = cors(corsOptions);