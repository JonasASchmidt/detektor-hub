"use client";

import * as React from "react";
import {
  ImageIcon,
  LayoutGrid,
  LocateIcon,
  Tag,
} from "lucide-react";
import { useSession } from "next-auth/react";

import { NavMain } from "@/components/NavMain";
import { NavUser } from "@/components/NavUser";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const navMain = [
  {
    title: "Funde",
    url: "/dashboard/findings",
    icon: LocateIcon,
    isActive: true,
    items: [
      {
        title: "+ Neuer Fund",
        url: "/dashboard/findings/new",
      },
      {
        title: "Karte",
        url: "/dashboard/findings/map",
      },
      {
        title: "Tags",
        url: "/dashboard/tags",
      },
      {
        title: "Kategorien",
        url: "/dashboard/tags/categories",
      },
      {
        title: "Bilder",
        url: "/dashboard/image-gallery",
      },
    ],
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession();

  const userData = {
    name: session?.user?.name || "Benutzer",
    email: session?.user?.email || "",
    avatar: session?.user?.image || "",
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
        <SidebarTrigger className="w-full justify-end group-data-[collapsible=icon]:justify-center px-2" />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
