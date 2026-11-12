/**
 * services/virtualTryOnService.js
 *
 * Wraps Google Cloud's Vertex AI Virtual Try-On model
 * (virtual-try-on-001) -- given a photo of a person and a photo of a
 * garment, returns one generated image of that person wearing that
 * garment. Same "call Vertex AI's REST predict endpoint directly"
 * pattern as services/embeddingsService.js, reusing the same auth and
 * env vars (GCP_PROJECT_ID, VERTEX_LOCATION) -- no new GCP API needs
 * enabling, since this is the same Vertex AI platform StyleScout's
 * embeddings already turned on.
 *
 * IMPORTANT LIMITATION, read before wiring up a UI around this:
 * this model does NOT accept an "angle" or viewpoint instruction. It
 * generates ONE composite that follows the POSE already in the person
 * photo you send it -- there's no way to ask it for "the side view" or
 * "the back view" of someone from a single front-facing photo. Getting
 * a genuine front/side/back result means calling this once per
 * person-photo the user actually supplies from that angle -- see
 * routes/tryOn.js and frontend/src/components/PhotoUploader.jsx, which
 * now accept up to three separate photos (front required, side/back
 * optional) instead of pretending one photo can be "rotated."
 *
 * Requires, in .env (same two vars services/embeddingsService.js uses):
 *   GCP_PROJECT_ID, VERTEX_LOCATION
 * Plus, optionally:
 *   VERTEX_VTO_MODEL  - defaults to "virtual-try-on-001" below; kept
 *                        overridable in case a region/project still
 *                        serves it under a dated preview name instead.
 */
import { GoogleAuth } from "google-auth-library";
import axios from "axios";

const auth = new GoogleAuth({ scopes: "https://www.googleapis.com/auth/cloud-platform" });

function endpointUrl() {
  const project = process.env.GCP_PROJECT_ID;
  const location = process.env.VERTEX_LOCATION || "us-central1";
  const model = process.env.VERTEX_VTO_MODEL || "virtual-try-on-001";
  return `https://${location}-aiplatform.googleapis.com/v1/projects/${project}/locations/${location}/publishers/google/models/${model}:predict`;
}

/**
 * Generates one try-on image. `deps.post` is injectable for testing
 * (no real Vertex AI credentials needed) -- same dependency-injection
 * pattern as fetchMockShopProducts() and runOrchestrator().
 *
 * Returns { imageBase64, mimeType }.
 */
export async function generateTryOnImage(
  { personImageBase64, productImageBase64 },
  deps = {}
) {
  if (!personImageBase64 || !productImageBase64) {
    throw new Error("generateTryOnImage needs both personImageBase64 and productImageBase64");
  }

  const post = deps.post || defaultPost;

  const body = {
    instances: [
      {
        personImage: { image: { bytesBase64Encoded: personImageBase64 } },
        productImages: [{ image: { bytesBase64Encoded: productImageBase64 } }],
      },
    ],
  };

  const data = await post(body);
  const prediction = data?.predictions?.[0];

  if (!prediction) {
    // Imagen-family models can refuse a request on safety grounds
    // instead of erroring outright -- surface that distinctly so the
    // frontend can show something more useful than a generic failure.
    const blockedReason = data?.predictions?.[0]?.raiFilteredReason;
    if (blockedReason) {
      throw new Error(`Vertex AI declined to generate this image: ${blockedReason}`);
    }
    throw new Error(
      "Vertex AI returned no prediction -- check that VERTEX_VTO_MODEL is correct for your project/region and that billing is active"
    );
  }

  // The exact response field name isn't fully confirmed from public
  // docs at the time this was written (Google's docs for this specific
  // model render client-side and couldn't be read directly) -- this
  // checks both plausible shapes, matching how the request body itself
  // nests bytes under `image.bytesBase64Encoded` in one case and how
  // every other Imagen model on Vertex returns `bytesBase64Encoded` at
  // the top level of each prediction in the other.
  const imageBase64 = prediction.bytesBase64Encoded || prediction.image?.bytesBase64Encoded;
  const mimeType = prediction.mimeType || prediction.image?.mimeType || "image/png";

  if (!imageBase64) {
    throw new Error(
      `Vertex AI prediction had no recognizable image field. Keys received: ${Object.keys(prediction).join(", ")}`
    );
  }

  return { imageBase64, mimeType };
}

async function defaultPost(body) {
  const client = await auth.getClient();
  const accessToken = (await client.getAccessToken()).token;

  const response = await axios.post(endpointUrl(), body, {
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    timeout: 60000, // observed real-world latency is ~30s per image
  });
  return response.data;
}
