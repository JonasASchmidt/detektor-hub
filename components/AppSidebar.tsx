"use client";

import * as React from "react";
import {
  GalleryVerticalEnd,
  LayoutGrid,
  LocateIcon,
  Tag,
  User,
} from "lucide-react";
import { useSession } from "next-auth/react";

import { NavMain } from "@/components/NavMain";
import { NavUser } from "@/components/NavUser";
import { TeamSwitcher } from "@/components/TeamSwitcher";
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
        title: "Neuer Fund",
        url: "/dashboard/findings/new",
      },
      {
        title: "Karte",
        url: "/dashboard/findings/map",
      },
    ],
  },
  {
    title: "Tags",
    url: "/dashboard/tags",
    icon: Tag,
    items: [
      {
        title: "Tags",
        url: "/dashboard/tags",
      },
    ],
  },
  {
    title: "Kategorien",
    url: "/dashboard/tags/categories",
    icon: LayoutGrid,
    items: [
      {
        title: "Kategorien",
        url: "/dashboard/tags/categories",
      },
    ],
  },
  {
    title: "User",
    url: "/dashboard/image-gallery",
    icon: User,
    items: [
      {
        title: "Foto-Gallerie",
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

  const teams = [
    {
      name: session?.user?.name
        ? `${session.user.name.split(" ")[0]} Team`
        : "Mein Team",
      logo: GalleryVerticalEnd,
      plan: "Starter Plan",
    },
  ];

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarTrigger className="w-full justify-start" />
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
