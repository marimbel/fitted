/**
 * tryOnService.js
 *
 * This file isolates the "virtual try-on" operation behind a single
 * function, `simulateTryOn`, so the rest of the app never talks to a
 * fake API directly.
 *
 * PROJECT 2: Replace this simulated operation with the Express API
 * endpoint for Google Virtual Try-On, e.g.:
 *
 *   export async function requestTryOn(userPhoto, product) {
 *     const response = await fetch("/api/try-on", {
 *       method: "POST",
 *       body: buildTryOnFormData(userPhoto, product),
 *     });
 *     return response.json();
 *   }
 *
 * Because every component that needs a try-on result calls this one
 * function, swapping the implementation above is the *only* change
 * required to go from "simulated" to "real" — no component code needs
 * to be rewritten.
 */
export function simulateTryOn(userPhoto, product) {
  return new Promise((resolve) => {
    // A short artificial delay so the loading state ("Preparing your
    // look...") in TryOnPanel is visible, the same way a real network
    // request to an AI service would take a moment to respond.
    setTimeout(() => {
      resolve({
        success: true,
        message:
          "AI-powered virtual try-on will be connected in the next version of Fitted.",
      });
    }, 1600);
  });
}
