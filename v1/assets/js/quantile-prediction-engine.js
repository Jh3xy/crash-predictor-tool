

/**
 * 🎯 QUANTILE-BASED PREDICTION ENGINE v2.0
 * CLEAN VERSION: Starts with YOUR proven baseline
 * NEW FEATURES: All toggleable (OFF by default)
 * 
 * YOUR BASELINE (55-58% accuracy):
 * - houseEdgeBlend: true (ONLY THIS ONE)
 * - All others: false
 * 
 * NEW FEATURES (test one by one):
 * - kaplanMeier: Survival analysis
 * - weibullHazard: Instantaneous risk
 * - cusumDetection: Regime shift detection
 */

export class QuantilePredictionEngine {
  constructor() {
    this.name = "Quantile Engine v2.0 - Modular Testing";
    
    // ✅ YOUR PROVEN BASELINE (DO NOT CHANGE)
    this.features = {
      winsorization: false,
      houseEdgeBlend: true,      // ✅ Only enabled feature
      dynamicConfidence: false,
      volumeDetection: false,
      kellyBetting: false,
      
      // 🆕 NEW FEATURES (All OFF by default - test one at a time)
      kaplanMeier: true,      // Toggle in browser: predictor.engine.features.kaplanMeier = true
      weibullHazard: false,    // Toggle in browser: predictor.engine.features.weibullHazard = true
      cusumDetection: false    // Toggle in browser: predictor.engine.features.cusumDetection = true
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
    
    // CUSUM state
    this.cusum = {
      statistic: 0,
      mean: 2.0,
      slack: 0.5,
      threshold: 4.0,
      alertActive: false
    };
    
    console.log("🎯 Quantile Engine v2.0 Initialized");
    console.log("📊 Baseline Config:", this.features);
    console.log("💡 To test features: predictor.engine.features.kaplanMeier = true");
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
    
    if (this.rawHistory.length % 50 === 0) {
      const stats = this._calculateStats(this.rawHistory.slice(0, 500));
      console.log(`📊 Market: ${this.rawHistory.length} rounds, Median: ${stats.median.toFixed(2)}x`);
    }
  }

  /**
   * 🆕 CUSUM CHANGE-POINT DETECTION
   */
  _updateCUSUM(multiplier) {
    this.cusum.statistic = Math.max(0, 
      this.cusum.statistic + multiplier - this.cusum.mean - this.cusum.slack
    );
    
    if (this.cusum.statistic > this.cusum.threshold) {
      if (!this.cusum.alertActive) {
        console.log('🔴 CUSUM: Cold streak detected');
        this.cusum.alertActive = true;
      }
    } else if (this.cusum.statistic < 1.0 && this.cusum.alertActive) {
      console.log('✅ CUSUM: Market normalized');
      this.cusum.alertActive = false;
    }
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
    
    // ===== BASE PREDICTION (Your proven method) =====
    const empirical = this._calculateQuantile(cleanHistory, this.targetQuantile);
    const theoretical = (1 - this.houseEdge) / this.targetWinRate;

    let target;
    if (this.features.houseEdgeBlend && cleanHistory.length < 500) {
      const blend = 0.5;
      target = blend * empirical + (1 - blend) * theoretical;
    } else {
      target = empirical;
    }
    
    console.log(`📊 Base target: ${target.toFixed(2)}x (empirical: ${empirical.toFixed(2)}x)`);
    
    // ===== NEW FEATURE 1: Kaplan-Meier (if enabled) =====
    if (this.features.kaplanMeier) {
      const kmResult = this._kaplanMeierPredict(cleanHistory, this.targetQuantile);
      const kmTarget = kmResult.recommendedTarget;
      
      // Blend KM with base target
      target = (target + kmTarget) / 2;
      console.log(`📊 Kaplan-Meier: ${kmTarget.toFixed(2)}x → Final: ${target.toFixed(2)}x`);
    }
    
    // ===== NEW FEATURE 2: Weibull Hazard (if enabled) =====
    let hazardMultiplier = 1.0;
    if (this.features.weibullHazard) {
      const hazard = this._calculateWeibullHazard(cleanHistory);
      hazardMultiplier = hazard.multiplier;
      console.log(`📊 Weibull: ${hazard.interpretation} → ${hazard.multiplier.toFixed(2)}x adjustment`);
    }
    
    // ===== NEW FEATURE 3: CUSUM (if enabled) =====
    let cusumMultiplier = 1.0;
    let cusumWarning = null;
    if (this.features.cusumDetection && this.cusum.alertActive) {
      cusumMultiplier = 0.85;
      cusumWarning = 'BUST CLUSTER ACTIVE';
      console.log(`🔴 CUSUM: Alert active → 0.85x adjustment`);
    }
    
    // ===== OLD FEATURES (if enabled) =====
    let volumeMultiplier = 1.0;
    if (this.features.volumeDetection) {
      volumeMultiplier = this._detectBustVolume(recent20);
    }
    
    let volatilityMultiplier = 1.0;
    if (this.features.dynamicConfidence) {
      volatilityMultiplier = this._getVolatilityAdjustment(recentStats.volatility, stats.volatility);
    }
    
    // Apply all adjustments
    target *= hazardMultiplier * cusumMultiplier * volumeMultiplier * volatilityMultiplier;
    
    // Bootstrap confidence
    const lowerBound = this._bootstrapQuantile(cleanHistory, this.targetQuantile * 0.75, 100);
    target = Math.max(target, lowerBound);
    
    // Cap extremes
    target = Math.max(1.1, Math.min(target, 8.0));
    
    // Calculate confidence
    let confidence = this._calculateConfidence(cleanHistory, target, stats);
    
    if (this.features.cusumDetection && this.cusum.alertActive) {
      confidence *= 0.85;
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
      safetyZone: Math.max(1.1, safetyExit),
      
      riskLevel: recentStats.volatility > 2.5 ? 'HIGH' : recentStats.volatility > 1.8 ? 'MEDIUM' : 'LOW',
      volatility: recentStats.volatility.toFixed(2),
      
      // New metrics (only if features enabled)
      cusumAlert: this.features.cusumDetection ? this.cusum.alertActive : null,
      cusumWarning: cusumWarning,
      survivalProbability: this.features.kaplanMeier 
        ? this._kaplanMeierSurvival(cleanHistory, target).toFixed(3)
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

  /**
   * 🆕 KAPLAN-MEIER SURVIVAL FUNCTION
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
   * 🆕 WEIBULL HAZARD FUNCTION
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
    if (cusumAlert) {
      return {
        type: 'SKIP ROUND',
        message: `⚠️ Regime shift - Skip round`,
        reasoning: `CUSUM alert: Bust cluster active`
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