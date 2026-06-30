import React, { Suspense } from "react";
import { OrderProgress } from "@/legacy/components/OrderProgressConfirmation/OrderProgressConfirmation";

export const metadata = {
  title: "Your Cart | Medingen",
  description: "Review and place your order on Medingen.",
};

export default function CartPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: "center", padding: "100px", fontFamily: "Outfit, sans-serif" }}>Loading Cart...</div>}>
      <OrderProgress />
    </Suspense>
  );
}
