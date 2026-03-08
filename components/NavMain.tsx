"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, type LucideIcon } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
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
      <SidebarMenu>
        {items.map((item) => {
          const isParentActive = pathname.startsWith(item.url);
          const hasActiveChild =
            item.items?.some((sub) => pathname === sub.url) ?? false;

          return (
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
                  isActive={isParentActive}
                  className={isParentActive || hasActiveChild ? "font-bold" : ""}
                >
                  <Link href={item.url}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
                {item.items && item.items.length > 0 && (
                  <CollapsibleTrigger asChild>
                    <button
                      className="absolute right-2 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-md hover:bg-sidebar-accent"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <ChevronRight
                        className="h-4 w-4 transition-transform duration-200"
                        style={{
                          transform: openState[item.title]
                            ? "rotate(90deg)"
                            : undefined,
                        }}
                      />
                    </button>
                  </CollapsibleTrigger>
                )}
                {item.items && item.items.length > 0 && (
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items.map((subItem) => {
                        const isNewFund = subItem.title === "+ Neuer Fund";
                        const isSubActive = pathname === subItem.url;

                        return (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={isSubActive}
                              className={
                                isNewFund
                                  ? "bg-zinc-400 text-foreground font-medium hover:bg-zinc-500"
                                  : ""
                              }
                            >
                              <Link href={subItem.url}>
                                <span>{subItem.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                )}
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
