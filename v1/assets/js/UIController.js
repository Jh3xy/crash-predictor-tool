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

//     renderPrediction(result) {
//         if (this.elements.loadingOverlay) this.elements.loadingOverlay.style.display = 'none';
        
//         if (result.error) {
//             this.showInitialState();
//             if (this.elements.analysisMessage) this.elements.analysisMessage.textContent = result.message;
//             this.setPredictButtonState('error');
//             return;
//         }
//             // NEW: Update all UI elements with Prophet v2 data
//     if (this.elements.predictedValue) {
//         this.elements.predictedValue.textContent = result.mostLikely.toFixed(2) + 'x';
        
//         // Color code by action
//         const color = result.action === 'BET' ? 'var(--color-status-success)' :
//                      result.action === 'SKIP' ? 'var(--color-status-danger)' :
//                      'var(--color-status-warning)';
//         this.elements.predictedValue.style.color = color;
//     }

//     if (this.elements.predictedRoundId && result.gameId) {
//         this.elements.predictedRoundId.textContent = `Target: Round ${result.gameId}`;
//     }

//     // Confidence
//     const confidenceVal = result.confidence.toFixed(1) + '%';
//     if (this.predictorCard) {
//         this.predictorCard.style.setProperty('--confidence-level', confidenceVal);
//     }
//     if (this.elements.confidencePercentage) {
//         this.elements.confidencePercentage.textContent = confidenceVal;
//     }

//     // Stats Grid Updates
//     if (this.elements.avgMultiplier) {
//         // Show predicted range instead
//         this.elements.avgMultiplier.textContent = 
//             `${result.predictedRange[0].toFixed(2)}-${result.predictedRange[1].toFixed(2)}x`;
//     }
    
//     if (this.elements.volatility) {
//         this.elements.volatility.textContent = result.volatility.toFixed(2);
//     }
    
//     if (this.elements.riskZone) {
//         // Map action to risk level
//         const riskMap = {
//             'BET': 'LOW',
//             'CAUTIOUS_BET': 'MEDIUM',
//             'SKIP': 'HIGH',
//             'OBSERVE': 'MEDIUM'
//         };
//         this.elements.riskZone.textContent = riskMap[result.action] || 'MEDIUM';
//     }

//     // Analysis Message (NEW)
//     if (this.elements.analysisMessage) {
//         this.elements.analysisMessage.textContent = 
//             `${result.action}: ${result.reasoning}`;
//     }

//     // NEW: Inject Safety Exit Stat
//     const statsGrid = document.querySelector('.stats-grid');
//     if (statsGrid) {
//         let safetyBox = document.getElementById('safety-exit-stat');
//         if (!safetyBox) {
//             safetyBox = document.createElement('div');
//             safetyBox.className = 'stat-item';
//             safetyBox.id = 'safety-exit-stat';
//             safetyBox.innerHTML = `
//                 <div class="stat-label">Safety Exit</div>
//                 <div class="stat-value" style="color: var(--color-status-success)">--</div>
//             `;
//             statsGrid.insertBefore(safetyBox, statsGrid.children[1]);
//         }
//         safetyBox.querySelector('.stat-value').textContent = 
//             result.safetyZone.toFixed(2) + 'x';

//         let bustBox = document.getElementById('bust-prob-stat');
//         if (!bustBox) {
//             bustBox = document.createElement('div');
//             bustBox.className = 'stat-item';
//             bustBox.id = 'bust-prob-stat';
//             bustBox.innerHTML = `
//                 <div class="stat-label">Bust Probability</div>
//                 <div class="stat-value" style="color: var(--color-status-danger)">--</div>
//             `;
//             statsGrid.insertBefore(bustBox, statsGrid.children[2]);
//         }
//         bustBox.querySelector('.stat-value').textContent = 
//             result.bustProbability.toFixed(1) + '%';
//     }

//     // Show prediction section
//     if (this.elements.predictionOutputDetails) {
//         this.elements.predictionOutputDetails.style.display = 'block';
//     }
//     if (this.elements.loadingOverlay) {
//         this.elements.loadingOverlay.style.display = 'none';
//     }
// }
        // if (this.elements.predictionOutputDetails) this.elements.predictionOutputDetails.style.display = 'block';
        
        // // 1. Existing Standard Fields
        // if (this.elements.predictedValue) {
        //     // We show the "Safety Exit" as the main big number? 
        //     // Or keep Predicted? Let's keep Predicted but color it based on risk.
        //     this.elements.predictedValue.textContent = result.predictedValue.toFixed(2) + 'x';
        //     this.elements.predictedValue.style.color = result.riskLevel === 'HIGH' ? 'var(--color-status-danger)' : 'var(--color-accent-primary)';
        // }

        // if (this.elements.predictedRoundId && result.gameId) {
        //     this.elements.predictedRoundId.textContent = `Target: Round ${result.gameId}`;
        // }
        
        // // 2. Confidence & Risk
        // const confidenceVal = Math.min(result.confidence || 0, 100).toFixed(1) + '%';
        // if (this.predictorCard) this.predictorCard.style.setProperty('--confidence-level', confidenceVal);
        // if (this.elements.confidencePercentage) this.elements.confidencePercentage.textContent = confidenceVal;
        // if (this.elements.riskZone) this.elements.riskZone.textContent = (result.riskLevel || 'N/A').toUpperCase();

        // // 3. INJECT GOD-MODE STATS (Dynamic DOM Injection)
        // // We look for the stats-grid and append/update our special "Safety" & "Bust" boxes
        // const grid = document.querySelector('.stats-grid');
        // if (grid) {
        //     // Check if we already created them to avoid duplicates
        //     let safetyBox = document.getElementById('god-mode-safety');
        //     let bustBox = document.getElementById('god-mode-bust');

        //     if (!safetyBox) {
        //         // Create Safety Box
        //         safetyBox = document.createElement('div');
        //         safetyBox.className = 'stat-item';
        //         safetyBox.id = 'god-mode-safety';
        //         safetyBox.innerHTML = `<div class="stat-label">Safety Exit</div><div class="stat-value" style="color: var(--color-status-success)">--</div>`;
        //         // Insert as second item (after Risk Zone)
        //         grid.insertBefore(safetyBox, grid.children[1]);
        //     }

        //     if (!bustBox) {
        //         // Create Bust Box
        //         bustBox = document.createElement('div');
        //         bustBox.className = 'stat-item';
        //         bustBox.id = 'god-mode-bust';
        //         bustBox.innerHTML = `<div class="stat-label">Bust Prob.</div><div class="stat-value" style="color: var(--color-status-danger)">--</div>`;
        //         // Insert as third item
        //         grid.insertBefore(bustBox, grid.children[2]);
        //     }

        //     // Update Values
        //     safetyBox.querySelector('.stat-value').textContent = result.safetyExit ? result.safetyExit.toFixed(2) + 'x' : '--';
        //     bustBox.querySelector('.stat-value').textContent = result.bustProbability ? result.bustProbability.toFixed(1) + '%' : '--';
        // }

        // // 4. Map "Avg Target" to something useful if not provided
        // if (this.elements.avgMultiplier) this.elements.avgMultiplier.textContent = result.avgMultiplier ? result.avgMultiplier.toFixed(2) + 'x' : '--';
        // if (this.elements.volatility) this.elements.volatility.textContent = result.matchCount ? `${result.matchCount} Matches` : '--'; // Repurposing Volatility for Match Count

        // if (this.elements.analysisMessage) this.elements.analysisMessage.textContent = result.message;
    
    /**
 * Enhanced renderPrediction method for UIController
 * Add this to your existing UIController.js to replace the current renderPrediction method
 */

renderPrediction(result) {
    // Hide loading overlay
    if (this.elements.loadingOverlay) {
        this.elements.loadingOverlay.style.display = 'none';
    }
    
    // Handle errors
    if (result.error) {
        this.showInitialState();
        if (this.elements.analysisMessage) {
            this.elements.analysisMessage.textContent = result.message;
            this.elements.analysisMessage.style.color = 'var(--color-status-danger)';
        }
        this.setPredictButtonState('error');
        return;
    }

    // Show prediction output section
    if (this.elements.predictionOutputDetails) {
        this.elements.predictionOutputDetails.style.display = 'block';
    }

    // === 1. MAIN PREDICTED VALUE ===
    if (this.elements.predictedValue) {
        this.elements.predictedValue.textContent = result.predictedValue.toFixed(2) + 'x';
        
        // Color code by action/risk
        let color;
        if (result.action === 'STRONG BET' || result.action === 'MODERATE BET') {
            color = 'var(--color-status-success)';
        } else if (result.action === 'SKIP ROUND') {
            color = 'var(--color-status-danger)';
        } else {
            color = 'var(--color-status-warning)';
        }
        this.elements.predictedValue.style.color = color;
    }

    // === 2. ROUND ID (if provided) ===
    if (this.elements.predictedRoundId && result.gameId) {
        this.elements.predictedRoundId.textContent = `Target: Round ${result.gameId}`;
    }

    // === 3. CONFIDENCE LEVEL ===
    const confidenceVal = Math.min(result.confidence || 0, 100).toFixed(1) + '%';
    
    // Update CSS custom property for progress bar
    if (this.predictorCard) {
        this.predictorCard.style.setProperty('--confidence-level', confidenceVal);
    }
    
    // Update confidence percentage text
    if (this.elements.confidencePercentage) {
        this.elements.confidencePercentage.textContent = confidenceVal;
    }

    // === 4. STATS GRID ===
    
    // Risk Zone (with color coding)
    if (this.elements.riskZone) {
        const risk = result.riskLevel || 'MEDIUM';
        this.elements.riskZone.textContent = risk;
        
        // Color code risk
        let riskColor;
        if (risk === 'LOW') riskColor = 'var(--color-status-success)';
        else if (risk === 'HIGH') riskColor = 'var(--color-status-danger)';
        else riskColor = 'var(--color-status-warning)';
        
        this.elements.riskZone.style.color = riskColor;
    }
    
    // Avg. Target (show predicted range)
    if (this.elements.avgMultiplier) {
        if (result.avgMultiplier) {
            // If pre-formatted range string
            this.elements.avgMultiplier.textContent = result.avgMultiplier;
        } else if (result.predictedRange) {
            // Format range
            const [min, max] = result.predictedRange;
            this.elements.avgMultiplier.textContent = 
                `${min.toFixed(2)}-${max.toFixed(2)}x`;
        } else {
            this.elements.avgMultiplier.textContent = '--';
        }
    }
    
    // Volatility
    if (this.elements.volatility) {
        this.elements.volatility.textContent = result.volatility || '--';
    }

    // === 5. DYNAMIC STATS INJECTION ===
    // Add Safety Exit and Bust Probability if not present
    
    const statsGrid = document.querySelector('.stats-grid');
    if (statsGrid) {
        // Safety Exit stat
        let safetyBox = document.getElementById('safety-exit-stat');
        if (!safetyBox && result.safetyZone) {
            safetyBox = document.createElement('div');
            safetyBox.className = 'stat-item';
            safetyBox.id = 'safety-exit-stat';
            safetyBox.innerHTML = `
                <div class="stat-label">Safety Exit</div>
                <div class="stat-value" style="color: var(--color-status-success)">--</div>
            `;
            // Insert after Risk Zone (first item)
            statsGrid.insertBefore(safetyBox, statsGrid.children[1]);
        }
        if (safetyBox && result.safetyZone) {
            safetyBox.querySelector('.stat-value').textContent = 
                result.safetyZone.toFixed(2) + 'x';
        }

        // Bust Probability stat
        let bustBox = document.getElementById('bust-prob-stat');
        if (!bustBox && result.bustProbability !== undefined) {
            bustBox = document.createElement('div');
            bustBox.className = 'stat-item';
            bustBox.id = 'bust-prob-stat';
            bustBox.innerHTML = `
                <div class="stat-label">Bust Probability</div>
                <div class="stat-value" style="color: var(--color-status-danger)">--</div>
            `;
            // Insert after Safety Exit
            const safetyIndex = Array.from(statsGrid.children).indexOf(safetyBox);
            if (safetyIndex >= 0) {
                statsGrid.insertBefore(bustBox, statsGrid.children[safetyIndex + 1]);
            } else {
                statsGrid.insertBefore(bustBox, statsGrid.children[2]);
            }
        }
        if (bustBox && result.bustProbability !== undefined) {
            bustBox.querySelector('.stat-value').textContent = 
                result.bustProbability.toFixed(1) + '%';
        }

        // Kelly Bet Size stat (optional - only show if action is bet)
        if (result.kellyBetSize && result.action !== 'SKIP ROUND') {
            let kellyBox = document.getElementById('kelly-bet-stat');
            if (!kellyBox) {
                kellyBox = document.createElement('div');
                kellyBox.className = 'stat-item';
                kellyBox.id = 'kelly-bet-stat';
                kellyBox.innerHTML = `
                    <div class="stat-label">Kelly Bet Size</div>
                    <div class="stat-value" style="color: var(--color-accent-primary)">--</div>
                `;
                statsGrid.appendChild(kellyBox);
            }
            kellyBox.querySelector('.stat-value').textContent = result.kellyBetSize;
            kellyBox.style.display = 'block';
        } else {
            // Hide Kelly box if skipping
            const kellyBox = document.getElementById('kelly-bet-stat');
            if (kellyBox) kellyBox.style.display = 'none';
        }
    }

    // === 6. ANALYSIS MESSAGE ===
    if (this.elements.analysisMessage) {
        // Build comprehensive message
        let message = result.message || '';
        
        // Add action prefix with emoji
        const actionEmoji = {
            'STRONG BET': '🎯',
            'MODERATE BET': '✅',
            'CAUTIOUS BET': '⚠️',
            'SKIP ROUND': '🛑',
            'OBSERVE': '👁️'
        };
        
        const emoji = actionEmoji[result.action] || '';
        const fullMessage = emoji ? `${emoji} ${result.action}: ${message}` : message;
        
        this.elements.analysisMessage.textContent = fullMessage;
        
        // Color code by action
        let messageColor = 'var(--text-primary)';
        if (result.action === 'SKIP ROUND') {
            messageColor = 'var(--color-status-danger)';
        } else if (result.action === 'STRONG BET') {
            messageColor = 'var(--color-status-success)';
        }
        this.elements.analysisMessage.style.color = messageColor;
    }

    // === 7. ALERTS SECTION (Optional Enhancement) ===
    // Add alert badges if present
    this._renderAlerts(result);

    // === 8. BAYESIAN WIN RATE DISPLAY (Optional) ===
    // Show current Bayesian win rate in UI
    if (result.bayesianWinRate) {
        let bayesianDisplay = document.getElementById('bayesian-winrate');
        if (!bayesianDisplay) {
            // Create it dynamically
            const statsGrid = document.querySelector('.stats-grid');
            if (statsGrid) {
                bayesianDisplay = document.createElement('div');
                bayesianDisplay.className = 'stat-item';
                bayesianDisplay.id = 'bayesian-winrate';
                bayesianDisplay.innerHTML = `
                    <div class="stat-label">Model Win Rate</div>
                    <div class="stat-value" style="color: var(--color-accent-primary)">--</div>
                `;
                statsGrid.appendChild(bayesianDisplay);
            }
        }
        if (bayesianDisplay) {
            const winRatePercent = (parseFloat(result.bayesianWinRate) * 100).toFixed(1);
            bayesianDisplay.querySelector('.stat-value').textContent = winRatePercent + '%';
        }
    }

    // Re-enable predict button
    this.setPredictButtonState('ready');
}

/**
 * Helper method to render alert badges
 */
_renderAlerts(result) {
    // Look for or create alerts container
    let alertsContainer = document.getElementById('prediction-alerts');
    
    if (!alertsContainer) {
        // Create alerts container above stats grid
        const predictionOutput = document.getElementById('prediction-output-details');
        if (!predictionOutput) return;
        
        alertsContainer = document.createElement('div');
        alertsContainer.id = 'prediction-alerts';
        alertsContainer.className = 'alerts-container';
        alertsContainer.style.cssText = `
            display: flex;
            gap: 8px;
            margin-bottom: 12px;
            flex-wrap: wrap;
        `;
        
        // Insert before stats grid
        const statsGrid = predictionOutput.querySelector('.stats-grid');
        if (statsGrid) {
            predictionOutput.insertBefore(alertsContainer, statsGrid);
        } else {
            predictionOutput.prepend(alertsContainer);
        }
    }
    
    // Clear previous alerts
    alertsContainer.innerHTML = '';
    
    // Add alert badges
    const alerts = [];
    
    if (result.bustAlert) {
        alerts.push({
            text: '⚠️ High Bust Rate',
            color: 'var(--color-status-danger)'
        });
    }
    
    if (result.evtAlert) {
        alerts.push({
            text: '📊 Extreme Value Alert',
            color: 'var(--color-status-warning)'
        });
    }
    
    if (result.modelAgreement && result.modelAgreement < 60) {
        alerts.push({
            text: '🔀 Low Model Agreement',
            color: 'var(--color-status-warning)'
        });
    }
    
    // Render alert badges
    alerts.forEach(alert => {
        const badge = document.createElement('span');
        badge.className = 'alert-badge';
        badge.textContent = alert.text;
        badge.style.cssText = `
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 0.8rem;
            font-weight: 600;
            background: ${alert.color}20;
            color: ${alert.color};
            border: 1px solid ${alert.color}40;
        `;
        alertsContainer.appendChild(badge);
    });
    
    // Show/hide container based on alerts
    alertsContainer.style.display = alerts.length > 0 ? 'flex' : 'none';
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

        // if (this.elements.totalPredictionsValue) this.elements.totalPredictionsValue.textContent = total;
        // if (this.elements.totalPredictionsFooter) this.elements.totalPredictionsFooter.textContent = `Last ${total} rounds`;
        if (this.elements.avgMultiplier) this.elements.avgMultiplier.textContent = total ? avg.toFixed(2) + 'x' : '--';
        if (this.elements.volatility) this.elements.volatility.textContent = total ? volatility.toFixed(2) : '--';
        // if (this.elements.winRateValue) this.elements.winRateValue.textContent = `${(winRate * 100).toFixed(1)}%`;
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
