// /**
//  * js/LiveSyncing.js
//  * Pivot: Fetches public historical data and emulates a live feed of COMPLETED rounds.
//  * This bypasses the WebSocket 401 security block.
//  */

// export class LiveSync {
//     constructor(dataStore, verifier, eventBus) {
//         this.dataStore = dataStore;
//         this.verifier = verifier;
//         this.eventBus = eventBus;
//         this.currentGameId = 0; // Tracks the ID of the round that JUST finished
        
//         // We keep isRoundRunning for compatibility, though we don't have live ticks anymore
//         this.isRoundRunning = false; 
        
//         console.log("LiveSync: Initialized in Historical Fetch Mode.");
//     }
    
//     /**
//      * Entry point: Fetches history instead of connecting to a socket.
//      */
//     connect() {
//         console.log('🔗 LiveSync: Starting Historical Data Fetch...');
//         this.fetchHistory();
//     }

//     /**
//      * Fetches the last 500 rounds from the public BC.Game API.
//      */
//     async fetchHistory() {
//         // Public endpoint, no API key needed
//         const HISTORY_URL = 'https://bc.game/api/game/crash/list?limit=500'; 
        
//         try {
//             console.log('⌛ Fetching historical crash results...');
//             const response = await fetch(HISTORY_URL);
            
//             if (!response.ok) {
//                 throw new Error(`HTTP error! status: ${response.status}`);
//             }

//             const json = await response.json();
//             // The API response usually puts the array under 'data'
//             const rounds = json.data || json; 
            
//             if (!Array.isArray(rounds)) {
//                 throw new Error('Fetched data format is incorrect (not an array).');
//             }
            
//             console.log(`✅ Successfully fetched ${rounds.length} historical rounds.`);
            
//             // Start feeding these rounds into the app
//             this.startHistoryEmulation(rounds);

//         } catch (error) {
//             console.error('💥 LiveSync Fetch Error:', error.message);
//             // Fallback: If fetch fails, we use local mock emulation so the app still works
//             this.startLocalMockEmulation();
//         }
//     }
    
//     /**
//      * Feeds historical data into the system one by one.
//      */
//     startHistoryEmulation(rounds) {
//         // The API returns newest first. We reverse it to play them in chronological order.
//         const chronologicRounds = rounds.reverse(); 
//         let index = 0;
        
//         // Feed a new round every 5 seconds
//         const FEED_RATE_MS = 5000; 

//         const intervalId = setInterval(() => {
//             if (index >= chronologicRounds.length) {
//                 console.log('🏁 History stream complete. Restarting...');
//                 index = 0; // Loop forever for continuous testing
//             }

//             const roundData = chronologicRounds[index];
            
//             // Normalize the data structure
//             // API usually gives: { gameId: "123", crash: 2.55 } or similar.
//             const crashValue = parseFloat(roundData.crash || roundData.result || 1.00);
            
//             // Generate a numeric ID if the API gives a string or hash
//             const gameId = parseInt(roundData.gameId || roundData.id || (100000 + index));

//             this.currentGameId = gameId;

//             const standardizedRound = {
//                 gameId: gameId,
//                 finalMultiplier: crashValue,
//                 clientSeed: roundData.clientSeed || 'public_history_data',
//                 nonce: gameId,
//                 verificationStatus: 'Official Data' // Special flag for Verifier
//             };

//             console.log(`[LiveSync] Round ${gameId} Completed: ${crashValue}x`);

//             // 1. Add to DataStore
//             this.dataStore.addRound(standardizedRound);

//             // 2. Emit Event (This triggers prediction and UI updates)
//             this.eventBus.emit('newRoundCompleted', standardizedRound);

//             // 3. Update Modals (if open)
//             this.updateModalHistory();
//             this.updateModalDiagnostics();

//             index++;
//         }, FEED_RATE_MS);
//     }

//     /**
//      * Fallback if the API fails (uses random math).
//      */
//     startLocalMockEmulation() {
//         console.log("⚠️ Starting Local Mock Emulation.");
//         setInterval(() => {
//             this.currentGameId++;
//             const crash = 1.00 + Math.random() * 10;
//             const round = {
//                 gameId: this.currentGameId,
//                 finalMultiplier: parseFloat(crash.toFixed(2)),
//                 verificationStatus: 'Mock Data'
//             };
//             this.dataStore.addRound(round);
//             this.eventBus.emit('newRoundCompleted', round);
//         }, 5000);
//     }

//     // --- MODAL HELPERS ---
    
//     updateModalLiveValue() {
//         // In history mode, we don't have a live value. 
//         const el = document.getElementById('live-sync-current-multiplier');
//         if (el) el.textContent = "---"; 
//     }

//     updateModalHistory() {
//         const container = document.getElementById('live-sync-history-container');
//         if (!container) return;
        
//         const allMultipliers = this.dataStore.getMultipliers();
//         const history = allMultipliers.slice(-20); // DataStore is already newest-first

//         container.innerHTML = ''; 
//         history.forEach(value => {
//             const badge = document.createElement('div');
//             badge.className = `history-badge ${this.getBadgeClass(value)}`;
//             badge.textContent = value.toFixed(2) + 'x';
//             container.appendChild(badge);
//         });
//     }

//     updateModalDiagnostics() {
//         const gameIdEl = document.getElementById('sync-game-id');
//         const lastSyncEl = document.getElementById('sync-last-time');
        
//         if (gameIdEl) gameIdEl.textContent = this.currentGameId;
//         if (lastSyncEl) lastSyncEl.textContent = new Date().toLocaleTimeString();
//     }

//     getBadgeClass(value) {
//         if (value >= 10.0) return 'm-high'; 
//         if (value >= 2.0) return 'm-medium'; 
//         return 'm-low'; 
//     }
// }






/**
 * js/LiveSyncing.js
 * Pivot: Fetches public historical data and emulates a live feed of COMPLETED rounds.
 * This file is updated to call the local proxy server to bypass CORS.
 */

export class LiveSync {
    constructor(dataStore, verifier, eventBus) {
        this.dataStore = dataStore;
        this.verifier = verifier;
        this.eventBus = eventBus;
        this.currentGameId = 0; // Tracks the ID of the round that JUST finished
        this.isRoundRunning = false; 
        
        console.log("LiveSync: Initialized in Historical Fetch Mode.");
    }
    
    /**
     * Entry point: Fetches history from the local proxy.
     */
    connect() {
        console.log('🔗 LiveSync: Starting Historical Data Fetch via Proxy...');
        this.fetchHistory();
    }

    /**
     * Fetches the last 500 rounds from the local proxy server.
     */
    async fetchHistory() {
        // 🔥 CRITICAL FIX: Point to the local proxy URL
        const PROXY_URL = 'http://localhost:3000/history'; 
        
        try {
            console.log('⌛ Attempting to fetch historical crash results from local proxy...');
            const response = await fetch(PROXY_URL);
            
            if (!response.ok) {
                // If the proxy is down, or if the API returned an error
                throw new Error(`Proxy/API error! status: ${response.status}`);
            }

            const json = await response.json();
            // The API response usually puts the array under 'data'
            const rounds = json.data || json; 
            
            if (!Array.isArray(rounds)) {
                throw new Error('Fetched data format is incorrect (not an array).');
            }
            
            console.log(`✅ Successfully received ${rounds.length} historical rounds from proxy.`);
            
            // Start feeding these rounds into the app
            this.startHistoryEmulation(rounds);

        } catch (error) {
            console.error('💥 LiveSync Fetch Error:', error.message);
            console.log('⚠️ Switching to local mock emulation due to fetch failure.');
            // Fallback: If fetch fails, we use local mock emulation so the app still works
            this.startLocalMockEmulation();
        }
    }
    
    /**
     * Feeds historical data into the system one by one.
     */
    startHistoryEmulation(rounds) {
        // The API returns newest first. We reverse it to play them in chronological order.
        const chronologicRounds = rounds.reverse(); 
        let index = 0;
        
        // Feed a new round every 5 seconds
        const FEED_RATE_MS = 5000; 

        const intervalId = setInterval(() => {
            if (index >= chronologicRounds.length) {
                console.log('🏁 History stream complete. Restarting from the beginning...');
                index = 0; // Loop forever for continuous testing
            }

            const roundData = chronologicRounds[index];
            
            // Normalize the data structure
            const crashValue = parseFloat(roundData.crash || roundData.result || 1.00);
            const gameId = parseInt(roundData.gameId || roundData.id || (100000 + index));

            this.currentGameId = gameId;

            const standardizedRound = {
                gameId: gameId,
                finalMultiplier: crashValue,
                clientSeed: roundData.clientSeed || 'public_history_data',
                nonce: gameId,
                verificationStatus: 'Official Data' 
            };

            console.log(`[LiveSync] Round ${gameId} Completed: ${crashValue}x`);

            // 1. Add to DataStore
            this.dataStore.addRound(standardizedRound);

            // 2. Emit Event (This triggers prediction and UI updates)
            this.eventBus.emit('newRoundCompleted', standardizedRound);

            // 3. Update Modals (if open)
            this.updateModalHistory();
            this.updateModalDiagnostics();

            index++;
        }, FEED_RATE_MS);
    }

    /**
     * Fallback if the API fails (uses random math).
     */
    startLocalMockEmulation() {
        console.log("⚠️ Starting Local Mock Emulation (Random Data).");
        setInterval(() => {
            this.currentGameId++;
            const crash = 1.00 + Math.random() * 10;
            const round = {
                gameId: this.currentGameId,
                finalMultiplier: parseFloat(crash.toFixed(2)),
                verificationStatus: 'Mock Data'
            };
            this.dataStore.addRound(round);
            this.eventBus.emit('newRoundCompleted', round);
        }, 5000);
    }

    // --- MODAL HELPERS ---
    
    updateModalLiveValue() {
        const el = document.getElementById('live-sync-current-multiplier');
        if (el) el.textContent = "---"; 
    }

    updateModalHistory() {
        const container = document.getElementById('live-sync-history-container');
        if (!container) return;
        
        const allMultipliers = this.dataStore.getMultipliers();
        const history = allMultipliers.slice(0, 20); // Get newest 20

        container.innerHTML = ''; 
        history.forEach(value => {
            const badge = document.createElement('div');
            badge.className = `history-badge ${this.getBadgeClass(value)}`;
            badge.textContent = value.toFixed(2) + 'x';
            container.appendChild(badge);
        });
    }

    updateModalDiagnostics() {
        const gameIdEl = document.getElementById('sync-game-id');
        const lastSyncEl = document.getElementById('sync-last-time');
        
        if (gameIdEl) gameIdEl.textContent = this.currentGameId;
        if (lastSyncEl) lastSyncEl.textContent = new Date().toLocaleTimeString();
    }

    getBadgeClass(value) {
        if (value >= 10.0) return 'm-high'; 
        if (value >= 2.0) return 'm-medium'; 
        return 'm-low'; 
    }
}