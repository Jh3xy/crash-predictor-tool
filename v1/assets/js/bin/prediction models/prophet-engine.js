

/**
 * 🔮 PROPHET ENGINE v2.0
 * Statistical Crash Prediction System
 * 
 * GOAL: 70-80% accuracy by predicting RANGES, not exact values
 * STRATEGY: Multi-model ensemble with adaptive weighting
 */

export class ProphetEngine {
  constructor() {
    this.name = "Prophet v2.0";
    this.models = {
      streakDetector: { weight: 0.25, enabled: true },
      volatilityPredictor: { weight: 0.20, enabled: true },
      regressionAnalyzer: { weight: 0.25, enabled: true },
      frequencyMapper: { weight: 0.15, enabled: true },
      momentumTracker: { weight: 0.15, enabled: true }
    };
    
    // Performance tracking
    this.recentPredictions = [];
    this.maxHistoryTracking = 50;
    
    console.log("🔮 Prophet Engine v2.0 Initialized");
  }

  /**
   * MAIN PREDICTION METHOD
   * @param {number[]} history - Crash multipliers (NEWEST FIRST)
   * @returns {object} Prediction with confidence and risk assessment
   */
  predict(history) {
    // Validation
    if (!history || history.length < 50) {
      return {
        error: true,
        message: "Need at least 50 rounds of history",
        confidence: 0
      };
    }

    // Clean and prepare data
    const cleanHistory = this._cleanData(history.slice(0, 500));
    
    // Extract features from history
    const features = this._extractFeatures(cleanHistory);
    
    // Run all prediction models
    const modelPredictions = this._runModels(cleanHistory, features);
    
    // Combine predictions using weighted ensemble
    const consensus = this._calculateConsensus(modelPredictions);
    
    // Calculate confidence based on model agreement
    const confidence = this._calculateConfidence(modelPredictions, features);
    
    // Generate actionable recommendation
    const recommendation = this._generateRecommendation(consensus, confidence, features);
    
    return {
      // Core prediction
      predictedRange: consensus.range,
      mostLikely: consensus.mostLikely,
      
      // Risk assessment
      safetyZone: consensus.safetyZone,
      dangerZone: consensus.dangerZone,
      bustProbability: consensus.bustProb,
      
      // Confidence metrics
      confidence: confidence,
      modelAgreement: this._calculateAgreement(modelPredictions),
      
      // Context
      currentTrend: features.trend,
      volatility: features.volatility,
      streakInfo: features.streakInfo,
      
      // Recommendation
      action: recommendation.action,
      reasoning: recommendation.reasoning,
      
      // Metadata
      modelsUsed: Object.keys(this.models).filter(m => this.models[m].enabled),
      historyAnalyzed: cleanHistory.length
    };
  }

  /**
   * DATA CLEANING - Remove outliers and validate
   */
  _cleanData(history) {
    return history
      .map(v => parseFloat(v))
      .filter(v => !isNaN(v) && v > 0 && v < 1000); // Remove invalid
  }

  /**
   * FEATURE EXTRACTION - Convert raw data to meaningful signals
   */
  _extractFeatures(history) {
    const recent5 = history.slice(0, 5);
    const recent20 = history.slice(0, 20);
    const recent100 = history.slice(0, 100);
    const full = history;

    return {
      // 1. STREAK DETECTION
      streakInfo: this._detectStreak(recent20),
      
      // 2. VOLATILITY METRICS
      volatility: this._calculateVolatility(recent100),
      volatilityTrend: this._getVolatilityTrend(full),
      
      // 3. REGRESSION SIGNALS
      deviation: this._calculateDeviation(recent20, full),
      regressionPressure: this._getRegressionPressure(recent20, full),
      
      // 4. FREQUENCY ANALYSIS
      distribution: this._getDistribution(full),
      recentBias: this._getRecentBias(recent20, full),
      
      // 5. MOMENTUM
      momentum: this._calculateMomentum(recent5),
      trend: this._getTrend(recent20),
      
      // 6. TIME-BASED
      timeSinceSpike: this._getTimeSinceSpike(recent100),
      cyclePosition: this._getCyclePosition(full)
    };
  }

  /**
   * MODEL 1: STREAK DETECTOR
   * Logic: After N consecutive low crashes, high crash probability increases
   */
  _modelStreakDetector(history, features) {
    const streak = features.streakInfo;
    
    // Low streak (>4 crashes under 2x)
    if (streak.type === 'low' && streak.count >= 4) {
      return {
        range: [2.5, 8.0],
        mostLikely: 3.5,
        confidence: Math.min(85, 50 + (streak.count * 8)),
        reasoning: `${streak.count} low crashes detected - correction likely`
      };
    }
    
    // High streak (>2 crashes over 5x)
    if (streak.type === 'high' && streak.count >= 2) {
      return {
        range: [1.0, 2.0],
        mostLikely: 1.3,
        confidence: 70,
        reasoning: "High streak exhaustion - low crash expected"
      };
    }
    
    // No clear streak
    return {
      range: [1.5, 3.0],
      mostLikely: 2.0,
      confidence: 40,
      reasoning: "No strong streak pattern"
    };
  }

  /**
   * MODEL 2: VOLATILITY PREDICTOR
   * Logic: High volatility → predict regression to mean
   */
  _modelVolatilityPredictor(history, features) {
    const vol = features.volatility;
    const mean = this._mean(history.slice(0, 100));
    
    if (vol > 2.5) {
      // High volatility - expect mean reversion
      return {
        range: [mean * 0.7, mean * 1.3],
        mostLikely: mean,
        confidence: 65,
        reasoning: "High volatility - reverting to mean"
      };
    }
    
    if (vol < 1.0) {
      // Low volatility - stable period
      return {
        range: [mean * 0.8, mean * 1.2],
        mostLikely: mean,
        confidence: 55,
        reasoning: "Low volatility - stable range"
      };
    }
    
    return {
      range: [1.5, mean * 1.5],
      mostLikely: mean,
      confidence: 50,
      reasoning: "Moderate volatility"
    };
  }

  /**
   * MODEL 3: REGRESSION ANALYZER
   * Logic: Deviations from baseline must correct
   */
  _modelRegressionAnalyzer(history, features) {
    const recent = history.slice(0, 20);
    const baseline = history.slice(0, 200);
    
    const recentAvg = this._mean(recent);
    const baselineAvg = this._mean(baseline);
    const deviation = ((recentAvg - baselineAvg) / baselineAvg) * 100;
    
    // Recent crashes are too low
    if (deviation < -15) {
      return {
        range: [baselineAvg * 0.9, baselineAvg * 2.0],
        mostLikely: baselineAvg * 1.3,
        confidence: 75,
        reasoning: `Recent avg ${deviation.toFixed(1)}% below baseline - correction due`
      };
    }
    
    // Recent crashes are too high
    if (deviation > 15) {
      return {
        range: [1.0, baselineAvg * 0.8],
        mostLikely: baselineAvg * 0.6,
        confidence: 70,
        reasoning: `Recent avg ${deviation.toFixed(1)}% above baseline - pullback likely`
      };
    }
    
    return {
      range: [baselineAvg * 0.7, baselineAvg * 1.3],
      mostLikely: baselineAvg,
      confidence: 60,
      reasoning: "Recent performance aligned with baseline"
    };
  }

  /**
   * MODEL 4: FREQUENCY MAPPER
   * Logic: Certain multipliers appear more often - use distribution
   */
  _modelFrequencyMapper(history, features) {
    const dist = features.distribution;
    const mostCommon = this._getMostCommonRange(dist);
    
    return {
      range: mostCommon.range,
      mostLikely: mostCommon.center,
      confidence: mostCommon.frequency > 0.3 ? 65 : 45,
      reasoning: `${(mostCommon.frequency * 100).toFixed(1)}% of crashes in this range`
    };
  }

  /**
   * MODEL 5: MOMENTUM TRACKER
   * Logic: Recent direction predicts next move
   */
  _modelMomentumTracker(history, features) {
    const momentum = features.momentum;
    const last = history[0];
    
    if (momentum === 'rising') {
      return {
        range: [last * 0.8, last * 2.0],
        mostLikely: last * 1.2,
        confidence: 55,
        reasoning: "Upward momentum detected"
      };
    }
    
    if (momentum === 'falling') {
      return {
        range: [1.0, last * 0.7],
        mostLikely: last * 0.5,
        confidence: 55,
        reasoning: "Downward momentum detected"
      };
    }
    
    return {
      range: [last * 0.7, last * 1.3],
      mostLikely: last,
      confidence: 45,
      reasoning: "Sideways momentum"
    };
  }

  /**
   * RUN ALL MODELS AND COLLECT PREDICTIONS
   */
  _runModels(history, features) {
    return {
      streakDetector: this._modelStreakDetector(history, features),
      volatilityPredictor: this._modelVolatilityPredictor(history, features),
      regressionAnalyzer: this._modelRegressionAnalyzer(history, features),
      frequencyMapper: this._modelFrequencyMapper(history, features),
      momentumTracker: this._modelMomentumTracker(history, features)
    };
  }

  /**
   * CONSENSUS CALCULATION - Weighted ensemble
   */
  _calculateConsensus(predictions) {
    let weightedSum = 0;
    let totalWeight = 0;
    let ranges = [];
    
    for (const [name, pred] of Object.entries(predictions)) {
      const model = this.models[name];
      if (!model.enabled) continue;
      
      const weight = model.weight * (pred.confidence / 100);
      weightedSum += pred.mostLikely * weight;
      totalWeight += weight;
      ranges.push(pred.range);
    }
    
    const mostLikely = totalWeight > 0 ? weightedSum / totalWeight : 2.0;
    
    // Calculate overlapping range
    const minRange = Math.max(...ranges.map(r => r[0]));
    const maxRange = Math.min(...ranges.map(r => r[1]));
    
    return {
      mostLikely: Math.max(1.01, Math.min(15.0, mostLikely)),
      range: [Math.max(1.01, minRange), Math.min(15.0, maxRange)],
      safetyZone: Math.max(1.01, mostLikely * 0.7), // Conservative exit
      dangerZone: mostLikely * 1.5, // Risky threshold
      bustProb: this._estimateBustProbability(predictions)
    };
  }

  /**
   * CONFIDENCE CALCULATION
   */
  _calculateConfidence(predictions, features) {
    const agreements = Object.values(predictions).map(p => p.mostLikely);
    const stdDev = this._stdDev(agreements);
    
    // Lower std dev = higher agreement = higher confidence
    let confidence = Math.max(30, 90 - (stdDev * 15));
    
    // Boost confidence for strong signals
    if (features.streakInfo.count >= 5) confidence += 10;
    if (features.regressionPressure > 0.7) confidence += 8;
    
    return Math.min(95, confidence);
  }

  /**
   * MODEL AGREEMENT SCORE
   */
  _calculateAgreement(predictions) {
    const values = Object.values(predictions).map(p => p.mostLikely);
    const mean = this._mean(values);
    const maxDiff = Math.max(...values.map(v => Math.abs(v - mean)));
    
    // Agreement is high when all models predict similar values
    return Math.max(0, 100 - (maxDiff * 10));
  }

  /**
   * GENERATE RECOMMENDATION
   */
  _generateRecommendation(consensus, confidence, features) {
    if (confidence > 70 && consensus.bustProb < 30) {
      return {
        action: "BET",
        reasoning: `High confidence (${confidence.toFixed(0)}%), low bust risk. Target: ${consensus.mostLikely.toFixed(2)}x`
      };
    }
    
    if (confidence > 60 && consensus.bustProb < 40) {
      return {
        action: "CAUTIOUS_BET",
        reasoning: `Moderate confidence. Use safety exit at ${consensus.safetyZone.toFixed(2)}x`
      };
    }
    
    if (confidence < 50 || consensus.bustProb > 50) {
      return {
        action: "SKIP",
        reasoning: "Low confidence or high bust risk. Wait for better signal."
      };
    }
    
    return {
      action: "OBSERVE",
      reasoning: "Unclear signal. Monitor next round."
    };
  }

  /**
   * ESTIMATE BUST PROBABILITY
   */
  _estimateBustProbability(predictions) {
    const lowPredictions = Object.values(predictions)
      .filter(p => p.mostLikely < 1.5).length;
    
    return (lowPredictions / Object.keys(predictions).length) * 100;
  }

  // ============================================
  // HELPER METHODS (Statistics & Feature Detection)
  // ============================================

  _detectStreak(recent) {
    let lowCount = 0;
    let highCount = 0;
    
    for (const val of recent) {
      if (val < 2.0) lowCount++;
      else if (val > 5.0) highCount++;
      else break; // Streak broken
    }
    
    if (lowCount >= 3) return { type: 'low', count: lowCount };
    if (highCount >= 2) return { type: 'high', count: highCount };
    return { type: 'none', count: 0 };
  }

  _calculateVolatility(data) {
    const mean = this._mean(data);
    return this._stdDev(data) / mean; // Coefficient of variation
  }

  _getVolatilityTrend(data) {
    const first100 = data.slice(0, 100);
    const second100 = data.slice(100, 200);
    
    const v1 = this._calculateVolatility(first100);
    const v2 = this._calculateVolatility(second100);
    
    return v1 > v2 ? 'increasing' : 'decreasing';
  }

  _calculateDeviation(recent, full) {
    return this._mean(recent) - this._mean(full);
  }

  _getRegressionPressure(recent, full) {
    const dev = this._calculateDeviation(recent, full);
    const baseline = this._mean(full);
    return Math.abs(dev / baseline);
  }

  _getDistribution(data) {
    const buckets = { low: 0, mid: 0, high: 0 };
    data.forEach(v => {
      if (v < 2.0) buckets.low++;
      else if (v < 5.0) buckets.mid++;
      else buckets.high++;
    });
    
    const total = data.length;
    return {
      low: buckets.low / total,
      mid: buckets.mid / total,
      high: buckets.high / total
    };
  }

  _getRecentBias(recent, full) {
    const recentDist = this._getDistribution(recent);
    const fullDist = this._getDistribution(full);
    
    return {
      lowBias: recentDist.low - fullDist.low,
      midBias: recentDist.mid - fullDist.mid,
      highBias: recentDist.high - fullDist.high
    };
  }

  _getMostCommonRange(dist) {
    if (dist.low > dist.mid && dist.low > dist.high) {
      return { range: [1.0, 2.0], center: 1.5, frequency: dist.low };
    }
    if (dist.mid > dist.low && dist.mid > dist.high) {
      return { range: [2.0, 5.0], center: 3.0, frequency: dist.mid };
    }
    return { range: [5.0, 15.0], center: 7.0, frequency: dist.high };
  }

  _calculateMomentum(recent) {
    if (recent.length < 3) return 'neutral';
    
    const first = recent[recent.length - 1];
    const last = recent[0];
    
    if (last > first * 1.2) return 'rising';
    if (last < first * 0.8) return 'falling';
    return 'neutral';
  }

  _getTrend(data) {
    const first = this._mean(data.slice(0, 5));
    const second = this._mean(data.slice(5, 10));
    
    if (first > second * 1.1) return 'upward';
    if (first < second * 0.9) return 'downward';
    return 'stable';
  }

  _getTimeSinceSpike(data) {
    for (let i = 0; i < data.length; i++) {
      if (data[i] > 10.0) return i;
    }
    return data.length;
  }

  _getCyclePosition(data) {
    // Simplified - just check if we're in a recovery or decline phase
    const recent50 = this._mean(data.slice(0, 50));
    const baseline = this._mean(data.slice(0, 200));
    
    if (recent50 < baseline * 0.9) return 'recovery_phase';
    if (recent50 > baseline * 1.1) return 'decline_phase';
    return 'equilibrium';
  }

  _mean(arr) {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  _stdDev(arr) {
    const mean = this._mean(arr);
    const variance = arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / arr.length;
    return Math.sqrt(variance);
  }
}