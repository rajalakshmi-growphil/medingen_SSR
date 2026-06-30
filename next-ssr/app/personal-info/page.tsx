import React, { Suspense } from "react";
import { PersonalInfo } from "@/legacy/components/PersonalInfo/PersonalInfo";

export default function PersonalInfoPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: "center", padding: "40px" }}>Loading personal details...</div>}>
      <PersonalInfo />
    </Suspense>
  );
}
