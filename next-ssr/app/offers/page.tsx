import React, { Suspense } from "react";
import { Offers } from "@/legacy/components/Offers/Offers";

export const metadata = {
  title: "Offers & Discounts | Medingen",
  description: "Explore the latest offers, discounts, and rewards on Medingen. Save big on your generic medicine orders.",
};

export default function OffersPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: "center", padding: "100px", fontFamily: "Outfit, sans-serif" }}>Loading Offers...</div>}>
      <Offers />
    </Suspense>
  );
}
