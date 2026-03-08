"use client";

import Link from "next/link";

export function AppHeaderBar() {
  return (
    <div className="flex h-[60px] w-full shrink-0 items-center bg-[#2d2d2d] px-6 z-50">
      <Link href="/dashboard" className="text-lg md:text-2xl font-bold text-white hover:text-gray-300 transition-colors">
        Detektor Hub
      </Link>
    </div>
  );
}
