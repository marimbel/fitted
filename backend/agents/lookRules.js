/**
 * agents/lookRules.js
 *
 * The hard, deterministic rules LookCritic checks before the model
 * weighs in at all — per the proposal response: "these are facts, so
 * the model never has to do arithmetic." This file is plain code, not
 * an agent; stylistPipeline's beforeAgentCallback runs it and writes
 * the result to session state as `ruleCheck` for LookCritic to read.
 *
 * TODO: implement each rule. Signature sketch:
 *
 *   export function checkLookRules(look, styleRequest) {
 *     return {
 *       budget: ...,       // total cost vs styleRequest.budget
 *       unknownProduct: ..., // every product ID exists in the catalog
 *       category: ...,      // dress OR (top + bottom), not neither/both
 *       formality: ...,     // within styleRequest's formality range
 *       avoid: ...,          // no "avoid" words/categories present
 *       duplicate: ...,       // this look isn't identical to another in the set
 *     };
 *   }
 */
export function checkLookRules(look, styleRequest) {
  throw new Error("checkLookRules not implemented yet");
}
