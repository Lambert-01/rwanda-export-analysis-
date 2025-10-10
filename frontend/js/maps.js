/* =====================================================================
  Rwanda trade analysis system - MAPS.JS
   Pro-level Leaflet.js map logic for interactive trade visualizations
   ===================================================================== */

/************************************
 * 1. MAP INITIALIZATION            *
 ************************************/
let exportMap, importMap, heatMapLayer, clusterLayer;
const RWANDA_COORDS = [-1.9403, 29.8739];
const DEFAULT_ZOOM = 6;

function initExportMap() {
    if (exportMap) {
        exportMap.remove();
    }
    exportMap = L.map('export-map', {
        center: RWANDA_COORDS,
        zoom: DEFAULT_ZOOM,
        minZoom: 2,
        maxZoom: 12,
        zoomControl: true,
        attributionControl: false,
        preferCanvas: true
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
    }).addTo(exportMap);
    addRwandaBorder(exportMap);
}

function addRwandaBorder(map) {
    // Example: Add Rwanda border GeoJSON (replace with real data)
    fetch('assets/data/rwanda-border.geojson')
        .then(res => res.json())
        .then(geojson => {
            L.geoJSON(geojson, {
                style: {
                    color: '#2d7dd2',
                    weight: 3,
                    fillColor: '#f7931e',
                    fillOpacity: 0.08
                }
            }).addTo(map);
        });
}

/************************************
 * 2. EXPORT DESTINATIONS MAP       *
 ************************************/
function renderExportDestinations(destinations) {
    if (!exportMap) initExportMap();
    // Remove previous layers
    if (clusterLayer) exportMap.removeLayer(clusterLayer);

    // Check if marker cluster is available
    if (typeof L.markerClusterGroup !== 'undefined') {
        clusterLayer = L.markerClusterGroup({
            chunkedLoading: true,
            maxClusterRadius: 50
        });
    } else {
        // Fallback to simple layer group if clustering not available
        clusterLayer = L.layerGroup();
        console.warn('Leaflet marker cluster not available, using simple layer group');
    }

    destinations.forEach(dest => {
        const marker = L.marker([dest.lat, dest.lng], {
            icon: createCountryIcon(dest.country)
        });
        marker.bindTooltip(`<strong>${dest.country}</strong><br>Export: ${formatNumber(dest.value)}`, {
            direction: 'top',
            offset: [0, -8],
            className: 'map-tooltip'
        });
        marker.on('click', () => {
            showCountryModal(dest);
        });
        clusterLayer.addLayer(marker);
    });
    exportMap.addLayer(clusterLayer);
    fitMapToMarkers(exportMap, destinations);
}
function createCountryIcon(country) {
    // Custom icon logic (flag, color, etc.)
    return L.divIcon({
        className: 'country-marker',
        html: `<div class="color-dot accent"></div>`
    });
}
function fitMapToMarkers(map, points) {
    if (!points.length) return;
    const latlngs = points.map(p => [p.lat, p.lng]);
    map.fitBounds(latlngs, { padding: [40, 40] });
}
function showCountryModal(dest) {
    // Example: Show modal with country export details
    showModal('country-modal');
    const modal = document.getElementById('country-modal');
    if (!modal) return;
    modal.querySelector('.modal-title').textContent = dest.country;
    modal.querySelector('.modal-value').textContent = formatNumber(dest.value);
    modal.querySelector('.modal-desc').textContent = dest.description || '';
}

/************************************
 * 3. IMPORT SOURCES MAP            *
 ************************************/
function initImportMap() {
    if (importMap) {
        importMap.remove();
    }
    importMap = L.map('import-map', {
        center: RWANDA_COORDS,
        zoom: DEFAULT_ZOOM,
        minZoom: 2,
        maxZoom: 12,
        zoomControl: true,
        attributionControl: false,
        preferCanvas: true
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
    }).addTo(importMap);
    addRwandaBorder(importMap);
}
function renderImportSources(sources) {
    if (!importMap) initImportMap();
    if (clusterLayer) importMap.removeLayer(clusterLayer);

    // Check if marker cluster is available
    if (typeof L.markerClusterGroup !== 'undefined') {
        clusterLayer = L.markerClusterGroup({
            chunkedLoading: true,
            maxClusterRadius: 50
        });
    } else {
        // Fallback to simple layer group if clustering not available
        clusterLayer = L.layerGroup();
        console.warn('Leaflet marker cluster not available, using simple layer group');
    }

    sources.forEach(src => {
        const marker = L.marker([src.lat, src.lng], {
            icon: createCountryIcon(src.country)
        });
        marker.bindTooltip(`<strong>${src.country}</strong><br>Import: ${formatNumber(src.value)}`, {
            direction: 'top',
            offset: [0, -8],
            className: 'map-tooltip'
        });
        marker.on('click', () => {
            showCountryModal(src);
        });
        clusterLayer.addLayer(marker);
    });
    importMap.addLayer(clusterLayer);
    fitMapToMarkers(importMap, sources);
}

/************************************
 * 4. HEATMAPS & CLUSTERING         *
 ************************************/
function renderExportHeatmap(points) {
    if (!exportMap) initExportMap();
    if (heatMapLayer) exportMap.removeLayer(heatMapLayer);
    heatMapLayer = L.heatLayer(points.map(p => [p.lat, p.lng, p.value]), {
        radius: 25,
        blur: 18,
        maxZoom: 10,
        gradient: { 0.2: '#2d7dd2', 0.5: '#f7931e', 1.0: '#ef4444' }
    });
    exportMap.addLayer(heatMapLayer);
}

/************************************
 * 5. MAP LEGENDS & CONTROLS        *
 ************************************/
function addMapLegend(map, type = 'export') {
    const legend = L.control({ position: 'bottomright' });
    legend.onAdd = function() {
        const div = L.DomUtil.create('div', 'map-legend');
        if (type === 'export') {
            div.innerHTML = '<span class="color-dot accent"></span> Export Destinations';
        } else {
            div.innerHTML = '<span class="color-dot info"></span> Import Sources';
        }
        return div;
    };
    legend.addTo(map);
}

/************************************
 * 6. RESPONSIVE MAP HANDLING       *
 ************************************/
window.addEventListener('resize', debounce(function() {
    if (exportMap) exportMap.invalidateSize();
    if (importMap) importMap.invalidateSize();
}, 300));

/************************************
 * 7. UTILITY FUNCTIONS             *
 ************************************/
function debounce(fn, delay) {
    let timer;
    return function(...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}
function formatNumber(num) {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num;
}

/**
 * Get country coordinates for mapping
 */
function getCountryCoordinates(countryName) {
    const countryCoords = {
        'United Arab Emirates': { lat: 23.4241, lng: 53.8478 },
        'Democratic Republic of the Congo': { lat: -4.0383, lng: 21.7587 },
        'China': { lat: 35.8617, lng: 104.1954 },
        'United Kingdom': { lat: 55.3781, lng: -3.4360 },
        'Hong Kong': { lat: 22.3193, lng: 114.1694 },
        'Luxembourg': { lat: 49.8153, lng: 6.1296 },
        'Pakistan': { lat: 30.3753, lng: 69.3451 },
        'India': { lat: 20.5937, lng: 78.9629 },
        'Uganda': { lat: 1.3733, lng: 32.2903 },
        'United States': { lat: 39.8283, lng: -98.5795 },
        'Netherlands': { lat: 52.1326, lng: 5.2913 },
        'Singapore': { lat: 1.3521, lng: 103.8198 },
        'South Sudan': { lat: 6.8770, lng: 31.3070 },
        'Belgium': { lat: 50.5039, lng: 4.4699 },
        'Congo': { lat: -0.2280, lng: 15.8277 },
        'Ethiopia': { lat: 9.1450, lng: 40.4897 },
        'Germany': { lat: 51.1657, lng: 10.4515 },
        'Thailand': { lat: 15.8700, lng: 100.9925 },
        'Egypt': { lat: 26.0975, lng: 30.0127 },
        'Burundi': { lat: -3.3731, lng: 29.9189 },
        'South Africa': { lat: -30.5595, lng: 22.9375 },
        'Japan': { lat: 36.2048, lng: 138.2529 },
        'Cameroon': { lat: 7.3697, lng: 12.3547 },
        'France': { lat: 46.2276, lng: 2.2137 },
        'Saudi Arabia': { lat: 23.8859, lng: 45.0792 },
        'Russia': { lat: 61.5240, lng: 105.3188 },
        'Burkina Faso': { lat: 12.2383, lng: -1.5616 },
        'Malaysia': { lat: 4.2105, lng: 101.9758 },
        'Greece': { lat: 39.0742, lng: 21.8243 },
        'Ghana': { lat: 7.9465, lng: -1.0232 },
        'Qatar': { lat: 25.3548, lng: 51.1839 },
        'Sudan': { lat: 12.8628, lng: 30.2176 },
        'Zambia': { lat: -13.1339, lng: 27.8493 },
        'Tanzania': { lat: -6.3728, lng: 34.8922 },
        'Kenya': { lat: -0.0236, lng: 37.9062 },
        'Turkey': { lat: 38.9637, lng: 35.2433 },
        'Italy': { lat: 41.8719, lng: 12.5674 },
        'Brazil': { lat: -14.2350, lng: -51.9253 },
        'Kazakhstan': { lat: 48.0196, lng: 66.9237 },
        'Ireland': { lat: 53.4129, lng: -8.2439 }
    };

    return countryCoords[countryName] || { lat: 0, lng: 0 }; // Default to (0,0) if not found
}

/************************************
 * 8. MAP INTEGRATION WITH DASHBOARD*
 ************************************/
// Example: Load export destinations from API and render
async function loadExportDestinations(year = '2024') {
    try {
        console.log('Loading export destinations for year:', year);
        const res = await fetch(`/api/analytics/top-destinations?limit=15`);
        if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        const data = await res.json();

        // Transform data to include coordinates
        const destinationsWithCoords = data.map(dest => ({
            country: dest.country || dest.destination_country,
            value: dest.value || dest.export_value,
            lat: getCountryCoordinates(dest.country || dest.destination_country).lat,
            lng: getCountryCoordinates(dest.country || dest.destination_country).lng
        }));

        console.log('Export destinations loaded:', destinationsWithCoords);
        renderExportDestinations(destinationsWithCoords);
    } catch (error) {
        console.error('Error loading export destinations:', error);
        // Use fallback data
        const fallbackData = [
            { country: 'United Arab Emirates', value: 5814.33, lat: 23.4241, lng: 53.8478 },
            { country: 'Democratic Republic of the Congo', value: 1049.15, lat: -4.0383, lng: 21.7587 },
            { country: 'China', value: 394.69, lat: 35.8617, lng: 104.1954 },
            { country: 'United Kingdom', value: 201.10, lat: 55.3781, lng: -3.4360 },
            { country: 'Hong Kong', value: 182.17, lat: 22.3193, lng: 114.1694 }
        ];
        renderExportDestinations(fallbackData);
    }
}
// Example: Load import sources from API and render
async function loadImportSources(year = '2024') {
    try {
        console.log('Loading import sources for year:', year);
        const res = await fetch(`/api/analytics/top-destinations?limit=15`);
        if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        const data = await res.json();

        // Transform data to include coordinates for import sources
        const sourcesWithCoords = data.map(src => ({
            country: src.country || src.source_country,
            value: src.value || src.import_value,
            lat: getCountryCoordinates(src.country || src.source_country).lat,
            lng: getCountryCoordinates(src.country || src.source_country).lng
        }));

        console.log('Import sources loaded:', sourcesWithCoords);
        renderImportSources(sourcesWithCoords);
    } catch (error) {
        console.error('Error loading import sources:', error);
        // Use fallback data
        const fallbackData = [
            { country: 'Tanzania', value: 4255.12, lat: -6.3728, lng: 34.8922 },
            { country: 'Kenya', value: 3055.48, lat: -0.0236, lng: 37.9062 },
            { country: 'India', value: 2881.91, lat: 20.5937, lng: 78.9629 },
            { country: 'United Arab Emirates', value: 1936.30, lat: 23.4241, lng: 53.8478 },
            { country: 'Cameroon', value: 1240.77, lat: 7.3697, lng: 12.3547 }
        ];
        renderImportSources(fallbackData);
    }
}
// Example: Load export heatmap
async function loadExportHeatmap(year = '2024') {
    showLoading();
    const res = await fetch(`/api/exports/heatmap?year=${year}`);
    const data = await res.json();
    renderExportHeatmap(data);
    hideLoading();
}

/************************************
 * 9. MAP EVENTS & INTERACTIVITY    *
 ************************************/
// Example: Filter map by year
const exportYearFilter = document.getElementById('export-year-filter');
if (exportYearFilter) {
    exportYearFilter.addEventListener('change', function() {
        loadExportDestinations(this.value);
    });
}
// Example: Map click to show coordinates
if (exportMap) {
    exportMap.on('click', function(e) {
        showToast(`Lat: ${e.latlng.lat.toFixed(4)}, Lng: ${e.latlng.lng.toFixed(4)}`, 'info', 2000);
    });
}

/************************************
 * 10. MAP STYLES & CUSTOMIZATION   *
 ************************************/
// Custom marker, tooltip, and legend styles are handled in dashboard.css

/************************************
 * 11. DEMO & INIT                  *
 ************************************/
document.addEventListener('DOMContentLoaded', function() {
    initExportMap();
    loadExportDestinations('2024');
    addMapLegend(exportMap, 'export');
    // Optionally, load import map and heatmap as needed
});

/************************************
 * 12. EXTENSIBILITY                *
 ************************************/
// Add more map overlays, layers, or custom controls as needed
// Example: Trade flows, animated lines, region selection, etc.
// ...

/************************************
 * END OF MAPS.JS                   *
 ************************************/
