
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import Stripe from "npm:stripe@13.9.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "");
const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return new Response(JSON.stringify({ error: "Missing stripe signature" }), { status: 400 });
    }

    // Verify webhook signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return new Response(JSON.stringify({ error: `Webhook Error: ${err.message}` }), { status: 400 });
    }

    console.log(`Processing webhook event: ${event.type}`);

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log(`Checkout session completed: ${session.id}`);
        
        // Extract the metadata from the session
        const userId = session.client_reference_id;
        const planType = session.metadata.planType;
        const purchaseType = session.metadata.purchaseType;
        
        if (!userId || !planType) {
          console.error('Missing required metadata in session');
          break;
        }

        // Update the subscription status
        const { error } = await supabase
          .from('subscriptions')
          .update({
            status: 'active',
            stripe_subscription_id: session.subscription,
            start_date: new Date().toISOString(),
            // Set end_date to 3 years from now for one-time purchases
            // For subscriptions, leave it null as it's managed by Stripe
            ...(purchaseType === 'one-time' ? {
              end_date: new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000).toISOString()
            } : {})
          })
          .eq('user_id', userId)
          .eq('plan_type', planType)
          .eq('status', 'pending');

        if (error) {
          console.error('Error updating subscription:', error);
        } else {
          console.log(`Updated subscription for user ${userId} to ${planType}`);
        }

        // Add billing details to payment_history if they exist
        try {
          const subscriptionQuery = await supabase
            .from('subscriptions')
            .select('id')
            .eq('user_id', userId)
            .eq('plan_type', planType)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(1);

          if (subscriptionQuery.error || !subscriptionQuery.data || subscriptionQuery.data.length === 0) {
            console.error('Error finding subscription:', subscriptionQuery.error);
            break;
          }

          const subscriptionId = subscriptionQuery.data[0].id;
          
          // Get the payment amount from Stripe
          let amount = 0;
          if (session.amount_total) {
            amount = session.amount_total / 100; // Convert from cents to pounds
          }

          await supabase.from('payment_history').insert({
            subscription_id: subscriptionId,
            amount: amount,
            currency: session.currency?.toUpperCase() || 'GBP',
            payment_method: 'stripe',
            stripe_payment_id: session.payment_intent,
            payment_status: 'completed',
            billing_school_name: session.metadata.billingSchoolName,
            billing_address: session.metadata.billingAddress,
            billing_contact_name: session.metadata.billingContactName,
            billing_contact_email: session.metadata.billingContactEmail
          });
          
          console.log(`Added payment history record for subscription ${subscriptionId}`);
        } catch (error) {
          console.error('Error adding payment history:', error);
        }
        
        break;
      }
      
      case 'invoice.paid': {
        const invoice = event.data.object;
        console.log(`Invoice paid: ${invoice.id}`);
        
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
          
          if (subscription && subscription.metadata.userId) {
            const { error } = await supabase
              .from('subscriptions')
              .update({ 
                status: 'active' 
              })
              .eq('stripe_subscription_id', invoice.subscription);
              
            if (error) {
              console.error('Error updating subscription status:', error);
            }
          }
        }
        break;
      }
      
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        console.log(`Subscription updated: ${subscription.id}`);
        
        const { error } = await supabase
          .from('subscriptions')
          .update({ 
            status: subscription.status === 'active' ? 'active' : 'canceled'
          })
          .eq('stripe_subscription_id', subscription.id);
          
        if (error) {
          console.error('Error updating subscription status:', error);
        }
        
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        console.log(`Subscription deleted: ${subscription.id}`);
        
        const { error } = await supabase
          .from('subscriptions')
          .update({ 
            status: 'canceled',
            end_date: new Date().toISOString()
          })
          .eq('stripe_subscription_id', subscription.id);
          
        if (error) {
          console.error('Error updating subscription status:', error);
        }
        
        break;
      }
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});
