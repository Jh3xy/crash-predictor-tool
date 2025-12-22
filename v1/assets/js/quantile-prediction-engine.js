
/**
 * 🎯 QUANTILE-BASED PREDICTION ENGINE v1.5
 * NEW FEATURES: Volume Detection, Kelly Criterion Betting
 * Based on combined recommendations from DeepSeek, Gemini, and mathematical analysis
 * Core principle: Target 40th percentile for 60% win rate
 */

export class QuantilePredictionEngine {
  constructor() {
    this.name = "Quantile Engine v1.5 - With Volume Detection & Kelly";
    
    // 🆕 EXPANDED Feature flags
    this.features = {
      winsorization: false,
      houseEdgeBlend: true,
      dynamicConfidence: false,
      volumeDetection: false,    // 🆕 Detect high-volume bust clusters
      kellyBetting: false         // 🆕 Kelly Criterion bet sizing
    };
    
    this.houseEdge = 0.01; // 1% house edge

    // Raw history buffer (stores actual multipliers)
    this.rawHistory = [];
    this.MAX_HISTORY = 2000;
    
    // Target quantile (adjusts via Bayesian calibration)
    this.targetQuantile = 0.40; // 40th percentile = 60% win rate
    this.targetWinRate = 0.60;
    
    // Prediction tracking
    this.predictionStats = {
      totalPredictions: 0,
      successCount: 0,
      failureCount: 0,
      winRate: 0.50,
      calibrationHistory: []
    };
    
    console.log("🎯 Quantile Engine v1.5 Initialized");
    console.log("🆕 New Features: Volume Detection, Kelly Criterion");
  }

  /**
   * 🔥 PASSIVE LEARNING - Store every round
   */
  learnFromMarketData(multiplier) {
    if (!multiplier || multiplier <= 0 || !Number.isFinite(multiplier)) return;
    
    this.rawHistory.unshift(multiplier);
    if (this.rawHistory.length > this.MAX_HISTORY) {
      this.rawHistory.length = this.MAX_HISTORY;
    }
    
    if (this.rawHistory.length % 50 === 0) {
      const stats = this._calculateStats(this.rawHistory.slice(0, 500));
      console.log(`📊 Market Learning: ${this.rawHistory.length} rounds`);
      console.log(`   Median: ${stats.median.toFixed(2)}x, Mean: ${stats.mean.toFixed(2)}x, Volatility: ${stats.volatility.toFixed(2)}`);
    }
  }

  /**
   * 🎯 PREDICT - Quantile-based with Bayesian calibration
   */
  predict(history) {
    if (!history || history.length < 50) {
      return this._errorResponse("Need at least 50 rounds of history");
    }

    let cleanHistory = this._cleanData(history.slice(0, 500));

    // 🔥 FEATURE: Winsorization (trim outliers)
    if (this.features.winsorization) {
      const p99 = this._calculateQuantile(cleanHistory, 0.99);
      cleanHistory = cleanHistory.map(v => Math.min(v, p99));
      console.log(`📊 Winsorized at 99th percentile: ${p99.toFixed(2)}x`);
    }

    const recent50 = cleanHistory.slice(0, 50);
    const recent20 = cleanHistory.slice(0, 20);
    
    // 🆕 FEATURE: Volume Detection - Detect bust clusters
    let volumeAdjustment = 1.0;
    if (this.features.volumeDetection) {
      volumeAdjustment = this._detectBustVolume(recent20);
      if (volumeAdjustment !== 1.0) {
        console.log(`📊 Volume adjustment: ${volumeAdjustment.toFixed(2)}x (${volumeAdjustment < 1 ? 'bust cluster detected' : 'low bust rate'})`);
      }
    }

    // Calculate market statistics
    const stats = this._calculateStats(cleanHistory);
    const recentStats = this._calculateStats(recent50);
    
    // 1. Base target: Empirical quantile
    const empirical = this._calculateQuantile(cleanHistory, this.targetQuantile);
    const theoretical = (1 - this.houseEdge) / this.targetWinRate; // ~1.65x

    let target;
    if (this.features.houseEdgeBlend && cleanHistory.length < 500) {
      // Blend for small samples
      const blend = 0.5;
      target = blend * empirical + (1 - blend) * theoretical;
      console.log(`📊 Blended target: ${empirical.toFixed(2)}x (empirical) + ${theoretical.toFixed(2)}x (theoretical) = ${target.toFixed(2)}x`);
    } else {
      target = empirical;
    }
    
    console.log(`📊 Base quantile (${(this.targetQuantile * 100).toFixed(0)}th percentile): ${target.toFixed(2)}x`);
    
    // 2. Volatility + Volume adjustments
    const volatilityMultiplier = this._getVolatilityAdjustment(recentStats.volatility, stats.volatility);
    target *= volatilityMultiplier * volumeAdjustment; // Apply both
    
    console.log(`📊 After volatility (${volatilityMultiplier.toFixed(2)}x) + volume (${volumeAdjustment.toFixed(2)}x): ${target.toFixed(2)}x`);
    
    // 3. Bootstrap confidence interval
    const lowerBound = this._bootstrapQuantile(cleanHistory, this.targetQuantile * 0.75, 100);
    target = Math.max(target, lowerBound);
    
    console.log(`📊 Bootstrap lower bound: ${lowerBound.toFixed(2)}x, Final: ${target.toFixed(2)}x`);
    
    // 4. Cap extremes
    target = Math.max(1.1, Math.min(target, 8.0));
    
    // Calculate confidence
    let confidence;
    if (this.features.dynamicConfidence) {
      // Calculate bootstrap variance
      const bootstrapSamples = [];
      for (let i = 0; i < 50; i++) {
        bootstrapSamples.push(this._bootstrapQuantile(cleanHistory, this.targetQuantile, 50));
      }
      const bootstrapStd = this._standardDeviation(bootstrapSamples);
      const variancePenalty = (bootstrapStd / target) * 50;
      confidence = Math.max(30, Math.min(95, 70 - variancePenalty));
      console.log(`📊 Dynamic confidence: std=${bootstrapStd.toFixed(3)}, penalty=${variancePenalty.toFixed(1)}, conf=${confidence.toFixed(1)}%`);
    } else {
      confidence = this._calculateConfidence(cleanHistory, target, stats);
    }
    
    // Determine action
    const action = this._determineAction(confidence, target, recentStats.volatility);
    
    // Safety exit
    const safetyExit = this._calculateQuantile(cleanHistory, 0.30);
    
    // 🆕 FEATURE: Kelly Criterion bet sizing
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
      
      // Ranges
      predictedRange: [target * 0.85, target * 1.25],
      safetyZone: Math.max(1.1, safetyExit),
      
      // Metrics
      riskLevel: recentStats.volatility > 2.5 ? 'HIGH' : recentStats.volatility > 1.8 ? 'MEDIUM' : 'LOW',
      volatility: recentStats.volatility.toFixed(2),
      
      // Context
      marketMedian: stats.median.toFixed(2),
      recentMedian: recentStats.median.toFixed(2),
      targetQuantile: (this.targetQuantile * 100).toFixed(0) + 'th percentile',
      predictionWinRate: (this.predictionStats.winRate * 100).toFixed(1) + '%',
      historyAnalyzed: cleanHistory.length,
      
      // 🆕 Kelly Criterion (if enabled)
      kellyBetSize: kellyBetSize,
      
      error: false
    };
  }

  /**
   * 🆕 VOLUME DETECTION: Detect bust clusters
   * If recent 20 rounds have high bust rate (>60%), be MORE conservative
   */
  _detectBustVolume(recent20) {
    const bustCount = recent20.filter(m => m < 2.0).length;
    const bustRate = bustCount / recent20.length;
    
    if (bustRate > 0.70) {
      // VERY HIGH bust cluster - reduce target significantly
      return 0.85;
    } else if (bustRate > 0.60) {
      // High bust cluster - reduce target moderately
      return 0.92;
    } else if (bustRate < 0.40) {
      // Low bust rate - can be slightly aggressive
      return 1.05;
    }
    
    return 1.0; // Normal
  }

  /**
   * 🆕 KELLY CRITERION: Calculate optimal bet size
   * Kelly % = (bp - q) / b
   * Where: b = odds-1, p = win probability, q = loss probability
   */
  _calculateKellyBet(confidence, target) {
    const winProb = confidence / 100;
    const lossProb = 1 - winProb;
    const odds = target; // Payout multiplier
    
    // Full Kelly
    const kellyPercent = ((odds * winProb) - lossProb) / odds;
    
    // Fractional Kelly (0.25 = Quarter Kelly, safer)
    const fractionalKelly = kellyPercent * 0.25;
    
    // Cap between 0% and 5% of bankroll
    const cappedKelly = Math.max(0, Math.min(fractionalKelly, 0.05));
    
    return {
      full: Math.max(0, kellyPercent * 100).toFixed(1) + '%',
      fractional: (fractionalKelly * 100).toFixed(1) + '%',
      recommended: (cappedKelly * 100).toFixed(1) + '%'
    };
  }

  _standardDeviation(arr) {
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    const variance = arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / arr.length;
    return Math.sqrt(variance);
  }

  /**
   * Calculate empirical quantile
   */
  _calculateQuantile(data, quantile) {
    if (!data || data.length === 0) return 1.5;
    
    const sorted = [...data].sort((a, b) => a - b);
    const index = Math.floor(quantile * sorted.length);
    return sorted[Math.min(index, sorted.length - 1)];
  }

  /**
   * Bootstrap quantile estimation
   */
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

  /**
   * Volatility adjustment multiplier
   */
  _getVolatilityAdjustment(recentVol, longTermVol) {
    const ratio = recentVol / Math.max(0.1, longTermVol);
    
    if (ratio > 1.5) return 0.85;      // High volatility - very conservative
    else if (ratio > 1.2) return 0.92; // Moderate volatility
    else if (ratio < 0.7) return 1.05; // Low volatility - slightly aggressive
    
    return 1.0; // Normal
  }

  /**
   * Calculate confidence
   */
  _calculateConfidence(history, target, stats) {
    let confidence = 50;
    
    // Sample size boost
    const sampleBoost = Math.min(20, (history.length / 500) * 20);
    confidence += sampleBoost;
    
    // Track record
    if (this.predictionStats.totalPredictions >= 10) {
      const trackRecordBoost = (this.predictionStats.winRate - 0.50) * 40;
      confidence += trackRecordBoost;
    }
    
    // Volatility penalty
    if (stats.volatility > 2.5) confidence -= 15;
    else if (stats.volatility < 1.5) confidence += 10;
    
    // Target realism
    const medianRatio = target / stats.median;
    if (medianRatio > 1.5 || medianRatio < 0.7) confidence -= 10;
    
    return Math.max(30, Math.min(95, confidence));
  }

  /**
   * Determine action
   */
  _determineAction(confidence, target, volatility) {
    if (confidence >= 70 && volatility < 2.0) {
      return {
        type: 'STRONG BET',
        message: `High confidence: ${target.toFixed(2)}x target`,
        reasoning: `${confidence.toFixed(0)}% confidence, stable market`
      };
    } else if (confidence >= 55) {
      return {
        type: 'MODERATE BET',
        message: `Good signal: Target ${target.toFixed(2)}x`,
        reasoning: `${confidence.toFixed(0)}% confidence`
      };
    } else if (confidence >= 40) {
      return {
        type: 'CAUTIOUS BET',
        message: `Conservative play: Exit early recommended`,
        reasoning: `${confidence.toFixed(0)}% confidence - use safety exit`
      };
    } else {
      return {
        type: 'OBSERVE',
        message: `Low confidence: Minimal bet or skip`,
        reasoning: `${confidence.toFixed(0)}% confidence - weak signals`
      };
    }
  }

  /**
   * 🔥 BAYESIAN CALIBRATION
   */
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
    
    console.log(`📊 Prediction Update:`, {
      total: this.predictionStats.totalPredictions,
      wins: this.predictionStats.successCount,
      winRate: (this.predictionStats.winRate * 100).toFixed(1) + '%',
      targetQuantile: (this.targetQuantile * 100).toFixed(1) + 'th percentile'
    });
  }

  /**
   * Auto-adjust quantile
   */
  _calibrateQuantile() {
    const currentWinRate = this.predictionStats.winRate;
    const error = this.targetWinRate - currentWinRate;
    
    console.log(`🔧 Calibrating: Target ${(this.targetWinRate * 100).toFixed(0)}%, Actual ${(currentWinRate * 100).toFixed(1)}%`);
    
    const learningRate = 0.02;
    this.targetQuantile = Math.max(0.20, Math.min(0.60, this.targetQuantile + error * learningRate));
    
    console.log(`   New quantile: ${(this.targetQuantile * 100).toFixed(1)}th percentile`);
  }

  /**
   * Calculate statistics
   */
  _calculateStats(data) {
    if (!data || data.length === 0) {
      return { mean: 0, median: 0, volatility: 0 };
    }
    
    const sorted = [...data].sort((a, b) => a - b);
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const median = sorted[Math.floor(sorted.length / 2)];
    
    const variance = data.reduce((sum, val) => 
      sum + Math.pow(val - mean, 2), 0) / data.length;
    const volatility = Math.sqrt(variance);
    
    return { mean, median, volatility };
  }

  /**
   * Get statistics
   */
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
      targetWinRate: (this.targetWinRate * 100).toFixed(0) + '%'
    };
  }

  // Helper functions
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
