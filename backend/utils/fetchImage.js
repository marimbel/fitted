/**
 * utils/fetchImage.js
 *
 * Fetches an external image URL and returns its raw bytes as base64.
 * Shared by services/embeddingsService.js (StyleScout's catalog
 * embeddings) and routes/tryOn.js (Virtual Try-On) -- both need to
 * turn a product's `image` URL into base64 bytes before sending it to
 * a Vertex AI predict endpoint, which takes image bytes directly, not
 * a URL.
 */
import axios from "axios";

export async function fetchImageAsBase64(imageUrl) {
  const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
  return Buffer.from(response.data).toString("base64");
}
