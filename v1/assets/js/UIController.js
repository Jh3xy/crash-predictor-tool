
/**
 * js/UIController.js
 * * This module handles all DOM manipulation and rendering for the LiveSync Dashboard.
 *
 * FIX 1: The UIController class now receives the mapped DOM elements in its constructor
 * (Dependency Injection) to keep it clean and testable.
 * FIX 2: Contains the correct logic for renderNewRound to fix the 't is not defined' error.
 * FIX 3: Includes all required methods (updateLiveMultiplier, updateStatus, renderPrediction).
 */

export class UIController { 
    // The constructor receives the mapped elements from main.js
    constructor(elements) {
        this.elements = elements; 
        console.log('UIController: Initialized. Ready to render the application.');
    }
    
    /**
     * Updates the main multiplier display during a live round.
     */
    updateLiveMultiplier(multiplier) {
        if (this.elements.currentMultiplier) {
            // Implement the required two-decimal rounding (toFixed(2)) and append 'x'
            const formattedMultiplier = multiplier.toFixed(2); 
            
            this.elements.currentMultiplier.textContent = formattedMultiplier + 'x';
            
            // Apply dynamic styling based on multiplier value
            this.elements.currentMultiplier.className = 
                `text-6xl font-extrabold transition-colors duration-200 ${multiplier >= 2.00 ? 'text-green-500' : 'text-red-500'}`;
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

            // Use the appropriate Tailwind classes for the status dot
            this.elements.statusDot.className = `w-3 h-3 rounded-full ${color} mr-2 animate-pulse`;
            this.elements.statusMessage.textContent = message;
            // Also update the parent container's data attribute for CSS styling
            this.elements.statusMessage.setAttribute('data-status', level);
        }
    }

    /**
     * Renders a new round result into the history grid (Recent Multipliers). 
     * This function is called when the round completes (newRoundCompleted event).
     * @param {Object} round - The round data object.
     */
    renderNewRound(round) {
        if (this.elements.recentGrid) {
            const newItem = document.createElement('div');
            
            // Determine color based on multiplier
            const colorClass = round.finalMultiplier >= 2.00 ? 'bg-green-700' : 'bg-red-700';
            
            // Determine icon for verification status
            const icon = round.verificationStatus === 'Verified' ? '✅' : round.verificationStatus === 'Low Payout Verified' ? '🔒' : '';

            // Apply Tailwind classes for styling
            newItem.className = `p-2 rounded-lg text-sm font-semibold ${colorClass} text-white transition-all duration-300 transform hover:scale-105`;
            
            // --- FIX 1: Set the content ---
            newItem.textContent = `${round.finalMultiplier.toFixed(2)}x ${icon}`;

            // --- FIX 2 & 3: Find the existing item and set the ID ---
            const existingItem = this.elements.recentGrid.querySelector(`[data-game-id="${round.gameId}"]`);
            newItem.setAttribute('data-game-id', round.gameId);

            if (existingItem) {
                // If it exists, replace it (used for updating the status/color after verification)
                this.elements.recentGrid.replaceChild(newItem, existingItem);
            } else {
                // Otherwise, prepend the new result to the start of the grid
                this.elements.recentGrid.prepend(newItem);
            }

            // --- FIX 4: Grid Cleanup ---
            // Keep the grid clean, only showing the last 20 results (optional cleanup)
            while (this.elements.recentGrid.children.length > 20) {
                this.elements.recentGrid.removeChild(this.elements.recentGrid.lastChild);
            }
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
