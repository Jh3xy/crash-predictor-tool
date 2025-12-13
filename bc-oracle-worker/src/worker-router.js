
// src/worker-router.js

// CRITICAL: Export the class so wrangler.toml sees it
import { CrashOracleDO } from './crash-oracle-do.js';
export { CrashOracleDO }; 

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Get the Durable Object Stub for the GLOBAL ID
    // We use the same DO instance for all connections/commands
    const id = env.CRASH_ORACLE_DO.idFromName("GLOBAL");
    const stub = env.CRASH_ORACLE_DO.get(id);

    // ✅ FIX: Forward ALL requests to the Durable Object
    // The DO's fetch handler will handle /ws (for WebSocket) and /reset (for storage clear)
    return stub.fetch(request);
  },
};
