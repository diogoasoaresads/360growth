"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { signIn, getSession } from "next-auth/react";
import { z } from "zod";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  Building2,
  Users,
  ShieldCheck,
  Globe,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface QaCreds {
  po: { email: string; password: string };
  agency: { email: string; password: string };
  client: { email: string; password: string };
}

interface LoginFormProps {
  siteContext: { slug: string; name: string } | null;
  qaCreds: QaCreds | null;
}

// ─── Validation ───────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getSafeReturnTo(returnTo: string | null, role: string): string {
  function fallback() {
    switch (role) {
      case "SUPER_ADMIN": return "/admin";
      case "AGENCY_ADMIN":
      case "AGENCY_MEMBER": return "/agency/dashboard";
      case "CLIENT": return "/portal/dashboard";
      default: return "/";
    }
  }

  if (!returnTo) return fallback();
  if (!returnTo.startsWith("/") || returnTo.startsWith("//")) return fallback();
  if (/^\/[a-zA-Z][a-zA-Z0-9+\-.]*:/.test(returnTo)) return fallback();

  // Role-path guard: avoid sending the user somewhere they'll be bounced from
  if (returnTo.startsWith("/admin") && role !== "SUPER_ADMIN") return fallback();
  if (
    returnTo.startsWith("/agency") &&
    role !== "SUPER_ADMIN" &&
    role !== "AGENCY_ADMIN" &&
    role !== "AGENCY_MEMBER"
  ) return fallback();
  if (
    returnTo.startsWith("/portal") &&
    role !== "SUPER_ADMIN" &&
    role !== "CLIENT"
  ) return fallback();

  return returnTo;
}

const REMEMBER_KEY = "360growth_login_email";

// ─── Component ────────────────────────────────────────────────────────────────

export default function LoginForm({ siteContext, qaCreds }: LoginFormProps) {
  const searchParams = useSearchParams();
  const returnTo =
    searchParams.get("returnTo") ?? searchParams.get("callbackUrl") ?? null;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberEmail, setRememberEmail] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  // Restore remembered email on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(REMEMBER_KEY);
      if (saved) {
        setEmail(saved);
        setRememberEmail(true);
      }
    } catch {
      // localStorage might be unavailable in some envs
    }
  }, []);

  function fill(creds: { email: string; password: string }) {
    setEmail(creds.email);
    setPassword(creds.password);
    setError(null);
    setFieldErrors({});
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const errs: { email?: string; password?: string } = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as "email" | "password";
        if (!errs[field]) errs[field] = issue.message;
      });
      setFieldErrors(errs);
      return;
    }

    setIsLoading(true);
    try {
      // Persist remembered email before navigating
      try {
        if (rememberEmail) {
          localStorage.setItem(REMEMBER_KEY, email);
        } else {
          localStorage.removeItem(REMEMBER_KEY);
        }
      } catch {
        // ignore
      }

      const response = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (response?.error || !response?.ok) {
        setError("E-mail ou senha incorretos. Verifique e tente novamente.");
        return;
      }

      // Fetch session to validate role before redirect
      const session = await getSession();
      const role = session?.user?.role ?? "";
      const target = getSafeReturnTo(returnTo, role);
      window.location.href = target;
    } catch {
      setError("Erro inesperado. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Origin badge — shown when coming from a public site */}
      {siteContext && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-violet-50 border border-violet-200 dark:bg-violet-900/20 dark:border-violet-800 text-sm text-violet-700 dark:text-violet-300">
          <Globe className="h-4 w-4 shrink-0" />
          <span>
            Você veio do site:{" "}
            <strong className="font-semibold">{siteContext.name}</strong>
          </span>
        </div>
      )}

      {/* Heading */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Entrar na conta</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Digite suas credenciais para acessar o sistema
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2.5 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            autoComplete="email"
            className={fieldErrors.email ? "border-destructive focus-visible:ring-destructive" : ""}
          />
          {fieldErrors.email && (
            <p className="text-xs text-destructive">{fieldErrors.email}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Senha</Label>
            <Link
              href="/forgot-password"
              tabIndex={-1}
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              Esqueceu a senha?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              autoComplete="current-password"
              className={`pr-10 ${fieldErrors.password ? "border-destructive focus-visible:ring-destructive" : ""}`}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              tabIndex={-1}
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
          {fieldErrors.password && (
            <p className="text-xs text-destructive">{fieldErrors.password}</p>
          )}
        </div>

        {/* Remember email */}
        <div className="flex items-center gap-2">
          <Checkbox
            id="remember"
            checked={rememberEmail}
            onCheckedChange={(v) => setRememberEmail(!!v)}
          />
          <Label
            htmlFor="remember"
            className="text-sm font-normal text-muted-foreground cursor-pointer"
          >
            Lembrar meu e-mail
          </Label>
        </div>

        {/* Submit */}
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Entrando...
            </>
          ) : (
            "Entrar"
          )}
        </Button>
      </form>

      {/* QA fast-login — server only sends this when QA_TOOLS_ENABLED=true */}
      {qaCreds && (
        <div className="space-y-2 pt-1 border-t">
          <p className="text-xs text-center text-muted-foreground font-medium uppercase tracking-widest pt-1">
            Acesso rápido (QA)
          </p>
          <div className="grid grid-cols-3 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs h-9 gap-1.5 border-violet-200 hover:bg-violet-50 hover:text-violet-700 dark:border-violet-800 dark:hover:bg-violet-900/20 dark:hover:text-violet-300"
              onClick={() => fill(qaCreds.po)}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              PO
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs h-9 gap-1.5 border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-blue-800 dark:hover:bg-blue-900/20 dark:hover:text-blue-300"
              onClick={() => fill(qaCreds.agency)}
            >
              <Building2 className="h-3.5 w-3.5" />
              Agência
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs h-9 gap-1.5 border-green-200 hover:bg-green-50 hover:text-green-700 dark:border-green-800 dark:hover:bg-green-900/20 dark:hover:text-green-300"
              onClick={() => fill(qaCreds.client)}
            >
              <Users className="h-3.5 w-3.5" />
              Cliente
            </Button>
          </div>
        </div>
      )}

      {/* Register link */}
      <p className="text-center text-sm text-muted-foreground">
        Não tem conta?{" "}
        <Link href="/register" className="text-primary hover:underline font-medium">
          Criar agência
        </Link>
      </p>
    </div>
  );
}
