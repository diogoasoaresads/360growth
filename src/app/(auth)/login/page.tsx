import { Suspense } from "react";
import LoginForm from "./login-form";
import { ChangelogButton } from "./changelog-button";
import { BUILD_ID, UPDATED_AT, UPDATED_TZ, CHANGELOG } from "@/lib/build-info";

export const metadata = {
  title: "Login | 360growth",
  description: "Sign in to your 360growth account",
};

export default function LoginPage() {
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

        {/* Changelog button → opens modal with history */}
        <ChangelogButton
          buildId={BUILD_ID}
          updatedAt={UPDATED_AT}
          updatedTz={UPDATED_TZ}
          entries={CHANGELOG.slice(0, 10)}
        />
      </div>
    </div>
  );
}
