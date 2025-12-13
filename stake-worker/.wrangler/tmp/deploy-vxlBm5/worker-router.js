var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/oracle_do.js
var OracleDO = class {
  static {
    __name(this, "OracleDO");
  }
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.clients = /* @__PURE__ */ new Set();
    this.history = [];
    this.lastGameId = null;
    this._loadHistory();
    this._ensurePollingAlarm();
  }
  // Durable Object lifecycle handler for background tasks
  async alarm() {
    await this._pollStake();
    await this._ensurePollingAlarm();
  }
  // --- Storage Helpers ---
  async _loadHistory() {
    const raw = await this.state.storage.get("history");
    if (raw) {
      this.history = JSON.parse(raw);
      this.lastGameId = this.history[0]?.id || null;
      console.log(`DO: Loaded ${this.history.length} historical rounds.`);
    }
  }
  async _saveHistory() {
    await this.state.storage.put("history", JSON.stringify(this.history));
  }
  async _ensurePollingAlarm() {
    const alarm = await this.state.storage.getAlarm();
    if (alarm === null || alarm.getTime() < Date.now()) {
      await this.state.storage.setAlarm(Date.now() + 4e3);
    }
  }
  // --- Secure Polling Logic (Using STAKE_TOKEN) ---
  async _pollStake() {
    if (!this.env.STAKE_TOKEN) {
      console.error("DO Error: STAKE_TOKEN is missing from environment variables.");
      return;
    }
    try {
      const response = await fetch("https://stake.com/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // New Header: Add a standard browser User-Agent string
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.75 Safari/537.36",
          "x-session-token": this.env.STAKE_TOKEN
        },
        body: JSON.stringify({
          operationName: "CasinoGameCrashHistory",
          query: `query CasinoGameCrashHistory($game: String!) { 
              crash: casinoGameCrashHistory(game: $game) { 
                  game { 
                      id 
                      state 
                      crashPoint 
                      hash 
                  } 
              } 
          }`,
          variables: { game: "crash" }
        })
      });
      if (response.status === 403) {
        console.error("DO Error: 403 \u2014 Token expired or IP flagged. Update STAKE_TOKEN.");
        return;
      }
      if (!response.headers.get("Content-Type")?.includes("application/json")) {
        const text = await response.text();
        console.error(`DO Error during pollStake: Received non-JSON response (Status ${response.status}): ${text.slice(0, 50)}...`);
        return;
      }
      const json = await response.json();
      const game = json?.data?.crash?.game;
      if (game && game.id !== this.lastGameId && game.state === "crashed") {
        this.lastGameId = game.id;
        const crashData = {
          id: game.id,
          multiplier: parseFloat(game.crashPoint),
          status: "crash",
          hash: { hash: game.hash }
        };
        this.history.unshift(crashData);
        if (this.history.length > 500) this.history.pop();
        await this._saveHistory();
        console.log(`DO: CRASHED @ ${crashData.multiplier.toFixed(2)}x. Total: ${this.history.length}`);
        for (const c of this.clients) {
          try {
            c.send(JSON.stringify({ type: "crash", data: crashData }));
          } catch (_) {
          }
        }
      }
    } catch (e) {
      console.error(`DO Error during pollStake: ${e.message}`);
    }
  }
  // --- WebSocket Handlers ---
  async fetch(request) {
    if (request.headers.get("upgrade")?.toLowerCase() !== "websocket") {
      return new Response("Expected WebSocket", { status: 400 });
    }
    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];
    server.accept();
    this._attachClient(server);
    return new Response(null, { status: 101, webSocket: client });
  }
  _attachClient(ws) {
    try {
      ws.send(JSON.stringify({ type: "history", data: this.history }));
    } catch (e) {
      console.error("DO: Error sending history:", e);
    }
    this.clients.add(ws);
    ws.addEventListener("close", () => this.clients.delete(ws));
    ws.addEventListener("error", () => this.clients.delete(ws));
  }
};

// src/worker-router.js
var worker_router_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/ws") {
      const upgrade = request.headers.get("upgrade");
      if (!upgrade || upgrade.toLowerCase() !== "websocket") {
        return new Response("WebSocket endpoint only", { status: 400 });
      }
      const id = env.ORACLE_DO.idFromName("GLOBAL_ORACLE");
      const stub = env.ORACLE_DO.get(id);
      return stub.fetch(request);
    }
    return new Response("Stake Oracle Worker Running", { status: 200 });
  }
};
export {
  OracleDO,
  worker_router_default as default
};
//# sourceMappingURL=worker-router.js.map
