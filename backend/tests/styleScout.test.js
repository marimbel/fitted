/**
 * tests/styleScout.test.js
 *
 * Unit tests for StyleScout (agents/styleScout.js) -- no network calls,
 * no real Vertex AI or Gemini credentials needed, same pattern as
 * tests/orchestrator.test.js: the ranking step is pure code and gets a
 * real test; the one Gemini call is replaced with a fake via `deps`.
 *
 * Run with: npm test (= node --test tests/)
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { runStyleScout, rankByVisualSimilarity } from "../agents/styleScout.js";
import { styleMatchSchema } from "../agents/schemas.js";

describe("rankByVisualSimilarity (the deterministic ranking step)", () => {
  test("ranks by cosine similarity, closest first", () => {
    const query = [1, 0, 0];
    const catalog = [
      { productId: "p01", embedding: [1, 0, 0] }, // identical -> similarity 1
      { productId: "p02", embedding: [0, 1, 0] }, // orthogonal -> similarity 0
      { productId: "p03", embedding: [0.9, 0.1, 0] }, // close
    ];

    const ranked = rankByVisualSimilarity(query, catalog, 3);

    assert.deepEqual(ranked.map((r) => r.productId), ["p01", "p03", "p02"]);
    assert.ok(ranked[0].similarity > ranked[1].similarity);
  });

  test("respects topN", () => {
    const query = [1, 0];
    const catalog = [
      { productId: "p01", embedding: [1, 0] },
      { productId: "p02", embedding: [0, 1] },
      { productId: "p03", embedding: [0.7, 0.7] },
    ];

    assert.equal(rankByVisualSimilarity(query, catalog, 1).length, 1);
  });
});

describe("runStyleScout (the full agent, with fake embeddings + fake Gemini)", () => {
  test("ranks the catalog and passes the top candidates to Gemini for curation", async () => {
    const fakeCatalog = [
      { productId: "p01", embedding: [1, 0] },
      { productId: "p05", embedding: [0, 1] },
    ];
    const getEmbedding = async () => [1, 0]; // pretend the query photo matches p01 exactly
    const loadCatalog = async () => fakeCatalog;

    let seenPrompt = null;
    const generate = async (parts, schema) => {
      seenPrompt = parts[0].text;
      assert.equal(schema, styleMatchSchema);
      return { curated: [{ productId: "p01", reason: "Closest visual match." }], summary: "One strong match." };
    };

    const result = await runStyleScout(
      { queryImage: { imageBase64: "fake" }, uid: "test-user" },
      { getEmbedding, generate, loadCatalog }
    );

    assert.equal(result.candidates[0].id, "p01"); // candidates spread the full product object (PRODUCTS uses `id`, not `productId`)
    assert.equal(result.curation.curated[0].productId, "p01");
    assert.ok(seenPrompt.includes("StyleScout"));
  });
});
