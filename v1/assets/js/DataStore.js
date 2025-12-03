
/**
 * js/DataStore.js
 * * Handles the storage and retrieval of crash game history.
 * * Now includes mock data loading for initial testing of the CrashPredictor.
 */

// Mock data array: Multipliers for initial testing (latest first)
// This data is used to populate the history when the DataStore initializes.
const MOCK_HISTORY_MULTIPLIERS = [
    1.02, 1.45, 1.98, 2.50, 1.01, 1.05, 1.67, 1.11, 3.45, 1.09,
    1.22, 1.04, 1.10, 1.50, 1.06, 1.99, 2.10, 1.01, 1.15, 1.03,
    1.19, 1.02, 1.70, 4.00, 1.01, 1.30, 1.07, 1.55, 1.02, 2.80,
    1.11, 1.03, 1.60, 1.05, 1.25, 1.01, 5.00, 1.02, 1.40, 1.09,
    1.15, 1.06, 1.33, 1.02, 1.10, 1.50, 1.01, 1.20, 1.05, 1.80,
    // Ensure sufficient data for the 20-round minimum (Total 100 rounds)
    1.08, 1.32, 1.01, 1.03, 2.05, 1.07, 1.14, 1.55, 1.04, 1.09,
    3.00, 1.01, 1.10, 1.30, 1.05, 1.40, 1.02, 1.15, 1.03, 1.75,
    1.01, 1.05, 1.08, 1.40, 1.02, 1.06, 1.12, 1.04, 1.09, 1.01,
    1.07, 1.03, 1.10, 1.05, 1.02, 1.08, 1.04, 1.11, 1.03, 1.06,
];


export class DataStore {
    constructor() {
        // Initialize the central array for all historical rounds
        this.rounds = [];
        this.currentRound = { multiplier: 0.00 }; // Added to track live multiplier for mock sync
        this.MAX_ROUNDS = 500; // Limit to 500 rounds to manage browser memory
        
        // 🔥 REMOVED: this.loadMockHistory(); 
        // We load mock data only when needed for prediction, not on every page load.
        
        // If we want to use the mock data for initial history, we can check localStorage first
        // or just call it here, but let's assume we want a *clean slate* unless we explicitly load.
        
        // If you need the mock data for the initial dashboard prediction minimum:
        if (this.rounds.length < 20) {
             this.loadMockHistory(); 
        }
        
        console.log(`📦 DataStore: Initialized. Loaded ${this.rounds.length} rounds.`);
    }
    
    /**
     * Loads the predefined mock multiplier data into the rounds array.
     * Called ONLY IF the history count is low (for initial prediction minimum).
     */
    loadMockHistory() {
        // 🔥 CHECK: Avoid adding mock data if it's already there (e.g., if called again later)
        if (this.rounds.length > 0 && this.rounds[0].gameId.startsWith('MOCK')) {
            return;
        }

        // Convert mock multiplier numbers into basic round objects
        MOCK_HISTORY_MULTIPLIERS.forEach((m, index) => {
            this.rounds.push({
                gameId: `MOCK-${MOCK_HISTORY_MULTIPLIERS.length - index}`, // Assign a unique mock ID
                finalMultiplier: m,
                // Add default properties expected by UIController
                verificationStatus: 'Verified'
            });
        });
    }

    /**
     * Adds a new round object to the store.
     * @param {Object} roundData - The standardized round object containing game info.
     */
    addRound(roundData) {
        if (!roundData || !roundData.gameId || typeof roundData.finalMultiplier !== 'number') {
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
    }

    /**
     * Finds and updates a specific round by its ID.
     * @param {string} gameId - The ID of the round.
     * @param {Object} updateData - Key/value pairs to update.
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
    
    /**
     * Updates the current live multiplier value.
     * @param {number} multiplier 
     */
    updateCurrentMultiplier(multiplier) {
        this.currentRound.multiplier = multiplier;
    }

    /**
     * Retrieves only the multipliers for analysis, up to a specified count.
     * @param {number} count - The number of multipliers to retrieve (default 200).
     * @returns {number[]} Array of multipliers (latest first).
     */
    getMultipliers(count = 200) {
        return this.rounds
                   .slice(0, count)
                   .map(round => round.finalMultiplier);
    }
}

