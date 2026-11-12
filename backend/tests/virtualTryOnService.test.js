/**
 * tests/virtualTryOnService.test.js
 *
 * Unit tests for services/virtualTryOnService.js -- no live Vertex AI
 * credentials or network call needed. generateTryOnImage()'s one
 * network call is replaced with a fake `post` via its injectable
 * `deps` argument, same pattern as mockShopService.test.js and
 * runOrchestrator()'s `{ generate, firestore }` deps.
 *
 * Run with: npm test (= node --test tests/)
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { generateTryOnImage } from "../services/virtualTryOnService.js";

describe("generateTryOnImage", () => {
  test("rejects when either image is missing", async () => {
    await assert.rejects(() => generateTryOnImage({ personImageBase64: "abc" }), /needs both/);
    await assert.rejects(() => generateTryOnImage({ productImageBase64: "abc" }), /needs both/);
  });

  test("reads the generated image from a top-level bytesBase64Encoded field", async () => {
    const fakePost = async (body) => {
      assert.ok(body.instances[0].personImage.image.bytesBase64Encoded);
      assert.ok(body.instances[0].productImages[0].image.bytesBase64Encoded);
      return { predictions: [{ bytesBase64Encoded: "fake-image-bytes", mimeType: "image/png" }] };
    };

    const result = await generateTryOnImage(
      { personImageBase64: "person-bytes", productImageBase64: "product-bytes" },
      { post: fakePost }
    );

    assert.equal(result.imageBase64, "fake-image-bytes");
    assert.equal(result.mimeType, "image/png");
  });

  test("also reads a nested image.bytesBase64Encoded shape", async () => {
    const fakePost = async () => ({
      predictions: [{ image: { bytesBase64Encoded: "fake-nested-bytes", mimeType: "image/jpeg" } }],
    });

    const result = await generateTryOnImage(
      { personImageBase64: "p", productImageBase64: "g" },
      { post: fakePost }
    );

    assert.equal(result.imageBase64, "fake-nested-bytes");
    assert.equal(result.mimeType, "image/jpeg");
  });

  test("defaults mimeType to image/png when the response omits it", async () => {
    const fakePost = async () => ({ predictions: [{ bytesBase64Encoded: "bytes" }] });

    const result = await generateTryOnImage(
      { personImageBase64: "p", productImageBase64: "g" },
      { post: fakePost }
    );

    assert.equal(result.mimeType, "image/png");
  });

  test("throws a clear error when no prediction comes back", async () => {
    const fakePost = async () => ({ predictions: [] });

    await assert.rejects(
      () => generateTryOnImage({ personImageBase64: "p", productImageBase64: "g" }, { post: fakePost }),
      /no prediction/
    );
  });

  test("throws a clear error when a prediction has no recognizable image field", async () => {
    const fakePost = async () => ({ predictions: [{ someOtherField: true }] });

    await assert.rejects(
      () => generateTryOnImage({ personImageBase64: "p", productImageBase64: "g" }, { post: fakePost }),
      /no recognizable image field/
    );
  });
});
