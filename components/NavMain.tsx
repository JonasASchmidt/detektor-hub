"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, type LucideIcon } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
    isActive?: boolean;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
}) {
  const pathname = usePathname();

  const [openState, setOpenState] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const item of items) {
      const hasActiveChild =
        item.items?.some((sub) => pathname === sub.url) ?? false;
      const isParentActive = pathname.startsWith(item.url);
      initial[item.title] = hasActiveChild || isParentActive;
    }
    return initial;
  });

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <Collapsible
            key={item.title}
            asChild
            className="group/collapsible"
            open={openState[item.title]}
            onOpenChange={(open) =>
              setOpenState((prev) => ({ ...prev, [item.title]: open }))
            }
          >
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                isActive={pathname.startsWith(item.url)}
              >
                <Link
                  href={item.url}
                  onClick={() =>
                    setOpenState((prev) => ({
                      ...prev,
                      [item.title]: !prev[item.title],
                    }))
                  }
                >
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                  {item.items && item.items.length > 0 && (
                    <ChevronRight
                      className="ml-auto transition-transform duration-200"
                      style={{
                        transform: openState[item.title]
                          ? "rotate(90deg)"
                          : undefined,
                      }}
                    />
                  )}
                </Link>
              </SidebarMenuButton>
              {item.items && item.items.length > 0 && (
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton
                          asChild
                          isActive={pathname === subItem.url}
                        >
                          <Link href={subItem.url}>
                            <span>{subItem.title}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              )}
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
