import { listPlatformTemplates } from "@/lib/actions/admin/templates";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail } from "lucide-react";
import { TemplateEditor } from "./template-editor";
import { PageContainer } from "@/components/workspace/PageContainer";

export const metadata = { title: "Templates de Mensagem | Admin" };

export default async function TemplatesPage() {
  const result = await listPlatformTemplates();
  const templates = result.success ? result.data : [];

  return (
    <PageContainer
      title="Templates de Mensagem"
      description="Templates da plataforma — podem ser sobrescritos por agência."
    >
      {templates.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            Nenhum template encontrado. Execute a migration para criar os templates padrão.
          </CardContent>
        </Card>
      )}

      <div className="space-y-6">
        {templates.map((tpl) => (
          <Card key={tpl.id}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1">
                  <CardTitle className="text-base font-mono">{tpl.key}</CardTitle>
                  <CardDescription className="mt-1 text-xs">
                    Canal: {tpl.channel} · Escopo: {tpl.scope}
                  </CardDescription>
                </div>
                <Badge variant={tpl.isActive ? "default" : "secondary"}>
                  {tpl.isActive ? "Ativo" : "Inativo"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <TemplateEditor
                templateKey={tpl.key}
                initialSubject={tpl.subject}
                initialBody={tpl.body}
                initialIsActive={tpl.isActive}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </PageContainer>
  );
}
