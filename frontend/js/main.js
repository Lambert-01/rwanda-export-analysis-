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
    showToast('🇷🇼 Welcome to Rwanda Export Explorer - Hackathon Edition!', 'success', 3000);

    // Load Excel analysis on page load
    loadExcelAnalysis();

    // Initialize hackathon features
    initializeHackathonFeatures();

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
