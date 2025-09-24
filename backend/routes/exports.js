/**
 * Exports API Routes
 * Provides endpoints for accessing Rwanda's export data
 */

const express = require('express');
const router = express.Router();
const { loadJsonData, dataFileExists } = require('../utils/dataLoader');

/**
 * @route   GET /api/exports/quarterly
 * @desc    Get quarterly export data
 * @access  Public
 */
router.get('/quarterly', (req, res) => {
  try {
    // Load exports data
    const exportsData = loadJsonData('exports_data.json');
    
    // Group by quarter and sum export values
    const quarterlyData = exportsData.reduce((acc, item) => {
      const quarter = item.quarter;
      if (!acc[quarter]) {
        acc[quarter] = {
          period: quarter,
          exports: 0,
          count: 0
        };
      }
      acc[quarter].exports += parseFloat(item.export_value) || 0;
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
    console.error('Error fetching quarterly exports:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/exports/destinations
 * @desc    Get top export destinations with values
 * @access  Public
 * @query   {string} year - Optional year filter (e.g., 2024)
 * @query   {number} limit - Optional limit for number of destinations (default: 10)
 */
router.get('/destinations', (req, res) => {
  try {
    const { year = '2024', limit = 10 } = req.query;
    const exportsData = loadJsonData('exports_data.json');
    
    // Filter by year if specified
    const filteredData = year 
      ? exportsData.filter(item => item.quarter && item.quarter.startsWith(year))
      : exportsData;
    
    // Group by destination country and sum export values
    const destinationMap = filteredData.reduce((acc, item) => {
      const country = item.destination_country || 'Unknown';
      if (!acc[country]) {
        acc[country] = {
          country,
          value: 0,
          // Add mock coordinates for demo purposes
          // In a real app, these would come from a geocoding service or database
          lat: getCountryCoordinates(country).lat,
          lng: getCountryCoordinates(country).lng
        };
      }
      acc[country].value += parseFloat(item.export_value) || 0;
      return acc;
    }, {});
    
    // Convert to array, sort by value (descending), and limit results
    const result = Object.values(destinationMap)
      .sort((a, b) => b.value - a.value)
      .slice(0, parseInt(limit));
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching export destinations:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/exports/products
 * @desc    Get top export products/commodities with values
 * @access  Public
 * @query   {number} limit - Optional limit for number of products (default: 10)
 */
router.get('/products', (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const exportsData = loadJsonData('exports_data.json');
    
    // Group by commodity and sum export values
    const productMap = exportsData.reduce((acc, item) => {
      const product = item.commodity || 'Unknown';
      if (!acc[product]) {
        acc[product] = {
          product,
          value: 0
        };
      }
      acc[product].value += parseFloat(item.export_value) || 0;
      return acc;
    }, {});
    
    // Convert to array, sort by value (descending), and limit results
    const result = Object.values(productMap)
      .sort((a, b) => b.value - a.value)
      .slice(0, parseInt(limit));
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching export products:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/exports/growth
 * @desc    Get export growth rates by quarter
 * @access  Public
 */
router.get('/growth', (req, res) => {
  try {
    // Check if trade balance data exists (contains growth rates)
    if (dataFileExists('trade_balance.json')) {
      const balanceData = loadJsonData('trade_balance.json');
      
      // Extract quarters and export growth rates
      const result = balanceData.map(item => ({
        period: item.quarter,
        growth: parseFloat(item.export_growth) * 100 // Convert to percentage
      }));
      
      res.json(result);
    } else {
      // If trade balance data doesn't exist, calculate from exports data
      const exportsData = loadJsonData('exports_data.json');
      
      // Group by quarter and sum export values
      const quarterlyData = exportsData.reduce((acc, item) => {
        const quarter = item.quarter;
        if (!acc[quarter]) {
          acc[quarter] = {
            period: quarter,
            value: 0
          };
        }
        acc[quarter].value += parseFloat(item.export_value) || 0;
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
    console.error('Error fetching export growth:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Helper function to get mock coordinates for countries
 * In a real app, these would come from a geocoding service or database
 */
function getCountryCoordinates(country) {
  const coordinates = {
    'United Arab Emirates': { lat: 23.4241, lng: 53.8478 },
    'Democratic Republic of Congo': { lat: -4.0383, lng: 21.7587 },
    'China': { lat: 35.8617, lng: 104.1954 },
    'Luxembourg': { lat: 49.8153, lng: 6.1296 },
    'United Kingdom': { lat: 55.3781, lng: -3.4360 },
    'Tanzania': { lat: -6.369, lng: 34.8888 },
    'Kenya': { lat: 0.0236, lng: 37.9062 },
    'India': { lat: 20.5937, lng: 78.9629 },
    'Uganda': { lat: 1.3733, lng: 32.2903 },
    'Burundi': { lat: -3.3731, lng: 29.9189 },
    'Ethiopia': { lat: 9.145, lng: 40.4897 },
    'Various': { lat: 0, lng: 0 },
    'Unknown': { lat: 0, lng: 0 }
  };
  
  return coordinates[country] || { lat: 0, lng: 0 };
}

module.exports = router;