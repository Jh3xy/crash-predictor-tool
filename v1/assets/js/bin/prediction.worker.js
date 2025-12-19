
/**
 * js/prediction.worker.js
 * The "Prophecy Engine" Background Worker.
 * Handles KNN Pattern Matching, Markov Chains, and Monte Carlo Simulations.
 */

self.onmessage = function(e) {
    const { history, currentMultiplier } = e.data;
    
    // 1. RUN ENGINE A: KNN PATTERN RECOGNITION
    const knnResult = runKNN(history);
    
    // 2. RUN ENGINE B: MARKOV CHAINS (Trend Analysis)
    const markovResult = runMarkov(history);
    
    // 3. RUN ENGINE C: SAFETY & CONSENSUS
    const finalPrediction = calculateConsensus(knnResult, markovResult, history[0]);

    // Send the "Prophecy" back to the main thread
    self.postMessage(finalPrediction);
};

// --- ENGINE A: K-NEAREST NEIGHBORS (Pattern Matching) ---
function runKNN(history) {
    // We look for patterns of length 4 (last 4 rounds)
    const PATTERN_SIZE = 4;
    const currentPattern = history.slice(0, PATTERN_SIZE);
    
    let matches = [];
    
    // Scan history (skipping the immediate overlapping past)
    for (let i = PATTERN_SIZE; i < history.length - 1; i++) {
        const pastSlice = history.slice(i, i + PATTERN_SIZE);
        
        // Calculate Euclidean Distance (Similarity Score)
        // Lower distance = Higher similarity
        const distance = euclideanDistance(currentPattern, pastSlice);
        
        // Threshold: Only accept "good" matches (Distance < 2.0 is a tight match)
        if (distance < 2.5) {
            matches.push({
                outcome: history[i - 1], // What happened AFTER this pattern?
                similarity: distance
            });
        }
    }
    
    // Sort by best match (lowest distance)
    matches.sort((a, b) => a.similarity - b.similarity);
    
    // Take top 15 matches
    return matches.slice(0, 15);
}

function euclideanDistance(a, b) {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
        sum += Math.pow(a[i] - b[i], 2);
    }
    return Math.sqrt(sum);
}

// --- ENGINE B: MARKOV CHAIN (State Probabilities) ---
function runMarkov(history) {
    // Define States: LOW (<2x), MED (2x-10x), HIGH (>10x)
    let lowCount = 0;
    let transitionToLow = 0;
    
    // Analyze the last 100 rounds for "Recent Trend"
    const recentHistory = history.slice(0, 100);
    
    for (let i = 1; i < recentHistory.length; i++) {
        const prev = recentHistory[i];
        const curr = recentHistory[i - 1]; // Newest is 0, so i-1 follows i
        
        if (prev < 2.0) {
            lowCount++;
            if (curr < 2.0) transitionToLow++;
        }
    }
    
    const probLowAfterLow = lowCount > 0 ? (transitionToLow / lowCount) : 0.5;
    
    // Return the probability that the NEXT round is Low
    return { probLow: probLowAfterLow };
}

// --- ENGINE C: CONSENSUS & SAFETY ---
function calculateConsensus(knnMatches, markov, lastCrash) {
    // Default safe fallback if no patterns found
    if (knnMatches.length === 0) {
        return {
            predictedValue: 1.10,
            safetyExit: 1.05,
            bustProbability: 90,
            confidence: 10,
            riskLevel: 'HIGH',
            message: "No historical patterns found. Market unpredictable."
        };
    }

    // 1. Calculate Weighted Average from KNN Matches
    // We weight better matches (lower similarity score) higher
    let weightedSum = 0;
    let totalWeight = 0;
    
    knnMatches.forEach(m => {
        const weight = 1 / (m.similarity + 0.1); // Avoid divide by zero
        weightedSum += m.outcome * weight;
        totalWeight += weight;
    });
    
    let rawPrediction = weightedSum / totalWeight;
    
    // 2. Adjust based on Markov (Trend)
    // If Markov says 80% chance of LOW, we pull the prediction down
    if (markov.probLow > 0.7) {
        rawPrediction = rawPrediction * 0.8; // Dampen prediction
    }

    // 3. Calculate "Bust Probability" (Chance of crash < 1.20x)
    const busts = knnMatches.filter(m => m.outcome < 1.20).length;
    const bustProbability = (busts / knnMatches.length) * 100;
    
    // 4. Determine Safety Exit (The "God Mode" value)
    // We target the 30th percentile of matched outcomes for safety
    const outcomes = knnMatches.map(m => m.outcome).sort((a, b) => a - b);
    const safetyIndex = Math.floor(outcomes.length * 0.3);
    let safetyExit = outcomes[safetyIndex] * 0.95; // 5% buffer
    if (safetyExit < 1.01) safetyExit = 1.01;

    // 5. Final Message Logic
    let risk = 'MEDIUM';
    if (bustProbability > 50) risk = 'HIGH';
    if (bustProbability < 20) risk = 'LOW';
    
    return {
        predictedValue: Math.max(1.01, rawPrediction),
        safetyExit: Math.max(1.01, safetyExit),
        bustProbability: bustProbability,
        confidence: Math.min(98, (knnMatches.length / 15) * 100), // Confidence based on pattern density
        riskLevel: risk,
        matchCount: knnMatches.length,
        avgMultiplier: rawPrediction, // Mapping for existing UI
        volatility: 0, // Placeholder
        message: `Found ${knnMatches.length} similar historical patterns.`
    };
}
