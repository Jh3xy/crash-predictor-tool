

/**
 * js/predictor.js
 * Wrapper for Adaptive Prediction Engine v4.0
 */

import { AdvancedPredictionEngine } from './advanced-prediction-engine.js';

export class CrashPredictor {
    constructor() {
        this.engine = new AdvancedPredictionEngine();
        this.lastPrediction = null;
        this.lastModelPredictions = null; // 🔥 Store for performance tracking
        
        this._loadBayesianState();
        this._loadModelWeights(); // 🔥 Load saved weights
        
        console.log('🎯 CrashPredictor initialized with Adaptive Engine v4.0');
        console.log('📊 Starting Bayesian State:', this.engine.bayesianState);
        console.log('⚖️ Initial Model Weights:', this.engine.modelWeights);
    }

    _loadBayesianState() {
        try {
            const saved = localStorage.getItem('bayesianState');
            if (saved) {
                const state = JSON.parse(saved);
                this.engine.bayesianState = state;
                console.log('✅ Loaded Bayesian state:', state);
            }
        } catch (e) {
            console.warn('⚠️ Failed to load Bayesian state:', e);
        }
    }

    _saveBayesianState() {
        try {
            localStorage.setItem('bayesianState', JSON.stringify(this.engine.bayesianState));
            console.log('💾 Saved Bayesian state');
        } catch (e) {
            console.warn('⚠️ Failed to save Bayesian state:', e);
        }
    }

    // 🔥 NEW: Load/Save Model Weights
    _loadModelWeights() {
        try {
            const saved = localStorage.getItem('modelWeights');
            if (saved) {
                const weights = JSON.parse(saved);
                this.engine.modelWeights = weights;
                console.log('✅ Loaded model weights:', weights);
            }
        } catch (e) {
            console.warn('⚠️ Failed to load model weights:', e);
        }
    }

    _saveModelWeights() {
        try {
            localStorage.setItem('modelWeights', JSON.stringify(this.engine.modelWeights));
            console.log('💾 Saved model weights');
        } catch (e) {
            console.warn('⚠️ Failed to save model weights:', e);
        }
    }

    async predictNext(history) {
        try {
            // Get predictions from all models (before consensus)
            const cleanHistory = this.engine._cleanData(history.slice(0, 500));
            this.engine._updateBustTracker(cleanHistory);
            this.engine._updateEVTState(cleanHistory);
            const features = this.engine._extractMultiTimeframeFeatures(cleanHistory);
            const modelPredictions = this.engine._runPredictionModels(cleanHistory, features);
            
            // Store for later performance tracking
            this.lastModelPredictions = modelPredictions;
            
            // Run full prediction
            const result = this.engine.predict(history);
            
            this.lastPrediction = {
                target: result.predictedValue,
                confidence: result.confidence,
                timestamp: Date.now()
            };
            
            console.log('🎯 Prediction v4.0:', {
                target: result.predictedValue.toFixed(2),
                range: result.predictedRange.map(v => v.toFixed(2)),
                safety: result.safetyZone.toFixed(2),
                confidence: result.confidence.toFixed(1) + '%',
                action: result.action,
                modelWeights: result.modelWeights
            });
            
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
     * 🔥 ENHANCED: Update with model performance tracking
     */
    updateAfterRound(actual, predicted) {
        if (!predicted || !actual) {
            console.warn('⚠️ updateAfterRound called with invalid data:', { actual, predicted });
            return;
        }
        
        const success = actual >= predicted;
        
        console.log('📊 Updating Engine State:', {
            predicted: predicted.toFixed(2),
            actual: actual.toFixed(2),
            success: success,
            beforeWinRate: (this.engine.bayesianState.priorWinRate * 100).toFixed(1) + '%'
        });
        
        // Update Bayesian state
        this.engine.updateBayesianState(predicted, actual, success);
        
        // 🔥 Track individual model performance
        if (this.lastModelPredictions) {
            this.engine.trackModelPerformance(this.lastModelPredictions, actual);
            console.log('📊 Model performance tracked');
        }
        
        console.log('📊 Engine State After Update:', {
            totalPredictions: this.engine.bayesianState.totalPredictions,
            successCount: this.engine.bayesianState.successCount,
            failureCount: this.engine.bayesianState.failureCount,
            winRate: (this.engine.bayesianState.priorWinRate * 100).toFixed(1) + '%',
            modelWeights: this.engine.modelWeights
        });
        
        // Save both states
        this._saveBayesianState();
        this._saveModelWeights(); // 🔥 Save adaptive weights
        
        this.lastPrediction = null;
        this.lastModelPredictions = null;
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
            bustProbability: engineResult.bustProbability,
            volatility: engineResult.volatility,
            avgMultiplier: this._formatAvgMultiplier(engineResult),
            message: this._buildAnalysisMessage(engineResult),
            action: engineResult.action,
            reasoning: engineResult.reasoning,
            kellyBetSize: engineResult.kellyBetSize,
            kellyRecommendation: engineResult.kellyRecommendation,
            modelAgreement: engineResult.modelAgreement,
            currentTrend: engineResult.currentTrend,
            bustAlert: engineResult.bustAlert,
            evtAlert: engineResult.evtAlert,
            bayesianWinRate: engineResult.bayesianWinRate,
            historyAnalyzed: engineResult.historyAnalyzed,
            confidenceInterval: engineResult.confidenceInterval, // 🔥 NEW
            meanReversionSignal: engineResult.meanReversionSignal, // 🔥 NEW
            error: false
        };
    }

    _formatAvgMultiplier(result) {
        const [min, max] = result.predictedRange;
        return `${min.toFixed(2)}-${max.toFixed(2)}x`;
    }

    _buildAnalysisMessage(result) {
        const parts = [];
        parts.push(result.message);
        
        if (result.action !== 'SKIP ROUND' && result.kellyBetSize) {
            parts.push(`Kelly: ${result.kellyBetSize}`);
        }
        
        if (result.bustAlert) {
            parts.push('⚠️ Bust alert');
        }
        if (result.evtAlert) {
            parts.push('📊 EVT alert');
        }
        
        // 🔥 Add mean reversion signal
        if (result.meanReversionSignal && result.meanReversionSignal.signal !== 'weak') {
            parts.push(`Reversion: ${result.meanReversionSignal.direction}`);
        }
        
        return parts.join(' • ');
    }

    getBayesianWinRate() {
        return this.engine.bayesianState.priorWinRate;
    }

    getStatistics() {
        return {
            totalPredictions: this.engine.bayesianState.totalPredictions,
            successCount: this.engine.bayesianState.successCount,
            failureCount: this.engine.bayesianState.failureCount,
            winRate: this.engine.bayesianState.priorWinRate,
            winRatePercent: (this.engine.bayesianState.priorWinRate * 100).toFixed(1) + '%',
            modelWeights: this.engine.modelWeights, // 🔥 Include current weights
            recentAccuracy: this._calculateRecentAccuracy()
        };
    }

    // 🔥 NEW: Calculate accuracy over last N predictions
    _calculateRecentAccuracy() {
        const recent = this.engine.recentPredictions.slice(0, 20);
        if (recent.length === 0) return 0;
        
        const successes = recent.filter(p => p.success).length;
        return (successes / recent.length * 100).toFixed(1) + '%';
    }

    resetBayesianState() {
        this.engine.bayesianState = {
            priorWinRate: 0.50, // 🔥 Reset to neutral 50%
            successCount: 0,
            failureCount: 0,
            totalPredictions: 0
        };
        
        // 🔥 Also reset model weights to equal
        this.engine.modelWeights = {
            bayesian: 0.20,
            statistical: 0.20,
            frequency: 0.20,
            evt: 0.20,
            momentum: 0.20
        };
        
        // Clear performance tracking
        for (const model of Object.keys(this.engine.modelPerformance)) {
            this.engine.modelPerformance[model] = { predictions: [], errors: [] };
        }
        
        this.engine.recentPredictions = [];
        
        this._saveBayesianState();
        this._saveModelWeights();
        console.log('🔄 Engine reset to neutral state');
    }
}
