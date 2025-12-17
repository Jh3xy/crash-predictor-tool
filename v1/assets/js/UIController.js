// /**
//  * js/UIController.js
//  * Manages all DOM manipulations and state transitions.
//  * Updated for Look-Ahead Simulation.
//  */

// export class UIController {
//     constructor(elements) {
//         this.elements = elements;
//         this.cells = []; 
//         this.predictorCard = document.getElementById('ai-predictor');
        
//         // Initialize the 10 fixed history cells
//         this.initializeHistoryCells(10); 
//         console.log(`UIController: Initialized.`);
//     }
    
//     initializeHistoryCells(limit) {
//         if (!this.elements.recentGrid) return;
//         this.elements.recentGrid.innerHTML = ''; 
//         for (let i = 0; i < limit; i++) {
//             const cell = document.createElement('div');
//             cell.classList.add('multiplier-cell', 'm-default'); 
//             cell.textContent = '--'; 
//             this.elements.recentGrid.appendChild(cell); 
//             this.cells.push(cell); 
//         }
//     }
    
//     setPredictButtonState(state) {
//         if (!this.elements.predictBtn) return;
        
//         if (state === 'loading') {
//             this.elements.predictBtn.textContent = 'Analyzing...';
//             this.elements.predictBtn.disabled = true;
//         } else if (state === 'ready') {
//             this.elements.predictBtn.textContent = 'Predict Next'; // Updated text
//             this.elements.predictBtn.disabled = false;
//         } else if (state === 'error') {
//             this.elements.predictBtn.textContent = 'Retry Analysis';
//             this.elements.predictBtn.disabled = false;
//         }
//     }
    
//     showInitialState() {
//         if (this.elements.initialStateContent) this.elements.initialStateContent.style.display = 'block';
//         if (this.elements.loadingOverlay) this.elements.loadingOverlay.style.display = 'none';
//         if (this.elements.predictionOutputDetails) this.elements.predictionOutputDetails.style.display = 'none';

//         if (this.elements.predictedValue) this.elements.predictedValue.textContent = '--';
//         if (this.elements.confidencePercentage) this.elements.confidencePercentage.textContent = '0%';
        
//         this.setPredictButtonState('ready'); 
//     }
    
//     showLoadingState() {
//         if (this.elements.initialStateContent) this.elements.initialStateContent.style.display = 'none';
//         if (this.elements.loadingOverlay) this.elements.loadingOverlay.style.display = 'flex'; 
//         if (this.elements.predictionOutputDetails) this.elements.predictionOutputDetails.style.display = 'none';

//         this.setPredictButtonState('loading'); 
//     }

//     /**
//      * 🔥 NEW: Updates the main display with the LAST CRASH value.
//      */
//     updateLastCrashDisplay(multiplier) {
//         if (this.elements.currentMultiplier) {
//             this.elements.currentMultiplier.textContent = multiplier.toFixed(2) + 'x';
//             // Use a neutral color since it's history, not live-ticking
//             this.elements.currentMultiplier.style.color = 'var(--text-primary)'; 
//         }
//     }

//     /**
//      * 🔥 NEW: Simulates the status of the NEXT round running.
//      * @param {number} lastGameId - The ID of the round that just finished.
//      */
//     updateSimulatedStatus(lastGameId) {
//         const nextRoundId = lastGameId + 1;
        
//         // Pulse the status dot green
//         if (this.elements.statusDot) {
//             this.elements.statusDot.className = 'status-dot'; 
//             this.elements.statusDot.style.backgroundColor = 'var(--color-status-success)';
//             this.elements.statusDot.style.boxShadow = '0 0 8px var(--color-status-success)';
//         }

//         // Update Text
//         if (this.elements.statusMessage) {
//             this.elements.statusMessage.textContent = `Round ${nextRoundId} Running...`;
//             this.elements.statusMessage.style.color = 'var(--text-secondary)';
//         }
//     }

//     updateLiveMultiplier(multiplier) {
//         // Not used in history mode, but kept for compatibility
//         this.updateLastCrashDisplay(multiplier);
//     }

//     updateStatus(status, message) {
//         // Fallback status updater
//         if (this.elements.statusMessage) this.elements.statusMessage.textContent = message;
//     }

//     renderPrediction(result) {
//         if (this.elements.loadingOverlay) this.elements.loadingOverlay.style.display = 'none';
        
//         if (result.error) {
//             this.showInitialState();
//             if (this.elements.analysisMessage) this.elements.analysisMessage.textContent = result.message;
//             this.setPredictButtonState('error');
//             return;
//         }

//         if (this.elements.predictionOutputDetails) this.elements.predictionOutputDetails.style.display = 'block';
        
//         if (this.elements.predictedValue) {
//             this.elements.predictedValue.textContent = result.predictedValue.toFixed(2) + 'x';
//         }

//         // Display the Target Round ID (Look-Ahead)
//         if (this.elements.predictedRoundId && result.gameId) {
//             this.elements.predictedRoundId.textContent = `Target: Round ${result.gameId}`;
//         }
        
//         const confidenceVal = Math.min(result.confidence || 0, 100).toFixed(1) + '%';
        
//         if (this.predictorCard) {
//             this.predictorCard.style.setProperty('--confidence-level', confidenceVal);
//         }
//         if (this.elements.confidencePercentage) {
//             this.elements.confidencePercentage.textContent = confidenceVal;
//         }

//         if (this.elements.avgMultiplier) this.elements.avgMultiplier.textContent = result.avgMultiplier ? result.avgMultiplier.toFixed(2) + 'x' : '--';
//         if (this.elements.volatility) this.elements.volatility.textContent = result.volatility ? result.volatility.toFixed(2) + 'x' : '--';
//         if (this.elements.riskZone) this.elements.riskZone.textContent = (result.riskLevel || 'N/A').toUpperCase();
//         if (this.elements.analysisMessage) this.elements.analysisMessage.textContent = result.message;
//     }

//     getMultiplierClass(multiplier) {
//         if (multiplier >= 10.0) return 'm-high';
//         if (multiplier >= 2.0) return 'm-medium';
//         if (multiplier >= 1.5) return 'm-moderate';
//         return 'm-low';
//     }

//     renderNewRound(round) {
//         if (!this.elements.recentGrid || this.cells.length === 0) return;
        
//         // 1. Update the Big Number
//         this.updateLastCrashDisplay(round.finalMultiplier);
        
//         // 2. Simulate the Next Round Status
//         this.updateSimulatedStatus(round.gameId);

//         // 3. Update Grid (Shift Logic)
//         const cellId = `center round-cell-${round.gameId}`;
//         const multiplierClass = this.getMultiplierClass(round.finalMultiplier);
//         const formattedMultiplier = round.finalMultiplier.toFixed(2);
        
//         let existingCell = this.cells.find(c => c.id === cellId);
//         if (existingCell) return;

//         const oldestCell = this.cells.pop(); 
//         oldestCell.id = cellId;
//         oldestCell.textContent = formattedMultiplier;
//         oldestCell.className = `multiplier-cell ${multiplierClass}`;
        
//         this.elements.recentGrid.prepend(oldestCell);
//         this.cells.unshift(oldestCell); 
        
//         // Re-enable button
//         this.setPredictButtonState('ready'); 
//     }
// }


/**
 * js/UIController.js
 * Manages all DOM manipulations and state transitions.
 * Backwards-compatible API (adds methods expected by LiveSync).
 */

export class UIController {
    constructor(elements) {
        this.elements = elements;
        this.cells = []; 
        this.predictorCard = document.getElementById('ai-predictor');
        this.dom = elements;
        
        // Initialize the 10 fixed history cells
        this.initializeHistoryCells(10); 
        console.log(`UIController: Initialized.`);
    }
    
    // -------------------------
    // Setup / helpers
    // -------------------------
    initializeHistoryCells(limit) {
        if (!this.elements.recentGrid) return;
        this.elements.recentGrid.innerHTML = ''; 
        this.cells = [];
        for (let i = 0; i < limit; i++) {
            const cell = document.createElement('div');
            cell.classList.add('multiplier-cell', 'm-default'); 
            cell.textContent = '--'; 
            this.elements.recentGrid.appendChild(cell); 
            this.cells.push(cell); 
        }
    }

    setPredictButtonState(state) {
        if (!this.elements.predictBtn) return;
        
        if (state === 'loading') {
            this.elements.predictBtn.textContent = 'Analyzing...';
            this.elements.predictBtn.disabled = true;
        } else if (state === 'ready') {
            this.elements.predictBtn.textContent = 'Predict Next';
            this.elements.predictBtn.disabled = false;
        } else if (state === 'error') {
            this.elements.predictBtn.textContent = 'Retry Analysis';
            this.elements.predictBtn.disabled = false;
        }
    }
    
    showInitialState() {
        if (this.elements.initialStateContent) this.elements.initialStateContent.style.display = 'block';
        if (this.elements.loadingOverlay) this.elements.loadingOverlay.style.display = 'none';
        if (this.elements.predictionOutputDetails) this.elements.predictionOutputDetails.style.display = 'none';

        if (this.elements.predictedValue) this.elements.predictedValue.textContent = '--';
        if (this.elements.confidencePercentage) this.elements.confidencePercentage.textContent = '0%';
        
        this.setPredictButtonState('ready'); 
    }
    
    showLoadingState() {
        if (this.elements.initialStateContent) this.elements.initialStateContent.style.display = 'none';
        if (this.elements.loadingOverlay) this.elements.loadingOverlay.style.display = 'flex'; 
        if (this.elements.predictionOutputDetails) this.elements.predictionOutputDetails.style.display = 'none';

        this.setPredictButtonState('loading'); 
    }

    // -------------------------
    // Core display methods (existing)
    // -------------------------
    /**
     * Updates the main display with the LAST CRASH value.
     */
    updateLastCrashDisplay(multiplier) {
        if (this.elements.currentMultiplier) {
            this.elements.currentMultiplier.textContent = multiplier.toFixed(2) + 'x';
            // Use a neutral color since it's history, not live-ticking
            this.elements.currentMultiplier.style.color = 'var(--text-primary)'; 
        }
    }

    /**
     * Simulates the status of the NEXT round running.
     * @param {number} lastGameId - The ID of the round that just finished.
     */
    // updateSimulatedStatus(lastGameId) {
    //     const nextRoundId = lastGameId + 1;
        
    //     // Pulse the status dot green
    //     if (this.elements.statusDot) {
    //         this.elements.statusDot.className = 'status-dot'; 
    //         this.elements.statusDot.style.backgroundColor = 'var(--color-status-success)';
    //         this.elements.statusDot.style.boxShadow = '0 0 8px var(--color-status-success)';
    //     }

    //     // Update Text (if exists)
    //     if (this.elements.statusMessage) {
    //         this.elements.statusMessage.textContent = `Round ${nextRoundId} Running...`;
    //         this.elements.statusMessage.style.color = 'var(--text-secondary)';
    //     }
    // }

    updateLiveMultiplier(multiplier) {
        // kept for compatibility
        this.updateLastCrashDisplay(multiplier);
    }

    updateStatus(status, message) {
        // Fallback status updater
        if (this.elements.statusMessage) this.elements.statusMessage.textContent = message;
    }

    // renderPrediction(result) {
    //     if (this.elements.loadingOverlay) this.elements.loadingOverlay.style.display = 'none';
        
    //     if (result.error) {
    //         this.showInitialState();
    //         if (this.elements.analysisMessage) this.elements.analysisMessage.textContent = result.message;
    //         this.setPredictButtonState('error');
    //         return;
    //     }

    //     if (this.elements.predictionOutputDetails) {
    //         this.elements.predictionOutputDetails.style.display = 'block';
    //     }
        
    //     if (this.elements.predictedValue) {
    //         this.elements.predictedValue.textContent = result.predictedValue.toFixed(2) + 'x';
    //     }

    //     // Display the Target Round ID (if present)
    //     if (this.elements.predictedRoundId && result.gameId) {
    //         this.elements.predictedRoundId.textContent = `Target: Round ${result.gameId}`;
    //     }
        
    //     const confidenceVal = Math.min(result.confidence || 0, 100).toFixed(1) + '%';
        
    //     if (this.predictorCard) {
    //         this.predictorCard.style.setProperty('--confidence-level', confidenceVal);
    //     }
    //     if (this.elements.confidencePercentage) {
    //         this.elements.confidencePercentage.textContent = confidenceVal;
    //     }

    //     if (this.elements.avgMultiplier) this.elements.avgMultiplier.textContent = result.avgMultiplier ? result.avgMultiplier.toFixed(2) + 'x' : '--';
    //     if (this.elements.volatility) this.elements.volatility.textContent = result.volatility ? result.volatility.toFixed(2) : '--';
    //     if (this.elements.riskZone) this.elements.riskZone.textContent = (result.riskLevel || 'N/A').toUpperCase();
    //     if (this.elements.analysisMessage) this.elements.analysisMessage.textContent = result.message;
    // }

    // ... inside UIController class ...

    renderPrediction(result) {
        if (this.elements.loadingOverlay) this.elements.loadingOverlay.style.display = 'none';
        
        if (result.error) {
            this.showInitialState();
            if (this.elements.analysisMessage) this.elements.analysisMessage.textContent = result.message;
            this.setPredictButtonState('error');
            return;
        }

        if (this.elements.predictionOutputDetails) this.elements.predictionOutputDetails.style.display = 'block';
        
        // 1. Existing Standard Fields
        if (this.elements.predictedValue) {
            // We show the "Safety Exit" as the main big number? 
            // Or keep Predicted? Let's keep Predicted but color it based on risk.
            this.elements.predictedValue.textContent = result.predictedValue.toFixed(2) + 'x';
            this.elements.predictedValue.style.color = result.riskLevel === 'HIGH' ? 'var(--color-status-danger)' : 'var(--color-accent-primary)';
        }

        if (this.elements.predictedRoundId && result.gameId) {
            this.elements.predictedRoundId.textContent = `Target: Round ${result.gameId}`;
        }
        
        // 2. Confidence & Risk
        const confidenceVal = Math.min(result.confidence || 0, 100).toFixed(1) + '%';
        if (this.predictorCard) this.predictorCard.style.setProperty('--confidence-level', confidenceVal);
        if (this.elements.confidencePercentage) this.elements.confidencePercentage.textContent = confidenceVal;
        if (this.elements.riskZone) this.elements.riskZone.textContent = (result.riskLevel || 'N/A').toUpperCase();

        // 3. INJECT GOD-MODE STATS (Dynamic DOM Injection)
        // We look for the stats-grid and append/update our special "Safety" & "Bust" boxes
        const grid = document.querySelector('.stats-grid');
        if (grid) {
            // Check if we already created them to avoid duplicates
            let safetyBox = document.getElementById('god-mode-safety');
            let bustBox = document.getElementById('god-mode-bust');

            if (!safetyBox) {
                // Create Safety Box
                safetyBox = document.createElement('div');
                safetyBox.className = 'stat-item';
                safetyBox.id = 'god-mode-safety';
                safetyBox.innerHTML = `<div class="stat-label">Safety Exit</div><div class="stat-value" style="color: var(--color-status-success)">--</div>`;
                // Insert as second item (after Risk Zone)
                grid.insertBefore(safetyBox, grid.children[1]);
            }

            if (!bustBox) {
                // Create Bust Box
                bustBox = document.createElement('div');
                bustBox.className = 'stat-item';
                bustBox.id = 'god-mode-bust';
                bustBox.innerHTML = `<div class="stat-label">Bust Prob.</div><div class="stat-value" style="color: var(--color-status-danger)">--</div>`;
                // Insert as third item
                grid.insertBefore(bustBox, grid.children[2]);
            }

            // Update Values
            safetyBox.querySelector('.stat-value').textContent = result.safetyExit ? result.safetyExit.toFixed(2) + 'x' : '--';
            bustBox.querySelector('.stat-value').textContent = result.bustProbability ? result.bustProbability.toFixed(1) + '%' : '--';
        }

        // 4. Map "Avg Target" to something useful if not provided
        if (this.elements.avgMultiplier) this.elements.avgMultiplier.textContent = result.avgMultiplier ? result.avgMultiplier.toFixed(2) + 'x' : '--';
        if (this.elements.volatility) this.elements.volatility.textContent = result.matchCount ? `${result.matchCount} Matches` : '--'; // Repurposing Volatility for Match Count

        if (this.elements.analysisMessage) this.elements.analysisMessage.textContent = result.message;
    }

    getMultiplierClass(multiplier) {
        if (multiplier >= 10.0) return 'm-high';
        if (multiplier >= 2.0) return 'm-medium';
        if (multiplier >= 1.5) return 'm-moderate';
        return 'm-low';
    }

    renderNewRound(round) {
        if (!this.elements.recentGrid || this.cells.length === 0) return;
        
        // 1. Update the Big Number
        this.updateLastCrashDisplay(round.finalMultiplier);
        
        // 2. Simulate the Next Round Status
        this.updateSimulatedStatus(round.gameId);

        // 3. Update Grid (Shift Logic)
        const cellId = `center round-cell-${round.gameId}`;
        const multiplierClass = this.getMultiplierClass(round.finalMultiplier);
        const formattedMultiplier = round.finalMultiplier.toFixed(2);
        
        let existingCell = this.cells.find(c => c.id === cellId);
        if (existingCell) return;

        const oldestCell = this.cells.pop(); 
        oldestCell.id = cellId;
        oldestCell.textContent = formattedMultiplier;
        oldestCell.className = `multiplier-cell ${multiplierClass}`;
        
        this.elements.recentGrid.prepend(oldestCell);
        this.cells.unshift(oldestCell); 
        
        // Re-enable button
        this.setPredictButtonState('ready'); 
    }

    // -------------------------
    // NEW: Methods expected by LiveSync (aliases + implementations)
    // -------------------------

    /**
     * Called by LiveSync after history fetch or after each new round.
     * multipliers: array of numbers (newest first)
     */
    updateStats(multipliers = []) {
        if (!Array.isArray(multipliers)) multipliers = [];

        const total = multipliers.length;
        const avg = this._calcAverage(multipliers);
        const volatility = this._calcStdDev(multipliers, avg);
        const winRate = this._calcWinRate(multipliers);

        if (this.elements.totalPredictionsValue) this.elements.totalPredictionsValue.textContent = total;
        if (this.elements.totalPredictionsFooter) this.elements.totalPredictionsFooter.textContent = `Last ${total} rounds`;
        if (this.elements.avgMultiplier) this.elements.avgMultiplier.textContent = total ? avg.toFixed(2) + 'x' : '--';
        if (this.elements.volatility) this.elements.volatility.textContent = total ? volatility.toFixed(2) : '--';
        if (this.elements.winRateValue) this.elements.winRateValue.textContent = `${(winRate * 100).toFixed(1)}%`;
    }

    /**
     * Update the small history grid with a fresh set of multipliers.
     * Expects multipliers newest-first (same as DataStore.getRecentMultipliers)
     */
    // updateRecentMultipliers(multipliers = []) {
    //     if (!Array.isArray(multipliers) || this.cells.length === 0) return;
    //     // Fill cells from newest at index 0 -> leftmost cell
    //     for (let i = 0; i < this.cells.length; i++) {
    //         const val = multipliers[i];
    //         if (typeof val === 'number') {
    //             const cls = this.getMultiplierClass(val);
    //             this.cells[i].textContent = val.toFixed(2);
    //             this.cells[i].className = `multiplier-cell ${cls}`;
    //         } else {
    //             this.cells[i].textContent = '--';
    //             this.cells[i].className = 'multiplier-cell m-default';
    //         }
    //     }
    // }

    updateRecentMultipliers(multipliers = []) {
    if (!Array.isArray(multipliers) || this.cells.length === 0) return;
    // Fill cells from newest at index 0 -> leftmost cell
    for (let i = 0; i < this.cells.length; i++) {
        const val = multipliers[i];
        if (Number.isFinite(val) && val > 0) {
            const cls = this.getMultiplierClass(val);
            this.cells[i].textContent = val.toFixed(2);
            this.cells[i].className = `multiplier-cell ${cls}`;
        } else {
            // Show '--' for empty/invalid/zero values
            this.cells[i].textContent = '--';
            this.cells[i].className = 'multiplier-cell m-default';
        }
    }
}


    /**
     * Alias used by LiveSync to display a prediction result object.
     */
    displayPrediction(prediction) {
        this.renderPrediction(prediction);
    }

    /**
     * Called when the live round ends — show crashed state briefly and update main display.
     */
    showCrashedState(finalMultiplier) {
        // Display crash
        this.updateLastCrashDisplay(finalMultiplier);

        // Quick visual flash to indicate crash
        if (this.elements.currentMultiplier) {
            const el = this.elements.currentMultiplier;
            el.style.transition = 'transform 180ms ease, color 220ms ease';
            el.style.transform = 'scale(1.08)';
            el.style.color = 'var(--color-danger)';
            setTimeout(() => {
                el.style.transform = '';
                el.style.color = 'var(--text-primary)';
            }, 350);
        }

        // Update status dot/message
        // if (this.elements.statusDot) {
        //     this.elements.statusDot.style.backgroundColor = 'var(--color-status-danger)';
        //     this.elements.statusDot.style.boxShadow = '0 0 8px var(--color-status-danger)';
        // }
        // if (this.elements.statusMessage) {
        //     this.elements.statusMessage.textContent = 'Round Ended';
        // }
    }

    /**
     * Called by LiveSync to set the visible round counter or sessions value.
     */
    updateRoundCounter(count) {
        if (this.elements.activeSessionsValue) {
            this.elements.activeSessionsValue.textContent = String(count);
        } else if (this.elements.totalPredictionsValue) {
            // fallback
            this.elements.totalPredictionsValue.textContent = String(count);
        }
    }

    /**
     * Called by LiveSync when a live final multiplier arrives.
     * This method name existed in earlier UIController versions; keep it.
     */
    updateMultiplier(multiplier) {
        this.updateLastCrashDisplay(multiplier);
    }

    // -------------------------
    // Internal helpers
    // -------------------------
    _calcAverage(arr) {
        if (!arr || arr.length === 0) return 0;
        const sum = arr.reduce((s, v) => s + v, 0);
        return sum / arr.length;
    }

    _calcStdDev(arr, mean = null) {
        if (!arr || arr.length < 2) return 0;
        if (mean === null) mean = this._calcAverage(arr);
        const variance = arr.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / (arr.length - 1);
        return Math.sqrt(variance);
    }

    _calcWinRate(arr) {
        if (!arr || arr.length === 0) return 0;
        // define 'win' as multiplier >= 2.0 (tunable)
        const wins = arr.filter(v => typeof v === 'number' && v >= 2.0).length;
        return wins / arr.length;
    }
}
