"use client";

import { useRef, useState } from "react";
import {
  ChevronsUpDown,
  LogOut,
  Pencil,
  ScrollText,
  Settings,
} from "lucide-react";
import { SettingsDialog } from "@/components/SettingsDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import dynamic from "next/dynamic";

const ActivityLogPanel = dynamic(() => import("@/components/ActivityLogPanel"), { ssr: false });

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { signOut, useSession } from "next-auth/react";
import { getInitials } from "@/lib/initials";

export function NavUser({
  user,
}: {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
}) {
  const { data: session, update } = useSession();
  const { isMobile } = useSidebar();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activityLogOpen, setActivityLogOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  if (!session) return null;

  const currentName = session.user.name || user.name;

  function startEditing() {
    setNameValue(currentName ?? "");
    setEditing(true);
    setTimeout(() => {
      inputRef.current?.select();
    }, 0);
  }

  async function saveName() {
    const trimmed = nameValue.trim();
    if (!trimmed || trimmed === currentName) {
      setEditing(false);
      return;
    }
    await fetch("/api/user", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    });
    await update({ name: trimmed });
    setEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") saveName();
    if (e.key === "Escape") setEditing(false);
  }

  return (
    <>
    <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    <Dialog open={activityLogOpen} onOpenChange={setActivityLogOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Aktivitätslog</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto max-h-[80vh]">
          {activityLogOpen && <ActivityLogPanel />}
        </div>
      </DialogContent>
    </Dialog>
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-full">
                <AvatarImage src={session?.user?.image || user.avatar} alt={currentName} />
                <AvatarFallback className="rounded-full bg-[#2d2d2d] font-bold text-white">{getInitials(currentName)}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{currentName}</span>
                <span className="truncate text-xs">{session.user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-full">
                  <AvatarImage src={user.avatar} alt={currentName} />
                  <AvatarFallback className="rounded-full bg-[#2d2d2d] font-bold text-white">{getInitials(currentName)}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
                  {editing ? (
                    <input
                      ref={inputRef}
                      value={nameValue}
                      onChange={(e) => setNameValue(e.target.value)}
                      onBlur={saveName}
                      onKeyDown={handleKeyDown}
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="truncate font-semibold bg-transparent border-b border-foreground outline-none w-full"
                      autoFocus
                    />
                  ) : (
                    <button
                      className="group flex items-center gap-1.5 text-left font-semibold truncate hover:opacity-70 transition-opacity"
                      onClick={(e) => { e.stopPropagation(); startEditing(); }}
                      onMouseDown={(e) => e.stopPropagation()}
                      title="Namen bearbeiten"
                    >
                      <span className="truncate">{currentName}</span>
                      <Pencil className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-50 transition-opacity" />
                    </button>
                  )}
                  <span className="truncate text-xs text-muted-foreground">{session.user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setActivityLogOpen(true)}>
              <ScrollText />
              Aktivitätslog
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setSettingsOpen(true)}>
              <Settings />
              Einstellungen
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => signOut()}>
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
    </>
  );
}
