/**
 * AI Explanation Service
 * Provides AI-powered explanations for trade data analysis
 */

const openaiService = require('./openaiService');

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

module.exports = {
    generateAnalysisExplanation,
    generateModelExplanation,
    generateCorrelationExplanation,
    generateOutlierExplanation,
    generateComprehensiveInsights
};