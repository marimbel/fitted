/**
 * services/embeddingsService.js
 *
 * Wraps Google Cloud's Vertex AI Multimodal Embeddings model
 * (multimodalembedding@001) -- turns an image into a fixed-length vector
 * of numbers that captures its visual features (silhouette, color,
 * texture, pattern), so two images can be compared by *how they look*
 * rather than by text tags. This is what makes StyleScout's visual
 * similarity search (agents/styleScout.js) possible.
 *
 * Calls Vertex AI's REST predict endpoint directly rather than pulling
 * in the full @google-cloud/aiplatform SDK (a large dependency for one
 * endpoint) -- reuses the google-auth-library + axios dependencies the
 * backend already has (see middleware/verifyGoogleToken.js and
 * config/firestore.js for the same "reuse Google's auth, skip the
 * heavy SDK" pattern).
 *
 * Requires, in .env:
 *   GCP_PROJECT_ID   - already used by Firestore; the SAME project must
 *                      also have the Vertex AI API enabled + billing on
 *   VERTEX_LOCATION  - the Vertex AI region, e.g. "us-central1"
 *
 * Auth: Application Default Credentials -- the same credentials
 * config/firestore.js already relies on (gcloud auth application-default
 * login locally; the Cloud Run service account in production), now also
 * granted the "Vertex AI User" IAM role.
 */
import { GoogleAuth } from "google-auth-library";
import axios from "axios";

const auth = new GoogleAuth({ scopes: "https://www.googleapis.com/auth/cloud-platform" });

const MODEL = "multimodalembedding@001";

function endpointUrl() {
  const project = process.env.GCP_PROJECT_ID;
  const location = process.env.VERTEX_LOCATION || "us-central1";
  return `https://${location}-aiplatform.googleapis.com/v1/projects/${project}/locations/${location}/publishers/google/models/${MODEL}:predict`;
}

/**
 * Fetches an external image URL and returns its raw bytes as base64 --
 * Vertex's predict API takes image bytes directly, not a URL, so this
 * is the one extra step needed for catalog products (data/products.js
 * stores an `image` URL, same as the frontend's copy of this catalog).
 */
async function fetchImageAsBase64(imageUrl) {
  const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
  return Buffer.from(response.data).toString("base64");
}

/**
 * Calls Vertex AI and returns the image embedding: a plain array of
 * numbers (length 1408 by default for this model). Accepts EITHER a
 * base64 string (an uploaded reference photo, already base64 on arrival
 * the same way geminiService's photo analysis expects it) OR an
 * external image URL (used for the product catalog).
 */
export async function getImageEmbedding({ imageBase64, imageUrl }) {
  if (!imageBase64 && !imageUrl) {
    throw new Error("getImageEmbedding needs either imageBase64 or imageUrl");
  }
  const bytesBase64Encoded = imageBase64 || (await fetchImageAsBase64(imageUrl));

  const client = await auth.getClient();
  const accessToken = (await client.getAccessToken()).token;

  const response = await axios.post(
    endpointUrl(),
    { instances: [{ image: { bytesBase64Encoded } }] },
    { headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" } }
  );

  const embedding = response.data?.predictions?.[0]?.imageEmbedding;
  if (!embedding) {
    throw new Error(
      "Vertex AI returned no imageEmbedding -- check that the Vertex AI API is enabled and billing is active on GCP_PROJECT_ID"
    );
  }
  return embedding;
}

/**
 * Standard cosine similarity between two equal-length embedding
 * vectors -- 1 means visually identical, 0 means unrelated. Pure math,
 * no network call, which is why agents/styleScout.js's ranking step
 * (the "before-agent callback," same pattern as agents/lookRules.js)
 * can be unit-tested without any real embeddings.
 */
export function cosineSimilarity(a, b) {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
