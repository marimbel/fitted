/**
 * agents/stylistPipeline.js
 *
 * The ADK agent architecture described in the proposal response:
 *
 *   StyleAnalyst -> loop( LookBuilder <-> LookCritic, maxIterations: 3 )
 *
 * One Cloud Run service, agents run in-process (per the review
 * feedback) rather than as a separate deployment.
 *
 * Flow, per round of the loop:
 *   1. LookBuilder drafts (or revises) a set of looks from the
 *      Style DNA (StyleAnalyst's output) + the style request.
 *   2. A beforeAgentCallback runs lookRules.checkLookRules() on each
 *      look and stores the result as `ruleCheck` in session state —
 *      pure code, no model involved, so the arithmetic is always right.
 *   3. LookCritic (a Gemini call constrained by schemas.critiqueSchema)
 *      sees `ruleCheck` + the Style DNA + the request, and returns a
 *      critique: hard-rule violations plus its own styleFit/weather
 *      judgement, each issue naming a concrete fix.
 *   4. An afterAgentCallback forces verdict: "revise" if any code rule
 *      failed (the model can never wave through an over-budget look).
 *      On "pass" it sets escalate = true, which ends the ADK LoopAgent.
 *   5. If revising, LookBuilder's next-round instruction includes the
 *      previous draft + critique.issues, and must address every one.
 *
 * The loop is bounded at 3 iterations; how many rounds a given run took
 * is saved with the result (lookSets.critique.iterations) and shown in
 * the UI, per the proposal response.
 *
 * TODO: implement using the actual ADK SDK/APIs — read the ADK docs
 * before writing this. This file should stay the single entry point
 * routes/looks.js calls; nothing else should talk to ADK directly.
 */
import { checkLookRules } from "./lookRules.js";
import { critiqueSchema } from "./schemas.js";

const MAX_ITERATIONS = 3;

export async function runStylistPipeline({ uid, photoAnalyses, styleRequest }) {
  throw new Error("runStylistPipeline not implemented yet");
}
