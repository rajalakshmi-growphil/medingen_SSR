import React, { Suspense } from "react";
import { OrderPlacedSuccess } from "@/legacy/components/OrderPlacedSuccess/OrderPlacedSuccess";

export const metadata = {
  title: "Order Placed Successfully | Medingen",
  description: "Your order has been placed successfully on Medingen.",
};

export default function OrderPlacedSuccessPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: "center", padding: "100px", fontFamily: "Outfit, sans-serif" }}>Loading order success details...</div>}>
      <OrderPlacedSuccess />
    </Suspense>
  );
}
