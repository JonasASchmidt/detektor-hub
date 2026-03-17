"use client";

import * as React from "react";
import {
  LocateIcon,
  MapIcon,
  SmartphoneIcon,
  UsersIcon,
  X,
} from "lucide-react";
import { useSession } from "next-auth/react";

import { NavMain } from "@/components/layout/NavMain";
import { NavUser } from "@/components/layout/NavUser";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "../ui/button";

const navMain = [
  {
    title: "Deine Funde",
    url: "/findings",
    icon: LocateIcon,
    isActive: true,
    items: [
      {
        title: "Neuer Fund",
        url: "/findings/new",
      },
      {
        title: "Karte",
        url: "/findings/map",
      },
      {
        title: "Tags",
        url: "/tags",
      },
      {
        title: "Kategorien",
        url: "/tags/categories",
      },
      {
        title: "Bilder",
        url: "/images",
      },
      {
        title: "Begehungen",
        url: "/sessions",
      },
      {
        title: "Zonen",
        url: "/zones",
      },
    ],
  },
  {
    title: "Öffentlich",
    url: "/community",
    icon: UsersIcon,
  },
  {
    title: "Felderfassung",
    url: "/field",
    icon: SmartphoneIcon,
  },
];

function MobileHeader() {
  const { isMobile, setOpenMobile } = useSidebar();

  if (!isMobile) return null;

  return (
    <SidebarHeader className="flex-row items-center justify-between px-4 py-3 border-b">
      <span className="text-lg font-bold">Sondlr</span>
      <Button variant="ghost" size="icon" onClick={() => setOpenMobile(false)}>
        <X className="h-5 w-5" />
      </Button>
    </SidebarHeader>
  );
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession();

  const userData = {
    name: session?.user?.name || "Benutzer",
    email: session?.user?.email || "",
    avatar: session?.user?.image || "",
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <MobileHeader />
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
        <SidebarTrigger className="w-full justify-end group-data-[collapsible=icon]:justify-center px-2 mb-1 text-zinc-400 hover:!bg-transparent active:!bg-transparent hover:!text-[#2d2d2d] active:!text-[#2d2d2d] [&_svg]:hover:!text-[#2d2d2d] [&_svg]:active:!text-[#2d2d2d] transition-all duration-150 ease-in-out" />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
