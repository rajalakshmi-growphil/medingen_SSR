"use client";

import React from "react";
import { CartProvider, CompareProvider, ProfileProvider } from "../legacy/api/stateContext";

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ProfileProvider>
      <CartProvider>
        <CompareProvider>
          {children}
        </CompareProvider>
      </CartProvider>
    </ProfileProvider>
  );
}
