import { Category } from "../../types";
import { fetchCached } from "./client";

export async function getCategories(options?: RequestInit): Promise<Category[]> {
  return fetchCached<Category[]>("all_categories", 3600, options);
}

export async function getAllCategories(options?: RequestInit): Promise<Category[]> {
  return fetchCached<Category[]>("all_categories", 3600, options);
}

export async function getMainCategories(options?: RequestInit): Promise<any> {
  return fetchCached<any>("main_categories", 3600, options);
}

export async function getCategoryHierarchy(options?: RequestInit): Promise<any> {
  return fetchCached<any>("category_hierarchy", 3600, options);
}
