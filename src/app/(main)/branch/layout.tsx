"use client";

import React from "react";
import BranchBottomNavigation from "../../../components/branch/BranchBottomNavigation";

export default function BranchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
    <div className="min-h-screen pb-24 relative">
      {children}
      <BranchBottomNavigation />
    </div>

    </>
  );
}
