/**
 * Rwanda Export Explorer - Backend Server
 * Express.js server to serve trade data API endpoints
 */

require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const path = require('path');  
const corsMiddleware = require('./middleware/cors');

// Import database connection
const { connectDB, getConnectionStatus } = require('./utils/database');

// Import route handlers
const exportsRoutes = require('./routes/exports');
const importsRoutes = require('./routes/imports');
const predictionsRoutes = require('./routes/predictions');
const analyticsRoutes = require('./routes/analytics');
const modelsRoutes = require('./routes/models');
const chatRoutes = require('./routes/chat');

// Log route loading
console.log('Loading backend routes...');
console.log('✅ Exports routes loaded');
console.log('✅ Imports routes loaded');
console.log('✅ Predictions routes loaded');
console.log('✅ Analytics routes loaded');

// Initialize Express app
const app = express();
const PORT = process.env.BACKEND_PORT || process.env.PORT || 3000;

// Initialize MongoDB connection and start server
async function initializeApp() {
    try {
        // Connect to MongoDB first
        await connectDB();
        console.log('✅ MongoDB connected successfully');

        // Apply middleware after successful DB connection
        app.use(morgan('dev')); // HTTP request logger
        app.use(express.json()); // Parse JSON request bodies
        app.use(corsMiddleware); // Apply CORS middleware

        // Additional CORS for direct frontend access
        const cors = require('cors');
        app.use(cors({
            origin: ['http://localhost:3001', 'http://localhost:3000', 'http://127.0.0.1:3001', 'http://127.0.0.1:3000'],
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization']
        }));

        // API Routes
        console.log('🔗 Registering API routes...');
        app.use('/api/exports', exportsRoutes);
        console.log('   ✅ /api/exports routes registered');
        app.use('/api/imports', importsRoutes);
        console.log('   ✅ /api/imports routes registered');
        app.use('/api/predictions', predictionsRoutes);
        console.log('   ✅ /api/predictions routes registered');
        app.use('/api/analytics', analyticsRoutes);
        console.log('   ✅ /api/analytics routes registered');
        app.use('/api/models', modelsRoutes);
        console.log('   ✅ /api/models routes registered');
        app.use('/api/chat', chatRoutes);
        console.log('   ✅ /api/chat routes registered');

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
            version: '2.0.0',
            database: 'MongoDB',
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
                { method: 'GET', path: '/api/predictions/live', description: 'Get live ensemble predictions' },
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
              ],
              models: [
                { method: 'GET', path: '/api/models/dashboard', description: 'Get comprehensive model dashboard' },
                { method: 'GET', path: '/api/models/statistical-analyses', description: 'Get statistical analysis results' },
                { method: 'GET', path: '/api/models/ml-models', description: 'Get ML models' },
                { method: 'GET', path: '/api/models/predictions', description: 'Get predictions' },
                { method: 'GET', path: '/api/models/outliers', description: 'Get outlier detection results' },
                { method: 'GET', path: '/api/models/correlations', description: 'Get correlation analyses' },
                { method: 'POST', path: '/api/models/seed-database', description: 'Seed database with initial data' },
                { method: 'GET', path: '/api/models/status', description: 'Get database and model status' },
                { method: 'POST', path: '/api/models/explain-analysis', description: 'Get AI explanation for analysis' },
                { method: 'POST', path: '/api/models/explain-model', description: 'Get AI explanation for model' },
                { method: 'POST', path: '/api/models/explain-correlation', description: 'Get AI explanation for correlation' },
                { method: 'POST', path: '/api/models/explain-outliers', description: 'Get AI explanation for outliers' },
                { method: 'POST', path: '/api/models/comprehensive-insights', description: 'Get comprehensive AI insights' }
              ],
              exports: [
                { method: 'GET', path: '/api/exports/quarterly', description: 'Get quarterly export data' },
                { method: 'GET', path: '/api/exports/destinations', description: 'Get top export destinations' },
                { method: 'GET', path: '/api/exports/products', description: 'Get top export products' },
                { method: 'GET', path: '/api/exports/growth', description: 'Get export growth rates' },
                { method: 'GET', path: '/api/exports/models', description: 'Get ML model results for exports' },
                { method: 'GET', path: '/api/exports/insights', description: 'Get advanced export insights' },
                { method: 'GET', path: '/api/exports/ai-analysis', description: 'Get AI-powered export analysis' }
              ]
            }
          });
        });

        // Health check endpoint with database status
        app.get('/api/health', (req, res) => {
          const dbStatus = getConnectionStatus();
          res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            database: dbStatus,
            uptime: process.uptime()
          });
        });

        // Test route to verify route registration
        app.get('/api/test-routes', (req, res) => {
          res.json({
            message: 'Backend routes are working',
            database: 'MongoDB connected',
            routes: [
              '/api/exports/quarterly',
              '/api/exports/destinations',
              '/api/imports/quarterly',
              '/api/predictions/live',
              '/api/analytics/summary',
              '/api/analysis-results'
            ],
            timestamp: new Date().toISOString()
          });
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
          console.log(`🚀 Rwanda Export Explorer API running on port ${PORT}`);
          console.log(`📊 MongoDB connected: ✅`);
          console.log(`📚 API documentation available at http://localhost:${PORT}/api`);
          console.log(`🔍 Health check available at http://localhost:${PORT}/api/health`);
        });

        return app;
    } catch (error) {
        console.error('❌ Failed to initialize application:', error);
        process.exit(1);
    }
}

// Initialize the application
initializeApp();

module.exports = app; // Export for testing