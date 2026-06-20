/* ============================================
   Trading Journal Pro - Storage Module
   Handles all LocalStorage operations
   ============================================ */

const Storage = {
    // Key names for localStorage
    KEYS: {
        TRADES: 'tjp_trades',
        SETTINGS: 'tjp_settings',
        BACKUP: 'tjp_backup'
    },

    /**
     * Get all trades from localStorage
     * @returns {Array} Array of trade objects
     */
    getTrades() {
        try {
            const data = localStorage.getItem(this.KEYS.TRADES);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error reading trades:', error);
            return [];
        }
    },

    /**
     * Save trades array to localStorage
     * @param {Array} trades - Array of trade objects
     */
    saveTrades(trades) {
        try {
            localStorage.setItem(this.KEYS.TRADES, JSON.stringify(trades));
            return true;
        } catch (error) {
            console.error('Error saving trades:', error);
            // Handle quota exceeded
            if (error.name === 'QuotaExceededError') {
                App.showToast('Storage full! Please delete some trades or export data.', 'error');
            }
            return false;
        }
    },

    /**
     * Add a new trade
     * @param {Object} trade - Trade object
     * @returns {Object} The saved trade with generated ID
     */
    addTrade(trade) {
        const trades = this.getTrades();
        trade.id = this.generateId();
        trade.createdAt = new Date().toISOString();
        trades.push(trade);
        this.saveTrades(trades);
        return trade;
    },

    /**
     * Update an existing trade
     * @param {string} id - Trade ID
     * @param {Object} updatedTrade - Updated trade data
     * @returns {boolean} Success status
     */
    updateTrade(id, updatedTrade) {
        const trades = this.getTrades();
        const index = trades.findIndex(t => t.id === id);
        if (index !== -1) {
            trades[index] = { ...trades[index], ...updatedTrade, updatedAt: new Date().toISOString() };
            this.saveTrades(trades);
            return true;
        }
        return false;
    },

    /**
     * Delete a trade by ID
     * @param {string} id - Trade ID
     * @returns {boolean} Success status
     */
    deleteTrade(id) {
        const trades = this.getTrades();
        const filtered = trades.filter(t => t.id !== id);
        if (filtered.length !== trades.length) {
            this.saveTrades(filtered);
            return true;
        }
        return false;
    },

    /**
     * Get a single trade by ID
     * @param {string} id - Trade ID
     * @returns {Object|null} Trade object or null
     */
    getTradeById(id) {
        const trades = this.getTrades();
        return trades.find(t => t.id === id) || null;
    },

    /**
     * Get settings from localStorage
     * @returns {Object} Settings object
     */
    getSettings() {
        try {
            const data = localStorage.getItem(this.KEYS.SETTINGS);
            return data ? JSON.parse(data) : {
                darkMode: true,
                defaultPair: 'XAUUSD'
            };
        } catch (error) {
            return { darkMode: true, defaultPair: 'XAUUSD' };
        }
    },

    /**
     * Save settings
     * @param {Object} settings - Settings object
     */
    saveSettings(settings) {
        localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(settings));
    },

    /**
     * Export all data as JSON string
     * @returns {string} JSON string of all data
     */
    exportData() {
        const data = {
            trades: this.getTrades(),
            settings: this.getSettings(),
            exportedAt: new Date().toISOString(),
            version: '1.0'
        };
        return JSON.stringify(data, null, 2);
    },

    /**
     * Import data from JSON string
     * @param {string} jsonString - JSON string to import
     * @returns {boolean} Success status
     */
    importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            if (data.trades && Array.isArray(data.trades)) {
                this.saveTrades(data.trades);
                if (data.settings) {
                    this.saveSettings(data.settings);
                }
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    },

    /**
     * Create backup
     */
    createBackup() {
        const backup = this.exportData();
        localStorage.setItem(this.KEYS.BACKUP, backup);
        return backup;
    },

    /**
     * Restore from backup
     * @returns {boolean} Success status
     */
    restoreBackup() {
        const backup = localStorage.getItem(this.KEYS.BACKUP);
        if (backup) {
            return this.importData(backup);
        }
        return false;
    },

    /**
     * Clear all data
     */
    clearAll() {
        localStorage.removeItem(this.KEYS.TRADES);
        localStorage.removeItem(this.KEYS.SETTINGS);
    },

    /**
     * Generate unique ID
     * @returns {string} Unique ID
     */
    generateId() {
        return 'trade_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    /**
     * Check if localStorage has dummy data
     * @returns {boolean}
     */
    hasDummyData() {
        return localStorage.getItem('tjp_initialized') === 'true';
    },

    /**
     * Load dummy data for first-time users
     */
    loadDummyData() {
        if (this.hasDummyData()) return;

        const dummyTrades = [
            {
                id: this.generateId(),
                pair: 'XAUUSD',
                date: '2026-06-01',
                time: '09:30',
                type: 'buy',
                entry: 2320.50,
                sl: 2310.00,
                tp: 2345.00,
                exit: 2342.00,
                lot: 0.5,
                risk: 1.5,
                rr: 2.3,
                profit: 1075.00,
                session: 'london',
                setup: 'Breakout',
                psychology: 'Felt confident, followed the plan perfectly.',
                reason: 'Strong bullish momentum after news release, price broke above key resistance.',
                screenshot: null,
                createdAt: '2026-06-01T09:30:00Z'
            },
            {
                id: this.generateId(),
                pair: 'EURUSD',
                date: '2026-06-03',
                time: '14:15',
                type: 'sell',
                entry: 1.0890,
                sl: 1.0920,
                tp: 1.0830,
                exit: 1.0840,
                lot: 1.0,
                risk: 1.0,
                rr: 1.67,
                profit: 500.00,
                session: 'newyork',
                setup: 'Pullback',
                psychology: 'Calm and focused. Good entry timing.',
                reason: 'EUR showing weakness against USD, rejection at resistance level.',
                screenshot: null,
                createdAt: '2026-06-03T14:15:00Z'
            },
            {
                id: this.generateId(),
                pair: 'GBPUSD',
                date: '2026-06-05',
                time: '08:45',
                type: 'buy',
                entry: 1.2710,
                sl: 1.2680,
                tp: 1.2770,
                exit: 1.2685,
                lot: 0.8,
                risk: 1.0,
                rr: -0.83,
                profit: -200.00,
                session: 'london',
                setup: 'Support Bounce',
                psychology: 'Got impatient, entered too early. Should have waited for confirmation.',
                reason: 'Price approaching strong support zone, expected bounce.',
                screenshot: null,
                createdAt: '2026-06-05T08:45:00Z'
            },
            {
                id: this.generateId(),
                pair: 'XAUUSD',
                date: '2026-06-07',
                time: '10:00',
                type: 'sell',
                entry: 2355.00,
                sl: 2365.00,
                tp: 2330.00,
                exit: 2332.00,
                lot: 0.3,
                risk: 1.0,
                rr: 2.3,
                profit: 690.00,
                session: 'london',
                setup: 'Rejection',
                psychology: 'Patient wait paid off. Excellent setup.',
                reason: 'Gold rejected at major resistance, bearish engulfing pattern formed.',
                screenshot: null,
                createdAt: '2026-06-07T10:00:00Z'
            },
            {
                id: this.generateId(),
                pair: 'BTCUSD',
                date: '2026-06-09',
                time: '03:30',
                type: 'buy',
                entry: 68500,
                sl: 67800,
                tp: 70200,
                exit: 70100,
                lot: 0.1,
                risk: 2.0,
                rr: 2.29,
                profit: 1600.00,
                session: 'asia',
                setup: 'Trend Continuation',
                psychology: 'Disciplined execution. Let the trade run to TP.',
                reason: 'BTC in strong uptrend, pullback to EMA provided good entry.',
                screenshot: null,
                createdAt: '2026-06-09T03:30:00Z'
            },
            {
                id: this.generateId(),
                pair: 'USDJPY',
                date: '2026-06-11',
                time: '01:00',
                type: 'buy',
                entry: 157.50,
                sl: 157.20,
                tp: 158.10,
                exit: 157.25,
                lot: 0.5,
                risk: 1.0,
                rr: -0.83,
                profit: -125.00,
                session: 'asia',
                setup: 'Breakout',
                psychology: 'FOMO entry. Did not wait for proper confirmation.',
                reason: 'Attempted breakout trade but false breakout occurred.',
                screenshot: null,
                createdAt: '2026-06-11T01:00:00Z'
            },
            {
                id: this.generateId(),
                pair: 'XAUUSD',
                date: '2026-06-13',
                time: '15:00',
                type: 'buy',
                entry: 2340.00,
                sl: 2332.00,
                tp: 2360.00,
                exit: 2358.00,
                lot: 0.4,
                risk: 1.5,
                rr: 2.25,
                profit: 720.00,
                session: 'newyork',
                setup: 'Pullback',
                psychology: 'Great patience. Waited for pullback to enter.',
                reason: 'Gold pulling back to support in uptrend, strong buying pressure.',
                screenshot: null,
                createdAt: '2026-06-13T15:00:00Z'
            },
            {
                id: this.generateId(),
                pair: 'EURUSD',
                date: '2026-06-15',
                time: '13:30',
                type: 'sell',
                entry: 1.0850,
                sl: 1.0880,
                tp: 1.0790,
                exit: 1.0870,
                lot: 0.6,
                risk: 1.0,
                rr: -0.67,
                profit: -120.00,
                session: 'newyork',
                setup: 'Breakdown',
                psychology: 'Revenge trade after previous loss. Need to control emotions.',
                reason: 'Expected breakdown below support but market reversed.',
                screenshot: null,
                createdAt: '2026-06-15T13:30:00Z'
            },
            {
                id: this.generateId(),
                pair: 'ETHUSD',
                date: '2026-06-17',
                time: '04:00',
                type: 'buy',
                entry: 3520,
                sl: 3480,
                tp: 3600,
                exit: 3595,
                lot: 0.2,
                risk: 1.5,
                rr: 1.88,
                profit: 1500.00,
                session: 'asia',
                setup: 'Trend Continuation',
                psychology: 'Confident in the setup. ETH showing strong momentum.',
                reason: 'ETH breaking out of consolidation, strong volume confirmation.',
                screenshot: null,
                createdAt: '2026-06-17T04:00:00Z'
            },
            {
                id: this.generateId(),
                pair: 'XAUUSD',
                date: '2026-06-19',
                time: '10:30',
                type: 'sell',
                entry: 2365.00,
                sl: 2373.00,
                tp: 2345.00,
                exit: 2348.00,
                lot: 0.5,
                risk: 1.0,
                rr: 2.12,
                profit: 850.00,
                session: 'london',
                setup: 'Rejection',
                psychology: 'Perfect execution. Followed all rules.',
                reason: 'Double top pattern at resistance, strong sell signal.',
                screenshot: null,
                createdAt: '2026-06-19T10:30:00Z'
            }
        ];

        this.saveTrades(dummyTrades);
        localStorage.setItem('tjp_initialized', 'true');
    }
};
