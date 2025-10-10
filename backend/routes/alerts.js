/**
 * Alerts API Routes
 * Provides endpoints for managing AI-powered alerts and notifications
 */

const express = require('express');
const router = express.Router();
const { aiAlertSystem } = require('../utils/aiExplanationService');

// Simulated real-time alert generation for Rwanda trade data
let alertGenerationInterval = null;

// Alert generation functions
function generateExportAnomalyAlert() {
    return {
        id: `export_anomaly_${Date.now()}`,
        rule_id: 'export_value_monitor',
        name: 'Export Value Anomaly',
        message: 'Export values have shown unusual patterns in the last 24 hours. Values are 45% above the expected range for this period.',
        severity: 'high',
        category: 'market_change',
        timestamp: new Date().toISOString(),
        data: {
            current_value: 677.45,
            expected_range: '370-480',
            deviation_percentage: 45.2,
            affected_commodities: ['Gold', 'Coffee', 'Tea']
        },
        status: 'new',
        acknowledged: false
    };
}

function generateImportSpikeAlert() {
    return {
        id: `import_spike_${Date.now()}`,
        rule_id: 'import_volume_monitor',
        name: 'Import Spike Detection',
        message: 'Significant increase in import volumes detected from primary trading partners. Import values up 78% compared to last month.',
        severity: 'medium',
        category: 'market_change',
        timestamp: new Date().toISOString(),
        data: {
            current_imports: 1629.39,
            previous_month: 913.45,
            increase_percentage: 78.3,
            primary_sources: ['China', 'India', 'Tanzania']
        },
        status: 'new',
        acknowledged: false
    };
}

function generateTradeBalanceAlert() {
    return {
        id: `trade_balance_${Date.now()}`,
        rule_id: 'balance_monitor',
        name: 'Trade Balance Shift',
        message: 'Trade deficit has widened significantly. Current deficit stands at $951.94M, showing a 23% deterioration from last quarter.',
        severity: 'medium',
        category: 'economic_policy',
        timestamp: new Date().toISOString(),
        data: {
            current_balance: -951.94,
            previous_balance: -773.12,
            change_percentage: -23.1,
            trend_direction: 'deteriorating'
        },
        status: 'new',
        acknowledged: false
    };
}

function generateDataQualityAlert() {
    return {
        id: `data_quality_${Date.now()}`,
        rule_id: 'data_integrity_monitor',
        name: 'Data Quality Issue',
        message: 'Data inconsistencies detected in recent trade records. Missing commodity classifications for 15% of entries.',
        severity: 'low',
        category: 'data_quality',
        timestamp: new Date().toISOString(),
        data: {
            issue_type: 'missing_classifications',
            affected_percentage: 15.2,
            affected_records: 1247,
            suggested_action: 'Review and update commodity classifications'
        },
        status: 'new',
        acknowledged: false
    };
}

function generateRandomAlert() {
    const alertTypes = [
        generateExportAnomalyAlert,
        generateImportSpikeAlert,
        generateTradeBalanceAlert,
        generateDataQualityAlert
    ];

    const randomType = alertTypes[Math.floor(Math.random() * alertTypes.length)];
    return randomType();
}

// Start alert generation when module loads
function startAlertGeneration() {
    if (alertGenerationInterval) {
        clearInterval(alertGenerationInterval);
    }

    // Generate initial alerts
    generateInitialAlerts();

    // Generate new alerts every 30-90 seconds
    alertGenerationInterval = setInterval(() => {
        if (Math.random() < 0.4) { // 40% chance every interval
            const alert = generateRandomAlert();
            if (aiAlertSystem.alerts) {
                aiAlertSystem.alerts.unshift(alert);

                // Keep only last 100 alerts
                if (aiAlertSystem.alerts.length > 100) {
                    aiAlertSystem.alerts = aiAlertSystem.alerts.slice(0, 100);
                }

                console.log(`🚨 Generated new alert: ${alert.name} (${alert.severity})`);
            }
        }
    }, 30000); // Check every 30 seconds
}

function generateInitialAlerts() {
    // Generate some initial alerts to populate the system
    const initialAlerts = [
        generateExportAnomalyAlert(),
        generateImportSpikeAlert(),
        generateTradeBalanceAlert()
    ];

    if (aiAlertSystem.alerts) {
        aiAlertSystem.alerts.unshift(...initialAlerts);
        console.log('🚨 Generated initial alert set');
    }
}

// Auto-start alert generation
setTimeout(startAlertGeneration, 2000);

/**
 * GET /api/alerts
 * Fetch all active alerts with optional filtering
 */
router.get('/', (req, res) => {
    try {
        const { severity, category, limit = 10 } = req.query;

        let alerts = aiAlertSystem.getActiveAlerts();

        // Filter by severity if provided
        if (severity) {
            alerts = alerts.filter(alert => alert.severity === severity);
        }

        // Filter by category if provided
        if (category) {
            alerts = alerts.filter(alert => alert.category === category);
        }

        // Limit results
        const limitNum = parseInt(limit);
        if (limitNum > 0) {
            alerts = alerts.slice(-limitNum);
        }

        // Sort by timestamp (most recent first)
        alerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        res.json({
            success: true,
            alerts: alerts,
            total: alerts.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error fetching alerts:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch alerts',
            message: error.message
        });
    }
});

/**
 * GET /api/alerts/:id
 * Fetch a specific alert by ID
 */
router.get('/:id', (req, res) => {
    try {
        const { id } = req.params;

        // Find alert in active alerts first
        let alert = aiAlertSystem.getActiveAlerts().find(a => a.id === id);

        // If not found in active alerts, search all alerts
        if (!alert) {
            const allAlerts = aiAlertSystem.alerts || [];
            alert = allAlerts.find(a => a.id === id);
        }

        if (!alert) {
            return res.status(404).json({
                success: false,
                error: 'Alert not found',
                id: id
            });
        }

        res.json({
            success: true,
            alert: alert,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error fetching alert:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch alert',
            message: error.message
        });
    }
});

/**
 * POST /api/alerts/:id/acknowledge
 * Acknowledge an alert
 */
router.post('/:id/acknowledge', (req, res) => {
    try {
        const { id } = req.params;

        // Find the alert first
        const allAlerts = aiAlertSystem.alerts || [];
        const alert = allAlerts.find(a => a.id === id);

        if (!alert) {
            return res.status(404).json({
                success: false,
                error: 'Alert not found',
                id: id
            });
        }

        // Acknowledge the alert
        aiAlertSystem.acknowledgeAlert(id);

        res.json({
            success: true,
            message: 'Alert acknowledged successfully',
            alert_id: id,
            acknowledged_at: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error acknowledging alert:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to acknowledge alert',
            message: error.message
        });
    }
});

/**
 * GET /api/alerts/statistics
 * Get alert statistics and summary
 */
router.get('/statistics', (req, res) => {
    try {
        const stats = aiAlertSystem.getAlertStatistics();

        res.json({
            success: true,
            statistics: stats,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error fetching alert statistics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch alert statistics',
            message: error.message
        });
    }
});

/**
 * GET /api/alerts/recent
 * Get recent alerts (last 24 hours)
 */
router.get('/recent', (req, res) => {
    try {
        const { hours = 24 } = req.query;
        const hoursNum = parseInt(hours);

        const allAlerts = aiAlertSystem.alerts || [];
        const cutoffTime = new Date(Date.now() - (hoursNum * 60 * 60 * 1000));

        const recentAlerts = allAlerts.filter(alert =>
            new Date(alert.timestamp) > cutoffTime
        );

        // Sort by timestamp (most recent first)
        recentAlerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        res.json({
            success: true,
            alerts: recentAlerts,
            total: recentAlerts.length,
            period_hours: hoursNum,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error fetching recent alerts:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch recent alerts',
            message: error.message
        });
    }
});

/**
 * GET /api/alerts/categories
 * Get available alert categories
 */
router.get('/categories', (req, res) => {
    try {
        const categories = [
            'data_quality',
            'market_change',
            'economic_policy',
            'risk_management',
            'market_diversification',
            'system_health',
            'system_performance'
        ];

        res.json({
            success: true,
            categories: categories,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error fetching alert categories:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch alert categories',
            message: error.message
        });
    }
});

/**
 * POST /api/alerts/test
 * Generate a test alert (for development/testing)
 */
router.post('/test', (req, res) => {
    try {
        const { type = 'test', severity = 'low', message = 'Test alert generated' } = req.body;

        // Create a test alert
        const testAlert = {
            id: `test_alert_${Date.now()}`,
            rule_id: 'test_rule',
            name: 'Test Alert',
            message: message,
            severity: severity,
            category: type,
            timestamp: new Date().toISOString(),
            data: { test: true },
            status: 'active',
            acknowledged: false
        };

        // Add to alerts system
        if (aiAlertSystem.alerts) {
            aiAlertSystem.alerts.push(testAlert);

            // Keep only last 100 alerts
            if (aiAlertSystem.alerts.length > 100) {
                aiAlertSystem.alerts = aiAlertSystem.alerts.slice(-100);
            }
        }

        res.json({
            success: true,
            message: 'Test alert generated successfully',
            alert: testAlert,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error generating test alert:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate test alert',
            message: error.message
        });
    }
});

/**
 * POST /api/alerts/trigger
 * Manually trigger a realistic alert for testing
 */
router.post('/trigger', (req, res) => {
    try {
        const alert = generateRandomAlert();

        // Add to alerts system
        if (aiAlertSystem.alerts) {
            aiAlertSystem.alerts.unshift(alert);

            // Keep only last 100 alerts
            if (aiAlertSystem.alerts.length > 100) {
                aiAlertSystem.alerts = aiAlertSystem.alerts.slice(0, 100);
            }
        }

        res.json({
            success: true,
            message: 'Alert triggered successfully',
            alert: alert,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error triggering alert:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to trigger alert',
            message: error.message
        });
    }
});

/**
 * DELETE /api/alerts/stop-generation
 * Stop automatic alert generation
 */
router.delete('/stop-generation', (req, res) => {
    try {
        if (alertGenerationInterval) {
            clearInterval(alertGenerationInterval);
            alertGenerationInterval = null;
        }

        res.json({
            success: true,
            message: 'Alert generation stopped successfully',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error stopping alert generation:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to stop alert generation',
            message: error.message
        });
    }
});

/**
 * POST /api/alerts/start-generation
 * Start automatic alert generation
 */
router.post('/start-generation', (req, res) => {
    try {
        startAlertGeneration();

        res.json({
            success: true,
            message: 'Alert generation started successfully',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error starting alert generation:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to start alert generation',
            message: error.message
        });
    }
});

/**
 * DELETE /api/alerts/:id
 * Delete a specific alert
 */
router.delete('/:id', (req, res) => {
    try {
        const { id } = req.params;

        if (aiAlertSystem.alerts) {
            const initialLength = aiAlertSystem.alerts.length;
            aiAlertSystem.alerts = aiAlertSystem.alerts.filter(alert => alert.id !== id);

            if (aiAlertSystem.alerts.length < initialLength) {
                res.json({
                    success: true,
                    message: 'Alert deleted successfully',
                    alert_id: id,
                    timestamp: new Date().toISOString()
                });
            } else {
                res.status(404).json({
                    success: false,
                    error: 'Alert not found',
                    id: id
                });
            }
        } else {
            res.status(404).json({
                success: false,
                error: 'No alerts available',
                id: id
            });
        }
    } catch (error) {
        console.error('Error deleting alert:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete alert',
            message: error.message
        });
    }
});

module.exports = router;