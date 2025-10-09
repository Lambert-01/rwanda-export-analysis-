/* =====================================================================
    RWANDA EXPORT EXPLORER - MAIN.JS (HACKATHON ENHANCED)
    NISR Hackathon 2025 - Track 5: Mobile/Web Data Solutions
    Enhanced with modern features, PWA capabilities, and mobile optimization
    ===================================================================== */

/************************************
 * 1. NAVIGATION & SECTION CONTROL  *
 ************************************/
const navLinks = document.querySelectorAll('.nav-link[data-section]');
const sections = document.querySelectorAll('.section');
function showSection(sectionId) {
    console.log(`🔄 Showing section: ${sectionId}`);

    // Ensure all sections are visible first
    sections.forEach(sec => {
        sec.style.display = 'block';
        sec.style.visibility = 'visible';
        sec.style.opacity = '1';
        sec.classList.remove('active');
    });

    const target = document.getElementById(sectionId);
    if (target) {
        target.classList.add('active');
        target.style.display = 'block';
        target.style.visibility = 'visible';
        target.style.opacity = '1';
        target.style.position = 'relative';
        target.style.zIndex = '1';
        console.log(`✅ Section ${sectionId} activated`);
    } else {
        console.error(`❌ Section not found: ${sectionId}`);
    }

    navLinks.forEach(link => {
        if (link.getAttribute('data-section') === sectionId) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.title = `Rwanda Export Explorer | ${capitalize(sectionId)}`;
}
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const section = this.getAttribute('data-section') || this.getAttribute('href')?.replace('.html', '').replace('#', '') || 'home';
        console.log(`🔗 Navigation clicked: ${section}`);
        showSection(section);
        window.location.hash = section;
    });
});
window.addEventListener('hashchange', () => {
    const hash = window.location.hash.replace('#', '');
    if (hash) showSection(hash);
});

// Initialize section based on current page
if (window.location.hash) {
    showSection(window.location.hash.replace('#', ''));
} else {
    // Detect current page and show appropriate section
    const pathName = window.location.pathname;
    let defaultSection = 'home';

    if (pathName.includes('exports.html') || pathName.endsWith('exports/')) {
        defaultSection = 'exports';
    } else if (pathName.includes('imports.html') || pathName.endsWith('imports/')) {
        defaultSection = 'imports';
    } else if (pathName.includes('predictions.html') || pathName.endsWith('predictions/')) {
        defaultSection = 'predictions';
    } else if (pathName.includes('analytics.html') || pathName.endsWith('analytics/')) {
        defaultSection = 'analytics';
    } else if (pathName.includes('commodities.html') || pathName.endsWith('commodities/')) {
        defaultSection = 'commodities';
    } else if (pathName.includes('regional.html') || pathName.endsWith('regional/')) {
        defaultSection = 'regional';
    }

    console.log(`📍 Detected page: ${pathName}, showing section: ${defaultSection}`);
    showSection(defaultSection);
}

/************************************
 * 2. LOADING SCREEN                *
 ************************************/
const loadingScreen = document.getElementById('loading-screen');
function showLoading() {
    if (loadingScreen) loadingScreen.classList.remove('hidden');
}
function hideLoading() {
    if (loadingScreen) loadingScreen.classList.add('hidden');
}
window.addEventListener('load', hideLoading);

/************************************
 * 3. SEARCH & FILTER LOGIC         *
 ************************************/
const productSearch = document.getElementById('product-search');
const categoryFilter = document.getElementById('category-filter');
const timeFilter = document.getElementById('time-filter');
const applyFiltersBtn = document.getElementById('apply-filters');
const analyticsResults = document.getElementById('analytics-results');
let analyticsDataCache = [];

function fetchAnalyticsResults(query = {}) {
    showLoading();
    let url = '/api/search?';
    if (query.product) url += `product=${encodeURIComponent(query.product)}&`;
    if (query.category) url += `category=${encodeURIComponent(query.category)}&`;
    if (query.time) url += `time=${encodeURIComponent(query.time)}&`;
    fetch(url)
        .then(res => res.json())
        .then(data => {
            analyticsDataCache = data;
            renderAnalyticsResults(data);
            hideLoading();
        })
        .catch(() => {
            renderAnalyticsResults([]);
            hideLoading();
        });
}
function renderAnalyticsResults(data) {
    if (!analyticsResults) return;
    analyticsResults.innerHTML = '';
    if (!data || !data.length) {
        analyticsResults.innerHTML = '<div class="alert alert-info">No results found.</div>';
        return;
    }
    data.forEach(item => {
        const div = document.createElement('div');
        div.className = 'col-lg-4 col-md-6 mb-4';
        div.innerHTML = `
            <div class="widget card-hover pop-in" tabindex="0" aria-label="${item.product || 'Product'} analytics card">
                <div class="widget-title">${item.product || 'Product'}</div>
                <div class="widget-value">${item.value ? formatNumber(item.value) : '--'}</div>
                <div class="widget-desc">${item.description || ''}</div>
                <button class="btn btn-sm btn-outline-primary export-btn" data-product="${item.product}">Export</button>
            </div>
        `;
        analyticsResults.appendChild(div);
    });
    addExportBtnListeners();
}
function addExportBtnListeners() {
    document.querySelectorAll('.export-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const product = this.getAttribute('data-product');
            showToast(`Exported data for ${product}`, 'success');
        });
    });
}
if (applyFiltersBtn) {
    applyFiltersBtn.addEventListener('click', () => {
        fetchAnalyticsResults({
            product: productSearch.value,
            category: categoryFilter.value,
            time: timeFilter.value
        });
    });
}
if (productSearch) {
    productSearch.addEventListener('keyup', debounce(function(e) {
        if (e.key === 'Enter') {
            fetchAnalyticsResults({
                product: productSearch.value,
                category: categoryFilter.value,
                time: timeFilter.value
            });
        }
    }, 300));
}

/************************************
 * 4. ANALYTICS SORTING & EXPORT    *
 ************************************/
function sortAnalytics(by = 'value', dir = 'desc') {
    if (!analyticsDataCache.length) return;
    analyticsDataCache.sort((a, b) => {
        if (dir === 'desc') return (b[by] || 0) - (a[by] || 0);
        return (a[by] || 0) - (b[by] || 0);
    });
    renderAnalyticsResults(analyticsDataCache);
}
const sortBtns = document.querySelectorAll('.analytics-sort-btn');
sortBtns.forEach(btn => {
    btn.addEventListener('click', function() {
        const by = this.getAttribute('data-sort');
        const dir = this.getAttribute('data-dir');
        sortAnalytics(by, dir);
    });
});
function exportAnalyticsToCSV() {
    if (!analyticsDataCache.length) return;
    let csv = 'Product,Value,Description\n';
    analyticsDataCache.forEach(item => {
        csv += `${item.product || ''},${item.value || ''},${item.description || ''}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'analytics_export.csv';
    link.click();
    showToast('Analytics exported as CSV!', 'success');
}

/************************************
 * 5. MODALS & TOASTS               *
 ************************************/
function showModal(modalId) {
    const modalBg = document.getElementById(modalId);
    if (modalBg) modalBg.classList.add('active');
    if (modalBg) modalBg.setAttribute('aria-modal', 'true');
}

// Manual chart refresh function for debugging
async function refreshCharts() {
    console.log('🔄 Manual chart refresh triggered...');

    try {
        showToast('Refreshing charts...', 'info', 2000);

        // Clear existing charts
        Object.keys(globalChartRegistry).forEach(chartId => {
            if (globalChartRegistry[chartId]) {
                globalChartRegistry[chartId].destroy();
                delete globalChartRegistry[chartId];
            }
        });

        // Reload data and render charts
        const results = await getAnalysisResults();
        if (results && results.data) {
            await renderDashboardCharts(results.data);
            showToast('Charts refreshed successfully!', 'success', 3000);
        } else {
            await renderFallbackCharts();
            showToast('Charts refreshed with sample data!', 'success', 3000);
        }

        // Ensure visibility
        setTimeout(() => {
            ensureChartsVisible();
        }, 500);

    } catch (error) {
        console.error('❌ Error refreshing charts:', error);
        showToast('Error refreshing charts. Using fallback data.', 'error', 4000);
        await renderFallbackCharts();
    }
}

// Force sections to be visible (failsafe)
function forceSectionsVisible() {
    console.log('🔧 Force displaying all sections...');

    // Ensure main content is visible
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.style.display = 'block';
        mainContent.style.visibility = 'visible';
        mainContent.style.opacity = '1';
        mainContent.style.position = 'relative';
        mainContent.style.zIndex = '1';
    }

    // Force all sections to be visible
    sections.forEach(section => {
        section.style.display = 'block';
        section.style.visibility = 'visible';
        section.style.opacity = '1';
        section.style.position = 'relative';
        section.style.zIndex = '1';
        section.style.transform = 'translateY(0)';
        section.style.minHeight = 'auto';

        console.log(`✅ Forced section visible: ${section.id}`);
    });

    // Ensure dashboard section is active by default
    const dashboardSection = document.getElementById('dashboard');
    if (dashboardSection) {
        dashboardSection.classList.add('active');
        console.log('✅ Dashboard section activated');
    }

    // Force charts to be visible
    setTimeout(() => {
        ensureChartsVisible();
        ensureChartContainersVisible();
    }, 500);

    console.log('✅ All sections forced visible');
}

// Expose functions globally for debugging
window.refreshCharts = refreshCharts;
window.forceSectionsVisible = forceSectionsVisible;
window.testAPIConnection = testAPIConnection;
window.loadRealTradeData = loadRealTradeData;
window.renderChartsFromAPI = renderChartsFromAPI;
window.populateWithSampleData = populateWithSampleData;
window.forceLoadData = forceLoadData;
window.testDataLoading = testDataLoading;

// Test function to verify data loading
window.testDataLoading = async function() {
    console.log('🧪 Testing data loading...');

    try {
        // Test API connectivity
        console.log('1️⃣ Testing API connectivity...');
        const apiTest = await testAPIConnection();

        // Test data loading
        console.log('2️⃣ Testing data loading...');
        const dataLoadResult = await loadRealTradeData();

        // Check if charts are populated
        console.log('3️⃣ Checking chart population...');
        const charts = document.querySelectorAll('.chart-container canvas');
        console.log(`Found ${charts.length} chart canvases`);

        charts.forEach(canvas => {
            const ctx = canvas.getContext('2d');
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const hasData = !isCanvasEmpty(imageData);
            console.log(`Chart ${canvas.id}: ${hasData ? '✅ Has data' : '❌ Empty'}`);
        });

        console.log('✅ Data loading test complete');
        return {
            apiTest,
            dataLoadResult,
            chartsFound: charts.length,
            chartsWithData: charts.filter(canvas => {
                const ctx = canvas.getContext('2d');
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                return !isCanvasEmpty(imageData);
            }).length
        };

    } catch (error) {
        console.error('❌ Data loading test failed:', error);
        return { error: error.message };
    }
};

// Quick function to populate dashboard with real data from your processed files
window.populateWithSampleData = function() {
    console.log('🚀 Populating dashboard with real data from processed files...');

    try {
        // Update dashboard stats with real data from your processed files
        const statsElements = {
            'exports-value': '$677.45M',
            'imports-value': '$1,629.39M',
            'balance-value': '-$951.94M',
            'total-trade-value': '$2,306.84M',
            'export-growth': '+157.9%',
            'active-partners': '20'
        };

        Object.entries(statsElements).forEach(([elementId, value]) => {
            const element = document.getElementById(elementId);
            if (element) {
                element.textContent = value;
                console.log(`✅ Updated ${elementId}: ${value}`);
            } else {
                console.warn(`⚠️ Element not found: ${elementId}`);
            }
        });

        console.log('✅ Dashboard populated with real data');
        showToast('Dashboard updated with real data!', 'success', 2000);
    } catch (error) {
        console.error('❌ Error populating dashboard:', error);
        showToast('Error updating dashboard', 'error', 3000);
    }
};

// Force load data and populate charts immediately
window.forceLoadData = async function() {
    console.log('🔥 Force loading data and populating charts...');

    try {
        showToast('Loading real data...', 'info', 2000);

        // Load data from API
        const success = await loadRealTradeData();

        if (success) {
            console.log('✅ Data loaded successfully');
            showToast('Data loaded successfully!', 'success', 3000);
        } else {
            console.warn('⚠️ Using fallback data');
            await renderFallbackCharts();
            showToast('Using fallback data', 'warning', 2000);
        }

        // Also update the dashboard stats
        populateWithSampleData();

    } catch (error) {
        console.error('❌ Error force loading data:', error);
        showToast('Error loading data', 'error', 3000);
    }
};

// Helper function to check if canvas is empty
function isCanvasEmpty(imageData) {
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        if (data[i] !== 0 || data[i + 1] !== 0 || data[i + 2] !== 0 || data[i + 3] !== 0) {
            return false; // Found non-transparent pixel
        }
    }
    return true; // All pixels are transparent
}

// Add a global fix function that can be called from anywhere
window.fixLayout = function() {
    console.log('🔧 Running complete layout fix...');
    hideLoading();
    forceSectionsVisible();
    setTimeout(() => {
        ensureChartsVisible();
        ensureChartContainersVisible();
        showToast('Layout fixed! Refreshing display...', 'success', 2000);
    }, 500);
};

// Test function to verify charts are working
window.testCharts = async function() {
    console.log('🧪 Testing chart functionality...');

    try {
        // Test 1: Check if Chart.js is loaded
        if (typeof Chart === 'undefined') {
            console.error('❌ Chart.js is not loaded');
            return false;
        }
        console.log('✅ Chart.js is loaded');

        // Test 2: Check if canvas elements exist
        const canvases = document.querySelectorAll('.chart-container canvas');
        console.log(`📊 Found ${canvases.length} canvas elements`);

        if (canvases.length === 0) {
            console.error('❌ No canvas elements found');
            return false;
        }

        // Test 3: Try to create a simple test chart
        const testCanvas = document.createElement('canvas');
        testCanvas.id = 'test-chart';
        testCanvas.width = 400;
        testCanvas.height = 200;
        testCanvas.style.border = '1px solid red';

        // Add to a visible location
        const testContainer = document.createElement('div');
        testContainer.id = 'test-chart-container';
        testContainer.style.position = 'fixed';
        testContainer.style.top = '10px';
        testContainer.style.left = '10px';
        testContainer.style.zIndex = '9999';
        testContainer.style.background = 'white';
        testContainer.style.padding = '10px';
        testContainer.style.border = '2px solid blue';

        document.body.appendChild(testContainer);
        testContainer.appendChild(testCanvas);

        const ctx = testCanvas.getContext('2d');
        const testChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Test'],
                datasets: [{
                    label: 'Test Data',
                    data: [100],
                    backgroundColor: 'rgba(0, 161, 241, 0.5)'
                }]
            },
            options: {
                responsive: false,
                maintainAspectRatio: false
            }
        });

        console.log('✅ Test chart created successfully');
        console.log('📍 Test chart should be visible in top-left corner');

        return true;

    } catch (error) {
        console.error('❌ Chart test failed:', error);
        return false;
    }
};
function hideModal(modalId) {
    const modalBg = document.getElementById(modalId);
    if (modalBg) modalBg.classList.remove('active');
    if (modalBg) modalBg.removeAttribute('aria-modal');
}
function showToast(message, type = 'info', duration = 3500) {
    let toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'polite');
    toast.innerHTML = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, duration);
}

/************************************
 * 6. TABS, COLLAPSIBLES, TIMELINE  *
 ************************************/
const tabButtons = document.querySelectorAll('.tab');
tabButtons.forEach(tab => {
    tab.addEventListener('click', function() {
        const group = this.closest('.tabs');
        if (!group) return;
        group.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        const contentId = this.getAttribute('data-tab');
        document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
        if (contentId) {
            const content = document.getElementById(contentId);
            if (content) content.classList.add('active');
        }
    });
});
const collapseHeaders = document.querySelectorAll('.collapse-header');
collapseHeaders.forEach(header => {
    header.addEventListener('click', function() {
        const section = this.closest('.collapse-section');
        if (section) section.classList.toggle('open');
    });
});

/************************************
 * 7. FLOATING ACTION BUTTON (FAB)  *
 ************************************/
const fab = document.querySelector('.fab');
if (fab) {
    fab.addEventListener('click', function() {
        showToast('FAB clicked! Add your custom action here.', 'info');
    });
}

/************************************
 * 8. AVATAR & USER PROFILE         *
 ************************************/
function loadUserProfile() {
    const profile = document.querySelector('.user-profile');
    if (!profile) return;
    profile.querySelector('.user-name').textContent = 'Jane Doe';
    profile.querySelector('.user-role').textContent = 'Trade Analyst';
    profile.querySelector('.avatar').src = 'assets/images/avatar.png';
}
loadUserProfile();

/************************************
 * 9. SHIMMER LOADING EFFECT        *
 ************************************/
function showShimmer(targetId) {
    const target = document.getElementById(targetId);
    if (!target) return;
    target.innerHTML = '<div class="shimmer" style="height:120px;width:100%;border-radius:12px;"></div>';
}
function hideShimmer(targetId) {
    const target = document.getElementById(targetId);
    if (!target) return;
    target.innerHTML = '';
}

/************************************
 * 10. ACCESSIBILITY & UTILITIES    *
 ************************************/
navLinks.forEach(link => {
    link.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.click();
        }
    });
});
function debounce(fn, delay) {
    let timer;
    return function(...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('Copied to clipboard!', 'success');
    });
}
function formatNumber(num) {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num;
}
function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' });
}
function printSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) return;
    const printWindow = window.open('', '', 'width=900,height=700');
    printWindow.document.write('<html><head><title>Print</title>');
    printWindow.document.write('<link rel="stylesheet" href="css/main.css">');
    printWindow.document.write('<link rel="stylesheet" href="css/dashboard.css">');
    printWindow.document.write('</head><body >');
    printWindow.document.write(section.innerHTML);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
}

/************************************
  * 11. EXCEL ANALYSIS FUNCTIONS     *
  ************************************/
async function loadExcelAnalysis() {
    try {
        console.log('🔄 Starting Excel analysis loading...');
        showGlobalLoading();
        showToast('Analyzing Rwanda trade data...', 'info', 2000);

        const results = await getAnalysisResults();
        console.log('📊 Analysis results received:', results);

        if (results && results.data) {
            await displayAnalysisResults(results.data);
            showToast('Analysis complete! Data loaded successfully.', 'success', 3000);
        } else {
            throw new Error('No data received from analysis');
        }

        hideGlobalLoading();
        console.log('✅ Excel analysis completed successfully');

    } catch (error) {
        console.error('❌ Error loading Excel analysis:', error);
        showToast('Failed to load analysis data. Please try again.', 'error', 4000);
        hideGlobalLoading();
        throw error; // Re-throw to allow caller to handle
    }
}

async function displayAnalysisResults(data) {
    console.log('📊 Displaying analysis results:', data);

    try {
        // Update trade overview
        if (data.trade_overview) {
            updateTradeOverview(data.trade_overview);
        }

        // Update top countries
        if (data.top_countries) {
            updateTopCountries(data.top_countries);
        }

        // Update commodities
        if (data.commodities) {
            updateCommodityAnalysis(data.commodities);
        }

        // Update insights
        if (data.insights) {
            updateInsights(data.insights);
        }

        // Update metadata
        if (data.metadata) {
            updateMetadata(data.metadata);
        }

        // Render charts after data is loaded with proper delay
        setTimeout(async () => {
            console.log('🎨 Rendering dashboard charts...');
            try {
                await renderDashboardCharts(data);
                console.log('✅ Charts rendered successfully');
            } catch (chartError) {
                console.error('❌ Error rendering charts:', chartError);
                // Fallback to basic chart rendering
                renderFallbackCharts();
            }
        }, 500);

    } catch (error) {
        console.error('❌ Error in displayAnalysisResults:', error);
        throw error;
    }
}

function updateTradeOverview(overview) {
    // Update hero stats
    const exportsEl = document.getElementById('exports-value');
    const importsEl = document.getElementById('imports-value');
    const balanceEl = document.getElementById('balance-value');
    const totalTradeEl = document.getElementById('total-trade-value');

    if (exportsEl) exportsEl.textContent = `$${formatNumber(overview.total_exports_q4_2024)}M`;
    if (importsEl) importsEl.textContent = `$${formatNumber(overview.total_imports_q4_2024)}M`;
    if (balanceEl) balanceEl.textContent = `$${formatNumber(overview.trade_balance_q4_2024)}M`;
    if (totalTradeEl) totalTradeEl.textContent = `$${formatNumber(overview.total_exports_q4_2024 + overview.total_imports_q4_2024)}M`;

    // Update growth indicators
    const exportGrowthEl = document.getElementById('export-growth');
    if (exportGrowthEl && overview.export_growth_qoq) {
        const growth = overview.export_growth_qoq;
        exportGrowthEl.textContent = `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%`;
        exportGrowthEl.className = growth >= 0 ? 'growth-positive' : 'growth-negative';
    }
}

function updateTopCountries(countries) {
    // Update export destinations
    const exportMapEl = document.getElementById('export-map');
    if (exportMapEl && countries.top_export_countries) {
        // This would integrate with the maps.js file
        console.log('Top export countries:', countries.top_export_countries);
    }

    // Update top destinations list
    const topDestinationsEl = document.getElementById('top-destinations');
    if (topDestinationsEl && countries.top_export_countries) {
        let html = '';
        countries.top_export_countries.slice(0, 5).forEach((country, index) => {
            html += `
                <div class="destination-item">
                    <div class="destination-rank">${index + 1}</div>
                    <div class="destination-info">
                        <div class="destination-name">${country.country}</div>
                        <div class="destination-value">$${formatNumber(country.q4_2024)}M</div>
                    </div>
                </div>
            `;
        });
        topDestinationsEl.innerHTML = html;
    }
}

function updateCommodityAnalysis(commodities) {
    // Update export products chart
    if (commodities.top_export_commodities) {
        const chartData = commodities.top_export_commodities.map(item => ({
            product: item.description,
            value: item.q4_2024
        }));
        // This would integrate with charts.js
        console.log('Top export commodities:', chartData);
    }
}

function updateInsights(insights) {
    const insightsListEl = document.getElementById('insights-list');
    if (insightsListEl) {
        let html = '';
        insights.forEach(insight => {
            const icon = insight.type === 'success' ? 'check-circle' :
                        insight.type === 'warning' ? 'exclamation-triangle' :
                        'info-circle';
            html += `
                <div class="insight-item insight-${insight.type}">
                    <i class="fas fa-${icon}"></i>
                    <div class="insight-content">
                        <div class="insight-title">${insight.title}</div>
                        <div class="insight-message">${insight.message}</div>
                    </div>
                </div>
            `;
        });
        insightsListEl.innerHTML = html;
    }
}

function updateMetadata(metadata) {
    console.log('Analysis metadata:', metadata);
    // Could display analysis timestamp, data source, etc.
}

// Fallback data function for when API calls fail
function getFallbackData() {
    return {
        trade_overview: {
            total_exports_q4_2024: 677.45,
            total_imports_q4_2024: 1629.39,
            trade_balance_q4_2024: -951.94,
            export_growth_qoq: 1.5,
            q1_2024_exports: 431.61,
            q2_2024_exports: 537.64,
            q3_2024_exports: 667.00,
            q4_2024_exports: 677.45,
            q1_2024_imports: 1410.52,
            q2_2024_imports: 1568.97,
            q3_2024_imports: 1751.57,
            q4_2024_imports: 1629.39
        },
        top_countries: {
            top_export_countries: [
                { country: 'United Arab Emirates', value: 442.55, q4_2024: 442.55 },
                { country: 'Democratic Republic of Congo', value: 84.11, q4_2024: 84.11 },
                { country: 'China', value: 20.43, q4_2024: 20.43 },
                { country: 'Luxembourg', value: 14.10, q4_2024: 14.10 },
                { country: 'United Kingdom', value: 9.31, q4_2024: 9.31 }
            ],
            top_import_countries: [
                { country: 'China', value: 303.26, q4_2024: 303.26 },
                { country: 'Tanzania', value: 298.93, q4_2024: 298.93 },
                { country: 'Kenya', value: 211.22, q4_2024: 211.22 },
                { country: 'India', value: 101.83, q4_2024: 101.83 },
                { country: 'UAE', value: 96.64, q4_2024: 96.64 }
            ]
        },
        commodities: {
            top_export_commodities: [
                { description: 'Other commodities & transactions', value: 428.15, q4_2024: 428.15 },
                { description: 'Food and live animals', value: 101.12, q4_2024: 101.12 },
                { description: 'Crude materials', value: 58.79, q4_2024: 58.79 },
                { description: 'Manufactured goods', value: 34.87, q4_2024: 34.87 },
                { description: 'Animals & vegetable oils', value: 23.40, q4_2024: 23.40 }
            ],
            top_import_commodities: [
                { description: 'Machinery and transport equipment', value: 238.86, q4_2024: 238.86 },
                { description: 'Manufactured goods', value: 215.13, q4_2024: 215.13 },
                { description: 'Food and live animals', value: 234.57, q4_2024: 234.57 },
                { description: 'Mineral fuels', value: 190.53, q4_2024: 190.53 },
                { description: 'Chemicals', value: 135.39, q4_2024: 135.39 }
            ]
        },
        insights: [
            {
                type: 'success',
                title: 'Leading Export Destination',
                message: 'United Arab Emirates is the top export destination with $442.55M in Q4 2024'
            },
            {
                type: 'info',
                title: 'Market Diversification',
                message: 'Rwanda exports to multiple countries, showing good market diversification'
            }
        ],
        metadata: {
            last_updated: new Date().toISOString(),
            data_sources: ['fallback'],
            database_connected: false
        }
    };
}

/************************************
 * MISSING FUNCTION DEFINITIONS      *
 ************************************/
// These functions are called from dashboard.js but not defined in main.js
async function loadExportAnalysis() {
    console.log('📊 Loading export analysis...');
    try {
        const results = await getAnalysisResults();
        if (results.success && results.data) {
            console.log('✅ Export analysis data loaded');
            // Trigger chart rendering for export-specific charts if on exports page
            if (window.location.pathname.includes('exports')) {
                setTimeout(() => {
                    if (window.exportAnalyzer) {
                        window.exportAnalyzer.renderCharts();
                    }
                }, 500);
            }
        }
    } catch (error) {
        console.error('❌ Error loading export analysis:', error);
    }
}

async function loadImportAnalysis() {
    console.log('📥 Loading import analysis...');
    try {
        const results = await getAnalysisResults();
        if (results.success && results.data) {
            console.log('✅ Import analysis data loaded');
            // Trigger chart rendering for import-specific charts if on imports page
            if (window.location.pathname.includes('imports')) {
                setTimeout(() => {
                    if (window.importAnalyzer) {
                        window.importAnalyzer.renderCharts();
                    }
                }, 500);
            }
        }
    } catch (error) {
        console.error('❌ Error loading import analysis:', error);
    }
}

async function loadPredictionAnalysis() {
    console.log('🔮 Loading prediction analysis...');
    try {
        const results = await getPredictions();
        if (results.success && results.data) {
            console.log('✅ Prediction analysis data loaded');
            // Trigger chart rendering for prediction-specific charts if on predictions page
            if (window.location.pathname.includes('predictions')) {
                setTimeout(() => {
                    if (window.predictionsAnalyzer) {
                        window.predictionsAnalyzer.renderCharts();
                    }
                }, 500);
            }
        }
    } catch (error) {
        console.error('❌ Error loading prediction analysis:', error);
    }
}

/************************************
 * COMPARISON FUNCTIONS FOR INDEX PAGE *
 ************************************/
function generateComparison() {
    const period = document.getElementById('comparison-period').value;
    const type = document.getElementById('comparison-type').value;
    const resultsContainer = document.getElementById('comparison-results');

    // Show loading
    resultsContainer.innerHTML = '<div class="text-center"><div class="spinner"></div><p>Generating comparison...</p></div>';

    // Simulate API call delay
    setTimeout(() => {
        if (type === 'countries') {
            renderCountryComparison(period);
        } else if (type === 'commodities') {
            renderCommodityComparison(period);
        } else if (type === 'regions') {
            renderRegionalComparison(period);
        }
    }, 1000);
}

function renderCountryComparison(period) {
    const resultsContainer = document.getElementById('comparison-results');

    // Mock data - in real implementation, this would come from the API
    const comparisonData = {
        exports: [
            { country: 'United Arab Emirates', value: 442.55, change: 15.2 },
            { country: 'Democratic Republic of Congo', value: 84.11, change: 8.7 },
            { country: 'China', value: 20.43, change: -5.4 },
            { country: 'Luxembourg', value: 14.10, change: 12.3 },
            { country: 'United Kingdom', value: 9.31, change: -8.1 }
        ],
        imports: [
            { country: 'China', value: 303.26, change: 2.1 },
            { country: 'Tanzania', value: 298.93, change: 31.4 },
            { country: 'Kenya', value: 211.22, change: 199.0 },
            { country: 'India', value: 101.83, change: -11.7 },
            { country: 'UAE', value: 96.64, change: 11.7 }
        ]
    };

    let html = `
        <div class="comparison-summary">
            <div class="row g-4">
                <div class="col-lg-6">
                    <div class="comparison-card">
                        <h4 class="comparison-title">Top Export Destinations</h4>
                        <div class="comparison-list">
    `;

    comparisonData.exports.forEach((item, index) => {
        const trendClass = item.change >= 0 ? 'trend-up' : 'trend-down';
        const trendIcon = item.change >= 0 ? 'arrow-up' : 'arrow-down';
        html += `
            <div class="comparison-item">
                <div class="comparison-rank">${index + 1}</div>
                <div class="comparison-info">
                    <div class="comparison-name">${item.country}</div>
                    <div class="comparison-value">$${formatNumber(item.value)}M</div>
                </div>
                <div class="comparison-trend ${trendClass}">
                    <i class="fas fa-${trendIcon} me-1"></i>
                    ${Math.abs(item.change)}%
                </div>
            </div>
        `;
    });

    html += `
                        </div>
                    </div>
                </div>
                <div class="col-lg-6">
                    <div class="comparison-card">
                        <h4 class="comparison-title">Top Import Sources</h4>
                        <div class="comparison-list">
    `;

    comparisonData.imports.forEach((item, index) => {
        const trendClass = item.change >= 0 ? 'trend-up' : 'trend-down';
        const trendIcon = item.change >= 0 ? 'arrow-up' : 'arrow-down';
        html += `
            <div class="comparison-item">
                <div class="comparison-rank">${index + 1}</div>
                <div class="comparison-info">
                    <div class="comparison-name">${item.country}</div>
                    <div class="comparison-value">$${formatNumber(item.value)}M</div>
                </div>
                <div class="comparison-trend ${trendClass}">
                    <i class="fas fa-${trendIcon} me-1"></i>
                    ${Math.abs(item.change)}%
                </div>
            </div>
        `;
    });

    html += `
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    resultsContainer.innerHTML = html;
}

function renderCommodityComparison(period) {
    const resultsContainer = document.getElementById('comparison-results');

    // Mock data
    const comparisonData = {
        exports: [
            { commodity: 'Other commodities & transactions', value: 428.15, share: 63.2 },
            { commodity: 'Food and live animals', value: 101.12, share: 14.9 },
            { commodity: 'Crude materials', value: 58.79, share: 8.7 },
            { commodity: 'Manufactured goods', value: 34.87, share: 5.1 },
            { commodity: 'Animals & vegetable oils', value: 23.40, share: 3.5 }
        ],
        imports: [
            { commodity: 'Machinery and transport equipment', value: 238.86, share: 14.7 },
            { commodity: 'Manufactured goods', value: 215.13, share: 13.2 },
            { commodity: 'Food and live animals', value: 234.57, share: 14.4 },
            { commodity: 'Mineral fuels', value: 190.53, share: 11.7 },
            { commodity: 'Chemicals', value: 135.39, share: 8.3 }
        ]
    };

    let html = `
        <div class="comparison-summary">
            <div class="row g-4">
                <div class="col-lg-6">
                    <div class="comparison-card">
                        <h4 class="comparison-title">Top Export Commodities</h4>
                        <div class="comparison-list">
    `;

    comparisonData.exports.forEach((item, index) => {
        html += `
            <div class="comparison-item">
                <div class="comparison-rank">${index + 1}</div>
                <div class="comparison-info">
                    <div class="comparison-name">${item.commodity}</div>
                    <div class="comparison-value">$${formatNumber(item.value)}M</div>
                </div>
                <div class="comparison-share">${item.share}%</div>
            </div>
        `;
    });

    html += `
                        </div>
                    </div>
                </div>
                <div class="col-lg-6">
                    <div class="comparison-card">
                        <h4 class="comparison-title">Top Import Commodities</h4>
                        <div class="comparison-list">
    `;

    comparisonData.imports.forEach((item, index) => {
        html += `
            <div class="comparison-item">
                <div class="comparison-rank">${index + 1}</div>
                <div class="comparison-info">
                    <div class="comparison-name">${item.commodity}</div>
                    <div class="comparison-value">$${formatNumber(item.value)}M</div>
                </div>
                <div class="comparison-share">${item.share}%</div>
            </div>
        `;
    });

    html += `
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    resultsContainer.innerHTML = html;
}

function renderRegionalComparison(period) {
    const resultsContainer = document.getElementById('comparison-results');

    // Mock data
    const comparisonData = {
        exports: [
            { region: 'Asia', value: 499.03, share: 73.7, topCountry: 'UAE' },
            { region: 'Africa', value: 112.92, share: 16.7, topCountry: 'DRC' },
            { region: 'Europe', value: 53.96, share: 8.0, topCountry: 'Luxembourg' },
            { region: 'Americas', value: 10.60, share: 1.6, topCountry: 'USA' },
            { region: 'Oceania', value: 0.92, share: 0.1, topCountry: 'Australia' }
        ],
        imports: [
            { region: 'Asia', value: 671.95, share: 41.2, topCountry: 'China' },
            { region: 'Africa', value: 778.55, share: 47.8, topCountry: 'Tanzania' },
            { region: 'Europe', value: 132.51, share: 8.1, topCountry: 'Germany' },
            { region: 'Americas', value: 37.65, share: 2.3, topCountry: 'USA' },
            { region: 'Oceania', value: 8.73, share: 0.5, topCountry: 'Australia' }
        ]
    };

    let html = `
        <div class="comparison-summary">
            <div class="row g-4">
                <div class="col-lg-6">
                    <div class="comparison-card">
                        <h4 class="comparison-title">Export by Region</h4>
                        <div class="comparison-list">
    `;

    comparisonData.exports.forEach((item, index) => {
        html += `
            <div class="comparison-item">
                <div class="comparison-rank">${index + 1}</div>
                <div class="comparison-info">
                    <div class="comparison-name">${item.region}</div>
                    <div class="comparison-value">$${formatNumber(item.value)}M</div>
                </div>
                <div class="comparison-details">
                    <small class="text-muted">${item.share}% | Top: ${item.topCountry}</small>
                </div>
            </div>
        `;
    });

    html += `
                        </div>
                    </div>
                </div>
                <div class="col-lg-6">
                    <div class="comparison-card">
                        <h4 class="comparison-title">Import by Region</h4>
                        <div class="comparison-list">
    `;

    comparisonData.imports.forEach((item, index) => {
        html += `
            <div class="comparison-item">
                <div class="comparison-rank">${index + 1}</div>
                <div class="comparison-info">
                    <div class="comparison-name">${item.region}</div>
                    <div class="comparison-value">$${formatNumber(item.value)}M</div>
                </div>
                <div class="comparison-details">
                    <small class="text-muted">${item.share}% | Top: ${item.topCountry}</small>
                </div>
            </div>
        `;
    });

    html += `
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    resultsContainer.innerHTML = html;
}

// Render dashboard charts with loaded data (async version)
async function renderDashboardCharts(data) {
    try {
        console.log('🎨 Starting chart rendering process...');
        isInitializingCharts = true;

        // Use safe chart creation to prevent conflicts
        const chartPromises = [];

        if (document.getElementById('trade-performance-chart')) {
            chartPromises.push(createChartSafely('trade-performance-chart', {
                type: 'line',
                data: {
                    labels: ['Q1 2024', 'Q2 2024', 'Q3 2024', 'Q4 2024'],
                    datasets: [{
                        label: 'Exports',
                        data: [
                            data.trade_overview?.q1_2024_exports || 431.61,
                            data.trade_overview?.q2_2024_exports || 537.64,
                            data.trade_overview?.q3_2024_exports || 667.00,
                            data.trade_overview?.q4_2024_exports || 677.45
                        ],
                        borderColor: '#00A1F1',
                        backgroundColor: 'rgba(0, 161, 241, 0.1)',
                        fill: true,
                        tension: 0.3
                    }, {
                        label: 'Imports',
                        data: [
                            data.trade_overview?.q1_2024_imports || 1410.52,
                            data.trade_overview?.q2_2024_imports || 1568.97,
                            data.trade_overview?.q3_2024_imports || 1751.57,
                            data.trade_overview?.q4_2024_imports || 1629.39
                        ],
                        borderColor: '#FCDD09',
                        backgroundColor: 'rgba(252, 221, 9, 0.1)',
                        fill: true,
                        tension: 0.3
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: true, position: 'top' }
                    },
                    scales: {
                        y: {
                            ticks: { callback: function(value) { return '$' + (value / 1000).toFixed(1) + 'B'; } }
                        }
                    }
                }
            }));
        }

        // Trade balance chart
        if (document.getElementById('trade-balance-chart')) {
            chartPromises.push(createChartSafely('trade-balance-chart', {
                type: 'bar',
                data: {
                    labels: ['Q1 2024', 'Q2 2024', 'Q3 2024', 'Q4 2024'],
                    datasets: [{
                        label: 'Trade Balance',
                        data: [
                            (data.trade_overview?.q1_2024_exports || 431.61) - (data.trade_overview?.q1_2024_imports || 1410.52),
                            (data.trade_overview?.q2_2024_exports || 537.64) - (data.trade_overview?.q2_2024_imports || 1568.97),
                            (data.trade_overview?.q3_2024_exports || 667.00) - (data.trade_overview?.q3_2024_imports || 1751.57),
                            (data.trade_overview?.q4_2024_exports || 677.45) - (data.trade_overview?.q4_2024_imports || 1629.39)
                        ],
                        backgroundColor: ['#ef4444', '#ef4444', '#ef4444', '#ef4444']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: {
                            ticks: { callback: function(value) { return '$' + (value / 1000).toFixed(1) + 'B'; } }
                        }
                    }
                }
            }));
        }

        // Export distribution chart
        if (document.getElementById('export-distribution-chart')) {
            chartPromises.push(createChartSafely('export-distribution-chart', {
                type: 'doughnut',
                data: {
                    labels: ['Other', 'Food & Live Animals', 'Crude Materials', 'Manufactured Goods', 'Minerals'],
                    datasets: [{
                        data: [428.15, 101.12, 58.79, 34.87, 23.40],
                        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'right' }
                    }
                }
            }));
        }

        // Commodity performance chart
        if (document.getElementById('commodity-performance-chart')) {
            chartPromises.push(createChartSafely('commodity-performance-chart', {
                type: 'bar',
                data: {
                    labels: ['Other', 'Food & Live Animals', 'Crude Materials', 'Manufactured Goods', 'Minerals'],
                    datasets: [{
                        label: 'Value (Millions USD)',
                        data: [428.15, 101.12, 58.79, 34.87, 23.40],
                        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: {
                            ticks: { callback: function(value) { return '$' + (value / 1000).toFixed(1) + 'B'; } }
                        }
                    }
                }
            }));
        }

        // Wait for all charts to be created
        await Promise.all(chartPromises);
        console.log('✅ Dashboard charts rendered successfully');
    } catch (error) {
        console.error('❌ Error rendering dashboard charts:', error);
    } finally {
        isInitializingCharts = false;
    }
}

/************************************
 * 13. EXPORT/IMPORT COMPARISON TOOLS *
 ************************************/
function showComparisonModal() {
    // Create comparison modal if it doesn't exist
    if (!document.getElementById('comparison-modal')) {
        const modal = document.createElement('div');
        modal.id = 'comparison-modal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">Export vs Import Comparison</h3>
                    <button class="modal-close" onclick="hideModal('comparison-modal')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="comparison-controls">
                        <div class="row g-3">
                            <div class="col-lg-6">
                                <select class="form-select" id="comparison-period">
                                    <option value="q4_2024">Q4 2024</option>
                                    <option value="q3_2024">Q3 2024</option>
                                    <option value="q2_2024">Q2 2024</option>
                                    <option value="q1_2024">Q1 2024</option>
                                </select>
                            </div>
                            <div class="col-lg-6">
                                <select class="form-select" id="comparison-type">
                                    <option value="countries">By Countries</option>
                                    <option value="commodities">By Commodities</option>
                                    <option value="regions">By Regions</option>
                                </select>
                            </div>
                        </div>
                        <button class="btn btn-primary mt-3" onclick="generateComparison()">
                            <i class="fas fa-chart-bar me-1"></i>Generate Comparison
                        </button>
                    </div>
                    <div class="comparison-results" id="comparison-results">
                        <div class="comparison-placeholder">
                            <i class="fas fa-balance-scale fa-3x mb-3" style="color: var(--rwanda-blue);"></i>
                            <p>Select comparison parameters and click "Generate Comparison" to see detailed export vs import analysis.</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    showModal('comparison-modal');
}

function generateComparison() {
    const period = document.getElementById('comparison-period').value;
    const type = document.getElementById('comparison-type').value;
    const resultsContainer = document.getElementById('comparison-results');

    // Show loading
    resultsContainer.innerHTML = '<div class="text-center"><div class="spinner"></div><p>Generating comparison...</p></div>';

    // Simulate API call delay
    setTimeout(() => {
        if (type === 'countries') {
            renderCountryComparison(period);
        } else if (type === 'commodities') {
            renderCommodityComparison(period);
        } else if (type === 'regions') {
            renderRegionalComparison(period);
        }
    }, 1000);
}

function renderCountryComparison(period) {
    const resultsContainer = document.getElementById('comparison-results');

    // Mock data - in real implementation, this would come from the API
    const comparisonData = {
        exports: [
            { country: 'United Arab Emirates', value: 442.55, change: 15.2 },
            { country: 'Democratic Republic of Congo', value: 84.11, change: 8.7 },
            { country: 'China', value: 20.43, change: -5.4 },
            { country: 'Luxembourg', value: 14.10, change: 12.3 },
            { country: 'United Kingdom', value: 9.31, change: -8.1 }
        ],
        imports: [
            { country: 'China', value: 303.26, change: 2.1 },
            { country: 'Tanzania', value: 298.93, change: 31.4 },
            { country: 'Kenya', value: 211.22, change: 199.0 },
            { country: 'India', value: 101.83, change: -11.7 },
            { country: 'UAE', value: 96.64, change: 11.7 }
        ]
    };

    let html = `
        <div class="comparison-summary">
            <div class="row g-4">
                <div class="col-lg-6">
                    <div class="comparison-card">
                        <h4 class="comparison-title">Top Export Destinations</h4>
                        <div class="comparison-list">
    `;

    comparisonData.exports.forEach((item, index) => {
        const trendClass = item.change >= 0 ? 'trend-up' : 'trend-down';
        const trendIcon = item.change >= 0 ? 'arrow-up' : 'arrow-down';
        html += `
            <div class="comparison-item">
                <div class="comparison-rank">${index + 1}</div>
                <div class="comparison-info">
                    <div class="comparison-name">${item.country}</div>
                    <div class="comparison-value">$${formatNumber(item.value)}M</div>
                </div>
                <div class="comparison-trend ${trendClass}">
                    <i class="fas fa-${trendIcon} me-1"></i>
                    ${Math.abs(item.change)}%
                </div>
            </div>
        `;
    });

    html += `
                        </div>
                    </div>
                </div>
                <div class="col-lg-6">
                    <div class="comparison-card">
                        <h4 class="comparison-title">Top Import Sources</h4>
                        <div class="comparison-list">
    `;

    comparisonData.imports.forEach((item, index) => {
        const trendClass = item.change >= 0 ? 'trend-up' : 'trend-down';
        const trendIcon = item.change >= 0 ? 'arrow-up' : 'arrow-down';
        html += `
            <div class="comparison-item">
                <div class="comparison-rank">${index + 1}</div>
                <div class="comparison-info">
                    <div class="comparison-name">${item.country}</div>
                    <div class="comparison-value">$${formatNumber(item.value)}M</div>
                </div>
                <div class="comparison-trend ${trendClass}">
                    <i class="fas fa-${trendIcon} me-1"></i>
                    ${Math.abs(item.change)}%
                </div>
            </div>
        `;
    });

    html += `
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    resultsContainer.innerHTML = html;
}

function renderCommodityComparison(period) {
    const resultsContainer = document.getElementById('comparison-results');

    // Mock data
    const comparisonData = {
        exports: [
            { commodity: 'Other commodities & transactions', value: 428.15, share: 63.2 },
            { commodity: 'Food and live animals', value: 101.12, share: 14.9 },
            { commodity: 'Crude materials', value: 58.79, share: 8.7 },
            { commodity: 'Manufactured goods', value: 34.87, share: 5.1 },
            { commodity: 'Animals & vegetable oils', value: 23.40, share: 3.5 }
        ],
        imports: [
            { commodity: 'Machinery and transport equipment', value: 238.86, share: 14.7 },
            { commodity: 'Manufactured goods', value: 215.13, share: 13.2 },
            { commodity: 'Food and live animals', value: 234.57, share: 14.4 },
            { commodity: 'Mineral fuels', value: 190.53, share: 11.7 },
            { commodity: 'Chemicals', value: 135.39, share: 8.3 }
        ]
    };

    let html = `
        <div class="comparison-summary">
            <div class="row g-4">
                <div class="col-lg-6">
                    <div class="comparison-card">
                        <h4 class="comparison-title">Top Export Commodities</h4>
                        <div class="comparison-list">
    `;

    comparisonData.exports.forEach((item, index) => {
        html += `
            <div class="comparison-item">
                <div class="comparison-rank">${index + 1}</div>
                <div class="comparison-info">
                    <div class="comparison-name">${item.commodity}</div>
                    <div class="comparison-value">$${formatNumber(item.value)}M</div>
                </div>
                <div class="comparison-share">${item.share}%</div>
            </div>
        `;
    });

    html += `
                        </div>
                    </div>
                </div>
                <div class="col-lg-6">
                    <div class="comparison-card">
                        <h4 class="comparison-title">Top Import Commodities</h4>
                        <div class="comparison-list">
    `;

    comparisonData.imports.forEach((item, index) => {
        html += `
            <div class="comparison-item">
                <div class="comparison-rank">${index + 1}</div>
                <div class="comparison-info">
                    <div class="comparison-name">${item.commodity}</div>
                    <div class="comparison-value">$${formatNumber(item.value)}M</div>
                </div>
                <div class="comparison-share">${item.share}%</div>
            </div>
        `;
    });

    html += `
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    resultsContainer.innerHTML = html;
}

function renderRegionalComparison(period) {
    const resultsContainer = document.getElementById('comparison-results');

    // Mock data
    const comparisonData = {
        exports: [
            { region: 'Asia', value: 499.03, share: 73.7, topCountry: 'UAE' },
            { region: 'Africa', value: 112.92, share: 16.7, topCountry: 'DRC' },
            { region: 'Europe', value: 53.96, share: 8.0, topCountry: 'Luxembourg' },
            { region: 'Americas', value: 10.60, share: 1.6, topCountry: 'USA' },
            { region: 'Oceania', value: 0.92, share: 0.1, topCountry: 'Australia' }
        ],
        imports: [
            { region: 'Asia', value: 671.95, share: 41.2, topCountry: 'China' },
            { region: 'Africa', value: 778.55, share: 47.8, topCountry: 'Tanzania' },
            { region: 'Europe', value: 132.51, share: 8.1, topCountry: 'Germany' },
            { region: 'Americas', value: 37.65, share: 2.3, topCountry: 'USA' },
            { region: 'Oceania', value: 8.73, share: 0.5, topCountry: 'Australia' }
        ]
    };

    let html = `
        <div class="comparison-summary">
            <div class="row g-4">
                <div class="col-lg-6">
                    <div class="comparison-card">
                        <h4 class="comparison-title">Export by Region</h4>
                        <div class="comparison-list">
    `;

    comparisonData.exports.forEach((item, index) => {
        html += `
            <div class="comparison-item">
                <div class="comparison-rank">${index + 1}</div>
                <div class="comparison-info">
                    <div class="comparison-name">${item.region}</div>
                    <div class="comparison-value">$${formatNumber(item.value)}M</div>
                </div>
                <div class="comparison-details">
                    <small class="text-muted">${item.share}% | Top: ${item.topCountry}</small>
                </div>
            </div>
        `;
    });

    html += `
                        </div>
                    </div>
                </div>
                <div class="col-lg-6">
                    <div class="comparison-card">
                        <h4 class="comparison-title">Import by Region</h4>
                        <div class="comparison-list">
    `;

    comparisonData.imports.forEach((item, index) => {
        html += `
            <div class="comparison-item">
                <div class="comparison-rank">${index + 1}</div>
                <div class="comparison-info">
                    <div class="comparison-name">${item.region}</div>
                    <div class="comparison-value">$${formatNumber(item.value)}M</div>
                </div>
                <div class="comparison-details">
                    <small class="text-muted">${item.share}% | Top: ${item.topCountry}</small>
                </div>
            </div>
        `;
    });

    html += `
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    resultsContainer.innerHTML = html;
}

/************************************
 * 12. DEMO & INIT                  *
 ************************************/
window.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing Rwanda Export Explorer (Main.js)...');

    // Prevent multiple initializations
    if (typeof window.mainInitialized !== 'undefined' || typeof window.dashboardInitialized !== 'undefined') {
        console.log('⚠️ Application already initialized, skipping...');
        return;
    }
    window.mainInitialized = true;

    // Prevent dashboard.js from initializing if it's loaded
    window.dashboardInitialized = true;

    showToast('🇷🇼 Welcome to Rwanda Export Explorer!', 'success', 2500);

    // Load Excel analysis on page load
    setTimeout(async () => {
        console.log('📊 Loading Excel analysis...');
        try {
            await loadExcelAnalysis();
        } catch (error) {
            console.warn('⚠️ Excel analysis failed, using fallback data:', error);
            // Use fallback data if analysis fails
            await displayAnalysisResults(getFallbackData());
        }
    }, 500);

    // Test API connectivity first
    setTimeout(async () => {
        console.log('🔍 Testing API connectivity...');
        await testAPIConnection();
    }, 500);

    // Chart rendering with proper timing - load real data
    setTimeout(async () => {
        console.log('🎨 Checking chart containers and loading real data...');
        const chartContainer = document.getElementById('trade-performance-chart');
        if (chartContainer && !chartContainer.querySelector('canvas') && typeof Chart !== 'undefined') {
            console.log('📊 Chart containers found, loading real data...');
            const success = await loadRealTradeData();
            if (success) {
                console.log('✅ Real data loaded successfully');
            } else {
                console.warn('⚠️ Real data loading failed, using fallback');
                await renderFallbackCharts();
            }
        }
    }, 1500);

    // Backup data loading after 4 seconds if first attempt failed
    setTimeout(async () => {
        const chartContainer = document.getElementById('trade-performance-chart');
        if (chartContainer && !chartContainer.querySelector('canvas')) {
            console.log('⚠️ Backup data loading...');
            await loadRealTradeData();
        }
    }, 4000);

    // Final fallback after 6 seconds
    setTimeout(async () => {
        const chartContainer = document.getElementById('trade-performance-chart');
        if (chartContainer && !chartContainer.querySelector('canvas')) {
            console.log('🔄 Final fallback - rendering demo charts...');
            await renderFallbackCharts();
        }
    }, 6000);

    // Demo: Show shimmer on analytics load
    if (analyticsResults) {
        showShimmer('analytics-results');
        setTimeout(() => hideShimmer('analytics-results'), 1200);
    }

    // Keyboard shortcut: Ctrl+E to export analytics
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key.toLowerCase() === 'e') {
            exportAnalyticsToCSV();
        }
    });

    // Keyboard shortcut: Ctrl+P to print current section
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key.toLowerCase() === 'p') {
            const activeSection = document.querySelector('.section.active');
            if (activeSection) printSection(activeSection.id);
        }
    });

    // Keyboard shortcut: Ctrl+R to refresh analysis
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key.toLowerCase() === 'r') {
            loadExcelAnalysis();
        }
    });

    // Keyboard shortcut: Ctrl+C to show comparison tools
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key.toLowerCase() === 'c') {
            showComparisonModal();
        }
    });
});

// Chart registry to prevent duplicate charts
const globalChartRegistry = {};
let isInitializingCharts = false;
let chartInitializationQueue = [];

// Safe chart creation function with improved error handling
function createChartSafely(chartId, chartConfig) {
    return new Promise((resolve, reject) => {
        try {
            // Add to queue if already initializing
            if (isInitializingCharts) {
                chartInitializationQueue.push({ chartId, chartConfig, resolve, reject });
                return;
            }

            // Destroy existing chart if it exists
            if (globalChartRegistry[chartId]) {
                globalChartRegistry[chartId].destroy();
                console.log(`🗑️ Destroyed existing chart: ${chartId}`);
            }

            // Check if canvas exists and Chart.js is loaded
            const canvas = document.getElementById(chartId);
            if (!canvas) {
                console.warn(`⚠️ Canvas not found: ${chartId}`);
                reject(new Error(`Canvas not found: ${chartId}`));
                return;
            }

            if (typeof Chart === 'undefined') {
                console.error('❌ Chart.js library not loaded');
                reject(new Error('Chart.js library not loaded'));
                return;
            }

            // Check if canvas is already in use
            const existingChart = Chart.getChart(canvas);
            if (existingChart) {
                existingChart.destroy();
                console.log(`🗑️ Destroyed existing Chart.js instance for: ${chartId}`);
            }

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                console.error(`❌ Cannot get 2D context for canvas: ${chartId}`);
                reject(new Error(`Cannot get 2D context for canvas: ${chartId}`));
                return;
            }

            const chart = new Chart(ctx, chartConfig);

            // Register the chart
            globalChartRegistry[chartId] = chart;
            console.log(`✅ Chart created successfully: ${chartId}`);

            resolve(chart);

            // Process queue if any
            processChartQueue();

        } catch (error) {
            console.error(`❌ Error creating chart ${chartId}:`, error);
            reject(error);
        }
    });
}

function processChartQueue() {
    if (chartInitializationQueue.length > 0) {
        const next = chartInitializationQueue.shift();
        createChartSafely(next.chartId, next.chartConfig)
            .then(next.resolve)
            .catch(next.reject);
    }
}

// Enhanced data loading function that connects to real processed data
async function loadRealTradeData() {
    try {
        console.log('📊 Loading real trade data from processed files...');

        // Load data from the API endpoints instead of direct file access
        const apiEndpoints = [
            { url: '/api/exports/quarterly', key: 'exports' },
            { url: '/api/imports/quarterly', key: 'imports' },
            { url: '/api/exports/destinations?limit=10', key: 'destinations' },
            { url: '/api/exports/products?limit=10', key: 'products' },
            { url: '/api/imports/sources?limit=10', key: 'importSources' },
            { url: '/api/imports/categories?limit=10', key: 'importCategories' },
            { url: '/api/exports/summary', key: 'exportSummary' },
            { url: '/api/imports/summary', key: 'importSummary' }
        ];

        const loadedData = {};

        // Try to load each API endpoint
        for (const endpoint of apiEndpoints) {
            try {
                const response = await fetch(`http://localhost:3000${endpoint.url}`);
                if (response.ok) {
                    loadedData[endpoint.key] = await response.json();
                    console.log(`✅ Loaded ${endpoint.url}`);
                } else {
                    console.warn(`⚠️ Failed to load ${endpoint.url}: ${response.status}`);
                }
            } catch (error) {
                console.warn(`⚠️ Error loading ${endpoint.url}:`, error.message);
            }
        }

        // If we have API data, use it to populate charts
        if (loadedData['exports'] || loadedData['exportSummary'] || loadedData['destinations']) {
            console.log('✅ Real API data loaded, populating charts...');
            console.log('📊 Available data keys:', Object.keys(loadedData));
            await populateChartsWithAPIData(loadedData);
            return true;
        }

        // Fallback to API endpoints if processed data isn't available
        return await loadFromAPI();

    } catch (error) {
        console.error('❌ Error loading real data:', error);
        return await loadFromAPI();
    }
}

// Load data from API endpoints
async function loadFromAPI() {
    try {
        console.log('🔄 Falling back to API endpoints...');

        // Try to get data from the backend API
        const endpoints = [
            { url: '/api/exports/quarterly', key: 'exports' },
            { url: '/api/imports/quarterly', key: 'imports' },
            { url: '/api/exports/destinations?limit=10', key: 'destinations' },
            { url: '/api/exports/products?limit=10', key: 'products' },
            { url: '/api/imports/sources?limit=10', key: 'importSources' },
            { url: '/api/imports/categories?limit=10', key: 'importCategories' }
        ];

        const apiData = {};

        for (const endpoint of endpoints) {
            try {
                const response = await fetch(`http://localhost:3000${endpoint.url}`);
                if (response.ok) {
                    apiData[endpoint.key] = await response.json();
                    console.log(`✅ Loaded ${endpoint.url}`);
                }
            } catch (error) {
                console.warn(`⚠️ Failed to load ${endpoint.url}:`, error.message);
            }
        }

        if (Object.keys(apiData).length > 0) {
            await populateChartsWithAPIData(apiData);
            return true;
        }

        return false;

    } catch (error) {
        console.error('❌ API loading failed:', error);
        return false;
    }
}

// Populate charts with real API data
async function populateChartsWithRealData(data) {
    try {
        console.log('🎨 Populating charts with real API data...');

        // Extract data from API responses
        let exportsData = [];
        let importsData = [];
        let destinations = [];
        let products = [];
        let importSources = [];
        let importCategories = [];

        // Get data from API responses
        if (data['exports'] && Array.isArray(data['exports'])) {
            exportsData = data['exports'];
        }

        if (data['imports'] && Array.isArray(data['imports'])) {
            importsData = data['imports'];
        }

        if (data['destinations'] && Array.isArray(data['destinations'])) {
            destinations = data['destinations'];
        }

        if (data['products'] && Array.isArray(data['products'])) {
            products = data['products'];
        }

        if (data['importSources'] && Array.isArray(data['importSources'])) {
            importSources = data['importSources'];
        }

        if (data['importCategories'] && Array.isArray(data['importCategories'])) {
            importCategories = data['importCategories'];
        }

        // Update dashboard stats from summary data
        if (data['exportSummary']) {
            updateDashboardStats(data['exportSummary']);
        }

        if (data['importSummary']) {
            updateImportDashboardStats(data['importSummary']);
        }

        // Transform data for charts
        const chartData = {
            exports: exportsData,
            imports: importsData,
            destinations: destinations,
            products: products,
            importSources: importSources,
            importCategories: importCategories
        };

        // Render all dashboard charts
        await renderAllDashboardCharts(chartData);

        // Update dashboard statistics
        updateDashboardFromRealData(chartData);

        console.log('✅ Charts populated with real API data successfully');

    } catch (error) {
        console.error('❌ Error populating charts with real API data:', error);
        throw error;
    }
}

// Populate charts with API data
async function populateChartsWithAPIData(data) {
    try {
        console.log('🎨 Populating charts with API data...');

        const chartData = {
            exports: data.exports || [],
            imports: data.imports || [],
            destinations: data.destinations || [],
            products: data.products || [],
            importSources: data.importSources || [],
            importCategories: data.importCategories || []
        };

        await renderAllDashboardCharts(chartData);
        updateDashboardFromRealData(chartData);

        console.log('✅ Charts populated with API data successfully');

    } catch (error) {
        console.error('❌ Error populating charts with API data:', error);
        throw error;
    }
}

// Render all dashboard charts with provided data
async function renderAllDashboardCharts(data) {
    try {
        console.log('🎨 Rendering all dashboard charts...');

        // Trade Performance Chart
        if (document.getElementById('trade-performance-chart')) {
            const tradeData = transformTradeDataForChart(data.exports, data.imports);
            if (tradeData.labels.length > 0) {
                await createChartSafely('trade-performance-chart', {
                    type: 'line',
                    data: tradeData,
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: true, position: 'top' }
                        },
                        scales: {
                            y: {
                                ticks: { callback: function(value) { return '$' + (value / 1000).toFixed(1) + 'B'; } }
                            }
                        }
                    }
                });
            }
        }

        // Trade Balance Chart
        if (document.getElementById('trade-balance-chart')) {
            const balanceData = calculateTradeBalanceData(data.exports, data.imports);
            if (balanceData.labels.length > 0) {
                await createChartSafely('trade-balance-chart', {
                    type: 'bar',
                    data: balanceData,
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                            y: {
                                ticks: { callback: function(value) { return '$' + (value / 1000).toFixed(1) + 'B'; } }
                            }
                        }
                    }
                });
            }
        }

        // Export Distribution Chart
        if (document.getElementById('export-distribution-chart')) {
            const distributionData = transformDistributionData(data.destinations);
            if (distributionData.labels.length > 0) {
                await createChartSafely('export-distribution-chart', {
                    type: 'doughnut',
                    data: distributionData,
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { position: 'right' }
                        }
                    }
                });
            }
        }

        // Commodity Performance Chart
        if (document.getElementById('commodity-performance-chart')) {
            const commodityData = transformCommodityData(data.products);
            if (commodityData.labels.length > 0) {
                await createChartSafely('commodity-performance-chart', {
                    type: 'bar',
                    data: commodityData,
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                            y: {
                                ticks: { callback: function(value) { return '$' + (value / 1000).toFixed(1) + 'B'; } }
                            }
                        }
                    }
                });
            }
        }

        console.log('✅ All dashboard charts rendered');

    } catch (error) {
        console.error('❌ Error rendering dashboard charts:', error);
        throw error;
    }
}

// Transform trade data for chart display
function transformTradeDataForChart(exportsData, importsData) {
    const labels = [];
    const exports = [];
    const imports = [];

    // Use real API data if available, otherwise use fallback
    if (exportsData && exportsData.length > 0) {
        exportsData.slice(0, 4).forEach(item => {
            labels.push(item.period || 'Q' + (labels.length + 1));
            exports.push(item.exports || 0);
        });
    } else {
        // Fallback data based on API responses from logs
        labels.push('2024Q1', '2024Q2', '2024Q3', '2024Q4');
        exports.push(431.61, 537.64, 667.00, 677.45);
    }

    if (importsData && importsData.length > 0) {
        importsData.slice(0, 4).forEach(item => {
            imports.push(item.imports || 0);
        });
    } else {
        // Fallback data based on API responses from logs
        imports.push(1410.52, 1568.97, 1751.57, 1629.39);
    }

    return { labels, datasets: [
        { label: 'Exports', data: exports, borderColor: '#00A1F1', backgroundColor: 'rgba(0, 161, 241, 0.1)', fill: true },
        { label: 'Imports', data: imports, borderColor: '#FCDD09', backgroundColor: 'rgba(252, 221, 9, 0.1)', fill: true }
    ]};
}

// Calculate trade balance data
function calculateTradeBalanceData(exportsData, importsData) {
    const labels = [];
    const balance = [];

    // Calculate balance from exports and imports
    const periods = Math.min(
        exportsData?.length || 4,
        importsData?.length || 4,
        4
    );

    for (let i = 0; i < periods; i++) {
        const exportVal = exportsData?.[i]?.exports || exportsData?.[i]?.value || [431.61, 537.64, 667.00, 677.45][i] || 0;
        const importVal = importsData?.[i]?.imports || importsData?.[i]?.value || [1410.52, 1568.97, 1751.57, 1629.39][i] || 0;

        labels.push(`Q${i + 1} 2024`);
        balance.push(exportVal - importVal);
    }

    return { labels, datasets: [{ label: 'Trade Balance', data: balance, backgroundColor: balance.map(v => v >= 0 ? '#22c55e' : '#ef4444') }]};
}

// Transform distribution data for charts
function transformDistributionData(destinations) {
    if (!destinations || destinations.length === 0) {
        return {
            labels: ['UAE', 'DRC', 'China', 'Luxembourg', 'UK'],
            datasets: [{ data: [442.55, 84.11, 20.43, 14.10, 9.31], backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'] }]
        };
    }

    return {
        labels: destinations.slice(0, 5).map(d => d.country || 'Unknown'),
        datasets: [{ data: destinations.slice(0, 5).map(d => d.value || 0), backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'] }]
    };
}

// Transform commodity data for charts
function transformCommodityData(products) {
    if (!products || products.length === 0) {
        return {
            labels: ['Other', 'Food & Live Animals', 'Crude Materials', 'Manufactured Goods', 'Minerals'],
            datasets: [{ label: 'Value (Millions USD)', data: [428.15, 101.12, 58.79, 34.87, 23.40], backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'] }]
        };
    }

    return {
        labels: products.slice(0, 5).map(p => p.product || 'Unknown'),
        datasets: [{ label: 'Value (Millions USD)', data: products.slice(0, 5).map(p => p.value || 0), backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'] }]
    };
}

// Update dashboard statistics from real data
function updateDashboardFromRealData(data) {
    try {
        console.log('📊 Updating dashboard statistics...');

        // Update export value
        const totalExports = data.exports?.reduce((sum, item) => sum + (item.exports || item.value || 0), 0) || 677.45;
        const exportsValueEl = document.getElementById('exports-value');
        if (exportsValueEl) {
            exportsValueEl.textContent = `$${formatNumber(totalExports)}M`;
        }

        // Update import value
        const totalImports = data.imports?.reduce((sum, item) => sum + (item.imports || item.value || 0), 0) || 1629.39;
        const importsValueEl = document.getElementById('imports-value');
        if (importsValueEl) {
            importsValueEl.textContent = `$${formatNumber(totalImports)}M`;
        }

        // Update trade balance
        const balance = totalExports - totalImports;
        const balanceValueEl = document.getElementById('balance-value');
        if (balanceValueEl) {
            balanceValueEl.textContent = `$${formatNumber(balance)}M`;
        }

        // Update total trade value
        const totalTrade = totalExports + totalImports;
        const totalTradeEl = document.getElementById('total-trade-value');
        if (totalTradeEl) {
            totalTradeEl.textContent = `$${formatNumber(totalTrade)}M`;
        }

        // Update trading partners count
        const partnersCount = Math.max(data.destinations?.length || 0, data.importSources?.length || 0, 20);
        const partnersEl = document.getElementById('active-partners');
        if (partnersEl) {
            partnersEl.textContent = partnersCount;
        }

        console.log('✅ Dashboard statistics updated');

    } catch (error) {
        console.error('❌ Error updating dashboard statistics:', error);
    }
}

// Update dashboard stats from trade overview data
function updateDashboardStats(tradeOverview) {
    try {
        // Update all the dashboard elements with real data
        const statsElements = {
            'exports-value': tradeOverview.total_export_value,
            'imports-value': tradeOverview.total_import_value,
            'balance-value': tradeOverview.total_export_value - tradeOverview.total_import_value,
            'total-trade-value': tradeOverview.total_export_value + tradeOverview.total_import_value,
            'export-growth': 157.9, // Would need growth calculation
            'active-partners': tradeOverview.total_countries || 134
        };

        Object.entries(statsElements).forEach(([elementId, value]) => {
            const element = document.getElementById(elementId);
            if (element) {
                if (elementId.includes('growth') || elementId.includes('percentage')) {
                    element.textContent = `${value >= 0 ? '+' : ''}${formatNumber(value)}%`;
                } else {
                    element.textContent = `$${formatNumber(value)}M`;
                }
            }
        });

        console.log('✅ Dashboard stats updated from API data');

    } catch (error) {
        console.error('❌ Error updating dashboard stats:', error);
    }
}

// Update import dashboard stats
function updateImportDashboardStats(importSummary) {
    try {
        const importsValueEl = document.getElementById('imports-value');
        if (importsValueEl) {
            importsValueEl.textContent = `$${formatNumber(importSummary.total_import_value)}M`;
        }

        const balanceEl = document.getElementById('balance-value');
        const exportsEl = document.getElementById('exports-value');
        if (balanceEl && exportsEl) {
            const exportsValue = parseFloat(exportsEl.textContent.replace(/[$,M]/g, '')) || 0;
            const importsValue = importSummary.total_import_value || 0;
            const balance = exportsValue - importsValue;
            balanceEl.textContent = `$${formatNumber(balance)}M`;
        }

        console.log('✅ Import dashboard stats updated');

    } catch (error) {
        console.error('❌ Error updating import dashboard stats:', error);
    }
}

// Direct API chart rendering function (updated)
async function renderChartsFromAPI() {
    console.log('🔄 Loading real trade data...');

    try {
        // First test if the backend API is accessible
        const healthResponse = await fetch('http://localhost:3000/api/health');
        if (healthResponse.ok) {
            const healthData = await healthResponse.json();
            console.log('✅ Backend API is accessible:', healthData);
        } else {
            console.warn('⚠️ Backend API health check failed');
        }

        // Load real trade data
        await loadRealTradeData();

    } catch (error) {
        console.error('❌ Error in renderChartsFromAPI:', error);
        // Fallback to demo charts if API fails
        await renderFallbackCharts();
    }
}

// Test API connectivity
async function testAPIConnection() {
    try {
        console.log('🔍 Testing API connectivity...');

        const endpoints = [
            'http://localhost:3000/api/health',
            'http://localhost:3000/api/exports/quarterly',
            'http://localhost:3000/api/exports/destinations?limit=5',
            'http://localhost:3000/api/exports/products?limit=5'
        ];

        const results = {};

        for (const endpoint of endpoints) {
            try {
                const response = await fetch(endpoint);
                results[endpoint] = {
                    status: response.status,
                    ok: response.ok,
                    statusText: response.statusText
                };

                if (response.ok) {
                    const data = await response.json();
                    results[endpoint].dataSize = JSON.stringify(data).length;
                    console.log(`✅ ${endpoint}: ${response.status} - ${results[endpoint].dataSize} bytes`);
                } else {
                    console.warn(`⚠️ ${endpoint}: ${response.status} - ${response.statusText}`);
                }
            } catch (error) {
                results[endpoint] = { error: error.message };
                console.error(`❌ ${endpoint}: ${error.message}`);
            }
        }

        console.log('🔍 API connectivity test complete:', results);
        return results;

    } catch (error) {
        console.error('❌ API connectivity test failed:', error);
        return { error: error.message };
    }
}

// Fallback chart rendering function (async version)
async function renderFallbackCharts() {
    console.log('🔄 Rendering fallback charts...');

    try {
        isInitializingCharts = true;
        const chartPromises = [];

        // Check if chart containers are visible first
        ensureChartContainersVisible();

        // Fallback trade performance chart
        if (document.getElementById('trade-performance-chart')) {
            chartPromises.push(createChartSafely('trade-performance-chart', {
                type: 'line',
                data: {
                    labels: ['Q1 2024', 'Q2 2024', 'Q3 2024', 'Q4 2024'],
                    datasets: [{
                        label: 'Exports',
                        data: [431.61, 537.64, 667.00, 677.45],
                        borderColor: '#00A1F1',
                        backgroundColor: 'rgba(0, 161, 241, 0.1)',
                        fill: true,
                        tension: 0.3
                    }, {
                        label: 'Imports',
                        data: [1410.52, 1568.97, 1751.57, 1629.39],
                        borderColor: '#FCDD09',
                        backgroundColor: 'rgba(252, 221, 9, 0.1)',
                        fill: true,
                        tension: 0.3
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: true, position: 'top' }
                    },
                    scales: {
                        y: {
                            ticks: { callback: function(value) { return '$' + (value / 1000).toFixed(1) + 'B'; } }
                        }
                    }
                }
            }));
        }

        // Fallback trade balance chart
        if (document.getElementById('trade-balance-chart')) {
            chartPromises.push(createChartSafely('trade-balance-chart', {
                type: 'bar',
                data: {
                    labels: ['Q1 2024', 'Q2 2024', 'Q3 2024', 'Q4 2024'],
                    datasets: [{
                        label: 'Trade Balance',
                        data: [-978.91, -1031.33, -1084.57, -951.94],
                        backgroundColor: ['#ef4444', '#ef4444', '#ef4444', '#ef4444']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: {
                            ticks: { callback: function(value) { return '$' + (value / 1000).toFixed(1) + 'B'; } }
                        }
                    }
                }
            }));
        }

        // Fallback export distribution chart
        if (document.getElementById('export-distribution-chart')) {
            chartPromises.push(createChartSafely('export-distribution-chart', {
                type: 'doughnut',
                data: {
                    labels: ['Other', 'Food & Live Animals', 'Crude Materials', 'Manufactured Goods', 'Minerals'],
                    datasets: [{
                        data: [428.15, 101.12, 58.79, 34.87, 23.40],
                        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'right' }
                    }
                }
            }));
        }

        // Fallback commodity performance chart
        if (document.getElementById('commodity-performance-chart')) {
            chartPromises.push(createChartSafely('commodity-performance-chart', {
                type: 'bar',
                data: {
                    labels: ['Other', 'Food & Live Animals', 'Crude Materials', 'Manufactured Goods', 'Minerals'],
                    datasets: [{
                        label: 'Value (Millions USD)',
                        data: [428.15, 101.12, 58.79, 34.87, 23.40],
                        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: {
                            ticks: { callback: function(value) { return '$' + (value / 1000).toFixed(1) + 'B'; } }
                        }
                    }
                }
            }));
        }

        // Wait for all charts to be created
        await Promise.all(chartPromises);
        console.log('✅ Fallback charts rendered successfully');

        // Ensure charts are visible after rendering
        setTimeout(() => {
            ensureChartsVisible();
        }, 100);

    } catch (error) {
        console.error('❌ Error rendering fallback charts:', error);
    } finally {
        isInitializingCharts = false;
    }
}

// Ensure chart containers are visible
function ensureChartContainersVisible() {
    const chartContainers = document.querySelectorAll('.chart-container');
    chartContainers.forEach(container => {
        container.style.display = 'block';
        container.style.visibility = 'visible';
        container.style.opacity = '1';
        container.style.height = 'auto';
        container.style.overflow = 'visible';
    });

    const chartCards = document.querySelectorAll('.chart-card');
    chartCards.forEach(card => {
        card.style.display = 'block';
        card.style.visibility = 'visible';
        card.style.opacity = '1';
    });

    console.log(`🔍 Ensured ${chartContainers.length} chart containers are visible`);
}

// Ensure charts are visible after rendering
function ensureChartsVisible() {
    const canvases = document.querySelectorAll('.chart-container canvas');
    canvases.forEach(canvas => {
        canvas.style.display = 'block';
        canvas.style.visibility = 'visible';
        canvas.style.opacity = '1';

        // Ensure canvas has proper dimensions
        if (canvas.width === 0 || canvas.height === 0) {
            const container = canvas.parentElement;
            if (container) {
                const rect = container.getBoundingClientRect();
                canvas.width = rect.width || 800;
                canvas.height = rect.height || 300;
                console.log(`📏 Resized canvas ${canvas.id} to ${canvas.width}x${canvas.height}`);
            }
        }
    });

    console.log(`✅ Ensured ${canvases.length} chart canvases are visible`);
}

/************************************
  * 12. HACKATHON ENHANCEMENTS       *
  ************************************/

/* PWA Service Worker Registration */
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

/* Enhanced Mobile Features */
function initializeMobileFeatures() {
    // Touch gesture support
    let touchStartY = 0;
    let touchEndY = 0;

    document.addEventListener('touchstart', (e) => {
        touchStartY = e.changedTouches[0].screenY;
    });

    document.addEventListener('touchend', (e) => {
        touchEndY = e.changedTouches[0].screenY;
        handleSwipeGesture();
    });

    function handleSwipeGesture() {
        const swipeThreshold = 50;
        const deltaY = touchStartY - touchEndY;

        if (Math.abs(deltaY) > swipeThreshold) {
            if (deltaY > 0) {
                // Swipe up - could trigger additional features
                showToast('Swipe up detected! More features coming soon.', 'info', 2000);
            } else {
                // Swipe down - could refresh data
                if (confirm('Refresh trade data?')) {
                    loadExcelAnalysis();
                }
            }
        }
    }

    // Viewport height fix for mobile browsers
    function setVH() {
        let vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }

    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', () => {
        setTimeout(setVH, 100);
    });
}

/* Enhanced Performance Monitoring */
function initializePerformanceMonitoring() {
    if ('performance' in window) {
        // Monitor page load performance
        window.addEventListener('load', () => {
            setTimeout(() => {
                const perfData = performance.getEntriesByType('navigation')[0];
                const loadTime = perfData.loadEventEnd - perfData.loadEventStart;
                console.log(`Page load time: ${loadTime}ms`);

                // Show performance indicator in development
                if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                    showPerformanceIndicator(loadTime);
                }
            }, 0);
        });
    }
}

function showPerformanceIndicator(loadTime) {
    const indicator = document.createElement('div');
    indicator.className = 'performance-indicator';
    indicator.innerHTML = `
        <div>Load: ${loadTime.toFixed(0)}ms</div>
        <div>Score: ${getPerformanceScore(loadTime)}</div>
    `;
    document.body.appendChild(indicator);

    setTimeout(() => {
        indicator.remove();
    }, 5000);
}

function getPerformanceScore(loadTime) {
    if (loadTime < 1000) return '🟢 Excellent';
    if (loadTime < 2000) return '🟡 Good';
    if (loadTime < 3000) return '🟠 Fair';
    return '🔴 Poor';
}

/* Enhanced Accessibility Features */
function initializeAccessibilityFeatures() {
    // Keyboard navigation enhancement
    document.addEventListener('keydown', (e) => {
        // Alt + 1-9 to navigate sections
        if (e.altKey && e.key >= '1' && e.key <= '9') {
            e.preventDefault();
            const sectionIndex = parseInt(e.key) - 1;
            const sections = ['home', 'exports', 'imports', 'predictions', 'excel-analysis', 'regional', 'commodities', 'analytics'];
            if (sections[sectionIndex]) {
                showSection(sections[sectionIndex]);
            }
        }

        // Alt + R to refresh data
        if (e.altKey && e.key.toLowerCase() === 'r') {
            e.preventDefault();
            loadExcelAnalysis();
        }

        // Alt + H to show help
        if (e.altKey && e.key.toLowerCase() === 'h') {
            e.preventDefault();
            showAccessibilityHelp();
        }
    });

    // Focus management for modal dialogs
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            // Close any open modals
            document.querySelectorAll('.modal.active').forEach(modal => {
                hideModal(modal.id);
            });
        }
    });

    // Announce dynamic content changes to screen readers
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.id = 'content-announcer';
    document.body.appendChild(announcer);
}

function announceToScreenReader(message) {
    const announcer = document.getElementById('content-announcer');
    if (announcer) {
        announcer.textContent = message;
    }
}

function showAccessibilityHelp() {
    const helpContent = `
        <div class="accessibility-help">
            <h3>Accessibility Features</h3>
            <div class="help-section">
                <h4>Keyboard Navigation</h4>
                <ul>
                    <li><kbd>Alt + 1-9</kbd>: Navigate to different sections</li>
                    <li><kbd>Alt + R</kbd>: Refresh trade data</li>
                    <li><kbd>Alt + H</kbd>: Show this help</li>
                    <li><kbd>Escape</kbd>: Close modals</li>
                    <li><kbd>Tab</kbd>: Navigate through interactive elements</li>
                </ul>
            </div>
            <div class="help-section">
                <h4>Screen Reader Support</h4>
                <ul>
                    <li>All charts have descriptive alt text</li>
                    <li>Dynamic content changes are announced</li>
                    <li>Form labels are properly associated</li>
                    <li>Color contrast meets WCAG guidelines</li>
                </ul>
            </div>
            <div class="help-section">
                <h4>Mobile Features</h4>
                <ul>
                    <li>Touch-friendly interface</li>
                    <li>Swipe gestures supported</li>
                    <li>Responsive design for all screen sizes</li>
                    <li>Optimized for one-handed use</li>
                </ul>
            </div>
        </div>
    `;

    showModal('accessibility-modal', helpContent);
}

/* Enhanced Data Export Features */
function exportToMultipleFormats() {
    const exportOptions = [
        { format: 'PDF', icon: 'file-pdf', action: exportToPDF },
        { format: 'Excel', icon: 'file-excel', action: exportToExcel },
        { format: 'CSV', icon: 'file-csv', action: exportToCSV },
        { format: 'JSON', icon: 'file-code', action: exportToJSON },
        { format: 'Image', icon: 'image', action: exportToImage }
    ];

    const modal = createExportModal(exportOptions);
    showModal('export-modal', modal);
}

function createExportModal(options) {
    return `
        <div class="export-options">
            <h4>Export Data</h4>
            <p>Choose your preferred format:</p>
            <div class="export-grid">
                ${options.map(option => `
                    <button class="export-option" onclick="${option.action.name}()">
                        <i class="fas fa-${option.icon}"></i>
                        <span>${option.format}</span>
                    </button>
                `).join('')}
            </div>
        </div>
    `;
}

function exportToPDF() {
    showToast('PDF export feature coming soon!', 'info');
    hideModal('export-modal');
}

function exportToExcel() {
    showToast('Excel export feature coming soon!', 'info');
    hideModal('export-modal');
}

function exportToJSON() {
    const data = {
        metadata: {
            title: 'Rwanda Export Explorer - Hackathon Data',
            exportDate: new Date().toISOString(),
            source: 'NISR Q4 2024 Trade Report'
        },
        kpis: window.currentKPIs || {},
        opportunities: window.currentOpportunities || []
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rwanda-trade-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);

    showToast('Data exported as JSON!', 'success');
    hideModal('export-modal');
}

/* Enhanced Chart Interactions */
function initializeChartInteractivity() {
    // Add click handlers to chart elements
    document.addEventListener('click', (e) => {
        if (e.target.closest('.chart-container')) {
            const chartElement = e.target.closest('.chart-container');
            const section = chartElement.closest('.section');
            if (section) {
                announceToScreenReader(`Chart in ${section.id} section activated`);
            }
        }
    });

    // Add hover effects for better mobile interaction feedback
    if ('ontouchstart' in window) {
        document.querySelectorAll('.chart-card, .stats-card').forEach(card => {
            card.addEventListener('touchstart', function() {
                this.style.transform = 'translateY(-2px) scale(1.02)';
            });

            card.addEventListener('touchend', function() {
                setTimeout(() => {
                    this.style.transform = '';
                }, 150);
            });
        });
    }
}

/* Enhanced Search with Autocomplete */
function initializeEnhancedSearch() {
    const searchInput = document.getElementById('product-search');
    if (!searchInput) return;

    let searchTimeout;
    const searchResults = [];

    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            performSearch(e.target.value);
        }, 300);
    });

    function performSearch(query) {
        if (query.length < 2) return;

        // Mock search results - in real implementation, this would query the API
        const mockResults = [
            'Coffee', 'Tea', 'Minerals', 'Textiles', 'Machinery',
            'Agricultural Products', 'Manufactured Goods', 'Chemicals'
        ].filter(item => item.toLowerCase().includes(query.toLowerCase()));

        showSearchSuggestions(mockResults);
    }

    function showSearchSuggestions(results) {
        // Remove existing suggestions
        document.querySelectorAll('.search-suggestion').forEach(el => el.remove());

        if (results.length === 0) return;

        const suggestionsContainer = document.createElement('div');
        suggestionsContainer.className = 'search-suggestions';

        results.forEach(result => {
            const suggestion = document.createElement('div');
            suggestion.className = 'search-suggestion';
            suggestion.textContent = result;
            suggestion.addEventListener('click', () => {
                searchInput.value = result;
                suggestionsContainer.remove();
                announceToScreenReader(`Selected ${result}`);
            });
            suggestionsContainer.appendChild(suggestion);
        });

        searchInput.parentNode.appendChild(suggestionsContainer);
    }

    // Hide suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-box')) {
            document.querySelectorAll('.search-suggestions').forEach(el => el.remove());
        }
    });
}

/* Geolocation Features for Mobile */
function initializeGeolocationFeatures() {
    if (!navigator.geolocation) return;

    const locationButton = document.createElement('button');
    locationButton.className = 'btn btn-outline-primary location-btn';
    locationButton.innerHTML = '<i class="fas fa-map-marker-alt"></i> Use My Location';
    locationButton.title = 'Find nearby export opportunities';

    // Add to section actions where appropriate
    const sectionActions = document.querySelector('.section-actions');
    if (sectionActions) {
        const clone = locationButton.cloneNode(true);
        clone.addEventListener('click', getUserLocation);
        sectionActions.appendChild(clone);
    }
}

function getUserLocation() {
    if (!navigator.geolocation) {
        showToast('Geolocation not supported', 'error');
        return;
    }

    showToast('Getting your location...', 'info');

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            showToast(`Location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`, 'success');
            // In a real implementation, this could show nearby trade opportunities
            announceToScreenReader('Location acquired successfully');
        },
        (error) => {
            console.error('Geolocation error:', error);
            showToast('Unable to get location', 'error');
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000
        }
    );
}

/* Enhanced Notification System */
function initializeNotificationSystem() {
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                console.log('Notification permission granted');
            }
        });
    }

    // Show welcome notification
    setTimeout(() => {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Welcome to Rwanda Export Explorer!', {
                body: 'AI-powered trade analytics for Rwanda\'s economic development',
                icon: '/assets/images/favicon.ico',
                badge: '/assets/images/favicon.ico'
            });
        }
    }, 3000);
}

/* Enhanced Data Caching */
function initializeDataCaching() {
    const CACHE_KEY = 'rwanda_trade_data';
    const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

    window.getCachedData = function(key) {
        try {
            const cached = localStorage.getItem(`${CACHE_KEY}_${key}`);
            if (cached) {
                const { data, timestamp } = JSON.parse(cached);
                if (Date.now() - timestamp < CACHE_EXPIRY) {
                    return data;
                } else {
                    localStorage.removeItem(`${CACHE_KEY}_${key}`);
                }
            }
        } catch (e) {
            console.error('Cache read error:', e);
        }
        return null;
    };

    window.setCachedData = function(key, data) {
        try {
            const cacheData = {
                data: data,
                timestamp: Date.now()
            };
            localStorage.setItem(`${CACHE_KEY}_${key}`, JSON.stringify(cacheData));
        } catch (e) {
            console.error('Cache write error:', e);
        }
    };
}

/* Enhanced Error Handling */
function initializeErrorHandling() {
    window.addEventListener('error', (e) => {
        console.error('Global error:', e.error);
        // In production, you might want to send this to an error tracking service
    });

    window.addEventListener('unhandledrejection', (e) => {
        console.error('Unhandled promise rejection:', e.reason);
        e.preventDefault();
    });
}

/* Initialize all enhanced features */
function initializeHackathonFeatures() {
    initializeMobileFeatures();
    initializePerformanceMonitoring();
    initializeAccessibilityFeatures();
    initializeChartInteractivity();
    initializeEnhancedSearch();
    initializeGeolocationFeatures();
    initializeNotificationSystem();
    initializeDataCaching();
    initializeErrorHandling();

    console.log('🚀 Hackathon features initialized successfully');
}

/* Enhanced Demo & Init */
window.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing Rwanda Export Explorer (Main.js)...');

    // Prevent multiple initializations
    if (typeof window.mainInitialized !== 'undefined' || typeof window.dashboardInitialized !== 'undefined') {
        console.log('⚠️ Application already initialized, skipping...');
        return;
    }
    window.mainInitialized = true;

    // Prevent dashboard.js from initializing if it's loaded
    window.dashboardInitialized = true;

    showToast('🇷🇼 Welcome to Rwanda Export Explorer!', 'success', 2500);

    // Initialize hackathon features first
    initializeHackathonFeatures();

    // Load Excel analysis on page load with proper timing
    setTimeout(async () => {
        console.log('📊 Loading Excel analysis...');
        try {
            await loadExcelAnalysis();
            console.log('✅ Excel analysis loaded successfully');

            // Force sections to be visible after loading
            setTimeout(() => {
                forceSectionsVisible();
                hideLoading(); // Ensure loading screen is hidden
            }, 1000);

        } catch (error) {
            console.error('❌ Error loading Excel analysis:', error);
            // Even if there's an error, hide loading and show content
            forceSectionsVisible();
            hideLoading();
        }
    }, 500);

    // Failsafe: hide loading screen after 3 seconds regardless
    setTimeout(() => {
        console.log('⏰ Failsafe: hiding loading screen');
        hideLoading();
        forceSectionsVisible();
    }, 3000);

    // Chart rendering with proper timing - only if dashboard.js hasn't already initialized
    setTimeout(() => {
        console.log('🎨 Checking chart containers...');
        const chartContainer = document.getElementById('trade-performance-chart');
        if (chartContainer && !chartContainer.querySelector('canvas') && typeof Chart !== 'undefined') {
            console.log('📊 Chart containers found, rendering charts...');
            renderFallbackCharts();
        }
    }, 1500);

    // Final fallback after 4 seconds - only if dashboard.js hasn't already initialized
    setTimeout(() => {
        const chartContainer = document.getElementById('trade-performance-chart');
        if (chartContainer && !chartContainer.querySelector('canvas')) {
            console.log('⚠️ Final fallback - rendering charts...');
            renderFallbackCharts();
        }
    }, 4000);

    // Demo: Show shimmer on analytics load
    if (analyticsResults) {
        showShimmer('analytics-results');
        setTimeout(() => hideShimmer('analytics-results'), 1200);
    }

    // Enhanced keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + E to export data
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
            e.preventDefault();
            exportToMultipleFormats();
        }

        // Ctrl/Cmd + P to print current section
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
            e.preventDefault();
            const activeSection = document.querySelector('.section.active');
            if (activeSection) printSection(activeSection.id);
        }

        // Ctrl/Cmd + R to refresh analysis
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'r') {
            e.preventDefault();
            loadExcelAnalysis();
        }

        // Ctrl/Cmd + C to show comparison tools
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
            e.preventDefault();
            showComparisonModal();
        }

        // Ctrl/Cmd + M to toggle mobile view
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'm') {
            e.preventDefault();
            document.body.classList.toggle('mobile-debug');
            showToast('Mobile debug mode toggled', 'info');
        }
    });

    // Add hackathon branding
    const brandElements = document.querySelectorAll('.navbar-brand, .footer-title');
    brandElements.forEach(element => {
        element.classList.add('brand-enhanced');
    });

    // Add NISR badges
    const sectionHeaders = document.querySelectorAll('.section-header');
    sectionHeaders.forEach(header => {
        const badge = document.createElement('div');
        badge.className = 'nisr-badge';
        badge.innerHTML = '<i class="fas fa-database"></i> NISR Data';
        header.appendChild(badge);
    });
});

/************************************
  * 13. EXTENSIBILITY                *
  ************************************/
// Add more UI logic, event handlers, or integrations as needed
// Example: Export data, print, advanced analytics, etc.
// ...

/************************************
 * END OF MAIN.JS                   *
 ************************************/
