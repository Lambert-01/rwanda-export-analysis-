/* =====================================================================
    RWANDA EXPORT EXPLORER - ENHANCED CHARTS.JS
    Pro-level Chart.js dashboard script with AI forecasting and advanced visualizations
    ===================================================================== */

/************************************
 * 1. GLOBAL CHART.JS CONFIGURATION *
 ************************************/
// Set Chart.js global defaults for a modern look
Chart.defaults.font.family = 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, sans-serif';
Chart.defaults.color = '#1a365d';
Chart.defaults.plugins.legend.labels.boxWidth = 18;
Chart.defaults.plugins.legend.labels.boxHeight = 18;
Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(44,62,80,0.95)';
Chart.defaults.plugins.tooltip.titleColor = '#fff';
Chart.defaults.plugins.tooltip.bodyColor = '#fff';
Chart.defaults.plugins.tooltip.borderColor = '#2d7dd2';
Chart.defaults.plugins.tooltip.borderWidth = 1;
Chart.defaults.plugins.tooltip.cornerRadius = 8;
Chart.defaults.plugins.tooltip.padding = 12;
Chart.defaults.plugins.tooltip.displayColors = true;
Chart.defaults.plugins.tooltip.caretSize = 8;
Chart.defaults.plugins.tooltip.caretPadding = 8;
Chart.defaults.plugins.tooltip.titleFont = { weight: 'bold', size: 16 };
Chart.defaults.plugins.tooltip.bodyFont = { size: 14 };
Chart.defaults.plugins.legend.position = 'top';
Chart.defaults.plugins.legend.align = 'center';
Chart.defaults.plugins.legend.labels.font = { weight: '600', size: 14 };
Chart.defaults.plugins.legend.labels.color = '#1a365d';
Chart.defaults.plugins.title.display = false;
Chart.defaults.responsive = true;
Chart.defaults.maintainAspectRatio = false;
Chart.defaults.layout.padding = 0;
Chart.defaults.elements.line.tension = 0.35;
Chart.defaults.elements.line.borderWidth = 3;
Chart.defaults.elements.point.radius = 5;
Chart.defaults.elements.point.hoverRadius = 8;
Chart.defaults.elements.bar.borderRadius = 8;
Chart.defaults.elements.bar.borderSkipped = false;

/************************************
 * 2. UTILITY FUNCTIONS             *
 ************************************/
// Generate a linear gradient for chart backgrounds
function createGradient(ctx, area, color1, color2) {
    const gradient = ctx.createLinearGradient(0, area.bottom, 0, area.top);
    gradient.addColorStop(0, color1);
    gradient.addColorStop(1, color2);
    return gradient;
}
// Format large numbers (e.g., 1,000,000 -> 1M)
function formatNumber(num) {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num;
}
// Random color generator for demo
function randomColor() {
    const colors = ['#2d7dd2', '#f7931e', '#22c55e', '#ef4444', '#06b6d4', '#1a365d'];
    return colors[Math.floor(Math.random() * colors.length)];
}

/************************************
 * 3. CHART REGISTRY & MANAGEMENT   *
 ************************************/
const chartRegistry = {};
function destroyChart(id) {
    if (chartRegistry[id]) {
        chartRegistry[id].destroy();
        delete chartRegistry[id];
    }
}
function registerChart(id, chart) {
    destroyChart(id);
    chartRegistry[id] = chart;
}

/************************************
 * 4. DASHBOARD CHARTS SETUP        *
 ************************************/
// 4.1 Trade Performance Over Time (Line Chart)
function renderTradePerformanceChart(data) {
    const ctx = document.getElementById('trade-performance-chart').getContext('2d');
    const area = ctx.canvas;
    const gradient = createGradient(ctx, area, '#2d7dd2', '#f7931e');
    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [
                {
                    label: 'Exports',
                    data: data.exports,
                    fill: true,
                    backgroundColor: createGradient(ctx, area, 'rgba(45,125,210,0.15)', 'rgba(247,147,30,0.05)'),
                    borderColor: '#2d7dd2',
                    pointBackgroundColor: '#2d7dd2',
                    tension: 0.35,
                },
                {
                    label: 'Imports',
                    data: data.imports,
                    fill: true,
                    backgroundColor: createGradient(ctx, area, 'rgba(239,68,68,0.12)', 'rgba(45,125,210,0.03)'),
                    borderColor: '#ef4444',
                    pointBackgroundColor: '#ef4444',
                    tension: 0.35,
                },
                {
                    label: 'Trade Balance',
                    data: data.balance,
                    fill: false,
                    borderColor: '#22c55e',
                    pointBackgroundColor: '#22c55e',
                    borderDash: [6, 6],
                    tension: 0.35,
                }
            ]
        },
        options: {
            plugins: {
                legend: { display: true },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + formatNumber(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { font: { weight: '600' } }
                },
                y: {
                    grid: { color: '#e2e8f0' },
                    ticks: {
                        callback: formatNumber,
                        font: { weight: '600' }
                    }
                }
            },
            animation: {
                duration: 1200,
                easing: 'easeOutQuart'
            }
        }
    });
    registerChart('trade-performance-chart', chart);
}

// 4.2 Trade Balance Trend (Bar Chart)
function renderTradeBalanceChart(data) {
    const ctx = document.getElementById('trade-balance-chart').getContext('2d');
    const area = ctx.canvas;
    const chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.labels,
            datasets: [
                {
                    label: 'Trade Balance',
                    data: data.balance,
                    backgroundColor: data.balance.map(v => v >= 0 ? '#22c55e' : '#ef4444'),
                    borderRadius: 8,
                }
            ]
        },
        options: {
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'Balance: ' + formatNumber(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { font: { weight: '600' } }
                },
                y: {
                    grid: { color: '#e2e8f0' },
                    ticks: {
                        callback: formatNumber,
                        font: { weight: '600' }
                    }
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeOutCubic'
            }
        }
    });
    registerChart('trade-balance-chart', chart);
}

// 4.3 Export Products (Pie Chart)
function renderExportProductsChart(data) {
    const ctx = document.getElementById('export-products-chart').getContext('2d');
    const chart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: data.labels,
            datasets: [
                {
                    data: data.values,
                    backgroundColor: data.colors || data.labels.map(() => randomColor()),
                    borderWidth: 2,
                    borderColor: '#fff',
                }
            ]
        },
        options: {
            plugins: {
                legend: { display: true, position: 'right' },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed;
                            return label + ': ' + formatNumber(value);
                        }
                    }
                }
            },
            animation: {
                animateRotate: true,
                animateScale: true,
                duration: 1200
            }
        }
    });
    registerChart('export-products-chart', chart);
}

// 4.4 Export Growth by Quarter (Bar Chart)
function renderExportGrowthChart(data) {
    const ctx = document.getElementById('export-growth-chart').getContext('2d');
    const chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.labels,
            datasets: [
                {
                    label: 'Growth Rate',
                    data: data.growth,
                    backgroundColor: data.growth.map(v => v >= 0 ? '#22c55e' : '#ef4444'),
                    borderRadius: 8,
                }
            ]
        },
        options: {
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'Growth: ' + context.parsed.y.toFixed(2) + '%';
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { font: { weight: '600' } }
                },
                y: {
                    grid: { color: '#e2e8f0' },
                    ticks: {
                        callback: function(val) { return val + '%'; },
                        font: { weight: '600' }
                    }
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeOutCubic'
            }
        }
    });
    registerChart('export-growth-chart', chart);
}

// 4.5 Import Sources (Doughnut Chart)
function renderImportSourcesChart(data) {
    const ctx = document.getElementById('import-sources-chart').getContext('2d');
    const chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.labels,
            datasets: [
                {
                    data: data.values,
                    backgroundColor: data.colors || data.labels.map(() => randomColor()),
                    borderWidth: 2,
                    borderColor: '#fff',
                }
            ]
        },
        options: {
            cutout: '70%',
            plugins: {
                legend: { display: true, position: 'bottom' },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed;
                            return label + ': ' + formatNumber(value);
                        }
                    }
                }
            },
            animation: {
                animateRotate: true,
                animateScale: true,
                duration: 1200
            }
        }
    });
    registerChart('import-sources-chart', chart);
}

// 4.6 Import Categories (Bar Chart)
function renderImportCategoriesChart(data) {
    const ctx = document.getElementById('import-categories-chart').getContext('2d');
    const chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.labels,
            datasets: [
                {
                    label: 'Import Value',
                    data: data.values,
                    backgroundColor: data.colors || data.labels.map(() => randomColor()),
                    borderRadius: 8,
                }
            ]
        },
        options: {
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'Value: ' + formatNumber(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { font: { weight: '600' } }
                },
                y: {
                    grid: { color: '#e2e8f0' },
                    ticks: {
                        callback: formatNumber,
                        font: { weight: '600' }
                    }
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeOutCubic'
            }
        }
    });
    registerChart('import-categories-chart', chart);
}

// 4.7 AI Predictions (Enhanced Line Chart with Forecasting)
function renderPredictionsChart(data) {
    const ctx = document.getElementById('predictions-chart').getContext('2d');
    const area = ctx.canvas;
    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [
                {
                    label: 'Historical Data',
                    data: data.historical,
                    fill: false,
                    borderColor: '#2d7dd2',
                    pointBackgroundColor: '#2d7dd2',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    tension: 0.35,
                    borderWidth: 3,
                },
                {
                    label: 'AI Forecast',
                    data: data.forecast,
                    fill: true,
                    backgroundColor: createGradient(ctx, area, 'rgba(34,197,94,0.2)', 'rgba(34,197,94,0.05)'),
                    borderColor: '#22c55e',
                    pointBackgroundColor: '#22c55e',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    borderDash: [8, 4],
                    tension: 0.35,
                    borderWidth: 3,
                },
                {
                    label: 'Confidence Interval',
                    data: data.confidence,
                    fill: '+1',
                    backgroundColor: createGradient(ctx, area, 'rgba(34,197,94,0.1)', 'rgba(34,197,94,0.02)'),
                    borderColor: '#22c55e',
                    pointRadius: 0,
                    borderWidth: 1,
                    tension: 0.35,
                }
            ]
        },
        options: {
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: { size: 12, weight: '600' }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0,0,0,0.9)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#22c55e',
                    borderWidth: 1,
                    cornerRadius: 12,
                    displayColors: true,
                    callbacks: {
                        title: function(context) {
                            return `Period: ${context[0].label}`;
                        },
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) label += ': ';
                            label += formatNumber(context.parsed.y);
                            if (context.datasetIndex === 1) {
                                label += ' (AI Predicted)';
                            }
                            return label;
                        }
                    }
                },
                annotation: {
                    annotations: {
                        forecastLine: {
                            type: 'line',
                            xMin: data.forecastStart,
                            xMax: data.forecastStart,
                            borderColor: 'rgba(255, 193, 7, 0.8)',
                            borderWidth: 2,
                            borderDash: [6, 6],
                            label: {
                                content: 'Forecast Start',
                                enabled: true,
                                position: 'top',
                                backgroundColor: 'rgba(255, 193, 7, 0.9)',
                                color: '#000',
                                font: { size: 11, weight: 'bold' }
                            }
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false, color: '#e2e8f0' },
                    ticks: { font: { weight: '600', size: 11 }, color: '#64748b' }
                },
                y: {
                    grid: { color: '#e2e8f0', lineWidth: 1 },
                    ticks: {
                        callback: formatNumber,
                        font: { weight: '600', size: 11 },
                        color: '#64748b'
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            },
            animation: {
                duration: 1500,
                easing: 'easeOutQuart'
            }
        }
    });
    registerChart('predictions-chart', chart);
}

// 4.8 Regional Analysis Chart (Radar Chart)
function renderRegionalChart(data) {
    const ctx = document.getElementById('regional-chart').getContext('2d');
    const chart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: data.labels,
            datasets: [
                {
                    label: 'Export Performance',
                    data: data.exportValues,
                    backgroundColor: 'rgba(45, 125, 210, 0.2)',
                    borderColor: '#2d7dd2',
                    borderWidth: 3,
                    pointBackgroundColor: '#2d7dd2',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                },
                {
                    label: 'Growth Rate',
                    data: data.growthRates,
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    borderColor: '#22c55e',
                    borderWidth: 2,
                    pointBackgroundColor: '#22c55e',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                }
            ]
        },
        options: {
            plugins: {
                legend: { display: true },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + context.parsed.r.toFixed(2);
                        }
                    }
                }
            },
            scales: {
                r: {
                    grid: { color: '#e2e8f0' },
                    pointLabels: { font: { size: 12, weight: '600' }, color: '#1a365d' },
                    ticks: { display: false },
                    beginAtZero: true
                }
            },
            animation: {
                duration: 1200,
                easing: 'easeOutCubic'
            }
        }
    });
    registerChart('regional-chart', chart);
}

// 4.9 Commodity Analysis Chart (Treemap-like visualization)
function renderCommodityChart(data) {
    const ctx = document.getElementById('commodity-chart').getContext('2d');
    const chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.labels,
            datasets: [
                {
                    data: data.values,
                    backgroundColor: data.colors,
                    borderWidth: 2,
                    borderColor: '#fff',
                    hoverBorderWidth: 3,
                    hoverBorderColor: '#1a365d',
                    cutout: '40%',
                }
            ]
        },
        options: {
            plugins: {
                legend: {
                    display: true,
                    position: 'right',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        font: { size: 11, weight: '600' }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${formatNumber(value)}M (${percentage}%)`;
                        }
                    }
                }
            },
            animation: {
                animateRotate: true,
                animateScale: true,
                duration: 1500,
                easing: 'easeOutQuart'
            }
        }
    });
    registerChart('commodity-chart', chart);
}

// 4.10 Advanced Analytics Chart (Mixed Chart Type)
function renderAdvancedAnalyticsChart(data) {
    const ctx = document.getElementById('advanced-analytics-chart').getContext('2d');
    const chart = new Chart(ctx, {
        data: {
            labels: data.labels,
            datasets: [
                {
                    type: 'bar',
                    label: 'Export Volume',
                    data: data.exportVolumes,
                    backgroundColor: 'rgba(45, 125, 210, 0.8)',
                    borderColor: '#2d7dd2',
                    borderWidth: 1,
                    borderRadius: 6,
                    borderSkipped: false,
                    yAxisID: 'y',
                },
                {
                    type: 'line',
                    label: 'Growth Rate (%)',
                    data: data.growthRates,
                    backgroundColor: 'rgba(34, 197, 94, 0.2)',
                    borderColor: '#22c55e',
                    borderWidth: 3,
                    pointBackgroundColor: '#22c55e',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    tension: 0.3,
                    yAxisID: 'y1',
                },
                {
                    type: 'line',
                    label: 'Market Share (%)',
                    data: data.marketShares,
                    backgroundColor: 'rgba(247, 147, 30, 0.2)',
                    borderColor: '#f7931e',
                    borderWidth: 3,
                    pointBackgroundColor: '#f7931e',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    tension: 0.3,
                    yAxisID: 'y1',
                }
            ]
        },
        options: {
            plugins: {
                legend: { display: true },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) label += ': ';
                            if (context.dataset.yAxisID === 'y') {
                                label += formatNumber(context.parsed.y) + 'M';
                            } else {
                                label += context.parsed.y.toFixed(2) + '%';
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { font: { weight: '600', size: 11 } }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    grid: { color: '#e2e8f0' },
                    ticks: {
                        callback: function(value) { return formatNumber(value) + 'M'; },
                        font: { weight: '600', size: 11 }
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    grid: { drawOnChartArea: false, color: '#e2e8f0' },
                    ticks: {
                        callback: function(value) { return value.toFixed(1) + '%'; },
                        font: { weight: '600', size: 11 }
                    }
                }
            },
            interaction: {
                mode: 'index',
                intersect: false
            },
            animation: {
                duration: 1200,
                easing: 'easeOutQuart'
            }
        }
    });
    registerChart('advanced-analytics-chart', chart);
}

/************************************
 * 5. DYNAMIC DATA LOADING          *
 ************************************/
// Example: Fetch data from backend API and render charts
async function fetchAndRenderAllCharts() {
    // Trade Performance
    const tradeRes = await fetch('/api/exports/quarterly');
    const tradeData = await tradeRes.json();
    renderTradePerformanceChart(tradeData);

    // Trade Balance
    const balanceRes = await fetch('/api/analytics/growth');
    const balanceData = await balanceRes.json();
    renderTradeBalanceChart(balanceData);

    // Export Products
    const productsRes = await fetch('/api/exports/products');
    const productsData = await productsRes.json();
    renderExportProductsChart(productsData);

    // Export Growth
    const growthRes = await fetch('/api/analytics/growth');
    const growthData = await growthRes.json();
    renderExportGrowthChart(growthData);

    // Import Sources
    const importSourcesRes = await fetch('/api/imports/sources');
    const importSourcesData = await importSourcesRes.json();
    renderImportSourcesChart(importSourcesData);

    // Import Categories
    const importCategoriesRes = await fetch('/api/imports/categories');
    const importCategoriesData = await importCategoriesRes.json();
    renderImportCategoriesChart(importCategoriesData);

    // Predictions
    const predictionsRes = await fetch('/api/predictions/next');
    const predictionsData = await predictionsRes.json();
    renderPredictionsChart(predictionsData);
}

/************************************
 * 6. INTERACTIVITY & FILTERS       *
 ************************************/
// Example: Chart filter buttons
const chartFilterButtons = document.querySelectorAll('.chart-controls button');
chartFilterButtons.forEach(btn => {
    btn.addEventListener('click', function() {
        chartFilterButtons.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        // Example: Switch between quarterly/yearly
        if (this.dataset.chart === 'quarterly') {
            fetchAndRenderAllCharts(); // Replace with quarterly data fetch
        } else if (this.dataset.chart === 'yearly') {
            // Fetch and render yearly data
        }
    });
});

/************************************
 * 7. EXPORT/IMAGE DOWNLOAD         *
 ************************************/
function downloadChartImage(chartId, filename) {
    const chart = chartRegistry[chartId];
    if (!chart) return;
    const link = document.createElement('a');
    link.href = chart.toBase64Image();
    link.download = filename || 'chart.png';
    link.click();
}

/************************************
 * 8. ACCESSIBILITY & ARIA          *
 ************************************/
// Add ARIA labels to chart canvases
function setChartAriaLabels() {
    const charts = document.querySelectorAll('canvas');
    charts.forEach(canvas => {
        canvas.setAttribute('role', 'img');
        canvas.setAttribute('aria-label', 'Data chart for Rwanda Export Explorer');
        canvas.setAttribute('tabindex', '0');
    });
}

/************************************
 * 9. INIT & DEMO DATA (OPTIONAL)   *
 ************************************/
// Demo: Render charts with sample data if API is not available
function renderDemoCharts() {
    renderTradePerformanceChart({
        labels: ['Q1', 'Q2', 'Q3', 'Q4'],
        exports: [120, 180, 240, 300],
        imports: [200, 220, 260, 320],
        balance: [-80, -40, -20, -20]
    });
    renderTradeBalanceChart({
        labels: ['Q1', 'Q2', 'Q3', 'Q4'],
        balance: [-80, -40, -20, -20]
    });
    renderExportProductsChart({
        labels: ['Coffee', 'Tea', 'Minerals', 'Flowers', 'Other'],
        values: [120, 90, 60, 30, 20]
    });
    renderExportGrowthChart({
        labels: ['Q1', 'Q2', 'Q3', 'Q4'],
        growth: [5.2, 7.8, 6.1, 8.3]
    });
    renderImportSourcesChart({
        labels: ['China', 'Tanzania', 'Kenya', 'India', 'UAE'],
        values: [100, 80, 60, 40, 20]
    });
    renderImportCategoriesChart({
        labels: ['Machinery', 'Food', 'Chemicals', 'Textiles', 'Other'],
        values: [60, 50, 40, 30, 20]
    });
    renderPredictionsChart({
        labels: ['Q1', 'Q2', 'Q3', 'Q4', 'Q1 (Next)'],
        actual: [120, 180, 240, 300, null],
        predicted: [null, null, null, 300, 340]
    });
}

/************************************
 * 10. ON LOAD                      *
 ************************************/
document.addEventListener('DOMContentLoaded', function() {
    // Try to fetch real data, fallback to demo
    fetchAndRenderAllCharts().catch(renderDemoCharts);
    setChartAriaLabels();
});

/************************************
 * 11. EXTENSIBILITY                *
 ************************************/
// Add more chart types, overlays, or custom plugins as needed
// Example: Radar, Polar, Mixed, Map overlays, etc.
// ...

/************************************
 * END OF CHARTS.JS                 *
 ************************************/
