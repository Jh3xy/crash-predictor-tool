/**
 * js/predictor.js
 * Wrapper for Quantile-Based Prediction Engine
 */

import { QuantilePredictionEngine } from './quantile-prediction-engine.js';

export class CrashPredictor {
    constructor() {
        this.engine = new QuantilePredictionEngine();
        this.lastPrediction = null;

        // 🔥 ADD THESE:
        this.liveValidation = this._loadValidationState();
        
        this._loadState();
        
        console.log('🎯 CrashPredictor initialized with Quantile Engine');
        console.log('📊 Stats:', this.engine.getStatistics());

        // 🔥 ADD THESE:
        if (this.liveValidation.predictions.length > 0) {
            console.log(`📈 Live Validation: ${this.liveValidation.predictions.length}/50 tracked`);
        }
    }

    _loadState() {
        try {
            // Load prediction stats
            const predStats = localStorage.getItem('predictionStats_v2');
            if (predStats) {
                this.engine.predictionStats = JSON.parse(predStats);
                console.log('✅ Loaded prediction stats:', this.engine.predictionStats);
            }
            
            // Load raw history
            const rawHistory = localStorage.getItem('rawHistory_v2');
            if (rawHistory) {
                this.engine.rawHistory = JSON.parse(rawHistory);
                console.log(`✅ Loaded ${this.engine.rawHistory.length} rounds of market data`);
            }
            
            // Load calibration
            const calibration = localStorage.getItem('targetQuantile_v2');
            if (calibration) {
                this.engine.targetQuantile = parseFloat(calibration);
                console.log(`✅ Loaded calibrated quantile: ${(this.engine.targetQuantile * 100).toFixed(1)}th percentile`);
            }
        } catch (e) {
            console.warn('⚠️ Failed to load state:', e);
        }
    }

    _saveState() {
        try {
            localStorage.setItem('predictionStats_v2', JSON.stringify(this.engine.predictionStats));
            localStorage.setItem('rawHistory_v2', JSON.stringify(this.engine.rawHistory.slice(0, 1000))); // Save first 1000
            localStorage.setItem('targetQuantile_v2', this.engine.targetQuantile.toString());
        } catch (e) {
            console.warn('⚠️ Failed to save state:', e);
        }
    }

    // ============================================
    // CHANGE 2: Add these new methods to class
    // ============================================

    /**
     * 🔥 NEW METHOD: Load validation state
     */
    _loadValidationState() {
        try {
            const saved = localStorage.getItem('liveValidation_v2');
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.warn('⚠️  Failed to load validation state:', e);
        }
        
        return {
            predictions: [],
            startTime: Date.now(),
            targetCount: 50,
            sessionId: Date.now().toString(36)
        };
    }
    /**
     * 🔥 NEW METHOD: Save validation state
     */
    _saveValidationState() {
        try {
            localStorage.setItem('liveValidation_v2', JSON.stringify(this.liveValidation));
        } catch (e) {
            console.warn('⚠️  Failed to save validation state:', e);
        }
    }
    /**
     * 🔥 NEW METHOD: Track prediction automatically
     */
    _trackPrediction(predicted, actual, success) {
        this.liveValidation.predictions.push({
            predicted: predicted,
            actual: actual,
            success: success,
            timestamp: Date.now(),
            predictionNumber: this.liveValidation.predictions.length + 1
        });
        
        const count = this.liveValidation.predictions.length;
        const target = this.liveValidation.targetCount;
        
        // Progress every 10 predictions
        if (count % 10 === 0 || count === target) {
            console.log(`📈 Live Validation: ${count}/${target} (${(count/target*100).toFixed(0)}%)`);
        }
        
        this._saveValidationState();
        
        // Auto-report at 50
        if (count === target) {
            this._generateValidationReport();
        }
    }
    /**
     * 🔥 NEW METHOD: Generate report
     */
    _generateValidationReport() {
        const results = this.liveValidation.predictions;
        const wins = results.filter(r => r.success).length;
        const losses = results.length - wins;
        const accuracy = wins / results.length;
        
        const avgPredicted = results.reduce((sum, r) => sum + r.predicted, 0) / results.length;
        const avgActual = results.reduce((sum, r) => sum + r.actual, 0) / results.length;
        
        // Distribution
        const veryLow = results.filter(r => r.predicted < 1.5).length;
        const low = results.filter(r => r.predicted >= 1.5 && r.predicted < 2.0).length;
        const medium = results.filter(r => r.predicted >= 2.0 && r.predicted < 3.0).length;
        const high = results.filter(r => r.predicted >= 3.0).length;
        
        // ROI
        const totalWagered = results.length;
        const totalWon = results.filter(r => r.success).reduce((sum, r) => sum + r.predicted, 0);
        const netProfit = totalWon - losses;
        const roi = (netProfit / totalWagered) * 100;
        
        console.log('\n' + '='.repeat(70));
        console.log('🎯 LIVE VALIDATION REPORT (50 PREDICTIONS)');
        console.log('='.repeat(70));
        console.log(`\nAccuracy: ${(accuracy * 100).toFixed(1)}% (${wins}W/${losses}L)`);
        console.log(`ROI: ${roi > 0 ? '+' : ''}${roi.toFixed(2)}%`);
        console.log(`Avg Predicted: ${avgPredicted.toFixed(2)}x`);
        console.log(`Distribution: <1.5x=${veryLow}, 1.5-2.0x=${low}, 2.0-3.0x=${medium}, >3.0x=${high}`);
        
        const accPass = accuracy >= 0.65 && accuracy <= 0.75;
        const roiPass = roi >= 50;
        
        console.log(`\n${accPass && roiPass ? '✅ VALIDATION PASSED' : '⚠️  REVIEW NEEDED'}`);
        console.log('='.repeat(70) + '\n');
        
        // Save report
        const report = {
            summary: {
                accuracy: (accuracy * 100).toFixed(1) + '%',
                roi: roi.toFixed(2) + '%',
                wins: wins,
                losses: losses,
                avgPredicted: avgPredicted.toFixed(2) + 'x'
            },
            distribution: { veryLow, low, medium, high },
            timestamp: Date.now()
        };
        
        localStorage.setItem('liveValidation_report_v2', JSON.stringify(report));
        
        // Reset for next cycle
        this._resetValidation();
    }
    /**
     * 🔥 NEW METHOD: Reset validation
     */
    _resetValidation() {
        this.liveValidation = {
            predictions: [],
            startTime: Date.now(),
            targetCount: 50,
            sessionId: Date.now().toString(36)
        };
        this._saveValidationState();
        console.log('🔄 Tracking next 50 predictions...');
    }
    /**
     * 🔥 NEW METHOD: Get status
     */
    getValidationStatus() {
        const count = this.liveValidation.predictions.length;
        const target = this.liveValidation.targetCount;
        
        if (count === 0) {
            return { status: 'Not started', progress: '0/50' };
        }
        
        if (count < target) {
            const wins = this.liveValidation.predictions.filter(p => p.success).length;
            return {
                status: 'In progress',
                progress: `${count}/${target}`,
                currentAccuracy: ((wins/count)*100).toFixed(1) + '%'
            };
        }
        
        return { status: 'Complete', progress: '50/50' };
    }
    /**
     * 🔥 NEW METHOD: View last report
     */
    viewLastReport() {
        try {
            const report = localStorage.getItem('liveValidation_report_v2');
            if (!report) {
                console.log('📊 No reports yet');
                return null;
            }
            
            const data = JSON.parse(report);
            console.log('\n📊 LAST VALIDATION:');
            console.log(`   Accuracy: ${data.summary.accuracy}`);
            console.log(`   ROI: ${data.summary.roi}`);
            console.log(`   Avg Predicted: ${data.summary.avgPredicted}\n`);
            return data;
        } catch (e) {
            console.error('❌ Failed to load:', e);
            return null;
        }
    }
    /**
     * 🔥 NEW METHOD: Manual reset
     */
    resetLiveValidation() {
        console.log('🔄 Resetting validation...');
        this._resetValidation();
    }

    /**
     * 🔥 PASSIVE LEARNING - Called on EVERY round
     */
    learnFromMarketData(multiplier) {
        try {
            this.engine.learnFromMarketData(multiplier);
            
            // Save every 50 rounds to avoid spam
            if (this.engine.rawHistory.length % 50 === 0) {
                this._saveState();
            }
        } catch (error) {
            console.error('❌ Passive Learning Error:', error);
        }
    }

    /**
     * 🎯 ACTIVE PREDICTION - Called when user clicks button
     */
    async predictNext(history) {
        console.log(`DEBUG: Raw history received: ${history.length}`);
        try {
            console.log(`\n🎯 PREDICTION REQUEST`);
            console.log(`   Market data: ${this.engine.rawHistory.length} rounds`);
            console.log(`   History provided: ${history.length} rounds`);
            console.log(`   Current calibration: ${(this.engine.targetQuantile * 100).toFixed(1)}th percentile`);
            
            const result = this.engine.predict(history);
            
            // 🔥 ADD THIS CHECK IMMEDIATELY
            if (result.error) {
                console.warn(`⚠️ Prediction blocked: ${result.message}`);
                return this._transformForUI(result); 
            }
            this.lastPrediction = {
                target: result.predictedValue,
                confidence: result.confidence,
                timestamp: Date.now()
            };
            

            console.log(`✅ Prediction: ${result.predictedValue.toFixed(2)}x @ ${result.confidence.toFixed(1)}% confidence`);
            console.log(`   Action: ${result.action}`);
            console.log(`   Safety Exit: ${result.safetyZone.toFixed(2)}x\n`);
            
            return this._transformForUI(result);
            
        } catch (error) {
            console.error('❌ Prediction Error:', error);
            return {
                error: true,
                message: 'Prediction engine error: ' + error.message,
                confidence: 0,
                predictedValue: 0,
                riskLevel: 'UNKNOWN'
            };
        }
    }

    /**
     * 📊 UPDATE AFTER PREDICTION - Called when predicted round completes
     */
    updateAfterRound(actual, predicted) {
        if (!predicted || !actual) {
            console.warn('⚠️ updateAfterRound called with invalid data:', { actual, predicted });
            return;
        }
        
        const success = actual >= predicted;
        
        console.log(`\n📊 PREDICTION RESULT:`);
        console.log(`   Predicted: ${predicted.toFixed(2)}x`);
        console.log(`   Actual: ${actual.toFixed(2)}x`);
        console.log(`   Result: ${success ? '✅ WIN' : '❌ LOSS'}`);
        
        this.engine.updateAfterPrediction(predicted, actual, success);
        // 🔥 ADD THIS ONE LINE:
        this._trackPrediction(predicted, actual, success);
        
        const stats = this.engine.getStatistics();
        console.log(`   Overall: ${stats.successCount}W / ${stats.failureCount}L = ${stats.winRatePercent}\n`);
        
        this._saveState();
        this.lastPrediction = null;
    }

    _transformForUI(engineResult) {
        if (engineResult.error) {
            return engineResult;
        }

        return {
            predictedValue: engineResult.predictedValue,
            confidence: engineResult.confidence,
            riskLevel: engineResult.riskLevel,
            mostLikely: engineResult.predictedValue,
            predictedRange: engineResult.predictedRange,
            safetyZone: engineResult.safetyZone,
            volatility: engineResult.volatility,
            message: engineResult.message,
            action: engineResult.action,
            reasoning: engineResult.reasoning,
            
            // Context
            marketMedian: engineResult.marketMedian,
            recentMedian: engineResult.recentMedian,
            targetQuantile: engineResult.targetQuantile,
            predictionWinRate: engineResult.predictionWinRate,
            historyAnalyzed: engineResult.historyAnalyzed,
            
            // Phase 1.1 Moon Detection Fields
            postMoonAlert: engineResult.postMoonAlert,
            postMoonWarning: engineResult.postMoonWarning,
            postMoonThreshold: engineResult.postMoonThreshold,

            // Phase 1.2: Streak Boost Fields
            streakBoostActive: engineResult.streakBoostActive,
            streakCount: engineResult.streakCount,
            streakBoostMultiplier: engineResult.streakBoostMultiplier,
            streakReasoning: engineResult.streakReasoning,

            // Phase 2.1: Cycle Detection Fields
            cyclePattern: engineResult.cyclePattern,
            cycleAdjustment: engineResult.cycleAdjustment,
            cycleReasoning: engineResult.cycleReasoning,
            cycleClassification: engineResult.cycleClassification,

            // Phase 2.2: Dynamic Threshold Fields
            dynamicBustThreshold: engineResult.dynamicBustThreshold,
            dynamicMoonThreshold: engineResult.dynamicMoonThreshold,

            // Phase 2.3: ARIMA Blend Fields
            arimaForecast: engineResult.arimaForecast,
            arimaBlendActive: engineResult.arimaBlendActive,

            error: false
        };
    }

    getStatistics() {
        return this.engine.getStatistics();
    }

    resetStats() {
        this.engine.predictionStats = {
            totalPredictions: 0,
            successCount: 0,
            failureCount: 0,
            winRate: 0.50,
            calibrationHistory: []
        };
        this.engine.targetQuantile = 0.40;
        this.engine.rawHistory = [];
        
        localStorage.removeItem('predictionStats_v2');
        localStorage.removeItem('rawHistory_v2');
        localStorage.removeItem('targetQuantile_v2');
        
        console.log('🔄 All stats reset');
    }
}