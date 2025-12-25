


/**
 * js/LiveSyncing.js
 * FIXED VERSION - Proper prediction flow and Bayesian feedback
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

    this.WORKER_BASE = 'https://bc-oracle-worker.jhxydev-me.workers.dev';
    this.WS_BASE = this.WORKER_BASE.replace(/^https?:\/\//, (m) => (m === 'https://' ? 'wss://' : 'ws://'));

    console.log('📄 LiveSync: Initialized.', { WORKER_BASE: this.WORKER_BASE, WS_BASE: this.WS_BASE });

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

            // 🔥 FIX: Set currentGameId from history
            if (this.dataStore.rounds.length > 0) {
              this.currentGameId = this.dataStore.rounds[0].gameId;
              console.log(`🔑 Current Game ID set to: ${this.currentGameId}`);
            }
            
            // 🔥 CRITICAL FIX: Initialize engine with 500 rounds of history
            if (this.predictor && typeof this.predictor.learnFromMarketData === 'function') {
              console.log('\n\n')
              console.log('🧠 Initializing prediction engine with historical data...');
              console.log(`   Processing ${standardized.length} rounds...`);
              
              standardized.forEach((round, index) => {
                this.predictor.learnFromMarketData(round.finalMultiplier);
                
                // Log progress every 100 rounds
                if ((index + 1) % 100 === 0) {
                  console.log(`   ✓ Processed ${index + 1}/${standardized.length} rounds`);
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
        try {
            this.ws = new WebSocket(this.WS_BASE);
        } catch (err) {
            console.error('❌ LiveSync: WebSocket constructor failed:', err);
            this._scheduleReconnect();
            return;
        }

        this.ws.onopen = () => {
            console.log('✅ WebSocket Connected for Live Updates');
            
            // 1. STOP the countdown if it's running
            if (this.reconnectInterval) {
                clearInterval(this.reconnectInterval);
                this.reconnectInterval = null;
            }

            // 2. Clear the "Disconnecting" message
            if (this.uiController?.dom?.statusMessage) {
                this.uiController.dom.statusMessage.textContent = `${this.currentGameId + 1} Running`;
                this.uiController.dom.statusMessage.color = "";
                this.uiController.dom.statusDot.style.backgroundColor = "var(--color-status-success)";
            }
        };

        this.ws.onmessage = (evt) => {
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
            
            // START THE COUNTDOWN
            this.startDisconnectCountdown();
            
            this._scheduleReconnect();
        };

        this.ws.onerror = (err) => {
            console.error('❌ WebSocket Error:', err);
            this._scheduleReconnect();
        };
    }

    // NEW METHOD: Put this right below connectWebSocket()
    startDisconnectCountdown() {
        // Prevent multiple intervals from running at once
        if (this.reconnectInterval) clearInterval(this.reconnectInterval);

        let timeLeft = 10;
        const statusEl = this.uiController?.dom?.statusMessage;

        if (!statusEl) return;
        
        this.reconnectInterval = setInterval(() => {
            statusEl.textContent = `Retrying.. ${timeLeft}s`;
            
            timeLeft--;

            if (timeLeft < 0) {
                timeLeft = 10; // Reset the loop
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

    // 🔥 CRITICAL: Emit event for HistoryLog
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

    // 🔥 NEW: PASSIVE LEARNING - Learn from EVERY round
    try {
      if (this.predictor && typeof this.predictor.learnFromMarketData === 'function') {
        this.predictor.learnFromMarketData(standardized.finalMultiplier);
      }
    } catch (e) {
      console.warn('LiveSync: passive learning failed:', e);
    }



    // 🔥 FIX: DO NOT auto-predict after every round
    // Prediction only happens when user clicks button
    
    // Update round display
    const lastRoundId = standardized.gameId;
    const runningRoundId = Number(lastRoundId) + 1;

    const roundIdEl = document.querySelector('.round-id');
    if (roundIdEl) {
      roundIdEl.textContent = `Round ${lastRoundId}`;
    }

    if (this.uiController?.dom?.statusMessage) {
      this.uiController.dom.statusMessage.textContent = `${runningRoundId} running`;
    }
  }

  // 🔥 FIX: Manual prediction with correct round calculation
  async triggerManualPrediction() {
    console.log('🤖 LiveSync: Manual prediction requested...');
    
    if (this.predictor && this.uiController) {
      try {
        // 1. Get history
        const history = this.dataStore.getMultipliers(500);
        
        if (!history || history.length < 50) {
          console.error('❌ Insufficient history for prediction');
          this.uiController.setPredictButtonState('error');
          return;
        }

        console.log(`📊 Predicting with ${history.length} rounds of history`);
        console.log(`📊 Recent history sample:`, history.slice(0, 50));
        
        // 2. Run prediction
        const prediction = await this.predictor.predictNext(history);
        
        console.log('🎯 Raw prediction result:', prediction);
        
        // 3. ðŸ"¥ FIX: Calculate correct target round
        // Last completed round: currentGameId
        // Currently running: currentGameId + 1
        // Prediction target: currentGameId + 2
        if (this.currentGameId) {
          const lastCompleted = parseInt(this.currentGameId);
          const currentlyRunning = lastCompleted + 1;
          const predictionTarget = currentlyRunning + 1; // Predict the NEXT round after running
          
          prediction.gameId = String(predictionTarget); // ðŸ"¥ ALWAYS STRING for consistency
          
          console.log(`ðŸŽ¯ PREDICTION CREATED:`);
          console.log(`   Last Completed: ${lastCompleted}`);
          console.log(`   Currently Running: ${currentlyRunning}`);
          console.log(`   Prediction Target: ${predictionTarget}`);
          console.log(`   Prediction gameId type: ${typeof prediction.gameId}`);
        }

        // 4. 🔥 CRITICAL: Emit newPredictionMade event for HistoryLog
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

        // 5. Update UI
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
}