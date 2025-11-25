/**
 * js/UIController.js
 * * This module handles all DOM manipulation and rendering for the LiveSync Dashboard.
 *
 * FIX 1: Corrected template literal syntax issues.
 * FIX 2: Added parseFloat() for defensive coding in updateLiveMultiplier.
 * FIX 3: Ensured the 'multiple' class is retained for main multiplier styling.
 * FIX 4: Implemented a strict limit of 10 items for the Recent Multipliers grid (per request).
 * UPDATE: Enhanced renderPrediction to handle structured output and error states from CrashPredictor.
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
            
            // Use parseFloat() to ensure the input is always treated as a number.
            const numericMultiplier = parseFloat(multiplier) || 0.00;
            
            // Implement the required two-decimal rounding (toFixed(2)) and append 'x'
            const formattedMultiplier = numericMultiplier.toFixed(2); 
            
            this.elements.currentMultiplier.textContent = formattedMultiplier + 'x';
            
            // FIX APPLIED: Ensure the 'multiple' class is retained for styling
            this.elements.currentMultiplier.className = 
                `multiple text-6xl font-extrabold transition-colors duration-200 ${numericMultiplier >= 2.00 ? 'text-green-500' : 'text-red-500'}`;
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
            
            // Set the content
            newItem.textContent = `${round.finalMultiplier.toFixed(2)}x ${icon}`;

            // Find the existing item
            const existingItem = this.elements.recentGrid.querySelector(`[data-game-id="${round.gameId}"]`);
            
            // Set the game ID attribute for later identification/updates
            newItem.setAttribute('data-game-id', round.gameId);

            if (existingItem) {
                // If it exists, replace it (used for updating the status/color after verification)
                this.elements.recentGrid.replaceChild(newItem, existingItem);
            } else {
                // Otherwise, prepend the new result to the start of the grid
                this.elements.recentGrid.prepend(newItem);
            }

            // --- Grid Cleanup to maintain a fixed size ---
            const MAX_HISTORY_ITEMS = 10; 
            while (this.elements.recentGrid.children.length > MAX_HISTORY_ITEMS) {
                // Remove the last child (the oldest item)
                this.elements.recentGrid.removeChild(this.elements.recentGrid.lastChild);
            }
        }
    }
    
    /**
     * Renders the prediction analysis results (risk, average, volatility).
     * Expected result structure from CrashPredictor.
     */
    renderPrediction(result) {
        const predictedValueEl = this.elements.predictedValue;
        const riskZoneEl = this.elements.riskZone;

        if (predictedValueEl && riskZoneEl) {
            
            // Handle error state first (e.g., less than 20 rounds)
            if (result.error) {
                predictedValueEl.textContent = '--';
                riskZoneEl.textContent = 'N/A';
                riskZoneEl.className = `font-bold text-gray-400`;
                this.elements.analysisMessage.textContent = result.message;
                this.elements.avgMultiplier.textContent = '--';
                this.elements.volatility.textContent = '--';
                // Also reset the data-risk attribute
                riskZoneEl.setAttribute('data-risk', 'na');
                return;
            }
            
            // Update main predicted value
            predictedValueEl.textContent = result.predictedValue.toFixed(2) + 'x';
            
            // Determine risk color
            let riskColor = '';
            const risk = result.riskLevel.toUpperCase();
            if (risk === 'HIGH') { riskColor = 'text-red-500'; riskZoneEl.setAttribute('data-risk', 'high'); }
            else if (risk === 'MEDIUM') { riskColor = 'text-yellow-500'; riskZoneEl.setAttribute('data-risk', 'medium'); }
            else { riskColor = 'text-green-500'; riskZoneEl.setAttribute('data-risk', 'low'); } // LOW

            riskZoneEl.textContent = risk;
            riskZoneEl.className = `font-bold ${riskColor}`;
            
            // Update details
            this.elements.analysisMessage.textContent = result.message;
            this.elements.avgMultiplier.textContent = result.averageTarget.toFixed(2) + 'x';
            this.elements.volatility.textContent = result.volatility.toFixed(2) + 'x';
        }
    }
    
    displayError(msg) {
        console.error(`UIController Error: ${msg}`);
    }
}