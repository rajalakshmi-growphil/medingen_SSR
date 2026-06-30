import React, { Suspense } from "react";
import { Login3 } from "@/legacy/components/Login3/Login3";

export const metadata = {
  title: "Verify Sign-in | Medingen",
  description: "Verify your credentials using the OTP sent to your phone.",
};

export default function Login3Page() {
  return (
    <Suspense fallback={<div style={{ textAlign: "center", padding: "100px", fontFamily: "Outfit, sans-serif" }}>Loading verification...</div>}>
      <Login3 />
    </Suspense>
  );
}
