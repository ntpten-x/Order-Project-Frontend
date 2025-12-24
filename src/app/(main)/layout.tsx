import React from "react";
import BottomNavigation from "@/components/BottomNavigation";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen pb-24 relative"> 
      {/* pb-24 to prevent content from being hidden behind the fixed bottom nav */}
      {children}
      <BottomNavigation />
    </div>
  );
}
