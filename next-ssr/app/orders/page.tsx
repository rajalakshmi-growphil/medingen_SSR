import React, { Suspense } from "react";
import { Orders } from "@/legacy/components/Orders/Orders";

export const metadata = {
  title: "My Orders | Medingen",
  description: "View and manage your recent generic medicine orders at Medingen.",
};

export default function OrdersPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: "center", padding: "100px", fontFamily: "Outfit, sans-serif" }}>Loading your orders...</div>}>
      <Orders />
    </Suspense>
  );
}
