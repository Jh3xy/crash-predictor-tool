/**
 * js/crypto_engine.js
 * * The CryptoEngine is a new, separate module responsible for handling all
 * cryptographic operations, such as generating HMAC hashes.
 */

// Helper function to convert an ArrayBuffer to a hexadecimal string
function bufferToHex(buffer) {
    return Array.prototype.map.call(new Uint8Array(buffer), x => (('00' + x.toString(16)).slice(-2))).join('');
}

export class CryptoEngine {
    constructor() {
        // Log to confirm the module loaded correctly
        console.log('--- MODULE LOADED: CryptoEngine is ready for hashing. (js/crypto_engine.js)');
    }

    /**
     * Generates an HMAC SHA-256 hash (using browser crypto.subtle).
     * @param {string} key The server seed.
     * @param {string} data The combined client seed and nonce (e.g., '1337:1').
     * @returns {Promise<string|Object>} A promise that resolves to the hash string, or an error object.
     */
    async hmacSha256(key, data) {
        try {
            // Defensive check for empty key (FIX 1 from original file)
            if (!key || key.length === 0) {
                console.error("CRYPTO ERROR: HMAC calculation failed. The server seed (key) is empty.");
                return { error: true, message: "HMAC_KEY_EMPTY" };
            }
            
            // Note: The mock hash calculation logic has been removed and replaced with the robust, real browser crypto logic.

            const keyData = new TextEncoder().encode(key);
            const dataData = new TextEncoder().encode(data);
            
            // Import the key as HMAC-SHA-256
            const cryptoKey = await crypto.subtle.importKey(
                'raw',
                keyData,
                { name: 'HMAC', hash: 'SHA-256' },
                false,
                ['sign']
            );

            // Sign the data
            const signature = await crypto.subtle.sign(
                'HMAC',
                cryptoKey,
                dataData
            );

            return bufferToHex(signature);

        } catch (e) {
            console.error("CRYPTO ERROR: HMAC calculation failed. Ensure environment supports crypto.subtle.", e.name + ': ' + e.message);
            return { error: true, message: "HMAC_CALCULATION_FAILED" };
        }
    }
}