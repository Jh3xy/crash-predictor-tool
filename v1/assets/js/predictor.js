
/**
 * js/predictor.js
 * * This module is the Crash Predictor. It runs analysis on historical data,
 * * which is required by the main application's event loop.
 *
 * FIX: Implements the runAnalysis() method and accepts the dataStore dependency.
 */

export class CrashPredictor {
    // Must accept dataStore as dependency for historical analysis
    constructor(dataStore) {
        this.dataStore = dataStore;
        // Log to confirm the module loaded correctly
        console.log('CrashPredictor: Initialized. Ready to analyze DataStore.');
    }

    /**
     * Runs a statistical analysis on recent history to determine risk and volatility.
     * This function is required by the 'newRoundCompleted' event listener in main.js.
     * @returns {object} Analysis result.
     */
    runAnalysis() {
        const recentRounds = this.dataStore.getRecentRounds(20); // Analyze 20 rounds
        
        if (recentRounds.length < 5) {
            return {
                message: "Gathering more data for reliable analysis...",
                risk: 'UNKNOWN',
                avg: 0,
                volatility: 0
            };
        }

        const multipliers = recentRounds.map(r => r.finalMultiplier);
        const sum = multipliers.reduce((a, b) => a + b, 0);
        const avgMultiplier = sum / multipliers.length;

        // Calculate Volatility (Standard Deviation Mock)
        const squaredDifferences = multipliers.map(m => (m - avgMultiplier) ** 2);
        const variance = squaredDifferences.reduce((a, b) => a + b, 0) / multipliers.length;
        const volatility = Math.sqrt(variance);

        let riskZone;
        let message;
        if (avgMultiplier < 2.0) {
            riskZone = 'HIGH';
            message = 'Recent average is low. Caution advised.';
        } else if (volatility > 5.0) {
             riskZone = 'EXTREME';
             message = 'Extreme volatility detected! Wide swings in results.';
        } else {
            riskZone = 'MODERATE';
            message = 'Stable average multiplier detected. Standard risk.';
        }
        
        console.log(`CrashPredictor: Analysis complete. Avg: ${avgMultiplier.toFixed(2)}x, Volatility: ${volatility.toFixed(2)}.`);
        
        return {
            message: message,
            risk: riskZone,
            avg: avgMultiplier.toFixed(2),
            volatility: volatility.toFixed(2)
        };
    }
}
