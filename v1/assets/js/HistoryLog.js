

/**
 * HistoryLog with enhanced debugging and proper Bayesian integration
 */

import { createConfirmationModal } from './utils/modalManager.js';

export class HistoryLog {
    static STORAGE_KEY = 'predictorLog';
    static MAX_ENTRIES = 50;
    
    constructor(domElements, eventBus) {
        this.elements = domElements;
        this.eventBus = eventBus;
        this.log = this.loadLog();
        
        this.renderStats();
        
        // Event listeners
        this.eventBus.on('newRoundCompleted', this.handleRoundCompleted.bind(this)); 
        this.eventBus.on('newPredictionMade', this.handleNewPrediction.bind(this));
        
        if (this.elements.clearHistoryBtn) {
            this.elements.clearHistoryBtn.addEventListener('click', () => {
                createConfirmationModal(
                    'Clear Prediction History', 
                    'Are you sure you want to delete all prediction logs? This action cannot be undone.', 
                    () => { 
                        this.clearLog();
                    }
                );
            });
        }
        
        console.log(`📋 HistoryLog: Initialized with ${this.log.length} entries.`);
    }

    loadLog() {
        try {
            const logJson = localStorage.getItem(HistoryLog.STORAGE_KEY);
            return logJson ? JSON.parse(logJson) : [];
        } catch (e) {
            console.error("Error loading history log:", e);
            return [];
        }
    }

    saveLog() {
        try {
            const limitedLog = this.log.slice(0, HistoryLog.MAX_ENTRIES);
            localStorage.setItem(HistoryLog.STORAGE_KEY, JSON.stringify(limitedLog));
            this.renderLog(); 
            this.renderStats(); 
        } catch (e) {
            console.error("Error saving history log:", e);
        }
    }
    
    clearLog() {
        localStorage.removeItem(HistoryLog.STORAGE_KEY);
        this.log = [];
        this.renderLog();
        this.renderStats();
        console.log("📋 History log cleared via modal confirmation.");
    }

    /**
     * 🔥 CRITICAL: Handle new predictions
     */
    handleNewPrediction(predictionResult) {
        console.log('🎯 HistoryLog: New prediction received:', predictionResult);
        
        if (predictionResult.error) {
            console.warn('⚠️ HistoryLog: Ignoring error prediction');
            return;
        }
        
        const logId = String(predictionResult.gameId); // ðŸ"¥ FORCE STRING

        console.log(`ðŸŽ¯ NEW PREDICTION RECEIVED:`);
        console.log(`   gameId: ${logId} (type: ${typeof logId})`);
        console.log(`   predictedValue: ${predictionResult.predictedValue}x`);

        // Check for duplicates
        const existingEntry = this.log.find(entry => entry.id === logId);
        if (existingEntry) {
            console.warn('⚠️ HistoryLog: Duplicate prediction for gameId', logId);
            return;
        }

        const newEntry = {
            id: logId, // Now guaranteed to be string
            predicted: predictionResult.predictedValue,
            actual: null,
            timestamp: new Date().toISOString(),
            roundStatus: 'PENDING',
            successRate: 0, 
            diff: 0,
        };
        
        this.log.unshift(newEntry);
        
        console.log('✅ HistoryLog: Prediction logged for Round', logId, 'Predicted:', newEntry.predicted.toFixed(2) + 'x');
        
        this.renderStats(); 
        this.saveLog();
    }
    
    handleRoundCompleted(roundData) {
    const completedGameId = String(roundData.gameId); // ðŸ"¥ FORCE STRING
    
    console.log(`ðŸ"Š ROUND COMPLETED:`);
    console.log(`   gameId: ${completedGameId} (type: ${typeof completedGameId})`);
    console.log(`   multiplier: ${roundData.finalMultiplier.toFixed(2)}x`);
    console.log(`   Looking for matching prediction...`);
    
    // ðŸ"¥ Enhanced search with logging
    const logEntry = this.log.find(entry => {
        const match = String(entry.id) === completedGameId;
        if (entry.roundStatus === 'PENDING') {
            console.log(`   Checking entry ${entry.id} (${typeof entry.id}) - Match: ${match}`);
        }
        return match;
    });

        if (!logEntry) {
            console.warn('⚠️ HistoryLog: No prediction log found for round', roundData.gameId);
            console.log('📋 Current pending predictions:', this.log.filter(e => e.roundStatus === 'PENDING').map(e => e.id));
            return;
        }

        if (logEntry.roundStatus !== 'PENDING') {
            console.warn('⚠️ HistoryLog: Round', roundData.gameId, 'already processed');
            return;
        }

        logEntry.actual = roundData.finalMultiplier;
        logEntry.roundStatus = 'COMPLETED';
        
        const diff = Math.abs(logEntry.actual - logEntry.predicted);
        
        // 🔥 SUCCESS CRITERIA: Actual >= Predicted (bet would have won)
        const success = logEntry.actual >= logEntry.predicted;
        logEntry.successRate = success ? 100 : 0;
        logEntry.diff = diff;

        console.log(`📊 HistoryLog: Round ${logEntry.id} - ${success ? 'SUCCESS ✅' : 'MISS ❌'}`);
        console.log(`   Predicted: ${logEntry.predicted.toFixed(2)}x | Actual: ${logEntry.actual.toFixed(2)}x | Diff: ${diff.toFixed(2)}`);

        // ðŸ"¥ EMIT Bayesian update event
try {
    console.log(`🔥 EMITTING BAYESIAN UPDATE:`);
    console.log(`   Predicted: ${logEntry.predicted.toFixed(2)}x`);
    console.log(`   Actual: ${logEntry.actual.toFixed(2)}x`);
    console.log(`   Success: ${success}`);
    
    this.eventBus.emit('updateBayesianState', {
        predicted: logEntry.predicted,
        actual: logEntry.actual,
        success: success
    });
    
    console.log('✅ Bayesian event emitted successfully');
    
    // ðŸ"¥ IMMEDIATE VERIFICATION
    setTimeout(() => {
        console.log(`📊 Engine state after update:`, window.predictor.getStatistics());
    }, 100);
        
    } catch (e) {
        console.error('❌ Failed to emit Bayesian update:', e);
    }
        
        this.saveLog();

        // ðŸ"¥ DEBUG: Show current state
        console.log(`ðŸ"‹ HISTORY LOG STATE:`);
        console.log(`   Total entries: ${this.log.length}`);
        console.log(`   Pending: ${this.log.filter(e => e.roundStatus === 'PENDING').length}`);
        console.log(`   Completed: ${this.log.filter(e => e.roundStatus === 'COMPLETED').length}`);
        
        const pendingIds = this.log
            .filter(e => e.roundStatus === 'PENDING')
            .map(e => e.id)
            .slice(0, 5);
        console.log(`   Next 5 pending IDs: [${pendingIds.join(', ')}]`);
    }

    getLogForLastXHours(hours) {
        const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);
        return this.log.filter(entry => 
            entry.roundStatus === 'COMPLETED' && 
            new Date(entry.timestamp).getTime() >= cutoffTime
        );
    }

    calculateTodayCount() {
        const now = new Date();
        const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0); 
        const midnightTime = midnight.getTime();

        return this.log.filter(entry => 
            new Date(entry.timestamp).getTime() >= midnightTime
        ).length;
    }
    
    getRecentHistory(count = 30) {
        return this.log.slice(0, count);
    }

   renderStats() {
        // ðŸ"¥ FIX: Only count actual predictions made by user
     const totalPredictions = this.log.length;
     const completedPredictions = this.log.filter(l => l.roundStatus === 'COMPLETED').length;
    
        console.log(`📊 STATS UPDATE: ${totalPredictions} total, ${completedPredictions} completed`);
    
     const todayCount = this.calculateTodayCount(); 

        const completedLogs = this.log.filter(l => l.roundStatus === 'COMPLETED');
        const totalSuccessRate = completedLogs.reduce((sum, entry) => sum + entry.successRate, 0);
        const overallSuccessRate = completedLogs.length > 0 ? (totalSuccessRate / completedLogs.length) : 0;
        
        const last24HrLogs = this.getLogForLastXHours(24);
        const last24HrCompletedLogs = last24HrLogs.filter(l => l.roundStatus === 'COMPLETED');

        const total24HrSuccess = last24HrCompletedLogs.filter(l => l.successRate === 100).length;
        const winRate24Hr = last24HrCompletedLogs.length > 0 ? (total24HrSuccess / last24HrCompletedLogs.length) * 100 : 0; 

        const totalDiff24Hr = last24HrCompletedLogs.reduce((sum, entry) => sum + entry.diff, 0);
        const avgDiff24Hr = last24HrCompletedLogs.length > 0 ? (totalDiff24Hr / last24HrCompletedLogs.length) : 0; 
        
        const weeklyChange = this.calculateWeeklyAccuracyChange ? this.calculateWeeklyAccuracyChange() : 0;

        // UI updates
        if (this.elements.totalPredictionsValue) {
            this.elements.totalPredictionsValue.textContent = totalPredictions.toLocaleString();
        }

        if (this.elements.totalPredictionsFooter) {
            this.elements.totalPredictionsFooter.textContent = totalPredictions.toLocaleString();
        }
        
        if (this.elements.dailyChangeSpan) { 
            const sign = todayCount >= 0 ? '+' : '';
            this.elements.dailyChangeSpan.textContent = `${sign}${todayCount.toLocaleString()} today`;
            
            let colorClass = 'stat-summary';
            if (todayCount > 0) {
                colorClass = 'stat-summary up-text'; 
            } else if (todayCount < 0) {
                colorClass = 'stat-summary down-text'; 
            }
            this.elements.dailyChangeSpan.className = colorClass;
        }

        if (this.elements.overallAccuracy) {
             this.elements.overallAccuracy.textContent = overallSuccessRate.toFixed(1) + '%';
        }

        if (this.elements.avgAccuracyValue) { 
            this.elements.avgAccuracyValue.textContent = overallSuccessRate.toFixed(1) + '%';
        }
        
        if (this.elements.avgAccuracyWeeklyChange) {
            const sign = weeklyChange >= 0 ? '+' : '';
            this.elements.avgAccuracyWeeklyChange.textContent = `${sign}${weeklyChange.toFixed(1)}% this week`;
            
            let colorClass = 'stat-summary';
            if (weeklyChange > 0) {
                colorClass = 'stat-summary up-text'; 
            } else if (weeklyChange < 0) {
                colorClass = 'stat-summary down-text'; 
            }
            this.elements.avgAccuracyWeeklyChange.className = colorClass;
        }
        
        if (this.elements.winRateValue) { 
            const accText = winRate24Hr.toFixed(1) + '%';
            this.elements.winRateValue.textContent = accText;
        }

        if (this.elements.activeSessionsValue) { 
            this.elements.activeSessionsValue.textContent = last24HrCompletedLogs.length.toLocaleString();
        }

        if (this.elements.clearHistoryBtn) {
            this.elements.clearHistoryBtn.disabled = totalPredictions === 0;
        }
        
        this.renderLog(); 
    }
    
    renderLog() {
        if (!this.elements.historyLogBody) {
             console.error("HistoryLog: Target element 'history-log-body' not found in DOM.");
             return;
        }

        this.elements.historyLogBody.innerHTML = ''; 

        this.log.forEach(item => {
            const row = this.createHistoryRow(item);
            this.elements.historyLogBody.appendChild(row);
        });
    }

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
            const diff = item.diff !== undefined ? item.diff : Math.abs(item.actual - item.predicted);
            diffText = `±${diff.toFixed(2)}`;
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
        
        const timestamp = new Date(item.timestamp).toLocaleTimeString('en-US', {
            year: 'numeric', month: 'numeric', day: 'numeric', 
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
        }).replace(',', '');
        
        rowDiv.innerHTML = `
            <div class="time"><span>${timestamp}</span></div>
            <div class="predicted"><span>${predictedText}</span></div>
            <div class="actual"><span>${actualText}</span></div>
            <div class="difference"><span>${diffText}</span></div>
            <div class="accuracy"><span class="${accClass}">${successText}</span></div>
        `;
        
        return rowDiv;
    }

    getChartData() {
        const completedLogs = this.log.filter(l => l.roundStatus === 'COMPLETED');
        const last20Logs = completedLogs.slice(0, 20).reverse(); 

        const labels = last20Logs.map(item => `R${item.id}`); 
        const predictedValues = last20Logs.map(item => item.predicted);
        const actualValues = last20Logs.map(item => item.actual);

        return { labels, predictedValues, actualValues };
    }
}
