import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeVisualPreferences } from "../services/visualPreferences.js";
import { runOrchestrator } from "../agents/orchestrator.js";

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
  await runOrchestrator({ uid: "quiz-user", visualPreferences: choices }, {
    generate: async (parts, schema, { label }) => {
      calls.push(label);
      assert.match(parts[0].text, /coastal-minimalism/);
      assert.match(parts[0].text, /relative choices/);
      if (label === "StyleAnalyst") return { summary: "Mixed preferences" };
      if (label === "LookBuilder") return { looks: [{ productIds: ["p01", "p07"] }] };
      return { verdict: "pass", issues: [] };
    },
    firestore: { collection: () => ({ add: async (data) => { saved = data; return { id: "quiz-look" }; } }) },
  });
  assert.deepEqual(calls, ["StyleAnalyst", "LookBuilder", "LookCritic"]);
  assert.deepEqual(saved.styleRequest.visualPreferences, choices);
  assert.equal(saved.styleRequest.budget, 0);
});
