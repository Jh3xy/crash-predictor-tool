// Import all the core modules from the assets/js folder
import { DataStore } from './js/DataStore.js';
import { LiveSync } from './js/LiveSyncing.js'; 
import { Verifier } from './js/Verifier.js'; 
import { CrashPredictor } from './js/predictor.js'; 
import { UIController } from './js/UIController.js'; 

/**
 * Helper to gather all DOM elements the UIController needs.
 */
function getDOMElements() {
    return {
        // Live Feed Elements (from index.html)
        currentMultiplier: document.getElementById('current-multiplier'),
        recentGrid: document.getElementById('recent-grid'),
        
        // Status Bar Elements (from index.html)
        statusDot: document.getElementById('status-dot'),
        statusMessage: document.getElementById('status-message'),
        
        // Prediction Report Elements (from index.html)
        predictBtn: document.getElementById('predict-btn'),
        predictedValue: document.getElementById('predicted-value'),
        riskZone: document.getElementById('risk-zone'),
        analysisMessage: document.getElementById('analysis-message'),
        avgMultiplier: document.getElementById('avg-multiplier'),
        volatility: document.getElementById('volatility'),
        
        // New elements for UX control, mapping to the Figma design structure
        loadingOverlay: document.getElementById('loading-overlay'), 
        predictionOutputDetails: document.getElementById('prediction-output-details'),
        initialStateContent: document.getElementById('initial-state-content'), // NEW ID
        confidenceBar: document.getElementById('confidence-bar'), // NEW ID
        confidencePercentage: document.getElementById('confidence-percentage'), // NEW ID
    };
}

/**
 * Core function to run the prediction logic and update the UI when the button is clicked.
 * NOTE: This is the ONLY function that should trigger a new prediction.
 */
function handlePredictClick(dataStore, predictor, uiController, liveSync) {
    
    // DEBUG: Log the state read from LiveSync immediately upon click
    console.log(`[CLICK CHECK] liveSync.isRoundRunning is currently: ${liveSync.isRoundRunning}`);
    
    // Check if there is enough data before proceeding with the heavy computation
    const historyMultipliers = dataStore.getMultipliers();
    if (historyMultipliers.length < 5) {
        uiController.showInitialState();
        uiController.updateStatus('error', 'Need at least 5 rounds of history to analyze.');
        if (uiController.elements.analysisMessage) {
            uiController.elements.analysisMessage.textContent = 'Insufficient history data.';
        }
        // Ensure button text is correct if we block here
        uiController.elements.predictBtn.textContent = 'Predict Next Crash'; 
        return 0; 
    }

    // Since we agreed to allow prediction during the pause OR running phase, we proceed.
    
    console.log('✅ Click Handler Fired: Starting analysis process...');
    
    // 1. Show Loading State immediately
    uiController.showLoadingState(); 
    
    // 2. Set Status (optional, but nice)
    uiController.updateStatus('reconnecting', 'Analyzing History...');
    
    // --- FIX: Reduced delay from 1500ms to 250ms for faster perceived performance ---
    const ANALYSIS_DELAY_MS = 250; 

    setTimeout(() => {
        // 3. Run the prediction logic using the history array
        const result = predictor.predictNext(historyMultipliers);
        
        // 4. Update the prediction card in the UI (this handles hiding the loading screen)
        uiController.renderPrediction(result);
        
        // 5. Reset status after analysis
        if (!result.error) {
            const confidence = result.confidence.toFixed(0);
            const risk = result.riskLevel.toUpperCase();
            uiController.updateStatus('mock', `Analysis Complete. Risk: ${risk} (${confidence}%)`);
        } else {
            // This is only triggered if there was a logic error in the predictor or not enough data (which is checked above)
            uiController.updateStatus('mock', 'Analysis Failed: Not enough data.');
        }
        
        console.log('✅ Analysis complete and UI updated.');
    }, ANALYSIS_DELAY_MS); 
    
    return ANALYSIS_DELAY_MS; // Return delay so the button can be re-enabled
}

/**
 * Application Entry Point (runs when the DOM is fully loaded)
 */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Get DOM elements and initialize the UI Controller
    const domElements = getDOMElements();

    // 2. Instantiate all core logic modules (the brain)
    const dataStore = new DataStore();
    const verifier = new Verifier(dataStore); 
    const predictor = new CrashPredictor(); 
    const uiController = new UIController(domElements); 

    // CRITICAL: Call showInitialState immediately to hide the prediction card and set defaults.
    uiController.showInitialState();

    // 3. Instantiate LiveSync, passing it the DataStore and Verifier (the input layer)
    const liveSync = new LiveSync(dataStore, verifier); 
    
    console.log('🚀 App Initialized. Starting LiveSync connection...');
    
    // Add Event Listener for the "Predict Now" Button
    if (domElements.predictBtn) {
        console.log('👍 DOM Ready: Found predict-btn element. Attaching listener...');

        domElements.predictBtn.addEventListener('click', () => {
            // Disable button briefly to prevent spamming while analysis runs
            domElements.predictBtn.disabled = true;
            
            // Pass liveSync instance to check round status before predicting
            const delay = handlePredictClick(dataStore, predictor, uiController, liveSync); 
            
            // Re-enable button after the calculated delay.
            setTimeout(() => { domElements.predictBtn.disabled = false; }, delay);
        });
        console.log('Event Listener: Predict button connected.');
    } else {
        console.error('❌ CRITICAL ERROR: Could not find element with ID "predict-btn". Check index.html!');
    }

    // Connect to the real-time feed (will fall back to emulation if URL fails)
    liveSync.connect(); 
    
    // --- Global Event Listeners: Wiring the modules to the UI ---
    
    // A. Listen for Live Multiplier Updates
    document.addEventListener('liveUpdate', (e) => {
        // Update the main multiplier display
        uiController.updateLiveMultiplier(e.detail);
        
        // Update the connection status display
        if (liveSync.isRoundRunning) {
            uiController.updateStatus('mock', `Round ${liveSync.currentGameId} running...`);
        } else {
            uiController.updateStatus('mock', 'Awaiting next round');
        }
    });
    
    // B. Listen for Round Completion (New Data Stored)
    document.addEventListener('newRoundCompleted', (e) => {
        const round = e.detail;
        console.log(`✨ APP: New round processed! Crash at ${round.finalMultiplier}x.`);
        
        // 1. Update UI (renders the new item in the recent grid)
        uiController.renderNewRound(round);
    });

    // C. Listen for Round Verification Completion
    document.addEventListener('roundVerified', (e) => {
        const round = e.detail;
        console.log(`🎯 APP: Verified round ${round.gameId}. Status: ${round.verificationStatus}`);
        
        // Re-render the first item in the history grid to show the lock/check icon
        uiController.renderNewRound(round);
    });
});