"use client";

import React from "react";
import UsersBottomNavigation from "../../../components/users/UsersBottomNavigation";

export default function UsersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
    <div className="min-h-screen pb-24 relative">
      {children}
      <UsersBottomNavigation />
    </div>

    </>
  );
}
