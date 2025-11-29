



// Import all the core modules from the assets/js folder
import { DataStore } from './js/DataStore.js';
import { LiveSync } from './js/LiveSyncing.js'; 
import { Verifier } from './js/Verifier.js'; 
import { CrashPredictor } from './js/predictor.js'; 
import { UIController } from './js/UIController.js'; 
// --- NEW IMPORT ---
import { EventEmitter } from './js/EventEmitter.js'; 

/**
 * Helper to gather all DOM elements the UIController needs.
 */
function getDOMElements() {
    // ... (This function remains unchanged)
    return {
        // Live Feed Elements (from index.html)
        currentMultiplier: document.getElementById('current-multiplier'),
        // ... (All other elements)
        recentGrid: document.getElementById('recent-grid'),
        statusDot: document.getElementById('status-dot'),
        statusMessage: document.getElementById('status-message'),
        predictBtn: document.getElementById('predict-btn'),
        predictedValue: document.getElementById('predicted-value'),
        predictedRoundId: document.getElementById('predicted-round-id'), 
        riskZone: document.getElementById('risk-zone'),
        analysisMessage: document.getElementById('analysis-message'),
        avgMultiplier: document.getElementById('avg-multiplier'),
        volatility: document.getElementById('volatility'),
        loadingOverlay: document.getElementById('loading-overlay'), 
        predictionOutputDetails: document.getElementById('prediction-output-details'),
        initialStateContent: document.getElementById('initial-state-content'), 
        predictorCard: document.getElementById('confidence-bar'), 
        confidencePercentage: document.getElementById('confidence-percentage'), 
    };
}

/**
 * Helper to run the asynchronous prediction process and update the UI.
 */
async function runPredictionAndRender(dataStore, predictor, uiController, liveSync) {
    
    // 1. Get the current history and predict the next value
    const historyMultipliers = dataStore.getMultipliers();
    const result = predictor.predictNext(historyMultipliers);
    
    // 2. Add the current game ID to the result object for display
    result.gameId = liveSync.currentGameId + 1;

    // 3. Render the final prediction result
    uiController.renderPrediction(result);
    
    // Log the result to the console for easy debugging
    if (result.error) {
         console.error(`❌ Prediction Failed: ${result.message}`);
    } else {
         console.log(`✅ Prediction Complete: ${result.predictedValue.toFixed(2)}x, Confidence: ${result.confidence}%`);
    }
}


/**
 * Core function to run the prediction logic and update the UI when the button is clicked.
 */
function handlePredictClick(dataStore, predictor, uiController, liveSync) {
    
    // Check if there is enough data (Minimum 20 rounds are required for the predictor to run)
    const historyMultipliers = dataStore.getMultipliers();
    
    if (historyMultipliers.length < 20) {
        // The predictor itself handles the 'length < 20' error, but we need a brief loading delay
        // to show the user we attempted the analysis.
        const result = {
            error: true, 
            message: `Not enough history (${historyMultipliers.length}). Need 20+ rounds.`,
            confidence: 0,
        };
        // Render error state immediately.
        uiController.renderPrediction(result);
        return 0; // Return 0 delay
    }

    // 1. Show the loading state (this also disables the button)
    uiController.showLoadingState();

    // 2. Set the analysis delay (1500ms)
    const ANALYSIS_DELAY_MS = 1500; 

    // 3. Run the prediction after the delay
    setTimeout(() => {
        runPredictionAndRender(dataStore, predictor, uiController, liveSync);
    }, ANALYSIS_DELAY_MS);
    
    return ANALYSIS_DELAY_MS;
}
/**
 * Application Entry Point
 */
document.addEventListener('DOMContentLoaded', () => {
    
    // --- NEW: Instantiate the central Event Bus ---
    const eventBus = new EventEmitter();
    
    const domElements = getDOMElements();
    const dataStore = new DataStore();
    // --- PASS THE EVENT BUS TO DEPENDENT MODULES ---
    const verifier = new Verifier(dataStore, eventBus); // Verifier needs the bus
    const predictor = new CrashPredictor(); 
    const uiController = new UIController(domElements); 

    uiController.showInitialState();

    // --- PASS THE EVENT BUS TO DEPENDENT MODULES ---
    const liveSync = new LiveSync(dataStore, verifier, eventBus); // LiveSync needs the bus
    
    console.log('🚀 App Initialized. Starting LiveSync connection...');
    
    if (domElements.predictBtn) {
        console.log('👍 DOM Ready: Found predict-btn element. Attaching listener...');

        domElements.predictBtn.addEventListener('click', () => {
            handlePredictClick(dataStore, predictor, uiController, liveSync); 
        });
    } else {
        console.error('❌ CRITICAL ERROR: Could not find element with ID "predict-btn".');
    }

    liveSync.connect(); 
    
    // --- REPLACED document.addEventListener with eventBus.on ---
    eventBus.on('liveUpdate', (e) => {
        uiController.updateLiveMultiplier(e); // 'e' is the multiplier value directly
        if (liveSync.isRoundRunning) {
             uiController.updateStatus('mock', `Round ${liveSync.currentGameId} running...`);
        } else {
             uiController.updateStatus('mock', 'Awaiting next round');
        }
    });
    
    // --- REPLACED document.addEventListener with eventBus.on ---
    eventBus.on('newRoundCompleted', (round) => {
        console.log('\n\n\n')
        console.log(`✨ APP: New round processed! Crash at ${round.finalMultiplier}x.`);
        uiController.renderNewRound(round);
    });

    // --- REPLACED document.addEventListener with eventBus.on ---
    eventBus.on('roundVerified', (round) => {
        uiController.renderNewRound(round);
    });
});