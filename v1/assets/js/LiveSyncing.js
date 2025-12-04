/**
 * js/LiveSyncing.js
 * CRITICAL UPDATE: Switches from historical fetch/emulation to a live Socket.IO connection
 * to the local proxy server (server.js).
 */

// NOTE: You must include the Socket.IO client library in your HTML file:
// <script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>

export class LiveSync {
    constructor(dataStore, verifier, eventBus) {
        this.dataStore = dataStore;
        this.verifier = verifier;
        this.eventBus = eventBus;
        this.currentGameId = 0; 
        this.currentMultiplier = 1.00; // New property to store the live value
        this.isRoundRunning = false;
        this.ws = null; // Socket.IO client instance
        
        console.log("LiveSync: Initialized in Live WebSocket Mode.");
    }
    
    /**
     * Entry point: Establishes the Socket.IO connection to the local proxy.
     */
    connect() {
        const PROXY_URL = 'http://localhost:3000';
        
        // This 'io' function is provided by the Socket.IO client script (loaded in HTML)
        if (typeof io === 'undefined') {
            console.error("❌ Socket.IO client is not loaded. Ensure the CDN link is in your HTML.");
            return;
        }

        console.log(`🔗 LiveSync: Attempting to connect to proxy at ${PROXY_URL}...`);
        
        // Establish connection
        this.ws = io(PROXY_URL);

        this.ws.on('connect', () => {
            console.log('✅ Socket.IO connected to local proxy.');
            this.updateModalDiagnostics();
        });

        this.ws.on('disconnect', () => {
            console.log('⚠️ Socket.IO disconnected from local proxy.');
            this.updateModalDiagnostics();
        });

        // 🔥 CRITICAL LISTENER: Handles the live data streamed from server.js
        this.ws.on('liveMultiplierUpdate', (crashData) => {
            // crashData = { id, multiplier, status, hash: { hash } or null }
            
            this.currentGameId = crashData.id;

            if (crashData.status === 'in_progress') {
                // 1. Update the live multiplier property
                this.currentMultiplier = crashData.multiplier;
                this.isRoundRunning = true;

                // 2. Broadcast the live multiplier value for UI updates
                this.eventBus.emit('multiplierUpdate', crashData.multiplier);

            } else if (crashData.status === 'crash') {
                // Round is over. 
                this.isRoundRunning = false;
                
                // We use the last reported multiplier as the final one
                const finalMultiplier = crashData.multiplier; 

                // 🔥 FIX: Use a null check (crashData.hash ?) before accessing crashData.hash.hash
                const roundHash = crashData.hash 
                    ? `stake-hash-${crashData.hash.hash}` 
                    : `game-id-${crashData.id}-PENDING_HASH`;

                const standardizedRound = {
                    gameId: crashData.id,
                    finalMultiplier: finalMultiplier,
                    clientSeed: roundHash, 
                    nonce: 0, 
                    verificationStatus: 'Live Official Data' 
                };
                
                // 1. Add to DataStore
                this.dataStore.addRound(standardizedRound);
                
                // 2. Emit Event (Triggers prediction/UI updates)
                this.eventBus.emit('newRoundCompleted', standardizedRound);

                // 3. Reset live multiplier and update history modal
                this.currentMultiplier = 1.00; 
                this.updateModalHistory();

            } else if (crashData.status === 'starting') {
                 // Game is between rounds
                this.isRoundRunning = false;
                this.currentMultiplier = 1.00;
            }

            // Always update live diagnostics
            this.updateModalLiveValue();
            this.updateModalDiagnostics();
        });
    }

    // NOTE: Removed all fetchHistory, startHistoryEmulation, and startLocalMockEmulation methods.

    // --- MODAL HELPERS ---
    
    updateModalLiveValue() {
        // Now displays the live multiplier value
        const el = document.getElementById('live-sync-current-multiplier');
        if (el) {
            el.textContent = this.isRoundRunning 
                ? `${this.currentMultiplier.toFixed(4)}x` 
                : "STARTING";
        }
    }

    updateModalHistory() {
        const container = document.getElementById('live-sync-history-container');
        if (!container) return;
        
        // DataStore must be updated to store objects or you might need a new method
        // Assuming your dataStore.getMultipliers() still returns just the number array
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
        const statusEl = document.getElementById('sync-status');
        
        if (gameIdEl) gameIdEl.textContent = this.currentGameId;
        if (lastSyncEl) lastSyncEl.textContent = new Date().toLocaleTimeString();

        if (statusEl) {
             if (this.ws && this.ws.connected) {
                statusEl.textContent = this.isRoundRunning ? 'Live (In Progress)' : 'Live (Starting)';
                statusEl.className = this.isRoundRunning ? 'status-connected' : 'status-starting';
            } else {
                statusEl.textContent = 'Disconnected';
                statusEl.className = 'status-disconnected';
            }
        }
    }

    getBadgeClass(value) {
        if (value >= 10.0) return 'm-high'; 
        if (value >= 2.0) return 'm-medium'; 
        return 'm-low'; 
    }
}