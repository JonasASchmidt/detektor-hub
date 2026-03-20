"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldIcon, UsersIcon, BadgeIcon } from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useSidebar } from "@/components/ui/sidebar";

const managementItems = [
  {
    title: "Übersicht",
    url: "/management",
    icon: ShieldIcon,
  },
  {
    title: "Benutzer",
    url: "/management/users",
    icon: UsersIcon,
  },
  {
    title: "Rollen",
    url: "/management/roles",
    icon: BadgeIcon,
  },
];

export function NavManagement() {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <>
      {/* Visual separator */}
      <div className="mx-3 my-1 border-t border-sidebar-border" />
      <SidebarGroup>
        <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2">
          Verwaltung
        </SidebarGroupLabel>
        <SidebarMenu>
          {managementItems.map((item) => {
            const isActive =
              item.url === "/management"
                ? pathname === "/management"
                : pathname === item.url || pathname.startsWith(item.url + "/");

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  isActive={isActive}
                >
                  <Link
                    href={item.url}
                    onClick={() => isMobile && setOpenMobile(false)}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroup>
    </>
  );
}
