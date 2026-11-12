/**
 * scripts/precomputeProductEmbeddings.js
 *
 * One-time (or "whenever the catalog's photos change") convenience
 * script: calls the real Vertex AI embeddings API once per product and
 * writes the results to data/productEmbeddings.json, which
 * agents/styleScout.js reads instead of re-embedding all sixteen product
 * photos on every cold start.
 *
 * Needs real credentials with the Vertex AI API enabled on
 * GCP_PROJECT_ID (gcloud auth application-default login locally) --
 * see .env.example for the required variables.
 *
 * Run with: npm run embed-products
 */
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import "dotenv/config";
import { getImageEmbedding } from "../services/embeddingsService.js";
import { PRODUCTS } from "../data/products.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const embeddings = {};
  for (const product of PRODUCTS) {
    console.log(`Embedding ${product.id} (${product.name})...`);
    embeddings[product.id] = await getImageEmbedding({ imageUrl: product.image });
  }

  const outPath = path.join(__dirname, "../data/productEmbeddings.json");
  writeFileSync(outPath, JSON.stringify(embeddings));
  console.log(`Wrote ${Object.keys(embeddings).length} embeddings to ${outPath}`);
}

main().catch((err) => {
  console.error("Failed to precompute product embeddings:", err.message);
  process.exit(1);
});
