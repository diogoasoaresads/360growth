"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from "@/lib/actions/notification.actions";
import type { Notification } from "@/lib/db/schema";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function NotificationBell({ isPortal = false }: { isPortal?: boolean }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = async () => {
        try {
            const data = await getNotifications();
            setNotifications(data as Notification[]);
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    const unreadCount = notifications.length;

    const handleMarkAsRead = async (id: string) => {
        await markNotificationAsRead(id);
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    };

    const handleMarkAllAsRead = async () => {
        await markAllNotificationsAsRead();
        setNotifications([]);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5 text-muted-foreground" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-[10px] animate-in zoom-in"
                        >
                            {unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0">
                <DropdownMenuLabel className="p-4 flex items-center justify-between">
                    <span>Notificações</span>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 text-xs text-primary"
                            onClick={handleMarkAllAsRead}
                        >
                            Marcar todas como lidas
                        </Button>
                    )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="m-0" />
                <ScrollArea className="h-[350px]">
                    {loading ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">Carregando...</div>
                    ) : notifications.length === 0 ? (
                        <div className="p-8 text-center flex flex-col items-center gap-2">
                            <Bell className="h-8 w-8 text-muted-foreground/20" />
                            <p className="text-sm text-muted-foreground font-medium">Você está em dia!</p>
                            <p className="text-xs text-muted-foreground/60">Nenhuma nova notificação por enquanto.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {notifications.map((n) => {
                                // Adapt link for portal if needed
                                let link = n.link;
                                if (isPortal && link?.startsWith("/agency")) {
                                    link = link.replace("/agency", "/portal");
                                }

                                return (
                                    <div
                                        key={n.id}
                                        className={cn(
                                            "flex flex-col gap-1 p-4 border-b last:border-0 hover:bg-muted/50 transition-colors cursor-pointer",
                                            !n.read && "bg-primary/5"
                                        )}
                                        onClick={() => handleMarkAsRead(n.id)}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="text-sm font-semibold leading-none">{n.title}</p>
                                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                                {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: ptBR })}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                                        {link && (
                                            <Link
                                                href={link}
                                                className="text-[10px] text-primary font-medium hover:underline mt-1"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                Ver detalhes
                                            </Link>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </ScrollArea>
                <DropdownMenuSeparator className="m-0" />
                <div className="p-2">
                    <Button variant="ghost" className="w-full text-xs h-8" asChild>
                        <Link href={isPortal ? "/portal/settings" : "/agency/settings"}>Configurações de alerta</Link>
                    </Button>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
