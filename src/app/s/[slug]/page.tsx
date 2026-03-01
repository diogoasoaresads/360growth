import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { agencies } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Building2, ArrowRight, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const agency = await db.query.agencies.findFirst({
    where: eq(agencies.slug, params.slug),
    columns: { name: true },
  });
  if (!agency) return { title: "Não encontrado" };
  return {
    title: `${agency.name} | 360growth`,
    description: `Acesse o painel de ${agency.name}`,
  };
}

export default async function AgencySitePage({ params }: Props) {
  const agency = await db.query.agencies.findFirst({
    where: eq(agencies.slug, params.slug),
    columns: {
      id: true,
      name: true,
      slug: true,
      email: true,
      website: true,
      logo: true,
      active: true,
      agencyStatus: true,
    },
  });

  if (!agency || !agency.active || agency.agencyStatus === "deleted") {
    notFound();
  }

  const baseLogin = `/login?from=site&slug=${encodeURIComponent(agency.slug)}`;
  const agencyLoginUrl = `${baseLogin}&returnTo=${encodeURIComponent("/agency/dashboard")}`;
  const portalLoginUrl = `${baseLogin}&returnTo=${encodeURIComponent("/portal/dashboard")}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex flex-col">
      {/* Topbar */}
      <header className="border-b border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-violet-400" />
            <span className="font-semibold text-white">{agency.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href={agencyLoginUrl}>
              <Button
                size="sm"
                variant="outline"
                className="h-8 border-white/20 text-white hover:bg-white/10 hover:text-white bg-transparent text-xs"
              >
                Área da Agência
              </Button>
            </Link>
            <Link href={portalLoginUrl}>
              <Button
                size="sm"
                className="h-8 bg-violet-600 hover:bg-violet-500 text-white text-xs"
              >
                Acessar Portal
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/20 border border-violet-400/30 text-violet-300 text-sm">
            <Building2 className="h-3.5 w-3.5" />
            Agência Digital
          </div>

          {/* Title */}
          <div className="space-y-4">
            <h1 className="text-5xl font-bold text-white tracking-tight">
              {agency.name}
            </h1>
            <p className="text-lg text-slate-400 max-w-lg mx-auto">
              Gestão inteligente de clientes, campanhas e resultados — tudo em um só lugar.
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href={portalLoginUrl}>
              <Button
                size="lg"
                className="bg-violet-600 hover:bg-violet-500 text-white gap-2 px-8"
              >
                <Users className="h-4 w-4" />
                Acessar meu Portal
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href={agencyLoginUrl}>
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 hover:text-white bg-transparent gap-2 px-8"
              >
                <Building2 className="h-4 w-4" />
                Área da Agência
              </Button>
            </Link>
          </div>

          {/* Website link */}
          {agency.website && (
            <p className="text-sm text-slate-500">
              <a
                href={agency.website}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-slate-300 transition-colors underline underline-offset-4"
              >
                {agency.website.replace(/^https?:\/\//, "")}
              </a>
            </p>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-4">
        <div className="max-w-5xl mx-auto px-4 text-center text-xs text-slate-600">
          Powered by{" "}
          <span className="text-slate-400 font-medium">360growth</span>
        </div>
      </footer>
    </div>
  );
}
