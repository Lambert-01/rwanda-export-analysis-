/**
 * Live Alert System - Frontend JavaScript
 * Handles real-time alert fetching, display, and management
 */

class AlertSystem {
    constructor() {
        this.alerts = [];
        this.filteredAlerts = [];
        this.currentFilter = 'all';
        this.popupVisible = false;
        this.toastQueue = [];
        this.isLoading = false;
        this.bubbles = [];
        this.bubbleContainer = null;

        this.initializeElements();
        this.bindEvents();
        this.startAutoRefresh();
    }

    /**
     * Initialize DOM elements
     */
    initializeElements() {
        // Popup elements
        this.popup = document.getElementById('alert-popup');
        this.popupFeed = document.getElementById('alert-popup-feed');
        this.popupLoading = document.getElementById('popup-alert-loading');
        this.popupEmpty = document.getElementById('popup-alert-empty');
        this.popupCount = document.getElementById('popup-alert-count');

        // Main page elements
        this.toggleBtn = document.getElementById('alert-toggle-btn');
        this.toggleMainBtn = document.getElementById('alert-toggle-main');
        this.alertCount = document.getElementById('alert-count');
        this.recentAlertsPreview = document.getElementById('recent-alerts-preview');
        this.alertLoading = document.getElementById('alert-loading');
        this.alertEmpty = document.getElementById('alert-empty');

        // Bubble container
        this.bubbleContainer = document.getElementById('alert-bubbles-container');

        // Stats elements
        this.highCount = document.getElementById('high-count');
        this.mediumCount = document.getElementById('medium-count');
        this.lowCount = document.getElementById('low-count');
        this.totalCount = document.getElementById('total-count');

        // Toast elements
        this.toast = document.getElementById('alert-toast');
        this.toastIcon = document.getElementById('toast-icon');
        this.toastTitle = document.getElementById('toast-title');
        this.toastMessage = document.getElementById('toast-message');

        // Filter buttons
        this.filterButtons = document.querySelectorAll('.alert-filter-btn');
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Filter button events
        this.filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.target.textContent.toLowerCase();
                this.filterAlerts(filter);
            });
        });

        // Auto-close popup when clicking outside
        document.addEventListener('click', (e) => {
            if (this.popupVisible && !this.popup.contains(e.target) && !e.target.closest('.alert-toggle-btn')) {
                this.closeAlertPopup();
            }
        });
    }

    /**
     * Start automatic alert refresh
     */
    startAutoRefresh() {
        // Refresh alerts every 30 seconds
        setInterval(() => {
            this.refreshAlerts();
        }, 30000);

        // Initial load
        setTimeout(() => {
            this.refreshAlerts();
        }, 1000);
    }

    /**
     * Toggle alert popup visibility
     */
    toggleAlertPopup() {
        if (this.popupVisible) {
            this.closeAlertPopup();
        } else {
            this.openAlertPopup();
        }
    }

    /**
     * Open alert popup
     */
    openAlertPopup() {
        this.popupVisible = true;
        this.popup.classList.add('show');
        this.refreshAlerts();

        // Update toggle button state
        if (this.toggleBtn) {
            this.toggleBtn.innerHTML = '<i class="fas fa-times"></i>';
        }
        if (this.toggleMainBtn) {
            this.toggleMainBtn.innerHTML = '<i class="fas fa-times"></i>';
        }
    }

    /**
     * Close alert popup
     */
    closeAlertPopup() {
        this.popupVisible = false;
        this.popup.classList.remove('show');

        // Update toggle button state
        if (this.toggleBtn) {
            this.toggleBtn.innerHTML = '<i class="fas fa-bell"></i>';
        }
        if (this.toggleMainBtn) {
            this.toggleMainBtn.innerHTML = '<i class="fas fa-bell"></i>';
        }
    }

    /**
     * Refresh alerts from API
     */
    async refreshAlerts() {
        if (this.isLoading) return;

        this.isLoading = true;
        this.showLoadingState();

        try {
            const response = await fetch('http://localhost:3000/api/alerts?limit=20');
            const data = await response.json();

            if (data.success) {
                this.alerts = data.alerts || [];
                this.updateAlertDisplay();
                this.updateStatistics();
                this.checkForNewAlerts();
            } else {
                console.error('Failed to fetch alerts:', data.error);
                this.showErrorState();
            }
        } catch (error) {
            console.error('Error refreshing alerts:', error);
            this.showErrorState();
        } finally {
            this.isLoading = false;
            this.hideLoadingState();
        }
    }

    /**
     * Update alert display
     */
    updateAlertDisplay() {
        // Apply current filter
        this.applyFilter();

        // Update popup feed
        if (this.popupVisible) {
            this.renderPopupAlerts();
        }

        // Update preview
        this.renderPreviewAlerts();

        // Update animated bubbles
        this.updateAlertBubbles();
    }

    /**
     * Render alerts in popup
     */
    renderPopupAlerts() {
        if (!this.popupFeed) return;

        if (this.filteredAlerts.length === 0) {
            this.popupEmpty.style.display = 'block';
            this.popupFeed.innerHTML = '';
            return;
        }

        this.popupEmpty.style.display = 'none';

        this.popupFeed.innerHTML = this.filteredAlerts.map(alert =>
            this.createAlertCard(alert, true)
        ).join('');
    }

    /**
     * Render preview alerts (recent 3)
     */
    renderPreviewAlerts() {
        if (!this.recentAlertsPreview) return;

        if (this.alerts.length === 0) {
            this.alertEmpty.style.display = 'block';
            this.recentAlertsPreview.innerHTML = '';
            return;
        }

        this.alertEmpty.style.display = 'none';

        // Show latest 3 alerts in preview
        const recentAlerts = this.alerts.slice(0, 3);

        this.recentAlertsPreview.innerHTML = recentAlerts.map(alert =>
            this.createAlertCard(alert, false)
        ).join('');
    }

    /**
     * Create alert card HTML
     */
    createAlertCard(alert, isPopup = false) {
        const severityClass = alert.severity;
        const iconClass = this.getAlertIcon(alert.category);
        const timeAgo = this.getTimeAgo(alert.timestamp);

        if (isPopup) {
            return `
                <div class="alert-card ${alert.status === 'new' ? 'new-alert' : ''}" data-alert-id="${alert.id}">
                    <div class="alert-card-header">
                        <div class="alert-card-icon ${severityClass}">
                            <i class="${iconClass}"></i>
                        </div>
                        <div class="alert-card-content">
                            <div class="alert-card-title">${this.escapeHtml(alert.name)}</div>
                            <div class="alert-card-message">${this.escapeHtml(alert.message)}</div>
                            <div class="alert-card-meta">
                                <span class="alert-card-category">${alert.category.replace('_', ' ')}</span>
                                <span class="alert-card-timestamp">
                                    <i class="fas fa-clock"></i>
                                    ${timeAgo}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div class="alert-card-footer">
                        <div class="alert-card-status ${alert.status}">
                            ${alert.acknowledged ? 'Acknowledged' : 'Active'}
                        </div>
                        <div class="alert-card-actions">
                            ${!alert.acknowledged ? `
                                <button class="alert-btn alert-btn-acknowledge" onclick="alertSystem.acknowledgeAlert('${alert.id}')">
                                    <i class="fas fa-check"></i>
                                    Acknowledge
                                </button>
                            ` : ''}
                            <button class="alert-btn alert-btn-details" onclick="alertSystem.showAlertDetails('${alert.id}')">
                                <i class="fas fa-info-circle"></i>
                                Details
                            </button>
                        </div>
                    </div>
                </div>
            `;
        } else {
            // Preview card (simpler)
            return `
                <div class="activity-item">
                    <div class="activity-icon ${severityClass}">
                        <i class="${iconClass}"></i>
                    </div>
                    <div class="activity-content">
                        <span class="activity-text">${this.escapeHtml(alert.name)}</span>
                        <span class="activity-time">${timeAgo}</span>
                    </div>
                </div>
            `;
        }
    }

    /**
     * Apply current filter to alerts
     */
    applyFilter() {
        if (this.currentFilter === 'all') {
            this.filteredAlerts = this.alerts;
        } else {
            this.filteredAlerts = this.alerts.filter(alert => alert.severity === this.currentFilter);
        }
    }

    /**
     * Filter alerts by severity
     */
    filterAlerts(filter) {
        // Update active filter button
        this.filterButtons.forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');

        this.currentFilter = filter;
        this.updateAlertDisplay();
    }

    /**
     * Update alert statistics
     */
    updateStatistics() {
        const stats = {
            high: this.alerts.filter(a => a.severity === 'high').length,
            medium: this.alerts.filter(a => a.severity === 'medium').length,
            low: this.alerts.filter(a => a.severity === 'low').length,
            total: this.alerts.length
        };

        // Update display elements
        if (this.highCount) this.highCount.textContent = stats.high;
        if (this.mediumCount) this.mediumCount.textContent = stats.medium;
        if (this.lowCount) this.lowCount.textContent = stats.low;
        if (this.totalCount) this.totalCount.textContent = stats.total;
        if (this.popupCount) this.popupCount.textContent = stats.total;
        if (this.alertCount) this.alertCount.textContent = stats.total;

        // Update toggle button badge
        if (stats.total > 0) {
            if (this.toggleBtn) this.toggleBtn.classList.add('has-alerts');
            if (this.toggleMainBtn) this.toggleMainBtn.classList.add('has-alerts');
        } else {
            if (this.toggleBtn) this.toggleBtn.classList.remove('has-alerts');
            if (this.toggleMainBtn) this.toggleMainBtn.classList.remove('has-alerts');
        }
    }

    /**
     * Show loading state
     */
    showLoadingState() {
        if (this.alertLoading) this.alertLoading.style.display = 'flex';
        if (this.popupLoading) this.popupLoading.style.display = 'flex';
    }

    /**
     * Hide loading state
     */
    hideLoadingState() {
        if (this.alertLoading) this.alertLoading.style.display = 'none';
        if (this.popupLoading) this.popupLoading.style.display = 'none';
    }

    /**
     * Show error state
     */
    showErrorState() {
        if (this.recentAlertsPreview) {
            this.recentAlertsPreview.innerHTML = `
                <div class="alert-empty">
                    <div class="alert-empty-icon">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <div class="alert-empty-title">Unable to Load Alerts</div>
                    <div class="alert-empty-message">There was a problem connecting to the alert service. Please try again later.</div>
                </div>
            `;
        }
    }

    /**
     * Acknowledge alert
     */
    async acknowledgeAlert(alertId) {
        try {
            const response = await fetch(`http://localhost:3000/api/alerts/${alertId}/acknowledge`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.success) {
                // Update local alert status
                const alert = this.alerts.find(a => a.id === alertId);
                if (alert) {
                    alert.acknowledged = true;
                    alert.acknowledged_at = new Date().toISOString();
                }

                this.updateAlertDisplay();
                this.showToast('Alert acknowledged successfully', 'success');
            } else {
                this.showToast('Failed to acknowledge alert', 'error');
            }
        } catch (error) {
            console.error('Error acknowledging alert:', error);
            this.showToast('Error acknowledging alert', 'error');
        }
    }

    /**
     * Show alert details (placeholder for now)
     */
    showAlertDetails(alertId) {
        const alert = this.alerts.find(a => a.id === alertId);
        if (alert) {
            // For now, just show a simple alert
            // In the future, this could open a detailed modal
            alert(`Alert Details:\n\n${alert.name}\n${alert.message}\n\nCategory: ${alert.category}\nGenerated: ${new Date(alert.timestamp).toLocaleString()}`);
        }
    }

    /**
     * Check for new alerts and show toast notifications
     */
    checkForNewAlerts() {
        const newAlerts = this.alerts.filter(alert =>
            alert.status === 'new' && !alert.acknowledged
        );

        if (newAlerts.length > 0) {
            // Show bubble effect for the most recent alert
            const latestAlert = newAlerts[0];
            this.showBubbleEffect(latestAlert);

            // Show toast for additional alerts
            if (newAlerts.length > 1) {
                this.showToastNotification({
                    ...latestAlert,
                    name: `${newAlerts.length} New Alerts`,
                    message: `Including: ${newAlerts.slice(0, 3).map(a => a.name).join(', ')}${newAlerts.length > 3 ? '...' : ''}`
                });
            }
        }
    }

    /**
     * Show toast notification for new alert
     */
    showToastNotification(alert) {
        if (this.toast) {
            // Update toast content
            this.toastIcon.className = `alert-toast-icon ${alert.severity}`;
            this.toastTitle.textContent = alert.name;
            this.toastMessage.textContent = alert.message;

            // Update toast severity styling
            this.toast.className = `alert-toast ${alert.severity}`;

            // Show toast
            this.toast.classList.add('show');

            // Auto-hide after 5 seconds
            setTimeout(() => {
                this.closeAlertToast();
            }, 5000);
        }
    }

    /**
     * Close alert toast
     */
    closeAlertToast() {
        if (this.toast) {
            this.toast.classList.remove('show');
        }
    }

    /**
     * Show toast message
     */
    showToast(message, type = 'info') {
        // Simple toast implementation
        // In a real app, you might want to use a proper toast library
        const toast = document.createElement('div');
        toast.className = `alert-toast ${type}`;
        toast.innerHTML = `
            <div class="alert-toast-content">
                <div class="alert-toast-icon">
                    <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-triangle' : 'info-circle'}"></i>
                </div>
                <div class="alert-toast-text">
                    <div class="alert-toast-title">${type === 'success' ? 'Success' : type === 'error' ? 'Error' : 'Info'}</div>
                    <div class="alert-toast-message">${message}</div>
                </div>
            </div>
            <button class="alert-toast-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        document.body.appendChild(toast);

        // Show toast
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
    }

    /**
     * Get appropriate icon for alert category
     */
    getAlertIcon(category) {
        const icons = {
            'data_quality': 'fas fa-database',
            'market_change': 'fas fa-chart-line',
            'economic_policy': 'fas fa-balance-scale',
            'risk_management': 'fas fa-shield-alt',
            'market_diversification': 'fas fa-globe',
            'system_health': 'fas fa-heartbeat',
            'system_performance': 'fas fa-tachometer-alt'
        };

        return icons[category] || 'fas fa-bell';
    }

    /**
     * Get time ago string
     */
    getTimeAgo(timestamp) {
        const now = new Date();
        const alertTime = new Date(timestamp);
        const diffMs = now - alertTime;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${diffDays}d ago`;
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Update animated alert bubbles
     */
    updateAlertBubbles() {
        if (!this.bubbleContainer) return;

        // Clear existing bubbles
        this.clearBubbles();

        // Group alerts by severity
        const severityGroups = {
            high: this.alerts.filter(alert => alert.severity === 'high'),
            medium: this.alerts.filter(alert => alert.severity === 'medium'),
            low: this.alerts.filter(alert => alert.severity === 'low'),
            system: this.alerts.filter(alert => alert.severity === 'system')
        };

        // Create bubbles for each severity group
        Object.entries(severityGroups).forEach(([severity, alerts]) => {
            if (alerts.length > 0) {
                this.createBubble(severity, alerts.length, alerts[0]);
            }
        });
    }

    /**
     * Create animated bubble
     */
    createBubble(severity, count, latestAlert) {
        if (!this.bubbleContainer) return;

        const bubble = document.createElement('div');
        bubble.className = `alert-bubble ${severity} new`;
        bubble.title = `${count} ${severity} priority alert${count > 1 ? 's' : ''}: ${latestAlert.name}`;

        // Random position within container
        const containerRect = this.bubbleContainer.getBoundingClientRect();
        const bubbleSize = 60;
        const margin = 10;

        const maxX = containerRect.width - bubbleSize - margin * 2;
        const maxY = containerRect.height - bubbleSize - margin * 2;

        const x = margin + Math.random() * maxX;
        const y = margin + Math.random() * maxY;

        bubble.style.left = `${x}px`;
        bubble.style.top = `${y}px`;
        bubble.style.width = `${bubbleSize}px`;
        bubble.style.height = `${bubbleSize}px`;

        // Bubble content
        bubble.innerHTML = `
            <div class="alert-bubble-content">
                <div class="alert-bubble-count">${count}</div>
                <div class="alert-bubble-label">${severity.toUpperCase()}</div>
            </div>
        `;

        // Click handler to open popup
        bubble.addEventListener('click', () => {
            this.openAlertPopup();
        });

        // Add to container
        this.bubbleContainer.appendChild(bubble);
        this.bubbles.push(bubble);

        // Remove 'new' class after animation completes
        setTimeout(() => {
            bubble.classList.remove('new');
        }, 600);
    }

    /**
     * Clear all bubbles
     */
    clearBubbles() {
        this.bubbles.forEach(bubble => {
            if (bubble.parentNode) {
                bubble.parentNode.removeChild(bubble);
            }
        });
        this.bubbles = [];
    }

    /**
     * Show bubble effect for new alert
     */
    showBubbleEffect(alert) {
        this.createBubble(alert.severity, 1, alert);

        // Also show toast notification
        setTimeout(() => {
            this.showToastNotification(alert);
        }, 300);
    }
}

// Global functions for HTML onclick handlers
function toggleAlertPopup() {
    if (window.alertSystem) {
        window.alertSystem.toggleAlertPopup();
    }
}

function closeAlertPopup() {
    if (window.alertSystem) {
        window.alertSystem.closeAlertPopup();
    }
}

function refreshAlerts() {
    if (window.alertSystem) {
        window.alertSystem.refreshAlerts();
    }
}

function filterAlerts(filter) {
    if (window.alertSystem) {
        window.alertSystem.filterAlerts(filter);
    }
}

function closeAlertToast() {
    if (window.alertSystem) {
        window.alertSystem.closeAlertToast();
    }
}

// Initialize alert system when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚨 Initializing Live Alert System...');
    window.alertSystem = new AlertSystem();
    console.log('✅ Alert System initialized');
});