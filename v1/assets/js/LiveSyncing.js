


// /**
//  * js/LiveSyncing.js
//  * This module simulates a real-time crash game feed, emitting events 
//  * for live multiplier updates and round completion via the Event Bus.
//  */

// export class LiveSync {
//     // --- ACCEPT EVENT BUS IN CONSTRUCTOR ---
//     constructor(dataStore, verifier, eventBus) {
//         this.dataStore = dataStore;
//         this.verifier = verifier;
//         this.eventBus = eventBus; // NEW
//         this.isEmulating = true;
//         this.ws = null;
//         this.currentMultiplier = 1.00;
//         this.currentGameId = 0;
//         this.isRoundRunning = false;
//         console.log("LiveSync: Initialized. isRoundRunning = false.");
//     }
    
//     /**
//      * Initializes the connection to the game feed (simulated here).
//      */
//     connect() {
//         if (this.isEmulating) {
//             console.log('🔗 LiveSync: Starting emulation mode...');
//             this.startEmulation();
//         } else {
//             // In a real app, this would be: this.ws = new WebSocket('ws://...')
//             console.warn('🔗 LiveSync: Real connection logic not implemented in mock.');
//         }
//     }

//     /**
//      * Starts the continuous loop to simulate crash rounds.
//      */
//     startEmulation() {
//         // Start the first round immediately
//         setTimeout(() => this.runRoundLoop(), 1000); 
//     }

//     // Core loop: runs one round, then calls itself to run the next
//     runRoundLoop() {
//         this.isRoundRunning = true;
//         this.currentGameId++;
//         this.currentMultiplier = 1.00; // Reset for the new round
        
//         // Mock the crash point (random number between 1.01 and 100.00)
//         const crashPoint = 0.5 + Math.random() * 20.0;
//         const finalCrash = Math.round(crashPoint); // or .toFixed(2) for 2 decimals
//         const updateInterval = 50; // Milliseconds per update
        
//         const intervalId = setInterval(() => {
            
//             // Increment the multiplier
//             this.currentMultiplier += 0.01 + Math.random() * 0.01; 
            
//             // --- CRITICAL CHANGE: Use eventBus.emit instead of document.dispatchEvent ---
//             this.eventBus.emit('liveUpdate', this.currentMultiplier);

//             // Check for crash condition
//             if (this.currentMultiplier >= finalCrash) {
                
//                 // Add a small buffer to ensure the final value is displayed
//                 if (this.currentMultiplier > finalCrash) {
//                     this.currentMultiplier = finalCrash;
//                 }
                
//                 // --- Round Crash & Completion ---
//                 clearInterval(intervalId);
//                 this.isRoundRunning = false;
                
//                 const roundData = {
//                     gameId: this.currentGameId,
//                     finalMultiplier: finalCrash,
//                     clientSeed: `mock_client_${this.currentGameId}`,
//                     nonce: this.currentGameId,
//                     verificationStatus: 'Pending'
//                 };
                
//                 // 1. Store the round data
//                 this.dataStore.addRound(roundData);
                
//                 // 2. Start verification (asynchronous process)
//                 this.verifier.verify(roundData);
                
//                 // 3. Notify the application that the round is complete
//                 // --- CRITICAL CHANGE: Use eventBus.emit instead of document.dispatchEvent ---
//                 this.eventBus.emit('newRoundCompleted', roundData);
                
//                 // Start the next round after a short delay
//                 setTimeout(() => this.runRoundLoop(), 3000);
//             }
//         }, updateInterval);
//     }
// }




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
        // Updated to use the 1-100 logic we discussed, or roughly that range
        const crashPoint = 1.00 + Math.random() * 20.00;
        const finalCrash = parseFloat(crashPoint.toFixed(2)); 
        const updateInterval = 50; // Milliseconds per update
        
        const intervalId = setInterval(() => {
            
            // Increment the multiplier
            this.currentMultiplier += 0.01 + Math.random() * 0.05; // Slightly faster growth for higher numbers
            
            // --- CRITICAL CHANGE: Use eventBus.emit instead of document.dispatchEvent ---
            this.eventBus.emit('liveUpdate', this.currentMultiplier);

            // 🔥 NEW: Update the Modal Live Display if it is open
            this.updateModalLiveValue();

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
                
                // 🔥 NEW: Update the Modal History Grid if it is open
                this.updateModalHistory();
                
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

    // --- NEW MODAL HELPER FUNCTIONS ---

    /**
     * Updates the large multiplier text inside the Live Sync modal.
     * Only runs if the modal is currently open (element exists).
     */
    updateModalLiveValue() {
        const modalMultiplierEl = document.getElementById('live-sync-current-multiplier');
        if (modalMultiplierEl) {
            modalMultiplierEl.textContent = this.currentMultiplier.toFixed(2) + 'x';
            
            // Optional: Change color based on value logic
            if (this.currentMultiplier >= 10) modalMultiplierEl.style.color = 'var(--color-accent-primary)';
            else if (this.currentMultiplier >= 2) modalMultiplierEl.style.color = 'var(--color-status-success)';
            else modalMultiplierEl.style.color = 'var(--text-primary)';
        }
    }

    // ... inside LiveSync class in LiveSyncing.js ...

    /**
     * Updates the history grid inside the Live Sync modal with the last 20 results.
     * Only runs if the modal is currently open.
     */
    updateModalHistory() {
        const container = document.getElementById('live-sync-history-container');
        if (!container) return; // Modal not open, stop here.

        // 1. Fetch Data
        // Get all history, take the last 20, and reverse so the NEWEST is first (top-left)
        const allMultipliers = this.dataStore.getMultipliers();
        const history = allMultipliers.slice(-20).reverse();

        // 2. Clear current list safely
        container.innerHTML = ''; 

        // 3. Handle Empty State
        if (history.length === 0) {
            container.innerHTML = '<p class="text-secondary" style="grid-column: 1/-1; text-align: center;">Waiting for round data...</p>';
            return;
        }

        // 4. Generate Badges
        history.forEach(value => {
            const badge = document.createElement('div');
            // Use the helper to get the class (m-high, m-medium, m-low)
            badge.className = `history-badge ${this.getBadgeClass(value)}`;
            badge.textContent = value.toFixed(2) + 'x';
            container.appendChild(badge);
        });
    }

    /**
     * Helper to determine color class for the modal history badges
     */
    getBadgeClass(value) {
        if (value >= 10.0) return 'm-high'; // Gold/Purple
        if (value >= 2.0) return 'm-medium'; // Green
        return 'm-low'; // Blue/Gray
    }
}