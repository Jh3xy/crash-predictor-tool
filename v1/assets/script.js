// script.js - FIXED VERSION

import { DataStore } from './js/DataStore.js';
import { LiveSync } from './js/LiveSyncing.js'; 
import { Verifier } from './js/Verifier.js'; 
import { CrashPredictor } from './js/predictor.js'; 
import { UIController } from './js/UIController.js'; 
import { EventEmitter } from './js/EventEmitter.js'; 
import { BacktestingSystem } from './js/BacktestingSystem.js';
import { HistoryLog } from './js/HistoryLog.js'; 
import { FeatureTester } from './js/FeatureTester.js';

// Utilities
import { ChartManager } from './js/utils/ChartManager.js';
import { populateAndShowModal } from './js/utils/modalManager.js'; 
import { listenForTabs } from './js/utils/tabs.js';
import { FeatureDiagnostic } from './js/utils/FeatureDiagnostic.js';
// import { TimeAwareAnalyzer } from './js/utils/TimeAwareAnalyzer.js';

//  Apply saved theme immediately on page load
function applySavedTheme() {
    const savedTheme = localStorage.getItem('selectedTheme') || 'default';
    const body = document.body;
    
    body.className = body.className.split(' ').filter(c => 
        !c.startsWith('theme-') && c !== 'cool-metric' && c !== 'vapor-wave'
    ).join(' ');
    
    if (savedTheme !== 'default') {
        body.classList.add(savedTheme);
    }
    
    console.log('✅ Applied saved theme on page load:', savedTheme);
}

const tabs = document.querySelectorAll('.tab');
listenForTabs(tabs); //Function from ./js/utils/tabs.js';

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

// Initialize theme dropdown in settings modal
function initializeThemeDropdown() {
    const dropdown = document.getElementById('themeDropdown');
    if (!dropdown) return; // Safety check
    
    const header = dropdown.querySelector('.dropdown-header');
    const headerText = dropdown.querySelector('.dropdown-header-text');
    const items = dropdown.querySelectorAll('.dropdown-item');
    const body = document.body;

    // Load and apply saved theme immediately
    const savedTheme = localStorage.getItem('selectedTheme') || 'default';
    applyTheme(savedTheme);

    function applyTheme(themeClass, themeName) {
        // Remove all theme classes
        body.className = body.className.split(' ').filter(c => 
            !c.startsWith('theme-') && c !== 'cool-metric' && c !== 'vapor-wave'
        ).join(' ');
        
        // Add modal-open back if it was removed
        if (document.querySelector('.app-modal')) {
            body.classList.add('modal-open');
        }
        
        // Add new theme class (unless it's default)
        if (themeClass !== 'default') {
            body.classList.add(themeClass);
        }
        
        // Update selected state in dropdown
        items.forEach(i => i.classList.remove('selected'));
        const selectedItem = dropdown.querySelector(`[data-theme="${themeClass}"]`);
        if (selectedItem) {
            selectedItem.classList.add('selected');
            const displayName = themeName || selectedItem.getAttribute('data-name');
            headerText.innerHTML = `<span class="current-theme-indicator"></span>${displayName}`;
        }
        
        // Save to localStorage
        localStorage.setItem('selectedTheme', themeClass);
        console.log('Theme changed to:', themeClass);
    }

    // Toggle dropdown
    header.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('active');
    });

    // Select item
    items.forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            
            const themeClass = item.getAttribute('data-theme');
            const themeName = item.getAttribute('data-name');
            
            applyTheme(themeClass, themeName);
            dropdown.classList.remove('active');
        });
    });

    // Close dropdown when clicking outside
    const closeDropdownOutside = (e) => {
        if (!dropdown.contains(e.target)) {
            dropdown.classList.remove('active');
        }
    };
    document.addEventListener('click', closeDropdownOutside);

    // Close dropdown on Escape key
    const closeDropdownEscape = (e) => {
        if (e.key === 'Escape' && dropdown.classList.contains('active')) {
            dropdown.classList.remove('active');
        }
    };
    document.addEventListener('keydown', closeDropdownEscape);
}

// In script.js - REPLACE your initializeQuantileSlider() function

function initializeQuantileSlider() {
  const slider = document.getElementById('quantileSlider');
  const display = document.getElementById('quantileDisplay');
  const resetBtn = document.getElementById('resetQuantile');
  
  // Debug logging
  console.log('🔧 Initializing quantile slider...');
  console.log('   Slider element:', slider ? 'Found' : 'NOT FOUND');
  console.log('   Display element:', display ? 'Found' : 'NOT FOUND');
  console.log('   Reset button:', resetBtn ? 'Found' : 'NOT FOUND');
  console.log('   Predictor available:', typeof window.predictor !== 'undefined');
  
  if (!slider || !display) {
    console.error('⚠️ Quantile slider elements not found in DOM');
    return;
  }
  
  if (!window.predictor || !window.predictor.engine) {
    console.error('⚠️ Predictor engine not available');
    return;
  }

    // Initialize Settings Info Icons
    const infoIcon = document.querySelector('[data-modal-id="target-quantile-detail"]')
    infoIcon.addEventListener('click', () => {
            populateAndShowModal(infoIcon.getAttribute('data-modal-id'));
        });
  
  // Load current value from engine
  const currentValue = window.predictor.engine.targetQuantile || 0.39;
  slider.value = currentValue;
  display.textContent = `${(currentValue * 100).toFixed(0)}th percentile`;
  
  console.log(`✅ Slider initialized with value: ${(currentValue * 100).toFixed(0)}%`);
  
  // Update display as slider moves (real-time feedback)
  slider.addEventListener('input', (e) => {
    const value = parseFloat(e.target.value);
    display.textContent = `${(value * 100).toFixed(0)}th percentile`;
    
    // Update visual indicator based on risk level
    slider.classList.remove('conservative', 'balanced', 'bold');
    if (value < 0.35) {
      slider.classList.add('conservative');
    } else if (value > 0.45) {
      slider.classList.add('bold');
    } else {
      slider.classList.add('balanced');
    }
  });
  
  // Apply change when slider is released (saves to engine)
  slider.addEventListener('change', (e) => {
    const value = parseFloat(e.target.value);
    
    console.log(`🎯 User changed quantile to ${(value * 100).toFixed(0)}%`);
    
    // Update engine (this triggers the setter which saves to localStorage)
    window.predictor.engine.targetQuantile = value;
    
    console.log(`✅ Quantile updated to ${(value * 100).toFixed(0)}th percentile`);
    console.log(`   Next prediction will use this value`);
  });
  
  // Reset button
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      const defaultValue = 0.39;
      
      console.log('🔄 Resetting quantile to default...');
      
      // Update engine
      window.predictor.engine.targetQuantile = defaultValue;
      
      // Update UI
      slider.value = defaultValue;
      display.textContent = `${(defaultValue * 100).toFixed(0)}th percentile`;
      slider.classList.remove('conservative', 'bold');
      slider.classList.add('balanced');
      
      console.log('✅ Quantile reset to default (39th percentile)');
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
    const historyLog = new HistoryLog(domElements, eventBus); 
    const liveSync = new LiveSync(dataStore, verifier, eventBus, uiController, predictor); 
    const diagnostic = new FeatureDiagnostic(predictor, dataStore);
    // const timeAnalyzer = new TimeAwareAnalyzer();
    const chartManager = new ChartManager(historyLog, eventBus);


    // Expose for console access and debugging
    window.tester = new FeatureTester(predictor, dataStore);
    window.backtester = new BacktestingSystem(predictor, dataStore);
    window.diagnostic = diagnostic;
    // window.timeAnalyzer = new TimeAwareAnalyzer()
    window.predictor = predictor;
    window.dataStore = dataStore;
    window.eventBus = eventBus;
    window.liveSync = liveSync;
    window.chartManager = chartManager
    
    const history = dataStore.getMultipliers(500);
    // timeAnalyzer.autoConfigureEngine(predictor.engine, history);

    console.log('🤖 Backtesting system ready! Use: backtester.runBacktest(100)');
    console.log('🔧 Debug: tester, backtester, predictor, dataStore, LiveSync and eventBus exposed to window');

    // 🔥 Bayesian feedback loop
    eventBus.on('updateBayesianState', (data) => {
        console.log('📊 Bayesian Update Event Received:', data);
        predictor.updateAfterRound(data.actual, data.predicted);
    });

    uiController.showInitialState();

    
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
            // 🆕 AUTO-CONFIGURE BASED ON TIME (optional)
            const history = dataStore.getMultipliers(500);
            // timeAnalyzer.autoConfigureEngine(predictor.engine, history);

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
    const chartInfo = document.querySelector('[data-modal-id="chart-info"]');
    const roadmapBell = document.querySelector('.icon.glass.ui-icon-secondary[data-modal-id="roadmap"]');
    const statsInfoIcons = document.querySelectorAll(
        '[data-modal-id="card-info-total-predictions"],' +
        '[data-modal-id="card-info-avg-accuracy"],' +
        '[data-modal-id="card-info-win-rate"],' + 
        '[data-modal-id="card-info-active-sessions"]' 
    );

// 🔥 IMPORTANT: Update your settings button handler
// Find this section in your code and update it:

if (settingBtn) {
  settingBtn.addEventListener('click', () => {
    populateAndShowModal(settingBtn.getAttribute('data-modal-id'));
    
    // 🔥 FIX: Use setTimeout instead of requestAnimationFrame
    // This ensures DOM is fully rendered before initialization
    setTimeout(() => {
        console.log('📋 Settings modal opened, initializing...');
        initializeThemeDropdown();
        initializeQuantileSlider();
    }, 100); // 100ms delay ensures modal is rendered
  });
}

    if (predictDetials) {
        predictDetials.addEventListener('click', () => {
            populateAndShowModal(predictDetials.getAttribute('data-modal-id'));
        });
    }
    if (chartInfo) {
        chartInfo.addEventListener('click', () => {
            populateAndShowModal(chartInfo.getAttribute('data-modal-id'));
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

    if (roadmapBell) {
        roadmapBell.addEventListener('click', () => {
            populateAndShowModal('roadmap');
        });
    }

    
    // 🔥 DEBUG: Log when predictions are made
    eventBus.on('newPredictionMade', (data) => {
        console.log('🎯 NEW PREDICTION MADE:', data);
    });
});

// 🔥 Live Validation Console Helpers
window.checkValidation = function() {
    const status = predictor.getValidationStatus();
    console.log('\n📊 Validation Status:', status.status);
    console.log('   Progress:', status.progress);
    if (status.currentAccuracy) {
        console.log('   Current Accuracy:', status.currentAccuracy);
    }
    console.log('');
};

window.viewReport = function() {
    predictor.viewLastReport();
};

console.log('💡 Commands: checkValidation(), viewReport()');