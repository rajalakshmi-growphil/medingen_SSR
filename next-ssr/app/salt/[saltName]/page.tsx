import React, { Suspense } from "react";
import { SaltPage } from "@/legacy/components/SaltPage/SaltPage";
import { Metadata } from "next";

export async function generateMetadata({ params }: { params: { saltName: string } }): Promise<Metadata> {
  const saltName = decodeURIComponent(params.saltName || "");
  const seoTitle = `${saltName} – Uses, Dosage, Side Effects & Price | MediGen`;
  const seoDescription = `Complete information on ${saltName}: uses, dosage, side effects, interactions, substitutes and best price. Compare generic medicines with ${saltName} composition.`;
  return {
    title: seoTitle,
    description: seoDescription,
    alternates: {
      canonical: `https://medingen.in/salt/${encodeURIComponent(saltName)}`,
    },
  };
}

export default function SaltRoute({ params }: { params: { saltName: string } }) {
  return (
    <Suspense fallback={<div style={{ textAlign: "center", padding: "40px" }}>Loading salt information...</div>}>
      <SaltPage />
    </Suspense>
  );
}
