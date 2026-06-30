import React, { Suspense } from "react";
import { ProfileView } from "@/legacy/components/ProfileView/ProfileView";

export default function ProfilePage() {
  return (
    <Suspense fallback={<div style={{ textAlign: "center", padding: "40px" }}>Loading profile...</div>}>
      <ProfileView />
    </Suspense>
  );
}
