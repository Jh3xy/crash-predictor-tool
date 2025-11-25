


// predictor.js
export function initPredictor(callbacks = {}) {
  
  console.log("[predictor] initialized.");

  let lastMultiplier = 1.00;
  let status = "disconnected";

  // --- INTERNAL UTILS -----------------------------------

  function setStatus(newStatus) {
    status = newStatus;
    if (callbacks.onStatusChange) {
      callbacks.onStatusChange(newStatus);
    }
  }

  function updateMultiplier(value) {
    lastMultiplier = value;
    if (callbacks.onMultiplierUpdate) {
      callbacks.onMultiplierUpdate(value);
    }
  }

  // --- PUBLIC API ----------------------------------------

  function getLatestMultiplier() {
    return lastMultiplier;
  }

  async function predictNext(currentValue) {
    // TEMPORARY MOCK PREDICTOR
    // (so UI works even before we create real logic)
    await sleep(300);

    // mock random logic
    const noise = (Math.random() * 0.25);
    const base = currentValue * (0.90 + noise);

    const result = Math.max(1.00, base);

    return parseFloat(result.toFixed(2));
  }

  function sleep(ms) {
    return new Promise(res => setTimeout(res, ms));
  }

  // Return predictor API
  return {
    getLatestMultiplier,
    predictNext,
    // called from liveFeed.js later
    __feed_updateMultiplier: updateMultiplier,
    __feed_setStatus: setStatus
  };
}


