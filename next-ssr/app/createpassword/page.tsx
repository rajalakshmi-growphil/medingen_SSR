import React, { Suspense } from "react";
import { CreatePassword } from "@/legacy/components/CreatePassword/CreatePassword";

export const metadata = {
  title: "Create Password | Medingen",
  description: "Secure your account by creating a new password.",
};

export default function CreatePasswordPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: "center", padding: "100px", fontFamily: "Outfit, sans-serif" }}>Loading password creation...</div>}>
      <CreatePassword />
    </Suspense>
  );
}
