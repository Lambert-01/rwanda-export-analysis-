/**
 * Imports API Routes
 * Provides endpoints for accessing Rwanda's import data
 */

const express = require('express');
const router = express.Router();
const { loadJsonData, dataFileExists } = require('../utils/dataLoader');

/**
 * @route   GET /api/imports/quarterly
 * @desc    Get quarterly import data
 * @access  Public
 */
router.get('/quarterly', (req, res) => {
  try {
    // Load imports data
    const importsData = loadJsonData('imports_data.json');
    
    // Group by quarter and sum import values
    const quarterlyData = importsData.reduce((acc, item) => {
      const quarter = item.quarter;
      if (!acc[quarter]) {
        acc[quarter] = {
          period: quarter,
          imports: 0,
          count: 0
        };
      }
      acc[quarter].imports += parseFloat(item.import_value) || 0;
      acc[quarter].count += 1;
      return acc;
    }, {});
    
    // Convert to array and sort by quarter
    const result = Object.values(quarterlyData).sort((a, b) => {
      // Sort by year and quarter (e.g., 2024Q1, 2024Q2, etc.)
      const [aYear, aQ] = a.period.split('Q');
      const [bYear, bQ] = b.period.split('Q');
      return aYear === bYear ? aQ - bQ : aYear - bYear;
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching quarterly imports:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/imports/sources
 * @desc    Get top import sources with values
 * @access  Public
 * @query   {string} year - Optional year filter (e.g., 2024)
 * @query   {number} limit - Optional limit for number of sources (default: 10)
 */
router.get('/sources', (req, res) => {
  try {
    const { year = '2024', limit = 10 } = req.query;
    const importsData = loadJsonData('imports_data.json');
    
    // Filter by year if specified
    const filteredData = year 
      ? importsData.filter(item => item.quarter && item.quarter.startsWith(year))
      : importsData;
    
    // Group by source country and sum import values
    const sourceMap = filteredData.reduce((acc, item) => {
      const country = item.source_country || 'Unknown';
      if (!acc[country]) {
        acc[country] = {
          country,
          value: 0,
          // Add mock coordinates for demo purposes
          lat: getCountryCoordinates(country).lat,
          lng: getCountryCoordinates(country).lng
        };
      }
      acc[country].value += parseFloat(item.import_value) || 0;
      return acc;
    }, {});
    
    // Convert to array, sort by value (descending), and limit results
    const result = Object.values(sourceMap)
      .sort((a, b) => b.value - a.value)
      .slice(0, parseInt(limit));
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching import sources:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/imports/categories
 * @desc    Get import categories/commodities with values
 * @access  Public
 * @query   {number} limit - Optional limit for number of categories (default: 10)
 */
router.get('/categories', (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const importsData = loadJsonData('imports_data.json');
    
    // Group by commodity and sum import values
    const categoryMap = importsData.reduce((acc, item) => {
      const category = item.commodity || 'Unknown';
      if (!acc[category]) {
        acc[category] = {
          product: category,
          value: 0
        };
      }
      acc[category].value += parseFloat(item.import_value) || 0;
      return acc;
    }, {});
    
    // Convert to array, sort by value (descending), and limit results
    const result = Object.values(categoryMap)
      .sort((a, b) => b.value - a.value)
      .slice(0, parseInt(limit));
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching import categories:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/imports/growth
 * @desc    Get import growth rates by quarter
 * @access  Public
 */
router.get('/growth', (req, res) => {
  try {
    // Check if trade balance data exists (contains growth rates)
    if (dataFileExists('trade_balance.json')) {
      const balanceData = loadJsonData('trade_balance.json');
      
      // Extract quarters and import growth rates
      const result = balanceData.map(item => ({
        period: item.quarter,
        growth: parseFloat(item.import_growth) * 100 // Convert to percentage
      }));
      
      res.json(result);
    } else {
      // If trade balance data doesn't exist, calculate from imports data
      const importsData = loadJsonData('imports_data.json');
      
      // Group by quarter and sum import values
      const quarterlyData = importsData.reduce((acc, item) => {
        const quarter = item.quarter;
        if (!acc[quarter]) {
          acc[quarter] = {
            period: quarter,
            value: 0
          };
        }
        acc[quarter].value += parseFloat(item.import_value) || 0;
        return acc;
      }, {});
      
      // Convert to array and sort by quarter
      const sortedData = Object.values(quarterlyData).sort((a, b) => {
        const [aYear, aQ] = a.period.split('Q');
        const [bYear, bQ] = b.period.split('Q');
        return aYear === bYear ? aQ - bQ : aYear - bYear;
      });
      
      // Calculate growth rates
      const result = sortedData.map((item, index) => {
        if (index === 0) {
          return { ...item, growth: 0 }; // No growth rate for first period
        }
        const prevValue = sortedData[index - 1].value;
        const growth = prevValue === 0 ? 0 : ((item.value - prevValue) / prevValue) * 100;
        return { ...item, growth };
      });
      
      res.json(result);
    }
  } catch (error) {
    console.error('Error fetching import growth:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Helper function to get mock coordinates for countries
 * In a real app, these would come from a geocoding service or database
 */
function getCountryCoordinates(country) {
  const coordinates = {
    'China': { lat: 35.8617, lng: 104.1954 },
    'Tanzania': { lat: -6.369, lng: 34.8888 },
    'Kenya': { lat: 0.0236, lng: 37.9062 },
    'India': { lat: 20.5937, lng: 78.9629 },
    'United Arab Emirates': { lat: 23.4241, lng: 53.8478 },
    'Uganda': { lat: 1.3733, lng: 32.2903 },
    'Democratic Republic of Congo': { lat: -4.0383, lng: 21.7587 },
    'South Africa': { lat: -30.5595, lng: 22.9375 },
    'Japan': { lat: 36.2048, lng: 138.2529 },
    'Germany': { lat: 51.1657, lng: 10.4515 },
    'Various': { lat: 0, lng: 0 },
    'Unknown': { lat: 0, lng: 0 }
  };
  
  return coordinates[country] || { lat: 0, lng: 0 };
}

/**
  * @route   GET /api/imports
  * @desc    Get all imports data (main endpoint for frontend)
  * @access  Public
  */
router.get('/', (req, res) => {
  try {
    // Check if imports data exists
    if (dataFileExists('imports_data.json')) {
      const importsData = loadJsonData('imports_data.json');

      // Group by quarter and sum import values
      const quarterlyData = importsData.reduce((acc, item) => {
        const quarter = item.quarter;
        if (!acc[quarter]) {
          acc[quarter] = {
            period: quarter,
            imports: 0,
            count: 0
          };
        }
        acc[quarter].imports += parseFloat(item.import_value) || 0;
        acc[quarter].count += 1;
        return acc;
      }, {});

      // Convert to array and sort by quarter
      const result = Object.values(quarterlyData).sort((a, b) => {
        const [aYear, aQ] = a.period.split('Q');
        const [bYear, bQ] = b.period.split('Q');
        return aYear === bYear ? aQ - bQ : aYear - bYear;
      });

      res.json(result);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error('Error fetching imports data:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;