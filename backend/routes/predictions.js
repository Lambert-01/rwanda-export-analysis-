/**
 * Predictions API Routes
 * Provides endpoints for accessing AI-generated predictions for Rwanda's trade data
 */

const express = require('express');
const router = express.Router();
const { loadJsonData, dataFileExists } = require('../utils/dataLoader');

/**
 * @route   GET /api/predictions/next
 * @desc    Get predictions for next quarters with live forecasting
 * @access  Public
 * @query   {number} quarters - Optional number of quarters to predict (default: 4)
 * @query   {string} method - Prediction method: 'linear', 'seasonal', 'ml' (default: 'linear')
 */
router.get('/next', (req, res) => {
   try {
     const { quarters = 4, method = 'linear' } = req.query;

     // Check if predictions data exists
     if (dataFileExists('predictions.json')) {
       const predictionsData = loadJsonData('predictions.json');
       res.json(predictionsData);
     } else {
       // Generate live predictions based on available data
       const predictions = generateLivePredictions(parseInt(quarters), method);
       res.json(predictions);
     }
   } catch (error) {
     console.error('Error fetching predictions:', error);
     res.status(500).json({ error: error.message });
   }
 });

/**
 * @route   GET /api/predictions/opportunities
 * @desc    Get predicted export opportunities
 * @access  Public
 * @query   {number} limit - Optional limit for number of opportunities (default: 5)
 */
router.get('/opportunities', (req, res) => {
  try {
    const { limit = 5 } = req.query;
    
    // Check if analysis report exists (contains opportunities)
    if (dataFileExists('analysis_report.json')) {
      const analysisData = loadJsonData('analysis_report.json');
      
      // Extract opportunities from analysis report
      if (analysisData.opportunities && Array.isArray(analysisData.opportunities)) {
        const opportunities = analysisData.opportunities
          .slice(0, parseInt(limit));
        
        res.json(opportunities);
      } else {
        // Generate mock opportunities if not found in analysis report
        res.json(generateMockOpportunities(parseInt(limit)));
      }
    } else {
      // Generate mock opportunities if analysis report doesn't exist
      res.json(generateMockOpportunities(parseInt(limit)));
    }
  } catch (error) {
    console.error('Error fetching opportunities:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/predictions/live
 * @desc    Get real-time live forecasting with multiple methods
 * @access  Public
 * @query   {number} quarters - Number of quarters to predict (default: 4)
 * @query   {string} method - Prediction method: 'linear', 'seasonal', 'ml', 'ensemble' (default: 'ensemble')
 */
router.get('/live', async (req, res) => {
   try {
     const { quarters = 4, method = 'ensemble' } = req.query;

     console.log(`🔮 Generating live ${method} predictions for ${quarters} quarters`);

     let result;

     if (method === 'ensemble') {
       // Generate predictions using multiple methods and combine them
       const linearResult = generateLivePredictions(quarters, 'linear');
       const seasonalResult = generateLivePredictions(quarters, 'seasonal');
       const mlResult = generateLivePredictions(quarters, 'ml');

       // Ensemble method: weighted average of all methods
       result = {
         method: 'ensemble',
         confidence: Math.round((linearResult.confidence + seasonalResult.confidence + mlResult.confidence) / 3),
         last_updated: new Date().toISOString(),
         ensemble_weights: {
           linear: 0.3,
           seasonal: 0.4,
           ml: 0.3
         },
         predictions: combineEnsemblePredictions([
           { method: 'linear', data: linearResult.predictions, weight: 0.3 },
           { method: 'seasonal', data: seasonalResult.predictions, weight: 0.4 },
           { method: 'ml', data: mlResult.predictions, weight: 0.3 }
         ]),
         individual_predictions: {
           linear: linearResult.predictions,
           seasonal: seasonalResult.predictions,
           ml: mlResult.predictions
         },
         metadata: {
           data_points: linearResult.metadata?.data_points || 0,
           prediction_method: 'ensemble',
           forecast_horizon: quarters,
           ensemble_description: 'Weighted combination of linear regression, seasonal analysis, and ML methods'
         }
       };
     } else {
       result = generateLivePredictions(quarters, method);
     }

     console.log(`✅ Live predictions generated successfully using ${method} method`);
     res.json(result);
   } catch (error) {
     console.error('Error generating live predictions:', error);
     res.status(500).json({
       error: error.message,
       fallback: generateFallbackPredictions(parseInt(quarters))
     });
   }
 });

/**
 * Combine predictions from multiple methods using weighted average
 */
function combineEnsemblePredictions(methodResults) {
   const combined = {};

   // Initialize combined predictions
   methodResults[0].data.forEach((pred, index) => {
     combined[pred.period] = {
       period: pred.period,
       exports: 0,
       confidence: 0,
       methods: []
     };
   });

   // Weight predictions from each method
   methodResults.forEach(({ data, weight }) => {
     data.forEach(pred => {
       if (combined[pred.period]) {
         combined[pred.period].exports += pred.exports * weight;
         combined[pred.period].confidence += pred.confidence * weight;
         combined[pred.period].methods.push({
           method: pred.method,
           value: pred.exports,
           confidence: pred.confidence
         });
       }
     });
   });

   // Convert back to array and round values
   return Object.values(combined).map(pred => ({
     period: pred.period,
     exports: Math.round(pred.exports * 100) / 100,
     confidence: Math.round(pred.confidence * 100) / 100,
     method: 'ensemble',
     method_details: pred.methods
   }));
 }

/**
 * @route   GET /api/predictions/risks
 * @desc    Get predicted export risks
 * @access  Public
 * @query   {number} limit - Optional limit for number of risks (default: 5)
 */
router.get('/risks', (req, res) => {
  try {
    const { limit = 5 } = req.query;
    
    // Check if analysis report exists (contains risks)
    if (dataFileExists('analysis_report.json')) {
      const analysisData = loadJsonData('analysis_report.json');
      
      // Extract risks from analysis report
      if (analysisData.risks && Array.isArray(analysisData.risks)) {
        const risks = analysisData.risks
          .slice(0, parseInt(limit));
        
        res.json(risks);
      } else {
        // Generate mock risks if not found in analysis report
        res.json(generateMockRisks(parseInt(limit)));
      }
    } else {
      // Generate mock risks if analysis report doesn't exist
      res.json(generateMockRisks(parseInt(limit)));
    }
  } catch (error) {
    console.error('Error fetching risks:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Enhanced live forecasting function with multiple prediction methods
 * @param {number} quarters - Number of quarters to predict
 * @param {string} method - Prediction method: 'linear', 'seasonal', 'ml'
 * @returns {Object} Prediction results with metadata
 */
function generateLivePredictions(quarters, method) {
   try {
     // Load available data sources
     const exportsData = loadJsonData('exports_data.json');
     const balanceData = dataFileExists('trade_balance.json') ? loadJsonData('trade_balance.json') : [];

     // Group exports by quarter
     const quarterlyExports = exportsData.reduce((acc, item) => {
       const quarter = item.quarter;
       if (!acc[quarter]) {
         acc[quarter] = { period: quarter, exports: 0, count: 0 };
       }
       acc[quarter].exports += parseFloat(item.export_value) || 0;
       acc[quarter].count += 1;
       return acc;
     }, {});

     // Convert to array and sort
     const sortedQuarters = Object.values(quarterlyExports).sort((a, b) => {
       const [aYear, aQ] = a.period.split('Q');
       const [bYear, bQ] = b.period.split('Q');
       return aYear === bYear ? aQ - bQ : aYear - bYear;
     });

     // Get last 8 quarters for trend analysis
     const recentData = sortedQuarters.slice(-8);

     // Generate predictions based on method
     let predictions = [];
     let confidence = 0;

     switch (method) {
       case 'seasonal':
         ({ predictions, confidence } = generateSeasonalPredictions(recentData, quarters));
         break;
       case 'ml':
         ({ predictions, confidence } = generateMLPredictions(recentData, quarters));
         break;
       default: // linear
         ({ predictions, confidence } = generateLinearPredictions(recentData, quarters));
     }

     // Format response
     const result = {
       method: method,
       confidence: confidence,
       last_updated: new Date().toISOString(),
       historical_data: recentData.map(q => ({ period: q.period, exports: q.exports })),
       predictions: predictions,
       metadata: {
         data_points: recentData.length,
         prediction_method: method,
         forecast_horizon: quarters
       }
     };

     return result;
   } catch (error) {
     console.error('Error in live predictions:', error);
     return generateFallbackPredictions(quarters);
   }
 }

/**
 * Linear regression-based predictions
 */
function generateLinearPredictions(recentData, quarters) {
   if (!recentData || recentData.length < 3) {
     return { predictions: [], confidence: 0 };
   }

   // Calculate linear regression
   const n = recentData.length;
   const sumX = recentData.reduce((sum, item, index) => sum + index, 0);
   const sumY = recentData.reduce((sum, item) => sum + item.exports, 0);
   const sumXY = recentData.reduce((sum, item, index) => sum + (index * item.exports), 0);
   const sumXX = recentData.reduce((sum, item, index) => sum + (index * index), 0);

   const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
   const intercept = (sumY - slope * sumX) / n;

   // Calculate R-squared for confidence
   const meanY = sumY / n;
   const totalSumSquares = recentData.reduce((sum, item) => sum + Math.pow(item.exports - meanY, 2), 0);
   const residualSumSquares = recentData.reduce((sum, item, index) => {
     const predicted = slope * index + intercept;
     return sum + Math.pow(item.exports - predicted, 2);
   }, 0);

   const rSquared = totalSumSquares === 0 ? 0 : 1 - (residualSumSquares / totalSumSquares);
   const confidence = Math.max(0, Math.min(100, rSquared * 100));

   // Generate predictions
   const predictions = [];
   const lastIndex = recentData.length - 1;
   const lastQuarter = recentData[lastIndex].period;
   const [year, quarter] = [parseInt(lastQuarter.substring(0, 4)), parseInt(lastQuarter.substring(5))];

   for (let i = 1; i <= quarters; i++) {
     let nextQuarter = quarter + i;
     let nextYear = year;

     while (nextQuarter > 4) {
       nextQuarter -= 4;
       nextYear += 1;
     }

     const predictedValue = Math.max(0, slope * (lastIndex + i) + intercept);

     predictions.push({
       period: `${nextYear}Q${nextQuarter}`,
       exports: Math.round(predictedValue * 100) / 100,
       confidence: Math.round(confidence * 0.9) / 100, // Slight decrease in confidence for future periods
       method: 'linear_regression'
     });
   }

   return { predictions, confidence: Math.round(confidence) };
 }

/**
 * Seasonal decomposition predictions
 */
function generateSeasonalPredictions(recentData, quarters) {
   if (!recentData || recentData.length < 8) {
     return generateLinearPredictions(recentData, quarters);
   }

   // Simple seasonal adjustment - use average quarterly growth
   const quarterlyGrowth = [];
   for (let i = 4; i < recentData.length; i++) {
     const growth = (recentData[i].exports - recentData[i-4].exports) / recentData[i-4].exports;
     quarterlyGrowth.push(growth);
   }

   const avgQuarterlyGrowth = quarterlyGrowth.reduce((sum, growth) => sum + growth, 0) / quarterlyGrowth.length;
   const confidence = Math.min(85, Math.max(60, 100 - (quarterlyGrowth.length * 2)));

   // Generate predictions
   const predictions = [];
   const lastValue = recentData[recentData.length - 1].exports;
   const lastQuarter = recentData[recentData.length - 1].period;
   const [year, quarter] = [parseInt(lastQuarter.substring(0, 4)), parseInt(lastQuarter.substring(5))];

   let currentValue = lastValue;
   for (let i = 1; i <= quarters; i++) {
     let nextQuarter = quarter + i;
     let nextYear = year;

     while (nextQuarter > 4) {
       nextQuarter -= 4;
       nextYear += 1;
     }

     currentValue = currentValue * (1 + avgQuarterlyGrowth);

     predictions.push({
       period: `${nextYear}Q${nextQuarter}`,
       exports: Math.round(currentValue * 100) / 100,
       confidence: Math.round(confidence * Math.pow(0.95, i)) / 100,
       method: 'seasonal'
     });
   }

   return { predictions, confidence: Math.round(confidence) };
 }

/**
 * Machine learning style predictions (simplified)
 */
function generateMLPredictions(recentData, quarters) {
   if (!recentData || recentData.length < 6) {
     return generateLinearPredictions(recentData, quarters);
   }

   // Use exponential smoothing for ML-style prediction
   const alpha = 0.3; // Smoothing parameter
   let smoothedValue = recentData[0].exports;

   for (let i = 1; i < recentData.length; i++) {
     smoothedValue = alpha * recentData[i].exports + (1 - alpha) * smoothedValue;
   }

   // Calculate trend
   const trend = recentData.length > 1 ?
     (recentData[recentData.length - 1].exports - recentData[0].exports) / (recentData.length - 1) : 0;

   const confidence = 75; // ML methods typically have good confidence

   // Generate predictions
   const predictions = [];
   const lastQuarter = recentData[recentData.length - 1].period;
   const [year, quarter] = [parseInt(lastQuarter.substring(0, 4)), parseInt(lastQuarter.substring(5))];

   for (let i = 1; i <= quarters; i++) {
     let nextQuarter = quarter + i;
     let nextYear = year;

     while (nextQuarter > 4) {
       nextQuarter -= 4;
       nextYear += 1;
     }

     // Combine smoothed value with trend
     const predictedValue = smoothedValue + (trend * i);

     predictions.push({
       period: `${nextYear}Q${nextQuarter}`,
       exports: Math.round(Math.max(0, predictedValue) * 100) / 100,
       confidence: Math.round(confidence * Math.pow(0.92, i)) / 100,
       method: 'ml_exponential_smoothing'
     });
   }

   return { predictions, confidence: Math.round(confidence) };
 }

/**
 * Fallback predictions when data is insufficient
 */
function generateFallbackPredictions(quarters) {
   const predictions = [];
   const baseValue = 700; // Base prediction value

   for (let i = 1; i <= quarters; i++) {
     predictions.push({
       period: `2025Q${i}`,
       exports: Math.round((baseValue + (i * 20)) * 100) / 100,
       confidence: 0.5,
       method: 'fallback'
     });
   }

   return {
     method: 'fallback',
     confidence: 50,
     last_updated: new Date().toISOString(),
     historical_data: [],
     predictions: predictions,
     metadata: {
       data_points: 0,
       prediction_method: 'fallback',
       forecast_horizon: quarters,
       note: 'Insufficient historical data for accurate predictions'
     }
   };
 }

/**
 * Helper function to generate simple predictions based on recent data
 * Uses a very basic linear extrapolation
 * @param {Array} recentData - Recent quarters of trade data
 * @returns {Array} Predicted data for next quarters
 */
function generateSimplePredictions(recentData) {
   // If no recent data, return empty array
   if (!recentData || recentData.length === 0) {
     return [];
   }

   // Calculate average growth rate from recent data
   let growthRates = [];
   for (let i = 1; i < recentData.length; i++) {
     const prev = parseFloat(recentData[i-1].export_value);
     const curr = parseFloat(recentData[i].export_value);
     if (prev > 0) {
       growthRates.push((curr - prev) / prev);
     }
   }

   // Calculate average growth rate (or use 0.05 if no valid rates)
   const avgGrowthRate = growthRates.length > 0
     ? growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length
     : 0.05;

   // Get the last quarter and value
   const lastQuarter = recentData[recentData.length - 1].quarter;
   const lastValue = parseFloat(recentData[recentData.length - 1].export_value);

   // Parse year and quarter
   const [year, quarter] = [parseInt(lastQuarter.substring(0, 4)), parseInt(lastQuarter.substring(5))];

   // Generate predictions for next 4 quarters
   const predictions = [];
   let currentValue = lastValue;

   for (let i = 1; i <= 4; i++) {
     // Calculate next quarter
     let nextQuarter = quarter + i;
     let nextYear = year;

     // Adjust year if quarter > 4
     while (nextQuarter > 4) {
       nextQuarter -= 4;
       nextYear += 1;
     }

     // Apply growth rate to current value
     currentValue = currentValue * (1 + avgGrowthRate);

     // Add prediction
     predictions.push({
       period: `${nextYear}Q${nextQuarter}`,
       exports: currentValue,
       growth: avgGrowthRate * 100
     });
   }

   return predictions;
 }

/**
 * Helper function to generate mock export opportunities
 * @param {number} count - Number of opportunities to generate
 * @returns {Array} Mock opportunities
 */
function generateMockOpportunities(count) {
  const opportunities = [
    {
      product: "Coffee",
      score: 85,
      potential_markets: ["Japan", "South Korea", "Australia"],
      growth_potential: 12.5,
      description: "Premium Arabica coffee has strong growth potential in Asian markets."
    },
    {
      product: "Tea",
      score: 82,
      potential_markets: ["United Kingdom", "Canada", "Germany"],
      growth_potential: 9.8,
      description: "Specialty tea exports could expand in European markets with premium packaging."
    },
    {
      product: "Minerals",
      score: 78,
      potential_markets: ["China", "India", "UAE"],
      growth_potential: 15.2,
      description: "Processed mineral exports have higher value-add potential than raw exports."
    },
    {
      product: "Horticulture",
      score: 76,
      potential_markets: ["Netherlands", "Belgium", "France"],
      growth_potential: 18.7,
      description: "Cut flowers and fresh produce have strong demand in European markets."
    },
    {
      product: "Textiles",
      score: 72,
      potential_markets: ["United States", "Canada", "Germany"],
      growth_potential: 11.3,
      description: "Garment manufacturing with local materials shows strong export potential."
    },
    {
      product: "Leather Products",
      score: 68,
      potential_markets: ["Italy", "France", "Spain"],
      growth_potential: 8.9,
      description: "Processed leather goods command premium prices in European markets."
    },
    {
      product: "Processed Foods",
      score: 65,
      potential_markets: ["Kenya", "Uganda", "Tanzania"],
      growth_potential: 14.2,
      description: "Value-added food products have growing regional market demand."
    }
  ];
  
  return opportunities.slice(0, count);
}

/**
 * Helper function to generate mock export risks
 * @param {number} count - Number of risks to generate
 * @returns {Array} Mock risks
 */
function generateMockRisks(count) {
  const risks = [
    {
      product: "Raw Minerals",
      risk_score: 75,
      risk_factors: ["Price volatility", "Regulatory changes", "Supply chain disruptions"],
      mitigation: "Diversify mineral processing capabilities and export markets."
    },
    {
      product: "Agricultural Exports",
      risk_score: 68,
      risk_factors: ["Climate change", "Pest outbreaks", "Market access barriers"],
      mitigation: "Invest in climate-resilient farming and certification programs."
    },
    {
      product: "Tourism Services",
      risk_score: 62,
      risk_factors: ["Global health crises", "Security concerns", "Competition"],
      mitigation: "Develop diverse tourism offerings and digital marketing strategies."
    },
    {
      product: "Textile Exports",
      risk_score: 58,
      risk_factors: ["Labor costs", "Fast fashion trends", "Trade agreements"],
      mitigation: "Focus on sustainable and ethical production for premium markets."
    },
    {
      product: "ICT Services",
      risk_score: 45,
      risk_factors: ["Talent retention", "Infrastructure limitations", "Regional competition"],
      mitigation: "Invest in specialized training and digital infrastructure."
    }
  ];
  
  return risks.slice(0, count);
}

/**
  * @route   GET /api/predictions
  * @desc    Get all predictions data (main endpoint for frontend)
  * @access  Public
  */
router.get('/', (req, res) => {
  try {
    // Check if predictions data exists
    if (dataFileExists('predictions.json')) {
      const predictionsData = loadJsonData('predictions.json');
      res.json(predictionsData);
    } else {
      // Return mock predictions if data doesn't exist
      res.json({
        export_predictions: [
          { quarter: "2025Q1", predicted_export: 700, confidence: 80 },
          { quarter: "2025Q2", predicted_export: 720, confidence: 75 },
          { quarter: "2025Q3", predicted_export: 740, confidence: 70 },
          { quarter: "2025Q4", predicted_export: 760, confidence: 65 }
        ],
        import_predictions: [
          { quarter: "2025Q1", predicted_import: 1700, confidence: 78 },
          { quarter: "2025Q2", predicted_import: 1750, confidence: 73 },
          { quarter: "2025Q3", predicted_import: 1800, confidence: 68 },
          { quarter: "2025Q4", predicted_import: 1850, confidence: 63 }
        ],
        commodity_predictions: []
      });
    }
  } catch (error) {
    console.error('Error fetching predictions data:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;