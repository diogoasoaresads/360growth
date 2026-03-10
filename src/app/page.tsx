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
      <header className="border-b border-white/5 bg-slate-950/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 group cursor-pointer">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">360growth</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
              Entrar
            </Link>
            <Link href="/register">
              <Button
                size="sm"
                className="bg-white text-slate-950 hover:bg-slate-200 shadow-[0_0_20px_rgba(255,255,255,0.1)] font-semibold rounded-full px-5"
              >
                Começar agora
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-x-hidden">
        <section className="relative max-w-6xl mx-auto px-4 pt-32 pb-32 text-center">
          {/* Enhanced Glow blobs */}
          <div className="absolute inset-0 pointer-events-none -z-10 overflow-visible">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-600/20 blur-[120px] rounded-full animate-pulse-slow" />
            <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-violet-600/10 blur-[100px] rounded-full" />
            <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-blue-600/10 blur-[100px] rounded-full" />
          </div>

          <div className="relative space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-indigo-300 text-xs font-bold uppercase tracking-widest shadow-xl backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              Next-Gen Agency OS
            </div>

            {/* Headline */}
            <div className="space-y-6">
              <h1 className="text-6xl sm:text-8xl font-black tracking-tighter leading-[0.9] lg:max-w-4xl mx-auto">
                Escale sua agência <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-b from-indigo-300 via-indigo-500 to-violet-600 filter drop-shadow-sm">
                  em 360 graus.
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
                A plataforma definitiva que une CRM, gestão de pipeline, portal do cliente e inteligência de mídia em um único ecossistema premium.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Link href="/register">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-indigo-600 to-violet-700 hover:from-indigo-500 hover:to-violet-600 text-white gap-2 px-10 h-14 text-lg font-bold rounded-2xl shadow-2xl shadow-indigo-500/25 border-t border-white/20 transition-all hover:scale-105 active:scale-95"
                >
                  Criar Agência Grátis
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <div className="text-slate-500 text-sm font-medium">
                Pague apenas quando crescer.
              </div>
            </div>
          </div>
        </section>

        {/* ── Showcase Section ─────────────────────────────────────────────── */}
        <section className="max-w-6xl mx-auto px-4 pb-32">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-[2.5rem] blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative rounded-[2rem] border border-white/10 bg-slate-900 overflow-hidden shadow-2xl">
              <div className="h-8 bg-slate-800/50 flex items-center gap-1.5 px-4 border-b border-white/5">
                <div className="h-2.5 w-2.5 rounded-full bg-red-500/50" />
                <div className="h-2.5 w-2.5 rounded-full bg-amber-500/50" />
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/50" />
                <div className="ml-4 h-4 w-64 rounded-md bg-white/5" />
              </div>
              <div className="p-1 lg:p-4 bg-gradient-to-br from-indigo-500/5 to-transparent">
                <div className="aspect-[16/9] rounded-xl bg-slate-950/50 border border-white/5 flex items-center justify-center p-8 overflow-hidden">
                  {/* Mock Dashboard UI */}
                  <div className="w-full space-y-8 animate-pulse-soft">
                    <div className="grid grid-cols-4 gap-4">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-24 rounded-2xl bg-white/5 border border-white/5" />
                      ))}
                    </div>
                    <div className="grid grid-cols-3 gap-6">
                      <div className="col-span-2 h-64 rounded-3xl bg-indigo-500/10 border border-indigo-500/20" />
                      <div className="h-64 rounded-3xl bg-white/5 border border-white/5" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Features ───────────────────────────────────────────────────────── */}
        <section className="max-w-6xl mx-auto px-4 pb-32">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl font-bold tracking-tight">Arquitetada para agências de alta performance</h2>
            <p className="text-slate-400">Tudo o que você precisa em um único login.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(({ icon: Icon, title, desc }, idx) => (
              <div
                key={title}
                className="group relative rounded-3xl border border-white/5 bg-white/5 p-8 transition-all hover:bg-white/[0.08] hover:-translate-y-2 animate-in fade-in zoom-in-95 duration-700"
                style={{ animationDelay: `${idx * 150}ms`, animationFillMode: 'backwards' }}
              >
                <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Icon className="h-6 w-6 text-indigo-400" />
                </div>
                <h3 className="font-bold text-white text-lg mb-2">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Portal CTA ─────────────────────────────────────────────────────── */}
        <section className="max-w-6xl mx-auto px-4 pb-32">
          <div className="relative rounded-[3rem] border border-white/5 bg-gradient-to-br from-indigo-600/20 via-slate-900 to-violet-600/20 p-8 sm:p-20 text-center space-y-8 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_70%)] from-indigo-500/10 pointer-events-none" />
            <div className="relative space-y-4">
              <p className="text-indigo-400 text-xs font-bold uppercase tracking-[0.3em]">
                Exclusivo para seus clientes
              </p>
              <h2 className="text-4xl sm:text-5xl font-black">Portal White-label Integrado</h2>
              <p className="text-slate-400 max-w-xl mx-auto text-lg">
                Ofereça transparência total. Seus clientes podem acompanhar cada etapa, aprovar orçamentos e ver resultados em tempo real.
              </p>
            </div>
            <Link href="/login?returnTo=/portal/dashboard">
              <Button
                size="lg"
                variant="outline"
                className="h-14 border-white/10 text-white hover:bg-white hover:text-slate-950 bg-white/5 rounded-2xl gap-3 px-8 text-lg shadow-2xl transition-all"
              >
                <Users className="h-5 w-5" />
                Acessar Portal do Cliente
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-12 bg-slate-950">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-8 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-indigo-500/20 flex items-center justify-center">
              <TrendingUp className="h-3 w-3 text-indigo-400" />
            </div>
            <span className="text-white font-bold tracking-tight">360growth</span>
            <span className="mx-2 opacity-20">|</span>
            <span>© 2024 Built with ❤️ for Agencies</span>
          </div>
          <div className="flex gap-8 font-medium">
            <Link href="/login" className="hover:text-white transition-colors">Login</Link>
            <Link href="/register" className="hover:text-white transition-colors">Documentação</Link>
            <Link href="#" className="hover:text-white transition-colors">Termos</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
