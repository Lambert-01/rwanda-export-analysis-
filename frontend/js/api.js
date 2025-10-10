/* =====================================================================
  Rwanda trade analysis system - API.JS
   Pro-level API abstraction and data integration for dashboard
   ===================================================================== */

/************************************
  * 1. API CONFIGURATION             *
  ************************************/
// Browser-compatible environment variable access
const API_BASE = (typeof process !== 'undefined' && process.env && process.env.API_BASE_URL)
    ? process.env.API_BASE_URL.replace(/\/$/, '') + '/api'
    : 'http://localhost:3000/api'; // Direct backend API URL for browser

// Also try to get from window if available (for frontend config)
const FRONTEND_API_BASE = (typeof window !== 'undefined' && window.APP_CONFIG && window.APP_CONFIG.API_BASE)
    ? window.APP_CONFIG.API_BASE
    : API_BASE;
const API_TIMEOUT = (typeof process !== 'undefined' && process.env && process.env.API_TIMEOUT)
    ? parseInt(process.env.API_TIMEOUT)
    : 12000; // ms
const API_CACHE = {};

/************************************
   * 2. GENERIC API FETCH WRAPPER     *
   ************************************/
async function apiFetch(endpoint, options = {}) {
    // Use direct backend URL to bypass proxy issues
    const baseUrl = FRONTEND_API_BASE.startsWith('http') ? FRONTEND_API_BASE : `http://localhost:3000/api`;
    const url = baseUrl + endpoint;
    const cacheKey = url + JSON.stringify(options);

    // Show loading indicator for the target element if provided
    const targetId = options.targetId;
    if (targetId) {
        showApiLoading(targetId);
    }

    // Return cached data if available
    if (API_CACHE[cacheKey] && !options.noCache) {
        if (targetId) {
            hideApiLoading(targetId);
        }
        return API_CACHE[cacheKey];
    }

    // Set up request timeout
    let controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), API_TIMEOUT);

    try {
        const fetchOptions = {
            ...options,
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json',
                ...(options.headers || {})
            }
        };

        // Don't set Content-Type for FormData (let browser set it)
        if (options.body instanceof FormData) {
            delete fetchOptions.headers['Content-Type'];
        }

        const res = await fetch(url, fetchOptions);

        clearTimeout(timeout);

        // Handle HTTP errors
        if (!res.ok) {
            const errorText = await res.text().catch(() => 'Unknown error');
            throw new Error(`API error (${res.status}): ${errorText}`);
        }

        // Parse JSON response
        const data = await res.json().catch(err => {
            throw new Error(`Invalid JSON response: ${err.message}`);
        });

        // Cache the response
        if (!options.noCache) {
            API_CACHE[cacheKey] = data;
        }

        // Hide loading indicator
        if (targetId) {
            hideApiLoading(targetId);
        }

        return data;
    } catch (err) {
        clearTimeout(timeout);

        // Hide loading indicator
        if (targetId) {
            hideApiLoading(targetId);
        }

        // Handle different types of errors
        handleApiError(err, url, endpoint);

        // For demo purposes, return mock data if available
        if (options.fallbackData) {
            console.warn(`Using fallback data for ${endpoint}`);
            return options.fallbackData;
        }

        throw err;
    }
}

function handleApiError(err, url, endpoint) {
    console.error('API Error:', err, url);
    
    let errorMessage = 'An error occurred while fetching data';
    let errorType = 'danger';
    
    // Customize error message based on error type
    if (err.name === 'AbortError') {
        errorMessage = 'Request timed out. Please try again.';
    } else if (err.message.includes('API error')) {
        errorMessage = err.message;
    } else if (err.message.includes('Invalid JSON')) {
        errorMessage = 'Server returned invalid data format';
    } else if (!navigator.onLine) {
        errorMessage = 'You are offline. Please check your internet connection.';
        errorType = 'warning';
    }
    
    // Show error toast
    showToast(errorMessage, errorType, 4000);
    
    // Add fallback UI for specific endpoints
    if (endpoint && endpoint.includes('/exports')) {
        const exportResults = document.getElementById('export-results');
        if (exportResults) {
            exportResults.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Failed to load export data. ${errorMessage}
                    <button class="btn btn-sm btn-outline-danger ms-3" onclick="retryFetch('${endpoint}')">
                        <i class="fas fa-sync-alt me-1"></i> Retry
                    </button>
                </div>
            `;
        }
    }
}

// Helper function to retry a failed fetch
window.retryFetch = function(endpoint) {
    showToast('Retrying...', 'info', 1500);
    setTimeout(() => {
        apiFetch(endpoint, { noCache: true })
            .then(() => showToast('Data refreshed successfully!', 'success', 2000))
            .catch(() => {}); // Error already handled in apiFetch
    }, 500);
};

/************************************
  * 3. API ENDPOINTS (TRADE DATA)    *
  ************************************/
async function getQuarterlyExports() {
    const results = await getAnalysisResults();
    if (results.success && results.data) {
        // Extract quarterly data from Graph Overall
        const overview = results.data.trade_overview || {};
        return {
            periods: ['2022Q1', '2022Q2', '2022Q3', '2022Q4', '2023Q1', '2023Q2', '2023Q3', '2023Q4', '2024Q1', '2024Q2', '2024Q3', '2024Q4'],
            exports: [overview.q1_2022_exports || 0, overview.q2_2022_exports || 0, overview.q3_2022_exports || 0, overview.q4_2022_exports || 0,
                     overview.q1_2023_exports || 0, overview.q2_2023_exports || 0, overview.q3_2023_exports || 0, overview.q4_2023_exports || 0,
                     overview.q1_2024_exports || 0, overview.q2_2024_exports || 0, overview.q3_2024_exports || 0, overview.q4_2024_exports || 0],
            imports: [overview.q1_2022_imports || 0, overview.q2_2022_imports || 0, overview.q3_2022_imports || 0, overview.q4_2022_imports || 0,
                     overview.q1_2023_imports || 0, overview.q2_2023_imports || 0, overview.q3_2023_imports || 0, overview.q4_2023_imports || 0,
                     overview.q1_2024_imports || 0, overview.q2_2024_imports || 0, overview.q3_2024_imports || 0, overview.q4_2024_imports || 0]
        };
    }
    return { periods: [], exports: [], imports: [] };
}

async function getExportDestinations(year = '2024') {
    const results = await getAnalysisResults();
    if (results.success && results.data && results.data.top_countries) {
        return results.data.top_countries.top_export_countries || [];
    }
    return [];
}

async function getExportProducts() {
    const results = await getAnalysisResults();
    if (results.success && results.data && results.data.commodities) {
        return results.data.commodities.top_export_commodities || [];
    }
    return [];
}

/************************************
  * 4. API ENDPOINTS (IMPORTS)       *
  ************************************/
async function getImportSources(year = '2024') {
    const results = await getAnalysisResults();
    if (results.success && results.data && results.data.top_countries) {
        return results.data.top_countries.top_import_countries || [];
    }
    return [];
}

async function getImportCategories() {
    const results = await getAnalysisResults();
    if (results.success && results.data && results.data.commodities) {
        return results.data.commodities.top_import_commodities || [];
    }
    return [];
}

/************************************
  * 5. API ENDPOINTS (PREDICTIONS)   *
  ************************************/
async function getPredictions() {
    try {
        // Try to get live predictions from the new endpoint
        const livePredictions = await apiFetch('/predictions/live?method=ensemble&quarters=4');
        if (livePredictions && livePredictions.predictions) {
            return {
                success: true,
                data: livePredictions,
                method: 'live_ensemble'
            };
        }
    } catch (error) {
        console.warn('Live predictions failed, falling back to static predictions:', error);
    }

    // Fallback to static predictions
    try {
        const staticPredictions = await apiFetch('/predictions/next');
        return {
            success: true,
            data: staticPredictions,
            method: 'static'
        };
    } catch (error) {
        console.error('Error getting predictions:', error);
        return {
            success: false,
            data: {},
            error: error.message
        };
    }
}

/************************************
   * 6. API ENDPOINTS (ANALYTICS)     *
   ************************************/
async function getGrowthAnalytics() {
    const results = await getAnalysisResults();
    if (results.success && results.data) {
        return results.data.trade_overview || {};
    }
    return {};
}

async function searchProduct(product, category = '', time = '') {
    // For now, return filtered commodity data
    const commodities = await getCommodityAnalysis();
    if (commodities.success && commodities.data) {
        const filtered = commodities.data.top_export_commodities?.filter(item =>
            item.description?.toLowerCase().includes(product.toLowerCase()) ||
            item.sitc_section?.toLowerCase().includes(product.toLowerCase())
        ) || [];
        return { success: true, data: filtered };
    }
    return { success: false, data: [] };
}

/************************************
  * 7. EXCEL ANALYSIS ENDPOINTS      *
  ************************************/
async function analyzeExcelData() {
    return await apiFetch('/analyze-excel', {
        method: 'POST',
        targetId: 'excel-analysis-results'
    });
}

async function getAnalysisResults() {
    try {
        // Try to get comprehensive model dashboard data from MongoDB
        const modelDashboard = await apiFetch('/models/dashboard', {
            targetId: 'excel-analysis-results'
        });

        if (modelDashboard && modelDashboard.summary) {
            console.log('📊 Using MongoDB-backed model dashboard data');
            return {
                success: true,
                data: {
                    trade_overview: await getTradeOverviewData(),
                    top_countries: await getTopCountriesData(),
                    commodities: await getCommoditiesData(),
                    insights: await getInsightsData(),
                    model_dashboard: modelDashboard,
                    metadata: {
                        last_updated: new Date().toISOString(),
                        data_sources: ['MongoDB', 'exports_data.json', 'imports_data.json'],
                        database_connected: true
                    }
                }
            };
        }

        // Fallback to analytics summary
        const response = await apiFetch('/analytics/summary', {
            targetId: 'excel-analysis-results'
        });

        // If we get summary data, enhance it with other data sources
        if (response) {
            const enhancedData = {
                success: true,
                data: {
                    trade_overview: await getTradeOverviewData(),
                    top_countries: await getTopCountriesData(),
                    commodities: await getCommoditiesData(),
                    insights: await getInsightsData(),
                    metadata: {
                        last_updated: new Date().toISOString(),
                        data_sources: ['exports_data.json', 'imports_data.json', 'trade_balance.json'],
                        database_connected: false
                    }
                }
            };
            return enhancedData;
        }
    } catch (error) {
        console.error('Error getting analysis results:', error);
        // Return fallback data structure
        return {
            success: true,
            data: {
                trade_overview: {},
                top_countries: { top_export_countries: [], top_import_countries: [] },
                commodities: { top_export_commodities: [], top_import_commodities: [] },
                insights: [],
                model_dashboard: null,
                metadata: {
                    last_updated: new Date().toISOString(),
                    data_sources: ['fallback'],
                    database_connected: false
                }
            }
        };
    }
}

async function getTradeOverview() {
    return await apiFetch('/trade-overview', {
        targetId: 'trade-overview'
    });
}

async function getTopCountries() {
    return await apiFetch('/top-countries', {
        targetId: 'top-countries'
    });
}

async function getCommodityAnalysis() {
    return await apiFetch('/commodities', {
        targetId: 'commodity-analysis'
    });
}

async function getInsights() {
    return await apiFetch('/insights', {
        targetId: 'insights-list'
    });
}

// New MongoDB-backed API functions
async function getModelDashboard() {
    try {
        const dashboard = await apiFetch('/models/dashboard');
        return {
            success: true,
            data: dashboard,
            source: 'mongodb'
        };
    } catch (error) {
        console.error('Error getting model dashboard:', error);
        return {
            success: false,
            data: {},
            error: error.message,
            source: 'fallback'
        };
    }
}

async function getStatisticalAnalyses(type = null) {
    try {
        const endpoint = type ? `/models/statistical-analyses?type=${type}` : '/models/statistical-analyses';
        const analyses = await apiFetch(endpoint);
        return {
            success: true,
            data: analyses,
            source: 'mongodb'
        };
    } catch (error) {
        console.error('Error getting statistical analyses:', error);
        return {
            success: false,
            data: { count: 0, analyses: [] },
            error: error.message,
            source: 'fallback'
        };
    }
}

async function getMLModels(type = null, status = null) {
    try {
        let endpoint = '/models/ml-models';
        const params = new URLSearchParams();
        if (type) params.append('type', type);
        if (status) params.append('status', status);
        if (params.toString()) endpoint += '?' + params.toString();

        const models = await apiFetch(endpoint);
        return {
            success: true,
            data: models,
            source: 'mongodb'
        };
    } catch (error) {
        console.error('Error getting ML models:', error);
        return {
            success: false,
            data: { count: 0, models: [] },
            error: error.message,
            source: 'fallback'
        };
    }
}

async function getPredictions(type = null) {
    try {
        const endpoint = type ? `/models/predictions?type=${type}` : '/models/predictions';
        const predictions = await apiFetch(endpoint);
        return {
            success: true,
            data: predictions,
            source: 'mongodb'
        };
    } catch (error) {
        console.error('Error getting predictions:', error);
        return {
            success: false,
            data: { count: 0, predictions: [] },
            error: error.message,
            source: 'fallback'
        };
    }
}

async function getExportInsights() {
    try {
        const insights = await apiFetch('/exports/insights');
        return {
            success: true,
            data: insights,
            source: 'mongodb'
        };
    } catch (error) {
        console.error('Error getting export insights:', error);
        return {
            success: false,
            data: {},
            error: error.message,
            source: 'fallback'
        };
    }
}

async function getModelStatus() {
    try {
        const status = await apiFetch('/models/status');
        return {
            success: true,
            data: status,
            source: 'mongodb'
        };
    } catch (error) {
        console.error('Error getting model status:', error);
        return {
            success: false,
            data: {},
            error: error.message,
            source: 'fallback'
        };
    }
}

async function seedDatabase() {
    try {
        const result = await apiFetch('/models/seed-database', {
            method: 'POST'
        });
        return {
            success: true,
            data: result,
            source: 'mongodb'
        };
    } catch (error) {
        console.error('Error seeding database:', error);
        return {
            success: false,
            data: {},
            error: error.message,
            source: 'fallback'
        };
    }
}

// Helper functions to get data from correct backend endpoints
async function getTradeOverviewData() {
    try {
        const exportsData = await apiFetch('/exports/quarterly');
        const importsData = await apiFetch('/imports/quarterly');

        if (exportsData && importsData) {
            // Calculate totals for Q4 2024
            const q4Exports = exportsData.find(item => item.period === '2024Q4');
            const q4Imports = importsData.find(item => item.period === '2024Q4');

            return {
                total_exports_q4_2024: q4Exports ? q4Exports.exports : 0,
                total_imports_q4_2024: q4Imports ? q4Imports.imports : 0,
                trade_balance_q4_2024: (q4Exports ? q4Exports.exports : 0) - (q4Imports ? q4Imports.imports : 0),
                export_growth_qoq: 0, // Would need more data to calculate
                q1_2022_exports: 293.58,
                q2_2022_exports: 331.55,
                q3_2022_exports: 342.56,
                q4_2022_exports: 354.84,
                q1_2023_exports: 402.14,
                q2_2023_exports: 484.74,
                q3_2023_exports: 388.11,
                q4_2023_exports: 399.11,
                q1_2024_exports: 431.61,
                q2_2024_exports: 537.64,
                q3_2024_exports: 667.00,
                q4_2024_exports: 677.45,
                q1_2022_imports: 1034.54,
                q2_2022_imports: 1348.03,
                q3_2022_imports: 1481.22,
                q4_2022_imports: 1281.21,
                q1_2023_imports: 1476.51,
                q2_2023_imports: 1571.09,
                q3_2023_imports: 1581.81,
                q4_2023_imports: 1486.93,
                q1_2024_imports: 1410.52,
                q2_2024_imports: 1568.97,
                q3_2024_imports: 1751.57,
                q4_2024_imports: 1629.39
            };
        }
    } catch (error) {
        console.error('Error getting trade overview data:', error);
    }
    return {};
}

async function getTopCountriesData() {
    try {
        const exportDestinations = await apiFetch('/exports/destinations?limit=10');
        const importSources = await apiFetch('/imports/sources?limit=10');

        return {
            top_export_countries: exportDestinations || [],
            top_import_countries: importSources || []
        };
    } catch (error) {
        console.error('Error getting top countries data:', error);
    }
    return { top_export_countries: [], top_import_countries: [] };
}

async function getCommoditiesData() {
    try {
        const exportProducts = await apiFetch('/exports/products?limit=10');
        const importCategories = await apiFetch('/imports/categories?limit=10');

        return {
            top_export_commodities: exportProducts || [],
            top_import_commodities: importCategories || []
        };
    } catch (error) {
        console.error('Error getting commodities data:', error);
    }
    return { top_export_commodities: [], top_import_commodities: [] };
}

async function getInsightsData() {
    try {
        // Generate insights based on available data
        const exportsData = await apiFetch('/exports/summary');
        const importsData = await apiFetch('/imports/summary');

        const insights = [];

        if (exportsData && exportsData.total_export_value > 0) {
            insights.push({
                type: 'success',
                title: 'Leading Export Destination',
                message: `${exportsData.top_destination} is the top export destination with $${(exportsData.total_export_value/1000000).toFixed(2)}M in total exports`
            });
        }

        if (exportsData && exportsData.total_countries > 0) {
            insights.push({
                type: 'info',
                title: 'Market Diversification',
                message: `Rwanda exports to ${exportsData.total_countries} countries, showing good market diversification`
            });
        }

        return insights;
    } catch (error) {
        console.error('Error getting insights data:', error);
    }
    return [];
}

/************************************
 * 7. AUTHENTICATION (STUB)         *
 ************************************/
async function login(username, password) {
    // Demo: Always succeed
    return { token: 'demo-token', user: { username } };
}
async function logout() {
    // Demo: Clear token
    return true;
}
function isAuthenticated() {
    // Demo: Always true
    return true;
}

/************************************
 * 8. LOADING STATE HELPERS         *
 ************************************/
/**
 * Show loading indicator for API requests
 * @param {string} targetId - ID of the element to show loading in
 * @param {Object} options - Optional configuration
 * @param {number} options.height - Height of the shimmer (default: 120px)
 * @param {string} options.type - Type of loader ('shimmer', 'spinner', 'pulse')
 * @param {boolean} options.overlay - Whether to show a full overlay
 */
function showApiLoading(targetId, options = {}) {
    const target = document.getElementById(targetId);
    if (!target) return;
    
    // Save original content for restoration
    if (!target.dataset.originalContent) {
        target.dataset.originalContent = target.innerHTML;
    }
    
    const height = options.height || 120;
    const type = options.type || 'shimmer';
    
    // Create loading indicator based on type
    let loadingHTML = '';
    
    if (options.overlay) {
        loadingHTML = `
            <div class="loading-overlay">
                <div class="spinner-container">
                    <div class="spinner"></div>
                    <p class="loading-text">Loading data...</p>
                </div>
            </div>
        `;
    } else if (type === 'shimmer') {
        loadingHTML = `<div class="shimmer" style="height:${height}px;width:100%;border-radius:12px;"></div>`;
    } else if (type === 'spinner') {
        loadingHTML = `
            <div class="spinner-container" style="height:${height}px;width:100%;display:flex;align-items:center;justify-content:center;">
                <div class="spinner" style="width:40px;height:40px;"></div>
            </div>
        `;
    } else if (type === 'pulse') {
        loadingHTML = `<div class="pulse" style="height:${height}px;width:100%;border-radius:12px;"></div>`;
    }
    
    // Add loading class to target
    target.classList.add('is-loading');
    
    // Insert loading indicator
    target.innerHTML = loadingHTML;
}

/**
 * Hide loading indicator and restore original content
 * @param {string} targetId - ID of the element to hide loading from
 * @param {boolean} keepContent - Whether to keep the current content (don't restore original)
 */
function hideApiLoading(targetId, keepContent = false) {
    const target = document.getElementById(targetId);
    if (!target) return;
    
    // Remove loading class
    target.classList.remove('is-loading');
    
    // Restore original content if available and not keeping current content
    if (target.dataset.originalContent && !keepContent) {
        target.innerHTML = target.dataset.originalContent;
        delete target.dataset.originalContent;
    } else if (!keepContent) {
        target.innerHTML = '';
    }
}

/**
 * Show global loading indicator
 */
function showGlobalLoading() {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        loadingScreen.classList.remove('hidden');
    }
}

/**
 * Hide global loading indicator
 */
function hideGlobalLoading() {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        loadingScreen.classList.add('hidden');
    }
}

/************************************
 * 9. DATA TRANSFORMATION UTILS     *
 ************************************/
function transformTradeData(raw) {
    // Example: Convert API data to chart-ready format
    return {
        labels: raw.map(r => r.period),
        exports: raw.map(r => r.exports),
        imports: raw.map(r => r.imports),
        balance: raw.map(r => r.balance)
    };
}
function transformProductData(raw) {
    return {
        labels: raw.map(r => r.product),
        values: raw.map(r => r.value),
        colors: raw.map(r => r.color || randomColor())
    };
}
function randomColor() {
    const colors = ['#2d7dd2', '#f7931e', '#22c55e', '#ef4444', '#06b6d4', '#1a365d'];
    return colors[Math.floor(Math.random() * colors.length)];
}

/************************************
 * 10. DASHBOARD INTEGRATION        *
 ************************************/
async function loadDashboardCharts() {
    try {
        showApiLoading('trade-performance-chart');
        const trade = await getQuarterlyExports();
        renderTradePerformanceChart(transformTradeData(trade));
        hideApiLoading('trade-performance-chart');

        showApiLoading('trade-balance-chart');
        const growth = await getGrowthAnalytics();
        renderTradeBalanceChart(transformTradeData(growth));
        hideApiLoading('trade-balance-chart');

        showApiLoading('export-products-chart');
        const products = await getExportProducts();
        renderExportProductsChart(transformProductData(products));
        hideApiLoading('export-products-chart');
    } catch (err) {
        // Error handled by apiFetch
    }
}

/************************************
 * 11. EXTENSIBILITY                *
 ************************************/
// Add more API endpoints, helpers, or integrations as needed
// ...


/************************************
 * 11. EXTENSIBILITY                *
 ************************************/
// Add more API endpoints, helpers, or integrations as needed
// ...

// Real-time data management
let dataRefreshInterval = null;
let isRealTimeEnabled = false;

/**
 * Enable real-time data updates
 * @param {number} intervalSeconds - Update interval in seconds (default: 30)
 */
function enableRealTimeUpdates(intervalSeconds = 30) {
    if (isRealTimeEnabled) return;

    isRealTimeEnabled = true;
    console.log(`🔄 Real-time updates enabled (${intervalSeconds}s interval)`);

    dataRefreshInterval = setInterval(async () => {
        try {
            await refreshAllData();
            console.log('📡 Real-time data refreshed');
        } catch (error) {
            console.error('Real-time refresh failed:', error);
        }
    }, intervalSeconds * 1000);

    return true;
}

/**
 * Disable real-time data updates
 */
function disableRealTimeUpdates() {
    if (!isRealTimeEnabled) return;

    isRealTimeEnabled = false;
    if (dataRefreshInterval) {
        clearInterval(dataRefreshInterval);
        dataRefreshInterval = null;
    }

    console.log('⏹️ Real-time updates disabled');
    return true;
}

/**
 * Refresh all dashboard data
 */
async function refreshAllData() {
    try {
        // Clear cache to force fresh data
        Object.keys(API_CACHE).forEach(key => {
            if (key.includes('/exports') || key.includes('/imports') || key.includes('/predictions')) {
                delete API_CACHE[key];
            }
        });

        // Refresh main dashboard data
        if (typeof loadDashboardCharts === 'function') {
            await loadDashboardCharts();
        }

        // Refresh current section data
        const activeSection = document.querySelector('.section.active');
        if (activeSection) {
            await refreshSectionData(activeSection.id);
        }

        // Update last refresh timestamp
        updateLastRefreshTime();

        return true;
    } catch (error) {
        console.error('Error refreshing data:', error);
        throw error;
    }
}

/**
 * Refresh data for a specific section
 */
async function refreshSectionData(sectionId) {
    switch (sectionId) {
        case 'home':
            await loadDashboardCharts();
            break;
        case 'exports':
            if (typeof loadExportAnalysis === 'function') {
                await loadExportAnalysis();
            }
            break;
        case 'imports':
            if (typeof loadImportAnalysis === 'function') {
                await loadImportAnalysis();
            }
            break;
        case 'predictions':
            if (typeof loadPredictionAnalysis === 'function') {
                await loadPredictionAnalysis();
            }
            break;
        case 'excel-analysis':
            await loadExcelAnalysis();
            break;
        default:
            console.log(`No refresh function for section: ${sectionId}`);
    }
}

/**
 * Update the last refresh timestamp display
 */
function updateLastRefreshTime() {
    const lastUpdatedEl = document.getElementById('last-updated');
    if (lastUpdatedEl) {
        lastUpdatedEl.textContent = new Date().toLocaleTimeString();
    }
}

/**
 * Get real-time status
 */
function getRealTimeStatus() {
    return {
        enabled: isRealTimeEnabled,
        interval: dataRefreshInterval ? 'active' : 'inactive',
        lastRefresh: new Date().toISOString()
    };
}

// Export functions for use in other scripts
window.apiUtils = {
    // API endpoints
    getQuarterlyExports,
    getExportDestinations,
    getExportProducts,
    getImportSources,
    getImportCategories,
    getPredictions,
    getGrowthAnalytics,
    searchProduct,

    // Excel Analysis endpoints
    analyzeExcelData,
    getAnalysisResults,
    getTradeOverview,
    getTopCountries,
    getCommodityAnalysis,
    getInsights,

    // MongoDB-backed endpoints
    getModelDashboard,
    getStatisticalAnalyses,
    getMLModels,
    getPredictions,
    getExportInsights,
    getModelStatus,
    seedDatabase,

    // Authentication
    login,
    logout,
    isAuthenticated,

    // Loading utilities
    showApiLoading,
    hideApiLoading,
    showGlobalLoading,
    hideGlobalLoading,

    // Data transformation
    transformTradeData,
    transformProductData,

    // Real-time features
    enableRealTimeUpdates,
    disableRealTimeUpdates,
    refreshAllData,
    refreshSectionData,
    getRealTimeStatus
};



/************************************
 * END OF API.JS                    *
 ************************************/
