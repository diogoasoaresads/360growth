import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-02-25.clover",
      typescript: true,
    });
  }
  return _stripe;
}

/** @deprecated Use getStripe() instead */
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return getStripe()[prop as keyof Stripe];
  },
});

export async function createStripeCustomer(params: {
  email: string;
  name: string;
  agencyId: string;
}): Promise<string> {
  const customer = await stripe.customers.create({
    email: params.email,
    name: params.name,
    metadata: {
      agencyId: params.agencyId,
    },
  });
  return customer.id;
}

export async function createCheckoutSession(params: {
  customerId: string;
  priceId: string;
  agencyId: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<string> {
  const session = await stripe.checkout.sessions.create({
    customer: params.customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: params.priceId,
        quantity: 1,
      },
    ],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: {
      agencyId: params.agencyId,
    },
    subscription_data: {
      metadata: {
        agencyId: params.agencyId,
      },
    },
  });

  return session.url!;
}

export async function createBillingPortalSession(params: {
  customerId: string;
  returnUrl: string;
}): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({
    customer: params.customerId,
    return_url: params.returnUrl,
  });
  return session.url;
}
