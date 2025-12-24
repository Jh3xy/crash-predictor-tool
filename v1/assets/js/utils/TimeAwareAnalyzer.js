
/**
 * ⏰ TIME-AWARE MARKET ANALYZER
 * Detects optimal feature configurations based on time patterns
 */

export class TimeAwareAnalyzer {
  constructor() {
    this.patterns = {
      hourly: {},      // Accuracy by hour of day
      daily: {},       // Accuracy by day of week
      features: {}     // Feature effectiveness by time
    };
    
    console.log('⏰ Time-Aware Analyzer initialized');
  }

  /**
   * Get current market regime
   */
  getCurrentRegime() {
    const now = new Date();
    const hour = now.getUTCHours();
    const day = now.getUTCDay(); // 0=Sunday, 6=Saturday
    
    // Define time regimes based on global player activity
    let regime;
    
    // Asian Peak (00:00-08:00 UTC)
    if (hour >= 0 && hour < 8) {
      regime = 'ASIAN_PEAK';
    }
    // European Peak (08:00-16:00 UTC)
    else if (hour >= 8 && hour < 16) {
      regime = 'EUROPEAN_PEAK';
    }
    // American Peak (16:00-24:00 UTC)
    else {
      regime = 'AMERICAN_PEAK';
    }
    
    // Weekend modifier
    const isWeekend = day === 0 || day === 6;
    
    return {
      regime,
      hour,
      day,
      isWeekend,
      timestamp: now.toISOString()
    };
  }

  /**
   * 🔥 RECOMMEND FEATURES BASED ON TIME
   */
  recommendFeatures(history) {
    const time = this.getCurrentRegime();
    const marketStats = this._analyzeMarket(history);
    
    console.log(`\n⏰ TIME-AWARE ANALYSIS`);
    console.log(`   Current: ${time.regime} (${time.hour}:00 UTC)`);
    console.log(`   Weekend: ${time.isWeekend ? 'Yes' : 'No'}`);
    console.log(`   Market Volatility: ${marketStats.volatility.toFixed(2)}`);
    console.log(`   Recent Bust Rate: ${(marketStats.bustRate * 100).toFixed(1)}%`);
    
    const recommendations = {
      kaplanMeier: true, // Always on (proven to help)
      weibullHazard: false,
      cusumDetection: false,
      volumeDetection: false,
      reasoning: []
    };
    
    // === REGIME-BASED RULES ===
    
    // 1. HIGH VOLATILITY → Enable CUSUM
    if (marketStats.volatility > 3.0) {
      recommendations.cusumDetection = true;
      recommendations.reasoning.push('High volatility detected → CUSUM enabled for bust detection');
    }
    
    // 2. HIGH BUST RATE → Enable volume detection
    if (marketStats.bustRate > 0.50) {
      recommendations.volumeDetection = true;
      recommendations.reasoning.push(`High bust rate (${(marketStats.bustRate * 100).toFixed(0)}%) → Volume detection enabled`);
    }
    
    // 3. HEAVY TAIL DISTRIBUTION → Enable Weibull
    if (marketStats.hasHeavyTail) {
      recommendations.weibullHazard = true;
      recommendations.reasoning.push('Heavy tail detected → Weibull hazard enabled');
    }
    
    // 4. TIME-BASED PATTERNS
    if (time.regime === 'ASIAN_PEAK') {
      // Asian peak tends to be more volatile
      recommendations.cusumDetection = true;
      recommendations.reasoning.push('Asian peak hours → Extra caution enabled');
    }
    
    if (time.isWeekend) {
      // Weekends have more recreational players (higher variance)
      recommendations.volumeDetection = true;
      recommendations.reasoning.push('Weekend play → Volume detection enabled');
    }
    
    // 5. CONSERVATIVE MODE (if too many features)
    const enabledCount = Object.values(recommendations).filter(v => v === true).length;
    if (enabledCount > 3) {
      recommendations.reasoning.push('⚠️ Multiple features enabled - watch for over-fitting');
    }
    
    return recommendations;
  }

  /**
   * Analyze current market conditions
   */
  _analyzeMarket(history) {
    if (!history || history.length < 50) {
      return {
        volatility: 0,
        bustRate: 0,
        hasHeavyTail: false
      };
    }
    
    const recent50 = history.slice(0, 50);
    
    // Volatility
    const mean = recent50.reduce((a, b) => a + b, 0) / recent50.length;
    const variance = recent50.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / recent50.length;
    const volatility = Math.sqrt(variance);
    
    // Bust rate
    const bustCount = recent50.filter(m => m < 2.0).length;
    const bustRate = bustCount / recent50.length;
    
    // Heavy tail detection (presence of moon shots)
    const moonShots = recent50.filter(m => m > 10.0).length;
    const hasHeavyTail = moonShots >= 2;
    
    return {
      volatility,
      bustRate,
      hasHeavyTail,
      moonShots
    };
  }

  /**
   * 🆕 AUTO-CONFIGURE ENGINE
   * Automatically sets optimal features based on time/market
   */
  autoConfigureEngine(engine, history) {
    const recommendations = this.recommendFeatures(history);
    
    // Apply recommendations
    engine.features.kaplanMeier = recommendations.kaplanMeier;
    engine.features.weibullHazard = recommendations.weibullHazard;
    engine.features.cusumDetection = recommendations.cusumDetection;
    engine.features.volumeDetection = recommendations.volumeDetection;
    
    console.log('\n✅ ENGINE AUTO-CONFIGURED:');
    console.log('   Kaplan-Meier:', recommendations.kaplanMeier);
    console.log('   Weibull Hazard:', recommendations.weibullHazard);
    console.log('   CUSUM Detection:', recommendations.cusumDetection);
    console.log('   Volume Detection:', recommendations.volumeDetection);
    
    console.log('\n📋 REASONING:');
    recommendations.reasoning.forEach(reason => {
      console.log('   • ' + reason);
    });
    
    return recommendations;
  }

  /**
   * 🆕 TRACK FEATURE PERFORMANCE OVER TIME
   */
  logPerformance(features, predicted, actual, success) {
    const time = this.getCurrentRegime();
    const key = `${time.regime}_${time.isWeekend ? 'weekend' : 'weekday'}`;
    
    if (!this.patterns.features[key]) {
      this.patterns.features[key] = {
        total: 0,
        wins: 0,
        configurations: {}
      };
    }
    
    // Track this specific configuration
    const configKey = JSON.stringify(features);
    if (!this.patterns.features[key].configurations[configKey]) {
      this.patterns.features[key].configurations[configKey] = {
        total: 0,
        wins: 0
      };
    }
    
    this.patterns.features[key].total++;
    this.patterns.features[key].configurations[configKey].total++;
    
    if (success) {
      this.patterns.features[key].wins++;
      this.patterns.features[key].configurations[configKey].wins++;
    }
  }

  /**
   * Get best configuration for current time
   */
  getBestConfigForNow() {
    const time = this.getCurrentRegime();
    const key = `${time.regime}_${time.isWeekend ? 'weekend' : 'weekday'}`;
    
    const data = this.patterns.features[key];
    if (!data || data.total < 10) {
      return {
        available: false,
        message: 'Not enough data for this time period (need 10+ predictions)'
      };
    }
    
    // Find best configuration
    let bestConfig = null;
    let bestWinRate = 0;
    
    for (const [config, stats] of Object.entries(data.configurations)) {
      if (stats.total >= 5) {
        const winRate = stats.wins / stats.total;
        if (winRate > bestWinRate) {
          bestWinRate = winRate;
          bestConfig = JSON.parse(config);
        }
      }
    }
    
    if (bestConfig) {
      return {
        available: true,
        config: bestConfig,
        winRate: (bestWinRate * 100).toFixed(1) + '%',
        regime: time.regime
      };
    }
    
    return {
      available: false,
      message: 'No reliable configuration found for this time period'
    };
  }
}

// =============================================================================
// USAGE EXAMPLE
// =============================================================================

/*

// Step 1: Create analyzer
const timeAnalyzer = new TimeAwareAnalyzer();

// Step 2: Auto-configure engine before each prediction
const history = dataStore.getMultipliers(500);
const recommendations = timeAnalyzer.autoConfigureEngine(predictor.engine, history);

// Step 3: Make prediction (engine now uses optimal features)
const prediction = await predictor.predictNext(history);

// Step 4: After round completes, log performance
timeAnalyzer.logPerformance(
  predictor.engine.features,
  prediction.predictedValue,
  actualMultiplier,
  success
);

// Step 5: Check what works best right now
const best = timeAnalyzer.getBestConfigForNow();
console.log('Best config for current time:', best);

*/
