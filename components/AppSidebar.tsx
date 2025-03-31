"use client";

import * as React from "react";
import {
  AudioWaveform,
  Command,
  Frame,
  GalleryVerticalEnd,
  LocateIcon,
  Map,
  PieChart,
  Tag,
  User,
} from "lucide-react";

import { NavMain } from "@/components/NavMain";
import { NavProjects } from "@/components/NavProjects";
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
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
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
          url: "/dashboard/findings",
        },
        {
          title: "Starred",
          url: "#",
        },
        {
          title: "Settings",
          url: "#",
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
          url: "/dashboard/photo-gallery",
        },
      ],
    },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: Frame,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Travel",
      url: "#",
      icon: Map,
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
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
