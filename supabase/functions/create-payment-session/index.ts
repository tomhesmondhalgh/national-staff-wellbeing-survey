
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import Stripe from "https://esm.sh/stripe@13.9.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "");
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

console.log('Function initialized with config:', {
  hasStripeKey: !!Deno.env.get("STRIPE_SECRET_KEY"),
  supabaseUrl: Deno.env.get("SUPABASE_URL"),
  stripeKeyLength: (Deno.env.get("STRIPE_SECRET_KEY") || "").length, // Log length to check if it's valid
});

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Request received:', {
      method: req.method,
      headers: Object.fromEntries(req.headers.entries()),
    });

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing Authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error('User validation error:', userError);
      return new Response(
        JSON.stringify({ error: 'Invalid token or user not found' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const requestData = await req.json();
    console.log('Request data:', requestData);

    const { priceId, successUrl, cancelUrl, planType = "foundation", purchaseType = "subscription", billingDetails } = requestData;

    if (!priceId || !successUrl || !cancelUrl) {
      console.error('Missing required fields:', { priceId, successUrl, cancelUrl });
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch plan from database using priceId
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('stripe_price_id', priceId)
      .single();

    if (planError || !plan) {
      console.error('Error fetching plan:', planError || 'Plan not found');
      
      // Fallback to checking if priceId is directly a Stripe price ID
      try {
        const price = await stripe.prices.retrieve(priceId);
        console.log('Using direct Stripe price ID:', {
          id: price.id,
          active: price.active,
          currency: price.currency,
          type: price.type,
        });
      } catch (priceError) {
        console.error('Error retrieving price from Stripe:', priceError);
        return new Response(
          JSON.stringify({ error: `Invalid price ID: ${priceId}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      console.log('Found plan in database:', {
        name: plan.name,
        price: plan.price,
        currency: plan.currency,
        stripePriceId: plan.stripe_price_id,
      });
      
      // Use the plan's stripe_price_id if available
      if (plan.stripe_price_id) {
        priceId = plan.stripe_price_id;
      }
      
      // Update planType and purchaseType from the database plan
      planType = plan.name.toLowerCase() as any;
      purchaseType = plan.purchase_type as any;
    }

    const metadata = {
      userId: user.id,
      planType,
      purchaseType,
      billingSchoolName: billingDetails?.schoolName || '',
      billingAddress: billingDetails?.address || '',
      billingContactName: billingDetails?.contactName || '',
      billingContactEmail: billingDetails?.contactEmail || ''
    };

    console.log('Creating Stripe session with:', {
      mode: purchaseType === 'subscription' ? 'subscription' : 'payment',
      priceId,
      metadata,
      successUrl: `${new URL(successUrl).origin}/payment-success`,
      cancelUrl
    });

    const session = await stripe.checkout.sessions.create({
      mode: purchaseType === 'subscription' ? 'subscription' : 'payment',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${new URL(successUrl).origin}/payment-success`,
      cancel_url: cancelUrl,
      metadata,
      client_reference_id: user.id,
      customer_creation: 'always',
      billing_address_collection: 'required',
      payment_method_types: ['card'],
      locale: 'en-GB',
      allow_promotion_codes: true,
    });

    await supabase.from('subscriptions').insert({
      user_id: user.id,
      plan_type: planType,
      status: 'pending',
      payment_method: 'stripe',
      purchase_type: purchaseType,
    });

    console.log('Session created successfully:', {
      sessionId: session.id,
      url: session.url,
      hasUrlParameter: !!session.url
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error creating Stripe checkout session:', error);
    return new Response(
      JSON.stringify({ error: error.message, stack: error.stack }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
