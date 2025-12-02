


/**
 * js/LiveSyncing.js
 * This module simulates a real-time crash game feed, emitting events 
 * for live multiplier updates and round completion via the Event Bus.
 */

export class LiveSync {
    // --- ACCEPT EVENT BUS IN CONSTRUCTOR ---
    constructor(dataStore, verifier, eventBus) {
        this.dataStore = dataStore;
        this.verifier = verifier;
        this.eventBus = eventBus; // NEW
        this.isEmulating = true;
        this.ws = null;
        this.currentMultiplier = 1.00;
        this.currentGameId = 0;
        this.isRoundRunning = false;
        console.log("LiveSync: Initialized. isRoundRunning = false.");
    }
    
    /**
     * Initializes the connection to the game feed (simulated here).
     */
    connect() {
        if (this.isEmulating) {
            console.log('🔗 LiveSync: Starting emulation mode...');
            this.startEmulation();
        } else {
            // In a real app, this would be: this.ws = new WebSocket('ws://...')
            console.warn('🔗 LiveSync: Real connection logic not implemented in mock.');
        }
    }

    /**
     * Starts the continuous loop to simulate crash rounds.
     */
    startEmulation() {
        // Start the first round immediately
        setTimeout(() => this.runRoundLoop(), 1000); 
    }

    // Core loop: runs one round, then calls itself to run the next
    runRoundLoop() {
        this.isRoundRunning = true;
        this.currentGameId++;
        this.currentMultiplier = 1.00; // Reset for the new round
        
        // Mock the crash point (random number between 1.01 and 100.00)
        const crashPoint = 0.5 + Math.random() * 20.0;
        const finalCrash = Math.round(crashPoint); // or .toFixed(2) for 2 decimals
        const updateInterval = 50; // Milliseconds per update
        
        const intervalId = setInterval(() => {
            
            // Increment the multiplier
            this.currentMultiplier += 0.01 + Math.random() * 0.01; 
            
            // --- CRITICAL CHANGE: Use eventBus.emit instead of document.dispatchEvent ---
            this.eventBus.emit('liveUpdate', this.currentMultiplier);

            // Check for crash condition
            if (this.currentMultiplier >= finalCrash) {
                
                // Add a small buffer to ensure the final value is displayed
                if (this.currentMultiplier > finalCrash) {
                    this.currentMultiplier = finalCrash;
                }
                
                // --- Round Crash & Completion ---
                clearInterval(intervalId);
                this.isRoundRunning = false;
                
                const roundData = {
                    gameId: this.currentGameId,
                    finalMultiplier: finalCrash,
                    clientSeed: `mock_client_${this.currentGameId}`,
                    nonce: this.currentGameId,
                    verificationStatus: 'Pending'
                };
                
                // 1. Store the round data
                this.dataStore.addRound(roundData);
                
                // 2. Start verification (asynchronous process)
                this.verifier.verify(roundData);
                
                // 3. Notify the application that the round is complete
                // --- CRITICAL CHANGE: Use eventBus.emit instead of document.dispatchEvent ---
                this.eventBus.emit('newRoundCompleted', roundData);
                
                // Start the next round after a short delay
                setTimeout(() => this.runRoundLoop(), 3000);
            }
        }, updateInterval);
    }
}