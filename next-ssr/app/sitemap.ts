import { MetadataRoute } from "next";
import { getCategories, searchProducts, getAllCategories } from "../lib/api";

const BASE_URL = "https://medingen.in";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  /* ---------------------------------------------------------------- */
  /*  1. Static Routes                                                  */
  /* ---------------------------------------------------------------- */
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE_URL}/categories`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/privacy-policy`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE_URL}/terms-and-conditions`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE_URL}/return-policy`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE_URL}/offers`, lastModified: new Date(), changeFrequency: "daily", priority: 0.7 },
    { url: `${BASE_URL}/searchbox`, lastModified: new Date(), changeFrequency: "daily", priority: 0.6 },
  ];

  /* ---------------------------------------------------------------- */
  /*  2. Dynamic Category Routes                                        */
  /* ---------------------------------------------------------------- */
  let categoryRoutes: MetadataRoute.Sitemap = [];
  try {
    const categories = await getAllCategories();
    if (Array.isArray(categories)) {
      categoryRoutes = categories
        .filter((cat) => cat.display_name || cat.category_name)
        .map((cat) => {
          const slug = (cat.display_name || cat.category_name)
            .toLowerCase()
            .replace(/&/g, "and")
            .replace(/[^a-z0-9\s-]/g, "")
            .trim()
            .replace(/\s+/g, "-");
          return {
            url: `${BASE_URL}/categories/${slug}`,
            lastModified: new Date(),
            changeFrequency: "weekly" as const,
            priority: 0.7,
          };
        });
    }
  } catch (error) {
    console.error("Sitemap: error fetching categories:", error);
  }

  /* ---------------------------------------------------------------- */
  /*  3. Dynamic Product Routes (popular/high-traffic)                  */
  /* ---------------------------------------------------------------- */
  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    // Fetch first page of popular products across common categories
    const popularCategories = ["Tablet", "Capsule", "Syrup", "Cream", "Injection"];
    const productSlugs = new Set<string>();

    const categoryResults = await Promise.allSettled(
      popularCategories.map((cat) => searchProducts(cat, 1))
    );

    for (const result of categoryResults) {
      if (result.status === "fulfilled" && result.value?.results) {
        for (const prod of result.value.results) {
          if (prod.product_name_url && !productSlugs.has(prod.product_name_url)) {
            productSlugs.add(prod.product_name_url);
          }
        }
      }
    }

    productRoutes = Array.from(productSlugs).map((slug) => ({
      url: `${BASE_URL}/product/${slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch (error) {
    console.error("Sitemap: error fetching products:", error);
  }

  /* ---------------------------------------------------------------- */
  /*  4. Dynamic Salt/Composition Routes                                */
  /* ---------------------------------------------------------------- */
  let saltRoutes: MetadataRoute.Sitemap = [];
  try {
    // Extract unique compositions from the products we already fetched
    const compositions = new Set<string>();
    const popularCategories = ["Tablet", "Capsule"];
    const catResults = await Promise.allSettled(
      popularCategories.map((cat) => searchProducts(cat, 1))
    );

    for (const result of catResults) {
      if (result.status === "fulfilled" && result.value?.results) {
        for (const prod of result.value.results) {
          if (prod.composition) {
            const slug = prod.composition
              .toLowerCase()
              .replace(/\s*\+\s*/g, "-")
              .replace(/[^a-z0-9-]/g, "")
              .trim();
            if (slug && !compositions.has(slug)) {
              compositions.add(slug);
            }
          }
        }
      }
    }

    saltRoutes = Array.from(compositions).map((slug) => ({
      url: `${BASE_URL}/salt/${encodeURIComponent(slug)}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));
  } catch (error) {
    console.error("Sitemap: error building salt routes:", error);
  }

  /* ---------------------------------------------------------------- */
  /*  Combine All Routes                                                */
  /* ---------------------------------------------------------------- */
  return [
    ...staticRoutes,
    ...categoryRoutes,
    ...productRoutes,
    ...saltRoutes,
  ];
}
