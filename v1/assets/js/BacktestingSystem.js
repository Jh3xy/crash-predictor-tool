

/**
 * 🤖 AUTOMATED BACKTESTING SYSTEM
 * Test prediction accuracy on historical data WITHOUT manual clicking
 * Run 100+ predictions in seconds instead of hours
 */

export class BacktestingSystem {
  constructor(predictor, dataStore) {
    this.predictor = predictor;
    this.dataStore = dataStore;
    
    console.log('🤖 Backtesting System Initialized');
    console.log(`📊 Available data: ${dataStore.rounds.length} rounds`);
  }

  /**
   * Run automated backtest
   * @param {number} numTests - Number of predictions to simulate (default 100)
   * @param {object} features - Feature flags to test
   */
  async runBacktest(numTests = 100, features = {}) {
    console.log('\n🚀 Starting Backtest...');
    console.log(`   Tests to run: ${numTests}`);
    console.log(`   Features:`, features);
    
    const history = this.dataStore.rounds;
    const minHistory = 200; // Need at least 200 rounds to start predicting
    
    if (history.length < minHistory + numTests) {
      console.error(`❌ Not enough data. Need ${minHistory + numTests} rounds, have ${history.length}`);
      return null;
    }
    
    const results = [];
    const startTime = Date.now();
    
    // Temporarily apply feature flags
    this._applyFeatures(features);
    
    for (let i = 0; i < numTests; i++) {
      const testIndex = minHistory + i;
      
      // Get historical data UP TO this point (simulate "past")
      const pastRounds = history.slice(i, testIndex);
      const pastMultipliers = pastRounds.map(r => r.finalMultiplier);
      
      // Make prediction
      try {
        const prediction = await this.predictor.predictNext(pastMultipliers);
        
        // Get actual result
        const actualRound = history[testIndex];
        const actual = actualRound.finalMultiplier;
        
        // Check success
        const success = actual >= prediction.predictedValue;
        
        results.push({
          testNumber: i + 1,
          roundId: actualRound.gameId,
          predicted: prediction.predictedValue,
          actual: actual,
          confidence: prediction.confidence,
          action: prediction.action,
          success: success,
          diff: Math.abs(actual - prediction.predictedValue)
        });
        
        // Progress log every 20 tests
        if ((i + 1) % 20 === 0) {
          const currentAccuracy = results.filter(r => r.success).length / results.length;
          console.log(`   ✓ Progress: ${i + 1}/${numTests} (${(currentAccuracy * 100).toFixed(1)}% accuracy so far)`);
        }
        
      } catch (error) {
        console.error(`❌ Test ${i + 1} failed:`, error.message);
      }
    }
    
    // Restore original state
    this._restoreFeatures();
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log(`\n✅ Backtest Complete in ${duration}s`);
    
    return this._analyzeResults(results);
  }

  /**
   * Analyze backtest results and generate report
   */
  _analyzeResults(results) {
    const totalTests = results.length;
    const wins = results.filter(r => r.success).length;
    const losses = totalTests - wins;
    const accuracy = wins / totalTests;
    
    // Calculate average metrics
    const avgPredicted = results.reduce((sum, r) => sum + r.predicted, 0) / totalTests;
    const avgActual = results.reduce((sum, r) => sum + r.actual, 0) / totalTests;
    const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / totalTests;
    const avgDiff = results.reduce((sum, r) => sum + r.diff, 0) / totalTests;
    
    // Calculate prediction distribution
    const predictionRanges = {
      veryLow: results.filter(r => r.predicted < 1.5).length,
      low: results.filter(r => r.predicted >= 1.5 && r.predicted < 2.0).length,
      medium: results.filter(r => r.predicted >= 2.0 && r.predicted < 3.0).length,
      high: results.filter(r => r.predicted >= 3.0).length
    };
    
    // Win rate by prediction range
    const winRateByRange = {
      veryLow: this._calcWinRate(results.filter(r => r.predicted < 1.5)),
      low: this._calcWinRate(results.filter(r => r.predicted >= 1.5 && r.predicted < 2.0)),
      medium: this._calcWinRate(results.filter(r => r.predicted >= 2.0 && r.predicted < 3.0)),
      high: this._calcWinRate(results.filter(r => r.predicted >= 3.0))
    };
    
    // Calculate ROI (assuming 1 unit bet each time)
    const totalWagered = totalTests;
    const totalWon = results.filter(r => r.success).reduce((sum, r) => sum + r.predicted, 0);
    const totalLost = losses;
    const netProfit = totalWon - totalLost;
    const roi = (netProfit / totalWagered) * 100;
    
    const report = {
      summary: {
        totalTests,
        wins,
        losses,
        accuracy: (accuracy * 100).toFixed(2) + '%',
        winRate: accuracy
      },
      
      averages: {
        predicted: avgPredicted.toFixed(2) + 'x',
        actual: avgActual.toFixed(2) + 'x',
        confidence: avgConfidence.toFixed(1) + '%',
        difference: avgDiff.toFixed(2)
      },
      
      distribution: {
        predictions: predictionRanges,
        winRates: winRateByRange
      },
      
      profitability: {
        totalWagered,
        totalWon: totalWon.toFixed(2),
        totalLost,
        netProfit: netProfit.toFixed(2),
        roi: roi.toFixed(2) + '%'
      },
      
      rawResults: results
    };
    
    this._printReport(report);
    
    return report;
  }

  _calcWinRate(subset) {
    if (subset.length === 0) return 'N/A';
    const wins = subset.filter(r => r.success).length;
    return ((wins / subset.length) * 100).toFixed(1) + '%';
  }

  /**
   * Print formatted report
   */
  _printReport(report) {
    console.log('\n' + '='.repeat(60));
    console.log('📊 BACKTEST REPORT');
    console.log('='.repeat(60));
    
    console.log('\n📈 Summary:');
    console.log(`   Total Tests: ${report.summary.totalTests}`);
    console.log(`   Wins: ${report.summary.wins}`);
    console.log(`   Losses: ${report.summary.losses}`);
    console.log(`   Accuracy: ${report.summary.accuracy} ✅`);
    
    console.log('\n📊 Averages:');
    console.log(`   Predicted: ${report.averages.predicted}`);
    console.log(`   Actual: ${report.averages.actual}`);
    console.log(`   Confidence: ${report.averages.confidence}`);
    console.log(`   Avg Difference: ${report.averages.difference}`);
    
    console.log('\n🎯 Prediction Distribution:');
    console.log(`   Very Low (<1.5x): ${report.distribution.predictions.veryLow} predictions → ${report.distribution.winRates.veryLow} win rate`);
    console.log(`   Low (1.5-2.0x): ${report.distribution.predictions.low} predictions → ${report.distribution.winRates.low} win rate`);
    console.log(`   Medium (2.0-3.0x): ${report.distribution.predictions.medium} predictions → ${report.distribution.winRates.medium} win rate`);
    console.log(`   High (>3.0x): ${report.distribution.predictions.high} predictions → ${report.distribution.winRates.high} win rate`);
    
    console.log('\n💰 Profitability:');
    console.log(`   Total Wagered: ${report.profitability.totalWagered} units`);
    console.log(`   Total Won: ${report.profitability.totalWon} units`);
    console.log(`   Total Lost: ${report.profitability.totalLost} units`);
    console.log(`   Net Profit: ${report.profitability.netProfit} units`);
    console.log(`   ROI: ${report.profitability.roi} ${parseFloat(report.profitability.roi) > 0 ? '✅' : '❌'}`);
    
    console.log('\n' + '='.repeat(60));
  }

  /**
   * Compare two feature sets (A/B testing)
   */
  async compareFeatures(featureSetA, featureSetB, numTests = 100) {
    console.log('\n🔬 Running A/B Comparison...\n');
    
    console.log('Testing Feature Set A:');
    const resultsA = await this.runBacktest(numTests, featureSetA);
    
    console.log('\nTesting Feature Set B:');
    const resultsB = await this.runBacktest(numTests, featureSetB);
    
    if (!resultsA || !resultsB) {
      console.error('❌ Comparison failed');
      return null;
    }
    
    // Compare results
    console.log('\n' + '='.repeat(60));
    console.log('🔬 A/B COMPARISON RESULTS');
    console.log('='.repeat(60));
    
    const accuracyA = resultsA.summary.winRate;
    const accuracyB = resultsB.summary.winRate;
    const improvement = ((accuracyB - accuracyA) / accuracyA * 100).toFixed(1);
    
    console.log(`\nFeature Set A: ${(accuracyA * 100).toFixed(2)}% accuracy`);
    console.log(`Feature Set B: ${(accuracyB * 100).toFixed(2)}% accuracy`);
    console.log(`\nImprovement: ${improvement}% ${parseFloat(improvement) > 0 ? '✅' : '❌'}`);
    
    if (parseFloat(improvement) > 2) {
      console.log('\n✅ Feature Set B shows significant improvement! (>2%)');
    } else if (parseFloat(improvement) > 0) {
      console.log('\n⚠️ Feature Set B shows marginal improvement (<2%)');
    } else {
      console.log('\n❌ Feature Set B does not improve accuracy');
    }
    
    console.log('='.repeat(60));
    
    return {
      featureSetA: resultsA,
      featureSetB: resultsB,
      improvement: parseFloat(improvement)
    };
  }

  /**
   * Feature flag management
   */
  _applyFeatures(features) {
    // Store original state
    this._originalState = {
      targetQuantile: this.predictor.engine.targetQuantile
    };
    
    // Apply feature flags
    if (features.timeBasedBoost) {
      console.log('   ✓ Enabling time-based boost');
      this.predictor.engine.features_timeBasedBoost = true;
    }
    
    if (features.winsorization) {
      console.log('   ✓ Enabling winsorization');
      this.predictor.engine.features_winsorization = true;
    }
    
    if (features.meanReversion) {
      console.log('   ✓ Enabling mean reversion');
      this.predictor.engine.features_meanReversion = true;
    }
  }

  _restoreFeatures() {
    // Restore original state
    this.predictor.engine.targetQuantile = this._originalState.targetQuantile;
    this.predictor.engine.features_timeBasedBoost = false;
    this.predictor.engine.features_winsorization = false;
    this.predictor.engine.features_meanReversion = false;
  }

  /**
   * Export results to CSV
   */
  exportToCSV(results) {
    const csv = [
      'Test,RoundID,Predicted,Actual,Confidence,Action,Success,Diff',
      ...results.rawResults.map(r => 
        `${r.testNumber},${r.roundId},${r.predicted},${r.actual},${r.confidence},${r.action},${r.success},${r.diff}`
      )
    ].join('\n');
    
    console.log('\n📄 CSV Export:');
    console.log(csv);
    
    return csv;
  }
}

// ============================================
// USAGE IN CONSOLE
// ============================================

// Initialize backtester
// const backtester = new BacktestingSystem(predictor, dataStore);

// Run basic backtest (100 predictions)
// const results = await backtester.runBacktest(100);

// Compare baseline vs time-based boost
// const comparison = await backtester.compareFeatures(
//   {},  // Baseline (no features)
//   { timeBasedBoost: true }  // With time boost
// );

// Export results
// backtester.exportToCSV(results);