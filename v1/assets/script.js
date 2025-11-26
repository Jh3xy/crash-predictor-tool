
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
        
        // New elements for UX control
        loadingOverlay: document.getElementById('loading-overlay'), // The spinning overlay
        predictionOutputDetails: document.getElementById('prediction-output-details'), // The container for the output data
    };
}

/**
 * Core function to run the prediction logic and update the UI when the button is clicked.
 * NOTE: This is the ONLY function that should trigger a new prediction.
 */
function handlePredictClick(dataStore, predictor, uiController) {
    console.log('✅ Click Handler Fired: Starting analysis process...');
    
    // 1. Show Loading State immediately
    uiController.showLoadingState(); 
    
    // 2. Set Status (optional, but nice)
    uiController.updateStatus('reconnecting', 'Analyzing History...');
    
    // 3. Retrieve only the multipliers (numbers) from the DataStore
    const historyMultipliers = dataStore.getMultipliers();
    
    // Simulate a brief delay for a complex analysis feel
    setTimeout(() => {
        // 4. Run the prediction logic using the history array
        const result = predictor.predictNext(historyMultipliers);
        
        // 5. Update the prediction card in the UI (this handles hiding the loading screen)
        uiController.renderPrediction(result);
        
        // 6. Reset status after analysis
        const confidence = result.confidence.toFixed(0);
        const risk = result.riskLevel.toUpperCase();
        uiController.updateStatus(`'mock', Analysis Complete. Risk: ${risk} (${confidence}%)`);
        
        console.log('✅ Analysis complete and UI updated.');
    }, 1000); // Increased delay slightly to make the "Analyzing..." state more noticeable
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

    // FIX: Set the initial state of the prediction card (hides the output)
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
            handlePredictClick(dataStore, predictor, uiController);
            // Re-enable button after the simulated analysis delay (must match setTimeout in handlePredictClick)
            setTimeout(() => { domElements.predictBtn.disabled = false; }, 1000);
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
        if (!liveSync.isEmulating && liveSync.ws?.readyState === WebSocket.OPEN) {
             uiController.updateStatus('connected', 'Connected');
        } else if (liveSync.isEmulating) {
             uiController.updateStatus('mock', 'Mock Mode (No Real Connection)');
        } else {
             uiController.updateStatus('reconnecting', 'Reconnecting...');
        }
    });
    
    // B. Listen for Round Completion (New Data Stored)
    document.addEventListener('newRoundCompleted', (e) => {
        const round = e.detail;
        console.log(`✨ APP: New round processed! Crash at ${round.finalMultiplier}x. (NO AUTOMATED PREDICTION)`);
        
        // *** CRITICAL FIX: Removed the prediction logic here. Prediction is now ONLY triggered by the button. ***
        
        // 1. Update UI (renders the new item in the history grid)
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

