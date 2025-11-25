/**
 * LiveSync.js
 * Manages the real-time connection (or mock emulation) to the crash game data.
 * It periodically emits 'liveUpdate' (for UI) and 'newRoundCompleted' (for DataStore/Predictor) events.
 */
export class LiveSync {
    constructor(dataStore) {
        this.dataStore = dataStore;
        this.isEmulating = true; // Start in mock mode
        this.currentMultiplier = 1.00;
        this.gameInterval = null;
        this.tickInterval = null;
        this.gameId = `#${Math.floor(Math.random() * 100000) + 100000}`;
        this.crashPoint = this._generateCrashPoint(); // Start with an initial crash point
    }

    /**
     * Simulates connecting to a real-time feed (or starts mock mode).
     */
    connect() {
        console.log('🔗 LiveSync: Starting Mock Mode Emulation...');
        this._startEmulation();
    }

    /**
     * Starts the game emulation loop.
     */
    _startEmulation() {
        // Game loop: every 15-25 seconds, a round completes and a new one starts.
        this.gameInterval = setInterval(() => {
            this._completeRound();
            this._startNewRound();
        }, 15000 + Math.random() * 10000); // 15s to 25s

        // Tick loop: updates the live multiplier display every 100ms
        this.tickInterval = setInterval(() => {
            this._updateMultiplier();
        }, 100);
    }

    /**
     * Generates and dispatches a 'newRoundCompleted' event.
     */
    _completeRound() {
        // Use the final capped value
        const finalMultiplier = this.currentMultiplier; 

        const completedRound = {
            gameId: this.gameId,
            // Ensure the stored value is a fixed 2-decimal number
            finalMultiplier: parseFloat(finalMultiplier.toFixed(2)),
            timestamp: new Date().toLocaleTimeString(),
            verificationStatus: "Pending" // Real rounds start as pending
        };
        
        // 1. Store the completed round
        this.dataStore.addRound(completedRound);

        // 2. Dispatch event to notify the rest of the application
        document.dispatchEvent(new CustomEvent('newRoundCompleted', {
            detail: completedRound
        }));
    }

    /**
     * Resets for a new round and sets the new crash point.
     */
    _startNewRound() {
        this.currentMultiplier = 1.00;
        this.gameId = `#${Math.floor(Math.random() * 100000) + 100000}`;
        this.crashPoint = this._generateCrashPoint();
        console.log(`New round started. Crash point set to ${this.crashPoint.toFixed(2)}x.`);
    }

    /**
     * Generates an exponential crash point, favoring lower values.
     * @returns {number} The crash point.
     */
    _generateCrashPoint() {
        const random = Math.random();
        // Uses the inverse of the CDF for the exponential distribution
        return 1.00 + (-Math.log(random) * 1.5); 
    }

    /**
     * Increments the multiplier until the crash point is reached.
     */
    _updateMultiplier() {
        if (this.currentMultiplier < this.crashPoint) {
            // A simple growth rate
            this.currentMultiplier += 0.01 + (this.currentMultiplier * 0.005); 
            
            // Dispatch 'liveUpdate' event
            // FIX APPLIED HERE: Sending ONLY the multiplier value as the detail
            document.dispatchEvent(new CustomEvent('liveUpdate', {
                detail: this.currentMultiplier
            }));
        } else if (this.currentMultiplier >= this.crashPoint) {
            // Cap the multiplier at the final crash point
            this.currentMultiplier = this.crashPoint;

            // Dispatch 'liveUpdate' event for the final value
            // FIX APPLIED HERE: Sending ONLY the multiplier value as the detail
            document.dispatchEvent(new CustomEvent('liveUpdate', {
                detail: this.currentMultiplier
            }));
        }
    }
    
    // Add a placeholder to satisfy the overall application architecture
    stopEmulation() {
        console.log('Emulation stopping (N/A in mock mode)');
    }
}