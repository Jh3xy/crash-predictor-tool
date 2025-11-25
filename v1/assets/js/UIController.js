

/**
 * js/UIController.js
 * * This module is now solely the UI Renderer for the LiveSync Dashboard.
 *
 * FIX 1: Removed outdated dependencies (like CrashPredictor) and methods 
 * (like handleCalculateClick, displayResult) that belonged to the single-round calculator.
 * FIX 2: Corrected the constructor to receive and use the DOM elements mapped by main.js.
 * FIX 3: Implemented the required methods (updateLiveMultiplier, renderNewRound, etc.)
 * that your main script expects to exist.
 */

// We no longer need CrashPredictor here, as main.js handles the prediction module call.
// The UIController just needs to render the results.

export class UIController { 
    // FIX: The constructor MUST accept the elements object from main.js
    constructor(elements) {
        this.elements = elements; 
        console.log('UIController: Initialized. Ready to render the application.');
    }
    
    // ----------------------------------------------------------------------
    // --- REQUIRED METHODS FOR LIVE-SYNC DASHBOARD (Fixes "is not a function" errors) ---
    // ----------------------------------------------------------------------

    /**
     * Updates the main multiplier display during a live round.
     * Fixes: uiController.updateLiveMultiplier is not a function
     */
    updateLiveMultiplier(multiplier) {
        if (this.elements.currentMultiplier) {
            this.elements.currentMultiplier.textContent = multiplier;
            // Simple styling based on multiplier value
            this.elements.currentMultiplier.className = multiplier >= 2.00 ? 'text-green-500' : 'text-red-500';
        }
    }

    /**
     * Updates the connection status dot and message.
     */
    updateStatus(level, message) {
        if (this.elements.statusDot && this.elements.statusMessage) {
            let color = '';
            if (level === 'connected') color = 'bg-green-500';
            else if (level === 'reconnecting') color = 'bg-yellow-500';
            else if (level === 'mock') color = 'bg-blue-500';
            else color = 'bg-gray-500';

            this.elements.statusDot.className = `w-3 h-3 rounded-full ${color} mr-2 animate-pulse`;
            this.elements.statusMessage.textContent = message;
        }
    }

    /**
     * Renders a new round result into the history grid.
     * Fixes: uiController.renderNewRound is not a function
     */
    renderNewRound(round) {
        if (this.elements.recentGrid) {
            const newItem = document.createElement('div');
            const colorClass = round.finalMultiplier >= 2.00 ? 'bg-green-700' : 'bg-red-700';
            const icon = round.verificationStatus === 'Verified' ? '✅' : round.verificationStatus === 'Low Payout Verified' ? '🔒' : '';

            newItem.className = `p-2 rounded-lg text-sm font-semibold ${colorClass} text-white transition-all duration-300 transform hover:scale-105`;
            newItem.textContent = `${round.finalMultiplier.toFixed(2)}x ${icon}`;

            // Check if item needs to be replaced (for verification updates) or added
            const existingItem = t`his.elements.recentGrid.querySelector([data-game-id="${round.gameId}"])`;
            if (existingItem) {
                this.elements.recentGrid.replaceChild(newItem, existingItem);
            } else {
                this.elements.recentGrid.prepend(newItem);
            }
            newItem.setAttribute('data-game-id', round.gameId);
        }
    }
    
    /**
     * Renders the prediction analysis results (risk, average, volatility).
     */
    renderPrediction(result) {
        if (this.elements.riskZone) {
            let riskColor = '';
            if (result.risk === 'HIGH') riskColor = 'text-red-500';
            else if (result.risk === 'EXTREME') riskColor = 'text-purple-500';
            else riskColor = 'text-green-500';

            this.elements.riskZone.textContent = result.risk;
            this.elements.riskZone.className = `font-bold ${riskColor}`;
            
            this.elements.analysisMessage.textContent = result.message;
            this.elements.avgMultiplier.textContent = result.avg;
            this.elements.volatility.textContent = result.volatility;
        }
    }
    
    displayError(msg) {
        console.error(`UIController Error: ${msg}`);
    }
}

