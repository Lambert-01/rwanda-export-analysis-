/**
 * Regional Analysis Page JavaScript
 * Handles regional and continental analysis functionality
 */

class RegionalAnalyzer {
    constructor() {
        this.data = null;
        this.charts = {};
        this.initializeEventListeners();
        this.loadData();
    }

    initializeEventListeners() {
        // Add any regional-specific event listeners here
    }

    async loadData() {
        try {
            console.log('🌍 Loading regional data...');

            // Load regional data from backend API
            const response = await fetch('/api/analytics/regional');
            this.data = await response.json();

            console.log('🌍 Regional data loaded:', this.data);

            if (this.data) {
                console.log('✅ Regional data loaded successfully, rendering charts...');
                this.renderCharts();
                this.hideLoading();
            } else {
                console.warn('⚠️ No regional data received from API');
                this.showError('No regional data available');
            }
        } catch (error) {
            console.error('❌ Error loading regional data:', error);
            this.showError('Failed to load regional data: ' + error.message);
        }
    }

    renderCharts() {
        this.createEACChart();
        this.createContinentalChart();
        this.createRegionalComparisonChart();
        this.createRegionalExportChart();
    }

    createEACChart() {
        const ctx = document.getElementById('eac-trade-chart');
        if (!ctx) {
            console.warn('⚠️ EAC trade chart container not found');
            return;
        }

        try {
            const eacData = this.getEACData();
            console.log('🌍 EAC data for chart:', eacData);

            if (!eacData || eacData.labels.length === 0) {
                console.warn('⚠️ No EAC data available for chart');
                return;
            }

            const data = {
                labels: eacData.labels,
                datasets: [{
                    label: 'Trade Volume (Billions USD)',
                    data: eacData.values,
                    backgroundColor: 'rgba(75, 192, 192, 0.8)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1,
                    borderRadius: 8
                }]
            };

            if (this.charts.eacChart) {
                this.charts.eacChart.destroy();
            }

            console.log('📊 Creating EAC chart with data:', data);
            this.charts.eacChart = new Chart(ctx, {
                type: 'bar',
                data: data,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `Trade Volume: $${context.parsed.y.toFixed(2)}B`;
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
                            title: {
                                display: true,
                                text: 'Trade Volume (Billions USD)'
                            },
                            ticks: {
                                callback: function(value) {
                                    return '$' + value.toFixed(1) + 'B';
                                },
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
            console.log('✅ EAC chart created successfully');
        } catch (error) {
            console.error('❌ Error creating EAC chart:', error);
        }
    }

    getEACData() {
        if (!this.data || !this.data.eac_trade) {
            console.warn('⚠️ No EAC data available');
            return { labels: [], values: [] };
        }

        console.log('🔍 Processing EAC data:', this.data.eac_trade);

        // Transform API data to chart format
        const eacTrade = this.data.eac_trade;
        const labels = [];
        const values = [];

        for (let i = 0; i < Math.min(eacTrade.length, 5); i++) {
            labels.push(eacTrade[i].country || `Country ${i+1}`);
            values.push(eacTrade[i].trade_volume || 0);
        }

        console.log('📊 EAC chart data processed:', { labels, values });
        return { labels, values };
    }

    createContinentalChart() {
        const ctx = document.getElementById('continental-chart');
        if (!ctx) {
            console.warn('⚠️ Continental chart container not found');
            return;
        }

        try {
            const continentalData = this.getContinentalData();
            console.log('🌍 Continental data for chart:', continentalData);

            if (!continentalData || continentalData.labels.length === 0) {
                console.warn('⚠️ No continental data available for chart');
                return;
            }

            const data = {
                labels: continentalData.labels,
                datasets: [{
                    data: continentalData.values,
                    backgroundColor: [
                        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'
                    ]
                }]
            };

            if (this.charts.continentalChart) {
                this.charts.continentalChart.destroy();
            }

            console.log('📊 Creating continental chart with data:', data);
            this.charts.continentalChart = new Chart(ctx, {
                type: 'pie',
                data: data,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
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
                                    const value = context.parsed || 0;
                                    return `${label}: ${value}%`;
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
            console.log('✅ Continental chart created successfully');
        } catch (error) {
            console.error('❌ Error creating continental chart:', error);
        }
    }

    getContinentalData() {
        if (!this.data || !this.data.continental_distribution) {
            console.warn('⚠️ No continental data available');
            return { labels: [], values: [] };
        }

        console.log('🔍 Processing continental data:', this.data.continental_distribution);

        // Transform API data to chart format
        const continental = this.data.continental_distribution;
        const labels = [];
        const values = [];

        for (let i = 0; i < Math.min(continental.length, 5); i++) {
            labels.push(continental[i].continent || `Continent ${i+1}`);
            values.push(continental[i].share || 0);
        }

        console.log('📊 Continental chart data processed:', { labels, values });
        return { labels, values };
    }

    createRegionalComparisonChart() {
        const ctx = document.getElementById('regional-comparison-chart');
        if (!ctx) {
            console.warn('⚠️ Regional comparison chart container not found');
            return;
        }

        try {
            const comparisonData = this.getRegionalComparisonData();
            console.log('📊 Regional comparison data for chart:', comparisonData);

            if (!comparisonData || comparisonData.labels.length === 0) {
                console.warn('⚠️ No regional comparison data available for chart');
                return;
            }

            const data = {
                labels: comparisonData.labels,
                datasets: [
                    {
                        label: 'Asia',
                        data: comparisonData.asia,
                        borderColor: '#FF6384',
                        backgroundColor: 'rgba(255, 99, 132, 0.1)',
                        fill: true,
                        tension: 0.3
                    },
                    {
                        label: 'Africa',
                        data: comparisonData.africa,
                        borderColor: '#36A2EB',
                        backgroundColor: 'rgba(54, 162, 235, 0.1)',
                        fill: true,
                        tension: 0.3
                    },
                    {
                        label: 'Europe',
                        data: comparisonData.europe,
                        borderColor: '#FFCE56',
                        backgroundColor: 'rgba(255, 206, 86, 0.1)',
                        fill: true,
                        tension: 0.3
                    }
                ]
            };

            if (this.charts.regionalComparisonChart) {
                this.charts.regionalComparisonChart.destroy();
            }

            console.log('📊 Creating regional comparison chart with data:', data);
            this.charts.regionalComparisonChart = new Chart(ctx, {
                type: 'line',
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
                                    return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%`;
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
                            title: {
                                display: true,
                                text: 'Export Share (%)'
                            },
                            ticks: {
                                callback: function(value) {
                                    return value + '%';
                                },
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
            console.log('✅ Regional comparison chart created successfully');
        } catch (error) {
            console.error('❌ Error creating regional comparison chart:', error);
        }
    }

    getRegionalComparisonData() {
        if (!this.data || !this.data.regional_trends) {
            console.warn('⚠️ No regional trends data available');
            return { labels: [], asia: [], africa: [], europe: [] };
        }

        console.log('🔍 Processing regional comparison data:', this.data.regional_trends);

        // Transform API data to chart format
        const trends = this.data.regional_trends;
        const labels = [];
        const asia = [];
        const africa = [];
        const europe = [];

        for (let i = 0; i < Math.min(trends.length, 4); i++) {
            labels.push(trends[i].period || `Q${i+1} 2024`);
            asia.push(trends[i].asia_share || 0);
            africa.push(trends[i].africa_share || 0);
            europe.push(trends[i].europe_share || 0);
        }

        console.log('📊 Regional comparison chart data processed:', { labels, asia, africa, europe });
        return { labels, asia, africa, europe };
    }

    createRegionalExportChart() {
        const ctx = document.getElementById('regional-export-chart');
        if (!ctx) {
            console.warn('⚠️ Regional export chart container not found');
            return;
        }

        try {
            const exportData = this.getRegionalExportData();
            console.log('📊 Regional export data for chart:', exportData);

            if (!exportData || exportData.labels.length === 0) {
                console.warn('⚠️ No regional export data available for chart');
                return;
            }

            const data = {
                labels: exportData.labels,
                datasets: [{
                    label: 'Export Value (Billions USD)',
                    data: exportData.values,
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.8)',
                        'rgba(54, 162, 235, 0.8)',
                        'rgba(255, 206, 86, 0.8)',
                        'rgba(75, 192, 192, 0.8)'
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)'
                    ],
                    borderWidth: 1,
                    borderRadius: 8
                }]
            };

            if (this.charts.regionalExportChart) {
                this.charts.regionalExportChart.destroy();
            }

            console.log('📊 Creating regional export chart with data:', data);
            this.charts.regionalExportChart = new Chart(ctx, {
                type: 'bar',
                data: data,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `Export Value: $${context.parsed.y.toFixed(2)}B`;
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
                            title: {
                                display: true,
                                text: 'Export Value (Billions USD)'
                            },
                            ticks: {
                                callback: function(value) {
                                    return '$' + value.toFixed(2) + 'B';
                                },
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
            console.log('✅ Regional export chart created successfully');
        } catch (error) {
            console.error('❌ Error creating regional export chart:', error);
        }
    }

    getRegionalExportData() {
        if (!this.data || !this.data.regional_exports) {
            console.warn('⚠️ No regional export data available');
            return { labels: [], values: [] };
        }

        console.log('🔍 Processing regional export data:', this.data.regional_exports);

        // Transform API data to chart format
        const regionalExports = this.data.regional_exports;
        const labels = [];
        const values = [];

        for (let i = 0; i < Math.min(regionalExports.length, 4); i++) {
            labels.push(regionalExports[i].region || `Region ${i+1}`);
            values.push(regionalExports[i].export_value || 0);
        }

        console.log('📊 Regional export chart data processed:', { labels, values });
        return { labels, values };
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
    window.regionalAnalyzer = new RegionalAnalyzer();
});

// Global functions for HTML onclick handlers
function loadRegionalAnalysis() {
    if (window.regionalAnalyzer) {
        window.regionalAnalyzer.loadData();
    }
}

function exportRegionalData() {
    const regionalData = {
        eac: {
            total_exports: 12.5,
            top_country: "Kenya",
            growth_rate: 15.2
        },
        continental: {
            asia_share: 76,
            africa_share: 15,
            europe_share: 6,
            americas_share: 1
        },
        insights: [
            "Asian markets represent 76% of Rwanda's export value",
            "African markets show significant growth potential",
            "Heavy concentration in Asian markets increases vulnerability"
        ]
    };

    const dataStr = JSON.stringify(regionalData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'regional_analysis.json';
    link.click();
    URL.revokeObjectURL(url);
}