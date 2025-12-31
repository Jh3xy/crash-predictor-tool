
/**
 * 🤖 AUTOMATED BACKTESTING SYSTEM - PHASE 2.1: WALK-FORWARD FIX
 * ✅ Prevents data leakage with true time-series splits
 * ✅ Adds 2-round purge to avoid lookahead bias
 * ✅ Resets engine state between predictions
 */

export class BacktestingSystem {
  constructor(predictor, dataStore) {
    this.predictor = predictor;
    this.dataStore = dataStore;
    
    console.log('🤖 Backtesting System Initialized (Phase 2.1 - Anti-Leakage)');
    console.log(`📊 Available data: ${dataStore.rounds.length} rounds`);
  }

  /**
   * 🔥 PHASE 2.1: FIXED Walk-Forward Backtest
   * - Train on [0:i], predict i+1 (true expanding window)
   * - 2-round purge (don't use rounds i-1, i for training)
   * - Reset engine state per iteration
   * 
   * @param {number} numTests - Number of predictions to simulate
   * @param {object} features - Feature flags to test
   */
  async runBacktest(numTests = 100, features = {}) {
    console.log('\n🚀 Starting Walk-Forward Backtest (Phase 2.1)...');
    console.log(`   Tests to run: ${numTests}`);
    console.log(`   Features:`, features);
    
    const history = this.dataStore.rounds;
    const minHistory = 200; // Need at least 200 rounds to start predicting
    const PURGE_ROUNDS = 2; // Don't train on 2 rounds before prediction
    
    if (history.length < minHistory + numTests + PURGE_ROUNDS) {
      console.error(`❌ Not enough data. Need ${minHistory + numTests + PURGE_ROUNDS} rounds, have ${history.length}`);
      return null;
    }
    
    const results = [];
    const startTime = Date.now();
    
    // Temporarily apply feature flags
    this._applyFeatures(features);
    
    for (let i = 0; i < numTests; i++) {
      const predictionIndex = minHistory + i;
      
      // 🔥 FIX: True walk-forward with purge
      // Train on [0 : predictionIndex - PURGE_ROUNDS]
      // Predict round at predictionIndex
      const trainEndIndex = predictionIndex - PURGE_ROUNDS;
      
      // Get training data (all rounds up to purge boundary)
      const trainRounds = history.slice(0, trainEndIndex);
      const trainMultipliers = trainRounds.map(r => r.finalMultiplier);
      
      // 🔥 RESET ENGINE STATE (prevent state leakage)
      this._resetEngineState();
      
      // Make prediction
      try {
        const prediction = await this.predictor.predictNext(trainMultipliers);
        
        // Get actual result (the round we're predicting)
        const actualRound = history[predictionIndex];
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
          diff: Math.abs(actual - prediction.predictedValue),
          trainSize: trainMultipliers.length,
          purgeGap: PURGE_ROUNDS
        });
        
        // Progress log every 20 tests
        if ((i + 1) % 20 === 0) {
          const currentAccuracy = results.filter(r => r.success).length / results.length;
          console.log(`   ✔ Progress: ${i + 1}/${numTests} (${(currentAccuracy * 100).toFixed(1)}% accuracy so far)`);
        }
        
      } catch (error) {
        console.error(`❌ Test ${i + 1} failed:`, error.message);
      }
    }
    
    // Restore original state
    this._restoreFeatures();
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log(`\n✅ Walk-Forward Backtest Complete in ${duration}s`);
    console.log(`   🔒 Data leakage prevented via time-series splits`);
    console.log(`   🧹 ${PURGE_ROUNDS}-round purge applied`);
    
    return this._analyzeResults(results);
  }

  /**
   * 🔥 PHASE 2.1: Reset engine state between predictions
   * Prevents state from one prediction affecting the next
   */
  _resetEngineState() {
    const engine = this.predictor.engine;
    
    // Reset CUSUM (critical for preventing state leakage)
    if (engine.cusum) {
      engine.cusum.statistic = 0;
      engine.cusum.alertActive = false;
      engine.cusum.consecutiveBusts = 0;
      engine.cusum.lastValues = [];
    }
    
    // Reset any other stateful features here as they're added
    // Example: if (engine.someOtherState) { engine.someOtherState.reset(); }
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
    
    // 🔥 PHASE 2: Variance calculation (key stability metric)
    const predVariance = this._calculateVariance(results.map(r => r.predicted));
    const predStdDev = Math.sqrt(predVariance);
    
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
      
      // 🔥 PHASE 2: Stability metrics
      stability: {
        variance: predVariance.toFixed(4),
        stdDev: predStdDev.toFixed(2),
        coefficientOfVariation: (predStdDev / avgPredicted * 100).toFixed(1) + '%'
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

  /**
   * 🔥 PHASE 2: Calculate variance
   */
  _calculateVariance(values) {
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length;
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
    console.log('📊 WALK-FORWARD BACKTEST REPORT (Phase 2.1)');
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
    
    // 🔥 PHASE 2: Stability metrics
    console.log('\n🎯 Stability Metrics (Phase 2 Goal: <0.5):');
    console.log(`   Variance: ${report.stability.variance}`);
    console.log(`   Std Dev: ${report.stability.stdDev}`);
    console.log(`   CV: ${report.stability.coefficientOfVariation}`);
    
    const varianceCheck = parseFloat(report.stability.variance) < 0.5;
    console.log(`   Variance Check: ${varianceCheck ? '✅ PASS' : '⚠️  NEEDS WORK'}`);
    
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
    
    // 🔥 PHASE 2: Gate check
    const accuracyNum = parseFloat(report.summary.accuracy);
    const roiNum = parseFloat(report.profitability.roi);
    const varianceNum = parseFloat(report.stability.variance);
    
    console.log('\n🚪 Phase 2 Gate Check:');
    console.log(`   Accuracy >60%: ${accuracyNum > 60 ? '✅' : '❌'} (${accuracyNum.toFixed(1)}%)`);
    console.log(`   ROI >20%: ${roiNum > 20 ? '✅' : '❌'} (${roiNum.toFixed(1)}%)`);
    console.log(`   Variance <0.5: ${varianceNum < 0.5 ? '✅' : '⚠️'} (${varianceNum.toFixed(2)})`);
    
    const gatePass = accuracyNum > 60 && roiNum > 20;
    console.log(`   Overall: ${gatePass ? '✅ PASS - Proceed to Phase 3' : '❌ FAIL - Debug needed'}`);
    
    console.log('\n' + '='.repeat(60));
  }

  /**
   * Compare two feature sets (A/B testing)
   */
  async compareFeatures(featureSetA, featureSetB, numTests = 100) {
    console.log('\n🔬 Running A/B Comparison (Walk-Forward)...\n');
    
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
    const roiA = parseFloat(resultsA.profitability.roi);
    const roiB = parseFloat(resultsB.profitability.roi);
    
    const accuracyImprovement = ((accuracyB - accuracyA) / accuracyA * 100).toFixed(1);
    const roiImprovement = ((roiB - roiA) / Math.abs(roiA) * 100).toFixed(1);
    
    console.log(`\nFeature Set A:`);
    console.log(`  Accuracy: ${(accuracyA * 100).toFixed(2)}%`);
    console.log(`  ROI: ${roiA.toFixed(2)}%`);
    
    console.log(`\nFeature Set B:`);
    console.log(`  Accuracy: ${(accuracyB * 100).toFixed(2)}%`);
    console.log(`  ROI: ${roiB.toFixed(2)}%`);
    
    console.log(`\nImprovement:`);
    console.log(`  Accuracy: ${accuracyImprovement}% ${parseFloat(accuracyImprovement) > 0 ? '✅' : '❌'}`);
    console.log(`  ROI: ${roiImprovement}% ${parseFloat(roiImprovement) > 0 ? '✅' : '❌'}`);
    
    // 🔥 PHASE 2: Gate criteria (>3% accuracy OR >5% ROI)
    const significantImprovement = parseFloat(accuracyImprovement) > 3 || parseFloat(roiImprovement) > 5;
    
    if (significantImprovement) {
      console.log('\n✅ Feature Set B shows significant improvement! (>3% acc OR >5% ROI)');
    } else if (parseFloat(accuracyImprovement) > 0 && parseFloat(roiImprovement) > 0) {
      console.log('\n⚠️  Feature Set B shows marginal improvement (<3% acc AND <5% ROI)');
    } else {
      console.log('\n❌ Feature Set B does not improve performance');
    }
    
    console.log('='.repeat(60));
    
    return {
      featureSetA: resultsA,
      featureSetB: resultsB,
      accuracyImprovement: parseFloat(accuracyImprovement),
      roiImprovement: parseFloat(roiImprovement)
    };
  }

  /**
   * Feature flag management
   */
  _applyFeatures(features) {
    // Store original state
    this._originalFeatures = { ...this.predictor.engine.features };
    
    // Apply feature flags
    Object.keys(features).forEach(key => {
      if (features[key] !== undefined) {
        this.predictor.engine.features[key] = features[key];
        console.log(`   ✔ ${key}: ${features[key]}`);
      }
    });
  }

  _restoreFeatures() {
    // Restore original feature state
    if (this._originalFeatures) {
      this.predictor.engine.features = { ...this._originalFeatures };
    }
  }

  /**
   * Export results to CSV
   */
  exportToCSV(results) {
    const csv = [
      'Test,RoundID,Predicted,Actual,Confidence,Action,Success,Diff,TrainSize,PurgeGap',
      ...results.rawResults.map(r => 
        `${r.testNumber},${r.roundId},${r.predicted},${r.actual},${r.confidence},${r.action},${r.success},${r.diff},${r.trainSize},${r.purgeGap}`
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

// Run Phase 2 backtest (walk-forward + anti-leakage)
// await backtester.runBacktest(200);