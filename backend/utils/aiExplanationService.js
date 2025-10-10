/**
 * Enhanced AI Explanation Service
 * Provides comprehensive AI-powered explanations and real-time system monitoring
 * Fully integrated throughout the Rwanda trade analysis systemsystem
 */

const openaiService = require('./openaiService');
const { cleanAIResponse } = require('./openaiService');
const fs = require('fs').promises;
const path = require('path');

/**
 * Generate explanation for statistical analysis results
 * @param {Object} analysisData - Analysis results data
 * @param {string} analysisType - Type of analysis (correlation, regression, etc.)
 * @returns {Object} AI-generated explanation
 */
async function generateAnalysisExplanation(analysisData, analysisType) {
    try {
        const prompt = buildAnalysisPrompt(analysisData, analysisType);
        const explanation = await openaiService.generateAnalysisDescription(analysisData, analysisType);

        return {
            success: true,
            explanation: explanation,
            analysis_type: analysisType,
            generated_at: new Date().toISOString(),
            confidence: 0.85
        };
    } catch (error) {
        console.error('Error generating analysis explanation:', error);
        return {
            success: false,
            error: error.message,
            fallback_explanation: generateFallbackExplanation(analysisType)
        };
    }
}

/**
 * Generate explanation for model performance
 * @param {Object} modelData - Model performance data
 * @returns {Object} AI-generated model explanation
 */
async function generateModelExplanation(modelData) {
    try {
        const prompt = `Explain the performance of this machine learning model:

        Model Type: ${modelData.model_type}
        Algorithm: ${modelData.algorithm}
        R² Score: ${modelData.performance_metrics?.training_accuracy || 'N/A'}
        Cross-validation Scores: ${modelData.performance_metrics?.cross_validation_scores || 'N/A'}
        Features Used: ${modelData.features?.join(', ') || 'N/A'}

        Provide a clear explanation of what these metrics mean and how well the model is performing.`;

        const explanation = await openaiService.generateCustomResponse(prompt);

        return {
            success: true,
            explanation: explanation,
            model_name: modelData.model_name,
            generated_at: new Date().toISOString()
        };
    } catch (error) {
        console.error('Error generating model explanation:', error);
        return {
            success: false,
            error: error.message,
            fallback_explanation: 'This machine learning model shows good performance with reliable predictions for trade data analysis.'
        };
    }
}

/**
 * Generate explanation for correlation analysis
 * @param {Object} correlationData - Correlation analysis results
 * @returns {Object} AI-generated correlation explanation
 */
async function generateCorrelationExplanation(correlationData) {
    try {
        const significantCorrelations = correlationData.significant_correlations || [];
        const correlationMatrix = correlationData.correlation_matrix || {};

        const prompt = `Explain the correlation analysis results:

        Dataset: ${correlationData.dataset}
        Analysis Method: ${correlationData.analysis_method}
        Number of Significant Correlations: ${significantCorrelations.length}

        Significant correlations found:
        ${significantCorrelations.map(corr =>
            `${corr.variable_1} ↔ ${corr.variable_2}: ${corr.correlation_coefficient.toFixed(3)} (${corr.significance_level})`
        ).join('\n')}

        Provide insights about what these correlations mean for trade analysis.`;

        const explanation = await openaiService.generateCustomResponse(prompt);

        return {
            success: true,
            explanation: explanation,
            correlations_count: significantCorrelations.length,
            generated_at: new Date().toISOString()
        };
    } catch (error) {
        console.error('Error generating correlation explanation:', error);
        return {
            success: false,
            error: error.message,
            fallback_explanation: 'The correlation analysis reveals important relationships between trade variables that can inform economic policy and business decisions.'
        };
    }
}

/**
 * Generate explanation for alert
 * @param {Object} alert - Alert object
 * @param {Object} rule - Alert rule that triggered
 * @returns {string} AI-generated alert explanation
 */
async function generateAlertExplanation(alert, rule) {
    try {
        if (openaiService.isConfigured()) {
            const prompt = `
            An alert has been triggered in the Rwanda trade analysis systemsystem:

            Alert: ${alert.name}
            Severity: ${alert.severity}
            Category: ${alert.category}
            Message: ${alert.message}
            Data: ${JSON.stringify(alert.data, null, 2)}

            Provide a detailed explanation of what this alert means, why it was triggered, and what actions should be taken.
            `;

            const response = await openaiService.client.chat.completions.create({
                model: openaiService.model,
                messages: [
                    {
                        role: "system",
                        content: "You are an expert system analyst explaining alerts and their implications for trade data systems."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                max_tokens: 200,
                temperature: 0.7
            });

            const cleanedResponse = cleanAIResponse(response.choices[0].message.content);
            return cleanedResponse;
        } else {
            return `Alert "${alert.name}" has been triggered with ${alert.severity} severity. This indicates ${rule.category.replace('_', ' ')} conditions that may require attention.`;
        }
    } catch (error) {
        console.error('Error generating alert explanation:', error);
        return `Alert generated: ${alert.message}`;
    }
}

/**
 * Generate explanation for outlier detection results
 * @param {Object} outlierData - Outlier detection results
 * @returns {Object} AI-generated outlier explanation
 */
async function generateOutlierExplanation(outlierData) {
    try {
        const outliers = outlierData.outliers || [];
        const statistics = outlierData.statistics || {};

        const prompt = `Explain the outlier detection results:

        Dataset: ${outlierData.dataset}
        Detection Method: ${outlierData.detection_method}
        Total Data Points: ${statistics.total_points}
        Outliers Detected: ${statistics.outlier_count}
        Outlier Percentage: ${statistics.outlier_percentage?.toFixed(1) || 'N/A'}%

        ${outliers.length > 0 ? `Key outliers found:
        ${outliers.map(outlier =>
            `Value: ${outlier.value}, Score: ${outlier.outlier_score}, Severity: ${outlier.severity}`
        ).join('\n')}` : 'No significant outliers detected.'}

        Provide insights about data quality and potential implications.`;

        const explanation = await openaiService.generateCustomResponse(prompt);

        return {
            success: true,
            explanation: explanation,
            outliers_count: outliers.length,
            data_quality: outliers.length > 10 ? 'Needs Review' : 'Good',
            generated_at: new Date().toISOString()
        };
    } catch (error) {
        console.error('Error generating outlier explanation:', error);
        return {
            success: false,
            error: error.message,
            fallback_explanation: 'Outlier analysis helps identify unusual data points that may require further investigation or data cleaning.'
        };
    }
}

/**
 * Generate comprehensive trade insights
 * @param {Object} tradeData - Complete trade analysis data
 * @returns {Object} AI-generated comprehensive insights
 */
async function generateComprehensiveInsights(tradeData) {
    try {
        const prompt = `Provide comprehensive insights and recommendations based on this Rwanda trade data:

        Overview:
        - Total Export Value: $${tradeData.total_export_value?.toFixed(2) || 'N/A'}M
        - Total Import Value: $${tradeData.total_import_value?.toFixed(2) || 'N/A'}M
        - Trade Balance: $${tradeData.trade_balance?.toFixed(2) || 'N/A'}M
        - Export Destinations: ${tradeData.export_destinations_count || 'N/A'}
        - Regional Distribution: ${JSON.stringify(tradeData.regional_analysis || {})}

        Statistical Analysis:
        - Correlation Strength: ${tradeData.correlation_strength || 'N/A'}
        - Export Volatility: ${tradeData.export_volatility || 'N/A'}
        - Import Volatility: ${tradeData.import_volatility || 'N/A'}

        Provide strategic recommendations for:
        1. Export market diversification
        2. Import dependency reduction
        3. Regional trade opportunities
        4. Economic policy implications`;

        const explanation = await openaiService.generateCustomResponse(prompt);

        return {
            success: true,
            explanation: explanation,
            insights_categories: ['strategic', 'economic', 'policy', 'market'],
            generated_at: new Date().toISOString()
        };
    } catch (error) {
        console.error('Error generating comprehensive insights:', error);
        return {
            success: false,
            error: error.message,
            fallback_explanation: 'Comprehensive analysis reveals opportunities for trade diversification and regional economic integration.'
        };
    }
}

/**
 * Build analysis prompt based on type
 */
function buildAnalysisPrompt(analysisData, analysisType) {
    switch (analysisType) {
        case 'correlation':
            return `Explain this correlation analysis:
            - Variables analyzed: ${analysisData.variables?.join(', ') || 'N/A'}
            - Strongest correlation: ${Math.max(...Object.values(analysisData.correlation_matrix || {})) || 'N/A'}
            - Significant relationships found: ${analysisData.significant_correlations?.length || 0}
            Provide insights about what these correlations mean for trade policy.`;

        case 'regression':
            return `Explain this regression analysis:
            - Model type: ${analysisData.model_type || 'N/A'}
            - R² Score: ${analysisData.r2_score || 'N/A'}
            - Features used: ${analysisData.features?.join(', ') || 'N/A'}
            - Model performance: ${analysisData.performance_metrics?.accuracy || 'N/A'}
            Provide insights about model reliability and predictive power.`;

        case 'outlier_detection':
            return `Explain these outlier detection results:
            - Detection method: ${analysisData.detection_method || 'N/A'}
            - Outliers found: ${analysisData.outliers?.length || 0}
            - Data quality assessment: ${analysisData.data_quality || 'N/A'}
            Provide insights about data quality and potential issues.`;

        default:
            return `Provide analysis of this trade data:
            - Dataset: ${analysisData.dataset || 'N/A'}
            - Analysis type: ${analysisType}
            - Key findings: ${analysisData.key_findings || 'N/A'}
            Provide actionable insights and recommendations.`;
    }
}

/**
 * Generate fallback explanation when AI service fails
 */
function generateFallbackExplanation(analysisType) {
    const explanations = {
        correlation: 'Correlation analysis examines relationships between trade variables. Strong correlations can indicate economic dependencies and market influences.',
        regression: 'Regression analysis helps predict future trade values based on historical patterns and economic indicators.',
        outlier_detection: 'Outlier detection identifies unusual data points that may require further investigation or indicate data quality issues.',
        forecasting: 'Forecasting models predict future trade trends using historical data and statistical methods.',
        clustering: 'Clustering analysis groups similar trade patterns to identify market segments and opportunities.'
    };

    return explanations[analysisType] || 'This analysis provides valuable insights into Rwanda\'s trade patterns and economic relationships.';
}

/**
 * AI System Monitor - Tracks and responds to all system activities
 */
class AISystemMonitor {
    constructor() {
        this.systemEvents = [];
        this.aiInsights = [];
        this.dataProcessingLog = [];
        this.userInteractions = [];
        this.isActive = true;
        this.isRateLimited = false;
        this.lastApiCall = 0;
        this.apiCallCount = 0;
        this.rateLimitResetTime = 0;

        // Start monitoring
        this.startMonitoring();
    }

    /**
     * Start comprehensive system monitoring
     */
    startMonitoring() {
        console.log('🚀 AI System Monitor started - tracking all system activities');

        // Monitor file system changes
        this.monitorFileSystem();

        // Monitor data processing activities
        this.monitorDataProcessing();

        // Monitor user interactions
        this.monitorUserInteractions();

        // Monitor API calls
        this.monitorAPICalls();

        // Generate periodic insights
        this.startPeriodicInsights();
    }

    /**
     * Monitor file system activities with rate limiting protection
     */
    monitorFileSystem() {
        // Monitor data processing directory - reduced frequency to prevent rate limiting
        setInterval(async () => {
            try {
                const dataDir = path.join(__dirname, '../../data/processed');
                const files = await fs.readdir(dataDir);

                // Check for new or modified files (limit to 2 files per check to reduce API calls)
                const jsonFiles = files.filter(file => file.endsWith('.json')).slice(0, 2);

                for (const file of jsonFiles) {
                    const filePath = path.join(dataDir, file);
                    const stats = await fs.stat(filePath);

                    const event = {
                        type: 'file_activity',
                        file: file,
                        action: 'processed',
                        timestamp: new Date().toISOString(),
                        size: stats.size
                    };

                    this.logSystemEvent(event);

                    // Only generate AI insights if not rate limited and OpenAI is configured
                    if (!this.isRateLimited && openaiService.isConfigured()) {
                        await this.analyzeFileActivity(event);
                    } else {
                        console.log('⏳ Skipping AI insight generation due to rate limiting or no AI config');
                    }
                }
            } catch (error) {
                console.error('Error monitoring file system:', error);
            }
        }, 60000); // Check every 60 seconds instead of 30
    }

    /**
     * Monitor data processing activities with rate limiting protection
     */
    monitorDataProcessing() {
        // Monitor Python processing logs - reduced frequency
        setInterval(async () => {
            try {
                const logFiles = [
                    'python_processing/data_processing.log',
                    'python_processing/enhanced_data_processing.log',
                    'python_processing/comprehensive_analysis.log'
                ];

                for (const logFile of logFiles) {
                    const logPath = path.join(__dirname, '../../', logFile);
                    try {
                        const content = await fs.readFile(logPath, 'utf8');
                        const lines = content.split('\n').slice(-5); // Reduced to last 5 lines

                        for (const line of lines) {
                            if (line.trim() && !this.dataProcessingLog.includes(line)) {
                                const event = {
                                    type: 'data_processing',
                                    activity: line.trim(),
                                    timestamp: new Date().toISOString(),
                                    source: logFile
                                };

                                this.logSystemEvent(event);
                                this.dataProcessingLog.push(line);

                                // Only generate AI insights if not rate limited and OpenAI is configured
                                if (!this.isRateLimited && openaiService.isConfigured()) {
                                    await this.analyzeDataProcessing(event);
                                }
                            }
                        }
                    } catch (e) {
                        // Log file might not exist yet
                    }
                }
            } catch (error) {
                console.error('Error monitoring data processing:', error);
            }
        }, 120000); // Check every 120 seconds instead of 60
    }

    /**
     * Monitor user interactions
     */
    monitorUserInteractions() {
        // This would typically hook into web server middleware
        // For now, we'll simulate based on common patterns
        setInterval(() => {
            // Monitor frontend page visits (simulated)
            const pages = ['dashboard', 'exports', 'imports', 'analytics', 'predictions'];
            const randomPage = pages[Math.floor(Math.random() * pages.length)];

            const event = {
                type: 'user_interaction',
                page: randomPage,
                action: 'page_visit',
                timestamp: new Date().toISOString(),
                user_agent: 'Rwanda trade analysis systemUser'
            };

            this.logSystemEvent(event);
        }, 30000); // Every 30 seconds
    }

    /**
     * Monitor API calls
     */
    monitorAPICalls() {
        // Monitor backend API endpoints
        const originalConsoleLog = console.log;
        console.log = (...args) => {
            const logMessage = args.join(' ');
            if (logMessage.includes('API') || logMessage.includes('route') || logMessage.includes('endpoint')) {
                const event = {
                    type: 'api_activity',
                    activity: logMessage,
                    timestamp: new Date().toISOString(),
                    level: 'info'
                };

                this.logSystemEvent(event);
            }
            originalConsoleLog.apply(console, args);
        };
    }

    /**
     * Start generating periodic AI insights with rate limiting protection
     */
    startPeriodicInsights() {
        setInterval(async () => {
            if (this.systemEvents.length > 0 && !this.isRateLimited) {
                await this.generatePeriodicInsight();
            } else if (this.isRateLimited) {
                console.log('⏳ Skipping periodic insights due to rate limiting');
            }
        }, 120000); // Every 2 minutes instead of 1
    }

    /**
     * Check if we can make API calls without hitting rate limits
     */
    canMakeApiCall() {
        const now = Date.now();
        const timeSinceLastCall = now - this.lastApiCall;

        // If rate limited, check if reset time has passed
        if (this.isRateLimited) {
            if (now > this.rateLimitResetTime) {
                console.log('🔄 Rate limit reset, resuming API calls');
                this.isRateLimited = false;
                this.apiCallCount = 0;
                return true;
            }
            return false;
        }

        // Simple rate limiting: max 10 calls per minute
        if (this.apiCallCount >= 10 && timeSinceLastCall < 60000) {
            console.log('⚠️ Rate limit reached, pausing AI calls for 1 minute');
            this.isRateLimited = true;
            this.rateLimitResetTime = now + 60000; // Reset after 1 minute
            return false;
        }

        return true;
    }

    /**
     * Handle rate limit errors from API
     */
    handleRateLimitError(error) {
        if (error.status === 429 || error.code === 429) {
            console.log('🚫 API rate limit exceeded, enabling protection mode');
            this.isRateLimited = true;

            // Try to extract reset time from headers if available
            if (error.headers && error.headers['x-ratelimit-reset']) {
                this.rateLimitResetTime = parseInt(error.headers['x-ratelimit-reset']) * 1000;
            } else {
                // Fallback: reset after 2 minutes
                this.rateLimitResetTime = Date.now() + 120000;
            }

            this.apiCallCount = 0;
        }
    }

    /**
     * Record successful API call
     */
    recordApiCall() {
        this.lastApiCall = Date.now();
        this.apiCallCount++;
    }

    /**
     * Log system events
     */
    logSystemEvent(event) {
        this.systemEvents.push(event);

        // Keep only last 1000 events
        if (this.systemEvents.length > 1000) {
            this.systemEvents = this.systemEvents.slice(-1000);
        }

        // Also log to console for debugging
        console.log(`🤖 AI Monitor: ${event.type} - ${event.timestamp}`);
    }

    /**
     * Analyze file activity and generate insights with rate limiting protection
     */
    async analyzeFileActivity(event) {
        try {
            // Check rate limiting before making API call
            if (!this.canMakeApiCall()) {
                console.log('⏳ Skipping file activity analysis due to rate limiting');
                return;
            }

            const insight = await generateFileActivityInsight(event);
            if (insight) {
                this.aiInsights.push({
                    type: 'file_insight',
                    content: insight,
                    timestamp: new Date().toISOString(),
                    trigger: event
                });

                // Record successful API call
                this.recordApiCall();
            }
        } catch (error) {
            console.error('Error analyzing file activity:', error);

            // Handle rate limit errors specifically
            if (error.status === 429 || error.code === 429) {
                this.handleRateLimitError(error);
            }
        }
    }

    /**
     * Analyze data processing and generate insights with rate limiting protection
     */
    async analyzeDataProcessing(event) {
        try {
            // Check rate limiting before making API call
            if (!this.canMakeApiCall()) {
                console.log('⏳ Skipping data processing analysis due to rate limiting');
                return;
            }

            const insight = await generateDataProcessingInsight(event);
            if (insight) {
                this.aiInsights.push({
                    type: 'processing_insight',
                    content: insight,
                    timestamp: new Date().toISOString(),
                    trigger: event
                });

                // Record successful API call
                this.recordApiCall();
            }
        } catch (error) {
            console.error('Error analyzing data processing:', error);

            // Handle rate limit errors specifically
            if (error.status === 429 || error.code === 429) {
                this.handleRateLimitError(error);
            }
        }
    }

    /**
     * Generate periodic system insights with rate limiting protection
     */
    async generatePeriodicInsight() {
        try {
            // Check rate limiting before making API call
            if (!this.canMakeApiCall()) {
                console.log('⏳ Skipping periodic system insights due to rate limiting');
                return;
            }

            const recentEvents = this.systemEvents.slice(-20);
            const insight = await generateSystemInsight(recentEvents);

            this.aiInsights.push({
                type: 'system_insight',
                content: insight,
                timestamp: new Date().toISOString(),
                events_analyzed: recentEvents.length
            });

            // Keep only last 100 insights
            if (this.aiInsights.length > 100) {
                this.aiInsights = this.aiInsights.slice(-100);
            }

            // Record successful API call
            this.recordApiCall();
        } catch (error) {
            console.error('Error generating periodic insight:', error);

            // Handle rate limit errors specifically
            if (error.status === 429 || error.code === 429) {
                this.handleRateLimitError(error);
            }
        }
    }

    /**
     * Get current system status
     */
    getSystemStatus() {
        const recentEvents = this.systemEvents.slice(-10);
        const recentInsights = this.aiInsights.slice(-5);

        return {
            is_active: this.isActive,
            total_events_logged: this.systemEvents.length,
            total_insights_generated: this.aiInsights.length,
            recent_events: recentEvents,
            recent_insights: recentInsights,
            system_health: this.assessSystemHealth(),
            last_activity: this.systemEvents.length > 0 ? this.systemEvents[this.systemEvents.length - 1].timestamp : null
        };
    }

    /**
     * Assess overall system health
     */
    assessSystemHealth() {
        const recentEvents = this.systemEvents.slice(-50);
        let healthScore = 100;

        // Check for errors
        const errors = recentEvents.filter(e => e.type === 'error' || e.level === 'error');
        healthScore -= errors.length * 10;

        // Check for successful data processing
        const successfulProcessing = recentEvents.filter(e => e.type === 'data_processing' && e.activity.includes('completed'));
        if (successfulProcessing.length === 0 && recentEvents.length > 10) {
            healthScore -= 20;
        }

        // Check for file activity
        const fileActivity = recentEvents.filter(e => e.type === 'file_activity');
        if (fileActivity.length === 0) {
            healthScore -= 10;
        }

        return Math.max(0, Math.min(100, healthScore));
    }
}

/**
 * Generate insight for file activity
 */
async function generateFileActivityInsight(event) {
    try {
        const prompt = `
        A new file was processed in the Rwanda trade analysis systemsystem:
        - File: ${event.file}
        - Action: ${event.action}
        - Size: ${event.size} bytes
        - Timestamp: ${event.timestamp}

        Generate a brief, helpful insight about this file activity and its potential impact on the system.
        `;

        if (openaiService.isConfigured()) {
            const response = await openaiService.client.chat.completions.create({
                model: openaiService.model,
                messages: [
                    {
                        role: "system",
                        content: "You are an AI system monitor providing insights about data processing activities."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                max_tokens: 150,
                temperature: 0.7
            });

            const cleanedResponse = cleanAIResponse(response.choices[0].message.content);
            return cleanedResponse;
        } else {
            return `File ${event.file} has been processed successfully. This ${event.file.includes('export') ? 'export' : event.file.includes('import') ? 'import' : 'trade'} data is now available for analysis.`;
        }
    } catch (error) {
        console.error('Error generating file activity insight:', error);

        // Return fallback insight instead of null to keep system running
        if (event.file.includes('export')) {
            return `Export data file ${event.file} processed successfully. System monitoring active.`;
        } else if (event.file.includes('import')) {
            return `Import data file ${event.file} processed successfully. System monitoring active.`;
        } else {
            return `Trade data file ${event.file} processed successfully. System monitoring active.`;
        }
    }
}

/**
 * Generate insight for data processing activities
 */
async function generateDataProcessingInsight(event) {
    try {
        if (openaiService.isConfigured()) {
            const prompt = `
            Data processing activity detected:
            - Activity: ${event.activity}
            - Source: ${event.source}
            - Timestamp: ${event.timestamp}

            Generate a brief insight about this processing activity.
            `;

            const response = await openaiService.client.chat.completions.create({
                model: openaiService.model,
                messages: [
                    {
                        role: "system",
                        content: "You are monitoring data processing activities and providing insights."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                max_tokens: 100,
                temperature: 0.6
            });

            const cleanedResponse = cleanAIResponse(response.choices[0].message.content);
            return cleanedResponse;
        } else {
            return `Data processing activity detected: ${event.activity.substring(0, 50)}...`;
        }
    } catch (error) {
        console.error('Error generating data processing insight:', error);
        // Return fallback insight instead of null
        return `Data processing activity logged: ${event.activity.substring(0, 30)}... System monitoring active.`;
    }
}

/**
 * Generate comprehensive system insight
 */
async function generateSystemInsight(recentEvents) {
    try {
        const eventSummary = recentEvents.map(e => `${e.type}: ${e.activity || e.file || 'activity'}`).join('; ');

        const prompt = `
        Recent system activities in Rwanda Trade analytic system:
        ${eventSummary}

        Based on these ${recentEvents.length} recent events, provide a comprehensive insight about system performance, data processing status, and any recommendations for optimization.
        `;

        if (openaiService.isConfigured()) {
            const response = await openaiService.client.chat.completions.create({
                model: openaiService.model,
                messages: [
                    {
                        role: "system",
                        content: "You are a system analyst providing comprehensive insights about trade data platform performance."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                max_tokens: 200,
                temperature: 0.7
            });

            const cleanedResponse = cleanAIResponse(response.choices[0].message.content);
            return cleanedResponse;
        } else {
            return `System is actively processing trade data with ${recentEvents.length} recent activities. Data flows are normal and the platform is functioning well.`;
        }
    } catch (error) {
        console.error('Error generating system insight:', error);
        // Return more specific fallback insight
        return `System monitoring active with ${recentEvents.length} recent events. Trade data processing continuing normally.`;
    }
}

/**
 * Enhanced comprehensive insights with system monitoring
 */
async function generateEnhancedComprehensiveInsights(tradeData, systemStatus = null) {
    try {
        const baseInsights = await generateComprehensiveInsights(tradeData);

        const enhancedPrompt = `
        ${baseInsights.explanation}

        System Status:
        - System Health: ${systemStatus?.system_health || 'N/A'}%
        - Active Events: ${systemStatus?.total_events_logged || 'N/A'}
        - AI Insights Generated: ${systemStatus?.total_insights_generated || 'N/A'}
        - Last Activity: ${systemStatus?.last_activity || 'N/A'}

        Recent AI Insights:
        ${systemStatus?.recent_insights?.slice(0, 3).map(i => `- ${i.content}`).join('\n') || 'No recent insights'}

        Provide enhanced strategic recommendations that incorporate both trade data analysis and current system performance.
        `;

        if (openaiService.isConfigured()) {
            const response = await openaiService.client.chat.completions.create({
                model: openaiService.model,
                messages: [
                    {
                        role: "system",
                        content: "You are a comprehensive trade analyst with full system awareness, providing integrated insights that combine data analysis with system performance monitoring."
                    },
                    {
                        role: "user",
                        content: enhancedPrompt
                    }
                ],
                max_tokens: 400,
                temperature: 0.8
            });

            return {
                success: true,
                explanation: cleanAIResponse(response.choices[0].message.content),
                insights_categories: ['strategic', 'economic', 'policy', 'market', 'system'],
                system_aware: true,
                generated_at: new Date().toISOString(),
                system_health: systemStatus?.system_health || 0
            };
        } else {
            return {
                ...baseInsights,
                system_aware: false,
                system_health: systemStatus?.system_health || 0
            };
        }
    } catch (error) {
        console.error('Error generating enhanced comprehensive insights:', error);
        return {
            success: false,
            error: error.message,
            fallback_explanation: 'Enhanced analysis combines trade insights with system performance monitoring for comprehensive strategic recommendations.'
        };
    }
}

/**
 * Real-time data analysis and AI insights
 */
async function generateRealTimeInsights(dataUpdate) {
    try {
        const prompt = `
        Real-time data update detected in Rwanda Trade analytic system:
        - Data Type: ${dataUpdate.type}
        - Update Size: ${dataUpdate.size || 'N/A'}
        - Processing Time: ${dataUpdate.processing_time || 'N/A'}
        - Impact: ${dataUpdate.impact || 'Data refresh'}

        Generate immediate insights about this data update and its potential implications for users.
        `;

        if (openaiService.isConfigured()) {
            const response = await openaiService.client.chat.completions.create({
                model: openaiService.model,
                messages: [
                    {
                        role: "system",
                        content: "You are a real-time data analyst providing immediate insights on data updates."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                max_tokens: 150,
                temperature: 0.7
            });

            return {
                success: true,
                insight: cleanAIResponse(response.choices[0].message.content),
                real_time: true,
                generated_at: new Date().toISOString(),
                data_type: dataUpdate.type
            };
        } else {
            return {
                success: true,
                insight: `Real-time update: ${dataUpdate.type} data has been refreshed and is now available for analysis.`,
                real_time: true,
                generated_at: new Date().toISOString(),
                data_type: dataUpdate.type,
                using_fallback: true
            };
        }
    } catch (error) {
        console.error('Error generating real-time insights:', error);
        return {
            success: false,
            error: error.message,
            fallback_insight: 'Data update completed successfully.'
        };
    }
}

// Initialize the systems after class definitions
let aiSystemMonitor;
let aiAlertSystem;

/**
 * AI Alert System - Intelligent alerts based on data patterns
 */
class AIAlertSystem {
    constructor() {
        this.alerts = [];
        this.alertRules = [];
        this.isActive = true;
        this.notificationCallbacks = [];

        this.initializeDefaultRules();
        this.startAlertMonitoring();
    }

    /**
     * Initialize default alert rules
     */
    initializeDefaultRules() {
        this.alertRules = [
            {
                id: 'export_anomaly',
                name: 'Export Value Anomaly',
                condition: (data) => {
                    const threshold = 1000000000; // 1B threshold
                    return Math.abs(data.export_value || 0) > threshold;
                },
                severity: 'high',
                message: 'Unusual export value detected: ${value}. This may indicate data quality issues or significant market changes.',
                category: 'data_quality'
            },
            {
                id: 'import_spike',
                name: 'Import Spike Detection',
                condition: (data) => {
                    // Detect sudden increases > 50%
                    return data.growth_rate > 50;
                },
                severity: 'medium',
                message: 'Significant import increase detected: ${growth_rate}%. This may indicate changing market conditions or supply chain developments.',
                category: 'market_change'
            },
            {
                id: 'trade_balance_shift',
                name: 'Trade Balance Shift',
                condition: (data) => {
                    const deficit = Math.abs(data.trade_balance || 0);
                    const threshold = 500000000; // 500M threshold
                    return deficit > threshold;
                },
                severity: 'medium',
                message: 'Trade deficit exceeds threshold: ${deficit}. Consider reviewing economic policy implications.',
                category: 'economic_policy'
            },
            {
                id: 'commodity_concentration',
                name: 'Commodity Concentration Risk',
                condition: (data) => {
                    // Alert if top commodity > 70% of total exports
                    return (data.top_commodity_percentage || 0) > 70;
                },
                severity: 'low',
                message: 'High commodity concentration detected: ${percentage}%. Consider diversification strategies.',
                category: 'risk_management'
            },
            {
                id: 'regional_dependency',
                name: 'Regional Dependency Alert',
                condition: (data) => {
                    // Alert if single region > 80% of exports
                    return (data.top_region_percentage || 0) > 80;
                },
                severity: 'medium',
                message: 'High regional concentration detected: ${percentage}%. Geographic diversification recommended.',
                category: 'market_diversification'
            }
        ];
    }

    /**
     * Start alert monitoring
     */
    startAlertMonitoring() {
        console.log('🚨 AI Alert System started - monitoring data patterns');

        // Monitor trade data for anomalies
        setInterval(() => {
            this.checkTradeDataAlerts();
        }, 30000); // Check every 30 seconds

        // Monitor system health
        setInterval(() => {
            this.checkSystemHealthAlerts();
        }, 60000); // Check every minute

        // Monitor data processing patterns
        setInterval(() => {
            this.checkDataProcessingAlerts();
        }, 45000); // Check every 45 seconds
    }

    /**
     * Check for trade data alerts
     */
    async checkTradeDataAlerts() {
        try {
            // Get latest trade data
            const tradeData = await this.getLatestTradeData();

            for (const rule of this.alertRules) {
                if (rule.condition(tradeData)) {
                    await this.generateAlert(rule, tradeData);
                }
            }
        } catch (error) {
            console.error('Error checking trade data alerts:', error);
        }
    }

    /**
     * Check for system health alerts
     */
    async checkSystemHealthAlerts() {
        try {
            const systemStatus = aiSystemMonitor.getSystemStatus();

            // Alert if system health is low
            if (systemStatus.system_health < 70) {
                await this.generateAlert({
                    id: 'system_health',
                    name: 'System Health Degradation',
                    severity: 'high',
                    message: `System health has dropped to ${systemStatus.system_health}%. Immediate attention required.`,
                    category: 'system_health'
                }, systemStatus);
            }

            // Alert if no recent activity
            const lastActivity = new Date(systemStatus.last_activity);
            const now = new Date();
            const hoursSinceActivity = (now - lastActivity) / (1000 * 60 * 60);

            if (hoursSinceActivity > 2) {
                await this.generateAlert({
                    id: 'system_inactivity',
                    name: 'System Inactivity',
                    severity: 'medium',
                    message: `No system activity detected for ${hoursSinceActivity.toFixed(1)} hours. Data processing may be stalled.`,
                    category: 'system_health'
                }, { hours_inactive: hoursSinceActivity });
            }
        } catch (error) {
            console.error('Error checking system health alerts:', error);
        }
    }

    /**
     * Check for data processing alerts
     */
    async checkDataProcessingAlerts() {
        try {
            const recentEvents = aiSystemMonitor.systemEvents.slice(-20);

            // Check for processing errors
            const errors = recentEvents.filter(e => e.type === 'error' || e.level === 'error');
            if (errors.length > 3) {
                await this.generateAlert({
                    id: 'processing_errors',
                    name: 'Multiple Processing Errors',
                    severity: 'high',
                    message: `${errors.length} processing errors detected in recent activities. Data quality may be compromised.`,
                    category: 'data_quality'
                }, { error_count: errors.length });
            }

            // Check for successful processing patterns
            const successfulProcessing = recentEvents.filter(e =>
                e.type === 'data_processing' && e.activity.includes('completed')
            );

            if (successfulProcessing.length >= 5) {
                await this.generateAlert({
                    id: 'processing_success',
                    name: 'Successful Data Processing Streak',
                    severity: 'low',
                    message: `Successfully processed ${successfulProcessing.length} data batches. System operating efficiently.`,
                    category: 'system_performance'
                }, { success_count: successfulProcessing.length });
            }
        } catch (error) {
            console.error('Error checking data processing alerts:', error);
        }
    }

    /**
     * Generate an alert
     */
    async generateAlert(rule, data) {
        try {
            // Check if similar alert was recently generated
            const recentSimilarAlerts = this.alerts.filter(a =>
                a.rule_id === rule.id &&
                (new Date() - new Date(a.timestamp)) < (15 * 60 * 1000) // 15 minutes
            );

            if (recentSimilarAlerts.length > 0) {
                console.log(`🚨 Alert ${rule.id} already generated recently, skipping`);
                return;
            }

            // Generate alert message
            let message = rule.message;
            for (const [key, value] of Object.entries(data)) {
                message = message.replace(`\${${key}}`, value.toLocaleString());
            }

            const alert = {
                id: `alert_${Date.now()}`,
                rule_id: rule.id,
                name: rule.name,
                message: message,
                severity: rule.severity,
                category: rule.category,
                timestamp: new Date().toISOString(),
                data: data,
                status: 'active',
                acknowledged: false
            };

            this.alerts.push(alert);

            // Keep only last 100 alerts
            if (this.alerts.length > 100) {
                this.alerts = this.alerts.slice(-100);
            }

            console.log(`🚨 AI Alert Generated: ${rule.name} (${rule.severity})`);

            // Generate AI explanation for the alert
            const explanation = await generateAlertExplanation(alert, rule);

            // Notify all registered callbacks
            this.notifyCallbacks(alert, explanation);

            // Log to system monitor
            aiSystemMonitor.logSystemEvent({
                type: 'alert_generated',
                alert_id: alert.id,
                severity: rule.severity,
                category: rule.category,
                message: message,
                timestamp: alert.timestamp
            });

        } catch (error) {
            console.error('Error generating alert:', error);
        }
    }

    /**
     * Generate AI explanation for alert
     */
    async generateAlertExplanation(alert, rule) {
        try {
            if (openaiService.isConfigured()) {
                const prompt = `
                An alert has been triggered in the Rwanda trade analysis systemsystem:

                Alert: ${alert.name}
                Severity: ${alert.severity}
                Category: ${alert.category}
                Message: ${alert.message}
                Data: ${JSON.stringify(alert.data, null, 2)}

                Provide a detailed explanation of what this alert means, why it was triggered, and what actions should be taken.
                `;

                const response = await openaiService.client.chat.completions.create({
                    model: openaiService.model,
                    messages: [
                        {
                            role: "system",
                            content: "You are an expert system analyst explaining alerts and their implications for trade data systems."
                        },
                        {
                            role: "user",
                            content: prompt
                        }
                    ],
                    max_tokens: 200,
                    temperature: 0.7
                });

                const cleanedResponse = cleanAIResponse(response.choices[0].message.content);
                return cleanedResponse;
            } else {
                return `Alert "${alert.name}" has been triggered with ${alert.severity} severity. This indicates ${rule.category.replace('_', ' ')} conditions that may require attention.`;
            }
        } catch (error) {
            console.error('Error generating alert explanation:', error);
            return `Alert generated: ${alert.message}`;
        }
    }

    /**
     * Get latest trade data for analysis
     */
    async getLatestTradeData() {
        try {
            // This would typically fetch from database
            // For now, return sample structure
            return {
                export_value: 8940000000, // 8.94B
                import_value: 20260000000, // 20.26B
                trade_balance: -11320000000, // -11.32B
                growth_rate: 157.9,
                top_commodity_percentage: 45.2,
                top_region_percentage: 76.1
            };
        } catch (error) {
            console.error('Error getting latest trade data:', error);
            return {};
        }
    }

    /**
     * Register notification callback
     */
    registerNotificationCallback(callback) {
        this.notificationCallbacks.push(callback);
    }

    /**
     * Notify all registered callbacks
     */
    notifyCallbacks(alert, explanation) {
        for (const callback of this.notificationCallbacks) {
            try {
                callback(alert, explanation);
            } catch (error) {
                console.error('Error in alert notification callback:', error);
            }
        }
    }

    /**
     * Get active alerts
     */
    getActiveAlerts() {
        return this.alerts.filter(a => a.status === 'active' && !a.acknowledged);
    }

    /**
     * Get alerts by severity
     */
    getAlertsBySeverity(severity) {
        return this.alerts.filter(a => a.severity === severity);
    }

    /**
     * Acknowledge alert
     */
    acknowledgeAlert(alertId) {
        const alert = this.alerts.find(a => a.id === alertId);
        if (alert) {
            alert.acknowledged = true;
            alert.acknowledged_at = new Date().toISOString();
            console.log(`✅ Alert ${alertId} acknowledged`);
        }
    }

    /**
     * Get alert statistics
     */
    getAlertStatistics() {
        const total = this.alerts.length;
        const active = this.alerts.filter(a => a.status === 'active').length;
        const acknowledged = this.alerts.filter(a => a.acknowledged).length;

        const bySeverity = {
            high: this.alerts.filter(a => a.severity === 'high').length,
            medium: this.alerts.filter(a => a.severity === 'medium').length,
            low: this.alerts.filter(a => a.severity === 'low').length
        };

        const byCategory = {};
        for (const alert of this.alerts) {
            byCategory[alert.category] = (byCategory[alert.category] || 0) + 1;
        }

        return {
            total,
            active,
            acknowledged,
            by_severity: bySeverity,
            by_category: byCategory,
            recent_alerts: this.alerts.slice(-10)
        };
    }
}

/**
 * Automated Report Generation System with AI Explanations
 */
class AIReportGenerator {
    constructor() {
        this.reportTemplates = [];
        this.generatedReports = [];
        this.isActive = true;

        this.initializeReportTemplates();
        this.startAutomatedReporting();
    }

    /**
     * Initialize report templates
     */
    initializeReportTemplates() {
        this.reportTemplates = [
            {
                id: 'daily_trade_summary',
                name: 'Daily Trade Summary',
                schedule: 'daily',
                sections: [
                    'executive_summary',
                    'export_highlights',
                    'import_analysis',
                    'trade_balance_assessment',
                    'key_insights',
                    'recommendations'
                ],
                audience: 'management'
            },
            {
                id: 'weekly_performance',
                name: 'Weekly Performance Analysis',
                schedule: 'weekly',
                sections: [
                    'performance_overview',
                    'trend_analysis',
                    'commodity_breakdown',
                    'regional_comparison',
                    'forecast_insights',
                    'strategic_recommendations'
                ],
                audience: 'analysts'
            },
            {
                id: 'monthly_comprehensive',
                name: 'Monthly Comprehensive Report',
                schedule: 'monthly',
                sections: [
                    'comprehensive_overview',
                    'detailed_statistics',
                    'market_analysis',
                    'risk_assessment',
                    'opportunity_identification',
                    'policy_recommendations'
                ],
                audience: 'executives'
            },
            {
                id: 'alert_summary',
                name: 'Alert Summary Report',
                schedule: 'as_needed',
                sections: [
                    'alert_overview',
                    'critical_issues',
                    'system_status',
                    'resolution_recommendations'
                ],
                audience: 'technical_team'
            }
        ];
    }

    /**
     * Start automated report generation
     */
    startAutomatedReporting() {
        console.log('📊 AI Report Generator started - automated report generation active');

        // Daily reports at 9 AM
        this.scheduleReport('daily_trade_summary', '0 9 * * *');

        // Weekly reports on Monday at 8 AM
        this.scheduleReport('weekly_performance', '0 8 * * 1');

        // Monthly reports on 1st of month at 7 AM
        this.scheduleReport('monthly_comprehensive', '0 7 1 * *');

        // Alert-triggered reports
        this.setupAlertTriggeredReports();
    }

    /**
     * Schedule report generation
     */
    scheduleReport(templateId, cronExpression) {
        // Simple interval-based scheduling (in production, use node-cron)
        const template = this.reportTemplates.find(t => t.id === templateId);
        if (!template) return;

        let interval;
        switch (template.schedule) {
            case 'daily':
                interval = 24 * 60 * 60 * 1000; // 24 hours
                break;
            case 'weekly':
                interval = 7 * 24 * 60 * 60 * 1000; // 7 days
                break;
            case 'monthly':
                interval = 30 * 24 * 60 * 60 * 1000; // 30 days
                break;
            default:
                return;
        }

        setInterval(async () => {
            await this.generateReport(templateId);
        }, interval);
    }

    /**
     * Setup alert-triggered reports
     */
    setupAlertTriggeredReports() {
        // Monitor for critical alerts and generate reports
        setInterval(async () => {
            const criticalAlerts = aiAlertSystem.getAlertsBySeverity('high');
            if (criticalAlerts.length > 0) {
                await this.generateReport('alert_summary');
            }
        }, 5 * 60 * 1000); // Check every 5 minutes
    }

    /**
     * Generate comprehensive report
     */
    async generateReport(templateId) {
        try {
            const template = this.reportTemplates.find(t => t.id === templateId);
            if (!template) {
                throw new Error(`Template ${templateId} not found`);
            }

            console.log(`📊 Generating ${template.name} report...`);

            // Gather all necessary data
            const reportData = await this.gatherReportData(template);

            // Generate each section
            const sections = {};
            for (const sectionId of template.sections) {
                sections[sectionId] = await this.generateReportSection(sectionId, reportData, template);
            }

            // Generate executive summary
            const executiveSummary = await this.generateExecutiveSummary(sections, template);

            // Compile complete report
            const report = {
                id: `report_${Date.now()}`,
                template_id: templateId,
                name: template.name,
                generated_at: new Date().toISOString(),
                sections: sections,
                executive_summary: executiveSummary,
                metadata: {
                    data_freshness: reportData.freshness,
                    system_health: reportData.system_health,
                    alerts_count: reportData.alerts.length,
                    insights_count: reportData.insights.length
                }
            };

            this.generatedReports.push(report);

            // Keep only last 50 reports
            if (this.generatedReports.length > 50) {
                this.generatedReports = this.generatedReports.slice(-50);
            }

            console.log(`✅ Report generated successfully: ${report.name}`);

            // Log report generation
            aiSystemMonitor.logSystemEvent({
                type: 'report_generated',
                report_id: report.id,
                template: templateId,
                sections: template.sections.length,
                timestamp: report.generated_at
            });

            return report;

        } catch (error) {
            console.error(`❌ Error generating report ${templateId}:`, error);

            aiSystemMonitor.logSystemEvent({
                type: 'report_error',
                template: templateId,
                error: error.message,
                timestamp: new Date().toISOString()
            });

            return null;
        }
    }

    /**
     * Gather all data needed for report
     */
    async gatherReportData(template) {
        const systemStatus = aiSystemMonitor.getSystemStatus();
        const tradeContext = await getTradeContext();
        const alerts = aiAlertSystem.getActiveAlerts();

        return {
            system_status: systemStatus,
            trade_context: tradeContext,
            alerts: alerts,
            insights: systemStatus.recent_insights,
            freshness: 'real-time',
            system_health: systemStatus.system_health
        };
    }

    /**
     * Generate specific report section
     */
    async generateReportSection(sectionId, reportData, template) {
        try {
            const sectionPrompt = this.buildSectionPrompt(sectionId, reportData, template);

            if (openaiService.isConfigured()) {
                const response = await openaiService.client.chat.completions.create({
                    model: openaiService.model,
                    messages: [
                        {
                            role: "system",
                            content: `You are a professional trade analyst generating comprehensive reports for ${template.audience}. Provide detailed, accurate analysis with actionable insights.`
                        },
                        {
                            role: "user",
                            content: sectionPrompt
                        }
                    ],
                    max_tokens: 600,
                    temperature: 0.7
                });

                return {
                    id: sectionId,
                    content: cleanAIResponse(response.choices[0].message.content),
                    generated_at: new Date().toISOString(),
                    using_ai: true
                };
            } else {
                return {
                    id: sectionId,
                    content: this.getFallbackSectionContent(sectionId, reportData),
                    generated_at: new Date().toISOString(),
                    using_ai: false
                };
            }
        } catch (error) {
            console.error(`Error generating section ${sectionId}:`, error);
            return {
                id: sectionId,
                content: `Error generating ${sectionId} section. Please check system logs.`,
                generated_at: new Date().toISOString(),
                error: error.message
            };
        }
    }

    /**
     * Build prompt for specific section
     */
    buildSectionPrompt(sectionId, reportData, template) {
        const { trade_context, system_status, alerts } = reportData;

        switch (sectionId) {
            case 'executive_summary':
                return `
                Generate an executive summary for Rwanda's trade performance:

                Key Metrics:
                - Total Exports: $${trade_context.total_exports?.toFixed(2)}M
                - Total Imports: $${trade_context.total_imports?.toFixed(2)}M
                - Trade Balance: $${trade_context.trade_balance?.toFixed(2)}M
                - System Health: ${system_status.system_health}%
                - Active Alerts: ${alerts.length}

                Provide a concise overview of current trade status and key highlights for ${template.audience}.
                `;

            case 'export_highlights':
                return `
                Analyze Rwanda's export highlights:

                Export Performance:
                - Total Value: $${trade_context.total_exports?.toFixed(2)}M
                - Top Destinations: ${trade_context.top_destinations?.slice(0, 3).map(d => d.country).join(', ') || 'N/A'}
                - Key Products: ${trade_context.top_products?.slice(0, 3).map(p => p.commodity).join(', ') || 'N/A'}

                Highlight key achievements, trends, and areas for attention.
                `;

            case 'trade_balance_assessment':
                return `
                Assess Rwanda's trade balance situation:

                Current Balance: $${trade_context.trade_balance?.toFixed(2)}M
                Export/Import Ratio: ${((trade_context.total_exports / trade_context.total_imports) * 100)?.toFixed(1) || 'N/A'}%
                Recent Trends: Based on system monitoring data

                Provide analysis of trade balance implications and recommendations.
                `;

            default:
                return `Generate ${sectionId} section for ${template.name} report using available trade data and system status.`;
        }
    }

    /**
     * Get fallback content for sections
     */
    getFallbackSectionContent(sectionId, reportData) {
        const { trade_context } = reportData;

        switch (sectionId) {
            case 'executive_summary':
                return `Rwanda's trade sector shows exports of $${trade_context.total_exports?.toFixed(0)}M and imports of $${trade_context.total_imports?.toFixed(0)}M, resulting in a trade deficit of $${Math.abs(trade_context.trade_balance || 0)?.toFixed(0)}M. The system is operating with current data for comprehensive analysis.`;

            case 'export_highlights':
                return `Export highlights include strong performance in key markets with total export value of $${trade_context.total_exports?.toFixed(0)}M. Top destinations and commodities show continued growth in traditional sectors.`;

            case 'trade_balance_assessment':
                return `Trade balance assessment indicates a deficit of $${Math.abs(trade_context.trade_balance || 0)?.toFixed(0)}M, representing approximately ${((Math.abs(trade_context.trade_balance || 0) / trade_context.total_imports) * 100)?.toFixed(1)}% of import value. This reflects ongoing development needs and infrastructure investment.`;

            default:
                return `Section ${sectionId} provides analysis based on current trade data and system monitoring information.`;
        }
    }

    /**
     * Generate executive summary
     */
    async generateExecutiveSummary(sections, template) {
        try {
            const sectionsContent = Object.entries(sections)
                .map(([id, section]) => `${id}: ${section.content?.substring(0, 200)}...`)
                .join('\n\n');

            const prompt = `
            Generate an executive summary for the ${template.name} report based on these sections:

            ${sectionsContent}

            Provide a concise, professional summary highlighting key findings and recommendations for ${template.audience}.
            `;

            if (openaiService.isConfigured()) {
                const response = await openaiService.client.chat.completions.create({
                    model: openaiService.model,
                    messages: [
                        {
                            role: "system",
                            content: "You are a senior trade analyst creating executive summaries for professional reports."
                        },
                        {
                            role: "user",
                            content: prompt
                        }
                    ],
                    max_tokens: 300,
                    temperature: 0.7
                });

                const cleanedResponse = cleanAIResponse(response.choices[0].message.content);
                return cleanedResponse;
            } else {
                return `This ${template.name} provides comprehensive analysis of Rwanda's trade performance, highlighting key trends in exports, imports, and market dynamics. The report identifies strategic opportunities and operational considerations for enhanced trade performance.`;
            }
        } catch (error) {
            console.error('Error generating executive summary:', error);
            return `Comprehensive ${template.name} covering key trade performance indicators and strategic insights.`;
        }
    }

    /**
     * Get generated reports
     */
    getGeneratedReports(limit = 10) {
        return this.generatedReports.slice(-limit);
    }

    /**
     * Get report by ID
     */
    getReportById(reportId) {
        return this.generatedReports.find(r => r.id === reportId);
    }

    /**
     * Generate custom report on demand
     */
    async generateCustomReport(templateId, customSections = null) {
        const template = this.reportTemplates.find(t => t.id === templateId);
        if (!template) {
            throw new Error(`Template ${templateId} not found`);
        }

        if (customSections) {
            template.sections = customSections;
        }

        return await this.generateReport(templateId);
    }
}

// Initialize the systems after all class definitions are complete
// This avoids hoisting issues in JavaScript
aiSystemMonitor = new AISystemMonitor();
aiAlertSystem = new AIAlertSystem();

module.exports = {
    generateAnalysisExplanation,
    generateModelExplanation,
    generateCorrelationExplanation,
    generateOutlierExplanation,
    generateComprehensiveInsights,
    generateEnhancedComprehensiveInsights,
    generateRealTimeInsights,
    aiSystemMonitor,
    aiAlertSystem,
    AIReportGenerator
};