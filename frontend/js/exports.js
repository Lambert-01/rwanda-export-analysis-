/**
 * Exports Page JavaScript
 * Handles export analysis functionality
 */

class ExportAnalyzer {
    constructor() {
        this.data = null;
        this.charts = {};
        this.initializeEventListeners();
        this.loadData();
    }

    initializeEventListeners() {
        // Year filter
        const yearFilter = document.getElementById('export-year-filter');
        if (yearFilter) {
            yearFilter.addEventListener('change', () => this.updateCharts());
        }

        // Product filter
        const productFilter = document.getElementById('export-product-filter');
        if (productFilter) {
            productFilter.addEventListener('change', () => this.updateCharts());
        }

        // Search functionality
        const searchInput = document.getElementById('export-search');
        if (searchInput) {
            searchInput.addEventListener('input', () => this.filterTable());
        }
    }

    async loadData() {
        try {
            console.log('🔄 Loading export data...');

            // Load data from backend API
            const response = await fetch('/api/exports/quarterly');
            this.data = await response.json();

            console.log('📊 Export data loaded:', this.data);

            if (this.data && this.data.length > 0) {
                console.log('✅ Data loaded successfully, rendering charts...');
                this.renderCharts();
                this.populateTable();
                this.hideLoading();
            } else {
                console.warn('⚠️ No data received from API');
                this.showError('No export data available');
            }
        } catch (error) {
            console.error('❌ Error loading export data:', error);
            this.showError('Failed to load export data: ' + error.message);
        }
    }

    renderCharts() {
        this.createExportMap();
        this.createProductsChart();
        this.createGrowthChart();
        this.createTrendsChart();
    }

    createExportMap() {
        // Initialize map if not already done
        if (!this.charts.exportMap) {
            this.charts.exportMap = L.map('export-map').setView([1.9403, 29.8739], 8);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(this.charts.exportMap);
        }

        // Add markers for top export destinations
        if (this.data) {
            // Clear existing markers
            this.charts.exportMap.eachLayer((layer) => {
                if (layer instanceof L.Marker) {
                    this.charts.exportMap.removeLayer(layer);
                }
            });

            // Add new markers
            const topDestinations = this.getTopDestinations(10);
            topDestinations.forEach(dest => {
                const marker = L.marker([dest.lat, dest.lng])
                    .bindPopup(`<b>${dest.country}</b><br>Value: $${dest.value.toLocaleString()}M`)
                    .addTo(this.charts.exportMap);
            });
        }
    }

    createProductsChart() {
        const ctx = document.getElementById('export-products-chart');
        if (!ctx) {
            console.warn('⚠️ Export products chart container not found');
            return;
        }

        try {
            const productsData = this.getProductsData();
            console.log('📈 Products data for chart:', productsData);

            if (!productsData || productsData.length === 0) {
                console.warn('⚠️ No products data available for chart');
                return;
            }

            const data = {
                labels: productsData.map(p => p.name || 'Unknown'),
                datasets: [{
                    data: productsData.map(p => p.value || 0),
                    backgroundColor: [
                        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                        '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
                    ]
                }]
            };

            if (this.charts.productsChart) {
                this.charts.productsChart.destroy();
            }

            console.log('📊 Creating products chart with data:', data);
            this.charts.productsChart = new Chart(ctx, {
                type: 'doughnut',
                data: data,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 20,
                                usePointStyle: true
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
                    }
                }
            });
            console.log('✅ Products chart created successfully');
        } catch (error) {
            console.error('❌ Error creating products chart:', error);
        }
    }

    createGrowthChart() {
        const ctx = document.getElementById('export-growth-chart');
        if (!ctx) {
            console.warn('⚠️ Export growth chart container not found');
            return;
        }

        try {
            const growthData = this.getGrowthData();
            console.log('📈 Growth data for chart:', growthData);

            if (!growthData || growthData.length === 0) {
                console.warn('⚠️ No growth data available for chart');
                return;
            }

            const data = {
                labels: growthData.map(g => g.quarter || 'Unknown'),
                datasets: [{
                    label: 'Export Growth Rate',
                    data: growthData.map(g => g.rate || 0),
                    borderColor: '#36A2EB',
                    backgroundColor: 'rgba(54, 162, 235, 0.1)',
                    fill: true,
                    tension: 0.3
                }]
            };

            if (this.charts.growthChart) {
                this.charts.growthChart.destroy();
            }

            console.log('📊 Creating growth chart with data:', data);
            this.charts.growthChart = new Chart(ctx, {
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
                                    return `Growth Rate: ${context.parsed.y.toFixed(2)}%`;
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
                            beginAtZero: true,
                            grid: { color: '#e2e8f0' },
                            title: {
                                display: true,
                                text: 'Growth Rate (%)'
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
            console.log('✅ Growth chart created successfully');
        } catch (error) {
            console.error('❌ Error creating growth chart:', error);
        }
    }

    createTrendsChart() {
        const ctx = document.getElementById('export-trends-chart');
        if (!ctx) {
            console.warn('⚠️ Export trends chart container not found');
            return;
        }

        try {
            const trendsData = this.getTrendsData();
            console.log('📈 Trends data for chart:', trendsData);

            if (!trendsData || trendsData.length === 0) {
                console.warn('⚠️ No trends data available for chart');
                return;
            }

            const data = {
                labels: trendsData.map(t => t.quarter || 'Unknown'),
                datasets: [{
                    label: 'Export Value',
                    data: trendsData.map(t => t.value || 0),
                    borderColor: '#FF6384',
                    backgroundColor: 'rgba(255, 99, 132, 0.1)',
                    fill: true,
                    tension: 0.3
                }]
            };

            if (this.charts.trendsChart) {
                this.charts.trendsChart.destroy();
            }

            console.log('📊 Creating trends chart with data:', data);
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
                                    return `Export Value: $${(context.parsed.y / 1000000).toFixed(2)}M`;
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
                                text: 'Export Value (Millions USD)'
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
            console.log('✅ Trends chart created successfully');
        } catch (error) {
            console.error('❌ Error creating trends chart:', error);
        }
    }

    getTopDestinations(limit = 5) {
        if (!this.data) return [];

        const destinations = {};
        this.data.forEach(item => {
            if (item.destination_country && item.export_value) {
                destinations[item.destination_country] = (destinations[item.destination_country] || 0) + item.export_value;
            }
        });

        return Object.entries(destinations)
            .map(([country, value]) => ({
                country,
                value,
                lat: this.getCountryLatLng(country).lat,
                lng: this.getCountryLatLng(country).lng
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, limit);
    }

    getProductsData() {
        if (!this.data) {
            console.warn('⚠️ No data available for products');
            return [];
        }

        console.log('🔍 Processing products data from:', this.data.length, 'records');

        const products = {};
        this.data.forEach(item => {
            // Handle different data formats
            const section = item.sitc_section || item.commodity || item.product || 'Other';
            const value = parseFloat(item.export_value || item.value || 0);

            if (value > 0) {
                products[section] = (products[section] || 0) + value;
            }
        });

        const result = Object.entries(products)
            .map(([section, value]) => ({
                name: this.getSectionName(section),
                value: value
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 8); // Limit to top 8 for better visualization

        console.log('📦 Products data processed:', result);
        return result;
    }

    getGrowthData() {
        if (!this.data) {
            console.warn('⚠️ No data available for growth calculation');
            return [];
        }

        console.log('🔍 Processing growth data from:', this.data.length, 'records');

        // Calculate growth rates by quarter
        const quarterly = {};
        this.data.forEach(item => {
            // Handle different data formats
            const quarter = item.quarter || item.period || 'Unknown';
            const value = parseFloat(item.export_value || item.exports || item.value || 0);

            if (quarter !== 'Unknown' && value > 0) {
                quarterly[quarter] = (quarterly[quarter] || 0) + value;
            }
        });

        console.log('📊 Quarterly data aggregated:', quarterly);

        const quarters = Object.keys(quarterly).sort();
        const growthRates = [];

        for (let i = 1; i < quarters.length; i++) {
            const prevValue = quarterly[quarters[i-1]];
            const currValue = quarterly[quarters[i]];
            const growthRate = prevValue === 0 ? 0 : ((currValue - prevValue) / prevValue) * 100;

            growthRates.push({
                quarter: quarters[i],
                rate: growthRate
            });
        }

        console.log('📈 Growth data calculated:', growthRates);
        return growthRates;
    }

    getTrendsData() {
        if (!this.data) {
            console.warn('⚠️ No data available for trends');
            return [];
        }

        console.log('🔍 Processing trends data from:', this.data.length, 'records');

        const quarterly = {};
        this.data.forEach(item => {
            // Handle different data formats
            const quarter = item.quarter || item.period || 'Unknown';
            const value = parseFloat(item.export_value || item.exports || item.value || 0);

            if (quarter !== 'Unknown' && value > 0) {
                quarterly[quarter] = (quarterly[quarter] || 0) + value;
            }
        });

        const result = Object.entries(quarterly)
            .map(([quarter, value]) => ({
                quarter: quarter,
                value: value
            }))
            .sort((a, b) => a.quarter.localeCompare(b.quarter));

        console.log('📈 Trends data processed:', result);
        return result;
    }

    getCountryLatLng(country) {
        const coordinates = {
            'United Arab Emirates': { lat: 23.4241, lng: 53.8478 },
            'Democratic Republic of the Congo': { lat: -4.0383, lng: 21.7587 },
            'China': { lat: 35.8617, lng: 104.1954 },
            'United Kingdom': { lat: 55.3781, lng: -3.4360 },
            'Hong Kong': { lat: 22.3193, lng: 114.1694 },
            'Netherlands': { lat: 52.1326, lng: 5.2913 },
            'Singapore': { lat: 1.3521, lng: 103.8198 },
            'Pakistan': { lat: 30.3753, lng: 69.3451 },
            'India': { lat: 20.5937, lng: 78.9629 },
            'United States': { lat: 37.0902, lng: -95.7129 }
        };

        return coordinates[country] || { lat: 0, lng: 0 };
    }

    getSectionName(section) {
        const names = {
            '0': 'Food and live animals',
            '1': 'Beverages and tobacco',
            '2': 'Crude materials',
            '3': 'Mineral fuels',
            '4': 'Animal and vegetable oils',
            '5': 'Chemicals',
            '6': 'Manufactured goods',
            '7': 'Machinery and transport equipment',
            '8': 'Miscellaneous manufactured articles',
            '9': 'Other commodities'
        };

        return names[section] || section;
    }

    populateTable() {
        const tableBody = document.getElementById('export-table-body');
        if (!tableBody) return;

        const topDestinations = this.getTopDestinations(10);

        tableBody.innerHTML = topDestinations.map((dest, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${dest.country}</td>
                <td>$${dest.value.toLocaleString()}</td>
                <td>${((dest.value / this.getTotalExports()) * 100).toFixed(1)}%</td>
                <td>+${(Math.random() * 20).toFixed(1)}%</td>
                <td><span class="badge bg-success">Growing</span></td>
            </tr>
        `).join('');
    }

    getTotalExports() {
        if (!this.data) return 0;
        return this.data.reduce((sum, item) => sum + item.export_value, 0);
    }

    filterTable() {
        const searchInput = document.getElementById('export-search');
        const filter = searchInput.value.toLowerCase();
        const table = document.getElementById('export-analysis-table');
        const rows = table.getElementsByTagName('tr');

        for (let i = 1; i < rows.length; i++) {
            const cells = rows[i].getElementsByTagName('td');
            let found = false;

            for (let j = 0; j < cells.length; j++) {
                if (cells[j].textContent.toLowerCase().indexOf(filter) > -1) {
                    found = true;
                    break;
                }
            }

            rows[i].style.display = found ? '' : 'none';
        }
    }

    updateCharts() {
        this.createProductsChart();
        this.createGrowthChart();
        this.createTrendsChart();
        this.createExportMap();
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
    window.exportAnalyzer = new ExportAnalyzer();
});

// Global functions for HTML onclick handlers
function loadExportAnalysis() {
    if (window.exportAnalyzer) {
        window.exportAnalyzer.loadData();
    }
}

function exportExportData() {
    if (window.exportAnalyzer && window.exportAnalyzer.data) {
        const dataStr = JSON.stringify(window.exportAnalyzer.data, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'export_analysis.json';
        link.click();
        URL.revokeObjectURL(url);
    }
}