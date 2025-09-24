/**
 * Rwanda Export Explorer - Frontend Server
 * Express.js server to serve the frontend and provide API endpoints for Excel analysis
 */

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const { PythonShell } = require('python-shell');
const fs = require('fs');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || Math.floor(Math.random() * 1000) + 3000; // Random port between 3000-3999

// Middleware
app.use(morgan('dev'));
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, 'frontend')));

// Serve static assets
app.use('/assets', express.static(path.join(__dirname, 'frontend', 'assets')));

// API Routes
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        port: PORT,
        message: 'Rwanda Export Explorer Frontend Server is running'
    });
});

// API endpoint to analyze Excel data
app.post('/api/analyze-excel', async (req, res) => {
    try {
        console.log('Starting Excel analysis...');

        // Run Python analysis script
        const pythonScript = path.join(__dirname, 'excel_analyzer.py');

        if (!fs.existsSync(pythonScript)) {
            return res.status(500).json({
                error: 'Python analysis script not found',
                message: 'Please ensure excel_analyzer.py exists in the project root'
            });
        }

        const options = {
            mode: 'json',
            pythonPath: 'python', // Use system python
            scriptPath: __dirname,
            args: []
        };

        PythonShell.run('excel_analyzer.py', options, (err, results) => {
            if (err) {
                console.error('Python script error:', err);
                return res.status(500).json({
                    error: 'Analysis failed',
                    message: err.message,
                    details: err
                });
            }

            if (!results || results.length === 0) {
                return res.status(500).json({
                    error: 'No results from analysis',
                    message: 'Python script completed but returned no results'
                });
            }

            const analysisResults = results[0];
            console.log('Analysis completed successfully');

            res.json({
                success: true,
                data: analysisResults,
                metadata: {
                    analysis_time: new Date().toISOString(),
                    server_port: PORT
                }
            });
        });

    } catch (error) {
        console.error('Server error during analysis:', error);
        res.status(500).json({
            error: 'Server error',
            message: error.message
        });
    }
});

// API endpoint to get analysis results (cached)
let cachedAnalysis = null;
let lastAnalysisTime = null;

app.get('/api/analysis-results', (req, res) => {
    // Return cached results if available and recent (within 1 hour)
    if (cachedAnalysis && lastAnalysisTime) {
        const hoursSinceAnalysis = (Date.now() - lastAnalysisTime) / (1000 * 60 * 60);
        if (hoursSinceAnalysis < 1) {
            return res.json({
                success: true,
                data: cachedAnalysis,
                cached: true,
                cache_age_hours: hoursSinceAnalysis
            });
        }
    }

    // Trigger new analysis
    const options = {
        mode: 'json',
        pythonPath: 'python',
        scriptPath: __dirname,
        args: []
    };

    PythonShell.run('excel_analyzer.py', options, (err, results) => {
        if (err) {
            return res.status(500).json({
                error: 'Analysis failed',
                message: err.message
            });
        }

        if (!results || results.length === 0) {
            return res.status(500).json({
                error: 'No results from analysis'
            });
        }

        cachedAnalysis = results[0];
        lastAnalysisTime = Date.now();

        res.json({
            success: true,
            data: cachedAnalysis,
            cached: false
        });
    });
});

// API endpoint to get trade overview
app.get('/api/trade-overview', (req, res) => {
    if (!cachedAnalysis) {
        return res.status(503).json({
            error: 'Analysis not available',
            message: 'Please run analysis first'
        });
    }

    res.json({
        success: true,
        data: cachedAnalysis.trade_overview || {}
    });
});

// API endpoint to get top countries
app.get('/api/top-countries', (req, res) => {
    if (!cachedAnalysis) {
        return res.status(503).json({
            error: 'Analysis not available',
            message: 'Please run analysis first'
        });
    }

    res.json({
        success: true,
        data: cachedAnalysis.top_countries || {}
    });
});

// API endpoint to get commodity analysis
app.get('/api/commodities', (req, res) => {
    if (!cachedAnalysis) {
        return res.status(503).json({
            error: 'Analysis not available',
            message: 'Please run analysis first'
        });
    }

    res.json({
        success: true,
        data: cachedAnalysis.commodities || {}
    });
});

// API endpoint to get insights
app.get('/api/insights', (req, res) => {
    if (!cachedAnalysis) {
        return res.status(503).json({
            error: 'Analysis not available',
            message: 'Please run analysis first'
        });
    }

    res.json({
        success: true,
        data: cachedAnalysis.insights || []
    });
});

// API documentation endpoint
app.get('/api', (req, res) => {
    res.json({
        name: 'Rwanda Export Explorer API',
        version: '1.0.0',
        description: 'API for analyzing Rwanda trade data from Excel files',
        port: PORT,
        endpoints: {
            health: {
                method: 'GET',
                path: '/api/health',
                description: 'Server health check'
            },
            analyzeExcel: {
                method: 'POST',
                path: '/api/analyze-excel',
                description: 'Trigger Excel data analysis'
            },
            analysisResults: {
                method: 'GET',
                path: '/api/analysis-results',
                description: 'Get cached analysis results'
            },
            tradeOverview: {
                method: 'GET',
                path: '/api/trade-overview',
                description: 'Get trade overview data'
            },
            topCountries: {
                method: 'GET',
                path: '/api/top-countries',
                description: 'Get top export/import countries'
            },
            commodities: {
                method: 'GET',
                path: '/api/commodities',
                description: 'Get commodity analysis'
            },
            insights: {
                method: 'GET',
                path: '/api/insights',
                description: 'Get key insights from analysis'
            }
        }
    });
});

// Serve index.html for all non-API routes (SPA support)
app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        error: 'Server error',
        message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not found',
        message: `Route ${req.path} not found`
    });
});

// Start server
app.listen(PORT, () => {
    console.log('='.repeat(60));
    console.log('🇷🇼 RWANDA EXPORT EXPLORER - FRONTEND SERVER');
    console.log('='.repeat(60));
    console.log(`🚀 Server running on port: ${PORT}`);
    console.log(`📊 Excel analysis available at: http://localhost:${PORT}/api/analyze-excel`);
    console.log(`📈 Dashboard available at: http://localhost:${PORT}`);
    console.log(`🔍 API documentation at: http://localhost:${PORT}/api`);
    console.log(`💾 Static files served from: ./frontend/`);
    console.log('='.repeat(60));
    console.log('📋 Available endpoints:');
    console.log('   GET  /api/health - Server health check');
    console.log('   POST /api/analyze-excel - Analyze Excel data');
    console.log('   GET  /api/analysis-results - Get analysis results');
    console.log('   GET  /api/trade-overview - Trade overview data');
    console.log('   GET  /api/top-countries - Top countries data');
    console.log('   GET  /api/commodities - Commodity analysis');
    console.log('   GET  /api/insights - Key insights');
    console.log('='.repeat(60));
    console.log('✨ Open http://localhost:' + PORT + ' in your browser to start exploring!');
    console.log('='.repeat(60));
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down Rwanda Export Explorer server...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down Rwanda Export Explorer server...');
    process.exit(0);
});

module.exports = app;