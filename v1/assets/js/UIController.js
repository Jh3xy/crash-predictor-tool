
/**
 * UIController.js - FIXED VERSION
 * 🔥 FIX: Separates Market Stats from Prediction Stats
 * Now prediction values stay intact after rounds complete
 */

export class UIController {
    constructor(elements) {
        this.elements = elements;
        this.cells = []; 
        this.predictorCard = document.getElementById('ai-predictor');
        this.dom = elements;
        
        // 🔥 NEW: Track if prediction is active
        this.activePrediction = null;
        
        this.initializeHistoryCells(10); 
        console.log(`UIController: Initialized.`);
    }
    
    initializeHistoryCells(limit) {
        if (!this.elements.recentGrid) return;
        this.elements.recentGrid.innerHTML = ''; 
        this.cells = [];
        for (let i = 0; i < limit; i++) {
            const cell = document.createElement('div');
            cell.classList.add('multiplier-cell', 'm-default'); 
            cell.textContent = '--'; 
            this.elements.recentGrid.appendChild(cell); 
            this.cells.push(cell); 
        }
    }

    setPredictButtonState(state) {
        if (!this.elements.predictBtn) return;
        
        if (state === 'loading') {
            this.elements.predictBtn.textContent = 'Analyzing...';
            this.elements.predictBtn.disabled = true;
        } else if (state === 'ready') {
            this.elements.predictBtn.textContent = 'Predict Next';
            this.elements.predictBtn.disabled = false;
        } else if (state === 'error') {
            this.elements.predictBtn.textContent = 'Retry Analysis';
            this.elements.predictBtn.disabled = false;
        }
    }
    
    showInitialState() {
        if (this.elements.initialStateContent) this.elements.initialStateContent.style.display = 'block';
        if (this.elements.loadingOverlay) this.elements.loadingOverlay.style.display = 'none';
        if (this.elements.predictionOutputDetails) this.elements.predictionOutputDetails.style.display = 'none';

        if (this.elements.predictedValue) this.elements.predictedValue.textContent = '--';
        if (this.elements.confidencePercentage) this.elements.confidencePercentage.textContent = '0%';
        
        // 🔥 CLEAR active prediction
        this.activePrediction = null;
        
        this.setPredictButtonState('ready'); 
    }
    
    showLoadingState() {
        if (this.elements.initialStateContent) this.elements.initialStateContent.style.display = 'none';
        if (this.elements.loadingOverlay) this.elements.loadingOverlay.style.display = 'flex'; 
        if (this.elements.predictionOutputDetails) this.elements.predictionOutputDetails.style.display = 'none';

        this.setPredictButtonState('loading'); 
    }

    updateLastCrashDisplay(multiplier) {
        if (this.elements.currentMultiplier) {
            this.elements.currentMultiplier.textContent = multiplier.toFixed(2) + 'x';
            // this.elements.currentMultiplier.style.color = 'var(--text-primary)'; 
        }
    }

    updateLiveMultiplier(multiplier) {
        this.updateLastCrashDisplay(multiplier);
    }

    updateStatus(status, message) {
        if (this.elements.statusMessage) this.elements.statusMessage.textContent = message;
    } 

    /**
     * 🔥 FIXED: Display prediction and LOCK values
     */
    renderPrediction(result) {
        if (this.elements.loadingOverlay) {
            this.elements.loadingOverlay.style.display = 'none';
        }
        
        // 🔥 PHASE 1.3: Update predictor card visual state
        if (this.predictorCard) {
            // Remove old state classes
            this.predictorCard.classList.remove('confidence-high', 'confidence-medium', 'confidence-low', 'confidence-skip');
            
            // Add new state class based on confidence
            if (result.confidence >= 70) {
                this.predictorCard.classList.add('confidence-high');
            } else if (result.confidence >= 55) {
                this.predictorCard.classList.add('confidence-medium');
            } else if (result.confidence >= 40) {
                this.predictorCard.classList.add('confidence-low');
            } else {
                this.predictorCard.classList.add('confidence-skip');
            }
        }

        if (result.error) {
            this.showInitialState();
            if (this.elements.analysisMessage) {
                this.elements.analysisMessage.textContent = result.message;
                this.elements.analysisMessage.style.color = 'var(--color-status-danger)';
            }
            this.setPredictButtonState('error');
            return;
        }

        // 🔥 STORE active prediction (prevents overwriting)
        this.activePrediction = result;

        if (this.elements.predictionOutputDetails) {
            this.elements.predictionOutputDetails.style.display = 'block';
        }

        // === 1. MAIN PREDICTED VALUE (PHASE 1.3: Enhanced Visual Feedback) ===
        if (this.elements.predictedValue) {
            this.elements.predictedValue.textContent = result.predictedValue.toFixed(2) + 'x';

            // 🔥 PHASE 1.3: Remove old classes first
            this.elements.predictedValue.classList.remove('strong-bet', 'moderate-bet', 'cautious-bet', 'skip-bet');

            // 🔥 PHASE 1.3: Apply confidence-based styling
            let confidenceClass = '';
            let color;

            if (result.confidence >= 70) {
                confidenceClass = 'strong-bet';
                color = 'var(--color-status-success)';
            } else if (result.confidence >= 55) {
                confidenceClass = 'moderate-bet';
                color = 'var(--color-status-success)';
            } else if (result.confidence >= 40) {
                confidenceClass = 'cautious-bet';
                color = 'var(--color-status-warning)';
            } else {
                confidenceClass = 'skip-bet';
                color = 'var(--color-status-danger)';
            }

            this.elements.predictedValue.classList.add(confidenceClass);
            this.elements.predictedValue.style.color = color;

            console.log(`🎨 UI: Applied ${confidenceClass} styling (${result.confidence.toFixed(0)}% confidence)`);
        }

        // === 2. ROUND ID ===
        if (this.elements.predictedRoundId && result.gameId) {
            this.elements.predictedRoundId.textContent = `Round ${result.gameId}`;
        }

        // === 3. CONFIDENCE LEVEL ===
        const confidenceVal = Math.min(result.confidence || 0, 100).toFixed(1) + '%';
        
        if (this.predictorCard) {
            this.predictorCard.style.setProperty('--confidence-level', confidenceVal);
        }
        
        if (this.elements.confidencePercentage) {
            this.elements.confidencePercentage.textContent = confidenceVal;
        }

        // === 4. STATS GRID (PREDICTION STATS - NOT MARKET STATS) ===
        
        // Risk Zone
        if (this.elements.riskZone) {
            const risk = result.riskLevel || 'MEDIUM';
            this.elements.riskZone.textContent = risk;
            
            let riskColor;
            if (risk === 'LOW') riskColor = 'var(--color-status-success)';
            else if (risk === 'HIGH') riskColor = 'var(--color-status-danger)';
            else riskColor = 'var(--color-status-warning)';
            
            this.elements.riskZone.style.color = riskColor;
        }
        
        // Avg. Target (show predicted range)
        if (this.elements.avgMultiplier) {
            if (result.predictedRange) {
                const [min, max] = result.predictedRange;
                this.elements.avgMultiplier.textContent = 
                    `${min.toFixed(2)}-${max.toFixed(2)}x`;
            } else {
                this.elements.avgMultiplier.textContent = '--';
            }
        }
        
        // Volatility (from prediction, not market)
        if (this.elements.volatility) {
            this.elements.volatility.textContent = result.volatility || '--';
        }

        // === 5. DYNAMIC STATS INJECTION ===
        const statsGrid = document.querySelector('.stats-grid');
        if (statsGrid) {
            // Safety Exit stat
            let safetyBox = document.getElementById('safety-exit-stat');
            if (!safetyBox && result.safetyZone) {
                safetyBox = document.createElement('div');
                safetyBox.className = 'stat-item';
                safetyBox.id = 'safety-exit-stat';
                safetyBox.innerHTML = `
                    <div class="stat-label">Safety Exit</div>
                    <div class="stat-value" style="color: var(--color-status-success)">--</div>
                `;
                statsGrid.insertBefore(safetyBox, statsGrid.children[1]);
            }
            if (safetyBox && result.safetyZone) {
                safetyBox.querySelector('.stat-value').textContent = 
                    result.safetyZone.toFixed(2) + 'x';
            }

            // Survival Probability (Kaplan-Meier)
            if (result.survivalProbability) {
                let survivalBox = document.getElementById('survival-prob-stat');
                if (!survivalBox) {
                    survivalBox = document.createElement('div');
                    survivalBox.className = 'stat-item';
                    survivalBox.id = 'survival-prob-stat';
                    survivalBox.innerHTML = `
                        <div class="stat-label">Survival Prob.</div>
                        <div class="stat-value" style="color: var(--color-accent-primary)">--</div>
                    `;
                    const safetyIndex = Array.from(statsGrid.children).indexOf(safetyBox);
                    if (safetyIndex >= 0) {
                        statsGrid.insertBefore(survivalBox, statsGrid.children[safetyIndex + 1]);
                    } else {
                        statsGrid.insertBefore(survivalBox, statsGrid.children[2]);
                    }
                }
                const survivalPercent = (parseFloat(result.survivalProbability) * 100).toFixed(1);
                survivalBox.querySelector('.stat-value').textContent = survivalPercent + '%';
            }

            // CUSUM Alert
            if (result.cusumAlert) {
                let cusumBox = document.getElementById('cusum-alert-stat');
                if (!cusumBox) {
                    cusumBox = document.createElement('div');
                    cusumBox.className = 'stat-item';
                    cusumBox.id = 'cusum-alert-stat';
                    cusumBox.innerHTML = `
                        <div class="stat-label">CUSUM Status</div>
                        <div class="stat-value" style="color: var(--color-status-danger)">--</div>
                    `;
                    statsGrid.appendChild(cusumBox);
                }
                cusumBox.querySelector('.stat-value').textContent = result.cusumWarning || 'ALERT';
                cusumBox.style.display = 'block';
            } else {
                const cusumBox = document.getElementById('cusum-alert-stat');
                if (cusumBox) cusumBox.style.display = 'none';
            }
        }

        // === 6. ANALYSIS MESSAGE ===
        if (this.elements.analysisMessage) {
            const actionEmoji = {
                'STRONG BET': '🎯',
                'MODERATE BET': '✅',
                'CAUTIOUS BET': '⚠️',
                'SKIP ROUND': '🛑',
                'OBSERVE': '👁️'
            };
            
            const emoji = actionEmoji[result.action] || '';
            const fullMessage = emoji ? `${emoji} ${result.action}: ${result.message}` : result.message;
            
            this.elements.analysisMessage.textContent = fullMessage;
            
            let messageColor = 'var(--text-primary)';
            if (result.action === 'SKIP ROUND') {
                messageColor = 'var(--color-status-danger)';
            } else if (result.action === 'STRONG BET') {
                messageColor = 'var(--color-status-success)';
            }
            this.elements.analysisMessage.style.color = messageColor;
        }

        // 🔥 PHASE 1.3: Add pulsing animation for skip rounds
        if (this.elements.analysisMessage) {
            this.elements.analysisMessage.classList.remove('pulse-warning');
            if (result.action === 'SKIP ROUND' || result.confidence < 40) {
                this.elements.analysisMessage.classList.add('pulse-warning');
            }
        }

        this.setPredictButtonState('ready');
        
        console.log('✅ Prediction displayed and LOCKED');
    }

    getMultiplierClass(multiplier) {
        if (multiplier >= 10.0) return 'm-high';
        if (multiplier >= 2.0) return 'm-medium';
        if (multiplier >= 1.5) return 'm-moderate';
        return 'm-low';
    }

    renderNewRound(round) {
        if (!this.elements.recentGrid || this.cells.length === 0) return;
        
        this.updateLastCrashDisplay(round.finalMultiplier);

        const cellId = `center round-cell-${round.gameId}`;
        const multiplierClass = this.getMultiplierClass(round.finalMultiplier);
        const formattedMultiplier = round.finalMultiplier.toFixed(2);
        
        let existingCell = this.cells.find(c => c.id === cellId);
        if (existingCell) return;

        const oldestCell = this.cells.pop(); 
        oldestCell.id = cellId;
        oldestCell.textContent = formattedMultiplier;
        oldestCell.className = `multiplier-cell ${multiplierClass}`;
        
        this.elements.recentGrid.prepend(oldestCell);
        this.cells.unshift(oldestCell); 
        
        this.setPredictButtonState('ready'); 
    }

    /**
     * 🔥 FIXED: Only update market stats if NO active prediction
     * This prevents overwriting prediction display
     */
    updateStats(multipliers = []) {
        // 🔥 DON'T overwrite if prediction is active
        if (this.activePrediction) {
            console.log('⚠️ Skipping updateStats - prediction is active');
            return;
        }

        if (!Array.isArray(multipliers)) multipliers = [];

        const total = multipliers.length;
        const avg = this._calcAverage(multipliers);
        const volatility = this._calcStdDev(multipliers, avg);

        // Only update these if no prediction is showing
        if (this.elements.avgMultiplier) {
            this.elements.avgMultiplier.textContent = total ? avg.toFixed(2) + 'x' : '--';
        }
        if (this.elements.volatility) {
            this.elements.volatility.textContent = total ? volatility.toFixed(2) : '--';
        }
        
        console.log('📊 Market stats updated (no active prediction)');
    }

    updateRecentMultipliers(multipliers = []) {
        if (!Array.isArray(multipliers) || this.cells.length === 0) return;
        
        for (let i = 0; i < this.cells.length; i++) {
            const val = multipliers[i];
            if (Number.isFinite(val) && val > 0) {
                const cls = this.getMultiplierClass(val);
                this.cells[i].textContent = val.toFixed(2);
                this.cells[i].className = `multiplier-cell ${cls}`;
            } else {
                this.cells[i].textContent = '--';
                this.cells[i].className = 'multiplier-cell m-default';
            }
        }
    }

    displayPrediction(prediction) {
        this.renderPrediction(prediction);
    }

    showCrashedState(finalMultiplier) {
        this.updateLastCrashDisplay(finalMultiplier);

        if (this.elements.currentMultiplier) {
            const el = this.elements.currentMultiplier;
            // el.style.transition = 'transform 180ms ease, color 220ms ease';
            // el.style.transform = 'scale(1.08)';
            el.style.color = 'var(--color-danger)';
            setTimeout(() => {
                el.style.transform = '';
                el.style.color = 'var(--text-primary)';
            }, 350);
        }
    }

    updateRoundCounter(count) {
        if (this.elements.activeSessionsValue) {
            this.elements.activeSessionsValue.textContent = String(count);
        } else if (this.elements.totalPredictionsValue) {
            this.elements.totalPredictionsValue.textContent = String(count);
        }
    }

    updateMultiplier(multiplier) {
        this.updateLastCrashDisplay(multiplier);
    }

    _calcAverage(arr) {
        if (!arr || arr.length === 0) return 0;
        const sum = arr.reduce((s, v) => s + v, 0);
        return sum / arr.length;
    }

    _calcStdDev(arr, mean = null) {
        if (!arr || arr.length < 2) return 0;
        if (mean === null) mean = this._calcAverage(arr);
        const variance = arr.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / (arr.length - 1);
        return Math.sqrt(variance);
    }

    // 🔥 ADD THESE METHODS TO YOUR EXISTING UIController CLASS
    // Place them at the end, before the closing }

    /**
     * 🔥 NEW: Show reconnection overlay
     */
    showReconnectOverlay() {
        let overlay = document.getElementById('reconnect-overlay');
        
        if (!overlay) {
            // Create overlay if it doesn't exist
            overlay = document.createElement('div');
            overlay.id = 'reconnect-overlay';
            overlay.className = 'reconnect-modal';
            overlay.innerHTML = `
                <div class="spinner"></div>
                <div class="reconnect-message">Reconnecting to BC GAME...</div>
            `;
            document.body.appendChild(overlay);
        }
        
        // Apply modal-open to body for blur effect
        document.body.classList.add('modal-open');
        overlay.style.display = 'flex';
        
        console.log('🔄 Reconnect overlay shown');
    }

    /**
     * 🔥 NEW: Hide reconnection overlay
     */
    hideReconnectOverlay() {
        const overlay = document.getElementById('reconnect-overlay');
        
        if (overlay) {
            overlay.style.display = 'none';
            
            // Remove modal-open only if no other modals are open
            const otherModals = document.querySelectorAll('.app-modal');
            if (otherModals.length === 0) {
                document.body.classList.remove('modal-open');
            }
        }
        
        console.log('✅ Reconnect overlay hidden');
    }

    /**
     * 🔥 NEW: Update reconnection message
     */
    updateReconnectMessage(message) {
        const overlay = document.getElementById('reconnect-overlay');
        
        if (overlay) {
            const messageEl = overlay.querySelector('.reconnect-message');
            if (messageEl) {
                messageEl.textContent = message;
            }
        }
    }
}
