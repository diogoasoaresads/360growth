import { Suspense } from "react";
import LoginForm from "./login-form";

export const metadata = {
  title: "Login | 360growth",
  description: "Sign in to your 360growth account",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">360growth</h1>
          <p className="text-slate-400 mt-2">Plataforma de gestão para agências</p>
        </div>
        <Suspense fallback={<div className="text-white text-center">Carregando...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
