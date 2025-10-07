/**
 * Analytics Page JavaScript
 * Handles advanced analytics functionality
 */

class AnalyticsAnalyzer {
    constructor() {
        this.data = null;
        this.charts = {};
        this.initializeEventListeners();
        this.loadData();
    }

    initializeEventListeners() {
        // Apply filters button
        const applyButton = document.getElementById('apply-filters');
        if (applyButton) {
            applyButton.addEventListener('click', () => this.applyFilters());
        }

        // Search input
        const searchInput = document.getElementById('product-search');
        if (searchInput) {
            searchInput.addEventListener('input', () => this.filterResults());
        }
    }

    async loadData() {
        try {
            console.log('📊 Loading analytics data...');

            // Load visualization insights data
            const response = await fetch('/data/processed/visualization_insights.json');
            this.data = await response.json();

            console.log('📊 Analytics data loaded:', this.data);

            if (this.data) {
                console.log('✅ Analytics data loaded successfully, rendering charts...');
                this.renderCharts();
                this.updateStatisticalAnalysis();
                this.updateRegionalAnalysis();
                this.updateGeographicInsights();
                this.hideLoading();
            } else {
                console.warn('⚠️ No analytics data received from file');
                this.showError('No analytics data available');
            }
        } catch (error) {
            console.error('❌ Error loading analytics data:', error);
            this.showError('Failed to load analytics data: ' + error.message);
        }
    }

    renderCharts() {
        this.createAnalyticsChart();
    }

    updateStatisticalAnalysis() {
        if (!this.data || !this.data.statistical_insights) {
            console.warn('⚠️ No statistical insights data available');
            return;
        }

        const insights = this.data.statistical_insights;

        // Update correlation strength
        const correlationElement = document.getElementById('correlation-strength');
        if (correlationElement && insights.correlation_strength !== undefined) {
            correlationElement.textContent = (insights.correlation_strength * 100).toFixed(1) + '%';
        }

        // Update export volatility
        const exportVolatilityElement = document.getElementById('export-volatility');
        if (exportVolatilityElement && insights.export_volatility !== undefined) {
            exportVolatilityElement.textContent = '$' + (insights.export_volatility / 1000000).toFixed(0) + 'M';
        }

        // Update import volatility
        const importVolatilityElement = document.getElementById('import-volatility');
        if (importVolatilityElement && insights.import_volatility !== undefined) {
            importVolatilityElement.textContent = '$' + (insights.import_volatility / 1000000).toFixed(0) + 'M';
        }

        // Update trade imbalance ratio
        const tradeImbalanceElement = document.getElementById('trade-imbalance');
        if (tradeImbalanceElement && insights.trade_imbalance_ratio !== undefined) {
            tradeImbalanceElement.textContent = insights.trade_imbalance_ratio.toFixed(2);
        }

        console.log('✅ Statistical analysis updated with real data');
    }

    updateRegionalAnalysis() {
        if (!this.data || !this.data.regional_analysis) {
            console.warn('⚠️ No regional analysis data available');
            return;
        }

        const regional = this.data.regional_analysis;

        // Update Asia exports
        const asiaElement = document.getElementById('asia-exports');
        if (asiaElement && regional.asia_exports !== undefined) {
            asiaElement.textContent = '$' + (regional.asia_exports / 1000000000).toFixed(1) + 'B';
        }

        // Update Africa exports
        const africaElement = document.getElementById('africa-exports');
        if (africaElement && regional.africa_exports !== undefined) {
            africaElement.textContent = '$' + (regional.africa_exports / 1000000000).toFixed(1) + 'B';
        }

        // Update Europe exports
        const europeElement = document.getElementById('europe-exports');
        if (europeElement && regional.europe_exports !== undefined) {
            europeElement.textContent = '$' + (regional.europe_exports / 1000000).toFixed(0) + 'M';
        }

        // Update Americas exports
        const americasElement = document.getElementById('americas-exports');
        if (americasElement && regional.americas_exports !== undefined) {
            americasElement.textContent = '$' + (regional.americas_exports / 1000000).toFixed(0) + 'M';
        }

        console.log('✅ Regional analysis updated with real data');
    }

    updateGeographicInsights() {
        if (!this.data || !this.data.geographic_insights) {
            console.warn('⚠️ No geographic insights data available');
            return;
        }

        const geographic = this.data.geographic_insights;

        // Update average distance
        const avgDistanceElement = document.getElementById('avg-distance');
        if (avgDistanceElement && geographic.average_distance_to_partners !== undefined) {
            avgDistanceElement.textContent = Math.round(geographic.average_distance_to_partners).toLocaleString() + ' km';
        }

        // Update farthest partner
        const farthestElement = document.getElementById('farthest-partner');
        if (farthestElement && geographic.farthest_partner) {
            farthestElement.textContent = geographic.farthest_partner;
        }

        // Update closest partner
        const closestElement = document.getElementById('closest-partner');
        if (closestElement && geographic.closest_partner) {
            closestElement.textContent = geographic.closest_partner;
        }

        // Update top destination from trade overview
        const topDestinationElement = document.getElementById('top-destination');
        if (topDestinationElement && this.data.trade_overview?.top_export_destination) {
            topDestinationElement.textContent = this.data.trade_overview.top_export_destination.substring(0, 3).toUpperCase();
        }

        console.log('✅ Geographic insights updated with real data');
    }

    createAnalyticsChart() {
        const ctx = document.getElementById('advanced-analytics-chart');
        if (!ctx) {
            console.warn('⚠️ Advanced analytics chart container not found');
            return;
        }

        try {
            const chartData = this.getAnalyticsChartData();
            console.log('📊 Analytics data for chart:', chartData);

            if (!chartData || chartData.labels.length === 0) {
                console.warn('⚠️ No analytics data available for chart');
                return;
            }

            const data = {
                labels: chartData.labels,
                datasets: [{
                    label: 'Performance Metrics',
                    data: chartData.values,
                    backgroundColor: [
                        'rgba(75, 192, 192, 0.8)',
                        'rgba(255, 99, 132, 0.8)',
                        'rgba(255, 206, 86, 0.8)',
                        'rgba(54, 162, 235, 0.8)'
                    ],
                    borderColor: [
                        'rgba(75, 192, 192, 1)',
                        'rgba(255, 99, 132, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(54, 162, 235, 1)'
                    ],
                    borderWidth: 2,
                    pointBackgroundColor: [
                        'rgba(75, 192, 192, 1)',
                        'rgba(255, 99, 132, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(54, 162, 235, 1)'
                    ],
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6
                }]
            };

            if (this.charts.analyticsChart) {
                this.charts.analyticsChart.destroy();
            }

            console.log('📊 Creating advanced analytics chart with data:', data);
            this.charts.analyticsChart = new Chart(ctx, {
                type: 'radar',
                data: data,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top'
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `${context.label}: ${context.parsed.r.toFixed(1)}`;
                                }
                            }
                        }
                    },
                    scales: {
                        r: {
                            beginAtZero: true,
                            max: 100,
                            grid: { color: '#e2e8f0' },
                            pointLabels: {
                                font: { size: 12, weight: '600' },
                                color: '#1a365d'
                            },
                            ticks: {
                                font: { weight: '600' },
                                color: '#64748b'
                            }
                        }
                    },
                    animation: {
                        duration: 1200,
                        easing: 'easeOutQuart'
                    }
                }
            });
            console.log('✅ Advanced analytics chart created successfully');
        } catch (error) {
            console.error('❌ Error creating advanced analytics chart:', error);
        }
    }

    getAnalyticsChartData() {
        if (!this.data) {
            console.warn('⚠️ No analytics data available');
            return { labels: [], values: [] };
        }

        console.log('🔍 Processing analytics chart data:', this.data);

        // Transform API data to chart format
        const labels = [];
        const values = [];

        if (this.data.total_exports) {
            labels.push('Export Volume');
            values.push(Math.min(100, (this.data.total_exports / 100000) * 10)); // Scale for radar chart
        }

        if (this.data.total_imports) {
            labels.push('Import Volume');
            values.push(Math.min(100, (this.data.total_imports / 100000) * 5)); // Scale for radar chart
        }

        if (this.data.trade_balance !== undefined) {
            labels.push('Trade Balance');
            values.push(Math.min(100, Math.abs(this.data.trade_balance) / 100000)); // Scale for radar chart
        }

        if (this.data.export_growth !== undefined) {
            labels.push('Growth Rate');
            values.push(Math.min(100, Math.abs(this.data.export_growth))); // Scale for radar chart
        }

        console.log('📊 Analytics chart data processed:', { labels, values });
        return { labels, values };
    }

    applyFilters() {
        const searchTerm = document.getElementById('product-search').value;
        const category = document.getElementById('category-filter').value;
        const timePeriod = document.getElementById('time-filter').value;

        console.log('Applying filters:', { searchTerm, category, timePeriod });
        // Implement filtering logic here
    }

    filterResults() {
        const searchTerm = document.getElementById('product-search').value;
        console.log('Filtering results for:', searchTerm);
        // Implement search filtering here
    }

    hideLoading() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
    }

    showError(message) {
        console.error(message);
        // You could implement a toast notification here
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.analyticsAnalyzer = new AnalyticsAnalyzer();
});

// Global functions for HTML onclick handlers
function runAdvancedAnalytics() {
    if (window.analyticsAnalyzer) {
        window.analyticsAnalyzer.loadData();
    }
}

function exportAnalyticsReport() {
    // Get the latest data from the analytics analyzer
    const analyticsData = window.analyticsAnalyzer ? window.analyticsAnalyzer.data : null;

    const reportData = {
        generated_at: new Date().toISOString(),
        summary: {
            total_export_value: analyticsData?.trade_overview?.total_export_value || 0,
            total_import_value: analyticsData?.trade_overview?.total_import_value || 0,
            trade_balance: analyticsData?.trade_overview?.trade_balance || 0,
            export_destinations_count: analyticsData?.trade_overview?.export_destinations_count || 0,
            import_sources_count: analyticsData?.trade_overview?.import_sources_count || 0,
            top_export_destination: analyticsData?.trade_overview?.top_export_destination || 'N/A',
            top_import_source: analyticsData?.trade_overview?.top_import_source || 'N/A'
        },
        regional_analysis: analyticsData?.regional_analysis || {},
        statistical_insights: analyticsData?.statistical_insights || {},
        geographic_insights: analyticsData?.geographic_insights || {},
        recommendations: [
            "Focus on export diversification beyond traditional markets",
            "Strengthen trade relations with high-growth destinations",
            "Explore import substitution opportunities for key commodities",
            "Develop strategies to reduce dependency on primary import sources",
            "Monitor seasonal patterns for optimal trade timing"
        ]
    };

    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'analytics_report.json';
    link.click();
    URL.revokeObjectURL(url);
}