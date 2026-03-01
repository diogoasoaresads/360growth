import { db } from "@/lib/db";
import { adAccounts, adCampaigns } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getActiveAgencyIdOrThrow } from "@/lib/active-context";
import { AdAccountsClient } from "./ad-accounts-client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, RefreshCw } from "lucide-react";
import type { Metadata } from "next";
import { PageContainer } from "@/components/workspace/PageContainer";

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
    <div className="p-6">
      <PageContainer
        title="Contas de Anúncios"
        description="Dados sincronizados via Google Ads"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/agency/reports">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/agency/integrations">
                <RefreshCw className="h-4 w-4 mr-2" />
                Gerenciar integração
              </Link>
            </Button>
          </div>
        }
      >
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
      </PageContainer>
    </div>
  );
}
