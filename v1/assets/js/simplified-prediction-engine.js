
/**
 * 🎯 LEVEL 1 PREDICTION ENGINE - Simplified & Effective
 * 3 Core Models: Frequency, Mean Reversion, Volatility
 * Target: 55-58% accuracy with proper passive learning
 */

export class SimplifiedPredictionEngine {
  constructor() {
    this.name = "Level 1 Engine - Simple & Smart";
    
    // Market statistics (learned passively from EVERY round)
    this.marketStats = {
      totalRounds: 0,
      distribution: this._initDistribution(),
      longTermMean: 0,
      longTermStdDev: 0,
      recentMean: 0,
      recentStdDev: 0,
      bustFrequency: 0
    };
    
    // Prediction tracking (only from user predictions)
    this.predictionStats = {
      totalPredictions: 0,
      successCount: 0,
      failureCount: 0,
      winRate: 0.50 // Start neutral
    };
    
    console.log("🎯 Level 1 Engine Initialized - Simple 3-Model System");
  }

  _initDistribution() {
    return {
      veryLow: { range: [1.0, 1.5], count: 0, percentage: 0 },
      low: { range: [1.5, 2.0], count: 0, percentage: 0 },
      medium: { range: [2.0, 3.0], count: 0, percentage: 0 },
      high: { range: [3.0, 5.0], count: 0, percentage: 0 },
      veryHigh: { range: [5.0, 100.0], count: 0, percentage: 0 }
    };
  }

  /**
   * 🔥 PASSIVE LEARNING - Called on EVERY round completion
   * This builds market knowledge without making predictions
   */
  learnFromMarketData(multiplier) {
    if (!multiplier || multiplier <= 0) return;

    this.marketStats.totalRounds++;
    
    // Update distribution
    this._updateDistribution(multiplier);
    
    // Update long-term stats (rolling 500 rounds worth)
    // For now, simplified to just track latest
    this.marketStats.longTermMean = this._calculateWeightedMean();
    this.marketStats.longTermStdDev = this._calculateVolatility();
    
    if (this.marketStats.totalRounds % 50 === 0) {
      console.log(`📊 Market Learning: ${this.marketStats.totalRounds} rounds analyzed`);
      console.log(`   Distribution:`, this._getDistributionSummary());
      console.log(`   Mean: ${this.marketStats.longTermMean.toFixed(2)}x, Volatility: ${this.marketStats.longTermStdDev.toFixed(2)}`);
    }
  }

  _updateDistribution(multiplier) {
    const dist = this.marketStats.distribution;
    
    if (multiplier < 1.5) dist.veryLow.count++;
    else if (multiplier < 2.0) dist.low.count++;
    else if (multiplier < 3.0) dist.medium.count++;
    else if (multiplier < 5.0) dist.high.count++;
    else dist.veryHigh.count++;
    
    // Update percentages
    const total = this.marketStats.totalRounds;
    for (const key in dist) {
      dist[key].percentage = (dist[key].count / total) * 100;
    }
  }

  _getDistributionSummary() {
    const dist = this.marketStats.distribution;
    return {
      veryLow: dist.veryLow.percentage.toFixed(1) + '%',
      low: dist.low.percentage.toFixed(1) + '%',
      medium: dist.medium.percentage.toFixed(1) + '%',
      high: dist.high.percentage.toFixed(1) + '%',
      veryHigh: dist.veryHigh.percentage.toFixed(1) + '%'
    };
  }

  /**
   * 🎯 PREDICT - Called when user clicks button
   */
  predict(history) {
    if (!history || history.length < 50) {
      return this._errorResponse("Need at least 50 rounds of history");
    }

    const cleanHistory = this._cleanData(history.slice(0, 500));
    
    // Extract features from recent data
    const recent20 = cleanHistory.slice(0, 20);
    const recent50 = cleanHistory.slice(0, 50);
    const full = cleanHistory;
    
    this.marketStats.recentMean = this._mean(recent50);
    this.marketStats.recentStdDev = this._calculateVolatility(recent50);
    
    // Run 3 core models
    const frequencyPrediction = this._modelFrequency(full);
    const reversionPrediction = this._modelMeanReversion(recent20, full);
    const volatilityPrediction = this._modelVolatility(recent50);
    
    // Combine predictions with fixed weights
    const target = (
      frequencyPrediction.target * 0.40 +
      reversionPrediction.target * 0.40 +
      volatilityPrediction.target * 0.20
    );
    
    // Calculate confidence based on model agreement
    const predictions = [frequencyPrediction, reversionPrediction, volatilityPrediction];
    const confidence = this._calculateConfidence(predictions, target);
    
    // Determine action based on confidence
    const action = this._determineAction(confidence, target);
    
    // Calculate risk metrics
    const volatility = this.marketStats.recentStdDev;
    const riskLevel = volatility > 2.5 ? 'HIGH' : volatility > 1.8 ? 'MEDIUM' : 'LOW';
    
    // Safety exit (30th percentile - conservative)
    const safetyExit = Math.max(1.2, target * 0.70);
    
    // Build result
    return {
      predictedValue: Math.max(1.1, Math.min(target, 8.0)),
      confidence: confidence,
      action: action.type,
      message: action.message,
      reasoning: action.reasoning,
      
      // Ranges
      predictedRange: [target * 0.85, target * 1.25],
      safetyZone: safetyExit,
      
      // Metrics
      riskLevel: riskLevel,
      volatility: volatility.toFixed(2),
      avgMultiplier: this._formatRange(frequencyPrediction.range),
      
      // Model details
      modelBreakdown: {
        frequency: frequencyPrediction.target.toFixed(2),
        reversion: reversionPrediction.target.toFixed(2),
        volatility: volatilityPrediction.target.toFixed(2)
      },
      
      // Context
      marketMean: this.marketStats.longTermMean.toFixed(2),
      recentMean: this.marketStats.recentMean.toFixed(2),
      predictionWinRate: (this.predictionStats.winRate * 100).toFixed(1) + '%',
      historyAnalyzed: cleanHistory.length,
      
      error: false
    };
  }

  /**
   * MODEL 1: Frequency Distribution (40% weight)
   * "What range happens most often?"
   */
  _modelFrequency(history) {
    const dist = this.marketStats.distribution;
    
    // Find most common range
    let maxRange = null;
    let maxPercentage = 0;
    
    for (const key in dist) {
      if (dist[key].percentage > maxPercentage) {
        maxPercentage = dist[key].percentage;
        maxRange = dist[key];
      }
    }
    
    if (!maxRange) {
      return { target: 2.0, range: [1.5, 2.5], confidence: 50 };
    }
    
    // Target center of most common range
    const target = (maxRange.range[0] + maxRange.range[1]) / 2;
    
    return {
      target: target,
      range: maxRange.range,
      confidence: Math.min(85, maxPercentage * 1.2),
      reasoning: `${maxPercentage.toFixed(1)}% frequency in ${maxRange.range[0]}-${maxRange.range[1]}x range`
    };
  }

  /**
   * MODEL 2: Mean Reversion (40% weight)
   * "If recent is low, predict high. If recent is high, predict low."
   */
  _modelMeanReversion(recent, baseline) {
    const recentMean = this._mean(recent);
    const baselineMean = this._mean(baseline);
    const deviation = recentMean - baselineMean;
    const deviationPercent = (deviation / baselineMean) * 100;
    
    let target;
    let reasoning;
    
    if (Math.abs(deviationPercent) < 8) {
      // Small deviation - predict stable
      target = baselineMean;
      reasoning = `Stable market (deviation: ${deviationPercent.toFixed(1)}%)`;
      
    } else if (deviationPercent < -15) {
      // Recent much lower than average - strong reversion UP
      target = baselineMean * 1.3;
      reasoning = `Strong reversion signal (${deviationPercent.toFixed(1)}% below mean)`;
      
    } else if (deviationPercent < -8) {
      // Recent lower - moderate reversion UP
      target = baselineMean * 1.15;
      reasoning = `Moderate reversion up (${deviationPercent.toFixed(1)}% below mean)`;
      
    } else if (deviationPercent > 15) {
      // Recent much higher - strong reversion DOWN
      target = baselineMean * 0.75;
      reasoning = `Strong reversion down (${deviationPercent.toFixed(1)}% above mean)`;
      
    } else {
      // Recent higher - moderate reversion DOWN
      target = baselineMean * 0.90;
      reasoning = `Moderate reversion down (${deviationPercent.toFixed(1)}% above mean)`;
    }
    
    return {
      target: Math.max(1.2, Math.min(target, 6.0)),
      confidence: Math.min(80, Math.abs(deviationPercent) * 4),
      reasoning: reasoning
    };
  }

  /**
   * MODEL 3: Volatility Regime (20% weight)
   * "High volatility = be conservative. Low volatility = be aggressive."
   */
  _modelVolatility(recent) {
    const volatility = this._calculateVolatility(recent);
    const mean = this._mean(recent);
    
    let target;
    let reasoning;
    
    if (volatility > 3.0) {
      // High volatility - very conservative
      target = Math.min(mean * 0.70, 1.6);
      reasoning = `High volatility (${volatility.toFixed(2)}) - conservative target`;
      
    } else if (volatility > 2.0) {
      // Medium volatility - moderate
      target = mean * 0.85;
      reasoning = `Medium volatility (${volatility.toFixed(2)}) - moderate target`;
      
    } else {
      // Low volatility - can be more aggressive
      target = mean * 1.1;
      reasoning = `Low volatility (${volatility.toFixed(2)}) - stable market`;
    }
    
    return {
      target: Math.max(1.2, Math.min(target, 5.0)),
      confidence: 60,
      reasoning: reasoning
    };
  }

  /**
   * Calculate confidence based on model agreement
   */
  _calculateConfidence(predictions, finalTarget) {
    // Base confidence from prediction win rate
    let confidence = this.predictionStats.winRate * 100;
    
    // Boost if models agree (low variance)
    const targets = predictions.map(p => p.target);
    const avgTarget = this._mean(targets);
    const variance = targets.reduce((sum, t) => sum + Math.pow(t - avgTarget, 2), 0) / targets.length;
    const stdDev = Math.sqrt(variance);
    
    // Low variance = high agreement = boost confidence
    if (stdDev < 0.3) {
      confidence += 15;
    } else if (stdDev < 0.6) {
      confidence += 8;
    } else if (stdDev > 1.2) {
      confidence -= 10;
    }
    
    // Boost if we have good track record
    if (this.predictionStats.totalPredictions >= 20 && this.predictionStats.winRate > 0.55) {
      confidence += 10;
    }
    
    return Math.max(30, Math.min(95, confidence));
  }

  /**
   * Determine action and messaging based on confidence
   */
  _determineAction(confidence, target) {
    if (confidence >= 70) {
      return {
        type: 'STRONG BET',
        message: `High confidence prediction: ${target.toFixed(2)}x`,
        reasoning: `${confidence.toFixed(0)}% confidence - Models strongly agree`
      };
    } else if (confidence >= 55) {
      return {
        type: 'MODERATE BET',
        message: `Moderate confidence: Target ${target.toFixed(2)}x`,
        reasoning: `${confidence.toFixed(0)}% confidence - Good signal strength`
      };
    } else if (confidence >= 40) {
      return {
        type: 'CAUTIOUS BET',
        message: `Conservative play: Exit early at safety zone`,
        reasoning: `${confidence.toFixed(0)}% confidence - Use safety exit recommended`
      };
    } else {
      return {
        type: 'OBSERVE',
        message: `Low confidence: Observe or ultra-conservative bet`,
        reasoning: `${confidence.toFixed(0)}% confidence - Mixed signals, bet small or skip`
      };
    }
  }

  /**
   * Update prediction stats after a round completes
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
    
    console.log(`📊 Prediction Stats Update:`, {
      total: this.predictionStats.totalPredictions,
      wins: this.predictionStats.successCount,
      losses: this.predictionStats.failureCount,
      winRate: (this.predictionStats.winRate * 100).toFixed(1) + '%'
    });
  }

  /**
   * Get current statistics
   */
  getStatistics() {
    return {
      // Prediction performance
      totalPredictions: this.predictionStats.totalPredictions,
      successCount: this.predictionStats.successCount,
      failureCount: this.predictionStats.failureCount,
      winRate: this.predictionStats.winRate,
      winRatePercent: (this.predictionStats.winRate * 100).toFixed(1) + '%',
      
      // Market knowledge
      marketRoundsAnalyzed: this.marketStats.totalRounds,
      marketMean: this.marketStats.longTermMean.toFixed(2),
      marketVolatility: this.marketStats.longTermStdDev.toFixed(2),
      distribution: this._getDistributionSummary()
    };
  }

  // ============================================
  // HELPER FUNCTIONS
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

  _calculateWeightedMean() {
    const dist = this.marketStats.distribution;
    let sum = 0;
    let totalCount = 0;
    
    for (const key in dist) {
      const center = (dist[key].range[0] + dist[key].range[1]) / 2;
      sum += center * dist[key].count;
      totalCount += dist[key].count;
    }
    
    return totalCount > 0 ? sum / totalCount : 2.0;
  }

  _calculateVolatility(data = null) {
    const arr = data || this._getRecentFromDistribution();
    if (arr.length < 2) return 1.5;
    
    const mean = this._mean(arr);
    const variance = arr.reduce((sum, val) => 
      sum + Math.pow(val - mean, 2), 0) / arr.length;
    return Math.sqrt(variance);
  }

  _getRecentFromDistribution() {
    // Simplified - in real impl would track actual recent values
    return [this.marketStats.recentMean || 2.0];
  }

  _formatRange(range) {
    return `${range[0].toFixed(2)}-${range[1].toFixed(2)}x`;
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