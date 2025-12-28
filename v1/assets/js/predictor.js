/**
 * js/predictor.js
 * Wrapper for Quantile-Based Prediction Engine
 */

import { QuantilePredictionEngine } from './quantile-prediction-engine.js';

export class CrashPredictor {
    constructor() {
        this.engine = new QuantilePredictionEngine();
        this.lastPrediction = null;
        
        this._loadState();
        
        console.log('🎯 CrashPredictor initialized with Quantile Engine');
        console.log('📊 Stats:', this.engine.getStatistics());
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