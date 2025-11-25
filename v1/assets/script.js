

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
        riskZone: document.getElementById('risk-zone'),
        analysisMessage: document.getElementById('analysis-message'),
        avgMultiplier: document.getElementById('avg-multiplier'),
        volatility: document.getElementById('volatility'),
    };
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
    const predictor = new CrashPredictor(dataStore); 
    const uiController = new UIController(domElements); 

    // 3. Instantiate LiveSync, passing it the DataStore and Verifier (the input layer)
    const liveSync = new LiveSync(dataStore, verifier); 
    
    console.log('🚀 App Initialized. Starting LiveSync connection...');
    
    // ________NEED HELP HERE FR!!!!!!!!
    // uiController.updateStatus('initializing', 'Attempting connection...');

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
        
        // 1. Run the Predictor Analysis immediately
        const predictionResult = predictor.runAnalysis(); 
        
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