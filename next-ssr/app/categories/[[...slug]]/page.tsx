import React, { Suspense } from "react";
import { CategoryPage } from "../../../legacy/screens/Category/CategoryPage";
import { getAllCategories, getMainCategories, getProductsByCategory } from "../../../lib/api";
import type { Metadata } from "next";

// ISR: revalidate every 30 minutes
export const revalidate = 1800;
export const dynamicParams = true;

interface PageProps {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<{ page?: string; sortBy?: string; compose?: string }>;
}

const nameToSlug = (name: string) => {
  return name
    ? name
      .toLowerCase()
      .replace(/&/g, "and")                 
      .replace(/[^a-z0-9\s-]/g, "")      
      .trim()
      .replace(/\s+/g, "-")                  
    : "";
};

const slugToName = (slug: string) =>
  slug
    ? slug
      .replace(/-\d+$/, "")
      .split(/[-_]/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")
    : "";

export async function generateStaticParams() {
  try {
    const categories = await getAllCategories();
    if (categories && Array.isArray(categories)) {
      const paths = categories
        .filter((cat) => cat.display_name || cat.category_name)
        .map((cat) => {
          const mainSlug = nameToSlug(cat.display_name || cat.category_name);
          return { slug: [mainSlug] };
        });
      return [
        { slug: [] },
        ...paths,
      ];
    }
  } catch (error) {
    console.error("Failed to generate static params for categories:", error);
  }
  return [{ slug: [] }];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const slugs = resolvedParams.slug || [];
  const mainSlug = slugs[0] || "";
  const categoryName = mainSlug ? slugToName(mainSlug) : "All Categories";
  const canonicalPath = mainSlug ? `/categories/${mainSlug}` : "/categories";

  return {
    title: `${categoryName} – Buy Online at Best Price | Medingen`,
    description: `Browse ${categoryName} medicines online at Medingen. Compare prices, find generics, and save up to 85% on prescription and OTC medicines.`,
    alternates: {
      canonical: `https://medingen.in${canonicalPath}`,
    },
    openGraph: {
      title: `${categoryName} – Medingen`,
      description: `Shop ${categoryName} medicines at the lowest prices on Medingen.`,
      url: `https://medingen.in${canonicalPath}`,
      siteName: "Medingen",
      type: "website",
    },
    twitter: {
      card: "summary",
      title: `${categoryName} – Medingen`,
      description: `Shop ${categoryName} medicines at the lowest prices on Medingen.`,
    },
  };
}

export default async function CategoryPageRoute({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const slugs = resolvedParams.slug || [];
  const mainSlug = slugs[0] || "";
  const subSlug = slugs[1] || "";

  const currentPage = Number(resolvedSearchParams.page || "1");
  const sortBy = resolvedSearchParams.sortBy || "price_low_high";
  const composeFilter = resolvedSearchParams.compose || "";

  const categoryName = slugToName(mainSlug);
  const subCategoryName = subSlug ? slugToName(subSlug) : "";

  let categories: any[] = [];
  let dynamicCategoryData: any[] = [];
  let products: any[] = [];
  let totalPages = 1;
  let totalResults = 0;
  let selectedCategory: any = null;

  try {
    const [allCatData, hierarchyRes] = await Promise.all([
      getAllCategories(),
      getMainCategories(),
    ]);

    const rawHierarchyArray = Array.isArray(hierarchyRes) ? hierarchyRes : (hierarchyRes?.main_categories || hierarchyRes?.categories || []);
    
    // Process Main Categories hierarchy
    const formattedHierarchy = rawHierarchyArray.map((cat: any) => {
      const rawSubCats = cat.sub_categories || cat.subcategories || cat.children || cat.items || [];
      const subCatsArray = Array.isArray(rawSubCats) ? rawSubCats : [];
      return {
        title: cat.name || cat.category_name || cat.title,
        category_name: cat.category_name || cat.name || cat.title,
        display_name: cat.name || cat.title || cat.category_name,
        id: cat.id || cat.main_category_id,
        items: subCatsArray
          .map((s: any) => {
            if (typeof s === "string") return s;
            return s.name || s.category_name || s.title || "";
          })
          .filter((s: any) => s !== ""),
      };
    });

    const priorityOrder = [
      "Personal Care",
      "Health Conditions",
      "Vitamins & Supplements",
      "Diabetes Care",
      "Chronic Care",
    ];

    dynamicCategoryData = formattedHierarchy.sort((a: any, b: any) => {
      const indexA = priorityOrder.indexOf(a.title);
      const indexB = priorityOrder.indexOf(b.title);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return a.title.localeCompare(b.title);
    });

    // Process Sub-categories list
    categories = (allCatData || []).sort((a: any, b: any) => {
      if (a.show_on_home > 0 && b.show_on_home > 0) return a.show_on_home - b.show_on_home;
      return a.show_on_home > 0 ? -1 : b.show_on_home > 0 ? 1 : 0;
    });

    // Find Match from URL
    if (mainSlug) {
      selectedCategory = formattedHierarchy.find(
        (cat: any) => nameToSlug(cat.display_name) === mainSlug || nameToSlug(cat.category_name) === mainSlug
      );
      if (!selectedCategory) {
        selectedCategory = categories.find(
          (cat: any) => nameToSlug(cat.display_name) === mainSlug || nameToSlug(cat.category_name) === mainSlug
        );
      }
      if (!selectedCategory) {
        selectedCategory = {
          category_name: slugToName(mainSlug),
          display_name: slugToName(mainSlug),
          id: "custom_fallback",
        };
      }
    }

    if (!selectedCategory) {
      selectedCategory = categories.find((cat: any) => cat.display_name === "Tablet") || categories[0];
    }

    // Call API for products of matched category
    if (selectedCategory) {
      const mainCatName = selectedCategory.category_name || selectedCategory.title || "";
      const selectedSubs = subCategoryName ? [subCategoryName] : [];

      const results = await getProductsByCategory({
        categoryName: mainCatName,
        page: currentPage,
        sortBy: sortBy,
        perPage: 8,
        composition: composeFilter || null,
        subCategories: selectedSubs,
        consumeType: null
      } as any);

      products = results.results || [];
      totalPages = results.total_pages || 1;
      totalResults = results.total_results || 0;
    }

  } catch (error) {
    console.error("Error fetching category page data server-side:", error);
  }

  const categoryProps = {
    categories,
    dynamicCategoryData,
    selectedCategory,
    products,
    totalPages,
    totalResults,
    currentPage
  };

  return (
    <Suspense fallback={null}>
      <CategoryPage {...categoryProps} />
    </Suspense>
  );
}
