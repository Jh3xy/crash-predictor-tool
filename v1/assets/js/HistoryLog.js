

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
        // NOTE: We need a new event for this, which we will add in script.js later.
        // this.eventBus.on('newPredictionMade', this.handleNewPrediction.bind(this));
        
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
     * This relies on the new `runPredictionAndRender` function in script.js.
     * @param {object} predictionResult - The result object from CrashPredictor.
     */
    handleNewPrediction(predictionResult) {
        if (predictionResult.error) return; // Only log successful predictions

        const newEntry = {
            id: predictionResult.gameId, // Use the predicted gameId as the unique ID
            predicted: predictionResult.predictedValue,
            actual: null, // Actual is unknown until round completes
            timestamp: new Date().toISOString(),
            roundStatus: 'PENDING'
        };
        
        // Add new entry to the start (most recent first)
        this.log.unshift(newEntry);
        this.saveLog();
    }
    
    /**
     * Handles a round completion. Finds the matching PENDING entry and updates it 
     * with the actual crash value and calculates accuracy.
     * @param {object} roundData - The round data (with finalMultiplier).
     */
    handleRoundCompleted(roundData) {
        // Find the log entry matching the round that just completed
        const logEntry = this.log.find(entry => entry.id === roundData.gameId);

        if (logEntry && logEntry.roundStatus === 'PENDING') {
            logEntry.actual = roundData.finalMultiplier;
            logEntry.roundStatus = 'COMPLETED';
            
            // Recalculate difference and accuracy
            const diff = Math.abs(logEntry.actual - logEntry.predicted);
            
            // Simple accuracy: 100% - (Difference % of Predicted Value)
            // Clamp accuracy at 0%
            logEntry.accuracy = Math.max(0, 100 - (diff / logEntry.predicted) * 100); 

            console.log(`HistoryLog: Updated prediction log for Round ${logEntry.id}.`);
            this.saveLog();
        } else {
            // This happens if the user reloads the page before the round completes, or if
            // the round was never predicted.
            console.warn(`HistoryLog: No pending log entry found for round ${roundData.gameId}.`);
        }
    }
    
    // --- UI RENDERING ---
    
    /** Renders the statistical summary (Overall Accuracy, Total Predictions). */
    renderStats() {
        // Calculate Total Predictions
        const totalPredictions = this.log.length;
        
        // Calculate Overall Accuracy
        const completedLogs = this.log.filter(l => l.roundStatus === 'COMPLETED');
        const totalAccuracy = completedLogs.reduce((sum, entry) => sum + entry.accuracy, 0);
        const overallAccuracy = completedLogs.length > 0 ? (totalAccuracy / completedLogs.length) : 0;
        
        if (this.elements.totalPredictions) {
            this.elements.totalPredictions.textContent = totalPredictions.toLocaleString();
        }
        
        if (this.elements.overallAccuracy) {
            const accText = overallAccuracy.toFixed(1) + '%';
            this.elements.overallAccuracy.textContent = accText;
            this.elements.overallAccuracy.className = overallAccuracy >= 95 ? 'up' : overallAccuracy >= 90 ? 'moderate' : 'down';
        }
        
        if (this.elements.clearHistoryBtn) {
            this.elements.clearHistoryBtn.disabled = totalPredictions === 0;
        }
        
        this.renderLog(); // Ensure main log is rendered/updated too
    }
    
    /** Renders the history table rows. */
    renderLog() {
        if (!this.elements.historyLogBody) return;

        // Clear existing rows quickly
        this.elements.historyLogBody.innerHTML = ''; 

        // Reverse the log to show newest at the top (even though unshift was used, 
        // this ensures the latest saved data is always correct)
        this.log.forEach(item => {
            const row = this.createHistoryRow(item);
            this.elements.historyLogBody.appendChild(row);
        });
    }

    /**
     * Helper to dynamically create a single history row (the table-content div).
     * @param {object} item The log entry item.
     * @returns {HTMLElement} The created <div> element for the row.
     */
    createHistoryRow(item) {
        const rowDiv = document.createElement('div');
        rowDiv.classList.add('table-content');
        
        const predictedText = item.predicted ? item.predicted.toFixed(2) + 'x' : '--';
        const actualText = item.actual ? item.actual.toFixed(2) + 'x' : '--';
        
        let diffText = '--';
        let accuracyText = 'N/A';
        let accClass = '';
        
        if (item.roundStatus === 'COMPLETED') {
            const diff = Math.abs(item.actual - item.predicted);
            diffText = `±${diff.toFixed(2)}`;
            accuracyText = item.accuracy.toFixed(1) + '%';
            
            // Set accuracy color class based on the calculated accuracy percentage
            if (item.accuracy >= 95) {
                accClass = 'green';
            } else if (item.accuracy >= 90) {
                accClass = 'blue';
            } else {
                accClass = 'red';
            }
        } else if (item.roundStatus === 'PENDING') {
            accuracyText = 'PENDING';
        }
        
        const timestamp = new Date(item.timestamp).toLocaleTimeString('en-US', {
            year: 'numeric', month: 'numeric', day: 'numeric', 
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
        }).replace(',', '');
        
        rowDiv.innerHTML = `
            <div class="time"><span>${timestamp}</span></div>
            <div class="predicted"><span>${predictedText}</span></div>
            <div class="actual"><span>${actualText}</span></div>
            <div class="difference"><span>${diffText}</span></div>
            <div class="accuracy"><span class="${accClass}">${accuracyText}</span></div>
        `;
        
        return rowDiv;
    }
}