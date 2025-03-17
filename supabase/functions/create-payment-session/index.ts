
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

    // Get plan details from the database using stripe_price_id
    const { data: planData, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('stripe_price_id', priceId)
      .eq('is_active', true)
      .maybeSingle();

    if (planError || !planData) {
      console.error('Error retrieving plan from database:', planError);
      
      // Fallback to directly retrieving from Stripe
      try {
        const price = await stripe.prices.retrieve(priceId);
        console.log('Successfully retrieved price from Stripe:', {
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
      console.log('Successfully retrieved plan from database:', {
        id: planData.id,
        name: planData.name,
        price: planData.price,
        stripe_price_id: planData.stripe_price_id
      });
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
      priceId: priceId,
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
