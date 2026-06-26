import { CategoryPage } from "@/legacy/Category/CategoryPage";
import { Suspense } from "react";

export default function MainCategoryPage() {
  return (
    <Suspense fallback={<div style={{ padding: "50px", textAlign: "center" }}>Loading Category...</div>}>
      <CategoryPage />
    </Suspense>
  );
}
