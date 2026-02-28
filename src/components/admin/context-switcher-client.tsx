"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, ChevronDown, Layers, Building2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { setActiveContext } from "@/lib/actions/admin/context";
import { cn } from "@/lib/utils";

interface Agency {
  id: string;
  name: string;
}

interface ContextSwitcherClientProps {
  agencies: Agency[];
  activeScope: "platform" | "agency";
  activeAgencyId: string | null;
  activeAgencyName: string | null;
}

export function ContextSwitcherClient({
  agencies,
  activeScope,
  activeAgencyId,
  activeAgencyName,
}: ContextSwitcherClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handlePlatform() {
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

  function handleAgency(agency: Agency) {
    startTransition(async () => {
      try {
        await setActiveContext("agency", agency.id);
        toast.success(`Contexto: ${agency.name}`);
        router.push("/agency/dashboard");
        router.refresh();
      } catch {
        toast.error("Erro ao trocar contexto.");
      }
    });
  }

  const label =
    activeScope === "agency" && activeAgencyName
      ? activeAgencyName
      : "Plataforma";

  const Icon = activeScope === "agency" ? Building2 : Layers;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs font-medium"
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Icon className="h-3.5 w-3.5" />
          )}
          <span className="max-w-[130px] truncate">{label}</span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          Trocar contexto
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Platform option */}
        <DropdownMenuItem
          onClick={handlePlatform}
          className="gap-2"
        >
          <Layers className="h-4 w-4 text-muted-foreground" />
          <span className="flex-1">Plataforma</span>
          {activeScope === "platform" && (
            <Check className="h-3.5 w-3.5 text-primary" />
          )}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs text-muted-foreground font-normal py-1">
            Agências
          </DropdownMenuLabel>

          {agencies.length === 0 ? (
            <div className="px-3 py-4 text-center text-xs text-muted-foreground">
              Crie uma agência primeiro
            </div>
          ) : (
            agencies.map((agency) => {
              const isSelected =
                activeScope === "agency" && activeAgencyId === agency.id;
              return (
                <DropdownMenuItem
                  key={agency.id}
                  onClick={() => handleAgency(agency)}
                  className={cn("gap-2", isSelected && "bg-accent")}
                >
                  <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="flex-1 truncate">{agency.name}</span>
                  {isSelected && (
                    <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                  )}
                </DropdownMenuItem>
              );
            })
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
