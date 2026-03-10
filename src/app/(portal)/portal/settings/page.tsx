import { auth } from "@/lib/auth";
import { PageContainer } from "@/components/workspace/PageContainer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { clients } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export default async function PortalSettingsPage() {
    const session = await auth();
    if (!session) return null;
    const user = session.user;

    const client = await db.query.clients.findFirst({
        where: eq(clients.userId, user.id),
    });

    return (
        <div className="p-6">
            <PageContainer
                title="Configurações"
                description="Gerencie suas informações de perfil e preferências."
            >
                <div className="max-w-2xl space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Perfil</CardTitle>
                            <CardDescription>
                                Suas informações básicas de contato.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nome</Label>
                                <Input id="name" defaultValue={user?.name || ""} disabled />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">E-mail</Label>
                                <Input id="email" defaultValue={user?.email || ""} disabled />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="company">Empresa</Label>
                                <Input id="company" defaultValue={client?.company || ""} disabled />
                            </div>
                            <Button disabled className="w-fit">Salvar Alterações</Button>
                            <p className="text-[10px] text-muted-foreground italic">
                                * Para alterar seus dados, entre em contato com o suporte da agência.
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Notificações</CardTitle>
                            <CardDescription>
                                Escolha como deseja ser notificado.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                As preferências de notificação serão implementadas em breve.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </PageContainer>
        </div>
    );
}
