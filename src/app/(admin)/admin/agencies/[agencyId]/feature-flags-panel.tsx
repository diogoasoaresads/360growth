"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { X, Loader2 } from "lucide-react";
import {
  setAgencyFeatureFlagOverride,
  clearAgencyFeatureFlagOverride,
} from "@/lib/actions/admin/feature-flags";

export interface FlagRow {
  key: string;
  name: string;
  description: string;
  globalEnabled: boolean;
  override: { enabled: boolean } | null;
  effectiveEnabled: boolean;
}

interface FeatureFlagsPanelProps {
  agencyId: string;
  flags: FlagRow[];
}

export function FeatureFlagsPanel({ agencyId, flags }: FeatureFlagsPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  function notify(type: "success" | "error", text: string) {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4000);
  }

  function toggle(flagKey: string, newEnabled: boolean) {
    startTransition(async () => {
      const result = await setAgencyFeatureFlagOverride({
        agencyId,
        flagKey,
        enabled: newEnabled,
      });
      if (result.success) {
        notify("success", `Flag "${flagKey}" ${newEnabled ? "ativada" : "desativada"} para esta agência.`);
        router.refresh();
      } else {
        notify("error", result.error);
      }
    });
  }

  function clearOverride(flagKey: string) {
    startTransition(async () => {
      const result = await clearAgencyFeatureFlagOverride({ agencyId, flagKey });
      if (result.success) {
        notify("success", `Override de "${flagKey}" removido. Volta ao global.`);
        router.refresh();
      } else {
        notify("error", result.error);
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feature Flags</CardTitle>
        <CardDescription>
          Overrides por agência — override tem prioridade sobre o global.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {feedback && (
          <p
            className={`text-sm rounded-md px-3 py-2 ${
              feedback.type === "success"
                ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                : "bg-destructive/10 text-destructive"
            }`}
          >
            {feedback.text}
          </p>
        )}

        <div className="divide-y">
          {flags.map((flag) => (
            <div key={flag.key} className="flex items-center gap-4 py-3">
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{flag.name}</p>
                <p className="text-xs text-muted-foreground">{flag.description}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                    Global:
                  </span>
                  <Badge variant={flag.globalEnabled ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
                    {flag.globalEnabled ? "ON" : "OFF"}
                  </Badge>
                  {flag.override !== null && (
                    <>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                        Override:
                      </span>
                      <Badge
                        variant={flag.override.enabled ? "default" : "secondary"}
                        className="text-[10px] px-1.5 py-0"
                      >
                        {flag.override.enabled ? "ON" : "OFF"}
                      </Badge>
                    </>
                  )}
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                    Efetivo:
                  </span>
                  <Badge
                    variant={flag.effectiveEnabled ? "default" : "destructive"}
                    className="text-[10px] px-1.5 py-0"
                  >
                    {flag.effectiveEnabled ? "ON" : "OFF"}
                  </Badge>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Switch
                  checked={flag.override !== null ? flag.override.enabled : flag.globalEnabled}
                  onCheckedChange={(checked) => toggle(flag.key, checked)}
                  disabled={isPending}
                  aria-label={`Toggle ${flag.name}`}
                />
                {flag.override !== null && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => clearOverride(flag.key)}
                    disabled={isPending}
                    title="Remover override"
                  >
                    {isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <X className="h-3 w-3" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
