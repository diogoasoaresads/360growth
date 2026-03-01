import { db } from "@/lib/db";
import { adAccounts, adCampaigns } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getActiveAgencyIdOrThrow } from "@/lib/active-context";
import { AdAccountsClient } from "./ad-accounts-client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, RefreshCw } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contas de Anúncios | Relatórios",
};

export default async function AdAccountsPage() {
  const agencyId = await getActiveAgencyIdOrThrow();

  const accounts = await db
    .select()
    .from(adAccounts)
    .where(
      and(
        eq(adAccounts.ownerScope, "agency"),
        eq(adAccounts.ownerId, agencyId)
      )
    )
    .orderBy(adAccounts.name);

  const campaigns =
    accounts.length > 0
      ? await db
          .select()
          .from(adCampaigns)
          .where(
            and(
              eq(adCampaigns.ownerScope, "agency"),
              eq(adCampaigns.ownerId, agencyId)
            )
          )
          .orderBy(adCampaigns.name)
      : [];

  const accountsWithCampaigns = accounts.map((account) => ({
    ...account,
    campaigns: campaigns.filter(
      (c) => c.externalAccountId === account.externalAccountId
    ),
  }));

  const totalCampaigns = campaigns.length;
  const activeCampaigns = campaigns.filter((c) => c.status === "ENABLED").length;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/agency/reports">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Contas de Anúncios
            </h1>
            <p className="text-muted-foreground mt-1">
              Dados sincronizados via Google Ads
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/agency/integrations">
            <RefreshCw className="h-4 w-4 mr-2" />
            Gerenciar integração
          </Link>
        </Button>
      </div>

      {/* KPIs */}
      {accounts.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">Contas sincronizadas</p>
            <p className="text-2xl font-bold mt-1">{accounts.length}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">Campanhas ativas</p>
            <p className="text-2xl font-bold mt-1">{activeCampaigns}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">Total de campanhas</p>
            <p className="text-2xl font-bold mt-1">{totalCampaigns}</p>
          </div>
        </div>
      )}

      {/* Client table */}
      <AdAccountsClient accounts={accountsWithCampaigns} />
    </div>
  );
}
