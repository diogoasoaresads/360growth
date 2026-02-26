import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { agencies } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Stripe webhook error:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const agencyId = subscription.metadata.agencyId;

        if (agencyId) {
          await db
            .update(agencies)
            .set({
              stripeSubscriptionId: subscription.id,
              subscriptionStatus: subscription.status,
              updatedAt: new Date(),
            })
            .where(eq(agencies.id, agencyId));
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const agencyId = subscription.metadata.agencyId;

        if (agencyId) {
          await db
            .update(agencies)
            .set({
              stripeSubscriptionId: null,
              subscriptionStatus: "canceled",
              active: false,
              updatedAt: new Date(),
            })
            .where(eq(agencies.id, agencyId));
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = (invoice as { subscription?: string }).subscription;

        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const agencyId = subscription.metadata.agencyId;

          if (agencyId) {
            await db
              .update(agencies)
              .set({
                subscriptionStatus: "active",
                active: true,
                updatedAt: new Date(),
              })
              .where(eq(agencies.id, agencyId));
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = (invoice as { subscription?: string }).subscription;

        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const agencyId = subscription.metadata.agencyId;

          if (agencyId) {
            await db
              .update(agencies)
              .set({
                subscriptionStatus: "past_due",
                updatedAt: new Date(),
              })
              .where(eq(agencies.id, agencyId));
          }
        }
        break;
      }

      default:
        console.log(`Unhandled Stripe event: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }
}
