
// This utility function is asynchronous due to browser's crypto API.
async function hmacSha256(key, data) {
    try {
        // Encode key and data as ArrayBuffers
        const keyBuffer = new TextEncoder().encode(key);
        const dataBuffer = new TextEncoder().encode(data);

        // Import the key
        const cryptoKey = await crypto.subtle.importKey(
            'raw',
            keyBuffer,
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        );

        // Generate the HMAC (Hash-based Message Authentication Code)
        const signature = await crypto.subtle.sign('HMAC', cryptoKey, dataBuffer);
        
        // Convert the resulting ArrayBuffer to a hex string
        return Array.from(new Uint8Array(signature))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');

    } catch (e) {
        console.error("❌ CRYPTO ERROR: HMAC calculation failed. Ensure environment supports crypto.subtle.", e);
        // Fallback for non-compliant environments (production would use a polyfill/library)
        return null;
    }
}


/**
 * The Verifier class handles the Provably Fair calculations 
 * to check if the crash game results are legitimate.
 */
export class Verifier {
    constructor(dataStore) {
        this.dataStore = dataStore;
        // The probability of the game not crashing at 1.00x (99.00%)
        this.GAME_PROBABILITY = 0.99; 
        console.log('🛡️ Verifier: Initialized.');
    }

    /**
     * Checks if a round is ready for verification (i.e., if it has the server seed).
     * This is the entry point called by LiveSync after a round finishes.
     */
    checkAndVerify(round) {
        if (round.isVerified) {
            // Simulated rounds are already verified
            return;
        }

        if (round.revealedServerSeed) {
            this.verify(round);
        } else {
            // This is the common BC.Game case: waiting for the delayed seed.
            console.log(`⏱️ Verifier: Seed for ID ${round.gameId} is missing. Will wait.`);
            // No action needed; LiveSync will call checkIfReadyForVerification later.
        }
    }

    /**
     * Called by LiveSync when a delayed seed is finally received.
     */
    checkIfReadyForVerification(gameId) {
        const rounds = this.dataStore.getRecentRounds(this.dataStore.MAX_ROUNDS);
        const round = rounds.find(r => r.gameId === gameId);

        if (round && round.revealedServerSeed && !round.isVerified) {
            console.log(`✅ Verifier: Seed received for ID ${gameId}. Initiating verification...`);
            this.verify(round);
        }
    }

    /**
     * Performs the actual cryptographic verification.
     */
    async verify(round) {
        if (round.isVerified) return;

        // 1. Combine key and data for HMAC
        const key = round.revealedServerSeed;
        // BC.Game often uses the client seed + nonce as the data/message
        const data = `${round.clientSeed}:${round.nonce}`; 
        
        // 2. Calculate HMAC-SHA256 (this is the complex part)
        const hashHex = await hmacSha256(key, data);
        
        if (!hashHex) {
            console.error(`❌ Verifier: Failed to get hash for ID ${round.gameId}. Aborting.`);
            return;
        }

        // 3. Extract the required random bytes (usually the first 8 bytes / 16 hex chars)
        const extractedHash = hashHex.substring(0, 8); 
        
        // 4. Convert the hex string to a decimal integer
        const hashInt = parseInt(extractedHash, 16);

        // 5. Map the integer to a float between 0 and 1
        // (Max possible value for 8 hex characters is 2^32 - 1)
        const maxUInt32 = 0xFFFFFFFF; // 4,294,967,295
        const floatValue = hashInt / (maxUInt32 + 1); // Get value [0, 1)

        // 6. Calculate the Crash Multiplier (standard crash game formula)
        let calculatedMultiplier = (this.GAME_PROBABILITY / (1 - floatValue));
        
        // Crash game rule: If the result is 1.00, it must be set to 1.00
        if (calculatedMultiplier < 1.01) {
            calculatedMultiplier = 1.00;
        }
        
        // Round to two decimal places, matching the game's output format
        calculatedMultiplier = parseFloat(calculatedMultiplier.toFixed(2));
        
        // 7. Comparison and Update
        const finalMultiplier = round.finalMultiplier;
        const result = calculatedMultiplier === finalMultiplier;
        
        console.log(`--- Verification Summary ID: ${round.gameId} ---`);
        console.log(`  Expected Crash: ${calculatedMultiplier.toFixed(2)}x`);
        console.log(`  Actual Crash:   ${finalMultiplier.toFixed(2)}x`);
        console.log(`  Status: ${result ? '✅ MATCHED (Verified)' : '🚨 MISMATCH (ERROR)'}`);
        console.log('-------------------------------------------');

        // Update the DataStore with verification status and calculated value
        this.dataStore.updateRound(round.gameId, {
            isVerified: true,
            calculatedMultiplier: calculatedMultiplier,
            verificationStatus: result ? 'MATCHED' : 'MISMATCH'
        });
        
        // Notify the Predictor/UI that a verified round is ready
        document.dispatchEvent(new CustomEvent('roundVerified', { detail: { ...round, isVerified: true, verificationStatus: result ? 'MATCHED' : 'MISMATCH' } }));
    }
}

