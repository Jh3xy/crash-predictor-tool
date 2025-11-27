
/**
 * js/LiveSyncing.js
 * This module simulates a real-time crash game feed, emitting events 
 * for live multiplier updates and round completion.
 * It also handles the connection status (mock/real).
 */

export class LiveSync {
    constructor(dataStore, verifier) {
        this.dataStore = dataStore;
        this.verifier = verifier;
        this.isEmulating = true;
        this.ws = null;
        this.currentMultiplier = 1.00;
        this.currentGameId = 0;
        
        // STATE TRACKER: Tracks if the multiplier is actively counting up
        this.isRoundRunning = false;
        console.log("LiveSync: Initialized. isRoundRunning = false.");
    }

    // Placeholder for real connection logic (omitted for emulation)
    connect() {
        console.log("LiveSync: Attempting connection...");
        // Fallback to emulation immediately for consistency
        this.startEmulation();
    }

    // Starts the mock game loop
    startEmulation() {
        if (!this.isEmulating) return;

        console.log("LiveSync: Starting mock game emulation.");
        
        // Start the first round loop after a short delay
        console.log("LiveSync: Initial 2s delay before first round starts...");
        setTimeout(() => this.runRoundLoop(), 2000); 
    }

    // Core loop: runs one round, then calls itself to run the next
    runRoundLoop() {
        // Generate a new, unique game ID
        this.currentGameId = Date.now();
        this.currentMultiplier = 1.00;
        
        // 1. Set the new round as RUNNING (CRITICAL STATE CHANGE)
        this.isRoundRunning = true; 
        console.log(`LiveSync: Round ${this.currentGameId} ACTIVATED. isRoundRunning = TRUE.`);
        
        // Generate a realistic crash point (1.00 to 10.00, skewed low)
        const randomValue = Math.random(); 
        let crashPoint;
        if (randomValue < 0.7) { 
            crashPoint = 1.00 + Math.pow(randomValue, 2) * 4; // Skew low (1.00 to ~2.00)
        } else if (randomValue < 0.95) {
            crashPoint = 2.00 + Math.pow(randomValue - 0.7, 2) * 50; // Skew medium (2.00 to ~5.00)
        } else {
            crashPoint = 5.00 + Math.random() * 5; // Higher (5.00 to 10.00)
        }
        
        const finalCrash = parseFloat(crashPoint.toFixed(2));
        
        const updateInterval = 50; // Milliseconds per update
        let loopCount = 0;

        const intervalId = setInterval(() => {
            
            // Increment the multiplier
            this.currentMultiplier += 0.01 + Math.random() * 0.01; 
            
            // Dispatch the live update event
            document.dispatchEvent(new CustomEvent('liveUpdate', { detail: this.currentMultiplier }));

            // Check for crash condition
            if (this.currentMultiplier >= finalCrash) {
                
                // --- CRITICAL FIX START: Prevent Race Condition ---
                // If isRoundRunning is already false, it means a previous queued tick 
                // has already processed the crash, and we must exit immediately.
                if (!this.isRoundRunning) {
                     return; 
                }
                
                // Immediately flag the round as stopped to prevent any other queued interval ticks from processing it.
                this.isRoundRunning = false; 
                // --- CRITICAL FIX END ---
                
                
                // --- Round Crash & Completion ---
                clearInterval(intervalId);
                
                console.log(`LiveSync: Round ${this.currentGameId} CRASHED at ${finalCrash}x. isRoundRunning = FALSE.`);

                const roundData = {
                    gameId: this.currentGameId,
                    finalMultiplier: finalCrash,
                    // Verification data will be added by the Verifier module
                    verificationStatus: 'Pending', 
                    clientSeed: 'mock-client',
                    serverSeed: 'mock-server',
                    nonce: 1000 + this.currentGameId % 1000
                };
                
                // 1. Store the new round data
                this.dataStore.addRound(roundData);
                
                // 2. Run verification (asynchronously)
                this.verifier.verify(roundData); 

                // 3. Notify the application that the round is complete
                document.dispatchEvent(new CustomEvent('newRoundCompleted', { detail: roundData }));
                
                // Log and prepare for the next round
                console.log(`LiveSync: Waiting for next round (3s delay) during which isRoundRunning is FALSE.`);
                
                // Wait for a few seconds before starting the next round
                setTimeout(() => this.runRoundLoop(), 3000);
            }
        }, updateInterval);
    }
}

