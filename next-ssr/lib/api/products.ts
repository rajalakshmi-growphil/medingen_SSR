import { Product } from "../../types";
import { fetchCached, fetchJson } from "./client";

export interface ProductsResponse {
  results: Product[];
  total_pages: number;
  total_results: number;
}

export interface GetProductsByCategoryParams {
  categoryName: string | null;
  page?: number;
  perPage?: number;
  sortBy?: string;
  consumeType?: string | null;
  composition?: string | null;
  subCategories?: string[];
}

export async function getProductsByCategory(
  params: GetProductsByCategoryParams,
  options?: RequestInit
): Promise<ProductsResponse> {
  return fetchJson<ProductsResponse>("get_products_by_category", {
    method: "POST",
    body: JSON.stringify({
      category_name: params.categoryName,
      page: params.page ?? 1,
      per_page: params.perPage ?? 12,
      sort_by: params.sortBy ?? "price_low_high",
      consume_type: params.consumeType,
      composition: params.composition,
      sub_categories: params.subCategories ?? [],
    }),
    next: { revalidate: 1800 },
    ...options,
  });
}

export async function getProductDetails(
  id: number | string,
  name = "",
  options?: RequestInit
): Promise<any> {
  return fetchCached<any>(
    `product_details/${id}?name=${encodeURIComponent(name)}`,
    3600,
    options
  );
}

export async function getFooterProducts(options?: RequestInit): Promise<any> {
  return fetchCached<any>("footer-products", 3600, options);
}

// Fetch dynamic descriptions (HTML files) from CloudFront
export async function fetchHtmlDescription(
  urlPath: string,
  type: "product_description" | "policies" | "blogs/description",
  options?: RequestInit
): Promise<string> {
  const cdnBase = "https://d1dh0rr5xj2p49.cloudfront.net";
  const url = `${cdnBase}/${type}/${urlPath.replace(/^\//, "")}`;
  const res = await fetch(url, {
    next: { revalidate: 3600 },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch HTML description from ${url}`);
  }
  return res.text();
}

export async function getBanner(section: string, options?: RequestInit): Promise<any> {
  return fetchJson<any>("banner", {
    method: "POST",
    body: JSON.stringify({ section }),
    next: { revalidate: 3600 },
    ...options,
  });
}

// Helper to fetch popular products for static generation
export async function getPopularProducts(): Promise<any[]> {
  try {
    const data = await getFooterProducts();
    if (data && data.topSellingMedicines) {
      const paths = data.topSellingMedicines.map((item: any) => {
        const slug = item.value.replace("/product/", "");
        return { slug };
      });
      return paths;
    }
  } catch (error) {
    console.error("Error fetching popular products for static params:", error);
  }
  return [];
}
