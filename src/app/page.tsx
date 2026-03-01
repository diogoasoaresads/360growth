import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  TrendingUp,
  ArrowRight,
  Users,
  BarChart3,
  Ticket,
  Plug,
  Building2,
  LogIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Users,
    title: "CRM Completo",
    desc: "Gerencie clientes, contatos e equipes em um painel centralizado com histórico completo.",
  },
  {
    icon: BarChart3,
    title: "Pipeline de Vendas",
    desc: "Visualize negócios em andamento, projeções de receita e KPIs em tempo real.",
  },
  {
    icon: Ticket,
    title: "Central de Suporte",
    desc: "Tickets integrados com portal do cliente — comunicação sem troca de e-mails.",
  },
  {
    icon: Plug,
    title: "Integrações",
    desc: "Conecte Google Ads, Meta Ads, GA4 e mais para centralizar dados de performance.",
  },
];

export default async function HomePage() {
  const session = await auth();

  if (session) {
    switch (session.user.role) {
      case "SUPER_ADMIN":
        redirect("/admin");
      case "AGENCY_ADMIN":
      case "AGENCY_MEMBER":
        redirect("/agency/dashboard");
      case "CLIENT":
        redirect("/portal/dashboard");
      default:
        redirect("/login");
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white">
      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <header className="border-b border-white/10 bg-white/5 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-md bg-violet-600 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">360growth</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/register">
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-300 hover:text-white hover:bg-white/10 text-xs"
              >
                Criar agência
              </Button>
            </Link>
            <Link href="/login">
              <Button
                size="sm"
                className="bg-violet-600 hover:bg-violet-500 text-white gap-1.5 text-xs"
              >
                <LogIn className="h-3.5 w-3.5" />
                Entrar
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <main className="flex-1">
        <section className="relative max-w-6xl mx-auto px-4 pt-24 pb-20 text-center">
          {/* Glow blobs */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-violet-600/15 blur-3xl rounded-full" />
          </div>

          <div className="relative space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/20 border border-violet-400/30 text-violet-300 text-sm">
              <Building2 className="h-3.5 w-3.5" />
              Plataforma para agências digitais
            </div>

            {/* Headline */}
            <div className="space-y-4">
              <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-tight">
                Gestão de agência{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">
                  sem fricção
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto">
                CRM, pipeline de vendas, portal do cliente e integrações de mídia paga — tudo em uma plataforma multi-tenant construída para agências.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/register">
                <Button
                  size="lg"
                  className="bg-violet-600 hover:bg-violet-500 text-white gap-2 px-8 text-base"
                >
                  Começar grátis
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10 hover:text-white bg-transparent gap-2 px-8 text-base"
                >
                  <LogIn className="h-4 w-4" />
                  Entrar na conta
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* ── Features ───────────────────────────────────────────────────────── */}
        <section className="max-w-6xl mx-auto px-4 pb-24">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-3 hover:bg-white/8 transition-colors"
              >
                <div className="h-9 w-9 rounded-lg bg-violet-500/20 border border-violet-400/20 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-violet-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">{title}</h3>
                  <p className="text-slate-400 text-sm mt-1 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Portal CTA ─────────────────────────────────────────────────────── */}
        <section className="max-w-6xl mx-auto px-4 pb-24">
          <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-violet-900/40 to-indigo-900/40 p-8 sm:p-12 text-center space-y-4">
            <p className="text-slate-400 text-sm font-medium uppercase tracking-widest">
              Para clientes das agências
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold">Acesse seu portal</h2>
            <p className="text-slate-400 max-w-lg mx-auto">
              Sua agência usa o 360growth? Acesse o portal do cliente para acompanhar campanhas, tickets e relatórios.
            </p>
            <Link href="/login?returnTo=/portal/dashboard">
              <Button
                size="lg"
                variant="outline"
                className="border-violet-400/40 text-violet-300 hover:bg-violet-500/20 hover:text-white bg-transparent gap-2"
              >
                <Users className="h-4 w-4" />
                Acessar portal do cliente
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/10 py-6">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-violet-500" />
            <span className="text-slate-400 font-medium">360growth</span>
            <span>— Plataforma de gestão para agências digitais</span>
          </div>
          <div className="flex gap-4">
            <Link href="/login" className="hover:text-slate-400 transition-colors">
              Login
            </Link>
            <Link href="/register" className="hover:text-slate-400 transition-colors">
              Registrar
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
