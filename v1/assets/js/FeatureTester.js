

/**
 * 🧪 AUTOMATED FEATURE TESTING SUITE
 * Tests all feature combinations to find the best setup
 * Run this ONCE overnight, wake up to results
 */

export class FeatureTester {
  constructor(predictor, dataStore) {
    this.predictor = predictor;
    this.dataStore = dataStore;
    this.results = [];
  }

  /**
   * 🔥 MAIN TEST RUNNER
   * Tests features incrementally: Baseline → +1 feature → +2 features → etc.
   */
  async runIncrementalTest(numTests = 100) {
    console.log('\n🧪 STARTING INCREMENTAL FEATURE TEST');
    console.log(`   Running ${numTests} predictions per configuration`);
    console.log('   This will take ~5 minutes...\n');

    // BASELINE (Your best config)
    const baseline = {
      name: 'BASELINE',
      features: {
        winsorization: false,
        houseEdgeBlend: true,
        dynamicConfidence: false,
        volumeDetection: false,
        kellyBetting: false,
        // NEW FEATURES (all off for baseline)
        kaplanMeier: false,
        weibullHazard: false,
        cusumDetection: false
      }
    };

    // PHASE 1: Test each NEW feature individually
    const phase1Tests = [
      {
        name: 'Baseline + Kaplan-Meier',
        features: { ...baseline.features, kaplanMeier: true }
      },
      {
        name: 'Baseline + Weibull Hazard',
        features: { ...baseline.features, weibullHazard: true }
      },
      {
        name: 'Baseline + CUSUM',
        features: { ...baseline.features, cusumDetection: true }
      }
    ];

    // Run baseline first
    console.log('📊 Phase 0: Testing BASELINE...');
    const baselineResult = await this._testConfiguration(baseline, numTests);
    this.results.push(baselineResult);
    this._printResult(baselineResult);

    // Run Phase 1
    console.log('\n📊 Phase 1: Testing each NEW feature individually...');
    const phase1Results = [];
    
    for (const config of phase1Tests) {
      const result = await this._testConfiguration(config, numTests);
      this.results.push(result);
      phase1Results.push(result);
      this._printResult(result);
      
      // Compare to baseline
      const improvement = ((result.accuracy - baselineResult.accuracy) / baselineResult.accuracy * 100);
      if (improvement > 2) {
        console.log(`   ✅ SIGNIFICANT IMPROVEMENT: +${improvement.toFixed(1)}%`);
      } else if (improvement > 0) {
        console.log(`   ⚠️  Marginal improvement: +${improvement.toFixed(1)}%`);
      } else {
        console.log(`   ❌ No improvement: ${improvement.toFixed(1)}%`);
      }
      console.log('');
    }

    // PHASE 2: Find the best single feature
    const bestSingle = phase1Results.reduce((best, curr) => 
      curr.accuracy > best.accuracy ? curr : best
    );

    console.log('\n📊 Phase 2: Testing BEST feature + combinations...');
    
    // Get the best feature name
    const bestFeatureName = Object.keys(bestSingle.config.features).find(key => 
      bestSingle.config.features[key] === true && 
      !baseline.features[key]
    );

    // Test combinations with the best feature
    const phase2Tests = [];
    
    if (bestFeatureName !== 'kaplanMeier') {
      phase2Tests.push({
        name: `Best (${bestFeatureName}) + Kaplan-Meier`,
        features: { ...bestSingle.config.features, kaplanMeier: true }
      });
    }
    
    if (bestFeatureName !== 'weibullHazard') {
      phase2Tests.push({
        name: `Best (${bestFeatureName}) + Weibull`,
        features: { ...bestSingle.config.features, weibullHazard: true }
      });
    }
    
    if (bestFeatureName !== 'cusumDetection') {
      phase2Tests.push({
        name: `Best (${bestFeatureName}) + CUSUM`,
        features: { ...bestSingle.config.features, cusumDetection: true }
      });
    }

    const phase2Results = [];
    for (const config of phase2Tests) {
      const result = await this._testConfiguration(config, numTests);
      this.results.push(result);
      phase2Results.push(result);
      this._printResult(result);
    }

    // PHASE 3: Test all 3 new features together
    console.log('\n📊 Phase 3: Testing ALL new features...');
    const allFeaturesTest = {
      name: 'Baseline + ALL NEW (KM + Weibull + CUSUM)',
      features: {
        ...baseline.features,
        kaplanMeier: true,
        weibullHazard: true,
        cusumDetection: true
      }
    };
    
    const allFeaturesResult = await this._testConfiguration(allFeaturesTest, numTests);
    this.results.push(allFeaturesResult);
    this._printResult(allFeaturesResult);

    // FINAL REPORT
    this._printFinalReport(baselineResult);
  }

  /**
   * Test a single configuration
   */
  async _testConfiguration(config, numTests) {
    // Apply feature flags to engine
    this._applyFeatures(config.features);

    const history = this.dataStore.rounds;
    const minHistory = 200;
    
    if (history.length < minHistory + numTests) {
      throw new Error(`Need ${minHistory + numTests} rounds, have ${history.length}`);
    }

    const testResults = [];
    
    for (let i = 0; i < numTests; i++) {
      const testIndex = minHistory + i;
      const pastRounds = history.slice(i, testIndex);
      const pastMultipliers = pastRounds.map(r => r.finalMultiplier);
      
      try {
        const prediction = await this.predictor.predictNext(pastMultipliers);
        const actualRound = history[testIndex];
        const actual = actualRound.finalMultiplier;
        const success = actual >= prediction.predictedValue;
        
        testResults.push({
          predicted: prediction.predictedValue,
          actual: actual,
          success: success
        });
      } catch (error) {
        console.error(`Test ${i + 1} failed:`, error.message);
      }
    }

    // Calculate metrics
    const wins = testResults.filter(r => r.success).length;
    const accuracy = wins / testResults.length;
    const avgPredicted = testResults.reduce((sum, r) => sum + r.predicted, 0) / testResults.length;

    return {
      config: config,
      accuracy: accuracy,
      wins: wins,
      losses: testResults.length - wins,
      avgPredicted: avgPredicted,
      totalTests: testResults.length
    };
  }

  /**
   * Apply feature flags to engine
   */
  _applyFeatures(features) {
    Object.keys(features).forEach(key => {
      this.predictor.engine.features[key] = features[key];
    });
  }

  /**
   * Print single result
   */
  _printResult(result) {
    console.log(`\n   ${result.config.name}:`);
    console.log(`   ├─ Accuracy: ${(result.accuracy * 100).toFixed(2)}%`);
    console.log(`   ├─ Wins: ${result.wins} / ${result.totalTests}`);
    console.log(`   └─ Avg Target: ${result.avgPredicted.toFixed(2)}x`);
  }

  /**
   * Print final comparison report
   */
  _printFinalReport(baselineResult) {
    console.log('\n' + '='.repeat(70));
    console.log('🏆 FINAL FEATURE COMPARISON REPORT');
    console.log('='.repeat(70));

    // Sort by accuracy
    const sorted = [...this.results].sort((a, b) => b.accuracy - a.accuracy);

    console.log('\n📊 Ranking (Best to Worst):\n');
    
    sorted.forEach((result, index) => {
      const rank = index + 1;
      const improvement = ((result.accuracy - baselineResult.accuracy) / baselineResult.accuracy * 100);
      const emoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '  ';
      
      console.log(`${emoji} #${rank}. ${result.config.name}`);
      console.log(`      Accuracy: ${(result.accuracy * 100).toFixed(2)}%`);
      console.log(`      vs Baseline: ${improvement >= 0 ? '+' : ''}${improvement.toFixed(2)}%`);
      console.log('');
    });

    // Winner analysis
    const winner = sorted[0];
    console.log('='.repeat(70));
    console.log('🎯 RECOMMENDED CONFIGURATION:');
    console.log('='.repeat(70));
    console.log(`\nName: ${winner.config.name}`);
    console.log(`Accuracy: ${(winner.accuracy * 100).toFixed(2)}%`);
    console.log(`Improvement over baseline: ${((winner.accuracy - baselineResult.accuracy) / baselineResult.accuracy * 100).toFixed(2)}%`);
    
    console.log('\nFeatures to enable:');
    Object.keys(winner.config.features).forEach(key => {
      if (winner.config.features[key]) {
        console.log(`  ✅ ${key}: true`);
      }
    });
    
    console.log('\nFeatures to disable:');
    Object.keys(winner.config.features).forEach(key => {
      if (!winner.config.features[key]) {
        console.log(`  ❌ ${key}: false`);
      }
    });

    console.log('\n' + '='.repeat(70));
    
    // Export results
    this._exportResults();
  }

  /**
   * Export results to copy-paste
   */
  _exportResults() {
    console.log('\n📋 COPY THIS CONFIG TO YOUR ENGINE:');
    console.log('```javascript');
    
    const winner = [...this.results].sort((a, b) => b.accuracy - a.accuracy)[0];
    console.log('this.features = {');
    Object.keys(winner.config.features).forEach(key => {
      console.log(`  ${key}: ${winner.config.features[key]},`);
    });
    console.log('};');
    console.log('```');
  }
}

// =============================================================================
// USAGE IN BROWSER CONSOLE
// =============================================================================

/*

// Step 1: Create tester
const tester = new FeatureTester(predictor, dataStore);

// Step 2: Run automated test (takes ~5 min for 100 predictions per config)
await tester.runIncrementalTest(100);

// Step 3: Copy the winning configuration and paste into quantile-prediction-engine.js

*/