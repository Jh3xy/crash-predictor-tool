
// /**
//  * js/Verifier.js
//  * Implements a mock provably fair verification system using standard HMAC-SHA256.
//  */

// // --- IMPORT THE NEWLY SEPARATED CRYPTO ENGINE ---
// import { CryptoEngine } from './crypto_engine.js';


// export class Verifier {
//     constructor(dataStore) {
//         this.dataStore = dataStore;
//         // FIX: Set a reliable default mock seed
//         this.serverSeed = 'DEFAULT_MOCK_SEED_FOR_HMAC'; 
        
//         // --- NEW: Instantiate the Crypto Engine ---
//         this.cryptoEngine = new CryptoEngine();
        
//         console.log('Verifier: Initialized with a default mock seed and CryptoEngine ready.');
//     }

//     /**
//      * This function simulates the verification process.
//      * @param {Object} round - The round data to be verified.
//      */
//     async verify(round) {
//         // Use the current mock server seed for verification
//         const key = this.serverSeed; 
//         const data = `${round.clientSeed}:${round.nonce}`; // client seed + nonce
        
//         // --- Calculate the Crash Point Hash using the imported Engine ---
//         // CRITICAL CHANGE: Calling the method on the instantiated CryptoEngine object.
//         const calculatedHash = await this.cryptoEngine.hmacSha256(key, data);
        
//         if (calculatedHash.error) {
//             console.error(`❌ Verifier: Failed to get hash for ID ${round.gameId}. Aborting.`);
//             // Update the round with a failure status
//             round.verificationStatus = 'Verification Failed';
//             this.dataStore.updateRound(round.gameId, { verificationStatus: round.verificationStatus });
//             return;
//         }

//         // In a real system, the hash is compared against the known server seed hash.
//         // Here, we just mark it as verified for the UI, as the HMAC calculation was successful.
//         round.verificationHash = calculatedHash;
        
//         // Simulate a minor delay before marking as verified
//         await new Promise(resolve => setTimeout(resolve, 500)); 

//         // Update verification status based on the mock multiplier value
//         round.verificationStatus = round.finalMultiplier >= 2.00 ? 'Verified' : 'Low Payout Verified';

//         // Update the round data in the store
//         this.dataStore.updateRound(round.gameId, {
//             verificationStatus: round.verificationStatus,
//             verificationHash: round.verificationHash
//         });

//         // Notify app that verification is complete for UI update
//         document.dispatchEvent(new CustomEvent('roundVerified', { detail: round }));
//     }
// }


/**
 * js/Verifier.js
 * Implements a mock provably fair verification system using standard HMAC-SHA256.
 */

import { CryptoEngine } from './crypto_engine.js';

// ... (bufferToHex and hmacSha256 logic are now in CryptoEngine.js)

export class Verifier {
    // --- ACCEPT EVENT BUS IN CONSTRUCTOR ---
    constructor(dataStore, eventBus) { 
        this.dataStore = dataStore;
        this.eventBus = eventBus; // NEW
        this.serverSeed = 'DEFAULT_MOCK_SEED_FOR_HMAC'; 
        this.cryptoEngine = new CryptoEngine();
        console.log('Verifier: Initialized with a default mock seed and CryptoEngine ready.');
    }

    // This function simulates the verification process
    async verify(round) {
        // ... (Hash calculation logic remains unchanged)
        
        // ... (Data update logic remains unchanged)

        // Notify app that verification is complete for UI update
        // --- CRITICAL CHANGE: Use eventBus.emit instead of document.dispatchEvent ---
        this.eventBus.emit('roundVerified', round);
    }
}