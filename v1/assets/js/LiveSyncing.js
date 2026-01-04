
/**
 * js/LiveSyncing.js
 * ENHANCED VERSION - Reconnection overlay with silent catch-up
 */

export class LiveSync {
  constructor(dataStore, verifier, eventBus, uiController, predictor) {
    this.dataStore = dataStore;
    this.verifier = verifier;
    this.eventBus = eventBus;
    this.uiController = uiController;
    this.predictor = predictor;

    this.ws = null;
    this.currentGameId = null;
    this.currentMultiplier = 0;
    this._reconnectTimer = null;
    this._reconnectDelay = 3000;
    this.reconnectInterval = null;

    // 🔥 NEW: Reconnection state tracking
    this.connectionState = 'connecting'; // 'connected', 'disconnected', 'reconnecting', 'syncing'
    this.lastReceivedGameId = null;
    this.syncInProgress = false;
    this.messageQueue = [];

    this.WORKER_BASE = 'https://bc-oracle-worker.jhxydev-me.workers.dev';
    this.WS_BASE = this.WORKER_BASE.replace(/^https?:\/\//, (m) => (m === 'https://' ? 'wss://' : 'ws://'));

    console.log('🔄 LiveSync: Initialized.', { WORKER_BASE: this.WORKER_BASE, WS_BASE: this.WS_BASE });

    this.initialize();
  }

  async initialize() {
    try {
      console.log('🕵️ [Debug] Step 1: Fetching initial history from DO...', `${this.WORKER_BASE}/api/history`);

      const res = await fetch(`${this.WORKER_BASE}/api/history`, { cache: 'no-store' });

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        console.error('❌ LiveSync: history fetch returned non-OK status', res.status, body.slice(0, 200));
        if (typeof this.dataStore.loadMockHistory === 'function') {
          this.dataStore.loadMockHistory();
        }
      } else {
        const contentType = (res.headers.get('content-type') || '').toLowerCase();
        if (contentType.includes('application/json')) {
          const history = await res.json();
          if (Array.isArray(history) && history.length > 0) {
            const standardized = history.map(r => ({
              gameId: (r.id ?? r.gameId ?? r.gameIdString ?? '').toString(),
              finalMultiplier: Number(r.finalMultiplier ?? r.multiplier ?? r.rate ?? 0),
              status: r.status ?? 'crash',
              hash: r.hash ?? null,
              verificationStatus: r.verificationStatus ?? 'Official Data'
            }));
            
            this.dataStore.setHistory(standardized);
            
            console.log(`🕵️ [Debug] DataStore rounds count: ${this.dataStore.rounds.length}`);
            console.table(
              this.dataStore.rounds.slice(0, 10).map(r => ({
                gameId: r.gameId,
                finalMultiplier: r.finalMultiplier,
                verificationStatus: r.verificationStatus
              }))
            );

            // Set currentGameId from history
            if (this.dataStore.rounds.length > 0) {
              this.currentGameId = this.dataStore.rounds[0].gameId;
              this.lastReceivedGameId = this.currentGameId;
              console.log(`🔑 Current Game ID set to: ${this.currentGameId}`);
            }
            
            // Initialize engine with historical data
            if (this.predictor && typeof this.predictor.learnFromMarketData === 'function') {
              console.log('\n\n')
              console.log('🧠 Initializing prediction engine with historical data...');
              console.log(`   Processing ${standardized.length} rounds...`);
              
              standardized.forEach((round, index) => {
                this.predictor.learnFromMarketData(round.finalMultiplier);
                
                if ((index + 1) % 100 === 0) {
                  console.log(`   ✔ Processed ${index + 1}/${standardized.length} rounds`);
                }
              });
              
              const stats = this.predictor.getStatistics();
              console.log('✅ Engine initialization complete:');
              console.log(`   Market rounds analyzed: ${stats.marketRoundsAnalyzed}`);
              console.log(`   Market median: ${stats.marketMedian}x`);
              console.log(`   Target quantile: ${stats.targetQuantile}`);
            }
            
          } else {
            console.warn('⚠️ LiveSync: history endpoint returned empty array or non-array.');
            if (typeof this.dataStore.loadMockHistory === 'function') this.dataStore.loadMockHistory();
          }
        } else {
          const text = await res.text().catch(() => '');
          console.error('❌ LiveSync: expected JSON but got:', text.slice(0, 200));
          if (typeof this.dataStore.loadMockHistory === 'function') this.dataStore.loadMockHistory();
        }
      }

    } catch (err) {
      console.error('❌ LiveSync Initialization Error (fetch):', err);
      if (typeof this.dataStore.loadMockHistory === 'function') this.dataStore.loadMockHistory();
    }

    // Update UI stats
    try {
      if (this.uiController && typeof this.uiController.updateStats === 'function') {
        this.uiController.updateStats(this.dataStore.getMultipliers(500));
      }
      if (this.uiController && typeof this.uiController.updateRecentMultipliers === 'function') {
        this.uiController.updateRecentMultipliers(this.dataStore.getRecentMultipliers(10));
      }
      
    } catch (e) {
      console.warn('LiveSync: UI update after history fetch failed:', e);
    }
    console.log('\n\n')
    console.log('[Debug] Step 2: History Sync Complete. Opening WebSocket...');
    this.connectWebSocket();

    // Fix: Set initial status message
    if (this.currentGameId && this.uiController?.dom?.statusMessage) {
      const runningRoundId = parseInt(this.currentGameId) + 1;
      this.uiController.dom.statusMessage.innerText = `${runningRoundId} Running`;
    }
  }

  connectWebSocket() {
    if (this.ws) {
      try { this.ws.close(); } catch (e) {}
      this.ws = null;
    }
    if (this._reconnectTimer) {
      clearTimeout(this._reconnectTimer);
      this._reconnectTimer = null;
    }

    console.log('🔌 LiveSync: connecting WebSocket to', this.WS_BASE);
    
    // 🔥 Show reconnecting overlay if not initial connection
    if (this.connectionState === 'disconnected') {
      this.connectionState = 'reconnecting';
      this.showReconnectOverlay();
    }

    try {
      this.ws = new WebSocket(this.WS_BASE);
    } catch (err) {
      console.error('❌ LiveSync: WebSocket constructor failed:', err);
      this._scheduleReconnect();
      return;
    }

    this.ws.onopen = async () => {
      console.log('✅ WebSocket Connected for Live Updates');
      
      // Stop countdown if running
      if (this.reconnectInterval) {
        clearInterval(this.reconnectInterval);
        this.reconnectInterval = null;
      }

      // 🔥 CRITICAL: Check if we need catch-up
      await this.handleReconnectCatchup();
    };

    this.ws.onmessage = (evt) => {
      // 🔥 If syncing, queue messages silently
      if (this.syncInProgress) {
        this.messageQueue.push(evt.data);
        return;
      }

      let payload;
      try {
        payload = JSON.parse(evt.data);
      } catch (e) {
        console.error('Bad message from Worker (non-JSON):', e, evt.data);
        return;
      }

      const id = payload.id ?? payload.gameId ?? payload.gameIdString;
      const multiplier = Number(payload.multiplier ?? payload.rate ?? payload.finalMultiplier);

      if (!id) return;

      const normalized = {
        id: id.toString(),
        multiplier: Number.isFinite(multiplier) ? multiplier : 0,
        hash: payload.hash ?? payload.verificationHash ?? null,
        raw: payload
      };

      this.handleCompletedRound(normalized);
    };

    this.ws.onclose = (evt) => {
      console.warn('⚠️ LiveSync: WebSocket closed – scheduling reconnect...');
      
      this.connectionState = 'disconnected';
      this.startDisconnectCountdown();
      this._scheduleReconnect();
    };

    this.ws.onerror = (err) => {
      console.error('❌ WebSocket Error:', err);
      this._scheduleReconnect();
    };
  }

  // 🔥 NEW: Handle reconnection and catch-up
  // async handleReconnectCatchup() {
  //   const lastStoredId = this.lastReceivedGameId || this.currentGameId;
    
  //   if (!lastStoredId) {
  //     // First connection - no catch-up needed
  //     this.connectionState = 'connected';
  //     this.hideReconnectOverlay();
  //     this.updateStatusMessage();
  //     return;
  //   }

  //   console.log('🔍 Checking for missed rounds...');
  //   console.log(`   Last received: ${lastStoredId}`);
    
  //   // Wait a moment for first WS message
  //   await new Promise(resolve => setTimeout(resolve, 1000));

  //   // Fetch latest from HTTP to compare
  //   try {
  //     const res = await fetch(`${this.WORKER_BASE}/api/history?limit=50`, { cache: 'no-store' });
  //     if (!res.ok) {
  //       console.warn('⚠️ Could not fetch history for catch-up check');
  //       this.connectionState = 'connected';
  //       this.hideReconnectOverlay();
  //       this.updateStatusMessage();
  //       return;
  //     }

  //     const history = await res.json();
  //     if (!Array.isArray(history) || history.length === 0) {
  //       this.connectionState = 'connected';
  //       this.hideReconnectOverlay();
  //       this.updateStatusMessage();
  //       return;
  //     }

  //     const latestId = (history[0].id ?? history[0].gameId ?? '').toString();
  //     const lastStoredNum = parseInt(lastStoredId);
  //     const latestNum = parseInt(latestId);
  //     const missedCount = latestNum - lastStoredNum;

  //     console.log(`   Latest available: ${latestId}`);
  //     console.log(`   Missed rounds: ${missedCount}`);

  //     if (missedCount > 3) {
  //       // Significant gap - do silent sync
  //       console.log('🔄 Performing silent catch-up sync...');
  //       await this.performSilentSync(history);
  //     } else {
  //       // Small gap or no gap - normal flow
  //       console.log('✅ No significant gap - resuming normal updates');
  //       this.connectionState = 'connected';
  //       this.hideReconnectOverlay();
  //       this.updateStatusMessage();
  //     }

  //   } catch (err) {
  //     console.error('❌ Catch-up check failed:', err);
  //     this.connectionState = 'connected';
  //     this.hideReconnectOverlay();
  //     this.updateStatusMessage();
  //   }
  // }

  // 🔥 REPLACE handleReconnectCatchup() method in LiveSyncing.js
// (Around line 194)

async handleReconnectCatchup() {
  const lastStoredId = this.lastReceivedGameId || this.currentGameId;
  
  if (!lastStoredId) {
    // First connection - no catch-up needed
    this.connectionState = 'connected';
    this.hideReconnectOverlay();
    this.updateStatusMessage();
    return;
  }

  console.log('🔍 Checking for missed rounds...');
  console.log(`   Last received: ${lastStoredId}`);
  
  // 🔥 OPTIMIZED: Reduced wait time from 1000ms to 300ms
  await new Promise(resolve => setTimeout(resolve, 300));

  // Fetch latest from HTTP to compare
  try {
    const res = await fetch(`${this.WORKER_BASE}/api/history?limit=50`, { cache: 'no-store' });
    if (!res.ok) {
      console.warn('⚠️ Could not fetch history for catch-up check');
      this.connectionState = 'connected';
      this.hideReconnectOverlay();
      this.updateStatusMessage();
      return;
    }

    const history = await res.json();
    if (!Array.isArray(history) || history.length === 0) {
      this.connectionState = 'connected';
      this.hideReconnectOverlay();
      this.updateStatusMessage();
      return;
    }

    const latestId = (history[0].id ?? history[0].gameId ?? '').toString();
    const lastStoredNum = parseInt(lastStoredId);
    const latestNum = parseInt(latestId);
    const missedCount = latestNum - lastStoredNum;

    console.log(`   Latest available: ${latestId}`);
    console.log(`   Missed rounds: ${missedCount}`);

    // 🔥 OPTIMIZED: Lower threshold from >3 to >1 for faster catch-up
    if (missedCount > 1) {
      // Significant gap - do silent sync
      console.log('🔄 Performing silent catch-up sync...');
      await this.performSilentSync(history);
    } else {
      // Small gap or no gap - normal flow
      console.log('✅ No significant gap - resuming normal updates');
      this.connectionState = 'connected';
      this.hideReconnectOverlay();
      this.updateStatusMessage();
    }

  } catch (err) {
    console.error('❌ Catch-up check failed:', err);
    this.connectionState = 'connected';
    this.hideReconnectOverlay();
    this.updateStatusMessage();
  }
}

  // 🔥 NEW: Silent sync with HTTP refetch
  async performSilentSync(history) {
    this.syncInProgress = true;
    this.connectionState = 'syncing';
    
    // Update overlay message
    if (this.uiController && typeof this.uiController.updateReconnectMessage === 'function') {
      this.uiController.updateReconnectMessage('Syncing data...');
    }

    // Standardize and update DataStore silently
    const standardized = history.map(r => ({
      gameId: (r.id ?? r.gameId ?? r.gameIdString ?? '').toString(),
      finalMultiplier: Number(r.finalMultiplier ?? r.multiplier ?? r.rate ?? 0),
      status: r.status ?? 'crash',
      hash: r.hash ?? null,
      verificationStatus: r.verificationStatus ?? 'Official Data'
    }));

    // Batch update DataStore
    this.dataStore.setHistory(standardized);

    // Update tracking
    if (standardized.length > 0) {
      this.currentGameId = standardized[0].gameId;
      this.lastReceivedGameId = this.currentGameId;
    }

    // Update predictor with new data (passive learning)
    if (this.predictor && typeof this.predictor.learnFromMarketData === 'function') {
      standardized.forEach(round => {
        this.predictor.learnFromMarketData(round.finalMultiplier);
      });
    }

    // Emit events for history updates (for HistoryLog, etc.)
    if (this.eventBus && typeof this.eventBus.emit === 'function') {
      standardized.slice(0, 10).forEach(round => {
        this.eventBus.emit('newRoundCompleted', {
          finalMultiplier: round.finalMultiplier,
          gameId: round.gameId,
          hash: round.hash
        });
      });
    }

    // Update UI with final state
    try {
      if (this.uiController && typeof this.uiController.updateRecentMultipliers === 'function') {
        this.uiController.updateRecentMultipliers(this.dataStore.getRecentMultipliers(10));
      }
      if (this.uiController && typeof this.uiController.updateStats === 'function') {
        this.uiController.updateStats(this.dataStore.getMultipliers(500));
      }
      if (this.uiController && typeof this.uiController.updateLastCrashDisplay === 'function') {
        this.uiController.updateLastCrashDisplay(standardized[0].finalMultiplier);
      }
    } catch (e) {
      console.warn('LiveSync: UI update during sync failed:', e);
    }

    console.log(`✅ Silent sync complete - ${standardized.length} rounds updated`);

    // Resume normal operation
    this.syncInProgress = false;
    this.connectionState = 'connected';
    this.messageQueue = []; // Clear queue (HTTP sync replaced them)
    this.hideReconnectOverlay();
    this.updateStatusMessage();
  }

  // 🔥 NEW: Show reconnection overlay
  showReconnectOverlay() {
    if (this.uiController && typeof this.uiController.showReconnectOverlay === 'function') {
      this.uiController.showReconnectOverlay();
    }
  }

  // 🔥 NEW: Hide reconnection overlay
  hideReconnectOverlay() {
    if (this.uiController && typeof this.uiController.hideReconnectOverlay === 'function') {
      this.uiController.hideReconnectOverlay();
    }
  }

  // 🔥 NEW: Update status message after reconnect
  updateStatusMessage() {
    if (this.uiController?.dom?.statusMessage && this.currentGameId) {
      const runningRoundId = parseInt(this.currentGameId) + 1;
      this.uiController.dom.statusMessage.innerText = `${runningRoundId} Running`;
      this.uiController.dom.statusMessage.color = "";
      
      if (this.uiController.dom.statusDot) {
        this.uiController.dom.statusDot.style.backgroundColor = "var(--color-status-success)";
      }
    }
  }

  startDisconnectCountdown() {
    if (this.reconnectInterval) clearInterval(this.reconnectInterval);

    let timeLeft = 10;
    const statusEl = this.uiController?.dom?.statusMessage;

    if (!statusEl) return;
    
    this.reconnectInterval = setInterval(() => {
      statusEl.textContent = `Retrying.. ${timeLeft}s`;
      
      timeLeft--;

      if (timeLeft < 0) {
        timeLeft = 10;
      }
    }, 1000);
  }

  _scheduleReconnect() {
    if (this._reconnectTimer) return;
    this._reconnectTimer = setTimeout(() => {
      this._reconnectTimer = null;
      console.log('🔄 LiveSync: Attempting WebSocket reconnect...');
      this.connectWebSocket();
    }, this._reconnectDelay);
  }

  handleCompletedRound(round) {
    const standardized = {
      gameId: String(round.id ?? round.gameId ?? round.raw?.id ?? 'unknown'),
      finalMultiplier: Number(round.multiplier ?? round.finalMultiplier ?? round.raw?.multiplier ?? 0),
      hash: round.hash ?? round.raw?.hash ?? null,
      verificationStatus: 'Pending'
    };

    // Duplicate guard
    const lastStored = Array.isArray(this.dataStore.rounds) && this.dataStore.rounds[0];
    if (lastStored && String(lastStored.gameId) === String(standardized.gameId)) {
      console.warn('🕵️ [Debug] Duplicate round ignored:', standardized.gameId);
      if (this.uiController && typeof this.uiController.updateMultiplier === 'function') {
        this.uiController.updateMultiplier(standardized.finalMultiplier);
      }
      return;
    }

    // Update pointers
    this.currentGameId = standardized.gameId;
    this.lastReceivedGameId = standardized.gameId;
    this.currentMultiplier = standardized.finalMultiplier;

    // Persist to DataStore
    try {
      if (typeof this.dataStore.addRound === 'function') {
        this.dataStore.addRound(standardized);
      } else {
        if (Array.isArray(this.dataStore.rounds)) {
          this.dataStore.rounds.unshift(standardized);
          if (this.dataStore.rounds.length > (this.dataStore.MAX_ROUNDS ?? 500)) {
            this.dataStore.rounds.length = this.dataStore.MAX_ROUNDS ?? 500;
          }
        }
      }
    } catch (e) {
      console.error('LiveSync: failed adding round to DataStore:', e);
    }

    // UI updates
    try {
      if (this.uiController && typeof this.uiController.showCrashedState === 'function') {
        this.uiController.showCrashedState(standardized.finalMultiplier);
      } else if (this.uiController && typeof this.uiController.updateMultiplier === 'function') {
        this.uiController.updateMultiplier(standardized.finalMultiplier);
      }
    } catch (e) {
      console.warn('LiveSync: UI update for crash display failed:', e);
    }

    // Verification
    try {
      if (this.verifier && typeof this.verifier.addPendingVerification === 'function') {
        this.verifier.addPendingVerification(standardized);
      }
    } catch (e) {
      console.error('LiveSync: verifier enqueue failed:', e);
    }

    // Update UI lists & stats
    try {
      if (this.uiController && typeof this.uiController.updateRecentMultipliers === 'function') {
        this.uiController.updateRecentMultipliers(this.dataStore.getRecentMultipliers(10));
      }
      if (this.uiController && typeof this.uiController.updateStats === 'function') {
        this.uiController.updateStats(this.dataStore.getMultipliers(500));
      }
    } catch (e) {
      console.warn('LiveSync: UI recent/stats update failed:', e);
    }

    // Emit event for HistoryLog
    try {
      if (this.eventBus && typeof this.eventBus.emit === 'function') {
        this.eventBus.emit('newRoundCompleted', {
          finalMultiplier: standardized.finalMultiplier,
          gameId: standardized.gameId,
          hash: standardized.hash
        });
      }
    } catch (e) {
      console.warn('LiveSync: eventBus emit failed:', e);
    }

    // Passive learning
    try {
      if (this.predictor && typeof this.predictor.learnFromMarketData === 'function') {
        this.predictor.learnFromMarketData(standardized.finalMultiplier);
      }
    } catch (e) {
      console.warn('LiveSync: passive learning failed:', e);
    }

    // Update round display
    const lastRoundId = standardized.gameId;
    const runningRoundId = Number(lastRoundId) + 1;

    const roundIdEl = document.querySelector('.round-id');
    if (roundIdEl) {
      roundIdEl.textContent = `Round ${lastRoundId}`;
    }

    if (this.uiController?.dom?.statusMessage) {
      this.uiController.dom.statusMessage.innerText = `${runningRoundId} Running`;
    }
  }

  async triggerManualPrediction() {
    console.log('🤖 LiveSync: Manual prediction requested...');
    
    if (this.predictor && this.uiController) {
      try {
        const history = this.dataStore.getMultipliers(500);
        
        if (!history || history.length < 50) {
          console.error('❌ Insufficient history for prediction');
          this.uiController.setPredictButtonState('error');
          return;
        }

        console.log(`📊 Predicting with ${history.length} rounds of history`);
        console.log(`📊 Recent history sample:`, history.slice(0, 50));
        
        const prediction = await this.predictor.predictNext(history);
        
        console.log('🎯 Raw prediction result:', prediction);
        
        if (this.currentGameId) {
          const lastCompleted = parseInt(this.currentGameId);
          const currentlyRunning = lastCompleted + 1;
          const predictionTarget = currentlyRunning + 1;
          
          prediction.gameId = String(predictionTarget);
          
          console.log(`🎯 PREDICTION CREATED:`);
          console.log(`   Last Completed: ${lastCompleted}`);
          console.log(`   Currently Running: ${currentlyRunning}`);
          console.log(`   Prediction Target: ${predictionTarget}`);
          console.log(`   Prediction gameId type: ${typeof prediction.gameId}`);
        }

        if (this.eventBus && typeof this.eventBus.emit === 'function') {
          this.eventBus.emit('newPredictionMade', {
            gameId: prediction.gameId,
            predictedValue: prediction.predictedValue,
            confidence: prediction.confidence,
            action: prediction.action,
            timestamp: Date.now()
          });
          console.log('✅ newPredictionMade event emitted for gameId:', prediction.gameId);
        }

        this.uiController.displayPrediction(prediction);
        
      } catch (err) {
        console.error("❌ LiveSync: Manual prediction failed", err);
        throw err;
      }
    }
  }

  updateModalHistory() {
    if (this.uiController && typeof this.uiController.populateModalHistory === 'function') {
      this.uiController.populateModalHistory(this.dataStore.rounds.slice(0, 200));
      return;
    }
    if (this.uiController && typeof this.uiController.updateRecentMultipliers === 'function') {
      this.uiController.updateRecentMultipliers(this.dataStore.getRecentMultipliers(20));
    }
  }

  updateModalDiagnostics() {
    if (this.uiController && typeof this.uiController.populateModalDiagnostics === 'function') {
      this.uiController.populateModalDiagnostics({
        roundsLoaded: Array.isArray(this.dataStore.rounds) ? this.dataStore.rounds.length : 0,
        websocketOpen: !!this.ws && this.ws.readyState === 1,
        currentGameId: this.currentGameId
      });
      return;
    }
    if (this.uiController && typeof this.uiController.updateStats === 'function') {
      this.uiController.updateStats(this.dataStore.getMultipliers(500));
    }
  }

  updateModalLiveValue() {
    if (this.uiController && typeof this.uiController.updateLiveMultiplier === 'function') {
      this.uiController.updateLiveMultiplier(this.currentMultiplier);
    } else if (this.uiController && typeof this.uiController.updateMultiplier === 'function') {
      this.uiController.updateMultiplier(this.currentMultiplier);
    }
  }
  // 🔥 ADD THESE METHODS AT THE END OF LiveSync CLASS
// (Before the closing } of the class, around line 600+)

/**
 * 🔥 TEST HELPER: Fast reconnect test (skips delays)
 * Usage in console: window.liveSync.testReconnect()
 */
async testReconnect() {
  console.log('🧪 TEST MODE: Fast reconnection test');
  
  // Close connection
  if (this.ws) {
    this.ws.close();
  }
  
  // Show overlay
  this.connectionState = 'reconnecting';
  this.showReconnectOverlay();
  
  // Wait just 500ms instead of 3 seconds
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Reconnect
  this.connectWebSocket();
  
  console.log('✅ Test reconnection initiated');
}

/**
 * 🔥 TEST HELPER: Simulate missed rounds scenario
 * Usage in console: window.liveSync.testCatchup(10)
 */
async testCatchup(missedRounds = 10) {
  console.log(`🧪 TEST MODE: Simulating ${missedRounds} missed rounds`);
  
  // Store current ID
  const currentId = parseInt(this.currentGameId);
  
  // Fake that we missed rounds by setting lastReceivedGameId back
  this.lastReceivedGameId = String(currentId - missedRounds);
  
  console.log(`   Faked last received: ${this.lastReceivedGameId}`);
  console.log(`   Current latest: ${this.currentGameId}`);
  
  // Close and reconnect to trigger catch-up
  if (this.ws) {
    this.ws.close();
  }
  
  this.connectionState = 'disconnected';
  
  // Show overlay
  await new Promise(resolve => setTimeout(resolve, 100));
  this.connectWebSocket();
  
  console.log('✅ Test catch-up scenario triggered');
}
}