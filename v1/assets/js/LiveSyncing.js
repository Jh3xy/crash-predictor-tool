/**
 * js/LiveSyncing.js
 * Final version – works with Cloudflare Worker at /ws (no CORS, no Socket.IO)
 */

export class LiveSync {
    // ----------------------------------------------------------------------
    // ✅ FIX 1: Add uiController and crashPredictor to the constructor
    // ----------------------------------------------------------------------
    constructor(dataStore, verifier, eventBus, uiController, crashPredictor) {
        this.dataStore = dataStore;
        this.verifier = verifier;
        this.eventBus = eventBus;
        this.uiController = uiController;       // Stored the UIController instance
        this.crashPredictor = crashPredictor;   // Stored the CrashPredictor instance
        this.currentGameId = null;
        this.currentMultiplier = 1.00;
        this.isRoundRunning = false;
        this.ws = null;
        this.roundCounter = 0;

        console.log("LiveSync: Initialized in Live WebSocket Mode.");
        this.connect(); // auto-connect
    }

    // connect() {
    //     // Only change this ONE line:
    //     // const PROXY_URL = 'wss://oracle-stake-proxy.jhxydev-me.workers.dev/ws';
    //     const PROXY_URL = 'wss://stake-oracle.jhxydev-me.workers.dev/ws';

    //     // close old connection if exists
    //     if (this.ws) this.ws.close();

    //     this.ws = new WebSocket(PROXY_URL);

    //     this.ws.onopen = () => {
    //         console.log('Connected to Cloudflare Worker WebSocket');
    //         this.roundCounter = 0;
    //     };

    //     this.ws.onmessage = (event) => {
    //         try {
    //             const msg = JSON.parse(event.data);

    //            if (msg.type === 'history') {
    //                 // ✅ FIX: Use the correct method defined in DataStore.js
    //                 this.dataStore.setHistory(msg.data); 
    //                 console.log(`Received ${msg.data.length} historical rounds`);
    //             }
    //             else if (msg.type === 'liveMultiplierUpdate') {
    //                 this.handleLiveUpdate(msg.data);
    //             }
    //         } catch (e) {
    //             console.error('Bad message from Worker', e);
    //         }
    //     };

    //     this.ws.onerror = (err) => {
    //         // this is normal during close/reconnect – ignore
    //         console.warn('Worker WebSocket error (normal on reconnect)');
    //     };

    //     this.ws.onclose = () => {
    //         console.warn('Worker WebSocket closed — reconnecting in 3s...');
    //         setTimeout(() => this.connect(), 3000);
    //     };
    // }

    // ——————————————————— everything below is 100 % unchanged from your file ———————————————————

    // handleLiveUpdate(crashData) {
    //     if (crashData.status === 'waiting') {
    //         this.isRoundRunning = false;
    //         this.currentMultiplier = 1.00;
    //         this.currentGameId = crashData.id;
    //         this.roundCounter++;
    //         uiController.updateRoundCounter(this.roundCounter);
    //         uiController.showWaitingState();
    //         return;
    //     }

    //     if (crashData.status === 'in_progress' || crashData.status === 'running') {
    //         this.isRoundRunning = true;
    //         this.currentMultiplier = parseFloat(crashData.multiplier) || 1.00;
    //         this.currentGameId = crashData.id;

    //         uiController.updateMultiplier(this.currentMultiplier);
    //         uiController.updateProgressBar(this.currentMultiplier);

    //         const prediction = crashPredictor.predictNext(this.dataStore.getMultipliers(200));
    //         uiController.displayPrediction(prediction);

    //         return;
    //     }

    //     if (crashData.status === 'crash' || crashData.status === 'crashed') {
    //         this.isRoundRunning = false;
    //         const finalMultiplier = parseFloat(crashData.multiplier) || 1.00;

    //         uiController.updateMultiplier(finalMultiplier);
    //         uiController.showCrashedState(finalMultiplier);

    //         const standardized = this.standardizeRound(crashData);
    //         this.dataStore.addRound(standardized);
    //         this.verifier.addPendingVerification(standardized);

    //         eventBus.emit('newRoundCompleted', {
    //             finalMultiplier: finalMultiplier,
    //             gameId: crashData.id
    //         });

    //         uiController.updateRecentMultipliers(this.dataStore.getRecentMultipliers(10));
    //         uiController.updateStats(this.dataStore.getMultipliers(500));

    //         const newPrediction = crashPredictor.predictNext(this.dataStore.getMultipliers(200));
    //         uiController.displayPrediction(newPrediction);

    //         return;
    //     }
    // }

    connect() {
        // We will assume this is correct for your deployed worker:
        const PROXY_URL = 'wss://bc-oracle-worker.jhxydev-me.workers.dev/ws'; 

        // close old connection if exists
        if (this.ws) this.ws.close();

        this.ws = new WebSocket(PROXY_URL);

        this.ws.onopen = () => {
            console.log('Connected to Cloudflare Worker WebSocket');
            // We start the counter at 0, it will increment on the first received round.
            this.roundCounter = 0; 
        };

        this.ws.onmessage = (event) => {
            try {
                // The Durable Object sends the round object directly, not wrapped in {type: '...'}.
                const roundData = JSON.parse(event.data);

                // IMPORTANT: Log the incoming data to the console for verification!
                // This is the key line to check if the data is flowing.
                console.log('✅ New Round Data Received from Oracle:', roundData);
                
                // Process the round as a completed crash.
                this.handleCompletedRound(roundData);

            } catch (e) {
                console.error('Bad message from Worker. Not valid JSON:', e);
            }
        };

        this.ws.onerror = (err) => {
            console.warn('Worker WebSocket error (normal on reconnect)');
        };

        this.ws.onclose = () => {
            console.warn('Worker WebSocket closed — reconnecting in 3s...');
            setTimeout(() => this.connect(), 3000);
        };
    }

    // New handler function to replace the complex handleLiveUpdate
    handleCompletedRound(crashData) {
        // Since we are only polling the BC.Game /history API, 
        // every message is a completed (crashed) round.
        
        // Detect new round and increment counter
        if (crashData.id && crashData.id !== this.currentGameId) {
            this.roundCounter++;
        }
        
        this.isRoundRunning = false;
        const finalMultiplier = parseFloat(crashData.multiplier) || 1.00;

        // ----------------------------------------------------------------------
        // ✅ FIX 2: Used 'this.' to access the injected dependencies (uiController)
        // ----------------------------------------------------------------------
        this.uiController.updateMultiplier(finalMultiplier);
        this.uiController.showCrashedState(finalMultiplier);
        this.uiController.updateRoundCounter(this.roundCounter); // Update round number display

        // Process and store the round
        const standardized = this.standardizeRound(crashData);
        this.dataStore.addRound(standardized);
        this.verifier.addPendingVerification(standardized);

        // ✅ FIX 3: Used 'this.' to access the injected dependency (eventBus)
        this.eventBus.emit('newRoundCompleted', {
            finalMultiplier: finalMultiplier,
            gameId: crashData.id
        });

        // Update other UI elements
        this.uiController.updateRecentMultipliers(this.dataStore.getRecentMultipliers(10));
        this.uiController.updateStats(this.dataStore.getMultipliers(500));

        // Re-run the predictor logic now that a new round is in history
        // ✅ FIX 4: Used 'this.' to access the injected dependency (crashPredictor)
        const newPrediction = this.crashPredictor.predictNext(this.dataStore.getMultipliers(200));
        this.uiController.displayPrediction(newPrediction);

        // Reset for next round display
        this.currentMultiplier = 1.00;
        this.currentGameId = crashData.id;
    }

    // (Remove the original handleLiveUpdate function as it's no longer needed)
    // ... (keep the rest of the file like standardizeRound, etc.)



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

        return {
            gameId: crashData.id,
            finalMultiplier: finalMultiplier,
            clientSeed: roundHash,
            nonce: 0,
            verificationStatus: 'Live Official Data'
        };
    }
}