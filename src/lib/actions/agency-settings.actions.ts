"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { agencies } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getActiveAgencyIdOrThrow } from "@/lib/active-context";

const updateAgencySettingsSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido").optional().or(z.literal("")).nullable(),
  phone: z.string().optional().nullable(),
  website: z.string().url("URL inválida").optional().or(z.literal("")).nullable(),
});

export type UpdateAgencySettingsInput = z.infer<typeof updateAgencySettingsSchema>;

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function getAgencySettings(): Promise<
  ActionResult<{
    id: string;
    name: string;
    slug: string;
    email: string | null;
    phone: string | null;
    website: string | null;
    logo: string | null;
    agencyStatus: string;
    createdAt: Date;
  }>
> {
  try {
    const session = await auth();
    if (!session) return { success: false, error: "Unauthorized" };

    const agencyId = await getActiveAgencyIdOrThrow();

    const [agency] = await db
      .select({
        id: agencies.id,
        name: agencies.name,
        slug: agencies.slug,
        email: agencies.email,
        phone: agencies.phone,
        website: agencies.website,
        logo: agencies.logo,
        agencyStatus: agencies.agencyStatus,
        createdAt: agencies.createdAt,
      })
      .from(agencies)
      .where(eq(agencies.id, agencyId))
      .limit(1);

    if (!agency) return { success: false, error: "Agência não encontrada" };

    return { success: true, data: agency };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erro ao carregar configurações",
    };
  }
}

export async function updateAgencySettings(
  input: UpdateAgencySettingsInput
): Promise<ActionResult<void>> {
  try {
    const session = await auth();
    if (!session) return { success: false, error: "Unauthorized" };
    if (
      session.user.role !== "AGENCY_ADMIN" &&
      session.user.role !== "SUPER_ADMIN"
    ) {
      return { success: false, error: "Permissão negada" };
    }

    const agencyId = await getActiveAgencyIdOrThrow();
    const parsed = updateAgencySettingsSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Dados inválidos",
      };
    }

    await db
      .update(agencies)
      .set({
        name: parsed.data.name,
        email: parsed.data.email ?? null,
        phone: parsed.data.phone ?? null,
        website: parsed.data.website ?? null,
        updatedAt: new Date(),
      })
      .where(eq(agencies.id, agencyId));

    revalidatePath("/agency/settings");
    return { success: true, data: undefined };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erro ao salvar configurações",
    };
  }
}
