/**
 * Imports API Routes
 * Provides endpoints for accessing Rwanda's import data
 */

const express = require('express');
const router = express.Router();
const { loadJsonData, dataFileExists } = require('../utils/dataLoader');
const openaiService = require('../utils/openaiService');

/**
 * @route   GET /api/imports/quarterly
 * @desc    Get quarterly import data
 * @access  Public
 */
router.get('/quarterly', (req, res) => {
   try {
     // Try to load comprehensive analysis data first (Python-processed)
     if (dataFileExists('comprehensive_analysis.json')) {
       const comprehensiveData = loadJsonData('comprehensive_analysis.json');

       if (comprehensiveData.quarterly_aggregation && comprehensiveData.quarterly_aggregation.imports) {
         const result = comprehensiveData.quarterly_aggregation.imports.map(item => ({
           period: item.quarter,
           imports: item.import_value,
           count: 1 // We don't have count data in comprehensive analysis
         }));

         console.log('📊 Using comprehensive analysis data for quarterly imports');
         res.json(result);
         return;
       }
     }

     // Fallback to original imports data
     console.log('📊 Using original imports data for quarterly imports');
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

     // Try to load comprehensive analysis data first (Python-processed)
     if (dataFileExists('comprehensive_analysis.json')) {
       const comprehensiveData = loadJsonData('comprehensive_analysis.json');

       if (comprehensiveData.country_aggregation && comprehensiveData.country_aggregation.import_sources) {
         let sources = comprehensiveData.country_aggregation.import_sources;

         // Filter by year if specified
         if (year && year !== 'all') {
           // For comprehensive data, we don't have year filtering built-in
           // so we'll return all data for now
         }

         // Convert to expected format and limit results
         const result = sources.slice(0, parseInt(limit)).map(item => ({
           country: item.source_country,
           value: item.import_value,
           lat: getCountryCoordinates(item.source_country).lat,
           lng: getCountryCoordinates(item.source_country).lng
         }));

         console.log('🗺️ Using comprehensive analysis data for import sources');
         res.json(result);
         return;
       }
     }

     // Fallback to original imports data
     console.log('🗺️ Using original imports data for sources');
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
    console.log('📥 Fetching all imports data...');

    // Check if imports data exists
    if (dataFileExists('imports_data.json')) {
      const importsData = loadJsonData('imports_data.json');
      console.log('📥 Imports data loaded, processing...');

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

      console.log('📥 Imports data processed successfully:', result.length, 'quarters');
      res.json(result);
    } else {
      console.log('📥 No imports data file found');
      res.json([]);
    }
  } catch (error) {
    console.error('❌ Error fetching imports data:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/imports/summary
 * @desc    Get import summary statistics
 * @access  Public
 */
router.get('/summary', async (req, res) => {
  try {
    console.log('📊 Fetching import summary...');

    const importsData = loadJsonData('imports_data.json');

    // Calculate summary statistics
    const totalValue = importsData.reduce((sum, item) => sum + (parseFloat(item.import_value) || 0), 0);
    const countries = [...new Set(importsData.map(item => item.source_country).filter(Boolean))];
    const quarters = [...new Set(importsData.map(item => item.quarter).filter(Boolean))];

    // Get top source country
    const sourceTotals = importsData.reduce((acc, item) => {
      const country = item.source_country || 'Unknown';
      acc[country] = (acc[country] || 0) + (parseFloat(item.import_value) || 0);
      return acc;
    }, {});

    const topSource = Object.entries(sourceTotals)
      .sort((a, b) => b[1] - a[1])
      .map(([country]) => country)[0] || 'Unknown';

    const summary = {
      total_import_value: totalValue,
      total_countries: countries.length,
      total_quarters: quarters.length,
      top_source_country: topSource,
      average_quarterly_value: quarters.length > 0 ? totalValue / quarters.length : 0,
      latest_quarter: quarters.sort().pop() || 'Unknown'
    };

    console.log('📊 Import summary calculated:', summary);
    res.json(summary);
  } catch (error) {
    console.error('Error fetching import summary:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/imports/ai-analysis
 * @desc    Get AI-powered import analysis
 * @access  Public
 */
router.get('/ai-analysis', async (req, res) => {
  try {
    console.log('🤖 Generating AI import analysis...');

    const importsData = loadJsonData('imports_data.json');

    // Prepare data for AI analysis
    const analysisData = {
      total_imports: importsData.reduce((sum, item) => sum + (parseFloat(item.import_value) || 0), 0),
      total_sources: [...new Set(importsData.map(item => item.source_country).filter(Boolean))].length,
      top_sources: Object.entries(
        importsData.reduce((acc, item) => {
          const country = item.source_country || 'Unknown';
          acc[country] = (acc[country] || 0) + (parseFloat(item.import_value) || 0);
          return acc;
        }, {})
      ).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([country, value]) => ({ country, value }))
    };

    const result = await openaiService.generateAnalysisDescription(analysisData, 'imports');
    res.json(result);

  } catch (error) {
    console.error('Error generating AI import analysis:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      fallback_analysis: 'Import analysis provides insights into Rwanda\'s supply chain dependencies and opportunities for domestic production.'
    });
  }
});

/**
 * @route   GET /api/imports/dependency-analysis
 * @desc    Get import dependency analysis
 * @access  Public
 */
router.get('/dependency-analysis', (req, res) => {
  try {
    console.log('🔗 Analyzing import dependencies...');

    const importsData = loadJsonData('imports_data.json');
    const exportsData = loadJsonData('exports_data.json');

    // Calculate dependency ratios
    const totalImports = importsData.reduce((sum, item) => sum + (parseFloat(item.import_value) || 0), 0);
    const totalExports = exportsData.reduce((sum, item) => sum + (parseFloat(item.export_value) || 0), 0);
    const totalTrade = totalImports + totalExports;

    // Group imports by country
    const countryDependencies = importsData.reduce((acc, item) => {
      const country = item.source_country || 'Unknown';
      const value = parseFloat(item.import_value) || 0;

      if (!acc[country]) {
        acc[country] = {
          country,
          total_value: 0,
          percentage_of_imports: 0,
          percentage_of_total_trade: 0,
          dependency_level: 'Low'
        };
      }
      acc[country].total_value += value;
      return acc;
    }, {});

    // Calculate percentages and dependency levels
    Object.values(countryDependencies).forEach(country => {
      country.percentage_of_imports = totalImports > 0 ? (country.total_value / totalImports) * 100 : 0;
      country.percentage_of_total_trade = totalTrade > 0 ? (country.total_value / totalTrade) * 100 : 0;

      // Determine dependency level
      if (country.percentage_of_imports > 30) {
        country.dependency_level = 'Critical';
      } else if (country.percentage_of_imports > 15) {
        country.dependency_level = 'High';
      } else if (country.percentage_of_imports > 5) {
        country.dependency_level = 'Medium';
      }
    });

    const result = {
      overall_dependency: {
        total_imports: totalImports,
        total_exports: totalExports,
        total_trade: totalTrade,
        import_dependency_ratio: totalTrade > 0 ? (totalImports / totalTrade) * 100 : 0,
        export_dependency_ratio: totalTrade > 0 ? (totalExports / totalTrade) * 100 : 0
      },
      country_dependencies: Object.values(countryDependencies)
        .sort((a, b) => b.total_value - a.total_value),
      risk_assessment: {
        critical_dependencies: Object.values(countryDependencies).filter(c => c.dependency_level === 'Critical').length,
        high_dependencies: Object.values(countryDependencies).filter(c => c.dependency_level === 'High').length,
        diversification_needed: Object.values(countryDependencies).filter(c => c.percentage_of_imports > 10).length
      }
    };

    console.log('🔗 Import dependency analysis completed');
    res.json(result);
  } catch (error) {
    console.error('Error analyzing import dependencies:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/imports/sitc-analysis
 * @desc    Get Import Products by SITC Section analysis
 * @access  Public
 */
router.get('/sitc-analysis', async (req, res) => {
  try {
    console.log('📦 Fetching SITC section analysis for imports...');

    // Try to load from JSON file first
    if (dataFileExists('import_sitc_products.json')) {
      const sitcData = loadJsonData('import_sitc_products.json');
      console.log('📦 SITC analysis loaded from JSON file');
      res.json(sitcData);
    } else {
      // Generate SITC analysis from existing data
      const importsData = loadJsonData('imports_data.json');

      // Group by SITC section
      const sitcGroups = importsData.reduce((acc, item) => {
        const sitc = item.sitc_section || 'Unknown';
        if (!acc[sitc]) {
          acc[sitc] = {
            sitc_section: sitc,
            total_value: 0,
            commodities: new Set()
          };
        }
        acc[sitc].total_value += parseFloat(item.import_value) || 0;
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
 * @route   GET /api/imports/growth-analysis
 * @desc    Get Import Growth by Quarter analysis
 * @access  Public
 */
router.get('/growth-analysis', async (req, res) => {
  try {
    console.log('📈 Fetching import growth analysis...');

    // Try to load from JSON file first
    if (dataFileExists('import_growth_by_quarter.json')) {
      const growthData = loadJsonData('import_growth_by_quarter.json');
      console.log('📈 Growth analysis loaded from JSON file');
      res.json(growthData);
    } else {
      // Generate growth analysis from existing data
      const importsData = loadJsonData('imports_data.json');

      // Group by quarter
      const quarterlyTotals = importsData.reduce((acc, item) => {
        const quarter = item.quarter;
        if (!acc[quarter]) {
          acc[quarter] = 0;
        }
        acc[quarter] += parseFloat(item.import_value) || 0;
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
            import_value: Math.round(currentValue * 100) / 100,
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
            import_value: Math.round(currentValue * 100) / 100,
            growth_rate: Math.round(growthRate * 100) / 100,
            growth_amount: Math.round(growthAmount * 100) / 100,
            is_positive_growth: growthRate >= 0
          });
        }
      }

      const response = {
        generated_at: new Date().toISOString(),
        quarters_analyzed: growthData.length,
        total_import_value: Math.round(Object.values(quarterlyTotals).reduce((sum, val) => sum + val, 0) * 100) / 100,
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
 * @route   GET /api/imports/performance-analysis
 * @desc    Get Import Performance Over Time analysis
 * @access  Public
 */
router.get('/performance-analysis', async (req, res) => {
  try {
    console.log('📋 Fetching import performance analysis...');

    // Try to load from JSON file first
    if (dataFileExists('import_performance_over_time.json')) {
      const performanceData = loadJsonData('import_performance_over_time.json');
      console.log('📋 Performance analysis loaded from JSON file');
      res.json(performanceData);
    } else {
      // Generate performance analysis from existing data
      const importsData = loadJsonData('imports_data.json');

      // Group by quarter
      const quarterlyData = importsData.reduce((acc, item) => {
        const quarter = item.quarter;
        const value = parseFloat(item.import_value) || 0;
        const country = item.source_country || 'Unknown';
        const sitc = item.sitc_section || 'Unknown';

        if (!acc[quarter]) {
          acc[quarter] = {
            total_value: 0,
            countries: new Set(),
            sitc_sections: new Set(),
            top_sources: {},
            sitc_breakdown: {}
          };
        }

        acc[quarter].total_value += value;
        acc[quarter].countries.add(country);
        acc[quarter].sitc_sections.add(sitc);

        // Track top sources
        if (!acc[quarter].top_sources[country]) {
          acc[quarter].top_sources[country] = 0;
        }
        acc[quarter].top_sources[country] += value;

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
          const topSources = Object.entries(data.top_sources)
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
            top_sources: topSources,
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
 * @route   GET /api/imports/country-analysis
 * @desc    Get Detailed Import Analysis by Country
 * @access  Public
 */
router.get('/country-analysis', async (req, res) => {
  try {
    console.log('🌍 Fetching detailed country analysis for imports...');

    // Try to load from JSON file first
    if (dataFileExists('import_detailed_country_analysis.json')) {
      const countryData = loadJsonData('import_detailed_country_analysis.json');
      console.log('🌍 Country analysis loaded from JSON file');
      res.json(countryData);
    } else {
      // Generate country analysis from existing data
      const importsData = loadJsonData('imports_data.json');

      // Group by country
      const countryGroups = importsData.reduce((acc, item) => {
        const country = item.source_country || 'Unknown';
        const value = parseFloat(item.import_value) || 0;
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
      const totalAllImports = Object.values(countryGroups).reduce((sum, country) => sum + country.total_value_2022_2025, 0);

      const detailedAnalysis = Object.values(countryGroups)
        .map((countryData, index) => {
          const country = countryData.country;
          const q4_2024_value = countryData.quarterly_values['2024Q4'] || 0;
          const share_percentage = totalAllImports > 0 ? (countryData.total_value_2022_2025 / totalAllImports) * 100 : 0;

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
        total_import_value: Math.round(totalAllImports * 100) / 100,
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