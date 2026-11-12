/**
 * tests/imaginedAngleService.test.js
 *
 * Unit tests for services/imaginedAngleService.js -- no live Gemini
 * credentials or network call needed. generateImaginedAngle()'s one
 * network call is replaced with a fake `generate` via its injectable
 * `deps` argument, same dependency-injection pattern as
 * virtualTryOnService.test.js and runOrchestrator()'s
 * `{ generate, firestore }` deps.
 *
 * Run with: npm test (= node --test tests/)
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { generateImaginedAngle } from "../services/imaginedAngleService.js";

describe("generateImaginedAngle", () => {
  test("rejects when frontImageBase64 is missing", async () => {
    await assert.rejects(() => generateImaginedAngle({ angle: "side" }), /required/);
  });

  test("rejects when angle is missing", async () => {
    await assert.rejects(() => generateImaginedAngle({ frontImageBase64: "abc" }), /required/);
  });

  test("rejects an angle other than side/back", async () => {
    await assert.rejects(
      () => generateImaginedAngle({ frontImageBase64: "abc", angle: "aerial" }),
      /Unknown angle/
    );
  });

  test("sends the front image and the angle-specific prompt, and reads the image back out", async () => {
    const fakeGenerate = async (parts) => {
      assert.equal(parts[0].inlineData.data, "front-bytes");
      assert.match(parts[1].text, /side \(profile\) view/);
      return {
        candidates: [
          {
            content: {
              parts: [
                { text: "Here you go" },
                { inlineData: { data: "imagined-bytes", mimeType: "image/png" } },
              ],
            },
          },
        ],
      };
    };

    const result = await generateImaginedAngle(
      { frontImageBase64: "front-bytes", angle: "side" },
      { generate: fakeGenerate }
    );

    assert.equal(result.imageBase64, "imagined-bytes");
    assert.equal(result.mimeType, "image/png");
  });

  test("uses the back-specific prompt for angle: 'back'", async () => {
    const fakeGenerate = async (parts) => {
      assert.match(parts[1].text, /directly behind/);
      return { candidates: [{ content: { parts: [{ inlineData: { data: "x" } }] } }] };
    };

    await generateImaginedAngle({ frontImageBase64: "front-bytes", angle: "back" }, { generate: fakeGenerate });
  });

  test("defaults mimeType to image/png when the response omits it", async () => {
    const fakeGenerate = async () => ({
      candidates: [{ content: { parts: [{ inlineData: { data: "bytes" } }] } }],
    });

    const result = await generateImaginedAngle(
      { frontImageBase64: "p", angle: "side" },
      { generate: fakeGenerate }
    );

    assert.equal(result.mimeType, "image/png");
  });

  test("throws a clear error when Gemini returns no image part", async () => {
    const fakeGenerate = async () => ({
      candidates: [{ content: { parts: [{ text: "I can't do that." }] } }],
    });

    await assert.rejects(
      () => generateImaginedAngle({ frontImageBase64: "p", angle: "side" }, { generate: fakeGenerate }),
      /didn't return an image/
    );
  });

  test("throws a clear error when the response has no candidates at all", async () => {
    const fakeGenerate = async () => ({ candidates: [] });

    await assert.rejects(
      () => generateImaginedAngle({ frontImageBase64: "p", angle: "back" }, { generate: fakeGenerate }),
      /didn't return an image/
    );
  });
});
