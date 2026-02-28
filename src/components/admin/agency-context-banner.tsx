"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Building2, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setActiveContext } from "@/lib/actions/admin/context";

interface AgencyContextBannerProps {
  agencyName: string;
}

export function AgencyContextBanner({ agencyName }: AgencyContextBannerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleBackToPlatform() {
    startTransition(async () => {
      try {
        await setActiveContext("platform");
        toast.success("Contexto: Plataforma");
        router.push("/admin");
        router.refresh();
      } catch {
        toast.error("Erro ao trocar contexto.");
      }
    });
  }

  return (
    <div className="flex items-center justify-between border-b border-indigo-200 bg-indigo-50 px-6 py-2 dark:border-indigo-900 dark:bg-indigo-950/40">
      <div className="flex items-center gap-2 text-sm font-medium text-indigo-700 dark:text-indigo-300">
        <Building2 className="h-4 w-4 flex-shrink-0" />
        <span>
          Você está no contexto da Agência:{" "}
          <span className="font-bold">{agencyName}</span>
        </span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 gap-1.5 text-xs text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-900"
        onClick={handleBackToPlatform}
        disabled={isPending}
      >
        {isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <ArrowLeft className="h-3.5 w-3.5" />
        )}
        Voltar para Plataforma
      </Button>
    </div>
  );
}
