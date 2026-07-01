import { Salt } from "../../types";
import { ProductsResponse } from "./products";
import { fetchJson } from "./client";

export async function searchProducts(
  searchText: string,
  page = 1,
  categoryName = "",
  showHidden = false,
  options?: RequestInit
): Promise<ProductsResponse> {
  return fetchJson<ProductsResponse>("products", {
    method: "POST",
    body: JSON.stringify({
      text: searchText,
      page,
      category_name: categoryName,
      show_hidden: showHidden,
    }),
    next: { revalidate: 900 },
    ...options,
  });
}

export async function searchSaltProducts(
  searchText: string,
  page = 1,
  showHidden = false,
  rc: number | null = null,
  options?: RequestInit
): Promise<ProductsResponse> {
  return fetchJson<ProductsResponse>("salt_products", {
    method: "POST",
    body: JSON.stringify({
      text: searchText,
      page,
      show_hidden: showHidden,
      rc,
    }),
    next: { revalidate: 900 },
    ...options,
  });
}

export async function searchSalt(searchTerm: string, options?: RequestInit): Promise<Salt[]> {
  return fetchJson<Salt[]>("search_composition_code", {
    method: "POST",
    body: JSON.stringify({ search_term: searchTerm }),
    next: { revalidate: 3600 },
    ...options,
  });
}

export interface SearchAltProductsParams {
  page?: number;
  composition: string;
  excludeProductId?: number | string | null;
  rc?: number;
  showHidden?: boolean;
}

export async function searchAltProducts(
  params: SearchAltProductsParams,
  options?: RequestInit
): Promise<ProductsResponse> {
  return fetchJson<ProductsResponse>("alt_products", {
    method: "POST",
    body: JSON.stringify({
      page: params.page ?? 1,
      composition: params.composition,
      exclude_product_id: params.excludeProductId ?? null,
      rc: params.rc ?? 1,
      show_hidden: params.showHidden ?? false,
    }),
    next: { revalidate: 3600 },
    ...options,
  });
}
