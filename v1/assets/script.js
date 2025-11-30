


// Import all the core modules from the assets/js folder
import { DataStore } from './js/DataStore.js';
import { LiveSync } from './js/LiveSyncing.js'; 
import { Verifier } from './js/Verifier.js'; 
import { CrashPredictor } from './js/predictor.js'; 
import { UIController } from './js/UIController.js'; 
import { EventEmitter } from './js/EventEmitter.js'; 
import { HistoryLog } from './js/HistoryLog.js'; 
import { listenForTabs } from './js/utils/tabs.js';


// Initiate the tab event listener
const tabs = document.querySelectorAll('.tab')
listenForTabs(tabs)


/**
 * Helper to gather all DOM elements the UIController needs.
 */
function getDOMElements() {
    // ... (This function remains unchanged)
    return {
        // Live Feed Elements (from index.html)
        currentMultiplier: document.getElementById('current-multiplier'),
        // ... (All other elements)
        // --- HISTORY LOG ELEMENTS ---
        historyLogBody: document.getElementById('history-log-body'),
        overallAccuracy: document.getElementById('overall-accuracy'),
        totalPredictions: document.getElementById('total-predictions'),
        clearHistoryBtn: document.getElementById('clear-history-btn'), 
        // --- EXISTING ELEMENTS ---
        // Total Predictions
        totalPredictionsValue: document.getElementById('total-predictions-value'), // Targets the number span
        dailyChangeSpan: document.getElementById('total-predictions-daily-change'), // Targets the change span
        
        // Avg. Accuracy
        overallAccuracy: document.getElementById('overall-accuracy'), // Existing log footer stat
        totalPredictionsFooter: document.getElementById('total-predictions-footer'),
        avgAccuracyValue: document.getElementById('avg-accuracy-value'), // Targets the number span (renamed for consistency)
        avgAccuracyWeeklyChange: document.getElementById('avg-accuracy-weekly-change'), 
        winRateValue: document.getElementById('win-rate-value'), 
        activeSessionsValue: document.getElementById('active-sessions-value'),

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
async function runPredictionAndRender(dataStore, predictor, uiController, liveSync, eventBus) { 
    
    // 1. Get the current history and predict the next value
    const historyMultipliers = dataStore.getMultipliers();
    const result = predictor.predictNext(historyMultipliers);
    
    // 2. Add the current game ID to the result object for display
    result.gameId = liveSync.currentGameId + 1;

    // --- Emit event BEFORE rendering so HistoryLog can save the result ---
    eventBus.emit('newPredictionMade', result);
    
    // 3. Render the final prediction result
    uiController.renderPrediction(result);
    
    // Log the result to the console for easy debugging
    if (result.error) {
        console.error(`❌ Prediction Failed: ${result.message}`);
        // If prediction fails *after* analysis, re-enable button immediately
        uiController.setPredictButtonState('error'); // <-- SAFETY LINE
    } else {
        console.log(`✅ Prediction Complete: ${result.predictedValue.toFixed(2)}x, Confidence: ${result.confidence}%`);
        // Note: The button remains disabled here until the round finishes (in UIController.renderNewRound)
    }
}


/**
 * Core function to run the prediction logic and update the UI when the button is clicked.
 */
function handlePredictClick(dataStore, predictor, uiController, liveSync, eventBus) { 
    
    // Check if there is enough data (Minimum 20 rounds are required for the predictor to run)
    const historyMultipliers = dataStore.getMultipliers();
    
    // ⬅️ FIX: Disable the button immediately on click to prevent spamming
    uiController.setPredictButtonState('loading'); // <-- NEW LINE! This prevents duplicate predictions

    if (historyMultipliers.length < 20) {
        // The predictor itself handles the 'length < 20' error, but we need a brief loading delay
        // to show the user we attempted the analysis.
        const result = {
            error: true, 
            message: `Not enough history (${historyMultipliers.length}). Need 20+ rounds.`,
            confidence: 0,
        };
        // Render error state immediately, which will re-enable the button via UIController.renderPrediction -> setPredictButtonState('error')
        uiController.renderPrediction(result);
        return 0; // Return 0 delay
    }

    // 1. Show the loading state (this is now redundant but kept for good measure, though setPredictButtonState already handles the button disable)
    uiController.showLoadingState();

    // 2. Set the analysis delay (1500ms)
    const ANALYSIS_DELAY_MS = 1500; 

    // 3. Run the prediction after the delay
    setTimeout(() => {
        runPredictionAndRender(dataStore, predictor, uiController, liveSync, eventBus); 
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
    
    // ⬅️ CHANGE 3: INSTANTIATE THE NEW HISTORYLOG MODULE
    const historyLog = new HistoryLog(domElements, eventBus); 

    uiController.showInitialState();

    // --- PASS THE EVENT BUS TO DEPENDENT MODULES ---
    const liveSync = new LiveSync(dataStore, verifier, eventBus); // LiveSync needs the bus
    
    console.log('🚀 App Initialized. Starting LiveSync connection...');
    
    if (domElements.predictBtn) {
        console.log('👍 DOM Ready: Found predict-btn element. Attaching listener...');

        domElements.predictBtn.addEventListener('click', () => {
            // ⬅️ CHANGE 2: ADD eventBus argument to handler
            handlePredictClick(dataStore, predictor, uiController, liveSync, eventBus); 
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


// will be removed later into a separte file module

// Get the elements
const menuToggle = document.getElementById('menu-toggle');
const sidebar = document.querySelector('.sidebar');
const backdrop = document.getElementById('sidebar-backdrop'); // <-- NEW

// Function to toggle the menu state
function toggleMenu() {
    sidebar.classList.toggle('is-open');
    backdrop.classList.toggle('is-active'); // Toggle the backdrop visibility
}

// Event Listeners
menuToggle.addEventListener('click', toggleMenu);

// Close menu when the backdrop is clicked
backdrop.addEventListener('click', toggleMenu); 

// Optional: Close menu when a navigation item is clicked
const navTabs = document.querySelectorAll('.tab');
navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
            toggleMenu();
        }
    });
});