"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, FolderOpen, Plus } from "lucide-react";
import { useSession } from "next-auth/react";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

type CollectionSummary = {
  id: string;
  name: string;
};

const MAX_SIDEBAR_COLLECTIONS = 8;

export function NavCollections() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { state: sidebarState, isMobile, setOpenMobile } = useSidebar();

  const [collections, setCollections] = useState<CollectionSummary[]>([]);
  const [loadingCollections, setLoadingCollections] = useState(false);
  const [open, setOpen] = useState(() => pathname.startsWith("/collections"));

  // Re-fetch collections whenever the pathname changes so newly created/deleted
  // collections appear in the sidebar without requiring a full page reload
  useEffect(() => {
    if (!session?.user?.id) return;
    setLoadingCollections(true);
    fetch(`/api/collections?userId=${session.user.id}`)
      .then((r) => r.json())
      .then((data) => setCollections(data.collections ?? []))
      .catch(() => {})
      .finally(() => setLoadingCollections(false));
  }, [session?.user?.id, pathname]);

  const isOnCollections = pathname.startsWith("/collections");
  const isParentActive = sidebarState === "collapsed" ? isOnCollections : pathname === "/collections";

  return (
    <SidebarGroup>
      <SidebarMenu>
        <SidebarMenuItem>
          <Collapsible
            className="group/collapsible"
            open={open}
            onOpenChange={setOpen}
          >
            <div className="relative flex items-center w-full">
              <SidebarMenuButton
                asChild
                tooltip="Sammlungen"
                isActive={isParentActive}
                className={cn(
                  isOnCollections ? "font-bold" : "",
                  "pr-8",
                )}
              >
                <Link
                  href="/collections"
                  onClick={() => isMobile && setOpenMobile(false)}
                >
                  <FolderOpen />
                  <span>Sammlungen</span>
                </Link>
              </SidebarMenuButton>

              {sidebarState === "expanded" && (
                <button
                  className="absolute right-1 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-[#2d2d2d] hover:text-white transition-colors duration-150"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpen((v) => !v);
                  }}
                >
                  <ChevronRight
                    className="h-4 w-4 transition-transform duration-200"
                    style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
                  />
                </button>
              )}
            </div>

            <CollapsibleContent>
              <SidebarMenuSub className="mr-0">
                {/* New collection button */}
                <SidebarMenuSubItem>
                  <SidebarMenuSubButton
                    asChild
                    isActive={pathname === "/collections/new"}
                    className={cn(
                      "font-medium border-2 transition-all duration-150 ease-in-out hover:!bg-transparent hover:border-[#2d2d2d]",
                      pathname === "/collections/new"
                        ? "border-[#2d2d2d] !bg-[#2d2d2d] !text-white [&>svg]:!text-white data-[active=true]:!bg-[#2d2d2d] hover:!bg-[#2d2d2d] hover:!text-white"
                        : "border-transparent hover:!bg-transparent"
                    )}
                  >
                    <Link
                      href="/collections/new"
                      onClick={() => isMobile && setOpenMobile(false)}
                    >
                      <Plus className="h-3.5 w-3.5 shrink-0" />
                      <span>Neue Sammlung</span>
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>

                {/* Loading skeleton — shown below "Neue Sammlung" while fetching */}
                {loadingCollections && collections.length === 0 && (
                  <div className="px-2 py-1 space-y-1.5">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-6 rounded-md bg-muted animate-pulse" />
                    ))}
                  </div>
                )}

                {/* User's collections */}
                {collections.slice(0, MAX_SIDEBAR_COLLECTIONS).map((c) => {
                  const isActive = pathname === `/collections/${c.id}`;
                  return (
                    <SidebarMenuSubItem key={c.id}>
                      <SidebarMenuSubButton
                        asChild
                        isActive={isActive}
                      >
                        <Link
                          href={`/collections/${c.id}`}
                          onClick={() => isMobile && setOpenMobile(false)}
                        >
                          <span className="truncate">{c.name}</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  );
                })}

                {/* "Show all" when there are more collections than the limit */}
                {collections.length > MAX_SIDEBAR_COLLECTIONS && (
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild>
                      <Link
                        href="/collections"
                        onClick={() => isMobile && setOpenMobile(false)}
                        className="text-muted-foreground"
                      >
                        <span>Alle anzeigen ({collections.length})</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                )}
              </SidebarMenuSub>
            </CollapsibleContent>
          </Collapsible>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}
