import React, { Suspense } from "react";
import { SearchBox } from "@/legacy/components/SearchBox/SearchBox";

export default function SearchBoxPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: "center", padding: "40px" }}>Loading Search...</div>}>
      <SearchBox />
    </Suspense>
  );
}
