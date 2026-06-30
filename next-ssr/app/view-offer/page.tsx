import React, { Suspense } from "react";
import { OffersView } from "@/legacy/components/OffersView/OffersView";

export const metadata = {
  title: "Offer Details | Medingen",
  description: "View details of this exclusive Medingen offer.",
};

export default function OffersViewPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: "center", padding: "100px", fontFamily: "Outfit, sans-serif" }}>Loading Offer Details...</div>}>
      <OffersView />
    </Suspense>
  );
}
