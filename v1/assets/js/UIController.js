



// /**
//  * js/UIController.js
//  * Manages all DOM manipulations and state transitions for the UI.
//  *
//  * FIX: Replaced the hardcoded historyCount value with a dynamic DOM check
//  * to ensure the history counter is always synchronized with the UI.
//  *
//  * DEBUGGING ADDITIONS:
//  * - Added logging in the constructor to show the starting history count.
//  * - Added logging in renderNewRound to show count changes.
//  */

// export class UIController {
//     constructor(elements) {
//         this.elements = elements;
//         this.roundStatus = 'awaiting';
//         // FIX: SYNCHRONIZE COUNTER with the actual DOM elements. 
//         this.historyCount = this.elements.recentGrid ? this.elements.recentGrid.children.length : 0;
//         // Cache the predictor card element for setting the CSS variable
//         // NOTE: This assumes an element with ID 'predictor-card' exists in your HTML. 
//         this.predictorCard = document.getElementById('ai-predictor');
//         // DEBUG: Log the synchronized starting count
//         console.log(`UIController: Initialized. History count synchronized to ${this.historyCount} elements.`);
//     }
//     /**
//      * Sets the UI to the clean, initial "Click predict to analyze" state.
//      */
//     showInitialState() {
//         if (this.elements.initialStateContent) this.elements.initialStateContent.style.display = 'block';
//         if (this.elements.loadingOverlay) this.elements.loadingOverlay.style.display = 'none';
//         if (this.elements.predictionOutputDetails) this.elements.predictionOutputDetails.style.display = 'none';

//         // Reset predicted value display 
//         if (this.elements.predictedValue) this.elements.predictedValue.textContent = '--';
//         if (this.elements.confidencePercentage) this.elements.confidencePercentage.textContent = '0%';
        
//         // Reset the new stats back to default
//         if (this.elements.riskZone) this.elements.riskZone.textContent = '--';
//         if (this.elements.avgMultiplier) this.elements.avgMultiplier.textContent = '--';
//         if (this.elements.volatility) this.elements.volatility.textContent = '--';
//         if (this.elements.analysisMessage) this.elements.analysisMessage.textContent = 'Ready for analysis.';
//         // IMPORTANT: Reset the CSS variable for confidence level
//          if (this.predictorCard) {
//             this.predictorCard.style.setProperty('--confidence-level', '0%');
//         }
//     }
//     /**
//      * Sets the UI to the "Analyzing" state with the spinner.
//      */
//     showLoadingState() {
//         if (this.elements.initialStateContent) this.elements.initialStateContent.style.display = 'none';
//          // Use flex to center spinner, as defined in css/style.css
//          if (this.elements.loadingOverlay) this.elements.loadingOverlay.style.display = 'flex'; 
//         if (this.elements.predictionOutputDetails) this.elements.predictionOutputDetails.style.display = 'none';

//         if (this.elements.predictBtn) {
//              this.elements.predictBtn.textContent = 'Analyzing...';
//         }
//     }

//     /**
//      * Updates the main live multiplier display.
//      * @param {number} multiplier The current live multiplier.
//      */
//     updateLiveMultiplier(multiplier) {
//         const text = multiplier.toFixed(2) + 'x';
//         if (this.elements.currentMultiplier) {
//             this.elements.currentMultiplier.textContent = text;
//         }
//     }

//     /**
//      * Updates the connection/game status in the status bar.
//      * @param {string} status 'mock' or 'reconnecting' or 'error'
//      * @param {string} message The message to display.
//      */
//     updateStatus(status, message) {
//         const dot = this.elements.statusDot;
//         if (dot) {
//             // Note: Background color is set here because it's dynamic based on status
//             dot.style.backgroundColor = status === 'mock' ? 'var(--color-success)' : 
//                                        status === 'reconnecting' ? 'var(--color-secondary)' : 
//                                        'var(--cell-low)';
//         }
//         if (this.elements.statusMessage) {
//             this.elements.statusMessage.textContent = message;
//         }
//     }

//     /**
//      * Renders the prediction result to the UI, hiding the loading state.
//      * @param {object} result The prediction result object.
//      */
//     renderPrediction(result) {
//         if (this.elements.loadingOverlay) this.elements.loadingOverlay.style.display = 'none';
//         
//         // Check for error/insufficient data
//         if (result.error) {
//             this.showInitialState();
//             if (this.elements.analysisMessage) {
//                  this.elements.analysisMessage.textContent = result.message || 'Not enough historical data for analysis.';
//                  this.elements.initialStateContent.style.display = 'block';
//             }
//             if (this.elements.predictBtn) {
//                  this.elements.predictBtn.textContent = 'Predict Next Crash';
//             }
//             return;
//         }

//         // Show the prediction details container
//         if (this.elements.predictionOutputDetails) {
//             this.elements.predictionOutputDetails.style.display = 'block';
//         }
//         
//         // 1. Predicted Value
//         const predictedVal = result.predictedValue || 1.00; 
//         const predictedText = predictedVal.toFixed(2) + 'x';
//         if (this.elements.predictedValue) {
//             this.elements.predictedValue.textContent = predictedText;
//         }
//         // <-- NEW ROUND ID LOGIC -->
//         const roundIdText = result.gameId ? `Round: ${result.gameId}` : 'Round: N/A';
//         if (this.elements.predictedRoundId) {
//             this.elements.predictedRoundId.textContent = roundIdText;
//         }
//         
//         // 2. Confidence Level (CSS Variable and Percentage Text)
//         const confidenceVal = result.confidence || 0;
//         
//         // Calculate the final, clamped percentage string (e.g., "51.1%")
//         // Cap confidence at 100% and round to 1 decimal place.
//         const finalConfidencePercentString = Math.min(confidenceVal, 100).toFixed(1) + '%';
//         
//         // Set the CSS variable on the predictorCard element
//         if (this.predictorCard) {
//             this.predictorCard.style.setProperty('--confidence-level', finalConfidencePercentString);
//             console.log(`[UI] Setting CSS var --confidence-level to ${finalConfidencePercentString}`);
//         }

//         // Update the percentage text display
//         if (this.elements.confidencePercentage) {
//             this.elements.confidencePercentage.textContent = finalConfidencePercentString;
//         }

//         // 3. Detailed Stats
//         
//         // Avg. Target (Avg. Multiplier)
//         const avgMultVal = result.avgMultiplier;
//         if (this.elements.avgMultiplier) {
//             this.elements.avgMultiplier.textContent = (typeof avgMultVal === 'number' && avgMultVal > 0) 
//                 ? avgMultVal.toFixed(2) + 'x' 
//                 : '--';
//         }
//         
//         // Volatility
//         const volatilityVal = result.volatility;
//         if (this.elements.volatility) {
//             this.elements.volatility.textContent = (typeof volatilityVal === 'number' && volatilityVal >= 0) 
//                 ? volatilityVal.toFixed(2) + 'x' 
//                 : '--';
//         }

//         // Risk Zone and Message
//         if (this.elements.riskZone) this.elements.riskZone.textContent = (result.riskLevel || 'N/A').toUpperCase();
//         if (this.elements.analysisMessage) this.elements.analysisMessage.textContent = result.message || 'Analysis successful.';
//         
//         // 4. Reset Button Text
//         if (this.elements.predictBtn) {
//              this.elements.predictBtn.textContent = 'Predict Next Crash';
//         }
//     }

//     /**
//      * Helper to determine the correct CSS class based on multiplier value.
//      * @param {number} multiplier The crash value.
//      * @returns {string} The CSS class name (e.g., 'm-low', 'm-medium').
//      */
//     getMultiplierClass(multiplier) {
//         // The thresholds are: >= 5.0 (high), >= 2.0 (medium), >= 1.5 (moderate), < 1.5 (low)
//         if (multiplier >= 5.0) {
//             return 'm-high';
//         } else if (multiplier >= 2.0) {
//             return 'm-medium';
//         } else if (multiplier >= 1.5) {
//             return 'm-moderate';
//         } else {
//             return 'm-low';
//         }
//     }


//     /**
//      * Renders a new round result into the recent history grid.
//      * @param {object} round The completed round data.
//      */
//     renderNewRound(round) {
//         if (!this.elements.recentGrid) return;
//         
//         const cellId = `round-cell-${round.gameId}`;
//         let cell = document.getElementById(cellId);
//         
//         const multiplierClass = this.getMultiplierClass(round.finalMultiplier);

//         // If the cell exists, just update its verification status and color class
//         if (cell) {
//             cell.title = `Crash: ${round.finalMultiplier}x | Status: ${round.verificationStatus}`;
//             // Ensure the class is updated if necessary
//             cell.className = `multiplier-cell ${multiplierClass}`;
//             return;
//         }

//         // DEBUG: Log the count BEFORE adding the new element
//         console.log(`[Round ${round.gameId}] Count before adding: ${this.historyCount}. DOM children: ${this.elements.recentGrid.children.length}`);


//         // Create a new cell for the round
//         cell = document.createElement('div');
//         cell.id = cellId;
//         
//         // Add the determined color class
//         cell.classList.add('multiplier-cell', multiplierClass); 
//         
//         const formattedMultiplier = round.finalMultiplier.toFixed(2);
//         
//         cell.textContent = formattedMultiplier;
//         cell.title = `Crash: ${formattedMultiplier}x | Status: ${round.verificationStatus}`;
//         
//         // Prepend the new cell to the grid
//         this.elements.recentGrid.prepend(cell);
//         this.historyCount++;

//         // DEBUG: Log the count AFTER adding the new element
//         console.log(`[Round ${round.gameId}] Count after adding: ${this.historyCount}. DOM children: ${this.elements.recentGrid.children.length}`);


//         // Keep the grid clean (limit to 10 items for visual clarity)
//         while (this.historyCount > 10) {
//             // DEBUG: Log removal
//             console.log(`[Round ${round.gameId}] Removing item. Count before removal: ${this.historyCount}. DOM children: ${this.elements.recentGrid.children.length}`);
//             
//             this.elements.recentGrid.removeChild(this.elements.recentGrid.lastChild);
//             this.historyCount--;

//             // DEBUG: Log count after removal
//             console.log(`[Round ${round.gameId}] Removal complete. New count: ${this.historyCount}. DOM children: ${this.elements.recentGrid.children.length}`);
// }
//     }
// }


/**
 * js/UIController.js
 * Manages all DOM manipulations and state transitions for the UI.
 */

export class UIController {
    constructor(elements) {
        this.elements = elements;
        this.roundStatus = 'awaiting';
        // Cache the synchronized history count from the DOM
        this.historyCount = this.elements.recentGrid ? this.elements.recentGrid.children.length : 0;
        // Cache the predictor card element for setting the CSS variable
        this.predictorCard = document.getElementById('ai-predictor');
        
        console.log(`UIController: Initialized. History count synchronized to ${this.historyCount} elements.`);
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
     * Renders a new round result into the recent history grid.
     * @param {object} round The completed round data.
     */
    renderNewRound(round) {
        if (!this.elements.recentGrid) return;
        
        const cellId = `round-cell-${round.gameId}`;
        let cell = document.getElementById(cellId);
        
        const multiplierClass = this.getMultiplierClass(round.finalMultiplier);

        // If the cell exists, just update its verification status and color class
        if (cell) {
            cell.title = `Crash: ${round.finalMultiplier}x | Status: ${round.verificationStatus}`;
            // Ensure the class is updated if necessary
            cell.className = `multiplier-cell ${multiplierClass}`;
            return;
        }

        // DEBUG: Log the count BEFORE adding the new element
        console.log(`[Round ${round.gameId}] Count before adding: ${this.historyCount}. DOM children: ${this.elements.recentGrid.children.length}`);


        // Create a new cell for the round
        cell = document.createElement('div');
        cell.id = cellId;
        
        // Add the determined color class
        cell.classList.add('multiplier-cell', multiplierClass); 
        
        const formattedMultiplier = round.finalMultiplier.toFixed(2);
        
        cell.textContent = formattedMultiplier;
        cell.title = `Crash: ${formattedMultiplier}x | Status: ${round.verificationStatus}`;
        
        // Prepend the new cell to the grid
        this.elements.recentGrid.prepend(cell);
        this.historyCount++;

        // DEBUG: Log the count AFTER adding the new element
        console.log(`[Round ${round.gameId}] Count after adding: ${this.historyCount}. DOM children: ${this.elements.recentGrid.children.length}`);


        // Keep the grid clean (limit to 10 items for visual clarity)
        while (this.historyCount > 10) {
            // DEBUG: Log removal
            console.log(`[Round ${round.gameId}] Removing item. Count before removal: ${this.historyCount}. DOM children: ${this.elements.recentGrid.children.length}`);
            
            this.elements.recentGrid.removeChild(this.elements.recentGrid.lastChild);
            this.historyCount--;

            // DEBUG: Log count after removal
            console.log(`[Round ${round.gameId}] Removal complete. New count: ${this.historyCount}. DOM children: ${this.elements.recentGrid.children.length}`);
        }
    }
}