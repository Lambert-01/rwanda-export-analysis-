/**
 * Commodities Page JavaScript
 * Handles commodity analysis functionality
 */

class CommoditiesAnalyzer {
    constructor() {
        this.data = null;
        this.charts = {};
        this.initializeEventListeners();
        this.loadData();
    }

    initializeEventListeners() {
        // Period filter
        const periodFilter = document.getElementById('commodity-period-filter');
        if (periodFilter) {
            periodFilter.addEventListener('change', () => this.updateCharts());
        }

        // Type filter
        const typeFilter = document.getElementById('commodity-type-filter');
        if (typeFilter) {
            typeFilter.addEventListener('change', () => this.updateCharts());
        }
    }

    async loadData() {
        try {
            console.log('📦 Loading commodity data...');

            // Load commodity data from backend API
            const response = await fetch('/api/exports/products');
            this.data = await response.json();

            console.log('📦 Commodity data loaded:', this.data);

            if (this.data && this.data.length > 0) {
                console.log('✅ Commodity data loaded successfully, rendering charts...');
                this.renderCharts();
                this.hideLoading();
            } else {
                console.warn('⚠️ No commodity data received from API');
                this.showError('No commodity data available');
            }
        } catch (error) {
            console.error('❌ Error loading commodity data:', error);
            this.showError('Failed to load commodity data: ' + error.message);
        }
    }

    renderCharts() {
        this.createCommodityChart();
        this.createTrendsChart();
    }

    createCommodityChart() {
        const ctx = document.getElementById('commodity-analysis-chart');
        if (!ctx) {
            console.warn('⚠️ Commodity analysis chart container not found');
            return;
        }

        try {
            const commoditiesData = this.getCommoditiesData();
            console.log('📦 Commodities data for chart:', commoditiesData);

            if (!commoditiesData || commoditiesData.length === 0) {
                console.warn('⚠️ No commodities data available for chart');
                return;
            }

            const data = {
                labels: commoditiesData.map(c => c.name || 'Unknown'),
                datasets: [{
                    data: commoditiesData.map(c => c.value || 0),
                    backgroundColor: [
                        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                        '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
                    ]
                }]
            };

            if (this.charts.commodityChart) {
                this.charts.commodityChart.destroy();
            }

            console.log('📊 Creating commodity chart with data:', data);
            this.charts.commodityChart = new Chart(ctx, {
                type: 'doughnut',
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
                                    return `${label}: $${value.toLocaleString()}M`;
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
            console.log('✅ Commodity chart created successfully');
        } catch (error) {
            console.error('❌ Error creating commodity chart:', error);
        }
    }

    createTrendsChart() {
        const ctx = document.getElementById('commodity-trends-chart');
        if (!ctx) {
            console.warn('⚠️ Commodity trends chart container not found');
            return;
        }

        try {
            const trendsData = this.getTrendsData();
            console.log('📈 Commodity trends data for chart:', trendsData);

            if (!trendsData || trendsData.length === 0) {
                console.warn('⚠️ No commodity trends data available for chart');
                return;
            }

            const data = {
                labels: trendsData.map(t => t.period || 'Unknown'),
                datasets: [
                    {
                        label: 'Food & Live Animals',
                        data: trendsData.map(t => t.food || 0),
                        borderColor: '#FF6384',
                        backgroundColor: 'rgba(255, 99, 132, 0.1)',
                        fill: true,
                        tension: 0.3
                    },
                    {
                        label: 'Crude Materials',
                        data: trendsData.map(t => t.materials || 0),
                        borderColor: '#36A2EB',
                        backgroundColor: 'rgba(54, 162, 235, 0.1)',
                        fill: true,
                        tension: 0.3
                    },
                    {
                        label: 'Manufactured Goods',
                        data: trendsData.map(t => t.manufactured || 0),
                        borderColor: '#FFCE56',
                        backgroundColor: 'rgba(255, 206, 86, 0.1)',
                        fill: true,
                        tension: 0.3
                    }
                ]
            };

            if (this.charts.trendsChart) {
                this.charts.trendsChart.destroy();
            }

            console.log('📊 Creating commodity trends chart with data:', data);
            this.charts.trendsChart = new Chart(ctx, {
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
                                    return `${context.dataset.label}: $${(context.parsed.y / 1000000).toFixed(2)}M`;
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
                                text: 'Value (Millions USD)'
                            },
                            ticks: {
                                callback: function(value) {
                                    return '$' + (value / 1000000).toFixed(1) + 'M';
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
            console.log('✅ Commodity trends chart created successfully');
        } catch (error) {
            console.error('❌ Error creating commodity trends chart:', error);
        }
    }

    getCommoditiesData() {
        if (!this.data) {
            console.warn('⚠️ No commodities data available');
            return [];
        }

        console.log('🔍 Processing commodities data:', this.data);

        // Transform API data to chart format
        const chartData = this.data.slice(0, 8).map(item => ({
            name: item.product || item.commodity || item.description || 'Unknown',
            value: item.value || 0
        }));

        console.log('📦 Commodities chart data processed:', chartData);
        return chartData;
    }

    getTrendsData() {
        if (!this.data) {
            console.warn('⚠️ No commodities data available for trends');
            return [];
        }

        console.log('🔍 Processing commodity trends data:', this.data);

        // Group data by commodity categories and periods
        const categoryData = {};

        this.data.forEach(item => {
            const category = this.categorizeCommodity(item.product || item.commodity || item.description || 'Other');
            const period = item.period || item.quarter || 'Unknown';
            const value = item.value || 0;

            if (!categoryData[category]) {
                categoryData[category] = {};
            }

            if (!categoryData[category][period]) {
                categoryData[category][period] = 0;
            }

            categoryData[category][period] += value;
        });

        // Get all periods and sort them
        const allPeriods = [...new Set(this.data.map(item => item.period || item.quarter || 'Unknown'))].sort();

        // Create trends data for each category
        const trendsData = allPeriods.map(period => {
            const trendPoint = { period };

            // Add values for each category
            Object.keys(categoryData).forEach(category => {
                trendPoint[category.toLowerCase().replace(/[^a-z]/g, '')] = categoryData[category][period] || 0;
            });

            return trendPoint;
        });

        console.log('📈 Commodity trends data processed:', trendsData);
        return trendsData;
    }

    categorizeCommodity(commodity) {
        const commodity = (commodity || '').toLowerCase();

        if (commodity.includes('food') || commodity.includes('live animals') || commodity.includes('beverages') || commodity.includes('tobacco')) {
            return 'food';
        } else if (commodity.includes('crude') || commodity.includes('materials') || commodity.includes('ores') || commodity.includes('minerals')) {
            return 'materials';
        } else if (commodity.includes('manufactured') || commodity.includes('machinery') || commodity.includes('equipment') || commodity.includes('goods')) {
            return 'manufactured';
        } else {
            return 'other';
        }
    }

    updateCharts() {
        this.createCommodityChart();
        this.createTrendsChart();
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
    window.commoditiesAnalyzer = new CommoditiesAnalyzer();
});

// Global functions for HTML onclick handlers
function loadCommodityAnalysis() {
    if (window.commoditiesAnalyzer) {
        window.commoditiesAnalyzer.loadData();
    }
}

function toggleCommodityView() {
    // Toggle between different views
    const chart = document.getElementById('commodity-analysis-chart');
    if (chart && window.commoditiesAnalyzer) {
        window.commoditiesAnalyzer.updateCharts();
    }
}