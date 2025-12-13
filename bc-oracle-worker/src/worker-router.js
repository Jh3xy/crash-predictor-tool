
// src/worker-router.js

import { CrashOracleDO } from './crash-oracle-do.js';
import AuthWorker from './auth-worker.js'; // NEW: Import the auth worker logic
export { CrashOracleDO }; 

export default {
  // Handle HTTP & WebSocket requests
  async fetch(request, env, ctx) {
    const id = env.CRASH_ORACLE_DO.idFromName("GLOBAL");
    const stub = env.CRASH_ORACLE_DO.get(id);
    // Forward ALL requests (including /api/history and /internal/update-auth) to the DO
    return stub.fetch(request);
  },

  // NEW: Handle Cron Triggers
  async scheduled(event, env, ctx) {
    // Delegate the scheduled event to the AuthWorker logic
    await AuthWorker.scheduled(event, env, ctx);
  }
};

