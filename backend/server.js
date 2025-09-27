/**
 * Rwanda Export Explorer - Backend Server
 * Express.js server to serve trade data API endpoints
 */

const express = require('express');
const morgan = require('morgan');
const path = require('path');
const corsMiddleware = require('./middleware/cors');

// Import route handlers
const exportsRoutes = require('./routes/exports');
const importsRoutes = require('./routes/imports');
const predictionsRoutes = require('./routes/predictions');
const analyticsRoutes = require('./routes/analytics');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Apply middleware
app.use(morgan('dev')); // HTTP request logger
app.use(express.json()); // Parse JSON request bodies
app.use(corsMiddleware); // Apply CORS middleware

// API Routes
app.use('/api/exports', exportsRoutes);
app.use('/api/imports', importsRoutes);
app.use('/api/predictions', predictionsRoutes);
app.use('/api/analytics', analyticsRoutes);

// Direct route for analysis-results (for frontend compatibility)
app.get('/api/analysis-results', (req, res) => {
  // Redirect to the analytics route
  req.url = '/analysis-results';
  analyticsRoutes(req, res);
});

// Serve static frontend files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend')));
  
  // Handle SPA routing - serve index.html for any non-API routes
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(__dirname, '../frontend/index.html'));
    }
  });
}

// API documentation route
app.get('/api', (req, res) => {
  res.json({
    message: 'Rwanda Export Explorer API',
    version: '1.0.0',
    endpoints: {
      exports: [
        { method: 'GET', path: '/api/exports/quarterly', description: 'Get quarterly export data' },
        { method: 'GET', path: '/api/exports/destinations', description: 'Get top export destinations' },
        { method: 'GET', path: '/api/exports/products', description: 'Get top export products' },
        { method: 'GET', path: '/api/exports/growth', description: 'Get export growth rates' }
      ],
      imports: [
        { method: 'GET', path: '/api/imports/quarterly', description: 'Get quarterly import data' },
        { method: 'GET', path: '/api/imports/sources', description: 'Get top import sources' },
        { method: 'GET', path: '/api/imports/categories', description: 'Get import categories' },
        { method: 'GET', path: '/api/imports/growth', description: 'Get import growth rates' }
      ],
      predictions: [
        { method: 'GET', path: '/api/predictions/next', description: 'Get predictions for next quarters' },
        { method: 'GET', path: '/api/predictions/opportunities', description: 'Get export opportunities' },
        { method: 'GET', path: '/api/predictions/risks', description: 'Get export risks' }
      ],
      analytics: [
        { method: 'GET', path: '/api/analytics/growth', description: 'Get growth analysis' },
        { method: 'GET', path: '/api/analytics/comparison', description: 'Get exports vs imports comparison' },
        { method: 'GET', path: '/api/analytics/top-products', description: 'Get top products' },
        { method: 'GET', path: '/api/analytics/top-destinations', description: 'Get top destinations' },
        { method: 'GET', path: '/api/analytics/summary', description: 'Get summary statistics' },
        { method: 'GET', path: '/api/analytics/search/:query', description: 'Search trade data' }
      ]
    }
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Server error',
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Rwanda Export Explorer API running on port ${PORT}`);
  console.log(`API documentation available at http://localhost:${PORT}/api`);
});

module.exports = app; // Export for testing