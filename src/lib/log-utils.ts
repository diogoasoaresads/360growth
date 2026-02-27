// Log utility constants and helpers — no "use server" since these are plain functions/constants

export const ACTION_CATEGORIES = {
  agency: {
    label: "Agência",
    color: "blue" as const,
    actions: [
      "agency.created",
      "agency.updated",
      "agency.suspended",
      "agency.reactivated",
      "agency.deleted",
    ],
  },
  user: {
    label: "Usuário",
    color: "green" as const,
    actions: [
      "user.created",
      "user.updated",
      "user.impersonated",
      "user.password_reset",
      "user.suspended",
    ],
  },
  plan: {
    label: "Plano",
    color: "purple" as const,
    actions: ["plan.updated"],
  },
  subscription: {
    label: "Assinatura",
    color: "amber" as const,
    actions: [
      "subscription.created",
      "subscription.upgraded",
      "subscription.downgraded",
      "subscription.cancelled",
    ],
  },
  ticket: {
    label: "Ticket",
    color: "cyan" as const,
    actions: [
      "ticket.created",
      "ticket.replied",
      "ticket.status_changed",
      "ticket.priority_changed",
      "ticket.closed",
    ],
  },
  settings: {
    label: "Configurações",
    color: "gray" as const,
    actions: ["settings.updated"],
  },
  auth: {
    label: "Auth",
    color: "red" as const,
    actions: [
      "auth.login",
      "auth.logout",
      "auth.failed",
      "auth.impersonation_start",
      "auth.impersonation_end",
    ],
  },
} as const;

export type ActionCategory = keyof typeof ACTION_CATEGORIES;
export type CategoryColor = (typeof ACTION_CATEGORIES)[ActionCategory]["color"];

export function getActionCategory(action: string): ActionCategory | null {
  for (const [cat, cfg] of Object.entries(ACTION_CATEGORIES)) {
    if ((cfg.actions as readonly string[]).includes(action)) {
      return cat as ActionCategory;
    }
  }
  return null;
}
