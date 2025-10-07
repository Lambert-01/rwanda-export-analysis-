/**
 * Imports Page JavaScript
 * Handles import analysis functionality
 */

class ImportAnalyzer {
    constructor() {
        this.data = null;
        this.charts = {};
        this.initializeEventListeners();
        this.loadData();
    }

    initializeEventListeners() {
        // Chart type buttons
        const chartButtons = document.querySelectorAll('[data-import-chart]');
        chartButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                chartButtons.forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                this.updateCharts();
            });
        });

        // Search functionality
        const searchInput = document.getElementById('import-search');
        if (searchInput) {
            searchInput.addEventListener('input', () => this.filterTable());
        }
    }

    async loadData() {
        try {
            console.log('📥 Loading import data...');

            // Load data from backend API
            const response = await fetch('/api/imports/quarterly');
            this.data = await response.json();

            console.log('📥 Import data loaded:', this.data);

            if (this.data && this.data.length > 0) {
                console.log('✅ Import data loaded successfully, rendering charts...');
                this.renderCharts();
                this.populateTable();
                this.hideLoading();
            } else {
                console.warn('⚠️ No import data received from API');
                this.showError('No import data available');
            }
        } catch (error) {
            console.error('❌ Error loading import data:', error);
            this.showError('Failed to load import data: ' + error.message);
        }
    }

    renderCharts() {
        this.createSourcesChart();
        this.createCategoriesChart();
        this.createTrendsChart();
        this.createDependenciesChart();
    }

    createSourcesChart() {
        const ctx = document.getElementById('import-sources-chart');
        if (!ctx) {
            console.warn('⚠️ Import sources chart container not found');
            return;
        }

        try {
            const sourcesData = this.getTopSources();
            console.log('📥 Import sources data for chart:', sourcesData);

            if (!sourcesData || sourcesData.length === 0) {
                console.warn('⚠️ No import sources data available for chart');
                return;
            }

            const data = {
                labels: sourcesData.map(s => s.country || 'Unknown'),
                datasets: [{
                    label: 'Import Value (Millions USD)',
                    data: sourcesData.map(s => s.value || 0),
                    backgroundColor: 'rgba(54, 162, 235, 0.8)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1,
                    borderRadius: 8
                }]
            };

            if (this.charts.sourcesChart) {
                this.charts.sourcesChart.destroy();
            }

            console.log('📊 Creating import sources chart with data:', data);
            this.charts.sourcesChart = new Chart(ctx, {
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
                                    return `Import Value: $${(context.parsed.y / 1000000).toFixed(2)}M`;
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
                                text: 'Import Value (Millions USD)'
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
            console.log('✅ Import sources chart created successfully');
        } catch (error) {
            console.error('❌ Error creating import sources chart:', error);
        }
    }

    createCategoriesChart() {
        const ctx = document.getElementById('import-categories-chart');
        if (!ctx) {
            console.warn('⚠️ Import categories chart container not found');
            return;
        }

        try {
            const categoriesData = this.getCategoriesData();
            console.log('📦 Import categories data for chart:', categoriesData);

            if (!categoriesData || categoriesData.length === 0) {
                console.warn('⚠️ No import categories data available for chart');
                return;
            }

            const data = {
                labels: categoriesData.map(c => c.name || 'Unknown'),
                datasets: [{
                    data: categoriesData.map(c => c.value || 0),
                    backgroundColor: [
                        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                        '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
                    ]
                }]
            };

            if (this.charts.categoriesChart) {
                this.charts.categoriesChart.destroy();
            }

            console.log('📊 Creating import categories chart with data:', data);
            this.charts.categoriesChart = new Chart(ctx, {
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
            console.log('✅ Import categories chart created successfully');
        } catch (error) {
            console.error('❌ Error creating import categories chart:', error);
        }
    }

    createTrendsChart() {
        const ctx = document.getElementById('import-trends-chart');
        if (!ctx) {
            console.warn('⚠️ Import trends chart container not found');
            return;
        }

        try {
            const trendsData = this.getTrendsData();
            console.log('📈 Import trends data for chart:', trendsData);

            if (!trendsData || trendsData.length === 0) {
                console.warn('⚠️ No import trends data available for chart');
                return;
            }

            const data = {
                labels: trendsData.map(t => t.quarter || 'Unknown'),
                datasets: [{
                    label: 'Import Value',
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

            console.log('📊 Creating import trends chart with data:', data);
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
                                    return `Import Value: $${(context.parsed.y / 1000000).toFixed(2)}M`;
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
                                text: 'Import Value (Millions USD)'
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
            console.log('✅ Import trends chart created successfully');
        } catch (error) {
            console.error('❌ Error creating import trends chart:', error);
        }
    }

    createDependenciesChart() {
        const ctx = document.getElementById('trade-dependencies-chart');
        if (!ctx) {
            console.warn('⚠️ Trade dependencies chart container not found');
            return;
        }

        try {
            const dependenciesData = this.getDependenciesData();
            console.log('🔗 Trade dependencies data for chart:', dependenciesData);

            if (!dependenciesData || dependenciesData.length === 0) {
                console.warn('⚠️ No trade dependencies data available for chart');
                return;
            }

            const data = {
                labels: dependenciesData.map(d => d.country || 'Unknown'),
                datasets: [{
                    label: 'Dependency Score',
                    data: dependenciesData.map(d => d.score || 0),
                    backgroundColor: 'rgba(255, 206, 86, 0.8)',
                    borderColor: 'rgba(255, 206, 86, 1)',
                    borderWidth: 1,
                    borderRadius: 8
                }]
            };

            if (this.charts.dependenciesChart) {
                this.charts.dependenciesChart.destroy();
            }

            console.log('📊 Creating trade dependencies chart with data:', data);
            this.charts.dependenciesChart = new Chart(ctx, {
                type: 'bar',
                data: data,
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `Dependency Score: ${context.parsed.x.toFixed(1)}%`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: { color: '#e2e8f0' },
                            title: {
                                display: true,
                                text: 'Dependency Score (%)'
                            },
                            ticks: {
                                callback: function(value) {
                                    return value.toFixed(1) + '%';
                                },
                                font: { weight: '600' }
                            }
                        },
                        y: {
                            grid: { display: false },
                            ticks: { font: { weight: '600' } }
                        }
                    },
                    animation: {
                        duration: 1200,
                        easing: 'easeOutQuart'
                    }
                }
            });
            console.log('✅ Trade dependencies chart created successfully');
        } catch (error) {
            console.error('❌ Error creating trade dependencies chart:', error);
        }
    }

    getTopSources(limit = 10) {
        if (!this.data) {
            console.warn('⚠️ No import data available for sources');
            return [];
        }

        console.log('🔍 Processing import sources data:', this.data.length, 'records');

        const sources = {};
        this.data.forEach(item => {
            // Handle different data formats
            const country = item.source_country || item.country || 'Unknown';
            const value = parseFloat(item.import_value || item.imports || item.value || 0);

            if (country !== 'Unknown' && value > 0) {
                sources[country] = (sources[country] || 0) + value;
            }
        });

        const result = Object.entries(sources)
            .map(([country, value]) => ({ country, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, limit);

        console.log('📥 Import sources data processed:', result);
        return result;
    }

    getCategoriesData() {
        if (!this.data) {
            console.warn('⚠️ No import data available for categories');
            return [];
        }

        console.log('🔍 Processing import categories data:', this.data.length, 'records');

        const categories = {};
        this.data.forEach(item => {
            // Handle different data formats
            const section = item.sitc_section || item.category || item.commodity || 'Other';
            const value = parseFloat(item.import_value || item.imports || item.value || 0);

            if (value > 0) {
                categories[section] = (categories[section] || 0) + value;
            }
        });

        const result = Object.entries(categories)
            .map(([section, value]) => ({
                name: this.getSectionName(section),
                value
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 8); // Limit to top 8 for better visualization

        console.log('📦 Import categories data processed:', result);
        return result;
    }

    getTrendsData() {
        if (!this.data) {
            console.warn('⚠️ No import data available for trends');
            return [];
        }

        console.log('🔍 Processing import trends data:', this.data.length, 'records');

        const quarterly = {};
        this.data.forEach(item => {
            // Handle different data formats
            const quarter = item.quarter || item.period || 'Unknown';
            const value = parseFloat(item.import_value || item.imports || item.value || 0);

            if (quarter !== 'Unknown' && value > 0) {
                quarterly[quarter] = (quarterly[quarter] || 0) + value;
            }
        });

        const result = Object.entries(quarterly)
            .map(([quarter, value]) => ({ quarter, value }))
            .sort((a, b) => a.quarter.localeCompare(b.quarter));

        console.log('📈 Import trends data processed:', result);
        return result;
    }

    getDependenciesData() {
        const topSources = this.getTopSources(5);
        const totalImports = this.getTotalImports();

        return topSources.map(source => ({
            country: source.country,
            score: (source.value / totalImports) * 100
        }));
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

    getTotalImports() {
        if (!this.data) return 0;
        return this.data.reduce((sum, item) => sum + item.import_value, 0);
    }

    populateTable() {
        const tableBody = document.getElementById('import-table-body');
        if (!tableBody) return;

        const topSources = this.getTopSources(10);

        tableBody.innerHTML = topSources.map((source, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${source.country}</td>
                <td>$${source.value.toLocaleString()}</td>
                <td>${((source.value / this.getTotalImports()) * 100).toFixed(1)}%</td>
                <td>+${(Math.random() * 15).toFixed(1)}%</td>
                <td>+${(Math.random() * 10).toFixed(1)}%</td>
            </tr>
        `).join('');
    }

    filterTable() {
        const searchInput = document.getElementById('import-search');
        const filter = searchInput.value.toLowerCase();
        const table = document.getElementById('import-analysis-table');
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
        this.createSourcesChart();
        this.createCategoriesChart();
        this.createTrendsChart();
        this.createDependenciesChart();
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
    window.importAnalyzer = new ImportAnalyzer();
});

// Global functions for HTML onclick handlers
function loadImportAnalysis() {
    if (window.importAnalyzer) {
        window.importAnalyzer.loadData();
    }
}

function exportImportData() {
    if (window.importAnalyzer && window.importAnalyzer.data) {
        const dataStr = JSON.stringify(window.importAnalyzer.data, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'import_analysis.json';
        link.click();
        URL.revokeObjectURL(url);
    }
}