

/**
 * js/predictor.js
 * * This module implements the detailed hybrid statistical and rules-based model
 * * for predicting the next crash multiplier.
 * * UPDATE: Now includes 'predictLookAhead' for simulating future rounds.
 */

// =================================================================
// 1. GLOBAL CONSTANTS FOR TUNING THE PREDICTION MODEL
// =================================================================

// --- Data Constraints ---
const MIN_ANALYSIS_LENGTH = 20;     // Minimum history rounds required for prediction
const MAX_ANALYSIS_LENGTH = 200;    // Maximum history rounds used for analysis

// --- Multiplier Thresholds ---
const LOW_MULTIPLIER_THRESHOLD = 2.00;   // Crash < 2.0x is considered 'Low'
const MEDIUM_MULTIPLIER_THRESHOLD = 10.00; // Crash < 10.0x is considered 'Medium'

// --- Short-Term Trend Rules ---
const SHORT_TERM_LENGTH = 7;             // Number of rounds for short-term trend analysis
const LOW_STREAK_COUNT_THRESHOLD = 5;    // Number of low rounds (<2.0x) needed to flag a low streak
const SPIKE_THRESHOLD = 5.00;            // Multiplier value that triggers a 'spike cooldown' trend

// --- Prediction Generation Weights ---
const VOLATILITY_HIGH_THRESHOLD = 2.0;   // Volatility > 2.0 is considered high risk
const BASE_PREDICTION_CAP = 10.00;       // Max value the prediction can reach
const VOLATILITY_IMPACT_MULTIPLIER = 0.1; // Factor for adding noise based on volatility

// --- Confidence & Risk Scoring Weights ---
const MAX_HISTORY_CONFIDENCE_GAIN = 30; // Max confidence gain from history length (out of 100)
const HISTORY_LENGTH_WEIGHT = MAX_HISTORY_CONFIDENCE_GAIN / MAX_ANALYSIS_LENGTH; // 0.15
const MAX_RISK_SCORE_PENALTY = 20;      // Max confidence penalty from risk score
const RISK_SCORE_WEIGHT = 5;             // Penalty per risk point (capped at MAX_RISK_SCORE_PENALTY)
const MAX_VOLATILITY_PENALTY = 20;       // Max confidence penalty from volatility
const VOLATILITY_WEIGHT = 3;             // Penalty per volatility point (capped at MAX_VOLATILITY_PENALTY)


export class CrashPredictor {

    constructor() {
        console.log('🔮 CrashPredictor: Initialized. Ready for hybrid look-ahead analysis.');
    }

    // =================================================================
    // 2. HELPER FUNCTIONS
    // =================================================================

    /**
     * Calculates the standard deviation (volatility) of a dataset.
     */
    _calculateVolatility(data) {
        if (data.length === 0) return 0;
        const mean = data.reduce((a, b) => a + b) / data.length;
        const variance = data.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / data.length; 
        return Math.sqrt(variance); 
    }

    /**
     * Analyzes the last 7 rounds for short-term trend and streak information.
     */
    _analyzeShortTermTrend(history) {
        const shortTerm = history.slice(0, SHORT_TERM_LENGTH);
        const lowStreakCount = shortTerm.filter(m => m < LOW_MULTIPLIER_THRESHOLD).length;
        const avg = shortTerm.reduce((a, b) => a + b, 0) / shortTerm.length;
        
        let trend = 'MEDIUM'; 
        if (lowStreakCount >= LOW_STREAK_COUNT_THRESHOLD) {
            trend = 'LOW_STREAK';
        } else if (shortTerm[0] >= SPIKE_THRESHOLD) { 
            trend = 'SPIKE_COOLDOWN';
        } else if (shortTerm.some(m => m >= MEDIUM_MULTIPLIER_THRESHOLD)) {
            trend = 'SPIKE_RECOVERY';
        }

        return { trend, lowStreakCount, avg };
    }

    /**
     * Calculates the probability distribution across defined multiplier zones.
     */
    _calculateWeightedProbability(history) {
        const total = history.length;
        const counts = { low: 0, medium: 0, high: 0 };
        
        history.forEach(m => {
            if (m < LOW_MULTIPLIER_THRESHOLD) counts.low++;
            else if (m < MEDIUM_MULTIPLIER_THRESHOLD) counts.medium++;
            else counts.high++;
        });

        const probabilities = {
            low: counts.low / total,
            medium: counts.medium / total,
            high: counts.high / total,
        };

        const avgLow = history.filter(m => m >= 1.00 && m < LOW_MULTIPLIER_THRESHOLD).reduce((a, b) => a + b, 0) / counts.low || 1.25;
        const avgMedium = history.filter(m => m >= LOW_MULTIPLIER_THRESHOLD && m < MEDIUM_MULTIPLIER_THRESHOLD).reduce((a, b) => a + b, 0) / counts.medium || 3.50;

        return { probabilities, avgLow, avgMedium };
    }
    
    /**
     * Generates the final prediction based on combined statistical analysis.
     */
    _generatePrediction(history, trendData, volatility, probData) {
        const { probabilities, avgLow, avgMedium } = probData;
        let basePrediction = 1.00;
        let riskScore = 0; 
        
        // 1. Initial Base based on overall probability
        if (probabilities.medium > 0.35 && probabilities.medium > probabilities.low) {
            basePrediction = avgMedium * 0.7; 
        } else {
            basePrediction = avgLow * 1.5; 
        }

        // 2. Adjustments based on Short-Term Trend
        if (trendData.trend === 'LOW_STREAK') {
            basePrediction = Math.max(basePrediction, 1.90 + (Math.random() * 0.5)); 
            riskScore += 2; 
        } else if (trendData.trend === 'SPIKE_COOLDOWN') {
            basePrediction = Math.min(basePrediction, 1.40);
            riskScore -= 1; 
        } else if (trendData.trend === 'SPIKE_RECOVERY') {
            basePrediction = Math.max(LOW_MULTIPLIER_THRESHOLD, Math.min(3.00, basePrediction * 1.1));
            riskScore += 1;
        }

        // 3. Volatility Impact
        if (volatility > VOLATILITY_HIGH_THRESHOLD) {
            basePrediction = Math.min(basePrediction, 3.00);
            riskScore += 3;
        }

        // 4. Safety Constraint 
        basePrediction = Math.min(basePrediction, BASE_PREDICTION_CAP); 

        // 5. Final Noise
        const noise = (Math.random() - 0.5) * (volatility * VOLATILITY_IMPACT_MULTIPLIER); 
        const finalPrediction = Math.max(1.01, basePrediction + noise);
        
        return { predictedValue: finalPrediction, riskScore, averageTarget: basePrediction };
    }

    /**
     * Determines final confidence and risk level based on metrics.
     */
    _determineRiskAndConfidence(historyLength, riskScore, volatility) {
        let confidence = 50; 
        
        confidence += Math.floor(historyLength * HISTORY_LENGTH_WEIGHT); 
        confidence = Math.min(confidence, 50 + MAX_HISTORY_CONFIDENCE_GAIN); // Cap the length gain
        confidence -= Math.min(riskScore * RISK_SCORE_WEIGHT, MAX_RISK_SCORE_PENALTY); 
        confidence -= Math.min(volatility * VOLATILITY_WEIGHT, MAX_VOLATILITY_PENALTY); 
        
        confidence = Math.min(99, Math.max(10, confidence)); 

        let riskLevel;
        if (riskScore >= 4) {
            riskLevel = 'HIGH';
        } else if (riskScore >= 2) {
            riskLevel = 'MEDIUM';
        } else {
            riskLevel = 'LOW';
        }

        return { confidence, riskLevel: riskLevel.toLowerCase() };
    }

    // =================================================================
    // 3. MAIN PREDICTION FUNCTIONS
    // =================================================================

    /**
     * Standard Single-Step Prediction.
     */
    predictNext(history) {
        if (!history || history.length < MIN_ANALYSIS_LENGTH) {
            const length = history ? history.length : 0;
            return {
                predictedValue: 0,
                confidence: 0,
                riskLevel: "n/a",
                volatility: 0,
                avgMultiplier: 0,
                message: `ERROR: Insufficient history (${length} rounds). Minimum ${MIN_ANALYSIS_LENGTH} required.`,
                error: true
            };
        }

        const historyToAnalyze = history.slice(0, MAX_ANALYSIS_LENGTH);
        const historyLength = historyToAnalyze.length;

        // Core Analysis
        const volatility = this._calculateVolatility(historyToAnalyze);
        const trendData = this._analyzeShortTermTrend(historyToAnalyze);
        const probData = this._calculateWeightedProbability(historyToAnalyze);

        // Generate Prediction
        const { predictedValue, riskScore, averageTarget } = this._generatePrediction(
            historyToAnalyze, trendData, volatility, probData
        );

        // Determine Confidence and Risk
        const { confidence, riskLevel } = this._determineRiskAndConfidence(
            historyLength, riskScore, volatility
        );

        let notes = [];
        if (trendData.trend === 'LOW_STREAK') notes.push('Short-Term: Strong low streak.');
        else if (trendData.trend === 'SPIKE_COOLDOWN') notes.push('Short-Term: Recent spike cooldown.');
        
        return {
            predictedValue: predictedValue,
            confidence: confidence,
            riskLevel: riskLevel,
            volatility: volatility,
            avgMultiplier: averageTarget,
            message: `CONFIDENCE: ${confidence}%. ${notes.join(' ')}`,
            error: false
        };
    }

    /**
     * 🔥 NEW: Look-Ahead Prediction (Predict Round N+2)
     * This method satisfies the requirement to predict Round 8 while Round 6 just finished.
     * 1. Predicts the immediate next round (Round 7).
     * 2. Adds that prediction to a temporary history.
     * 3. Predicts the round AFTER that (Round 8).
     */
    predictLookAhead(history) {
        // Step 1: Predict N+1 (e.g., Round 7)
        const prediction1 = this.predictNext(history);
        
        if (prediction1.error) {
            return prediction1; // Return error if history is too short
        }

        // Step 2: Create a temporary history array assuming Prediction 1 happens
        // We put the predicted value at the start (index 0) of the new array
        const tempHistory = [prediction1.predictedValue, ...history];

        // Step 3: Predict N+2 (e.g., Round 8)
        const prediction2 = this.predictNext(tempHistory);
        
        // Tag this result so the UI knows it's a look-ahead
        prediction2.isLookAhead = true;
        
        return prediction2;
    }
}
