import type { Metadata } from "next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getPlatformSettings,
  getFeatureFlags,
  getConfigAuditLogs,
} from "@/lib/actions/admin/config";
import { SettingsTable } from "./settings-table";
import { FlagsTable } from "./flags-table";
import { ConfigAuditLogs } from "./config-audit-logs";
import { PageContainer } from "@/components/workspace/PageContainer";

export const metadata: Metadata = {
  title: "Config Center — 360growth Admin",
};

interface Props {
  searchParams: Promise<{ tab?: string }>;
}

export default async function ConfigPage({ searchParams }: Props) {
  const { tab } = await searchParams;
  const activeTab = tab === "flags" || tab === "logs" ? tab : "settings";

  const [settingsResult, flagsResult, logsResult] = await Promise.all([
    getPlatformSettings(),
    getFeatureFlags(),
    getConfigAuditLogs(),
  ]);

  const settings = settingsResult.success ? settingsResult.data : [];
  const flags = flagsResult.success ? flagsResult.data : [];
  const logs = logsResult.success ? logsResult.data : [];

  return (
    <PageContainer
      title="Config Center"
      description="Gerencie configurações da plataforma, feature flags e visualize o histórico de alterações."
    >
      <Tabs defaultValue={activeTab}>
        <TabsList>
          <TabsTrigger value="settings">Platform Settings</TabsTrigger>
          <TabsTrigger value="flags">Feature Flags</TabsTrigger>
          <TabsTrigger value="logs">Audit Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="mt-4">
          <SettingsTable data={settings} />
        </TabsContent>

        <TabsContent value="flags" className="mt-4">
          <FlagsTable data={flags} />
        </TabsContent>

        <TabsContent value="logs" className="mt-4">
          <ConfigAuditLogs data={logs} />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
