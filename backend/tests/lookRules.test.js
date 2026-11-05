/**
 * tests/lookRules.test.js
 *
 * Unit tests for the beforeAgentCallback step of the agent pipeline:
 * checkLookRules() is pure code (no Gemini call, no Firestore), so it's
 * tested directly — every branch (budget, category, avoid, duplicate,
 * unknown product) gets its own case, using the real product catalog
 * from data/products.js so the test stays honest about real prices.
 *
 * Run with: npm test (= node --test tests/)
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { checkLookRules } from "../agents/lookRules.js";

describe("checkLookRules", () => {
  test("a top + bottom under budget passes every rule", () => {
    // Essential Cotton Tee ($38, Tops) + Straight-Leg Trousers ($96, Bottoms)
    const look = { productIds: ["p01", "p07"] };
    const styleRequest = { budget: 200, avoid: [] };

    const report = checkLookRules(look, styleRequest);

    assert.equal(report.passed, true);
    assert.equal(report.budget.total, 134);
    assert.equal(report.budget.overBy, 0);
    assert.equal(report.category.ok, true);
    assert.deepEqual(report.unknownProduct, []);
    assert.deepEqual(report.avoid, []);
    assert.equal(report.duplicateOf, -1);
  });

  test("a single dress also satisfies the category rule on its own", () => {
    // Silk Slip Dress ($168, Dresses)
    const look = { productIds: ["p05"] };
    const styleRequest = { budget: 200, avoid: [] };

    const report = checkLookRules(look, styleRequest);

    assert.equal(report.category.ok, true);
    assert.equal(report.passed, true);
  });

  test("outerwear alone is not a complete look", () => {
    // Wool-Blend Overcoat ($248, Outerwear) — a layer, not an outfit
    const look = { productIds: ["p03"] };
    const styleRequest = { budget: 300, avoid: [] };

    const report = checkLookRules(look, styleRequest);

    assert.equal(report.category.ok, false);
    assert.equal(report.passed, false);
  });

  test("going over budget fails the budget rule with the right overage", () => {
    // Wool-Blend Overcoat ($248) + Straight-Leg Trousers ($96) = $344
    const look = { productIds: ["p03", "p07"] };
    const styleRequest = { budget: 300, avoid: [] };

    const report = checkLookRules(look, styleRequest);

    assert.equal(report.budget.total, 344);
    assert.equal(report.budget.overBy, 44);
    assert.equal(report.passed, false);
  });

  test("no budget on the style request means no budget rule to fail", () => {
    const look = { productIds: ["p03", "p10"] }; // $248 + $188, deliberately pricey
    const styleRequest = { budget: 0, avoid: [] };

    const report = checkLookRules(look, styleRequest);

    assert.equal(report.budget.limit, null);
    assert.equal(report.budget.overBy, 0);
  });

  test("an avoid-word match is caught by name or category", () => {
    // Cropped Denim Jacket (Outerwear) — user asked to avoid "denim"
    const look = { productIds: ["p04", "p07"] };
    const styleRequest = { budget: 300, avoid: ["denim"] };

    const report = checkLookRules(look, styleRequest);

    assert.deepEqual(report.avoid, ["Cropped Denim Jacket"]);
    assert.equal(report.passed, false);
  });

  test("an id not in the catalog is reported as unknownProduct", () => {
    const look = { productIds: ["p01", "p99"] };
    const styleRequest = { budget: 300, avoid: [] };

    const report = checkLookRules(look, styleRequest);

    assert.deepEqual(report.unknownProduct, ["p99"]);
    assert.equal(report.passed, false);
    // the budget total only counts the real product, not the unknown id
    assert.equal(report.budget.total, 38);
  });

  test("an identical look elsewhere in the candidate set is a duplicate", () => {
    const lookA = { productIds: ["p01", "p07"] };
    const lookB = { productIds: ["p07", "p01"] }; // same ids, different order
    const candidates = [lookA, lookB];

    const reportB = checkLookRules(lookB, { budget: 300, avoid: [] }, candidates);

    assert.equal(reportB.duplicateOf, 0);
    assert.equal(reportB.passed, false);
  });
});
