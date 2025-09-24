/**
 * Predictions API Routes
 * Provides endpoints for accessing AI-generated predictions for Rwanda's trade data
 */

const express = require('express');
const router = express.Router();
const { loadJsonData, dataFileExists } = require('../utils/dataLoader');

/**
 * @route   GET /api/predictions/next
 * @desc    Get predictions for next quarters
 * @access  Public
 * @query   {number} quarters - Optional number of quarters to predict (default: 4)
 */
router.get('/next', (req, res) => {
  try {
    // Check if predictions data exists
    if (dataFileExists('predictions.json')) {
      const predictionsData = loadJsonData('predictions.json');
      res.json(predictionsData);
    } else {
      // If predictions file doesn't exist, generate a simple response
      // based on trade balance data
      
      // Load trade balance data
      const balanceData = loadJsonData('trade_balance.json');
      
      // Sort by quarter
      const sortedData = [...balanceData].sort((a, b) => {
        const [aYear, aQ] = a.quarter.split('Q');
        const [bYear, bQ] = b.quarter.split('Q');
        return aYear === bYear ? aQ - bQ : aYear - bYear;
      });
      
      // Get the last 4 quarters of actual data
      const lastQuarters = sortedData.slice(-4);
      
      // Generate simple predictions for the next 4 quarters
      const predictions = generateSimplePredictions(lastQuarters);
      
      // Format response with both actual and predicted data
      const result = {
        labels: [...lastQuarters.map(q => q.quarter), ...predictions.map(p => p.period)],
        actual: [...lastQuarters.map(q => q.export_value), ...Array(predictions.length).fill(null)],
        predicted: [...Array(lastQuarters.length).fill(null), ...predictions.map(p => p.exports)]
      };
      
      res.json(result);
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

module.exports = router;