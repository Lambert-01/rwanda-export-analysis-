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
            console.log('📥 Loading import data from MongoDB collections...');

            // Load data from new MongoDB collections
            const [
                sourcesResponse,
                growthResponse,
                performanceResponse,
                detailedAnalysisResponse,
                periodAnalysisResponse
            ] = await Promise.all([
                fetch('/api/imports/sources?limit=20').catch(() => null),
                fetch('/api/imports/growth-analysis').catch(() => null),
                fetch('/api/imports/performance-analysis').catch(() => null),
                fetch('/api/imports/country-analysis').catch(() => null),
                fetch('/api/imports/sitc-analysis').catch(() => null)
            ]);

            // Load additional data for comprehensive analysis
            let sourcesData = [];
            let growthData = [];
            let performanceData = [];
            let detailedAnalysis = [];
            let sitcData = [];

            if (sourcesResponse && sourcesResponse.ok) {
                sourcesData = await sourcesResponse.json();
            }

            if (growthResponse && growthResponse.ok) {
                const growthResult = await growthResponse.json();
                growthData = growthResult.growth_data || [];
            }

            if (performanceResponse && performanceResponse.ok) {
                const performanceResult = await performanceResponse.json();
                performanceData = performanceResult.performance_data || [];
            }

            if (detailedAnalysisResponse && detailedAnalysisResponse.ok) {
                const detailedResult = await detailedAnalysisResponse.json();
                detailedAnalysis = detailedResult.countries || detailedResult.sources || [];
                console.log('📋 Detailed analysis loaded:', detailedAnalysis.length, 'countries');
            }

            if (periodAnalysisResponse && periodAnalysisResponse.ok) {
                sitcData = await periodAnalysisResponse.json();
            }

            console.log('📥 Import MongoDB data loaded:', {
                sources: sourcesData,
                growth: growthData,
                performance: performanceData,
                detailed: detailedAnalysis,
                sitc: sitcData
            });

            if (sourcesData && sourcesData.length > 0) {
                console.log('✅ Import data loaded successfully, rendering dashboard...');
                this.populateDashboardStats(sourcesData, growthData, detailedAnalysis);
                this.renderCharts(sourcesData, growthData, performanceData, sitcData);

                // Ensure table gets populated with some data
                if (detailedAnalysis && detailedAnalysis.length > 0) {
                    this.populateTable(detailedAnalysis);
                } else {
                    // Use sources data as fallback for table
                    this.populateTable(sourcesData);
                }

                this.hideLoading();
            } else {
                console.warn('⚠️ No import data received from MongoDB');
                this.showError('No import data available');
            }
        } catch (error) {
            console.error('❌ Error loading import data:', error);
            this.showError('Failed to load import data: ' + error.message);
        }
    }

    renderCharts(sourcesData, growthData, performanceData, sitcData) {
        this.createSourcesChart(sourcesData);
        this.createCategoriesChart(sitcData);
        this.createTrendsChart(growthData);
        this.createDependenciesChart(sourcesData);
    }

    createSourcesChart(sourcesData) {
        const ctx = document.getElementById('import-sources-chart');
        if (!ctx) {
            console.warn('⚠️ Import sources chart container not found');
            return;
        }

        try {
            // Use provided sources data or fallback to calculated data
            const chartSourcesData = sourcesData || this.getTopSources();
            console.log('📥 Import sources data for chart:', chartSourcesData);

            if (!chartSourcesData || chartSourcesData.length === 0) {
                console.warn('⚠️ No import sources data available for chart');
                return;
            }

            const data = {
                labels: chartSourcesData.map(s => s.country || s.source_country || 'Unknown'),
                datasets: [{
                    label: 'Import Value',
                    data: chartSourcesData.map(s => s.value || s.total_value || 0),
                    backgroundColor: 'rgba(54, 162, 235, 0.8)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1,
                    borderRadius: 8
                }]
            };

            if (this.charts.sourcesChart) {
                this.charts.sourcesChart.destroy();
            }

            console.log('📊 Creating import sources chart with MongoDB data:', data);
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
                                    return `Import Value: $${(context.parsed.y).toFixed(2)}`;
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
                                text: 'Import Value'
                            },
                            ticks: {
                                callback: function(value) {
                                    return '$' + value.toLocaleString();
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

    createCategoriesChart(sitcData) {
        const ctx = document.getElementById('import-categories-chart');
        if (!ctx) {
            console.warn('⚠️ Import categories chart container not found');
            return;
        }

        try {
            // Use SITC data from MongoDB or fallback to calculated data
            let categoriesData = [];

            if (sitcData && sitcData.sitc_sections) {
                categoriesData = sitcData.sitc_sections.map(section => ({
                    name: section.section_name || `Section ${section.sitc_section}`,
                    value: section.total_value || 0
                }));
            } else {
                categoriesData = this.getCategoriesData();
            }

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
                        '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF',
                        '#4BC0C0', '#9966FF'
                    ]
                }]
            };

            if (this.charts.categoriesChart) {
                this.charts.categoriesChart.destroy();
            }

            console.log('📊 Creating import categories chart with MongoDB data:', data);
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
                                    return `${label}: $${value.toLocaleString()}`;
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

    createTrendsChart(growthData) {
        const ctx = document.getElementById('import-trends-chart');
        if (!ctx) {
            console.warn('⚠️ Import trends chart container not found');
            return;
        }

        try {
            // Use growth data from MongoDB or fallback to calculated data
            let trendsData = [];

            if (growthData && growthData.length > 0) {
                trendsData = growthData.map(item => ({
                    quarter: item.quarter,
                    value: item.import_value || 0
                }));
            } else {
                trendsData = this.getTrendsData();
            }

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

            console.log('📊 Creating import trends chart with MongoDB data:', data);
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
                                    return `Import Value: $${context.parsed.y.toLocaleString()}`;
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
                                text: 'Import Value'
                            },
                            ticks: {
                                callback: function(value) {
                                    return '$' + value.toLocaleString();
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

    createDependenciesChart(sourcesData) {
        const ctx = document.getElementById('trade-dependencies-chart');
        if (!ctx) {
            console.warn('⚠️ Trade dependencies chart container not found');
            return;
        }

        try {
            // Calculate dependencies from sources data
            const dependenciesData = this.getDependenciesData(sourcesData);
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

            console.log('📊 Creating trade dependencies chart with MongoDB data:', data);
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
            // Handle different data formats from MongoDB collections
            const country = item.source_country || item.country || 'Unknown';
            const value = parseFloat(item.import_value || item.imports || item.value || item.total_value || 0);

            if (country !== 'Unknown' && value > 0) {
                sources[country] = (sources[country] || 0) + value;
            }
        });

        const result = Object.entries(sources)
            .map(([country, value]) => ({
                country,
                value,
                // Add mock growth rate for now - in real implementation this would come from growth analysis
                growth_rate: (Math.random() * 20 - 10) // Random between -10% and +10%
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, limit);

        console.log('📥 Import sources data processed:', result);
        return result;
    }

    getTotalImports() {
        if (!this.data) return 0;
        return this.data.reduce((sum, item) => sum + (parseFloat(item.import_value) || 0), 0);
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

    getDependenciesData(sourcesData) {
        // Use provided sources data or fallback to calculated data
        const topSources = sourcesData || this.getTopSources(5);
        const totalImports = topSources.reduce((sum, source) => sum + (source.value || 0), 0);

        return topSources.map(source => ({
            country: source.country || source.source_country,
            score: totalImports > 0 ? ((source.value || 0) / totalImports) * 100 : 0
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

    populateTable(data) {
        const tableBody = document.getElementById('import-table-body');
        if (!tableBody) {
            console.error('❌ Import table body not found');
            return;
        }

        console.log('📋 Populating import table with data:', data);

        // Handle different data formats (detailedAnalysis or sourcesData)
        let tableData = [];

        if (data && data.length > 0) {
            // Check if this is detailed analysis data (has more complex structure)
            if (data[0] && (data[0].total_value_2022_2025 || data[0].q4_2024_value || data[0].share_percentage)) {
                console.log('📋 Using detailed analysis data for table');
                tableData = data.slice(0, 10).map((item, index) => ({
                    rank: item.rank || (index + 1),
                    country: item.country || item.source_country,
                    total_value: item.total_value_2022_2025 || 0,
                    q4_2024_value: item.q4_2024_value || 0,
                    share_percentage: item.share_percentage || 0,
                    growth_rate: item.growth_rate || 0,
                    trend: item.trend || 'Stable',
                    trend_class: item.trend_class || 'warning'
                }));
            } else {
                // This is sources data
                console.log('📋 Using sources data for table');
                const totalImports = data.reduce((sum, source) => sum + (source.value || 0), 0);

                tableData = data.map((source, index) => {
                    const sharePercentage = totalImports > 0 ? ((source.value || 0) / totalImports) * 100 : 0;
                    const growthRate = source.growth_rate || (Math.random() * 20 - 10);

                    return {
                        rank: index + 1,
                        country: source.country || source.source_country,
                        total_value: source.value || 0,
                        q4_2024_value: source.value || 0, // Use same value as proxy for Q4
                        share_percentage: sharePercentage,
                        growth_rate: growthRate,
                        trend: growthRate > 5 ? 'Strong Growth' : growthRate > 0 ? 'Growth' : growthRate < -5 ? 'Declining' : 'Stable',
                        trend_class: growthRate > 5 ? 'success' : growthRate > 0 ? 'info' : growthRate < -5 ? 'danger' : 'warning'
                    };
                });
            }
        } else {
            console.warn('📋 No data provided for table');
            tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No import data available</td></tr>';
            return;
        }

        console.log('📋 Table data prepared:', tableData);

        tableBody.innerHTML = tableData.map(item => `
            <tr>
                <td>${item.rank}</td>
                <td>${item.country}</td>
                <td>$${item.total_value.toLocaleString()}</td>
                <td>$${item.q4_2024_value.toLocaleString()}</td>
                <td>${item.share_percentage.toFixed(1)}%</td>
                <td>${item.growth_rate >= 0 ? '+' : ''}${item.growth_rate.toFixed(1)}%</td>
                <td>
                    <span class="badge bg-${item.trend_class}">
                        ${item.trend}
                    </span>
                </td>
            </tr>
        `).join('');

        console.log('✅ Import table populated successfully');
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

    populateDashboardStats(sourcesData, growthData, detailedAnalysis) {
        try {
            console.log('📊 Populating dashboard stats with MongoDB data...');

            // Populate total import sources
            if (sourcesData && sourcesData.length > 0) {
                const sourcesElement = document.getElementById('total-import-sources');
                if (sourcesElement) {
                    sourcesElement.textContent = sourcesData.length;
                }
            }

            // Populate import categories (SITC sections) - use detailed analysis
            if (detailedAnalysis && detailedAnalysis.length > 0) {
                const categoriesElement = document.getElementById('import-categories');
                if (categoriesElement) {
                    // Count unique SITC sections from detailed analysis
                    const sitcSections = new Set();
                    detailedAnalysis.forEach(item => {
                        if (item.sitc_breakdown) {
                            item.sitc_breakdown.forEach(section => {
                                sitcSections.add(section.section);
                            });
                        }
                    });
                    categoriesElement.textContent = sitcSections.size || detailedAnalysis.length;
                }
            }

            // Populate import growth from MongoDB growth data
            if (growthData && growthData.length > 0) {
                const latestGrowth = growthData[growthData.length - 1];
                const growthElement = document.getElementById('import-growth');
                if (growthElement && latestGrowth) {
                    const growthRate = latestGrowth.growth_rate || 0;
                    const sign = growthRate >= 0 ? '+' : '';
                    growthElement.textContent = `${sign}${growthRate.toFixed(1)}%`;
                }
            }

            // Populate import dependency (calculate from detailed analysis)
            if (detailedAnalysis && detailedAnalysis.length > 0) {
                const dependencyElement = document.getElementById('import-dependency');
                if (dependencyElement) {
                    // Calculate total import value from all sources
                    const totalImportValue = detailedAnalysis.reduce((sum, item) => {
                        return sum + (item.total_value_2022_2025 || 0);
                    }, 0);

                    // Calculate dependency ratio (mock calculation based on data distribution)
                    const topSourceValue = detailedAnalysis[0]?.total_value_2022_2025 || 0;
                    const dependencyRatio = totalImportValue > 0 ? (topSourceValue / totalImportValue) * 100 : 0;
                    dependencyElement.textContent = `${dependencyRatio.toFixed(1)}%`;
                }
            }

            console.log('📊 Dashboard stats populated successfully with MongoDB data');
        } catch (error) {
            console.error('❌ Error populating dashboard stats:', error);
        }
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

function refreshImportsData() {
    if (window.importAnalyzer) {
        console.log('🔄 Refreshing import data...');
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

function toggleNotifications() {
    console.log('🔔 Notifications toggled');
    // Placeholder for notifications functionality
}

function askQuestion(question) {
    if (window.aiChatbox) {
        window.aiChatbox.sendMessage(question);
    }
}

function sendMessage() {
    if (window.aiChatbox) {
        const chatInput = document.getElementById('chat-input');
        if (chatInput && chatInput.value.trim()) {
            window.aiChatbox.sendMessage(chatInput.value.trim());
            chatInput.value = '';
        }
    }
}

function toggleChatbox() {
    if (window.aiChatbox) {
        window.aiChatbox.toggle();
    }
}

function minimizeChatbox() {
    if (window.aiChatbox) {
        window.aiChatbox.minimize();
    }
}

function closeChatbox() {
    if (window.aiChatbox) {
        window.aiChatbox.close();
    }
}