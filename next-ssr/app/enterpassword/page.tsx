import React, { Suspense } from "react";
import { EnterPassword } from "@/legacy/components/EnterPassword/EnterPassword";

export const metadata = {
  title: "Enter Password | Medingen",
  description: "Enter password to authenticate and access your Medingen account.",
};

export default function EnterPasswordPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: "center", padding: "100px", fontFamily: "Outfit, sans-serif" }}>Loading Password Screen...</div>}>
      <EnterPassword />
    </Suspense>
  );
}
