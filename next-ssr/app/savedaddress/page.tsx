import React, { Suspense } from "react";
import { SavedAddress } from "@/legacy/components/SavedAddress/SavedAddress";

export const metadata = {
  title: "Saved Addresses | Medingen",
  description: "Manage your saved delivery addresses for generic medicines delivery.",
};

export default function SavedAddressPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: "center", padding: "100px", fontFamily: "Outfit, sans-serif" }}>Loading addresses...</div>}>
      <SavedAddress />
    </Suspense>
  );
}
