import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeVisualPreferences } from "../services/visualPreferences.js";
import { runOrchestrator } from "../agents/orchestrator.js";
import { normalizeClothingPreferences } from "../services/clothingPreferences.js";

test("optional clothing preferences validate enums and deduplicate categories", () => {
  assert.deepEqual(normalizeClothingPreferences(null), { market: "", season: "", categories: [] });
  assert.deepEqual(normalizeClothingPreferences({ market: "unisex", season: "fall", categories: ["Boots", "Boots"] }).categories, ["Boots"]);
  assert.throws(() => normalizeClothingPreferences({ market: "invented", season: "fall", categories: [] }));
  assert.throws(() => normalizeClothingPreferences({ market: "men", season: "summer", categories: ["invented"] }));
});

const choices = [
  ["minimalist", "streetwear"], ["coastal-minimalism", "tailored"],
  ["quiet-luxury", "edgy"], ["romantic", "bohemian"], ["classic", "avant-garde"],
].map(([preferred, alternative]) => ({ preferred, alternative }));

test("validates quiz pairs and removes client display labels", () => {
  assert.deepEqual(normalizeVisualPreferences(null), []);
  assert.deepEqual(normalizeVisualPreferences(choices.map((choice) => ({ ...choice, label: "untrusted" }))), choices);
  assert.throws(() => normalizeVisualPreferences([]));
  assert.throws(() => normalizeVisualPreferences([{ preferred: "invented" }, ...choices.slice(1)]));
});

test("quiz-only inputs reach all three agents and are persisted with the look set", async () => {
  const calls = [];
  let saved;
  const clothingPreferences = { market: "unisex", season: "fall", categories: ["Outerwear"] };
  await runOrchestrator({ uid: "quiz-user", visualPreferences: choices, clothingPreferences }, {
    generate: async (parts, schema, { label }) => {
      calls.push(label);
      assert.match(parts[0].text, /coastal-minimalism/);
      assert.match(parts[0].text, /relative choices/);
      assert.match(parts[0].text, /unisex/);
      assert.match(parts[0].text, /fall/);
      if (label === "StyleAnalyst") return { summary: "Mixed preferences" };
      if (label === "LookBuilder") return { looks: [{ productIds: ["p01", "p07"] }] };
      return { verdict: "pass", issues: [] };
    },
    firestore: { collection: () => ({ add: async (data) => { saved = data; return { id: "quiz-look" }; } }) },
  });
  assert.deepEqual(calls, ["StyleAnalyst", "LookBuilder", "LookCritic"]);
  assert.deepEqual(saved.styleRequest.visualPreferences, choices);
  assert.deepEqual(saved.styleRequest.clothingPreferences, clothingPreferences);
  assert.equal(saved.styleRequest.budget, 0);
});
