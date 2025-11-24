


import { initPredictor } from "./predictor.js";

document.addEventListener("DOMContentLoaded", () => {

  // UI Elements
  const predictBtn = document.querySelector("#predict-btn");
  const predictedValueBox = document.querySelector("#predicted-value");
  const liveStatusDot = document.querySelector("#live-status-dot");
  const currentMultiplierBox = document.querySelector("#current-multiplier");

  // Init predictor engine
  const predictor = initPredictor({
    onMultiplierUpdate: (value) => {
      if (!currentMultiplierBox) return;
      currentMultiplierBox.textContent = value.toFixed(2) + "x";
    },
    onStatusChange: (status) => {
      if (!liveStatusDot) return;
      if (status === "connected") liveStatusDot.style.background = "green";
      if (status === "connecting") liveStatusDot.style.background = "yellow";
      if (status === "disconnected") liveStatusDot.style.background = "red";
    }
  });

  // Predict button handler
  if (predictBtn) {
    predictBtn.addEventListener("click", async () => {
      try {
        predictedValueBox.textContent = "Predicting...";
        predictedValueBox.classList.add("loading");

        const lastValue = predictor.getLatestMultiplier();

        const nextCrash = await predictor.predictNext(lastValue);

        predictedValueBox.classList.remove("loading");
        predictedValueBox.textContent = nextCrash.toFixed(2) + "x";

      } catch (err) {
        predictedValueBox.textContent = "Prediction failed";
        console.error("UI Prediction Error:", err);
      }
    });
  }
});





