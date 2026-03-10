"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function AgencyError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[AgencyError]", error.message, error.stack);
  }, [error]);

  const isDev = process.env.NODE_ENV === "development";

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-lg w-full space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <h2 className="font-semibold">Erro ao carregar página</h2>
            <p className="text-sm text-muted-foreground">
              {error.digest ? `Código: ${error.digest}` : "Erro inesperado"}
            </p>
          </div>
        </div>

        {isDev && error.message && (
          <pre className="rounded-md bg-muted p-4 text-xs overflow-auto max-h-48 text-destructive">
            {error.message}
          </pre>
        )}

        <Button variant="outline" size="sm" onClick={reset} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Tentar novamente
        </Button>
      </div>
    </div>
  );
}
