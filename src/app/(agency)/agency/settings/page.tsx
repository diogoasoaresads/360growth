import { auth } from "@/lib/auth";
import { getAgencySettings } from "@/lib/actions/agency-settings.actions";
import { AgencySettingsForm } from "./settings-form";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Calendar, Hash } from "lucide-react";

export const metadata = {
  title: "Configurações | Agência",
};

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" }> = {
  active: { label: "Ativa", variant: "success" },
  trial: { label: "Trial", variant: "warning" },
  suspended: { label: "Suspensa", variant: "destructive" },
  cancelled: { label: "Cancelada", variant: "outline" },
  blocked: { label: "Bloqueada", variant: "destructive" },
  past_due: { label: "Em atraso", variant: "warning" },
};

export default async function AgencySettingsPage() {
  const session = await auth();
  const isAdmin =
    session?.user.role === "AGENCY_ADMIN" ||
    session?.user.role === "SUPER_ADMIN";

  const result = await getAgencySettings();

  if (!result.success) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">{result.error}</p>
      </div>
    );
  }

  const agency = result.data;
  const statusConfig = STATUS_LABELS[agency.agencyStatus] ?? {
    label: agency.agencyStatus,
    variant: "secondary" as const,
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie as informações da sua agência
          </p>
        </div>
        <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
      </div>

      {/* Meta Info */}
      <Card>
        <CardContent className="flex flex-wrap gap-6 p-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Hash className="h-3.5 w-3.5" />
            <span>ID: <span className="font-mono">{agency.id.slice(0, 8)}…</span></span>
          </div>
          <div className="flex items-center gap-2">
            <Building2 className="h-3.5 w-3.5" />
            <span>Slug: <span className="font-medium text-foreground">{agency.slug}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5" />
            <span>
              Criada em:{" "}
              <span className="font-medium text-foreground">
                {new Date(agency.createdAt).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Settings Form */}
      <AgencySettingsForm agency={agency} isAdmin={isAdmin} />

      {!isAdmin && (
        <p className="text-sm text-muted-foreground text-center">
          Apenas administradores da agência podem editar estas configurações.
        </p>
      )}
    </div>
  );
}
