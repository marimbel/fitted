/**
 * tests/mockShopService.test.js
 *
 * Unit tests for services/mockShopService.js -- no live network call
 * to mock.shop needed, same pattern as the rest of the backend's
 * tests: normalizeMockShopProduct() is pure code and gets a real test
 * against a canned GraphQL response shape; fetchMockShopProducts()'s
 * one network call is replaced with a fake `post` via its injectable
 * `deps` argument (mirrors runOrchestrator()'s `{ generate, firestore }`
 * pattern).
 *
 * Run with: npm test (= node --test tests/)
 */
import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { fetchMockShopProducts, normalizeMockShopProduct, __resetCacheForTests } from "../services/mockShopService.js";

describe("normalizeMockShopProduct (the deterministic mapping step)", () => {
  test("maps a Mock Shop product node into Fitted's product shape", () => {
    const node = {
      id: "gid://shopify/Product/1",
      title: "The Collection Snowboard: Liquid",
      productType: "Snowboard",
      vendor: "Mock Shop",
      priceRange: { minVariantPrice: { amount: "749.95", currencyCode: "USD" } },
      featuredImage: { url: "https://mock.shop/cdn/snowboard.png", altText: "A snowboard" },
    };

    const product = normalizeMockShopProduct(node);

    assert.equal(product.id, "gid://shopify/Product/1");
    assert.equal(product.name, "The Collection Snowboard: Liquid");
    assert.equal(product.category, "Snowboard");
    assert.equal(product.price, 750); // rounded
    assert.equal(product.image, "https://mock.shop/cdn/snowboard.png");
    assert.equal(product.source, "mockshop");
  });

  test("falls back to vendor, then 'Other', when productType is missing", () => {
    const withVendorOnly = normalizeMockShopProduct({
      id: "gid://shopify/Product/2",
      title: "No Type",
      productType: "",
      vendor: "Some Vendor",
      priceRange: { minVariantPrice: { amount: "10" } },
      featuredImage: null,
    });
    assert.equal(withVendorOnly.category, "Some Vendor");
    assert.equal(withVendorOnly.image, null);

    const withNeither = normalizeMockShopProduct({
      id: "gid://shopify/Product/3",
      title: "No Type Or Vendor",
      productType: "",
      vendor: "",
      priceRange: {},
    });
    assert.equal(withNeither.category, "Other");
    assert.equal(withNeither.price, 0);
  });
});

describe("fetchMockShopProducts (network call replaced via deps)", () => {
  // Each test starts from a clean cache -- fetchMockShopProducts()
  // caches its last good result (and falls back to it on error), which
  // would otherwise let one test's result leak into the next.
  beforeEach(() => __resetCacheForTests());

  test("returns the normalized product list from a fake GraphQL response", async () => {
    const fakePost = async (query, variables) => {
      assert.ok(query.includes("products"));
      assert.equal(variables.first, 24);
      return {
        data: {
          products: {
            nodes: [
              {
                id: "gid://shopify/Product/1",
                title: "Test Product",
                productType: "Hat",
                vendor: "Mock Shop",
                priceRange: { minVariantPrice: { amount: "25.00" } },
                featuredImage: { url: "https://mock.shop/cdn/hat.png" },
              },
            ],
          },
        },
      };
    };

    const products = await fetchMockShopProducts({}, { post: fakePost });

    assert.equal(products.length, 1);
    assert.equal(products[0].name, "Test Product");
    assert.equal(products[0].category, "Hat");
  });

  test("surfaces GraphQL errors as a thrown Error", async () => {
    const fakePost = async () => ({ errors: [{ message: "field not found" }] });

    await assert.rejects(
      () => fetchMockShopProducts({ first: 1 }, { post: fakePost }),
      /field not found/
    );
  });
});
