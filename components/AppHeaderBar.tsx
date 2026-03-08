"use client";

import Link from "next/link";

export function AppHeaderBar() {
  return (
    <div className="flex w-full shrink-0 items-center justify-start bg-[#2d2d2d] pl-3 pr-5 z-50 overscroll-none h-12">
      <Link href="/dashboard" className="flex items-baseline gap-2 hover:text-gray-300 transition-colors">
        <span className="text-lg md:text-2xl font-bold text-white">Sondlr</span>
        <span className="text-lg md:text-2xl font-normal text-gray-400">All your finds ...</span>
      </Link>
    </div>
  );
}
