"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Building2,
  TrendingUp,
  XCircle,
  Ticket,
  User,
  Activity,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ActivityItem } from "@/lib/actions/admin/dashboard";

const ICON_MAP = {
  agency: Building2,
  upgrade: TrendingUp,
  cancel: XCircle,
  ticket: Ticket,
  user: User,
  default: Activity,
};

const ICON_COLOR_MAP = {
  agency: "text-blue-500",
  upgrade: "text-green-500",
  cancel: "text-red-500",
  ticket: "text-yellow-500",
  user: "text-purple-500",
  default: "text-muted-foreground",
};

interface RecentActivityProps {
  items: ActivityItem[];
}

export function RecentActivity({ items }: RecentActivityProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">Atividade Recente</CardTitle>
        <Link
          href="/admin/logs"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          Ver todos
          <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Nenhuma atividade recente
          </p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const IconComponent = ICON_MAP[item.icon];
              const iconColor = ICON_COLOR_MAP[item.icon];
              const initials = item.actorName
                ? item.actorName.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()
                : "?";

              return (
                <div key={item.id} className="flex items-start gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-muted">
                    <IconComponent className={`h-3.5 w-3.5 ${iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-snug">{item.description}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDistanceToNow(new Date(item.createdAt), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                  {item.actorName && (
                    <Avatar className="h-6 w-6 flex-shrink-0">
                      <AvatarImage src={item.actorImage ?? undefined} />
                      <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
