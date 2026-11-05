/**
 * tests/orchestrator.test.js
 *
 * Integration test for the whole agent pipeline:
 *
 *   StyleAnalyst -> loop( LookBuilder <-> LookCritic, maxIterations: 3 )
 *
 * runOrchestrator() normally calls the real Gemini API and the real
 * Firestore client. For an automated test we don't want either — no
 * network, no API key, no live database — so the two dependencies are
 * passed in as fakes via the optional `deps` argument (see the comment
 * above runOrchestrator in agents/orchestrator.js). This proves
 * out the orchestration logic itself: the loop bound, and — the most
 * important behavior in the whole design — that a hard rule failure
 * (e.g. over budget) always forces verdict: "revise", even when the
 * fake "model" claims the look passes.
 *
 * Run with: npm test (= node --test tests/)
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { runOrchestrator, applyRuleOverride } from "../agents/orchestrator.js";
import { checkLookRules } from "../agents/lookRules.js";
import { styleDnaSchema, lookSetSchema, critiqueSchema } from "../agents/schemas.js";

// A minimal fake Firestore: just enough of the `db.collection(path).add(data)`
// chain that runOrchestrator uses, recording what was written so the
// test can assert on it.
function makeFakeFirestore() {
  const writes = [];
  return {
    writes,
    collection(path) {
      return {
        async add(data) {
          writes.push({ path, data });
          return { id: "fake-look-set-id" };
        },
      };
    },
  };
}

describe("runOrchestrator (the Orchestrator agent)", () => {
  test("passes in one iteration when the model and the rules agree", async () => {
    const callLog = [];
    const generate = async (parts, schema) => {
      callLog.push(schema);
      if (schema === styleDnaSchema) {
        return { summary: "Minimalist, neutral palette, prefers tailored pieces." };
      }
      if (schema === lookSetSchema) {
        // Top + bottom, well under any reasonable budget -> every
        // checkLookRules rule passes.
        return { looks: [{ productIds: ["p01", "p07"] }] };
      }
      if (schema === critiqueSchema) {
        return { verdict: "pass", issues: [] };
      }
      throw new Error("unexpected schema in test fake");
    };
    const firestore = makeFakeFirestore();

    const result = await runOrchestrator(
      { uid: "test-user", photoAnalyses: [{ note: "casual outfit" }], styleRequest: { budget: 200, avoid: [] } },
      { generate, firestore }
    );

    assert.equal(result.critique.verdict, "pass");
    assert.equal(result.critique.iterations, 1);
    assert.equal(result.agentTrace.length, 1);
    assert.equal(result.id, "fake-look-set-id");

    // StyleAnalyst once, then one LookBuilder + one LookCritic call.
    assert.deepEqual(callLog, [styleDnaSchema, lookSetSchema, critiqueSchema]);

    // The result was actually saved to (the fake) Firestore, under the
    // right user's lookSets subcollection.
    assert.equal(firestore.writes.length, 1);
    assert.equal(firestore.writes[0].path, "users/test-user/lookSets");
  });

  test("a hard rule failure forces 'revise' even if the model claims 'pass', up to the 3-iteration cap", async () => {
    const generate = async (parts, schema) => {
      if (schema === styleDnaSchema) return { summary: "Likes statement outerwear." };
      if (schema === lookSetSchema) {
        // Wool-Blend Overcoat ($248) + Quilted Field Jacket ($188) = $436,
        // against a $100 budget below -> always over budget, every round.
        return { looks: [{ productIds: ["p03", "p10"] }] };
      }
      if (schema === critiqueSchema) {
        // A "model" that (wrongly) thinks this look is fine every time.
        return { verdict: "pass", issues: [] };
      }
      throw new Error("unexpected schema in test fake");
    };
    const firestore = makeFakeFirestore();

    const result = await runOrchestrator(
      { uid: "test-user", photoAnalyses: [], styleRequest: { budget: 100, avoid: [] } },
      { generate, firestore }
    );

    // The override must win: verdict is "revise" despite the fake model
    // always saying "pass", and the loop used its full budget of
    // iterations trying to recover.
    assert.equal(result.critique.verdict, "revise");
    assert.equal(result.critique.iterations, 3);
    assert.equal(result.agentTrace.length, 3);

    // Every round's rule check actually caught the same real problem.
    for (const round of result.agentTrace) {
      assert.equal(round.ruleChecks[0].passed, false);
      assert.ok(round.ruleChecks[0].budget.overBy > 0);
    }

    // The final critique's issues include a synthesized budget issue —
    // applyRuleOverride's job — even though the fake model never
    // mentioned one itself.
    const budgetIssue = result.critique.issues.find((issue) => issue.rule === "budget");
    assert.ok(budgetIssue, "expected a synthesized budget issue");
    assert.equal(budgetIssue.lookIndex, 0);
  });
});

describe("applyRuleOverride (afterAgentCallback)", () => {
  test("leaves a genuine pass alone and sets escalate so the loop can stop early", () => {
    const ruleChecks = [checkLookRules({ productIds: ["p01", "p07"] }, { budget: 200, avoid: [] })];
    const modelCritique = { verdict: "pass", issues: [] };

    const result = applyRuleOverride(modelCritique, ruleChecks);

    assert.equal(result.verdict, "pass");
    assert.equal(result.escalate, true);
  });

  test("overrides a false 'pass' to 'revise' and synthesizes the missing issue", () => {
    // Top + bottom (so the category rule passes) but over the $100 budget
    // -> exactly one rule fails, so this isolates the budget-synthesis path.
    const ruleChecks = [checkLookRules({ productIds: ["p01", "p07"] }, { budget: 100, avoid: [] })];
    const modelCritique = { verdict: "pass", issues: [] }; // model missed the budget problem

    const result = applyRuleOverride(modelCritique, ruleChecks);

    assert.equal(result.verdict, "revise");
    assert.equal(result.escalate, false);
    assert.equal(result.issues.length, 1);
    assert.equal(result.issues[0].rule, "budget");
  });

  test("does not duplicate an issue the model already reported", () => {
    const ruleChecks = [checkLookRules({ productIds: ["p03", "p10"] }, { budget: 100, avoid: [] })];
    const modelCritique = {
      verdict: "revise",
      issues: [{ lookIndex: 0, rule: "budget", problem: "Too expensive.", fix: "Swap something cheaper in." }],
    };

    const result = applyRuleOverride(modelCritique, ruleChecks);

    const budgetIssues = result.issues.filter((issue) => issue.rule === "budget");
    assert.equal(budgetIssues.length, 1, "should not add a second budget issue on top of the model's own");
  });
});
