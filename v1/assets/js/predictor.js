/**
 * js/predictor.js
 * * This module implements the detailed hybrid statistical and rules-based model
 * * for predicting the next crash multiplier.
 * * UPDATE: Look-Ahead method removed as live data is now available.
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
const BASE_PREDICTION_CAP = 10.00;       // Max value the prediction can reasonably suggest

// =================================================================
// 2. HELPER FUNCTIONS FOR STATISTICAL ANALYSIS
// =================================================================

// Function to calculate the average
function calculateAverage(arr) {
    if (arr.length === 0) return 0;
    return arr.reduce((sum, val) => sum + val, 0) / arr.length;
}

// Function to calculate standard deviation (volatility)
function calculateStandardDeviation(arr, mean) {
    if (arr.length < 2) return 0;
    const variance = arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (arr.length - 1);
    return Math.sqrt(variance);
}

// =================================================================
// 3. CORE PREDICTOR CLASS
// =================================================================

export class CrashPredictor {
    
    /**
     * The primary prediction function. Predicts Round N+1 based on history up to N.
     * @param {number[]} history - An array of past crash multipliers (newest first).
     * @returns {object} - Prediction result object.
     */
    predictNext(history) {
        // --- Input Validation ---
        if (!history || history.length < MIN_ANALYSIS_LENGTH) {
            return { 
                error: true, 
                message: `Insufficient history (${history ? history.length : 0} rounds). Minimum ${MIN_ANALYSIS_LENGTH} required.`,
                confidence: 0
            };
        }

        // --- Data Preparation ---
        // Use only the defined maximum length for analysis
        const analysisHistory = history.slice(0, MAX_ANALYSIS_LENGTH); 
        const latestRound = history[0]; 

        // --- Core Stats ---
        const averageTarget = calculateAverage(analysisHistory);
        const volatility = calculateStandardDeviation(analysisHistory, averageTarget);

        // --- Initial Prediction (Based on average and volatility) ---
        // A simple model: average minus a factor of volatility.
        let predictedValue = averageTarget - (volatility * 0.5); 
        predictedValue = Math.max(1.01, Math.min(predictedValue, BASE_PREDICTION_CAP)); 

        // --- Confidence Calculation ---
        // Confidence increases with history size and decreases with volatility
        let confidence = Math.min(100, (analysisHistory.length / MIN_ANALYSIS_LENGTH) * 30);
        confidence -= volatility * 5; // Penalty for high volatility

        // --- Rules-Based Adjustments (Short-Term Trends) ---
        const shortTermHistory = history.slice(0, SHORT_TERM_LENGTH);
        let lowStreakCount = 0;
        const notes = [];

        for (const crash of shortTermHistory) {
            if (crash < LOW_MULTIPLIER_THRESHOLD) {
                lowStreakCount++;
            }
        }
        
        // Rule 1: Low Streak detected
        if (lowStreakCount >= LOW_STREAK_COUNT_THRESHOLD) {
            // If many low rounds just happened, the probability of a higher round is often increasing
            predictedValue += 0.5; // Bump prediction slightly
            confidence = Math.min(100, confidence + 15); // Increase confidence
            notes.push('Short-Term: Low multiplier streak suggests an impending higher round.');
        }

        // Rule 2: Recent Spike Cooldown
        if (latestRound >= SPIKE_THRESHOLD) {
            // A very high multiplier often leads to a quick regression (low round)
            predictedValue = Math.max(1.01, predictedValue * 0.75); // Lower prediction significantly
            confidence = Math.max(0, confidence - 20); // Decrease confidence
            notes.push('Short-Term: Recent spike cooldown.');
        }

        // --- Final Output Formatting ---
        confidence = Math.max(5, Math.min(95, confidence)); // Clamp confidence between 5% and 95%
        
        const riskLevel = volatility > VOLATILITY_HIGH_THRESHOLD ? 'High' : (volatility > 1.0 ? 'Medium' : 'Low');
        
        return {
            predictedValue: predictedValue,
            confidence: confidence,
            riskLevel: riskLevel,
            volatility: volatility,
            avgMultiplier: averageTarget,
            message: `CONFIDENCE: ${confidence.toFixed(2)}%. ${notes.join(' ')}`,
            error: false
        };
    }
}