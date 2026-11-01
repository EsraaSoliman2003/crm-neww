"use client";

import React from "react";
import BtnMenu from "./_components/BtnMenu";
import SidebarUser from "../Sidebar/_components/SidebarUser";
import NotificationBell from "./_components/NotificationBell";

const Navbar: React.FC = () => {
  return (
    <header className="sticky top-0 z-40 border-b border-rose-200/20 bg-[linear-gradient(180deg,rgba(43,13,18,0.96)_0%,rgba(23,7,11,0.92)_100%)] px-3 py-2 shadow-[0_14px_34px_rgba(18,4,7,0.28)] backdrop-blur-xl md:px-5 md:py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-4">
            <BtnMenu />
            <div className="hidden md:block">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.32em] text-rose-100/55">
                Construction Pricing
              </p>
              <p className="mt-1 text-sm font-semibold text-white/90">
                Dashboard Workspace
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <NotificationBell />
          <SidebarUser icon />
        </div>
      </div>
    </header>
  );
};

export default Navbar;
