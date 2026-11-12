/**
 * agents/styleScout.js
 *
 * StyleScout -- a sixth named agent, independent of the Orchestrator's
 * StyleAnalyst -> loop(LookBuilder <-> LookCritic) flow in
 * orchestrator.js. Where LookBuilder assembles outfits the model
 * invents from scratch, StyleScout answers a different question: "find
 * me more things that look like THIS" -- given a reference photo (an
 * inspiration photo, a runway look, a picture of an item the user
 * likes), search the product catalog by how things actually LOOK, not
 * by text tags, then have Gemini curate and explain the best matches.
 *
 * Two steps, same "code decides the facts, the model decides taste"
 * split used everywhere else in this pipeline (see lookRules.js /
 * applyRuleOverride in orchestrator.js):
 *
 *   1. rankByVisualSimilarity() -- deterministic, no model involved.
 *      Embeds the query image (services/embeddingsService.js, backed
 *      by Vertex AI's multimodal embeddings model) and ranks the
 *      catalog by cosine similarity. This is the "before-agent
 *      callback" -- pure math, always the same answer for the same
 *      inputs, fully unit-testable without a live API call.
 *   2. Gemini (generateStructured + styleMatchSchema) curates: of the
 *      top visual matches, which actually fit this person's Style DNA
 *      / style request, and why -- pixel similarity alone doesn't know
 *      about budget, occasion, or personal taste.
 *
 * TODO (Project 2, enhancement phase): once Presenter exists
 * (orchestrator.js), a StyleScout match could feed directly into
 * LookBuilder's next round the same way a critique does today.
 */
import { getImageEmbedding, cosineSimilarity } from "../services/embeddingsService.js";
import { generateStructured } from "../services/geminiService.js";
import { styleMatchSchema } from "./schemas.js";
import { PRODUCTS } from "../data/products.js";

// In-memory cache for the catalog's embeddings -- these rarely change
// (same static mock catalog LookBuilder uses) so there's no reason to
// re-embed all sixteen product photos on every request. Cleared only by
// restarting the server. scripts/precomputeProductEmbeddings.js can
// warm this ahead of time by writing data/productEmbeddings.json,
// which loadCatalogEmbeddings() prefers when present.
let catalogEmbeddingsCache = null;

async function loadCatalogEmbeddings(getEmbedding = getImageEmbedding) {
  if (catalogEmbeddingsCache) return catalogEmbeddingsCache;

  let precomputed = {};
  try {
    const module = await import("../data/productEmbeddings.json", { with: { type: "json" } });
    precomputed = module.default;
  } catch {
    // No precomputed cache yet -- fine, every product's embedding is
    // computed below instead. Run `npm run embed-products` once (with
    // real Vertex AI credentials) to avoid paying for this on every
    // cold start.
  }

  catalogEmbeddingsCache = await Promise.all(
    PRODUCTS.map(async (product) => ({
      productId: product.id,
      embedding: precomputed[product.id] || (await getEmbedding({ imageUrl: product.image })),
    }))
  );
  return catalogEmbeddingsCache;
}

/**
 * The deterministic ranking step. Exported on its own so it can be
 * unit-tested with fake embedding vectors -- no network call, no real
 * Vertex AI credentials needed (see tests/styleScout.test.js).
 */
export function rankByVisualSimilarity(queryEmbedding, catalogEmbeddings, topN = 5) {
  return catalogEmbeddings
    .map(({ productId, embedding }) => ({ productId, similarity: cosineSimilarity(queryEmbedding, embedding) }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topN);
}

/**
 * StyleScout's entry point. `deps` exists only for tests (same pattern
 * as runOrchestrator's `deps` in orchestrator.js) -- the real app never
 * passes it, so `getEmbedding` is always the real Vertex AI call and
 * `generate` is always the real Gemini call.
 *
 * queryImage: { imageBase64 } (an uploaded reference photo) OR
 *             { imageUrl }    (e.g. one of the Inspiration page photos)
 */
export async function runStyleScout(
  { queryImage, styleDna = null, styleRequest = null, uid = "server" },
  { getEmbedding = getImageEmbedding, generate = generateStructured, loadCatalog = loadCatalogEmbeddings } = {}
) {
  const queryEmbedding = await getEmbedding(queryImage);
  const catalogEmbeddings = await loadCatalog(getEmbedding);

  const ranked = rankByVisualSimilarity(queryEmbedding, catalogEmbeddings, 5);
  const candidates = ranked.map(({ productId, similarity }) => ({
    ...PRODUCTS.find((product) => product.id === productId),
    similarity,
  }));

  const prompt =
    "You are StyleScout. A user is looking for pieces that look like a " +
    "reference photo. Below are the catalog items our visual-similarity " +
    "search ranked closest to that photo (by raw pixel/visual similarity " +
    "only -- it knows nothing about taste, budget, or occasion). Pick " +
    "which of these genuinely suit this person and explain why in one " +
    "sentence each; it's fine to recommend fewer than were given if some " +
    "don't fit.\n\n" +
    "Visually similar candidates:\n" + JSON.stringify(candidates, null, 2) +
    (styleDna ? "\n\nThis person's Style DNA:\n" + JSON.stringify(styleDna, null, 2) : "") +
    (styleRequest ? "\n\nTheir current style request:\n" + JSON.stringify(styleRequest, null, 2) : "");

  const curation = await generate([{ text: prompt }], styleMatchSchema, { label: "StyleScout", uid });

  return { candidates, curation };
}
