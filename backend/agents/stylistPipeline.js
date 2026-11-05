/**
 * agents/stylistPipeline.js
 *
 * The agent architecture described in the proposal response:
 *
 *   StyleAnalyst -> loop( LookBuilder <-> LookCritic, maxIterations: 3 )
 *
 * One Cloud Run service, agents run in-process (per the review
 * feedback) rather than as a separate deployment.
 *
 * IMPLEMENTATION NOTE (see the "ADK on a Node/Express stack" question we
 * sent the professor): Google's Agent Development Kit is a Python
 * framework, but this app is Node/Express per the project spec. This
 * file implements the exact same architecture ADK would enforce —
 * named agent steps, a bounded critique loop, a before-agent rule check
 * written to shared state, and an after-agent callback that can
 * override the model's verdict — directly against the Gemini API via
 * geminiService.generateStructured(), rather than importing the Python
 * `google-adk` package into a Node process. If the professor's answer
 * says a literal ADK dependency is required, the agent *steps* below
 * stay the same; only the orchestration call (currently a plain loop)
 * would move behind ADK's LoopAgent/SequentialAgent primitives,
 * possibly from a separate Python service.
 *
 * Flow, per round of the loop:
 *   1. LookBuilder drafts (or revises) a set of looks from the
 *      Style DNA (StyleAnalyst's output) + the style request.
 *   2. A beforeAgentCallback runs lookRules.checkLookRules() on each
 *      look and stores the result as `ruleCheck` — pure code, no model
 *      involved, so the arithmetic is always right.
 *   3. LookCritic (a Gemini call constrained by schemas.critiqueSchema)
 *      sees `ruleCheck` + the Style DNA + the request, and returns a
 *      critique: hard-rule violations plus its own styleFit/weather
 *      judgement, each issue naming a concrete fix.
 *   4. An afterAgentCallback forces verdict: "revise" if any code rule
 *      failed (the model can never wave through an over-budget look).
 *      On "pass" it sets escalate = true, which ends the loop early.
 *   5. If revising, LookBuilder's next-round prompt includes the
 *      previous draft + critique.issues, and must address every one.
 *
 * The loop is bounded at 3 iterations; how many rounds a given run took
 * is saved with the result (lookSets.critique.iterations) and can be
 * shown in the UI, per the proposal response.
 */
import { checkLookRules } from "./lookRules.js";
import { styleDnaSchema, lookSetSchema, critiqueSchema } from "./schemas.js";
import { generateStructured } from "../services/geminiService.js";
import { PRODUCTS } from "../data/products.js";
import { db } from "../config/firestore.js";

const MAX_ITERATIONS = 3;

// ---- Step 1: StyleAnalyst ----
async function runStyleAnalyst(photoAnalyses) {
  const prompt =
    "You are StyleAnalyst. Summarize this person's personal style as a " +
    "'Style DNA' profile, based on these photo analyses:\n\n" +
    JSON.stringify(photoAnalyses, null, 2);

  return generateStructured([{ text: prompt }], styleDnaSchema);
}

// ---- Step in the loop: LookBuilder ----
async function runLookBuilder({ styleDna, styleRequest, previousCritique }) {
  const revisionNote = previousCritique
    ? `\n\nYour previous attempt was reviewed and needs revision. Fix every ` +
      `issue below, using the suggested fix where given:\n` +
      JSON.stringify(previousCritique.issues, null, 2)
    : "";

  const prompt =
    "You are LookBuilder. Propose 3 complete outfit looks for this person " +
    "using ONLY product ids from this catalog (never invent an id):\n" +
    JSON.stringify(PRODUCTS, null, 2) +
    "\n\nStyle DNA:\n" +
    JSON.stringify(styleDna, null, 2) +
    "\n\nStyle request:\n" +
    JSON.stringify(styleRequest, null, 2) +
    revisionNote;

  const result = await generateStructured([{ text: prompt }], lookSetSchema);
  return result.looks;
}

// ---- Step in the loop: LookCritic ----
async function runLookCritic({ styleDna, styleRequest, looks, ruleChecks }) {
  const prompt =
    "You are LookCritic. Review these candidate looks. `ruleCheck` below " +
    "is the result of deterministic code checks (budget math, catalog " +
    "validity, category completeness, avoid-word matches, duplicates) — " +
    "trust it completely for those facts; you do not need to re-check " +
    "the arithmetic. On top of that, judge whether each look actually " +
    "fits the Style DNA, the weather, and the occasion. Return verdict " +
    "'pass' only if ruleCheck shows no failures AND the looks genuinely " +
    "fit; otherwise 'revise', with one issue per problem naming a " +
    "concrete fix (which product id to swap, etc).\n\n" +
    "Style DNA:\n" + JSON.stringify(styleDna, null, 2) +
    "\n\nStyle request:\n" + JSON.stringify(styleRequest, null, 2) +
    "\n\nLooks:\n" + JSON.stringify(looks, null, 2) +
    "\n\nruleCheck (per look, same order):\n" + JSON.stringify(ruleChecks, null, 2);

  return generateStructured([{ text: prompt }], critiqueSchema);
}

// ---- afterAgentCallback: code has the final say, not the model ----
function applyRuleOverride(critique, ruleChecks) {
  const anyRuleFailed = ruleChecks.some((check) => !check.passed);
  if (!anyRuleFailed) {
    return { ...critique, verdict: critique.verdict, escalate: critique.verdict === "pass" };
  }

  // At least one hard rule failed — the model is never allowed to pass
  // this set. Make sure every rule failure is represented in `issues`
  // even if the model's own critique missed it.
  const issues = [...critique.issues];
  ruleChecks.forEach((check, lookIndex) => {
    if (check.unknownProduct.length > 0 && !issues.some((i) => i.lookIndex === lookIndex && i.rule === "unknownProduct")) {
      issues.push({ lookIndex, rule: "unknownProduct", problem: `Unknown product id(s): ${check.unknownProduct.join(", ")}`, fix: "Use only product ids from the provided catalog." });
    }
    if (check.budget.overBy > 0 && !issues.some((i) => i.lookIndex === lookIndex && i.rule === "budget")) {
      issues.push({ lookIndex, rule: "budget", problem: `Total $${check.budget.total} is $${check.budget.overBy} over the $${check.budget.limit} budget.`, fix: "Swap a cheaper item in to close the gap." });
    }
    if (!check.category.ok && !issues.some((i) => i.lookIndex === lookIndex && i.rule === "category")) {
      issues.push({ lookIndex, rule: "category", problem: check.category.reason, fix: "Add a dress, or pair a top with a bottom." });
    }
    if (check.avoid.length > 0 && !issues.some((i) => i.lookIndex === lookIndex && i.rule === "avoid")) {
      issues.push({ lookIndex, rule: "avoid", problem: `Includes items to avoid: ${check.avoid.join(", ")}`, fix: "Replace those items." });
    }
    if (check.duplicateOf !== -1 && !issues.some((i) => i.lookIndex === lookIndex && i.rule === "duplicate")) {
      issues.push({ lookIndex, rule: "duplicate", problem: `Identical to look ${check.duplicateOf}.`, fix: "Make this look distinct." });
    }
  });

  return { ...critique, verdict: "revise", issues, escalate: false };
}

/**
 * The single entry point routes/looks.js calls. Nothing else in the app
 * should talk to Gemini or the rule checker directly.
 */
export async function runStylistPipeline({ uid, photoAnalyses, styleRequest }) {
  const styleDna = await runStyleAnalyst(photoAnalyses);

  const agentTrace = [];
  let looks = [];
  let critique = null;

  for (let iteration = 1; iteration <= MAX_ITERATIONS; iteration++) {
    looks = await runLookBuilder({ styleDna, styleRequest, previousCritique: critique });

    // beforeAgentCallback: deterministic rule checks, written to what
    // would be ADK session state as `ruleCheck`.
    const ruleChecks = looks.map((look) => checkLookRules(look, styleRequest, looks));

    const rawCritique = await runLookCritic({ styleDna, styleRequest, looks, ruleChecks });
    critique = applyRuleOverride(rawCritique, ruleChecks);

    agentTrace.push({ iteration, looks, ruleChecks, critique });

    if (critique.verdict === "pass") break;
  }

  const result = {
    styleDna,
    looks,
    critique: { ...critique, iterations: agentTrace.length },
    agentTrace,
  };

  const docRef = await db.collection(`users/${uid}/lookSets`).add({
    ...result,
    styleRequest,
    createdAt: new Date().toISOString(),
  });

  return { id: docRef.id, ...result };
}
