"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { NewNotification } from "@/lib/db/schema";

/**
 * Fetch unread notifications for the current user
 */
export async function getNotifications() {
    const session = await auth();
    if (!session?.user) return [];

    return db.query.notifications.findMany({
        where: and(
            eq(notifications.userId, session.user.id),
            eq(notifications.read, false)
        ),
        orderBy: [desc(notifications.createdAt)],
        limit: 10,
    });
}

/**
 * Mark a specific notification as read
 */
export async function markNotificationAsRead(id: string) {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    await db
        .update(notifications)
        .set({ read: true })
        .where(and(eq(notifications.id, id), eq(notifications.userId, session.user.id)));

    revalidatePath("/");
}

/**
 * Mark all notifications as read for the current user
 */
export async function markAllNotificationsAsRead() {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    await db
        .update(notifications)
        .set({ read: true })
        .where(eq(notifications.userId, session.user.id));

    revalidatePath("/");
}

/**
 * Internal helper to create a notification (Server Side Only)
 */
export async function createNotification(data: NewNotification) {
    const [notification] = await db.insert(notifications).values(data).returning();
    return notification;
}
