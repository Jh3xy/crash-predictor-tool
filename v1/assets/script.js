
// script.js (MAIN bootstrap) - module
// Initializes liveFeed + predictor, updates UI status dot, wires Predict button
// Console logs added for debug.

// script.js (main entry - module)
// import { initLiveFeed, crashFeedState } from "./js/liveFeed.js";
// import { initPredictor } from "./js/predictor.js";
// import "./js/predictor.ui.js";


function setStatusUI(state) {
  // state: "connected" | "reconnecting" | "disconnected"
  const root = document.querySelector("#live-sync");
  if (!root) return console.warn("[script] #live-sync not found for status update");
  const statusEl = root.querySelector(".status");
  if (!statusEl) return console.warn("[script] .status element missing inside #live-sync");
  // create dot + text
  const dotSpan = `<span class="status-dot" aria-hidden="true"></span>`;
  let text = " Not Connected";
  if (state === "connected") text = " Connected";
  else if (state === "reconnecting") text = " Reconnecting…";
  else text = " Not Connected";

  statusEl.innerHTML = `${dotSpan}${text}`;
  statusEl.classList.remove("connected","reconnecting","disconnected");
  statusEl.classList.add(state);
  console.log(`[script] Status UI set -> ${state}`);
}

function attachPredictButtonHandlers(predictorApi) {
  const predictorCard = document.querySelector("#ai-predictor");
  if (!predictorCard) return console.warn("[script] #ai-predictor not found");
  const btn = predictorCard.querySelector(".btn");
  const predictionContainer = predictorCard.querySelector(".prediction");

  if (!btn) return console.warn("[script] Predict button not found");

  btn.addEventListener("click", async (ev) => {
    try {
      console.log("[script] Predict button clicked");
      // Loading UI
      const prevHTML = predictionContainer.innerHTML;
      predictionContainer.innerHTML = `<div class="pred-loading">Analyzing…</div>`;
      btn.disabled = true;

      // Use the latest crashFeedState
      const currentHistory = (window.crashFeedState && Array.isArray(window.crashFeedState.last200))
        ? window.crashFeedState.last200.slice() : [];

      const available = currentHistory.length;
      console.log(`[script] Available history length: ${available}`);

      // If not enough data, still run prediction but show warn / reduce visible confidence
      let result = null;
      if (typeof predictorApi.predictNow === "function") {
        result = predictorApi.predictNow();
      } else if (typeof predictorApi.simulateEvaluation === "function") {
        result = predictorApi.simulateEvaluation(currentHistory);
      } else {
        console.warn("[script] predictor API missing predictNow/simulateEvaluation");
      }

      // If the predictor uses events and didn't return, run direct call
      if (!result) {
        try {
          result = predictorApi.simulateEvaluation(currentHistory);
        } catch (e) {
          console.error("[script] Predictor invocation failed:", e);
          result = null;
        }
      }

      // If still null, show message and restore
      if (!result) {
        predictionContainer.innerHTML = `<div class="pred-error">Prediction failed — check console</div>`;
        console.error("[script] Prediction returned null/undefined");
        btn.disabled = false;
        return;
      }

      // Adjust displayed confidence if history < recommended (200)
      const recommended = 200;
      let displayedConfidence = result.confidence; // [0..1]
      let confidenceNote = "";
      if (available < recommended) {
        const scale = Math.max(0.25, available / recommended); // don't scale to 0, keep some confidence
        displayedConfidence = +(displayedConfidence * scale).toFixed(2);
        confidenceNote = ` (reduced because only ${available}/${recommended} rounds available)`;
        console.log(`[script] Confidence scaled by ${scale.toFixed(2)} due to partial history`);
      }

      // Build the HTML to show (instant update)
      const html = `
        <div class="pred-card">
          <div><strong>Estimate:</strong> ${result.point}x</div>
          <div><strong>Range:</strong> ${result.range.min}x – ${result.range.max}x</div>
          <div><strong>Confidence:</strong> ${Math.round(displayedConfidence * 100)}% ${confidenceNote}</div>
          <div><strong>Risk:</strong> ${result.risk}</div>
          <div style="font-size:.78rem;color:var(--text-secondary);margin-top:.4rem">
            Weights — R:${(result.weights.recency||0).toFixed(2)} V:${(result.weights.volatility||0).toFixed(2)} S:${(result.weights.streak||0).toFixed(2)}
          </div>
        </div>
      `;
      predictionContainer.innerHTML = html;

      // Emit an event so history/logger modules can record prediction
      const predEvent = new CustomEvent("aiPred:made", { detail: { result, availableHistory: available, timestamp: Date.now() }});
      window.dispatchEvent(predEvent);
      console.log("[script] Prediction emitted to aiPred:made", predEvent.detail);

    } catch (err) {
      console.error("[script] Error during prediction click handler:", err);
      predictionContainer.innerHTML = `<div class="pred-error">Error: ${err.message}</div>`;
    } finally {
      btn.disabled = false;
    }
  });

  console.log("[script] Predict button handler attached");
}

document.addEventListener("DOMContentLoaded", async () => {
  console.log("[script] DOM ready — initializing live feed + predictor");

  // initialize live feed
  const feed = await initLiveFeed({
    wsUrl: "wss://bc.game/crash/socket", // placeholder
    restHistoryUrl: "https://bc.game/api/crash/history?limit=", // placeholder
    historyLimit: 200,
    displayLimit: 10,
    useMockOnFail: true
  });

  // update status according to whether mock/live
  // if liveFeed sets crashFeedState.isConnected true/false we respond to updates
  // initial set
  setStatusUI(feed.state.isConnected ? "connected" : "disconnected");

  // listen for live feed updates
  window.addEventListener("crashFeed:update", (ev) => {
    const state = ev.detail;
    // if the module marks isConnected true it's real connection, otherwise disconnected/mock
    if (state.isConnected) setStatusUI("connected");
    else setStatusUI("disconnected");
    // debug
    console.log("[script] crashFeed:update received — last200 length:", (state.last200 || []).length);
    // expose state for debugging
    window.crashFeedState = state;
  });

  // also listen to possible reconnect states via transient events
  // (liveFeed doesn't currently emit 'connecting' events; we use websocket events to set reconnect)
  // if you want more nuanced behavior, we can add explicit events in liveFeed.js (recommended)
  // For now schedule a 'reconnecting' indicator when socket is closed and reconnect is scheduled:
  window.addEventListener("crashFeed:reconnecting", () => {
    setStatusUI("reconnecting");
  });

  // initialize predictor (it will listen to crashFeed:update)
  const predictorApi = initPredictor({
    displayElementSelector: "#ai-predictor .prediction",
    recencyWindow: 20,
    volatilityWindow: 50,
    streakWindow: 100
  });

  // wire up the manual Predict button to predictorApi
  attachPredictButtonHandlers(predictorApi);

  // as an optimization: if the feed.state already had last200 from fetchHistory, trigger initial prediction display
  if (Array.isArray(feed.state.last200) && feed.state.last200.length >= 8) {
    try {
      const initialRes = predictorApi.predictNow();
      if (initialRes) {
        console.log("[script] Initial prediction ready:", initialRes);
        // update the UI area as if user clicked predict (but not emitting aiPred:made)
        const predictionContainer = document.querySelector("#ai-predictor .prediction");
        if (predictionContainer) {
          predictionContainer.innerHTML = `
            <div class="pred-card">
              <div><strong>Estimate:</strong> ${initialRes.point}x</div>
              <div><strong>Range:</strong> ${initialRes.range.min}x – ${initialRes.range.max}x</div>
              <div><strong>Confidence:</strong> ${Math.round(initialRes.confidence * 100)}%</div>
              <div><strong>Risk:</strong> ${initialRes.risk}</div>
            </div>
          `;
        }
      }
    } catch (e) {
      console.warn("[script] initial prediction failed:", e);
    }
  }

  // expose to console for debugging
  window._liveFeed = feed;
  window._predictorApi = predictorApi;

  console.log("[script] initialization complete.");
});




// Wait for DOM ready
document.addEventListener("DOMContentLoaded", async () => {
  // initialize with defaults: uses placeholders (see liveFeed.js)
  const feed = await initLiveFeed({
    // If you find the real endpoints, replace these two:
    wsUrl: "wss://bc.game/crash/socket", // placeholder - replace if you find real socket URL
    restHistoryUrl: "https://bc.game/api/crash/history?limit=", // placeholder - replace if you find real REST endpoint

    historyLimit: 200,
    displayLimit: 10,
    useMockOnFail: true
  });

  // Example: listen for updates from liveFeed
  window.addEventListener("crashFeed:update", (ev) => {
    // other modules (predictor, history logger) can react here
    // ev.detail contains the full state snapshot
    // console.log("Crash feed updated", ev.detail);
  });

  // Demo: expose feed state for debugging in console
  (window).crashFeedState = crashFeedState;
});



// -------------------------
// Tabs 
// -------------------------
const tabs = document.querySelectorAll('.tab');
tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
        tabs.forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
    });
});

// -------------------------
// Crash Verifier Logic
// -------------------------

// HMAC-SHA256 using Web Crypto API
async function hmacSHA256(key, message) {
    const enc = new TextEncoder();
    console.log("HMAC called with:", { key, message });

    const keyData = enc.encode(key);

    try {
        const cryptoKey = await crypto.subtle.importKey(
            "raw",
            keyData,
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["sign"]
        );
        console.log("Crypto key imported:", cryptoKey);

        const signature = await crypto.subtle.sign(
            "HMAC",
            cryptoKey,
            enc.encode(message)
        );

        console.log("Signature generated:", signature);

        return new Uint8Array(signature);
    } catch (err) {
        console.error("HMAC error:", err);
        throw err;
    }
}

// BC.Game Crash Calculation
function calculateCrashFromHash(hashBytes) {
    console.log("Calculating crash from hash bytes:", hashBytes);

    const hashHex = Array.from(hashBytes)
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");

    console.log("Full hash hex:", hashHex);

    // First 64 bits (16 hex chars)
    const h = BigInt("0x" + hashHex.slice(0, 16));
    console.log("First 64-bit value (h):", h);

    // BC.Game 1/33 rule
    if (h % 33n === 0n) {
        console.log("Hit 1/33 condition → returning 1.00");
        return "1.00";
    }

    // Extract top 32 bits
    const e = Number(h >> 32n);
    console.log("Top 32-bit value (e):", e);

    const numerator = Math.pow(2, 32);
    const raw = Math.floor((100 * numerator) / (e + 1)) / 100;

    console.log("Raw multiplier:", raw);

    return raw.toFixed(2);
}

// -------------------------
// Form Submit
// -------------------------
const crashForm = document.querySelector("#crash-verfier form");
const outputEl = document.querySelector(".accuracy-output");

if (!crashForm) {
    console.error("Form NOT FOUND in DOM.");
}

crashForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    console.log("Form submitted");

    const clientSeed = document.getElementById("client-seed").value.trim();
    const serverSeed = document.getElementById("server-seed").value.trim();
    const nonce = document.getElementById("nonce").value.trim();

    console.log("Input values:", { clientSeed, serverSeed, nonce });

    if (!clientSeed || !serverSeed || !nonce) {
        outputEl.innerText = "Please fill all fields.";
        return;
    }

    // BC.Game format uses DASH: clientSeed-nonce
    const message = `${clientSeed}-${nonce}`;
    console.log("Message for HMAC:", message);

    let hashBytes = null;

    try {
        hashBytes = await hmacSHA256(serverSeed, message);
        console.log("HMAC output bytes:", hashBytes);
    } catch (err) {
        console.error("HMAC failed:", err);
        outputEl.innerText = "Error computing hash.";
        return;
    }

    const crash = calculateCrashFromHash(hashBytes);
    console.log("Calculated crash multiplier:", crash);

    outputEl.innerText = `Crash Value: ${crash}x`;
});
