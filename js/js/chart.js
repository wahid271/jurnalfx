/* ============================================
   Trading Journal Pro - Chart Module
   Handles all Chart.js operations
   ============================================ */

const Charts = {
    instances: {},

    // Chart.js global defaults
    defaults: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: {
                    color: '#9CA3AF',
                    font: { size: 12 },
                    padding: 16
                }
            },
            tooltip: {
                backgroundColor: '#1F2937',
                titleColor: '#FFFFFF',
                bodyColor: '#9CA3AF',
                borderColor: '#374151',
                borderWidth: 1,
                cornerRadius: 8,
                padding: 12,
                displayColors: true,
                boxPadding: 4
            }
        },
        scales: {
            x: {
                grid: { color: 'rgba(31, 41, 55, 0.5)', drawBorder: false },
                ticks: { color: '#6B7280', font: { size: 11 } }
            },
            y: {
                grid: { color: 'rgba(31, 41, 55, 0.5)', drawBorder: false },
                ticks: { color: '#6B7280', font: { size: 11 } }
            }
        }
    },

    /**
     * Initialize all charts
     * @param {Array} trades - Array of trade objects
     */
    init(trades) {
        this.destroyAll();
        this.createEquityChart(trades);
        this.createWinLossChart(trades);
        this.createMonthlyChart(trades);
        this.createSessionChart(trades);
        this.createProfitPairChart(trades);
        this.createProfitMonthChart(trades);
        this.createPerfTimeChart(trades);
        this.createProfitDistChart(trades);
        this.createRiskRewardChart(trades);
        this.createSetupChart(trades);
    },

    /**
     * Destroy all chart instances
     */
    destroyAll() {
        Object.keys(this.instances).forEach(key => {
            if (this.instances[key]) {
                this.instances[key].destroy();
                delete this.instances[key];
            }
        });
    },

    /**
     * Create Equity Curve Chart
     */
    createEquityChart(trades) {
        const ctx = document.getElementById('equity-chart');
        if (!ctx) return;

        // Sort trades by date
        const sorted = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Calculate cumulative profit
        let cumulative = 0;
        const labels = sorted.map(t => t.date);
        const data = sorted.map(t => {
            cumulative += t.profit;
            return cumulative;
        });

        // Add starting point
        if (data.length > 0) {
            labels.unshift('Start');
            data.unshift(0);
        }

        this.instances.equity = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Equity ($)',
                    data,
                    borderColor: '#00D4AA',
                    backgroundColor: 'rgba(0, 212, 170, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#00D4AA',
                    pointBorderColor: '#00D4AA',
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                ...this.defaults,
                plugins: {
                    ...this.defaults.plugins,
                    legend: { display: false }
                },
                scales: {
                    ...this.defaults.scales,
                    y: {
                        ...this.defaults.scales.y,
                        ticks: {
                            ...this.defaults.scales.y.ticks,
                            callback: (value) => '$' + value.toLocaleString()
                        }
                    }
                }
            }
        });
    },

    /**
     * Create Win vs Loss Pie Chart
     */
    createWinLossChart(trades) {
        const ctx = document.getElementById('winloss-chart');
        if (!ctx) return;

        const wins = trades.filter(t => t.profit > 0).length;
        const losses = trades.filter(t => t.profit <= 0).length;

        this.instances.winloss = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Wins', 'Losses'],
                datasets: [{
                    data: [wins, losses],
                    backgroundColor: ['#10B981', '#EF4444'],
                    borderColor: ['#065F46', '#991B1B'],
                    borderWidth: 2,
                    hoverOffset: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#9CA3AF',
                            padding: 20,
                            font: { size: 12 }
                        }
                    },
                    tooltip: this.defaults.plugins.tooltip
                }
            }
        });
    },

    /**
     * Create Monthly Performance Bar Chart
     */
    createMonthlyChart(trades) {
        const ctx = document.getElementById('monthly-chart');
        if (!ctx) return;

        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthlyData = new Array(12).fill(0);

        trades.forEach(t => {
            const month = new Date(t.date).getMonth();
            monthlyData[month] += t.profit;
        });

        const colors = monthlyData.map(v => v >= 0 ? '#10B981' : '#EF4444');

        this.instances.monthly = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: months,
                datasets: [{
                    label: 'Profit/Loss ($)',
                    data: monthlyData,
                    backgroundColor: colors.map(c => c + '80'),
                    borderColor: colors,
                    borderWidth: 1,
                    borderRadius: 6,
                    borderSkipped: false
                }]
            },
            options: {
                ...this.defaults,
                plugins: {
                    ...this.defaults.plugins,
                    legend: { display: false }
                },
                scales: {
                    ...this.defaults.scales,
                    y: {
                        ...this.defaults.scales.y,
                        ticks: {
                            ...this.defaults.scales.y.ticks,
                            callback: (value) => '$' + value.toLocaleString()
                        }
                    }
                }
            }
        });
    },

    /**
     * Create Trading Session Doughnut Chart
     */
    createSessionChart(trades) {
        const ctx = document.getElementById('session-chart');
        if (!ctx) return;

        const sessions = {
            asia: trades.filter(t => t.session === 'asia').length,
            london: trades.filter(t => t.session === 'london').length,
            newyork: trades.filter(t => t.session === 'newyork').length
        };

        this.instances.session = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Asia', 'London', 'New York'],
                datasets: [{
                    data: [sessions.asia, sessions.london, sessions.newyork],
                    backgroundColor: ['#F59E0B', '#3B82F6', '#8B5CF6'],
                    borderColor: ['#92400E', '#1E40AF', '#5B21B6'],
                    borderWidth: 2,
                    hoverOffset: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#9CA3AF',
                            padding: 20,
                            font: { size: 12 }
                        }
                    },
                    tooltip: this.defaults.plugins.tooltip
                }
            }
        });
    },

    /**
     * Create Profit by Pair Chart
     */
    createProfitPairChart(trades) {
        const ctx = document.getElementById('profit-pair-chart');
        if (!ctx) return;

        const pairProfits = {};
        trades.forEach(t => {
            if (!pairProfits[t.pair]) pairProfits[t.pair] = 0;
            pairProfits[t.pair] += t.profit;
        });

        const labels = Object.keys(pairProfits);
        const data = Object.values(pairProfits);
        const colors = data.map(v => v >= 0 ? '#10B981' : '#EF4444');

        this.instances.profitPair = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Profit ($)',
                    data,
                    backgroundColor: colors.map(c => c + '80'),
                    borderColor: colors,
                    borderWidth: 1,
                    borderRadius: 6
                }]
            },
            options: {
                ...this.defaults,
                indexAxis: 'y',
                plugins: {
                    ...this.defaults.plugins,
                    legend: { display: false }
                },
                scales: {
                    ...this.defaults.scales,
                    x: {
                        ...this.defaults.scales.x,
                        ticks: {
                            ...this.defaults.scales.x.ticks,
                            callback: (value) => '$' + value.toLocaleString()
                        }
                    }
                }
            }
        });
    },

    /**
     * Create Profit by Month Chart (Line)
     */
    createProfitMonthChart(trades) {
        const ctx = document.getElementById('profit-month-chart');
        if (!ctx) return;

        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthlyData = new Array(12).fill(0);

        trades.forEach(t => {
            const month = new Date(t.date).getMonth();
            monthlyData[month] += t.profit;
        });

        this.instances.profitMonth = new Chart(ctx, {
            type: 'line',
            data: {
                labels: months,
                datasets: [{
                    label: 'Monthly Profit ($)',
                    data: monthlyData,
                    borderColor: '#3B82F6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#3B82F6',
                    pointRadius: 4
                }]
            },
            options: {
                ...this.defaults,
                plugins: {
                    ...this.defaults.plugins,
                    legend: { display: false }
                },
                scales: {
                    ...this.defaults.scales,
                    y: {
                        ...this.defaults.scales.y,
                        ticks: {
                            ...this.defaults.scales.y.ticks,
                            callback: (value) => '$' + value.toLocaleString()
                        }
                    }
                }
            }
        });
    },

    /**
     * Create Performance Over Time Chart
     */
    createPerfTimeChart(trades) {
        const ctx = document.getElementById('perf-time-chart');
        if (!ctx) return;

        const sorted = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));
        const labels = sorted.map(t => t.date);
        const data = sorted.map(t => t.profit);
        const colors = data.map(v => v >= 0 ? '#10B981' : '#EF4444');

        this.instances.perfTime = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Trade P/L ($)',
                    data,
                    backgroundColor: colors.map(c => c + '80'),
                    borderColor: colors,
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                ...this.defaults,
                plugins: {
                    ...this.defaults.plugins,
                    legend: { display: false }
                },
                scales: {
                    ...this.defaults.scales,
                    y: {
                        ...this.defaults.scales.y,
                        ticks: {
                            ...this.defaults.scales.y.ticks,
                            callback: (value) => '$' + value.toLocaleString()
                        }
                    }
                }
            }
        });
    },

    /**
     * Create Profit Distribution Chart
     */
    createProfitDistChart(trades) {
        const ctx = document.getElementById('profit-dist-chart');
        if (!ctx) return;

        // Create profit ranges
        const ranges = ['-1000+', '-500 to -1000', '0 to -500', '0 to 500', '500 to 1000', '1000+'];
        const counts = [0, 0, 0, 0, 0, 0];

        trades.forEach(t => {
            const p = t.profit;
            if (p <= -1000) counts[0]++;
            else if (p <= -500) counts[1]++;
            else if (p < 0) counts[2]++;
            else if (p <= 500) counts[3]++;
            else if (p <= 1000) counts[4]++;
            else counts[5]++;
        });

        this.instances.profitDist = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ranges,
                datasets: [{
                    label: 'Number of Trades',
                    data: counts,
                    backgroundColor: [
                        'rgba(239, 68, 68, 0.7)',
                        'rgba(239, 68, 68, 0.5)',
                        'rgba(239, 68, 68, 0.3)',
                        'rgba(16, 185, 129, 0.3)',
                        'rgba(16, 185, 129, 0.5)',
                        'rgba(16, 185, 129, 0.7)'
                    ],
                    borderColor: [
                        '#EF4444', '#EF4444', '#EF4444',
                        '#10B981', '#10B981', '#10B981'
                    ],
                    borderWidth: 1,
                    borderRadius: 6
                }]
            },
            options: {
                ...this.defaults,
                plugins: {
                    ...this.defaults.plugins,
                    legend: { display: false }
                }
            }
        });
    },

    /**
     * Create Risk vs Reward Scatter Chart
     */
    createRiskRewardChart(trades) {
        const ctx = document.getElementById('risk-reward-chart');
        if (!ctx) return;

        const data = trades.map(t => ({
            x: t.risk,
            y: Math.abs(t.rr || 0)
        }));

        const pointColors = trades.map(t => t.profit >= 0 ? '#10B981' : '#EF4444');

        this.instances.riskReward = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Risk vs RR',
                    data,
                    backgroundColor: pointColors,
                    borderColor: pointColors,
                    pointRadius: 8,
                    pointHoverRadius: 12
                }]
            },
            options: {
                ...this.defaults,
                plugins: {
                    ...this.defaults.plugins,
                    legend: { display: false },
                    tooltip: {
                        ...this.defaults.plugins.tooltip,
                        callbacks: {
                            label: (ctx) => `Risk: ${ctx.parsed.x}% | RR: ${ctx.parsed.y}`
                        }
                    }
                },
                scales: {
                    x: {
                        ...this.defaults.scales.x,
                        title: { display: true, text: 'Risk (%)', color: '#9CA3AF' }
                    },
                    y: {
                        ...this.defaults.scales.y,
                        title: { display: true, text: 'Risk:Reward Ratio', color: '#9CA3AF' }
                    }
                }
            }
        });
    },

    /**
     * Create Setup Performance Chart
     */
    createSetupChart(trades) {
        const ctx = document.getElementById('setup-chart');
        if (!ctx) return;

        const setupProfits = {};
        trades.forEach(t => {
            const setup = t.setup || 'Unknown';
            if (!setupProfits[setup]) setupProfits[setup] = 0;
            setupProfits[setup] += t.profit;
        });

        const labels = Object.keys(setupProfits);
        const data = Object.values(setupProfits);
        const colors = data.map(v => v >= 0 ? '#10B981' : '#EF4444');

        this.instances.setup = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Total Profit ($)',
                    data,
                    backgroundColor: colors.map(c => c + '80'),
                    borderColor: colors,
                    borderWidth: 1,
                    borderRadius: 6
                }]
            },
            options: {
                ...this.defaults,
                plugins: {
                    ...this.defaults.plugins,
                    legend: { display: false }
                },
                scales: {
                    ...this.defaults.scales,
                    y: {
                        ...this.defaults.scales.y,
                        ticks: {
                            ...this.defaults.scales.y.ticks,
                            callback: (value) => '$' + value.toLocaleString()
                        }
                    }
                }
            }
        });
    },

    /**
     * Refresh all charts with new data
     */
    refresh(trades) {
        this.init(trades);
    }
};
