"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Search, Megaphone } from "lucide-react";
import type { AdAccount, AdCampaign } from "@/lib/db/schema";

type AccountWithCampaigns = AdAccount & {
  campaigns: AdCampaign[];
};

interface AdAccountsClientProps {
  accounts: AccountWithCampaigns[];
}

const CAMPAIGN_STATUS_LABELS: Record<string, string> = {
  ENABLED: "Ativa",
  PAUSED: "Pausada",
  REMOVED: "Removida",
};

const CAMPAIGN_STATUS_VARIANTS: Record<
  string,
  "default" | "secondary" | "destructive" | "outline" | "success"
> = {
  ENABLED: "success",
  PAUSED: "warning" as "default",
  REMOVED: "destructive",
};

const CHANNEL_TYPE_LABELS: Record<string, string> = {
  SEARCH: "Search",
  DISPLAY: "Display",
  SHOPPING: "Shopping",
  VIDEO: "YouTube",
  SMART: "Smart",
  PERFORMANCE_MAX: "Performance Max",
  APP: "App",
  HOTEL: "Hotel",
  LOCAL: "Local",
  DISCOVERY: "Discovery",
  UNKNOWN: "Desconhecido",
};

function CampaignRow({ campaign }: { campaign: AdCampaign }) {
  const statusLabel = campaign.status
    ? (CAMPAIGN_STATUS_LABELS[campaign.status] ?? campaign.status)
    : "—";
  const statusVariant = campaign.status
    ? (CAMPAIGN_STATUS_VARIANTS[campaign.status] ?? "secondary")
    : "secondary";
  const channelLabel = campaign.channelType
    ? (CHANNEL_TYPE_LABELS[campaign.channelType] ?? campaign.channelType)
    : "—";

  return (
    <div className="flex items-center justify-between py-2 px-3 rounded hover:bg-muted/50 text-sm">
      <div className="flex items-center gap-2 min-w-0">
        <Megaphone className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
        <span className="truncate">{campaign.name}</span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
        <Badge variant="outline" className="text-xs">
          {channelLabel}
        </Badge>
        <Badge variant={statusVariant as "default"} className="text-xs w-20 justify-center">
          {statusLabel}
        </Badge>
      </div>
    </div>
  );
}

function AccountCard({ account }: { account: AccountWithCampaigns }) {
  const [open, setOpen] = useState(false);
  const activeCampaigns = account.campaigns.filter(
    (c) => c.status === "ENABLED"
  ).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58a2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
                <polygon
                  fill="white"
                  points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"
                />
              </svg>
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">
                {account.name ?? `Conta ${account.externalAccountId}`}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                ID: {account.externalAccountId}
                {account.currencyCode && ` · ${account.currencyCode}`}
                {account.timeZone && ` · ${account.timeZone}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {account.isManager && (
              <Badge variant="outline" className="text-xs">
                MCC
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {activeCampaigns}/{account.campaigns.length} campanhas ativas
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOpen((v) => !v)}
              className="h-7 w-7 p-0"
              aria-label={open ? "Recolher campanhas" : "Expandir campanhas"}
            >
              {open ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      {open && (
        <CardContent className="pt-0">
          {account.campaigns.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma campanha sincronizada
            </p>
          ) : (
            <div className="space-y-0.5">
              {account.campaigns.map((campaign) => (
                <CampaignRow key={campaign.id} campaign={campaign} />
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export function AdAccountsClient({ accounts }: AdAccountsClientProps) {
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? accounts.filter(
        (a) =>
          (a.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
          a.externalAccountId.includes(search)
      )
    : accounts;

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar conta..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Account cards */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-muted-foreground">
              {search.trim()
                ? "Nenhuma conta encontrada para essa busca."
                : "Nenhuma conta de anúncios sincronizada. Configure a integração com o Google Ads e clique em Sincronizar."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
        </div>
      )}
    </div>
  );
}
