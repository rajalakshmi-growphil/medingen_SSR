import { AllCategories } from "@/legacy/Category/AllCategories";
import { Suspense } from "react";

export const metadata = {
  title: "Categories - Medingen",
  description: "Browse all medicine categories on Medingen.",
};

export default function CategoriesPage() {
  return (
    <Suspense fallback={<div style={{ padding: "50px", textAlign: "center" }}>Loading Categories...</div>}>
      <AllCategories />
    </Suspense>
  );
}
