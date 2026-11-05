/**
 * agents/schemas.js
 *
 * Structured-output schemas enforced on Gemini's responses within the
 * agent pipeline. Defining these explicitly (rather than hoping the
 * model returns well-formed JSON) is what makes LookCritic's output
 * reliable enough for afterAgentCallback to act on programmatically —
 * passed as generationConfig.responseSchema (see services/geminiService.js),
 * which makes the Gemini API itself refuse to return anything that
 * doesn't match this shape.
 */
import { SchemaType } from "@google/generative-ai";

// StyleAnalyst's output: a short summary of the user's style, built from
// one or more photoAnalyses.
export const styleDnaSchema = {
  type: SchemaType.OBJECT,
  properties: {
    styleKeywords: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    preferredColors: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    formalityRange: {
      type: SchemaType.OBJECT,
      properties: {
        min: { type: SchemaType.NUMBER },
        max: { type: SchemaType.NUMBER },
      },
      required: ["min", "max"],
    },
    notes: { type: SchemaType.STRING },
  },
  required: ["styleKeywords", "preferredColors", "formalityRange", "notes"],
};

// Gemini's read of one uploaded/picked outfit photo.
export const photoAnalysisSchema = {
  type: SchemaType.OBJECT,
  properties: {
    garments: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    colors: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    formality: { type: SchemaType.NUMBER, description: "1 (very casual) to 5 (very formal)" },
    styleKeywords: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    notes: { type: SchemaType.STRING },
  },
  required: ["garments", "colors", "formality", "styleKeywords", "notes"],
};

// Gemini's structured read of a recorded voice request.
export const styleRequestSchema = {
  type: SchemaType.OBJECT,
  properties: {
    rawTranscript: { type: SchemaType.STRING },
    occasion: { type: SchemaType.STRING },
    budget: { type: SchemaType.NUMBER, description: "Total budget in USD, 0 if not mentioned" },
    mustHaves: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    avoid: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    formality: { type: SchemaType.NUMBER, description: "1 (very casual) to 5 (very formal)" },
    weather: { type: SchemaType.STRING },
  },
  required: ["rawTranscript", "occasion", "budget", "mustHaves", "avoid", "formality", "weather"],
};

// LookBuilder's output: a small set of candidate looks built from product
// ids in the catalog (backend/data/products.js).
export const lookSetSchema = {
  type: SchemaType.OBJECT,
  properties: {
    looks: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING },
          productIds: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          reasoning: { type: SchemaType.STRING },
        },
        required: ["name", "productIds", "reasoning"],
      },
    },
  },
  required: ["looks"],
};

// LookCritic's output — exact shape from the proposal review response.
export const critiqueSchema = {
  type: SchemaType.OBJECT,
  properties: {
    verdict: { type: SchemaType.STRING, enum: ["pass", "revise"] },
    issues: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          lookIndex: { type: SchemaType.NUMBER },
          rule: {
            type: SchemaType.STRING,
            enum: ["budget", "formality", "weather", "avoid", "category", "styleFit", "duplicate", "unknownProduct"],
          },
          problem: { type: SchemaType.STRING },
          fix: { type: SchemaType.STRING },
        },
        required: ["lookIndex", "rule", "problem", "fix"],
      },
    },
    summary: { type: SchemaType.STRING },
  },
  required: ["verdict", "issues", "summary"],
};
