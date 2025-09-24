/* =====================================================================
   RWANDA EXPORT EXPLORER - MAPS.JS
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
    clusterLayer = L.markerClusterGroup();
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
    clusterLayer = L.markerClusterGroup();
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

/************************************
 * 8. MAP INTEGRATION WITH DASHBOARD*
 ************************************/
// Example: Load export destinations from API and render
async function loadExportDestinations(year = '2024') {
    showLoading();
    const res = await fetch(`/api/exports/destinations?year=${year}`);
    const data = await res.json();
    renderExportDestinations(data);
    hideLoading();
}
// Example: Load import sources from API and render
async function loadImportSources(year = '2024') {
    showLoading();
    const res = await fetch(`/api/imports/sources?year=${year}`);
    const data = await res.json();
    renderImportSources(data);
    hideLoading();
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
