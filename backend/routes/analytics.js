/**
 * Analytics API Routes
 * Provides endpoints for advanced analytics on Rwanda's trade data
 */

const express = require('express');
const router = express.Router();
const { loadJsonData, dataFileExists } = require('../utils/dataLoader');

/**
 * @route   GET /api/analytics/growth
 * @desc    Get growth analysis for exports and imports
 * @access  Public
 */
router.get('/growth', (req, res) => {
  try {
    // Check if trade balance data exists (contains growth rates)
    if (dataFileExists('trade_balance.json')) {
      const balanceData = loadJsonData('trade_balance.json');
      
      // Extract quarters, export and import growth rates
      const result = balanceData.map(item => ({
        period: item.quarter,
        exports: parseFloat(item.export_value) || 0,
        imports: parseFloat(item.import_value) || 0,
        balance: parseFloat(item.trade_balance) || 0,
        export_growth: parseFloat(item.export_growth) * 100 || 0, // Convert to percentage
        import_growth: parseFloat(item.import_growth) * 100 || 0, // Convert to percentage
        balance_growth: parseFloat(item.balance_growth) * 100 || 0 // Convert to percentage
      }));
      
      res.json(result);
    } else {
      // If trade balance data doesn't exist, return empty array
      res.json([]);
    }
  } catch (error) {
    console.error('Error fetching growth analytics:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/analytics/comparison
 * @desc    Get comparison between exports and imports
 * @access  Public
 * @query   {string} year - Optional year filter (e.g., 2024)
 */
router.get('/comparison', (req, res) => {
  try {
    const { year = '2024' } = req.query;
    
    // Load exports and imports data
    const exportsData = loadJsonData('exports_data.json');
    const importsData = loadJsonData('imports_data.json');
    
    // Filter by year if specified
    const filteredExports = year 
      ? exportsData.filter(item => item.quarter && item.quarter.startsWith(year))
      : exportsData;
    
    const filteredImports = year 
      ? importsData.filter(item => item.quarter && item.quarter.startsWith(year))
      : importsData;
    
    // Group by quarter
    const quarterlyExports = filteredExports.reduce((acc, item) => {
      const quarter = item.quarter;
      if (!acc[quarter]) {
        acc[quarter] = 0;
      }
      acc[quarter] += parseFloat(item.export_value) || 0;
      return acc;
    }, {});
    
    const quarterlyImports = filteredImports.reduce((acc, item) => {
      const quarter = item.quarter;
      if (!acc[quarter]) {
        acc[quarter] = 0;
      }
      acc[quarter] += parseFloat(item.import_value) || 0;
      return acc;
    }, {});
    
    // Combine data and calculate balance
    const quarters = [...new Set([...Object.keys(quarterlyExports), ...Object.keys(quarterlyImports)])];
    
    const result = quarters.map(quarter => ({
      period: quarter,
      exports: quarterlyExports[quarter] || 0,
      imports: quarterlyImports[quarter] || 0,
      balance: (quarterlyExports[quarter] || 0) - (quarterlyImports[quarter] || 0)
    })).sort((a, b) => {
      // Sort by year and quarter
      const [aYear, aQ] = a.period.split('Q');
      const [bYear, bQ] = b.period.split('Q');
      return aYear === bYear ? aQ - bQ : aYear - bYear;
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching comparison analytics:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/analytics/top-products
 * @desc    Get top products by export value
 * @access  Public
 * @query   {number} limit - Optional limit for number of products (default: 10)
 */
router.get('/top-products', (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    // Load exports data
    const exportsData = loadJsonData('exports_data.json');
    
    // Group by commodity and sum export values
    const productMap = exportsData.reduce((acc, item) => {
      const product = item.commodity || 'Unknown';
      if (!acc[product]) {
        acc[product] = {
          product,
          value: 0,
          count: 0
        };
      }
      acc[product].value += parseFloat(item.export_value) || 0;
      acc[product].count += 1;
      return acc;
    }, {});
    
    // Convert to array, sort by value (descending), and limit results
    const result = Object.values(productMap)
      .sort((a, b) => b.value - a.value)
      .slice(0, parseInt(limit));
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching top products:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/analytics/top-destinations
 * @desc    Get top export destinations
 * @access  Public
 * @query   {number} limit - Optional limit for number of destinations (default: 10)
 */
router.get('/top-destinations', (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    // Load exports data
    const exportsData = loadJsonData('exports_data.json');
    
    // Group by destination country and sum export values
    const destinationMap = exportsData.reduce((acc, item) => {
      const country = item.destination_country || 'Unknown';
      if (!acc[country]) {
        acc[country] = {
          country,
          value: 0,
          count: 0
        };
      }
      acc[country].value += parseFloat(item.export_value) || 0;
      acc[country].count += 1;
      return acc;
    }, {});
    
    // Convert to array, sort by value (descending), and limit results
    const result = Object.values(destinationMap)
      .sort((a, b) => b.value - a.value)
      .slice(0, parseInt(limit));
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching top destinations:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/analytics/summary
 * @desc    Get summary statistics for exports and imports
 * @access  Public
 */
router.get('/summary', (req, res) => {
  try {
    // Check if analysis report exists
    if (dataFileExists('analysis_report.json')) {
      const analysisData = loadJsonData('analysis_report.json');
      
      // Extract summary from analysis report
      if (analysisData.summary) {
        res.json(analysisData.summary);
        return;
      }
    }
    
    // If analysis report doesn't exist or doesn't contain summary,
    // calculate summary from exports and imports data
    
    // Load exports and imports data
    const exportsData = loadJsonData('exports_data.json');
    const importsData = loadJsonData('imports_data.json');
    
    // Calculate total exports and imports
    const totalExports = exportsData.reduce((sum, item) => sum + (parseFloat(item.export_value) || 0), 0);
    const totalImports = importsData.reduce((sum, item) => sum + (parseFloat(item.import_value) || 0), 0);
    
    // Get unique quarters
    const quarters = [...new Set([
      ...exportsData.map(item => item.quarter),
      ...importsData.map(item => item.quarter)
    ])].filter(Boolean).sort();
    
    // Get top export destination
    const destinationMap = exportsData.reduce((acc, item) => {
      const country = item.destination_country || 'Unknown';
      if (!acc[country]) {
        acc[country] = 0;
      }
      acc[country] += parseFloat(item.export_value) || 0;
      return acc;
    }, {});
    
    const topDestination = Object.entries(destinationMap)
      .sort((a, b) => b[1] - a[1])
      .map(([country]) => country)[0] || 'Unknown';
    
    // Get top export product
    const productMap = exportsData.reduce((acc, item) => {
      const product = item.commodity || 'Unknown';
      if (!acc[product]) {
        acc[product] = 0;
      }
      acc[product] += parseFloat(item.export_value) || 0;
      return acc;
    }, {});
    
    const topProduct = Object.entries(productMap)
      .sort((a, b) => b[1] - a[1])
      .map(([product]) => product)[0] || 'Unknown';
    
    // Create summary
    const summary = {
      total_exports: totalExports,
      total_imports: totalImports,
      trade_balance: totalExports - totalImports,
      balance_type: totalExports >= totalImports ? 'surplus' : 'deficit',
      quarters_count: quarters.length,
      latest_quarter: quarters[quarters.length - 1] || 'Unknown',
      top_destination: topDestination,
      top_product: topProduct
    };
    
    res.json(summary);
  } catch (error) {
    console.error('Error fetching summary analytics:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/analytics/search/:query
 * @desc    Search for products or countries in trade data
 * @access  Public
 * @param   {string} query - Search query
 */
router.get('/search/:query', (req, res) => {
  try {
    const { query } = req.params;
    
    if (!query || query.trim().length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }
    
    // Load exports and imports data
    const exportsData = loadJsonData('exports_data.json');
    const importsData = loadJsonData('imports_data.json');
    
    // Search in exports data
    const matchingExports = exportsData.filter(item => {
      const commodity = (item.commodity || '').toLowerCase();
      const country = (item.destination_country || '').toLowerCase();
      const searchTerm = query.toLowerCase();
      
      return commodity.includes(searchTerm) || country.includes(searchTerm);
    });
    
    // Search in imports data
    const matchingImports = importsData.filter(item => {
      const commodity = (item.commodity || '').toLowerCase();
      const country = (item.source_country || '').toLowerCase();
      const searchTerm = query.toLowerCase();
      
      return commodity.includes(searchTerm) || country.includes(searchTerm);
    });
    
    // Group and summarize results
    const exportResults = summarizeSearchResults(matchingExports, 'export');
    const importResults = summarizeSearchResults(matchingImports, 'import');
    
    // Combine results
    const results = [...exportResults, ...importResults];
    
    res.json(results);
  } catch (error) {
    console.error('Error searching trade data:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Helper function to summarize search results
 * @param {Array} data - Matching data items
 * @param {string} type - Type of data ('export' or 'import')
 * @returns {Array} Summarized results
 */
function summarizeSearchResults(data, type) {
  // Group by commodity or country
  const results = [];
  
  // Group by commodity
  const commodityMap = data.reduce((acc, item) => {
    const commodity = item.commodity || 'Unknown';
    if (!acc[commodity]) {
      acc[commodity] = {
        type,
        category: 'product',
        name: commodity,
        value: 0,
        count: 0
      };
    }
    acc[commodity].value += parseFloat(item[type === 'export' ? 'export_value' : 'import_value']) || 0;
    acc[commodity].count += 1;
    return acc;
  }, {});
  
  // Group by country
  const countryMap = data.reduce((acc, item) => {
    const country = type === 'export' ? (item.destination_country || 'Unknown') : (item.source_country || 'Unknown');
    if (!acc[country]) {
      acc[country] = {
        type,
        category: 'country',
        name: country,
        value: 0,
        count: 0
      };
    }
    acc[country].value += parseFloat(item[type === 'export' ? 'export_value' : 'import_value']) || 0;
    acc[country].count += 1;
    return acc;
  }, {});
  
  // Combine results
  return [...Object.values(commodityMap), ...Object.values(countryMap)];
}

module.exports = router;