"use client";

import { useEffect, useState } from "react";
import { Bell, Search, CheckCircle2, MessageSquare, AtSign, Reply } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Manually defining to avoid importing @prisma/client in a client component
type NotificationType = "MENTION" | "REPLY" | "FINDING_COMMENT";

interface Notification {
  id: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
  actor: {
    name: string | null;
    image: string | null;
  } | null;
  findingId: string | null;
  commentId: string | null;
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const filteredNotifications = notifications.filter(n => {
    if (!searchQuery) return true;
    return n.actor?.name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const markAllAsRead = async () => {
    try {
      const res = await fetch("/api/notifications/read-all", { method: "POST" });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      }
    } catch (error) {
      console.error("Failed to mark all as read", error);
    }
  };

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case "MENTION": return <AtSign className="h-4 w-4 text-blue-500" />;
      case "REPLY": return <Reply className="h-4 w-4 text-green-500" />;
      case "FINDING_COMMENT": return <MessageSquare className="h-4 w-4 text-amber-500" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getMessage = (n: Notification) => {
    const name = n.actor?.name || "Jemand";
    switch (n.type) {
      case "MENTION": return `${name} hat dich erwähnt.`;
      case "REPLY": return `${name} hat auf deinen Kommentar geantwortet.`;
      case "FINDING_COMMENT": return `${name} hat deinen Fund kommentiert.`;
      default: return "Neue Mitteilung";
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className={`relative p-2 text-white rounded-full group`}>
          <Bell
            className={`h-[22px] w-[22px] transition-all group-hover:[fill:currentColor] group-hover:[stroke-width:0] ${open ? "[fill:currentColor] [stroke-width:0]" : ""}`}
          />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-[#2d2d2d]">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[380px] p-0 mt-2 ml-1 shadow-2xl border-black/[0.1] rounded-2xl overflow-hidden" align="start">
        <div className="bg-[#fcfcfc] border-b border-black/[0.05] p-4 flex items-center justify-between">
          <h3 className="font-bold text-lg">Mitteilungen</h3>
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-foreground h-7"
              onClick={markAllAsRead}
            >
              Alle als gelesen markieren
            </Button>
          )}
        </div>

        {notifications.length > 0 && (
          <div className="p-3 border-b border-black/[0.05] bg-white">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-sm bg-muted/50 border-none rounded-lg focus-visible:ring-1 focus-visible:ring-black/10"
              />
            </div>
          </div>
        )}

        <div className="h-[400px] overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground animate-pulse">
              Lade Mitteilungen...
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <Bell className="h-6 w-6 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-medium">Keine Mitteilungen</p>
              <p className="text-xs text-muted-foreground">Du bist auf dem neuesten Stand!</p>
            </div>
          ) : (
            <div className="divide-y divide-black/[0.03]">
              {filteredNotifications.map((n) => (
                <div 
                  key={n.id} 
                  className={`p-4 hover:bg-muted/50 transition-colors cursor-pointer flex gap-3 items-start relative ${!n.isRead ? "bg-amber-50/30" : ""}`}
                >
                  {!n.isRead && (
                    <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-amber-500" />
                  )}
                  <div className="w-10 h-10 rounded-full bg-muted flex-shrink-0 flex items-center justify-center overflow-hidden border border-black/[0.05]">
                    {n.actor?.image ? (
                      <img src={n.actor.image} alt={n.actor.name || ""} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-muted-foreground">
                        {n.actor?.name?.charAt(0).toUpperCase() || "?"}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className={`text-sm leading-snug ${!n.isRead ? "font-semibold" : "font-normal"}`}>
                      {getMessage(n)}
                    </p>
                    <div className="flex items-center gap-2">
                      {getIcon(n.type)}
                      <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                        {format(new Date(n.createdAt), "d. MMM, HH:mm", { locale: de })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
