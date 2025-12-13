
// stake-worker/src/worker-router.js

// Export the Durable Object class so Cloudflare registers it
export { default as OracleDO } from "./oracle_do.js";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Only WebSocket traffic goes to Durable Object
    if (url.pathname === "/ws") {
      const upgrade = request.headers.get("upgrade");

      if (!upgrade || upgrade.toLowerCase() !== "websocket") {
        return new Response("WebSocket endpoint only", { status: 400 });
      }

      // Get the fixed DO instance
      const id = env.ORACLE_DO.idFromName("GLOBAL_ORACLE");
      const stub = env.ORACLE_DO.get(id);

      // Forward the request to the DO
      return stub.fetch(request);
    }

    return new Response("Stake Oracle Worker Running", { status: 200 });
  }
};

