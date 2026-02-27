import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { AgencyUsage, AgencyLimits } from "@/lib/plan-limits";

interface UsagePanelProps {
  usage: AgencyUsage;
  limits: AgencyLimits;
}

interface UsageRowProps {
  label: string;
  current: number;
  max: number; // 0 = unlimited
}

function UsageRow({ label, current, max }: UsageRowProps) {
  const unlimited = max === 0;
  const percent = unlimited ? 0 : Math.min(100, Math.round((current / max) * 100));
  const danger = !unlimited && percent >= 90;
  const warning = !unlimited && percent >= 70 && percent < 90;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">
          {current}
          {unlimited ? "" : ` / ${max}`}
          {unlimited && <span className="ml-1 text-xs">(ilimitado)</span>}
        </span>
      </div>
      {!unlimited && (
        <Progress
          value={percent}
          className={
            danger
              ? "[&>div]:bg-destructive"
              : warning
                ? "[&>div]:bg-yellow-500"
                : ""
          }
        />
      )}
    </div>
  );
}

export function UsagePanel({ usage, limits }: UsagePanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Uso do plano</CardTitle>
        <CardDescription>
          Consumo atual dos recursos em relação aos limites do plano. 0 = ilimitado.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <UsageRow label="Usuários" current={usage.users} max={limits.maxUsers} />
        <UsageRow label="Clientes" current={usage.clients} max={limits.maxClients} />
        <UsageRow label="Negócios (CRM)" current={usage.deals} max={limits.maxDeals} />
        <UsageRow label="Tickets" current={usage.tickets} max={limits.maxTickets} />
      </CardContent>
    </Card>
  );
}
