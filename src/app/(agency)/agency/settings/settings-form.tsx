"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { updateAgencySettings } from "@/lib/actions/agency-settings.actions";
import { Loader2, Save } from "lucide-react";

interface AgencySettingsFormProps {
  agency: {
    id: string;
    name: string;
    slug: string;
    email: string | null;
    phone: string | null;
    website: string | null;
    logo: string | null;
    agencyStatus: string;
    createdAt: Date;
  };
  isAdmin: boolean;
}

export function AgencySettingsForm({ agency, isAdmin }: AgencySettingsFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [name, setName] = useState(agency.name);
  const [email, setEmail] = useState(agency.email ?? "");
  const [phone, setPhone] = useState(agency.phone ?? "");
  const [website, setWebsite] = useState(agency.website ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const result = await updateAgencySettings({
        name,
        email: email || null,
        phone: phone || null,
        website: website || null,
      });

      if (!result.success) {
        setError(result.error);
      } else {
        setSuccess(true);
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informações da Agência</CardTitle>
          <CardDescription>
            Atualize os dados básicos da sua agência
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Agência *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!isAdmin || isPending}
                placeholder="Minha Agência"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug (identificador)</Label>
              <Input
                id="slug"
                value={agency.slug}
                disabled
                className="bg-muted text-muted-foreground"
              />
              <p className="text-xs text-muted-foreground">
                O slug não pode ser alterado após o cadastro
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email de Contato</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!isAdmin || isPending}
                placeholder="contato@agencia.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={!isAdmin || isPending}
                placeholder="+55 11 9 9999-9999"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              disabled={!isAdmin || isPending}
              placeholder="https://agencia.com"
            />
          </div>
        </CardContent>
      </Card>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {success && (
        <p className="text-sm text-green-600">Configurações salvas com sucesso!</p>
      )}

      {isAdmin && (
        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Salvar Alterações
          </Button>
        </div>
      )}
    </form>
  );
}
