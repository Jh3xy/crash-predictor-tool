
export class ChartManager {
    constructor(historyLog, eventBus) {
        this.historyLog = historyLog;
        this.eventBus = eventBus;
        this.chart = null;
        
        this.init();
    }

    init() {
        const ctx = document.getElementById('performanceChart')?.getContext('2d');
        if (!ctx) return;

        // Set Global Font to match your App
        Chart.defaults.font.family = "'Google Sans Flex', sans-serif";
        
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Portfolio Growth %',
                    data: [],
                    borderColor: '#1abc9c', 
                    backgroundColor: (context) => {
                        const chart = context.chart;
                        const {ctx, chartArea} = chart;
                        if (!chartArea) return;
                        return this.createDynamicFill(ctx, chartArea, chart);
                    },
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 5,
                    pointBorderWidth: 1,
                    segment: {
                        borderColor: ctx => {
                            const val = ctx.p0.parsed.y;
                            return val < 0 ? 'var(--color-status-danger)' : 'var(--color-status-success)';
                        }
                    }
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        ticks: { callback: value => value + '%' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    },
                    x: { display: false }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'var(--color-surface-glass)',
                        titleColor: 'var(--text-primary)',
                        bodyColor: 'var(--text-primary)',
                        borderColor: 'var(--color-accent-primary)',
                        borderWidth: 1,
                        padding: 10,
                        cornerRadius: 6,
                        displayColors: false
                    }
                }
            }
        });

        // this.eventBus.on('newRoundCompleted', () => this.update());
        this.eventBus.on('newRoundCompleted', () => this.update());

        // 🔥 ADD THIS:
        this.eventBus.on('historyCleared', () => {
            console.log('🧹 ChartManager: History cleared, resetting chart...');
            this.chart.data.labels = [];
            this.chart.data.datasets[0].data = [];
            this.chart.update();
            this.updateStats(0);
        });
        
        // IMPORTANT: Call the theme watcher
        this.setupThemeWatcher();
    }

    setupThemeWatcher() {
        const observer = new MutationObserver(() => {
            console.log('🎨 ChartManager: Theme change detected!');
            this.update(); 
        });

        observer.observe(document.body, { 
            attributes: true, 
            attributeFilter: ['class'] 
        });
    }


    createDynamicFill(ctx, chartArea, chart) {
        const {top, bottom} = chartArea;
        const yScale = chart.scales.y;
        
        // Find where y=0 is on the canvas
        const zeroPixel = yScale.getPixelForValue(0);
        
        // Get theme colors from CSS
        const bodyStyles = getComputedStyle(document.body);
        const successColor = bodyStyles.getPropertyValue('--color-status-success').trim();
        const dangerColor = bodyStyles.getPropertyValue('--color-status-danger').trim();
        
        // Helper to convert to rgba with alpha (same as before)
        const addAlpha = (color) => {
            if (!color) return 'rgba(0,0,0,0)'; // Safety fallback
            if (color.startsWith('hsla')) {
                return color.replace(/,\s*[\d.]+\)$/, ', 0.3)');
            } else if (color.startsWith('hsl')) {
                return color.replace('hsl(', 'hsla(').replace(')', ', 0.3)');
            }
            return color; // Return original if hex/other
        };
        
        const gradient = ctx.createLinearGradient(0, top, 0, bottom);
        
        // Calculate where 0 is as a percentage
        const zeroPercent = (zeroPixel - top) / (bottom - top);
        
        // 🛡️ FIX: Clamp the value strictly between 0 and 1
        // If the chart is all-green (zeroPercent > 1), this locks it to 1.
        // If the chart is all-red (zeroPercent < 0), this locks it to 0.
        const clampedZero = Math.max(0, Math.min(1, zeroPercent));
        
        // Top of chart (Success Color Start)
        gradient.addColorStop(0, addAlpha(successColor));
        
        // The "Switch Point" (Success Color End)
        gradient.addColorStop(clampedZero, addAlpha(successColor));

        // The "Switch Point" (Danger Color Start)
        gradient.addColorStop(clampedZero, addAlpha(dangerColor));
        
        // Bottom of chart (Danger Color End)
        gradient.addColorStop(1, addAlpha(dangerColor));

        return gradient;
    }

    update() {
        if (!this.chart) return;

        // 1. Prepare the data from logs
        const logs = [...this.historyLog.log].reverse().filter(l => l.roundStatus === 'COMPLETED');
        
        if (logs.length === 0) {
            this.updateStats(0);
            return;
        }

        let cumulativeROI = 0;
        const dataPoints = [];
        const labels = [];

        logs.forEach((entry, index) => {
            if (entry.successRate === 100) {
                cumulativeROI += (entry.predicted - 1) * 100;
            } else {
                cumulativeROI -= 100;
            }
            dataPoints.push(cumulativeROI.toFixed(2));
            labels.push(`Round ${index + 1}`);
        });

        // 2. Get current theme colors
        const bodyStyles = getComputedStyle(document.body);
        const accent = bodyStyles.getPropertyValue('--color-accent-primary').trim() || '#1abc9c';
        const glass = bodyStyles.getPropertyValue('--color-surface-glass').trim() || 'rgba(20, 20, 30, 0.9)';
        const textPrimary = bodyStyles.getPropertyValue('--text-primary').trim() || '#C9D1D9';

        // 3. Update chart data
        const dataset = this.chart.data.datasets[0];
        this.chart.data.labels = labels;
        dataset.data = dataPoints;

        // Update colors
        dataset.borderColor = accent;
        dataset.pointBorderColor = accent;
        dataset.pointHoverBackgroundColor = accent;
        
        // Recreate gradient with new theme colors
        // const canvas = this.chart.canvas;

        // Update tooltip colors for theme
        this.chart.options.plugins.tooltip.backgroundColor = glass;
        this.chart.options.plugins.tooltip.titleColor = textPrimary;
        this.chart.options.plugins.tooltip.bodyColor = textPrimary;
        this.chart.options.plugins.tooltip.borderColor = accent;

        // 4. Render
        this.chart.update();
        this.updateStats(cumulativeROI);
        // 🔥 NEW: Force redraw after DOM settles
        setTimeout(() => {
            if (this.chart) this.chart.resize();
        }, 100);
    }

    updateStats(netGrowth) {
        const netEl = document.getElementById('chart-net-growth');
        const avgEl = document.getElementById('chart-avg-return');
        
        const completedRounds = this.historyLog.log.filter(l => l.roundStatus === 'COMPLETED');
        const count = completedRounds.length;

        if (netEl) {
            netEl.textContent = `${netGrowth >= 0 ? '+' : ''}${parseFloat(netGrowth).toFixed(2)}%`;
            netEl.style.color = netGrowth >= 0 ? 'var(--color-status-success)' : 'var(--color-status-danger)';
        }

        if (avgEl && count > 0) {
            const average = (netGrowth / count).toFixed(2);
            avgEl.textContent = `${average >= 0 ? '+' : ''}${average}%`;
            avgEl.style.color = average >= 0 ? 'var(--color-status-success)' : 'var(--color-status-danger)';
        }
    }
}
