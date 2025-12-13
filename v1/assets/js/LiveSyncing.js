

// js/LiveSyncing.js
// Hybrid Mode: HTTP History Fetch -> WebSocket Live Updates

export class LiveSync {
    constructor(dataStore, verifier, eventBus, uiController, crashPredictor) {
        this.dataStore = dataStore;
        this.verifier = verifier;
        this.eventBus = eventBus;
        this.uiController = uiController;       
        this.crashPredictor = crashPredictor;   
        this.currentGameId = null;
        this.currentMultiplier = 1.00;
        this.isRoundRunning = false;
        this.ws = null;
        this.roundCounter = 0;

        // Base URL for your worker (UPDATE THIS IF YOUR DEPLOYED URL CHANGES)
        // Ensure you use the correct URL for your Cloudflare Worker deployment
        this.WORKER_BASE = 'https://bc-oracle-worker.jhxydev-me.workers.dev';
        this.WS_BASE = 'wss://bc-oracle-worker.jhxydev-me.workers.dev';

        console.log("LiveSync: Initializing Hybrid Mode (HTTP History + WebSocket Live)...");
        this.initialize();
    }

    /**
     * 🟢 New Initialization Flow
     * 1. Fetch History via HTTP (using the new /api/history endpoint)
     * 2. Populate DataStore & UI
     * 3. Start WebSocket for live updates
     */
    async initialize() {
        try {
            console.log('🕵️ [Debug] Step 1: Fetching initial history from DO...');
            
            // The request that was failing (now fixed on the worker side with CORS header)
            const response = await fetch(`${this.WORKER_BASE}/api/history`);
            
            if (!response.ok) {
                // If the fetch fails for any reason (other than CORS, which is now fixed), throw an error.
                throw new Error(`History fetch failed: ${response.status} ${await response.text()}`);
            }

            const initialHistory = await response.json();

            // --- 🔍 QUIET BUG HUNTER LOGS (for manual comparison) ---
            console.log(`🕵️ [Debug] History Loaded: ${initialHistory.length} rounds.`);
            if (initialHistory.length > 0) {
                // Print the actual array of all rounds for you to inspect manually
                console.log('🕵️ [Debug] FULL HISTORY ARRAY FOR MANUAL INSPECTION (last 500 rounds):', initialHistory);
                console.table(initialHistory.slice(0, 5)); // Show top 5 rows in a neat table
            }
            // --------------------------------

            // Populate the Store
            this.dataStore.setHistory(initialHistory); 

            // Update UI immediately with history
            this.uiController.updateStats(this.dataStore.getMultipliers(500));
            this.uiController.updateRecentMultipliers(this.dataStore.getRecentMultipliers(10));

            // Run first prediction based on history
            const initialPrediction = this.crashPredictor.predictNext(this.dataStore.getMultipliers(200));
            this.uiController.displayPrediction(initialPrediction);

            console.log('🕵️ [Debug] Step 2: History Sync Complete. Opening WebSocket...');
            this.connectWebSocket();

        } catch (error) {
            console.error('❌ LiveSync Initialization Error:', error);
            // Fallback: If HTTP history fails, try to connect WS anyway.
            this.connectWebSocket();
        }
    }

    // Renamed from 'connect'
    connectWebSocket() { 
        if (this.ws) this.ws.close();

        this.ws = new WebSocket(this.WS_BASE);

        this.ws.onopen = () => {
            console.log('✅ WebSocket Connected for Live Updates');
        };

        this.ws.onmessage = (event) => {
            try {
                const roundData = JSON.parse(event.data);

                // --- 🔍 QUIET BUG HUNTER LOGS ---
                console.log('🕵️ [Debug] WS Received Round ID:', roundData.id);
                // --------------------------------

                this.handleCompletedRound(roundData);
            } catch (e) {
                console.error('Bad message from Worker:', e);
            }
        };

        this.ws.onclose = () => {
            console.warn('WebSocket closed — reconnecting in 3s...');
            setTimeout(() => this.connectWebSocket(), 3000);
        };
    }
    
    handleCompletedRound(crashData) {
        if (crashData.id && crashData.id !== this.currentGameId) {
            this.roundCounter++;
        }
        
        this.isRoundRunning = false;
        const finalMultiplier = parseFloat(crashData.multiplier) || 1.00;

        this.uiController.updateMultiplier(finalMultiplier); 
        this.uiController.showCrashedState(finalMultiplier);
        this.uiController.updateRoundCounter(this.roundCounter);

        const standardized = this.standardizeRound(crashData);
        
        // --- 🔍 BUG HUNTER: Check for Duplicates ---
        const lastStored = this.dataStore.rounds[0];
        if (lastStored && String(lastStored.gameId) === String(standardized.gameId)) {
            console.warn('🕵️ [Debug] Duplicate Round Detected & Ignored:', standardized.gameId);
            return;
        }
        // -------------------------------------------

        this.dataStore.addRound(standardized);
        this.verifier.addPendingVerification(standardized);

        this.eventBus.emit('newRoundCompleted', {
            finalMultiplier: finalMultiplier,
            gameId: crashData.id
        });

        this.uiController.updateRecentMultipliers(this.dataStore.getRecentMultipliers(10));
        this.uiController.updateStats(this.dataStore.getMultipliers(500));

        const newPrediction = this.crashPredictor.predictNext(this.dataStore.getMultipliers(200));
        this.uiController.displayPrediction(newPrediction);

        this.currentMultiplier = 1.00;
        this.currentGameId = crashData.id;
    }

    getRiskClass(multiplier) {
        if (multiplier >= 5.0) return 'm-high';
        if (multiplier >= 2.0) return 'm-medium';
        return 'm-low';
    }

    standardizeRound(crashData) {
        const finalMultiplier = crashData.multiplier || 1.00;
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

        // Return a standardized object suitable for the DataStore
        return {
            gameId: crashData.id,
            finalMultiplier: finalMultiplier,
            clientSeed: roundHash,
            nonce: 0,
            verificationStatus: 'Live Official Data'
        };
    }
}