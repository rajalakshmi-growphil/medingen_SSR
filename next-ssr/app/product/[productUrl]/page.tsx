import SearchViewMedicine from "@/legacy/components/SearchViewMedicine/SearchViewMedicine";
import { Suspense } from "react";

export const metadata = {
  title: "Product Details - Medingen",
  description: "View details of products on Medingen.",
};

export default function ProductDetailPage() {
  return (
    <Suspense fallback={<div style={{ padding: "100px", textAlign: "center", fontSize: "20px", fontFamily: "Outfit, sans-serif" }}>Loading Product Details...</div>}>
      <SearchViewMedicine />
    </Suspense>
  );
}
