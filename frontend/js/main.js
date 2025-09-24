/* =====================================================================
   RWANDA EXPORT EXPLORER - MAIN.JS
   Pro-level dashboard interactivity, navigation, and UI logic
   ===================================================================== */

/************************************
 * 1. NAVIGATION & SECTION CONTROL  *
 ************************************/
const navLinks = document.querySelectorAll('.nav-link[data-section]');
const sections = document.querySelectorAll('.section');
function showSection(sectionId) {
    sections.forEach(sec => sec.classList.remove('active'));
    const target = document.getElementById(sectionId);
    if (target) target.classList.add('active');
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
        const section = this.getAttribute('data-section');
        showSection(section);
        window.location.hash = section;
    });
});
window.addEventListener('hashchange', () => {
    const hash = window.location.hash.replace('#', '');
    if (hash) showSection(hash);
});
if (window.location.hash) {
    showSection(window.location.hash.replace('#', ''));
} else {
    showSection('home');
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
        showGlobalLoading();
        showToast('Analyzing Rwanda trade data...', 'info', 2000);

        const results = await getAnalysisResults();
        displayAnalysisResults(results.data);

        showToast('Analysis complete! Data loaded successfully.', 'success', 3000);
        hideGlobalLoading();

    } catch (error) {
        console.error('Error loading Excel analysis:', error);
        showToast('Failed to load analysis data. Please try again.', 'error', 4000);
        hideGlobalLoading();
    }
}

function displayAnalysisResults(data) {
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
    showToast('Welcome to Rwanda Export Explorer!', 'success', 2500);

    // Load Excel analysis on page load
    loadExcelAnalysis();

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

/************************************
 * 12. EXTENSIBILITY                *
 ************************************/
// Add more UI logic, event handlers, or integrations as needed
// Example: Export data, print, advanced analytics, etc.
// ...

/************************************
 * END OF MAIN.JS                   *
 ************************************/
