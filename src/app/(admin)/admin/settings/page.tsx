import type { Metadata } from "next";
import { getSettings } from "@/lib/actions/admin/settings";
import { SettingsForm } from "./settings-form";
import { PageContainer } from "@/components/workspace/PageContainer";

export const metadata: Metadata = {
  title: "Configurações — 360growth Admin",
};

export default async function SettingsPage() {
  const result = await getSettings();

  const initialSettings = result.success
    ? result.data
    : {
        general: {
          platformName: "360growth",
          platformUrl: "",
          primaryColor: "#6366f1",
          description: "",
        },
        email: {
          senderEmail: "noreply@360growth.com",
          senderName: "360growth",
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
    <PageContainer
      title="Configurações"
      description="Configurações globais da plataforma 360growth."
    >
      <SettingsForm initialSettings={initialSettings} />
    </PageContainer>
  );
}
