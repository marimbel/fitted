/**
 * agents/schemas.js
 *
 * Structured-output schemas enforced on Gemini's responses within the
 * agent pipeline. Defining these explicitly (rather than hoping the
 * model returns well-formed JSON) is what makes LookCritic's output
 * reliable enough for afterAgentCallback to act on programmatically.
 *
 * This is the exact shape described in the proposal review response —
 * keep it in sync with that document if it changes.
 */

// TODO: express this as a real ADK/Gemini structured-output schema
// object once you're in the ADK docs — this is the shape it should
// produce, as a reference:
//
// {
//   verdict: "pass" | "revise",
//   issues: [
//     {
//       lookIndex: number,
//       rule: "budget" | "formality" | "weather" | "avoid" | "category" | "styleFit" | "duplicate" | "unknownProduct",
//       problem: string,
//       fix: string,
//     },
//   ],
//   summary: string,
// }
export const critiqueSchema = {
  // TODO: fill in with the actual ADK schema definition.
};
