import React, { Suspense } from "react";
import { Login2 } from "@/legacy/components/Login2/Login2";

export const metadata = {
  title: "Verify OTP | Medingen",
  description: "Verify your mobile number using the OTP code sent to your phone.",
};

export default function Login2Page() {
  return (
    <Suspense fallback={<div style={{ textAlign: "center", padding: "100px", fontFamily: "Outfit, sans-serif" }}>Loading OTP verification...</div>}>
      <Login2 />
    </Suspense>
  );
}
