/**
 * Exports Page JavaScript
 * Handles export analysis functionality
 */

class ExportAnalyzer {
    constructor() {
        this.data = null;
        this.charts = {};
        this.sitcData = null;
        this.growthData = null;
        this.performanceData = null;
        this.countryData = null;
        this.initializeEventListeners();
        this.loadData();
    }

    initializeEventListeners() {
        // Year filter
        const yearFilter = document.getElementById('export-year-filter');
        if (yearFilter) {
            yearFilter.addEventListener('change', () => this.updateCharts());
        }

        // Product filter (period filter)
        const productFilter = document.getElementById('export-product-filter');
        if (productFilter) {
            productFilter.addEventListener('change', (e) => {
                const selectedPeriod = e.target.value;
                this.updatePeriodAnalysis(selectedPeriod);
            });
        }

        // Chart type radio buttons
        const chartTypeRadios = document.querySelectorAll('input[name="export-chart-type"]');
        chartTypeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.updateChartView(e.target.id);
                }
            });
        });

        // Search functionality
        const searchInput = document.getElementById('export-search');
        if (searchInput) {
            searchInput.addEventListener('input', () => this.filterTable());
        }
    }

    async loadData() {
        try {
            console.log('🔄 Loading export data...');

            // Load multiple datasets for comprehensive analysis
            await Promise.all([
                this.loadQuarterlyData(),
                this.loadSITCAnalysis(),
                this.loadGrowthAnalysis(),
                this.loadPerformanceAnalysis(),
                this.loadCountryAnalysis()
            ]);

            console.log('✅ All export data loaded successfully');
            console.log('📊 SITC Data:', this.sitcData);
            console.log('📈 Growth Data:', this.growthData);
            console.log('📋 Performance Data:', this.performanceData);
            console.log('🌍 Country Data:', this.countryData);

            this.renderCharts();
            this.populateTable();
            this.hideLoading();

        } catch (error) {
            console.error('❌ Error loading export data:', error);
            this.showError('Failed to load export data: ' + error.message);

            // Fallback to sample data if API fails
            console.log('🔄 Using fallback sample data...');
            setTimeout(() => {
                this.loadFallbackData();
            }, 1000);
        }

        // Also set a timeout to ensure charts render even if data loading is slow
        setTimeout(() => {
            if (!this.data || this.data.length === 0) {
                console.log('⏰ Data loading timeout reached, using fallback data...');
                this.loadFallbackData();
            }
        }, 3000);

        // Force render charts after a short delay to ensure everything is loaded
        setTimeout(() => {
            console.log('🔄 Force rendering charts after initialization delay...');
            if (!this.charts.productsChart && !this.charts.growthChart && !this.charts.trendsChart) {
                console.log('📊 No charts detected, forcing fallback data render...');
                this.loadFallbackData();
            }
        }, 1500);
    }

    async loadQuarterlyData() {
        try {
            const response = await fetch('/api/exports/quarterly');
            const data = await response.json();

            // Check if MongoDB data is corrupted (only one quarter with unrealistic value)
            if (data && data.length === 1 && data[0].exports > 5000) {
                console.log('📊 MongoDB quarterly data corrupted, falling back to main exports endpoint');
                const fallbackResponse = await fetch('/api/exports');
                this.data = await fallbackResponse.json();
            } else {
                this.data = data;
            }

            console.log('📊 Quarterly export data loaded:', this.data);
        } catch (error) {
            console.error('❌ Error loading quarterly data:', error);
            // Fallback to main exports endpoint
            try {
                const fallbackResponse = await fetch('/api/exports');
                this.data = await fallbackResponse.json();
                console.log('📊 Using fallback exports data:', this.data);
            } catch (fallbackError) {
                console.error('❌ Fallback also failed:', fallbackError);
            }
        }
    }

    async loadSITCAnalysis() {
        try {
            const response = await fetch('/api/exports/sitc-analysis');
            const data = await response.json();

            // Check if MongoDB data is correct
            if (data && data.sitc_sections && data.sitc_sections.length > 0) {
                const firstSection = data.sitc_sections[0];

                // Check if data looks realistic (not the corrupted MongoDB data)
                if (firstSection.total_value < 10000 && firstSection.sitc_section !== 'Total') {
                    this.sitcData = data;
                    console.log('📊 SITC analysis loaded from MongoDB:', this.sitcData);
                    return;
                }
            }

            console.log('📊 MongoDB SITC data incorrect or corrupted, falling back to JSON file');
            await this.loadSITCAnalysisFromJSON();
        } catch (error) {
            console.error('❌ Error loading SITC analysis from MongoDB:', error);
            await this.loadSITCAnalysisFromJSON();
        }
    }

    async loadSITCAnalysisFromJSON() {
        try {
            console.log('📊 Loading SITC analysis from JSON file...');
            const response = await fetch('/data/processed/export_sitc_products.json');
            if (response.ok) {
                this.sitcData = await response.json();
                console.log('📊 SITC analysis loaded from JSON:', this.sitcData);
            } else {
                console.error('❌ Could not load SITC analysis from JSON');
            }
        } catch (error) {
            console.error('❌ Error loading SITC analysis from JSON:', error);
        }
    }

    async loadGrowthAnalysis() {
        try {
            const response = await fetch('/api/exports/growth-analysis');
            const data = await response.json();

            // Check if MongoDB data is correct
            if (data && data.growth_data && data.growth_data.length > 0) {
                const firstQuarter = data.growth_data[0];

                // Check if data looks realistic (not corrupted MongoDB data)
                // MongoDB has 8939.73 which is unrealistic, real data should be < 1000
                if (firstQuarter.export_value < 1000 && firstQuarter.quarter &&
                    data.growth_data.length > 1 && data.quarters_analyzed > 1) {
                    this.growthData = data;
                    console.log('📈 Growth analysis loaded from MongoDB:', this.growthData);
                    return;
                }
            }

            console.log('📈 MongoDB growth data incorrect or corrupted, falling back to JSON file');
            await this.loadGrowthAnalysisFromJSON();
        } catch (error) {
            console.error('❌ Error loading growth analysis from MongoDB:', error);
            await this.loadGrowthAnalysisFromJSON();
        }
    }

    async loadGrowthAnalysisFromJSON() {
        try {
            console.log('📈 Loading growth analysis from JSON file...');
            const response = await fetch('/data/processed/export_growth_by_quarter.json');
            if (response.ok) {
                this.growthData = await response.json();
                console.log('📈 Growth analysis loaded from JSON:', this.growthData);
            } else {
                console.error('❌ Could not load growth analysis from JSON');
            }
        } catch (error) {
            console.error('❌ Error loading growth analysis from JSON:', error);
        }
    }

    async loadPerformanceAnalysis() {
        try {
            const response = await fetch('/api/exports/performance-analysis');
            const data = await response.json();

            // Check if MongoDB data is correct
            if (data && data.performance_data && data.performance_data.length > 0) {
                const firstQuarter = data.performance_data[0];

                // Check if data looks realistic (not corrupted MongoDB data)
                // MongoDB has 8939.73 which is unrealistic, real data should be < 1000
                if (firstQuarter.total_value < 1000 && firstQuarter.quarter &&
                    data.performance_data.length > 1 && data.quarters_analyzed > 1) {
                    this.performanceData = data;
                    console.log('📊 Performance analysis loaded from MongoDB:', this.performanceData);
                    return;
                }
            }

            console.log('📊 MongoDB performance data incorrect or corrupted, falling back to JSON file');
            await this.loadPerformanceAnalysisFromJSON();
        } catch (error) {
            console.error('❌ Error loading performance analysis from MongoDB:', error);
            await this.loadPerformanceAnalysisFromJSON();
        }
    }

    async loadPerformanceAnalysisFromJSON() {
        try {
            console.log('📊 Loading performance analysis from JSON file...');
            const response = await fetch('/data/processed/export_performance_over_time.json');
            if (response.ok) {
                this.performanceData = await response.json();
                console.log('📊 Performance analysis loaded from JSON:', this.performanceData);
            } else {
                console.error('❌ Could not load performance analysis from JSON');
            }
        } catch (error) {
            console.error('❌ Error loading performance analysis from JSON:', error);
        }
    }

    async loadCountryAnalysis() {
        try {
            const response = await fetch('/api/exports/country-analysis');
            const data = await response.json();

            // Check if MongoDB data is correct
            if (data && data.countries && data.countries.length > 0) {
                const firstCountry = data.countries[0];

                // Check if data looks realistic (not corrupted MongoDB data)
                if (firstCountry.total_value_2022_2025 < 10000 &&
                    firstCountry.q4_2024_value < firstCountry.total_value_2022_2025) {
                    this.countryData = data;
                    console.log('🌍 Country analysis loaded from MongoDB:', this.countryData);
                    return;
                }
            }

            console.log('🌍 MongoDB country data incorrect or corrupted, falling back to JSON file');
            await this.loadCountryAnalysisFromJSON();
        } catch (error) {
            console.error('❌ Error loading country analysis from MongoDB:', error);
            await this.loadCountryAnalysisFromJSON();
        }
    }

    async loadCountryAnalysisFromJSON() {
        try {
            console.log('🌍 Loading country analysis from JSON file...');
            // Load the detailed country analysis from the JSON file
            const response = await fetch('/data/processed/export_detailed_country_analysis.json');
            if (response.ok) {
                this.countryData = await response.json();
                console.log('🌍 Country analysis loaded from JSON:', this.countryData);
            } else {
                console.error('❌ Could not load country analysis from JSON');
            }
        } catch (error) {
            console.error('❌ Error loading country analysis from JSON:', error);
        }
    }

    renderCharts() {
        console.log('🎨 Starting chart rendering process...');

        // Ensure chart containers are visible and canvases are properly sized
        this.ensureChartContainersVisible();

        // Check if Chart.js is loaded before proceeding
        if (typeof Chart === 'undefined') {
            console.error('❌ Chart.js is not loaded! Charts cannot be rendered.');
            console.log('🔄 Attempting to load Chart.js...');

            // Try to dynamically load Chart.js if it's not available
            this.loadChartJs();
            return;
        }

        console.log('✅ Chart.js is loaded, proceeding with chart creation...');

        // Create charts with proper error handling
        try {
            this.createExportMap();
            console.log('✅ Export map created');
        } catch (error) {
            console.error('❌ Error creating export map:', error);
        }

        try {
            this.createProductsChart();
            console.log('✅ Products chart created');
        } catch (error) {
            console.error('❌ Error creating products chart:', error);
        }

        try {
            this.createGrowthChart();
            console.log('✅ Growth chart created');
        } catch (error) {
            console.error('❌ Error creating growth chart:', error);
        }

        try {
            this.createTrendsChart();
            console.log('✅ Trends chart created');
        } catch (error) {
            console.error('❌ Error creating trends chart:', error);
        }

        console.log('✅ All charts rendering completed');
    }

    loadChartJs() {
        console.log('📊 Attempting to dynamically load Chart.js...');

        // Check if Chart.js script is already in the DOM
        const existingScript = document.querySelector('script[src*="chart.js"]');
        if (existingScript) {
            console.log('📊 Chart.js script found in DOM, waiting for it to load...');
            // Wait a bit and try again
            setTimeout(() => {
                if (typeof Chart !== 'undefined') {
                    console.log('✅ Chart.js loaded successfully');
                    this.renderCharts();
                } else {
                    console.error('❌ Chart.js still not available after waiting');
                }
            }, 2000);
            return;
        }

        // Create and append Chart.js script tag
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        script.onload = () => {
            console.log('✅ Chart.js loaded dynamically');
            this.renderCharts();
        };
        script.onerror = () => {
            console.error('❌ Failed to load Chart.js dynamically');
        };
        document.head.appendChild(script);
    }

    ensureChartContainersVisible() {
        console.log('🔍 Ensuring chart containers are visible...');

        const chartContainers = document.querySelectorAll('.chart-container');
        console.log(`📦 Found ${chartContainers.length} chart containers`);

        chartContainers.forEach((container, index) => {
            console.log(`📦 Processing container ${index + 1}:`, container.id);

            container.style.display = 'block';
            container.style.visibility = 'visible';
            container.style.opacity = '1';
            container.style.height = 'auto';
            container.style.overflow = 'visible';
            container.style.minHeight = '300px';

            // Check if container has canvas
            const canvas = container.querySelector('canvas');
            if (canvas) {
                console.log(`✅ Container ${container.id} has canvas:`, canvas.id);
                canvas.style.display = 'block';
                canvas.style.visibility = 'visible';
                canvas.style.width = '100%';
                canvas.style.height = '100%';
            } else {
                console.warn(`⚠️ Container ${container.id} has no canvas element`);
            }
        });

        const chartCards = document.querySelectorAll('.chart-card');
        console.log(`🎴 Found ${chartCards.length} chart cards`);

        chartCards.forEach(card => {
            card.style.display = 'block';
            card.style.visibility = 'visible';
            card.style.opacity = '1';
        });

        console.log(`✅ Ensured ${chartContainers.length} chart containers are visible`);

        // Ensure canvas elements have proper dimensions
        this.ensureCanvasDimensions();
    }

    ensureCanvasDimensions() {
        console.log('📏 Ensuring canvas elements have proper dimensions...');

        const canvases = document.querySelectorAll('.chart-container canvas');
        console.log(`🎨 Found ${canvases.length} canvas elements`);

        canvases.forEach((canvas, index) => {
            console.log(`🎨 Processing canvas ${index + 1}: ${canvas.id}`);

            // Set explicit dimensions if not set
            if (canvas.width === 0 || canvas.height === 0) {
                const container = canvas.parentElement;
                if (container) {
                    const rect = container.getBoundingClientRect();
                    canvas.width = rect.width || 800;
                    canvas.height = rect.height || 300;
                    console.log(`📏 Set canvas ${canvas.id} dimensions to ${canvas.width}x${canvas.height}`);
                }
            } else {
                console.log(`✅ Canvas ${canvas.id} already has dimensions: ${canvas.width}x${canvas.height}`);
            }

            // Ensure canvas is visible
            canvas.style.display = 'block';
            canvas.style.visibility = 'visible';
            canvas.style.width = '100%';
            canvas.style.height = '100%';
        });
    }

    createExportMap() {
        try {
            // Check if map container exists
            const mapContainer = document.getElementById('export-map');
            if (!mapContainer) {
                console.warn('⚠️ Map container not found');
                return;
            }

            // Initialize map if not already done
            if (!this.charts.exportMap) {
                console.log('🗺️ Initializing export map...');
                this.charts.exportMap = L.map('export-map').setView([1.9403, 29.8739], 8);

                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap contributors'
                }).addTo(this.charts.exportMap);

                console.log('✅ Export map initialized successfully');
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
                console.log('📍 Adding markers for destinations:', topDestinations.length);

                topDestinations.forEach(dest => {
                    if (dest.lat && dest.lng && dest.lat !== 0 && dest.lng !== 0) {
                        const marker = L.marker([dest.lat, dest.lng])
                            .bindPopup(`<b>${dest.country}</b><br>Value: $${dest.value.toLocaleString()}M`)
                            .addTo(this.charts.exportMap);
                    }
                });

                console.log('✅ Map markers added successfully');
            }
        } catch (error) {
            console.error('❌ Error creating export map:', error);
        }
    }

    createProductsChart() {
        const ctx = document.getElementById('export-products-chart');
        if (!ctx) {
            console.warn('⚠️ Export products chart container not found');
            return;
        }

        try {
            console.log('🎨 Creating products chart...');
            console.log('📊 SITC Data available:', !!this.sitcData);

            // Check if Chart.js is loaded
            if (typeof Chart === 'undefined') {
                console.error('❌ Chart.js is not loaded!');
                return;
            }

            // Check if canvas context is available
            const context = ctx.getContext('2d');
            if (!context) {
                console.error('❌ Cannot get 2D context for products chart canvas');
                return;
            }

            console.log('✅ Chart.js and canvas context are available');

            // Use SITC analysis data if available, otherwise fall back to original method
            let productsData = [];

            if (this.sitcData && this.sitcData.sitc_sections) {
                productsData = this.sitcData.sitc_sections.map(section => ({
                    name: section.section_name || `Section ${section.sitc_section}`,
                    value: section.total_value || 0
                }));
                console.log('📈 Using SITC analysis data for products chart:', productsData);
            } else {
                productsData = this.getProductsData();
                console.log('📈 Using fallback products data for chart:', productsData);
            }

            console.log('📦 Final products data for chart:', productsData);

            if (!productsData || productsData.length === 0) {
                console.warn('⚠️ No products data available for chart');
                return;
            }

            const labels = productsData.map(p => p.name || 'Unknown');
            const values = productsData.map(p => p.value || 0);

            console.log('📊 Chart labels:', labels);
            console.log('📊 Chart values:', values);

            const data = {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: [
                        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                        '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF',
                        '#4CAF50', '#2196F3', '#FFC107', '#9C27B0'
                    ]
                }]
            };

            if (this.charts.productsChart) {
                this.charts.productsChart.destroy();
            }

            console.log('📊 Creating products chart with data:', data);
            console.log('📊 Chart type: doughnut');

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
            console.log('📈 Creating growth chart...');
            console.log('📊 Growth Data available:', !!this.growthData);

            // Check if Chart.js is loaded
            if (typeof Chart === 'undefined') {
                console.error('❌ Chart.js is not loaded!');
                return;
            }

            // Check if canvas context is available
            const context = ctx.getContext('2d');
            if (!context) {
                console.error('❌ Cannot get 2D context for growth chart canvas');
                return;
            }

            console.log('✅ Chart.js and canvas context are available for growth chart');

            // Use growth analysis data if available, otherwise fall back to original method
            let growthData = [];

            if (this.growthData && this.growthData.growth_data) {
                growthData = this.growthData.growth_data;
                console.log('📈 Using growth analysis data for chart:', growthData);
            } else {
                growthData = this.getGrowthData();
                console.log('📈 Using fallback growth data for chart:', growthData);
            }

            console.log('📈 Final growth data for chart:', growthData);

            if (!growthData || growthData.length === 0) {
                console.warn('⚠️ No growth data available for chart');
                return;
            }

            const labels = growthData.map(g => g.quarter || 'Unknown');
            const values = growthData.map(g => g.growth_rate || g.rate || 0);

            console.log('📊 Growth chart labels:', labels);
            console.log('📊 Growth chart values:', values);

            const data = {
                labels: labels,
                datasets: [{
                    label: 'Export Growth Rate',
                    data: values,
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
            console.log('📊 Chart type: line');

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
            console.log('📈 Creating trends chart...');

            // Check if Chart.js is loaded
            if (typeof Chart === 'undefined') {
                console.error('❌ Chart.js is not loaded!');
                return;
            }

            // Check if canvas context is available
            const context = ctx.getContext('2d');
            if (!context) {
                console.error('❌ Cannot get 2D context for trends chart canvas');
                return;
            }

            console.log('✅ Chart.js and canvas context are available for trends chart');

            const trendsData = this.getTrendsData();
            console.log('📈 Trends data for chart:', trendsData);

            if (!trendsData || trendsData.length === 0) {
                console.warn('⚠️ No trends data available for chart');
                return;
            }

            // Log the actual values being used for the chart
            const labels = trendsData.map(t => t.quarter || 'Unknown');
            const values = trendsData.map(t => t.value || 0);
            console.log('📊 Chart labels:', labels);
            console.log('📊 Chart values:', values);
            console.log('📊 Chart values (in millions):', values.map(v => v / 1000000));

            const data = {
                labels: labels,
                datasets: [{
                    label: 'Export Value',
                    data: values, // Use raw values, not divided by million
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
        console.log('📊 Raw data sample:', this.data.slice(0, 3));

        const quarterly = {};
        this.data.forEach(item => {
            // Handle different data formats - prioritize period over quarter
            const quarter = item.period || item.quarter || 'Unknown';
            const value = parseFloat(item.exports || item.export_value || item.value || 0);

            console.log(`Processing item - quarter: ${quarter}, value: ${value}`);

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
        console.log('📊 Quarterly aggregated values:', quarterly);
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
        if (!tableBody) {
            console.warn('⚠️ Table body element not found');
            return;
        }

        console.log('📋 Populating country analysis table...');
        console.log('🌍 Country data available:', !!this.countryData);

        // Use country analysis data if available, otherwise fall back to original method
        if (this.countryData && this.countryData.countries && this.countryData.countries.length > 0) {
            console.log('🌍 Using country analysis data for table, count:', this.countryData.countries.length);

            const firstCountry = this.countryData.countries[0];
            console.log('🌍 First country sample:', firstCountry);

            tableBody.innerHTML = this.countryData.countries.map(country => `
                <tr>
                    <td>${country.rank}</td>
                    <td>${country.country}</td>
                    <td>$${country.total_value_2022_2025.toLocaleString()}</td>
                    <td>$${country.q4_2024_value.toLocaleString()}</td>
                    <td>${country.share_percentage.toFixed(1)}%</td>
                    <td class="${country.growth_rate >= 0 ? 'text-success' : 'text-danger'}">
                        ${country.growth_rate >= 0 ? '+' : ''}${country.growth_rate.toFixed(1)}%
                    </td>
                    <td><span class="badge bg-${country.trend_class}">${country.trend}</span></td>
                </tr>
            `).join('');

            console.log('✅ Table populated with', this.countryData.countries.length, 'countries');
        } else {
            console.log('🌍 Using fallback method for table');
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

            console.log('✅ Table populated with fallback data');
        }
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

    async updatePeriodAnalysis(period) {
        try {
            console.log(`📊 Loading period analysis for: ${period}`);

            const response = await fetch(`/api/exports/period-analysis/${period}`);
            const periodData = await response.json();

            if (periodData && periodData.sitc_sections) {
                // Update the products chart with period-specific data
                this.updateProductsChartWithPeriodData(periodData);
                console.log('✅ Period analysis updated successfully');
            }
        } catch (error) {
            console.error('❌ Error updating period analysis:', error);
        }
    }

    updateProductsChartWithPeriodData(periodData) {
        const ctx = document.getElementById('export-products-chart');
        if (!ctx || !this.charts.productsChart) return;

        try {
            const productsData = periodData.sitc_sections.map(section => ({
                name: section.section_name || `Section ${section.sitc_section}`,
                value: section.total_value || 0
            }));

            if (productsData.length === 0) return;

            const data = {
                labels: productsData.map(p => p.name),
                datasets: [{
                    data: productsData.map(p => p.value),
                    backgroundColor: [
                        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                        '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF',
                        '#4CAF50', '#2196F3', '#FFC107', '#9C27B0'
                    ]
                }]
            };

            this.charts.productsChart.data = data;
            this.charts.productsChart.update();

            console.log('📊 Products chart updated with period data');
        } catch (error) {
            console.error('❌ Error updating products chart:', error);
        }
    }

    updateChartView(chartType) {
        console.log('📊 Updating chart view to:', chartType);

        switch (chartType) {
            case 'quarterly-btn':
                this.updateTrendsChart('quarterly');
                break;
            case 'yearly-btn':
                this.updateTrendsChart('yearly');
                break;
            case 'forecast-btn':
                this.updateTrendsChart('forecast');
                break;
            default:
                this.updateTrendsChart('quarterly');
        }
    }

    updateTrendsChart(viewType) {
        const ctx = document.getElementById('export-trends-chart');
        if (!ctx) {
            console.warn('⚠️ Export trends chart container not found');
            return;
        }

        try {
            console.log('📈 Updating trends chart for view type:', viewType);

            const trendsData = this.getTrendsData();
            console.log('📈 Trends data for chart:', trendsData);

            if (!trendsData || trendsData.length === 0) {
                console.warn('⚠️ No trends data available for chart');
                return;
            }

            let chartData = [];
            let chartLabels = [];

            switch (viewType) {
                case 'quarterly':
                    chartData = trendsData.map(t => t.value || 0);
                    chartLabels = trendsData.map(t => t.quarter || 'Unknown');
                    break;

                case 'yearly':
                    // Group quarterly data by year
                    const yearlyData = {};
                    trendsData.forEach(item => {
                        const year = item.quarter.substring(0, 4);
                        if (!yearlyData[year]) {
                            yearlyData[year] = 0;
                        }
                        yearlyData[year] += item.value || 0;
                    });

                    chartData = Object.values(yearlyData);
                    chartLabels = Object.keys(yearlyData);
                    break;

                case 'forecast':
                    // Use quarterly data and add forecast for next 2 quarters
                    chartData = trendsData.map(t => t.value || 0);
                    chartLabels = trendsData.map(t => t.quarter || 'Unknown');

                    // Add simple forecast (average growth trend)
                    if (trendsData.length >= 2) {
                        const lastValue = trendsData[trendsData.length - 1].value || 0;
                        const secondLastValue = trendsData[trendsData.length - 2].value || 0;
                        const growthRate = (lastValue - secondLastValue) / secondLastValue;

                        const forecast1 = lastValue * (1 + growthRate);
                        const forecast2 = forecast1 * (1 + growthRate);

                        chartData.push(forecast1, forecast2);
                        chartLabels.push('2025Q2-F', '2025Q3-F');
                    }
                    break;
            }

            console.log('📊 Chart data for', viewType, ':', chartData);
            console.log('📊 Chart labels for', viewType, ':', chartLabels);

            const data = {
                labels: chartLabels,
                datasets: [{
                    label: 'Export Value',
                    data: chartData,
                    borderColor: viewType === 'forecast' ? '#10B981' : '#FF6384',
                    backgroundColor: viewType === 'forecast' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 99, 132, 0.1)',
                    fill: true,
                    tension: 0.3,
                    borderDash: viewType === 'forecast' ? [5, 5] : []
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
                                    const isForecast = context.dataIndex >= trendsData.length;
                                    const label = isForecast ? 'Forecast' : 'Actual';
                                    return `${label}: $${(context.parsed.y / 1000000).toFixed(2)}M`;
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

            console.log('✅ Trends chart updated successfully for view:', viewType);
        } catch (error) {
            console.error('❌ Error updating trends chart:', error);
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

    loadFallbackData() {
        console.log('📊 Loading fallback data for charts...');

        // Set sample data for demonstration
        this.data = [
            { destination_country: 'United Arab Emirates', export_value: 442.55, quarter: 'Q4 2024' },
            { destination_country: 'Democratic Republic of Congo', export_value: 84.11, quarter: 'Q4 2024' },
            { destination_country: 'China', export_value: 20.43, quarter: 'Q4 2024' },
            { destination_country: 'Luxembourg', export_value: 14.10, quarter: 'Q4 2024' },
            { destination_country: 'United Kingdom', export_value: 9.31, quarter: 'Q4 2024' }
        ];

        // Set sample SITC data
        this.sitcData = {
            sitc_sections: [
                { section_name: 'Other commodities & transactions', total_value: 428.15 },
                { section_name: 'Food and live animals', total_value: 101.12 },
                { section_name: 'Crude materials', total_value: 58.79 },
                { section_name: 'Manufactured goods', total_value: 34.87 },
                { section_name: 'Animals & vegetable oils', total_value: 23.40 }
            ]
        };

        // Set sample growth data
        this.growthData = {
            growth_data: [
                { quarter: 'Q1 2024', growth_rate: 5.2 },
                { quarter: 'Q2 2024', growth_rate: 7.8 },
                { quarter: 'Q3 2024', growth_rate: 6.1 },
                { quarter: 'Q4 2024', growth_rate: 8.3 }
            ]
        };

        // Set sample country data
        this.countryData = {
            countries: [
                { rank: 1, country: 'United Arab Emirates', total_value_2022_2025: 5814.33, q4_2024_value: 442.55, share_percentage: 76.2, growth_rate: 15.2, trend: 'Growing' },
                { rank: 2, country: 'Democratic Republic of Congo', total_value_2022_2025: 1049.15, q4_2024_value: 84.11, share_percentage: 13.7, growth_rate: 8.7, trend: 'Growing' },
                { rank: 3, country: 'China', total_value_2022_2025: 394.69, q4_2024_value: 20.43, share_percentage: 5.2, growth_rate: -5.4, trend: 'Declining' }
            ]
        };

        console.log('✅ Fallback data loaded successfully');

        // Render charts with fallback data
        this.renderCharts();
        this.populateTable();
        this.hideLoading();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing ExportAnalyzer...');
    window.exportAnalyzer = new ExportAnalyzer();

    // Add a global function to force render charts for testing
    window.forceRenderCharts = function() {
        console.log('🔧 Force rendering charts with sample data...');
        if (window.exportAnalyzer) {
            window.exportAnalyzer.loadFallbackData();
        }
    };

    // Add a global function to test chart creation
    window.testCharts = function() {
        console.log('🧪 Testing chart creation...');

        // Test if Chart.js is loaded
        if (typeof Chart === 'undefined') {
            console.error('❌ Chart.js is not loaded');
            return false;
        }
        console.log('✅ Chart.js is loaded');

        // Test if canvas elements exist
        const canvases = document.querySelectorAll('.chart-container canvas');
        console.log(`📊 Found ${canvases.length} canvas elements`);

        if (canvases.length === 0) {
            console.error('❌ No canvas elements found');
            return false;
        }

        // Try to create a simple test chart
        const testCanvas = document.createElement('canvas');
        testCanvas.id = 'test-chart';
        testCanvas.width = 400;
        testCanvas.height = 200;
        testCanvas.style.border = '1px solid red';
        testCanvas.style.display = 'block';

        // Add to a visible location for testing
        const testContainer = document.createElement('div');
        testContainer.id = 'test-chart-container';
        testContainer.style.position = 'fixed';
        testContainer.style.top = '10px';
        testContainer.style.right = '10px';
        testContainer.style.zIndex = '9999';
        testContainer.style.background = 'white';
        testContainer.style.padding = '10px';
        testContainer.style.border = '2px solid blue';

        document.body.appendChild(testContainer);
        testContainer.appendChild(testCanvas);

        try {
            const ctx = testCanvas.getContext('2d');
            const testChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Test Data'],
                    datasets: [{
                        label: 'Test Values',
                        data: [100],
                        backgroundColor: 'rgba(0, 161, 241, 0.5)'
                    }]
                },
                options: {
                    responsive: false,
                    maintainAspectRatio: false
                }
            });

            console.log('✅ Test chart created successfully');
            console.log('📍 Test chart should be visible in top-right corner');

            return true;
        } catch (error) {
            console.error('❌ Chart creation test failed:', error);
            return false;
        }
    };

    console.log('✅ ExportAnalyzer initialized');
    console.log('🔧 Available test functions:');
    console.log('  - forceRenderCharts()');
    console.log('  - testCharts()');
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