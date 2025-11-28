

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
        
        // --- FIX: ADDED MISSING ELEMENT MAPPING ---
        predictedRoundId: document.getElementById('predicted-round-id'), 
        
        riskZone: document.getElementById('risk-zone'),
        analysisMessage: document.getElementById('analysis-message'),
        avgMultiplier: document.getElementById('avg-multiplier'),
        volatility: document.getElementById('volatility'),
        
        // New elements for UX control
        loadingOverlay: document.getElementById('loading-overlay'), 
        predictionOutputDetails: document.getElementById('prediction-output-details'),
        initialStateContent: document.getElementById('initial-state-content'), 
        predictorCard: document.getElementById('confidence-bar'), 
        confidencePercentage: document.getElementById('confidence-percentage'), 
    };
}

/**
 * Core function to run the prediction logic and update the UI when the button is clicked.
 */
function handlePredictClick(dataStore, predictor, uiController, liveSync) {
    
    // DEBUG: Log the state
    console.log(`[CLICK CHECK] liveSync.isRoundRunning is currently: ${liveSync.isRoundRunning}`);
    
    // Check if there is enough data
    const historyMultipliers = dataStore.getMultipliers();
    if (historyMultipliers.length < 5) {
        uiController.showInitialState();
        uiController.updateStatus('error', 'Need at least 5 rounds of history to analyze.');
        if (uiController.elements.analysisMessage) {
            uiController.elements.analysisMessage.textContent = 'Insufficient history data.';
        }
        uiController.elements.predictBtn.textContent = 'Predict Next Crash'; 
        return 0; 
    }

    console.log('✅ Click Handler Fired: Starting analysis process...');
    
    // 1. Show Loading State
    uiController.showLoadingState(); 
    
    // 2. Set Status
    uiController.updateStatus('reconnecting', 'Analyzing History...');
    
    // Animation delay
    const ANALYSIS_DELAY_MS = 1500; 

    setTimeout(() => {
        // 3. Run the prediction logic
        const result = predictor.predictNext(historyMultipliers);
        
        // --- FIX: INJECT THE CURRENT ROUND ID INTO THE RESULT ---
        // The predictor doesn't know the ID, but LiveSync does.
        // If we are predicting for the *next* event, we use the current ID.
        result.gameId = liveSync.currentGameId; 

        // --- FIX: INJECT THE CURRENT ROUND ID INTO THE RESULT ---
        // If the round is running, we use that ID. If not, we indicate it's for the upcoming round.
        if (liveSync.isRoundRunning) {
            result.roundId = liveSync.currentGameId;
        } else {
            result.roundId = "Up Coming Round";
        }

        // 4. Update the prediction card
        uiController.renderPrediction(result);
        
        // 5. Reset status
        if (!result.error) {
            const confidence = result.confidence.toFixed(0);
            const risk = result.riskLevel.toUpperCase();
            uiController.updateStatus('mock', `Analysis Complete. Risk: ${risk} (${confidence}%)`);
        } else {
             uiController.updateStatus('mock', 'Analysis Failed: Not enough data.');
        }
        
        console.log('✅ Analysis complete and UI updated.');
    }, ANALYSIS_DELAY_MS); 
    
    return ANALYSIS_DELAY_MS; 
}

/**
 * Application Entry Point
 */
document.addEventListener('DOMContentLoaded', () => {
    const domElements = getDOMElements();
    const dataStore = new DataStore();
    const verifier = new Verifier(dataStore); 
    const predictor = new CrashPredictor(); 
    const uiController = new UIController(domElements); 

    uiController.showInitialState();

    const liveSync = new LiveSync(dataStore, verifier); 
    
    console.log('🚀 App Initialized. Starting LiveSync connection...');
    
    if (domElements.predictBtn) {
        console.log('👍 DOM Ready: Found predict-btn element. Attaching listener...');

        domElements.predictBtn.addEventListener('click', () => {
            domElements.predictBtn.disabled = true;
            const delay = handlePredictClick(dataStore, predictor, uiController, liveSync); 
            setTimeout(() => { domElements.predictBtn.disabled = false; }, delay);
        });
    } else {
        console.error('❌ CRITICAL ERROR: Could not find element with ID "predict-btn".');
    }

    liveSync.connect(); 
    
    document.addEventListener('liveUpdate', (e) => {
        uiController.updateLiveMultiplier(e.detail);
        if (liveSync.isRoundRunning) {
             uiController.updateStatus('mock', `Round ${liveSync.currentGameId} running...`);
        } else {
             uiController.updateStatus('mock', 'Awaiting next round');
        }
    });
    
    document.addEventListener('newRoundCompleted', (e) => {
        const round = e.detail;
        console.log('\n\n\n')
        console.log(`✨ APP: New round processed! Crash at ${round.finalMultiplier}x.`);
        // uiController.showInitialState(); 
        uiController.renderNewRound(round);
    });

    document.addEventListener('roundVerified', (e) => {
        const round = e.detail;
        uiController.renderNewRound(round);
    });
});