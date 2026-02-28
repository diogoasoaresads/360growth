/**
 * src/lib/billing/stripe.ts
 *
 * Billing-specific Stripe helpers.
 * No "use server" — safe to import from server actions, API routes, and auth.ts.
 */
import { getStripe } from "@/lib/stripe";
import type { BillingStatus } from "@/lib/db/schema";

// ─── Customer ─────────────────────────────────────────────────────────────────

export async function createStripeCustomer(params: {
  email: string;
  agencyName: string;
  agencyId: string;
}): Promise<string> {
  const stripe = getStripe();
  const customer = await stripe.customers.create({
    email: params.email,
    name: params.agencyName,
    metadata: { agencyId: params.agencyId },
  });
  return customer.id;
}

// ─── Subscription ─────────────────────────────────────────────────────────────

export async function createSubscription(params: {
  customerId: string;
  priceId: string;
  agencyId: string;
  trialDays?: number;
}): Promise<{ subscriptionId: string; status: string; trialEnd?: number }> {
  const stripe = getStripe();
  const subscription = await stripe.subscriptions.create({
    customer: params.customerId,
    items: [{ price: params.priceId }],
    trial_period_days: params.trialDays ?? 7,
    metadata: { agencyId: params.agencyId },
    payment_settings: {
      save_default_payment_method: "on_subscription",
    },
    expand: ["latest_invoice.payment_intent"],
  });

  return {
    subscriptionId: subscription.id,
    status: subscription.status,
    trialEnd: subscription.trial_end ?? undefined,
  };
}

// ─── Customer Portal ──────────────────────────────────────────────────────────

export async function createBillingPortalSession(
  customerId: string,
  returnUrl: string
): Promise<string> {
  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
  return session.url;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Map a raw Stripe subscription status to our internal BillingStatus.
 */
export function mapStripeToBillingStatus(stripeStatus: string): BillingStatus {
  switch (stripeStatus) {
    case "trialing":
      return "trial";
    case "active":
      return "active";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
    case "incomplete_expired":
      return "canceled";
    default:
      return "trial";
  }
}
