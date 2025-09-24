/* =====================================================================
   RWANDA EXPORT EXPLORER - API.JS
   Pro-level API abstraction and data integration for dashboard
   ===================================================================== */

/************************************
 * 1. API CONFIGURATION             *
 ************************************/
const API_BASE = 'http://localhost:3000/api';
const API_TIMEOUT = 12000; // ms
const API_CACHE = {};

/************************************
  * 2. GENERIC API FETCH WRAPPER     *
  ************************************/
async function apiFetch(endpoint, options = {}) {
    const url = API_BASE + endpoint;
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
 * 3. API ENDPOINTS (EXPORTS)       *
 ************************************/
async function getQuarterlyExports() {
    return await apiFetch('/exports/quarterly');
}
async function getExportDestinations(year = '2024') {
    return await apiFetch(`/exports/destinations?year=${year}`);
}
async function getExportProducts() {
    return await apiFetch('/exports/products');
}

/************************************
 * 4. API ENDPOINTS (IMPORTS)       *
 ************************************/
async function getImportSources(year = '2024') {
    return await apiFetch(`/imports/sources?year=${year}`);
}
async function getImportCategories() {
    return await apiFetch('/imports/categories');
}


/************************************
 * 5. API ENDPOINTS (PREDICTIONS)   *
 ************************************/
async function getPredictions() {
    return await apiFetch('/predictions/next');
}

/************************************
  * 6. API ENDPOINTS (ANALYTICS)     *
  ************************************/
async function getGrowthAnalytics() {
    return await apiFetch('/analytics/growth');
}
async function searchProduct(product, category = '', time = '') {
    let url = `/search/${encodeURIComponent(product)}`;
    if (category || time) {
        url += `?category=${encodeURIComponent(category)}&time=${encodeURIComponent(time)}`;
    }
    return await apiFetch(url);
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
    return await apiFetch('/analysis-results', {
        targetId: 'excel-analysis-results'
    });
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


module.exports = {
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
    transformProductData
};



/************************************
 * END OF API.JS                    *
 ************************************/
