import React, { Suspense } from "react";
import { Dashboard } from "../legacy/screens/Dashboard/Dashboard";
import { getCategories, getAllCategories, getBanner, getMainCategories, searchProducts } from "../lib/api";
import type { Metadata } from "next";

// ISR validation interval
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Medingen – Buy Generic & Branded Medicines Online at Best Prices",
  description:
    "India's trusted online pharmacy. Buy prescription medicines, OTC drugs, health supplements and personal care products at up to 85% off. Free home delivery on all orders.",
  keywords:
    "buy medicines online, generic medicines, online pharmacy India, cheap medicines, Medingen, prescription drugs, OTC medicines",
  alternates: {
    canonical: "https://medingen.in",
  },
  openGraph: {
    title: "Medingen – Buy Generic & Branded Medicines Online",
    description:
      "India's trusted online pharmacy. Save up to 85% on medicines with free home delivery.",
    url: "https://medingen.in",
    siteName: "Medingen",
    type: "website",
    images: [
      {
        url: "https://medingen.in/logo.png",
        width: 800,
        height: 200,
        alt: "Medingen",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Medingen – Buy Generic & Branded Medicines Online",
    description:
      "India's trusted online pharmacy. Save up to 85% on medicines with free home delivery.",
    images: ["https://medingen.in/logo.png"],
  },
};

export default async function HomePage() {
  let categories: any[] = [];
  let fullCategoryList: any[] = [];
  let slides: any[] = [];
  let dynamicCategoryData: any[] = [];
  let products: any[] = [];
  let allCategories: any[] = [];

  try {
    const [catData, allCatData, bannerData, hierarchy] = await Promise.all([
      getCategories(),
      getAllCategories(),
      getBanner("home_banner"),
      getMainCategories(),
    ]);

    categories = catData || [];
    fullCategoryList = allCatData || [];
    slides = bannerData || [];
    
    // Process Main Categories hierarchy sorted order
    const rawHierarchyArray = Array.isArray(hierarchy) ? hierarchy : (hierarchy?.main_categories || hierarchy?.categories || []);
    const formattedHierarchy = rawHierarchyArray.map((cat: any) => {
      const rawSubCats = cat.sub_categories || cat.subcategories || cat.children || cat.items || [];
      const subCatsArray = Array.isArray(rawSubCats) ? rawSubCats : [];
      return {
        title: cat.name || cat.category_name || cat.title,
        items: subCatsArray
          .map((s: any) => {
            if (typeof s === "string") return { name: s, image: null };
            return {
              name: s.name || s.category_name || s.title || "",
              image: s.image || s.category_image_url || null
            };
          })
          .filter((s: any) => s.name !== ""),
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

    // Match Dashboard.jsx logic for allCategories
    const requestedNames = ["Diabetes Care", "OTC", "Face wash", "sachet", "Gel", "foot care"];
    const keywordMap: Record<string, string[]> = {
      "Diabetes Care": ["diabetes care"],
      "OTC": ["otc", "over the counter"],
      "Face wash": ["face wash", "cleanser"],
      "sachet": ["sachet"],
      "Gel": ["gel", "topical gel"],
      "foot care": ["foot care"],
    };

    allCategories = requestedNames
      .map((reqName) => {
        const words = keywordMap[reqName] || [reqName.toLowerCase()];
        const match = fullCategoryList.find((cat: any) => {
          const displayName = (cat.display_name || "").toLowerCase();
          const categoryName = (cat.category_name || "").toLowerCase();
          return words.some((word) => displayName.includes(word) || categoryName.includes(word));
        });
        if (match) {
          let imageUrl = "/medicine-details.png";
          if (match.category_image_url && typeof match.category_image_url === "string" && match.category_image_url.trim() !== "") {
            imageUrl = `/cloudfront-cdn/categories/${match.category_image_url.trim()}`;
          }
          return { name: reqName, id: match.category_id, image: imageUrl, category_name: match.category_name };
        }
        return null;
      })
      .filter((cat) => cat !== null);

    // Initial products fetch for the first category
    if (allCategories.length > 0) {
      const activeCat = allCategories[0];
      const prodData = await searchProducts(activeCat.category_name || activeCat.name, 1);
      products = prodData.results || [];
    }

  } catch (error) {
    console.error("Error pre-fetching home page data:", error);
  }

  // Pass down the pre-fetched states as props to Dashboard to bypass useEffect mounts
  const dashboardProps = {
    categories,
    fullCategoryList,
    slides,
    dynamicCategoryData,
    allCategories,
    products
  };

  return (
    <Suspense fallback={null}>
      <Dashboard {...dashboardProps} />
    </Suspense>
  );
}
