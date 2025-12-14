/**
 * js/DataStore.js
 * Handles the storage and retrieval of crash game history.
 */

const MOCK_HISTORY_MULTIPLIERS = [
    1.02, 1.45, 1.98, 2.50, 1.01, 1.05, 1.67, 1.11, 3.45, 1.09,
    1.22, 1.04, 1.10, 1.50, 1.06, 1.99, 2.10, 1.01, 1.15, 1.03,
    1.19, 1.02, 1.70, 4.00, 1.01, 1.30, 1.07, 1.55, 1.02, 2.80,
    1.11, 1.03, 1.60, 1.05, 1.25, 1.01, 5.00, 1.02, 1.40, 1.09,
    1.15, 1.06, 1.33, 1.02, 1.10, 1.50, 1.01, 1.20, 1.05, 1.80
];

export class DataStore {
    constructor() {
        this.rounds = [];
        this.currentRound = { multiplier: 0.00 }; 
        this.MAX_ROUNDS = 500; 
        
        console.log(`📦 DataStore: Initialized.`);
    }
    
    loadMockHistory() {
        if (this.rounds.length > 0) return;

        MOCK_HISTORY_MULTIPLIERS.forEach((m, index) => {
            this.rounds.push({
                gameId: `MOCK-${MOCK_HISTORY_MULTIPLIERS.length - index}`,
                finalMultiplier: m,
                verificationStatus: 'Mock'
            });
        });
    }

    setHistory(rounds) {
        if (!Array.isArray(rounds)) {
            console.error('❌ DataStore: setHistory received invalid data');
            return;
        }
        // Keep newest-first, cap to MAX_ROUNDS
        this.rounds = rounds.slice(0, this.MAX_ROUNDS);
        console.log(`📦 DataStore: Loaded ${this.rounds.length} rounds from history.`);
    }

    addRound(roundData) {
        if (!roundData || !roundData.gameId || typeof roundData.finalMultiplier !== 'number') {
            console.error('❌ DataStore: Attempted to add invalid round data.');
            return;
        }
        this.rounds.unshift(roundData); 
        if (this.rounds.length > this.MAX_ROUNDS) this.rounds.pop(); 
    }

    updateRound(gameId, updateData) {
        const index = this.rounds.findIndex(round => round.gameId === gameId);
        if (index !== -1) {
            this.rounds[index] = { ...this.rounds[index], ...updateData };
            return true;
        }
        return false;
    }
    
    updateCurrentMultiplier(multiplier) {
        this.currentRound.multiplier = multiplier;
    }

    /**
     * Return newest-first multipliers (coerced to numbers).
     * count: how many multipliers to return (default 200).
     */
    getMultipliers(count = 200) {
        return this.rounds
                   .slice(0, count)
                   .map(round => Number(round.finalMultiplier) || 0);
    }

    /**
     * Alias explicitly expected by LiveSync:
     * returns the most recent 'count' multipliers (newest-first).
     */
    getRecentMultipliers(count = 10) {
        return this.getMultipliers(count);
    }
}
