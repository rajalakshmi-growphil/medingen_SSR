import React, { Suspense } from "react";
import { ExistingUser } from "@/legacy/components/ExistingUser/ExistingUser";

export const metadata = {
  title: "Account Found | Medingen",
  description: "Account found for this number. Choose login method to proceed.",
};

export default function ExistingUserPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: "center", padding: "100px", fontFamily: "Outfit, sans-serif" }}>Loading...</div>}>
      <ExistingUser />
    </Suspense>
  );
}
