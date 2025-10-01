/**
 * Rwanda Export Explorer - Frontend Server
 * Express.js server to serve the frontend and provide API endpoints for Excel analysis
 */

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001; // Use environment variable or default to 3001

// Middleware
app.use(morgan('dev'));
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, 'frontend')));

// Serve static assets
app.use('/assets', express.static(path.join(__dirname, 'frontend', 'assets')));

// API Routes - Order matters! More specific routes first
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        port: PORT,
        message: 'Rwanda Export Explorer Frontend Server is running'
    });
});

// CRITICAL: Main API proxy MUST come BEFORE other routes to avoid conflicts
// This handles all /api/* requests
app.use('/api', async (req, res) => {
    try {
        // Keep the full path including /api prefix for the backend
        const backendUrl = `http://localhost:3000${req.originalUrl}`;
        console.log(`[API PROXY] ${req.method} ${req.originalUrl} → ${backendUrl}`);

        // Prepare headers, removing host to avoid conflicts
        const headers = { ...req.headers };
        delete headers.host;

        // Prepare request body
        let body = undefined;
        if (req.method !== 'GET' && req.method !== 'HEAD') {
            if (req.body) {
                body = JSON.stringify(req.body);
            }
        }

        const response = await fetch(backendUrl, {
            method: req.method,
            headers: headers,
            body: body
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[API PROXY ERROR] Backend ${response.status}: ${errorText}`);
            throw new Error(`Backend responded with ${response.status}: ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('[API PROXY ERROR]', error.message);
        res.status(500).json({
            error: 'Backend server error',
            message: error.message,
            details: 'Failed to proxy request to backend server on port 3000',
            url: req.originalUrl
        });
    }
});

// Legacy proxy routes for backward compatibility - these should not conflict with /api/*
app.use('/exports', async (req, res) => {
    try {
        const backendUrl = `http://localhost:3000/api/exports${req.url}`;
        console.log(`[EXPORTS PROXY] ${req.method} ${req.url} → ${backendUrl}`);

        const headers = { ...req.headers };
        delete headers.host;

        const response = await fetch(backendUrl, {
            method: req.method,
            headers: headers
        });

        if (!response.ok) {
            throw new Error(`Backend responded with ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('[EXPORTS PROXY ERROR]', error.message);
        res.status(500).json({
            error: 'Backend server error',
            message: error.message
        });
    }
});

app.use('/imports', async (req, res) => {
    try {
        const backendUrl = `http://localhost:3000/api/imports${req.url}`;
        console.log(`[IMPORTS PROXY] ${req.method} ${req.url} → ${backendUrl}`);

        const headers = { ...req.headers };
        delete headers.host;

        const response = await fetch(backendUrl, {
            method: req.method,
            headers: headers
        });

        if (!response.ok) {
            throw new Error(`Backend responded with ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('[IMPORTS PROXY ERROR]', error.message);
        res.status(500).json({
            error: 'Backend server error',
            message: error.message
        });
    }
});

app.use('/predictions', async (req, res) => {
    try {
        const backendUrl = `http://localhost:3000/api/predictions${req.url}`;
        console.log(`[PREDICTIONS PROXY] ${req.method} ${req.url} → ${backendUrl}`);

        const headers = { ...req.headers };
        delete headers.host;

        const response = await fetch(backendUrl, {
            method: req.method,
            headers: headers
        });

        if (!response.ok) {
            throw new Error(`Backend responded with ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('[PREDICTIONS PROXY ERROR]', error.message);
        res.status(500).json({
            error: 'Backend server error',
            message: error.message
        });
    }
});

app.use('/analytics', async (req, res) => {
    try {
        const backendUrl = `http://localhost:3000/api/analytics${req.url}`;
        console.log(`[ANALYTICS PROXY] ${req.method} ${req.url} → ${backendUrl}`);

        const headers = { ...req.headers };
        delete headers.host;

        const response = await fetch(backendUrl, {
            method: req.method,
            headers: headers
        });

        if (!response.ok) {
            throw new Error(`Backend responded with ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('[ANALYTICS PROXY ERROR]', error.message);
        res.status(500).json({
            error: 'Backend server error',
            message: error.message
        });
    }
});

// Direct proxy for analysis-results endpoint (for backward compatibility)
app.get('/analysis-results', async (req, res) => {
    try {
        const backendUrl = `http://localhost:3000/api/analysis-results`;
        console.log(`[ANALYSIS PROXY] ${req.method} ${req.url} → ${backendUrl}`);

        const headers = { ...req.headers };
        delete headers.host;

        const response = await fetch(backendUrl, {
            method: req.method,
            headers: headers
        });

        if (!response.ok) {
            throw new Error(`Backend responded with ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('[ANALYSIS PROXY ERROR]', error.message);
        res.status(500).json({
            error: 'Backend server error',
            message: error.message
        });
    }
});

// API endpoint to analyze Excel data
app.post('/api/analyze-excel', async (req, res) => {
    try {
        console.log('Starting Excel analysis...');

        // Run Python analysis script
        const pythonScript = path.join(__dirname, 'python_processing', 'export_analyzer.py');

        if (!fs.existsSync(pythonScript)) {
            return res.status(500).json({
                error: 'Python analysis script not found',
                message: 'Please ensure export_analyzer.py exists in the python_processing directory'
            });
        }

        // Run Python script using spawn
        const pythonProcess = spawn('python', ['export_analyzer.py'], {
            cwd: path.join(__dirname, 'python_processing'),
            stdio: ['pipe', 'pipe', 'pipe']
        });

        let stdout = '';
        let stderr = '';

        pythonProcess.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                console.error('Python script error:', stderr);
                return res.status(500).json({
                    error: 'Analysis failed',
                    message: stderr,
                    details: `Python script exited with code ${code}`
                });
            }

            try {
                // Try to parse JSON output from Python script
                const analysisResults = JSON.parse(stdout.trim());
                console.log('Analysis completed successfully');

                res.json({
                    success: true,
                    data: analysisResults,
                    metadata: {
                        analysis_time: new Date().toISOString(),
                        server_port: PORT
                    }
                });
            } catch (parseError) {
                console.error('Failed to parse Python output:', parseError);
                res.status(500).json({
                    error: 'Analysis failed',
                    message: 'Failed to parse analysis results',
                    details: parseError.message,
                    stdout: stdout,
                    stderr: stderr
                });
            }
        });

        pythonProcess.on('error', (error) => {
            console.error('Failed to start Python script:', error);
            res.status(500).json({
                error: 'Analysis failed',
                message: 'Failed to start Python script',
                details: error.message
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
    const pythonProcess = spawn('python', ['export_analyzer.py'], {
        cwd: path.join(__dirname, 'python_processing'),
        stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
    });

    pythonProcess.on('close', (code) => {
        if (code !== 0) {
            console.error('Python script error:', stderr);
            return res.status(500).json({
                error: 'Analysis failed',
                message: stderr,
                details: `Python script exited with code ${code}`
            });
        }

        try {
            const analysisResults = JSON.parse(stdout.trim());
            cachedAnalysis = analysisResults;
            lastAnalysisTime = Date.now();

            console.log('Analysis completed successfully, data cached');
            res.json({
                success: true,
                data: cachedAnalysis,
                cached: false
            });
        } catch (parseError) {
            console.error('Failed to parse Python output:', parseError);
            res.status(500).json({
                error: 'Analysis failed',
                message: 'Failed to parse analysis results',
                details: parseError.message,
                stdout: stdout,
                stderr: stderr
            });
        }
    });

    pythonProcess.on('error', (error) => {
        console.error('Failed to start Python script:', error);
        res.status(500).json({
            error: 'Analysis failed',
            message: 'Failed to start Python script',
            details: error.message
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

// API endpoint to get exports data (alias for top-countries)
app.get('/api/exports', (req, res) => {
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

// API endpoint to get predictions (alias for ai-forecasts)
app.get('/api/predictions', (req, res) => {
    if (!cachedAnalysis) {
        return res.status(503).json({
            error: 'Analysis not available',
            message: 'Please run analysis first'
        });
    }

    res.json({
        success: true,
        data: cachedAnalysis.ai_forecasts || {}
    });
});

// API endpoint to get imports data
app.get('/api/imports', (req, res) => {
    if (!cachedAnalysis) {
        return res.status(503).json({
            error: 'Analysis not available',
            message: 'Please run analysis first'
        });
    }

    res.json({
        success: true,
        data: cachedAnalysis.commodities?.top_import_commodities || []
    });
});

// API endpoint to get exports destinations
app.get('/api/exports/destinations', (req, res) => {
    if (!cachedAnalysis) {
        return res.status(503).json({
            error: 'Analysis not available',
            message: 'Please run analysis first'
        });
    }

    res.json({
        success: true,
        data: cachedAnalysis.top_countries?.top_export_countries || []
    });
});

// API endpoint to analyze (alias for analyze-excel)
app.post('/api/analyze', async (req, res) => {
    try {
        console.log('Starting Excel analysis...');

        // Run Python analysis script
        const pythonScript = path.join(__dirname, 'python_processing', 'export_analyzer.py');

        if (!fs.existsSync(pythonScript)) {
            return res.status(500).json({
                error: 'Python analysis script not found',
                message: 'Please ensure export_analyzer.py exists in the python_processing directory'
            });
        }

        // Run Python script using spawn
        const pythonProcess = spawn('python', ['export_analyzer.py'], {
            cwd: path.join(__dirname, 'python_processing'),
            stdio: ['pipe', 'pipe', 'pipe']
        });

        let stdout = '';
        let stderr = '';

        pythonProcess.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                console.error('Python script error:', stderr);
                return res.status(500).json({
                    error: 'Analysis failed',
                    message: stderr,
                    details: `Python script exited with code ${code}`
                });
            }

            try {
                const analysisResults = JSON.parse(stdout.trim());
                console.log('Analysis completed successfully');

                res.json({
                    success: true,
                    data: analysisResults,
                    metadata: {
                        analysis_time: new Date().toISOString(),
                        server_port: PORT
                    }
                });
            } catch (parseError) {
                console.error('Failed to parse Python output:', parseError);
                res.status(500).json({
                    error: 'Analysis failed',
                    message: 'Failed to parse analysis results',
                    details: parseError.message,
                    stdout: stdout,
                    stderr: stderr
                });
            }
        });

        pythonProcess.on('error', (error) => {
            console.error('Failed to start Python script:', error);
            res.status(500).json({
                error: 'Analysis failed',
                message: 'Failed to start Python script',
                details: error.message
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

// API endpoint to get regional analysis
app.get('/api/regional-analysis', (req, res) => {
    if (!cachedAnalysis) {
        return res.status(503).json({
            error: 'Analysis not available',
            message: 'Please run analysis first'
        });
    }

    res.json({
        success: true,
        data: cachedAnalysis.regional_analysis || {}
    });
});

// API endpoint to get commodity analysis
app.get('/api/commodity-analysis', (req, res) => {
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

// API endpoint to get detailed commodities
app.get('/api/detailed-commodities', (req, res) => {
    if (!cachedAnalysis) {
        return res.status(503).json({
            error: 'Analysis not available',
            message: 'Please run analysis first'
        });
    }

    res.json({
        success: true,
        data: cachedAnalysis.detailed_commodities || {}
    });
});

// API endpoint to get AI forecasts
app.get('/api/ai-forecasts', (req, res) => {
    if (!cachedAnalysis) {
        return res.status(503).json({
            error: 'Analysis not available',
            message: 'Please run analysis first'
        });
    }

    res.json({
        success: true,
        data: cachedAnalysis.ai_forecasts || {}
    });
});

// API endpoint to get raw data by sheet
app.get('/api/raw-data/:sheet', (req, res) => {
    if (!cachedAnalysis) {
        return res.status(503).json({
            error: 'Analysis not available',
            message: 'Please run analysis first'
        });
    }

    const sheetName = req.params.sheet;
    const rawData = cachedAnalysis.get('raw_data', {}).get(sheetName, []);

    res.json({
        success: true,
        data: rawData,
        sheet: sheetName
    });
});

// API endpoint to get metadata
app.get('/api/metadata', (req, res) => {
    if (!cachedAnalysis) {
        return res.status(503).json({
            error: 'Analysis not available',
            message: 'Please run analysis first'
        });
    }

    res.json({
        success: true,
        data: cachedAnalysis.metadata || {}
    });
});
   
// API documentation endpoint
app.get('/api', (req, res) => {
    res.json({
        name: 'Rwanda Export Explorer API',
        version: '2.1.0',
        description: 'Comprehensive API for analyzing Rwanda trade data from Excel files with AI capabilities',
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
            },
            regionalAnalysis: {
                method: 'GET',
                path: '/api/regional-analysis',
                description: 'Get regional and continental analysis'
            },
            commodityAnalysis: {
                method: 'GET',
                path: '/api/commodity-analysis',
                description: 'Get detailed commodity analysis'
            },
            detailedCommodities: {
                method: 'GET',
                path: '/api/detailed-commodities',
                description: 'Get detailed commodity breakdown'
            },
            aiForecasts: {
                method: 'GET',
                path: '/api/ai-forecasts',
                description: 'Get AI-powered forecasts'
            },
            rawData: {
                method: 'GET',
                path: '/api/raw-data/:sheet',
                description: 'Get raw data by sheet name'
            },
            metadata: {
                method: 'GET',
                path: '/api/metadata',
                description: 'Get analysis metadata'
            }
        },
        features: [
            'Complete Q4 2024 Rwanda trade data analysis',
            'AI-powered forecasting and predictions',
            'Regional and continental trade analysis',
            'Detailed commodity breakdown by SITC sections',
            'Interactive charts and visualizations',
            'Export functionality for reports',
            'Real-time data processing and caching'
        ]
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
    console.log('📋 Available proxy routes:');
    console.log('   /api/* → http://localhost:3000/api/* (Main API proxy)');
    console.log('   /exports/* → http://localhost:3000/api/exports/* (Legacy exports)');
    console.log('   /imports/* → http://localhost:3000/api/imports/* (Legacy imports)');
    console.log('   /predictions/* → http://localhost:3000/api/predictions/* (Legacy predictions)');
    console.log('   /analytics/* → http://localhost:3000/api/analytics/* (Legacy analytics)');
    console.log('   /analysis-results → http://localhost:3000/api/analysis-results (Direct)');
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