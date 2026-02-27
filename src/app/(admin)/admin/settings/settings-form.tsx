"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Globe,
  Mail,
  Shield,
  Lock,
  Wrench,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { updateSettings } from "@/lib/actions/admin/settings";
import type { AllSettings } from "@/lib/actions/admin/settings";
import {
  generalSettingsSchema,
  emailSettingsSchema,
  limitsSettingsSchema,
  securitySettingsSchema,
  maintenanceSettingsSchema,
  type GeneralSettings,
  type EmailSettings,
  type LimitsSettings,
  type SecuritySettings,
  type MaintenanceSettings,
} from "@/lib/validations/settings";

const TABS = [
  { id: "general", label: "Geral", icon: Globe },
  { id: "email", label: "Email", icon: Mail },
  { id: "limits", label: "Limites Padrão", icon: Shield },
  { id: "security", label: "Segurança", icon: Lock },
  { id: "maintenance", label: "Manutenção", icon: Wrench },
] as const;

type TabId = (typeof TABS)[number]["id"];

// ─── Sub-forms ───────────────────────────────────────────────

function GeneralForm({ defaults }: { defaults: GeneralSettings }) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<GeneralSettings>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: defaults,
  });

  function onSubmit(data: GeneralSettings) {
    startTransition(async () => {
      const result = await updateSettings({ section: "general", data });
      if (result.success) toast.success("Configurações gerais salvas");
      else toast.error(result.error);
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="platformName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da plataforma</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="platformUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL da plataforma</FormLabel>
              <FormControl>
                <Input placeholder="https://app.agencyhub.com" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="primaryColor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cor primária</FormLabel>
              <FormControl>
                <div className="flex items-center gap-2">
                  <Input type="color" className="h-10 w-16 p-1 cursor-pointer" {...field} />
                  <Input
                    placeholder="#6366f1"
                    className="font-mono"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                    }}
                  />
                </div>
              </FormControl>
              <FormDescription>Cor hexadecimal (ex: #6366f1)</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição da plataforma</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Plataforma SaaS para agências digitais..."
                  className="resize-none"
                  rows={3}
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Salvando..." : "Salvar alterações"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

function EmailForm({ defaults }: { defaults: EmailSettings }) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<EmailSettings>({
    resolver: zodResolver(emailSettingsSchema),
    defaultValues: defaults,
  });

  function onSubmit(data: EmailSettings) {
    startTransition(async () => {
      const result = await updateSettings({ section: "email", data });
      if (result.success) toast.success("Configurações de email salvas");
      else toast.error(result.error);
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="senderEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email do remetente</FormLabel>
              <FormControl>
                <Input type="email" placeholder="noreply@agencyhub.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="senderName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do remetente</FormLabel>
              <FormControl>
                <Input placeholder="AgencyHub" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
          Nota: A configuração completa do Resend será feita no Módulo de Emails.
        </p>
        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Salvando..." : "Salvar alterações"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

function numField(onChange: (...args: unknown[]) => void) {
  return (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange(e.target.valueAsNumber);
}

function LimitsForm({ defaults }: { defaults: LimitsSettings }) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<LimitsSettings>({
    resolver: zodResolver(limitsSettingsSchema),
    defaultValues: defaults,
  });

  function onSubmit(data: LimitsSettings) {
    startTransition(async () => {
      const result = await updateSettings({ section: "limits", data });
      if (result.success) toast.success("Limites salvos");
      else toast.error(result.error);
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="defaultTrialDays"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Período trial padrão (dias)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  max={90}
                  {...field}
                  onChange={numField(field.onChange)}
                />
              </FormControl>
              <FormDescription>Entre 0 e 90 dias.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="maxUploadMb"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Limite de upload por agência (MB)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={50}
                  max={10000}
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
          name="maxConcurrentSessions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sessões simultâneas por usuário</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  {...field}
                  onChange={numField(field.onChange)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Salvando..." : "Salvar alterações"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

function SecurityForm({ defaults }: { defaults: SecuritySettings }) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<SecuritySettings>({
    resolver: zodResolver(securitySettingsSchema),
    defaultValues: defaults,
  });

  function onSubmit(data: SecuritySettings) {
    startTransition(async () => {
      const result = await updateSettings({ section: "security", data });
      if (result.success) toast.success("Configurações de segurança salvas");
      else toast.error(result.error);
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="enforce2FA"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <FormLabel>Forçar 2FA para admins de agência</FormLabel>
                <FormDescription>
                  Exige autenticação de dois fatores para todos os Agency Admins.
                </FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="sessionExpirationHours"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Expiração de sessão (horas)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  max={720}
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
          name="maxLoginAttempts"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Máximo de tentativas de login</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={3}
                  max={20}
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
          name="lockoutMinutes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bloquear conta após tentativas (minutos)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={5}
                  max={1440}
                  {...field}
                  onChange={numField(field.onChange)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Salvando..." : "Salvar alterações"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

function MaintenanceForm({ defaults }: { defaults: MaintenanceSettings }) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<MaintenanceSettings>({
    resolver: zodResolver(maintenanceSettingsSchema),
    defaultValues: defaults,
  });

  const isEnabled = form.watch("enabled");

  function onSubmit(data: MaintenanceSettings) {
    startTransition(async () => {
      const result = await updateSettings({ section: "maintenance", data });
      if (result.success) toast.success("Modo manutenção atualizado");
      else toast.error(result.error);
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {isEnabled && (
          <div className="flex items-start gap-2 rounded-md border border-yellow-300 bg-yellow-50 p-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-600" />
            <p className="text-sm text-yellow-800">
              O modo manutenção está <strong>ATIVO</strong>. Apenas Super Admins podem acessar a plataforma.
            </p>
          </div>
        )}
        <FormField
          control={form.control}
          name="enabled"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <FormLabel>Modo manutenção</FormLabel>
                <FormDescription>
                  Bloqueia o acesso de agências e clientes à plataforma.
                </FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mensagem de manutenção</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Estamos em manutenção. Voltaremos em breve."
                  className="resize-none"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="estimatedReturn"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Horário estimado de retorno</FormLabel>
              <FormControl>
                <Input
                  type="datetime-local"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Salvando..." : "Salvar alterações"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

// ─── Main form container ──────────────────────────────────────

const TAB_META: Record<
  TabId,
  { title: string; description: string }
> = {
  general: { title: "Geral", description: "Nome, URL, cores e identidade da plataforma." },
  email: { title: "Email", description: "Configurações de remetente para envio de emails." },
  limits: { title: "Limites Padrão", description: "Valores padrão aplicados a novas agências." },
  security: { title: "Segurança", description: "Políticas de login, sessão e autenticação." },
  maintenance: { title: "Manutenção", description: "Controle de acesso à plataforma." },
};

interface SettingsFormProps {
  initialSettings: AllSettings;
}

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const [activeTab, setActiveTab] = useState<TabId>("general");
  const meta = TAB_META[activeTab];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
      {/* Sidebar nav */}
      <nav className="flex flex-row gap-1 lg:flex-col">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors text-left w-full",
              activeTab === id
                ? "bg-primary text-primary-foreground font-medium"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </button>
        ))}
      </nav>

      {/* Form content */}
      <Card>
        <CardHeader>
          <CardTitle>{meta.title}</CardTitle>
          <CardDescription>{meta.description}</CardDescription>
        </CardHeader>
        <CardContent>
          {activeTab === "general" && <GeneralForm defaults={initialSettings.general} />}
          {activeTab === "email" && <EmailForm defaults={initialSettings.email} />}
          {activeTab === "limits" && <LimitsForm defaults={initialSettings.limits} />}
          {activeTab === "security" && <SecurityForm defaults={initialSettings.security} />}
          {activeTab === "maintenance" && <MaintenanceForm defaults={initialSettings.maintenance} />}
        </CardContent>
      </Card>
    </div>
  );
}
