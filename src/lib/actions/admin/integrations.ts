"use server";

import { db } from "@/lib/db";
import { integrations } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { desc } from "drizzle-orm";

export async function getAdminIntegrations() {
    const session = await auth();
    if (!session || session.user.role !== "SUPER_ADMIN") {
        throw new Error("Unauthorized");
    }

    const allIntegrations = await db.query.integrations.findMany({
        with: {
            agency: {
                columns: {
                    id: true,
                    name: true,
                }
            }
        },
        orderBy: [desc(integrations.createdAt)],
    });

    return allIntegrations;
}

export async function getIntegrationStats() {
    const session = await auth();
    if (!session || session.user.role !== "SUPER_ADMIN") {
        throw new Error("Unauthorized");
    }

    const all = await db.query.integrations.findMany();

    const stats = {
        total: all.length,
        connected: all.filter((i: any) => i.status === "connected").length,
        error: all.filter((i: any) => i.status === "error").length,
        byProvider: all.reduce((acc: Record<string, number>, curr: any) => {
            acc[curr.provider] = (acc[curr.provider] || 0) + 1;
            return acc;
        }, {} as Record<string, number>),
    };

    return stats;
}
