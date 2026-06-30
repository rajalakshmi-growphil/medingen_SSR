import React, { Suspense } from "react";
import { PharmacistVerification } from "@/legacy/components/PharmacistVerification/PharmacistVerification";

export const metadata = {
  title: "Pharmacist Verification | Medingen",
  description: "Verify your generic medicines prescription with our expert pharmacist.",
};

export default function PharmacistVerificationPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: "center", padding: "100px", fontFamily: "Outfit, sans-serif" }}>Loading pharmacist verification...</div>}>
      <PharmacistVerification />
    </Suspense>
  );
}
