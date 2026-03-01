import { Suspense } from "react";
import { db } from "@/lib/db";
import { agencies } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import LoginForm from "./login-form";
import { ChangelogButton } from "./changelog-button";
import { BUILD_ID, UPDATED_AT, UPDATED_TZ, CHANGELOG } from "@/lib/build-info";
import {
  TrendingUp,
  Users,
  BarChart3,
  Ticket,
} from "lucide-react";

export const metadata = {
  title: "Login | 360growth",
  description: "Acesse sua conta 360growth",
};

interface Props {
  searchParams: { from?: string; slug?: string; returnTo?: string; callbackUrl?: string };
}

const benefits = [
  { icon: Users, text: "CRM completo para gestão de clientes e equipes" },
  { icon: BarChart3, text: "Pipeline de vendas e relatórios em tempo real" },
  { icon: Ticket, text: "Central de suporte integrada com portal do cliente" },
  { icon: TrendingUp, text: "Integrações com Google Ads, Meta e muito mais" },
];

export default async function LoginPage({ searchParams }: Props) {
  const { from, slug } = searchParams;

  // If coming from a public site, look up the agency name for the badge
  let siteContext: { slug: string; name: string } | null = null;
  if (from === "site" && slug) {
    const agency = await db.query.agencies.findFirst({
      where: eq(agencies.slug, slug),
      columns: { name: true, slug: true },
    });
    if (agency) siteContext = { slug: agency.slug, name: agency.name };
  }

  // QA credentials — only sent to client when enabled
  const qaEnabled =
    process.env.QA_TOOLS_ENABLED === "true" ||
    process.env.NODE_ENV === "development";

  const qaCreds = qaEnabled
    ? {
        po: {
          email: process.env.QA_SUPER_ADMIN_EMAIL ?? "admin@360growth.com",
          password: process.env.QA_SUPER_ADMIN_PASSWORD ?? "Admin@123456",
        },
        agency: { email: "agency@demo.com", password: "Agency@123456" },
        client: { email: "portal@demo.com", password: "Client@123456" },
      }
    : null;

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* ── LEFT PANEL (branding) — hidden on mobile ──────────────────── */}
      <div className="hidden lg:flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-10 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-violet-600/10 blur-3xl" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-indigo-600/10 blur-3xl" />
        </div>

        {/* Logo + name */}
        <div className="relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-violet-600 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">360growth</span>
          </div>
          <p className="mt-2 text-slate-400 text-sm">
            Plataforma de gestão para agências digitais
          </p>
        </div>

        {/* Benefits */}
        <div className="relative z-10 mt-auto space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Por que usar o 360growth?
          </p>
          <ul className="space-y-3">
            {benefits.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3">
                <div className="mt-0.5 h-6 w-6 rounded-md bg-violet-500/20 flex items-center justify-center shrink-0">
                  <Icon className="h-3.5 w-3.5 text-violet-400" />
                </div>
                <span className="text-sm text-slate-300">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Changelog */}
        <div className="relative z-10 mt-8">
          <ChangelogButton
            buildId={BUILD_ID}
            updatedAt={UPDATED_AT}
            updatedTz={UPDATED_TZ}
            entries={CHANGELOG.slice(0, 10)}
          />
        </div>
      </div>

      {/* ── RIGHT PANEL (form) ─────────────────────────────────────────── */}
      <div className="flex flex-col items-center justify-center bg-background px-6 py-12 lg:px-12">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8 flex flex-col items-center gap-2">
          <div className="h-10 w-10 rounded-lg bg-violet-600 flex items-center justify-center">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight">360growth</span>
        </div>

        <div className="w-full max-w-sm">
          <Suspense fallback={<div className="text-center text-muted-foreground">Carregando...</div>}>
            <LoginForm siteContext={siteContext} qaCreds={qaCreds} />
          </Suspense>

          {/* Mobile changelog */}
          <div className="lg:hidden mt-8">
            <ChangelogButton
              buildId={BUILD_ID}
              updatedAt={UPDATED_AT}
              updatedTz={UPDATED_TZ}
              entries={CHANGELOG.slice(0, 10)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
