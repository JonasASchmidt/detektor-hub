"use client";

import * as React from "react";
import { GalleryVerticalEnd, LocateIcon, Tag, User } from "lucide-react";

import { NavMain } from "@/components/NavMain";
import { NavUser } from "@/components/NavUser";
import { TeamSwitcher } from "@/components/TeamSwitcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Detektor Hub",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
  ],
  navMain: [
    {
      title: "Funde",
      url: "#",
      icon: LocateIcon,
      isActive: true,
      items: [
        {
          title: "Neuer Fund",
          url: "/dashboard/findings/new",
        },
        {
          title: "Alle Funde",
          url: "/dashboard/findings",
        },
        {
          title: "Karte",
          url: "/dashboard/findings/map",
        },
      ],
    },
    {
      title: "Tags",
      url: "#",
      icon: Tag,
      items: [
        {
          title: "Tags",
          url: "/dashboard/tags",
        },
        {
          title: "Kategorien",
          url: "/dashboard/tags/categories",
        },
      ],
    },
    {
      title: "User",
      url: "#",
      icon: User,
      items: [
        {
          title: "Foto-Gallerie",
          url: "/dashboard/image-gallery",
        },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
