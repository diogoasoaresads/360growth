import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageContainer } from "@/components/workspace/PageContainer";
import { QaSetupClient } from "./qa-setup-client";

export const metadata: Metadata = {
  title: "QA Demo Setup",
};

export default async function QaSetupPage() {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    redirect("/admin");
  }

  const qaEnabled =
    process.env.QA_TOOLS_ENABLED === "true" ||
    process.env.NODE_ENV === "development";

  if (!qaEnabled) {
    redirect("/admin");
  }

  return (
    <PageContainer
      title="QA Demo Setup"
      description="Cria dados fictícios completos para testes de PO, Agência e Cliente. Idempotente: pode ser executado múltiplas vezes."
    >
      <QaSetupClient />
    </PageContainer>
  );
}
