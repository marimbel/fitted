/**
 * services/mockShopService.js
 *
 * Fetches a real, live external product catalog from Shopify's Mock
 * Shop -- a public GraphQL Storefront API endpoint Shopify runs
 * specifically for development and demos, with no signup, API key, or
 * business account required:
 * https://shopify.dev/docs/storefronts/headless/mock-shop
 *
 * This is deliberately kept separate from data/products.js, which
 * stays the curated, stable catalog the agent pipeline (LookBuilder /
 * LookCritic / StyleScout) validates against. Mock Shop's own catalog
 * is Shopify's generic demo store (not fashion items specifically), so
 * it's used ONLY for the standalone Shop page (routes/shop.js) --
 * it never touches try-on or the AI agents.
 */
import axios from "axios";

const MOCK_SHOP_ENDPOINT = "https://mock.shop/api";

// Short in-memory cache so a page of visitors browsing Shop doesn't
// each trigger a fresh round-trip to mock.shop -- a time-based version
// of the same idea as the StyleScout catalog-embeddings cache.
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
let cache = { products: null, fetchedAt: 0 };

const PRODUCTS_QUERY = `
  query FittedShopProducts($first: Int!) {
    products(first: $first) {
      nodes {
        id
        title
        productType
        vendor
        priceRange {
          minVariantPrice {
            amount
            currencyCode
          }
        }
        featuredImage {
          url
          altText
        }
      }
    }
  }
`;

/**
 * Returns Mock Shop's product catalog, normalized into the same shape
 * Fitted's own catalog uses ({ id, name, category, price, image }) so
 * every existing component (ProductGrid, ProductCard, CategoryFilter)
 * renders it without any changes. Falls back to the last good cached
 * response on a fetch failure, so a flaky network doesn't take down
 * the whole Shop page -- only throws if there's truly nothing to serve.
 *
 * `deps.post` is injectable for testing (see tests/mockShopService.test.js),
 * mirroring the same dependency-injection pattern runOrchestrator() uses.
 */
export async function fetchMockShopProducts({ first = 24 } = {}, deps = {}) {
  const post = deps.post || defaultPost;

  const isFresh = cache.products && Date.now() - cache.fetchedAt < CACHE_TTL_MS;
  if (isFresh) {
    return cache.products;
  }

  try {
    const data = await post(PRODUCTS_QUERY, { first });

    if (data.errors?.length) {
      throw new Error(data.errors.map((e) => e.message).join("; "));
    }

    const nodes = data.data?.products?.nodes || [];
    const products = nodes.map(normalizeMockShopProduct);

    cache = { products, fetchedAt: Date.now() };
    return products;
  } catch (err) {
    if (cache.products) {
      // Serve the last good response rather than a broken page.
      return cache.products;
    }
    throw new Error(`Mock Shop request failed: ${err.message}`);
  }
}

async function defaultPost(query, variables) {
  const response = await axios.post(
    MOCK_SHOP_ENDPOINT,
    { query, variables },
    { headers: { "Content-Type": "application/json" }, timeout: 8000 }
  );
  return response.data;
}

/**
 * Test-only helper: clears the in-memory cache so each test starts
 * from a clean slate instead of silently reusing another test's
 * cached (or error-triggered-fallback) result. Not used by app.js.
 */
export function __resetCacheForTests() {
  cache = { products: null, fetchedAt: 0 };
}

/**
 * Converts one Mock Shop GraphQL product node into Fitted's own
 * product shape. Exported separately from fetchMockShopProducts() so
 * it can be unit-tested against a canned response with no live network
 * call -- the same "pure function" testing pattern agents/lookRules.js
 * uses.
 */
export function normalizeMockShopProduct(node) {
  const price = Number(node.priceRange?.minVariantPrice?.amount ?? 0);

  return {
    id: node.id,
    name: node.title,
    // Mock Shop's demo catalog (snowboards, hats, accessories) doesn't
    // have fashion categories like Fitted's own Tops/Outerwear/Dresses/
    // Bottoms -- rather than force a mismatch, this uses the live
    // API's own productType (falling back to vendor) as the category,
    // so the filter reflects whatever Mock Shop actually returns.
    category: node.productType || node.vendor || "Other",
    price: Math.round(price),
    image: node.featuredImage?.url || null,
    source: "mockshop",
  };
}
