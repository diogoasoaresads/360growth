"use client";

import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Check, Pencil, Users, Building2, GitBranch, Ticket } from "lucide-react";
import type { Plan, PlanFeatures } from "@/lib/db/schema";
import { DEFAULT_PLAN_FEATURES } from "@/lib/db/schema";

interface PlanCardProps {
  plan: Plan;
}

export function PlanCard({ plan }: PlanCardProps) {
  const features: PlanFeatures = (plan.featuresConfig as PlanFeatures) ?? DEFAULT_PLAN_FEATURES;

  const priceMonthly = Number(plan.priceMonthly);
  const priceYearly = Number(plan.priceYearly);

  return (
    <Card className={`flex flex-col ${!plan.isActive ? "opacity-60" : ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-lg">{plan.name}</CardTitle>
            {plan.slug && (
              <p className="text-xs text-muted-foreground mt-0.5 font-mono">{plan.slug}</p>
            )}
          </div>
          <Badge variant={plan.isActive ? "default" : "secondary"}>
            {plan.isActive ? "Ativo" : "Inativo"}
          </Badge>
        </div>
        {plan.description && (
          <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
        )}
      </CardHeader>

      <CardContent className="flex-1 space-y-4">
        {/* Pricing */}
        <div className="space-y-1">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold">
              {priceMonthly === 0 ? "Grátis" : `R$ ${priceMonthly.toFixed(2)}`}
            </span>
            {priceMonthly > 0 && (
              <span className="text-sm text-muted-foreground">/mês</span>
            )}
          </div>
          {priceYearly > 0 && (
            <p className="text-xs text-muted-foreground">
              R$ {priceYearly.toFixed(2)}/ano
            </p>
          )}
        </div>

        <Separator />

        {/* Limits */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Limites
          </p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{features.maxMembers} membros</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{features.maxClients} clientes</span>
            </div>
            <div className="flex items-center gap-1.5">
              <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{features.maxPipelines} pipelines</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Ticket className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{features.maxTicketsMonth} tickets/mês</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Feature toggles */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Recursos
          </p>
          <div className="space-y-1.5 text-sm">
            {[
              { key: "customDomain", label: "Domínio customizado" },
              { key: "apiAccess", label: "Acesso à API" },
              { key: "prioritySupport", label: "Suporte prioritário" },
              { key: "whiteLabel", label: "White-label" },
              { key: "advancedReports", label: "Relatórios avançados" },
            ].map(({ key, label }) => (
              <div
                key={key}
                className={`flex items-center gap-2 ${
                  features[key as keyof PlanFeatures]
                    ? "text-foreground"
                    : "text-muted-foreground line-through"
                }`}
              >
                <Check
                  className={`h-3.5 w-3.5 flex-shrink-0 ${
                    features[key as keyof PlanFeatures]
                      ? "text-green-500"
                      : "text-muted-foreground"
                  }`}
                />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Features list */}
        {plan.features && plan.features.length > 0 && (
          <>
            <Separator />
            <div className="space-y-1">
              {plan.features.map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <Check className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                  {f}
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>

      <CardFooter className="pt-4">
        <Button asChild variant="outline" className="w-full">
          <Link href={`/admin/plans/${plan.id}`}>
            <Pencil className="h-3.5 w-3.5 mr-2" />
            Editar Plano
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
