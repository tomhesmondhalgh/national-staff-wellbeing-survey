
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.14.0'
import Stripe from 'https://esm.sh/stripe@11.1.0?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get the request body
    const body = await req.json()
    const { subscriptionId, userId } = body
    
    console.log(`Cancelling subscription: ${subscriptionId} for user: ${userId}`)
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Retrieve the subscription to check if it's from the correct user
    const { data: subscription, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .eq('user_id', userId)
      .single()
    
    if (fetchError || !subscription) {
      console.error('Error fetching subscription:', fetchError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Subscription not found or access denied' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404 
        }
      )
    }
    
    // Check if there's a Stripe subscription ID
    if (!subscription.stripe_subscription_id) {
      console.error('No Stripe subscription ID found')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No Stripe subscription ID found' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }
    
    // Initialize Stripe
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') || ''
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2022-11-15',
    })
    
    // Cancel the subscription at period end
    const stripeSubscription = await stripe.subscriptions.update(
      subscription.stripe_subscription_id,
      { cancel_at_period_end: true }
    )
    
    // Update our database record
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({ 
        status: 'canceled',
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionId)
    
    if (updateError) {
      console.error('Error updating subscription status:', updateError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to update subscription status' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Subscription has been scheduled to cancel at the end of the current billing period',
        data: { 
          canceled_at: stripeSubscription.canceled_at,
          current_period_end: stripeSubscription.current_period_end
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Error processing request:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'An unknown error occurred' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
