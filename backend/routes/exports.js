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
             count: '$count'
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

/**
 * @route   GET /api/exports/sitc-analysis
 * @desc    Get Export Products by SITC Section analysis
 * @access  Public
 */
router.get('/sitc-analysis', async (req, res) => {
  try {
    console.log('📊 Fetching SITC section analysis from MongoDB...');

    // Try MongoDB first (primary data source)
    try {
      const sitcDoc = await ExportData.aggregate([
        {
          $group: {
            _id: '$sitc_section',
            sitc_section: { $first: '$sitc_section' },
            total_value: { $sum: '$export_value' },
            commodities: { $addToSet: '$commodity_name' }
          }
        },
        {
          $project: {
            sitc_section: '$sitc_section',
            total_value: { $round: ['$total_value', 2] },
            commodity_count: { $size: '$commodities' }
          }
        },
        {
          $sort: { total_value: -1 }
        }
      ]);

      if (sitcDoc && sitcDoc.length > 0) {
        const sitcNames = {
          '0': 'Food and live animals',
          '1': 'Beverages and tobacco',
          '2': 'Crude materials, inedible, except fuels',
          '3': 'Mineral fuels, lubricants and related materials',
          '4': 'Animals and vegetable oils, fats & waxes',
          '5': 'Chemicals & related products',
          '6': 'Manufactured goods classified chiefly by material',
          '7': 'Machinery and transport equipment',
          '8': 'Miscellaneous manufactured articles',
          '9': 'Other commodities & transactions'
        };

        const result = sitcDoc.map(item => ({
          sitc_section: item.sitc_section || 'Unknown',
          section_name: sitcNames[item.sitc_section] || `SITC Section ${item.sitc_section || 'Unknown'}`,
          total_value: item.total_value,
          commodity_count: item.commodity_count
        }));

        console.log(`✅ Retrieved ${result.length} SITC sections from MongoDB`);
        res.json({
          generated_at: new Date().toISOString(),
          total_sections: result.length,
          sitc_sections: result
        });
        return;
      }
    } catch (mongoError) {
      console.warn('⚠️ MongoDB SITC query failed, falling back to JSON files:', mongoError.message);
    }

    // Fallback to JSON file
    if (dataFileExists('export_sitc_products.json')) {
      const sitcData = loadJsonData('export_sitc_products.json');
      console.log('📊 SITC analysis loaded from JSON file');
      res.json(sitcData);
    } else {
      // Generate SITC analysis from existing data
      const exportsData = loadJsonData('exports_data.json');

      // Group by SITC section
      const sitcGroups = exportsData.reduce((acc, item) => {
        const sitc = item.sitc_section || 'Unknown';
        if (!acc[sitc]) {
          acc[sitc] = {
            sitc_section: sitc,
            total_value: 0,
            commodities: new Set()
          };
        }
        acc[sitc].total_value += parseFloat(item.export_value) || 0;
        acc[sitc].commodities.add(item.commodity_name || 'Unknown');
        return acc;
      }, {});

      const sitcNames = {
        '0': 'Food and live animals',
        '1': 'Beverages and tobacco',
        '2': 'Crude materials, inedible, except fuels',
        '3': 'Mineral fuels, lubricants and related materials',
        '4': 'Animals and vegetable oils, fats & waxes',
        '5': 'Chemicals & related products',
        '6': 'Manufactured goods classified chiefly by material',
        '7': 'Machinery and transport equipment',
        '8': 'Miscellaneous manufactured articles',
        '9': 'Other commodities & transactions'
      };

      const result = Object.values(sitcGroups).map(item => ({
        sitc_section: item.sitc_section,
        section_name: sitcNames[item.sitc_section] || `SITC Section ${item.sitc_section}`,
        total_value: Math.round(item.total_value * 100) / 100,
        commodity_count: item.commodities.size
      })).sort((a, b) => b.total_value - a.total_value);

      res.json({
        generated_at: new Date().toISOString(),
        total_sections: result.length,
        sitc_sections: result
      });
    }
  } catch (error) {
    console.error('Error fetching SITC analysis:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/exports/period-analysis/:period
 * @desc    Get Export Products analysis for a specific period
 * @access  Public
 * @param   {string} period - Period in format like "2024Q4"
 */
router.get('/period-analysis/:period', async (req, res) => {
  try {
    const { period } = req.params;
    console.log(`📊 Fetching period analysis for: ${period} from MongoDB...`);

    // Try MongoDB first (primary data source)
    try {
      const periodDocs = await ExportData.aggregate([
        {
          $match: { quarter: period }
        },
        {
          $group: {
            _id: '$sitc_section',
            sitc_section: { $first: '$sitc_section' },
            total_value: { $sum: '$export_value' },
            commodities: { $addToSet: '$commodity_name' }
          }
        },
        {
          $project: {
            sitc_section: '$sitc_section',
            total_value: { $round: ['$total_value', 2] },
            commodity_count: { $size: '$commodities' }
          }
        },
        {
          $sort: { total_value: -1 }
        }
      ]);

      if (periodDocs && periodDocs.length > 0) {
        const sitcNames = {
          '0': 'Food and live animals',
          '1': 'Beverages and tobacco',
          '2': 'Crude materials, inedible, except fuels',
          '3': 'Mineral fuels, lubricants and related materials',
          '4': 'Animals and vegetable oils, fats & waxes',
          '5': 'Chemicals & related products',
          '6': 'Manufactured goods classified chiefly by material',
          '7': 'Machinery and transport equipment',
          '8': 'Miscellaneous manufactured articles',
          '9': 'Other commodities & transactions'
        };

        const result = periodDocs.map(item => ({
          sitc_section: item.sitc_section || 'Unknown',
          section_name: sitcNames[item.sitc_section] || `SITC Section ${item.sitc_section || 'Unknown'}`,
          total_value: item.total_value,
          commodity_count: item.commodity_count,
          top_commodities: [] // Would need additional aggregation for top commodities
        }));

        // Get total export value for the period
        const totalValue = await ExportData.aggregate([
          { $match: { quarter: period } },
          { $group: { _id: null, total: { $sum: '$export_value' } } }
        ]);

        const response = {
          generated_at: new Date().toISOString(),
          target_period: period,
          total_export_value: totalValue[0] ? Math.round(totalValue[0].total * 100) / 100 : 0,
          sitc_sections: result
        };

        console.log(`✅ Retrieved ${result.length} SITC sections for ${period} from MongoDB`);
        res.json(response);
        return;
      }
    } catch (mongoError) {
      console.warn(`⚠️ MongoDB period analysis query failed for ${period}, falling back to JSON files:`, mongoError.message);
    }

    // Fallback to JSON file
    if (dataFileExists(`export_period_products_${period}.json`)) {
      const periodData = loadJsonData(`export_period_products_${period}.json`);
      console.log(`📊 Period analysis for ${period} loaded from JSON file`);
      res.json(periodData);
    } else {
      // Generate period analysis from existing data
      const exportsData = loadJsonData('exports_data.json');

      // Filter data for the specific period
      const periodData = exportsData.filter(item => item.quarter === period);

      if (periodData.length === 0) {
        return res.status(404).json({ error: `No data found for period: ${period}` });
      }

      // Group by SITC section for the period
      const sitcGroups = periodData.reduce((acc, item) => {
        const sitc = item.sitc_section || 'Unknown';
        if (!acc[sitc]) {
          acc[sitc] = {
            sitc_section: sitc,
            total_value: 0,
            commodities: {}
          };
        }
        acc[sitc].total_value += parseFloat(item.export_value) || 0;

        const commodity = item.commodity_name || 'Unknown';
        if (!acc[sitc].commodities[commodity]) {
          acc[sitc].commodities[commodity] = 0;
        }
        acc[sitc].commodities[commodity] += parseFloat(item.export_value) || 0;

        return acc;
      }, {});

      const sitcNames = {
        '0': 'Food and live animals',
        '1': 'Beverages and tobacco',
        '2': 'Crude materials, inedible, except fuels',
        '3': 'Mineral fuels, lubricants and related materials',
        '4': 'Animals and vegetable oils, fats & waxes',
        '5': 'Chemicals & related products',
        '6': 'Manufactured goods classified chiefly by material',
        '7': 'Machinery and transport equipment',
        '8': 'Miscellaneous manufactured articles',
        '9': 'Other commodities & transactions'
      };

      const result = Object.values(sitcGroups).map(item => {
        const topCommodities = Object.entries(item.commodities)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }));

        return {
          sitc_section: item.sitc_section,
          section_name: sitcNames[item.sitc_section] || `SITC Section ${item.sitc_section}`,
          total_value: Math.round(item.total_value * 100) / 100,
          commodity_count: Object.keys(item.commodities).length,
          top_commodities: topCommodities
        };
      }).sort((a, b) => b.total_value - a.total_value);

      const response = {
        generated_at: new Date().toISOString(),
        target_period: period,
        total_export_value: Math.round(periodData.reduce((sum, item) => sum + (parseFloat(item.export_value) || 0), 0) * 100) / 100,
        sitc_sections: result
      };

      res.json(response);
    }
  } catch (error) {
    console.error('Error fetching period analysis:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/exports/growth-analysis
 * @desc    Get Export Growth by Quarter analysis
 * @access  Public
 */
router.get('/growth-analysis', async (req, res) => {
  try {
    console.log('📈 Fetching export growth analysis from MongoDB...');

    // Try MongoDB first (primary data source)
    try {
      const growthDocs = await ExportData.aggregate([
        {
          $group: {
            _id: '$quarter',
            quarter: { $first: '$quarter' },
            total_value: { $sum: '$export_value' }
          }
        },
        {
          $project: {
            quarter: '$quarter',
            export_value: { $round: ['$total_value', 2] }
          }
        },
        {
          $sort: { quarter: 1 }
        }
      ]);

      if (growthDocs && growthDocs.length > 0) {
        // Calculate growth rates
        const growthData = [];
        for (let i = 0; i < growthDocs.length; i++) {
          const current = growthDocs[i];

          if (i === 0) {
            growthData.push({
              quarter: current.quarter,
              export_value: current.export_value,
              growth_rate: 0,
              growth_amount: 0,
              is_positive_growth: true
            });
          } else {
            const previous = growthDocs[i - 1];
            const growthAmount = current.export_value - previous.export_value;
            const growthRate = previous.export_value === 0 ? 0 : (growthAmount / previous.export_value) * 100;

            growthData.push({
              quarter: current.quarter,
              export_value: current.export_value,
              growth_rate: Math.round(growthRate * 100) / 100,
              growth_amount: Math.round(growthAmount * 100) / 100,
              is_positive_growth: growthRate >= 0
            });
          }
        }

        const response = {
          generated_at: new Date().toISOString(),
          quarters_analyzed: growthData.length,
          total_export_value: Math.round(growthDocs.reduce((sum, doc) => sum + doc.export_value, 0) * 100) / 100,
          growth_data: growthData
        };

        console.log(`✅ Retrieved ${growthData.length} quarters from MongoDB`);
        res.json(response);
        return;
      }
    } catch (mongoError) {
      console.warn('⚠️ MongoDB growth query failed, falling back to JSON files:', mongoError.message);
    }

    // Fallback to JSON file
    if (dataFileExists('export_growth_by_quarter.json')) {
      const growthData = loadJsonData('export_growth_by_quarter.json');
      console.log('📈 Growth analysis loaded from JSON file');
      res.json(growthData);
    } else {
      // Generate growth analysis from existing data
      const exportsData = loadJsonData('exports_data.json');

      // Group by quarter
      const quarterlyTotals = exportsData.reduce((acc, item) => {
        const quarter = item.quarter;
        if (!acc[quarter]) {
          acc[quarter] = 0;
        }
        acc[quarter] += parseFloat(item.export_value) || 0;
        return acc;
      }, {});

      // Sort quarters and calculate growth
      const sortedQuarters = Object.keys(quarterlyTotals).sort();
      const growthData = [];

      for (let i = 0; i < sortedQuarters.length; i++) {
        const quarter = sortedQuarters[i];
        const currentValue = quarterlyTotals[quarter];

        if (i === 0) {
          growthData.push({
            quarter,
            export_value: Math.round(currentValue * 100) / 100,
            growth_rate: 0,
            growth_amount: 0,
            is_positive_growth: true
          });
        } else {
          const previousValue = quarterlyTotals[sortedQuarters[i - 1]];
          const growthAmount = currentValue - previousValue;
          const growthRate = previousValue === 0 ? 0 : (growthAmount / previousValue) * 100;

          growthData.push({
            quarter,
            export_value: Math.round(currentValue * 100) / 100,
            growth_rate: Math.round(growthRate * 100) / 100,
            growth_amount: Math.round(growthAmount * 100) / 100,
            is_positive_growth: growthRate >= 0
          });
        }
      }

      const response = {
        generated_at: new Date().toISOString(),
        quarters_analyzed: growthData.length,
        total_export_value: Math.round(Object.values(quarterlyTotals).reduce((sum, val) => sum + val, 0) * 100) / 100,
        growth_data: growthData
      };

      res.json(response);
    }
  } catch (error) {
    console.error('Error fetching growth analysis:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/exports/performance-analysis
 * @desc    Get Export Performance Over Time analysis
 * @access  Public
 */
router.get('/performance-analysis', async (req, res) => {
  try {
    console.log('📊 Fetching export performance analysis from MongoDB...');

    // Try MongoDB first (primary data source)
    try {
      const performanceDocs = await ExportData.aggregate([
        {
          $group: {
            _id: '$quarter',
            quarter: { $first: '$quarter' },
            total_value: { $sum: '$export_value' },
            countries: { $addToSet: '$destination_country' },
            sitc_sections: { $addToSet: '$sitc_section' },
            destinations: {
              $push: {
                country: '$destination_country',
                value: '$export_value'
              }
            }
          }
        },
        {
          $project: {
            quarter: '$quarter',
            total_value: { $round: ['$total_value', 2] },
            unique_countries: { $size: '$countries' },
            unique_sitc_sections: { $size: '$sitc_sections' },
            destinations: '$destinations'
          }
        },
        {
          $sort: { quarter: 1 }
        }
      ]);

      if (performanceDocs && performanceDocs.length > 0) {
        // Process destinations and calculate additional metrics
        const performanceData = performanceDocs.map(doc => {
          // Calculate top destinations
          const destinationGroups = {};
          doc.destinations.forEach(dest => {
            if (!destinationGroups[dest.country]) {
              destinationGroups[dest.country] = 0;
            }
            destinationGroups[dest.country] += dest.value;
          });

          const topDestinations = Object.entries(destinationGroups)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([country, value]) => ({
              country,
              value: Math.round(value * 100) / 100
            }));

          return {
            quarter: doc.quarter,
            total_value: doc.total_value,
            unique_countries: doc.unique_countries,
            unique_sitc_sections: doc.unique_sitc_sections,
            top_destinations: topDestinations,
            sitc_breakdown: [], // Would need additional aggregation for SITC breakdown
            avg_value_per_country: doc.unique_countries > 0 ?
              Math.round((doc.total_value / doc.unique_countries) * 100) / 100 : 0
          };
        });

        const totalPeriodValue = performanceDocs.reduce((sum, doc) => sum + doc.total_value, 0);

        const response = {
          generated_at: new Date().toISOString(),
          quarters_analyzed: performanceData.length,
          total_period_value: Math.round(totalPeriodValue * 100) / 100,
          performance_data: performanceData
        };

        console.log(`✅ Retrieved ${performanceData.length} quarters from MongoDB`);
        res.json(response);
        return;
      }
    } catch (mongoError) {
      console.warn('⚠️ MongoDB performance analysis query failed, falling back to JSON files:', mongoError.message);
    }

    // Fallback to JSON file
    if (dataFileExists('export_performance_over_time.json')) {
      const performanceData = loadJsonData('export_performance_over_time.json');
      console.log('📊 Performance analysis loaded from JSON file');
      res.json(performanceData);
    } else {
      // Generate performance analysis from existing data
      const exportsData = loadJsonData('exports_data.json');

      // Group by quarter
      const quarterlyData = exportsData.reduce((acc, item) => {
        const quarter = item.quarter;
        const value = parseFloat(item.export_value) || 0;
        const country = item.destination_country || 'Unknown';
        const sitc = item.sitc_section || 'Unknown';

        if (!acc[quarter]) {
          acc[quarter] = {
            total_value: 0,
            countries: new Set(),
            sitc_sections: new Set(),
            top_destinations: {},
            sitc_breakdown: {}
          };
        }

        acc[quarter].total_value += value;
        acc[quarter].countries.add(country);
        acc[quarter].sitc_sections.add(sitc);

        // Track top destinations
        if (!acc[quarter].top_destinations[country]) {
          acc[quarter].top_destinations[country] = 0;
        }
        acc[quarter].top_destinations[country] += value;

        // Track SITC breakdown
        if (!acc[quarter].sitc_breakdown[sitc]) {
          acc[quarter].sitc_breakdown[sitc] = 0;
        }
        acc[quarter].sitc_breakdown[sitc] += value;

        return acc;
      }, {});

      // Convert to response format
      const performanceData = Object.entries(quarterlyData)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([quarter, data]) => {
          const topDestinations = Object.entries(data.top_destinations)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([country, value]) => ({
              country,
              value: Math.round(value * 100) / 100
            }));

          const sitcBreakdown = Object.entries(data.sitc_breakdown)
            .sort((a, b) => b[1] - a[1])
            .map(([section, value]) => ({
              section,
              value: Math.round(value * 100) / 100
            }));

          return {
            quarter,
            total_value: Math.round(data.total_value * 100) / 100,
            unique_countries: data.countries.size,
            unique_sitc_sections: data.sitc_sections.size,
            top_destinations: topDestinations,
            sitc_breakdown: sitcBreakdown,
            avg_value_per_country: data.countries.size > 0 ?
              Math.round((data.total_value / data.countries.size) * 100) / 100 : 0
          };
        });

      const response = {
        generated_at: new Date().toISOString(),
        quarters_analyzed: performanceData.length,
        total_period_value: Math.round(performanceData.reduce((sum, item) => sum + item.total_value, 0) * 100) / 100,
        performance_data: performanceData
      };

      res.json(response);
    }
  } catch (error) {
    console.error('Error fetching performance analysis:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/exports/country-analysis
 * @desc    Get Detailed Export Analysis by Country
 * @access  Public
 */
router.get('/country-analysis', async (req, res) => {
  try {
    console.log('🌍 Fetching detailed country analysis from MongoDB...');

    // Try MongoDB first (primary data source)
    try {
      const countryDocs = await ExportData.aggregate([
        {
          $group: {
            _id: '$destination_country',
            country: { $first: '$destination_country' },
            total_value_2022_2025: { $sum: '$export_value' },
            quarters: { $addToSet: '$quarter' },
            quarterly_data: {
              $push: {
                quarter: '$quarter',
                value: '$export_value'
              }
            }
          }
        },
        {
          $project: {
            country: '$country',
            total_value_2022_2025: { $round: ['$total_value_2022_2025', 2] },
            quarters_count: { $size: '$quarters' },
            quarterly_data: '$quarterly_data'
          }
        },
        {
          $sort: { total_value_2022_2025: -1 }
        }
      ]);

      if (countryDocs && countryDocs.length > 0) {
        // Calculate additional metrics
        const totalAllExports = countryDocs.reduce((sum, country) => sum + country.total_value_2022_2025, 0);

        const detailedAnalysis = countryDocs.map((countryData, index) => {
          // Convert quarterly data array to object for easier processing
          const quarterlyObj = {};
          countryData.quarterly_data.forEach(qv => {
            if (!quarterlyObj[qv.quarter]) {
              quarterlyObj[qv.quarter] = 0;
            }
            quarterlyObj[qv.quarter] += qv.value;
          });

          // Get Q4 2024 value specifically
          const q4_2024_value = quarterlyObj['2024Q4'] || 0;
          const share_percentage = totalAllExports > 0 ? (countryData.total_value_2022_2025 / totalAllExports) * 100 : 0;

          // Calculate growth rate (comparing Q4 2024 to Q3 2024 for now)
          let growth_rate = 0;
          const q3_2024_value = quarterlyObj['2024Q3'] || 0;

          if (q3_2024_value > 0) {
            growth_rate = ((q4_2024_value - q3_2024_value) / q3_2024_value) * 100;
          }

          // Determine trend
          let trend = "Stable";
          let trend_class = "warning";

          if (growth_rate > 5) {
            trend = "Strong Growth";
            trend_class = "success";
          } else if (growth_rate > 0) {
            trend = "Moderate Growth";
            trend_class = "info";
          } else if (growth_rate < -5) {
            trend = "Declining";
            trend_class = "danger";
          }

          return {
            rank: index + 1,
            country: countryData.country,
            total_value_2022_2025: countryData.total_value_2022_2025,
            q4_2024_value: Math.round(q4_2024_value * 100) / 100,
            share_percentage: Math.round(share_percentage * 100) / 100,
            growth_rate: Math.round(growth_rate * 100) / 100,
            trend,
            trend_class,
            quarters_count: countryData.quarters_count,
            quarterly_breakdown: quarterlyObj
          };
        });

        const response = {
          generated_at: new Date().toISOString(),
          total_countries: detailedAnalysis.length,
          total_export_value: Math.round(totalAllExports * 100) / 100,
          countries: detailedAnalysis
        };

        console.log(`✅ Retrieved ${detailedAnalysis.length} countries from MongoDB`);
        res.json(response);
        return;
      }
    } catch (mongoError) {
      console.warn('⚠️ MongoDB country analysis query failed, falling back to JSON files:', mongoError.message);
    }

    // Fallback to JSON file
    if (dataFileExists('export_detailed_country_analysis.json')) {
      const countryData = loadJsonData('export_detailed_country_analysis.json');
      console.log('🌍 Country analysis loaded from JSON file');
      res.json(countryData);
    } else {
      // Generate country analysis from existing data
      const exportsData = loadJsonData('exports_data.json');

      // Group by country
      const countryGroups = exportsData.reduce((acc, item) => {
        const country = item.destination_country || 'Unknown';
        const value = parseFloat(item.export_value) || 0;
        const quarter = item.quarter;

        if (!acc[country]) {
          acc[country] = {
            country,
            total_value_2022_2025: 0,
            quarterly_values: {},
            quarters_present: new Set()
          };
        }

        acc[country].total_value_2022_2025 += value;
        acc[country].quarters_present.add(quarter);

        if (!acc[country].quarterly_values[quarter]) {
          acc[country].quarterly_values[quarter] = 0;
        }
        acc[country].quarterly_values[quarter] += value;

        return acc;
      }, {});

      // Calculate metrics for each country
      const totalAllExports = Object.values(countryGroups).reduce((sum, country) => sum + country.total_value_2022_2025, 0);

      const detailedAnalysis = Object.values(countryGroups)
        .map((countryData, index) => {
          const country = countryData.country;
          const q4_2024_value = countryData.quarterly_values['2024Q4'] || 0;
          const share_percentage = totalAllExports > 0 ? (countryData.total_value_2022_2025 / totalAllExports) * 100 : 0;

          // Calculate growth rate
          const sortedQuarters = Array.from(countryData.quarters_present).sort();
          let growth_rate = 0;

          if (sortedQuarters.length >= 2) {
            const latest_quarter = sortedQuarters[sortedQuarters.length - 1];
            const previous_quarter = sortedQuarters[sortedQuarters.length - 2];
            const latest_value = countryData.quarterly_values[latest_quarter];
            const previous_value = countryData.quarterly_values[previous_quarter];

            if (previous_value > 0) {
              growth_rate = ((latest_value - previous_value) / previous_value) * 100;
            }
          }

          // Determine trend
          let trend = "Stable";
          let trend_class = "warning";

          if (growth_rate > 5) {
            trend = "Strong Growth";
            trend_class = "success";
          } else if (growth_rate > 0) {
            trend = "Moderate Growth";
            trend_class = "info";
          } else if (growth_rate < -5) {
            trend = "Declining";
            trend_class = "danger";
          }

          return {
            rank: index + 1,
            country,
            total_value_2022_2025: Math.round(countryData.total_value_2022_2025 * 100) / 100,
            q4_2024_value: Math.round(q4_2024_value * 100) / 100,
            share_percentage: Math.round(share_percentage * 100) / 100,
            growth_rate: Math.round(growth_rate * 100) / 100,
            trend,
            trend_class,
            quarters_count: countryData.quarters_present.size,
            quarterly_breakdown: countryData.quarterly_values
          };
        })
        .sort((a, b) => b.total_value_2022_2025 - a.total_value_2022_2025);

      // Update ranks after sorting
      detailedAnalysis.forEach((country, index) => {
        country.rank = index + 1;
      });

      const response = {
        generated_at: new Date().toISOString(),
        total_countries: detailedAnalysis.length,
        total_export_value: Math.round(totalAllExports * 100) / 100,
        countries: detailedAnalysis
      };

      res.json(response);
    }
  } catch (error) {
    console.error('Error fetching country analysis:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;