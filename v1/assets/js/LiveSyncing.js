/**
 * js/LiveSyncing.js
 * CRITICAL UPDATE: Handles incoming history from server and live updates.
 */

// NOTE: You must include the Socket.IO client library in your HTML file:
// <script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>

export class LiveSync {
    constructor(dataStore, verifier, eventBus) {
        this.dataStore = dataStore;
        this.verifier = verifier;
        this.eventBus = eventBus;
        this.currentGameId = 0; 
        this.currentMultiplier = 1.00; 
        this.isRoundRunning = false;
        this.ws = null; 
        
        console.log("LiveSync: Initialized in Live WebSocket Mode.");
    }
    
    /**
     * Entry point: Establishes the Socket.IO connection to the local proxy.
     */
    connect() {
        const PROXY_URL = 'http://localhost:3000';
        
        if (typeof io === 'undefined') {
            console.error("❌ Socket.IO client is not loaded. Ensure the CDN link is in your HTML.");
            return;
        }

        console.log(`🔗 LiveSync: Attempting to connect to proxy at ${PROXY_URL}...`);
        
        this.ws = io(PROXY_URL);

        this.ws.on('connect', () => {
            console.log('✅ Socket.IO connected to local proxy.');
            this.updateModalDiagnostics();
        });

        this.ws.on('disconnect', () => {
            console.log('⚠️ Socket.IO disconnected from local proxy.');
            this.updateModalDiagnostics();
        });

        // 🔥 NEW: Receive full history upon connection
        this.ws.on('history', (rawHistory) => {
            console.log(`📜 Received ${rawHistory.length} rounds of history from server.`);
            
            // Convert raw server data to our standardized DataStore format
            const standardizedHistory = rawHistory.map(item => this.standardizeRound(item));
            
            // Load into DataStore
            this.dataStore.setHistory(standardizedHistory);
            
            // Refresh UI
            this.updateModalHistory();
            this.eventBus.emit('historyLoaded'); // Optional: Tell app we are ready
        });

        // 🔥 CRITICAL LISTENER: Handles the live data streamed from server.js
        this.ws.on('liveMultiplierUpdate', (crashData) => {
            
            this.currentGameId = crashData.id;

            if (crashData.status === 'in_progress') {
                this.currentMultiplier = crashData.multiplier;
                this.isRoundRunning = true;
                this.eventBus.emit('multiplierUpdate', crashData.multiplier);

            } else if (crashData.status === 'crash') {
                this.isRoundRunning = false;
                
                // Use the helper to standardize
                const standardizedRound = this.standardizeRound(crashData);
                
                // 1. Add to DataStore
                this.dataStore.addRound(standardizedRound);
                
                // 2. Emit Event
                this.eventBus.emit('newRoundCompleted', standardizedRound);

                // 3. Reset live multiplier and update history modal
                this.currentMultiplier = 1.00; 
                this.updateModalHistory();

            } else if (crashData.status === 'starting') {
                this.isRoundRunning = false;
                this.currentMultiplier = 1.00;
            }

            this.updateModalLiveValue();
            this.updateModalDiagnostics();
        });
    }

    /**
     * Helper to format raw Stake data into our App's format
     */
    standardizeRound(crashData) {
        const finalMultiplier = crashData.multiplier || crashData.val || 1.00;
        
        // Handle nested hash object structure
        let roundHash = `PENDING`;
        if (crashData.hash) {
            if (typeof crashData.hash === 'object' && crashData.hash.hash) {
                roundHash = `stake-hash-${crashData.hash.hash}`;
            } else if (typeof crashData.hash === 'string') {
                roundHash = `stake-hash-${crashData.hash}`;
            }
        } else {
             roundHash = `game-id-${crashData.id}-PENDING_HASH`;
        }

        return {
            gameId: crashData.id,
            finalMultiplier: finalMultiplier,
            clientSeed: roundHash, 
            nonce: 0, 
            verificationStatus: 'Live Official Data' 
        };
    }

    // --- MODAL HELPERS ---
    
    updateModalLiveValue() {
        const el = document.getElementById('live-sync-current-multiplier');
        if (el) {
            el.textContent = this.isRoundRunning 
                ? `${this.currentMultiplier.toFixed(2)}x` 
                : "STARTING";
        }
    }

    updateModalHistory() {
        const container = document.getElementById('live-sync-history-container');
        if (!container) return;
        
        const allMultipliers = this.dataStore.getMultipliers();
        const history = allMultipliers.slice(0, 20); 

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