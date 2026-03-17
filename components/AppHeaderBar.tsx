"use client";

import Link from "next/link";
import { Menu, Square, X } from "lucide-react";
import { Button } from "./ui/button";
import { useSidebar } from "./ui/sidebar";
import { NotificationCenter } from "./NotificationCenter";
import { useRouter } from "next/navigation";

interface Props {
  activeSession?: { id: string; name: string } | null;
}

export function AppHeaderBar({ activeSession }: Props) {
  const { isMobile, openMobile, setOpenMobile } = useSidebar();
  const router = useRouter();

  const stopSession = async () => {
    await fetch("/api/active-session", { method: "DELETE" });
    router.refresh();
  };

  return (
    <div className="flex w-full shrink-0 items-center justify-start bg-[#2d2d2d] pl-3 pr-5 z-50 overscroll-none h-[52px] gap-3">
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

      <Link href="/findings" className="flex items-baseline gap-2 hover:text-gray-300 transition-colors shrink-0">
        <span className="text-lg md:text-2xl font-bold text-white">Sondlr</span>
        <span className="text-lg md:text-2xl font-normal" style={{ color: "#ffff00" }}>Finde alles ...</span>
      </Link>

      {activeSession && (
        <div className="flex items-center gap-1.5 bg-amber-500/15 border border-amber-400/30 rounded-full pl-2.5 pr-1.5 py-1 min-w-0">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
          <Link
            href={`/sessions/${activeSession.id}`}
            className="text-amber-300 text-xs font-medium truncate max-w-[120px] hover:text-amber-200 transition-colors"
            title={activeSession.name}
          >
            {activeSession.name}
          </Link>
          <button
            onClick={stopSession}
            title="Begehung beenden"
            className="text-amber-400/70 hover:text-amber-300 transition-colors ml-0.5 shrink-0"
          >
            <Square className="h-3 w-3 fill-current" />
          </button>
        </div>
      )}

      <div className="ml-auto flex items-center gap-2">
        <NotificationCenter />
      </div>
    </div>
  );
}
