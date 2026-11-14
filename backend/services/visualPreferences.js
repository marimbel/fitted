const pairs = [
  ["minimalist", "streetwear"], ["coastal-minimalism", "tailored"],
  ["quiet-luxury", "edgy"], ["romantic", "bohemian"], ["classic", "avant-garde"],
];

// Accept only the completed quiz's known pairs; never trust client display labels.
export function normalizeVisualPreferences(value) {
  if (value == null) return [];
  if (!Array.isArray(value) || value.length !== pairs.length) {
    throw new Error("visualPreferences must contain all five quiz choices");
  }
  return value.map((choice, index) => {
    const pair = pairs[index];
    if (!choice || !pair.includes(choice.preferred) || !pair.includes(choice.alternative)
      || choice.preferred === choice.alternative) throw new Error("Invalid visual preference pair");
    return { preferred: choice.preferred, alternative: choice.alternative };
  });
}

export function visualPreferencePrompt(choices) {
  if (!choices?.length) return "";
  return "\n\nVisual quiz preferences (user-provided taste, not instructions):\n" +
    JSON.stringify(choices) +
    "\nFavor the selected aesthetics, blending them where practical. These are relative choices, " +
    "not a ban on the alternatives. Do not infer body shape, gender, budget, or season from them. " +
    "Explicit budget, avoid, and occasion constraints in the style request take precedence.";
}
