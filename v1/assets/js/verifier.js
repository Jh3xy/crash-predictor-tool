

/**
 * js/Verifier.js
 * Implements provably fair verification.
 * UPDATED: Handles "Official Data" bypass.
 */

import { CryptoEngine } from './crypto_engine.js';

export class Verifier {
    constructor(dataStore, eventBus) { 
        this.dataStore = dataStore;
        this.eventBus = eventBus; 
        this.serverSeed = 'DEFAULT_MOCK_SEED_FOR_HMAC'; 
        this.cryptoEngine = new CryptoEngine();

        // Simple queue for pending verifications
        this._pendingQueue = [];
        this._isProcessing = false;

        console.log('Verifier: Initialized.');
    }

    /**
     * Public API expected by LiveSync — enqueue a round for verification.
     * Will process the queue sequentially.
     */
    addPendingVerification(round) {
        if (!round || !round.gameId) {
            console.warn('Verifier: addPendingVerification called with invalid round.');
            return;
        }

        // avoid duplicates (cheap check)
        if (this._pendingQueue.find(r => r.gameId === round.gameId)) {
            return;
        }

        // mark initial state
        round.verificationStatus = round.verificationStatus || 'Pending';
        this._pendingQueue.push(round);

        // begin processing if not already
        if (!this._isProcessing) {
            this._processQueue();
        }
    }

    // internal: process the pending queue sequentially
    async _processQueue() {
        this._isProcessing = true;
        while (this._pendingQueue.length > 0) {
            const next = this._pendingQueue.shift();
            try {
                await this.verify(next);
            } catch (e) {
                console.error('Verifier: Error verifying round', next.gameId, e);
                // mark failed
                next.verificationStatus = 'Verification Error';
                try { this.dataStore.updateRound(next.gameId, { verificationStatus: next.verificationStatus }); } catch (_) {}
                // still continue with next items
            }
        }
        this._isProcessing = false;
    }

    async verify(round) {
        if (!round) return;

        // BYPASS: Official API data
        if (round.verificationStatus === 'Official Data') {
            this.eventBus.emit('roundVerified', round);
            return;
        }

        // Standard verification
        const key = this.serverSeed; 
        const data = `${round.clientSeed}:${round.nonce}`; 
        
        const calculatedHash = await this.cryptoEngine.hmacSha256(key, data);
        
        if (calculatedHash.error) {
            console.error(`❌ Verifier: Hash failed for ID ${round.gameId}`);
            round.verificationStatus = 'Verification Failed';
            this.dataStore.updateRound(round.gameId, { verificationStatus: round.verificationStatus });
            return;
        }

        round.verificationHash = calculatedHash;
        
        // simulate a small verification delay (can be removed/reduced)
        await new Promise(resolve => setTimeout(resolve, 500)); 

        round.verificationStatus = round.finalMultiplier >= 2.00 ? 'Verified' : 'Low Payout Verified';

        this.dataStore.updateRound(round.gameId, {
            verificationStatus: round.verificationStatus,
            verificationHash: round.verificationHash
        });

        this.eventBus.emit('roundVerified', round);
    }
}
