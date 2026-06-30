import React, { Suspense } from "react";
import { UploadPrescription } from "@/legacy/components/UploadPrescription/UploadPrescription";

export const metadata = {
  title: "Upload Prescription | Medingen",
  description: "Upload your prescription to order prescribed generic medicines.",
};

export default function UploadPrescriptionPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: "center", padding: "100px", fontFamily: "Outfit, sans-serif" }}>Loading prescription upload...</div>}>
      <UploadPrescription />
    </Suspense>
  );
}
