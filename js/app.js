/* ============================================
   Trading Journal Pro - Main Application
   Core application logic and event handling
   ============================================ */

const App = {
    currentPage: 'dashboard',
    editingTradeId: null,
    currentScreenshot: null,

    /**
     * Initialize the application
     */
    init() {
        // Load dummy data if first time
        Storage.loadDummyData();

        // Set current date in header
        this.setCurrentDate();

        // Initialize navigation
        this.initNavigation();

        // Initialize sidebar
        this.initSidebar();

        // Initialize form handlers
        this.initFormHandlers();

        // Initialize filter handlers
        this.initFilters();

        // Initialize settings handlers
        this.initSettings();

        // Initialize modal handlers
        this.initModals();

        // Load data and render
        this.refreshAll();

        // Hide loading screen
        setTimeout(() => {
            document.getElementById('loading-screen').classList.add('hidden');
        }, 800);

        // Set default date for form
        this.setDefaultFormDate();
    },

    /**
     * Set current date display in header
     */
    setCurrentDate() {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        document.getElementById('current-date').textContent = now.toLocaleDateString('en-US', options);
    },

    /**
     * Set default date in trade form
     */
    setDefaultFormDate() {
        const today = new Date().toISOString().split('T')[0];
        const now = new Date();
        const timeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
        document.getElementById('trade-date').value = today;
        document.getElementById('trade-time').value = timeStr;
    },

    /**
     * Initialize page navigation
     */
    initNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                this.navigateTo(page);
            });
        });
    },

    /**
     * Navigate to a specific page
     * @param {string} page - Page name
     */
    navigateTo(page) {
        // Update nav items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.page === page) {
                item.classList.add('active');
            }
        });

        // Update pages
        document.querySelectorAll('.page').forEach(p => {
            p.classList.remove('active');
        });
        const targetPage = document.getElementById(`page-${page}`);
        if (targetPage) {
            targetPage.classList.add('active');
        }

        // Update title
        const titles = {
            dashboard: 'Dashboard',
            journal: 'Trading Journal',
            analytics: 'Analytics',
            statistics: 'Statistics',
            settings: 'Settings'
        };
        document.getElementById('page-title').textContent = titles[page] || page;

        this.currentPage = page;

        // Close mobile sidebar
        document.getElementById('sidebar').classList.remove('mobile-open');
    },

    /**
     * Initialize sidebar toggle
     */
    initSidebar() {
        const sidebar = document.getElementById('sidebar');
        const toggle = document.getElementById('sidebar-toggle');
        const mobileBtn = document.getElementById('mobile-menu-btn');

        // Desktop toggle
        toggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });

        // Mobile toggle
        mobileBtn.addEventListener('click', () => {
            sidebar.classList.toggle('mobile-open');
        });

        // Close sidebar on outside click (mobile)
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 1024) {
                if (!sidebar.contains(e.target) && !mobileBtn.contains(e.target)) {
                    sidebar.classList.remove('mobile-open');
                }
            }
        });
    },

    /**
     * Initialize form handlers
     */
    initFormHandlers() {
        const form = document.getElementById('trade-form');
        const addBtn = document.getElementById('btn-add-trade');
        const resetBtn = document.getElementById('btn-reset-form');

        // Add trade button
        addBtn.addEventListener('click', () => {
            this.editingTradeId = null;
            this.currentScreenshot = null;
            form.reset();
            this.setDefaultFormDate();
            document.getElementById('trade-pair').value = Storage.getSettings().defaultPair || 'XAUUSD';
            document.getElementById('modal-trade-title').innerHTML = '<i class="fas fa-plus-circle"></i> Add New Trade';
            this.resetUploadArea();
            this.openModal('modal-trade');
        });

        // Form submit
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTrade();
        });

        // Reset button
        resetBtn.addEventListener('click', () => {
            this.currentScreenshot = null;
            this.resetUploadArea();
            this.setDefaultFormDate();
        });

        // Auto-calculate RR
        const entryInput = document.getElementById('trade-entry');
        const slInput = document.getElementById('trade-sl');
        const tpInput = document.getElementById('trade-tp');

        [entryInput, slInput, tpInput].forEach(input => {
            input.addEventListener('input', () => this.calculateRR());
        });

        // Screenshot upload
        this.initScreenshotUpload();
    },

    /**
     * Calculate Risk:Reward ratio automatically
     */
    calculateRR() {
        const entry = parseFloat(document.getElementById('trade-entry').value);
        const sl = parseFloat(document.getElementById('trade-sl').value);
        const tp = parseFloat(document.getElementById('trade-tp').value);
        const type = document.getElementById('trade-type').value;

        if (entry && sl && tp) {
            let risk, reward;
            if (type === 'buy') {
                risk = Math.abs(entry - sl);
                reward = Math.abs(tp - entry);
            } else {
                risk = Math.abs(sl - entry);
                reward = Math.abs(entry - tp);
            }

            if (risk > 0) {
                const rr = (reward / risk).toFixed(2);
                document.getElementById('trade-rr').value = rr;
            }
        }
    },

    /**
     * Initialize screenshot upload functionality
     */
    initScreenshotUpload() {
        const uploadArea = document.getElementById('upload-area');
        const fileInput = document.getElementById('trade-screenshot');
        const placeholder = document.getElementById('upload-placeholder');
        const removeBtn = document.getElementById('btn-remove-img');

        // Click to upload
        uploadArea.addEventListener('click', (e) => {
            if (e.target !== removeBtn && !removeBtn.contains(e.target)) {
                fileInput.click();
            }
        });

        // File input change
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) this.processImage(file);
        });

        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            if (file && file.type.match('image/(jpeg|png|webp)')) {
                this.processImage(file);
            } else {
                this.showToast('Please upload JPG, PNG, or WEBP images only.', 'error');
            }
        });

        // Remove image
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.currentScreenshot = null;
            this.resetUploadArea();
        });
    },

    /**
     * Process uploaded image
     * @param {File} file - Image file
     */
    processImage(file) {
        // Validate file size (max 2MB for localStorage)
        if (file.size > 2 * 1024 * 1024) {
            this.showToast('Image too large! Max 2MB allowed.', 'error');
            return;
        }

        // Validate file type
        if (!file.type.match('image/(jpeg|png|webp)')) {
            this.showToast('Invalid file type. Use JPG, PNG, or WEBP.', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            this.currentScreenshot = e.target.result;
            document.getElementById('preview-img').src = this.currentScreenshot;
            document.getElementById('upload-placeholder').style.display = 'none';
            document.getElementById('upload-preview').style.display = 'inline-block';
        };
        reader.readAsDataURL(file);
    },

    /**
     * Reset upload area to default state
     */
    resetUploadArea() {
        document.getElementById('upload-placeholder').style.display = 'block';
        document.getElementById('upload-preview').style.display = 'none';
        document.getElementById('preview-img').src = '';
        document.getElementById('trade-screenshot').value = '';
    },

    /**
     * Save trade (add or update)
     */
    saveTrade() {
        const tradeData = {
            pair: document.getElementById('trade-pair').value.toUpperCase(),
            date: document.getElementById('trade-date').value,
            time: document.getElementById('trade-time').value,
            type: document.getElementById('trade-type').value,
            entry: parseFloat(document.getElementById('trade-entry').value),
            sl: parseFloat(document.getElementById('trade-sl').value),
            tp: parseFloat(document.getElementById('trade-tp').value),
            exit: parseFloat(document.getElementById('trade-exit').value),
            lot: parseFloat(document.getElementById('trade-lot').value),
            risk: parseFloat(document.getElementById('trade-risk').value) || 1,
            rr: parseFloat(document.getElementById('trade-rr').value) || 0,
            profit: parseFloat(document.getElementById('trade-profit').value),
            session: document.getElementById('trade-session').value,
            setup: document.getElementById('trade-setup').value,
            psychology: document.getElementById('trade-psychology').value,
            reason: document.getElementById('trade-reason').value,
            screenshot: this.currentScreenshot
        };

        // Validate required fields
        if (!tradeData.pair || !tradeData.date || !tradeData.time) {
            this.showToast('Please fill in all required fields.', 'error');
            return;
        }

        let success;
        if (this.editingTradeId) {
            // Update existing trade
            success = Storage.updateTrade(this.editingTradeId, tradeData);
            if (success) {
                this.showToast('Trade updated successfully!', 'success');
            }
        } else {
            // Add new trade
            Storage.addTrade(tradeData);
            this.showToast('Trade added successfully!', 'success');
        }

        if (success !== false) {
            this.closeModal('modal-trade');
            this.refreshAll();
            this.editingTradeId = null;
            this.currentScreenshot = null;
        }
    },

    /**
     * Initialize filter handlers
     */
    initFilters() {
        const searchInput = document.getElementById('search-trade');
        const filterPair = document.getElementById('filter-pair');
        const filterType = document.getElementById('filter-type');
        const filterResult = document.getElementById('filter-result');
        const filterMonth = document.getElementById('filter-month');

        const applyFilters = () => this.renderTradeTable();

        searchInput.addEventListener('input', applyFilters);
        filterPair.addEventListener('change', applyFilters);
        filterType.addEventListener('change', applyFilters);
        filterResult.addEventListener('change', applyFilters);
        filterMonth.addEventListener('change', applyFilters);
    },

    /**
     * Get filtered trades based on current filters
     * @returns {Array} Filtered trades
     */
    getFilteredTrades() {
        let trades = Storage.getTrades();
        const search = document.getElementById('search-trade').value.toLowerCase();
        const pair = document.getElementById('filter-pair').value;
        const type = document.getElementById('filter-type').value;
        const result = document.getElementById('filter-result').value;
        const month = document.getElementById('filter-month').value;

        // Apply filters
        if (search) {
            trades = trades.filter(t =>
                t.pair.toLowerCase().includes(search) ||
                t.setup?.toLowerCase().includes(search) ||
                t.reason?.toLowerCase().includes(search)
            );
        }
        if (pair) trades = trades.filter(t => t.pair === pair);
        if (type) trades = trades.filter(t => t.type === type);
        if (result === 'win') trades = trades.filter(t => t.profit > 0);
        if (result === 'loss') trades = trades.filter(t => t.profit <= 0);
        if (month) {
            trades = trades.filter(t => {
                const tradeMonth = new Date(t.date).getMonth() + 1;
                return tradeMonth.toString().padStart(2, '0') === month;
            });
        }

        // Sort by date (newest first)
        trades.sort((a, b) => new Date(b.date) - new Date(a.date));

        return trades;
    },

    /**
     * Render the trade table
     */
    renderTradeTable() {
    const trades = this.getFilteredTrades();
    const tbody = document.getElementById('trade-tbody');
    const emptyState = document.getElementById('table-empty');

    if (trades.length === 0) {
        tbody.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';

    tbody.innerHTML = trades.map(trade => `
        <tr>
            <td>
                ${
                    trade.screenshot
                    ? `<img src="${trade.screenshot}" class="table-screenshot">`
                    : '-'
                }
            </td>

            <td>${trade.pair}</td>
            <td>${trade.date}</td>
            <td>${trade.type}</td>
            <td>${trade.entry}</td>
            <td>${trade.exit}</td>
            <td>${trade.rr || '-'}</td>

            <td class="${trade.profit >= 0 ? 'profit' : 'loss'}">
                ${trade.profit >= 0 ? '+' : ''}$${trade.profit.toFixed(2)}
            </td>

            <td>${trade.session || '-'}</td>

            <td>
                <button onclick="App.viewTrade('${trade.id}')">👁</button>
                <button onclick="App.editTrade('${trade.id}')">✏️</button>
                <button onclick="App.deleteTrade('${trade.id}')">🗑</button>
            </td>

        </tr>
    `).join('');
},

    /**
     * View trade details in modal
     * @param {string} id - Trade ID
     */
    viewTrade(id) {
        const trade = Storage.getTradeById(id);
        if (!trade) return;

        const body = document.getElementById('modal-view-body');
        body.innerHTML = `
            ${trade.screenshot ? `<img src="${trade.screenshot}" class="view-screenshot" alt="Trade Screenshot">` : ''}
            <div class="view-detail-grid">
                <div class="view-detail-item">
                    <label>Pair</label>
                    <span>${trade.pair}</span>
                </div>
                <div class="view-detail-item">
                    <label>Date & Time</label>
                    <span>${trade.date} ${trade.time}</span>
                </div>
                <div class="view-detail-item">
                    <label>Type</label>
                    <span class="table-type ${trade.type}">${trade.type.toUpperCase()}</span>
                </div>
                <div class="view-detail-item">
                    <label>Entry Price</label>
                    <span>${trade.entry}</span>
                </div>
                <div class="view-detail-item">
                    <label>Stop Loss</label>
                    <span>${trade.sl}</span>
                </div>
                <div class="view-detail-item">
                    <label>Take Profit</label>
                    <span>${trade.tp}</span>
                </div>
                <div class="view-detail-item">
                    <label>Exit Price</label>
                    <span>${trade.exit}</span>
                </div>
                <div class="view-detail-item">
                    <label>Lot Size</label>
                    <span>${trade.lot}</span>
                </div>
                <div class="view-detail-item">
                    <label>Risk</label>
                    <span>${trade.risk}%</span>
                </div>
                <div class="view-detail-item">
                    <label>RR Ratio</label>
                    <span>${trade.rr}</span>
                </div>
                <div class="view-detail-item">
                    <label>Session</label>
                    <span>${trade.session || '-'}</span>
                </div>
                <div class="view-detail-item">
                    <label>Setup</label>
                    <span>${trade.setup || '-'}</span>
                </div>
                <div class="view-detail-item">
                    <label>Profit / Loss</label>
                    <span class="${trade.profit >= 0 ? 'profit' : 'loss'}" style="color: ${trade.profit >= 0 ? 'var(--profit)' : 'var(--loss)'}">
                        ${trade.profit >= 0 ? '+' : ''}$${trade.profit.toFixed(2)}
                    </span>
                </div>
            </div>
            ${trade.psychology ? `
                <div class="view-notes">
                    <h4><i class="fas fa-brain"></i> Psychology Note</h4>
                    <p>${trade.psychology}</p>
                </div>
            ` : ''}
            ${trade.reason ? `
                <div class="view-notes">
                    <h4><i class="fas fa-lightbulb"></i> Reason Entry</h4>
                    <p>${trade.reason}</p>
                </div>
            ` : ''}
        `;

        this.openModal('modal-view');
    },

    /**
     * View screenshot in full size
     * @param {string} id - Trade ID
     */
    viewScreenshot(id) {
        this.viewTrade(id);
    },

    /**
     * Edit a trade
     * @param {string} id - Trade ID
     */
    editTrade(id) {
        const trade = Storage.getTradeById(id);
        if (!trade) return;

        this.editingTradeId = id;
        this.currentScreenshot = trade.screenshot;

        // Fill form
        document.getElementById('trade-pair').value = trade.pair;
        document.getElementById('trade-date').value = trade.date;
        document.getElementById('trade-time').value = trade.time;
        document.getElementById('trade-type').value = trade.type;
        document.getElementById('trade-entry').value = trade.entry;
        document.getElementById('trade-sl').value = trade.sl;
        document.getElementById('trade-tp').value = trade.tp;
        document.getElementById('trade-exit').value = trade.exit;
        document.getElementById('trade-lot').value = trade.lot;
        document.getElementById('trade-risk').value = trade.risk;
        document.getElementById('trade-rr').value = trade.rr;
        document.getElementById('trade-profit').value = trade.profit;
        document.getElementById('trade-session').value = trade.session;
        document.getElementById('trade-setup').value = trade.setup || '';
        document.getElementById('trade-psychology').value = trade.psychology || '';
        document.getElementById('trade-reason').value = trade.reason || '';

        // Show screenshot if exists
        if (trade.screenshot) {
            document.getElementById('preview-img').src = trade.screenshot;
            document.getElementById('upload-placeholder').style.display = 'none';
            document.getElementById('upload-preview').style.display = 'inline-block';
        } else {
            this.resetUploadArea();
        }

        document.getElementById('modal-trade-title').innerHTML = '<i class="fas fa-edit"></i> Edit Trade';
        this.openModal('modal-trade');
    },

    /**
     * Delete a trade
     * @param {string} id - Trade ID
     */
    deleteTrade(id) {
        if (confirm('Are you sure you want to delete this trade?')) {
            Storage.deleteTrade(id);
            this.showToast('Trade deleted successfully!', 'success');
            this.refreshAll();
        }
    },

    /**
     * Update dashboard statistics
     */
    updateStats() {
        const trades = Storage.getTrades();
        const totalTrades = trades.length;
        const wins = trades.filter(t => t.profit > 0);
        const losses = trades.filter(t => t.profit <= 0);
        const totalProfit = wins.reduce((sum, t) => sum + t.profit, 0);
        const totalLoss = Math.abs(losses.reduce((sum, t) => sum + t.profit, 0));
        const netProfit = totalProfit - totalLoss;
        const winRate = totalTrades > 0 ? ((wins.length / totalTrades) * 100).toFixed(1) : 0;
        const loseRate = totalTrades > 0 ? ((losses.length / totalTrades) * 100).toFixed(1) : 0;
        const avgRR = totalTrades > 0 ? (trades.reduce((sum, t) => sum + (t.rr || 0), 0) / totalTrades).toFixed(2) : 0;
        const profitFactor = totalLoss > 0 ? (totalProfit / totalLoss).toFixed(2) : totalProfit > 0 ? '∞' : '0';

        // Update DOM
        document.getElementById('stat-total-trade').textContent = totalTrades;
        document.getElementById('stat-win-rate').textContent = winRate + '%';
        document.getElementById('stat-lose-rate').textContent = loseRate + '%';
        document.getElementById('stat-total-profit').textContent = '$' + totalProfit.toFixed(2);
        document.getElementById('stat-total-loss').textContent = '-$' + totalLoss.toFixed(2);
        
        const netEl = document.getElementById('stat-net-profit');
        netEl.textContent = (netProfit >= 0 ? '+$' : '-$') + Math.abs(netProfit).toFixed(2);
        netEl.className = 'stat-value ' + (netProfit >= 0 ? 'profit' : 'loss');

        document.getElementById('stat-avg-rr').textContent = avgRR;
        document.getElementById('stat-profit-factor').textContent = profitFactor;
    },

    /**
     * Update analytics page
     */
    updateAnalytics() {
        const trades = Storage.getTrades();
        const wins = trades.filter(t => t.profit > 0);
        const losses = trades.filter(t => t.profit <= 0);

        // Best & Worst Trade
        const bestTrade = trades.length > 0 ? Math.max(...trades.map(t => t.profit)) : 0;
        const worstTrade = trades.length > 0 ? Math.min(...trades.map(t => t.profit)) : 0;

        // Average Win & Loss
        const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + t.profit, 0) / wins.length : 0;
        const avgLoss = losses.length > 0 ? losses.reduce((s, t) => s + t.profit, 0) / losses.length : 0;

        // Streaks
        const sorted = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));
        let maxWinStreak = 0, maxLoseStreak = 0;
        let currentWinStreak = 0, currentLoseStreak = 0;

        sorted.forEach(t => {
            if (t.profit > 0) {
                currentWinStreak++;
                currentLoseStreak = 0;
                maxWinStreak = Math.max(maxWinStreak, currentWinStreak);
            } else {
                currentLoseStreak++;
                currentWinStreak = 0;
                maxLoseStreak = Math.max(maxLoseStreak, currentLoseStreak);
            }
        });

        // Total Risk & Reward
        const totalRisk = trades.reduce((s, t) => s + (t.risk || 0), 0);
        const totalReward = trades.reduce((s, t) => s + Math.abs(t.rr || 0) * (t.risk || 0), 0);

        // Update DOM
        document.getElementById('ana-best-trade').textContent = '+$' + bestTrade.toFixed(2);
        document.getElementById('ana-worst-trade').textContent = '$' + worstTrade.toFixed(2);
        document.getElementById('ana-avg-win').textContent = '+$' + avgWin.toFixed(2);
        document.getElementById('ana-avg-loss').textContent = '$' + avgLoss.toFixed(2);
        document.getElementById('ana-win-streak').textContent = maxWinStreak;
        document.getElementById('ana-lose-streak').textContent = maxLoseStreak;
        document.getElementById('ana-total-risk').textContent = totalRisk.toFixed(1) + '%';
        document.getElementById('ana-total-reward').textContent = '$' + totalReward.toFixed(2);
    },

    /**
     * Initialize settings handlers
     */
    initSettings() {
        // Export
        document.getElementById('btn-export').addEventListener('click', () => {
            const data = Storage.exportData();
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `trading-journal-backup-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            this.showToast('Data exported successfully!', 'success');
        });

        // Import
        document.getElementById('btn-import').addEventListener('click', () => {
            document.getElementById('import-file').click();
        });

        document.getElementById('import-file').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    if (Storage.importData(ev.target.result)) {
                        this.showToast('Data imported successfully!', 'success');
                        this.refreshAll();
                    } else {
                        this.showToast('Failed to import data. Invalid format.', 'error');
                    }
                };
                reader.readAsText(file);
            }
        });

        // Backup
        document.getElementById('btn-backup').addEventListener('click', () => {
            Storage.createBackup();
            this.showToast('Backup created successfully!', 'success');
        });

        // Restore
        document.getElementById('btn-restore').addEventListener('click', () => {
            if (confirm('This will overwrite current data with backup. Continue?')) {
                if (Storage.restoreBackup()) {
                    this.showToast('Data restored from backup!', 'success');
                    this.refreshAll();
                } else {
                    this.showToast('No backup found!', 'error');
                }
            }
        });

        // Clear all
        document.getElementById('btn-clear-all').addEventListener('click', () => {
            if (confirm('Are you sure you want to delete ALL data? This cannot be undone!')) {
                if (confirm('This is your last chance. Delete everything?')) {
                    Storage.clearAll();
                    localStorage.removeItem('tjp_initialized');
                    this.showToast('All data cleared!', 'info');
                    this.refreshAll();
                }
            }
        });

        // Dark mode toggle
        document.getElementById('dark-mode-toggle').addEventListener('change', (e) => {
            // For now, dark mode is always on (as per design)
            this.showToast('Dark mode is the default theme.', 'info');
            e.target.checked = true;
        });

        // Default pair
        document.getElementById('default-pair').addEventListener('change', (e) => {
            const settings = Storage.getSettings();
            settings.defaultPair = e.target.value;
            Storage.saveSettings(settings);
            this.showToast('Default pair updated!', 'success');
        });

        // Load settings
        const settings = Storage.getSettings();
        document.getElementById('default-pair').value = settings.defaultPair || 'XAUUSD';
    },

    /**
     * Initialize modal handlers
     */
    initModals() {
        // Close buttons
        document.getElementById('modal-trade-close').addEventListener('click', () => {
            this.closeModal('modal-trade');
        });
        document.getElementById('modal-view-close').addEventListener('click', () => {
            this.closeModal('modal-view');
        });

        // Close on overlay click
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    overlay.classList.remove('active');
                }
            });
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal-overlay.active').forEach(m => {
                    m.classList.remove('active');
                });
            }
        });
    },

    /**
     * Open a modal
     * @param {string} modalId - Modal element ID
     */
    openModal(modalId) {
        document.getElementById(modalId).classList.add('active');
        document.body.style.overflow = 'hidden';
    },

    /**
     * Close a modal
     * @param {string} modalId - Modal element ID
     */
    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
        document.body.style.overflow = '';
    },

    /**
     * Show toast notification
     * @param {string} message - Toast message
     * @param {string} type - Toast type (success, error, info, warning)
     */
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            info: 'fa-info-circle',
            warning: 'fa-exclamation-triangle'
        };

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="fas ${icons[type]} toast-icon"></i>
            <span class="toast-message">${message}</span>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        container.appendChild(toast);

        // Auto remove after 4 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.style.animation = 'slideInRight 0.3s ease reverse';
                setTimeout(() => toast.remove(), 300);
            }
        }, 4000);
    },

    /**
     * Refresh all data displays
     */
    refreshAll() {
        const trades = Storage.getTrades();
        this.updateStats();
        this.updateAnalytics();
        this.renderTradeTable();
        Charts.refresh(trades);
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
