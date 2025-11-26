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
        
        // Assuming other IDs are present for the full UIController
    };
}

/**
 * Core function to run the prediction logic and update the UI when the button is clicked.
 * NOTE: This is separate from the automated prediction triggered by 'newRoundCompleted'.
 */
function handlePredictClick(dataStore, predictor, uiController) {
    // *** NEW DEBUG LOG: Check if the click handler is executing ***
    console.log('✅ Click Handler Fired: Starting analysis process...');
    
    // 1. Retrieve only the multipliers (numbers) from the DataStore
    // We use the new DataStore.getMultipliers() method (which retrieves up to 200).
    const historyMultipliers = dataStore.getMultipliers();
    
    // 2. Set a quick status while analysis runs
    uiController.updateStatus('reconnecting', 'Analyzing History...');
    
    // Simulate a brief delay for a complex analysis feel
    setTimeout(() => {
        // 3. Run the prediction logic using the history array
        const result = predictor.predictNext(historyMultipliers);
        
        // *** CRITICAL NEW DEBUG STEP ***
        // Print the actual prediction result object to the console.
        console.log('🔮 Prediction Result Object:', result);

        // 4. Update the prediction card in the UI
        uiController.renderPrediction(result);
        
        // 5. Reset status after analysis
        const confidence = result.confidence.toFixed(0);
        const risk = result.riskLevel.toUpperCase();
        uiController.updateStatus('mock', `Analysis Complete. Risk: ${risk} (${confidence}%)`);
        
        console.log('✅ Analysis complete and UI updated.');
    }, 500); // 500ms delay
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
    // FIX: The new CrashPredictor does not accept dataStore in the constructor.
    const predictor = new CrashPredictor(); 
    const uiController = new UIController(domElements); 

    // 3. Instantiate LiveSync, passing it the DataStore and Verifier (the input layer)
    const liveSync = new LiveSync(dataStore, verifier); 
    
    console.log('🚀 App Initialized. Starting LiveSync connection...');
    
    // Add Event Listener for the "Predict Now" Button
    if (domElements.predictBtn) {
        // *** NEW DEBUG LOG: Check if the button element was found ***
        console.log('👍 DOM Ready: Found predict-btn element. Attaching listener...');

        // We wrap the logic so we can pass our instantiated modules (dataStore, predictor, uiController)
        domElements.predictBtn.addEventListener('click', () => {
            handlePredictClick(dataStore, predictor, uiController);
        });
        console.log('Event Listener: Predict button connected.');
    } else {
        // *** CRITICAL DEBUG LOG: Log failure to find the element ***
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
        console.log(`✨ APP: New round processed! Crash at ${round.finalMultiplier}x.`);
        
        // 1. Run the Automated Prediction immediately after a new round
        const predictionResult = predictor.predictNext(dataStore.getMultipliers());
        
        // 2. Update UI (renders the new item in the history grid)
        uiController.renderNewRound(round);
        
        // 3. Notify the UI that the prediction is ready
        document.dispatchEvent(new CustomEvent('predictionReady', { detail: predictionResult }));
    });

    // C. Listen for Prediction Completion
    document.addEventListener('predictionReady', (e) => {
        const result = e.detail;
        // Update the Oracle report card
        uiController.renderPrediction(result);
    });

    // D. Listen for Round Verification Completion
    document.addEventListener('roundVerified', (e) => {
        const round = e.detail;
        console.log(`🎯 APP: Verified round ${round.gameId}. Status: ${round.verificationStatus}`);
        
        // Re-render the first item in the history grid to show the lock/check icon
        uiController.renderNewRound(round);
    });
});



