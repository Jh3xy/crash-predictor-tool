
/**
 * 🔬 FEATURE DIAGNOSTIC TOOL
 * Tests if features are actually working and not over-engineered
 */

export class FeatureDiagnostic {
  constructor(predictor, dataStore) {
    this.predictor = predictor;
    this.dataStore = dataStore;
  }

  /**
   * 🔥 MAIN DIAGNOSTIC TEST
   * Runs controlled tests to verify each feature works
   */
  async runDiagnostics() {
    console.log('\n' + '='.repeat(70));
    console.log('🔬 FEATURE DIAGNOSTIC SUITE');
    console.log('='.repeat(70));

    const history = this.dataStore.rounds.map(r => r.finalMultiplier);
    
    if (history.length < 200) {
      console.error('❌ Need at least 200 rounds of history');
      return;
    }

    // Test 1: Baseline
    console.log('\n📊 TEST 1: BASELINE (houseEdgeBlend only)');
    const baselineResult = await this._testConfiguration({
      kaplanMeier: false,
      weibullHazard: false,
      cusumDetection: false,
      volumeDetection: false
    }, history.slice(0, 100));
    
    // Test 2: Kaplan-Meier
    console.log('\n📊 TEST 2: KAPLAN-MEIER FUNCTIONALITY');
    const kmResult = await this._testKaplanMeier(history);
    
    // Test 3: Weibull Hazard
    console.log('\n📊 TEST 3: WEIBULL HAZARD FUNCTIONALITY');
    const weibullResult = await this._testWeibull(history);
    
    // Test 4: CUSUM Detection
    console.log('\n📊 TEST 4: CUSUM DETECTION');
    const cusumResult = await this._testCUSUM(history);
    
    // Test 5: Volume Detection
    console.log('\n📊 TEST 5: VOLUME DETECTION');
    const volumeResult = await this._testVolume(history);
    
    // FINAL REPORT
    this._printDiagnosticReport({
      baseline: baselineResult,
      kaplanMeier: kmResult,
      weibull: weibullResult,
      cusum: cusumResult,
      volume: volumeResult
    });
  }

  /**
   * Test Kaplan-Meier
   */
  async _testKaplanMeier(history) {
    console.log('   Testing if KM changes predictions...');
    
    // Enable only KM
    this.predictor.engine.features.kaplanMeier = false;
    const pred1 = await this.predictor.predictNext(history.slice(0, 500));
    
    this.predictor.engine.features.kaplanMeier = true;
    const pred2 = await this.predictor.predictNext(history.slice(0, 500));
    
    const difference = Math.abs(pred2.predictedValue - pred1.predictedValue);
    const percentChange = (difference / pred1.predictedValue * 100).toFixed(1);
    
    const working = difference > 0.05; // At least 0.05x difference
    
    console.log(`   Without KM: ${pred1.predictedValue.toFixed(2)}x`);
    console.log(`   With KM: ${pred2.predictedValue.toFixed(2)}x`);
    console.log(`   Difference: ${difference.toFixed(2)}x (${percentChange}%)`);
    console.log(`   Status: ${working ? '✅ WORKING' : '❌ NOT WORKING (no effect)'}`);
    
    // Test survival probability calculation
    if (pred2.survivalProbability) {
      console.log(`   Survival Prob: ${(parseFloat(pred2.survivalProbability) * 100).toFixed(1)}%`);
    }
    
    return {
      working,
      impact: percentChange + '%',
      difference: difference.toFixed(2)
    };
  }

  /**
   * Test Weibull Hazard
   */
  async _testWeibull(history) {
    console.log('   Testing if Weibull changes predictions...');
    
    this.predictor.engine.features.weibullHazard = false;
    const pred1 = await this.predictor.predictNext(history.slice(0, 500));
    
    this.predictor.engine.features.weibullHazard = true;
    const pred2 = await this.predictor.predictNext(history.slice(0, 500));
    
    const difference = Math.abs(pred2.predictedValue - pred1.predictedValue);
    const percentChange = (difference / pred1.predictedValue * 100).toFixed(1);
    
    const working = difference > 0.03;
    
    console.log(`   Without Weibull: ${pred1.predictedValue.toFixed(2)}x`);
    console.log(`   With Weibull: ${pred2.predictedValue.toFixed(2)}x`);
    console.log(`   Difference: ${difference.toFixed(2)}x (${percentChange}%)`);
    console.log(`   Status: ${working ? '✅ WORKING' : '❌ NOT WORKING (minimal effect)'}`);
    
    // Test if it detects distribution type
    const hazard = this.predictor.engine._calculateWeibullHazard(history.slice(0, 500));
    console.log(`   Distribution: ${hazard.interpretation}`);
    console.log(`   Advice: ${hazard.advice}`);
    
    return {
      working,
      impact: percentChange + '%',
      type: hazard.interpretation
    };
  }

  /**
   * Test CUSUM Detection
   */
  async _testCUSUM(history) {
    console.log('   Testing if CUSUM detects bust clusters...');
    
    // Reset CUSUM
    this.predictor.engine.cusum.statistic = 0;
    this.predictor.engine.cusum.alertActive = false;
    
    // Feed it a bust cluster manually
    const bustCluster = [1.02, 1.01, 1.05, 1.03, 1.01, 1.04, 1.02];
    console.log(`   Feeding bust cluster: ${bustCluster.join(', ')}`);
    
    bustCluster.forEach(m => {
      this.predictor.engine._updateCUSUM(m);
    });
    
    const triggeredOnBusts = this.predictor.engine.cusum.alertActive;
    console.log(`   CUSUM Statistic: ${this.predictor.engine.cusum.statistic.toFixed(2)}`);
    console.log(`   Alert Triggered: ${triggeredOnBusts ? '✅ YES' : '❌ NO'}`);
    
    // Reset and feed moon shots
    this.predictor.engine.cusum.statistic = 0;
    this.predictor.engine.cusum.alertActive = false;
    
    const moonShots = [5.2, 10.5, 3.8, 8.1, 2.5];
    console.log(`   Feeding moon shots: ${moonShots.join(', ')}`);
    
    moonShots.forEach(m => {
      this.predictor.engine._updateCUSUM(m);
    });
    
    const triggeredOnMoons = this.predictor.engine.cusum.alertActive;
    console.log(`   Alert Triggered: ${triggeredOnMoons ? '❌ FALSE POSITIVE' : '✅ CORRECT (no alert)'}`);
    
    const working = triggeredOnBusts && !triggeredOnMoons;
    console.log(`   Status: ${working ? '✅ WORKING CORRECTLY' : '❌ NOT WORKING'}`);
    
    return {
      working,
      bustDetection: triggeredOnBusts,
      falsePositive: triggeredOnMoons
    };
  }

  /**
   * Test Volume Detection
   */
  async _testVolume(history) {
    console.log('   Testing if Volume Detection adjusts predictions...');
    
    this.predictor.engine.features.volumeDetection = false;
    const pred1 = await this.predictor.predictNext(history.slice(0, 500));
    
    this.predictor.engine.features.volumeDetection = true;
    const pred2 = await this.predictor.predictNext(history.slice(0, 500));
    
    const difference = Math.abs(pred2.predictedValue - pred1.predictedValue);
    const working = difference > 0.02;
    
    console.log(`   Without Volume: ${pred1.predictedValue.toFixed(2)}x`);
    console.log(`   With Volume: ${pred2.predictedValue.toFixed(2)}x`);
    console.log(`   Status: ${working ? '✅ WORKING' : '⚠️ MINIMAL EFFECT'}`);
    
    // Test on bust-heavy sample
    const recent20 = history.slice(0, 20);
    const bustRate = recent20.filter(m => m < 2.0).length / 20;
    const adjustment = this.predictor.engine._detectBustVolume(recent20);
    
    console.log(`   Recent Bust Rate: ${(bustRate * 100).toFixed(0)}%`);
    console.log(`   Adjustment Factor: ${adjustment.toFixed(2)}x`);
    
    return {
      working,
      bustRate: (bustRate * 100).toFixed(0) + '%',
      adjustment: adjustment.toFixed(2)
    };
  }

  /**
   * Test configuration
   */
  async _testConfiguration(features, history) {
    Object.keys(features).forEach(key => {
      this.predictor.engine.features[key] = features[key];
    });
    
    const pred = await this.predictor.predictNext(history);
    return {
      prediction: pred.predictedValue.toFixed(2),
      confidence: pred.confidence.toFixed(1) + '%'
    };
  }

  /**
   * Print diagnostic report
   */
  _printDiagnosticReport(results) {
    console.log('\n' + '='.repeat(70));
    console.log('📋 DIAGNOSTIC REPORT');
    console.log('='.repeat(70));

    console.log('\n✅ WORKING FEATURES:');
    if (results.kaplanMeier.working) {
      console.log(`   • Kaplan-Meier: ${results.kaplanMeier.impact} impact`);
    }
    if (results.weibull.working) {
      console.log(`   • Weibull Hazard: ${results.weibull.impact} impact`);
    }
    if (results.cusum.working) {
      console.log(`   • CUSUM: Correctly detects bust clusters`);
    }
    if (results.volume.working) {
      console.log(`   • Volume Detection: ${results.volume.adjustment}x adjustment`);
    }

    console.log('\n❌ NON-WORKING / PROBLEMATIC FEATURES:');
    if (!results.kaplanMeier.working) {
      console.log('   • Kaplan-Meier: No measurable effect');
    }
    if (!results.weibull.working) {
      console.log('   • Weibull Hazard: Minimal/no effect');
    }
    if (!results.cusum.working) {
      console.log('   • CUSUM: Not detecting bust clusters correctly');
      if (results.cusum.falsePositive) {
        console.log('     → FALSE POSITIVE: Triggering on moon shots');
      }
      if (!results.cusum.bustDetection) {
        console.log('     → NOT SENSITIVE: Missing bust clusters');
      }
    }
    if (!results.volume.working) {
      console.log('   • Volume Detection: Minimal effect');
    }

    console.log('\n💡 RECOMMENDATIONS:');
    
    const workingCount = [
      results.kaplanMeier.working,
      results.weibull.working,
      results.cusum.working,
      results.volume.working
    ].filter(Boolean).length;

    if (workingCount === 0) {
      console.log('   ⚠️ NO FEATURES WORKING - Use baseline only');
      console.log('   → Set all features to FALSE except houseEdgeBlend');
    } else if (workingCount === 1) {
      console.log('   ✅ OPTIMAL: One feature working');
      console.log('   → Keep the one working feature enabled');
    } else if (workingCount >= 2) {
      console.log('   ⚠️ MULTIPLE FEATURES: Risk of over-fitting');
      console.log('   → Test combinations carefully with backtesting');
    }

    console.log('\n' + '='.repeat(70));
  }
}

// =============================================================================
// USAGE
// =============================================================================

/*

// Create diagnostic tool
const diagnostic = new FeatureDiagnostic(predictor, dataStore);

// Run full diagnostic
await diagnostic.runDiagnostics();

// Result: Tells you exactly which features work and which don't

*/