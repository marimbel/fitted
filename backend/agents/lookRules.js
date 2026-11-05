/**
 * agents/lookRules.js
 *
 * The hard, deterministic rules LookCritic checks before the model
 * weighs in at all — per the proposal response: "these are facts, so
 * the model never has to do arithmetic." This file is plain code, not
 * an agent; stylistPipeline's beforeAgentCallback runs it and writes
 * the result to session state as `ruleCheck` for LookCritic to read.
 */
import { findProduct } from "../data/products.js";

/**
 * Checks one look against the hard rules. `otherLooks` is the rest of
 * the current candidate set, used only for the duplicate check.
 *
 * Returns a report object; `passed` is true only if every rule is
 * satisfied — afterAgentCallback in stylistPipeline.js uses that single
 * boolean to force verdict: "revise" regardless of what the model says.
 */
export function checkLookRules(look, styleRequest, otherLooks = []) {
  const products = look.productIds.map(findProduct);
  const unknownProduct = look.productIds.filter((id, index) => !products[index]);
  const knownProducts = products.filter(Boolean);

  // --- budget ---
  const total = knownProducts.reduce((sum, product) => sum + product.price, 0);
  const limit = styleRequest?.budget > 0 ? styleRequest.budget : null;
  const budget = {
    total,
    limit,
    overBy: limit != null && total > limit ? Math.round((total - limit) * 100) / 100 : 0,
  };

  // --- category: a complete look is either a dress, or a top + a bottom.
  // Outerwear is a bonus layer, not enough on its own.
  const categories = knownProducts.map((product) => product.category);
  const hasDress = categories.includes("Dresses");
  const hasTop = categories.includes("Tops");
  const hasBottom = categories.includes("Bottoms");
  const categoryOk = hasDress || (hasTop && hasBottom);
  const category = {
    ok: categoryOk,
    reason: categoryOk
      ? ""
      : "Needs a dress, or a top and a bottom together — not just one piece or only outerwear.",
  };

  // --- avoid: does any product's name or category mention something the
  // user asked to avoid?
  const avoidWords = (styleRequest?.avoid || []).map((word) => word.toLowerCase());
  const avoid = knownProducts
    .filter((product) =>
      avoidWords.some(
        (word) =>
          word &&
          (product.name.toLowerCase().includes(word) || product.category.toLowerCase().includes(word))
      )
    )
    .map((product) => product.name);

  // --- duplicate: is this exact set of product ids already in another
  // look in the same candidate set?
  const sortedIds = [...look.productIds].sort().join(",");
  const duplicateOf = otherLooks.findIndex(
    (other) => other !== look && [...other.productIds].sort().join(",") === sortedIds
  );

  const passed =
    unknownProduct.length === 0 && budget.overBy === 0 && category.ok && avoid.length === 0 && duplicateOf === -1;

  return { unknownProduct, budget, category, avoid, duplicateOf, passed };
}
