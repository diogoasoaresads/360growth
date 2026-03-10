import { TrendingUp } from "lucide-react";
import ForgotPasswordForm from "./forgot-password-form";

export const metadata = {
  title: "Esqueci minha senha | 360growth",
  description: "Redefina a senha da sua conta 360growth",
};

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Left branding panel */}
      <div className="hidden lg:flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-10 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-violet-600/10 blur-3xl" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-indigo-600/10 blur-3xl" />
        </div>
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
      </div>

      {/* Right form panel */}
      <div className="flex flex-col items-center justify-center bg-background px-6 py-12 lg:px-12">
        <div className="lg:hidden mb-8 flex flex-col items-center gap-2">
          <div className="h-10 w-10 rounded-lg bg-violet-600 flex items-center justify-center">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight">360growth</span>
        </div>
        <div className="w-full max-w-sm">
          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  );
}
