import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { users, agencies, agencyUsers } from "@/lib/db/schema";
import { sendSystemEmail } from "@/lib/messaging/email";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  agencyName: z.string().min(2),
});

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Dados inválidos", errors: parsed.error.issues },
        { status: 400 }
      );
    }

    const { name, email, password, agencyName } = parsed.data;

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "E-mail já cadastrado" },
        { status: 400 }
      );
    }

    // Generate unique slug for agency
    let slug = slugify(agencyName);
    const existingAgency = await db.query.agencies.findFirst({
      where: eq(agencies.slug, slug),
    });
    if (existingAgency) {
      slug = `${slug}-${Date.now()}`;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Create user, agency, and link them in a transaction
    const result = await db.transaction(async (tx) => {
      const [newUser] = await tx
        .insert(users)
        .values({
          name,
          email,
          passwordHash,
          role: "AGENCY_ADMIN",
        })
        .returning();

      const [newAgency] = await tx
        .insert(agencies)
        .values({
          name: agencyName,
          slug,
          active: true,
        })
        .returning();

      await tx.insert(agencyUsers).values({
        agencyId: newAgency.id,
        userId: newUser.id,
        role: "AGENCY_ADMIN",
      });

      return { user: newUser, agency: newAgency };
    });

    // Send welcome email (non-blocking)
    sendSystemEmail({
      to: result.user.email,
      templateKey: "welcome_user",
      agencyId: result.agency.id,
      variables: {
        userName: result.user.name ?? name,
        agencyName: result.agency.name,
        loginUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/login`,
      },
    });

    return NextResponse.json(
      {
        message: "Conta criada com sucesso",
        userId: result.user.id,
        agencyId: result.agency.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { message: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
