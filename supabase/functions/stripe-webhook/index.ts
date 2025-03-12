import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import Stripe from "npm:stripe@13.9.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "");
const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('Stripe webhook function initialized', {
  hasStripeKey: !!Deno.env.get("STRIPE_SECRET_KEY"),
  hasEndpointSecret: !!endpointSecret,
  supabaseUrl: supabaseUrl,
});

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

    console.log('Webhook request received', {
      hasSignature: !!signature,
      bodyLength: body.length,
    });

    if (!signature) {
      console.error('Missing stripe signature');
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

    console.log(`Processing webhook event: ${event.type}`, {
      eventId: event.id,
      eventType: event.type,
      objectId: event.data.object.id,
    });

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log(`Checkout session completed: ${session.id}`, {
          sessionData: {
            clientReferenceId: session.client_reference_id,
            metadata: session.metadata,
            paymentStatus: session.payment_status,
            status: session.status,
            amountTotal: session.amount_total,
            currency: session.currency,
            customerId: session.customer,
          }
        });
        
        // Extract the metadata from the session
        const userId = session.client_reference_id || session.metadata?.userId;
        const planType = session.metadata?.planType;
        const purchaseType = session.metadata?.purchaseType;
        
        if (!userId || !planType) {
          console.error('Missing required metadata in session', {
            userId,
            planType,
            purchaseType,
            metadata: session.metadata
          });
          break;
        }

        console.log(`Processing subscription for user ${userId} to ${planType}`, {
          purchaseType,
        });

        // Update the subscription status
        const { data, error } = await supabase
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
          
          // Check if we have a pending subscription for this user and plan
          const { data: existingSub, error: lookupError } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', userId)
            .eq('plan_type', planType);
            
          if (lookupError) {
            console.error('Error checking for existing subscription:', lookupError);
          } else {
            console.log('Existing subscription data:', existingSub);
            
            // If no pending subscription exists, create a new one
            if (!existingSub || existingSub.length === 0) {
              console.log('No existing subscription found, creating new one');
              const { error: insertError } = await supabase
                .from('subscriptions')
                .insert({
                  user_id: userId,
                  plan_type: planType,
                  status: 'active',
                  payment_method: 'stripe',
                  purchase_type: purchaseType || 'subscription',
                  stripe_subscription_id: session.subscription,
                  start_date: new Date().toISOString(),
                  // Set end_date for one-time purchases
                  ...(purchaseType === 'one-time' ? {
                    end_date: new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000).toISOString()
                  } : {})
                });
                
              if (insertError) {
                console.error('Error creating new subscription:', insertError);
              } else {
                console.log('Successfully created new subscription');
              }
            } else {
              // Update any existing subscription regardless of status
              console.log('Existing subscription found, updating to active');
              const { error: updateError } = await supabase
                .from('subscriptions')
                .update({
                  status: 'active',
                  stripe_subscription_id: session.subscription,
                  start_date: new Date().toISOString(),
                  ...(purchaseType === 'one-time' ? {
                    end_date: new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000).toISOString()
                  } : {})
                })
                .eq('id', existingSub[0].id);
                
              if (updateError) {
                console.error('Error updating existing subscription:', updateError);
              } else {
                console.log('Successfully updated existing subscription');
              }
            }
          }
        } else {
          console.log(`Updated subscription for user ${userId} to ${planType}`);
        }

        // Add billing details to payment_history if they exist
        try {
          // Find the latest active subscription for this user
          const { data: latestSub, error: subQueryError } = await supabase
            .from('subscriptions')
            .select('id')
            .eq('user_id', userId)
            .eq('plan_type', planType)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(1);

          if (subQueryError || !latestSub || latestSub.length === 0) {
            console.error('Error finding subscription:', subQueryError || 'No subscription found');
            break;
          }

          const subscriptionId = latestSub[0].id;
          console.log(`Found subscription ID: ${subscriptionId}`);
          
          // Get the payment amount from Stripe
          let amount = 0;
          if (session.amount_total) {
            amount = session.amount_total / 100; // Convert from cents to pounds
          }

          // Check if payment record already exists
          const { data: existingPayment } = await supabase
            .from('payment_history')
            .select('id')
            .eq('subscription_id', subscriptionId)
            .eq('stripe_payment_id', session.payment_intent)
            .maybeSingle();
            
          if (existingPayment) {
            console.log(`Payment record already exists for ID: ${existingPayment.id}`);
          } else {
            // Insert payment record
            const { data: paymentData, error: paymentError } = await supabase
              .from('payment_history')
              .insert({
                subscription_id: subscriptionId,
                amount: amount,
                currency: session.currency?.toUpperCase() || 'GBP',
                payment_method: 'stripe',
                stripe_payment_id: session.payment_intent,
                payment_status: 'payment_made',
                billing_school_name: session.metadata?.billingSchoolName,
                billing_address: session.metadata?.billingAddress,
                billing_contact_name: session.metadata?.billingContactName,
                billing_contact_email: session.metadata?.billingContactEmail
              })
              .select();

            if (paymentError) {
              console.error('Error adding payment history:', paymentError);
            } else {
              console.log(`Added payment history record: ${paymentData?.[0]?.id}`);
            }
          }
        } catch (error) {
          console.error('Error processing payment history:', error);
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
      
      // New handler for manual invoice payments (admin action)
      case 'invoice.payment_succeeded': {
        // This could be used if you're tracking invoice payments in Stripe
        console.log('Invoice payment succeeded event received');
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
    return new Response(JSON.stringify({ error: 'Internal Server Error', details: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});
