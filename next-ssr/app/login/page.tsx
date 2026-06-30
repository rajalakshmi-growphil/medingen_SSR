import React, { Suspense } from "react";
import { Login1 } from "@/legacy/components/Login1/Login1";

export const metadata = {
  title: "Login | Medingen",
  description: "Sign in to your Medingen account using your mobile number or Google account.",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: "center", padding: "100px", fontFamily: "Outfit, sans-serif" }}>Loading Login...</div>}>
      <Login1 />
    </Suspense>
  );
}
