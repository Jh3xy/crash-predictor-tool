

// script.js

// Import core modules
import { DataStore } from './js/DataStore.js';
import { LiveSync } from './js/LiveSyncing.js'; 
import { Verifier } from './js/Verifier.js'; 
import { CrashPredictor } from './js/predictor.js'; 
import { UIController } from './js/UIController.js'; 
import { EventEmitter } from './js/EventEmitter.js'; 
import { HistoryLog } from './js/HistoryLog.js'; 
import { listenForTabs } from './js/utils/tabs.js';
// Ensure file name matches exactly
import { populateAndShowModal, closeModal, createConfirmationModal } from './js/utils/modalManager.js'; 

// Initiate tab listeners
const tabs = document.querySelectorAll('.tab');
listenForTabs(tabs);

// Select Elements for Pop UP Initialization
const userGuide = document.getElementById('user-guide')
const settingBtn = document.querySelector('[data-modal-id="settings"]');
const statsInfoIcons = document.querySelectorAll(
  '[data-modal-id="card-info-total-predictions"],' +
  '[data-modal-id="card-info-avg-accuracy"],' +
  '[data-modal-id="card-info-win-rate"],' + 
  '[data-modal-id="card-info-active-sessions"]' 
);


// 1. Initialize Settings Pop UP
if (settingBtn) {
    settingBtn.addEventListener('click', () => {
        const modalKey = settingBtn.getAttribute('data-modal-id');
        populateAndShowModal(modalKey);
    });
} else {
    console.log("Element Not Found")
}

// 2. Initialize Stats-info Pop UP (Node List)
statsInfoIcons.forEach(statsInfoIcon => {
  statsInfoIcon.addEventListener('click', () => {
    const modalKey = statsInfoIcon.getAttribute('data-modal-id');
    populateAndShowModal(modalKey);
    
    console.log(`Clicked icon with key: ${modalKey}`);
  });
});

// 3. Initialize User  Guide Pop UP
if (userGuide) {
    userGuide.addEventListener('click', () => {
        const modalKey = userGuide.getAttribute('data-modal-id');
        populateAndShowModal(modalKey);
    });
} else {
    console.log("Element Not Found")
}



// --- Sidebar Logic ---
function setupSidebar() {
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    const body = document.body;
    const navTabs = sidebar ? sidebar.querySelectorAll('.tab') : [];

    function toggleSidebar() {
        if (!sidebar || !backdrop) return;
        sidebar.classList.toggle('is-open');
        backdrop.classList.toggle('is-active');
        
        const isMenuOpen = sidebar.classList.contains('is-open');
        if (isMenuOpen) {
            body.classList.add('no-scroll');
            menuToggle.disabled = true;
            setTimeout(() => {
                if (sidebar.classList.contains('is-open')) menuToggle.disabled = false;
            }, 400); 
        } else {
            body.classList.remove('no-scroll');
            menuToggle.disabled = false;
        }
    }

    if (menuToggle && sidebar && backdrop) {
        menuToggle.addEventListener('click', toggleSidebar);
        backdrop.addEventListener('click', toggleSidebar); 
        navTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                if (sidebar.classList.contains('is-open')) toggleSidebar();
            });
        });
    }
}

/**
 * Helper to gather DOM elements
 */
function getDOMElements() {
    return {
        currentMultiplier: document.getElementById('current-multiplier'),
        historyLogBody: document.getElementById('history-log-body'),
        overallAccuracy: document.getElementById('overall-accuracy'),
        // Dashboard Stats
        totalPredictionsValue: document.getElementById('total-predictions-value'), 
        dailyChangeSpan: document.getElementById('total-predictions-daily-change'), 
        totalPredictionsFooter: document.getElementById('total-predictions-footer'),
        avgAccuracyValue: document.getElementById('avg-accuracy-value'), 
        avgAccuracyWeeklyChange: document.getElementById('avg-accuracy-weekly-change'), 
        winRateValue: document.getElementById('win-rate-value'), 
        activeSessionsValue: document.getElementById('active-sessions-value'),

        clearHistoryBtn: document.getElementById('clear-history-btn'), 
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
 * Run prediction and update UI
 */
async function runPredictionAndRender(dataStore, predictor, uiController, liveSync, eventBus) { 
    const historyMultipliers = dataStore.getMultipliers();
    const result = predictor.predictNext(historyMultipliers);
    
    result.gameId = liveSync.currentGameId + 1;
    eventBus.emit('newPredictionMade', result);
    uiController.renderPrediction(result);
    
    if (result.error) {
        console.error(`❌ Prediction Failed: ${result.message}`);
        uiController.setPredictButtonState('error'); 
    } else {
        console.log(`✅ Prediction Complete: ${result.predictedValue.toFixed(2)}x, Confidence: ${result.confidence}%`);
    }
}

/**
 * Handle Predict Button Click
 */
function handlePredictClick(dataStore, predictor, uiController, liveSync, eventBus) { 
    const historyMultipliers = dataStore.getMultipliers();
    uiController.setPredictButtonState('loading'); 

    if (historyMultipliers.length < 20) {
        const result = {
            error: true, 
            message: `Not enough history (${historyMultipliers.length}). Need 20+ rounds.`,
            confidence: 0,
        };
        uiController.renderPrediction(result);
        return 0; 
    }

    uiController.showLoadingState();
    const ANALYSIS_DELAY_MS = 1500; 

    setTimeout(() => {
        runPredictionAndRender(dataStore, predictor, uiController, liveSync, eventBus); 
    }, ANALYSIS_DELAY_MS);
    
    return ANALYSIS_DELAY_MS;
}

// =========================================================
// APP ENTRY POINT
// =========================================================
document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Initialize Sidebar
    setupSidebar();

    // 3. Initialize Core Systems
    const eventBus = new EventEmitter();
    const domElements = getDOMElements();
    const dataStore = new DataStore();
    
    const verifier = new Verifier(dataStore, eventBus); 
    const predictor = new CrashPredictor(); 
    const uiController = new UIController(domElements); 
    
    // Pass eventBus to HistoryLog
    const historyLog = new HistoryLog(domElements, eventBus); 

    uiController.showInitialState();
    const liveSync = new LiveSync(dataStore, verifier, eventBus); 
    
    console.log('🚀 App Initialized. Starting LiveSync connection...');
    
    if (domElements.predictBtn) {
        console.log('👍 DOM Ready: Found predict-btn element. Attaching listener...');
        domElements.predictBtn.addEventListener('click', () => {
            handlePredictClick(dataStore, predictor, uiController, liveSync, eventBus); 
        });
    } else {
        console.error('❌ CRITICAL ERROR: Could not find element with ID "predict-btn".');
    }

    liveSync.connect(); 
    
    // 4. Attach Event Bus Listeners
    eventBus.on('liveUpdate', (e) => {
        uiController.updateLiveMultiplier(e); 
        if (liveSync.isRoundRunning) {
             uiController.updateStatus('mock', `Round ${liveSync.currentGameId} running...`);
        } else {
             uiController.updateStatus('mock', 'Awaiting next round');
        }
    });
    
    eventBus.on('newRoundCompleted', (round) => {
        console.log('\n\n\n');
        console.log(`✨ APP: New round processed! Crash at ${round.finalMultiplier}x.`);
        uiController.renderNewRound(round);
    });

    eventBus.on('roundVerified', (round) => {
        uiController.renderNewRound(round);
    });
});

