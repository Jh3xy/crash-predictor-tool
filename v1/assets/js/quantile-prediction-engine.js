
/**
 * 🎯 QUANTILE-BASED PREDICTION ENGINE
 * Based on combined recommendations from DeepSeek, Gemini, and mathematical analysis
 * Core principle: Target 40th percentile for 60% win rate
 * NO mean reversion, NO averaging - pure statistical quantile targeting
 */

export class QuantilePredictionEngine {
  constructor() {
    this.name = "Quantile Engine - Reviews Approved";
    
    // Feature flags
    this.features = {
      winsorization: false,
      houseEdgeBlend: false,
      dynamicConfidence: false
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
      calibrationHistory: [] // Track last 20 for calibration
    };
    
    console.log("🎯 Quantile Engine Initialized");
    console.log("📊 Target: 40th percentile for 60% win rate");
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

    // 🔥 NEW: Winsorization (trim outliers)
    if (this.features.winsorization) {
      const p99 = this._calculateQuantile(cleanHistory, 0.99);
      cleanHistory = cleanHistory.map(v => Math.min(v, p99));
      console.log(`📊 Winsorized at 99th percentile: ${p99.toFixed(2)}x`);
    }

    const recent50 = cleanHistory.slice(0, 50);
    const recent20 = cleanHistory.slice(0, 20);

    
    // Calculate market statistics
    const stats = this._calculateStats(cleanHistory);
    const recentStats = this._calculateStats(recent50);
    
    // 1. Base target: Empirical quantile
    // let target = this._calculateQuantile(cleanHistory, this.targetQuantile);

    // NEW CODE:
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
    
    // 2. Volatility adjustment (Reviews: Be conservative in chaos)
    const volatilityMultiplier = this._getVolatilityAdjustment(recentStats.volatility, stats.volatility);
    target *= volatilityMultiplier;
    
    console.log(`📊 After volatility adjustment (${volatilityMultiplier.toFixed(2)}x): ${target.toFixed(2)}x`);
    
    // 3. Bootstrap confidence interval (Reviews: Safety bounds)
    const lowerBound = this._bootstrapQuantile(cleanHistory, this.targetQuantile * 0.75, 100);
    target = Math.max(target, lowerBound); // Don't go below safety bound
    
    console.log(`📊 Bootstrap lower bound: ${lowerBound.toFixed(2)}x, Final: ${target.toFixed(2)}x`);
    
    // 4. Cap extremes
    target = Math.max(1.1, Math.min(target, 8.0));
    
    // Calculate confidence
    // const confidence = this._calculateConfidence(cleanHistory, target, stats);

    // NEW CODE:
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
    
    // Determine action based on confidence
    const action = this._determineAction(confidence, target, recentStats.volatility);
    
    // Safety exit (30th percentile - Reviews recommendation)
    const safetyExit = this._calculateQuantile(cleanHistory, 0.30);
    
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
      
      error: false
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
   * Bootstrap quantile estimation (for confidence intervals)
   */
  _bootstrapQuantile(data, quantile, iterations) {
    const results = [];
    const n = data.length;
    
    for (let i = 0; i < iterations; i++) {
      // Resample with replacement
      const sample = [];
      for (let j = 0; j < n; j++) {
        sample.push(data[Math.floor(Math.random() * n)]);
      }
      results.push(this._calculateQuantile(sample, quantile));
    }
    
    // Return 10th percentile of bootstrap samples (conservative)
    return this._calculateQuantile(results, 0.10);
  }

  /**
   * Volatility adjustment multiplier
   */
  _getVolatilityAdjustment(recentVol, longTermVol) {
    const ratio = recentVol / Math.max(0.1, longTermVol);
    
    if (ratio > 1.5) {
      // High volatility - very conservative
      return 0.85;
    } else if (ratio > 1.2) {
      // Moderate volatility - slightly conservative
      return 0.92;
    } else if (ratio < 0.7) {
      // Low volatility - can be slightly aggressive
      return 1.05;
    }
    
    return 1.0; // Normal
  }

  /**
   * Calculate confidence based on sample size and distribution stability
   */
  _calculateConfidence(history, target, stats) {
    let confidence = 50; // Start neutral
    
    // 1. Sample size boost
    const sampleBoost = Math.min(20, (history.length / 500) * 20);
    confidence += sampleBoost;
    
    // 2. Prediction track record
    if (this.predictionStats.totalPredictions >= 10) {
      const trackRecordBoost = (this.predictionStats.winRate - 0.50) * 40;
      confidence += trackRecordBoost;
    }
    
    // 3. Volatility penalty
    if (stats.volatility > 2.5) {
      confidence -= 15;
    } else if (stats.volatility < 1.5) {
      confidence += 10;
    }
    
    // 4. Target realism check
    const medianRatio = target / stats.median;
    if (medianRatio > 1.5 || medianRatio < 0.7) {
      confidence -= 10; // Target far from median
    }
    
    return Math.max(30, Math.min(95, confidence));
  }

  /**
   * Determine action based on confidence
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
   * 🔥 BAYESIAN CALIBRATION - Adjust quantile based on actual performance
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
    
    // Track for calibration
    this.predictionStats.calibrationHistory.unshift({ predicted, actual, success });
    if (this.predictionStats.calibrationHistory.length > 20) {
      this.predictionStats.calibrationHistory.length = 20;
    }
    
    // Calibrate quantile after 10+ predictions
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
   * Auto-adjust quantile to reach target win rate
   */
  _calibrateQuantile() {
    const currentWinRate = this.predictionStats.winRate;
    const error = this.targetWinRate - currentWinRate;
    
    console.log(`🔧 Calibrating quantile: Target ${(this.targetWinRate * 100).toFixed(0)}%, Actual ${(currentWinRate * 100).toFixed(1)}%`);
    
    // Adjust quantile with small learning rate
    const learningRate = 0.02;
    this.targetQuantile = Math.max(0.20, Math.min(0.60, this.targetQuantile + error * learningRate));
    
    console.log(`   New quantile: ${(this.targetQuantile * 100).toFixed(1)}th percentile`);
  }

  /**
   * Calculate comprehensive statistics
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
   * Get current statistics
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