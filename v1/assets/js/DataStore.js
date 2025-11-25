
export class DataStore {
    constructor() {
        // Initialize the central array for all historical rounds
        this.rounds = [];
        this.MAX_ROUNDS = 500; // Limit to 500 rounds to manage browser memory
        console.log('📦 DataStore: Initialized.');
    }

    /**
     * Adds a new round object to the store.
     * @param {Object} roundData - The standardized round object containing game info.
     */
    addRound(roundData) {
        if (!roundData || !roundData.gameId) {
            console.error('❌ DataStore: Attempted to add invalid round data.');
            return;
        }
        
        // Add the new round to the beginning of the array (most recent first)
        this.rounds.unshift(roundData); 
        
        // Truncate the array if it exceeds the maximum size
        if (this.rounds.length > this.MAX_ROUNDS) {
            this.rounds.pop(); // Remove the oldest round
            console.log(`🧹 DataStore: Trimmed oldest round to maintain MAX_ROUNDS limit (${this.MAX_ROUNDS}).`);
        }
        
        console.log(`✅ DataStore: Stored Round ID ${roundData.gameId}. Multiplier: ${roundData.finalMultiplier}x. Total rounds: ${this.rounds.length}`);
    }

    /**
     * Retrieves a specified number of the most recent rounds.
     * @param {number} count - The number of rounds to retrieve (default 100).
     * @returns {Array} An array of round objects.
     */
    getRecentRounds(count = 100) {
        return this.rounds.slice(0, count);
    }
    
    /**
     * Finds and updates a specific round by its ID (Crucial for BC.Game's delayed seed reveal).
     * @param {string} gameId - The ID of the round.
     * @param {Object} updateData - Key/value pairs to update (e.g., { revealedServerSeed: 'newSeed', isVerified: true }).
     */
    updateRound(gameId, updateData) {
        const index = this.rounds.findIndex(round => round.gameId === gameId);
        if (index !== -1) {
            this.rounds[index] = { ...this.rounds[index], ...updateData };
            console.log(`🔄 DataStore: Updated Round ID ${gameId}. Keys updated: ${Object.keys(updateData).join(', ')}`);
            return true;
        }
        return false;
    }

    // Future-proofing: Retrieves only the multipliers for analysis
    getMultipliers(count) {
        return this.getRecentRounds(count).map(round => round.finalMultiplier);
    }
}

