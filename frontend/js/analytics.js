/* =====================================================================
  Rwanda trade analysis system - ANALYTICS.JS (PROFESSIONAL REBUILD)
   Advanced Statistical Analysis & AI-Powered Forecasting
   ===================================================================== */

class AdvancedAnalyticsEngine {
    constructor() {
        this.data = {
            timeSeries: null,
            comprehensive: null
        };
        this.charts = {};
        this.init();
    }

    async init() {
        console.log('🚀 Initializing Advanced Analytics Engine...');
        this.showLoading();
        await this.loadAnalysisData();
        this.renderDashboard();
        this.hideLoading();
    }

    showLoading() {
        const loadingEl = document.getElementById('loading-screen');
        if (loadingEl) {
            loadingEl.classList.remove('hidden');
            loadingEl.style.display = 'flex';
        }
    }

    hideLoading() {
        const loadingEl = document.getElementById('loading-screen');
        if (loadingEl) {
            setTimeout(() => {
                loadingEl.classList.add('hidden');
                loadingEl.style.display = 'none';
            }, 600);
        }
    }

    async loadAnalysisData() {
        try {
            console.log('📊 Loading comprehensive analysis data...');
            
            const [timeSeriesRes, comprehensiveRes] = await Promise.all([
                fetch('/data/processed/enhanced_time_series_analysis_20251009_181029.json'),
                fetch('/data/processed/comprehensive_trade_analysis_20251009_181031.json')
            ]);

            this.data.timeSeries = await timeSeriesRes.json();
            this.data.comprehensive = await comprehensiveRes.json();

            console.log('✅ Analysis data loaded successfully');
            console.log('📈 Time Series Analysis:', this.data.timeSeries);
            console.log('📊 Comprehensive Analysis:', this.data.comprehensive);

        } catch (error) {
            console.error('❌ Error loading analysis data:', error);
            this.showError('Failed to load analysis data');
        }
    }

    renderDashboard() {
        console.log('🎨 Rendering Advanced Analytics Dashboard...');
        
        this.renderOverviewMetrics();
        this.renderStatisticalAnalysis();
        this.renderForecastingSection();
        this.renderVolatilityAnalysis();
        this.renderTrendAnalysis();
        this.renderDistributionAnalysis();
        this.renderAIRecommendations();
        this.renderAllCharts();
        
        console.log('✅ Analytics dashboard rendered successfully');
    }

    renderOverviewMetrics() {
        const ts = this.data.timeSeries;
        if (!ts) return;

        // Exports Metrics
        const exportStats = ts.exports_analysis?.statistical_analysis?.basic_statistics;
        if (exportStats) {
            this.updateElement('exports-mean', `$${exportStats.mean.toFixed(2)}M`);
            this.updateElement('exports-median', `$${exportStats.median.toFixed(2)}M`);
            this.updateElement('exports-std', `${exportStats.std.toFixed(2)}M`);
            this.updateElement('exports-range', `$${exportStats.range.toFixed(2)}M`);
        }

        // Imports Metrics
        const importStats = ts.imports_analysis?.statistical_analysis?.basic_statistics;
        if (importStats) {
            this.updateElement('imports-mean', `$${importStats.mean.toFixed(2)}M`);
            this.updateElement('imports-median', `$${importStats.median.toFixed(2)}M`);
            this.updateElement('imports-std', `${importStats.std.toFixed(2)}M`);
            this.updateElement('imports-range', `$${importStats.range.toFixed(2)}M`);
        }

        // Trade Balance Metrics
        const balanceStats = ts.trade_balance_analysis?.statistical_analysis?.basic_statistics;
        if (balanceStats) {
            this.updateElement('balance-mean', `$${Math.abs(balanceStats.mean).toFixed(2)}M`);
            this.updateElement('balance-median', `$${Math.abs(balanceStats.median).toFixed(2)}M`);
            this.updateElement('balance-std', `${balanceStats.std.toFixed(2)}M`);
            this.updateElement('balance-trend', balanceStats.mean < 0 ? 'Deficit' : 'Surplus');
        }

        // Volatility Metrics
        const exportVol = ts.exports_analysis?.statistical_analysis?.volatility_analysis;
        const importVol = ts.imports_analysis?.statistical_analysis?.volatility_analysis;
        
        if (exportVol) {
            this.updateElement('exports-volatility', `${exportVol.volatility.toFixed(2)}%`);
            this.updateElement('exports-mean-return', `${exportVol.mean_return.toFixed(2)}%`);
        }
        
        if (importVol) {
            this.updateElement('imports-volatility', `${importVol.volatility.toFixed(2)}%`);
            this.updateElement('imports-mean-return', `${importVol.mean_return.toFixed(2)}%`);
        }
    }

    renderStatisticalAnalysis() {
        const container = document.getElementById('statistical-analysis');
        if (!container) return;

        const ts = this.data.timeSeries;
        const exportStats = ts.exports_analysis?.statistical_analysis;
        const importStats = ts.imports_analysis?.statistical_analysis;

        let html = '<div class="row g-4">';

        // Exports Statistical Card
        html += this.createStatisticalCard('Exports', exportStats, 'success');
        
        // Imports Statistical Card
        html += this.createStatisticalCard('Imports', importStats, 'primary');
        
        // Trade Balance Statistical Card
        const balanceStats = ts.trade_balance_analysis?.statistical_analysis;
        html += this.createStatisticalCard('Trade Balance', balanceStats, 'warning');

        html += '</div>';
        container.innerHTML = html;
    }

    createStatisticalCard(title, stats, colorClass) {
        if (!stats) return '';

        const basic = stats.basic_statistics;
        const trend = stats.trend_analysis;
        const distrib = stats.distribution_tests;
        const stationarity = stats.stationarity_tests;

        return `
            <div class="col-lg-4 col-md-6">
                <div class="statistical-card ${colorClass}">
                    <div class="card-header">
                        <h3><i class="fas fa-chart-line me-2"></i>${title} Analysis</h3>
                    </div>
                    <div class="card-body">
                        <div class="stat-grid">
                            <div class="stat-item">
                                <label>Mean</label>
                                <strong>$${Math.abs(basic.mean).toFixed(2)}M</strong>
                            </div>
                            <div class="stat-item">
                                <label>Median</label>
                                <strong>$${Math.abs(basic.median).toFixed(2)}M</strong>
                            </div>
                            <div class="stat-item">
                                <label>Std Dev</label>
                                <strong>${basic.std.toFixed(2)}M</strong>
                            </div>
                            <div class="stat-item">
                                <label>Range</label>
                                <strong>$${basic.range.toFixed(2)}M</strong>
                            </div>
                            <div class="stat-item">
                                <label>Skewness</label>
                                <strong>${basic.skewness.toFixed(3)}</strong>
                            </div>
                            <div class="stat-item">
                                <label>Kurtosis</label>
                                <strong>${basic.kurtosis.toFixed(3)}</strong>
                            </div>
                        </div>
                        
                        <div class="trend-info">
                            <h4><i class="fas fa-trending-${trend.trend_direction === 'increasing' ? 'up' : 'down'} me-2"></i>Trend Analysis</h4>
                            <p><strong>Direction:</strong> ${trend.trend_direction.toUpperCase()}</p>
                            <p><strong>Strength:</strong> ${(trend.trend_strength * 100).toFixed(2)}%</p>
                            <p><strong>R²:</strong> ${trend.r_squared.toFixed(4)}</p>
                            <p><strong>Significant:</strong> <span class="badge bg-${trend.significant === 'True' ? 'success' : 'secondary'}">${trend.significant}</span></p>
                        </div>

                        <div class="test-results">
                            <h4><i class="fas fa-vial me-2"></i>Statistical Tests</h4>
                            <p><strong>Normality (Shapiro-Wilk):</strong> 
                                <span class="badge bg-${distrib.shapiro_wilk.normal === 'True' ? 'success' : 'warning'}">
                                    ${distrib.shapiro_wilk.normal} (p=${distrib.shapiro_wilk.p_value.toFixed(4)})
                                </span>
                            </p>
                            <p><strong>Stationarity (ADF):</strong> 
                                <span class="badge bg-${stationarity.adf.stationary === 'True' ? 'success' : 'warning'}">
                                    ${stationarity.adf.stationary} (p=${stationarity.adf.p_value.toExponential(2)})
                                </span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderForecastingSection() {
        const container = document.getElementById('forecasting-section');
        if (!container) return;

        const ts = this.data.timeSeries;
        const exportForecast = ts.exports_analysis?.forecasts?.exponential_smoothing;
        const importForecast = ts.imports_analysis?.forecasts?.exponential_smoothing;

        let html = '<div class="row g-4">';

        // Export Forecast Card
        if (exportForecast) {
            html += this.createForecastCard('Exports', exportForecast, 'success');
        }

        // Import Forecast Card
        if (importForecast) {
            html += this.createForecastCard('Imports', importForecast, 'primary');
        }

        html += '</div>';
        container.innerHTML = html;
    }

    createForecastCard(title, forecast, colorClass) {
        const periods = ['2025Q2', '2025Q3', '2025Q4', '2026Q1'];
        
        return `
            <div class="col-lg-6">
                <div class="forecast-card ${colorClass}">
                    <div class="card-header">
                        <h3><i class="fas fa-crystal-ball me-2"></i>${title} Forecast</h3>
                        <span class="badge bg-info">Exponential Smoothing</span>
                    </div>
                    <div class="card-body">
                        <div class="forecast-list">
                            ${forecast.forecast_values.map((value, index) => `
                                <div class="forecast-item">
                                    <span class="period">${periods[index]}</span>
                                    <span class="value">$${value.toFixed(2)}M</span>
                                    <div class="progress">
                                        <div class="progress-bar bg-${colorClass}" style="width: ${(value / Math.max(...forecast.forecast_values)) * 100}%"></div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        
                        <div class="model-info">
                            <h4><i class="fas fa-cog me-2"></i>Model Parameters</h4>
                            <p><strong>Alpha (α):</strong> ${forecast.model_params.alpha.toExponential(2)}</p>
                            <p><strong>Beta (β):</strong> ${forecast.model_params.beta.toExponential(2)}</p>
                            <p><strong>Gamma (γ):</strong> ${forecast.model_params.gamma}</p>
                        </div>
                        
                        <div class="model-fit">
                            <h4><i class="fas fa-check-circle me-2"></i>Model Fit</h4>
                            <p><strong>AIC:</strong> ${forecast.model_fit.aic.toFixed(4)}</p>
                            <p><strong>BIC:</strong> ${forecast.model_fit.bic.toFixed(4)}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderVolatilityAnalysis() {
        const container = document.getElementById('volatility-analysis');
        if (!container) return;

        const ts = this.data.timeSeries;
        const exportVol = ts.exports_analysis?.statistical_analysis?.volatility_analysis;
        const importVol = ts.imports_analysis?.statistical_analysis?.volatility_analysis;

        let html = '<div class="row g-4">';

        if (exportVol) {
            html += this.createVolatilityCard('Exports', exportVol, 'success');
        }

        if (importVol) {
            html += this.createVolatilityCard('Imports', importVol, 'primary');
        }

        html += '</div>';
        container.innerHTML = html;
    }

    createVolatilityCard(title, vol, colorClass) {
        const riskLevel = vol.volatility > 200 ? 'High' : vol.volatility > 100 ? 'Medium' : 'Low';
        const riskColor = vol.volatility > 200 ? 'danger' : vol.volatility > 100 ? 'warning' : 'success';

        return `
            <div class="col-lg-6">
                <div class="volatility-card ${colorClass}">
                    <div class="card-header">
                        <h3><i class="fas fa-chart-area me-2"></i>${title} Volatility</h3>
                        <span class="badge bg-${riskColor}">${riskLevel} Risk</span>
                    </div>
                    <div class="card-body">
                        <div class="volatility-metric">
                            <div class="metric-circle ${riskColor}">
                                <div class="metric-value">${vol.volatility.toFixed(1)}%</div>
                                <div class="metric-label">Volatility</div>
                            </div>
                        </div>
                        
                        <div class="volatility-stats">
                            <div class="stat-row">
                                <span>Mean Return:</span>
                                <strong class="${vol.mean_return >= 0 ? 'text-success' : 'text-danger'}">
                                    ${vol.mean_return >= 0 ? '+' : ''}${vol.mean_return.toFixed(2)}%
                                </strong>
                            </div>
                            <div class="stat-row">
                                <span>Max Return:</span>
                                <strong class="text-success">+${vol.max_return.toFixed(2)}%</strong>
                            </div>
                            <div class="stat-row">
                                <span>Min Return:</span>
                                <strong class="text-danger">${vol.min_return.toFixed(2)}%</strong>
                            </div>
                            <div class="stat-row">
                                <span>Positive Periods:</span>
                                <strong>${vol.positive_returns}</strong>
                            </div>
                            <div class="stat-row">
                                <span>Negative Periods:</span>
                                <strong>${vol.negative_returns}</strong>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderTrendAnalysis() {
        const container = document.getElementById('trend-analysis');
        if (!container) return;

        const comp = this.data.comprehensive;
        if (!comp || !comp.key_insights || !comp.key_insights.trend_analysis) return;

        const trends = comp.key_insights.trend_analysis;

        let html = `
            <div class="trends-container">
                <div class="trend-card exports">
                    <h3><i class="fas fa-arrow-trend-up me-2"></i>Exports Trend</h3>
                    <div class="trend-indicator ${trends.exports.direction}">
                        <i class="fas fa-arrow-${trends.exports.direction === 'increasing' ? 'up' : 'down'}"></i>
                        ${trends.exports.direction.toUpperCase()}
                    </div>
                    <p>Trend Strength: <strong>${(trends.exports.strength * 100).toFixed(2)}%</strong></p>
                    <p>Statistical Significance: <span class="badge bg-${trends.exports.significance === 'True' ? 'success' : 'secondary'}">${trends.exports.significance}</span></p>
                </div>

                <div class="trend-card balance">
                    <h3><i class="fas fa-balance-scale me-2"></i>Trade Balance</h3>
                    <div class="balance-value ${trends.trade_balance.balance_trend}">
                        $${Math.abs(trends.trade_balance.mean_balance).toFixed(2)}M
                    </div>
                    <p>Status: <strong class="text-${trends.trade_balance.balance_trend === 'negative' ? 'danger' : 'success'}">${trends.trade_balance.balance_trend.toUpperCase()}</strong></p>
                    <p>Volatility: <strong>$${trends.trade_balance.balance_volatility.toFixed(2)}M</strong></p>
                </div>
            </div>
        `;

        container.innerHTML = html;
    }

    renderDistributionAnalysis() {
        // This will be rendered via charts
    }

    renderAIRecommendations() {
        const container = document.getElementById('ai-recommendations');
        if (!container) return;

        const comp = this.data.comprehensive;
        if (!comp || !comp.recommendations) return;

        let html = '<div class="recommendations-grid">';

        comp.recommendations.forEach((rec, index) => {
            const iconMap = {
                'trade_deficit': 'fa-exclamation-triangle',
                'high_volatility': 'fa-chart-line',
                'export_growth': 'fa-arrow-trend-up',
                'risk_management': 'fa-shield-alt'
            };

            const colorMap = {
                'high': 'danger',
                'medium': 'warning',
                'low': 'info'
            };

            html += `
                <div class="recommendation-card ${colorMap[rec.priority]}" style="animation-delay: ${index * 0.1}s">
                    <div class="rec-header">
                        <i class="fas ${iconMap[rec.type] || 'fa-lightbulb'}"></i>
                        <span class="badge bg-${colorMap[rec.priority]}">${rec.priority.toUpperCase()} PRIORITY</span>
                    </div>
                    <div class="rec-body">
                        <p>${rec.message}</p>
                        <div class="confidence-bar">
                            <label>Confidence: ${(rec.confidence * 100).toFixed(0)}%</label>
                            <div class="progress">
                                <div class="progress-bar bg-${colorMap[rec.priority]}" style="width: ${rec.confidence * 100}%"></div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;
    }

    renderAllCharts() {
        console.log('📊 Rendering advanced analytics charts...');
        
        // Destroy existing charts
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') chart.destroy();
        });
        this.charts = {};

        this.renderTimeSeriesChart();
        this.renderForecastChart();
        this.renderVolatilityChart();
        this.renderDistributionChart();
        this.renderCorrelationChart();
    }

    renderTimeSeriesChart() {
        const canvas = document.getElementById('timeseries-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        
        // Historical data (2023Q1 - 2025Q1)
        const quarters = ['2023Q1', '2023Q2', '2023Q3', '2023Q4', '2024Q1', '2024Q2', '2024Q3', '2024Q4', '2025Q1'];
        const exports = [402.14, 484.74, 388.11, 399.11, 431.61, 537.64, 667.00, 677.45, 480.82];
        const imports = [1476.51, 1571.09, 1581.81, 1486.93, 1410.52, 1568.97, 1751.57, 1629.39, 1379.05];
        const balance = exports.map((exp, i) => exp - imports[i]);

        this.charts.timeSeries = new Chart(ctx, {
            type: 'line',
            data: {
                labels: quarters,
                datasets: [{
                    label: 'Exports',
                    data: exports,
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 5,
                    pointHoverRadius: 7
                }, {
                    label: 'Imports',
                    data: imports,
                    borderColor: '#007bff',
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 5,
                    pointHoverRadius: 7
                }, {
                    label: 'Trade Balance',
                    data: balance,
                    borderColor: '#dc3545',
                    backgroundColor: 'rgba(220, 53, 69, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 5,
                    pointHoverRadius: 7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Rwanda Trade Performance - Time Series Analysis',
                        font: { size: 18, weight: 'bold' },
                        padding: 20
                    },
                    legend: {
                        position: 'top',
                        labels: {
                            boxWidth: 15,
                            padding: 15,
                            font: { size: 12, weight: '600' }
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: (context) => {
                                return `${context.dataset.label}: $${context.parsed.y.toFixed(2)}M`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        ticks: {
                            callback: (value) => `$${value}M`
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    renderForecastChart() {
        const canvas = document.getElementById('forecast-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const ts = this.data.timeSeries;
        
        // Historical quarters
        const historicalQuarters = ['2023Q1', '2023Q2', '2023Q3', '2023Q4', '2024Q1', '2024Q2', '2024Q3', '2024Q4', '2025Q1'];
        const forecastQuarters = ['2025Q2', '2025Q3', '2025Q4', '2026Q1'];
        const allQuarters = [...historicalQuarters, ...forecastQuarters];
        
        // Historical data
        const historicalExports = [402.14, 484.74, 388.11, 399.11, 431.61, 537.64, 667.00, 677.45, 480.82];
        const historicalImports = [1476.51, 1571.09, 1581.81, 1486.93, 1410.52, 1568.97, 1751.57, 1629.39, 1379.05];
        
        // Forecast data
        const exportForecast = ts.exports_analysis?.forecasts?.exponential_smoothing?.forecast_values || [];
        const importForecast = ts.imports_analysis?.forecasts?.exponential_smoothing?.forecast_values || [];
        
        // Combine data (null padding for forecast period in historical)
        const exportsData = [...historicalExports, ...exportForecast];
        const importsData = [...historicalImports, ...importForecast];

        this.charts.forecast = new Chart(ctx, {
            type: 'line',
            data: {
                labels: allQuarters,
                datasets: [{
                    label: 'Exports (Forecast)',
                    data: exportsData,
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: false,
                    pointRadius: 6,
                    pointBackgroundColor: allQuarters.map((_, i) => i >= historicalQuarters.length ? '#ffc107' : '#28a745'),
                    segment: {
                        borderDash: ctx => ctx.p0DataIndex >= historicalQuarters.length - 1 ? [5, 5] : []
                    }
                }, {
                    label: 'Imports (Forecast)',
                    data: importsData,
                    borderColor: '#007bff',
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: false,
                    pointRadius: 6,
                    pointBackgroundColor: allQuarters.map((_, i) => i >= historicalQuarters.length ? '#ffc107' : '#007bff'),
                    segment: {
                        borderDash: ctx => ctx.p0DataIndex >= historicalQuarters.length - 1 ? [5, 5] : []
                    }
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Trade Forecast - Exponential Smoothing Model',
                        font: { size: 18, weight: 'bold' },
                        padding: 20
                    },
                    legend: {
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const isForecast = context.dataIndex >= historicalQuarters.length;
                                return `${context.dataset.label}: $${context.parsed.y.toFixed(2)}M ${isForecast ? '(Forecast)' : ''}`;
                            }
                        }
                    },
                    annotation: {
                        annotations: {
                            line1: {
                                type: 'line',
                                xMin: historicalQuarters.length - 0.5,
                                xMax: historicalQuarters.length - 0.5,
                                borderColor: '#6c757d',
                                borderWidth: 2,
                                borderDash: [6, 6],
                                label: {
                                    display: true,
                                    content: 'Forecast Start',
                                    position: 'start'
                                }
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        ticks: {
                            callback: (value) => `$${value}M`
                        }
                    }
                }
            }
        });
    }

    renderVolatilityChart() {
        const canvas = document.getElementById('volatility-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const ts = this.data.timeSeries;
        
        const exportVol = ts.exports_analysis?.statistical_analysis?.volatility_analysis;
        const importVol = ts.imports_analysis?.statistical_analysis?.volatility_analysis;

        this.charts.volatility = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Exports', 'Imports'],
                datasets: [{
                    label: 'Volatility (%)',
                    data: [exportVol?.volatility || 0, importVol?.volatility || 0],
                    backgroundColor: ['rgba(40, 167, 69, 0.7)', 'rgba(0, 123, 255, 0.7)'],
                    borderColor: ['#28a745', '#007bff'],
                    borderWidth: 2,
                    borderRadius: 8
                }, {
                    label: 'Mean Return (%)',
                    data: [exportVol?.mean_return || 0, importVol?.mean_return || 0],
                    backgroundColor: ['rgba(255, 193, 7, 0.7)', 'rgba(220, 53, 69, 0.7)'],
                    borderColor: ['#ffc107', '#dc3545'],
                    borderWidth: 2,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Volatility & Returns Analysis',
                        font: { size: 16, weight: 'bold' },
                        padding: 15
                    },
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => `${value}%`
                        }
                    }
                }
            }
        });
    }

    renderDistributionChart() {
        const canvas = document.getElementById('distribution-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const ts = this.data.timeSeries;
        
        const exportStats = ts.exports_analysis?.statistical_analysis?.basic_statistics;
        const importStats = ts.imports_analysis?.statistical_analysis?.basic_statistics;

        this.charts.distribution = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Mean', 'Median', 'Std Dev', 'Range', 'IQR', 'Skewness (×10)'],
                datasets: [{
                    label: 'Exports',
                    data: [
                        exportStats.mean,
                        exportStats.median,
                        exportStats.std,
                        exportStats.range / 10,
                        exportStats.iqr,
                        exportStats.skewness * 10
                    ],
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40, 167, 69, 0.2)',
                    borderWidth: 2,
                    pointBackgroundColor: '#28a745'
                }, {
                    label: 'Imports',
                    data: [
                        importStats.mean,
                        importStats.median,
                        importStats.std,
                        importStats.range / 10,
                        importStats.iqr,
                        importStats.skewness * 10
                    ],
                    borderColor: '#007bff',
                    backgroundColor: 'rgba(0, 123, 255, 0.2)',
                    borderWidth: 2,
                    pointBackgroundColor: '#007bff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Statistical Distribution Comparison',
                        font: { size: 16, weight: 'bold' },
                        padding: 15
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    renderCorrelationChart() {
        const canvas = document.getElementById('correlation-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        
        // Sample correlation data (can be calculated from historical data)
        const correlations = [
            { pair: 'Exports-Imports', value: -0.35 },
            { pair: 'Exports-Balance', value: 0.92 },
            { pair: 'Imports-Balance', value: -0.78 }
        ];

        this.charts.correlation = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: correlations.map(c => c.pair),
                datasets: [{
                    label: 'Correlation Coefficient',
                    data: correlations.map(c => c.value),
                    backgroundColor: correlations.map(c => 
                        c.value > 0 ? 'rgba(40, 167, 69, 0.7)' : 'rgba(220, 53, 69, 0.7)'
                    ),
                    borderColor: correlations.map(c => 
                        c.value > 0 ? '#28a745' : '#dc3545'
                    ),
                    borderWidth: 2,
                    borderRadius: 8
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Correlation Analysis',
                        font: { size: 16, weight: 'bold' },
                        padding: 15
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        min: -1,
                        max: 1,
                        ticks: {
                            callback: (value) => value.toFixed(1)
                        }
                    }
                }
            }
        });
    }

    updateElement(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    }

    showError(message) {
        console.error('❌', message);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌟 Advanced Analytics page loaded');
    window.analyticsEngine = new AdvancedAnalyticsEngine();
});

// Export for global access
window.AdvancedAnalyticsEngine = AdvancedAnalyticsEngine;
