

// js/HistoryLog.js

/**
 * Manages the persistent log (via localStorage) of all predictions and their actual results.
 * It calculates prediction accuracy and manages the history log table in the UI.
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
            successRate: 0, // Initialize the new field
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
            
            // Recalculate difference (still useful for the 'Difference' column)
            const diff = Math.abs(logEntry.actual - logEntry.predicted);
            
            // --- SUCCESS RATE CALCULATION (STRICTLY GREATER THAN) ---
            let successRate = 0;
            
            // If actual crash value is STRICTLY GREATER than predicted, the bet succeeded.
            if (logEntry.actual > logEntry.predicted) { 
                successRate = 100;
            } 
            
            // Store the success rate (100 or 0)
            logEntry.successRate = successRate; 
            logEntry.diff = diff;

            console.log(`HistoryLog: Updated prediction log for Round ${logEntry.id} with actual crash at ${logEntry.actual}x. Success Rate: ${successRate}%`);
            
            // Crucially, this calls renderLog() and renders the updated table
            this.saveLog(); 
        } else {
            // This is the expected warning for historical rounds or rounds missed by prediction
            console.warn(`HistoryLog: No pending log entry found for round ${roundData.gameId}.`);
        }
    }
    
    // --- UI RENDERING ---
    
    /** Renders the statistical summary (Total Predictions and Overall Success Rate). */
    renderStats() {
        // Calculate Total Predictions
        const totalPredictions = this.log.length;
        
        // Calculate Overall Success Rate (using the new logEntry.successRate)
        const completedLogs = this.log.filter(l => l.roundStatus === 'COMPLETED');
        const totalSuccessRate = completedLogs.reduce((sum, entry) => sum + entry.successRate, 0);
        const overallSuccessRate = completedLogs.length > 0 ? (totalSuccessRate / completedLogs.length) : 0;
        
        // Handle element updates safely
        if (this.elements.totalPredictions) {
            this.elements.totalPredictions.textContent = totalPredictions.toLocaleString();
        }
        
        // NOTE: Uses the existing DOM ID 'overallAccuracy' but displays the Success Rate
        if (this.elements.overallAccuracy) { 
            const accText = overallSuccessRate.toFixed(1) + '%';
            this.elements.overallAccuracy.textContent = accText;
            // Update color logic based on success rate threshold
            this.elements.overallAccuracy.className = overallSuccessRate >= 60 ? 'up' : overallSuccessRate >= 50 ? 'moderate' : 'down';
        }
        
        if (this.elements.clearHistoryBtn) {
            this.elements.clearHistoryBtn.disabled = totalPredictions === 0;
        }
        
        // Calling renderLog from here ensures the UI is updated immediately after stats are calculated
        this.renderLog(); 
    }
    
    /** Renders the history table rows. */
    renderLog() {
        if (!this.elements.historyLogBody) {
             console.error("HistoryLog: Target element 'history-log-body' not found in DOM.");
             return;
        }

        // Clear existing rows quickly
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
    
    // Defensive check: Use existing successRate, otherwise default to 0
    // We can also check for the old 'accuracy' value if we want to display that for old data.
    const rateValue = item.successRate !== undefined ? item.successRate : (item.accuracy !== undefined ? item.accuracy : 0);
    
    // Defensive check for predicted value, which is usually not null on creation
    const predictedValue = item.predicted || 0; 
    
    // Use the defensively checked values below
    const predictedText = predictedValue ? predictedValue.toFixed(2) + 'x' : '--';
    let actualText = '--';
    let diffText = '--';
    let successText = 'N/A'; // Use successText for the display
    let accClass = '';
        
        if (item.roundStatus === 'COMPLETED') {
            actualText = item.actual.toFixed(2) + 'x';
            
            // Recalculate difference for display formatting
            const diff = Math.abs(item.actual - item.predicted);
            diffText = `±${diff.toFixed(2)}`;
            
            successText = item.successRate.toFixed(0) + '%'; // Use the new successRate
            
            // Set success color class (Green for 100% Success, Red for 0%)
            if (item.successRate === 100) {
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
}

