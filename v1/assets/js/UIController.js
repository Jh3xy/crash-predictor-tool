/**
 * js/UIController.js
 * Manages all DOM manipulations and state transitions for the UI.
 * OPTIMIZATION: Uses a fixed array of DOM elements (cells) to avoid 
 * constant creation and removal of history items, improving performance.
 */

export class UIController {
    constructor(elements) {
        this.elements = elements;
        this.roundStatus = 'awaiting';
        // The cell array holds the 10 fixed history cells for quick updates
        this.cells = []; 
        // We will not rely on `this.historyCount` for removal/creation, just tracking.
        this.historyCount = 0; 

        // Cache the predictor card element
        this.predictorCard = document.getElementById('ai-predictor');
        
        // --- NEW: Initialize the 10 fixed history cells ---
        this.initializeHistoryCells(10); 
        
        console.log(`UIController: Initialized. History cells created: ${this.cells.length}.`);
    }
    
    /**
     * Creates a fixed number of empty history cells and appends them to the DOM.
     * This runs only once on initialization.
     * @param {number} limit The maximum number of cells to create (e.g., 10).
     */
    initializeHistoryCells(limit) {
        if (!this.elements.recentGrid) return;

        for (let i = 0; i < limit; i++) {
            const cell = document.createElement('div');
            // Add a default class for styling
            cell.classList.add('multiplier-cell', 'm-default'); 
            cell.textContent = '--'; 
            
            this.elements.recentGrid.appendChild(cell); // Append them initially
            this.cells.push(cell); // Store reference
        }
    }
    
    // --- NEW METHOD FOR SMARTER ENCAPSULATION ---
    /**
     * Controls the state and text of the main predict button.
     * @param {string} state - 'loading' (disabled), 'ready' (enabled), 'error' (enabled, reset text)
     */
    setPredictButtonState(state) {
        if (!this.elements.predictBtn) return;
        
        if (state === 'loading') {
            this.elements.predictBtn.textContent = 'Analyzing...';
            this.elements.predictBtn.disabled = true;
        } else if (state === 'ready') {
            this.elements.predictBtn.textContent = 'Predict Next Crash';
            this.elements.predictBtn.disabled = false;
        } else if (state === 'error') {
            this.elements.predictBtn.textContent = 'Predict Next Crash';
            this.elements.predictBtn.disabled = false;
        }
    }
    // ---------------------------------------------
    
    /**
     * Sets the UI to the clean, initial "Click predict to analyze" state.
     */
    showInitialState() {
        if (this.elements.initialStateContent) this.elements.initialStateContent.style.display = 'block';
        if (this.elements.loadingOverlay) this.elements.loadingOverlay.style.display = 'none';
        if (this.elements.predictionOutputDetails) this.elements.predictionOutputDetails.style.display = 'none';

        // Reset predicted value display 
        if (this.elements.predictedValue) this.elements.predictedValue.textContent = '--';
        if (this.elements.confidencePercentage) this.elements.confidencePercentage.textContent = '0%';
        
        // Reset the new stats back to default
        if (this.elements.riskZone) this.elements.riskZone.textContent = '--';
        if (this.elements.avgMultiplier) this.elements.avgMultiplier.textContent = '--';
        if (this.elements.volatility) this.elements.volatility.textContent = '--';
        if (this.elements.analysisMessage) this.elements.analysisMessage.textContent = 'Ready for analysis.';
        
        if (this.predictorCard) {
            this.predictorCard.style.setProperty('--confidence-level', '0%');
        }
        
        this.setPredictButtonState('ready'); // Ensure button is ready
    }
    
    /**
     * Sets the UI to the "Analyzing" state with the spinner.
     */
    showLoadingState() {
        if (this.elements.initialStateContent) this.elements.initialStateContent.style.display = 'none';
        // Use flex to center spinner, as defined in css/style.css
        if (this.elements.loadingOverlay) this.elements.loadingOverlay.style.display = 'flex'; 
        if (this.elements.predictionOutputDetails) this.elements.predictionOutputDetails.style.display = 'none';

        this.setPredictButtonState('loading'); // Use the new method
    }

    /**
     * Updates the main live multiplier display.
     * @param {number} multiplier The current live multiplier.
     */
    updateLiveMultiplier(multiplier) {
        const text = multiplier.toFixed(2) + 'x';
        if (this.elements.currentMultiplier) {
            this.elements.currentMultiplier.textContent = text;
        }
    }

    /**
     * Updates the connection/game status in the status bar.
     * @param {string} status 'mock' or 'reconnecting' or 'error'
     * @param {string} message The message to display.
     */
    updateStatus(status, message) {
        const dot = this.elements.statusDot;
        if (dot) {
            // Note: Background color is set here because it's dynamic based on status
            dot.style.backgroundColor = status === 'mock' ? 'var(--color-success)' : 
                                            status === 'reconnecting' ? 'var(--color-secondary)' : 
                                            'var(--cell-low)';
        }
        if (this.elements.statusMessage) {
            this.elements.statusMessage.textContent = message;
        }
    }

    /**
     * Renders the prediction result to the UI, hiding the loading state.
     * @param {object} result The prediction result object.
     */
    renderPrediction(result) {
        if (this.elements.loadingOverlay) this.elements.loadingOverlay.style.display = 'none';
        
        // Check for error/insufficient data
        if (result.error) {
            this.showInitialState();
            if (this.elements.analysisMessage) {
                this.elements.analysisMessage.textContent = result.message || 'Not enough historical data for analysis.';
                this.elements.initialStateContent.style.display = 'block';
            }
            this.setPredictButtonState('error'); // Use the new method
            return;
        }

        // Show the prediction details container
        if (this.elements.predictionOutputDetails) {
            this.elements.predictionOutputDetails.style.display = 'block';
        }
        
        // 1. Predicted Value
        const predictedVal = result.predictedValue || 1.00; 
        const predictedText = predictedVal.toFixed(2) + 'x';
        if (this.elements.predictedValue) {
            this.elements.predictedValue.textContent = predictedText;
        }
        // <-- NEW ROUND ID LOGIC -->
        const roundIdText = result.gameId ? `Round: ${result.gameId}` : 'Round: N/A';
        if (this.elements.predictedRoundId) {
            this.elements.predictedRoundId.textContent = roundIdText;
        }
        
        // 2. Confidence Level (CSS Variable and Percentage Text)
        const confidenceVal = result.confidence || 0;
        
        // Calculate the final, clamped percentage string (e.g., "51.1%")
        // Cap confidence at 100% and round to 1 decimal place.
        const finalConfidencePercentString = Math.min(confidenceVal, 100).toFixed(1) + '%';
        
        // Set the CSS variable on the predictorCard element
        if (this.predictorCard) {
            this.predictorCard.style.setProperty('--confidence-level', finalConfidencePercentString);
            console.log(`[UI] Setting CSS var --confidence-level to ${finalConfidencePercentString}`);
        }

        // Update the percentage text display
        if (this.elements.confidencePercentage) {
            this.elements.confidencePercentage.textContent = finalConfidencePercentString;
        }

        // 3. Detailed Stats
        
        // Avg. Target (Avg. Multiplier)
        const avgMultVal = result.avgMultiplier;
        if (this.elements.avgMultiplier) {
            this.elements.avgMultiplier.textContent = (typeof avgMultVal === 'number' && avgMultVal > 0) 
                ? avgMultVal.toFixed(2) + 'x' 
                : '--';
        }
        
        // Volatility
        const volatilityVal = result.volatility;
        if (this.elements.volatility) {
            this.elements.volatility.textContent = (typeof volatilityVal === 'number' && volatilityVal >= 0) 
                ? volatilityVal.toFixed(2) + 'x' 
                : '--';
        }

        // Risk Zone and Message
        if (this.elements.riskZone) this.elements.riskZone.textContent = (result.riskLevel || 'N/A').toUpperCase();
        if (this.elements.analysisMessage) this.elements.analysisMessage.textContent = result.message || 'Analysis successful.';
        
        // 4. Reset Button State
        this.setPredictButtonState('ready'); // Use the new method
    }

    /**
     * Helper to determine the correct CSS class based on multiplier value.
     * @param {number} multiplier The crash value.
     * @returns {string} The CSS class name (e.g., 'm-low', 'm-medium').
     */
    getMultiplierClass(multiplier) {
        // The thresholds are: >= 5.0 (high), >= 2.0 (medium), >= 1.5 (moderate), < 1.5 (low)
        if (multiplier >= 5.0) {
            return 'm-high';
        } else if (multiplier >= 2.0) {
            return 'm-medium';
        } else if (multiplier >= 1.5) {
            return 'm-moderate';
        } else {
            return 'm-low';
        }
    }


    /**
     * Renders a new round result into the recent history grid using a performant shift pattern.
     * @param {object} round The completed round data.
     */
    renderNewRound(round) {
        if (!this.elements.recentGrid || this.cells.length === 0) return;
        
        const cellId = `center round-cell-${round.gameId}`;
        const multiplierClass = this.getMultiplierClass(round.finalMultiplier);
        const formattedMultiplier = round.finalMultiplier.toFixed(2);
        
        // 1. Check if the round cell already exists (for verification update)
        // In the rare case of a verification update, we check all known cells
        let existingCell = this.cells.find(c => c.id === cellId);
        if (existingCell) {
            existingCell.title = `Crash: ${round.finalMultiplier}x | Status: ${round.verificationStatus}`;
            existingCell.className = `multiplier-cell ${multiplierClass}`;
            return;
        }

        // 2. If it's a NEW round, get the oldest cell (the one at the end of the list)
        // Since we prepend, the cell at the end of the `this.cells` array is the oldest on the DOM.
        const oldestCell = this.cells.pop(); // Remove the last cell from the array
        
        // 3. Update the content of the oldest cell (this is the fast part!)
        oldestCell.id = cellId;
        oldestCell.textContent = formattedMultiplier;
        oldestCell.title = `Crash: ${formattedMultiplier}x | Status: ${round.verificationStatus}`;
        
        // Remove old class and apply the new one
        oldestCell.className = ''; // Clear all classes
        oldestCell.classList.add('multiplier-cell', multiplierClass); 
        
        // 4. Prepend the updated cell to the grid (this is the "shift")
        // The browser simply moves the existing DOM node, which is much faster than creation/deletion.
        this.elements.recentGrid.prepend(oldestCell);

        // 5. Add the cell to the front of our internal array to track its new position
        this.cells.unshift(oldestCell); 
        
        // Note: The `this.historyCount` and `while (this.historyCount > 10)` logic 
        // is no longer necessary, as the array and the DOM are fixed at 10 elements.
        console.log(`✨ [Round ${round.gameId}] History cell updated and shifted.`);
    }
}