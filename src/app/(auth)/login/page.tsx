import { Suspense } from "react";
import LoginForm from "./login-form";
import { BUILD_ID, UPDATED_AT, UPDATED_TZ, CHANGELOG } from "@/lib/build-info";

export const metadata = {
  title: "Login | 360growth",
  description: "Sign in to your 360growth account",
};

export default function LoginPage() {
  const entries = CHANGELOG.slice(0, 10);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 py-12 px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">360growth</h1>
          <p className="text-slate-400 mt-2">Plataforma de gestão para agências</p>
        </div>

        {/* Login form */}
        <Suspense fallback={<div className="text-white text-center">Carregando...</div>}>
          <LoginForm />
        </Suspense>

        {/* Build / Atualizações */}
        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4 text-xs font-mono">
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-slate-300 font-semibold not-italic">Build / Atualizações</span>
            <span className="text-slate-500">
              BUILD_ID: <span className="text-slate-300">{BUILD_ID}</span>
            </span>
          </div>
          <p className="text-slate-500 mb-4">
            UPDATED_AT:{" "}
            <span className="text-slate-400">
              {UPDATED_AT} ({UPDATED_TZ})
            </span>
          </p>

          <p className="text-slate-500 mb-2 uppercase tracking-widest text-[10px]">
            Histórico de Atualizações
          </p>

          <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
            {entries.map((entry) => (
              <div key={entry.id}>
                <p className="text-slate-400">
                  [{entry.id}] {entry.at} ({UPDATED_TZ})
                </p>
                {entry.lines.map((line, i) => (
                  <p key={i} className="text-slate-500 pl-2">
                    • {line}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
