import type { Metadata } from "next";
import { getSettings } from "@/lib/actions/admin/settings";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = {
  title: "Configurações — AgencyHub Admin",
};

export default async function SettingsPage() {
  const result = await getSettings();

  const initialSettings = result.success
    ? result.data
    : {
        general: {
          platformName: "AgencyHub",
          platformUrl: "",
          primaryColor: "#6366f1",
          description: "",
        },
        email: {
          senderEmail: "noreply@agencyhub.com",
          senderName: "AgencyHub",
        },
        limits: {
          defaultTrialDays: 14,
          maxUploadMb: 500,
          maxConcurrentSessions: 3,
        },
        security: {
          enforce2FA: false,
          sessionExpirationHours: 24,
          maxLoginAttempts: 5,
          lockoutMinutes: 30,
        },
        maintenance: {
          enabled: false,
          message: "Estamos em manutenção. Voltaremos em breve.",
          estimatedReturn: "",
        },
      };

  return (
    <div className="flex-1 space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground">
          Configurações globais da plataforma AgencyHub.
        </p>
      </div>

      <SettingsForm initialSettings={initialSettings} />
    </div>
  );
}
