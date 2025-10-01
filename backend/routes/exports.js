/**
 * Exports API Routes
 * Provides endpoints for accessing Rwanda's export data
 */

const express = require('express');
const router = express.Router();
const { loadJsonData, dataFileExists } = require('../utils/dataLoader');
const openaiService = require('../utils/openaiService');
const { ExportData, TradeBalance, StatisticalAnalysis } = require('../utils/database');

/**
 * @route   GET /api/exports/quarterly
 * @desc    Get quarterly export data
 * @access  Public
 */
router.get('/quarterly', async (req, res) => {
   try {
     console.log('📊 Fetching quarterly exports from MongoDB...');

     // Try MongoDB first (primary data source)
     try {
       const exportDocs = await ExportData.aggregate([
         {
           $group: {
             _id: '$quarter',
             period: { $first: '$quarter' },
             exports: { $sum: '$export_value' },
             count: { $sum: 1 }
           }
         },
         {
           $project: {
             period: '$period',
             exports: { $round: ['$exports', 2] },
             count: '$count'
           }
         },
         {
           $sort: { period: 1 }
         }
       ]);

       if (exportDocs && exportDocs.length > 0) {
         console.log(`✅ Retrieved ${exportDocs.length} quarters from MongoDB`);
         res.json(exportDocs);
         return;
       }
     } catch (mongoError) {
       console.warn('⚠️ MongoDB query failed, falling back to JSON files:', mongoError.message);
     }

     // Fallback to comprehensive analysis data (Python-processed)
     if (dataFileExists('comprehensive_analysis.json')) {
       const comprehensiveData = loadJsonData('comprehensive_analysis.json');

       if (comprehensiveData.quarterly_aggregation && comprehensiveData.quarterly_aggregation.exports) {
         const result = comprehensiveData.quarterly_aggregation.exports.map(item => ({
           period: item.quarter,
           exports: item.export_value,
           count: 1
         }));

         console.log('📊 Using comprehensive analysis data for quarterly exports');
         res.json(result);
         return;
       }
     }

     // Final fallback to original exports data
     console.log('📊 Using original exports data for quarterly exports');
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
router.get('/destinations', async (req, res) => {
   try {
     const { year = '2024', limit = 10 } = req.query;

     console.log('🗺️ Fetching export destinations from MongoDB...');

     // Try MongoDB first (primary data source)
     try {
       const destinations = await ExportData.aggregate([
         {
           $match: year !== 'all' ? { year: parseInt(year) } : {}
         },
         {
           $group: {
             _id: '$destination_country',
             country: { $first: '$destination_country' },
             value: { $sum: '$export_value' },
             count: { $sum: 1 }
           }
         },
         {
           $project: {
             country: '$country',
             value: { $round: ['$value', 2] },
             count: '$count',
             lat: getCountryCoordinates('$country').lat,
             lng: getCountryCoordinates('$country').lng
           }
         },
         {
           $sort: { value: -1 }
         },
         {
           $limit: parseInt(limit)
         }
       ]);

       if (destinations && destinations.length > 0) {
         // Add coordinates to results
         const result = destinations.map(item => ({
           country: item.country,
           value: item.value,
           lat: getCountryCoordinates(item.country).lat,
           lng: getCountryCoordinates(item.country).lng
         }));

         console.log(`✅ Retrieved ${result.length} export destinations from MongoDB`);
         res.json(result);
         return;
       }
     } catch (mongoError) {
       console.warn('⚠️ MongoDB destinations query failed, falling back to JSON files:', mongoError.message);
     }

     // Fallback to comprehensive analysis data (Python-processed)
     if (dataFileExists('comprehensive_analysis.json')) {
       const comprehensiveData = loadJsonData('comprehensive_analysis.json');

       if (comprehensiveData.country_aggregation && comprehensiveData.country_aggregation.export_destinations) {
         let destinations = comprehensiveData.country_aggregation.export_destinations;

         // Convert to expected format and limit results
         const result = destinations.slice(0, parseInt(limit)).map(item => ({
           country: item.destination_country,
           value: item.export_value,
           lat: getCountryCoordinates(item.destination_country).lat,
           lng: getCountryCoordinates(item.destination_country).lng
         }));

         console.log('🗺️ Using comprehensive analysis data for export destinations');
         res.json(result);
         return;
       }
     }

     // Final fallback to original exports data
     console.log('🗺️ Using original exports data for destinations');
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

/**
 * @route   GET /api/exports
 * @desc    Get all exports data (main endpoint for frontend)
 * @access  Public
 */
router.get('/', (req, res) => {
  try {
    console.log('📤 Fetching all exports data...');

    // Check if exports data exists
    if (dataFileExists('exports_data.json')) {
      const exportsData = loadJsonData('exports_data.json');
      console.log('📤 Exports data loaded, processing...');

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
        const [aYear, aQ] = a.period.split('Q');
        const [bYear, bQ] = b.period.split('Q');
        return aYear === bYear ? aQ - bQ : aYear - bYear;
      });

      console.log('📤 Exports data processed successfully:', result.length, 'quarters');
      res.json(result);
    } else {
      console.log('📤 No exports data file found');
      res.json([]);
    }
  } catch (error) {
    console.error('❌ Error fetching exports data:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/exports/heatmap
 * @desc    Get export data formatted for heatmap visualization
 * @access  Public
 */
router.get('/heatmap', (req, res) => {
  try {
    const { year = '2024' } = req.query;
    console.log('🗺️ Fetching export heatmap data for year:', year);

    const exportsData = loadJsonData('exports_data.json');

    // Filter by year and format for heatmap
    const filteredData = year
      ? exportsData.filter(item => item.quarter && item.quarter.startsWith(year))
      : exportsData;

    // Group by destination and sum values
    const heatmapData = filteredData.reduce((acc, item) => {
      const country = item.destination_country || 'Unknown';
      if (!acc[country]) {
        acc[country] = {
          country,
          value: 0,
          lat: getCountryCoordinates(country).lat,
          lng: getCountryCoordinates(country).lng
        };
      }
      acc[country].value += parseFloat(item.export_value) || 0;
      return acc;
    }, {});

    const result = Object.values(heatmapData).filter(item => item.lat !== 0 && item.lng !== 0);
    console.log('🗺️ Heatmap data processed:', result.length, 'countries');
    res.json(result);
  } catch (error) {
    console.error('Error fetching export heatmap:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/exports/summary
 * @desc    Get export summary statistics
 * @access  Public
 */
router.get('/summary', async (req, res) => {
  try {
    console.log('📊 Fetching export summary...');

    const exportsData = loadJsonData('exports_data.json');

    // Calculate summary statistics
    const totalValue = exportsData.reduce((sum, item) => sum + (parseFloat(item.export_value) || 0), 0);
    const countries = [...new Set(exportsData.map(item => item.destination_country).filter(Boolean))];
    const quarters = [...new Set(exportsData.map(item => item.quarter).filter(Boolean))];

    // Get top destination
    const destinationTotals = exportsData.reduce((acc, item) => {
      const country = item.destination_country || 'Unknown';
      acc[country] = (acc[country] || 0) + (parseFloat(item.export_value) || 0);
      return acc;
    }, {});

    const topDestination = Object.entries(destinationTotals)
      .sort((a, b) => b[1] - a[1])
      .map(([country]) => country)[0] || 'Unknown';

    const summary = {
      total_export_value: totalValue,
      total_countries: countries.length,
      total_quarters: quarters.length,
      top_destination: topDestination,
      average_quarterly_value: quarters.length > 0 ? totalValue / quarters.length : 0,
      latest_quarter: quarters.sort().pop() || 'Unknown'
    };

    console.log('📊 Export summary calculated:', summary);
    res.json(summary);
  } catch (error) {
    console.error('Error fetching export summary:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/exports/trends
 * @desc    Get export trends analysis
 * @access  Public
 */
router.get('/trends', async (req, res) => {
  try {
    console.log('📈 Fetching export trends...');

    const exportsData = loadJsonData('exports_data.json');

    // Group by quarter and calculate trends
    const quarterlyData = exportsData.reduce((acc, item) => {
      const quarter = item.quarter;
      if (!acc[quarter]) {
        acc[quarter] = {
          quarter,
          total_value: 0,
          country_count: 0,
          avg_value_per_country: 0
        };
      }
      const value = parseFloat(item.export_value) || 0;
      acc[quarter].total_value += value;
      acc[quarter].country_count += 1;
      return acc;
    }, {});

    // Convert to array and sort
    const trends = Object.values(quarterlyData).sort((a, b) => {
      const [aYear, aQ] = a.quarter.split('Q');
      const [bYear, bQ] = b.quarter.split('Q');
      return aYear === bYear ? aQ - bQ : aYear - bYear;
    });

    // Calculate growth rates
    const result = trends.map((item, index) => {
      item.avg_value_per_country = item.country_count > 0 ? item.total_value / item.country_count : 0;

      if (index === 0) {
        item.growth_rate = 0;
        item.growth_amount = 0;
      } else {
        const prevValue = trends[index - 1].total_value;
        item.growth_amount = item.total_value - prevValue;
        item.growth_rate = prevValue === 0 ? 0 : (item.growth_amount / prevValue) * 100;
      }

      return item;
    });

    console.log('📈 Export trends calculated:', result.length, 'quarters');
    res.json(result);
  } catch (error) {
    console.error('Error fetching export trends:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/exports/ai-analysis
 * @desc    Get AI-powered export analysis
 * @access  Public
 */
router.get('/ai-analysis', async (req, res) => {
   try {
     console.log('🤖 Generating AI export analysis...');

     // Try MongoDB first for latest data
     try {
       const exportStats = await ExportData.aggregate([
         {
           $group: {
             _id: null,
             total_exports: { $sum: '$export_value' },
             total_destinations: { $addToSet: '$destination_country' },
             avg_export_value: { $avg: '$export_value' }
           }
         }
       ]);

       if (exportStats && exportStats.length > 0) {
         const stats = exportStats[0];
         const topDestinations = await ExportData.aggregate([
           {
             $group: {
               _id: '$destination_country',
               value: { $sum: '$export_value' }
             }
           },
           {
             $sort: { value: -1 }
           },
           {
             $limit: 5
           }
         ]);

         const analysisData = {
           total_exports: stats.total_exports,
           total_destinations: stats.total_destinations.length,
           avg_export_value: stats.avg_export_value,
           top_destinations: topDestinations.map(item => ({
             country: item._id,
             value: item.value
           }))
         };

         const result = await openaiService.generateAnalysisDescription(analysisData, 'exports');
         res.json(result);
         return;
       }
     } catch (mongoError) {
       console.warn('⚠️ MongoDB analysis query failed, falling back to JSON files:', mongoError.message);
     }

     // Fallback to JSON data
     const exportsData = loadJsonData('exports_data.json');

     // Prepare data for AI analysis
     const analysisData = {
       total_exports: exportsData.reduce((sum, item) => sum + (parseFloat(item.export_value) || 0), 0),
       total_destinations: [...new Set(exportsData.map(item => item.destination_country).filter(Boolean))].length,
       top_destinations: Object.entries(
         exportsData.reduce((acc, item) => {
           const country = item.destination_country || 'Unknown';
           acc[country] = (acc[country] || 0) + (parseFloat(item.export_value) || 0);
           return acc;
         }, {})
       ).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([country, value]) => ({ country, value }))
     };

     const result = await openaiService.generateAnalysisDescription(analysisData, 'exports');
     res.json(result);

   } catch (error) {
     console.error('Error generating AI export analysis:', error);
     res.status(500).json({
       success: false,
       error: error.message,
       fallback_analysis: 'Export analysis provides insights into Rwanda\'s international trade relationships and market opportunities.'
     });
   }
 });

/**
 * @route   GET /api/exports/models
 * @desc    Get ML model results and predictions for exports
 * @access  Public
 */
router.get('/models', async (req, res) => {
   try {
     console.log('🤖 Fetching ML model results for exports...');

     // Get latest statistical analysis
     const latestAnalysis = await StatisticalAnalysis.findOne({
       analysis_type: { $in: ['comprehensive', 'regression'] }
     }).sort({ created_at: -1 });

     // Get latest predictions
     const latestPredictions = await Predictions.find({
       prediction_type: 'export_forecast'
     }).sort({ created_at: -1 }).limit(1);

     // Get ML models for exports
     const exportModels = await MLModel.find({
       dataset: { $regex: 'export', $options: 'i' }
     }).sort({ created_at: -1 });

     const result = {
       statistical_analysis: latestAnalysis || null,
       predictions: latestPredictions || [],
       models: exportModels || [],
       last_updated: new Date().toISOString()
     };

     res.json(result);
   } catch (error) {
     console.error('Error fetching export models:', error);
     res.status(500).json({ error: error.message });
   }
 });

/**
 * @route   GET /api/exports/insights
 * @desc    Get advanced insights and recommendations for exports
 * @access  Public
 */
router.get('/insights', async (req, res) => {
   try {
     console.log('💡 Generating export insights...');

     // Get latest statistical analysis for insights
     const latestAnalysis = await StatisticalAnalysis.findOne({
       analysis_type: 'comprehensive'
     }).sort({ created_at: -1 });

     // Get outlier analysis
     const outlierAnalysis = await Outliers.findOne({
       dataset: { $regex: 'export', $options: 'i' }
     }).sort({ created_at: -1 });

     // Get correlation analysis
     const correlationAnalysis = await CorrelationAnalysis.findOne({
       dataset: { $regex: 'export', $options: 'i' }
     }).sort({ created_at: -1 });

     const insights = {
       statistical_insights: latestAnalysis ? {
         key_findings: latestAnalysis.insights || [],
         recommendations: latestAnalysis.recommendations || [],
         model_performance: latestAnalysis.metrics || {}
       } : null,
       outlier_analysis: outlierAnalysis || null,
       correlation_insights: correlationAnalysis ? {
         significant_correlations: correlationAnalysis.significant_correlations || [],
         correlation_matrix: correlationAnalysis.correlation_matrix || {}
       } : null,
       generated_at: new Date().toISOString()
     };

     res.json(insights);
   } catch (error) {
     console.error('Error generating export insights:', error);
     res.status(500).json({ error: error.message });
   }
 });

module.exports = router;