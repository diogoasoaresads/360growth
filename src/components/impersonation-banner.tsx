"use client";

import { useTransition } from "react";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { stopImpersonation } from "@/lib/actions/admin/impersonate";
import type { Session } from "next-auth";

interface ImpersonationBannerProps {
  session: Session;
}

export function ImpersonationBanner({ session }: ImpersonationBannerProps) {
  const [isPending, startTransition] = useTransition();

  if (!session.user.isImpersonating) return null;

  const { name, email, role, agencyName } = session.user;

  function handleStop() {
    startTransition(async () => {
      await stopImpersonation();
    });
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-4 bg-amber-500 px-4 py-2 text-amber-950 shadow-md">
      <div className="flex items-center gap-2 text-sm font-medium">
        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
        <span>
          Você está visualizando como:{" "}
          <strong>{name ?? email}</strong>
          {" "}({role})
          {agencyName && (
            <>
              {" "}— Agência: <strong>{agencyName}</strong>
            </>
          )}
        </span>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="h-7 border-amber-700 bg-amber-400 text-amber-950 hover:bg-amber-300 shrink-0"
        onClick={handleStop}
        disabled={isPending}
      >
        <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
        {isPending ? "Saindo..." : "Voltar ao painel admin"}
      </Button>
    </div>
  );
}
