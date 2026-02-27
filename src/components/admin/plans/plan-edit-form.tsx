"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { updatePlanSchema, type UpdatePlanInput } from "@/lib/validations/plan";
import { updatePlan } from "@/lib/actions/admin/plans";
import type { Plan, PlanFeatures } from "@/lib/db/schema";
import { DEFAULT_PLAN_FEATURES } from "@/lib/db/schema";

interface PlanEditFormProps {
  plan: Plan;
}

function numField(onChange: (...args: unknown[]) => void) {
  return (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange(e.target.valueAsNumber);
}

export function PlanEditForm({ plan }: PlanEditFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const features: PlanFeatures =
    (plan.featuresConfig as PlanFeatures) ?? DEFAULT_PLAN_FEATURES;

  const form = useForm<UpdatePlanInput>({
    resolver: zodResolver(updatePlanSchema),
    defaultValues: {
      name: plan.name,
      slug: plan.slug ?? "",
      description: plan.description ?? "",
      priceMonthly: Number(plan.priceMonthly),
      priceYearly: Number(plan.priceYearly),
      maxClients: plan.maxClients,
      maxUsers: plan.maxUsers,
      isActive: plan.isActive,
      sortOrder: plan.sortOrder,
      stripePriceId: plan.stripePriceId ?? "",
      stripePriceIdYearly: plan.stripePriceIdYearly ?? "",
      features: plan.features ?? [],
      featuresConfig: features,
    },
  });

  function onSubmit(values: UpdatePlanInput) {
    startTransition(async () => {
      const result = await updatePlan(plan.id, values);
      if (result.success) {
        toast.success("Plano atualizado com sucesso!");
        router.push("/admin/plans");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informações básicas</CardTitle>
            <CardDescription>Nome, slug e descrição do plano.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Starter" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <Input placeholder="starter" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva o plano..."
                      rows={3}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <FormField
                control={form.control}
                name="sortOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ordem</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        {...field}
                        onChange={numField(field.onChange)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-col justify-end">
                    <FormLabel>Ativo</FormLabel>
                    <div className="flex h-10 items-center">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle>Preços</CardTitle>
            <CardDescription>Defina os preços mensal e anual.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="priceMonthly"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço mensal (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min={0}
                        {...field}
                        onChange={numField(field.onChange)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="priceYearly"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço anual (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min={0}
                        {...field}
                        onChange={numField(field.onChange)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="stripePriceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stripe Price ID (mensal)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="price_..."
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="stripePriceIdYearly"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stripe Price ID (anual)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="price_..."
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Limits */}
        <Card>
          <CardHeader>
            <CardTitle>Limites</CardTitle>
            <CardDescription>
              Limites de uso para as agências neste plano.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <FormField
                control={form.control}
                name="maxUsers"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Máx. usuários</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        {...field}
                        onChange={numField(field.onChange)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="maxClients"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Máx. clientes</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        {...field}
                        onChange={numField(field.onChange)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="featuresConfig.maxMembers"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Máx. membros</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        {...field}
                        onChange={numField(field.onChange)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="featuresConfig.maxPipelines"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Máx. pipelines</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        {...field}
                        onChange={numField(field.onChange)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="featuresConfig.maxClients"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Máx. clientes (config)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        {...field}
                        onChange={numField(field.onChange)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="featuresConfig.maxTicketsMonth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tickets/mês</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        {...field}
                        onChange={numField(field.onChange)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Feature Toggles */}
        <Card>
          <CardHeader>
            <CardTitle>Recursos</CardTitle>
            <CardDescription>
              Ative ou desative recursos disponíveis neste plano.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              {
                name: "featuresConfig.customDomain" as const,
                label: "Domínio customizado",
                description: "Permite usar domínio próprio no portal do cliente.",
              },
              {
                name: "featuresConfig.apiAccess" as const,
                label: "Acesso à API",
                description: "Acesso à API REST para integrações.",
              },
              {
                name: "featuresConfig.prioritySupport" as const,
                label: "Suporte prioritário",
                description: "Atendimento com prioridade na fila de suporte.",
              },
              {
                name: "featuresConfig.whiteLabel" as const,
                label: "White-label",
                description: "Remove a marca AgencyHub da interface.",
              },
              {
                name: "featuresConfig.advancedReports" as const,
                label: "Relatórios avançados",
                description: "Acesso a relatórios detalhados e exportação.",
              },
            ].map(({ name, label, description }) => (
              <FormField
                key={name}
                control={form.control}
                name={name}
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">{label}</FormLabel>
                      <FormDescription>{description}</FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={!!field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/plans")}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Salvando..." : "Salvar alterações"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
