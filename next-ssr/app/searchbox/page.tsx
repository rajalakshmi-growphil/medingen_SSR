import React, { Suspense } from "react";
import { SearchBox } from "../../legacy/screens/SearchBox/SearchBox";
import type { Metadata } from "next";

export const revalidate = 900;

export const metadata: Metadata = {
  title: "Search Medicines – Find Generic & Branded Drugs | Medingen",
  description:
    "Search for medicines by name, composition, or brand. Compare prices and find the cheapest generic alternatives on Medingen.",
  alternates: {
    canonical: "https://medingen.in/searchbox",
  },
  openGraph: {
    title: "Search Medicines – Medingen",
    description:
      "Search for medicines by name, composition, or brand. Compare prices and find the cheapest generic alternatives.",
    url: "https://medingen.in/searchbox",
    siteName: "Medingen",
    type: "website",
  },
};

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchBox />
    </Suspense>
  );
}
