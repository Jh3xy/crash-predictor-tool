
// liveFeed.js
// Modular Live Feed for Crash Oracle
// - Exports: initLiveFeed(options) and crashFeedState
// - Updates the UI inside the "#live-sync" card (keeps layout unchanged)
// - Falls back to a demo feed if real endpoints / sockets are not reachable

export const crashFeedState = {
  liveMultiplier: null,    // current live multiplier (string like "2.34x")
  last10: [],              // array of last 10 multipliers (strings)
  last200: [],             // array of last up to 200 multipliers (numbers)
  isConnected: false,
  roundId: null
};

const DEFAULTS = {
  wsUrl: "wss://bc.game/crash/socket", // <-- placeholder: replace if i find exact socket
  restHistoryUrl: "https://bc.game/api/crash/history?limit=", // <-- placeholder
  historyLimit: 200,
  displayLimit: 10,
  useMockOnFail: true,
  reconnectDelayBase: 1000
};

let opts = {};
let ws = null;
let reconnectAttempts = 0;
let reconnectTimer = null;
let mockTimer = null;

// Utility: format multiplier to string with 'x'
function fmt(x){
  if (x === null || x === undefined) return "0.00x";
  return (typeof x === "number" ? x.toFixed(2) : parseFloat(x).toFixed(2)) + "x";
}

function updateStateWithNewRound(mult){
  // mult: a number (e.g., 2.34) or an object {multiplier:2.34, roundId: 'abc'}
  let m = typeof mult === "object" ? Number(mult.multiplier) : Number(mult);
  if (Number.isNaN(m)) return;

  // push into last200 (maintain max length)
  crashFeedState.last200.push(m);
  if (crashFeedState.last200.length > opts.historyLimit) {
    crashFeedState.last200 = crashFeedState.last200.slice(-opts.historyLimit);
  }

  // update last10 (strings)
  const last10nums = crashFeedState.last200.slice(-opts.displayLimit);
  crashFeedState.last10 = last10nums.map(n => fmt(n));

  // current
  crashFeedState.liveMultiplier = fmt(m);

  // optionally set roundId
  if (typeof mult === "object" && mult.roundId) crashFeedState.roundId = mult.roundId;
}

function emitUpdate(){
  // Custom event so other modules can listen
  const ev = new CustomEvent("crashFeed:update", { detail: {...crashFeedState} });
  window.dispatchEvent(ev);
  // Also update UI directly
  updateUI();
}

function updateUI(){
  // Targets inside #live-sync card (keeps layout unchanged)
  const root = document.querySelector("#live-sync");
  if (!root) return;

  const multEl = root.querySelector(".multiple");
  if (multEl) multEl.textContent = crashFeedState.liveMultiplier ?? "—";

  const statusEl = root.querySelector(".status");
  if (statusEl) {
    statusEl.textContent = crashFeedState.isConnected ? "Connected" : "Not Connected";
    statusEl.classList.toggle("connected", crashFeedState.isConnected);
    statusEl.classList.toggle("disconnected", !crashFeedState.isConnected);
  }

  const grid = root.querySelector(".multiples-grid");
  if (grid) {
    grid.innerHTML = "";
    // show the last `displayLimit` values in order (oldest -> newest)
    const arr = crashFeedState.last10.slice().reverse(); // reverse to show newest last (match your grid visuals if desired)
    for (let i = 0; i < arr.length; i++){
      const d = document.createElement("div");
      d.className = "center";
      d.textContent = arr[i];
      grid.appendChild(d);
    }
    // fill empty slots if less than displayLimit
    for (let i = arr.length; i < opts.displayLimit; i++){
      const d = document.createElement("div");
      d.className = "center";
      d.textContent = "—";
      grid.appendChild(d);
    }
  }
}

// Fetch REST history (last N multipliers)
async function fetchHistory(limit = opts.historyLimit){
  try {
    // If the placeholder REST endpoint is left, it will probably fail due to CORS / incorrect path.
    // We attempt it, but handle failures gracefully.
    const url = opts.restHistoryUrl + encodeURIComponent(limit);
    const res = await fetch(url, {cache: "no-store"});
    if (!res.ok) throw new Error("History fetch failed: " + res.status);
    const json = await res.json();
    // Expected: array of rounds where each round contains multiplier (number) or multiplier as string.
    // Attempt to normalize.
    const numbers = Array.isArray(json) ? json.map(r => {
      if (typeof r === "number") return r;
      if (r && typeof r.multiplier !== "undefined") return Number(r.multiplier);
      if (typeof r.value !== "undefined") return Number(r.value);
      return Number(r);
    }).filter(n => !Number.isNaN(n)) : [];
    if (numbers.length === 0) throw new Error("Empty history or unexpected format");
    crashFeedState.last200 = numbers.slice(-limit);
    // update derived fields
    const last10nums = crashFeedState.last200.slice(-opts.displayLimit);
    crashFeedState.last10 = last10nums.map(n => fmt(n));
    if (crashFeedState.last200.length) {
      crashFeedState.liveMultiplier = fmt(crashFeedState.last200[crashFeedState.last200.length - 1]);
    }
    emitUpdate();
    return true;
  } catch (err) {
    console.warn("[liveFeed] fetchHistory failed:", err.message);
    return false;
  }
}

// WebSocket connect (with basic backoff reconnect)
function setupWebSocket(){
  if (!opts.wsUrl) {
    console.warn("[liveFeed] No wsUrl provided; skipping websocket.");
    return startMockFeedIfAllowed();
  }

  try {
    ws = new WebSocket(opts.wsUrl);
  } catch (err) {
    console.warn("[liveFeed] WebSocket creation failed:", err);
    return startMockFeedIfAllowed();
  }

  ws.addEventListener("open", () => {
    reconnectAttempts = 0;
    crashFeedState.isConnected = true;
    emitUpdate();
    console.log("[liveFeed] websocket open");
  });

  ws.addEventListener("message", ev => {
    try {
      const data = JSON.parse(ev.data);
      // The real BC socket event format varies. We'll attempt to detect common shapes:
      // Example shapes:
      // {type: "round.update", multiplier: 1.23, roundId: "..." }
      // {event: "multiplier", value: 1.23}
      // {multiplier: 1.23}
      // Or: nested: {data: {multiplier: 1.23}}
      let parsed = null;
      if (data && typeof data === "object") {
        if (data.multiplier) parsed = {multiplier: Number(data.multiplier), roundId: data.roundId || null};
        else if (data.value) parsed = {multiplier: Number(data.value)};
        else if (data.data && data.data.multiplier) parsed = {multiplier: Number(data.data.multiplier), roundId: data.data.roundId || null};
        else if (data.event === "multiplier_update" && data.payload) parsed = {multiplier: Number(data.payload.multiplier)};
        // fallback: search for any number-looking prop
        else {
          for (const k of Object.keys(data)){
            if (!isNaN(Number(data[k]))) {
              parsed = {multiplier: Number(data[k])};
              break;
            }
          }
        }
      }
      if (parsed && parsed.multiplier) {
        updateStateWithNewRound(parsed);
        emitUpdate();
      }
    } catch (err) {
      // If message isn't JSON, ignore
      // console.warn("[liveFeed] ws msg parse err", err);
    }
  });

  ws.addEventListener("close", () => {
    crashFeedState.isConnected = false;
    emitUpdate();
    console.log("[liveFeed] websocket closed");
    // reconnect logic
    if (opts.useMockOnFail) startMockFeedIfAllowed();
    scheduleReconnect();
  });

  ws.addEventListener("error", (e) => {
    console.warn("[liveFeed] websocket error", e);
    crashFeedState.isConnected = false;
    emitUpdate();
    // close socket to trigger reconnect path
    try { ws.close(); } catch(e){}
  });
}

function scheduleReconnect(){
  reconnectAttempts++;
  const delay = Math.min(30000, opts.reconnectDelayBase * Math.pow(2, reconnectAttempts));
  if (reconnectTimer) clearTimeout(reconnectTimer);
  reconnectTimer = setTimeout(() => {
    console.log("[liveFeed] reconnect attempt", reconnectAttempts);
    setupWebSocket();
  }, delay);
}

// Mock / demo feed (fires if no socket or fetch is available)
function startMockFeedIfAllowed(){
  if (!opts.useMockOnFail) return;
  if (mockTimer) return;
  console.log("[liveFeed] starting MOCK feed (demo mode). Replace endpoints to use real feed.");
  crashFeedState.isConnected = false;
  // seed history with random-ish numbers if empty
  if (!crashFeedState.last200 || crashFeedState.last200.length === 0){
    crashFeedState.last200 = Array.from({length: Math.min(opts.historyLimit, 100)}, () => {
      // generate a distribution with many small crashes and occasional large ones
      const r = Math.random();
      if (r < 0.7) return +(1 + Math.random() * 2).toFixed(2); // 1.00 - 3.00
      if (r < 0.95) return +(3 + Math.random() * 7).toFixed(2); // 3 - 10
      return +(10 + Math.random() * 90).toFixed(2); // rare big wins
    });
    crashFeedState.last10 = crashFeedState.last200.slice(-opts.displayLimit).map(n => fmt(n));
    crashFeedState.liveMultiplier = fmt(crashFeedState.last200[crashFeedState.last200.length - 1]);
    emitUpdate();
  }

  mockTimer = setInterval(() => {
    // every 2.5 - 4s produce a new "round"
    const r = Math.random();
    let m;
    if (r < 0.75) m = +(1 + Math.random() * 2);
    else if (r < 0.95) m = +(3 + Math.random() * 7);
    else m = +(10 + Math.random() * 90);
    updateStateWithNewRound(m);
    emitUpdate();
  }, 3000 + Math.random()*1000);
}

function stopMockFeed(){
  if (mockTimer) {
    clearInterval(mockTimer);
    mockTimer = null;
  }
}

// Public init function
export async function initLiveFeed(config = {}){
  opts = {...DEFAULTS, ...config};
  // normalize numbers
  opts.historyLimit = Number(opts.historyLimit) || DEFAULTS.historyLimit;
  opts.displayLimit = Number(opts.displayLimit) || DEFAULTS.displayLimit;

  // initial UI fill
  updateUI();

  // 1) try fetch history
  const ok = await fetchHistory(opts.historyLimit);
  if (!ok) {
    console.warn("[liveFeed] history fetch failed; will continue with mock or websocket.");
  }

  // 2) try WebSocket
  setupWebSocket();

  // 3) if no ws, the setupWebSocket will start mock if allowed (or you can force mock)
  // expose current state immediately
  emitUpdate();

  // return the state and helpers
  return {
    state: crashFeedState,
    stop: () => { try { if (ws) ws.close(); stopMockFeed(); } catch(e){} },
    fetchHistory: (n) => fetchHistory(n)
  };
}
