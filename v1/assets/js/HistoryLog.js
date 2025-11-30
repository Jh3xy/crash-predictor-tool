

/**
 * Manages the persistent log (via localStorage) of all predictions and their actual results.
 * It calculates prediction accuracy and manages the history log table and dashboard stats in the UI.
 *
 * NOTE: This version includes new methods to calculate time-based metrics (daily/24hr).
 */
export class HistoryLog {
    
    // We use a constant key for localStorage to avoid magic strings
    static STORAGE_KEY = 'predictorLog';
    static MAX_ENTRIES = 50; // Keep history limited to 50 entries
    
    constructor(domElements, eventBus) {
        this.elements = domElements;
        this.eventBus = eventBus;
        this.log = this.loadLog(); // Load log on initialization
        
        // Ensure initial log stats are rendered when the app starts
        this.renderStats();
        
        // --- EVENT LISTENERS (The integration points) ---
        
        // 1. Listen for a completed round for the ACTUAL multiplier
        this.eventBus.on('newRoundCompleted', this.handleRoundCompleted.bind(this)); 
        
        // 2. Listen for a prediction run for the PREDICTED multiplier
        this.eventBus.on('newPredictionMade', this.handleNewPrediction.bind(this));
        
        // 3. Attach clear history button listener
        if (this.elements.clearHistoryBtn) {
            this.elements.clearHistoryBtn.addEventListener('click', this.clearAllHistory.bind(this));
        }

        console.log(`HistoryLog: Initialized with ${this.log.length} entries.`);
    }

    // --- LOGIC: STORAGE & DATA MANAGEMENT ---
    
    /** Loads the prediction log from localStorage. */
    loadLog() {
        try {
            const logJson = localStorage.getItem(HistoryLog.STORAGE_KEY);
            return logJson ? JSON.parse(logJson) : [];
        } catch (e) {
            console.error("Error loading history log:", e);
            return [];
        }
    }

    /** Saves the current log array to localStorage, limiting entries. */
    saveLog() {
        try {
            const limitedLog = this.log.slice(0, HistoryLog.MAX_ENTRIES);
            localStorage.setItem(HistoryLog.STORAGE_KEY, JSON.stringify(limitedLog));
            this.renderLog(); // Update UI after saving
            this.renderStats(); // Update stats after saving
        } catch (e) {
            console.error("Error saving history log:", e);
        }
    }
    
    /** Clears the entire log from localStorage. */
    clearAllHistory() {
        if (window.confirm("Are you sure you want to clear the entire Prediction History Log?")) {
            localStorage.removeItem(HistoryLog.STORAGE_KEY);
            this.log = []; // Reset internal array
            this.renderLog();
            this.renderStats();
            console.log("History log cleared.");
        }
    }
    
    // --- LOGIC: EVENT HANDLERS (Integration with core app flow) ---
    
    /**
     * Handles when a prediction is made. Adds a new placeholder entry to the log.
     * @param {object} predictionResult - The result object from CrashPredictor.
     */
    handleNewPrediction(predictionResult) {
        if (predictionResult.error) return; // Only log successful predictions
        
        const logId = predictionResult.gameId; 

        // Check if an entry for this specific gameId already exists (important for reloads)
        const existingEntry = this.log.find(entry => entry.id === logId);
        if (existingEntry) return;

        const newEntry = {
            id: logId, 
            predicted: predictionResult.predictedValue,
            actual: null, // Actual is unknown until round completes
            timestamp: new Date().toISOString(),
            roundStatus: 'PENDING',
            successRate: 0, 
            diff: 0, // Initialize diff
        };
        
        // Add new entry to the start (most recent first)
        this.log.unshift(newEntry);
        this.saveLog();
    }
    
    /**
     * Handles a round completion. Finds the matching PENDING entry and updates it 
     * with the actual crash value and calculates the SUCCESS RATE.
     * @param {object} roundData - The round data (with finalMultiplier).
     */
    handleRoundCompleted(roundData) {
        const logEntry = this.log.find(entry => entry.id === roundData.gameId);

        if (logEntry && logEntry.roundStatus === 'PENDING') {
            logEntry.actual = roundData.finalMultiplier;
            logEntry.roundStatus = 'COMPLETED';
            
            // Recalculate difference 
            const diff = Math.abs(logEntry.actual - logEntry.predicted);
            
            // --- SUCCESS RATE CALCULATION (STRICTLY GREATER THAN) ---
            let successRate = 0;
            
            // If actual crash value is STRICTLY GREATER than predicted, the bet succeeded.
            if (logEntry.actual > logEntry.predicted) { 
                successRate = 100;
            } 
            
            logEntry.successRate = successRate; 
            logEntry.diff = diff; // Store diff back on the entry

            console.log(`HistoryLog: Updated prediction log for Round ${logEntry.id} with actual crash at ${logEntry.actual}x. Success Rate: ${successRate}%`);
            
            this.saveLog(); 
        } else {
            console.warn(`HistoryLog: No pending log entry found for round ${roundData.gameId}.`);
        }
    }
    
    // --- LOGIC: TIME-BASED DATA RETRIEVAL ---

    /**
     * Retrieves completed log entries that occurred within the last specified number of hours.
     * @param {number} hours - The number of hours to look back (e.g., 24).
     * @returns {Array} Filtered list of completed log entries.
     */
    getLogForLastXHours(hours) {
        const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);
        return this.log.filter(entry => 
            entry.roundStatus === 'COMPLETED' && 
            new Date(entry.timestamp).getTime() >= cutoffTime
        );
    }

    /**
     * Calculates the count of predictions made since the start of today (local midnight).
     * This is useful for the "+X today" indicator.
     * @returns {number} The count of predictions made today.
     */
    calculateTodayCount() {
        const now = new Date();
        // Set cutoff to 00:00:00 local time today
        const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0); 
        const midnightTime = midnight.getTime();

        return this.log.filter(entry => 
            new Date(entry.timestamp).getTime() >= midnightTime
        ).length;
    }
    
    // --- UI RENDERING ---
    
    /** Renders the statistical summary (Total Predictions and Overall Success Rate). */
renderStats() {
    // --- 1. OVERALL STATS (All-Time) ---
    const totalPredictions = this.log.length;
    
    // Calculate daily change for Total Predictions
    const todayCount = this.calculateTodayCount(); 

    const completedLogs = this.log.filter(l => l.roundStatus === 'COMPLETED');
    const totalSuccessRate = completedLogs.reduce((sum, entry) => sum + entry.successRate, 0);
    const overallSuccessRate = completedLogs.length > 0 ? (totalSuccessRate / completedLogs.length) : 0;
    
    // --- 2. 24-HOUR & WEEKLY STATS ---
    const last24HrLogs = this.getLogForLastXHours(24);
    const last24HrCompletedLogs = last24HrLogs.filter(l => l.roundStatus === 'COMPLETED');

    // Win Rate (24 Hours)
    const total24HrSuccess = last24HrCompletedLogs.filter(l => l.successRate === 100).length;
    // Ensure winRate24Hr is a number for .toFixed(), default to 0 if no logs
    const winRate24Hr = last24HrCompletedLogs.length > 0 ? (total24HrSuccess / last24HrCompletedLogs.length) * 100 : 0; 

    // Avg Difference (24 Hours)
    const totalDiff24Hr = last24HrCompletedLogs.reduce((sum, entry) => sum + entry.diff, 0);
    // Ensure avgDiff24Hr is a number for .toFixed(), default to 0 if no logs
    const avgDiff24Hr = last24HrCompletedLogs.length > 0 ? (totalDiff24Hr / last24HrCompletedLogs.length) : 0; 
    
    // Calculate the weekly change for Avg. Accuracy
    // NOTE: This assumes you have implemented calculateWeeklyAccuracyChange() 
    const weeklyChange = this.calculateWeeklyAccuracyChange ? this.calculateWeeklyAccuracyChange() : 0;

    // --- UI UPDATES ---
    
    // Update Total Predictions (All Time)
    if (this.elements.totalPredictionsValue) {
        this.elements.totalPredictionsValue.textContent = totalPredictions.toLocaleString();
    }
    
    // Update new Daily Change Span ("+X today") - ADDS COLOR CLASS
    if (this.elements.dailyChangeSpan) { 
        const sign = todayCount >= 0 ? '+' : '';
        this.elements.dailyChangeSpan.textContent = `${sign}${todayCount.toLocaleString()} today`;
        
        // Apply color class: green if positive, red if negative
        let colorClass = 'stat-summary';
        if (todayCount > 0) {
            colorClass = 'stat-summary up-text'; 
        } else if (todayCount < 0) {
            colorClass = 'stat-summary down-text'; 
        }
        this.elements.dailyChangeSpan.className = colorClass;
    }

    // Update Overall Accuracy (All Time - for the main log footer)
    if (this.elements.overallAccuracy) {
         this.elements.overallAccuracy.textContent = overallSuccessRate.toFixed(1) + '%';
    }

    // Update Avg. Accuracy Card (Big Number)
    if (this.elements.avgAccuracyValue) { 
        // Using Overall Success Rate (All Time) for the big number
        this.elements.avgAccuracyValue.textContent = overallSuccessRate.toFixed(1) + '%';
    }
    
    // Update Avg. Accuracy Card (Weekly Change Span) - ADDS COLOR CLASS
    if (this.elements.avgAccuracyWeeklyChange) {
        const sign = weeklyChange >= 0 ? '+' : '';
        this.elements.avgAccuracyWeeklyChange.textContent = `${sign}${weeklyChange.toFixed(1)}% this week`;
        
        // Apply color class: green if positive, red if negative
        let colorClass = 'stat-summary';
        if (weeklyChange > 0) {
            colorClass = 'stat-summary up-text'; 
        } else if (weeklyChange < 0) {
            colorClass = 'stat-summary down-text'; 
        }
        this.elements.avgAccuracyWeeklyChange.className = colorClass;
    }
    
    // Update Win Rate (24Hr)
    if (this.elements.winRateValue) { 
        const accText = winRate24Hr.toFixed(1) + '%';
        this.elements.winRateValue.textContent = accText;
    }

    // NOTE: avgDiff24Hr logic is likely intended for a separate card or is not displayed on your current dashboard
    /* if (this.elements.avgDiff24Hr) {
         this.elements.avgDiff24Hr.textContent = `±${avgDiff24Hr.toFixed(2)}`;
    }
    */

    // Update Active Sessions (24Hr Prediction Count)
    if (this.elements.activeSessionsValue) { 
        this.elements.activeSessionsValue.textContent = last24HrCompletedLogs.length.toLocaleString();
    }

    if (this.elements.clearHistoryBtn) {
        this.elements.clearHistoryBtn.disabled = totalPredictions === 0;
    }
    
    this.renderLog(); 
}
    
    /** Renders the history table rows. */
    renderLog() {
        if (!this.elements.historyLogBody) {
             console.error("HistoryLog: Target element 'history-log-body' not found in DOM.");
             return;
        }

        this.elements.historyLogBody.innerHTML = ''; 

        // Append the new rows (newest first)
        this.log.forEach(item => {
            const row = this.createHistoryRow(item);
            this.elements.historyLogBody.appendChild(row);
        });
    }

    /**
     * Helper to dynamically create a single history row (the log-row div).
     * @param {object} item The log entry item.
     * @returns {HTMLElement} The created <div> element for the row.
     */
    createHistoryRow(item) {
        const rowDiv = document.createElement('div');
        rowDiv.classList.add('log-row');
        
        const predictedValue = item.predicted || 0; 
        
        const predictedText = predictedValue ? predictedValue.toFixed(2) + 'x' : '--';
        let actualText = '--';
        let diffText = '--';
        let successText = 'N/A'; 
        let accClass = '';
        
        if (item.roundStatus === 'COMPLETED') {
            actualText = item.actual.toFixed(2) + 'x';
            
            // Defensive check for diff (using stored item.diff is best)
            const diff = item.diff !== undefined ? item.diff : Math.abs(item.actual - item.predicted);
            diffText = `±${diff.toFixed(2)}`;
            
            // Defensive check for successRate
            const successRate = item.successRate !== undefined ? item.successRate : 0;
            successText = successRate.toFixed(0) + '%'; 
            
            if (successRate === 100) {
                accClass = 'green';
            } else {
                accClass = 'red';
            }
        } else if (item.roundStatus === 'PENDING') {
            successText = 'PENDING';
            rowDiv.classList.add('pending-row');
        }
        
        // Format Timestamp
        const timestamp = new Date(item.timestamp).toLocaleTimeString('en-US', {
            year: 'numeric', month: 'numeric', day: 'numeric', 
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
        }).replace(',', '');
        
        // Ensure all five column DIVs are correctly placed and filled
        rowDiv.innerHTML = `
            <div class="time"><span>${timestamp}</span></div>
            <div class="predicted"><span>${predictedText}</span></div>
            <div class="actual"><span>${actualText}</span></div>
            <div class="difference"><span>${diffText}</span></div>
            <div class="accuracy"><span class="${accClass}">${successText}</span></div>
        `;
        
        return rowDiv;
    }

    /**
     * Public method to retrieve data needed for the performance chart.
     * @returns {object} An object containing labels, predicted values, and actual values for the last 20 completed rounds.
     */
    getChartData() {
        const completedLogs = this.log.filter(l => l.roundStatus === 'COMPLETED');
        // Get last 20, then reverse for chart display (oldest on left)
        const last20Logs = completedLogs.slice(0, 20).reverse(); 

        // Use the game ID for labels
        const labels = last20Logs.map(item => `R${item.id}`); 
        const predictedValues = last20Logs.map(item => item.predicted);
        const actualValues = last20Logs.map(item => item.actual);

        return { labels, predictedValues, actualValues };
    }
}

