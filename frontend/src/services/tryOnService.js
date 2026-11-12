/**
 * tryOnService.js
 *
 * This file isolates the "virtual try-on" operation behind a single
 * function, `simulateMultiAngleTryOn`, so the rest of the app never
 * talks to a fake API directly.
 *
 * It returns one result PER ANGLE (front / side / back) instead of a
 * single flat message -- that's the "rotate and see it from different
 * angles" experience TryOnStage.jsx presents. Each angle is still
 * simulated for now: no image is actually generated.
 *
 * PROJECT 2: Replace the body of this function with real calls to the
 * Express API endpoint(s) that generate each angle, e.g.:
 *
 *   export async function requestMultiAngleTryOn(userPhoto, product) {
 *     const response = await fetch("/api/try-on", {
 *       method: "POST",
 *       body: buildTryOnFormData(userPhoto, product),
 *     });
 *     return response.json(); // { success, angles: [{ key, label, imageUrl }] }
 *   }
 *
 * Because every component that needs a try-on result calls this one
 * function and reads the same `{ success, angles }` shape, swapping the
 * implementation above is the *only* change required to go from
 * "simulated" to "real, per-angle images" -- no component code needs
 * to change shape, only what each angle's result actually contains.
 */

const ANGLES = [
  { key: "front", label: "Front" },
  { key: "side", label: "Side" },
  { key: "back", label: "Back" },
];

export function simulateMultiAngleTryOn(userPhoto, product) {
  return new Promise((resolve) => {
    // A short artificial delay so the loading state ("Preparing your
    // look...") in TryOnPanel is visible, the same way a real network
    // request to an AI service would take a moment to respond per angle.
    setTimeout(() => {
      resolve({
        success: true,
        angles: ANGLES.map((angle) => ({
          ...angle,
          message:
            "AI-powered virtual try-on will be connected in the next version of Fitted.",
        })),
      });
    }, 1600);
  });
}
