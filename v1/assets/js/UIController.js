/**
 * js/UIController.js
 * Manages all DOM manipulations and state transitions.
 * Updated for Look-Ahead Simulation.
 */

export class UIController {
    constructor(elements) {
        this.elements = elements;
        this.cells = []; 
        this.predictorCard = document.getElementById('ai-predictor');
        
        // Initialize the 10 fixed history cells
        this.initializeHistoryCells(10); 
        console.log(`UIController: Initialized.`);
    }
    
    initializeHistoryCells(limit) {
        if (!this.elements.recentGrid) return;
        this.elements.recentGrid.innerHTML = ''; 
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
            this.elements.predictBtn.textContent = 'Predict Next'; // Updated text
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

    /**
     * 🔥 NEW: Updates the main display with the LAST CRASH value.
     */
    updateLastCrashDisplay(multiplier) {
        if (this.elements.currentMultiplier) {
            this.elements.currentMultiplier.textContent = multiplier.toFixed(2) + 'x';
            // Use a neutral color since it's history, not live-ticking
            this.elements.currentMultiplier.style.color = 'var(--text-primary)'; 
        }
    }

    /**
     * 🔥 NEW: Simulates the status of the NEXT round running.
     * @param {number} lastGameId - The ID of the round that just finished.
     */
    updateSimulatedStatus(lastGameId) {
        const nextRoundId = lastGameId + 1;
        
        // Pulse the status dot green
        if (this.elements.statusDot) {
            this.elements.statusDot.className = 'status-dot'; 
            this.elements.statusDot.style.backgroundColor = 'var(--color-status-success)';
            this.elements.statusDot.style.boxShadow = '0 0 8px var(--color-status-success)';
        }

        // Update Text
        if (this.elements.statusMessage) {
            this.elements.statusMessage.textContent = `Round ${nextRoundId} Running...`;
            this.elements.statusMessage.style.color = 'var(--text-secondary)';
        }
    }

    updateLiveMultiplier(multiplier) {
        // Not used in history mode, but kept for compatibility
        this.updateLastCrashDisplay(multiplier);
    }

    updateStatus(status, message) {
        // Fallback status updater
        if (this.elements.statusMessage) this.elements.statusMessage.textContent = message;
    }

    renderPrediction(result) {
        if (this.elements.loadingOverlay) this.elements.loadingOverlay.style.display = 'none';
        
        if (result.error) {
            this.showInitialState();
            if (this.elements.analysisMessage) this.elements.analysisMessage.textContent = result.message;
            this.setPredictButtonState('error');
            return;
        }

        if (this.elements.predictionOutputDetails) this.elements.predictionOutputDetails.style.display = 'block';
        
        if (this.elements.predictedValue) {
            this.elements.predictedValue.textContent = result.predictedValue.toFixed(2) + 'x';
        }

        // Display the Target Round ID (Look-Ahead)
        if (this.elements.predictedRoundId && result.gameId) {
            this.elements.predictedRoundId.textContent = `Target: Round ${result.gameId}`;
        }
        
        const confidenceVal = Math.min(result.confidence || 0, 100).toFixed(1) + '%';
        
        if (this.predictorCard) {
            this.predictorCard.style.setProperty('--confidence-level', confidenceVal);
        }
        if (this.elements.confidencePercentage) {
            this.elements.confidencePercentage.textContent = confidenceVal;
        }

        if (this.elements.avgMultiplier) this.elements.avgMultiplier.textContent = result.avgMultiplier ? result.avgMultiplier.toFixed(2) + 'x' : '--';
        if (this.elements.volatility) this.elements.volatility.textContent = result.volatility ? result.volatility.toFixed(2) + 'x' : '--';
        if (this.elements.riskZone) this.elements.riskZone.textContent = (result.riskLevel || 'N/A').toUpperCase();
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
}