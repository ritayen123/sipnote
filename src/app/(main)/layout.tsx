"use client";

import BottomNav from "../../components/ui/BottomNav";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="pb-20">
        {children}
      </div>
      <BottomNav />
    </>
  );
}
