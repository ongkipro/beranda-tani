import assert from "node:assert/strict";
import test from "node:test";
import type { Product } from "../data/products.ts";
import { landingProductJsonLd } from "./landing-product-jsonld.ts";

const product = {
  productId: "76672",
  productName: "Bensu",
  seoDescription: "Stimulator recovery hortikultura.",
  description: "Long description.",
  heroImage: "/assets/uploads/bensu.webp",
  category: "Nutrisi Sayur & Buah",
  brand: "AUSSIE",
  ratingValue: 4.9,
  reviewCount: 487,
  variants: [
    { id: "3", label: "500ml", price: 130000, sku: "BENSU500ML" },
    { id: "4", label: "1 Liter", price: 215000 },
  ],
} as unknown as Product;

test("a landing declares its product with every variant priced from D1, its rating and brand", () => {
  const ld = landingProductJsonLd(product, "https://toko.test/bensu-jagung");
  assert.equal(ld.url, "https://toko.test/bensu-jagung");
  assert.equal(ld.brand, "AUSSIE");
  assert.equal(ld.ratingValue, 4.9);
  assert.equal(ld.reviewCount, 487);
  assert.deepEqual(ld.offers.map((o) => [o.name, o.price, o.sku]), [
    ["Bensu - 500ml", 130000, "BENSU500ML"],
    ["Bensu - 1 Liter", 215000, undefined],
  ]);
});

test("no rating is claimed when the product has none", () => {
  const ld = landingProductJsonLd({ ...product, ratingValue: undefined, reviewCount: 0 } as Product, "https://toko.test/x");
  assert.equal("ratingValue" in ld, false);
  assert.equal("reviewCount" in ld, false);
});
