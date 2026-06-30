import React, { Suspense } from "react";
import { OrderProgress } from "@/legacy/components/OrderProgressConfirmation/OrderProgressConfirmation";

export const metadata = {
  title: "Order Progress | Medingen",
  description: "Review your order progress on Medingen.",
};

export default function OrderProgressPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: "center", padding: "100px", fontFamily: "Outfit, sans-serif" }}>Loading Order Progress...</div>}>
      <OrderProgress />
    </Suspense>
  );
}
