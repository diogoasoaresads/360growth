"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Algo deu errado</h1>
          <p className="text-muted-foreground text-sm">
            Ocorreu um erro inesperado. Tente recarregar a página ou voltar ao início.
          </p>
          {error.digest && (
            <p className="text-xs font-mono text-muted-foreground/60 mt-2">
              Código: {error.digest}
            </p>
          )}
        </div>

        <div className="flex gap-3 justify-center">
          <Button variant="outline" size="sm" onClick={reset} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Tentar novamente
          </Button>
          <Button size="sm" onClick={() => (window.location.href = "/")} className="gap-2">
            <Home className="h-4 w-4" />
            Voltar ao início
          </Button>
        </div>
      </div>
    </div>
  );
}
