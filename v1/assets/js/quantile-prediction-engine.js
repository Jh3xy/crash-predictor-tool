
/**
 * 🎯 QUANTILE-BASED PREDICTION ENGINE v2.0 - COMPLETE FIXED VERSION
 * 
 * FIXES:
 * - ✅ CUSUM now correctly detects DOWNWARD shifts (bust clusters)
 * - ✅ Improved sensitivity and reset logic
 * - ✅ Better logging for debugging
 * 
 * FEATURES (all toggleable):
 * - houseEdgeBlend: true (YOUR BASELINE)
 * - kaplanMeier: false (test with diagnostic first)
 * - weibullHazard: false (test with diagnostic first)
 * - cusumDetection: false (test with diagnostic first)
 */

export class QuantilePredictionEngine {
  constructor() {
    this.name = "Quantile Engine v2.0 - Fixed & Optimized";
    

    this.features = {
      cusumDetection: false,
      weibullHazard: false,
      kaplanMeier: true,
      houseEdgeBlend: true,  
      winsorization: false,
      dynamicConfidence: false,
      volumeDetection: false,
      kellyBetting: false,

      postMoonCaution: true, // Phase 1.1
      enhancedStreaks: true, // Phase 1.2
      cycleDetection: false,  // Phase 2.1
    };

    this.houseEdge = 0.01;
    this.rawHistory = [];
    this.MAX_HISTORY = 2000;
    
    this.targetQuantile = 0.40;
    this.targetWinRate = 0.60;
    
    this.predictionStats = {
      totalPredictions: 0,
      successCount: 0,
      failureCount: 0,
      winRate: 0.50,
      calibrationHistory: []
    };
    
    // 🔥 FIXED CUSUM CONFIG
    this.cusum = {
      statistic: 0,
      mean: 2.0,           // Expected mean multiplier
      slack: 0.5,          // Drift tolerance (k parameter)
      threshold: 3.0,      // Alert threshold (H parameter) - LOWERED for more sensitivity
      alertActive: false,
      consecutiveBusts: 0, // Track consecutive low multipliers
      lastValues: []       // Store last 10 values for debugging
    };
    
    console.log("🎯 Quantile Engine v2.0 - Fixed CUSUM Initialized");
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
    
    if (this.rawHistory.length % 100 === 0) {
      const stats = this._calculateStats(this.rawHistory.slice(0, 500));
      console.log(`📊 Market: ${this.rawHistory.length} rounds`);
      console.log(`   Median: ${stats.median.toFixed(2)}x, Vol: ${stats.volatility.toFixed(2)}`);
      if (this.features.cusumDetection && this.cusum.alertActive) {
        console.log(`   🔴 CUSUM ALERT ACTIVE (stat: ${this.cusum.statistic.toFixed(2)})`);
      }
    }
  }

  /**
   * 🔥 FIXED CUSUM CHANGE-POINT DETECTION
   * Now correctly detects DOWNWARD shifts (bust clusters)
   */
  _updateCUSUM(multiplier) {
    // Store last values for debugging
    this.cusum.lastValues.unshift(multiplier);
    if (this.cusum.lastValues.length > 10) {
      this.cusum.lastValues.length = 10;
    }
    
    // 🔥 FIX: Detect DOWNWARD shifts (when multipliers are below mean)
    // OLD (WRONG): statistic += multiplier - mean - slack
    // NEW (CORRECT): statistic += mean - multiplier - slack
    
    const deviation = this.cusum.mean - multiplier;
    this.cusum.statistic = Math.max(0, this.cusum.statistic + deviation - this.cusum.slack);
    
    // Track consecutive busts for better detection
    if (multiplier < 1.5) {
      this.cusum.consecutiveBusts++;
    } else {
      // Faster reset when seeing normal/high multipliers
      this.cusum.consecutiveBusts = 0;
      if (multiplier > this.cusum.mean) {
        this.cusum.statistic = Math.max(0, this.cusum.statistic - 0.5);
      }
    }
    
    // 🔥 DUAL TRIGGER SYSTEM
    // Trigger 1: CUSUM statistic exceeds threshold
    // Trigger 2: 4+ consecutive busts in last 6 rounds
    const consecutiveTrigger = this.cusum.consecutiveBusts >= 4;
    const statisticTrigger = this.cusum.statistic > this.cusum.threshold;
    
    if (statisticTrigger || consecutiveTrigger) {
      if (!this.cusum.alertActive) {
        console.log('🔴 CUSUM ALERT: Bust cluster detected');
        console.log(`   Statistic: ${this.cusum.statistic.toFixed(2)} / ${this.cusum.threshold}`);
        console.log(`   Consecutive busts: ${this.cusum.consecutiveBusts}`);
        console.log(`   Last 10 values: ${this.cusum.lastValues.map(v => v.toFixed(2)).join(', ')}`);
        this.cusum.alertActive = true;
      }
    } 
    // Reset alert when market normalizes
    else if (this.cusum.statistic < 1.0 && this.cusum.consecutiveBusts === 0 && this.cusum.alertActive) {
      console.log('✅ CUSUM: Market normalized');
      console.log(`   Statistic: ${this.cusum.statistic.toFixed(2)}`);
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

    // Winsorization (if enabled)
    if (this.features.winsorization) {
      const p99 = this._calculateQuantile(cleanHistory, 0.99);
      cleanHistory = cleanHistory.map(v => Math.min(v, p99));
    }

    const recent50 = cleanHistory.slice(0, 50);
    const recent20 = cleanHistory.slice(0, 20);
    
    const stats = this._calculateStats(cleanHistory);
    const recentStats = this._calculateStats(recent50);
    
    // ===== BASE PREDICTION =====
    // const empirical = this._calculateQuantile(cleanHistory, this.targetQuantile);
    // const theoretical = (1 - this.houseEdge) / this.targetWinRate;

    // let target;
    // if (this.features.houseEdgeBlend && cleanHistory.length < 500) {
    //   const blend = 0.5;
    //   target = blend * empirical + (1 - blend) * theoretical;
    // } else {
    //   target = empirical;
    // }
    
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

    // If volatility is crazy high, we automatically lean more on safety (the theoretical value)
    if (this.features.houseEdgeBlend) {
      const theoretical = (1 - this.houseEdge) / this.targetWinRate;
      const blendFactor = 0.5; 
      target = (target * (1 - blendFactor)) + (theoretical * blendFactor);
    }

    // ===== KAPLAN-MEIER (if enabled) =====
    if (this.features.kaplanMeier) {
      const kmResult = this._kaplanMeierPredict(cleanHistory, this.targetQuantile);
      const kmTarget = kmResult.recommendedTarget;
      target = (target + kmTarget) / 2;
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
      // Count recent busts in last 10 rounds
      streakCount = this._countRecentBusts(cleanHistory, 10, 1.7);
      
      if (streakCount >= 2) {
        // Base boost: +10% minimum
        // Scaling: +5% per bust (e.g., 3 busts = 15%, 5 busts = 25%, 6+ busts = 30%)
        const boostPercent = 0.15 + Math.min(streakCount * 0.05, 0.50);
        streakBoostMultiplier = 1.0 + boostPercent;
        streakBoostActive = true;
        
        streakReasoning = `${streakCount} consecutive busts detected - Rebound boost: +${(boostPercent * 100).toFixed(0)}%`;
        console.log(`🔥 STREAK BOOST: ${streakReasoning}`);
      }
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

    // Apply all adjustments (Phase 1.1, 1.2 + Phase 2.1 Cycle)
  target *= hazardMultiplier * cusumMultiplier * volumeMultiplier * volatilityMultiplier * postMoonMultiplier * streakBoostMultiplier * cycleMultiplier;
    
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

      marketMedian: stats.median.toFixed(2),
      recentMedian: recentStats.median.toFixed(2),
      targetQuantile: (this.targetQuantile * 100).toFixed(0) + 'th percentile',
      predictionWinRate: (this.predictionStats.winRate * 100).toFixed(1) + '%',
      historyAnalyzed: cleanHistory.length,
      
      kellyBetSize: kellyBetSize,
      
      error: false
    };
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

  _kaplanMeierPredict(history, targetQuantile) {
    const sorted = [...history].sort((a, b) => a - b);
    
    let survivalProb = 1.0;
    let atRisk = sorted.length;
    let lastMultiplier = 1.0;
    
    for (let i = 0; i < sorted.length; i++) {
      const multiplier = sorted[i];
      const crashed = sorted.filter(m => Math.abs(m - multiplier) < 0.01).length;
      
      survivalProb *= (atRisk - crashed) / atRisk;
      atRisk -= crashed;
      
      if (survivalProb <= (1 - targetQuantile)) {
        return {
          recommendedTarget: lastMultiplier,
          survivalProb: survivalProb
        };
      }
      
      lastMultiplier = multiplier;
    }
    
    return {
      recommendedTarget: this._calculateQuantile(history, targetQuantile),
      survivalProb: 1 - targetQuantile
    };
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

    /**
   * 🌙 PHASE 1.1: POST-MOON CAUTION DETECTION
   * Detects if a "moon shot" (exceptionally high multiplier) occurred recently.
   * 
   * Logic:
   * - Calculates 90th percentile of last 50 rounds (dynamic threshold)
   * - Checks if ANY of the last 50 rounds exceeded this threshold
   * - Returns multiplier to apply (0.85 = 15% reduction, 1.0 = no change)
   * 
   * @param {number[]} recent50 - Array of last 50 multipliers
   * @returns {object} { multiplier, detected, threshold, reasoning }
   */
  _detectPostMoonCondition(recent50) {
    if (!recent50 || recent50.length < 10) {
      // Not enough data - skip this feature
      return { 
        multiplier: 1.0, 
        detected: false, 
        threshold: null,
        reasoning: 'Insufficient data for moon detection'
      };
    }

    // Calculate dynamic moon threshold (90th percentile of recent 50)
    const moonThreshold = this._calculateQuantile(recent50, 0.90);
    
    // Check if ANY recent round was a moon shot
    const recentMoonShot = recent50.find(m => m >= moonThreshold);
    
    if (recentMoonShot) {
      console.log(`🌙 POST-MOON DETECTED: ${recentMoonShot.toFixed(2)}x exceeded threshold ${moonThreshold.toFixed(2)}x`);
      return {
        multiplier: 0.85,  // 15% reduction
        detected: true,
        threshold: moonThreshold,
        moonValue: recentMoonShot,
        reasoning: `Moon shot detected (${recentMoonShot.toFixed(2)}x) - Applying 15% caution`
      };
    }
    
    // No moon shot detected
    return {
      multiplier: 1.0,
      detected: false,
      threshold: moonThreshold,
      reasoning: 'No recent moon shots detected'
    };
  }
  
  /**
 * 🔥 PHASE 1.2: BUST STREAK COUNTER
 * Counts consecutive crashes below threshold in recent history
 * 
 * Logic:
 * - Scans last N rounds from most recent
 * - Stops counting when hit a round >= threshold
 * - Used to detect "bust clusters" that signal rebound
 * 
 * @param {number[]} history - Recent crash history (newest first)
 * @param {number} window - How many rounds to check (e.g., 10)
 * @param {number} threshold - Bust definition (e.g., 1.5x)
 * @returns {number} Count of consecutive busts (0-10)
 */
_countRecentBusts(history, window = 10, threshold = 1.5) {
  if (!history || history.length === 0) return 0;
    
    let bustCount = 0;
    const recentRounds = history.slice(0, window);
    
    // Count consecutive busts from most recent
    for (const multiplier of recentRounds) {
      if (multiplier < threshold) {
        bustCount++;
      } else {
        // Streak broken by non-bust
        break;
      }
    }
    
    return bustCount;
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