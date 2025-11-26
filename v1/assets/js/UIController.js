
/**
 * js/UIController.js
 * * This module handles all DOM manipulation and rendering for the LiveSync Dashboard.
 *
 * FIX 1: Corrected template literal syntax issues.
 * FIX 2: Added parseFloat() for defensive coding in updateLiveMultiplier.
 * FIX 3: Ensured the 'multiple' class is retained for main multiplier styling.
 * FIX 4: Implemented a strict limit of 10 items for the Recent Multipliers grid (per request).
 * UPDATE: Enhanced renderPrediction to handle structured output and error states from CrashPredictor.
 *
 * FIX 5 (CRITICAL FIX): The prediction UI was not updating because of incorrect class handling.
 * - Removed the overriding riskZoneEl.className assignment.
 * - Now relies only on setting the 'data-risk' attribute to trigger the styling defined in index.html CSS.
 * - Added defensive checks for all prediction details.
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

            // Use the appropriate classes for the status dot, retaining the original CSS structure
            this.elements.statusDot.className = `status-dot ${color}`; // Assuming 'status-dot' is the base class for styling/size
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
            // Using existing CSS classes from index.html: green or red background
            const colorClass = round.finalMultiplier >= 2.00 ? 'bg-green-700' : 'bg-red-700'; 
            
            // Determine icon for verification status
            const icon = round.verificationStatus === 'Verified' ? '✅' : round.verificationStatus === 'Low Payout Verified' ? '🔒' : '';

            // Apply Tailwind classes for styling (simplified for the provided CSS)
            newItem.className = `center ${colorClass}`; // Use 'center' class from index.html CSS
            
            // Set the content
            newItem.textContent = `${round.finalMultiplier.toFixed(2)}x ${icon}`;

            // Set the game ID attribute for later identification/updates
            newItem.setAttribute('data-game-id', round.gameId);

            // Find the existing item
            const existingItem = this.elements.recentGrid.querySelector(`[data-game-id="${round.gameId}"]`);
            
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
        // *** DEBUG LOG: Verify the incoming data and element availability ***
        console.log('--- UIController: Starting Prediction Render ---');
        console.log('Result Data:', result);
        
        const predictedValueEl = this.elements.predictedValue;
        const riskZoneEl = this.elements.riskZone;

        // Check essential elements
        if (!predictedValueEl || !riskZoneEl) {
             console.error('UIController Error: Essential prediction elements (predictedValue or riskZone) are missing.');
             return;
        }
        
        // Handle error state first (e.g., less than 20 rounds)
        if (result.error) {
            predictedValueEl.textContent = '--';
            riskZoneEl.textContent = 'N/A';
            
            // Use defensive check for message element
            if (this.elements.analysisMessage) this.elements.analysisMessage.textContent = result.message || 'Not enough data for reliable analysis.';
            if (this.elements.avgMultiplier) this.elements.avgMultiplier.textContent = '--';
            if (this.elements.volatility) this.elements.volatility.textContent = '--';
            
            // Also set the data-risk attribute
            riskZoneEl.setAttribute('data-risk', 'na');
            
            console.log('--- UIController: Prediction Render Complete (Error State) ---');
            return;
        }
        
        // --- Successful Prediction Rendering ---
        
        // 1. Update main predicted value
        predictedValueEl.textContent = result.predictedValue.toFixed(2) + 'x';
        
        // 2. Determine risk color and update risk zone
        // We rely on the 'data-risk' attribute to trigger the CSS styling defined in index.html.
        const risk = (result.riskLevel || 'LOW').toUpperCase(); 
        let dataRiskAttribute = 'low';

        if (risk === 'HIGH') { dataRiskAttribute = 'high'; }
        else if (risk === 'MEDIUM') { dataRiskAttribute = 'medium'; }

        riskZoneEl.textContent = risk;
        // CRITICAL FIX: Set the data-risk attribute to apply the correct color via CSS
        riskZoneEl.setAttribute('data-risk', dataRiskAttribute);
        
        // 3. Update details (with defensive checks for missing elements and data)
        
        // FIX: Ensure 'message' property exists, otherwise use a default string using the confidence.
        const analysisMessage = result.message || `Confidence: ${result.confidence.toFixed(1)}%. Trend analysis complete.`;
        if (this.elements.analysisMessage) this.elements.analysisMessage.textContent = analysisMessage;
        
        if (this.elements.avgMultiplier) this.elements.avgMultiplier.textContent = result.averageTarget.toFixed(2) + 'x';
        if (this.elements.volatility) this.elements.volatility.textContent = result.volatility.toFixed(2) + 'x';

        console.log('--- UIController: Prediction Render Complete ---');
    }
    
    displayError(msg) {
        console.error(`UIController Error: ${msg}`);
    }
}

