
// // verifier.js

// export function initVerifier() {
//     const form = document.querySelector(".verifier form");
//     if (!form) return;

//     form.addEventListener("submit", (e) => {
//         e.preventDefault();

//         const predictedInput = document.querySelector("#predicted");
//         const actualInput = document.querySelector("#actual");

//         const predicted = parseFloat(predictedInput.value);
//         const actual = parseFloat(actualInput.value);

//         if (isNaN(predicted) || isNaN(actual)) {
//             alert("Enter valid numbers.");
//             return;
//         }

//         const accuracy = calculateAccuracy(predicted, actual);

//         // You can update the UI here or send it back to main script.
//         displayAccuracy(accuracy);

//         // reset form
//         form.reset();
//     });
// }

// function calculateAccuracy(predicted, actual) {
//     const percentage = (Math.min(predicted, actual) / Math.max(predicted, actual)) * 100;

//     return {
//         predicted,
//         actual,
//         percentage: percentage.toFixed(2),
//         status: percentage >= 70 ? "green" : "blue"
//     };
// }

// // Temporary UI output — we’ll wire it properly to your table later
// function displayAccuracy(result) {
//     const output = document.querySelector(".accuracy-output");

//     if (output) {
//         output.innerHTML = `
//             <p><strong>Predicted:</strong> ${result.predicted}x</p>
//             <p><strong>Actual:</strong> ${result.actual}x</p>
//             <p><strong>Accuracy:</strong> 
//                 <span class="${result.status}">
//                     ${result.percentage}%
//                 </span>
//             </p>
//         `;
//     }

//     console.log("Verifier result:", result);
// }



