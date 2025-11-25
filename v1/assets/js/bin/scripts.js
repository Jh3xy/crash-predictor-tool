

// script.js — clean bootstrap, no duplicates, no clutter
import { initLiveSync } from "./js/liveSync";
document.addEventListener("DOMContentLoaded", async () => {
  console.log("[script] DOM ready — booting LiveSync…");

  // UI helpers
  const statusRoot = document.querySelector("#live-sync");
  const statusEl = statusRoot ? statusRoot.querySelector(".status") : null;

  function setStatus(state, extra="") {
    if (!statusEl) return console.warn("[script] Missing status element");
    const dot = `<span class="status-dot"></span>`;
    statusEl.className = "status " + state;
    statusEl.innerHTML = dot + " " + extra;
    console.log(`[script] Status → ${state}`, extra);
  }

  // Init the live sync
  const feed = await initLiveSync({
    wsUrl: "wss://bc.game/crash/socket", 
    restHistoryUrl: "https://bc.game/api/crash/history?limit=",
    historyLimit: 200,
    displayLimit: 10,
    useMockOnFail: true
  });

  // Initial status
  setStatus(feed.state.isConnected ? "connected" : "disconnected",
            feed.state.isConnected ? "Connected" : "Not Connected");

  // Event: feed updates
  window.addEventListener("crashFeed:update", (ev) => {
    const state = ev.detail;
    
    // UI toggle
    if (state.isConnected) {
      setStatus("connected", "Connected");
    } else if (state.isMock) {
      setStatus("mock", "Mock Mode");
    } else {
      setStatus("disconnected", "Not Connected");
    }

    // Expose for debugging
    window.crashFeedState = state;

    console.log("[script] crashFeed:update → last200:", state.last200?.length);
  });

  // Event: auto reconnecting
  window.addEventListener("crashFeed:reconnecting", () => {
    setStatus("reconnecting", "Reconnecting…");
  });

  // -------------------------
  // TAB behavior
  // -------------------------
  const tabs = document.querySelectorAll(".tab");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
    });
  });

  // -------------------------
  // LIVE SYNC → UI CARD HOOK
  // -------------------------
  console.log("[script] Hooking UI elements…");

  const currentEl = document.querySelector(".multiple");
  const recentGrid = document.querySelector(".multiples-grid");

  if (!currentEl || !recentGrid) {
    console.warn("[script] Live Sync UI elements missing in DOM");
  }

  function updateLiveSyncCard(state) {
    if (!state || !state.last200) return;

    const recent = state.last200.slice(0, 8);

    if (recent[0]) {
      currentEl.textContent = recent[0].crashPoint.toFixed(2) + "x";
    }

    recentGrid.innerHTML = "";
    recent.forEach((r) => {
      const div = document.createElement("div");
      div.className = "center";
      div.textContent = r.crashPoint.toFixed(2) + "x";
      recentGrid.appendChild(div);
    });
  }

  window.addEventListener("crashFeed:update", (ev) => {
    updateLiveSyncCard(ev.detail);
  });

  console.log("[script] Initialization complete.");
});
