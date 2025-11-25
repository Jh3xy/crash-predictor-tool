

// // // predictor.js
// // // ----------------------------------------------------
// // // Simple hybrid predictor engine for Crash multipliers
// // // ----------------------------------------------------

// // // Internal state
// // export const predictorState = {
// //   history: [],      // last 200 multipliers
// //   maxHistory: 200,
// //   ready: false,     // becomes true once initialized
// //   lastPrediction: null
// // };


// // // ----------------------------------------------------
// // // initPredictor()
// // // Called by script.js on DOM ready
// // // ----------------------------------------------------
// // export function initPredictor() {
// //   console.log("[predictor] initialized.");

// //   predictorState.ready = true;

// //   // Listen for updates from liveFeed.js
// //   window.addEventListener("crashFeed:update", (ev) => {
// //     const data = ev.detail;

// //     // Uses full history array from liveFeed.js
// //     if (Array.isArray(data.history)) {
// //       updateHistory(data.history);
// //     }
// //   });

// //   return predictorState;
// // }


// // // ----------------------------------------------------
// // // updateHistory()
// // // Keeps only last 200 values
// // // ----------------------------------------------------
// // function updateHistory(arr) {
// //   if (!Array.isArray(arr)) return;

// //   const trimmed = arr.slice(-predictorState.maxHistory); // last N

// //   predictorState.history = trimmed;

// //   console.log(
// //     "[predictor] history update:",
// //     trimmed.length,
// //     "items"
// //   );
// // }


// // // ----------------------------------------------------
// // // predictNext()
// // // Main prediction function
// // // Called when user clicks "Predict"
// // // ----------------------------------------------------
// // export function predictNext() {
// //   const h = predictorState.history;

// //   // Guard: no data yet
// //   if (h.length === 0) {
// //     console.warn("[predictor] cannot predict — history empty.");
// //     return {
// //       ok: false,
// //       reason: "Not enough data yet."
// //     };
// //   }

// //   // Debug
// //   console.log("[predictor] running prediction with", h.length, "items.");


// //   // --------------------------------------------------------
// //   // 1. Basic feature extraction
// //   // --------------------------------------------------------
// //   const last = h[h.length - 1];
// //   const avg = h.reduce((a, b) => a + b, 0) / h.length;
// //   const recentAvg = h.slice(-20).reduce((a, b) => a + b, 0) / Math.min(20, h.length);

// //   const volatility = standardDeviation(h.slice(-30));

// //   // --------------------------------------------------------
// //   // 2. Hybrid scoring model (light, fast, runs in browser)
// //   // --------------------------------------------------------
// //   let next = 1.00;

// //   next += (last - 1) * 0.15;
// //   next += (recentAvg - 1) * 0.1;
// //   next += (Math.random() - 0.5) * 0.3;
// //   next += volatility * 0.05;


// //   // Bound the result realistically
// //   next = Math.max(1.01, parseFloat(next.toFixed(2)));

// //   // Record it
// //   predictorState.lastPrediction = next;

// //   // Fire event for UI
// //   window.dispatchEvent(
// //     new CustomEvent("predictor:prediction", {
// //       detail: {
// //         prediction: next,
// //         historyLength: h.length
// //       }
// //     })
// //   );

// //   return {
// //     ok: true,
// //     prediction: next,
// //     historyLength: h.length
// //   };
// // }


// // // ----------------------------------------------------
// // // Standard deviation helper
// // // ----------------------------------------------------
// // function standardDeviation(nums) {
// //   if (!nums.length) return 0;

// //   const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
// //   const sq = nums.map(n => Math.pow(n - mean, 2));
// //   return Math.sqrt(sq.reduce((a, b) => a + b, 0) / nums.length);
// // }



// // // ----------------------------------------------------
// // // Compatibility wrappers for script.js
// // // ----------------------------------------------------
// // export function predictNow() {
// //   return predictNext();
// // }

// // export function simulateEvaluation() {
// //   // Later you can add confidence scoring here.
// //   return { ok: true };
// // }



// // predictor.js
// export function initPredictor(callbacks = {}) {
  
//   console.log("[predictor] initialized.");

//   let lastMultiplier = 1.00;
//   let status = "disconnected";

//   // --- INTERNAL UTILS -----------------------------------

//   function setStatus(newStatus) {
//     status = newStatus;
//     if (callbacks.onStatusChange) {
//       callbacks.onStatusChange(newStatus);
//     }
//   }

//   function updateMultiplier(value) {
//     lastMultiplier = value;
//     if (callbacks.onMultiplierUpdate) {
//       callbacks.onMultiplierUpdate(value);
//     }
//   }

//   // --- PUBLIC API ----------------------------------------

//   function getLatestMultiplier() {
//     return lastMultiplier;
//   }

//   async function predictNext(currentValue) {
//     // TEMPORARY MOCK PREDICTOR
//     // (so UI works even before we create real logic)
//     await sleep(300);

//     // mock random logic
//     const noise = (Math.random() * 0.25);
//     const base = currentValue * (0.90 + noise);

//     const result = Math.max(1.00, base);

//     return parseFloat(result.toFixed(2));
//   }

//   function sleep(ms) {
//     return new Promise(res => setTimeout(res, ms));
//   }

//   // Return predictor API
//   return {
//     getLatestMultiplier,
//     predictNext,
//     // called from liveFeed.js later
//     __feed_updateMultiplier: updateMultiplier,
//     __feed_setStatus: setStatus
//   };
// }