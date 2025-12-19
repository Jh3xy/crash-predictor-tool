


// script.js - FIXED VERSION

import { DataStore } from './js/DataStore.js';
import { LiveSync } from './js/LiveSyncing.js'; 
import { Verifier } from './js/Verifier.js'; 
import { CrashPredictor } from './js/predictor.js'; 
import { UIController } from './js/UIController.js'; 
import { EventEmitter } from './js/EventEmitter.js'; 
import { HistoryLog } from './js/HistoryLog.js'; 
import { listenForTabs } from './js/utils/tabs.js';
import { populateAndShowModal } from './js/utils/modalManager.js'; 

const tabs = document.querySelectorAll('.tab');
listenForTabs(tabs);

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

function getDOMElements() {
    return {
        currentMultiplier: document.getElementById('current-multiplier'),
        historyLogBody: document.getElementById('history-log-body'),
        overallAccuracy: document.getElementById('overall-accuracy'),
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

// =========================================================
// APP ENTRY POINT
// =========================================================
document.addEventListener('DOMContentLoaded', () => {
    
    setupSidebar();

    const eventBus = new EventEmitter();
    const domElements = getDOMElements();
    const dataStore = new DataStore();
    
    const verifier = new Verifier(dataStore, eventBus); 
    const predictor = new CrashPredictor(); 
    const uiController = new UIController(domElements); 

    // 🔥 EXPOSE predictor to window for debugging
    window.predictor = predictor;
    window.dataStore = dataStore;
    window.eventBus = eventBus;
    console.log('🔧 Debug: predictor, dataStore, and eventBus exposed to window');

    // 🔥 Bayesian feedback loop
    eventBus.on('updateBayesianState', (data) => {
        console.log('📊 Bayesian Update Event Received:', data);
        predictor.updateAfterRound(data.actual, data.predicted);
    });
    
    const historyLog = new HistoryLog(domElements, eventBus); 

    uiController.showInitialState();

    const liveSync = new LiveSync(dataStore, verifier, eventBus, uiController, predictor); 
    
    // 🔥 EXPOSE liveSync for debugging
    window.liveSync = liveSync;
    
    console.log('🚀 App Initialized. LiveSync connecting...');
    window.logSystemReady();

    // 🔥 FIX: Proper button handler with loading states
    if (domElements.predictBtn) {
        domElements.predictBtn.addEventListener('click', async () => {
            console.log('\n\n\n👆 Manual Prediction Button Clicked');
            console.log('📊 Current Game ID:', liveSync.currentGameId);
            console.log('📊 DataStore rounds:', dataStore.rounds.length);
            
            // Show loading state
            uiController.showLoadingState();
            uiController.setPredictButtonState('loading');
            
            try {
                await liveSync.triggerManualPrediction();
                console.log('✅ Prediction completed successfully');
            } catch (err) {
                console.error('❌ Manual Prediction Error:', err);
                uiController.setPredictButtonState('error');
            } finally {
                // Button state is set by renderPrediction
            }
        });
    }

    // Event listeners
    eventBus.on('multiplierUpdate', (multiplier) => {
        if (domElements.currentMultiplier) {
            domElements.currentMultiplier.textContent = multiplier.toFixed(2) + 'x';
        }
    });
    
    eventBus.on('newRoundCompleted', (round) => {
        uiController.renderNewRound(round);
        if (liveSync) {
             liveSync.updateModalHistory(); 
             liveSync.updateModalDiagnostics();
        }
    });

    eventBus.on('roundVerified', (round) => {
        uiController.renderNewRound(round);
    });

    // Model stats update function
    function updateModelStats(predictor) {
        const stats = predictor.getStatistics();
        
        const totalEl = document.getElementById('model-total-predictions');
        const successEl = document.getElementById('model-success-rate');
        const bayesianEl = document.getElementById('model-bayesian-rate');
        
        if (totalEl) totalEl.textContent = stats.totalPredictions;
        if (successEl) successEl.textContent = stats.winRatePercent;
        if (bayesianEl) bayesianEl.textContent = stats.winRatePercent;
        
        console.log('📊 Model Stats Updated:', stats);
    }

    // Update stats after Bayesian updates
    eventBus.on('updateBayesianState', () => {
        updateModelStats(predictor);
    });

    // =========================================================================================
    // MODAL EVENT LISTENERS
    // =========================================================================================

    const userGuide = document.getElementById('user-guide')
    const settingBtn = document.querySelector('[data-modal-id="settings"]');
    const liveSyncBtn = document.querySelector('[data-modal-id="live-sync-detail"]');
    const verifStatus = document.querySelector('[data-modal-id="verifier-status"]');
    const predictDetials = document.querySelector('[data-modal-id="prediction-details"]');
    const statsInfoIcons = document.querySelectorAll(
        '[data-modal-id="card-info-total-predictions"],' +
        '[data-modal-id="card-info-avg-accuracy"],' +
        '[data-modal-id="card-info-win-rate"],' + 
        '[data-modal-id="card-info-active-sessions"]' 
    );

    if (settingBtn) {
        settingBtn.addEventListener('click', () => {
            populateAndShowModal(settingBtn.getAttribute('data-modal-id'));
        });
    }

    if (predictDetials) {
        predictDetials.addEventListener('click', () => {
            populateAndShowModal(predictDetials.getAttribute('data-modal-id'));
        });
    }

    if (liveSyncBtn) {
        liveSyncBtn.addEventListener('click', () => {
            populateAndShowModal(liveSyncBtn.getAttribute('data-modal-id'));
            setTimeout(() => {
                liveSync.updateModalLiveValue(); 
                liveSync.updateModalHistory(); 
                liveSync.updateModalDiagnostics();
            }, 50); 
        });
    }

    if (verifStatus) {
        verifStatus.addEventListener('click', () => {
            populateAndShowModal(verifStatus.getAttribute('data-modal-id'));
        });
    }

    statsInfoIcons.forEach(icon => {
        icon.addEventListener('click', () => {
            populateAndShowModal(icon.getAttribute('data-modal-id'));
        });
    });

    if (userGuide) {
        userGuide.addEventListener('click', () => {
            populateAndShowModal(userGuide.getAttribute('data-modal-id'));
        });
    }

    // 🔥 DEBUG: Log when predictions are made
    eventBus.on('newPredictionMade', (data) => {
        console.log('🎯 NEW PREDICTION MADE:', data);
    });
});