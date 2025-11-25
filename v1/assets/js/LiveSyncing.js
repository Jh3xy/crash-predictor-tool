
// We don't need to import DataStore/Verifier here, they are passed into the constructor.

export class LiveSync {
    constructor(dataStore, verifier) {
        // Dependencies passed from script.js
        this.dataStore = dataStore;
        this.verifier = verifier;
        this.ws = null;
        // State management for emulation
        this.isEmulating = false;
        this.emulationInterval = null;
        this.MAX_RETRIES = 5; // Max number of times to retry before falling back to emulation
        // Placeholder URL. You MUST replace this with the actual BC.Game WebSocket endpoint.
        this.url = 'ws://YOUR_BC_GAME_WEBSOCKET_URL_HERE'; 
        console.log('📡 LiveSync: Initialized.');
    }

    /**
     * Attempts to establish a connection to the crash game feed using exponential backoff retry logic.
     */
    connect(retryCount = 0) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.stopEmulation(); // Stop emulation if a connection is established mid-emulation
            return;
        }
        
        if (retryCount >= this.MAX_RETRIES) {
            console.error(`❌ LiveSync: Failed to connect after ${this.MAX_RETRIES} attempts. Starting emulation mode.`);
            this.startEmulation();
            return;
        }

        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
            console.log('🟢 LiveSync: Connected to Crash Game feed.');
            this.stopEmulation(); // Stop emulation if successful
            // Send subscription messages if the platform requires them
            // Example: this.ws.send(JSON.stringify({ type: 'subscribe', channel: 'crash' }));
        };

        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.handleMessage(data);
            } catch (e) {
                console.error('❌ LiveSync: Failed to parse WebSocket message:', e);
            }
        };

        this.ws.onclose = (event) => {
            console.warn(`⚠️ LiveSync: Connection closed. Code: ${event.code}.`);
            // Implement exponential backoff for retries
            const delay = Math.min(1000 * Math.pow(2, retryCount), 30000); // 1s, 2s, 4s, 8s... max 30s
            console.log(`♻️ LiveSync: Retrying connection (${retryCount + 1}/${this.MAX_RETRIES}) in ${delay / 1000} seconds...`);
            setTimeout(() => this.connect(retryCount + 1), delay);
        };

        this.ws.onerror = (error) => {
            console.error('❌ LiveSync: WebSocket Error occurred.', error);
            this.ws.close(); // Force close to trigger onclose and retry logic
        };
    }

    /**
     * Starts the simulation of round data when the real connection fails.
     */
    startEmulation() {
        if (this.isEmulating) return;

        this.isEmulating = true;
        console.log('🤖 EMULATION MODE STARTED: Generating random round data.');
        
        // Simulate a new round every 10 seconds (standard crash game timing)
        this.emulationInterval = setInterval(() => {
            const simulatedRound = this.generateEmulatedRound();
            console.log(`🤖 EMULATED ROUND: ${simulatedRound.finalMultiplier}x`);
            
            // Treat the simulated round like a finished round
            this.dataStore.addRound(simulatedRound);
            this.verifier.checkAndVerify(simulatedRound); 
            document.dispatchEvent(new CustomEvent('newRoundCompleted', { detail: simulatedRound }));
            
            // Also simulate a live update transition for visual effect
            document.dispatchEvent(new CustomEvent('liveUpdate', { detail: '1.00' }));
            setTimeout(() => {
                document.dispatchEvent(new CustomEvent('liveUpdate', { detail: simulatedRound.finalMultiplier.toFixed(2) }));
            }, 500);

        }, 10000); // 10 second cycle time
    }

    /**
     * Stops the emulation loop when a real connection is established.
     */
    stopEmulation() {
        if (this.isEmulating) {
            clearInterval(this.emulationInterval);
            this.isEmulating = false;
            console.log('✅ EMULATION MODE STOPPED: Real connection restored.');
        }
    }

    /**
     * Generates a random, but somewhat realistic, crash multiplier.
     * Crash games typically have a high frequency of low multipliers.
     */
    generateEmulatedRound() {
        // Simple random number generation that skews towards lower values
        // Math.random() generates 0.0 to 1.0
        let crashValue = 0;
        
        // 99% of rounds are 100x or less. 50% are 1.00x - 2.00x
        const randomness = Math.random(); 
        
        if (randomness < 0.5) {
            // 50% chance: 1.00x to 2.00x
            crashValue = 1.0 + Math.random();
        } else if (randomness < 0.85) {
            // 35% chance: 2.00x to 5.00x
            crashValue = 2.0 + Math.random() * 3.0;
        } else if (randomness < 0.95) {
            // 10% chance: 5.00x to 15.00x
            crashValue = 5.0 + Math.random() * 10.0;
        } else {
            // 5% chance: 15.00x to 100.00x+ (High rollers)
            crashValue = 15.0 + Math.random() * 85.0; 
        }

        // Apply a small bias to ensure it doesn't crash at exactly 1.00
        if (crashValue <= 1.00) crashValue = 1.01;

        return {
            gameId: `EMU-${Date.now()}`,
            publicHash: 'SIMULATED',
            clientSeed: 'SIMULATED',
            nonce: 0,
            finalMultiplier: crashValue,
            timestamp: Date.now(),
            revealedServerSeed: 'SIMULATED_SEED', // Assume seed is available in emulation
            isVerified: true, // Always true in simulation
            riskZone: 'EMULATED' 
        };
    }

    /**
     * Processes incoming data from the WebSocket and routes it. (Unchanged from last version)
     */
    handleMessage(data) {
        // Log the raw incoming data for debugging
        // console.log('INCOMING RAW DATA:', data); 

        // 1. Real-time multiplier update (game is running)
        if (data.type === 'game_update' && data.status === 'running') {
            const currentMultiplier = parseFloat(data.multiplier).toFixed(2);
            // Notify UIController (via document event) to update the visual display
            document.dispatchEvent(new CustomEvent('liveUpdate', { detail: currentMultiplier }));
            return;
        }

        // 2. Round finished (data ready for storage/verification/prediction)
        if (data.type === 'game_finished' && data.multiplier) {
            const roundData = this.mapToRoundObject(data);
            
            // A. Store the raw data
            this.dataStore.addRound(roundData);

            // B. Trigger the verifier. It will handle the delayed seed problem.
            this.verifier.checkAndVerify(roundData); 
            
            // C. Notify other modules (Predictor, UI) that a new round is ready
            document.dispatchEvent(new CustomEvent('newRoundCompleted', { detail: roundData }));
        }

        // 3. Handle BC.Game specific "batch reveal" or delayed seed release
        // This is a hypothetical structure based on the BC.Game constraint:
        if (data.type === 'seed_reveal' && data.gameId && data.serverSeed) {
             console.log(`🚨 LiveSync: Received delayed Server Seed for Game ID: ${data.gameId}`);
             this.dataStore.updateRound(data.gameId, { 
                revealedServerSeed: data.serverSeed 
             });
             
             // Check if we can now verify this round
             this.verifier.checkIfReadyForVerification(data.gameId);
        }
    }

    /**
     * Maps messy raw server data into a clean, standardized round object. (Unchanged from last version)
     */
    mapToRoundObject(rawData) {
        // Replace these keys based on the actual JSON structure from your BC.Game feed
        return {
            gameId: rawData.id || crypto.randomUUID(),
            publicHash: rawData.hash || 'unknown',
            clientSeed: rawData.clientSeed || 'default_client_seed',
            nonce: rawData.nonce || 0,
            finalMultiplier: parseFloat(rawData.multiplier),
            timestamp: Date.now(),
            
            // BC.Game specific data that might be null initially
            revealedServerSeed: rawData.serverSeed || null, 
            isVerified: false,
            // Predictor fields will be added later
            riskZone: 'N/A' 
        };
    }
}
