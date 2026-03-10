"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "./ui/button";
import { useSidebar } from "./ui/sidebar";

export function AppHeaderBar() {
  const { isMobile, openMobile, setOpenMobile } = useSidebar();

  return (
    <div className="flex w-full shrink-0 items-center justify-start bg-[#2d2d2d] pl-3 pr-5 z-50 overscroll-none h-[52px]">
      {isMobile && (
        <Button
          variant="ghost"
          size="icon"
          className="mr-2 text-white hover:bg-white/10"
          onClick={() => setOpenMobile(!openMobile)}
        >
          {openMobile ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      )}
      <Link href="/dashboard" className="flex items-baseline gap-2 hover:text-gray-300 transition-colors">
        <span className="text-lg md:text-2xl font-bold text-white">Sondlr</span>
        <span className="text-lg md:text-2xl font-normal" style={{ color: "#ffff00" }}>Finde alles ...</span>
      </Link>
    </div>
  );
}
