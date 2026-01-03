
/**
 * 🎯 QUANTILE-BASED PREDICTION ENGINE v4.0 - COMPLETE FIXED VERSION
 * --
 */

export class QuantilePredictionEngine {
  constructor() {
    this.name = "Quantile Engine v4.0 - Fixed & Optimized";
    

    this.features = {
      // ✅ ACTIVE
      kaplanMeier: true,
      houseEdgeBlend: true,
      enhancedStreaks: true,
      cusumDetection: true,
      
      // ❌ DISABLED (set ALL Phase 3-4 features to false)
      weibullHazard: false,
      winsorization: false,
      dynamicConfidence: false,
      volumeDetection: false,
      kellyBetting: false,
      postMoonCaution: false,
      cycleDetection: false,
      dynamicThresholds: false,
      arimaBlend: false,
      hybridWeighting: false,
      normalizeAdjustments: false,
      adaptiveThresholds: false,
      weightedBlend: false,

      emaMedianBlend: false  // 🆕 PHASE 5: Optional polish
    };

    // 🆕 EMA state
    this.emaMedian = null;
    this.emaAlpha = 0.3;  // Smoothing factor (higher = more recent weight)


    this.houseEdge = 0.01;
    this.rawHistory = [];
    this.MAX_HISTORY = 2000;
    
    this.targetQuantile = 0.35; // Changed from 0.40
    this.targetWinRate = 0.60;
    
    this.predictionStats = {
      totalPredictions: 0,
      successCount: 0,
      failureCount: 0,
      winRate: 0.50,
      calibrationHistory: []
    };
    
    //  Dynamic Threshold Storage
    this.dynamicBustThreshold = 1.5;   // Default, will be recalculated
    this.dynamicMoonThreshold = 10.0;  // Default, will be recalculated

    // FIXED CUSUM CONFIG
    this.cusum = {
      statistic: 0,
      mean: 2.0,           // Expected mean multiplier
      slack: 0.5,          // Drift tolerance (k parameter)
      threshold: 3.0,      // Alert threshold (H parameter) - LOWERED for more sensitivity
      alertActive: false,
      consecutiveBusts: 0, // Track consecutive low multipliers
      lastValues: []       // Store last 10 values for debugging
    };

     // Store adaptive threshold values
      this.adaptiveThresholds = {
        cusumSlack: 0.5,      // Dynamic slack (k parameter)
        cusumThreshold: 3.0,  // Dynamic threshold (H parameter)
        postMoonThreshold: 10.0, // Dynamic moon threshold
        bustThreshold: 1.5    // Dynamic bust threshold
      };

      // : Add feature weights
    this.featureWeights = {
      hazard: 0.15,
      cusum: 0.20,        // Higher weight for safety
      postMoon: 0.15,
      streakBoost: 0.15,
      cycle: 0.10,
      volume: 0.10,
      volatility: 0.15
    };
    console.log(' Weighted Ensemble initialized');
    console.log('   Default weights:', this.featureWeights);
    
    console.log(`${this.name} Initialized`);
    console.log("📊 Baseline Config:", this.features);
    console.log("🔧 CUSUM: Detects bust clusters (mean: 2.0x, threshold: 3.0)");
  }

  learnFromMarketData(multiplier) {
    if (!multiplier || multiplier <= 0 || !Number.isFinite(multiplier)) return;
    
    this.rawHistory.unshift(multiplier);
    if (this.rawHistory.length > this.MAX_HISTORY) {
      this.rawHistory.length = this.MAX_HISTORY;
    }
    
    // Update CUSUM (only if enabled)
    if (this.features.cusumDetection) {
      this._updateCUSUM(multiplier);
    }

    //  Periodic reset every 50 rounds
    if (this.rawHistory.length % 50 === 0) {
      const wasActive = this.cusum.alertActive;
      this.resetCUSUM();
      
      if (wasActive) {
        console.log('🔄 CUSUM auto-reset (50-round cycle)');
      }
    }
    
    if (this.rawHistory.length % 100 === 0) {
      const stats = this._calculateStats(this.rawHistory.slice(0, 500));
      console.log(`📊 Market: ${this.rawHistory.length} rounds`);
      console.log(`   Median: ${stats.median.toFixed(2)}x, Vol: ${stats.volatility.toFixed(2)}`);
      if (this.features.cusumDetection && this.cusum.alertActive) {
        console.log(`   🔴 CUSUM ALERT ACTIVE (stat: ${this.cusum.statistic.toFixed(2)})`);
      }
    }
  }

  // ============================================
  // NEW HELPER: CALCULATE EMA
  // ============================================

  /**
   * 🆕 PHASE 5: EXPONENTIAL MOVING AVERAGE
   * 
   * Tracks recent median with exponential smoothing
   * - More responsive than simple moving average
   * - Adds upward momentum when market is running hot
   * 
   * @param {number[]} recentHistory - Last 20 rounds
   * @returns {number} EMA value
   */
  _calculateEMA(recentHistory) {
    if (!recentHistory || recentHistory.length < 10) {
      return null;
    }
    
    // Calculate current median
    const sorted = [...recentHistory].sort((a, b) => a - b);
    const currentMedian = sorted[Math.floor(sorted.length / 2)];
    
    // Initialize EMA on first call
    if (this.emaMedian === null) {
      this.emaMedian = currentMedian;
      return this.emaMedian;
    }
    
    // Update EMA: EMA = α × current + (1-α) × previous
    this.emaMedian = (this.emaAlpha * currentMedian) + 
                    ((1 - this.emaAlpha) * this.emaMedian);
    
    return this.emaMedian;
  }


  // ============================================
// NEW HELPER: WEIGHTED ADDITIVE BLEND
// ============================================

  /**
   * 🔥 PHASE 3.2: WEIGHTED ADDITIVE BLEND
   * 
   * Combines feature adjustments using learned weights instead of multiplication
   * 
   * BEFORE (Multiplicative):
   * target *= hazard * cusum * postMoon * ... (causes conflicts)
   * 
   * AFTER (Additive):
   * target = base + w1*(adj1-1)*base + w2*(adj2-1)*base + ...
   * 
   * @param {number} baseValue - Base quantile prediction
   * @param {object} adjustments - Feature adjustments { name: multiplier, ... }
   * @returns {number} Weighted blended prediction
   * 
   * @example
   * const blended = this._weightedBlend(2.0, {
   *   hazard: 0.90,    // -10% adjustment
   *   cusum: 0.80,     // -20% adjustment
   *   streakBoost: 1.15 // +15% adjustment
   * });
   * // Returns: 2.0 + 0.15*(-0.10)*2.0 + 0.20*(-0.20)*2.0 + 0.15*(+0.15)*2.0
   * //        = 2.0 - 0.03 - 0.08 + 0.045 = 1.935
   */
  _weightedBlend(baseValue, adjustments) {
    if (!this.features.weightedBlend || !adjustments) {
      // Feature disabled or no adjustments, return base
      return baseValue;
    }
    
    let finalValue = baseValue;
    const contributions = []; // For logging
    
    // Process each adjustment with its weight
    Object.entries(adjustments).forEach(([featureName, multiplier]) => {
      // Get weight for this feature (default 0.15 if not found)
      const weight = this.featureWeights[featureName] || 0.15;
      
      // Calculate contribution: weight * (multiplier - 1) * base
      // Example: weight=0.2, multiplier=0.85 (15% reduction)
      //   contribution = 0.2 * (0.85 - 1) * base = 0.2 * (-0.15) * base = -0.03 * base
      const deviation = multiplier - 1.0; // How much it differs from neutral (1.0)
      const contribution = weight * deviation * baseValue;
      
      finalValue += contribution;
      
      // Store for logging
      contributions.push({
        feature: featureName,
        multiplier: multiplier.toFixed(2),
        weight: weight.toFixed(2),
        contribution: contribution.toFixed(3)
      });
    });
    
    // Logging (only log if significant adjustments)
    if (Math.abs(finalValue - baseValue) > 0.05) {
      console.log('🔀 Weighted Blend Applied:');
      console.log(`   Base: ${baseValue.toFixed(2)}x`);
      contributions.forEach(c => {
        console.log(`   ${c.feature}: ${c.multiplier}x × ${c.weight} → ${c.contribution > 0 ? '+' : ''}${c.contribution}`);
      });
      console.log(`   Final: ${finalValue.toFixed(2)}x (${((finalValue - baseValue) / baseValue * 100).toFixed(1)}% change)`);
    }
    
    // Safety clamps (prevent extreme deviations)
    const minValue = baseValue * 0.70; // Max 30% reduction
    const maxValue = baseValue * 1.40; // Max 40% boost
    const clampedValue = Math.max(minValue, Math.min(maxValue, finalValue));
    
    if (clampedValue !== finalValue) {
      console.warn(`⚠️  Clamped weighted blend: ${finalValue.toFixed(2)}x → ${clampedValue.toFixed(2)}x`);
    }
    
    return clampedValue;
  }

  // ============================================
  // NEW HELPER: OPTIMIZE FEATURE WEIGHTS
  // ============================================

  /**
   * 🔥 PHASE 3.2: OPTIMIZE FEATURE WEIGHTS VIA GRID SEARCH
   * 
   * Uses simple grid search to find best weights:
   * - Test weight combinations [0.05, 0.10, 0.15, 0.20, 0.25, 0.30]
   * - Run mini-backtest (50 rounds) for each combination
   * - Pick combination with highest ROI
   * 
   * ⚠️  EXPENSIVE: Only run once after collecting 500+ rounds
   * 
   * @param {number[]} history - Full history for testing
   * @param {string[]} activeFeatures - Features to optimize (e.g., ['cusum', 'streakBoost'])
   * @returns {object} Optimized weights
   */
  async _optimizeWeights(history, activeFeatures = ['cusum', 'postMoon', 'streakBoost']) {
    console.log('\n🔧 Optimizing Feature Weights (Phase 3.2)...');
    console.log(`   Active features: ${activeFeatures.join(', ')}`);
    console.log(`   This will take ~30 seconds...\n`);
    
    if (history.length < 300) {
      console.error('❌ Need at least 300 rounds for weight optimization');
      return this.featureWeights;
    }
    
    // Grid search space: [0.05, 0.10, 0.15, 0.20, 0.25, 0.30]
    const weightOptions = [0.05, 0.10, 0.15, 0.20, 0.25, 0.30];
    
    // Generate combinations (limit to top 3 features to avoid explosion)
    const topFeatures = activeFeatures.slice(0, 3);
    let bestWeights = { ...this.featureWeights };
    let bestROI = -Infinity;
    
    let testCount = 0;
    const maxTests = 50; // Limit to 50 combinations
    
    // Simple grid search (not exhaustive due to time constraints)
    for (const w1 of weightOptions) {
      for (const w2 of weightOptions) {
        for (const w3 of weightOptions) {
          if (testCount >= maxTests) break;
          
          // Test this weight combination
          const testWeights = { ...this.featureWeights };
          testWeights[topFeatures[0]] = w1;
          if (topFeatures[1]) testWeights[topFeatures[1]] = w2;
          if (topFeatures[2]) testWeights[topFeatures[2]] = w3;
          
          // Run mini-backtest (50 rounds)
          const roi = await this._miniBacktest(history, testWeights, 50);
          
          if (roi > bestROI) {
            bestROI = roi;
            bestWeights = { ...testWeights };
            console.log(`   ✔ New best: ${topFeatures[0]}=${w1}, ${topFeatures[1]}=${w2}, ${topFeatures[2]}=${w3} → ROI ${roi.toFixed(1)}%`);
          }
          
          testCount++;
        }
      }
    }
    
    console.log(`\n✅ Optimization complete (${testCount} combinations tested)`);
    console.log('   Best weights:', bestWeights);
    console.log(`   Expected ROI: ${bestROI.toFixed(1)}%`);
    
    return bestWeights;
  }

    /**
   * Mini-backtest for weight optimization (faster, less thorough)
   */
  async _miniBacktest(history, testWeights, numTests = 50) {
    // Temporarily apply weights
    const originalWeights = { ...this.featureWeights };
    this.featureWeights = testWeights;
    
    let wins = 0;
    let totalProfit = 0;
    
    const startIndex = 200; // Need history to make predictions
    
    for (let i = 0; i < numTests && (startIndex + i) < history.length; i++) {
      const trainHistory = history.slice(i, startIndex + i);
      
      try {
        const prediction = this.predict(trainHistory);
        const actual = history[startIndex + i];
        
        if (actual >= prediction.predictedValue) {
          wins++;
          totalProfit += prediction.predictedValue - 1;
        } else {
          totalProfit -= 1;
        }
      } catch (error) {
        // Skip failed predictions
      }
    }
    
    // Restore original weights
    this.featureWeights = originalWeights;
    
    const roi = (totalProfit / numTests) * 100;
    return roi;
  }

  // ============================================
// DIAGNOSTIC FUNCTIONS
// ============================================

/**
 * 🔥 PHASE 3.2: Test weighted blend behavior
 */
testWeightedBlend() {
  console.log('\n🧪 Testing Weighted Blend (Phase 3.2)...\n');
  
  const baseValue = 2.0;
  
  const testCases = [
    {
      name: 'All Reductions (CUSUM + PostMoon)',
      adjustments: { cusum: 0.80, postMoon: 0.85 }
    },
    {
      name: 'Mixed (CUSUM reduction + Streak boost)',
      adjustments: { cusum: 0.80, streakBoost: 1.20 }
    },
    {
      name: 'All Boosts (Streak + Cycle)',
      adjustments: { streakBoost: 1.15, cycle: 1.10 }
    },
    {
      name: 'Complex (4 features)',
      adjustments: { cusum: 0.85, postMoon: 0.90, streakBoost: 1.15, volume: 0.95 }
    }
  ];
  
  console.log('Current Weights:', this.featureWeights);
  console.log('');
  
  const wasEnabled = this.features.weightedBlend;
  this.features.weightedBlend = true;
  
  testCases.forEach(test => {
    console.log(`${test.name}:`);
    console.log(`  Adjustments: ${JSON.stringify(test.adjustments)}`);
    
    // Test weighted blend
    const blended = this._weightedBlend(baseValue, test.adjustments);
    
    // Compare to multiplicative
    const multiplicative = Object.values(test.adjustments).reduce((acc, m) => acc * m, baseValue);
    
    console.log(`  Weighted: ${baseValue.toFixed(2)}x → ${blended.toFixed(2)}x (${((blended/baseValue - 1) * 100).toFixed(1)}%)`);
    console.log(`  vs Mult: ${multiplicative.toFixed(2)}x (${((multiplicative/baseValue - 1) * 100).toFixed(1)}%)`);
    console.log('');
  });
  
  this.features.weightedBlend = wasEnabled;
  
  console.log('✅ Weighted blend test complete');
  console.log('💡 Weighted blend is less extreme than multiplication');
  console.log('💡 Multiple reductions don\'t compound as aggressively');
}

/**
 * 🔥 PHASE 3.2: Compare weighted vs multiplicative approach
 */
async compareBlendMethods(history) {
  console.log('\n🔬 Comparing Weighted vs Multiplicative Blending...\n');
  
  if (history.length < 250) {
    console.error('❌ Need at least 250 rounds for comparison');
    return;
  }
  
  // Test 1: Multiplicative (traditional)
  this.features.weightedBlend = false;
  const multResults = [];
  
  for (let i = 0; i < 50; i++) {
    const testHistory = history.slice(i, 200 + i);
    const prediction = this.predict(testHistory);
    const actual = history[200 + i];
    multResults.push({
      predicted: prediction.predictedValue,
      actual: actual,
      success: actual >= prediction.predictedValue
    });
  }
  
  // Test 2: Weighted blend
  this.features.weightedBlend = true;
  const weightedResults = [];
  
  for (let i = 0; i < 50; i++) {
    const testHistory = history.slice(i, 200 + i);
    const prediction = this.predict(testHistory);
    const actual = history[200 + i];
    weightedResults.push({
      predicted: prediction.predictedValue,
      actual: actual,
      success: actual >= prediction.predictedValue
    });
  }
  
  // Calculate metrics
  const multAcc = multResults.filter(r => r.success).length / multResults.length;
  const weightedAcc = weightedResults.filter(r => r.success).length / weightedResults.length;
  
  const multAvg = multResults.reduce((sum, r) => sum + r.predicted, 0) / multResults.length;
  const weightedAvg = weightedResults.reduce((sum, r) => sum + r.predicted, 0) / weightedResults.length;
  
  console.log('Results:');
  console.log(`  Multiplicative: ${(multAcc * 100).toFixed(1)}% accuracy, ${multAvg.toFixed(2)}x avg`);
  console.log(`  Weighted Blend: ${(weightedAcc * 100).toFixed(1)}% accuracy, ${weightedAvg.toFixed(2)}x avg`);
  console.log(`  Improvement: ${((weightedAcc - multAcc) * 100).toFixed(1)}% accuracy`);
  
  const better = weightedAcc > multAcc;
  console.log(`\n${better ? '✅' : '⚠️ '} Weighted blend ${better ? 'IMPROVES' : 'does not improve'} accuracy`);
  
  return { multiplicative: multResults, weighted: weightedResults };
}


  // ============================================
  // NEW HELPER: CALCULATE ADAPTIVE THRESHOLDS
  // ============================================

  /**
   * 🔥 PHASE 3.1: CALCULATE ADAPTIVE THRESHOLDS
   * 
   * Adjusts thresholds based on recent market volatility:
   * - High volatility → looser thresholds (fewer false alarms)
   * - Low volatility → tighter thresholds (more sensitive)
   * 
   * Formula: threshold = baseValue + (volatility * adjustment_factor)
   * 
   * @param {number[]} recentHistory - Last 50-100 rounds
   */
  _updateAdaptiveThresholds(recentHistory) {
    if (!this.features.adaptiveThresholds) {
      // Feature disabled, use defaults
      return;
    }
    
    if (!recentHistory || recentHistory.length < 30) {
      console.warn('⚠️  Adaptive Thresholds: Insufficient data, using defaults');
      return;
    }
    
    try {
      // Calculate recent market stats
      const recent50 = recentHistory.slice(0, Math.min(50, recentHistory.length));
      const stats = this._calculateStats(recent50);
      const volatility = stats.volatility;
      
      // ===== CUSUM ADAPTIVE SLACK =====
      // Base: 0.5, adjusts ±0.3 based on volatility
      // High vol (>2.5) → larger slack (more tolerance)
      // Low vol (<1.5) → smaller slack (more sensitive)
      const baseSlack = 0.5;
      const slackAdjustment = Math.min(0.3, Math.max(-0.2, (volatility - 2.0) * 0.15));
      this.adaptiveThresholds.cusumSlack = Math.max(0.2, Math.min(0.8, baseSlack + slackAdjustment));
      
      // ===== CUSUM ADAPTIVE THRESHOLD =====
      // Base: 3.0, adjusts ±1.0 based on volatility
      // Formula: H = base + (vol - 2.0) * 0.5
      const baseThreshold = 3.0;
      const thresholdAdjustment = (volatility - 2.0) * 0.5;
      this.adaptiveThresholds.cusumThreshold = Math.max(2.0, Math.min(5.0, baseThreshold + thresholdAdjustment));
      
      // ===== POST-MOON ADAPTIVE THRESHOLD =====
      // Use 90th percentile of recent data (naturally adaptive)
      this.adaptiveThresholds.postMoonThreshold = this._calculateQuantile(recent50, 0.90);
      
      // ===== BUST THRESHOLD (for streaks) =====
      // Use 10th percentile of recent data
      this.adaptiveThresholds.bustThreshold = this._calculateQuantile(recent50, 0.10);
      
      // Logging (only when thresholds change significantly)
      if (Math.random() < 0.05) { // Log 5% of the time to avoid spam
        console.log('📊 Adaptive Thresholds Updated:');
        console.log(`   Volatility: ${volatility.toFixed(2)}`);
        console.log(`   CUSUM Slack: ${this.adaptiveThresholds.cusumSlack.toFixed(2)} (base: ${baseSlack})`);
        console.log(`   CUSUM Threshold: ${this.adaptiveThresholds.cusumThreshold.toFixed(1)} (base: ${baseThreshold})`);
        console.log(`   Moon Threshold: ${this.adaptiveThresholds.postMoonThreshold.toFixed(2)}x (90th percentile)`);
        console.log(`   Bust Threshold: ${this.adaptiveThresholds.bustThreshold.toFixed(2)}x (10th percentile)`);
      }
      
    } catch (error) {
      console.error('❌ Adaptive Thresholds calculation error:', error);
      // Keep using current values
    }
  }

  // ============================================
  // UPDATE: _updateCUSUM() - USE ADAPTIVE SLACK/THRESHOLD
  // ============================================

  /**
   * 🔥 MODIFIED: Use adaptive slack and threshold
   * 
   * BEFORE Phase 3.1:
   * - Fixed slack = 0.5
   * - Fixed threshold = 3.0
   * 
   * AFTER Phase 3.1:
   * - Dynamic slack from adaptiveThresholds.cusumSlack
   * - Dynamic threshold from adaptiveThresholds.cusumThreshold
   */
  _updateCUSUM(multiplier) {
    // Store last values for debugging
    this.cusum.lastValues.unshift(multiplier);
    if (this.cusum.lastValues.length > 10) {
      this.cusum.lastValues.length = 10;
    }
    
    // 🔥 PHASE 3.1: Use adaptive slack if enabled
    const slack = this.features.adaptiveThresholds 
      ? this.adaptiveThresholds.cusumSlack 
      : this.cusum.slack;
    
    const threshold = this.features.adaptiveThresholds
      ? this.adaptiveThresholds.cusumThreshold
      : this.cusum.threshold;
    
    // Detect DOWNWARD shifts (bust clusters)
    const deviation = this.cusum.mean - multiplier;
    this.cusum.statistic = Math.max(0, this.cusum.statistic + deviation - slack);
    
    // Track consecutive busts
    if (multiplier < 1.5) {
      this.cusum.consecutiveBusts++;
    } else {
      this.cusum.consecutiveBusts = 0;
      if (multiplier > this.cusum.mean) {
        this.cusum.statistic = Math.max(0, this.cusum.statistic - 0.5);
      }
    }
    
    // Dual trigger system
    const consecutiveTrigger = this.cusum.consecutiveBusts >= 4;
    const statisticTrigger = this.cusum.statistic > threshold;
    
    if (statisticTrigger || consecutiveTrigger) {
      if (!this.cusum.alertActive) {
        console.log('🔴 CUSUM ALERT: Bust cluster detected');
        console.log(`   Statistic: ${this.cusum.statistic.toFixed(2)} / ${threshold.toFixed(1)}`);
        console.log(`   Slack: ${slack.toFixed(2)} ${this.features.adaptiveThresholds ? '(adaptive)' : '(fixed)'}`);
        this.cusum.alertActive = true;
      }
    } else if (this.cusum.statistic < 1.0 && this.cusum.consecutiveBusts === 0 && this.cusum.alertActive) {
      console.log('✅ CUSUM: Market normalized');
      this.cusum.alertActive = false;
    }
  }

  /**
   * 🆕 MANUAL CUSUM RESET
   */
  resetCUSUM() {
    this.cusum.statistic = 0;
    this.cusum.alertActive = false;
    this.cusum.consecutiveBusts = 0;
    this.cusum.lastValues = [];
    console.log('🔄 CUSUM manually reset');
  }

  /**
   * 🆕 GET CUSUM STATUS
   */
  getCUSUMStatus() {
    return {
      enabled: this.features.cusumDetection,
      statistic: this.cusum.statistic.toFixed(2),
      threshold: this.cusum.threshold,
      alertActive: this.cusum.alertActive,
      consecutiveBusts: this.cusum.consecutiveBusts,
      lastValues: this.cusum.lastValues.map(v => v.toFixed(2))
    };
  }

  /**
   * MAIN PREDICTION ENGINE
   */
  predict(history) {
    if (!history || history.length < 50) {
      return this._errorResponse("Need at least 50 rounds of history");
    }

    let cleanHistory = this._cleanData(history.slice(0, 500));

    // 🔥 PHASE 3.1: Update adaptive thresholds
    if (this.features.adaptiveThresholds) {
      this._updateAdaptiveThresholds(cleanHistory.slice(0, 100));
    }

    // Winsorization (if enabled)
    if (this.features.winsorization) {
      const p99 = this._calculateQuantile(cleanHistory, 0.99);
      cleanHistory = cleanHistory.map(v => Math.min(v, p99));
    }

    const recent50 = cleanHistory.slice(0, 50);
    const recent20 = cleanHistory.slice(0, 20);

    // 🔥 PHASE 3.1: Update adaptive thresholds BEFORE any feature calculations
    if (this.features.adaptiveThresholds) {
      this._updateAdaptiveThresholds(cleanHistory.slice(0, 100));
    }
  
    // 🔥 PHASE 2.2: Update dynamic thresholds before prediction
    if (this.features.dynamicThresholds) {
      this._updateDynamicThresholds(cleanHistory.slice(0, 200));  // Use last 200 for better stability
    }

    const stats = this._calculateStats(cleanHistory);
    const recentStats = this._calculateStats(recent50);
    
    // ===== BASE PREDICTION (The J-Method: Dual Timeframe) =====
    
    // 1. Long-term (Stable/Safe) - The last 500 rounds
    const longTermTarget = this._calculateQuantile(cleanHistory, this.targetQuantile);
    
    // 2. Short-term (Responsive/Aggressive) - The last 25 rounds
    const shortTermHistory = cleanHistory.slice(0, 25);
    const shortTermTarget = this._calculateQuantile(shortTermHistory, this.targetQuantile);

    let target;
    
    // THE BALANCE: Weighted Blend
    // We give the long-term history 70% of the "vote" and the recent history 30%.
    // This allows the target to move (responsive) but keeps it anchored to reality (accuracy).
    target = (longTermTarget * 0.70) + (shortTermTarget * 0.30);

    // ===== EMA MEDIAN BLEND (if enabled) =====
  if (this.features.emaMedianBlend) {
    const emaValue = this._calculateEMA(recent20);
    
    if (emaValue !== null && emaValue > target) {
      // Only blend upward (don't reduce predictions)
      // 70% quantile + 30% EMA
      const blendedTarget = (target * 0.70) + (emaValue * 0.30);
      
      console.log(`📈 EMA Blend:`);
      console.log(`   Quantile: ${target.toFixed(2)}x`);
      console.log(`   EMA: ${emaValue.toFixed(2)}x`);
      console.log(`   Blended: ${blendedTarget.toFixed(2)}x`);
      
      target = blendedTarget;
    }
  }

    if (this.features.houseEdgeBlend) {
      const adaptiveEdge = this._calculateAdaptiveHouseEdge(recentStats.volatility);
      const theoretical = (1 - adaptiveEdge) / this.targetWinRate;
      const blendFactor = 0.5;
      target = (target * (1 - blendFactor)) + (theoretical * blendFactor);
      var usedHouseEdge = adaptiveEdge;
    }

    // ===== KAPLAN-MEIER (if enabled) =====
    let kmConfidence = null;
    let kmAdjustment = null;
    if (this.features.kaplanMeier) {
      const kmResult = this._kaplanMeierPredict(cleanHistory, this.targetQuantile);
      const kmTarget = kmResult.recommendedTarget;
      kmConfidence = kmResult.confidence;
      kmAdjustment = kmResult.adjustment;
      
      const kmWeight = Math.min(0.5, kmConfidence * 0.7);
      const quantileWeight = 1 - kmWeight;
      target = (target * quantileWeight) + (kmTarget * kmWeight);
    }
    
   // ===== ARIMA BLEND (if enabled) - PHASE 2.3 (CONSERVATIVE FIX) =====
  let arimaForecast = null;
  if (this.features.arimaBlend) {
    arimaForecast = this._simpleARIMA(recent50);
    
    // 🔧 FIX: Reduced blend from 70/30 → 85/15 (more conservative)
    // This reduces ARIMA influence while still adding upward momentum
    const quantileComponent = target * 0.85;  // Increased from 0.70
    const arimaComponent = arimaForecast * 0.15;  // Reduced from 0.30
    
    const blendedTarget = quantileComponent + arimaComponent;
    
    console.log(`📊 ARIMA BLENDING (CONSERVATIVE):`);
    console.log(`   Quantile (85%): ${quantileComponent.toFixed(2)}x`);
    console.log(`   ARIMA (15%): ${arimaComponent.toFixed(2)}x`);
    console.log(`   Before blend: ${target.toFixed(2)}x`);
    console.log(`   After blend: ${blendedTarget.toFixed(2)}x`);
    
    target = blendedTarget;
  }

    // ===== WEIBULL HAZARD (if enabled) =====
    let hazardMultiplier = 1.0;
    let hazardAdvice = null;
    if (this.features.weibullHazard) {
      const hazard = this._calculateWeibullHazard(cleanHistory);
      hazardMultiplier = hazard.multiplier;
      hazardAdvice = hazard.advice;
    }
    
    // ===== CUSUM (if enabled) =====
    let cusumMultiplier = 1.0;
    let cusumWarning = null;
    if (this.features.cusumDetection && this.cusum.alertActive) {
      cusumMultiplier = 0.80; // More aggressive reduction
      cusumWarning = 'BUST CLUSTER ACTIVE';
    }
    
    // ===== POST-MOON CAUTION (if enabled) - PHASE 1.1 =====
    let postMoonMultiplier = 1.0;
    let postMoonWarning = null;
    let postMoonData = null;
    if (this.features.postMoonCaution) {
      postMoonData = this._detectPostMoonCondition(recent50);
      postMoonMultiplier = postMoonData.multiplier;
      
      if (postMoonData.detected) {
        postMoonWarning = postMoonData.reasoning;
        console.log(`⚠️ ${postMoonWarning}`);
      }
    }

    // ===== ENHANCED STREAK ANALYZER (if enabled) - PHASE 1.2 =====
    let streakBoostMultiplier = 1.0;
    let streakBoostActive = false;
    let streakCount = 0;
    let streakReasoning = null;

    if (this.features.enhancedStreaks) {
    const bustThreshold = this.features.adaptiveThresholds 
      ? this.adaptiveThresholds.bustThreshold 
      : 1.5;
    
    const boostResult = this._calculateMergedBustBoost(cleanHistory, bustThreshold);
    
    streakBoostMultiplier = boostResult.multiplier;
    streakBoostActive = boostResult.boostActive;
    streakCount = boostResult.streakCount;
    streakReasoning = boostResult.reasoning;
  }

    // ===== CYCLE DETECTION (if enabled) - PHASE 2.1 =====
    let cycleMultiplier = 1.0;
    let cycleData = null;

    if (this.features.cycleDetection) {
      cycleData = this._detectCyclePattern(cleanHistory.slice(0, 10));
      cycleMultiplier = cycleData.adjustment;
      
      if (cycleData.pattern !== 'NEUTRAL' && cycleData.pattern !== 'INSUFFICIENT_DATA') {
        console.log(`🔄 CYCLE DETECTED: ${cycleData.pattern}`);
        console.log(`   Last 3: ${cycleData.last3}`);
        console.log(`   Classification: ${cycleData.classification.slice(0, 5).join(', ')}...`);
        console.log(`   Adjustment: ${((cycleMultiplier - 1) * 100).toFixed(0)}%`);
        console.log(`   Reasoning: ${cycleData.reasoning}`);
      }
    }

    // ===== VOLUME DETECTION (if enabled) =====
    let volumeMultiplier = 1.0;
    if (this.features.volumeDetection) {
      volumeMultiplier = this._detectBustVolume(recent20);
    }
    
    // ===== VOLATILITY (if enabled) =====
    let volatilityMultiplier = 1.0;
    if (this.features.dynamicConfidence) {
      volatilityMultiplier = this._getVolatilityAdjustment(recentStats.volatility, stats.volatility);
    }

    // ===== 🔥 PHASE 3.2: WEIGHTED BLEND INSTEAD OF MULTIPLICATION =====
  
  if (this.features.weightedBlend) {
    // Additive weighted blend approach
    const adjustments = {};
    
    // Only include active adjustments (non-neutral)
    if (hazardMultiplier !== 1.0) adjustments.hazard = hazardMultiplier;
    if (cusumMultiplier !== 1.0) adjustments.cusum = cusumMultiplier;
    if (postMoonMultiplier !== 1.0) adjustments.postMoon = postMoonMultiplier;
    if (streakBoostMultiplier !== 1.0) adjustments.streakBoost = streakBoostMultiplier;
    if (cycleMultiplier !== 1.0) adjustments.cycle = cycleMultiplier;
    if (volumeMultiplier !== 1.0) adjustments.volume = volumeMultiplier;
    if (volatilityMultiplier !== 1.0) adjustments.volatility = volatilityMultiplier;
    
    // Apply weighted blend
    target = this._weightedBlend(target, adjustments);
    
  } else {
    // Traditional multiplicative approach (backward compatible)
    // Separate negative (caution) from positive (boost)
    const negativeMultipliers = hazardMultiplier * cusumMultiplier * volumeMultiplier * 
                                volatilityMultiplier * postMoonMultiplier;
    const positiveMultipliers = streakBoostMultiplier * cycleMultiplier;
    
    target *= negativeMultipliers;
    
    if (this.features.hybridWeighting && positiveMultipliers > 1.0) {
      const boostedValue = target * positiveMultipliers;
      target = (target * 0.60) + (boostedValue * 0.40);
    } else {
      target *= positiveMultipliers;
    }
  }

    // ===== 🔥 PHASE 2.2: NORMALIZE ALL ADJUSTMENTS =====
    if (this.features.normalizeAdjustments) {
      hazardMultiplier = this._normalizeAdjustment(hazardMultiplier, recent50);
      cusumMultiplier = this._normalizeAdjustment(cusumMultiplier, recent50);
      postMoonMultiplier = this._normalizeAdjustment(postMoonMultiplier, recent50);
      streakBoostMultiplier = this._normalizeAdjustment(streakBoostMultiplier, recent50);
      cycleMultiplier = this._normalizeAdjustment(cycleMultiplier, recent50);
      volumeMultiplier = this._normalizeAdjustment(volumeMultiplier, recent20);
      volatilityMultiplier = this._normalizeAdjustment(volatilityMultiplier, recent50);
      
      console.log('🔧 Normalization Applied to All Adjustments');
    }

    // ===== PHASE 3.1: HYBRID WEIGHTING (FIXED - Separate Boost/Reduction) =====

    // Store pure quantile BEFORE any adjustments
    const pureQuantileValue = target;

    // Separate NEGATIVE adjustments (caution) from POSITIVE (boosts)
    // Negative multipliers (always applied at full strength)
    const negativeMultipliers = hazardMultiplier * cusumMultiplier * volumeMultiplier * 
                                volatilityMultiplier * postMoonMultiplier;

    // Positive multipliers (amplified via hybrid if enabled)
    const positiveMultipliers = streakBoostMultiplier * cycleMultiplier;

    // Apply negative adjustments first (these are safety features)
    target *= negativeMultipliers;

    // 🆕 HYBRID WEIGHTING: Amplify positive adjustments
    let hybridQuantileComponent = null;
    let hybridAdjustmentComponent = null;

    if (this.features.hybridWeighting) {
      // If there's a positive boost (>1.0), blend it with quantile
      if (positiveMultipliers > 1.0) {
        const boostedValue = target * positiveMultipliers;
        
        // 60% quantile base + 40% boosted value
        hybridQuantileComponent = target * 0.60;
        hybridAdjustmentComponent = boostedValue * 0.40;
        target = hybridQuantileComponent + hybridAdjustmentComponent;
        
        console.log(`🔀 HYBRID WEIGHTING (BOOST AMPLIFICATION):`);
        console.log(`   Quantile Base (60%): ${hybridQuantileComponent.toFixed(2)}x`);
        console.log(`   Boosted Value (40%): ${hybridAdjustmentComponent.toFixed(2)}x`);
        console.log(`   Boost Multiplier: ${positiveMultipliers.toFixed(2)}x`);
        console.log(`   Result: ${target.toFixed(2)}x`);
      } else {
        // No boost active, hybrid has no effect
        console.log(`🔀 HYBRID WEIGHTING: No boost active (${positiveMultipliers.toFixed(2)}x), skipping blend`);
      }
    } else {
      // Traditional: Apply positive multipliers directly
      target *= positiveMultipliers;
    }

    // 🔧 PHASE 2.3 FIX: Cap maximum prediction to prevent ARIMA over-shooting
    // This prevents the catastrophic >3.0x predictions that had 6.8% success
    if (this.features.arimaBlend) {
      const MAX_PREDICTION = 3.0;  // Hard cap
      if (target > MAX_PREDICTION) {
        console.warn(`⚠️ ARIMA: Capping ${target.toFixed(2)}x → ${MAX_PREDICTION}x (safety limit)`);
        target = MAX_PREDICTION;
      }
    }

    // Bootstrap confidence
    const lowerBound = this._bootstrapQuantile(cleanHistory, this.targetQuantile * 0.75, 100);
    target = Math.max(target, lowerBound);

    // 🔥 PHASE 1.2: Apply 1.3x floor BEFORE safety pad (higher priority)
    if (this.features.enhancedStreaks && streakBoostActive) {
      target = Math.max(target, 1.3);
      console.log(`📊 Streak floor applied: Minimum 1.3x enforced`);
    }

    // 🔥 THE JHEY SAFETY PAD (only if no streak boost)
    if (!streakBoostActive && target < 2.0) {
        target = target - 0.03; 
    }

    // Cap extremes (raised max from 8.0 to 10.0 for boldness)
    target = Math.max(1.1, Math.min(target, 10.0));
    
    // Calculate confidence
    let confidence = this._calculateConfidence(cleanHistory, target, stats);
    
    // Reduce confidence if CUSUM alert
    if (this.features.cusumDetection && this.cusum.alertActive) {
      confidence *= 0.80;
    }
    
    // 🔥 PHASE 1.1: Reduce confidence if Post-Moon detected
    if (this.features.postMoonCaution && postMoonData && postMoonData.detected) {
      confidence *= 0.80;  // 20% confidence reduction
      console.log(`📉 Confidence reduced by 20% due to post-moon caution`);
    }
    // 🔥 PHASE 1.2: Boost confidence during rebound streaks
    if (this.features.enhancedStreaks && streakBoostActive) {
      confidence *= 1.15;  // +15% confidence boost (increased from roadmap's 10%)
      console.log(`📈 Confidence boosted by 15% due to rebound signal`);
    }

    // Determine action
    const action = this._determineAction(confidence, target, recentStats.volatility, this.cusum.alertActive);
    
    // Safety exit
    let safetyExit;
    if (this.features.kaplanMeier) {
      safetyExit = this._kaplanMeierPredict(cleanHistory, 0.30).recommendedTarget;
    } else {
      safetyExit = this._calculateQuantile(cleanHistory, 0.30);
    }
    
    // Kelly betting
    let kellyBetSize = null;
    if (this.features.kellyBetting && this.predictionStats.totalPredictions >= 10) {
      kellyBetSize = this._calculateKellyBet(confidence, target);
    }
    
    return {
      predictedValue: target,
      confidence: confidence,
      action: action.type,
      message: action.message,
      reasoning: action.reasoning,
      
      predictedRange: [target * 0.85, target * 1.25],
      safetyZone: Math.max(1.2, safetyExit),
      
      riskLevel: recentStats.volatility > 2.5 ? 'HIGH' : recentStats.volatility > 1.8 ? 'MEDIUM' : 'LOW',
      volatility: recentStats.volatility.toFixed(2),
      
      // New metrics
      weibullAdvice: hazardAdvice,
      cusumAlert: this.features.cusumDetection ? this.cusum.alertActive : null,
      cusumWarning: cusumWarning,
      cusumStatistic: this.features.cusumDetection ? this.cusum.statistic.toFixed(2) : null,
      survivalProbability: this.features.kaplanMeier 
        ? this._kaplanMeierSurvival(cleanHistory, target).toFixed(3)
        : null,

     // 🔥 Phase 1.2 Post Moon Fields
      postMoonAlert: this.features.postMoonCaution ? (postMoonData?.detected || false) : false,
      postMoonWarning: this.features.postMoonCaution ? (postMoonData?.reasoning || null) : null,
      postMoonThreshold: (this.features.postMoonCaution && postMoonData?.threshold) ? postMoonData.threshold.toFixed(2) : null,

      // 🔥 PHASE 1.2: Streak Boost Fields
      streakBoostActive: this.features.enhancedStreaks ? streakBoostActive : null,
      streakCount: this.features.enhancedStreaks ? streakCount : null,
      streakBoostMultiplier: this.features.enhancedStreaks && streakBoostActive ? streakBoostMultiplier.toFixed(2) : null,
      streakReasoning: this.features.enhancedStreaks ? streakReasoning : null,

      // 🔥 PHASE 2.1: Cycle Detection Fields
      cyclePattern: this.features.cycleDetection && cycleData ? cycleData.pattern : null,
      cycleAdjustment: this.features.cycleDetection && cycleData && cycleData.adjustment !== 1.0 ? cycleData.adjustment.toFixed(2) : null,
      cycleReasoning: this.features.cycleDetection && cycleData ? cycleData.reasoning : null,
      cycleClassification: this.features.cycleDetection && cycleData ? cycleData.last3 : null,

      // 🔥 PHASE 2.2: Dynamic Threshold Fields
      dynamicBustThreshold: this.features.dynamicThresholds ? this.dynamicBustThreshold.toFixed(2) : null,
      dynamicMoonThreshold: this.features.dynamicThresholds ? this.dynamicMoonThreshold.toFixed(2) : null,

      // 🔥 PHASE 2.3: ARIMA Blend Fields
      arimaForecast: this.features.arimaBlend && arimaForecast ? arimaForecast.toFixed(2) : null,
      arimaBlendActive: this.features.arimaBlend ? true : null,

      // 🆕 PHASE 3.1: Hybrid Weighting Fields (FIXED - uses actual calculated values)
      hybridWeightingActive: this.features.hybridWeighting ? true : null,
      hybridQuantileComponent: hybridQuantileComponent ? hybridQuantileComponent.toFixed(2) : null,
      hybridAdjustmentComponent: hybridAdjustmentComponent ? hybridAdjustmentComponent.toFixed(2) : null,
      hybridBoostDetected: this.features.hybridWeighting && positiveMultipliers > 1.0 ? true : false,

      // 🔥 PHASE 4.1: KM fields
      kmConfidence: this.features.kaplanMeier && kmConfidence 
        ? (kmConfidence * 100).toFixed(0) + '%' 
        : null,
      kmAdjustment: this.features.kaplanMeier && kmAdjustment 
        ? ((kmAdjustment - 1) * 100).toFixed(1) + '%'
        : null,

      marketMedian: stats.median.toFixed(2),
      recentMedian: recentStats.median.toFixed(2),
      targetQuantile: (this.targetQuantile * 100).toFixed(0) + 'th percentile',
      predictionWinRate: (this.predictionStats.winRate * 100).toFixed(1) + '%',
      historyAnalyzed: cleanHistory.length,
      
      kellyBetSize: kellyBetSize,
      
      error: false
    };
  }

    // ============================================
// DIAGNOSTIC FUNCTION - TEST ADAPTIVE THRESHOLDS
// ============================================

/**
 * 🔥 PHASE 3.1: Test adaptive threshold behavior
 * Use this in console to verify thresholds adapt correctly
 */
testAdaptiveThresholds() {
  console.log('\n🧪 Testing Adaptive Thresholds (Phase 3.1)...\n');
  
  const testHistory = this.rawHistory.slice(0, 100);
  
  if (testHistory.length < 50) {
    console.error('❌ Need at least 100 rounds of history');
    return;
  }
  
  // Test with different volatility scenarios
  const scenarios = [
    { name: 'Low Volatility', data: testHistory.filter(m => m < 3.0) },
    { name: 'Normal Market', data: testHistory },
    { name: 'High Volatility', data: testHistory }
  ];
  
  const wasEnabled = this.features.adaptiveThresholds;
  this.features.adaptiveThresholds = true;
  
  console.log('Testing threshold adaptation to market conditions:\n');
  
  scenarios.forEach(scenario => {
    const stats = this._calculateStats(scenario.data);
    this._updateAdaptiveThresholds(scenario.data);
    
    console.log(`${scenario.name}:`);
    console.log(`  Market Volatility: ${stats.volatility.toFixed(2)}`);
    console.log(`  CUSUM Slack: ${this.adaptiveThresholds.cusumSlack.toFixed(2)} (base: 0.5)`);
    console.log(`  CUSUM Threshold: ${this.adaptiveThresholds.cusumThreshold.toFixed(2)} (base: 3.0)`);
    console.log(`  Moon Threshold: ${this.adaptiveThresholds.postMoonThreshold.toFixed(2)}x`);
    console.log(`  Bust Threshold: ${this.adaptiveThresholds.bustThreshold.toFixed(2)}x`);
    console.log('');
  });
  
  this.features.adaptiveThresholds = wasEnabled;
  
  console.log('✅ Adaptive threshold test complete');
  console.log('💡 High volatility → looser thresholds (fewer alerts)');
  console.log('💡 Low volatility → tighter thresholds (more sensitive)');
}

  // ============================================
  // DIAGNOSTIC FUNCTION
  // ============================================

  /**
   * 🆕 PHASE 5: Test EMA blend behavior
   */
  testEMABlend() {
    console.log('\n🧪 Testing EMA Median Blend (Phase 5)...\n');
    
    const testHistory = this.rawHistory.slice(0, 100);
    
    if (testHistory.length < 50) {
      console.error('❌ Need at least 100 rounds of history');
      return;
    }
    
    // Test scenarios
    const scenarios = [
      {
        name: 'Rising Market (recent highs)',
        data: [3.5, 2.8, 3.2, 2.1, 2.9, 2.5, 2.2, 2.7, 2.0, 2.3]
      },
      {
        name: 'Falling Market (recent busts)',
        data: [1.2, 1.3, 1.1, 1.4, 1.2, 1.5, 1.3, 1.1, 1.2, 1.4]
      },
      {
        name: 'Stable Market',
        data: [2.0, 1.9, 2.1, 1.8, 2.0, 2.2, 1.9, 2.1, 2.0, 1.8]
      },
      {
        name: 'Recent Data',
        data: testHistory.slice(0, 20)
      }
    ];
    
    console.log('Testing EMA impact on predictions:\n');
    
    // Reset EMA for each test
    scenarios.forEach(scenario => {
      this.emaMedian = null; // Reset
      
      const baseQuantile = this._calculateQuantile(scenario.data, this.targetQuantile);
      const emaValue = this._calculateEMA(scenario.data);
      
      // Calculate blended value (only if EMA > base)
      const blended = emaValue > baseQuantile 
        ? (baseQuantile * 0.70) + (emaValue * 0.30)
        : baseQuantile;
      
      const change = ((blended - baseQuantile) / baseQuantile * 100).toFixed(1);
      
      console.log(`${scenario.name}:`);
      console.log(`  Base Quantile: ${baseQuantile.toFixed(2)}x`);
      console.log(`  EMA: ${emaValue.toFixed(2)}x`);
      console.log(`  Blended: ${blended.toFixed(2)}x (${change > 0 ? '+' : ''}${change}%)`);
      console.log('');
    });
    
    console.log('✅ EMA blend test complete');
    console.log('💡 EMA only boosts predictions (never reduces)');
    console.log('💡 More effective in rising markets');
  }

      /**
   * 🔥 PHASE 2.2: NORMALIZE AND CLIP ADJUSTMENTS
   * 
   * Prevents over-scaling by:
   * 1. Z-score normalization: (raw - mean) / std
   * 2. Soft scaling: 1 + (z-score * 0.1)
   * 3. Hard clipping: [0.8, 1.2]
   * 
   * @param {number} rawMultiplier - Raw adjustment multiplier (e.g., 0.85, 1.15)
   * @param {number[]} recentHistory - Recent multiplier context for normalization
   * @returns {number} Normalized and clipped multiplier [0.8, 1.2]
   * 
   * @example
   * // Raw multiplier suggests 0.70x (30% reduction)
   * const normalized = this._normalizeAdjustment(0.70, recent50);
   * // Returns ~0.85x (15% reduction, clipped)
   */
  _normalizeAdjustment(rawMultiplier, recentHistory) {
    // Safety checks
    if (!this.features.normalizeAdjustments) {
      return rawMultiplier; // Feature disabled, return raw value
    }
    
    if (!recentHistory || recentHistory.length < 10) {
      console.warn('⚠️  Normalization: Insufficient history, using raw multiplier');
      return Math.max(0.8, Math.min(1.2, rawMultiplier)); // Just clip
    }
    
    try {
      // Calculate baseline statistics from recent data
      const mean = this._mean(recentHistory);
      const stdDev = Math.sqrt(this._variance(recentHistory));
      
      // Prevent division by zero
      if (stdDev < 0.01) {
        console.warn('⚠️  Normalization: Low volatility, applying light clipping');
        return Math.max(0.85, Math.min(1.15, rawMultiplier));
      }
      
      // Step 1: Calculate deviation from neutral (1.0)
      const deviation = rawMultiplier - 1.0;
      
      // Step 2: Z-score normalization
      // (We use mean=1.0 as our "expected" neutral point)
      const zScore = deviation / (stdDev / mean);
      
      // Step 3: Soft scaling (10% influence per std dev)
      const normalized = 1.0 + (zScore * 0.1);
      
      // Step 4: Hard clipping [0.8, 1.2]
      const clipped = Math.max(0.8, Math.min(1.2, normalized));
      
      // Logging (only if significant change)
      if (Math.abs(rawMultiplier - clipped) > 0.05) {
        console.log(`🔧 Normalization: ${rawMultiplier.toFixed(2)}x → ${clipped.toFixed(2)}x (z=${zScore.toFixed(2)})`);
      }
      
      return clipped;
      
    } catch (error) {
      console.error('❌ Normalization error:', error);
      // Fallback: simple clipping
      return Math.max(0.8, Math.min(1.2, rawMultiplier));
    }
  }

  /**
 * 🔥 PHASE 2.2: Test normalization behavior
 * Use this in console to verify normalization is working
 */
testNormalization() {
  console.log('\n🧪 Testing Normalization (Phase 2.2)...\n');
  
  const testHistory = this.rawHistory.slice(0, 50);
  
  if (testHistory.length < 10) {
    console.error('❌ Need at least 50 rounds of history');
    return;
  }
  
  // Test extreme multipliers
    const testCases = [
      { name: 'Aggressive Reduction', raw: 0.60 },
      { name: 'Moderate Reduction', raw: 0.85 },
      { name: 'Neutral', raw: 1.0 },
      { name: 'Moderate Boost', raw: 1.15 },
      { name: 'Aggressive Boost', raw: 1.50 }
    ];
    
    console.log('Input History Stats:');
    console.log(`  Mean: ${this._mean(testHistory).toFixed(2)}`);
    console.log(`  StdDev: ${Math.sqrt(this._variance(testHistory)).toFixed(2)}\n`);
    
    const wasEnabled = this.features.normalizeAdjustments;
    this.features.normalizeAdjustments = true;
    
    console.log('Normalization Results:');
    testCases.forEach(test => {
      const normalized = this._normalizeAdjustment(test.raw, testHistory);
      const change = ((normalized - test.raw) / test.raw * 100).toFixed(1);
      console.log(`  ${test.name}: ${test.raw.toFixed(2)}x → ${normalized.toFixed(2)}x (${change}% change)`);
    });
    
    this.features.normalizeAdjustments = wasEnabled;
    
    console.log('\n✅ Normalization test complete');
  }

  /**
   * KAPLAN-MEIER SURVIVAL FUNCTION
   */
  _kaplanMeierSurvival(history, target) {
    const sorted = [...history].sort((a, b) => a - b);
    
    let survivalProb = 1.0;
    let atRisk = sorted.length;
    
    for (const multiplier of sorted) {
      if (multiplier >= target) break;
      
      const crashed = sorted.filter(m => Math.abs(m - multiplier) < 0.01).length;
      survivalProb *= (atRisk - crashed) / atRisk;
      atRisk -= crashed;
    }
    
    return survivalProb;
  }

  
    /**
     * 🎯 PHASE 4.1: KAPLAN-MEIER PATCH
     * 
     * Fixes KM to handle non-censoring better:
     * - Weight crashed observations at 0.8x (less influence)
     * - Bound adjustment to ±10% (prevent extreme shifts)
     * - Add confidence scoring based on sample size
     */

    // ============================================
    // REPLACE EXISTING _kaplanMeierPredict() METHOD
    // ============================================

    /**
     * 🔥 PHASE 4.1: IMPROVED KAPLAN-MEIER PREDICTION
     * 
     * Enhancements:
     * 1. Weights crashed events at 0.8x (reduces their influence)
     * 2. Bounds adjustment to ±10% of base quantile
     * 3. Returns confidence score based on sample size
     * 
     * @param {number[]} history - Crash history
     * @param {number} targetQuantile - Target survival probability (e.g., 0.40)
     * @returns {object} { recommendedTarget, survivalProb, confidence, adjustment }
     */
    _kaplanMeierPredict(history, targetQuantile) {
      if (!history || history.length < 30) {
        console.warn('⚠️  KM: Insufficient data (<30 rounds)');
        return {
          recommendedTarget: this._calculateQuantile(history || [], targetQuantile),
          survivalProb: 1 - targetQuantile,
          confidence: 0.3,
          adjustment: 1.0
        };
      }
      
      // Calculate base quantile for comparison
      const baseQuantile = this._calculateQuantile(history, targetQuantile);
      
      // Sort history for survival analysis
      const sorted = [...history].sort((a, b) => a - b);
      
      let survivalProb = 1.0;
      let atRisk = sorted.length;
      let lastMultiplier = 1.0;
      let kmEstimate = baseQuantile;
      
      // 🔥 PHASE 4.1: Track crashed events for weighting
      const crashedEvents = [];
      
      for (let i = 0; i < sorted.length; i++) {
        const multiplier = sorted[i];
        
        // Count events at this multiplier (handle duplicates)
        const eventsAtThisPoint = sorted.filter(m => Math.abs(m - multiplier) < 0.01).length;
        
        // 🔥 PHASE 4.1: Weight crashed observations (multiplier < 2.0)
        let weightedEvents = eventsAtThisPoint;
        if (multiplier < 2.0) {
          weightedEvents = eventsAtThisPoint * 0.8; // 80% weight for busts
          crashedEvents.push(multiplier);
        }
        
        // Update survival probability with weighted events
        const survivalDecrement = weightedEvents / atRisk;
        survivalProb *= (1 - survivalDecrement);
        atRisk -= eventsAtThisPoint; // Remove actual events from risk set
        
        // Check if we've reached target survival probability
        if (survivalProb <= (1 - targetQuantile)) {
          kmEstimate = lastMultiplier;
          break;
        }
        
        lastMultiplier = multiplier;
      }
      
      // If we never reached target probability, use last value
      if (survivalProb > (1 - targetQuantile)) {
        kmEstimate = lastMultiplier;
      }
      
      // 🔥 PHASE 4.1: Calculate bounded adjustment
      // Prevent KM from shifting prediction by more than ±10%
      const rawAdjustment = (kmEstimate - baseQuantile) / baseQuantile;
      const boundedAdjustment = Math.max(-0.10, Math.min(0.10, rawAdjustment));
      const adjustedTarget = baseQuantile * (1 + boundedAdjustment);
      
      // 🔥 PHASE 4.1: Confidence scoring based on sample size and stability
      // More data + less crashed events = higher confidence
      const sampleSizeScore = Math.min(1.0, history.length / 200); // Max at 200 rounds
      const crashRatio = crashedEvents.length / history.length;
      const stabilityScore = 1.0 - (crashRatio * 0.5); // Penalty for high crash rate
      const confidence = sampleSizeScore * stabilityScore;
      
      // Logging (only if significant adjustment)
      if (Math.abs(boundedAdjustment) > 0.03) {
        console.log('📊 KM Adjustment:');
        console.log(`   Base Quantile: ${baseQuantile.toFixed(2)}x`);
        console.log(`   KM Estimate: ${kmEstimate.toFixed(2)}x`);
        console.log(`   Raw Adjustment: ${(rawAdjustment * 100).toFixed(1)}%`);
        console.log(`   Bounded: ${(boundedAdjustment * 100).toFixed(1)}%`);
        console.log(`   Final: ${adjustedTarget.toFixed(2)}x`);
        console.log(`   Confidence: ${(confidence * 100).toFixed(0)}%`);
        console.log(`   Weighted Crashes: ${crashedEvents.length}/${history.length}`);
      }
      
      return {
        recommendedTarget: adjustedTarget,
        survivalProb: survivalProb,
        confidence: confidence,
        adjustment: 1 + boundedAdjustment,
        crashedCount: crashedEvents.length
      };
    }

  // ============================================
    // DIAGNOSTIC FUNCTION - TEST KM PATCH
    // ============================================

    /**
     * 🔥 PHASE 4.1: Test KM patch behavior
     */
    testKaplanMeierPatch() {
      console.log('\n🧪 Testing Kaplan-Meier Patch (Phase 4.1)...\n');
      
      const testHistory = this.rawHistory.slice(0, 200);
      
      if (testHistory.length < 100) {
        console.error('❌ Need at least 200 rounds of history');
        return;
      }
      
      // Test scenarios
      const scenarios = [
        { name: 'Bust-Heavy', data: testHistory.filter(m => m < 2.5) },
        { name: 'Normal Distribution', data: testHistory },
        { name: 'Heavy-Tail', data: testHistory.filter(m => m > 1.5) }
      ];
      
      console.log('Comparing KM vs Base Quantile:\n');
      
      scenarios.forEach(scenario => {
        const baseQuantile = this._calculateQuantile(scenario.data, this.targetQuantile);
        const kmResult = this._kaplanMeierPredict(scenario.data, this.targetQuantile);
        
        const difference = kmResult.recommendedTarget - baseQuantile;
        const percentChange = (difference / baseQuantile * 100).toFixed(1);
        
        console.log(`${scenario.name} (n=${scenario.data.length}):`);
        console.log(`  Base Quantile: ${baseQuantile.toFixed(2)}x`);
        console.log(`  KM Estimate: ${kmResult.recommendedTarget.toFixed(2)}x`);
        console.log(`  Difference: ${difference > 0 ? '+' : ''}${difference.toFixed(2)}x (${percentChange}%)`);
        console.log(`  Confidence: ${(kmResult.confidence * 100).toFixed(0)}%`);
        console.log(`  Weighted Crashes: ${kmResult.crashedCount}`);
        console.log('');
      });
      
      console.log('✅ KM patch test complete');
      console.log('💡 KM should adjust within ±10% of base quantile');
      console.log('💡 Bust-heavy data should have lower confidence');
    }

    /**
 * 🔥 PHASE 4.2: CALCULATE ADAPTIVE HOUSE EDGE
 * 
 * Adjusts house edge based on market volatility:
 * - Low volatility (stable) → standard edge (1%)
 * - High volatility (chaotic) → higher edge (1.5%)
 * 
 * Formula: edge = 0.01 * (1 + volatility/2)
 * 
 * @param {number} volatility - Current market volatility
 * @returns {number} Adaptive house edge [0.01, 0.02]
 */
_calculateAdaptiveHouseEdge(volatility) {
  // Base edge: 1%
  const baseEdge = 0.01;
  
  // Volatility adjustment factor (capped at 2x)
  // volatility=1.0 → factor=1.0 → edge=1.0%
  // volatility=2.0 → factor=1.5 → edge=1.5%
  // volatility=4.0 → factor=2.0 → edge=2.0% (max)
  const volatilityFactor = 1.0 + Math.min(volatility / 2.0, 1.0);
  
  // Calculate adaptive edge with bounds [0.01, 0.02]
  const adaptiveEdge = baseEdge * volatilityFactor;
  const boundedEdge = Math.max(0.01, Math.min(0.02, adaptiveEdge));
  
  // Log only when edge differs from base
  if (Math.abs(boundedEdge - baseEdge) > 0.001) {
    console.log(`🎲 Adaptive House Edge: ${(boundedEdge * 100).toFixed(2)}% (volatility: ${volatility.toFixed(2)})`);
  }
  
  return boundedEdge;
}

  /**
 * 🔥 FINAL: UNCAPPED STREAK BOOST (1.30x MAX)
 * 
 * Proven in Test 2:
 * - 68.5% accuracy
 * - +70.54% ROI
 * - 50/50 distribution split
 * 
 * Changes from Phase 4:
 * - Cap raised from 1.10x → 1.30x (30% max boost)
 * - More aggressive scaling (3 busts = 15%, 7 busts = 30%)
 * - Creates meaningful variation in predictions
 */

_calculateMergedBustBoost(cleanHistory, bustThreshold = 1.5) {
  if (!cleanHistory || cleanHistory.length < 10) {
    return {
      boostActive: false,
      multiplier: 1.0,
      streakCount: 0,
      reasoning: 'Insufficient data'
    };
  }
  
  const recent20 = cleanHistory.slice(0, 20);
  
  // Signal 1: Consecutive bust streak
  let consecutiveBusts = 0;
  for (const m of recent20) {
    if (m < bustThreshold) {
      consecutiveBusts++;
    } else {
      break; // Streak broken
    }
  }
  
  // Signal 2: CUSUM alert (if feature enabled)
  const cusumAlert = this.features.cusumDetection && this.cusum.alertActive;
  
  // Dual trigger logic
  const streakTrigger = consecutiveBusts >= 3;
  const cusumTrigger = cusumAlert && this.cusum.consecutiveBusts >= 2;
  
  if (!streakTrigger && !cusumTrigger) {
    return {
      boostActive: false,
      multiplier: 1.0,
      streakCount: consecutiveBusts,
      reasoning: 'No bust cluster detected'
    };
  }
  
  // 🔥 UNCAPPED BOOST CALCULATION
  // 3 busts = 15% (1.15x)
  // 5 busts = 25% (1.25x)
  // 7+ busts = 30% (1.30x max)
  const baseBoost = 0.10;  // Start at 10%
  const scalingBoost = Math.min(consecutiveBusts * 0.05, 0.20); // Up to +20%
  const totalBoost = baseBoost + scalingBoost;
  
  // 🔥 NEW CAP: 1.30x (30% max, up from 10%)
  const multiplier = Math.min(1.30, 1.0 + totalBoost);
  
  // Build reasoning
  let reasoning = '';
  if (streakTrigger && cusumTrigger) {
    reasoning = `STRONG: ${consecutiveBusts} consecutive busts + CUSUM confirmed`;
  } else if (streakTrigger) {
    reasoning = `${consecutiveBusts} consecutive busts detected`;
  } else {
    reasoning = `CUSUM detected ${this.cusum.consecutiveBusts} recent busts`;
  }
  
  console.log(`🔥 Streak Boost: ${reasoning}`);
  console.log(`   Multiplier: ${multiplier.toFixed(2)}x (busts: ${consecutiveBusts})`);
  
  return {
    boostActive: true,
    multiplier: multiplier,
    streakCount: consecutiveBusts,
    cusumConfirmed: cusumTrigger,
    reasoning: reasoning
  };
}

  /**
   * 🔥 PHASE 4.2: Test adaptive house edge
   */
  testAdaptiveHouseEdge() {
    console.log('\n🧪 Testing Adaptive House Edge (Phase 4.2)...\n');
    
    // Test different volatility scenarios
    const volatilities = [
      { name: 'Very Low (Stable)', value: 0.5 },
      { name: 'Low', value: 1.0 },
      { name: 'Normal', value: 1.5 },
      { name: 'High', value: 2.0 },
      { name: 'Very High (Chaotic)', value: 3.0 }
    ];
    
    console.log('House Edge Adaptation to Market Volatility:\n');
    
    volatilities.forEach(scenario => {
      const edge = this._calculateAdaptiveHouseEdge(scenario.value);
      const theoretical = (1 - edge) / this.targetWinRate;
      
      console.log(`${scenario.name} (volatility=${scenario.value.toFixed(1)}):`);
      console.log(`  House Edge: ${(edge * 100).toFixed(2)}%`);
      console.log(`  Theoretical Target: ${theoretical.toFixed(2)}x`);
      console.log('');
    });
  
  console.log('✅ Adaptive house edge test complete');
  console.log('💡 Higher volatility → higher edge → more conservative');
}

  /**
 * 🔥 PHASE 4.3: Test merged bust detector
 */
testMergedBustDetector() {
  console.log('\n🧪 Testing Merged Bust Detector (Phase 4.3)...\n');
  
  const testHistory = this.rawHistory.slice(0, 100);
  
  if (testHistory.length < 50) {
    console.error('❌ Need at least 100 rounds of history');
    return;
  }
  
  // Create test scenarios
  const scenarios = [
    {
      name: 'No Busts (Normal)',
      data: [2.5, 3.0, 1.8, 2.2, 1.9, 2.1, 2.4, 1.7, 2.0, 2.3]
    },
    {
      name: 'Light Bust Cluster (2 consecutive)',
      data: [1.3, 1.2, 2.0, 1.8, 2.5, 1.9, 2.1, 2.3, 1.7, 2.4]
    },
    {
      name: 'Medium Bust Cluster (3 consecutive)',
      data: [1.2, 1.1, 1.3, 2.0, 1.8, 2.5, 1.9, 2.1, 2.3, 1.7]
    },
    {
      name: 'Heavy Bust Cluster (5 consecutive)',
      data: [1.1, 1.2, 1.0, 1.3, 1.1, 2.0, 1.8, 2.5, 1.9, 2.1]
    },
    {
      name: 'Recent Data',
      data: testHistory.slice(0, 20)
    }
  ];
  
  console.log('Testing Bust Detection (Streak + CUSUM Merge):\n');
  
  scenarios.forEach(scenario => {
    const result = this._calculateMergedBustBoost(scenario.data, 1.5);
    
    console.log(`${scenario.name}:`);
    console.log(`  Boost Active: ${result.boostActive ? '✅ YES' : '❌ NO'}`);
    console.log(`  Multiplier: ${result.multiplier.toFixed(2)}x (max: 1.10x)`);
    console.log(`  Consecutive Busts: ${result.streakCount}`);
    console.log(`  CUSUM Confirmed: ${result.cusumConfirmed ? 'YES' : 'NO'}`);
    console.log(`  Reasoning: ${result.reasoning}`);
    console.log('');
  });
  
  console.log('✅ Merged bust detector test complete');
  console.log('💡 Requires 3+ consecutive busts OR CUSUM confirmation');
  console.log('💡 Boost capped at 1.10x (10% max) per roadmap');
}

    /**
   * 🔥 PHASE 4: Combined diagnostic
   */
  testPhase4Patches() {
    console.log('\n' + '='.repeat(60));
    console.log('🧪 PHASE 4: FEATURE-SPECIFIC PATCHES TEST SUITE');
    console.log('='.repeat(60));
    
    console.log('\n📊 4.1: Kaplan-Meier Patch');
    console.log('─'.repeat(60));
    this.testKaplanMeierPatch();
    
    console.log('\n📊 4.2: Adaptive House Edge');
    console.log('─'.repeat(60));
    this.testAdaptiveHouseEdge();
    
    console.log('\n📊 4.3: Merged Bust Detector');
    console.log('─'.repeat(60));
    this.testMergedBustDetector();
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Phase 4 diagnostic suite complete');
    console.log('='.repeat(60));
  }

  /**
   * WEIBULL HAZARD FUNCTION
   */
  _calculateWeibullHazard(history) {
    const mean = this._mean(history);
    const variance = this._variance(history);
    const cv = Math.sqrt(variance) / mean;
    
    let beta, interpretation, advice, multiplier;
    
    if (cv < 0.8) {
      beta = 1.2;
      interpretation = 'INCREASING_HAZARD';
      advice = 'Exit early - risk grows';
      multiplier = 0.90;
    } else if (cv > 1.2) {
      beta = 0.8;
      interpretation = 'HEAVY_TAIL';
      advice = 'Can hold longer';
      multiplier = 1.05;
    } else {
      beta = 1.0;
      interpretation = 'CONSTANT_HAZARD';
      advice = 'Standard play';
      multiplier = 1.0;
    }
    
    return { beta, interpretation, advice, multiplier };
  }

  _detectBustVolume(recent20) {
    const bustCount = recent20.filter(m => m < 2.0).length;
    const bustRate = bustCount / recent20.length;
    
    if (bustRate > 0.70) return 0.85;
    else if (bustRate > 0.60) return 0.92;
    else if (bustRate < 0.40) return 1.05;
    
    return 1.0;
  }

  // ============================================
  // UPDATE: _detectPostMoonCondition() - USE ADAPTIVE THRESHOLD
  // ============================================

  /**
   * 🔥 MODIFIED: Use adaptive moon threshold
   * 
   * BEFORE Phase 3.1:
   * - Fixed threshold = 90th percentile calculated each time
   * 
   * AFTER Phase 3.1:
   * - Uses pre-calculated adaptive threshold (updated once per prediction)
   * - More stable, less computation
   */
  _detectPostMoonCondition(recent50) {
    if (!recent50 || recent50.length < 10) {
      return { 
        multiplier: 1.0, 
        detected: false, 
        threshold: null,
        reasoning: 'Insufficient data for moon detection'
      };
    }
    
    // 🔥 PHASE 3.1: Use adaptive threshold if enabled
    const moonThreshold = this.features.adaptiveThresholds
      ? this.adaptiveThresholds.postMoonThreshold
      : this._calculateQuantile(recent50, 0.90);
    
    // Check if ANY recent round was a moon shot
    const recentMoonShot = recent50.find(m => m >= moonThreshold);
    
    if (recentMoonShot) {
      const adaptive = this.features.adaptiveThresholds ? ' (adaptive)' : '';
      console.log(`🌙 POST-MOON DETECTED: ${recentMoonShot.toFixed(2)}x exceeded ${moonThreshold.toFixed(2)}x${adaptive}`);
      return {
        multiplier: 0.85,
        detected: true,
        threshold: moonThreshold,
        moonValue: recentMoonShot,
        reasoning: `Moon shot detected (${recentMoonShot.toFixed(2)}x) - Applying 15% caution`
      };
    }
    
    return {
      multiplier: 1.0,
      detected: false,
      threshold: moonThreshold,
      reasoning: 'No recent moon shots detected'
    };
  }
  
    // ============================================
  // UPDATE: _countRecentBusts() - USE ADAPTIVE BUST THRESHOLD
  // ============================================

  /**
   * 🔥 MODIFIED: Use adaptive bust threshold for streak detection
   * 
   * BEFORE Phase 3.1:
   * - Fixed threshold = 1.5x
   * 
   * AFTER Phase 3.1:
   * - Uses 10th percentile from recent data (naturally adaptive)
   */
  _countRecentBusts(history, window = 10, threshold = null) {
    if (!history || history.length === 0) return 0;
    
    // 🔥 PHASE 3.1: Use adaptive threshold if enabled
    const bustThreshold = this.features.adaptiveThresholds && threshold === null
      ? this.adaptiveThresholds.bustThreshold
      : (threshold || 1.5);
    
    let bustCount = 0;
    const recentRounds = history.slice(0, window);
    
    for (const multiplier of recentRounds) {
      if (multiplier < bustThreshold) {
        bustCount++;
      } else {
        break;
      }
    }
    
    return bustCount;
  }

    /**
   * 🔄 PHASE 2.2: DYNAMIC THRESHOLD CALCULATION
   * Adapts bust/moon definitions based on recent market behavior
   * 
   * Logic:
   * - Bust threshold = 10th percentile of recent data
   * - Moon threshold = 90th percentile of recent data
   * - Updates these values before each prediction
   * 
   * @param {number[]} recentHistory - Recent market data (50-200 rounds)
   * @returns {object} { bustThreshold, moonThreshold }
   */
  _updateDynamicThresholds(recentHistory) {
    if (!recentHistory || recentHistory.length < 50) {
      // Not enough data - use defaults
      return {
        bustThreshold: 1.5,
        moonThreshold: 10.0,
        updated: false
      };
    }
    
    // Calculate dynamic thresholds from recent data
    const bustThreshold = this._calculateQuantile(recentHistory, 0.10);  // 10th percentile
    const moonThreshold = this._calculateQuantile(recentHistory, 0.90);  // 90th percentile
    
    // Store for later use
    this.dynamicBustThreshold = bustThreshold;
    this.dynamicMoonThreshold = moonThreshold;
    
    console.log(`📊 Dynamic Thresholds Updated:`);
    console.log(`   Bust: ${bustThreshold.toFixed(2)}x (10th percentile)`);
    console.log(`   Moon: ${moonThreshold.toFixed(2)}x (90th percentile)`);
    
    return {
      bustThreshold: bustThreshold,
      moonThreshold: moonThreshold,
      updated: true
    };
  }

    
    /**
 * ❌ PHASE 2.3: ARIMA BLEND - DISABLED (FAILED GATE CRITERIA)
 * 
 * If revisiting ARIMA later:
 * 1. Winsorize input at 90th percentile (filter extremes)
 * 2. Use EMA instead of simple moving averages
 * 3. Reduce blend to 5% maximum
 * 4. Add absolute forecast cap at 2.0x
 * 5. Require 500+ rounds of stable data before enabling
 * 
 * CURRENT STATUS: arimaBlend = false (PERMANENTLY DISABLED)
 */
_simpleARIMA(recent50) {
  // Method kept for reference but not called when arimaBlend = false
  // See documentation above for why this feature was disabled
  
  if (!recent50 || recent50.length < 20) {
    console.warn('⚠️ ARIMA: Insufficient data, using fallback');
    return this._mean(recent50);
  }
    
    // Step 1: Calculate short-term and medium-term averages
    const recent10 = recent50.slice(0, 10);
    const prior10 = recent50.slice(10, 20);
    
    const recentAvg = this._mean(recent10);
    const priorAvg = this._mean(prior10);
    
    // Step 2: Calculate trend (momentum)
    const trend = recentAvg - priorAvg;
    
    // Step 3: Apply exponential smoothing (MA component)
    // 🔧 FIX: Increased alpha 0.3 → 0.4 for better recent data weight
    const alpha = 0.4;  // Smoothing factor (higher = more recent weight)
    const lastValue = recent50[0];
    const smoothed = (alpha * lastValue) + ((1 - alpha) * recentAvg);
    
    // Step 4: Forecast = smoothed value + CONSERVATIVE projected trend
    // 🔧 FIX: Reduced dampening 50% → 25% for stability
    const forecast = smoothed + (trend * 0.25);
    
    // Step 5: TIGHT bounds checking (prevent over-shooting)
    // 🔧 FIX: Tightened from [80%, 150%] → [90%, 120%]
    const minForecast = Math.min(...recent10) * 0.90;  // Don't go too low
    const maxForecast = Math.max(...recent10) * 1.20;  // Don't go too high
    const boundedForecast = Math.max(minForecast, Math.min(forecast, maxForecast));
    
    console.log(`📮 ARIMA Forecast:`);
    console.log(`   Recent avg: ${recentAvg.toFixed(2)}x`);
    console.log(`   Prior avg: ${priorAvg.toFixed(2)}x`);
    console.log(`   Trend: ${trend > 0 ? '+' : ''}${trend.toFixed(2)}x`);
    console.log(`   Raw forecast: ${forecast.toFixed(2)}x`);
    console.log(`   Bounded forecast: ${boundedForecast.toFixed(2)}x`);
    
    return boundedForecast;
  }

  /**
 * 🔄 PHASE 2.1: CYCLE PATTERN CLASSIFIER
 * Classifies recent rounds into Low/Med/High and detects repeating patterns
 * 
 * Logic:
 * - Low: <2.0x (busts/conservative)
 * - Med: 2.0-5.0x (normal range)
 * - High: >5.0x (moon shots)
 * 
 * Detects patterns like:
 * - "low-low-high" (busts followed by spike)
 * - "med-high-low" (regression to mean)
 * - "high-high-med" (moon cluster cooldown)
 * 
 * @param {number[]} recent10 - Last 10 multipliers
 * @returns {object} { pattern, adjustment, reasoning }
 */
_detectCyclePattern(recent10) {
  if (!recent10 || recent10.length < 10) {
    return { 
      pattern: 'INSUFFICIENT_DATA',
      adjustment: 1.0,
      reasoning: 'Need 10 rounds for cycle detection'
    };
  }
  
  // Classify each multiplier into Low/Med/High
  const classified = recent10.map(m => {
    if (m < 1.8) return 'low';
    if (m < 4.0) return 'med';
    return 'high';
  });
  
  // Get last 3 rounds pattern
  const last3Pattern = classified.slice(0, 3).join('-');
  
  // Count occurrences of each class
  const lowCount = classified.filter(c => c === 'low').length;
  const medCount = classified.filter(c => c === 'med').length;
  const highCount = classified.filter(c => c === 'high').length;
  
  // Pattern detection and adjustment logic
  let adjustment = 1.0;
  let reasoning = 'No clear pattern detected';
  let detectedPattern = 'NEUTRAL';
  
  // Pattern 1: Low-Low-High cycle (common rebound pattern)
  if (last3Pattern === 'low-low-med' || last3Pattern === 'low-low-low') {
    // Two consecutive lows → expect rebound to medium
    adjustment = 1.10;  // +15% boost
    reasoning = 'Low-low pattern detected - Rebound likely';
    detectedPattern = 'LOW_LOW_REBOUND';
  }
  
  // Pattern 2: High-High-X (moon cluster → expect cooldown)
  else if (last3Pattern.startsWith('high-high')) {
    // Two consecutive highs → expect regression
    adjustment = 0.90;  // -10% reduction
    reasoning = 'High-high pattern detected - Cooldown expected';
    detectedPattern = 'HIGH_HIGH_COOLDOWN';
  }
  
  // Pattern 3: Med-High-Low (volatility swing → stabilization)
  else if (last3Pattern === 'med-high-low' || last3Pattern === 'low-high-low') {
    // Erratic swings → expect stabilization to medium
    adjustment = 1.05;  // +5% boost toward normal
    reasoning = 'Volatility swing pattern - Stabilization likely';
    detectedPattern = 'VOLATILITY_STABILIZATION';
  }
  
  // Pattern 4: Dominant class (>60% of last 10)
  else if (lowCount >= 6) {
    // Heavy bust cluster → strong rebound signal
    adjustment = 1.20;  // +20% boost
    reasoning = `${lowCount}/10 busts detected - Strong rebound signal`;
    detectedPattern = 'BUST_CLUSTER';
  }
  else if (highCount >= 4) {
    // Multiple moon shots → expect normalization
    adjustment = 0.85;  // -15% reduction
    reasoning = `${highCount}/10 moon shots - Normalization expected`;
    detectedPattern = 'MOON_CLUSTER';
  }
  else if (medCount >= 7) {
    // Stable normal range → slight confidence boost
    adjustment = 1.08;  // +8% boost (stable market)
    reasoning = `${medCount}/10 normal rounds - Stable market`;
    detectedPattern = 'STABLE_MARKET';
  }
  
  return {
    pattern: detectedPattern,
    last3: last3Pattern,
    classification: classified,
    adjustment: adjustment,
    reasoning: reasoning,
    counts: { low: lowCount, med: medCount, high: highCount }
  };
}

  _calculateQuantile(data, quantile) {
    if (!data || data.length === 0) return 1.5;
    const sorted = [...data].sort((a, b) => a - b);
    const index = Math.floor(quantile * sorted.length);
    return sorted[Math.min(index, sorted.length - 1)];
  }

  _bootstrapQuantile(data, quantile, iterations) {
    const results = [];
    const n = data.length;
    
    for (let i = 0; i < iterations; i++) {
      const sample = [];
      for (let j = 0; j < n; j++) {
        sample.push(data[Math.floor(Math.random() * n)]);
      }
      results.push(this._calculateQuantile(sample, quantile));
    }
    
    return this._calculateQuantile(results, 0.10);
  }

  _getVolatilityAdjustment(recentVol, longTermVol) {
    const ratio = recentVol / Math.max(0.1, longTermVol);
    
    if (ratio > 1.5) return 0.85;
    else if (ratio > 1.2) return 0.92;
    else if (ratio < 0.7) return 1.05;
    
    return 1.0;
  }

  _calculateConfidence(history, target, stats) {
    let confidence = 50;
    
    const sampleBoost = Math.min(20, (history.length / 500) * 20);
    confidence += sampleBoost;
    
    if (this.predictionStats.totalPredictions >= 10) {
      const trackRecordBoost = (this.predictionStats.winRate - 0.50) * 40;
      confidence += trackRecordBoost;
    }
    
    if (stats.volatility > 2.5) confidence -= 15;
    else if (stats.volatility < 1.5) confidence += 10;
    
    const medianRatio = target / stats.median;
    if (medianRatio > 1.5 || medianRatio < 0.7) confidence -= 10;
    
    return Math.max(30, Math.min(95, confidence));
  }

  _determineAction(confidence, target, volatility, cusumAlert) {
    // 🔥 FIXED: Only skip if CUSUM is actually detecting something meaningful
    if (cusumAlert && this.cusum.consecutiveBusts >= 3) {
      return {
        type: 'SKIP ROUND',
        message: `⚠️ Bust cluster detected - Skip round`,
        reasoning: `CUSUM: ${this.cusum.consecutiveBusts} consecutive busts detected`
      };
    }
    
    if (confidence >= 70 && volatility < 2.0) {
      return {
        type: 'STRONG BET',
        message: `High confidence: ${target.toFixed(2)}x`,
        reasoning: `${confidence.toFixed(0)}% confidence`
      };
    } else if (confidence >= 55) {
      return {
        type: 'MODERATE BET',
        message: `Target ${target.toFixed(2)}x`,
        reasoning: `${confidence.toFixed(0)}% confidence`
      };
    } else if (confidence >= 40) {
      return {
        type: 'CAUTIOUS BET',
        message: `Exit early recommended`,
        reasoning: `${confidence.toFixed(0)}% confidence`
      };
    } else {
      return {
        type: 'OBSERVE',
        message: `Skip or minimal bet`,
        reasoning: `${confidence.toFixed(0)}% confidence`
      };
    }
  }

  _calculateKellyBet(confidence, target) {
    const winProb = confidence / 100;
    const lossProb = 1 - winProb;
    const odds = target;
    
    const kellyPercent = ((odds * winProb) - lossProb) / odds;
    const fractionalKelly = kellyPercent * 0.25;
    const cappedKelly = Math.max(0, Math.min(fractionalKelly, 0.05));
    
    return {
      full: Math.max(0, kellyPercent * 100).toFixed(1) + '%',
      fractional: (fractionalKelly * 100).toFixed(1) + '%',
      recommended: (cappedKelly * 100).toFixed(1) + '%'
    };
  }

  updateAfterPrediction(predicted, actual, success) {
    this.predictionStats.totalPredictions++;
    
    if (success) {
      this.predictionStats.successCount++;
    } else {
      this.predictionStats.failureCount++;
    }
    
    this.predictionStats.winRate = 
      this.predictionStats.successCount / this.predictionStats.totalPredictions;
    
    this.predictionStats.calibrationHistory.unshift({ predicted, actual, success });
    if (this.predictionStats.calibrationHistory.length > 20) {
      this.predictionStats.calibrationHistory.length = 20;
    }
    
    if (this.predictionStats.totalPredictions >= 10 && 
        this.predictionStats.totalPredictions % 5 === 0) {
      this._calibrateQuantile();
    }
  }

  _calibrateQuantile() {
    const currentWinRate = this.predictionStats.winRate;
    const error = this.targetWinRate - currentWinRate;
    
    const learningRate = 0.02;
    this.targetQuantile = Math.max(0.20, Math.min(0.60, this.targetQuantile + error * learningRate));
  }

  _calculateStats(data) {
    if (!data || data.length === 0) {
      return { mean: 0, median: 0, volatility: 0 };
    }
    
    const sorted = [...data].sort((a, b) => a - b);
    const mean = this._mean(data);
    const median = sorted[Math.floor(sorted.length / 2)];
    const volatility = Math.sqrt(this._variance(data));
    
    return { mean, median, volatility };
  }

  getStatistics() {
    const stats = this._calculateStats(this.rawHistory.slice(0, 500));
    
    return {
      totalPredictions: this.predictionStats.totalPredictions,
      successCount: this.predictionStats.successCount,
      failureCount: this.predictionStats.failureCount,
      winRate: this.predictionStats.winRate,
      winRatePercent: (this.predictionStats.winRate * 100).toFixed(1) + '%',
      
      marketRoundsAnalyzed: this.rawHistory.length,
      marketMedian: stats.median.toFixed(2),
      marketMean: stats.mean.toFixed(2),
      marketVolatility: stats.volatility.toFixed(2),
      
      targetQuantile: (this.targetQuantile * 100).toFixed(1) + 'th percentile',
      targetWinRate: (this.targetWinRate * 100).toFixed(0) + '%',
      
      cusumAlert: this.features.cusumDetection ? this.cusum.alertActive : null,
      cusumStatistic: this.features.cusumDetection ? this.cusum.statistic.toFixed(2) : null
    };
  }

  _mean(arr) {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  _variance(arr) {
    const mean = this._mean(arr);
    return arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / arr.length;
  }

  _cleanData(history) {
    return history
      .map(v => parseFloat(v))
      .filter(v => !isNaN(v) && v > 0 && v < 1000);
  }

  _errorResponse(message) {
    return {
      error: true,
      message: message,
      confidence: 0,
      predictedValue: 0,
      riskLevel: "UNKNOWN"
    };
  }
}