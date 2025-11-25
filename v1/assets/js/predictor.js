
/**
 * js/predictor.js
 * * This module implements the detailed hybrid statistical and rules-based model
 * * for predicting the next crash multiplier, as defined in the project scope.
 */

export class CrashPredictor {

    constructor() {
        console.log('🔮 CrashPredictor: Initialized. Ready for detailed hybrid analysis.');
    }

    /**
     * Calculates the standard deviation (volatility) of a dataset.
     * @param {number[]} data - Array of multipliers.
     * @returns {number} Standard deviation.
     */
    _calculateVolatility(data) {
        if (data.length === 0) return 0;
        const mean = data.reduce((a, b) => a + b) / data.length;
        const variance = data.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / data.length;
        return Math.sqrt(variance); // Standard Deviation
    }

    /**
     * Analyzes the last 7 rounds for short-term trend and streak information.
     * @param {number[]} history - Array of multipliers (latest first).
     * @returns {Object} Trend analysis data.
     */
    _analyzeShortTermTrend(history) {
        const SHORT_TERM_LENGTH = 7;
        const shortTerm = history.slice(0, SHORT_TERM_LENGTH);
        
        const lowStreakCount = shortTerm.filter(m => m < 2.00).length;
        const avg = shortTerm.reduce((a, b) => a + b, 0) / shortTerm.length;
        
        let trend = 'MEDIUM'; // Default trend
        if (lowStreakCount >= 5) {
            trend = 'LOW_STREAK';
        } else if (shortTerm[0] >= 5.00) {
            trend = 'SPIKE_COOLDOWN';
        } else if (shortTerm.some(m => m >= 10.00)) {
            trend = 'SPIKE_RECOVERY';
        }

        return { trend, lowStreakCount, avg };
    }

    /**
     * Calculates the probability distribution across defined multiplier zones.
     * @param {number[]} history - Array of multipliers.
     * @returns {Object} Probability data.
     */
    _calculateWeightedProbability(history) {
        const total = history.length;
        const counts = { low: 0, medium: 0, high: 0 };
        
        history.forEach(m => {
            if (m < 2.00) counts.low++;
            else if (m < 10.00) counts.medium++;
            else counts.high++;
        });

        // Calculate probabilities
        const probabilities = {
            low: counts.low / total,
            medium: counts.medium / total,
            high: counts.high / total,
        };

        // Calculate average values within the zones for better targeting
        const avgLow = history.filter(m => m >= 1.00 && m < 2.00).reduce((a, b) => a + b, 0) / counts.low || 1.25;
        const avgMedium = history.filter(m => m >= 2.00 && m < 10.00).reduce((a, b) => a + b, 0) / counts.medium || 3.50;

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
            basePrediction = Math.max(2.00, Math.min(3.00, basePrediction * 1.1));
            riskScore += 1;
        }

        // 3. Volatility Impact
        if (volatility > 2.0) {
            basePrediction = Math.min(basePrediction, 3.00);
            riskScore += 3;
        }

        // 4. Safety Constraint (Usually between 1.0 and 4.0, max 10.0)
        basePrediction = Math.min(basePrediction, 10.00); 

        // 5. Final Noise
        const noise = (Math.random() - 0.5) * (volatility * 0.1); 
        const finalPrediction = Math.max(1.01, basePrediction + noise);
        
        return { predictedValue: finalPrediction, riskScore, averageTarget: basePrediction };
    }

    /**
     * Determines final confidence and risk level based on metrics.
     */
    _determineRiskAndConfidence(historyLength, riskScore, volatility) {
        const MAX_LENGTH = 200;
        
        let confidence = 50; 
        confidence += Math.floor((historyLength / MAX_LENGTH) * 30); 
        confidence -= Math.min(riskScore * 5, 20); 
        confidence -= Math.min(volatility * 3, 20); 
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

    /**
     * The main prediction function, designed to be called by an event handler.
     * @param {number[]} history - Array of multipliers (latest first).
     * @returns {Object} Structured prediction result.
     */
    predictNext(history) {
        const MIN_LENGTH = 20;
        const MAX_LENGTH = 200;

        // 1. Input Validation
        if (!history || history.length < MIN_LENGTH) {
            const length = history ? history.length : 0;
            return {
                predictedValue: 0,
                confidence: 0,
                riskLevel: "n/a",
                volatility: 0,
                averageTarget: 0,
                message: `ERROR: Insufficient history (${length} rounds). Minimum ${MIN_LENGTH} required.`,
                error: true
            };
        }

        // Ensure we only analyze up to MAX_LENGTH
        const historyToAnalyze = history.slice(0, MAX_LENGTH);
        const historyLength = historyToAnalyze.length;

        // 2. Core Analysis
        const volatility = this._calculateVolatility(historyToAnalyze);
        const trendData = this._analyzeShortTermTrend(historyToAnalyze);
        const probData = this._calculateWeightedProbability(historyToAnalyze);

        // 3. Generate Prediction
        const { predictedValue, riskScore, averageTarget } = this._generatePrediction(
            historyToAnalyze, 
            trendData, 
            volatility, 
            probData
        );

        // 4. Determine Confidence and Risk
        const { confidence, riskLevel } = this._determineRiskAndConfidence(
            historyLength, 
            riskScore, 
            volatility
        );

        // 5. Build detailed message
        let notes = [];
        if (historyLength < MAX_LENGTH) {
            notes.push(`WARNING: Only ${historyLength} rounds available. Confidence reduced.`);
        }
        if (trendData.trend === 'LOW_STREAK') {
            notes.push('Short-Term: Strong low streak detected. Prediction slightly favors a break.');
        } else if (trendData.trend === 'SPIKE_COOLDOWN') {
            notes.push('Short-Term: Recent spike. High probability of a low payout next.');
        } else {
            notes.push(`Short-Term: Stable trend (${trendData.avg.toFixed(2)}x avg over last 7 rounds).`);
        }
        notes.push(`Volatility: ${volatility.toFixed(2)}x. Low Zone (<2x) Probability: ${(probData.probabilities.low * 100).toFixed(0)}%.`);
        
        // Final Output
        return {
            predictedValue: predictedValue,
            confidence: confidence,
            riskLevel: riskLevel, // 'low', 'medium', 'high'
            volatility: volatility,
            averageTarget: averageTarget,
            // Combine notes into a single message string for the UI
            message: `CONFIDENCE: ${confidence}%. ${notes.join(' ')}`,
            error: false
        };
    }
}

