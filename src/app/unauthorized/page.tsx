import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldX } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6">
      <ShieldX className="h-24 w-24 text-destructive" />
      <div className="text-center">
        <h1 className="text-3xl font-bold">Acesso Negado</h1>
        <p className="text-muted-foreground mt-2">
          Você não tem permissão para acessar esta página.
        </p>
      </div>
      <div className="flex gap-4">
        <Button variant="outline" asChild>
          <Link href="javascript:history.back()">Voltar</Link>
        </Button>
        <Button asChild>
          <Link href="/login">Fazer Login</Link>
        </Button>
      </div>
    </div>
  );
}
