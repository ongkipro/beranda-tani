import type { Product } from "../data/products.ts";
import type { ProductJsonLdInput } from "./json-ld.ts";

/**
 * The Product JSON-LD a native landing page declares for the product it sells
 * (install theme: Petani Sejahtera). Same facts as the product page's own
 * block — D1 price per variant, the published rating, the manufacturer brand —
 * with the landing's own URL, since that is the page being described.
 */
export function landingProductJsonLd(product: Product, url: string): ProductJsonLdInput {
  return {
    name: product.productName,
    description: product.seoDescription || product.description,
    image: product.heroImage,
    url,
    sku: product.productId,
    category: product.category,
    ...(product.brand ? { brand: product.brand } : {}),
    ...(typeof product.ratingValue === "number" && typeof product.reviewCount === "number" && product.reviewCount > 0
      ? { ratingValue: product.ratingValue, reviewCount: product.reviewCount }
      : {}),
    offers: product.variants.map((variant) => ({
      price: variant.price,
      priceCurrency: "IDR",
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
      url,
      name: `${product.productName} - ${variant.label}`,
      ...(variant.sku ? { sku: variant.sku } : {}),
    })),
  };
}
