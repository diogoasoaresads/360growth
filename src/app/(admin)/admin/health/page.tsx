import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getSystemHealth } from "@/lib/actions/admin/health";
import { cn } from "@/lib/utils";
import {
  Database,
  ArrowUpCircle,
  Mail,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  MinusCircle,
} from "lucide-react";

export const metadata = { title: "System Health | Admin" };

function StatusDot({ ok, neutral }: { ok?: boolean; neutral?: boolean }) {
  if (neutral) return <MinusCircle className="h-5 w-5 text-slate-400 flex-shrink-0" />;
  return ok ? (
    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
  ) : (
    <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
  );
}

function Card({
  title,
  icon: Icon,
  children,
  status,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  status: "ok" | "error" | "neutral";
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-5 space-y-3",
        status === "ok" && "border-green-200 bg-green-50/40 dark:border-green-900/50 dark:bg-green-900/10",
        status === "error" && "border-red-200 bg-red-50/40 dark:border-red-900/50 dark:bg-red-900/10",
        status === "neutral" && "border-border bg-card"
      )}
    >
      <div className="flex items-center gap-2">
        <Icon
          className={cn(
            "h-4 w-4",
            status === "ok" && "text-green-600 dark:text-green-400",
            status === "error" && "text-red-600 dark:text-red-400",
            status === "neutral" && "text-muted-foreground"
          )}
        />
        <h2 className="font-semibold text-sm">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-muted-foreground flex-shrink-0">{label}</span>
      <span className="text-right font-medium break-all">{value}</span>
    </div>
  );
}

function formatDateBR(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function HealthPage() {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    redirect("/unauthorized");
  }

  const health = await getSystemHealth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">System Health</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Estado atual dos serviços e integrações da plataforma.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {/* ------------------------------------------------------------------ */}
        {/* DATABASE */}
        {/* ------------------------------------------------------------------ */}
        <Card
          title="Database"
          icon={Database}
          status={health.database.ok ? "ok" : "error"}
        >
          <div className="space-y-2">
            <Row
              label="Status"
              value={
                <span className="flex items-center justify-end gap-1.5">
                  <StatusDot ok={health.database.ok} />
                  {health.database.ok ? "OK" : "ERRO"}
                </span>
              }
            />
            {health.database.latencyMs !== undefined && (
              <Row label="Latência" value={`${health.database.latencyMs} ms`} />
            )}
            {health.database.error && (
              <p className="text-xs text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20 rounded p-2 font-mono break-all">
                {health.database.error}
              </p>
            )}
          </div>
        </Card>

        {/* ------------------------------------------------------------------ */}
        {/* MIGRATIONS */}
        {/* ------------------------------------------------------------------ */}
        <Card
          title="Migrations"
          icon={ArrowUpCircle}
          status={health.migration.name ? "ok" : "neutral"}
        >
          <div className="space-y-2">
            <Row
              label="Última migration"
              value={
                health.migration.name ? (
                  <span className="font-mono text-xs">{health.migration.name}</span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )
              }
            />
            {health.migration.appliedAt && (
              <Row
                label="Aplicada em"
                value={formatDateBR(health.migration.appliedAt)}
              />
            )}
            {!health.migration.name && (
              <p className="text-xs text-muted-foreground">
                Tabela __drizzle_migrations não encontrada.
              </p>
            )}
          </div>
        </Card>

        {/* ------------------------------------------------------------------ */}
        {/* RESEND */}
        {/* ------------------------------------------------------------------ */}
        <Card
          title="Resend (E-mail)"
          icon={Mail}
          status={health.resend.configured ? "ok" : "neutral"}
        >
          <div className="space-y-2">
            <Row
              label="Configurado"
              value={
                <span className="flex items-center justify-end gap-1.5">
                  <StatusDot ok={health.resend.configured} neutral={!health.resend.configured} />
                  {health.resend.configured ? "SIM" : "NÃO"}
                </span>
              }
            />
            {health.resend.lastEmailAt ? (
              <Row
                label="Último e-mail"
                value={formatDateBR(health.resend.lastEmailAt)}
              />
            ) : (
              <Row label="Último e-mail" value={<span className="text-muted-foreground">—</span>} />
            )}
          </div>
        </Card>

        {/* ------------------------------------------------------------------ */}
        {/* STRIPE */}
        {/* ------------------------------------------------------------------ */}
        <Card
          title="Stripe"
          icon={CreditCard}
          status={health.stripe.configured ? "ok" : "neutral"}
        >
          <div className="space-y-2">
            <Row
              label="Configurado"
              value={
                <span className="flex items-center justify-end gap-1.5">
                  <StatusDot ok={health.stripe.configured} neutral={!health.stripe.configured} />
                  {health.stripe.configured ? "SIM" : "NÃO"}
                </span>
              }
            />
            {health.stripe.lastWebhookAt ? (
              <Row
                label="Último webhook"
                value={formatDateBR(health.stripe.lastWebhookAt)}
              />
            ) : (
              <Row label="Último webhook" value={<span className="text-muted-foreground">—</span>} />
            )}
          </div>
        </Card>

        {/* ------------------------------------------------------------------ */}
        {/* RECENT ERRORS */}
        {/* ------------------------------------------------------------------ */}
        <Card
          title="Erros Recentes"
          icon={AlertTriangle}
          status={health.errors.length > 0 ? "error" : "ok"}
        >
          {health.errors.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum erro recente.</p>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {health.errors.map((err, i) => (
                <div
                  key={i}
                  className="text-xs border rounded px-2 py-1.5 bg-background space-y-0.5"
                >
                  <p className="text-muted-foreground">{formatDateBR(err.createdAt)}</p>
                  <p className="font-mono font-medium">{err.action}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
