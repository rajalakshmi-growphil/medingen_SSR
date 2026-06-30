import React, { Suspense } from "react";
import { PaymentPage } from "@/legacy/components/PaymentPage/PaymentPage";

export const metadata = {
  title: "Secure Payment | Medingen",
  description: "Select payment method and complete order payment securely.",
};

export default function PaymentPageWrapper() {
  return (
    <Suspense fallback={<div style={{ textAlign: "center", padding: "100px", fontFamily: "Outfit, sans-serif" }}>Loading secure checkout payment...</div>}>
      <PaymentPage />
    </Suspense>
  );
}
