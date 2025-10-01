/**
 * ML Models API Routes
 * Provides endpoints for accessing ML models, predictions, and statistical analysis results
 */

const express = require('express');
const router = express.Router();
const {
    StatisticalAnalysis,
    MLModel,
    Predictions,
    Outliers,
    CorrelationAnalysis
} = require('../utils/database');
const aiExplanationService = require('../utils/aiExplanationService');

/**
 * @route   GET /api/models/statistical-analyses
 * @desc    Get all statistical analysis results
 * @access  Public
 * @query   {string} type - Filter by analysis type
 * @query   {number} limit - Limit number of results (default: 20)
 */
router.get('/statistical-analyses', async (req, res) => {
    try {
        const { type, limit = 20 } = req.query;

        console.log('📊 Fetching statistical analyses...');

        let query = {};
        if (type) {
            query.analysis_type = type;
        }

        const analyses = await StatisticalAnalysis.find(query)
            .sort({ created_at: -1 })
            .limit(parseInt(limit));

        const result = {
            count: analyses.length,
            analyses: analyses,
            last_updated: new Date().toISOString()
        };

        res.json(result);
    } catch (error) {
        console.error('Error fetching statistical analyses:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route   GET /api/models/ml-models
 * @desc    Get all ML models
 * @access  Public
 * @query   {string} type - Filter by model type
 * @query   {string} status - Filter by model status
 */
router.get('/ml-models', async (req, res) => {
    try {
        const { type, status } = req.query;

        console.log('🤖 Fetching ML models...');

        let query = {};
        if (type) {
            query.model_type = type;
        }
        if (status) {
            query.status = status;
        }

        const models = await MLModel.find(query)
            .sort({ created_at: -1 });

        const result = {
            count: models.length,
            models: models,
            last_updated: new Date().toISOString()
        };

        res.json(result);
    } catch (error) {
        console.error('Error fetching ML models:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route   GET /api/models/predictions
 * @desc    Get all predictions
 * @access  Public
 * @query   {string} type - Filter by prediction type
 * @query   {number} limit - Limit number of results (default: 10)
 */
router.get('/predictions', async (req, res) => {
    try {
        const { type, limit = 10 } = req.query;

        console.log('🔮 Fetching predictions...');

        let query = {};
        if (type) {
            query.prediction_type = type;
        }

        const predictions = await Predictions.find(query)
            .populate('model_used')
            .sort({ created_at: -1 })
            .limit(parseInt(limit));

        const result = {
            count: predictions.length,
            predictions: predictions,
            last_updated: new Date().toISOString()
        };

        res.json(result);
    } catch (error) {
        console.error('Error fetching predictions:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route   GET /api/models/outliers
 * @desc    Get outlier detection results
 * @access  Public
 * @query   {string} dataset - Filter by dataset
 * @query   {string} method - Filter by detection method
 */
router.get('/outliers', async (req, res) => {
    try {
        const { dataset, method } = req.query;

        console.log('🔍 Fetching outlier analyses...');

        let query = {};
        if (dataset) {
            query.dataset = dataset;
        }
        if (method) {
            query.detection_method = method;
        }

        const outliers = await Outliers.find(query)
            .sort({ created_at: -1 });

        const result = {
            count: outliers.length,
            analyses: outliers,
            last_updated: new Date().toISOString()
        };

        res.json(result);
    } catch (error) {
        console.error('Error fetching outlier analyses:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route   GET /api/models/correlations
 * @desc    Get correlation analysis results
 * @access  Public
 * @query   {string} dataset - Filter by dataset
 * @query   {string} method - Filter by correlation method
 */
router.get('/correlations', async (req, res) => {
    try {
        const { dataset, method } = req.query;

        console.log('🔗 Fetching correlation analyses...');

        let query = {};
        if (dataset) {
            query.dataset = dataset;
        }
        if (method) {
            query.analysis_method = method;
        }

        const correlations = await CorrelationAnalysis.find(query)
            .sort({ created_at: -1 });

        const result = {
            count: correlations.length,
            analyses: correlations,
            last_updated: new Date().toISOString()
        };

        res.json(result);
    } catch (error) {
        console.error('Error fetching correlation analyses:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route   GET /api/models/dashboard
 * @desc    Get comprehensive model dashboard data
 * @access  Public
 */
router.get('/dashboard', async (req, res) => {
    try {
        console.log('📊 Fetching model dashboard data...');

        // Get latest statistical analysis
        const latestAnalysis = await StatisticalAnalysis.findOne({})
            .sort({ created_at: -1 });

        // Get active ML models
        const activeModels = await MLModel.find({ status: 'deployed' });

        // Get recent predictions
        const recentPredictions = await Predictions.find({})
            .sort({ created_at: -1 })
            .limit(5)
            .populate('model_used');

        // Get latest outlier analysis
        const latestOutliers = await Outliers.findOne({})
            .sort({ created_at: -1 });

        // Get latest correlation analysis
        const latestCorrelations = await CorrelationAnalysis.findOne({})
            .sort({ created_at: -1 });

        const dashboard = {
            summary: {
                total_analyses: await StatisticalAnalysis.countDocuments(),
                total_models: await MLModel.countDocuments(),
                total_predictions: await Predictions.countDocuments(),
                active_models: activeModels.length
            },
            latest_analysis: latestAnalysis,
            active_models: activeModels,
            recent_predictions: recentPredictions,
            outlier_analysis: latestOutliers,
            correlation_analysis: latestCorrelations,
            last_updated: new Date().toISOString()
        };

        res.json(dashboard);
    } catch (error) {
        console.error('Error fetching model dashboard:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route   POST /api/models/seed-database
 * @desc    Seed database with initial data
 * @access  Public
 */
router.post('/seed-database', async (req, res) => {
    try {
        console.log('🌱 Seeding database...');

        const { seedDatabase } = require('../utils/seedDatabase');
        await seedDatabase();

        res.json({
            success: true,
            message: 'Database seeded successfully',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error seeding database:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route   GET /api/models/status
 * @desc    Get database and model status
 * @access  Public
 */
router.get('/status', async (req, res) => {
    try {
        console.log('📊 Fetching model status...');

        const { getSeedingStatus, verifyDataIntegrity } = require('../utils/seedDatabase');

        const seedingStatus = await getSeedingStatus();
        const integrityCheck = await verifyDataIntegrity();

        const status = {
            database_status: {
                connected: true,
                collections: seedingStatus,
                integrity_check: integrityCheck
            },
            model_status: {
                total_models: await MLModel.countDocuments(),
                deployed_models: await MLModel.countDocuments({ status: 'deployed' }),
                total_analyses: await StatisticalAnalysis.countDocuments(),
                total_predictions: await Predictions.countDocuments()
            },
            last_updated: new Date().toISOString()
        };

        res.json(status);
    } catch (error) {
        console.error('Error fetching model status:', error);
        res.status(500).json({ error: error.message });
    }
 });

/**
 * @route   POST /api/models/explain-analysis
 * @desc    Get AI explanation for analysis results
 * @access  Public
 */
router.post('/explain-analysis', async (req, res) => {
    try {
        const { analysisData, analysisType } = req.body;

        if (!analysisData || !analysisType) {
            return res.status(400).json({
                error: 'Missing required fields: analysisData and analysisType'
            });
        }

        console.log('🤖 Generating AI explanation for analysis...');

        const explanation = await aiExplanationService.generateAnalysisExplanation(analysisData, analysisType);

        res.json(explanation);
    } catch (error) {
        console.error('Error generating analysis explanation:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route   POST /api/models/explain-model
 * @desc    Get AI explanation for model performance
 * @access  Public
 */
router.post('/explain-model', async (req, res) => {
    try {
        const { modelData } = req.body;

        if (!modelData) {
            return res.status(400).json({
                error: 'Missing required field: modelData'
            });
        }

        console.log('🤖 Generating AI explanation for model...');

        const explanation = await aiExplanationService.generateModelExplanation(modelData);

        res.json(explanation);
    } catch (error) {
        console.error('Error generating model explanation:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route   POST /api/models/explain-correlation
 * @desc    Get AI explanation for correlation analysis
 * @access  Public
 */
router.post('/explain-correlation', async (req, res) => {
    try {
        const { correlationData } = req.body;

        if (!correlationData) {
            return res.status(400).json({
                error: 'Missing required field: correlationData'
            });
        }

        console.log('🤖 Generating AI explanation for correlation...');

        const explanation = await aiExplanationService.generateCorrelationExplanation(correlationData);

        res.json(explanation);
    } catch (error) {
        console.error('Error generating correlation explanation:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route   POST /api/models/explain-outliers
 * @desc    Get AI explanation for outlier detection
 * @access  Public
 */
router.post('/explain-outliers', async (req, res) => {
    try {
        const { outlierData } = req.body;

        if (!outlierData) {
            return res.status(400).json({
                error: 'Missing required field: outlierData'
            });
        }

        console.log('🤖 Generating AI explanation for outliers...');

        const explanation = await aiExplanationService.generateOutlierExplanation(outlierData);

        res.json(explanation);
    } catch (error) {
        console.error('Error generating outlier explanation:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route   POST /api/models/comprehensive-insights
 * @desc    Get comprehensive AI insights for trade data
 * @access  Public
 */
router.post('/comprehensive-insights', async (req, res) => {
    try {
        const { tradeData } = req.body;

        if (!tradeData) {
            return res.status(400).json({
                error: 'Missing required field: tradeData'
            });
        }

        console.log('🤖 Generating comprehensive AI insights...');

        const insights = await aiExplanationService.generateComprehensiveInsights(tradeData);

        res.json(insights);
    } catch (error) {
        console.error('Error generating comprehensive insights:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;