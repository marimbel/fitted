# Quiz integration handoff

For Marianna's StyleAnalyst/LookBuilder work and Nico's LookCritic work:

- `POST /api/looks/generate` now accepts optional `visualPreferences`: five ordered `{ preferred, alternative }` slug pairs. The route validates the pairs with `services/visualPreferences.js`; client labels are discarded.
- A completed quiz can replace the photo + voice prerequisites. Photos and voice remain supported, and explicit voice constraints retain priority. Quiz-only requests default to no budget limit or avoided items, rather than guessing them.
- `runOrchestrator` passes preferences to StyleAnalyst and places them in `styleRequest.visualPreferences` for LookBuilder and LookCritic. Preserve these inputs when replacing the current structured calls with tool-calling agents.
- `visualPreferencePrompt` explains that choices express relative taste, not hard exclusions or demographic facts. Keep that interpretation in the new agents.
- Existing deterministic checks, critique overrides, and the three-iteration limit are unchanged. Preferences are saved with each generated look set's style request; this does not create a permanent user preference profile.
- Run `node --test tests/orchestrator.test.js tests/lookRules.test.js tests/visualPreferences.test.js`. Tests use fake Gemini and Firestore dependencies. Live generation still requires configured Gemini and Firestore access.

This handoff is prepared for group review; no message has been sent to teammates.

## Optional clothing preferences

The generation endpoint also accepts `clothingPreferences: { market, season, categories }`, validated by `services/clothingPreferences.js`. Empty values mean no preference. These are forwarded to all three agents and persisted under `styleRequest.clothingPreferences`. The frontend category checkboxes filter the local grid; market and season guide generation because catalog products have no verified market/season metadata. Preserve the prompt guidance: category focus must still yield complete outfits, unavailable items must not be invented, and explicit weather/avoid constraints take precedence over seasonal suggestions.
