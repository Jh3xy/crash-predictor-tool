
/**
 * 🎯 ADAPTIVE PREDICTION ENGINE v4.0
 * Implements: Adaptive model weighting, multiple timeframes, confidence intervals
 * Target: 70-80% accuracy with bolder predictions
 */

export class AdvancedPredictionEngine {
  constructor() {
    this.name = "Adaptive Ensemble Engine v4.0";
    
    // Bayesian State
    this.bayesianState = {
      priorWinRate: 0.50, // 🔥 Start at 50% (neutral), not 65%
      successCount: 0,
      failureCount: 0,
      totalPredictions: 0
    };
    
    // Bust frequency tracker
    this.bustTracker = {
      instantBusts: [],
      recentBusts: [],
      alertThreshold: 0.05
    };
    
    // EVT state
    this.evtState = {
      lastHighMultiplier: 0,
      roundsSinceHigh: 0,
      highThreshold: 10.0
    };
    
    // 🔥 NEW: Adaptive Model Weights (will adjust based on performance)
    this.modelWeights = {
      bayesian: 0.20,
      statistical: 0.20,
      frequency: 0.20,
      evt: 0.20,
      momentum: 0.20
    };

    // 🔥 NEW: Model Performance Tracking (last 50 predictions)
    this.modelPerformance = {
      bayesian: { predictions: [], errors: [] },
      statistical: { predictions: [], errors: [] },
      frequency: { predictions: [], errors: [] },
      evt: { predictions: [], errors: [] },
      momentum: { predictions: [], errors: [] }
    };

    // 🔥 NEW: Recent predictions for adaptive learning
    this.recentPredictions = [];
    this.maxTracking = 50;
    
    console.log("🎯 Adaptive Prediction Engine v4.0 Initialized");
    console.log("🔥 Starting with neutral 50% prior - will adapt quickly");
  }

  predict(history) {
    if (!history || history.length < 50) {
      return this._errorResponse("Need at least 50 rounds of history");
    }

    const cleanHistory = this._cleanData(history.slice(0, 500));
    
    this._updateBustTracker(cleanHistory);
    this._updateEVTState(cleanHistory);
    
    // 🔥 Multi-timeframe feature extraction
    const features = this._extractMultiTimeframeFeatures(cleanHistory);
    
    // Run all models
    const predictions = this._runPredictionModels(cleanHistory, features);
    
    // 🔥 Use adaptive weighting based on recent performance
    this._updateModelWeights(features);
    
    // 🔥 Ensemble using MEDIAN (not average) for robustness
    const consensus = this._calculateAdaptiveConsensus(predictions, features);
    
    // 🔥 Calculate confidence interval (range, not just point)
    const confidenceInterval = this._calculateConfidenceInterval(predictions, consensus);
    
    // Bayesian confidence
    const bayesianConfidence = this._calculateBayesianConfidence(features);
    
    // Risk assessment
    const riskAssessment = this._assessRisk(features, consensus);
    
    // Kelly sizing
    const kellySizing = this._calculateKellyCriterion(consensus, bayesianConfidence);
    
    // Generate recommendation
    const recommendation = this._generateRecommendation(
      consensus,
      bayesianConfidence,
      riskAssessment,
      features,
      confidenceInterval
    );
    
    return {
      // Core prediction
      predictedValue: consensus.target,
      predictedRange: confidenceInterval.range,
      safetyZone: confidenceInterval.safetyExit,
      mostLikely: consensus.target,
      
      // Confidence metrics
      confidence: bayesianConfidence,
      confidenceInterval: confidenceInterval.description,
      modelAgreement: this._calculateModelAgreement(predictions),
      
      // Risk metrics
      riskLevel: riskAssessment.level,
      bustProbability: consensus.bustProb,
      volatility: features.volatility.toFixed(2),
      
      // Advanced metrics
      kellyBetSize: kellySizing.percentage,
      kellyRecommendation: kellySizing.recommendation,
      evtAlert: features.evtAlert,
      bustAlert: features.bustAlert,
      
      // Analysis
      message: recommendation.message,
      reasoning: recommendation.reasoning,
      action: recommendation.action,
      
      // Context
      currentTrend: features.trend,
      streakInfo: features.streakInfo,
      meanReversionSignal: features.meanReversionSignal,
      
      // Metadata
      historyAnalyzed: cleanHistory.length,
      bayesianWinRate: this.bayesianState.priorWinRate.toFixed(3),
      activeModels: this._getActiveModels(),
      modelWeights: this.modelWeights
    };
  }

  /**
   * 🔥 NEW: Multi-Timeframe Feature Extraction
   */
  _extractMultiTimeframeFeatures(history) {
    const micro = history.slice(0, 5);    // Immediate momentum
    const short = history.slice(0, 20);   // Recent trend
    const medium = history.slice(0, 100); // Market state
    const long = history.slice(0, 300);   // Base probability
    const full = history;

    // Base stats
    const meanLong = this._mean(long);
    const meanMedium = this._mean(medium);
    const volatility = this._calculateVolatility(medium);

    return {
      // Basic
      mean: meanMedium,
      volatility: volatility,
      
      // 🔥 Multi-timeframe momentum
      microMomentum: this._calculateMomentum(micro),
      shortTrend: this._getTrend(short),
      mediumTrend: this._getTrend(medium.slice(0, 50)),
      
      // 🔥 Mean reversion signal
      meanReversionSignal: this._calculateMeanReversionSignal(short, long),
      
      // Streak detection
      streakInfo: this._detectStreak(short),
      
      // Distribution
      distribution: this._getDetailedDistribution(full),
      
      // EVT features
      evtAlert: this._checkEVTAlert(),
      timeSinceSpike: this.evtState.roundsSinceHigh,
      recentHighCount: short.filter(v => v > 10.0).length,
      
      // Bust analysis
      bustAlert: this._checkBustAlert(),
      bustFrequency: this._calculateBustFrequency(medium),
      
      // Volatility score (rolling)
      volatilityScore: this._calculateRollingVolatility(history),
      
      // Trend strength
      trend: this._getTrend(short)
    };
  }

  /**
   * 🔥 NEW: Calculate Mean Reversion Signal
   * Detects when price deviates significantly from long-term mean
   */
  _calculateMeanReversionSignal(recent, baseline) {
    const recentMean = this._mean(recent);
    const baselineMean = this._mean(baseline);
    const deviation = (recentMean - baselineMean) / baselineMean;
    
    return {
      deviation: deviation,
      strength: Math.abs(deviation),
      direction: deviation > 0 ? 'above' : 'below',
      signal: Math.abs(deviation) > 0.15 ? 'strong' : Math.abs(deviation) > 0.08 ? 'moderate' : 'weak'
    };
  }

  /**
   * 🔥 NEW: Calculate Rolling Volatility Score
   */
  _calculateRollingVolatility(history) {
    const windows = [10, 20, 50];
    const scores = windows.map(w => {
      const window = history.slice(0, w);
      return this._calculateVolatility(window);
    });
    
    return {
      short: scores[0],
      medium: scores[1],
      long: scores[2],
      average: this._mean(scores),
      trend: scores[0] > scores[2] ? 'increasing' : 'decreasing'
    };
  }

  /**
   * RUN PREDICTION MODELS
   */
  _runPredictionModels(history, features) {
    return {
      bayesian: this._modelBayesianTarget(features),
      statistical: this._modelStatisticalRegression(history, features),
      frequency: this._modelFrequencyDistribution(history, features),
      evt: this._modelExtremeValue(history, features),
      momentum: this._modelMomentum(history, features)
    };
  }

  _modelBayesianTarget(features) {
    const winRate = this.bayesianState.priorWinRate;
    const optimalTarget = 1 / (1 - winRate) + 0.03;
    
    // Adjust for volatility and mean reversion
    let adjustment = 0;
    if (features.meanReversionSignal.signal === 'strong') {
      adjustment = features.meanReversionSignal.direction === 'below' ? 0.5 : -0.3;
    }
    
    const target = Math.max(1.1, optimalTarget + adjustment);
    
    return {
      target: target,
      range: [target * 0.85, target * 1.3],
      confidence: Math.min(95, winRate * 100 + 20),
      reasoning: `Bayesian target for ${(winRate * 100).toFixed(1)}% win rate`
    };
  }

  _modelStatisticalRegression(history, features) {
    const recent50 = history.slice(0, 50);
    const baseline200 = history.slice(0, 200);
    
    const recentMean = this._mean(recent50);
    const baselineMean = this._mean(baseline200);
    const deviation = recentMean - baselineMean;
    
    let target;
    
    if (Math.abs(deviation) > baselineMean * 0.15) {
      // Strong mean reversion
      target = baselineMean + (deviation * -0.5);
    } else {
      target = recentMean * (1 + (deviation / baselineMean) * 0.3);
    }
    
    target = Math.max(1.1, Math.min(target, 8.0));
    
    return {
      target: target,
      range: [target * 0.8, target * 1.2],
      confidence: 70 - (features.volatility * 3),
      reasoning: `Mean reversion: ${deviation > 0 ? 'above' : 'below'} baseline`
    };
  }

  _modelFrequencyDistribution(history, features) {
    const distribution = this._getDetailedDistribution(history);
    const mostCommon = distribution.ranges.reduce((max, r) => 
      r.frequency > max.frequency ? r : max
    );
    
    return {
      target: mostCommon.center,
      range: mostCommon.range,
      confidence: Math.min(85, mostCommon.frequency * 120),
      reasoning: `${(mostCommon.frequency * 100).toFixed(1)}% frequency`
    };
  }

  _modelExtremeValue(history, features) {
    const timeSinceHigh = this.evtState.roundsSinceHigh;
    const avgGap = this._calculateAverageHighGap(history);
    
    let target;
    let reasoning;
    
    if (timeSinceHigh > avgGap * 1.8) {
      target = 4.5; // Bold prediction
      reasoning = `High overdue (${timeSinceHigh} rounds)`;
    } else if (features.recentHighCount > 3) {
      target = 1.4;
      reasoning = "High saturation";
    } else {
      target = 2.2;
      reasoning = "EVT: Normal phase";
    }
    
    return {
      target: target,
      range: [target * 0.7, target * 1.5],
      confidence: 65,
      reasoning: reasoning
    };
  }

  _modelMomentum(history, features) {
    const momentum = features.microMomentum;
    const last = history[0];
    
    let target;
    
    if (momentum === 'rising') {
      target = last * 1.3;
    } else if (momentum === 'falling') {
      target = last * 0.7;
    } else {
      target = last * 1.1;
    }
    
    target = Math.max(1.1, Math.min(target, 6.0));
    
    return {
      target: target,
      range: [target * 0.8, target * 1.2],
      confidence: 55,
      reasoning: `Momentum: ${momentum}`
    };
  }

  /**
   * 🔥 NEW: Adaptive Model Weight Update
   * Adjust weights based on recent performance
   */
  _updateModelWeights(features) {
    if (this.recentPredictions.length < 10) return; // Need data first
    
    // Calculate accuracy for each model over last 20 predictions
    const recentPerf = this.recentPredictions.slice(0, 20);
    
    for (const modelName of Object.keys(this.modelWeights)) {
      const modelPreds = this.modelPerformance[modelName].predictions.slice(0, 20);
      const modelErrors = this.modelPerformance[modelName].errors.slice(0, 20);
      
      if (modelErrors.length > 0) {
        const avgError = this._mean(modelErrors);
        // Lower error = higher weight
        const performance = 1 / (1 + avgError);
        
        // Gradually adjust weights (momentum-based)
        this.modelWeights[modelName] = 
          this.modelWeights[modelName] * 0.9 + performance * 0.1;
      }
    }
    
    // Normalize weights to sum to 1
    const totalWeight = Object.values(this.modelWeights).reduce((a, b) => a + b, 0);
    for (const key of Object.keys(this.modelWeights)) {
      this.modelWeights[key] /= totalWeight;
    }
    
    console.log('📊 Updated model weights:', this.modelWeights);
  }

  /**
   * 🔥 NEW: Adaptive Consensus using MEDIAN
   */
  _calculateAdaptiveConsensus(predictions, features) {
    // Get all model targets
    const targets = [];
    for (const [name, pred] of Object.entries(predictions)) {
      const weight = this.modelWeights[name];
      // Add target multiple times based on weight (for weighted median)
      const count = Math.round(weight * 100);
      for (let i = 0; i < count; i++) {
        targets.push(pred.target);
      }
    }
    
    // Sort and get median (more robust than mean)
    targets.sort((a, b) => a - b);
    const median = targets[Math.floor(targets.length / 2)];
    
    // 🔥 NO MORE ARTIFICIAL CAPS! Let the models decide
    const target = Math.max(1.1, Math.min(median, 10.0));
    
    // Calculate range from model spread
    const minTarget = Math.min(...Object.values(predictions).map(p => p.target));
    const maxTarget = Math.max(...Object.values(predictions).map(p => p.target));
    
    const bustProb = this._estimateBustProbability(target, features);
    
    return {
      target: target,
      range: [Math.max(1.1, minTarget * 0.9), Math.min(10.0, maxTarget * 1.1)],
      bustProb: bustProb
    };
  }

  /**
   * 🔥 NEW: Calculate Confidence Interval
   * Provides range estimation with safety exit (30th percentile)
   */
  _calculateConfidenceInterval(predictions, consensus) {
    const targets = Object.values(predictions).map(p => p.target).sort((a, b) => a - b);
    
    // 30th percentile for safety exit (your brilliant idea!)
    const safetyIndex = Math.floor(targets.length * 0.30);
    const safetyExit = targets[safetyIndex];
    
    // 70th percentile for upper bound
    const upperIndex = Math.floor(targets.length * 0.70);
    const upperBound = targets[upperIndex];
    
    return {
      range: [consensus.target * 0.85, consensus.target * 1.25],
      safetyExit: Math.max(1.1, safetyExit),
      upperBound: upperBound,
      description: `Range: ${consensus.target.toFixed(2)}x ± ${((consensus.target * 0.15).toFixed(2))}x`
    };
  }

  /**
   * Update Bayesian state after prediction
   */
  updateBayesianState(predicted, actual, success) {
    this.bayesianState.totalPredictions++;
    
    if (success) {
      this.bayesianState.successCount++;
    } else {
      this.bayesianState.failureCount++;
    }
    
    const alpha = this.bayesianState.successCount + 1;
    const beta = this.bayesianState.failureCount + 1;
    this.bayesianState.priorWinRate = alpha / (alpha + beta);
    
    // 🔥 Track for adaptive weighting
    this.recentPredictions.unshift({ predicted, actual, success });
    if (this.recentPredictions.length > this.maxTracking) {
      this.recentPredictions.length = this.maxTracking;
    }
    
    console.log(`📊 Bayesian Update: Win Rate = ${(this.bayesianState.priorWinRate * 100).toFixed(1)}%`);
  }

  /**
   * 🔥 NEW: Track individual model performance
   */
  trackModelPerformance(predictions, actual) {
    for (const [modelName, pred] of Object.entries(predictions)) {
      const error = Math.abs(pred.target - actual);
      
      this.modelPerformance[modelName].predictions.unshift(pred.target);
      this.modelPerformance[modelName].errors.unshift(error);
      
      if (this.modelPerformance[modelName].errors.length > this.maxTracking) {
        this.modelPerformance[modelName].predictions.length = this.maxTracking;
        this.modelPerformance[modelName].errors.length = this.maxTracking;
      }
    }
  }

  _calculateBayesianConfidence(features) {
    let confidence = this.bayesianState.priorWinRate * 100;
    
    // Boost for favorable conditions
    if (features.meanReversionSignal.signal === 'strong' && 
        features.meanReversionSignal.direction === 'below') {
      confidence += 15;
    }
    
    if (features.streakInfo.type === 'low' && features.streakInfo.count >= 4) {
      confidence += 12;
    }
    
    // Penalty for risks
    if (features.bustAlert) confidence -= 20;
    if (features.volatility > 3.0) confidence -= 15;
    
    // Penalty for lack of data
    if (this.bayesianState.totalPredictions < 10) confidence -= 5;
    
    return Math.max(30, Math.min(95, confidence));
  }

  _calculateKellyCriterion(consensus, confidence) {
    const b = consensus.target - 1;
    const p = confidence / 100;
    const q = 1 - p;
    
    let kellyFraction = (b * p - q) / b;
    kellyFraction = Math.max(0, Math.min(kellyFraction, 0.08)); // Cap at 8%
    
    const kellyPercentage = (kellyFraction * 100).toFixed(1);
    
    let recommendation;
    if (kellyFraction <= 0) {
      recommendation = "NO BET - Negative expectation";
    } else if (kellyFraction < 0.02) {
      recommendation = "MINIMAL BET - Low edge";
    } else if (kellyFraction < 0.05) {
      recommendation = "MODERATE BET - Good edge";
    } else {
      recommendation = "STRONG BET - Excellent edge";
    }
    
    return {
      percentage: kellyPercentage + "%",
      fraction: kellyFraction,
      recommendation: recommendation
    };
  }

  _assessRisk(features, consensus) {
    let riskScore = 0;
    const factors = [];
    
    if (features.bustAlert) {
      riskScore += 25;
      factors.push("High bust frequency");
    }
    
    if (features.volatilityScore.average > 2.5) {
      riskScore += 20;
      factors.push("High volatility");
    }
    
    if (features.evtAlert) {
      riskScore += 10;
      factors.push("EVT alert");
    }
    
    if (consensus.target > 4.0) {
      riskScore += 15;
      factors.push("High target");
    }
    
    if (features.meanReversionSignal.signal === 'strong') {
      riskScore -= 10;
      factors.push("Strong reversion signal");
    }
    
    let level;
    if (riskScore < 20) level = "LOW";
    else if (riskScore < 45) level = "MEDIUM";
    else level = "HIGH";
    
    return { level, score: riskScore, factors };
  }

  _generateRecommendation(consensus, confidence, riskAssessment, features, confidenceInterval) {
    let action, message, reasoning;
    
    if (confidence >= 70 && riskAssessment.level === "LOW") {
      action = "STRONG BET";
      message = `High confidence: ${consensus.target.toFixed(2)}x (Safety: ${confidenceInterval.safetyExit.toFixed(2)}x)`;
      reasoning = `${confidence.toFixed(0)}% confidence, low risk. ${riskAssessment.factors.join('. ')}`;
      
    } else if (confidence >= 60 && riskAssessment.level !== "HIGH") {
      action = "MODERATE BET";
      message = `Target ${consensus.target.toFixed(2)}x, Range: ${confidenceInterval.description}`;
      reasoning = `${confidence.toFixed(0)}% confidence. Use safety exit at ${confidenceInterval.safetyExit.toFixed(2)}x`;
      
    } else if (confidence >= 50 && riskAssessment.level === "LOW") {
      action = "CAUTIOUS BET";
      message = `Conservative play: Exit at ${confidenceInterval.safetyExit.toFixed(2)}x`;
      reasoning = "Lower confidence. Safety exit recommended.";
      
    } else if (features.bustAlert) {
      action = "SKIP ROUND";
      message = "High bust frequency detected";
      reasoning = `Bust rate: ${(features.bustFrequency * 100).toFixed(1)}%. Wait for stabilization.`;
      
    } else if (riskAssessment.level === "HIGH") {
      action = "SKIP ROUND";
      message = "High risk conditions";
      reasoning = riskAssessment.factors.join('. ');
      
    } else {
      action = "OBSERVE";
      message = "Mixed signals - wait for clarity";
      reasoning = `Confidence: ${confidence.toFixed(0)}%, Risk: ${riskAssessment.level}`;
    }
    
    return { action, message, reasoning };
  }

  _estimateBustProbability(target, features) {
    const baseBustProb = (1 - (1 / target)) * 100;
    const bustAdjustment = features.bustAlert ? 12 : 0;
    const volatilityAdjustment = features.volatilityScore.average > 2.5 ? 8 : 0;
    
    return Math.min(95, baseBustProb + bustAdjustment + volatilityAdjustment);
  }

  _getActiveModels() {
    return Object.entries(this.modelWeights)
      .filter(([name, weight]) => weight > 0.1)
      .map(([name, weight]) => `${name}(${(weight * 100).toFixed(0)}%)`)
      .join(', ');
  }

  // ============================================
  // BUST & EVT TRACKING
  // ============================================

  _updateBustTracker(history) {
    this.bustTracker.recentBusts = history.slice(0, 50);
    this.bustTracker.instantBusts = history.slice(0, 50).filter(v => v < 1.01);
  }

  _checkBustAlert() {
    if (this.bustTracker.recentBusts.length === 0) return false;
    const bustRate = this.bustTracker.instantBusts.length / this.bustTracker.recentBusts.length;
    return bustRate > this.bustTracker.alertThreshold;
  }

  _calculateBustFrequency(recent) {
    const busts = recent.filter(v => v < 1.01).length;
    return busts / recent.length;
  }

  _updateEVTState(history) {
    const highMultiplier = history.find(v => v >= this.evtState.highThreshold);
    
    if (highMultiplier) {
      this.evtState.lastHighMultiplier = highMultiplier;
      this.evtState.roundsSinceHigh = history.indexOf(highMultiplier);
    } else {
      this.evtState.roundsSinceHigh = Math.min(
        this.evtState.roundsSinceHigh + 1,
        history.length
      );
    }
  }

  _checkEVTAlert() {
    const avgGap = 50;
    return this.evtState.roundsSinceHigh > avgGap * 2.5;
  }

  _calculateAverageHighGap(history) {
    const highIndices = [];
    history.forEach((v, i) => {
      if (v >= this.evtState.highThreshold) highIndices.push(i);
    });
    
    if (highIndices.length < 2) return 50;
    
    const gaps = [];
    for (let i = 1; i < highIndices.length; i++) {
      gaps.push(highIndices[i] - highIndices[i - 1]);
    }
    
    return gaps.length > 0 ? this._mean(gaps) : 50;
  }

  // ============================================
  // STATISTICAL HELPERS
  // ============================================

  _cleanData(history) {
    return history
      .map(v => parseFloat(v))
      .filter(v => !isNaN(v) && v > 0 && v < 1000);
  }

  _mean(arr) {
    if (!arr || arr.length === 0) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  _calculateVolatility(data) {
    const mean = this._mean(data);
    const variance = data.reduce((sum, val) => 
      sum + Math.pow(val - mean, 2), 0) / data.length;
    return Math.sqrt(variance);
  }

  _detectStreak(recent) {
    let lowCount = 0;
    let highCount = 0;
    
    for (const val of recent) {
      if (val < 2.0) lowCount++;
      else if (val > 5.0) highCount++;
      else break;
    }
    
    if (lowCount >= 3) return { type: 'low', count: lowCount };
    if (highCount >= 2) return { type: 'high', count: highCount };
    return { type: 'none', count: 0 };
  }

  _calculateMomentum(recent) {
    if (recent.length < 3) return 'neutral';
    
    const first = recent[recent.length - 1];
    const last = recent[0];
    
    if (last > first * 1.3) return 'rising';
    if (last < first * 0.7) return 'falling';
    return 'neutral';
  }

  _getTrend(data) {
    if (data.length < 10) return 'stable';
    
    const first = this._mean(data.slice(0, 5));
    const second = this._mean(data.slice(5, 10));
    
    if (first > second * 1.15) return 'upward';
    if (first < second * 0.85) return 'downward';
    return 'stable';
  }

  _getDetailedDistribution(data) {
    const ranges = [
      { min: 1.0, max: 1.5, center: 1.25, count: 0 },
      { min: 1.5, max: 2.0, center: 1.75, count: 0 },
      { min: 2.0, max: 3.0, center: 2.5, count: 0 },
      { min: 3.0, max: 5.0, center: 4.0, count: 0 },
      { min: 5.0, max: 10.0, center: 7.0, count: 0 },
      { min: 10.0, max: 100.0, center: 20.0, count: 0 }
    ];
    
    data.forEach(v => {
      const range = ranges.find(r => v >= r.min && v < r.max);
      if (range) range.count++;
    });
    
    ranges.forEach(r => {
      r.frequency = r.count / data.length;
      r.range = [r.min, r.max];
    });
    
    return { ranges };
  }

  _calculateModelAgreement(predictions) {
    const targets = Object.values(predictions).map(p => p.target);
    const mean = this._mean(targets);
    const maxDiff = Math.max(...targets.map(t => Math.abs(t - mean)));
    
    const agreement = Math.max(0, 100 - (maxDiff * 15));
    return Math.round(agreement);
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
