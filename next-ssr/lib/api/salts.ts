import { AveragePriceInfo } from "../../types";
import { fetchJson } from "./client";
import { searchProducts } from "./search";

export async function getSalt(saltName: string, options?: RequestInit): Promise<any> {
  return fetchJson<any>("get_salt", {
    method: "POST",
    body: JSON.stringify({ salt_name: saltName }),
    next: { revalidate: 3600 },
    ...options,
  });
}

export async function getAveragePrice(
  composition: string,
  saltName = "",
  options?: RequestInit
): Promise<AveragePriceInfo> {
  return fetchJson<AveragePriceInfo>("avg_price", {
    method: "POST",
    body: JSON.stringify({ composition, salt_name: saltName }),
    next: { revalidate: 3600 },
    ...options,
  });
}

// Helper to fetch popular salts for static params (based on top product compositions)
export async function getPopularSalts(): Promise<any[]> {
  try {
    const popularCategories = ["Tablet", "Capsule"];
    const compositions = new Set<string>();

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
            if (slug) {
              compositions.add(slug);
            }
          }
        }
      }
    }
    return Array.from(compositions).map((slug) => ({ slug }));
  } catch (error) {
    console.error("Error fetching popular salts for static params:", error);
  }
  return [];
}
