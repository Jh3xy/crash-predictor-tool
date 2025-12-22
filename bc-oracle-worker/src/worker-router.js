// src/worker-router.js

import { CrashOracleDO } from './crash-oracle-do.js';
import AuthWorker from './auth-worker.js'; 
export { CrashOracleDO }; 

export default {
  // Handle HTTP & WebSocket requests
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // --- MANUAL TEST ROUTE ---
    // This allows you to trigger the AuthWorker manually by visiting /test-auth-update
    // if (url.pathname === "/test-auth-update") {
    //   console.log("[Router] 🧪 Manual trigger: Running AuthWorker.scheduled...");
      
    //   // We manually call the scheduled function
    //   // ctx.waitUntil ensures the worker doesn't shut down before the browser finishes
    //   ctx.waitUntil(AuthWorker.scheduled(null, env, ctx));
      
    //   return new Response("Auth Update Process Started! Please monitor your 'npx wrangler tail' logs.", {
    //     headers: { "Content-Type": "text/plain" }
    //   });
    // }

    const id = env.CRASH_ORACLE_DO.idFromName("GLOBAL");
    const stub = env.CRASH_ORACLE_DO.get(id);
    
    // Forward ALL other requests (WebSocket, History API, etc.) to the Durable Object
    return stub.fetch(request);
  },

  // Handle Cron Triggers (Automated hourly updates)
  async scheduled(event, env, ctx) {
    console.log("[Router] ⏰ Cron trigger received.");
    await AuthWorker.scheduled(event, env, ctx);
  }
};
